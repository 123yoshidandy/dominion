/**
 * 拡張「同盟」の仕組み：恩恵トークン、同盟の札、4種で1山の山を回す、「1つを選ぶ」効果
 * - 連絡役が王国にあれば、同盟の札（LANDSCAPES の kind: 'ally'）を1枚使い、各プレイヤーは恩恵トークンを1つ持って始める
 * - このターンに続く効果（ガレリア・ギルドの親方・散兵・守備隊・装身具）は turnState に記録し、獲得したときに起こす
 * Game.prototype に処理を加える
 */

import { ALL_CARDS, CARD_TYPES, LANDSCAPES } from './card-data.js';
import { LANDSCAPE_KINDS } from './card-types.js';
import { discardDownTo } from './card-helpers.js';

// 中身に連絡役のあるカードか（山の中身も見る）
const hasLiaison = (data) => data && (data.types.includes(CARD_TYPES.LIAISON) ||
    (data.pileCards ?? []).some(id => ALL_CARDS[id.toUpperCase()]?.types.includes(CARD_TYPES.LIAISON)));

const alliesMethods = {
    // 同盟の札を選び、恩恵トークンを配る（initializeSupply から呼ぶ）。options.ally が null なら使わない
    setupAllies() {
        const allyOption = this.options.ally;
        const alreadyChosen = this.landscapes.some(id => this.getLandscape(id)?.kind === LANDSCAPE_KINDS.ALLY);
        if (!alreadyChosen && allyOption !== null) {
            const liaison = this.selectedKingdomCards.some(id => hasLiaison(ALL_CARDS[id.toUpperCase()]));
            if (allyOption || liaison) {
                const pool = Object.values(LANDSCAPES).filter(data => data.kind === LANDSCAPE_KINDS.ALLY).map(data => data.id);
                this.landscapes.push(allyOption ?? pool[Math.floor(this.random() * pool.length)]);
            }
        }
        const usesAlly = this.getAllies().length > 0;
        // 輸入業者：準備で各プレイヤーは恩恵 +4
        const setupFavors = (usesAlly ? 1 : 0) +
            Object.keys(this.supply).reduce((sum, id) => sum + (ALL_CARDS[id.toUpperCase()]?.setupFavors ?? 0), 0);
        this.players.forEach(player => { player.favors += setupFavors; });
    },

    // シャッフルしたときの同盟の札（占星術師団・石工団）を、初期デッキを配った後から効かせる
    installShuffleHooks() {
        const hooks = this.getAllies().filter(ally => ally.onShuffle);
        if (hooks.length === 0) return;
        this.players.forEach(player => {
            player.onShuffle = () => hooks.forEach(ally => {
                if (player.favors > 0) ally.onShuffle(this, player);
            });
        });
    },

    // 使う同盟の札
    getAllies() {
        return this.landscapes.map(id => this.getLandscape(id)).filter(data => data?.kind === LANDSCAPE_KINDS.ALLY);
    },

    gainFavors(player, amount, source = '') {
        if (amount <= 0) return;
        player.favors += amount;
        this.log(`${player.name}は${source ? `${source}で` : ''}恩恵 +${amount}（${player.favors}）`);
    },

    spendFavors(player, amount, source = '') {
        const spent = Math.min(amount, player.favors);
        if (spent <= 0) return;
        player.favors -= spent;
        this.log(`${player.name}は${source ? `${source}で` : ''}恩恵を${spent}つ使いました（残り${player.favors}）`);
    },

    // 「1つを選ぶ」効果の選択肢を選ばせる（count 個）。長老でプレイしたカードは、このターン、別の選択肢をもう1つ選んでもよい
    promptAbilities({ player, card = null, options, count = 1, title, message, purpose, callback }) {
        const extra = card?.elderTurn === this.turnCount && options.length > count ? 1 : 0;
        this.promptChoose({
            player,
            card,
            options,
            min: count,
            max: count + extra,
            title,
            message: message ?? (extra > 0
                ? `${count}つを選んでください（長老の効果で、もう1つ選べます）。`
                : (count === 1 ? '1つを選んでください。' : `違うものを${count}つ選んでください。`)),
            purpose,
            callback: (indices) => callback([...indices].sort((a, b) => a - b))
        });
    },

    // 4種で1山の山を回す：一番上のカードと同じ名前のカードを、すべて一番下に移す
    rotatePile(pileId) {
        const cards = this.pileCards[pileId];
        if (!cards || cards.length === 0) return;
        const top = cards[0];
        const count = cards.findIndex(id => id !== top);
        if (count < 0) return;
        this.pileCards[pileId] = [...cards.slice(count), ...cards.slice(0, count)];
        this.log(`${this.getPileName(pileId)}が一番上になるように、山を回しました`);
    },

    // 回すと一番上のカードが変わる山か
    canRotate(pileId) {
        const cards = this.pileCards[pileId];
        return Boolean(cards) && this.supply[pileId] > 0 && new Set(cards).size > 1;
    },

    // 指定した山を回してもよい
    promptRotate(player, pileId) {
        if (!this.canRotate(pileId)) return;
        const next = ALL_CARDS[this.pileCards[pileId].find(id => id !== this.pileCards[pileId][0]).toUpperCase()];
        this.promptConfirm({
            player,
            title: ALL_CARDS[pileId.toUpperCase()].name,
            message: `${ALL_CARDS[pileId.toUpperCase()].name}の山を回して、一番上を${next.name}にしますか？（今は${this.getPileName(pileId)}）`,
            yesLabel: '回す',
            noLabel: '回さない',
            purpose: 'rotate',
            callback: (yes) => { if (yes) this.rotatePile(pileId); }
        });
    },

    // サプライの山を1つ回してもよい（作戦）。回して変わる山だけを選べる
    promptRotateAny(player) {
        const pileIds = Object.keys(this.pileCards).filter(pileId => this.canRotate(pileId));
        if (pileIds.length === 0) return;
        this.promptChoose({
            player,
            options: ['回さない', ...pileIds.map(pileId => `${ALL_CARDS[pileId.toUpperCase()]?.name ?? pileId}（今は${this.getPileName(pileId)}）`)],
            title: '作戦',
            message: '回すサプライの山を選んでください。',
            purpose: 'rotate-any',
            callback: ([index]) => { if (index > 0) this.rotatePile(pileIds[index - 1]); }
        });
    },

    // カードをプレイした後に起きる同盟の札の効果（魔女の集会・書記の組合・商店主連盟）。なければ null
    getAfterPlayStep(player, card) {
        const allies = this.getAllies().filter(ally => ally.afterPlay);
        if (allies.length === 0 || player !== this.getCurrentPlayer()) return null;
        return () => this.runNext(...allies.map(ally => () => ally.afterPlay(this, player, card)));
    },

    // カードを獲得したときの、同盟のカードと同盟の札の効果
    alliesGainSteps(player, card, isCurrent) {
        const steps = [];
        const state = this.turnState;
        if (isCurrent) {
            // 守備隊：獲得するたびにトークンを1つ置く
            state.garrisons.forEach(garrison => { garrison.tokens++; });
            // ガレリア：コスト3か4のカードを獲得するたびに購入 +1
            const cost = this.getCost(card);
            if (state.galleria > 0 && (cost === 3 || cost === 4) && !this.hasExtraCost(card)) {
                player.buys += state.galleria;
                this.log(`${player.name}はガレリアで購入 +${state.galleria}`);
            }
            // ギルドの親方：獲得するたびに恩恵 +1
            if (state.guildmasters > 0) this.gainFavors(player, state.guildmasters, 'ギルドの親方');
            // 散兵：アタックカードを獲得するたびに、他のプレイヤーは手札が3枚になるまで捨てる
            if (state.skirmishers > 0 && card.isType(CARD_TYPES.ATTACK)) {
                for (let i = 0; i < state.skirmishers; i++) {
                    steps.push(() => this.attackOtherPlayers(player, (target) => {
                        if (target.hand.length > 3) discardDownTo(this, target, 3, '散兵');
                    }));
                }
            }
        }
        this.getAllies().filter(ally => ally.gainStep).forEach(ally => steps.push(ally.gainStep(this, player, card, isCurrent)));
        return steps;
    },

    // 手札からプレイできるか（将軍の攻撃・航海の追加のターンの制限）。できなければ理由を残す
    canPlayFromHand(player, card) {
        const limit = this.turnState.handPlayLimit;
        if (limit !== null && this.turnState.handPlays >= limit) {
            this.reject(`このターンは手札からカードを${limit}枚までしかプレイできません（航海）`);
            return false;
        }
        if (card.isType(CARD_TYPES.ACTION) && this.isWarlordTarget(player) &&
            player.playArea.filter(played => played.id === card.id).length >= 2) {
            this.reject(`将軍の効果で、場に2枚以上ある${card.name}はプレイできません`);
            return false;
        }
        return true;
    },

    isWarlordTarget(player) {
        return this.players.some(owner => owner !== player && owner.warlordVictims.has(player));
    },

    // 辻強盗：攻撃を受けていて、このターン最初にプレイする財宝なら、何もしない
    isBlockedByHighwayman(player) {
        if (this.turnState.highwaymanBlocked.has(player)) return false;
        if (!this.players.some(owner => owner !== player && owner.highwaymanVictims.has(player))) return false;
        this.turnState.highwaymanBlocked.add(player);
        return true;
    }
};

export function installAllies(Game) {
    Object.assign(Game.prototype, alliesMethods);
}
