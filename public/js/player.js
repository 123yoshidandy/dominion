/**
 * ドミニオンのプレイヤーモデル
 */

import Card from './card.js';
import { ALL_CARDS, CARD_TYPES } from './card-data.js';

// プレイヤークラス
class Player {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.hand = [];      // 手札
        this.deck = [];      // 山札
        this.discard = [];   // 捨て札
        this.playArea = [];  // プレイエリア
        this.actions = 0;    // アクション数
        this.buys = 0;       // 購入数
        this.coins = 0;      // コイン数
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
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    // カードを引く（指定枚数）
    drawCards(count) {
        const drawnCards = [];
        
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                // 山札が空の場合、捨て札を山札に戻してシャッフル
                if (this.discard.length === 0) {
                    // 捨て札も空なら引けない
                    break;
                }
                
                this.deck = [...this.discard];
                this.discard = [];
                this.shuffleDeck();
            }
            
            // 山札の一番上のカードを手札に加える
            if (this.deck.length > 0) {
                const card = this.deck.shift();
                this.hand.push(card);
                drawnCards.push(card);
            }
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
        });
        
        return treasureIndices.length;
    }
    
    // クリーンアップフェーズ
    cleanup() {
        // 手札と場のカードをすべて捨て札にする
        this.discard.push(...this.hand, ...this.playArea);
        this.hand = [];
        this.playArea = [];
        
        // 新しいターンのために5枚引く
        this.drawCards(5);
        
        // アクション、購入、コインをリセット
        this.actions = 1;
        this.buys = 1;
        this.coins = 0;
    }
    
    // プレイヤーの勝利点を計算
    calculateVictoryPoints() {
        let points = 0;
        
        // すべてのカード（手札、山札、捨て札、場のカード）を調べる
        const allCards = [...this.hand, ...this.deck, ...this.discard, ...this.playArea];
        
        allCards.forEach(card => {
            if (card.points !== undefined) {
                points += card.points;
            }
        });
        
        return points;
    }
}

// クラスをエクスポート
export default Player;