/**
 * ドミニオンのCPUプレイヤー
 * ビッグマネー戦略をベースに、相性の良いアクションカードを少し混ぜて戦う
 * DOMには依存せず、Gameのメソッドを呼び出すだけで操作する
 */

import { CARD_TYPES } from './card-data.js';

// アクションを増やすカード（何枚プレイしても他のアクションを妨げない）の優先順
const NON_TERMINAL_PRIORITY = [
    'village', 'bazaar', 'fishing_village', 'festival', 'native_village', 'laboratory', 'market', 'treasury',
    'caravan', 'tide_pools', 'sea_chart', 'sentry', 'poacher', 'lighthouse', 'sailor', 'harbinger', 'merchant',
    'haven', 'lookout', 'warehouse', 'cellar'
];

// アクションを増やさないカード（ターミナル）の優先順
const TERMINAL_PRIORITY = [
    'witch', 'sea_witch', 'artisan', 'wharf', 'council_room', 'library', 'bandit', 'corsair', 'merchant_ship',
    'pirate', 'outpost', 'smithy', 'militia', 'cutpurse', 'blockade', 'monkey', 'salvager', 'mine', 'moneylender',
    'remodel', 'bureaucrat', 'vassal', 'smugglers', 'workshop', 'treasure_map', 'island', 'moat', 'chapel',
    'tactician'
];

// 玉座の間は他のアクションカードがあるときに最優先でプレイする
const PLAY_PRIORITY = ['throne_room', ...NON_TERMINAL_PRIORITY, ...TERMINAL_PRIORITY];

// 不要なカード（地下室で捨てる・礼拝堂で廃棄する対象）かどうか（島のようなアクションの勝利点は除く）
const isJunk = (card) =>
    card.isType(CARD_TYPES.CURSE) || (card.isType(CARD_TYPES.VICTORY) && !card.isType(CARD_TYPES.ACTION));

// プレイヤーが持つすべてのカード
const allCardsOf = (player) => [...player.hand, ...player.deck, ...player.discard, ...player.playArea];

// プレイの優先順位（小さいほど優先。一覧にないカードは最後）
const playRank = (card) => {
    const rank = PLAY_PRIORITY.indexOf(card.id);
    return rank < 0 ? PLAY_PRIORITY.length : rank;
};

// アクションカードをプレイする価値があるか（効果が空振りするならプレイしない）
function isWorthPlaying(card, player, game) {
    const others = player.hand.filter(c => c !== card);
    switch (card.id) {
        case 'salvager':
        case 'island':
            return others.length > 0;
        case 'treasure_map':
            return others.some(c => c.id === 'treasure_map');
        case 'outpost':
            return !game?.isExtraTurn;
        case 'tactician': {
            // 手札の財宝が少ないときだけ、手札を捨てて次のターンに備える
            const coins = others.filter(c => c.isType(CARD_TYPES.TREASURE)).reduce((sum, c) => sum + c.value, 0);
            return others.length > 0 && coins <= 2;
        }
        case 'chapel':
            return others.some(c => c.id === 'curse' || c.id === 'estate');
        case 'moneylender':
            return others.some(c => c.id === 'copper');
        case 'remodel':
            return others.length > 0;
        case 'mine':
            return others.some(c => c.id === 'copper' || c.id === 'silver');
        case 'throne_room':
            return others.some(c => c.isType(CARD_TYPES.ACTION));
        default:
            return true;
    }
}

// 手札からプレイするアクションカードのインデックスを選ぶ（なければ -1）
export function chooseActionCard(player, game) {
    if (player.actions <= 0) return -1;

    // アクションを増やすカードを先にプレイし、ターミナルは最後に回す
    for (const cardId of PLAY_PRIORITY) {
        const index = player.hand.findIndex(card => card.id === cardId && isWorthPlaying(card, player, game));
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

        const actions = ['laboratory', 'bazaar', 'market', 'festival'];
        if (canAddTerminal) {
            if (available('curse')) actions.unshift('witch', 'sea_witch');
            actions.push('wharf', 'council_room', 'library', 'bandit', 'merchant_ship');
        }
        return pick([...actions, 'silver']);
    }
    if (coins >= 3) {
        if (provincesLeft <= 2) return pick(['estate', 'silver']);
        if (coins === 4 && canAddTerminal) return pick(['smithy', 'militia', 'cutpurse', 'moneylender', 'silver']);
        return pick(['silver']);
    }
    if (coins >= 2 && provincesLeft <= 2) {
        return pick(['estate']);
    }

    return null;
}

// カードを手元に残す価値の目安
function keepValue(card) {
    if (card.isType(CARD_TYPES.CURSE)) return -2;
    if (card.isType(CARD_TYPES.VICTORY) && !card.isType(CARD_TYPES.ACTION)) return -1;
    if (card.isType(CARD_TYPES.TREASURE)) return card.value * 2;
    return card.cost; // アクションはコストを価値の目安にする
}

// 手札を残す価値の低い順に並べたインデックス（民兵で捨てるカードを選ぶのに使う）
function indicesByKeepValue(cards) {
    return cards.map((card, index) => index).sort((a, b) => keepValue(cards[a]) - keepValue(cards[b]));
}

// 獲得するカードを選ぶ（購入と同じ判断を使い、合うものがなければ一番高いカード）
function chooseGain(prompt, game) {
    const { cards, player } = prompt;
    const maxCost = Math.max(...cards.map(card => card.cost));
    const wanted = chooseCardToBuy({ ...player, coins: maxCost }, game);
    const index = cards.findIndex(card => card.id === wanted);
    if (index >= 0) return index;

    // 候補はコストの高い順に並んでいる。呪いは選ばない
    const fallback = cards.findIndex(card => !card.isType(CARD_TYPES.CURSE));
    return fallback >= 0 ? fallback : 0;
}

// 選択（手札などからカードを選ぶ）に対する答え：選んだインデックスの配列
function chooseSelection(prompt, game) {
    const { cards, min, max } = prompt;
    const indexOf = (predicate) => cards.findIndex(predicate);

    switch (prompt.purpose) {
        case 'cellar-discard':
            // 勝利点と呪いをすべて捨てて引き直す
            return cards.map((card, index) => (isJunk(card) ? index : -1)).filter(index => index >= 0);

        case 'chapel-trash':
            // 勝利点は終盤に必要なので、廃棄するのは呪いと屋敷だけにする
            return cards
                .map((card, index) => (['curse', 'estate'].includes(card.id) ? index : -1))
                .filter(index => index >= 0)
                .slice(0, max);

        case 'discard-down':
            return indicesByKeepValue(cards).slice(0, min);

        case 'remodel-trash': {
            // 終盤は金貨を属州に、それ以外は不要なカードから改築する
            const lateGame = (game.supply.province ?? 0) <= 4;
            const order = lateGame ? ['gold', 'curse', 'estate', 'copper'] : ['curse', 'estate', 'copper'];
            for (const cardId of order) {
                const index = indexOf(card => card.id === cardId);
                if (index >= 0) return [index];
            }
            return [indicesByKeepValue(cards)[0]];
        }

        case 'mine-trash': {
            // 銀貨→金貨、銅貨→銀貨の順に優先する（金貨しかなければ廃棄しない）
            const silver = indexOf(card => card.id === 'silver');
            if (silver >= 0) return [silver];
            const copper = indexOf(card => card.id === 'copper');
            return copper >= 0 ? [copper] : [];
        }

        case 'throne-room': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            // 玉座の間で玉座の間を選ぶのは、他にないときだけ
            const notThrone = best.find(index => cards[index].id !== 'throne_room');
            return [notThrone ?? best[0]];
        }

        case 'bandit-trash': {
            // 攻撃を受けた側なので、失って痛くない安い方を廃棄する
            const cheapest = cards.map((card, index) => index).sort((a, b) => cards[a].cost - cards[b].cost);
            return [cheapest[0]];
        }

        case 'harbinger': {
            // 捨て札の中で一番価値の高いカードを山札に戻す（銅貨以下なら戻さない）
            const best = indicesByKeepValue(cards).reverse()[0];
            const COPPER_VALUE = 2;
            return keepValue(cards[best]) > COPPER_VALUE ? [best] : [];
        }

        case 'sentry-trash':
            return cards.map((card, index) => (['curse', 'estate'].includes(card.id) ? index : -1)).filter(index => index >= 0);

        case 'sentry-discard':
            // 勝利点と銅貨は引きたくないので捨てる
            return cards.map((card, index) => (isJunk(card) || card.id === 'copper' ? index : -1)).filter(index => index >= 0);

        case 'sentry-top':
            return [indicesByKeepValue(cards).reverse()[0]];

        case 'lookout-trash':
        case 'lookout-discard':
        case 'island':
            return [indicesByKeepValue(cards)[0]];

        case 'haven':
            // 次のターンに一番使いたいカードを脇に置く
            return [indicesByKeepValue(cards).reverse()[0]];

        case 'sailor-trash':
            return cards.map((card, index) => (['curse', 'estate'].includes(card.id) ? index : -1))
                .filter(index => index >= 0).slice(0, 1);

        case 'salvager-trash': {
            for (const cardId of ['curse', 'estate', 'copper']) {
                const index = indexOf(card => card.id === cardId);
                if (index >= 0) return [index];
            }
            return [indicesByKeepValue(cards)[0]];
        }

        case 'artisan-topdeck': {
            // アクションが残っていなければ、手札のアクションカードを次のターンに回す
            if (prompt.player.actions <= 0) {
                const action = indexOf(card => card.isType(CARD_TYPES.ACTION));
                if (action >= 0) return [action];
            }
            return [indicesByKeepValue(cards)[0]];
        }

        case 'gain':
            return [chooseGain(prompt, game)];

        default:
            // 想定外の選択は、条件を満たす最小の枚数を先頭から選ぶ
            return cards.map((card, index) => index).slice(0, min);
    }
}

// はい／いいえの選択に対する答え
function chooseConfirm(prompt) {
    const { player } = prompt;

    switch (prompt.purpose) {
        case 'moneylender':
        case 'vassal-play':
        case 'sailor-play':
            return true;
        case 'native-village':
            // マットに3枚たまるまでは山札の上を置き、たまったら手札に加える
            return player.mats.nativeVillage.length < 3;
        case 'library-skip':
            // アクションが残っていないなら、引いたアクションカードは脇に置いて別のカードを引く
            return player.actions <= 0;
        default:
            return false;
    }
}

// 選択待ちに対する答え（select は配列、confirm は真偽値）
export function choosePromptAnswer(prompt, game) {
    return prompt.type === 'confirm' ? chooseConfirm(prompt) : chooseSelection(prompt, game);
}

// CPUが答えるべき選択待ちがあるか
export function hasCpuPrompt(game) {
    return Boolean(game.pendingPrompt && game.pendingPrompt.player.isCPU);
}

// CPUの手番を1手だけ進める（CPUへの選択待ちがあれば、手番に関係なくそれに答える）
// 操作は人間と同じく game.applyCommand で行い、記録に残す
// 選んだ操作が受け付けられなくても、次の段階へ進めることで必ずゲームを前進させる
export function runCpuStep(game) {
    if (game.phase === 'end') return;

    const prompt = game.pendingPrompt;
    if (prompt) {
        // 人間の選択待ちなら、答えが出るまで待つ
        if (hasCpuPrompt(game)) {
            game.applyCommand(prompt.player.id, { type: 'answer', answer: choosePromptAnswer(prompt, game) });
        }
        return;
    }

    const player = game.getCurrentPlayer();
    if (!player.isCPU) return;
    const apply = (command) => game.applyCommand(player.id, command);

    if (game.phase === 'action') {
        const index = chooseActionCard(player, game);
        if (index < 0 || !apply({ type: 'play', cardIndex: index })) {
            apply({ type: 'buyPhase' });
        }
        return;
    }

    if (game.phase === 'buy') {
        const cardId = player.buys > 0 ? chooseCardToBuy(player, game) : null;
        if (!cardId || !apply({ type: 'buy', cardId })) {
            apply({ type: 'endTurn' });
        }
    }
}
