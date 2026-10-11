/**
 * ドミニオンのCPUプレイヤー
 * ビッグマネー戦略をベースに、相性の良いアクションカードを少し混ぜて戦う
 * DOMには依存せず、Gameのメソッドを呼び出すだけで操作する
 */

import { CARD_TYPES } from './card-data.js';

// アクションを増やすカード（何枚プレイしても他のアクションを妨げない）の優先順
const NON_TERMINAL_PRIORITY = ['village', 'festival', 'laboratory', 'market', 'cellar'];

// アクションを増やさないカード（ターミナル）の優先順
const TERMINAL_PRIORITY = ['witch', 'smithy', 'moat', 'woodcutter', 'chapel'];

// 不要なカード（地下室で捨てる・礼拝堂で廃棄する対象）かどうか
const isJunk = (card) => card.isType(CARD_TYPES.CURSE) || card.isType(CARD_TYPES.VICTORY);

// プレイヤーが持つすべてのカード
const allCardsOf = (player) => [...player.hand, ...player.deck, ...player.discard, ...player.playArea];

// アクションカードをプレイする価値があるか
function isWorthPlaying(card, player) {
    switch (card.id) {
        case 'chapel':
            // 廃棄したい呪いか屋敷が手札にあるときだけ使う
            return player.hand.some(c => c !== card && (c.id === 'curse' || c.id === 'estate'));
        default:
            return true;
    }
}

// 手札からプレイするアクションカードのインデックスを選ぶ（なければ -1）
export function chooseActionCard(player) {
    if (player.actions <= 0) return -1;

    // アクションを増やすカードを先にプレイし、ターミナルは最後に回す
    const priority = [...NON_TERMINAL_PRIORITY, ...TERMINAL_PRIORITY];

    for (const cardId of priority) {
        const index = player.hand.findIndex(card => card.id === cardId && isWorthPlaying(card, player));
        if (index >= 0) return index;
    }

    return -1;
}

// 購入するカードのIDを選ぶ（何も買わないなら null）
export function chooseCardToBuy(player, game) {
    const coins = player.coins;
    const supply = game.supply;
    const provincesLeft = supply.province ?? 0;
    const available = (cardId) => (supply[cardId] ?? 0) > 0;

    // ターミナルのアクションは、デッキ12枚あたり1枚程度に抑える
    const cards = allCardsOf(player);
    const terminalCount = cards.filter(card => TERMINAL_PRIORITY.includes(card.id)).length;
    const canAddTerminal = terminalCount < 1 + Math.floor(cards.length / 12);

    const pick = (candidates) => candidates.find(available) ?? null;

    if (coins >= 8) {
        return pick(['province', 'gold']);
    }
    if (coins >= 6) {
        return provincesLeft <= 4 ? pick(['duchy', 'gold']) : pick(['gold']);
    }
    if (coins >= 5) {
        if (provincesLeft <= 5) return pick(['duchy', 'silver']);

        const actions = ['laboratory', 'market', 'festival'];
        if (canAddTerminal && available('curse')) actions.unshift('witch');
        return pick([...actions, 'silver']);
    }
    if (coins >= 3) {
        if (provincesLeft <= 2) return pick(['estate', 'silver']);
        if (coins === 4 && canAddTerminal) return pick(['smithy', 'silver']);
        return pick(['silver']);
    }
    if (coins >= 2 && provincesLeft <= 2) {
        return pick(['estate']);
    }

    return null;
}

// 選択待ち（地下室・礼拝堂など）で選ぶ手札のインデックス
export function choosePromptSelection(prompt) {
    const { player } = prompt;
    const junkIndices = player.hand
        .map((card, index) => (isJunk(card) ? index : -1))
        .filter(index => index >= 0);

    if (prompt.type === 'trash') {
        // 勝利点は終盤に必要なので、廃棄するのは呪いと屋敷だけにする
        return junkIndices
            .filter(index => ['curse', 'estate'].includes(player.hand[index].id))
            .slice(0, prompt.maxCount);
    }

    // 捨てる場合は、勝利点と呪いをすべて捨てて引き直す
    return junkIndices;
}

// CPUの手番を1手だけ進める
// 選んだ操作が失敗しても、次の段階へ進めることで必ずゲームを前進させる
export function runCpuStep(game) {
    const player = game.getCurrentPlayer();
    if (!player.isCPU || game.phase === 'end') return;

    if (game.pendingPrompt) {
        game.resolvePrompt(choosePromptSelection(game.pendingPrompt));
        return;
    }

    if (game.phase === 'action') {
        const index = chooseActionCard(player);
        if (index < 0 || !game.playActionCard(index)) {
            game.enterBuyPhase();
        }
        return;
    }

    if (game.phase === 'buy') {
        const cardId = player.buys > 0 ? chooseCardToBuy(player, game) : null;
        if (!cardId || !game.buyCard(cardId)) {
            game.endTurn();
        }
    }
}
