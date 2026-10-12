/**
 * ドミニオンのゲームモデル
 */

import Card from './card.js';
import Player from './player.js';
import { ALL_CARDS, BASIC_CARDS, CARD_TYPES, CARD_SETS, KINGDOM_CARDS, REWARD_CARD_IDS, RUINS_CARD_IDS, getKingdomCardIds } from './card-data.js';
import { createRandom, createSeed } from './random.js';
import { putBackInAnyOrder } from './card-helpers.js';
import { installLandscapes } from './game-landscapes.js';
import { installNocturne } from './game-nocturne.js';

// 1ターンの間だけ続く効果の記録（ターンの開始で作り直す）
const createTurnState = () => ({
    actionsPlayed: 0,     // プレイしたアクションの数（共謀者）
    crossroadsPlayed: 0,  // プレイした岐路の数
    foolsGoldPlayed: 0,   // プレイした愚者の黄金の数
    actionGains: 0,       // 獲得したアクションカードの数（大釜）
    buyPhaseGains: 0,     // 購入フェーズに獲得したカードの数（隠遁者）
    costReduction: 0,     // カードのコストの軽減（橋・名声）
    tiara: false,         // 獲得したカードを山札の上に置いてもよい（ティアラ）
    collections: 0,       // アクションカードを獲得するたびに得る勝利点トークン（収集品）
    warChestNamed: [],    // 軍資金で指定されたカード
    schemes: 0,           // クリーンアップで山札の上に置けるアクションの数（策略）
    farrierDraw: 0,       // ターンの終わりに引く枚数（蹄鉄工）
    joustProvinces: [],   // 馬上槍試合で脇に置いた属州（クリーンアップで捨て札にする）
    cardsBought: 0,       // 購入したカードの数（使者：このターン最初の購入か）
    travellingFair: false, // 獲得したカードを山札の上に置いてもよい（旅の祭り）
    expeditionDraw: 0,    // 次の手札に追加で引く枚数（遠征）
    savedCards: [],       // 引いた後で手札に戻す、脇に置いたカード（保存）
    eventsBought: [],     // 購入したイベントのID（1ターンに1回のイベント）
    charms: 0,            // 次にカードを獲得したとき、同じコストの別のカードも獲得してよい回数（魔除け）
    encampments: [],      // クリーンアップの開始時にサプライに戻す、脇に置いた野営地
    fortuneDoubled: false, // このターンに富で財宝を2倍にしたか
    buyPhaseEnded: false, // 購入フェーズの終わりの効果を起こしたか（夜フェイズに移るときとターン終了のどちらか）
    deluded: false,       // このターンはアクションを購入できない（妄想）
    envious: false,       // このターンは銀貨と金貨が財宝1（羨望）
    riverDraw: 0,         // ターンの終わりに引く枚数（川の恵み）
    hounds: [],           // ターンの終わりに手札に戻す、脇に置いたカード { player, card }（忠犬）
    necromancerUsed: [],  // このターンに死霊術師でプレイした廃棄置き場のカード（裏向きにする）
    priests: 0,           // 廃棄するたびに財宝+2を得る回数（司祭）
    cargoShips: [],       // 次に獲得したカードを脇に置いてよい貨物船
    citadelUsed: false,   // このターンに城塞でアクションをもう一度プレイしたか
    innovationUsed: false, // このターンに革新を使ったか（最初に獲得したアクションだけ）
    hornUsed: false,      // このターンに角笛を使ったか
    cleanupStarted: false // ターン終了の処理を始めたか
});

// アーティファクト（ルネサンス）の名前
export const ARTIFACT_NAMES = { flag: '旗', horn: '角笛', key: '鍵', lantern: 'ランタン', treasure_chest: '宝箱' };

// 財宝をまとめてプレイする順（手札の財宝を使う効果を先に、場の財宝を数える効果を後にする）
const TREASURE_PLAY_FIRST = ['tiara', 'coronet', 'crown', 'anvil', 'investment'];
const TREASURE_PLAY_LAST = ['horn_of_plenty', 'bank'];

// ゲームクラス
class Game {
    // cardSets は王国カードを選ぶセット。kingdom を渡すとその王国カードで遊ぶ
    // bane（魔女娘の災いカード）・ferryman（渡し守の山）・colonies（白金貨と植民地を使うか）も指定できる（テスト用）
    // seed が同じなら、同じ操作をすれば必ず同じ結果になる
    constructor(playerNames, { cardSets = Object.values(CARD_SETS), kingdom = null, landscapes = null, bane = null, ferryman = null, colonies = null, shelters = null, seed = createSeed() } = {}) {
        this.cardSets = cardSets;
        this.kingdom = kingdom;
        this.options = { landscapes, bane, ferryman, colonies, shelters };
        this.seed = seed;
        this.random = createRandom(seed);
        this.commands = []; // 受け付けた操作の記録（Game.replay で再現できる）
        this.players = [];
        this.supply = {};   // サプライパイル
        this.nonSupply = {}; // サプライ外の山（褒賞・渡し守の山・略奪品など）
        this.pileCards = {}; // 中身が1種類でない山（騎士・廃墟）の、上から順のカードID。一番上だけを獲得できる
        this.pileOf = {};    // 中身が1種類でない山に入っているカードのID → 山のID
        this.useShelters = false; // 屋敷の代わりに避難所で始めるか
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
        this.possessions = [];     // これから行う支配のターン { possessor, target }
        this.possessor = null;     // 支配のターン中なら、手番のプレイヤーを操作するプレイヤー
        this.possessionTrash = []; // 支配のターン中に廃棄された、手番のプレイヤーのカード（ターンの終わりに戻す）
        this.regularTurnPlayer = null; // 追加のターンでない、ふつうの手番のプレイヤー（次の手番はこの左隣）
        this.missions = [];        // これから行う伝道のターンのプレイヤー（カードを購入できない追加のターン）
        this.missionTurn = false;  // 伝道のターン中か
        this.currentTurnPlayer = null;  // 今のターンのプレイヤー
        this.previousTurnPlayer = null; // 直前のターンのプレイヤー（伝道）
        this.landscapes = [];      // 使うイベントなど（カードではない横長の札）のID
        this.pileVp = {};          // 山に置いた勝利点トークン（帝国：集合のカード・水道橋など）
        this.landscapeVp = {};     // ランドマークなどの札に置いた勝利点トークン
        this.pileDebt = {};        // 山に置いた負債（徴税）
        this.landscapeState = {};  // ランドマークなどが使う状態（オベリスクの山・山道の入札など）
        this.artifacts = {};       // アーティファクト（ルネサンス）の持ち主。使うものだけキーがあり、誰も持っていなければ null
        this.fleetQueue = null;    // 艦隊：ゲームの終わりの後の追加のターンを行うプレイヤーの列
        this.lastError = null;     // 直前に受け付けなかった操作の理由
        this.promptCount = 0;      // これまでの選択待ちの数（画面で同じ選択を出し直さないための番号）
        this.turnCount = 0;        // これまでのターンの数（追加のターンも数える）
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
            player.createInitialDeck({ shelters: this.useShelters, heirlooms: this.heirlooms });
            player.drawCards(5);
            // パン屋：各プレイヤーは財源を1つ持って始める
            if (this.isInSupply('baker')) player.coffers += 1;
        });

        // 最初のプレイヤーを設定
        this.currentPlayerIndex = Math.floor(this.random() * this.players.length);

        this.log('ゲームが開始されました');
        if (this.useColonies) this.log('白金貨と植民地を使います');
        if (this.useShelters) this.log('屋敷の代わりに避難所を使います');
        if (this.bane) this.log(`魔女娘の災いカードは${ALL_CARDS[this.bane.toUpperCase()].name}です`);
        if (this.ferrymanPile) this.log(`渡し守で獲得するカードは${ALL_CARDS[this.ferrymanPile.toUpperCase()].name}です`);
        this.startTurn(this.getCurrentPlayer(), { regular: true });
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
            this.bane = this.options.bane ?? this.pickUnusedKingdomCard(data => [2, 3].includes(data.cost) && !data.potionCost);
            if (this.bane) this.supply[this.bane] = pileSize(this.bane);
        }

        // 渡し守：コスト3か4の使っていない王国カードを1種、サプライ外に置く
        if (this.isInSupply('ferryman')) {
            this.ferrymanPile = this.options.ferryman ?? this.pickUnusedKingdomCard(data => [3, 4].includes(data.cost) && !data.potionCost);
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

        // 避難所：王国カードを1枚選び、それが暗黒時代のカードなら、初期デッキの屋敷の代わりに避難所を使う
        this.useShelters = this.options.shelters ??
            (kingdomIds.length > 0 &&
             ALL_CARDS[kingdomIds[Math.floor(this.random() * kingdomIds.length)].toUpperCase()]?.set === CARD_SETS.DARK_AGES);

        // 中身が1種類でない山（騎士など）は、中のカードを混ぜて置く
        // 2種で1山のカード・城は決まった順に重ねる（pileOrdered）。城はプレイヤー数で枚数が変わる
        kingdomIds.forEach(cardId => {
            const data = ALL_CARDS[cardId.toUpperCase()];
            const cards = data?.pileCardsFor ? data.pileCardsFor(this.players.length) : data?.pileCards;
            if (cards) this.setupMixedPile(cardId, data.pileOrdered ? [...cards] : this.shuffle([...cards]));
        });
        // 略奪者など：廃墟の山（5種類を混ぜ、プレイヤー数-1 の10倍の枚数）
        if (kingdomIds.some(cardId => ALL_CARDS[cardId.toUpperCase()]?.types.includes(CARD_TYPES.LOOTER))) {
            const ruins = this.shuffle(RUINS_CARD_IDS.flatMap(cardId => Array(10).fill(cardId)));
            this.setupMixedPile('ruins', ruins.slice(0, (this.players.length - 1) * 10));
        }
        // サプライ外の山（略奪品・狂人・傭兵など）と、使うアーティファクト（ルネサンス）
        kingdomIds.forEach(cardId => {
            const data = ALL_CARDS[cardId.toUpperCase()];
            Object.entries(data?.nonSupplyPiles ?? {}).forEach(([pileId, count]) => {
                this.nonSupply[pileId] = count;
            });
            (data?.artifacts ?? []).forEach(id => { this.artifacts[id] = null; });
        });

        // イベントなど（カードではない横長の札）
        this.landscapes = this.selectLandscapes();

        // 夜想曲：祝福・呪詛の山、家宝、ゾンビなど
        this.setupNocturne();

        // 錬金術：コストにポーションのあるカードがあれば、ポーションをサプライに置く
        if (Object.keys(this.supply).some(cardId => this.getPotionCost(cardId) > 0)) {
            this.supply.potion = ALL_CARDS.POTION.count;
        }

        // ランドマークなどの準備（勝利点トークンを置くなど）
        this.landscapes.forEach(id => this.getLandscape(id)?.setup?.(this));

        // ペテン師：呪いが財宝としても使える
        this.curseIsTreasure = this.isInSupply('charlatan');
        // 追い剥ぎ：アクションフェーズにカードを獲得するたびにカードを引く
        this.footpadInGame = this.isInSupply('footpad');
    }

    // サプライにある（最初にあった）カードか
    isInSupply(cardId) {
        return this.supply[cardId] !== undefined;
    }

    // ゲームの乱数で配列を混ぜる
    shuffle(items) {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }

    // 中身が1種類でない山を置く（cardIds は上から順）
    setupMixedPile(pileId, cardIds) {
        this.pileCards[pileId] = cardIds;
        this.supply[pileId] = cardIds.length;
        cardIds.forEach(cardId => { this.pileOf[cardId] = pileId; });
    }

    // サプライの山の一番上のカードのID（ふつうの山は山のIDと同じ。空なら null）
    getPileTop(pileId) {
        const cards = this.pileCards[pileId];
        if (!cards) return pileId;
        return cards[0] ?? null;
    }

    // カードのIDか山のIDから、山のIDと獲得するカードのIDを求める（中身の混ざった山は一番上のカードだけ）
    resolvePile(cardId) {
        const id = cardId.toLowerCase();
        if (this.pileCards[id]) return { pileId: id, cardId: this.pileCards[id][0] ?? null };
        const pileId = this.pileOf[id];
        if (pileId) return { pileId, cardId: this.pileCards[pileId][0] === id ? id : null };
        return { pileId: id, cardId: id };
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

    // そのプレイヤーの操作と選択を行うプレイヤー（支配のターン中の手番のプレイヤーは、支配したプレイヤーが操作する）
    getController(player) {
        return this.possessor && player === this.getCurrentPlayer() ? this.possessor : player;
    }

    // 支配のターン中に手番のプレイヤーが獲得するカードは、支配したプレイヤーが代わりに獲得する
    getGainRecipient(player) {
        return this.possessor && player === this.getCurrentPlayer() ? this.possessor : player;
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
        const data = typeof card === 'string' ? ALL_CARDS[(this.getPileTop(card.toLowerCase()) ?? card).toUpperCase()] : card;
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
        // トロルの橋：自分のターンの間、場にあるトロルの橋1枚につきコスト-1
        cost -= inPlay('bridge_troll');
        // 運河：運河を持つプレイヤーのターンの間、コスト-1
        if (player.projects.has('canal')) cost -= 1;
        // 渡し船：-2 コストのトークンを置いた山のカードは、そのプレイヤーのターンにコスト-2
        if (data.id && player.pileTokens.minusCost && (this.pileOf[data.id] ?? data.id) === player.pileTokens.minusCost) cost -= 2;
        if (isAction) cost -= 2 * inPlay('quarry');
        return Math.max(0, cost);
    }

    // コストのポーションの数（錬金術。軽減の効果はポーションには及ばない）
    getPotionCost(card) {
        const data = typeof card === 'string' ? ALL_CARDS[(this.getPileTop(card.toLowerCase()) ?? card).toUpperCase()] : card;
        return data?.potionCost ?? 0;
    }

    // コストの負債の数（帝国。負債のあるカードを購入すると、その数の負債を負う）
    getDebtCost(card) {
        const data = typeof card === 'string' ? ALL_CARDS[(this.getPileTop(card.toLowerCase()) ?? card).toUpperCase()] : card;
        return data?.debtCost ?? 0;
    }

    // コストのコイン以外の部分（ポーションと負債）。「このカードのコストまで」などの比べ方に渡す
    costExtras(card) {
        return { potion: this.getPotionCost(card), debt: this.getDebtCost(card) };
    }

    // コストにポーションか負債があるか（「コスト3〜6」などのコインだけの条件には当てはまらない）
    hasExtraCost(card) {
        return this.getPotionCost(card) > 0 || this.getDebtCost(card) > 0;
    }

    // a のコストが b より安いか（コイン・ポーション・負債のどれも多くなく、どれかが少ない）
    costsLessThan(a, b) {
        const parts = (card) => [this.getCost(card), this.getPotionCost(card), this.getDebtCost(card)];
        const [partsA, partsB] = [parts(a), parts(b)];
        return partsA.every((value, i) => value <= partsB[i]) && partsA.some((value, i) => value < partsB[i]);
    }

    // 財宝として扱うカードか（ペテン師のあるゲームでは呪いも財宝）
    isTreasure(card) {
        if (card.isType(CARD_TYPES.TREASURE) || (this.curseIsTreasure && card.id === 'curse')) return true;
        // 資本主義：持っているプレイヤーのターンには、+財宝のあるアクションも財宝
        return this.getCurrentPlayer()?.projects.has('capitalism') && card.isType(CARD_TYPES.ACTION) &&
            /財宝 ?\+\d/.test(card.description ?? '');
    }

    // 財宝をプレイしたときに得る財宝の数（効果で得る分は除く）
    getTreasureValue(card) {
        if (card.id === 'curse') return this.curseIsTreasure ? 1 : 0;
        // 羨望：このターン、銀貨と金貨は財宝1
        if (this.turnState.envious && (card.id === 'silver' || card.id === 'gold')) return 1;
        return card.value ?? 0;
    }

    // ===== 操作 =====
    // プレイヤーの操作はすべてここを通す。操作したプレイヤーを確かめ、受け付けた操作だけを記録する
    //   { type: 'play', cardIndex } アクションカードをプレイ
    //   { type: 'buyPhase' }        購入フェーズへ
    //   { type: 'night' }           夜フェイズへ（夜のカードをプレイする）
    //   { type: 'coffers', amount } 財源を使う
    //   { type: 'villager', amount } 村人を使う（アクション+1ずつ）
    //   { type: 'buy', cardId }     カードを購入
    //   { type: 'buyLandscape', landscapeId } イベントなどを購入
    //   { type: 'endTurn' }         ターン終了
    //   { type: 'answer', answer }  選択に答える（select・choose はインデックスの配列、confirm は真偽値）
    //   { type: 'proxy' }           部屋を出たプレイヤーを、以後CPUが代わりに操作する（オンライン対戦のサーバーだけが送る）
    applyCommand(playerId, command) {
        this.lastError = null;
        // 支配のターン中は、支配したプレイヤーが手番のプレイヤーの操作と選択をすべて行う
        const isCurrent = this.getController(this.getCurrentPlayer()).id === playerId;
        let accepted = false;

        switch (command.type) {
            case 'play':
                accepted = isCurrent && this.playActionCard(command.cardIndex);
                break;
            case 'buyPhase':
                accepted = isCurrent && this.enterBuyPhase();
                break;
            case 'night':
                accepted = isCurrent && this.enterNightPhase();
                break;
            case 'coffers':
                accepted = isCurrent && this.useCoffers(command.amount);
                break;
            case 'villager':
                accepted = isCurrent && this.useVillagers(command.amount);
                break;
            case 'buy':
                accepted = isCurrent && this.buyCard(command.cardId);
                break;
            case 'buyLandscape':
                accepted = isCurrent && this.buyLandscape(command.landscapeId);
                break;
            case 'endTurn':
                accepted = isCurrent && this.endTurn();
                break;
            case 'proxy':
                accepted = this.startProxy(playerId);
                break;
            case 'answer':
                // 選択はそれを求められたプレイヤーだけが答えられる（民兵の攻撃は手番ではない人が答える）
                accepted = Boolean(this.pendingPrompt) && this.getController(this.pendingPrompt.player).id === playerId &&
                    this.resolvePrompt(command.answer);
                break;
        }

        if (accepted) {
            this.commands.push({ playerId, ...command });
        } else if (!this.lastError) {
            this.reject('今はその操作はできません');
        }
        return accepted;
    }

    // 部屋を出たプレイヤーを、以後CPUが代わりに操作する
    startProxy(playerId) {
        const player = this.players[playerId];
        if (!player || player.isCPU || this.phase === 'end') return false;
        player.isCPU = true;
        this.log(`${player.name}が部屋を出たため、CPUが代わりに操作します`);
        this.notifyStateChanged();
        return true;
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

        // 夜フェイズには、夜のカードをアクションを使わずにプレイする
        if (this.phase === 'night') return this.playNightCard(cardIndex);

        if (this.phase !== 'action') {
            this.reject('アクションフェーズではありません');
            return false;
        }

        if (player.actions <= 0) {
            this.reject('アクションが残っていません');
            return false;
        }

        const card = player.hand[cardIndex];
        // 相続：屋敷のトークンを置いたカードがあれば、屋敷をそのカードとしてプレイできる
        const inherited = card?.id === 'estate' && player.inheritance ? new Card(ALL_CARDS[player.inheritance.toUpperCase()]) : null;

        if (!card || (!card.isType(CARD_TYPES.ACTION) && !inherited)) {
            this.reject('選択されたカードはアクションカードではありません');
            return false;
        }

        // アクションカードをプレイ（効果のログより先にプレイしたことを記録する）
        // 解決し終えた直後に、酒場マットのカード（王家の馬車など）を呼び出せるようにする
        player.actions--;
        this.log(`${player.name}は${card.name}${inherited ? `（${inherited.name}）` : ''}をプレイしました`);
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);
        this.runNext(
            () => (inherited ?? card).play(player, this),
            // 城塞：自分のターンに最初にプレイしたアクションを、もう一度プレイする
            () => {
                if (!player.projects.has('citadel') || this.turnState.citadelUsed || !player.playArea.includes(card)) return;
                this.turnState.citadelUsed = true;
                this.log(`${player.name}は城塞で${card.name}をもう一度プレイしました`);
                (inherited ?? card).play(player, this);
            },
            () => this.afterActionResolved(player, card)
        );
        this.processEffects();

        this.notifyStateChanged();

        return true;
    }

    // 夜のカードをプレイする（夜フェイズのみ。アクションは使わない）
    playNightCard(cardIndex) {
        const player = this.getCurrentPlayer();
        const card = player.hand[cardIndex];
        if (!card || !card.isType(CARD_TYPES.NIGHT)) {
            this.reject('夜フェイズにプレイできるのは夜のカードです');
            return false;
        }
        this.log(`${player.name}は${card.name}をプレイしました`);
        player.hand.splice(cardIndex, 1);
        player.playArea.push(card);
        this.runNext(() => card.play(player, this));
        this.processEffects();
        this.notifyStateChanged();
        return true;
    }

    // 夜フェイズに移る（購入フェーズから。購入フェーズの終わりの効果を先に起こす）
    enterNightPhase() {
        if (this.isAwaitingPrompt()) return false;
        if (this.phase === 'action') this.enterBuyPhase();
        if (this.phase !== 'buy' || this.pendingPrompt) {
            this.reject('購入フェーズの後に夜フェイズに移れます');
            return false;
        }
        const player = this.getCurrentPlayer();
        this.runNext(...this.endOfBuyPhaseSteps(player), () => {
            this.phase = 'night';
            this.log('夜フェイズに移行しました');
        });
        this.processEffects();
        this.notifyStateChanged();
        return true;
    }

    // 購入フェーズの終わりの効果（隠遁者・酒場マットのワイン商）。1ターンに1回だけ起こす
    endOfBuyPhaseSteps(player) {
        if (this.turnState.buyPhaseEnded) return [];
        this.turnState.buyPhaseEnded = true;
        return [
            // 購入フェーズの終わりのプロジェクト（探検・野外劇）
            () => this.runLandscapeHooks('onEndOfBuyPhase', player),
            ...player.playArea.filter(card => card.onEndOfBuyPhase).map(card => () => {
                if (player.playArea.includes(card)) card.onEndOfBuyPhase(player, this, card);
            }),
            ...player.mats.tavern.filter(card => card.onEndOfBuyPhaseFromTavern).map(card => () => {
                if (player.mats.tavern.includes(card)) card.onEndOfBuyPhaseFromTavern(player, this, card);
            })
        ];
    }

    // アクションを解決し終えた直後：酒場マットのカード（王国の硬貨・王家の馬車）を呼び出せる
    afterActionResolved(player, card) {
        this.runNext(...uniqueById(player.mats.tavern.filter(reserve => reserve.onCallAfterAction)).map(reserve => () => {
            if (player.mats.tavern.includes(reserve)) reserve.onCallAfterAction(player, this, reserve, card);
        }));
    }

    // 酒場マットのカードを呼び出す（場に出す。クリーンアップで捨て札になる）
    callReserve(player, card) {
        const index = player.mats.tavern.indexOf(card);
        if (index < 0) return false;
        player.mats.tavern.splice(index, 1);
        player.playArea.push(card);
        this.log(`${player.name}は酒場マットの${card.name}を呼び出しました`);
        return true;
    }

    // 購入フェーズからアクションフェーズに戻る（ヴィラを購入フェーズに獲得したとき）
    returnToActionPhase(player) {
        if (this.phase !== 'buy' || player !== this.getCurrentPlayer()) return;
        this.phase = 'action';
        this.log(`${player.name}はアクションフェーズに戻りました`);
    }

    // 魅了の魔女：他のプレイヤーの魅了を受けていて、自分のターンに最初にプレイするアクションなら、効果の代わりにカード+1・アクション+1
    isEnchanted(player, card) {
        return card.isType(CARD_TYPES.ACTION) && player === this.getCurrentPlayer() && this.turnState.actionsPlayed === 1 &&
            this.players.some(owner => owner !== player && owner.enchantedVictims.has(player));
    }

    // カードをプレイしたとき最初に得るもの：山に置いた +1 カードなどのトークン（冒険）、チャンピオン
    applyPlayBonuses(player, card) {
        const pileId = this.pileOf[card.id] ?? card.id;
        const tokens = player.pileTokens;
        const bonus = {
            cards: tokens.plusCard === pileId ? 1 : 0,
            actions: (tokens.plusAction === pileId ? 1 : 0) +
                // チャンピオン：アクションをプレイするたびにアクション +1
                (card.isType(CARD_TYPES.ACTION) ? player.playArea.filter(other => other.id === 'champion' && other !== card).length : 0),
            buys: tokens.plusBuy === pileId ? 1 : 0,
            coins: tokens.plusCoin === pileId ? 1 : 0
        };
        if (bonus.cards) player.drawCards(bonus.cards);
        player.actions += bonus.actions;
        player.buys += bonus.buys;
        if (bonus.coins) player.coins += bonus.coins;
        const parts = [[bonus.cards, 'カード'], [bonus.actions, 'アクション'], [bonus.buys, '購入'], [bonus.coins, '財宝']]
            .filter(([amount]) => amount > 0).map(([amount, label]) => `${label}+${amount}`);
        if (parts.length > 0) this.log(`${player.name}は${card.name}をプレイして、トークンなどで${parts.join('、')}を得ました`);
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
        // 妄想・羨望の状態を戻して、このターンに効かせる
        this.applyStatesAtBuyPhase(player);
        const rank = (card) => {
            if (TREASURE_PLAY_FIRST.includes(card.id)) return TREASURE_PLAY_FIRST.indexOf(card.id) - TREASURE_PLAY_FIRST.length;
            if (TREASURE_PLAY_LAST.includes(card.id)) return 1 + TREASURE_PLAY_LAST.indexOf(card.id);
            return 0;
        };
        const treasures = player.hand.filter(card => this.isTreasure(card)).sort((a, b) => rank(a) - rank(b));

        this.phase = 'buy';
        this.log(`${player.name}は財宝カードを${treasures.length}枚プレイしました`);
        this.log('購入フェーズに移行しました');

        // 購入フェーズの開始時のランドマーク（闘技場）のあとで財宝をプレイする
        // 先の財宝の効果で手札から無くなった財宝（ティアラで2回プレイしたものなど）はプレイしない
        this.runNext(
            () => this.runLandscapeHooks('onStartBuyPhase', player),
            // 宝箱：持っていれば、購入フェーズの開始時に金貨を獲得する
            () => {
                if (!this.hasArtifact(player, 'treasure_chest')) return;
                if (this.gainCardFromSupply(player, 'gold')) this.log(`${player.name}は宝箱で金貨を獲得しました`);
            },
            ...treasures.map(card => () => {
                if (player.hand.includes(card)) this.playTreasure(player, card);
            })
        );
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

    // アーティファクトを受け取る（前の持ち主から移る）
    takeArtifact(player, id) {
        if (!(id in this.artifacts) || this.artifacts[id] === player) return;
        this.artifacts[id] = player;
        this.log(`${player.name}は${ARTIFACT_NAMES[id]}を受け取りました`);
    }

    hasArtifact(player, id) {
        return this.artifacts[id] === player;
    }

    // 村人を使ってアクションを得る（アクションフェーズのみ）
    useVillagers(amount) {
        if (this.isAwaitingPrompt()) return false;
        const player = this.getCurrentPlayer();
        if (this.phase !== 'action') {
            this.reject('村人はアクションフェーズに使えます');
            return false;
        }
        if (!Number.isInteger(amount) || amount <= 0 || amount > player.villagers) {
            this.reject('使える村人がいません');
            return false;
        }
        player.villagers -= amount;
        player.actions += amount;
        this.log(`${player.name}は村人を${amount}人使い、アクション+${amount}を得ました`);
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
        const resolved = piles === this.supply ? this.resolvePile(cardId) : { pileId: cardId.toLowerCase(), cardId: cardId.toLowerCase() };
        const { pileId } = resolved;
        const lowerCardId = resolved.cardId;
        if (!lowerCardId || !piles[pileId] || piles[pileId] <= 0) {
            return null;
        }
        piles[pileId]--;
        if (piles === this.supply && this.pileCards[pileId]) this.pileCards[pileId].shift();
        const recipient = this.redirectGain(player, lowerCardId);
        // 手札に獲得するカード（悪の巣・ゴーストタウン・守護者・夜警）は、行き先の指定がなければ手札に置く
        const gainToHand = ALL_CARDS[lowerCardId.toUpperCase()]?.gainToHand && destination === 'discard';
        const card = recipient.gainCard(lowerCardId, gainToHand ? 'hand' : (recipient === player ? destination : 'discard'));
        this.onCardGained(recipient, card);
        return card;
    }

    // 廃棄置き場などにあるカードそのものを獲得する（待ち伏せ）
    gainCardInstance(player, card, destination = 'discard') {
        const recipient = this.redirectGain(player, card.id);
        this.placeCard(recipient, card, recipient === player ? destination : 'discard');
        this.onCardGained(recipient, card);
        return card;
    }

    // 支配のターン中なら獲得するプレイヤーを支配したプレイヤーに替える（行き先は捨て札になる）
    redirectGain(player, cardId) {
        const recipient = this.getGainRecipient(player);
        if (recipient !== player) {
            this.log(`支配により、${recipient.name}が${player.name}の代わりに${ALL_CARDS[cardId.toUpperCase()].name}を獲得しました`);
        }
        return recipient;
    }

    // カードを山に戻す（交易商で銀貨と交換するとき・狂人・略奪品など）。中身の混ざった山には一番上に戻す
    returnToSupply(player, card) {
        if (!player.removeCard(card)) return false;
        const pileId = this.pileOf[card.id] ?? card.id;
        if (this.supply[pileId] !== undefined) {
            this.supply[pileId]++;
            if (this.pileCards[pileId]) this.pileCards[pileId].unshift(card.id);
        } else if (this.nonSupply[pileId] !== undefined) {
            this.nonSupply[pileId]++;
        }
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
            if (this.phase === 'buy') this.turnState.buyPhaseGains++;
            // 庭師：場にある間、勝利点カードを獲得するたびに勝利点トークン+1
            if (card.isType(CARD_TYPES.VICTORY)) {
                this.gainVp(player, player.playArea.filter(played => played.id === 'groundskeeper').length, '庭師');
            }
        }
        this.runLandscapeHooks('onGainAny', player, card);

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

        // 魔除け：次にカードを獲得したとき、同じコストの名前の違うカードも獲得してよい
        if (isCurrent && this.turnState.charms > 0) {
            this.turnState.charms--;
            steps.push(() => this.promptGain({
                player, exactCost: this.getCost(card), ...this.costExtras(card), optional: true, filter: (data) => data.id !== card.id,
                title: '魔除け', message: `${card.name}と同じコストの、名前の違うカードを1枚獲得できます（選ばなくてもかまいません）。`
            }));
        }

        // 貨物船：このターンに1回、獲得したカードを脇に置き、次のターンの開始時に手札に加えてよい
        if (isCurrent && this.turnState.cargoShips.length > 0) {
            steps.push(() => {
                const ship = this.turnState.cargoShips[0];
                if (!ship || (!player.discard.includes(card) && !player.deck.includes(card) && !player.hand.includes(card))) return;
                this.promptConfirm({
                    player,
                    card,
                    title: '貨物船',
                    message: `獲得した${card.name}を貨物船の上に脇に置き、次のターンの開始時に手札に加えますか？`,
                    yesLabel: '脇に置く',
                    noLabel: '置かない',
                    purpose: 'cargo-ship',
                    callback: (yes) => {
                        if (!yes || !player.removeCard(card)) return;
                        this.turnState.cargoShips.shift();
                        player.setAside.push(card);
                        player.addDuration(ship, () => {
                            if (!player.setAside.includes(card)) return;
                            player.setAside.splice(player.setAside.indexOf(card), 1);
                            player.hand.push(card);
                            this.log(`${player.name}は貨物船の${card.name}を手札に加えました`);
                        });
                    }
                });
            });
        }

        // 取り替え子：コスト3以上のカードを獲得したとき、取り替え子と交換してもよい
        steps.push(() => this.promptChangeling(player, card));

        // ティアラ・旅の祭り・追跡者（場にある間）：獲得したカードを山札の上に置いてもよい
        const tracker = player.playArea.some(played => played.id === 'tracker');
        if ((isCurrent && (this.turnState.tiara || this.turnState.travellingFair)) || tracker) {
            steps.push(() => {
                if (!player.discard.includes(card) && !player.hand.includes(card)) return;
                this.promptConfirm({
                    player,
                    card,
                    title: this.turnState.tiara ? 'ティアラ' : (this.turnState.travellingFair ? '旅の祭り' : '追跡者'),
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

        // 獲得した本人の酒場マットのカード（複製）を呼び出してもよい
        player.mats.tavern.filter(reserve => reserve.onCallOnGain).forEach(reserve => {
            steps.push(() => {
                if (player.mats.tavern.includes(reserve)) reserve.onCallOnGain(player, this, reserve, card);
            });
        });

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

        // 負債があれば先に返す。返しきれなければ購入できない
        this.payOffDebt(player);
        if (player.debt > 0) {
            this.reject('負債を返すまで購入できません');
            return false;
        }

        // ALL_CARDSには大文字のID、サプライには小文字のIDで参照する（中身の混ざった山は一番上のカード）
        const { pileId, cardId: topCardId } = this.resolvePile(cardId);
        if (!topCardId || !this.supply[pileId] || this.supply[pileId] <= 0) {
            this.reject('選択されたカードはサプライにありません');
            return false;
        }
        const upperCardId = topCardId.toUpperCase();

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
        const potionCost = this.getPotionCost(data);
        if (player.potions < potionCost) {
            this.reject(`${data.name}を購入するにはポーションが必要です`);
            return false;
        }

        if (data.canBuy && !data.canBuy(player, this)) {
            this.reject(`今は${data.name}を購入できません`);
            return false;
        }
        if (this.missionTurn) {
            this.reject('伝道のターンにはカードを購入できません');
            return false;
        }
        if (this.turnState.deluded && data.types.includes(CARD_TYPES.ACTION)) {
            this.reject('妄想の効果で、このターンはアクションカードを購入できません');
            return false;
        }

        // カードを購入（獲得で起きる効果のログより先に購入を記録する）
        // 購入時の効果（超過支払い・隠し財産など）を先に処理してから獲得する
        // 超過支払いの額は購入するときに決め、効果は獲得した後で起こす（獲得したカードを使う効果があるため）
        player.buys--;
        player.coins -= cost;
        player.potions -= potionCost;
        this.log(`${player.name}は${data.name}を購入しました`);
        // コストの負債と、山に置かれた負債（徴税）を負う
        this.takeDebt(player, this.getDebtCost(data));
        if (this.pileDebt[pileId] > 0) {
            this.takeDebt(player, this.pileDebt[pileId], '徴税');
            this.pileDebt[pileId] = 0;
        }
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
        this.turnState.cardsBought++;
        this.runLandscapeHooks('onBuyAny', player, data);
        const steps = [];
        if (data.onBuy) steps.push(() => data.onBuy(player, this, data));
        player.playArea.filter(card => card.onBuyWhileInPlay).forEach(card => {
            steps.push(() => card.onBuyWhileInPlay(player, this, card, data));
        });
        // 計画：廃棄のトークンを置いた山のカードを購入したら、手札を1枚廃棄してもよい
        if (player.pileTokens.trashing && (this.pileOf[data.id] ?? data.id) === player.pileTokens.trashing && player.hand.length > 0) {
            steps.push(() => this.promptSelect({
                player, cards: player.hand, min: 0, max: 1, title: '計画',
                message: '廃棄のトークンの効果で、手札を1枚廃棄できます（選ばなくてもかまいません）。',
                confirmLabel: '廃棄する', purpose: 'optional-trash',
                callback: (indices) => {
                    const trashed = this.trashFromHand(player, indices);
                    if (trashed.length > 0) this.log(`${player.name}は${trashed[0].name}を廃棄しました`);
                }
            }));
        }
        // 他のプレイヤーの、次のターンまで続く効果（幽霊の森・沼の妖婆）
        this.getOtherPlayers(player).forEach(owner => {
            if (owner.hauntedVictims.has(player)) {
                steps.push(() => {
                    if (player.hand.length === 0) return;
                    const hand = player.hand.splice(0);
                    this.log(`${player.name}は${owner.name}の幽霊の森の効果で、手札を山札の上に置きます`);
                    putBackInAnyOrder(this, player, hand, '幽霊の森');
                });
            }
            for (let i = 0; i < (owner.swampHagVictims.get(player) ?? 0); i++) {
                steps.push(() => {
                    this.log(`${owner.name}の沼の妖婆の効果`);
                    this.gainCurse(player);
                });
            }
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
        // 野営地：クリーンアップの開始時に、脇に置いた野営地をサプライに戻す
        this.turnState.encampments.forEach(card => {
            if (player.setAside.includes(card) && this.returnToSupply(player, card)) this.log(`${player.name}は野営地をサプライに戻しました`);
        });
        this.runNext(
            // 購入フェーズの終わりの効果（夜フェイズに移ったときに起こしていなければ、ここで起こす）
            ...this.endOfBuyPhaseSteps(player),
            () => this.promptScheme(player),
            // 場から捨て札にするときの効果（錬金術師・薬草商）。持続で場に残るカードには起きない
            ...player.playArea.filter(card => card.onCleanup).map(card => () => {
                if (player.playArea.includes(card) && !player.hasPendingDuration(card)) card.onCleanup(player, this, card);
            }),
            // トラベラー：場から捨て札にするとき、次のカードと交換してもよい
            ...player.playArea.filter(card => card.exchangeFor).map(card => () => {
                if (player.playArea.includes(card) && !player.hasPendingDuration(card)) this.promptExchange(player, card);
            }),
            () => this.finishTurn(player)
        );
        this.processEffects();
        this.notifyStateChanged();
        return true;
    }

    // トラベラーを次のカードと交換する（このカードを山に戻し、次のカードを捨て札に置く。獲得ではない）
    promptExchange(player, card) {
        const nextId = card.exchangeFor;
        if (!(this.nonSupply[nextId] > 0)) return;
        const next = ALL_CARDS[nextId.toUpperCase()];
        this.promptConfirm({
            player,
            card,
            title: card.name,
            message: `${card.name}を${next.name}と交換しますか？`,
            yesLabel: '交換する',
            noLabel: '交換しない',
            purpose: 'traveller-exchange',
            callback: (yes) => {
                if (!yes || !this.returnToSupply(player, card)) return;
                this.nonSupply[nextId]--;
                player.discard.push(new Card(next));
                this.log(`${player.name}は${card.name}を${next.name}と交換しました`);
            }
        });
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
        // 旗：持っていれば、手札を引くときに1枚多く引く
        player.cleanup((takesExtraTurn ? 3 : 5) + this.turnState.expeditionDraw + (this.hasArtifact(player, 'flag') ? 1 : 0));
        player.gainedLastTurn = player.gainedThisTurn;
        // 川の恵み：ターンの終わりにカードを引く
        if (this.turnState.riverDraw > 0) {
            player.drawCards(this.turnState.riverDraw);
            this.log(`${player.name}は川の恵みでカードを${this.turnState.riverDraw}枚引きました`);
        }
        // 忠犬：脇に置いたカードを、ターンの終わりに手札に戻す
        this.turnState.hounds.forEach(({ player: owner, card }) => {
            if (!owner.setAside.includes(card)) return;
            owner.setAside.splice(owner.setAside.indexOf(card), 1);
            owner.hand.push(card);
            this.log(`${owner.name}は忠犬を手札に戻しました`);
        });
        // クリーンアップまで残した祝福を捨て札にする
        this.boonDiscard.push(...player.keptBoons.splice(0));
        // 保存：脇に置いたカードを、引いた後で手札に戻す
        this.turnState.savedCards.forEach(card => {
            if (player.setAside.includes(card)) {
                player.setAside.splice(player.setAside.indexOf(card), 1);
                player.hand.push(card);
            }
        });

        // 蹄鉄工：超過支払いした分だけ、ターンの終わりにカードを引く
        if (this.turnState.farrierDraw > 0) {
            player.drawCards(this.turnState.farrierDraw);
            this.log(`${player.name}は蹄鉄工の効果でカードを${this.turnState.farrierDraw}枚引きました`);
        }
        // ターンの終わりのランドマーク（浴場など）
        this.runLandscapeHooks('onEndTurn', player);

        // 支配のターンの終わりに、脇に置いた（廃棄された）カードを捨て札に戻す
        if (this.possessor) {
            player.discard.push(...this.possessionTrash);
            this.possessionTrash = [];
            this.possessor = null;
        }
        this.log(`${player.name}のターンが終了しました`);

        // このターンの後に起きること（寄付・山道の入札）があれば、それを終えてから次の手番に進む
        const afterTurn = [
            ...(player.donatePending ? [() => this.resolveDonate(player)] : []),
            ...this.landscapes.map(id => this.getLandscape(id)?.afterTurn).filter(Boolean).map(hook => () => hook(this, player))
        ];
        if (afterTurn.length > 0) {
            this.runNext(...afterTurn, () => this.advanceTurn(player, takesExtraTurn));
            return;
        }
        this.advanceTurn(player, takesExtraTurn);
    }

    // 寄付：山札と捨て札を手札に加え、好きな枚数を廃棄し、手札を山札にしてシャッフルして5枚引く
    resolveDonate(player) {
        player.donatePending = false;
        player.hand.push(...player.deck.splice(0), ...player.discard.splice(0));
        this.log(`${player.name}は寄付で、山札と捨て札をすべて手札に加えました`);
        this.promptSelect({
            player,
            cards: player.hand,
            min: 0,
            max: player.hand.length,
            title: '寄付',
            message: '廃棄するカードを選んでください（選ばなくてもかまいません）。残りはシャッフルして山札にし、5枚引きます。',
            confirmLabel: '廃棄する',
            purpose: 'donate',
            callback: (indices) => {
                const trashed = this.trashFromHand(player, indices);
                if (trashed.length > 0) this.log(`${player.name}は${trashed.length}枚を廃棄しました`);
                player.deck.push(...player.hand.splice(0));
                player.shuffleDeck();
                player.drawCards(5);
            }
        });
    }

    // ゲームの終わりを確かめ、次の手番に進む
    advanceTurn(player, takesExtraTurn) {
        // 艦隊：ゲームの終わりの後、艦隊を持つプレイヤーだけが順に1回ずつターンを行う
        if (this.fleetQueue) {
            const next = this.fleetQueue.shift();
            if (!next) {
                this.endGame();
                return;
            }
            this.currentPlayerIndex = this.players.indexOf(next);
            this.log(`${next.name}は艦隊の追加のターンを行います`);
            this.startTurn(next);
            return;
        }

        // ゲーム終了条件はターン終了時にチェックする
        if (this.checkGameEnd()) {
            const order = this.getOtherPlayers(this.regularTurnPlayer ?? player);
            const fleet = [...order, this.regularTurnPlayer ?? player].filter(p => p.projects.has('fleet'));
            if (fleet.length > 0) {
                this.fleetQueue = fleet;
                this.log('艦隊を持つプレイヤーが、追加のターンを行います');
                this.advanceTurn(player, false);
                return;
            }
            this.endGame();
            return;
        }

        // 次の手番：前哨地の追加のターン → 支配のターン → ふつうの手番（最後のふつうの手番のプレイヤーの左隣）
        this.isExtraTurn = takesExtraTurn;
        if (takesExtraTurn) {
            this.log(`${player.name}は前哨地の効果で追加のターンを行います`);
            this.startTurn(player);
            return;
        }
        this.missionTurn = false;
        const mission = this.missions.shift();
        if (mission) {
            this.missionTurn = true;
            this.currentPlayerIndex = this.players.indexOf(mission);
            this.log(`${mission.name}は伝道の効果で、カードを購入できない追加のターンを行います`);
            this.startTurn(mission);
            return;
        }
        const possession = this.possessions.shift();
        if (possession) {
            this.possessor = possession.possessor;
            this.currentPlayerIndex = this.players.indexOf(possession.target);
            this.log(`${possession.possessor.name}が${possession.target.name}の追加のターンを支配します`);
            this.startTurn(possession.target);
            return;
        }
        this.currentPlayerIndex = this.players.indexOf(this.regularTurnPlayer ?? player);
        this.startTurn(this.nextPlayer(), { regular: true });
    }

    // 支配：左隣のプレイヤーは、このターンの後に追加のターンを行い、その間はこのプレイヤーが操作する
    queuePossession(player) {
        this.possessions.push({ possessor: player, target: this.getPlayerToLeft(player) });
    }

    // ターンを始める（持続カード・農場労働者・書記の効果をここで処理する）
    // regular はふつうの手番（追加のターンでない）か
    startTurn(player, { regular = false } = {}) {
        if (regular) this.regularTurnPlayer = player;
        this.turnCount++;
        this.previousTurnPlayer = this.currentTurnPlayer;
        this.currentTurnPlayer = player;
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
        player.hauntedVictims.clear();
        player.swampHagVictims.clear();
        player.enchantedVictims.clear();

        // ずっと場に残る持続カード（雇人・チャンピオン）は、効果を使った後も残す
        const durations = player.durations;
        player.durations = durations.filter(duration => duration.permanent);
        const plays = player.startOfTurnPlays;
        player.startOfTurnPlays = [];

        this.runNext(
            ...durations.filter(duration => duration.effect).map(duration => duration.effect),
            // 鍵：持っていれば、ターンの開始時に財宝+1
            () => {
                if (!this.hasArtifact(player, 'key')) return;
                player.coins += 1;
                this.log(`${player.name}は鍵で財宝+1を得ました`);
            },
            // ターンの開始時のプロジェクト（兵舎・市・聖堂・城門など）
            () => this.runLandscapeHooks('onStartOfTurn', player),
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
            }),
            // 森で迷う：手札を1枚捨てて祝福を受けてもよい
            () => this.promptLostInTheWoods(player),
            // 酒場マットのカードをターンの開始時に呼び出してもよい（案内人・ネズミ捕り・変容・教師）
            ...uniqueById(player.mats.tavern.filter(card => card.onCallStartOfTurn)).map(card => () => {
                if (player.mats.tavern.includes(card)) card.onCallStartOfTurn(player, this, card);
            })
        );
        this.processEffects();
    }

    // プレイヤーの勝利点（カード・勝利点トークンに、ランドマークの得点を足す）
    calculateScore(player) {
        return player.calculateVictoryPoints() +
            this.landscapes.reduce((sum, id) => sum + (this.getLandscape(id)?.score?.(this, player) ?? 0), 0);
    }

    // 勝利点トークンを得る
    gainVp(player, amount, source = '') {
        if (amount <= 0) return;
        player.vpTokens += amount;
        this.log(`${player.name}は${source ? `${source}で` : ''}勝利点トークンを${amount}つ得ました`);
    }

    // 山や札に置いた勝利点トークンを取る（pool は this.pileVp か this.landscapeVp）
    takeVpFrom(player, pool, key, source, amount = Infinity) {
        const taken = Math.min(pool[key] ?? 0, amount);
        if (taken <= 0) return 0;
        pool[key] -= taken;
        this.gainVp(player, taken, source);
        return taken;
    }

    // ランドマークなどのきっかけ（hook は onGainAny・onBuyAny・onTrashAny など）を、使う札の順に起こす
    runLandscapeHooks(hook, ...args) {
        this.landscapes.forEach(id => {
            const data = this.getLandscape(id);
            if (data?.[hook]) data[hook](this, ...args);
        });
    }

    // 負債を、持っている財宝で返せるだけ返す（負債があるとカードやイベントを購入できない）
    payOffDebt(player) {
        const amount = Math.min(player.coins, player.debt);
        if (amount <= 0) return;
        player.coins -= amount;
        player.debt -= amount;
        this.log(`${player.name}は負債を${amount}返しました${player.debt > 0 ? `（残り${player.debt}）` : ''}`);
    }

    // 負債を負う
    takeDebt(player, amount, source = '') {
        if (amount <= 0) return;
        player.debt += amount;
        this.log(`${player.name}は${source ? `${source}で` : ''}負債を${amount}負いました`);
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

        // 各プレイヤーの勝利点を計算（ランドマークの得点を含む）
        const scores = this.players.map(player => {
            const points = this.calculateScore(player);
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
        if (target.guarded) {
            this.log(`${target.name}は守護者で${attacker.name}の攻撃を防ぎました`);
            return true;
        }
        if (target.playArea.some(card => card.id === 'champion')) {
            this.log(`${target.name}はチャンピオンで${attacker.name}の攻撃を防ぎました`);
            return true;
        }
        if (target.playArea.some(card => card.id === 'lighthouse')) {
            this.log(`${target.name}は灯台で${attacker.name}の攻撃を防ぎました`);
            return true;
        }
        const reaction = target.hand.find(card => card.isReaction);
        return reaction ? reaction.react(target, this, attacker) : false;
    }

    // カードをプレイする直前に起きる効果（浮浪児：場の浮浪児を廃棄して傭兵を獲得してもよい）
    getBeforePlaySteps(player, card) {
        if (!card.isType(CARD_TYPES.ATTACK)) return [];
        return player.playArea
            .filter(other => other !== card && other.onOtherAttackPlayed)
            .map(other => () => {
                if (player.playArea.includes(other)) other.onOtherAttackPlayed(player, this, other, card);
            });
    }

    // 廃棄置き場か、支配のターン中に脇に置いた廃棄のカードから取り出す（城砦・墓暴きなど）
    takeFromTrash(card) {
        for (const pile of [this.trash, this.possessionTrash]) {
            const index = pile.indexOf(card);
            if (index >= 0) {
                pile.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    // カードを廃棄する（遊牧民・小道など、廃棄したときの効果も起こす）
    trashCard(player, card) {
        // 支配のターン中に廃棄された手番のプレイヤーのカードは、脇に置いてターンの終わりに捨て札に戻す
        if (this.possessor && player === this.getCurrentPlayer()) {
            this.possessionTrash.push(card);
        } else {
            this.trash.push(card);
        }
        this.runLandscapeHooks('onTrashAny', player, card);
        // 司祭：このターンの残りの間、カードを廃棄するたびに財宝+2
        if (player === this.getCurrentPlayer() && this.turnState.priests > 0) {
            player.coins += 2 * this.turnState.priests;
            this.log(`${player.name}は司祭の効果で財宝+${2 * this.turnState.priests}を得ました`);
        }
        const steps = [];
        if (card.onTrash) steps.push(() => card.onTrash(player, this, card));
        // 自分のカードが廃棄されたときの手札のリアクション（市場広場）。同じカードは1回だけ聞く
        uniqueById(player.hand.filter(handCard => handCard.onOwnCardTrashed && handCard !== card)).forEach(reaction => {
            steps.push(() => {
                if (player.hand.includes(reaction)) reaction.onOwnCardTrashed(player, this, reaction, card);
            });
        });
        this.runNext(...steps);
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
    // potion はコストのポーションの数：「コスト○以下」ならそれ以下、「ちょうど○」なら同じ数のカードだけを選ぶ
    // lessThan を渡すと、そのカードより安いカードだけを選ぶ（ポーションも比べる）
    getGainableCards({ maxCost = Infinity, minCost = 0, exactCost = null, potion = 0, debt = 0, lessThan = null, filter = () => true } = {}) {
        return Object.keys(this.supply)
            .filter(cardId => this.supply[cardId] > 0)
            .map(cardId => ALL_CARDS[this.getPileTop(cardId)?.toUpperCase()])
            .filter(data => {
                if (!data) return false;
                const cost = this.getCost(data);
                const potionCost = this.getPotionCost(data);
                const debtCost = this.getDebtCost(data);
                if (lessThan) {
                    if (!this.costsLessThan(data, lessThan)) return false;
                } else if (exactCost !== null) {
                    if (cost !== exactCost || potionCost !== potion || debtCost !== debt) return false;
                } else if (cost > maxCost || cost < minCost || potionCost > potion || debtCost > debt) {
                    return false;
                }
                return filter(data);
            })
            .sort((a, b) => this.getCost(b) - this.getCost(a) || this.getPotionCost(b) - this.getPotionCost(a));
    }

    // サプライから条件に合うカードを1枚選んで獲得させる（filter でカードの種類を絞れる。optional なら選ばなくてもよい）
    // onGained には獲得したカードが渡る
    promptGain({ player, maxCost = Infinity, minCost = 0, exactCost = null, potion = 0, debt = 0, lessThan = null, filter = () => true, destination = 'discard', optional = false, title, message, purpose = 'gain', onGained }) {
        const candidates = this.getGainableCards({ maxCost, minCost, exactCost, potion, debt, lessThan, filter });

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
        // 中身の混ざった山は、中のカードをそれぞれ指定できる
        const candidates = Object.keys(this.supply)
            .flatMap(cardId => (this.pileCards[cardId] ? [...new Set(this.pileCards[cardId])] : [cardId]))
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

// イベントなど（カードではない横長の札）と、夜想曲の祝福・呪詛などの処理を加える
installLandscapes(Game);
installNocturne(Game);

// クラスをエクスポート
export default Game;
