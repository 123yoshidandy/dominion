/**
 * 拡張「夜想曲」の仕組み：祝福と呪詛の山、状態、家宝、ゾンビ、取り替え子
 * 祝福・呪詛のデータは card-data.js の BOONS・HEXES にある（effect(player, game) で効果を使う）
 * Game.prototype に、準備・祝福を受ける・呪詛を受ける・状態を受け取る処理を加える
 */

import Card from './card.js';
import { ALL_CARDS, CARD_TYPES, BOONS, HEXES, ZOMBIE_CARD_IDS } from './card-data.js';

// クリーンアップまで手元に残す祝福（野・森・川の恵み）
const KEPT_BOONS = ['the_fields_gift', 'the_forests_gift', 'the_rivers_gift'];

const nocturneMethods = {
    // 準備：祝福・呪詛の山、ドルイドの3枚、家宝、ゾンビ
    setupNocturne() {
        const kingdom = this.selectedKingdomCards.map(id => ALL_CARDS[id.toUpperCase()]).filter(Boolean);
        const hasType = (type) => kingdom.some(data => data.types.includes(type));
        this.boonDeck = [];
        this.boonDiscard = [];
        this.hexDeck = [];
        this.hexDiscard = [];
        this.druidBoons = [];
        this.lostInTheWoods = null; // 森で迷うを持っているプレイヤー
        if (hasType(CARD_TYPES.FATE)) {
            this.boonDeck = this.shuffle(Object.values(BOONS).map(data => data.id));
            // 沼の恵みのため、ウィル・オ・ウィスプをサプライ外に置く
            this.nonSupply.will_o_wisp = 12;
            if (this.isInSupply('druid')) this.druidBoons = this.boonDeck.splice(0, 3);
        }
        if (hasType(CARD_TYPES.DOOM)) {
            this.hexDeck = this.shuffle(Object.values(HEXES).map(data => data.id));
        }
        // 死霊術師：3種のゾンビを廃棄置き場に置く
        if (this.isInSupply('necromancer')) {
            this.trash.push(...ZOMBIE_CARD_IDS.map(id => new Card(ALL_CARDS[id.toUpperCase()])));
        }
        // 家宝：王国カードにあれば、初期デッキの銅貨1枚の代わりに入れる
        this.heirlooms = kingdom.map(data => data.heirloom).filter(Boolean);
    },

    getBoon(id) {
        return BOONS[id.toUpperCase()];
    },

    getHex(id) {
        return HEXES[id.toUpperCase()];
    },

    // 祝福の山の一番上を取る（なければ捨て札をシャッフルする）
    takeBoon() {
        if (this.boonDeck.length === 0) {
            this.boonDeck = this.shuffle(this.boonDiscard.splice(0));
        }
        return this.boonDeck.shift() ?? null;
    },

    // 祝福を受ける（id を渡さなければ山の一番上）。discard が false なら捨て札にしない（ドルイド）
    receiveBoon(player, id = null, { discard = true } = {}) {
        const boonId = id ?? this.takeBoon();
        if (!boonId) return null;
        const boon = this.getBoon(boonId);
        this.log(`${player.name}は${boon.name}を受けました`);
        if (discard) {
            if (KEPT_BOONS.includes(boonId)) {
                player.keptBoons.push(boonId);
            } else {
                this.boonDiscard.push(boonId);
            }
        }
        boon.effect(player, this);
        return boonId;
    },

    // 呪詛の山の一番上を取る
    takeHex() {
        if (this.hexDeck.length === 0) {
            this.hexDeck = this.shuffle(this.hexDiscard.splice(0));
        }
        return this.hexDeck.shift() ?? null;
    },

    // 呪詛を受ける（id を渡さなければ山の一番上）
    receiveHex(player, id = null) {
        const hexId = id ?? this.takeHex();
        if (!hexId) return;
        if (!id) this.hexDiscard.push(hexId);
        const hex = this.getHex(hexId);
        this.log(`${player.name}は${hex.name}を受けました`);
        hex.effect(player, this);
    },

    // 他のプレイヤーは次の呪詛を受ける（同じ呪詛を全員が受ける。アタックなので防げる）
    othersReceiveNextHex(attacker) {
        const hexId = this.takeHex();
        if (!hexId) return;
        this.hexDiscard.push(hexId);
        this.log(`${this.getHex(hexId).name}が公開されました`);
        this.attackOtherPlayers(attacker, (target) => this.receiveHex(target, hexId));
    },

    // 状態を受け取る（妄想・羨望・不幸）。森で迷うはゲームに1枚だけで、受け取った人が持つ
    takeState(player, state) {
        if (state === 'lostInTheWoods') {
            this.lostInTheWoods = player;
            this.log(`${player.name}は森で迷うを受け取りました`);
            return;
        }
        if (state === 'miserable') {
            player.states.miserable = Math.min(2, player.states.miserable + 1);
            this.log(`${player.name}は${player.states.miserable === 2 ? '二重の不幸' : '不幸'}を受け取りました`);
            return;
        }
        if (player.states.deluded || player.states.envious) return;
        player.states[state] = true;
        this.log(`${player.name}は${state === 'deluded' ? '妄想' : '羨望'}を受け取りました`);
    },

    // 購入フェーズの開始時：妄想（アクションを購入できない）・羨望（銀貨と金貨は財宝1）を戻して、このターンに効かせる
    applyStatesAtBuyPhase(player) {
        if (player.states.deluded) {
            player.states.deluded = false;
            this.turnState.deluded = true;
            this.log(`${player.name}は妄想を戻しました（このターンはアクションを購入できません）`);
        }
        if (player.states.envious) {
            player.states.envious = false;
            this.turnState.envious = true;
            this.log(`${player.name}は羨望を戻しました（このターンは銀貨と金貨が財宝1になります）`);
        }
    },

    // ターンの開始時：森で迷うを持っていれば、手札を1枚捨てて祝福を受けてもよい
    promptLostInTheWoods(player) {
        if (this.lostInTheWoods !== player || player.hand.length === 0) return;
        this.promptSelect({
            player,
            cards: player.hand,
            min: 0,
            max: 1,
            title: '森で迷う',
            message: '手札を1枚捨てると、祝福を受けます（選ばなくてもかまいません）。',
            confirmLabel: '捨てる',
            purpose: 'lost-in-the-woods',
            callback: ([index]) => {
                if (index === undefined) return;
                this.discardFromHand(player, [index]);
                this.receiveBoon(player);
            }
        });
    },

    // 取り替え子：コスト3以上のカードを獲得したとき、取り替え子と交換してもよい（獲得したカードを山に戻す）
    promptChangeling(player, card) {
        if (!this.isInSupply('changeling') || !(this.supply.changeling > 0) || card.id === 'changeling') return;
        if (this.getCost(card) < 3) return;
        const pileId = this.pileOf[card.id] ?? card.id;
        if (this.supply[pileId] === undefined && this.nonSupply[pileId] === undefined) return;
        this.runNext(() => {
            if (!player.discard.includes(card) && !player.hand.includes(card) && !player.deck.includes(card)) return;
            this.promptConfirm({
                player,
                card,
                title: '取り替え子',
                message: `獲得した${card.name}を取り替え子と交換しますか？`,
                yesLabel: '交換する',
                noLabel: '交換しない',
                purpose: 'changeling-exchange',
                callback: (yes) => {
                    if (!yes || !this.returnToSupply(player, card)) return;
                    this.supply.changeling--;
                    player.discard.push(new Card(ALL_CARDS.CHANGELING));
                    this.log(`${player.name}は${card.name}を取り替え子と交換しました`);
                }
            });
        });
    }
};

export function installNocturne(Game) {
    Object.assign(Game.prototype, nocturneMethods);
}
