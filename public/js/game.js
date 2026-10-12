/**
 * ドミニオンのゲームモデル
 */

import Card from './card.js';
import Player from './player.js';
import { ALL_CARDS, BASIC_CARDS, CARD_TYPES, CARD_SETS, KINGDOM_CARDS, REWARD_CARD_IDS, getKingdomCardIds } from './card-data.js';
import { createRandom, createSeed } from './random.js';

// 1ターンの間だけ続く効果の記録（ターンの開始で作り直す）
const createTurnState = () => ({
    actionsPlayed: 0,     // プレイしたアクションの数（共謀者）
    crossroadsPlayed: 0,  // プレイした岐路の数
    foolsGoldPlayed: 0,   // プレイした愚者の黄金の数
    actionGains: 0,       // 獲得したアクションカードの数（大釜）
    costReduction: 0,     // カードのコストの軽減（橋・名声）
    tiara: false,         // 獲得したカードを山札の上に置いてもよい（ティアラ）
    collections: 0,       // アクションカードを獲得するたびに得る勝利点トークン（収集品）
    warChestNamed: [],    // 軍資金で指定されたカード
    schemes: 0,           // クリーンアップで山札の上に置けるアクションの数（策略）
    farrierDraw: 0,       // ターンの終わりに引く枚数（蹄鉄工）
    joustProvinces: [],   // 馬上槍試合で脇に置いた属州（クリーンアップで捨て札にする）
    cleanupStarted: false // ターン終了の処理を始めたか
});

// 財宝をまとめてプレイする順（手札の財宝を使う効果を先に、場の財宝を数える効果を後にする）
const TREASURE_PLAY_FIRST = ['tiara', 'coronet', 'anvil', 'investment'];
const TREASURE_PLAY_LAST = ['horn_of_plenty', 'bank'];

// ゲームクラス
class Game {
    // cardSets は王国カードを選ぶセット。kingdom を渡すとその王国カードで遊ぶ
    // bane（魔女娘の災いカード）・ferryman（渡し守の山）・colonies（白金貨と植民地を使うか）も指定できる（テスト用）
    // seed が同じなら、同じ操作をすれば必ず同じ結果になる
    constructor(playerNames, { cardSets = Object.values(CARD_SETS), kingdom = null, bane = null, ferryman = null, colonies = null, seed = createSeed() } = {}) {
        this.cardSets = cardSets;
        this.kingdom = kingdom;
        this.options = { bane, ferryman, colonies };
        this.seed = seed;
        this.random = createRandom(seed);
        this.commands = []; // 受け付けた操作の記録（Game.replay で再現できる）
        this.players = [];
        this.supply = {};   // サプライパイル
        this.nonSupply = {}; // サプライ外の山（褒賞・渡し守の山）
        this.trash = [];    // 廃棄置き場
        this.bane = null;   // 魔女娘の災いカード
        this.ferrymanPile = null; // 渡し守で獲得するカード
        this.useColonies = false; // 白金貨と植民地を使うか
        this.currentPlayerIndex = 0;
        this.phase = 'setup'; // ゲームフェーズ: setup, action, buy, cleanup
        this.logs = [];      // ゲームログ
        this.callbacks = {}; // コールバック関数
        this.pendingPrompt = null; // プレイヤーの選択待ち（地下室・礼拝堂など）
        this.effectQueue = [];     // カード効果のまだ実行していない手順（選択待ちの後に続きを進める）
        this.isExtraTurn = false;  // 前哨地による追加のターン中か
        this.lastError = null;     // 直前に受け付けなかった操作の理由
        this.promptCount = 0;      // これまでの選択待ちの数（画面で同じ選択を出し直さないための番号）
        this.turnState = createTurnState();

        // プレイヤーの作成（名前の文字列か { name, isCPU } を受け付ける）
        playerNames.forEach((config, index) => {
            const { name, isCPU = false } = typeof config === 'string' ? { name: config } : config;
            const player = new Player(name, index, isCPU);
            player.random = this.random;
            this.players.push(player);
        });
    }

    // ゲーム開始の準備
    setup() {
        // サプライパイルの初期化
        this.initializeSupply();

        // 各プレイヤーの初期デッキを作成して5枚引く
        this.players.forEach(player => {
            player.createInitialDeck();
            player.drawCards(5);
            // パン屋：各プレイヤーは財源を1つ持って始める
            if (this.isInSupply('baker')) player.coffers += 1;
        });

        // 最初のプレイヤーを設定
        this.currentPlayerIndex = Math.floor(this.random() * this.players.length);

        this.log('ゲームが開始されました');
        if (this.useColonies) this.log('白金貨と植民地を使います');
        if (this.bane) this.log(`魔女娘の災いカードは${ALL_CARDS[this.bane.toUpperCase()].name}です`);
        if (this.ferrymanPile) this.log(`渡し守で獲得するカードは${ALL_CARDS[this.ferrymanPile.toUpperCase()].name}です`);
        this.startTurn(this.getCurrentPlayer());
    }

    // サプライパイルの初期化
    initializeSupply() {
        // 基本カードをサプライに追加
        this.supply.copper = BASIC_CARDS.COPPER.count;
        this.supply.silver = BASIC_CARDS.SILVER.count;
        this.supply.gold = BASIC_CARDS.GOLD.count;

        // プレイヤー数に応じて勝利点カードの枚数を調整
        const victoryCardCount = this.players.length <= 2 ? 8 : 12;
        this.supply.estate = victoryCardCount;
        this.supply.duchy = victoryCardCount;
        this.supply.province = victoryCardCount;

        // 呪いカードの枚数を調整
        this.supply.curse = (this.players.length - 1) * 10;

        // 王国カードをランダムに10種類選ぶ
        this.selectedKingdomCards = this.kingdom ? [...this.kingdom] : this.selectRandomKingdomCards(10);

        // 勝利点の王国カードは、公領・属州と同じ枚数にする
        const pileSize = (cardId) => {
            const data = ALL_CARDS[cardId.toUpperCase()];
            return data.types.includes(CARD_TYPES.VICTORY) ? victoryCardCount : (data.count ?? 10);
        };

        // 選んだ王国カードをサプライに追加
        this.selectedKingdomCards.forEach(cardId => {
            if (ALL_CARDS[cardId.toUpperCase()]) {
                this.supply[cardId] = pileSize(cardId);
            } else {
                console.error(`カードデータが見つかりません: ${cardId}`);
            }
        });

        // 魔女娘：コスト2か3の王国カードを1種、災いカードとしてサプライに加える
        if (this.isInSupply('young_witch')) {
            this.bane = this.options.bane ?? this.pickUnusedKingdomCard(data => [2, 3].includes(data.cost));
            if (this.bane) this.supply[this.bane] = pileSize(this.bane);
        }

        // 渡し守：コスト3か4の使っていない王国カードを1種、サプライ外に置く
        if (this.isInSupply('ferryman')) {
            this.ferrymanPile = this.options.ferryman ?? this.pickUnusedKingdomCard(data => [3, 4].includes(data.cost));
            if (this.ferrymanPile) this.nonSupply[this.ferrymanPile] = pileSize(this.ferrymanPile);
        }

        // 馬上槍試合：褒賞をサプライ外に置く
        if (this.isInSupply('joust')) {
            REWARD_CARD_IDS.forEach(cardId => { this.nonSupply[cardId] = 2; });
        }

        // 白金貨と植民地：王国カードを1枚選び、それが繁栄のカードなら使う
        const kingdomIds = this.selectedKingdomCards;
        this.useColonies = this.options.colonies ??
            (kingdomIds.length > 0 &&
             ALL_CARDS[kingdomIds[Math.floor(this.random() * kingdomIds.length)].toUpperCase()]?.set === CARD_SETS.PROSPERITY);
        if (this.useColonies) {
            this.supply.platinum = ALL_CARDS.PLATINUM.count;
            this.supply.colony = victoryCardCount;
        }

        // ペテン師：呪いが財宝としても使える
        this.curseIsTreasure = this.isInSupply('charlatan');
        // 追い剥ぎ：アクションフェーズにカードを獲得するたびにカードを引く
        this.footpadInGame = this.isInSupply('footpad');
    }

    // サプライにある（最初にあった）カードか
    isInSupply(cardId) {
        return this.supply[cardId] !== undefined;
    }

    // 使っていない王国カードから、条件に合うものをランダムに1種選ぶ（なければ null）
    pickUnusedKingdomCard(condition) {
        const isCandidate = (id) => !this.isInSupply(id.toLowerCase()) && condition(KINGDOM_CARDS[id]);
        let candidates = getKingdomCardIds(this.cardSets).filter(isCandidate);
        if (candidates.length === 0) candidates = Object.keys(KINGDOM_CARDS).filter(isCandidate);
        if (candidates.length === 0) return null;
        return candidates[Math.floor(this.random() * candidates.length)].toLowerCase();
    }

    // 王国カードをランダムに選ぶ
    selectRandomKingdomCards(count) {
        const kingdomCardIds = getKingdomCardIds(this.cardSets);
        const selectedCards = [];

        for (let i = 0; i < count; i++) {
            if (kingdomCardIds.length === 0) break;

            const randomIndex = Math.floor(this.random() * kingdomCardIds.length);
            const cardId = kingdomCardIds.splice(randomIndex, 1)[0];
            // 小文字に変換して返す
            selectedCards.push(cardId.toLowerCase());
        }

        return selectedCards;
    }

    // 現在のプレイヤーを取得
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // 次のプレイヤーに切り替える
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return this.getCurrentPlayer();
    }

    // ゲームログを追加
    log(message) {
        const logEntry = { message };
        this.logs.push(logEntry);

        // UIに通知するためのコールバックがあれば呼び出す
        if (this.callbacks.onLog) {
            this.callbacks.onLog(logEntry);
        }
    }

    // 受け付けられない操作の理由を残す（ログには書かないので、操作を再現しても結果が変わらない）
    reject(message) {
        this.lastError = message;
    }

    // ===== コスト・財宝 =====

    // 今のカードのコスト（橋・街道・石切場・行商人などの軽減を含む）。カード・カードデータ・IDを受け付ける
    getCost(card) {
        const data = typeof card === 'string' ? ALL_CARDS[card.toUpperCase()] : card;
        const player = this.getCurrentPlayer();
        const isAction = data.types.includes(CARD_TYPES.ACTION);
        const inPlay = (cardId) => player.playArea.filter(played => played.id === cardId).length;

        let cost = data.cost;
        // 行商人：購入フェーズの間、場のアクションカード1枚につきコスト-2
        if (data.id === 'peddler' && this.phase === 'buy') {
            cost -= 2 * player.playArea.filter(played => played.isType(CARD_TYPES.ACTION)).length;
        }
        cost -= this.turnState.costReduction;
        cost -= inPlay('highway');
        if (isAction) cost -= 2 * inPlay('quarry');
        return Math.max(0, cost);
    }

    // 財宝として扱うカードか（ペテン師のあるゲームでは呪いも財宝）
    isTreasure(card) {
        return card.isType(CARD_TYPES.TREASURE) || (this.curseIsTreasure && card.id === 'curse');
    }

    // 財宝をプレイしたときに得る財宝の数（効果で得る分は除く）
    getTreasureValue(card) {
        if (card.id === 'curse') return this.curseIsTreasure ? 1 : 0;
        return card.value ?? 0;
    }

    // ===== 操作 =====
    // プレイヤーの操作はすべてここを通す。操作したプレイヤーを確かめ、受け付けた操作だけを記録する
    //   { type: 'play', cardIndex } アクションカードをプレイ
    //   { type: 'buyPhase' }        購入フェーズへ
    //   { type: 'coffers', amount } 財源を使う
    //   { type: 'buy', cardId }     カードを購入
    //   { type: 'endTurn' }         ターン終了
    //   { type: 'answer', answer }  選択に答える（select・choose はインデックスの配列、confirm は真偽値）
    applyCommand(playerId, command) {
        this.lastError = null;
        const isCurrent = this.getCurrentPlayer().id === playerId;
        let accepted = false;

        switch (command.type) {
            case 'play':
                accepted = isCurrent && this.playActionCard(command.cardIndex);
                break;
            case 'buyPhase':
                accepted = isCurrent && this.enterBuyPhase();
                break;
            case 'coffers':
                accepted = isCurrent && this.useCoffers(command.amount);
                break;
            case 'buy':
                accepted = isCurrent && this.buyCard(command.cardId);
                break;
            case 'endTurn':
                accepted = isCurrent && this.endTurn();
                break;
            case 'answer':
                // 選択はそれを求められたプレイヤーだけが答えられる（民兵の攻撃は手番ではない人が答える）
                accepted = this.pendingPrompt?.player.id === playerId && this.resolvePrompt(command.answer);
                break;
        }

        if (accepted) {
            this.commands.push({ playerId, ...command });
        } else if (!this.lastError) {
            this.reject('今はその操作はできません');
        }
        return accepted;
    }

    // 操作の記録からゲームを再現する（サーバーでは操作のたびにこれで今の状態に戻す）
    static replay(players, options, commands) {
        const game = new Game(players, options);
        game.setup();
        commands.forEach(({ playerId, ...command }, index) => {
            if (!game.applyCommand(playerId, command)) {
                throw new Error(`操作 ${index} を再現できませんでした: ${game.lastError}`);
            }
        });
        return game;
    }

    // 選択待ちの間は他の操作を受け付けない
    isAwaitingPrompt() {
        if (this.pendingPrompt) {
            this.reject('カードの選択を完了してください');
            return true;
        }
        return false;
    }

    // UIを更新するためのコールバックがあれば呼び出す
    notifyStateChanged() {
        if (this.callbacks.onStateChanged) {
            this.callbacks.onStateChanged();
        }
    }

    // アクションカードをプレイ
    playActionCard(cardIndex) {
        const player = this.getCurrentPlayer();

        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'action') {
            this.reject('アクションフェーズではありません');
            return false;
        }

        if (player.actions <= 0) {
            this.reject('アクションが残っていません');
            return false;
        }

        const card = player.hand[cardIndex];

        if (!card || !card.isType(CARD_TYPES.ACTION)) {
            this.reject('選択されたカードはアクションカードではありません');
            return false;
        }

        // アクションカードをプレイ（効果のログより先にプレイしたことを記録する）
        player.actions--;
        this.log(`${player.name}は${card.name}をプレイしました`);
        player.playCard(cardIndex, this);
        this.processEffects();

        this.notifyStateChanged();

        return true;
    }

    // 購入フェーズに移行し、手札の財宝をすべてプレイする（効果のある財宝の選択待ちになればそこで止まる）
    enterBuyPhase() {
        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'action') {
            return false;
        }

        const player = this.getCurrentPlayer();
        const rank = (card) => {
            if (TREASURE_PLAY_FIRST.includes(card.id)) return TREASURE_PLAY_FIRST.indexOf(card.id) - TREASURE_PLAY_FIRST.length;
            if (TREASURE_PLAY_LAST.includes(card.id)) return 1 + TREASURE_PLAY_LAST.indexOf(card.id);
            return 0;
        };
        const treasures = player.hand.filter(card => this.isTreasure(card)).sort((a, b) => rank(a) - rank(b));

        this.phase = 'buy';
        this.log(`${player.name}は財宝カードを${treasures.length}枚プレイしました`);
        this.log('購入フェーズに移行しました');

        // 先の財宝の効果で手札から無くなった財宝（ティアラで2回プレイしたものなど）はプレイしない
        this.runNext(...treasures.map(card => () => {
            if (player.hand.includes(card)) this.playTreasure(player, card);
        }));
        this.processEffects();

        this.notifyStateChanged();

        return true;
    }

    // 財宝をプレイする（手札・山札など、どこにあっても場に出す）
    playTreasure(player, card) {
        player.removeCard(card);
        player.playArea.push(card);
        this.applyTreasure(player, card);
    }

    // 場の財宝の効果を使う（ティアラ・宝冠で2回目に使うときもこれを呼ぶ）
    applyTreasure(player, card) {
        player.coins += this.getTreasureValue(card);
        card.play(player, this);

        // 私掠船の攻撃を受けていれば、このターン最初の銀貨か金貨を（財宝を得た後で）廃棄する
        if (['silver', 'gold'].includes(card.id) && !player.hasTrashedForCorsair && this.isCorsairTarget(player) &&
            player.playArea.includes(card)) {
            player.hasTrashedForCorsair = true;
            player.playArea.splice(player.playArea.indexOf(card), 1);
            this.trashCard(player, card);
            this.log(`${player.name}は私掠船の効果で${card.name}を廃棄しました`);
        }

        // 商人：このターン最初の銀貨で、プレイした商人1枚につき財宝+1
        if (card.id === 'silver' && !player.hasPlayedSilver) {
            player.hasPlayedSilver = true;
            if (player.merchantBonus > 0) {
                player.coins += player.merchantBonus;
                this.log(`${player.name}は商人の効果で財宝+${player.merchantBonus}を得ました`);
            }
        }
    }

    // 財源を使って財宝を得る（購入フェーズのみ）
    useCoffers(amount) {
        if (this.isAwaitingPrompt()) return false;
        const player = this.getCurrentPlayer();
        if (this.phase !== 'buy') {
            this.reject('財源は購入フェーズに使えます');
            return false;
        }
        if (!Number.isInteger(amount) || amount <= 0 || amount > player.coffers) {
            this.reject('使える財源がありません');
            return false;
        }
        player.coffers -= amount;
        player.coins += amount;
        this.log(`${player.name}は財源を${amount}つ使い、財宝+${amount}を得ました`);
        this.notifyStateChanged();
        return true;
    }

    // カードを手札・山札・捨て札・脇などに置く
    placeCard(player, card, destination = 'discard') {
        if (destination === 'hand') {
            player.hand.push(card);
        } else if (destination === 'deck') {
            player.deck.unshift(card); // 山札の一番上に置く
        } else if (destination === 'setAside') {
            player.setAside.push(card);
        } else {
            player.discard.push(card);
        }
    }

    // サプライからカードを獲得する（サプライの枚数を減らす）
    gainCardFromSupply(player, cardId, destination = 'discard') {
        return this.gainFromPile(this.supply, player, cardId, destination);
    }

    // サプライ外の山（褒賞・渡し守の山）からカードを獲得する
    gainFromNonSupply(player, cardId, destination = 'discard') {
        return this.gainFromPile(this.nonSupply, player, cardId, destination);
    }

    gainFromPile(piles, player, cardId, destination) {
        const lowerCardId = cardId.toLowerCase();
        if (!piles[lowerCardId] || piles[lowerCardId] <= 0) {
            return null;
        }
        piles[lowerCardId]--;
        const card = player.gainCard(lowerCardId, destination);
        this.onCardGained(player, card);
        return card;
    }

    // 廃棄置き場などにあるカードそのものを獲得する（待ち伏せ）
    gainCardInstance(player, card, destination = 'discard') {
        this.placeCard(player, card, destination);
        this.onCardGained(player, card);
        return card;
    }

    // 獲得したカードをサプライに戻す（交易商で銀貨と交換するとき）
    returnToSupply(player, card) {
        if (!player.removeCard(card)) return false;
        if (this.supply[card.id] !== undefined) this.supply[card.id]++;
        return true;
    }

    // カードを獲得したときに起きる効果（猿・封鎖・海賊・船乗り・獲得時の効果・物見やぐら・交易商など）
    onCardGained(player, card) {
        const current = this.getCurrentPlayer();
        const isCurrent = player === current;
        if (isCurrent) {
            player.gainedThisTurn.push(card.id);
            if (this.phase === 'buy' && card.isType(CARD_TYPES.VICTORY)) {
                player.gainedVictoryInBuyPhase = true;
            }
        }

        this.players.forEach(owner => {
            if (owner === player) return;

            // 封鎖：自分のターンに、封鎖で脇に置かれたカードと同じカードを獲得したら呪いを獲得する
            if (isCurrent) {
                owner.blockades
                    .filter(blockade => blockade.cardId === card.id && blockade.victims.has(player))
                    .forEach(() => {
                        if (this.gainCardFromSupply(player, 'curse')) {
                            this.log(`${player.name}は${owner.name}の封鎖で呪いカードを獲得しました`);
                        }
                    });
            }

            // 猿：右隣のプレイヤーが獲得するたびにカードを引く
            if (owner.monkeys > 0 && this.getPlayerToRight(owner) === player) {
                owner.drawCards(owner.monkeys);
                this.log(`${owner.name}は猿の効果でカードを${owner.monkeys}枚引きました`);
            }
        });

        // 海賊：誰かが財宝を獲得したら、手札の海賊をプレイする（常に得なので自動でプレイする）
        if (card.isType(CARD_TYPES.TREASURE)) {
            this.getPlayersFrom(current).forEach(owner => {
                owner.hand.filter(handCard => handCard.reactsToTreasureGain).forEach(pirate => {
                    owner.hand.splice(owner.hand.indexOf(pirate), 1);
                    owner.playArea.push(pirate);
                    this.log(`${owner.name}は${pirate.name}をプレイしました`);
                    pirate.play(owner, this);
                });
            });
        }

        // 追い剥ぎ：アクションフェーズにカードを獲得したら、カードを1枚引く
        if (this.footpadInGame && this.phase === 'action') {
            player.drawCards(1);
            this.log(`${player.name}は追い剥ぎの効果でカードを1枚引きました`);
        }

        // ここから先は選択があるかもしれないので、手順として順に積む
        const steps = [];

        if (card.onGain) {
            steps.push(() => card.onGain(player, this, card));
        }

        if (isCurrent && card.isType(CARD_TYPES.ACTION)) {
            this.turnState.actionGains++;
            // 収集品：アクションカードを獲得するたびに勝利点トークン+1
            if (this.turnState.collections > 0) {
                player.vpTokens += this.turnState.collections;
                this.log(`${player.name}は収集品の効果で勝利点トークンを${this.turnState.collections}つ得ました`);
            }
            // 大釜：このターン3回目にアクションカードを獲得したら、他のプレイヤーは呪いを獲得する
            if (this.turnState.actionGains === 3) {
                player.playArea.filter(played => played.id === 'cauldron').forEach(() => {
                    steps.push(() => {
                        this.log(`${player.name}の大釜の効果が発動しました`);
                        this.attackOtherPlayers(player, (target) => this.gainCurse(target));
                    });
                });
            }
        }

        // ティアラ：このターンに獲得したカードを山札の上に置いてもよい
        if (isCurrent && this.turnState.tiara) {
            steps.push(() => {
                if (!player.discard.includes(card) && !player.hand.includes(card)) return;
                this.promptConfirm({
                    player,
                    card,
                    title: 'ティアラ',
                    message: `獲得した${card.name}を山札の上に置きますか？`,
                    yesLabel: '山札の上に置く',
                    noLabel: 'そのままにする',
                    purpose: 'tiara-topdeck',
                    callback: (yes) => {
                        if (!yes || !player.removeCard(card)) return;
                        player.deck.unshift(card);
                        this.log(`${player.name}は${card.name}を山札の上に置きました`);
                    }
                });
            });
        }

        // 獲得した本人の手札のリアクション（物見やぐら・交易商）。同じカードが何枚あっても1回だけ聞く
        uniqueById(player.hand.filter(handCard => handCard.onOwnGain)).forEach(reaction => {
            steps.push(() => {
                if (player.hand.includes(reaction)) reaction.onOwnGain(player, this, reaction, card);
            });
        });

        // 他のプレイヤーの手札のリアクション（愚者の黄金）
        this.getOtherPlayers(player).forEach(owner => {
            owner.hand.filter(handCard => handCard.onOtherGain).forEach(reaction => {
                steps.push(() => {
                    if (owner.hand.includes(reaction)) reaction.onOtherGain(owner, this, reaction, player, card);
                });
            });
        });

        // 船乗り：このターンに獲得した持続カードを1回プレイしてもよい
        if (isCurrent && player.sailorUses > 0 && card.isType(CARD_TYPES.DURATION)) {
            player.sailorUses--;
            steps.push(() => this.promptConfirm({
                player,
                card,
                title: '船乗り',
                message: `獲得した${card.name}をプレイしますか？`,
                yesLabel: 'プレイする',
                noLabel: 'プレイしない',
                purpose: 'sailor-play',
                callback: (play) => {
                    if (play && player.removeCard(card)) this.playCardFrom(player, card, { remove: false });
                }
            }));
        }

        this.runNext(...steps);
    }

    // 呪いを1枚獲得させる（なければログだけ）
    gainCurse(target, destination = 'discard') {
        if (this.gainCardFromSupply(target, 'curse', destination)) {
            this.log(`${target.name}は呪いカードを獲得しました`);
            return true;
        }
        this.log(`呪いカードの山札がないため、${target.name}は呪いカードを獲得しませんでした`);
        return false;
    }

    // カードを購入
    buyCard(cardId) {
        const player = this.getCurrentPlayer();

        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'buy') {
            this.reject('購入フェーズではありません');
            return false;
        }

        if (player.buys <= 0) {
            this.reject('購入回数が残っていません');
            return false;
        }

        // ALL_CARDSには大文字のID、サプライには小文字のIDで参照する
        const upperCardId = cardId.toUpperCase();
        const lowerCardId = cardId.toLowerCase();

        if (!this.supply[lowerCardId] || this.supply[lowerCardId] <= 0) {
            this.reject('選択されたカードはサプライにありません');
            return false;
        }

        const data = ALL_CARDS[upperCardId];

        if (!data) {
            this.reject(`カードID ${cardId} は定義されていません`);
            return false;
        }

        const cost = this.getCost(data);
        if (player.coins < cost) {
            this.reject(`${data.name}を購入するためのコインが足りません（必要: ${cost}, 所持: ${player.coins}）`);
            return false;
        }

        if (data.canBuy && !data.canBuy(player, this)) {
            this.reject(`今は${data.name}を購入できません`);
            return false;
        }

        // カードを購入（獲得で起きる効果のログより先に購入を記録する）
        // 購入時の効果（超過支払い・隠し財産など）を先に処理してから獲得する
        // 超過支払いの額は購入するときに決め、効果は獲得した後で起こす（獲得したカードを使う効果があるため）
        player.buys--;
        player.coins -= cost;
        this.log(`${player.name}は${data.name}を購入しました`);
        let overpaid = 0;
        let gained = null;
        this.runNext(
            () => {
                if (data.overpay && player.coins > 0) this.promptOverpay(player, data, (amount) => { overpaid = amount; });
            },
            () => this.onCardBought(player, data),
            () => { gained = this.gainCardFromSupply(player, upperCardId); },
            () => { if (overpaid > 0) data.overpay(player, this, overpaid, gained); }
        );
        this.processEffects();

        this.notifyStateChanged();

        return true;
    }

    // 超過支払い：残っている財宝から追加で払う額を選ばせる
    promptOverpay(player, data, onPaid) {
        const amounts = Array.from({ length: player.coins + 1 }, (_, amount) => amount);
        this.promptChoose({
            player,
            options: amounts.map(amount => (amount === 0 ? '払わない' : `${amount}を払う`)),
            title: `${data.name}：超過支払い`,
            message: `${data.name}に追加で支払う額を選んでください。${data.overpayText ?? ''}`,
            purpose: 'overpay',
            callback: ([index]) => {
                const amount = amounts[index];
                if (amount === 0) return;
                player.coins -= amount;
                this.log(`${player.name}は${data.name}に${amount}を超過支払いしました`);
                onPaid(amount);
            }
        });
    }

    // カードを購入したときの効果（そのカード自身と、場にあるカード）
    onCardBought(player, data) {
        const steps = [];
        if (data.onBuy) steps.push(() => data.onBuy(player, this, data));
        player.playArea.filter(card => card.onBuyWhileInPlay).forEach(card => {
            steps.push(() => card.onBuyWhileInPlay(player, this, card, data));
        });
        this.runNext(...steps);
    }

    // ターン終了（クリーンアップの開始時に策略などの選択があれば、それに答えてから終える）
    endTurn() {
        if (this.phase === 'end' || this.isAwaitingPrompt() || this.turnState.cleanupStarted) {
            return false;
        }

        const player = this.getCurrentPlayer();
        this.turnState.cleanupStarted = true;
        this.phase = 'cleanup';
        this.runNext(
            () => this.promptScheme(player),
            () => this.finishTurn(player)
        );
        this.processEffects();
        this.notifyStateChanged();
        return true;
    }

    // 策略：場のアクションカードを選び、クリーンアップで山札の上に置く
    promptScheme(player) {
        const count = this.turnState.schemes;
        const candidates = player.playArea.filter(card => card.isType(CARD_TYPES.ACTION) && !player.hasPendingDuration(card));
        if (count === 0 || candidates.length === 0) return;
        this.promptSelect({
            player,
            cards: candidates,
            max: count,
            title: '策略',
            message: `山札の上に置くアクションカードを最大${count}枚選んでください。`,
            confirmLabel: '山札の上に置く',
            purpose: 'scheme',
            callback: (indices) => {
                this.turnState.schemeCards = indices.map(index => candidates[index]);
            }
        });
    }

    // クリーンアップを行い、次のターンへ進める
    finishTurn(player) {
        // 宝物庫：購入フェーズで勝利点カードを獲得していなければ山札の上に戻す（常に得なので自動で戻す）
        if (!player.gainedVictoryInBuyPhase) {
            player.playArea.filter(card => card.id === 'treasury').forEach(card => {
                player.playArea.splice(player.playArea.indexOf(card), 1);
                player.deck.unshift(card);
                this.log(`${player.name}は宝物庫を山札の上に置きました`);
            });
        }

        // 策略で選んだカードを山札の上に置く
        (this.turnState.schemeCards ?? []).forEach(card => {
            const index = player.playArea.indexOf(card);
            if (index < 0) return;
            player.playArea.splice(index, 1);
            player.deck.unshift(card);
            this.log(`${player.name}は策略で${card.name}を山札の上に置きました`);
        });

        // 馬上槍試合で脇に置いた属州を捨て札にする
        this.turnState.joustProvinces.forEach(card => {
            const index = player.setAside.indexOf(card);
            if (index >= 0) player.discard.push(...player.setAside.splice(index, 1));
        });

        // クリーンアップフェーズ（前哨地の追加のターンの前は3枚だけ引く）
        const takesExtraTurn = player.outpostPending && !this.isExtraTurn;
        player.outpostPending = false;
        player.cleanup(takesExtraTurn ? 3 : 5);
        player.gainedLastTurn = player.gainedThisTurn;

        // 蹄鉄工：超過支払いした分だけ、ターンの終わりにカードを引く
        if (this.turnState.farrierDraw > 0) {
            player.drawCards(this.turnState.farrierDraw);
            this.log(`${player.name}は蹄鉄工の効果でカードを${this.turnState.farrierDraw}枚引きました`);
        }
        this.log(`${player.name}のターンが終了しました`);

        // ゲーム終了条件はターン終了時にチェックする
        if (this.checkGameEnd()) {
            this.endGame();
            return;
        }

        // 次のプレイヤーに切り替え（前哨地なら同じプレイヤーがもう1ターン）
        this.isExtraTurn = takesExtraTurn;
        if (takesExtraTurn) {
            this.log(`${player.name}は前哨地の効果で追加のターンを行います`);
        }
        this.startTurn(takesExtraTurn ? player : this.nextPlayer());
    }

    // ターンを始める（持続カード・農場労働者・書記の効果をここで処理する）
    startTurn(player) {
        player.actions = 1;
        player.buys = 1;
        player.gainedThisTurn = [];
        player.gainedVictoryInBuyPhase = false;
        player.hasTrashedForCorsair = false;
        this.turnState = createTurnState();
        this.phase = 'action';
        this.log(`${player.name}のターンです`);

        // 前のターンからの効果（猿・私掠船・封鎖）は、このターンの開始で終わる
        player.monkeys = 0;
        player.corsairVictims.clear();
        player.blockades = [];

        const durations = player.durations;
        player.durations = [];
        const plays = player.startOfTurnPlays;
        player.startOfTurnPlays = [];

        this.runNext(
            ...durations.filter(duration => duration.effect).map(duration => duration.effect),
            // 農場労働者で脇に置いたカードをプレイする
            ...plays.map(card => () => {
                if (!player.setAside.includes(card)) return;
                if (card.isType(CARD_TYPES.ACTION)) {
                    this.playCardFrom(player, card);
                } else {
                    this.log(`${player.name}は${card.name}をプレイしました`);
                    this.playTreasure(player, card);
                }
            }),
            // 書記：ターンの開始時に手札からプレイしてもよい
            ...player.hand.filter(card => card.onStartOfTurn).map(card => () => {
                if (player.hand.includes(card)) card.onStartOfTurn(player, this, card);
            })
        );
        this.processEffects();
    }

    // ゲーム終了条件をチェック
    checkGameEnd() {
        // 属州（植民地を使うなら植民地も）の山札が空になったらゲーム終了
        if (this.supply.province <= 0 || this.supply.colony <= 0) {
            return true;
        }

        // 3つ以上の山札が空になったらゲーム終了
        return this.countEmptySupplyPiles() >= 3;
    }

    // 空になったサプライの山の数
    countEmptySupplyPiles() {
        return Object.values(this.supply).filter(count => count <= 0).length;
    }

    // ゲーム終了処理
    endGame() {
        this.phase = 'end';

        // 各プレイヤーの勝利点を計算
        const scores = this.players.map(player => {
            const points = player.calculateVictoryPoints();
            return { player, points };
        });

        // 勝利点が高い順にソート
        scores.sort((a, b) => b.points - a.points);

        this.log('ゲームが終了しました');

        // 結果をログに記録
        scores.forEach((score, index) => {
            this.log(`${index + 1}位: ${score.player.name} - ${score.points}点`);
        });

        // 勝者と結果を記録
        this.winner = scores[0].player;
        this.result = scores.map(({ player, points }) => ({ playerId: player.id, name: player.name, points }));

        // UIに通知するためのコールバックがあれば呼び出す
        if (this.callbacks.onGameEnd) {
            this.callbacks.onGameEnd(scores);
        }
    }

    // ===== カード効果の手順 =====
    // 効果は「手順」の列として処理し、プレイヤーの選択待ちの間は止めて、答えが出たら続きを進める

    // 手順を列の先頭に積む（渡した順に、残っている手順より先に実行される）
    runNext(...steps) {
        this.effectQueue.unshift(...steps);
    }

    // 選択待ちになるか、手順がなくなるまで効果を進める
    processEffects() {
        while (!this.pendingPrompt && this.effectQueue.length > 0) {
            const step = this.effectQueue.shift();
            step();
        }
    }

    // カードをどこからでも場に出してプレイする（アクションは使わない）。remove が false なら取り除く処理を省く
    playCardFrom(player, card, { remove = true } = {}) {
        if (remove) player.removeCard(card);
        player.playArea.push(card);
        this.log(`${player.name}は${card.name}をプレイしました`);
        card.play(player, this);
    }

    // 手札のカードを複数回プレイする（玉座の間・宮廷・宝冠・ティアラ）。source は場に残すかを合わせるカード
    // asTreasure なら財宝としてプレイする（財宝を得る）。指定しなければ、購入フェーズの財宝は財宝としてプレイする
    playMultipleTimes(player, card, times, source, { asTreasure = this.phase === 'buy' && this.isTreasure(card) } = {}) {
        player.removeCard(card);
        player.playArea.push(card);
        this.log(`${player.name}は${card.name}を${times}回プレイします`);
        const playOnce = () => (asTreasure ? this.applyTreasure(player, card) : card.play(player, this));
        this.runNext(
            ...Array.from({ length: times }, () => playOnce),
            // 持続カードが場に残るなら、元のカードも一緒に残す
            () => {
                if (source && player.hasPendingDuration(card)) player.addDuration(source, null);
            }
        );
    }

    // 指定したプレイヤーから席順に並べた、すべてのプレイヤー
    getPlayersFrom(player) {
        return [player, ...this.getOtherPlayers(player)];
    }

    // 右隣のプレイヤー（自分の直前に手番が来るプレイヤー）
    getPlayerToRight(player) {
        const index = this.players.indexOf(player);
        return this.players[(index - 1 + this.players.length) % this.players.length];
    }

    // 左隣のプレイヤー（自分の次に手番が来るプレイヤー）
    getPlayerToLeft(player) {
        const index = this.players.indexOf(player);
        return this.players[(index + 1) % this.players.length];
    }

    // 私掠船の攻撃を受けているか
    isCorsairTarget(player) {
        return this.players.some(owner => owner !== player && owner.corsairVictims.has(player));
    }

    // 指定したプレイヤーの次の席から順に並べた、他のプレイヤー
    getOtherPlayers(player) {
        const start = this.players.indexOf(player);
        return this.players
            .map((_, i) => this.players[(start + 1 + i) % this.players.length])
            .slice(0, -1);
    }

    // 他のプレイヤーに攻撃効果を適用する（1人ずつ順番に。選択待ちになればそこで止まる）
    // 攻撃を受ける前に、外交官・番犬などのリアクションを使えるか聞く
    attackOtherPlayers(attacker, attackEffect) {
        this.runNext(...this.getOtherPlayers(attacker).map(target => () => {
            const reactions = uniqueById(target.hand.filter(card => card.onAttackReaction)).map(card => () => {
                if (target.hand.includes(card)) card.onAttackReaction(target, this, card, attacker);
            });
            this.runNext(...reactions, () => {
                if (!this.isProtectedFromAttack(target, attacker)) {
                    attackEffect(target);
                }
            });
        }));
    }

    // 灯台が場にあるか、お堀などのリアクションで攻撃を防げるか（リアクションカードを持っていれば常に公開する）
    isProtectedFromAttack(target, attacker) {
        if (target.playArea.some(card => card.id === 'lighthouse')) {
            this.log(`${target.name}は灯台で${attacker.name}の攻撃を防ぎました`);
            return true;
        }
        const reaction = target.hand.find(card => card.isReaction);
        return reaction ? reaction.react(target, this, attacker) : false;
    }

    // カードを廃棄する（遊牧民・小道など、廃棄したときの効果も起こす）
    trashCard(player, card) {
        this.trash.push(card);
        if (card.onTrash) {
            this.runNext(() => card.onTrash(player, this, card));
        }
    }

    // カードを捨て札にする（クリーンアップ以外。坑道・織工・小道など、捨てたときの効果も起こす）
    discardCards(player, cards) {
        player.discard.push(...cards);
        this.runNext(...cards.filter(card => card.onDiscard).map(card => () => {
            if (player.discard.includes(card)) card.onDiscard(player, this, card);
        }));
    }

    // 手札の指定したカードを捨て札にする
    discardFromHand(player, indices) {
        const cards = [...new Set(indices)]
            .sort((a, b) => a - b)
            .map(index => player.hand[index])
            .filter(Boolean);
        cards.forEach(card => player.hand.splice(player.hand.indexOf(card), 1));
        this.discardCards(player, cards);
        return cards;
    }

    // 手札の指定したカードを廃棄し、廃棄したカードを返す
    trashFromHand(player, indices) {
        return [...indices]
            .sort((a, b) => b - a)
            .map(index => player.trashCard(index))
            .filter(Boolean)
            .map(card => {
                this.trashCard(player, card);
                return card;
            });
    }

    // ===== プレイヤーの選択 =====

    // cards の中から min〜max 枚を選ばせる。callback には選んだ cards のインデックスの配列が渡る
    promptSelect({ player, cards, min = 0, max = cards.length, title, message, confirmLabel = '決定', purpose, callback }) {
        this.setPrompt({
            type: 'select',
            player,
            cards,
            min: Math.min(min, cards.length),
            max: Math.min(max, cards.length),
            title,
            message,
            confirmLabel,
            purpose,
            callback
        });
    }

    // 文字の選択肢から min〜max 個を選ばせる。callback には選んだ options のインデックスの配列が渡る
    promptChoose({ player, options, min = 1, max = 1, card = null, title, message, confirmLabel = '決定', purpose, callback }) {
        this.setPrompt({
            type: 'choose',
            player,
            options,
            card,
            min: Math.min(min, options.length),
            max: Math.min(max, options.length),
            title,
            message,
            confirmLabel,
            purpose,
            callback
        });
    }

    // はい／いいえで答えさせる。callback には真偽値が渡る
    promptConfirm({ player, card = null, title, message, yesLabel = 'はい', noLabel = 'いいえ', purpose, callback }) {
        this.setPrompt({ type: 'confirm', player, card, title, message, yesLabel, noLabel, purpose, callback });
    }

    // 獲得できるサプライのカードデータ（今のコストで条件に合うもの。コストの高い順）
    getGainableCards({ maxCost = Infinity, minCost = 0, exactCost = null, filter = () => true } = {}) {
        return Object.keys(this.supply)
            .filter(cardId => this.supply[cardId] > 0)
            .map(cardId => ALL_CARDS[cardId.toUpperCase()])
            .filter(data => {
                if (!data) return false;
                const cost = this.getCost(data);
                if (exactCost !== null ? cost !== exactCost : (cost > maxCost || cost < minCost)) return false;
                return filter(data);
            })
            .sort((a, b) => this.getCost(b) - this.getCost(a));
    }

    // サプライから条件に合うカードを1枚選んで獲得させる（filter でカードの種類を絞れる。optional なら選ばなくてもよい）
    // onGained には獲得したカードが渡る
    promptGain({ player, maxCost = Infinity, minCost = 0, exactCost = null, filter = () => true, destination = 'discard', optional = false, title, message, purpose = 'gain', onGained }) {
        const candidates = this.getGainableCards({ maxCost, minCost, exactCost, filter });

        if (candidates.length === 0) {
            this.log(`${player.name}が獲得できるカードはありませんでした`);
            return;
        }

        this.promptSelect({
            player,
            cards: candidates.map(data => new Card(data)),
            min: optional ? 0 : 1,
            max: 1,
            title,
            message,
            confirmLabel: '獲得する',
            purpose,
            callback: ([index]) => {
                if (index === undefined) return;
                const data = candidates[index];
                this.log(`${player.name}は${data.name}を獲得しました`);
                const card = this.gainCardFromSupply(player, data.id, destination);
                if (card && onGained) onGained(card);
            }
        });
    }

    // カードを1種指定させる（願いの井戸・職人見習い・軍資金）。サプライのカードから選ぶ。callback にはカードデータが渡る
    promptNameCard({ player, title, message, purpose, exclude = [], callback }) {
        const candidates = Object.keys(this.supply)
            .filter(cardId => !exclude.includes(cardId))
            .map(cardId => ALL_CARDS[cardId.toUpperCase()])
            .filter(Boolean)
            .sort((a, b) => a.cost - b.cost);
        if (candidates.length === 0) return;
        this.promptSelect({
            player,
            cards: candidates.map(data => new Card(data)),
            min: 1,
            max: 1,
            title,
            message,
            confirmLabel: '指定する',
            purpose,
            callback: ([index]) => {
                this.log(`${player.name}は${candidates[index].name}を指定しました`);
                callback(candidates[index]);
            }
        });
    }

    // 選択待ちにしてUIに知らせる。答えは resolvePrompt で受け取る
    setPrompt(prompt) {
        this.promptCount++;
        this.pendingPrompt = { ...prompt, id: this.promptCount };
        prompt = this.pendingPrompt;

        if (this.callbacks.onPrompt) {
            this.callbacks.onPrompt(prompt);
        }
    }

    // 選択待ちに答える。select・choose はインデックスの配列、confirm は真偽値
    // 枚数が条件に合わない答えは受け付けずに false を返す
    resolvePrompt(answer) {
        const prompt = this.pendingPrompt;
        if (!prompt) return false;

        if (prompt.type === 'select' || prompt.type === 'choose') {
            const length = prompt.type === 'select' ? prompt.cards.length : prompt.options.length;
            const indices = [...new Set(Array.isArray(answer) ? answer : [])]
                .filter(index => Number.isInteger(index) && index >= 0 && index < length);

            if (indices.length < prompt.min || indices.length > prompt.max) {
                const unit = prompt.type === 'select' ? '枚' : 'つ';
                this.reject(prompt.min === prompt.max
                    ? `${prompt.min}${unit}選んでください`
                    : `${prompt.min}〜${prompt.max}${unit}選んでください`);
                return false;
            }

            this.pendingPrompt = null;
            prompt.callback(indices);
        } else {
            this.pendingPrompt = null;
            prompt.callback(Boolean(answer));
        }

        this.processEffects();
        this.notifyStateChanged();

        return true;
    }

    // コールバック関数を設定
    setCallback(name, callback) {
        this.callbacks[name] = callback;
    }
}

// 同じIDのカードは最初の1枚だけにする
function uniqueById(cards) {
    const seen = new Set();
    return cards.filter(card => {
        if (seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
    });
}

// クラスをエクスポート
export default Game;
