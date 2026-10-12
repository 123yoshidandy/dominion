/**
 * 拡張「移動動物園」の仕組み：追放マット、習性
 * - 追放したカードは追放マットに置く（得点に数える）。同じカードを獲得したとき、追放マットのそのカードをすべて捨て札にしてもよい
 * - 習性（LANDSCAPES の kind: 'way'）：アクションカードをプレイするとき、本来の効果の代わりに使ってよい（wayEffect(player, game, card)）
 * Game.prototype に処理を加える
 */

import Card from './card.js';
import { ALL_CARDS } from './card-data.js';
import { LANDSCAPE_KINDS } from './card-types.js';

const menagerieMethods = {
    // カードを追放する（手札・場などから取り除いて追放マットに置く）
    exileCard(player, card) {
        player.removeCard(card);
        player.mats.exile.push(card);
        this.log(`${player.name}は${card.name}を追放しました`);
    },

    // サプライの山からカードを1枚追放する（獲得ではない）
    exileFromSupply(player, cardId) {
        const data = this.getPileTopData(this.resolvePile(cardId).pileId);
        if (!data || !this.takeFromSupply(cardId)) return null;
        const card = new Card(data);
        player.mats.exile.push(card);
        this.log(`${player.name}はサプライの${card.name}を追放しました`);
        return card;
    },

    // 同じカードを獲得したとき、追放マットのそのカードをすべて捨て札にしてもよい
    promptDiscardExiled(player, card) {
        const copies = player.mats.exile.filter(exiled => exiled.id === card.id);
        if (copies.length === 0) return;
        this.promptConfirm({
            player,
            card,
            title: '追放マット',
            message: `追放マットの${card.name}（${copies.length}枚）を捨て札にしますか？`,
            yesLabel: '捨て札にする',
            noLabel: 'そのままにする',
            purpose: 'discard-exiled',
            callback: (yes) => {
                if (!yes) return;
                copies.forEach(exiled => player.mats.exile.splice(player.mats.exile.indexOf(exiled), 1));
                player.discard.push(...copies);
                this.log(`${player.name}は追放マットの${card.name}を${copies.length}枚捨て札にしました`);
            }
        });
    },

    // 使う習性
    getWays() {
        return this.landscapes.map(id => this.getLandscape(id)).filter(data => data?.kind === LANDSCAPE_KINDS.WAY);
    },

    // アクションカードをプレイするとき、習性を使うか選ばせる。使わなければ original を呼ぶ
    promptWay(player, card, original) {
        const ways = this.getWays();
        this.promptChoose({
            player,
            card,
            options: [`${card.name}の効果を使う`, ...ways.map(way => `${way.name}：${way.description}`)],
            title: card.name,
            message: '使う効果を選んでください。',
            purpose: 'way',
            callback: ([index]) => {
                if (index === 0) {
                    original();
                    return;
                }
                const way = ways[index - 1];
                this.log(`${player.name}は${card.name}を${way.name}として使いました`);
                way.wayEffect(player, this, card);
            }
        });
    },

    // コストの軽減のうち、カードごとに決まるもの（軍馬・漁師・旅人）
    getSpecialCostReduction(data, player) {
        if (data.id === 'destrier') return player.gainedThisTurn.length;
        if (data.id === 'fisherman') return player.discard.length === 0 ? 3 : 0;
        if (data.id === 'wayfarer') {
            // このターンに最後に獲得した他のカードと同じコストになる
            const last = [...player.gainedThisTurn].reverse().find(id => id !== 'wayfarer');
            if (!last) return 0;
            // 高いカードを獲得していれば、旅人のコストは上がる（軽減が負になる）
            const other = ALL_CARDS[last.toUpperCase()];
            return data.cost - (other?.cost ?? data.cost);
        }
        return 0;
    }
};

export function installMenagerie(Game) {
    Object.assign(Game.prototype, menagerieMethods);
}
