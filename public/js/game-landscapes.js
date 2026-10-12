/**
 * イベントなど、カードではない横長の札（ランドスケープ）の処理
 * 札のデータは card-data.js の LANDSCAPES にある。kind は 'event'（購入して効果を使う）など
 * Game.prototype に、選び方・購入・アクションの山を選ぶ処理を加える
 */

import Card from './card.js';
import { ALL_CARDS, CARD_TYPES, LANDSCAPES, getKingdomCardIds } from './card-data.js';

// 1ゲームで使う札の数の上限（公式の推奨）
const MAX_LANDSCAPES = 2;

const landscapeMethods = {
    // 使う札を選ぶ。王国カードと札を混ぜた山から、王国カードが10枚出るまで引き、途中で出た札を（2枚まで）使う
    selectLandscapes() {
        if (this.options.landscapes) return [...this.options.landscapes];
        if (this.kingdom) return [];
        const pool = Object.values(LANDSCAPES).filter(data => this.cardSets.includes(data.set)).map(data => data.id);
        if (pool.length === 0) return [];
        const deck = this.shuffle([...getKingdomCardIds(this.cardSets).map(() => null), ...pool]);
        const chosen = [];
        let kingdomCount = 0;
        for (const id of deck) {
            if (kingdomCount >= 10) break;
            if (id === null) {
                kingdomCount++;
            } else if (chosen.length < MAX_LANDSCAPES) {
                chosen.push(id);
            }
        }
        return chosen;
    },

    // 札のデータ
    getLandscape(id) {
        return LANDSCAPES[id.toUpperCase()] ?? null;
    },

    // 札のコスト（カードではないので、橋などの軽減は受けない）
    getLandscapeCost(id) {
        return this.getLandscape(id)?.cost ?? 0;
    },

    // イベントなどを購入する（購入フェーズに、購入回数とコインを使う）
    buyLandscape(id) {
        if (this.isAwaitingPrompt()) return false;
        const player = this.getCurrentPlayer();
        const data = typeof id === 'string' && this.landscapes.includes(id) ? this.getLandscape(id) : null;
        if (!data || !data.onBuy) {
            this.reject('そのイベントは購入できません');
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
        const cost = this.getLandscapeCost(id);
        if (player.coins < cost) {
            this.reject(`${data.name}を購入するためのコインが足りません（必要: ${cost}, 所持: ${player.coins}）`);
            return false;
        }
        if (data.oncePerTurn && this.turnState.eventsBought.includes(id)) {
            this.reject(`${data.name}は1ターンに1回しか購入できません`);
            return false;
        }
        if (data.oncePerGame && player.landscapesBought?.includes(id)) {
            this.reject(`${data.name}は1ゲームに1回しか購入できません`);
            return false;
        }
        if (data.canBuy && !data.canBuy(player, this)) {
            this.reject(`今は${data.name}を購入できません`);
            return false;
        }

        player.buys--;
        player.coins -= cost;
        this.turnState.eventsBought.push(id);
        player.landscapesBought = [...(player.landscapesBought ?? []), id];
        this.log(`${player.name}は${data.name}を購入しました`);
        this.takeDebt(player, data.debtCost ?? 0);
        this.runNext(() => data.onBuy(player, this, data));
        this.processEffects();
        this.notifyStateChanged();
        return true;
    },

    // プロジェクトに自分のキューブを置く（1人1回。以後ずっと効果がある）
    takeProject(player, id) {
        player.projects.add(id);
        this.log(`${player.name}は${this.getLandscape(id).name}にキューブを置きました`);
    },

    // 山の一番上のカードのデータ（空の中身の混ざった山は山の札のデータ）
    getPileTopData(pileId) {
        return ALL_CARDS[(this.getPileTop(pileId) ?? pileId).toUpperCase()] ?? null;
    },

    // 山の名前（中身の混ざった山は一番上のカードの名前）
    getPileName(pileId) {
        return ALL_CARDS[(this.getPileTop(pileId) ?? pileId).toUpperCase()]?.name ?? pileId;
    },

    // サプライの山から、獲得せずに1枚取り除く（相続で脇に置くとき）
    takeFromSupply(cardId) {
        const { pileId, cardId: top } = this.resolvePile(cardId);
        if (!top || !(this.supply[pileId] > 0)) return false;
        this.supply[pileId]--;
        if (this.pileCards[pileId]) this.pileCards[pileId].shift();
        return true;
    },

    // サプライのアクションの山を1つ選ばせる（トークンを置く山など）。callback には山のIDが渡る
    promptActionPile({ player, title, message, purpose, filter = () => true, callback }) {
        const pileIds = Object.keys(this.supply).filter(pileId => {
            const top = ALL_CARDS[(this.getPileTop(pileId) ?? pileId).toUpperCase()];
            return top?.types.includes(CARD_TYPES.ACTION) && filter(pileId);
        });
        if (pileIds.length === 0) return;
        this.promptSelect({
            player,
            cards: pileIds.map(pileId => new Card(ALL_CARDS[(this.getPileTop(pileId) ?? pileId).toUpperCase()])),
            min: 1,
            max: 1,
            title,
            message,
            confirmLabel: '選ぶ',
            purpose,
            callback: ([index]) => callback(pileIds[index])
        });
    }
};

export function installLandscapes(Game) {
    Object.assign(Game.prototype, landscapeMethods);
}
