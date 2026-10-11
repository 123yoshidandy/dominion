/**
 * ドミニオンのゲームモデル
 */

import Card from './card.js';
import Player from './player.js';
import { ALL_CARDS, BASIC_CARDS, CARD_TYPES, CARD_SETS, getKingdomCardIds } from './card-data.js';
import { createRandom, createSeed } from './random.js';

// ゲームクラス
class Game {
    // cardSets は王国カードを選ぶセット（基本・海辺）。kingdom を渡すとその王国カードで遊ぶ
    // seed が同じなら、同じ操作をすれば必ず同じ結果になる
    constructor(playerNames, { cardSets = Object.values(CARD_SETS), kingdom = null, seed = createSeed() } = {}) {
        this.cardSets = cardSets;
        this.kingdom = kingdom;
        this.seed = seed;
        this.random = createRandom(seed);
        this.commands = []; // 受け付けた操作の記録（Game.replay で再現できる）
        this.players = [];
        this.supply = {};   // サプライパイル
        this.trash = [];    // 廃棄置き場
        this.currentPlayerIndex = 0;
        this.phase = 'setup'; // ゲームフェーズ: setup, action, buy, cleanup
        this.logs = [];      // ゲームログ
        this.callbacks = {}; // コールバック関数
        this.pendingPrompt = null; // プレイヤーの選択待ち（地下室・礼拝堂など）
        this.effectQueue = [];     // カード効果のまだ実行していない手順（選択待ちの後に続きを進める）
        this.isExtraTurn = false;  // 前哨地による追加のターン中か
        this.lastError = null;     // 直前に受け付けなかった操作の理由
        this.promptCount = 0;      // これまでの選択待ちの数（画面で同じ選択を出し直さないための番号）
        
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
        });
        
        // 最初のプレイヤーを設定
        this.currentPlayerIndex = Math.floor(this.random() * this.players.length);
        
        this.log('ゲームが開始されました');
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
        
        // 選んだ王国カードをサプライに追加
        this.selectedKingdomCards.forEach(cardId => {
            // 小文字のIDでサプライに追加し、大文字のIDでカードデータを参照
            const upperCardId = cardId.toUpperCase();
            if (ALL_CARDS[upperCardId]) {
                // 庭園など勝利点の王国カードは、公領・属州と同じ枚数にする
                const isVictory = ALL_CARDS[upperCardId].types.includes(CARD_TYPES.VICTORY);
                this.supply[cardId] = isVictory ? victoryCardCount : ALL_CARDS[upperCardId].count;
            } else {
                console.error(`カードデータが見つかりません: ${upperCardId}`);
            }
        });
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
    
    // ===== 操作 =====
    // プレイヤーの操作はすべてここを通す。操作したプレイヤーを確かめ、受け付けた操作だけを記録する
    //   { type: 'play', cardIndex } アクションカードをプレイ
    //   { type: 'buyPhase' }        購入フェーズへ
    //   { type: 'buy', cardId }     カードを購入
    //   { type: 'endTurn' }         ターン終了
    //   { type: 'answer', answer }  選択に答える（select はインデックスの配列、confirm は真偽値）
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

    // 購入フェーズに移行
    enterBuyPhase() {
        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'action') {
            return false;
        }
        
        const player = this.getCurrentPlayer();
        
        // すべての財宝カードをプレイ
        const treasuresPlayed = player.playAllTreasures(this);
        this.log(`${player.name}は財宝カードを${treasuresPlayed}枚プレイしました`);
        
        this.phase = 'buy';
        this.log('購入フェーズに移行しました');

        this.notifyStateChanged();

        return true;
    }

    // サプライからカードを獲得する（サプライの枚数を減らす）
    gainCardFromSupply(player, cardId, destination = 'discard') {
        const lowerCardId = cardId.toLowerCase();

        if (!this.supply[lowerCardId] || this.supply[lowerCardId] <= 0) {
            return null;
        }

        this.supply[lowerCardId]--;
        const card = player.gainCard(cardId, destination);
        this.onCardGained(player, card);
        return card;
    }
    
    // カードを獲得したときに起きる効果（海辺の猿・封鎖・海賊・船乗りなど）
    onCardGained(player, card) {
        const current = this.getCurrentPlayer();
        if (player === current) {
            player.gainedThisTurn.push(card.id);
            if (this.phase === 'buy' && card.isType(CARD_TYPES.VICTORY)) {
                player.gainedVictoryInBuyPhase = true;
            }
        }
        
        this.players.forEach(owner => {
            if (owner === player) return;
            
            // 封鎖：自分のターンに、封鎖で脇に置かれたカードと同じカードを獲得したら呪いを獲得する
            if (player === current) {
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
        
        // 船乗り：このターンに獲得した持続カードを1回プレイしてもよい
        if (player === current && player.sailorUses > 0 && card.isType(CARD_TYPES.DURATION)) {
            player.sailorUses--;
            this.runNext(() => this.promptConfirm({
                player,
                card,
                title: '船乗り',
                message: `獲得した${card.name}をプレイしますか？`,
                yesLabel: 'プレイする',
                noLabel: 'プレイしない',
                purpose: 'sailor-play',
                callback: (play) => {
                    if (!play) return;
                    const zone = [player.discard, player.hand, player.deck, player.setAside].find(cards => cards.includes(card));
                    if (!zone) return;
                    zone.splice(zone.indexOf(card), 1);
                    player.playArea.push(card);
                    this.log(`${player.name}は${card.name}をプレイしました`);
                    card.play(player, this);
                }
            }));
        }
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

        const card = ALL_CARDS[upperCardId];

        if (!card) {
            this.reject(`カードID ${cardId} は定義されていません`);
            return false;
        }

        if (player.coins < card.cost) {
            this.reject(`${card.name}を購入するためのコインが足りません（必要: ${card.cost}, 所持: ${player.coins}）`);
            return false;
        }

        // カードを購入（獲得で起きる効果のログより先に購入を記録する）
        player.buys--;
        player.coins -= card.cost;
        this.log(`${player.name}は${card.name}を購入しました`);
        this.gainCardFromSupply(player, upperCardId);
        this.processEffects();

        this.notifyStateChanged();

        return true;
    }

    // ターン終了
    endTurn() {
        if (this.phase === 'end' || this.isAwaitingPrompt()) {
            return false;
        }

        const player = this.getCurrentPlayer();

        // 宝物庫：購入フェーズで勝利点カードを獲得していなければ山札の上に戻す（常に得なので自動で戻す）
        if (!player.gainedVictoryInBuyPhase) {
            player.playArea.filter(card => card.id === 'treasury').forEach(card => {
                player.playArea.splice(player.playArea.indexOf(card), 1);
                player.deck.unshift(card);
                this.log(`${player.name}は宝物庫を山札の上に置きました`);
            });
        }

        // クリーンアップフェーズ（前哨地の追加のターンの前は3枚だけ引く）
        const takesExtraTurn = player.outpostPending && !this.isExtraTurn;
        player.outpostPending = false;
        player.cleanup(takesExtraTurn ? 3 : 5);
        player.gainedLastTurn = player.gainedThisTurn;
        this.log(`${player.name}のターンが終了しました`);

        // ゲーム終了条件はターン終了時にチェックする
        if (this.checkGameEnd()) {
            this.endGame();
            this.notifyStateChanged();
            return true;
        }

        // 次のプレイヤーに切り替え（前哨地なら同じプレイヤーがもう1ターン）
        this.isExtraTurn = takesExtraTurn;
        if (takesExtraTurn) {
            this.log(`${player.name}は前哨地の効果で追加のターンを行います`);
        }
        this.startTurn(takesExtraTurn ? player : this.nextPlayer());

        this.notifyStateChanged();

        return true;
    }
    
    // ターンを始める（持続カードの効果をここで処理する）
    startTurn(player) {
        player.actions = 1;
        player.buys = 1;
        player.gainedThisTurn = [];
        player.gainedVictoryInBuyPhase = false;
        player.hasTrashedForCorsair = false;
        this.phase = 'action';
        this.log(`${player.name}のターンです`);
        
        // 前のターンからの効果（猿・私掠船・封鎖）は、このターンの開始で終わる
        player.monkeys = 0;
        player.corsairVictims.clear();
        player.blockades = [];
        
        const durations = player.durations;
        player.durations = [];
        this.runNext(...durations.filter(duration => duration.effect).map(duration => duration.effect));
        this.processEffects();
    }
    
    // ゲーム終了条件をチェック
    checkGameEnd() {
        // 属州の山札が空になったらゲーム終了
        if (this.supply.province <= 0) {
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
    
    // 指定したプレイヤーから席順に並べた、すべてのプレイヤー
    getPlayersFrom(player) {
        return [player, ...this.getOtherPlayers(player)];
    }
    
    // 右隣のプレイヤー（自分の直前に手番が来るプレイヤー）
    getPlayerToRight(player) {
        const index = this.players.indexOf(player);
        return this.players[(index - 1 + this.players.length) % this.players.length];
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
    attackOtherPlayers(attacker, attackEffect) {
        this.runNext(...this.getOtherPlayers(attacker).map(target => () => {
            if (!this.isProtectedFromAttack(target, attacker)) {
                attackEffect(target);
            }
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
    
    // 手札の指定したカードを捨て札にする（大きい番号から抜いて、番号がずれないようにする）
    discardFromHand(player, indices) {
        [...indices].sort((a, b) => b - a).forEach(index => player.discardCard(index));
    }
    
    // 手札の指定したカードを廃棄し、廃棄したカードを返す
    trashFromHand(player, indices) {
        return [...indices]
            .sort((a, b) => b - a)
            .map(index => player.trashCard(index))
            .filter(Boolean)
            .map(card => {
                this.trash.push(card);
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
    
    // はい／いいえで答えさせる。callback には真偽値が渡る
    promptConfirm({ player, card = null, title, message, yesLabel = 'はい', noLabel = 'いいえ', purpose, callback }) {
        this.setPrompt({ type: 'confirm', player, card, title, message, yesLabel, noLabel, purpose, callback });
    }
    
    // サプライからコスト maxCost 以下のカードを1枚選んで獲得させる（filter でカードの種類を絞れる）
    // onGained には獲得したカードが渡る
    promptGain({ player, maxCost, filter = () => true, destination = 'discard', title, message, purpose = 'gain', onGained }) {
        const candidates = Object.keys(this.supply)
            .filter(cardId => this.supply[cardId] > 0)
            .map(cardId => ALL_CARDS[cardId.toUpperCase()])
            .filter(data => data && data.cost <= maxCost && filter(data))
            .sort((a, b) => b.cost - a.cost);
        
        if (candidates.length === 0) {
            this.log(`${player.name}が獲得できるカードはありませんでした`);
            return;
        }
        
        this.promptSelect({
            player,
            cards: candidates.map(data => new Card(data)),
            min: 1,
            max: 1,
            title,
            message,
            confirmLabel: '獲得する',
            purpose,
            callback: ([index]) => {
                const data = candidates[index];
                this.log(`${player.name}は${data.name}を獲得しました`);
                const card = this.gainCardFromSupply(player, data.id, destination);
                if (card && onGained) onGained(card);
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
    
    // 選択待ちに答える。select はインデックスの配列、confirm は真偽値
    // 枚数が条件に合わない答えは受け付けずに false を返す
    resolvePrompt(answer) {
        const prompt = this.pendingPrompt;
        if (!prompt) return false;
        
        if (prompt.type === 'select') {
            const indices = [...new Set(answer)]
                .filter(index => Number.isInteger(index) && index >= 0 && index < prompt.cards.length);
            
            if (indices.length < prompt.min || indices.length > prompt.max) {
                this.reject(prompt.min === prompt.max
                    ? `${prompt.min}枚選んでください`
                    : `${prompt.min}〜${prompt.max}枚選んでください`);
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

// クラスをエクスポート
export default Game;