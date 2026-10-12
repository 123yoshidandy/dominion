/**
 * 拡張「異郷」（第2版）の王国カードデータ
 * 獲得したとき（onGain）・廃棄したとき（onTrash）・クリーンアップ以外で捨て札にしたとき（onDiscard）の効果が多い
 */

import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, names, gainBenefits, promptFromHand, promptTrashFromHand,
    promptDiscardFromHand, discardDownTo, takeTopCards, putBackInAnyOrder, logReveal, curseAttack
} from './card-helpers.js';

// 捨て札・廃棄置き場などにあるカードをプレイしてもよいか聞く（小道・織工）
const offerToPlay = (player, game, card, title, isAvailable) => {
    if (!isAvailable()) return;
    game.promptConfirm({
        player,
        card,
        title,
        message: `${card.name}をプレイしますか？`,
        yesLabel: 'プレイする',
        noLabel: 'プレイしない',
        purpose: 'reaction-play',
        callback: (yes) => {
            if (!yes || !isAvailable()) return;
            const trashIndex = game.trash.indexOf(card);
            if (trashIndex >= 0) {
                game.trash.splice(trashIndex, 1);
                game.playCardFrom(player, card, { remove: false });
            } else {
                game.playCardFrom(player, card);
            }
        }
    });
};

const inDiscard = (player, card) => () => player.discard.includes(card);

export const HINTERLANDS_CARDS = {
    // ===== コスト2 =====
    CROSSROADS: {
        id: 'crossroads',
        name: '岐路',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '手札を公開し、勝利点カード1枚につきカードを1枚引く。このターン最初にプレイした岐路ならアクション +3',
        count: 10,
        onPlay: (player, game) => {
            logReveal(game, player, player.hand);
            const first = game.turnState.crossroadsPlayed === 0;
            game.turnState.crossroadsPlayed++;
            gainBenefits(player, game, {
                cards: player.hand.filter(isVictory).length,
                actions: first ? 3 : 0
            });
        }
    },
    FOOLS_GOLD: {
        id: 'fools_gold',
        name: '愚者の黄金',
        cost: 2,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: 'このターン最初にプレイした愚者の黄金なら財宝 +1、そうでなければ財宝 +4。他のプレイヤーが属州を獲得したとき、手札のこれを廃棄して、金貨を1枚獲得し山札の上に置いてもよい',
        reactionType: 'otherGain',
        count: 10,
        onPlay: (player, game) => {
            const first = game.turnState.foolsGoldPlayed === 0;
            game.turnState.foolsGoldPlayed++;
            player.coins += first ? 1 : 4;
        },
        onOtherGain: (owner, game, foolsGold, gainer, card) => {
            if (card.id !== 'province') return;
            game.promptConfirm({
                player: owner,
                card: foolsGold,
                title: '愚者の黄金',
                message: `${gainer.name}が属州を獲得しました。愚者の黄金を廃棄して、金貨を山札の上に獲得しますか？`,
                yesLabel: '廃棄する',
                noLabel: '廃棄しない',
                purpose: 'fools-gold-react',
                callback: (yes) => {
                    if (!yes || !owner.hand.includes(foolsGold)) return;
                    game.trashFromHand(owner, [owner.hand.indexOf(foolsGold)]);
                    game.log(`${owner.name}は愚者の黄金を廃棄しました`);
                    if (game.gainCardFromSupply(owner, 'gold', 'deck')) game.log(`${owner.name}は金貨を獲得し、山札の上に置きました`);
                }
            });
        }
    },

    // ===== コスト3 =====
    DEVELOP: {
        id: 'develop',
        name: '開発',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。それよりコストがちょうど1多いカードと、ちょうど1少ないカードを1枚ずつ獲得し、山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '開発',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'develop-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const cost = game.getCost(trashed);
                    game.promptGain({
                        player,
                        exactCost: cost + 1,
                        potion: game.getPotionCost(trashed),
                        destination: 'deck',
                        title: '開発',
                        message: `コストがちょうど${cost + 1}のカードを1枚獲得してください（山札の上に置きます）。`
                    });
                    game.runNext(() => game.promptGain({
                        player,
                        exactCost: cost - 1,
                        potion: game.getPotionCost(trashed),
                        destination: 'deck',
                        title: '開発',
                        message: `コストがちょうど${cost - 1}のカードを1枚獲得してください（山札の上に置きます）。`
                    }));
                }
            });
        }
    },
    GUARD_DOG: {
        id: 'guard_dog',
        name: '番犬',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。手札が5枚以下ならさらにカードを2枚引く。他のプレイヤーがアタックカードをプレイしたとき、先に手札のこれをプレイしてもよい',
        reactionType: 'attack',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            if (player.hand.length <= 5) gainBenefits(player, game, { cards: 2 });
        },
        onAttackReaction: (player, game, card) => {
            game.promptConfirm({
                player,
                card,
                title: '番犬',
                message: '攻撃を受ける前に番犬をプレイしますか？',
                yesLabel: 'プレイする',
                noLabel: 'プレイしない',
                purpose: 'reaction-play',
                callback: (yes) => {
                    if (yes && player.hand.includes(card)) game.playCardFrom(player, card);
                }
            });
        }
    },
    OASIS: {
        id: 'oasis',
        name: 'オアシス',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。手札を1枚捨てる',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 });
            promptDiscardFromHand(game, player, 1, 'オアシス');
        }
    },
    SCHEME: {
        id: 'scheme',
        name: '策略',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。このターンのクリーンアップの開始時に、場のアクションカードを1枚選んでもよい。それを場から捨て札にするときは山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.turnState.schemes++;
        }
    },
    TUNNEL: {
        id: 'tunnel',
        name: '坑道',
        cost: 3,
        types: [CARD_TYPES.VICTORY],
        points: 2,
        description: '勝利点 2。クリーンアップ以外でこれを捨て札にしたとき、公開して金貨を1枚獲得してもよい',
        reactionType: 'discard',
        onDiscard: (player, game, card) => {
            game.promptConfirm({
                player,
                card,
                title: '坑道',
                message: '坑道を公開して、金貨を獲得しますか？',
                yesLabel: '獲得する',
                noLabel: '獲得しない',
                purpose: 'tunnel',
                callback: (yes) => {
                    if (yes && game.gainCardFromSupply(player, 'gold')) {
                        game.log(`${player.name}は坑道を公開し、金貨を獲得しました`);
                    }
                }
            });
        }
    },

    // ===== コスト4 =====
    JACK_OF_ALL_TRADES: {
        id: 'jack_of_all_trades',
        name: 'よろず屋',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '銀貨を1枚獲得する。山札の一番上を見て、捨て札にするか戻す。手札が5枚になるまで引く。手札の財宝以外のカードを1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game) => {
            if (game.gainCardFromSupply(player, 'silver')) game.log(`${player.name}は銀貨を獲得しました`);
            game.runNext(
                () => {
                    const [card] = takeTopCards(player, 1);
                    if (!card) return;
                    game.promptConfirm({
                        player,
                        card,
                        title: 'よろず屋',
                        message: `山札の一番上は${card.name}です。捨て札にしますか？`,
                        yesLabel: '捨て札にする',
                        noLabel: '山札に戻す',
                        purpose: 'jack-discard',
                        callback: (discard) => {
                            if (discard) {
                                game.log(`${player.name}は${card.name}を捨て札にしました`);
                                game.discardCards(player, [card]);
                            } else {
                                player.deck.unshift(card);
                            }
                        }
                    });
                },
                () => {
                    const count = Math.max(0, 5 - player.hand.length);
                    if (count > 0) gainBenefits(player, game, { cards: count });
                },
                () => promptTrashFromHand(game, player, {
                    min: 0,
                    filter: (card) => !isTreasure(card),
                    title: 'よろず屋',
                    message: '廃棄する財宝以外のカードを1枚選んでください（選ばなくてもかまいません）。',
                    purpose: 'optional-trash'
                })
            );
        }
    },
    NOMADS: {
        id: 'nomads',
        name: '遊牧民',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +2。これを獲得したときか廃棄したとき、財宝 +2',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1, coins: 2 }),
        onGain: (player, game) => gainBenefits(player, game, { coins: 2 }, '遊牧民'),
        onTrash: (player, game) => gainBenefits(player, game, { coins: 2 }, '遊牧民')
    },
    SPICE_MERCHANT: {
        id: 'spice_merchant',
        name: '香辛料商人',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札の財宝を1枚廃棄してもよい。廃棄したら、カードを2枚引きアクション +1 か、購入 +1 と財宝 +2 のどちらかを選ぶ',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                min: 0,
                filter: isTreasure,
                title: '香辛料商人',
                message: '廃棄する財宝を1枚選んでください（選ばなくてもかまいません）。',
                purpose: 'spice-merchant-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    game.promptChoose({
                        player,
                        options: ['カードを2枚引き、アクション +1', '購入 +1、財宝 +2'],
                        title: '香辛料商人',
                        message: 'どちらかを選んでください。',
                        purpose: 'spice-merchant',
                        callback: ([choice]) => gainBenefits(player, game, choice === 0 ? { cards: 2, actions: 1 } : { buys: 1, coins: 2 })
                    });
                }
            });
        }
    },
    TRADER: {
        id: 'trader',
        name: '交易商',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄し、そのコスト1につき銀貨を1枚獲得する。カードを獲得したとき、手札のこれを公開して、そのカードを銀貨と交換してもよい',
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '交易商',
                message: '廃棄するカードを1枚選んでください。コスト1につき銀貨を1枚獲得します。',
                purpose: 'trader-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    let gained = 0;
                    for (let i = 0; i < game.getCost(trashed); i++) {
                        if (game.gainCardFromSupply(player, 'silver')) gained++;
                    }
                    if (gained > 0) game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
                }
            });
        },
        onOwnGain: (player, game, trader, card) => {
            if (card.id === 'silver' || !(game.supply.silver > 0)) return;
            if (!player.discard.includes(card) && !player.hand.includes(card) && !player.deck.includes(card)) return;
            game.promptConfirm({
                player,
                card,
                title: '交易商',
                message: `交易商を公開して、獲得した${card.name}を銀貨と交換しますか？`,
                yesLabel: '交換する',
                noLabel: '交換しない',
                purpose: 'trader-react',
                callback: (yes) => {
                    if (!yes || !game.returnToSupply(player, card)) return;
                    game.log(`${player.name}は交易商を公開し、${card.name}を銀貨と交換しました`);
                    game.gainCardFromSupply(player, 'silver');
                }
            });
        }
    },
    TRAIL: {
        id: 'trail',
        name: '小道',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。クリーンアップ以外でこれを獲得・廃棄・捨て札にしたとき、これをプレイしてもよい',
        reactionType: 'self',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1 }),
        onGain: (player, game, card) => offerToPlay(player, game, card, '小道',
            () => player.discard.includes(card) || player.hand.includes(card) || player.deck.includes(card)),
        onTrash: (player, game, card) => offerToPlay(player, game, card, '小道', () => game.trash.includes(card)),
        onDiscard: (player, game, card) => offerToPlay(player, game, card, '小道', inDiscard(player, card))
    },
    WEAVER: {
        id: 'weaver',
        name: '織工',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '銀貨を2枚獲得するか、コスト4以下のカードを1枚獲得する。クリーンアップ以外でこれを捨て札にしたとき、これをプレイしてもよい',
        reactionType: 'self',
        count: 10,
        onPlay: (player, game) => {
            game.promptChoose({
                player,
                options: ['銀貨を2枚獲得する', 'コスト4以下のカードを1枚獲得する'],
                title: '織工',
                message: 'どちらかを選んでください。',
                purpose: 'weaver',
                callback: ([choice]) => {
                    if (choice === 0) {
                        const gained = [0, 1].filter(() => game.gainCardFromSupply(player, 'silver')).length;
                        game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
                        return;
                    }
                    game.promptGain({ player, maxCost: 4, title: '織工', message: 'コスト4以下のカードを1枚獲得してください。' });
                }
            });
        },
        onDiscard: (player, game, card) => offerToPlay(player, game, card, '織工', inDiscard(player, card))
    },

    // ===== コスト5 =====
    BERSERKER: {
        id: 'berserker',
        name: '狂戦士',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'これよりコストの低いカードを1枚獲得する。他のプレイヤーは手札が3枚になるまで捨てる。これを獲得したとき、場にアクションカードがあれば、これをプレイする',
        isAttack: true,
        count: 10,
        onPlay: (player, game, card) => {
            const maxCost = game.getCost(card) - 1;
            game.promptGain({ player, lessThan: card, title: '狂戦士', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
            game.attackOtherPlayers(player, (target) => discardDownTo(game, target, 3, '狂戦士'));
        },
        onGain: (player, game, card) => {
            if (!player.playArea.some(isAction) || !player.discard.includes(card)) return;
            game.playCardFrom(player, card);
        }
    },
    CARTOGRAPHER: {
        id: 'cartographer',
        name: '地図職人',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の上から4枚を見て、好きな枚数を捨て札にし、残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const revealed = takeTopCards(player, 4);
            if (revealed.length === 0) return;
            game.promptSelect({
                player,
                cards: revealed,
                title: '地図職人',
                message: '山札の上から見たカードです。捨て札にするカードを選んでください。残りは山札の上に戻します。',
                confirmLabel: '捨て札にする',
                purpose: 'cartographer',
                callback: (indices) => {
                    const discarded = indices.map(index => revealed[index]);
                    if (discarded.length > 0) game.log(`${player.name}は${names(discarded)}を捨て札にしました`);
                    putBackInAnyOrder(game, player, revealed.filter(card => !discarded.includes(card)), '地図職人');
                    game.discardCards(player, discarded);
                }
            });
        }
    },
    CAULDRON: {
        id: 'cauldron',
        name: '大釜',
        cost: 5,
        types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。購入 +1。このターン3回目にアクションカードを獲得したとき、他のプレイヤーは呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1 })
    },
    HAGGLER: {
        id: 'haggler',
        name: '値切り屋',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。これが場にある間、カードを購入するたびに、それよりコストの低い勝利点以外のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { coins: 2 }),
        onBuyWhileInPlay: (player, game, haggler, bought) => {
            const maxCost = game.getCost(bought) - 1;
            if (maxCost < 0 && !game.getPotionCost(bought)) return;
            game.promptGain({
                player,
                lessThan: bought,
                filter: (data) => !data.types.includes(CARD_TYPES.VICTORY),
                title: '値切り屋',
                message: `コスト${maxCost}以下の勝利点以外のカードを1枚獲得してください。`
            });
        }
    },
    HIGHWAY: {
        id: 'highway',
        name: '街道',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。これが場にある間、カードのコストは1少なくなる',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1 })
    },
    INN: {
        id: 'inn',
        name: '宿屋',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +2。手札を2枚捨てる。これを獲得したとき、捨て札（これを含む）のアクションカードを好きな枚数公開し、山札に混ぜてシャッフルする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2, actions: 2 });
            promptDiscardFromHand(game, player, 2, '宿屋');
        },
        onGain: (player, game) => {
            const actions = player.discard.filter(isAction);
            if (actions.length === 0) return;
            game.promptSelect({
                player,
                cards: actions,
                title: '宿屋',
                message: '山札に混ぜるアクションカードを捨て札から選んでください。',
                confirmLabel: '山札に混ぜる',
                purpose: 'inn',
                callback: (indices) => {
                    const chosen = indices.map(index => actions[index]);
                    if (chosen.length === 0) return;
                    chosen.forEach(card => player.discard.splice(player.discard.indexOf(card), 1));
                    player.deck.push(...chosen);
                    player.shuffleDeck();
                    game.log(`${player.name}は${names(chosen)}を山札に混ぜてシャッフルしました`);
                }
            });
        }
    },
    MARGRAVE: {
        id: 'margrave',
        name: '辺境伯',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。購入 +1。他のプレイヤーはカードを1枚引き、手札が3枚になるまで捨てる',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3, buys: 1 });
            game.attackOtherPlayers(player, (target) => {
                gainBenefits(target, game, { cards: 1 });
                discardDownTo(game, target, 3, '辺境伯');
            });
        }
    },
    SOUK: {
        id: 'souk',
        name: 'スーク',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +7。手札1枚につき財宝 -1（0未満にはならない）。これを獲得したとき、手札を2枚まで廃棄する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            const before = player.coins;
            player.coins = Math.max(0, player.coins + 7 - player.hand.length);
            game.log(`${player.name}は財宝+${player.coins - before}を得ました`);
        },
        onGain: (player, game) => promptTrashFromHand(game, player, {
            min: 0,
            max: 2,
            title: 'スーク',
            message: '廃棄するカードを2枚まで選んでください（選ばなくてもかまいません）。',
            purpose: 'souk-trash'
        })
    },
    STABLES: {
        id: 'stables',
        name: '厩舎',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札の財宝を1枚捨ててもよい。捨てたらカードを3枚引き、アクション +1',
        count: 10,
        onPlay: (player, game) => {
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => game.isTreasure(card),
                title: '厩舎',
                message: '財宝を1枚捨てると、カードを3枚引きアクション+1を得ます（捨てなくてもかまいません）。',
                confirmLabel: '捨てる',
                purpose: 'stables',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    game.log(`${player.name}は${card.name}を捨てました`);
                    gainBenefits(player, game, { cards: 3, actions: 1 });
                }
            });
        }
    },
    WHEELWRIGHT: {
        id: 'wheelwright',
        name: '車大工',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。手札を1枚捨ててもよい。捨てたら、それ以下のコストのアクションカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            promptFromHand(game, player, {
                min: 0,
                title: '車大工',
                message: '捨てるカードを1枚選ぶと、そのコスト以下のアクションカードを獲得します（捨てなくてもかまいません）。',
                confirmLabel: '捨てる',
                purpose: 'wheelwright',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    game.log(`${player.name}は${card.name}を捨てました`);
                    const maxCost = game.getCost(card);
                    game.promptGain({
                        player,
                        maxCost,
                        potion: game.getPotionCost(card),
                        filter: (data) => data.types.includes(CARD_TYPES.ACTION),
                        title: '車大工',
                        message: `コスト${maxCost}以下のアクションカードを1枚獲得してください。`
                    });
                }
            });
        }
    },
    WITCHS_HUT: {
        id: 'witchs_hut',
        name: '魔女の小屋',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを4枚引く。手札を2枚公開して捨てる。2枚ともアクションカードなら、他のプレイヤーは呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 4 });
            promptDiscardFromHand(game, player, 2, '魔女の小屋', {
                purpose: 'witchs-hut',
                message: '公開して捨てるカードを2枚選んでください。2枚ともアクションなら、他のプレイヤーは呪いを獲得します。',
                callback: (discarded) => {
                    if (discarded.length > 0) game.log(`${player.name}は${names(discarded)}を公開しました`);
                    if (discarded.length === 2 && discarded.every(isAction)) curseAttack(game, player);
                }
            });
        }
    },

    // ===== コスト6 =====
    BORDER_VILLAGE: {
        id: 'border_village',
        name: '国境の村',
        cost: 6,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。これを獲得したとき、これよりコストの低いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onGain: (player, game, card) => {
            const maxCost = game.getCost(card) - 1;
            game.promptGain({ player, lessThan: card, title: '国境の村', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
        }
    },
    FARMLAND: {
        id: 'farmland',
        name: '肥沃な土地',
        cost: 6,
        types: [CARD_TYPES.VICTORY],
        points: 2,
        description: '勝利点 2。これを購入したとき、手札のカードを1枚廃棄し、それよりコストがちょうど2多いカードを1枚獲得する',
        onBuy: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '肥沃な土地',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'remodel-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const cost = game.getCost(trashed) + 2;
                    game.promptGain({ player, exactCost: cost, potion: game.getPotionCost(trashed), title: '肥沃な土地', message: `コストがちょうど${cost}のカードを1枚獲得してください。` });
                }
            });
        }
    }
};
