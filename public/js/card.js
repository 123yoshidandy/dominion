/**
 * ドミニオンのカードモデル
 */

import { CARD_TYPES } from './card-types.js';

// カードクラス
// カードデータの値と効果（onPlay・onGain・onTrash など）をそのまま持つ。効果の種類はカードデータの各ファイルに書いてある
class Card {
    constructor(cardData) {
        Object.assign(this, cardData);
        delete this.count;

        // アタック・リアクションは isAttack・isReaction などで指定するので、種類の表示用に types へ加える
        const extraTypes = [];
        if (cardData.isAttack) extraTypes.push(CARD_TYPES.ATTACK);
        if (cardData.isReaction || cardData.reactionType) extraTypes.push(CARD_TYPES.REACTION);
        this.types = [...cardData.types, ...extraTypes.filter(type => !cardData.types.includes(type))];
    }

    // カードのタイプをチェックするユーティリティメソッド
    isType(type) {
        return this.types.includes(type);
    }

    // カードをプレイする（祝宴のように自分自身を扱う効果のため、カード自身も渡す）
    play(player, game) {
        // 山に置いたトークン（冒険）とチャンピオンのボーナスを最初に得る
        game?.applyPlayBonuses?.(player, this);
        // このターンにプレイしたアクションの数（共謀者）
        if (game?.turnState && this.isType(CARD_TYPES.ACTION)) {
            game.turnState.actionsPlayed++;
        }
        // プレイする前に起きる効果（浮浪児）があれば、それを先に処理してから効果を使う
        const before = game?.getBeforePlaySteps?.(player, this) ?? [];
        if (before.length > 0) {
            game.runNext(...before, () => this.onPlay?.(player, game, this));
            return;
        }
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
