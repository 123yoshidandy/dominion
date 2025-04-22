/**
 * ドミニオンのカードモデル
 */

// カードクラス
class Card {
    constructor(cardData) {
        this.id = cardData.id;
        this.name = cardData.name;
        this.cost = cardData.cost;
        this.types = cardData.types;
        this.description = cardData.description;
        
        // 財宝カード特有のプロパティ
        if (cardData.value !== undefined) {
            this.value = cardData.value;
        }
        
        // 勝利点カード特有のプロパティ
        if (cardData.points !== undefined) {
            this.points = cardData.points;
        }
        
        // アクションカード特有のプロパティ
        if (cardData.onPlay) {
            this.onPlay = cardData.onPlay;
        }
        
        // リアクションカード特有のプロパティ
        if (cardData.isReaction) {
            this.isReaction = true;
            this.onReact = cardData.onReact;
        }
        
        // 攻撃カード特有のプロパティ
        if (cardData.isAttack) {
            this.isAttack = true;
        }
    }
    
    // カードのタイプをチェックするユーティリティメソッド
    isType(type) {
        return this.types.includes(type);
    }
    
    // カードをプレイする
    play(player, game) {
        if (this.onPlay) {
            this.onPlay(player, game);
        }
    }
    
    // 攻撃に対する反応を処理する
    react(player, game, attacker) {
        if (this.isReaction && this.onReact) {
            return this.onReact(player, game, attacker);
        }
        return false;
    }
}

// クラスをエクスポート
export default Card;