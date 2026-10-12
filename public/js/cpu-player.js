/**
 * ドミニオンのCPUプレイヤー
 * ビッグマネー戦略をベースに、相性の良いアクションカードを少し混ぜて戦う
 * DOMには依存せず、Gameのメソッドを呼び出すだけで操作する
 */

import { CARD_TYPES } from './card-data.js';

// 何度もプレイさせるカード（他のアクションカードがあるときに最優先でプレイする）
const MULTIPLIER_PRIORITY = ['kings_court', 'throne_room', 'coronet', 'disciple', 'crown'];

// アクションを増やすカード（何枚プレイしても他のアクションを妨げない）の優先順
const NON_TERMINAL_PRIORITY = [
    // アクションが2つ以上増える村
    'village', 'university', 'port', 'lost_city', 'bustling_village', 'villa', 'city_quarter', 'encampment', 'blessed_village',
    'cursed_village', 'necropolis', 'bandit_camp', 'fortress', 'wandering_minstrel', 'dame_molly', 'madman',
    'bazaar', 'fishing_village', 'festival', 'native_village', 'workers_village', 'city', 'shanty_town',
    'mining_village', 'border_village', 'farmhands', 'plaza', 'crossroads', 'inn', 'candlestick_maker', 'demesne',
    // アクションが1つ増えるカード
    'patrician', 'emporium', 'settlers', 'chariot_race', 'groundskeeper', 'archive', 'forum',
    'will_o_wisp', 'zombie_spy', 'pixie', 'shepherd', 'secret_cave', 'wish',
    'champion', 'page', 'ratcatcher', 'guide', 'magpie', 'dungeon', 'caravan_guard', 'transmogrify', 'royal_carriage',
    'storyteller', 'raze', 'fugitive', 'treasure_hunter', 'artificer', 'peasant',
    'scrying_pool', 'familiar', 'alchemist', 'apothecary', 'apprentice', 'junk_dealer', 'ironmonger', 'market_square',
    'mystic', 'sir_bailey', 'urchin', 'sage', 'vagrant', 'rats', 'forager', 'rebuild', 'ruined_village', 'grand_market', 'peddler', 'laboratory', 'market', 'treasury', 'highway', 'caravan', 'tide_pools', 'sea_chart',
    'sentry', 'poacher', 'lighthouse', 'sailor', 'hunting_party', 'baker', 'cartographer', 'ferryman', 'herald',
    'advisor', 'joust', 'menagerie', 'wishing_well', 'mill', 'secret_passage', 'upgrade', 'oasis', 'scheme', 'trail',
    'stables', 'wheelwright', 'farrier', 'hamlet', 'lurker', 'pawn', 'harbinger', 'merchant', 'haven', 'lookout', 'warehouse',
    'cellar'
];

// アクションを増やさないカード（ターミナル）の優先順
const TERMINAL_PRIORITY = [
    'possession', 'golem', 'cultist', 'overlord', 'royal_blacksmith', 'enchantress', 'legionary', 'swamp_hag', 'hireling', 'witch', 'haunted_woods', 'giant', 'bridge_troll', 'sea_witch', 'soothsayer', 'torturer', 'young_witch', 'charlatan', 'witchs_hut', 'margrave', 'minion',
    'artisan', 'wharf', 'council_room', 'library', 'patrol', 'courtier', 'nobles', 'rabble', 'jester', 'bandit', 'corsair',
    'merchant_ship', 'pirate', 'outpost', 'smithy', 'diplomat', 'guard_dog', 'journeyman', 'carnival', 'vault',
    'magnate', 'housecarl', 'courser', 'renown', 'militia', 'footpad', 'berserker', 'mint', 'cutpurse', 'blockade',
    'monkey', 'monument', 'bridge', 'nomads', 'conspirator', 'merchant_guild', 'haggler', 'souk', 'baron', 'clerk',
    'swindler', 'ironworks', 'weaver', 'jack_of_all_trades', 'butcher', 'watchtower', 'steward', 'courtyard', 'shop',
    'masquerade', 'salvager', 'mine', 'moneylender', 'spice_merchant', 'bishop', 'trading_post', 'replace', 'expand',
    'forge', 'remake', 'develop', 'trader', 'stonemason', 'infirmary', 'remodel', 'bureaucrat', 'vassal', 'smugglers',
    'workshop', 'treasure_map', 'island', 'moat', 'chapel', 'tactician', 'herbalist', 'transmute',
    // 暗黒時代
    'band_of_misfits', 'hunting_grounds', 'altar', 'pillage', 'rogue', 'dame_anna', 'dame_josephine', 'dame_natalie',
    'dame_sylvia', 'sir_destry', 'sir_martin', 'sir_michael', 'sir_vander', 'count', 'catacombs', 'graverobber',
    'mercenary', 'marauder', 'death_cart', 'armory', 'procession', 'scavenger', 'hermit', 'squire', 'storeroom',
    'poor_house', 'beggar', 'abandoned_mine', 'ruined_library', 'ruined_market', 'survivors',
    // 冒険
    'wine_merchant', 'hero', 'warrior', 'soldier', 'gear', 'ranger', 'messenger', 'amulet', 'miser', 'duplicate',
    'distant_lands', 'teacher',
    // 帝国
    'catapult', 'gladiator', 'engineer', 'temple', 'wild_hunt', 'sacrifice', 'farmers_market', 'small_castle', 'opulent_castle',
    // 夜想曲
    'werewolf', 'tormentor', 'skulk', 'sacred_grove', 'bard', 'tragic_hero', 'pooka', 'necromancer', 'conclave', 'imp', 'fool',
    'leprechaun', 'tracker', 'druid', 'faithful_hound', 'zombie_apprentice', 'zombie_mason'
];

// 夜フェイズにプレイする夜のカードの優先順（獲得の数を見るカードは後に）
const NIGHT_PRIORITY = [
    'raider', 'vampire', 'werewolf', 'ghost', 'crypt', 'cobbler', 'den_of_sin', 'ghost_town', 'guardian', 'night_watchman',
    'exorcist', 'bat', 'changeling', 'monastery', 'devils_workshop'
];

// 買うカードがないときに使うイベント（安くて損のないもの）
const EVENT_BUY_PRIORITY = ['expedition', 'delve', 'scouting_party', 'alms', 'save'];

// ポーションがあるときに買う錬金術のカード（コストの高い順に考える）
const POTION_BUY_PRIORITY = ['golem', 'familiar', 'alchemist', 'scrying_pool', 'apothecary', 'university', 'philosophers_stone'];

const PLAY_PRIORITY = [...MULTIPLIER_PRIORITY, ...NON_TERMINAL_PRIORITY, ...TERMINAL_PRIORITY];

// 不要なカード（地下室で捨てる・礼拝堂で廃棄する対象）かどうか（島のようなアクションの勝利点は除く）
const isJunk = (card) =>
    card.isType(CARD_TYPES.CURSE) || (card.isType(CARD_TYPES.VICTORY) && !card.isType(CARD_TYPES.ACTION) && !card.isType(CARD_TYPES.TREASURE));

// 廃棄したいカード（呪い・屋敷・廃墟・避難所の納屋と草茂る屋敷）
const isTrashTarget = (card) => ['curse', 'estate', 'hovel', 'overgrown_estate'].includes(card.id) || card.isType(CARD_TYPES.RUINS);

// プレイヤーが持つすべてのカード
const allCardsOf = (player) => [...player.hand, ...player.deck, ...player.discard, ...player.playArea];

// プレイの優先順位（小さいほど優先。一覧にないカードは最後）
const playRank = (card) => {
    const rank = PLAY_PRIORITY.indexOf(card.id);
    return rank < 0 ? PLAY_PRIORITY.length : rank;
};

// 条件に合うカードのインデックス
const indicesWhere = (cards, predicate) => cards.map((card, index) => (predicate(card) ? index : -1)).filter(index => index >= 0);

// アクションカードをプレイする価値があるか（効果が空振りするならプレイしない）
function isWorthPlaying(card, player, game) {
    const others = player.hand.filter(c => c !== card);
    const hasTrashFodder = others.some(c => isTrashTarget(c) || c.id === 'copper');
    switch (card.id) {
        case 'salvager':
        case 'island':
        case 'remodel':
        case 'replace':
        case 'expand':
        case 'courtier':
        case 'stonemason':
        case 'transmute':
        case 'apprentice':
        case 'altar':
        case 'junk_dealer':
        case 'forager':
        case 'sacrifice':
        case 'catapult':
        case 'temple':
            return others.length > 0;
        case 'opulent_castle':
            return others.some(c => c.isType(CARD_TYPES.VICTORY));
        case 'crown':
            return others.some(c => c.isType(CARD_TYPES.ACTION));
        case 'procession':
            return others.some(c => c.isType(CARD_TYPES.ACTION) && !c.isType(CARD_TYPES.DURATION));
        case 'treasure_map':
            return others.some(c => c.id === 'treasure_map');
        case 'outpost':
            return !game?.isExtraTurn;
        case 'tactician': {
            // 手札の財宝が少ないときだけ、手札を捨てて次のターンに備える
            const coins = others.filter(c => c.isType(CARD_TYPES.TREASURE)).reduce((sum, c) => sum + (c.value ?? 0), 0);
            return others.length > 0 && coins <= 2;
        }
        case 'chapel':
            return others.some(isTrashTarget);
        case 'moneylender':
            return others.some(c => c.id === 'copper');
        case 'mine':
            return others.some(c => c.id === 'copper' || c.id === 'silver');
        case 'throne_room':
        case 'kings_court':
        case 'coronet':
            return others.some(c => c.isType(CARD_TYPES.ACTION));
        case 'trading_post':
            return others.filter(c => isTrashTarget(c) || c.id === 'copper').length >= 2;
        case 'upgrade':
        case 'remake':
        case 'bishop':
        case 'trader':
        case 'develop':
        case 'forge':
            return hasTrashFodder;
        case 'mint':
        case 'stables':
        case 'spice_merchant':
            return others.some(c => c.isType(CARD_TYPES.TREASURE));
        default:
            return true;
    }
}

// 手札からプレイするアクションカードのインデックスを選ぶ（なければ -1）
export function chooseActionCard(player, game) {
    if (player.actions <= 0) return -1;

    // アクションを増やすカードを先にプレイし、ターミナルは最後に回す（相続した屋敷は、そのカードとして扱う）
    for (const cardId of PLAY_PRIORITY) {
        const index = player.hand.findIndex(card =>
            (card.id === cardId && isWorthPlaying(card, player, game)) || (card.id === 'estate' && player.inheritance === cardId));
        if (index >= 0) return index;
    }

    return -1;
}

// 購入するカードのIDを選ぶ（何も買わないなら null）
export function chooseCardToBuy(player, game) {
    const coins = player.coins;
    const supply = game.supply;
    const provincesLeft = supply.colony ?? supply.province ?? 0;
    const available = (cardId) => (supply[cardId] ?? 0) > 0;

    // ターミナルのアクションは、デッキ12枚あたり1枚程度に抑える
    const cards = allCardsOf(player);
    const terminalCount = cards.filter(card => TERMINAL_PRIORITY.includes(card.id)).length;
    const canAddTerminal = terminalCount < 1 + Math.floor(cards.length / 12);
    const cursesLeft = available('curse');

    const pick = (candidates) => candidates.find(available) ?? null;

    // ポーションがあれば、属州に届かないときは錬金術のカードを買う
    const potionCards = POTION_BUY_PRIORITY.filter(cardId => available(cardId) && !(cardId === 'familiar' && !cursesLeft));
    if ((player.potions ?? 0) > 0 && coins < 8) {
        const affordable = potionCards.filter(cardId => game.getCost(cardId) <= coins);
        if (affordable.length > 0) return affordable[0];
    }
    // 欲しい錬金術のカードがあり、ポーションを持っていなければ、ポーションを買う
    if (potionCards.length > 0 && available('potion') && (coins === 4 || coins === 5) && provincesLeft > 4 &&
        !cards.some(card => card.id === 'potion')) {
        return 'potion';
    }

    if (coins >= 11 && available('colony')) {
        return pick(['colony']);
    }
    if (coins >= 9 && available('platinum')) {
        return provincesLeft <= 4 ? pick(['province', 'platinum']) : pick(['platinum']);
    }
    if (coins >= 8) {
        return pick(['province', 'gold']);
    }
    if (coins >= 6) {
        return provincesLeft <= 4 ? pick(['duchy', 'gold']) : pick(['gold']);
    }
    if (coins >= 5) {
        if (provincesLeft <= 5) return pick(['duchy', 'silver']);

        const actions = ['laboratory', 'bazaar', 'market', 'festival', 'city', 'highway', 'hunting_party', 'baker', 'cartographer',
            'junk_dealer', 'bandit_camp', 'lost_city', 'groundskeeper', 'forum', 'archive'];
        if (canAddTerminal) {
            if (cursesLeft) actions.unshift('witch', 'sea_witch', 'soothsayer', 'torturer', 'charlatan');
            if (available('ruins')) actions.unshift('cultist');
            if (cursesLeft) actions.unshift('swamp_hag');
            actions.push('knights', 'rogue', 'legionary');
            actions.push('margrave', 'wharf', 'council_room', 'library', 'courtier', 'bandit', 'merchant_ship', 'rabble');
        }
        return pick([...actions, 'silver']);
    }
    if (coins >= 3) {
        if (provincesLeft <= 2) return pick(['estate', 'silver']);
        if (coins === 4 && canAddTerminal) {
            return pick([...(cursesLeft ? ['young_witch'] : []), ...(available('ruins') ? ['marauder'] : []), 'villa', 'smithy', 'militia',
                'monument', 'cutpurse', 'moneylender', 'silver']);
        }
        return pick(['silver']);
    }
    if (coins >= 2 && provincesLeft <= 2) {
        return pick(['estate']);
    }

    return chooseWhenStalled(player, game);
}

// 行き詰まったとき（銀貨の山が空になった・ゲームが長引いた）は、山を減らしてゲームを終わらせるため、
// 買えるうちで一番高いカードを買う（呪い・廃墟は買わない）
function chooseWhenStalled(player, game) {
    const stalled = (game.supply.silver ?? 0) <= 0 || game.turnCount > 60 * game.players.length;
    if (!stalled) return null;
    const candidates = game.getGainableCards({ maxCost: player.coins, potion: player.potions ?? 0 })
        .filter(data => !data.types.includes(CARD_TYPES.CURSE) && !data.types.includes(CARD_TYPES.RUINS));
    if (candidates.length === 0) return null;
    return game.resolvePile(candidates[0].id).pileId;
}

// 買うカードがないときに購入するイベントのID（なければ null）
export function chooseLandscapeToBuy(player, game) {
    if (player.buys <= 0) return null;
    return EVENT_BUY_PRIORITY.find(id => {
        if (!game.landscapes.includes(id) || game.getLandscapeCost(id) > player.coins) return false;
        if (game.turnState.eventsBought.includes(id)) return false;
        if (id === 'alms') return !player.playArea.some(card => game.isTreasure(card));
        return true;
    }) ?? null;
}

// 購入の前に財源を使う額（あと少しで欲しいカードに届くときだけ使う）
export function chooseCoffersToUse(player, game) {
    if (player.coffers <= 0 || player.buys <= 0) return 0;
    const thresholds = [...(game.supply.colony > 0 ? [11] : []), ...(game.supply.platinum > 0 ? [9] : []), 8, 6, 5];
    const target = thresholds.find(threshold => player.coins < threshold && player.coins + player.coffers >= threshold);
    return target ? target - player.coins : 0;
}

// カードを手元に残す価値の目安
function keepValue(card) {
    if (card.isType(CARD_TYPES.CURSE)) return -2;
    if (card.isType(CARD_TYPES.VICTORY) && !card.isType(CARD_TYPES.ACTION) && !card.isType(CARD_TYPES.TREASURE)) return -1;
    if (card.isType(CARD_TYPES.TREASURE) && !card.isType(CARD_TYPES.ACTION)) return Math.max(card.value ?? 0, card.cost / 3) * 2;
    return card.cost; // アクションはコストを価値の目安にする
}

// 手札を残す価値の低い順に並べたインデックス（民兵で捨てるカードを選ぶのに使う）
function indicesByKeepValue(cards) {
    return cards.map((card, index) => index).sort((a, b) => keepValue(cards[a]) - keepValue(cards[b]));
}

const lowest = (cards) => indicesByKeepValue(cards)[0];
const highest = (cards) => indicesByKeepValue(cards).reverse()[0];

// 廃棄する順（呪い・屋敷・銅貨、なければ一番価値の低いカード）
function trashOrder(cards, { includeCopper = true, mandatory = true } = {}) {
    for (const cardId of ['curse', 'estate', ...(includeCopper ? ['copper'] : [])]) {
        const index = cards.findIndex(card => card.id === cardId);
        if (index >= 0) return [index];
    }
    return mandatory ? [lowest(cards)] : [];
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

// デッキで一番多いカードのインデックス（願いの井戸で指定する）
function mostCommonIndex(cards, ownCards, predicate = () => true) {
    const counts = new Map();
    ownCards.filter(predicate).forEach(card => counts.set(card.id, (counts.get(card.id) ?? 0) + 1));
    let best = -1;
    cards.forEach((card, index) => {
        if ((counts.get(card.id) ?? 0) > (counts.get(cards[best]?.id) ?? 0)) best = index;
    });
    return best >= 0 ? best : 0;
}

// 選択（手札などからカードを選ぶ）に対する答え：選んだインデックスの配列
function chooseSelection(prompt, game) {
    const { cards, min, max, player } = prompt;
    const indexOf = (predicate) => cards.findIndex(predicate);
    const optionalOne = (predicate) => {
        const index = indexOf(predicate);
        return index >= 0 ? [index] : [];
    };

    switch (prompt.purpose) {
        case 'cellar-discard':
        case 'vault-discard':
            // 勝利点と呪いをすべて捨てて引き直す
            return indicesWhere(cards, isJunk);

        case 'chapel-trash':
            // 勝利点は終盤に必要なので、廃棄するのは呪いと屋敷だけにする
            return indicesWhere(cards, isTrashTarget).slice(0, max);

        case 'discard-down':
        case 'witchs-hut':
            return indicesByKeepValue(cards).slice(0, min);

        case 'remodel-trash': {
            // 終盤は金貨を属州に、それ以外は不要なカードから改築する
            const lateGame = (game.supply.province ?? 0) <= 4;
            const order = lateGame ? ['gold', 'curse', 'estate', 'copper'] : ['curse', 'estate', 'copper'];
            for (const cardId of order) {
                const index = indexOf(card => card.id === cardId);
                if (index >= 0) return [index];
            }
            return [lowest(cards)];
        }

        case 'upgrade-trash':
        case 'develop-trash':
        case 'stonemason-trash':
        case 'bishop-trash':
        case 'investment-trash':
        case 'trader-trash':
        case 'steward-trash':
        case 'trading-post':
            return min <= 1 ? trashOrder(cards) : indicesByKeepValue(cards).slice(0, min);

        case 'catapult-trash':
        case 'sacrifice-trash':
        case 'ritual-trash':
        case 'exorcist-trash':
            return trashOrder(cards);

        case 'lost-in-the-woods':
            return indicesWhere(cards, isJunk).slice(0, 1);

        case 'monastery':
        case 'bat-trash':
            return indicesWhere(cards, card => isTrashTarget(card) || card.id === 'copper').slice(0, max);

        case 'cemetery':
            return indicesWhere(cards, isTrashTarget).slice(0, max);

        case 'crypt':
            // 銀貨以上の財宝を脇に置き、次のターンから1枚ずつ使う
            return indicesWhere(cards, card => card.id !== 'copper');

        case 'changeling':
            return [cards.map((card, index) => index).sort((a, b) => cards[b].cost - cards[a].cost)[0]];

        case 'pooka-trash':
        case 'earths-gift':
            return optionalOne(card => card.id === 'copper');

        case 'secret-cave':
        case 'skys-gift': {
            const junk = indicesWhere(cards, isJunk);
            return junk.length >= 3 ? junk.slice(0, 3) : [];
        }

        case 'play-new-action': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            return [best[0]];
        }

        case 'raider-discard':
            return [lowest(cards)];

        case 'temple-trash': {
            const junk = indicesWhere(cards, isTrashTarget).slice(0, 3);
            return junk.length > 0 ? junk : [lowest(cards)];
        }

        case 'gladiator-reveal':
            // 相手が持っていなさそうな、高いカードを公開する
            return [cards.map((card, index) => index).sort((a, b) => cards[b].cost - cards[a].cost)[0]];

        case 'small-castle':
            return [0];

        case 'haunted-castle':
            return indicesByKeepValue(cards).slice(0, 2);

        case 'opulent-castle':
            return cards.map((card, index) => index);

        case 'archive':
            return [highest(cards)];

        case 'annex':
            // 不要なカードは捨て札に残し、山札に混ぜない
            return indicesWhere(cards, isJunk).slice(0, 5);

        case 'donate':
            return indicesWhere(cards, isTrashTarget);

        case 'raze-trash': {
            // 不要なカードがあればそれを、なければ破壊そのものを廃棄する
            const junk = cards.findIndex((card, index) => index > 0 && isTrashTarget(card));
            return [junk >= 0 ? junk : 0];
        }

        case 'raze-take':
        case 'save':
            return [highest(cards)];

        case 'artificer-discard':
            return indicesWhere(cards, isJunk);

        case 'storyteller':
            return cards.map((card, index) => index).slice(0, 3);

        case 'token-plusCard':
        case 'token-plusAction':
        case 'token-plusBuy':
        case 'token-plusCoin':
        case 'token-minusCost':
        case 'token-trashing':
        case 'inheritance': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            return [best[0]];
        }

        case 'pilgrimage':
            return indicesByKeepValue(cards).reverse().slice(0, 3);

        case 'bonfire':
            return indicesWhere(cards, card => isTrashTarget(card) || card.id === 'copper').slice(0, 2);

        case 'ratcatcher-trash':
        case 'amulet-trash':
            return trashOrder(cards);

        case 'trade-trash':
            return indicesWhere(cards, isTrashTarget).slice(0, 2);

        case 'quest-six':
            return indicesByKeepValue(cards).slice(0, 6);

        case 'knight-trash':
            // 攻撃を受けた側なので、価値の低い方を廃棄する
            return [lowest(cards)];

        case 'hermit-trash':
            return indicesWhere(cards, isTrashTarget).slice(0, 1);

        case 'mercenary-trash': {
            const junk = indicesWhere(cards, isTrashTarget);
            return junk.length >= 2 ? junk.slice(0, 2) : [];
        }

        case 'death-cart': {
            // 廃墟などの不要なアクションがあればそれを、なければ死の荷車そのものを廃棄して財宝+5を得る
            const junk = cards.findIndex((card, index) => index > 0 && isTrashTarget(card));
            return [junk >= 0 ? junk : 0];
        }

        case 'forager-trash':
        case 'junk-dealer-trash':
        case 'altar-trash':
        case 'rats-trash':
            return trashOrder(cards);

        case 'storeroom-draw':
        case 'storeroom-coins':
            return indicesWhere(cards, isJunk);

        case 'scavenger-topdeck':
            return [highest(cards)];

        case 'band-of-misfits': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            return [best[0]];
        }

        case 'counterfeit':
            return optionalOne(card => card.id === 'copper');

        case 'procession': {
            // 廃棄するので、一番安いアクションを選ぶ
            const cheapest = cards.map((card, index) => index).sort((a, b) => cards[a].cost - cards[b].cost);
            return [cheapest[0]];
        }

        case 'rebuild-name': {
            const province = indexOf(card => card.id === 'province');
            return [province >= 0 ? province : 0];
        }

        case 'transmute-trash': {
            // 屋敷は金貨に変わるので最優先で廃棄する
            const estate = indexOf(card => card.id === 'estate');
            return estate >= 0 ? [estate] : trashOrder(cards);
        }

        case 'apprentice-trash':
            return trashOrder(cards);

        case 'herbalist':
            return [highest(cards)];

        case 'golem-first':
            return [playRank(cards[0]) <= playRank(cards[1]) ? 0 : 1];

        case 'optional-trash':
        case 'sailor-trash':
        case 'butcher-trash':
            return indicesWhere(cards, isTrashTarget).slice(0, 1);

        case 'souk-trash':
            return indicesWhere(cards, isTrashTarget).slice(0, max);

        case 'forge':
            return indicesWhere(cards, card => isTrashTarget(card) || card.id === 'copper');

        case 'mine-trash': {
            // 銀貨→金貨、銅貨→銀貨の順に優先する（金貨しかなければ廃棄しない）
            const silver = indexOf(card => card.id === 'silver');
            if (silver >= 0) return [silver];
            return optionalOne(card => card.id === 'copper');
        }

        case 'spice-merchant-trash':
        case 'anvil':
        case 'plaza':
        case 'stables':
            return optionalOne(card => card.id === 'copper');

        case 'throne-room': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            // 玉座の間で玉座の間を選ぶのは、他にないときだけ
            const notThrone = best.find(index => !MULTIPLIER_PRIORITY.includes(cards[index].id));
            return [notThrone ?? best[0]];
        }

        case 'shop':
        case 'scheme': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            return best.slice(0, max);
        }

        case 'tiara':
        case 'mint':
        case 'farmhands':
            return [highest(cards)];

        case 'bandit-trash': {
            // 攻撃を受けた側なので、失って痛くない安い方を廃棄する
            const cheapest = cards.map((card, index) => index).sort((a, b) => cards[a].cost - cards[b].cost);
            return [cheapest[0]];
        }

        case 'harbinger': {
            // 捨て札の中で一番価値の高いカードを山札に戻す（銅貨以下なら戻さない）
            const best = highest(cards);
            const COPPER_VALUE = 2;
            return keepValue(cards[best]) > COPPER_VALUE || min > 0 ? [best] : [];
        }

        case 'sentry-trash':
            return indicesWhere(cards, isTrashTarget);

        case 'sentry-discard':
        case 'cartographer':
            // 勝利点と銅貨は引きたくないので捨てる
            return indicesWhere(cards, card => isJunk(card) || card.id === 'copper');

        case 'sentry-top':
        case 'put-back':
            return [highest(cards)];

        case 'lookout-trash':
        case 'lookout-discard':
        case 'island':
        case 'masquerade-pass':
        case 'topdeck-from-hand':
        case 'secret-passage-card':
        case 'courtier-reveal-cheap':
            return [lowest(cards)];

        case 'courtier-reveal': {
            // 種類の多いカードを公開する
            const most = cards.map((card, index) => index).sort((a, b) => cards[b].types.length - cards[a].types.length);
            return [most[0]];
        }

        case 'haven':
            // 次のターンに一番使いたいカードを脇に置く
            return [highest(cards)];

        case 'salvager-trash':
            return trashOrder(cards);

        case 'artisan-topdeck': {
            // アクションが残っていなければ、手札のアクションカードを次のターンに回す
            if (player.actions <= 0) {
                const action = indexOf(card => card.isType(CARD_TYPES.ACTION));
                if (action >= 0) return [action];
            }
            return [lowest(cards)];
        }

        case 'mill-discard':
        case 'vault-other': {
            const junk = indicesWhere(cards, isJunk);
            return junk.length >= 2 ? junk.slice(0, 2) : [];
        }

        case 'hamlet-action':
        case 'hamlet-buy':
            return indicesWhere(cards, isJunk).slice(0, 1);

        case 'inn':
            return cards.map((card, index) => index);

        case 'lurker-trash':
        case 'gain-from-trash': {
            const byCost = cards.map((card, index) => index).sort((a, b) => cards[b].cost - cards[a].cost);
            return [byCost[0]];
        }

        case 'swindler':
            // 攻撃を受けるプレイヤーには、価値の低いカードを獲得させる
            return [lowest(cards)];

        case 'advisor':
            // 相手の手札に入れたくない、一番良いカードを捨て札にさせる
            return [highest(cards)];

        case 'name-card':
            return [mostCommonIndex(cards, allCardsOf(player))];

        case 'journeyman-name':
            return [mostCommonIndex(cards, allCardsOf(player), card => isJunk(card) || card.id === 'copper')];

        case 'war-chest-name': {
            // 相手が欲しそうな、コスト5以下で一番高いカードを指定する
            const byCost = cards.map((card, index) => index)
                .filter(index => cards[index].cost <= 5 && (game.supply[cards[index].id] ?? 0) > 0)
                .sort((a, b) => cards[b].cost - cards[a].cost);
            return [byCost[0] ?? 0];
        }

        case 'joust': {
            const order = ['courser', 'demesne', 'renown', 'housecarl', 'huge_turnip', 'coronet'];
            const index = order.map(cardId => indexOf(card => card.id === cardId)).find(i => i >= 0);
            return [index ?? 0];
        }

        case 'gain':
            return min === 0 && cards.length === 0 ? [] : [chooseGain(prompt, game)];

        default:
            // 想定外の選択は、条件を満たす最小の枚数を先頭から選ぶ
            return cards.map((card, index) => index).slice(0, min);
    }
}

// 選択肢から選ぶ選択に対する答え：選んだ選択肢のインデックスの配列
function chooseOption(prompt, game) {
    const { options, min, player, card } = prompt;
    const handHasJunk = (count) => player.hand.filter(isJunk).length >= count;
    const handHasAction = player.hand.some(c => c.isType(CARD_TYPES.ACTION));

    switch (prompt.purpose) {
        case 'pawn':
            return player.actions <= 0 && handHasAction ? [0, 1] : [0, 3];
        case 'courser':
            return player.actions <= 0 && handHasAction ? [0, 1] : [0, 2];
        case 'steward':
            return [handHasJunk(2) ? 2 : 1];
        case 'lurker':
            return [game.trash.some(c => c.isType(CARD_TYPES.ACTION)) ? 1 : 0];
        case 'nobles':
            return [player.actions <= 0 && handHasAction ? 1 : 0];
        case 'courtier':
            // 財宝 → 金貨 → 購入 → アクションの順に選ぶ
            return [2, 3, 1, 0].slice(0, min);
        case 'minion': {
            // 手札の財宝が少なければ引き直す
            const coins = player.hand.filter(c => c.isType(CARD_TYPES.TREASURE)).reduce((sum, c) => sum + (c.value ?? 0), 0);
            return [coins + player.coins >= 4 ? 0 : 1];
        }
        case 'watchtower':
            if (card.isType(CARD_TYPES.CURSE)) return [1];
            if (keepValue(card) >= 4) return [2];
            return [0];
        case 'investment': {
            const lateGame = (game.supply.province ?? 0) <= 4;
            return [lateGame && options.length > 1 ? 1 : 0];
        }
        case 'crystal-ball':
            if (options.length === 4) return [3];
            if (card.isType(CARD_TYPES.CURSE)) return [1];
            if (isJunk(card)) return [2];
            return [0];
        case 'jester':
            return [card.cost >= 3 ? 1 : 0];
        case 'spice-merchant':
            return [player.actions <= 0 && handHasAction ? 0 : 1];
        case 'secret-passage-position':
            return [options.length - 1];
        case 'squire':
            return [player.actions <= 0 && handHasAction ? 0 : 2];
        case 'amulet':
            return [player.hand.some(isTrashTarget) ? 1 : 2];
        case 'charm':
        case 'druid':
        case 'fool':
            return [0];
        case 'wild-hunt':
            return [(game.pileVp.wild_hunt ?? 0) >= 3 && (game.supply.estate ?? 0) > 0 ? 1 : 0];
        case 'mountain-pass':
            return [0];
        case 'miser': {
            const copperOnMat = player.mats.tavern.filter(c => c.id === 'copper').length;
            return [player.hand.some(c => c.id === 'copper') && copperOnMat < 3 ? 0 : 1];
        }
        case 'teacher-token':
            return [0];
        case 'quest':
            // 呪い2枚かアタック1枚を捨てられるなら捨てる。なければ捨てない
            return [options.findIndex(option => option.includes('呪い') || option.includes('アタック')) >= 0
                ? options.findIndex(option => option.includes('呪い') || option.includes('アタック'))
                : options.length - 1];
        case 'count-first':
            return [handHasJunk(2) ? 0 : 2];
        case 'count-second':
            return [(game.supply.province ?? 0) <= 4 ? 2 : 0];
        case 'graverobber':
            return [game.trash.some(c => game.getCost(c) >= 3 && game.getCost(c) <= 6) ? 0 : 1];
        default:
            // 想定外の選択（超過支払い・寵臣の攻撃を受けた側など）は先頭から選ぶ
            return options.map((option, index) => index).slice(0, Math.max(min, 1));
    }
}

// はい／いいえの選択に対する答え
function chooseConfirm(prompt) {
    const { player, card } = prompt;

    switch (prompt.purpose) {
        case 'moneylender':
        case 'vassal-play':
        case 'sailor-play':
        case 'baron':
        case 'reaction-play':
        case 'diplomat-react':
        case 'tunnel':
        case 'fools-gold-react':
        case 'clerk-start':
        case 'alchemist-topdeck':
        case 'beggar-react':
        case 'market-square':
        case 'urchin':
        case 'cultist-play':
        case 'hovel':
        case 'catacombs':
        case 'traveller-exchange':
        case 'encampment-reveal':
        case 'faithful-hound':
        case 'blessed-village':
        case 'sacred-grove':
        case 'take-from-discard':
        case 'gladiator-answer':
        case 'legionary':
        case 'call-royal-carriage':
        case 'call-teacher':
        case 'wine-merchant':
            return true;
        case 'call-coin-of-the-realm':
            return player.actions <= 0 && player.hand.some(c => c.isType(CARD_TYPES.ACTION));
        case 'call-ratcatcher':
        case 'call-transmogrify':
            return player.hand.some(c => isTrashTarget(c) || c.id === 'copper');
        case 'call-guide':
            return player.hand.filter(isJunk).length >= 3;
        case 'call-duplicate':
            return Boolean(card) && !isJunk(card) && card.cost >= 3;
        case 'survivors':
        case 'ironmonger':
            return Boolean(card) && (isJunk(card) || card.id === 'copper');
        case 'scrying-pool-self':
            // 自分の山札の不要なカードは捨てる
            return Boolean(card) && (isJunk(card) || card.id === 'copper');
        case 'scrying-pool-other':
            // 相手の山札の良いカードは捨てさせる
            return Boolean(card) && !isJunk(card) && card.id !== 'copper';
        case 'tiara-topdeck':
            return Boolean(card) && !isJunk(card) && card.id !== 'copper';
        case 'jack-discard':
            return Boolean(card) && (isJunk(card) || card.id === 'copper');
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

// 選択待ちに対する答え（select・choose は配列、confirm は真偽値）
export function choosePromptAnswer(prompt, game) {
    if (prompt.type === 'confirm') return chooseConfirm(prompt);
    if (prompt.type === 'choose') return chooseOption(prompt, game);
    return chooseSelection(prompt, game);
}

// CPUが答えるべき選択待ちがあるか（支配のターン中は、支配したプレイヤーが答える）
export function hasCpuPrompt(game) {
    return Boolean(game.pendingPrompt && game.getController(game.pendingPrompt.player).isCPU);
}

// CPUが動く番か（CPUへの選択待ちがあるか、選択待ちがなくCPUが手番を操作するか）
export function isCpuToMove(game) {
    if (game.phase === 'end') return false;
    if (game.pendingPrompt) return hasCpuPrompt(game);
    return game.getController(game.getCurrentPlayer()).isCPU;
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
            const controllerId = game.getController(prompt.player).id;
            // 答えが受け付けられなければ、条件を満たす最小の答えで答え直す
            if (!game.applyCommand(controllerId, { type: 'answer', answer: choosePromptAnswer(prompt, game) })) {
                const count = prompt.min ?? 0;
                game.applyCommand(controllerId, {
                    type: 'answer',
                    answer: prompt.type === 'confirm' ? false : Array.from({ length: count }, (_, i) => i)
                });
            }
        }
        return;
    }

    // 支配のターン中は、支配したプレイヤーが手番のプレイヤーのカードで操作する
    const player = game.getCurrentPlayer();
    const controller = game.getController(player);
    if (!controller.isCPU) return;
    const apply = (command) => game.applyCommand(controller.id, command);

    if (game.phase === 'action') {
        const index = chooseActionCard(player, game);
        if (index < 0 || !apply({ type: 'play', cardIndex: index })) {
            apply({ type: 'buyPhase' });
        }
        return;
    }

    if (game.phase === 'buy') {
        const coffers = chooseCoffersToUse(player, game);
        if (coffers > 0 && apply({ type: 'coffers', amount: coffers })) return;
        const cardId = player.buys > 0 && !game.missionTurn ? chooseCardToBuy(player, game) : null;
        if (cardId && apply({ type: 'buy', cardId })) return;
        // 買うカードがなければ、使えるイベントを買う
        const landscapeId = chooseLandscapeToBuy(player, game);
        if (landscapeId && apply({ type: 'buyLandscape', landscapeId })) return;
        // 手札に夜のカードがあれば、夜フェイズに移る
        if (player.hand.some(card => card.isType(CARD_TYPES.NIGHT)) && apply({ type: 'night' })) return;
        apply({ type: 'endTurn' });
        return;
    }

    // 夜フェイズ：夜のカードを優先順にプレイし、なくなったらターンを終える
    if (game.phase === 'night') {
        const index = NIGHT_PRIORITY.map(cardId => player.hand.findIndex(card => card.id === cardId)).find(i => i >= 0) ??
            player.hand.findIndex(card => card.isType(CARD_TYPES.NIGHT));
        if (index >= 0 && apply({ type: 'play', cardIndex: index })) return;
        apply({ type: 'endTurn' });
    }
}
