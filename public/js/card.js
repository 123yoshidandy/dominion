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
        // 魅了の魔女：魅了を受けたプレイヤーが自分のターンに最初にプレイするアクションは、効果の代わりにカード+1・アクション+1
        if (game?.isEnchanted?.(player, this)) {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}の${this.name}は魅了され、効果の代わりにカードを1枚引き、アクション+1を得ました`);
            return;
        }
        // 効果を使う。習性（移動動物園）があるゲームでは、アクションカードは代わりに習性を使ってもよい
        const original = () => this.onPlay?.(player, game, this);
        const useWays = this.isType(CARD_TYPES.ACTION) && (game?.getWays?.().length ?? 0) > 0;
        const resolve = useWays ? () => game.promptWay(player, this, original) : original;
        // プレイする前に起きる効果（浮浪児・窯）があれば、それを先に処理してから効果を使う
        const before = game?.getBeforePlaySteps?.(player, this) ?? [];
        if (before.length > 0) {
            game.runNext(...before, resolve);
            return;
        }
        resolve();
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
