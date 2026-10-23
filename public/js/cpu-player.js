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
    'cursed_village', 'mountain_village', 'hideout', 'snowy_village', 'hunting_lodge', 'hostelry', 'village_green', 'necropolis', 'bandit_camp', 'fortress', 'wandering_minstrel', 'dame_molly', 'madman',
    'bazaar', 'fishing_village', 'festival', 'native_village', 'workers_village', 'city', 'shanty_town',
    'mining_village', 'border_village', 'farmhands', 'plaza', 'crossroads', 'inn', 'candlestick_maker', 'demesne',
    // アクションが1つ増えるカード
    'patrician', 'emporium', 'settlers', 'chariot_race', 'groundskeeper', 'archive', 'forum',
    'will_o_wisp', 'zombie_spy', 'pixie', 'shepherd', 'secret_cave', 'wish',
    'border_guard', 'experiment', 'seer', 'research',
    'horse', 'destrier', 'fisherman', 'sanctuary', 'bounty_hunter', 'goatherd', 'coven',
    'champion', 'page', 'ratcatcher', 'guide', 'magpie', 'dungeon', 'caravan_guard', 'transmogrify', 'royal_carriage',
    'storyteller', 'raze', 'fugitive', 'treasure_hunter', 'artificer', 'peasant',
    'scrying_pool', 'familiar', 'alchemist', 'apothecary', 'apprentice', 'junk_dealer', 'ironmonger', 'market_square',
    'mystic', 'sir_bailey', 'urchin', 'sage', 'vagrant', 'rats', 'forager', 'rebuild', 'ruined_village', 'grand_market', 'peddler', 'laboratory', 'market', 'treasury', 'highway', 'caravan', 'tide_pools', 'sea_chart',
    'sentry', 'poacher', 'lighthouse', 'sailor', 'hunting_party', 'baker', 'cartographer', 'ferryman', 'herald',
    'advisor', 'joust', 'menagerie', 'wishing_well', 'mill', 'secret_passage', 'upgrade', 'oasis', 'scheme', 'trail',
    'stables', 'wheelwright', 'farrier', 'hamlet', 'lurker', 'pawn', 'harbinger', 'merchant', 'haven', 'lookout', 'warehouse',
    // 同盟
    'capital_city', 'merchant_camp', 'town', 'lich', 'underling', 'sycophant', 'hunter', 'skirmisher', 'swap',
    'innkeeper', 'warlord', 'old_map', 'voyage', 'student', 'battle_plan', 'sibyl', 'distant_shore', 'sorceress',
    'sorcerer', 'miller',
    // 略奪
    'harbor_village', 'wealthy_village', 'landing_party', 'longship', 'swamp_shacks', 'mining_road', 'cabin_boy', 'taskmaster',
    'shaman', 'grotto',
    'cellar'
];

// アクションを増やさないカード（ターミナル）の優先順
const TERMINAL_PRIORITY = [
    // 長老は手札のアクションをもう1枚プレイできるので、ターミナルの中で最初にプレイする
    'elder',
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
    'leprechaun', 'tracker', 'druid', 'faithful_hound', 'zombie_apprentice', 'zombie_mason',
    // ルネサンス
    'old_witch', 'villain', 'scholar', 'swashbuckler', 'treasurer', 'recruiter', 'sculptor', 'silk_merchant', 'patron', 'priest',
    'inventor', 'flag_bearer', 'improve', 'cargo_ship', 'lackeys', 'acting_troupe',
    // 移動動物園
    'mastermind', 'gatekeeper', 'barge', 'wayfarer', 'animal_fair', 'paddock', 'livery', 'kiln', 'cardinal', 'falconer',
    'cavalry', 'groom', 'displace', 'black_cat', 'sheepdog', 'scrap', 'camel_train', 'sleigh',
    // 同盟
    'marquis', 'emissary', 'highwayman', 'barbarian', 'galleria', 'guildmaster', 'specialist', 'modify',
    'hill_fort', 'stronghold', 'royal_galley', 'courier', 'broker', 'carpenter', 'blacksmith', 'town_crier',
    'conjurer', 'garrison', 'archer', 'acolyte', 'tent', 'herb_gatherer', 'sentinel', 'importer',
    // 略奪（一等航海士は手札の同じアクションをまとめてプレイするので先に、旗艦は次のアクションをもう一度プレイするので早めに）
    'first_mate', 'flagship', 'siren', 'trickster', 'cutthroat', 'frigate', 'crew', 'pilgrim', 'maroon', 'mapmaker',
    'fortune_hunter', 'enlarge', 'quartermaster', 'stowaway', 'secluded_shrine', 'search'
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

// 持っている財宝の合計（銅貨を廃棄しても困らないかの目安）
const treasureValue = (player) => allCardsOf(player).filter(card => card.isType(CARD_TYPES.TREASURE)).reduce((sum, card) => sum + (card.value ?? 0), 0);
const canSpareCopper = (player) => treasureValue(player) >= 7;

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
        case 'broker':
        case 'modify':
        case 'student':
        case 'maroon':
        case 'enlarge':
            // 必ず廃棄するので、不要なカードか、財宝が足りているときの銅貨があるときだけプレイする
            return others.some(c => isTrashTarget(c) || (c.id === 'copper' && canSpareCopper(player)));
        case 'specialist':
            return others.some(c => c.isType(CARD_TYPES.ACTION) || c.isType(CARD_TYPES.TREASURE));
        default:
            return true;
    }
}

// 将軍の攻撃や航海の追加のターンの制限で、手札からプレイできないか
function isBlockedFromPlay(card, player, game) {
    const state = game?.turnState;
    if (state && state.handPlayLimit !== null && state.handPlayLimit !== undefined && state.handPlays >= state.handPlayLimit) return true;
    return Boolean(game?.isWarlordTarget?.(player)) && player.playArea.filter(played => played.id === card.id).length >= 2;
}

// 手札からプレイするアクションカードのインデックスを選ぶ（なければ -1）
export function chooseActionCard(player, game) {
    if (player.actions <= 0) return -1;

    // アクションを増やすカードを先にプレイし、ターミナルは最後に回す（相続した屋敷は、そのカードとして扱う）
    for (const cardId of PLAY_PRIORITY) {
        const index = player.hand.findIndex(card => !isBlockedFromPlay(card, player, game) &&
            ((card.id === cardId && isWorthPlaying(card, player, game)) || (card.id === 'estate' && player.inheritance === cardId)));
        if (index >= 0) return index;
    }

    return -1;
}

// 購入するカードのIDを選ぶ（何も買わないなら null）
export function chooseCardToBuy(player, game) {
    const coins = player.coins;
    const supply = game.supply;
    const provincesLeft = supply.colony ?? supply.province ?? 0;
    // 4種で1山の山（同盟）などは、一番上にあるカードのIDで買える
    const pileFor = (cardId) => {
        const pileId = game.pileOf?.[cardId];
        return pileId && game.getPileTop(pileId) === cardId ? pileId : cardId;
    };
    const available = (cardId) => (supply[pileFor(cardId)] ?? 0) > 0 && game.getCost(pileFor(cardId)) <= Math.max(coins, 0);

    // ターミナルのアクションは、デッキ12枚あたり1枚程度に抑える
    const cards = allCardsOf(player);
    const terminalCount = cards.filter(card => TERMINAL_PRIORITY.includes(card.id)).length;
    const canAddTerminal = terminalCount < 1 + Math.floor(cards.length / 12);
    const cursesLeft = available('curse');

    const pick = (candidates) => {
        const found = candidates.find(available);
        return found ? pileFor(found) : null;
    };
    // 同じカードを max 枚未満しか持っていない候補だけにする
    const fewerThan = (max, ids) => ids.filter(id => cards.filter(card => card.id === id).length < max);

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
        return provincesLeft <= 4
            ? pick(['duchy', 'distant_shore', 'stronghold', 'territory', 'gold'])
            : pick([...fewerThan(1, ['sibyl', 'marquis', 'lich']), 'gold']);
    }
    if (coins >= 5) {
        if (provincesLeft <= 5) return pick(['duchy', 'silver']);

        const actions = ['laboratory', 'bazaar', 'market', 'festival', 'city', 'highway', 'hunting_party', 'baker', 'cartographer',
            'junk_dealer', 'bandit_camp', 'lost_city', 'groundskeeper', 'forum', 'archive',
            ...fewerThan(2, ['capital_city', 'hunter', 'skirmisher', 'swap', 'sorceress', 'sorcerer', 'warlord']),
            // 略奪：アクションの増えるカードと、効果のある財宝は2枚まで
            ...fewerThan(2, ['wealthy_village', 'mining_road', 'longship', 'buried_treasure', 'figurine'])];
        if (canAddTerminal) {
            if (cursesLeft) actions.unshift('witch', 'sea_witch', 'soothsayer', 'torturer', 'charlatan');
            if (available('ruins')) actions.unshift('cultist');
            if (cursesLeft) actions.unshift('swamp_hag');
            actions.push('knights', 'rogue', 'legionary');
            actions.push('margrave', 'wharf', 'council_room', 'library', 'courtier', 'bandit', 'merchant_ship', 'rabble');
            actions.push('elder', 'barbarian', 'highwayman', 'galleria', 'guildmaster', 'emissary', 'modify', 'specialist', 'hill_fort', 'contract');
            if (cursesLeft) actions.unshift('trickster');
            actions.push('cutthroat', 'frigate', 'crew', 'pilgrim', 'first_mate');
        }
        return pick([...actions, 'silver']);
    }
    if (coins >= 3) {
        if (provincesLeft <= 2) return pick(['estate', 'silver']);
        // 同盟：アクションの増えるカードは2枚まで
        const allies = pick(fewerThan(2, coins >= 4 ? ['town', 'innkeeper', 'voyage', 'miller'] : ['merchant_camp', 'underling', 'old_map', 'student', 'battle_plan']));
        if (allies) return allies;
        // 略奪：アクションの増えるカードと、効果のある財宝は2枚まで
        const plunder = pick(fewerThan(2, coins >= 4
            ? ['harbor_village', 'landing_party', 'swamp_shacks', 'cabin_boy', 'rope', 'gondola', 'abundance']
            : ['taskmaster']));
        if (plunder) return plunder;
        if (coins === 4 && canAddTerminal) {
            return pick([...(cursesLeft ? ['young_witch'] : []), ...(available('ruins') ? ['marauder'] : []), 'villa', 'smithy', 'militia',
                'monument', 'cutpurse', 'moneylender', 'courier', 'carpenter', 'broker', 'royal_galley', 'conjurer', 'garrison',
                'archer', 'acolyte', 'flagship', 'fortune_hunter', 'mapmaker', 'silver']);
        }
        if (canAddTerminal) {
            const terminal = pick(fewerThan(1, ['sentinel', 'importer', 'tent', 'herb_gatherer', 'stowaway', 'secluded_shrine']));
            if (terminal) return terminal;
        }
        return pick(['silver']);
    }
    if (coins >= 2 && provincesLeft <= 2) {
        return pick(['estate']);
    }
    // 同盟：コスト2のカードを1枚ずつ
    if (coins === 2 && provincesLeft > 2) {
        const cheap = pick(fewerThan(1, ['town_crier', 'sycophant', 'bauble', 'shaman', 'search']));
        if (cheap) return cheap;
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

        case 'bounty-hunter':
        case 'displace':
        case 'sanctuary':
            return min === 0 ? indicesWhere(cards, isTrashTarget).slice(0, 1) : [lowest(cards)];

        case 'scrap-trash':
            return trashOrder(cards);

        case 'camel-train': {
            // 相手に取られたくない、高いアクションを追放する
            const byCost = cards.map((card, index) => index).sort((a, b) => cards[b].cost - cards[a].cost);
            return [byCost[0]];
        }

        case 'hostelry':
        case 'animal-fair-pay':
            return min > 0 ? [lowest(cards)] : [];

        case 'hideout-trash': {
            // 勝利点カードを廃棄すると呪いを獲得するので、呪いか銅貨を選ぶ
            const index = ['curse', 'copper'].map(id => indexOf(card => card.id === id)).find(i => i >= 0);
            if (index !== undefined) return [index];
            const nonVictory = cards.map((card, i) => i).filter(i => !cards[i].isType(CARD_TYPES.VICTORY));
            return [nonVictory.sort((a, b) => keepValue(cards[a]) - keepValue(cards[b]))[0] ?? lowest(cards)];
        }

        case 'priest-trash':
        case 'research-trash':
        case 'recruiter-trash':
        case 'cathedral-trash':
            return trashOrder(cards);

        case 'silos':
            return cards.map((card, index) => index);

        case 'crop-rotation':
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

        // ===== 同盟 =====
        case 'sentinel-trash':
            return indicesWhere(cards, isTrashTarget).slice(0, max);
        case 'broker-trash':
        case 'modify-trash':
        case 'student-trash': {
            // 財宝が足りなければ銅貨は廃棄せず、財宝でない価値の低いカードを選ぶ
            if (canSpareCopper(player) || cards.some(isTrashTarget)) return trashOrder(cards);
            const nonTreasure = cards.map((card, index) => index).filter(index => !cards[index].isType(CARD_TYPES.TREASURE))
                .sort((a, b) => keepValue(cards[a]) - keepValue(cards[b]));
            return [nonTreasure[0] ?? lowest(cards)];
        }
        case 'miller':
        case 'herb-gatherer':
        case 'courier':
        case 'archer-hide':
        case 'archer-discard':
            return cards.length > 0 ? [highest(cards)] : [];
        case 'specialist': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            return [best[0]];
        }
        case 'swap':
        case 'woodworkers-guild':
            return optionalOne(card => card.isType(CARD_TYPES.RUINS) || card.cost <= 2);
        case 'acolyte-trash':
            return optionalOne(card => isJunk(card) || isTrashTarget(card));
        case 'architects-guild':
        case 'crafters-guild': {
            if (cards.length === 0) return [];
            const index = chooseGain(prompt, game);
            return cards[index].cost >= 2 ? [index] : [];
        }
        case 'cave-dwellers':
            return indicesWhere(cards, isJunk).slice(0, 1);
        case 'coastal-haven':
            // 銀貨以上の財宝やアクションを、恩恵の数だけ次のターンに残す
            return indicesByKeepValue(cards).reverse().filter(index => keepValue(cards[index]) >= 4).slice(0, max);
        case 'family-of-inventors':
            return optionalOne(card => card.id === 'gold');
        case 'market-towns': {
            const best = cards.map((card, index) => index).sort((a, b) => playRank(cards[a]) - playRank(cards[b]));
            return best.slice(0, 1);
        }
        case 'peaceful-cult':
            return indicesWhere(cards, isTrashTarget).slice(0, max);

        // ===== 略奪 =====
        case 'grotto-set-aside':
            // 勝利点と呪いを脇に置いて、次のターンに引き直す
            return indicesWhere(cards, isJunk).slice(0, max);
        case 'crucible-trash':
        case 'maroon-trash':
        case 'pickaxe-trash':
            return trashOrder(cards);
        case 'fortune-hunter':
        case 'kings-cache':
        case 'orb-play':
        case 'bury':
        case 'take-from-quartermaster':
            return cards.length > 0 ? [highest(cards)] : [];
        case 'mapmaker':
            return indicesByKeepValue(cards).reverse().slice(0, min);
        case 'figurine-discard': {
            // 購入フェーズなのでアクションは使えない。一番価値の低いアクションを捨てて購入と財宝を得る
            const actions = indicesWhere(cards, card => card.isType(CARD_TYPES.ACTION));
            return actions.length > 0 ? [actions.sort((a, b) => keepValue(cards[a]) - keepValue(cards[b]))[0]] : [];
        }
        case 'first-mate': {
            // 手札に一番多いアクション（同じ数ならプレイの優先順の高いもの）
            const actions = indicesWhere(cards, card => card.isType(CARD_TYPES.ACTION));
            const count = (card) => cards.filter(other => other.id === card.id).length;
            actions.sort((a, b) => count(cards[b]) - count(cards[a]) || playRank(cards[a]) - playRank(cards[b]));
            return actions.slice(0, 1);
        }
        case 'maelstrom-trash':
            return indicesByKeepValue(cards).slice(0, min);
        case 'maelstrom-other':
            return [lowest(cards)];
        case 'prosper':
            return indicesWhere(cards, card => card.id !== 'copper');
        case 'friendly':
        case 'shy':
            return cards.length > 0 ? [0] : [];
        case 'trickster':
            return indicesByKeepValue(cards).reverse().slice(0, max);

        default:
            // 想定外の選択は、条件を満たす最小の枚数を先頭から選ぶ
            return cards.map((card, index) => index).slice(0, min);
    }
}

// 長老の効果で選べる数が増えていれば、まだ選んでいない選択肢を先頭から足す
function withExtra(prompt, chosen) {
    const extra = prompt.options.map((option, index) => index).filter(index => !chosen.includes(index));
    return [...chosen, ...extra].slice(0, Math.max(chosen.length, prompt.max));
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
        case 'border-guard-artifact':
        case 'scepter':
            return [0];
        case 'treasurer':
            // 鍵を受け取る（毎ターン財宝+1）
            return [2];
        case 'scrap':
            // カード・アクション・財宝・購入の順に選ぶ
            return [0, 1, 3, 2, 4, 5].slice(0, min);
        case 'sleigh':
            return [0];
        case 'sinister-plot':
            return [player.sinisterPlotTokens >= 2 ? 1 : 0];
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

        // ===== 同盟（「1つを選ぶ」は、長老で選べる数が増えていれば withExtra で足す） =====
        case 'town':
            return withExtra(prompt, [player.hand.some(c => c.isType(CARD_TYPES.ACTION)) ? 0 : 1]);
        case 'town-crier':
            return withExtra(prompt, [player.actions <= 0 && handHasAction ? 2 : 0]);
        case 'blacksmith': {
            if (player.actions <= 0 && handHasAction) return withExtra(prompt, [2]);
            return withExtra(prompt, [6 - player.hand.length > 2 ? 0 : 1]);
        }
        case 'innkeeper':
            return withExtra(prompt, [handHasJunk(2) ? 1 : 0]);
        case 'hill-fort':
            return withExtra(prompt, [player.actions <= 0 && handHasAction ? 1 : 0]);
        case 'stronghold':
            return withExtra(prompt, [game.phase === 'action' ? 0 : 1]);
        case 'broker':
            return withExtra(prompt, [player.actions <= 0 && handHasAction ? 1 : 2]);
        case 'modify':
            return withExtra(prompt, [options.length > 1 && card && game.getCost(card) >= 2 ? 1 : 0]);
        case 'specialist-choice':
            return withExtra(prompt, [0]);
        case 'bauble':
            return [1, 2];
        case 'band-of-nomads':
            if (player !== game.getCurrentPlayer()) return [1];
            if (game.phase === 'action') return [player.actions <= 0 && handHasAction ? 2 : 1];
            return [player.coins >= 2 ? 3 : 0];
        case 'rotate-any':
            return [0];
        // ===== 略奪 =====
        case 'orb':
            // 捨て札のカードを探すより、購入 +1 と財宝 +3 を選ぶ（最後の選択肢）
            return [options.length - 1];
        case 'quartermaster':
            // 補給係の上にカードがあれば手札に加え、なければ獲得して置く
            return [options.length > 1 ? 1 : 0];

        default:
            // 想定外の選択（超過支払い・寵臣の攻撃を受けた側など）は先頭から選ぶ
            return options.map((option, index) => index).slice(0, Math.max(min, 1));
    }
}

// はい／いいえの選択に対する答え
function chooseConfirm(prompt, game) {
    const { player, card } = prompt;

    switch (prompt.purpose) {
        case 'moneylender':
        case 'vassal-play':
        case 'sailor-play':
        case 'baron':
        case 'reaction-play':
        case 'play-gained':
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
        case 'now-or-later':
        case 'kiln':
        case 'wayfarer':
        case 'horn':
        case 'cargo-ship':
        case 'pageant':
        case 'innovation':
        case 'faithful-hound':
        case 'blessed-village':
        case 'sacred-grove':
        case 'take-from-discard':
        case 'gladiator-answer':
        case 'legionary':
        case 'call-royal-carriage':
        case 'call-teacher':
        case 'wine-merchant':
        // 同盟
        case 'topdeck-from-play':
        case 'battle-plan-reveal':
        case 'circle-of-witches':
        case 'city-state':
        case 'fellowship-of-scribes':
        case 'forest-dwellers':
        case 'gang-of-pickpockets':
        case 'island-folk':
        case 'mountain-folk':
            return true;
        case 'acolyte-self':
            return (game?.getCost('augurs') ?? 0) >= 5;
        case 'capital-city-discard':
            return player.hand.filter(isJunk).length >= 2;
        case 'desert-guides': {
            // 手札の財宝が少なく、アクションもなければ引き直す
            const coins = player.hand.filter(c => c.isType(CARD_TYPES.TREASURE)).reduce((sum, c) => sum + (c.value ?? 0), 0);
            return coins <= 3 && !player.hand.some(c => c.isType(CARD_TYPES.ACTION));
        }
        case 'trappers-lodge':
            return Boolean(card) && !isJunk(card) && card.id !== 'copper' && player === game?.getCurrentPlayer();
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
    if (prompt.type === 'confirm') return chooseConfirm(prompt, game);
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
        // アクションが尽きても、手札にプレイしたいアクションがあれば村人を使う
        if (player.actions <= 0 && player.villagers > 0 && chooseActionCard({ ...player, actions: 1, hand: player.hand }, game) >= 0 &&
            apply({ type: 'villager', amount: 1 })) {
            return;
        }
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
