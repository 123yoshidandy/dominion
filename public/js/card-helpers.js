/**
 * 拡張のカードデータで共通に使う効果の部品
 */

import { CARD_TYPES } from './card-types.js';

export const isAction = (card) => card.types.includes(CARD_TYPES.ACTION);
export const isTreasure = (card) => card.types.includes(CARD_TYPES.TREASURE);
export const isVictory = (card) => card.types.includes(CARD_TYPES.VICTORY);
export const isCurse = (card) => card.types.includes(CARD_TYPES.CURSE);
export const names = (cards) => cards.map(card => card.name).join('・');

// +カード・+アクション・+購入・+財宝・+財源・+勝利点トークンをまとめて得て、ログに書く
export function gainBenefits(player, game, benefits, source = '') {
    // カメレオンの習性で使っている間は、+カードと+財宝を入れ替える
    // （+カードは drawCards が財宝に変える。+財宝は、ここでカメレオンを外してカードを引く）
    if (player.chameleonActive && (benefits.coins ?? 0) > 0) {
        player.chameleonActive = false;
        player.drawCards(benefits.coins);
        player.chameleonActive = true;
        game.log(`${player.name}はカメレオンの習性で、財宝+${benefits.coins}の代わりにカードを${benefits.coins}枚引きました`);
        return applyBenefits(player, game, { ...benefits, coins: 0 }, source);
    }
    return applyBenefits(player, game, benefits, source);
}

function applyBenefits(player, game, { cards = 0, actions = 0, buys = 0, coins = 0, coffers = 0, vp = 0 }, source = '') {
    if (cards > 0) player.drawCards(cards);
    player.actions += actions;
    player.buys += buys;
    player.coins += coins;
    player.coffers += coffers;
    player.vpTokens += vp;

    const parts = [
        [actions, 'アクション'], [buys, '購入'], [coins, '財宝'], [coffers, '財源'], [vp, '勝利点トークン']
    ].filter(([amount]) => amount > 0).map(([amount, label]) => `${label}+${amount}`);
    const prefix = `${player.name}は${source ? `${source}の効果で` : ''}`;
    if (cards > 0 && parts.length > 0) {
        game.log(`${prefix}カードを${cards}枚引き、${parts.join('、')}を得ました`);
    } else if (cards > 0) {
        game.log(`${prefix}カードを${cards}枚引きました`);
    } else if (parts.length > 0) {
        game.log(`${prefix}${parts.join('、')}を得ました`);
    }
}

// 手札から min〜max 枚を選ばせる（手札がなければ何もしない）。callback には選んだカードの配列が渡る
export function promptFromHand(game, player, { min = 1, max = 1, filter = () => true, title, message, confirmLabel = '決定', purpose, callback }) {
    const cards = player.hand.filter(filter);
    if (cards.length === 0) return;
    const all = cards.length === player.hand.length;
    game.promptSelect({
        player,
        cards: all ? player.hand : cards,
        min,
        max,
        title,
        message,
        confirmLabel,
        purpose,
        // 手札そのものを渡すと手札と同じ順に並ぶ。選んだ後に手札が変わってもよいよう、先にカードに直す
        callback: (indices) => callback(indices.map(index => (all ? player.hand : cards)[index]))
    });
}

// 手札のカードを廃棄させる。callback には廃棄したカードの配列が渡る
export function promptTrashFromHand(game, player, { min = 1, max = 1, filter, title, message, purpose, callback = () => {} }) {
    if (!player.hand.some(filter ?? (() => true))) {
        callback([]);
        return;
    }
    promptFromHand(game, player, {
        min, max, filter, title, message, purpose, confirmLabel: '廃棄する',
        callback: (cards) => {
            const trashed = game.trashFromHand(player, cards.map(card => player.hand.indexOf(card)));
            if (trashed.length > 0) game.log(`${player.name}は${names(trashed)}を廃棄しました`);
            callback(trashed);
        }
    });
}

// 手札を指定枚数捨てさせる（手札が足りなければ全部）。callback には捨てたカードの配列が渡る
export function promptDiscardFromHand(game, player, count, title, { optional = false, purpose = 'discard-down', message, callback = () => {} } = {}) {
    const discardCount = Math.min(count, player.hand.length);
    if (discardCount <= 0) {
        callback([]);
        return;
    }
    game.promptSelect({
        player,
        cards: player.hand,
        min: optional ? 0 : discardCount,
        max: discardCount,
        title,
        message: message ?? `捨てるカードを${discardCount}枚選んでください。`,
        confirmLabel: '捨てる',
        purpose,
        callback: (indices) => {
            const discarded = game.discardFromHand(player, indices);
            if (discarded.length > 0) game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
            callback(discarded);
        }
    });
}

// 手札が count 枚になるまで捨てさせる
export function discardDownTo(game, player, count, title) {
    promptDiscardFromHand(game, player, player.hand.length - count, title, {
        message: `手札が${count}枚になるように、捨てるカードを${player.hand.length - count}枚選んでください。`
    });
}

// 山札の上から count 枚を取り出す（足りなければ捨て札をシャッフルする）
export function takeTopCards(player, count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
        const card = player.takeTopCard();
        if (!card) break;
        cards.push(card);
    }
    return cards;
}

// カードを好きな順で山札の上に戻す（一番上に置くカードを1枚ずつ選ぶ）
export function putBackInAnyOrder(game, player, cards, title, { chooser = player } = {}) {
    const remaining = [...cards];
    const placed = []; // 上から順
    const step = () => {
        const distinct = new Set(remaining.map(card => card.id));
        if (distinct.size <= 1) {
            placed.push(...remaining);
            player.deck.unshift(...placed);
            if (placed.length > 0) game.log(`${player.name}はカードを${placed.length}枚山札の上に戻しました`);
            return;
        }
        game.promptSelect({
            player: chooser,
            cards: [...remaining],
            min: 1,
            max: 1,
            title,
            message: `山札の上に戻すカードです。${placed.length === 0 ? '一番上' : `上から${placed.length + 1}枚目`}に置くカードを選んでください。`,
            confirmLabel: '置く',
            purpose: 'put-back',
            callback: ([index]) => {
                placed.push(remaining.splice(index, 1)[0]);
                game.runNext(step);
            }
        });
    };
    step();
}

// 手札を公開したことをログに書く
export function logReveal(game, player, cards, what = '手札') {
    game.log(`${player.name}は${what}を公開しました（${cards.length > 0 ? names(cards) : 'なし'}）`);
    // 公開されたときの効果（後援者）
    cards.filter(card => card.onReveal).forEach(card => card.onReveal(player, game, card));
}

// 手札が条件を満たさないときに他のプレイヤーへの攻撃を書くための、呪いを獲得させる攻撃
export const curseAttack = (game, attacker) => game.attackOtherPlayers(attacker, (target) => game.gainCurse(target));
