/**
 * ドミニオンのプレイヤーモデル
 */

import Card from './card.js';
import { ALL_CARDS, CARD_TYPES } from './card-data.js';

// プレイヤークラス
class Player {
    constructor(name, id, isCPU = false) {
        this.name = name;
        this.id = id;
        this.isCPU = isCPU;  // CPUプレイヤーかどうか
        this.hand = [];      // 手札
        this.deck = [];      // 山札
        this.discard = [];   // 捨て札
        this.playArea = [];  // プレイエリア
        this.actions = 0;    // アクション数
        this.buys = 0;       // 購入数
        this.coins = 0;      // コイン数
        this.random = Math.random; // シャッフルに使う乱数（Game がシード付きの乱数に差し替える）
        this.merchantBonus = 0;      // このターンにプレイした商人の数（最初の銀貨で財宝+1ずつ）
        this.hasPlayedSilver = false; // このターンに銀貨をプレイしたか
        
        // ===== 海辺 =====
        this.durations = [];          // 次のターンの開始時に効果がある持続カード { card, effect }
        this.setAside = [];           // 停泊所・封鎖で脇に置いたカード
        this.mats = { island: [], nativeVillage: [] }; // 島マット・原住民の村マット
        this.gainedThisTurn = [];     // このターンに獲得したカードのID（密輸人）
        this.gainedLastTurn = [];     // 直前のターンに獲得したカードのID
        this.gainedVictoryInBuyPhase = false; // 購入フェーズに勝利点カードを獲得したか（宝物庫）
        this.outpostPending = false;  // 前哨地による追加のターンを行うか
        this.sailorUses = 0;          // 獲得した持続カードをプレイできる残り回数（船乗り）
        this.monkeys = 0;             // 右隣のプレイヤーの獲得でカードを引く枚数（猿）
        this.blockades = [];          // 封鎖で脇に置いたカード { cardId, victims }
        this.corsairVictims = new Set();      // 私掠船の攻撃を受けているプレイヤー
        this.hasTrashedForCorsair = false;    // このターンに私掠船で財宝を廃棄したか
    }
    
    // 持続カードを登録し、次のターンの開始時まで場に残す（effect が null なら場に残るだけ）
    addDuration(card, effect) {
        this.durations.push({ card, effect });
    }
    
    // 持続の効果が残っていて、クリーンアップで場に残すカードか
    hasPendingDuration(card) {
        return this.durations.some(duration => duration.card === card);
    }
    
    // プレイヤーが持つすべてのカード（マットや脇に置いたカードも含む）
    getAllCards() {
        return [
            ...this.hand, ...this.deck, ...this.discard, ...this.playArea,
            ...this.setAside, ...this.mats.island, ...this.mats.nativeVillage
        ];
    }
    
    // 初期デッキを作成
    createInitialDeck() {
        // 初期デッキは銅貨7枚と屋敷3枚
        for (let i = 0; i < 7; i++) {
            this.deck.push(new Card(ALL_CARDS.COPPER));
        }
        for (let i = 0; i < 3; i++) {
            this.deck.push(new Card(ALL_CARDS.ESTATE));
        }
        
        // デッキをシャッフル
        this.shuffleDeck();
    }
    
    // デッキをシャッフル
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    // 山札の一番上のカードを取り出す。山札が空なら捨て札をシャッフルして山札にする（どちらも空なら null）
    takeTopCard() {
        if (this.deck.length === 0) {
            if (this.discard.length === 0) {
                return null;
            }
            this.deck = [...this.discard];
            this.discard = [];
            this.shuffleDeck();
        }
        return this.deck.shift();
    }
    
    // カードを引く（指定枚数）
    drawCards(count) {
        const drawnCards = [];
        
        for (let i = 0; i < count; i++) {
            const card = this.takeTopCard();
            if (!card) break;
            this.hand.push(card);
            drawnCards.push(card);
        }
        
        return drawnCards;
    }
    
    // カードを捨てる
    discardCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            const card = this.hand.splice(cardIndex, 1)[0];
            this.discard.push(card);
            return card;
        }
        return null;
    }
    
    // カードを廃棄する（サプライに戻す）
    trashCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            return this.hand.splice(cardIndex, 1)[0];
        }
        return null;
    }
    
    // カードをプレイする
    playCard(cardIndex, game) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            const card = this.hand.splice(cardIndex, 1)[0];
            this.playArea.push(card);
            
            // カードの効果を適用
            card.play(this, game);
            
            return card;
        }
        return null;
    }
    
    // カードを獲得する（サプライから）
    gainCard(cardId, destination = 'discard') {
        // ALL_CARDSのキーは大文字なので、どちらのIDでも受け付ける
        const card = new Card(ALL_CARDS[cardId.toUpperCase()]);
        
        if (destination === 'hand') {
            this.hand.push(card);
        } else if (destination === 'deck') {
            this.deck.unshift(card); // 山札の一番上に置く
        } else if (destination === 'setAside') {
            this.setAside.push(card);
        } else {
            this.discard.push(card); // デフォルトは捨て札に加える
        }
        
        return card;
    }
    
    // 手札の財宝カードをすべてプレイ
    playAllTreasures(game) {
        const treasureIndices = [];
        
        // 手札から財宝カードのインデックスを見つける
        this.hand.forEach((card, index) => {
            if (card.isType(CARD_TYPES.TREASURE)) {
                treasureIndices.push(index);
            }
        });
        
        // インデックスの大きい順に処理（小さいインデックスが削除されても問題ないように）
        treasureIndices.sort((a, b) => b - a).forEach(index => {
            const card = this.hand.splice(index, 1)[0];
            this.playArea.push(card);
            this.coins += card.value;
            card.play(this, game); // アストロラーベのように効果のある財宝
            
            // 私掠船の攻撃を受けていれば、このターン最初の銀貨か金貨を（財宝を得た後で）廃棄する
            if (['silver', 'gold'].includes(card.id) && !this.hasTrashedForCorsair && game?.isCorsairTarget(this)) {
                this.hasTrashedForCorsair = true;
                this.playArea.splice(this.playArea.indexOf(card), 1);
                game.trash.push(card);
                game.log(`${this.name}は私掠船の効果で${card.name}を廃棄しました`);
            }
            
            // 商人：このターン最初の銀貨で、プレイした商人1枚につき財宝+1
            if (card.id === 'silver' && !this.hasPlayedSilver) {
                this.hasPlayedSilver = true;
                if (this.merchantBonus > 0) {
                    this.coins += this.merchantBonus;
                    game?.log(`${this.name}は商人の効果で財宝+${this.merchantBonus}を得ました`);
                }
            }
        });
        
        return treasureIndices.length;
    }
    
    // クリーンアップフェーズ（前哨地の追加のターンの前は3枚だけ引く）
    cleanup(drawCount = 5) {
        // 手札と場のカードを捨て札にする（効果の残っている持続カードは場に残す）
        const staying = this.playArea.filter(card => this.hasPendingDuration(card));
        this.discard.push(...this.hand, ...this.playArea.filter(card => !staying.includes(card)));
        this.hand = [];
        this.playArea = staying;
        
        // 新しいターンのために引く
        this.drawCards(drawCount);
        
        // アクション、購入、コインをリセット
        this.actions = 1;
        this.buys = 1;
        this.coins = 0;
        this.merchantBonus = 0;
        this.hasPlayedSilver = false;
        this.sailorUses = 0;
    }
    
    // プレイヤーの勝利点を計算
    calculateVictoryPoints() {
        let points = 0;
        
        // すべてのカード（手札、山札、捨て札、場のカード、マットなど）を調べる
        const allCards = this.getAllCards();
        
        allCards.forEach(card => {
            points += card.getVictoryPoints(allCards);
        });
        
        return points;
    }
}

// クラスをエクスポート
export default Player;