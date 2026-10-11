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
        
        // 勝利点カード特有のプロパティ（庭園のようにデッキによって変わるものは pointsFor で計算する）
        if (cardData.points !== undefined) {
            this.points = cardData.points;
        }
        if (cardData.pointsFor) {
            this.pointsFor = cardData.pointsFor;
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
        
        // 誰かが財宝を獲得したときに手札からプレイされるカード（海賊）
        if (cardData.reactsToTreasureGain) {
            this.reactsToTreasureGain = true;
        }
    }
    
    // カードのタイプをチェックするユーティリティメソッド
    isType(type) {
        return this.types.includes(type);
    }
    
    // カードをプレイする（祝宴のように自分自身を扱う効果のため、カード自身も渡す）
    play(player, game) {
        if (this.onPlay) {
            this.onPlay(player, game, this);
        }
    }
    
    // このカードの勝利点（allCards はプレイヤーが持つすべてのカード）
    getVictoryPoints(allCards) {
        if (this.pointsFor) {
            return this.pointsFor(allCards);
        }
        return this.points ?? 0;
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