/**
 * 拡張「繁栄」（第2版）の王国カードデータと、白金貨・植民地
 * 王国カードに繁栄のカードがあると、その割合に応じて白金貨と植民地を使う（Game.initializeSupply）
 */

import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, names, gainBenefits, promptFromHand, promptTrashFromHand,
    takeTopCards, putBackInAnyOrder, logReveal, curseAttack
} from './card-helpers.js';

// 白金貨と植民地（王国カードではない）
export const PROSPERITY_BASIC_CARDS = {
    PLATINUM: {
        id: 'platinum',
        name: '白金貨',
        cost: 9,
        types: [CARD_TYPES.TREASURE],
        value: 5,
        description: '財宝 +5',
        count: 12
    },
    COLONY: {
        id: 'colony',
        name: '植民地',
        cost: 11,
        types: [CARD_TYPES.VICTORY],
        points: 10,
        description: '勝利点 +10'
    }
};

export const PROSPERITY_CARDS = {
    // ===== コスト3 =====
    ANVIL: {
        id: 'anvil',
        name: '金床',
        cost: 3,
        types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1。手札の財宝を1枚捨ててもよい。捨てたらコスト4以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => game.isTreasure(card),
                title: '金床',
                message: '財宝を1枚捨てると、コスト4以下のカードを1枚獲得します（捨てなくてもかまいません）。',
                confirmLabel: '捨てる',
                purpose: 'anvil',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    game.log(`${player.name}は${card.name}を捨てました`);
                    game.promptGain({ player, maxCost: 4, title: '金床', message: 'コスト4以下のカードを1枚獲得してください。' });
                }
            });
        }
    },
    WATCHTOWER: {
        id: 'watchtower',
        name: '物見やぐら',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '手札が6枚になるまでカードを引く。カードを獲得したとき、手札のこれを公開して、そのカードを廃棄するか山札の上に置いてもよい',
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game) => {
            const count = Math.max(0, 6 - player.hand.length);
            player.drawCards(count);
            game.log(`${player.name}は手札が${player.hand.length}枚になるまで引きました`);
        },
        onOwnGain: (player, game, watchtower, card) => {
            if (!player.discard.includes(card) && !player.hand.includes(card)) return;
            game.promptChoose({
                player,
                card,
                options: ['何もしない', '廃棄する', '山札の上に置く'],
                title: '物見やぐら',
                message: `獲得した${card.name}をどうしますか？`,
                purpose: 'watchtower',
                callback: ([choice]) => {
                    if (choice === 0 || !player.removeCard(card)) return;
                    game.log(`${player.name}は物見やぐらを公開しました`);
                    if (choice === 1) {
                        game.trashCard(player, card);
                        game.log(`${player.name}は${card.name}を廃棄しました`);
                    } else {
                        player.deck.unshift(card);
                        game.log(`${player.name}は${card.name}を山札の上に置きました`);
                    }
                }
            });
        }
    },

    // ===== コスト4 =====
    BISHOP: {
        id: 'bishop',
        name: '司教',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +1。勝利点トークン +1。手札のカードを1枚廃棄し、そのコストの半分（切り捨て）の勝利点トークンを得る。他のプレイヤーは手札を1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 1, vp: 1 });
            promptTrashFromHand(game, player, {
                title: '司教',
                message: '廃棄するカードを1枚選んでください。コストの半分の勝利点トークンを得ます。',
                purpose: 'bishop-trash',
                callback: ([trashed]) => {
                    const vp = trashed ? Math.floor(game.getCost(trashed) / 2) : 0;
                    if (vp > 0) gainBenefits(player, game, { vp });
                }
            });
            game.runNext(...game.getOtherPlayers(player).map(other => () => promptTrashFromHand(game, other, {
                min: 0,
                title: '司教',
                message: '廃棄するカードを1枚選んでください（選ばなくてもかまいません）。',
                purpose: 'optional-trash'
            })));
        }
    },
    CLERK: {
        id: 'clerk',
        name: '書記',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。手札が5枚以上の他のプレイヤーは、手札を1枚山札の上に置く。ターンの開始時に、手札のこれをプレイしてもよい',
        isAttack: true,
        reactionType: 'startOfTurn',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length < 5) return;
                promptFromHand(game, target, {
                    title: '書記',
                    message: '山札の上に置くカードを1枚選んでください。',
                    confirmLabel: '山札の上に置く',
                    purpose: 'topdeck-from-hand',
                    callback: ([card]) => {
                        target.hand.splice(target.hand.indexOf(card), 1);
                        target.deck.unshift(card);
                        game.log(`${target.name}はカードを1枚山札の上に置きました`);
                    }
                });
            });
        },
        onStartOfTurn: (player, game, card) => {
            game.promptConfirm({
                player,
                card,
                title: '書記',
                message: '手札の書記をプレイしますか？（アクションは使いません）',
                yesLabel: 'プレイする',
                noLabel: 'プレイしない',
                purpose: 'clerk-start',
                callback: (yes) => {
                    if (yes && player.hand.includes(card)) game.playCardFrom(player, card);
                }
            });
        }
    },
    INVESTMENT: {
        id: 'investment',
        name: '投資',
        cost: 4,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '手札のカードを1枚廃棄する。財宝 +1 か、このカードを廃棄して手札を公開し、異なる名前の財宝1種につき勝利点トークン +1 のどちらかを選ぶ',
        count: 10,
        onPlay: (player, game, investment) => {
            promptTrashFromHand(game, player, {
                title: '投資',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'investment-trash'
            });
            game.runNext(() => {
                const treasureNames = new Set(player.hand.filter(card => game.isTreasure(card)).map(card => card.id));
                const canTrash = player.playArea.includes(investment);
                game.promptChoose({
                    player,
                    options: ['財宝 +1', ...(canTrash ? [`投資を廃棄して勝利点トークン +${treasureNames.size}`] : [])],
                    title: '投資',
                    message: 'どちらかを選んでください。',
                    purpose: 'investment',
                    callback: ([choice]) => {
                        if (choice === 0) {
                            gainBenefits(player, game, { coins: 1 });
                            return;
                        }
                        player.playArea.splice(player.playArea.indexOf(investment), 1);
                        game.trashCard(player, investment);
                        logReveal(game, player, player.hand);
                        gainBenefits(player, game, { vp: treasureNames.size });
                    }
                });
            });
        }
    },
    MONUMENT: {
        id: 'monument',
        name: '記念碑',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。勝利点トークン +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { coins: 2, vp: 1 })
    },
    QUARRY: {
        id: 'quarry',
        name: '石切場',
        cost: 4,
        types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1。これが場にある間、アクションカードのコストは2少なくなる',
        count: 10
    },
    TIARA: {
        id: 'tiara',
        name: 'ティアラ',
        cost: 4,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '購入 +1。このターン、カードを獲得したとき山札の上に置いてもよい。手札の財宝を1枚、2回プレイしてもよい',
        count: 10,
        onPlay: (player, game, tiara) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.tiara = true;
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => game.isTreasure(card),
                title: 'ティアラ',
                message: '2回プレイする財宝を選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'tiara',
                callback: ([card]) => {
                    if (card) game.playMultipleTimes(player, card, 2, tiara);
                }
            });
        }
    },
    WORKERS_VILLAGE: {
        id: 'workers_village',
        name: '労働者の村',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。購入 +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2, buys: 1 })
    },

    // ===== コスト5 =====
    CHARLATAN: {
        id: 'charlatan',
        name: 'ペテン師',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +3。他のプレイヤーは呪いを1枚獲得する。これを使うゲームでは、呪いは財宝 +1 の財宝でもある',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 3 });
            curseAttack(game, player);
        }
    },
    CITY: {
        id: 'city',
        name: '都市',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。空のサプライの山が1つ以上あればさらにカードを1枚引き、2つ以上あれば財宝 +1、購入 +1',
        count: 10,
        onPlay: (player, game) => {
            const empty = game.countEmptySupplyPiles();
            gainBenefits(player, game, {
                cards: empty >= 1 ? 2 : 1,
                actions: 2,
                coins: empty >= 2 ? 1 : 0,
                buys: empty >= 2 ? 1 : 0
            });
        }
    },
    COLLECTION: {
        id: 'collection',
        name: '収集品',
        cost: 5,
        types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。購入 +1。このターン、アクションカードを獲得するたびに勝利点トークン +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.collections += 1;
        }
    },
    CRYSTAL_BALL: {
        id: 'crystal_ball',
        name: '水晶玉',
        cost: 5,
        types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1。山札の一番上を見て、廃棄するか、捨て札にするか、アクションか財宝ならプレイしてもよい',
        count: 10,
        onPlay: (player, game) => {
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            const playable = isAction(card) || game.isTreasure(card);
            const options = ['山札に戻す', '廃棄する', '捨て札にする', ...(playable ? ['プレイする'] : [])];
            game.promptChoose({
                player,
                card,
                options,
                title: '水晶玉',
                message: `山札の一番上は${card.name}です。どうしますか？`,
                purpose: 'crystal-ball',
                callback: ([choice]) => {
                    if (choice === 0) {
                        player.deck.unshift(card);
                    } else if (choice === 1) {
                        game.trashCard(player, card);
                        game.log(`${player.name}は${card.name}を廃棄しました`);
                    } else if (choice === 2) {
                        game.log(`${player.name}は${card.name}を捨て札にしました`);
                        game.discardCards(player, [card]);
                    } else if (game.isTreasure(card) && !isAction(card)) {
                        game.log(`${player.name}は${card.name}をプレイしました`);
                        game.playTreasure(player, card);
                    } else {
                        game.playCardFrom(player, card, { remove: false });
                    }
                }
            });
        }
    },
    MAGNATE: {
        id: 'magnate',
        name: '大物',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札を公開し、その中の財宝1枚につきカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            logReveal(game, player, player.hand);
            gainBenefits(player, game, { cards: player.hand.filter(card => game.isTreasure(card)).length });
        }
    },
    MINT: {
        id: 'mint',
        name: '造幣所',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札の財宝を1枚公開してもよい。公開したら同じカードを1枚獲得する。これを購入したとき、場の財宝（持続を除く）をすべて廃棄する',
        count: 10,
        onPlay: (player, game) => {
            promptFromHand(game, player, {
                min: 0,
                filter: isTreasure,
                title: '造幣所',
                message: '同じカードを獲得する財宝を公開してください（選ばなくてもかまいません）。',
                confirmLabel: '公開する',
                purpose: 'mint',
                callback: ([card]) => {
                    if (card && game.gainCardFromSupply(player, card.id)) {
                        game.log(`${player.name}は${card.name}を獲得しました`);
                    }
                }
            });
        },
        onBuy: (player, game) => {
            const treasures = player.playArea.filter(card => game.isTreasure(card) && !player.hasPendingDuration(card));
            treasures.forEach(card => {
                player.playArea.splice(player.playArea.indexOf(card), 1);
                game.trashCard(player, card);
            });
            if (treasures.length > 0) game.log(`${player.name}は場の財宝（${names(treasures)}）を廃棄しました`);
        }
    },
    RABBLE: {
        id: 'rabble',
        name: '大衆',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。他のプレイヤーは山札の上から3枚を公開し、アクションと財宝を捨て札にして、残りを好きな順で山札の上に戻す',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            game.attackOtherPlayers(player, (target) => {
                const revealed = takeTopCards(target, 3);
                if (revealed.length === 0) return;
                game.log(`${target.name}は${names(revealed)}を公開しました`);
                const discarded = revealed.filter(card => isAction(card) || isTreasure(card));
                if (discarded.length > 0) game.log(`${target.name}は${names(discarded)}を捨て札にしました`);
                game.discardCards(target, discarded);
                putBackInAnyOrder(game, target, revealed.filter(card => !discarded.includes(card)), '大衆');
            });
        }
    },
    VAULT: {
        id: 'vault',
        name: '保管庫',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。手札を好きな枚数捨て、1枚につき財宝 +1。他のプレイヤーは手札を2枚捨ててもよい。捨てたらカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            game.promptSelect({
                player,
                cards: player.hand,
                title: '保管庫',
                message: '捨てるカードを選んでください。1枚につき財宝+1を得ます。',
                confirmLabel: '捨てる',
                purpose: 'vault-discard',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices);
                    if (discarded.length > 0) {
                        game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
                        gainBenefits(player, game, { coins: discarded.length });
                    }
                }
            });
            game.runNext(...game.getOtherPlayers(player).map(other => () => {
                if (other.hand.length === 0) return;
                game.promptSelect({
                    player: other,
                    cards: other.hand,
                    min: 0,
                    max: 2,
                    title: '保管庫',
                    message: '手札を2枚捨てると、カードを1枚引きます（捨てなくてもかまいません）。',
                    confirmLabel: '捨てる',
                    purpose: 'vault-other',
                    callback: (indices) => {
                        const discarded = game.discardFromHand(other, indices);
                        if (discarded.length > 0) game.log(`${other.name}は手札を${discarded.length}枚捨てました`);
                        if (discarded.length === 2) gainBenefits(other, game, { cards: 1 });
                    }
                });
            }));
        }
    },
    WAR_CHEST: {
        id: 'war_chest',
        name: '軍資金',
        cost: 5,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '左隣のプレイヤーがカードを1種指定する。このターンに軍資金で指定されていない、コスト5以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            const left = game.getPlayerToLeft(player);
            game.promptNameCard({
                player: left,
                title: '軍資金',
                message: `${player.name}が獲得できなくなるカードを1種指定してください。`,
                purpose: 'war-chest-name',
                callback: (named) => {
                    game.turnState.warChestNamed.push(named.id);
                    game.promptGain({
                        player,
                        maxCost: 5,
                        filter: (data) => !game.turnState.warChestNamed.includes(data.id),
                        title: '軍資金',
                        message: `コスト5以下のカードを1枚獲得してください（${named.name}は獲得できません）。`
                    });
                }
            });
        }
    },

    // ===== コスト6 =====
    GRAND_MARKET: {
        id: 'grand_market',
        name: '大市場',
        cost: 6,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。財宝 +2。場に銅貨があるときは購入できない',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, buys: 1, coins: 2 }),
        canBuy: (player) => !player.playArea.some(card => card.id === 'copper')
    },
    HOARD: {
        id: 'hoard',
        name: '隠し財産',
        cost: 6,
        types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。これが場にある間、勝利点カードを購入するたびに金貨を1枚獲得する',
        count: 10,
        onBuyWhileInPlay: (player, game, hoard, bought) => {
            if (isVictory(bought) && game.gainCardFromSupply(player, 'gold')) {
                game.log(`${player.name}は隠し財産の効果で金貨を獲得しました`);
            }
        }
    },

    // ===== コスト7 =====
    BANK: {
        id: 'bank',
        name: '銀行',
        cost: 7,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '場の財宝1枚につき財宝 +1（これを含む）',
        count: 10,
        onPlay: (player, game) => {
            const coins = player.playArea.filter(card => game.isTreasure(card)).length;
            gainBenefits(player, game, { coins }, '銀行');
        }
    },
    EXPAND: {
        id: 'expand',
        name: '拡張',
        cost: 7,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄し、それよりコストが最大3多いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '拡張',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'remodel-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const maxCost = game.getCost(trashed) + 3;
                    game.promptGain({ player, maxCost, title: '拡張', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
                }
            });
        }
    },
    FORGE: {
        id: 'forge',
        name: '鍛造',
        cost: 7,
        types: [CARD_TYPES.ACTION],
        description: '手札を好きな枚数廃棄し、廃棄したカードのコストの合計とちょうど同じコストのカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            const gain = (trashed) => {
                const cost = trashed.reduce((sum, card) => sum + game.getCost(card), 0);
                game.promptGain({ player, exactCost: cost, title: '鍛造', message: `コストがちょうど${cost}のカードを1枚獲得してください。` });
            };
            if (player.hand.length === 0) {
                gain([]);
                return;
            }
            game.promptSelect({
                player,
                cards: player.hand,
                title: '鍛造',
                message: '廃棄するカードを選んでください。コストの合計と同じコストのカードを獲得します。',
                confirmLabel: '廃棄する',
                purpose: 'forge',
                callback: (indices) => {
                    const trashed = game.trashFromHand(player, indices);
                    if (trashed.length > 0) game.log(`${player.name}は${names(trashed)}を廃棄しました`);
                    gain(trashed);
                }
            });
        }
    },
    KINGS_COURT: {
        id: 'kings_court',
        name: '宮廷',
        cost: 7,
        types: [CARD_TYPES.ACTION],
        description: '手札のアクションカードを1枚選び、3回プレイしてもよい',
        count: 10,
        onPlay: (player, game, kingsCourt) => {
            promptFromHand(game, player, {
                min: 0,
                filter: isAction,
                title: '宮廷',
                message: '3回プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '3回プレイする',
                purpose: 'throne-room',
                callback: ([card]) => {
                    if (card) game.playMultipleTimes(player, card, 3, kingsCourt);
                }
            });
        }
    },

    // ===== コスト8 =====
    PEDDLER: {
        id: 'peddler',
        name: '行商人',
        cost: 8,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。購入フェーズの間、場のアクションカード1枚につきコストが2少なくなる',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 })
    }
};
