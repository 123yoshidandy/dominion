/**
 * 拡張「錬金術」の王国カードデータとポーション
 * potionCost はコストのポーションの数。ポーションのコストのカードは、場のポーション（player.potions）を使って購入する
 * onCleanup は、クリーンアップで場から捨て札にするときの効果
 */

import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, names, gainBenefits, promptTrashFromHand, takeTopCards, putBackInAnyOrder,
    logReveal, curseAttack
} from './card-helpers.js';

// ポーション（王国カードにポーションのコストのカードがあるときだけサプライに置く）
export const ALCHEMY_BASIC_CARDS = {
    POTION: {
        id: 'potion',
        name: 'ポーション',
        cost: 4,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: 'ポーション +1（ポーションのコストのカードを購入するのに使う）',
        count: 16,
        onPlay: (player) => {
            player.potions += 1;
        }
    }
};

// 場のカードを山札の上に置く
const topdeckFromPlay = (player, game, card) => {
    const index = player.playArea.indexOf(card);
    if (index < 0) return;
    player.playArea.splice(index, 1);
    player.deck.unshift(card);
    game.log(`${player.name}は${card.name}を山札の上に置きました`);
};

// 念視の泉：山札の一番上のカードを公開させ、捨て札にするか戻すかを選ぶ
const scry = (game, chooser, target) => {
    const [card] = takeTopCards(target, 1);
    if (!card) return;
    game.log(`${target.name}は山札の一番上の${card.name}を公開しました`);
    const own = chooser === target;
    game.promptConfirm({
        player: chooser,
        card,
        title: '念視の泉',
        message: `${own ? '自分' : target.name}の山札の一番上の${card.name}を捨て札にしますか？`,
        yesLabel: '捨て札にする',
        noLabel: '山札に戻す',
        purpose: own ? 'scrying-pool-self' : 'scrying-pool-other',
        callback: (discard) => {
            if (discard) {
                game.discardCards(target, [card]);
                game.log(`${target.name}は${card.name}を捨て札にしました`);
            } else {
                target.deck.unshift(card);
            }
        }
    });
};

export const ALCHEMY_CARDS = {
    // ===== コスト0＋ポーション =====
    TRANSMUTE: {
        id: 'transmute',
        name: '変成',
        cost: 0,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。それがアクションなら公領、財宝なら変成、勝利点なら金貨を1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '変成',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'transmute-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    [[isAction, 'duchy'], [isTreasure, 'transmute'], [isVictory, 'gold']]
                        .filter(([is]) => is(trashed))
                        .forEach(([, cardId]) => {
                            const gained = game.gainCardFromSupply(player, cardId);
                            if (gained) game.log(`${player.name}は${gained.name}を獲得しました`);
                        });
                }
            });
        }
    },
    VINEYARD: {
        id: 'vineyard',
        name: 'ブドウ園',
        cost: 0,
        potionCost: 1,
        types: [CARD_TYPES.VICTORY],
        description: '持っているアクションカード3枚につき勝利点 1（端数切り捨て）',
        pointsFor: (allCards) => Math.floor(allCards.filter(isAction).length / 3)
    },

    // ===== コスト2 =====
    HERBALIST: {
        id: 'herbalist',
        name: '薬草商',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +1。これを場から捨て札にするとき、場の財宝を1枚山札の上に置いてもよい',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1, coins: 1 }),
        onCleanup: (player, game) => {
            const treasures = player.playArea.filter(card => isTreasure(card) && !player.hasPendingDuration(card));
            if (treasures.length === 0) return;
            game.promptSelect({
                player,
                cards: treasures,
                min: 0,
                max: 1,
                title: '薬草商',
                message: '山札の上に置く場の財宝を選んでください（選ばなくてもかまいません）。',
                confirmLabel: '山札の上に置く',
                purpose: 'herbalist',
                callback: ([index]) => {
                    if (index !== undefined) topdeckFromPlay(player, game, treasures[index]);
                }
            });
        }
    },

    // ===== コスト2＋ポーション =====
    APOTHECARY: {
        id: 'apothecary',
        name: '薬師',
        cost: 2,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の上から4枚を公開し、銅貨とポーションを手札に加え、残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const revealed = takeTopCards(player, 4);
            logReveal(game, player, revealed, '山札の上から4枚');
            const toHand = revealed.filter(card => ['copper', 'potion'].includes(card.id));
            player.hand.push(...toHand);
            if (toHand.length > 0) game.log(`${player.name}は${names(toHand)}を手札に加えました`);
            putBackInAnyOrder(game, player, revealed.filter(card => !toHand.includes(card)), '薬師');
        }
    },
    SCRYING_POOL: {
        id: 'scrying_pool',
        name: '念視の泉',
        cost: 2,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。各プレイヤー（自分も）は山札の一番上を公開し、あなたの選んだ方で捨て札にするか戻す。その後、アクション以外が出るまで山札を公開し、公開したカードをすべて手札に加える',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            game.runNext(
                () => scry(game, player, player),
                () => game.attackOtherPlayers(player, (target) => scry(game, player, target)),
                () => {
                    const revealed = [];
                    for (;;) {
                        const [card] = takeTopCards(player, 1);
                        if (!card) break;
                        revealed.push(card);
                        if (!isAction(card)) break;
                    }
                    player.hand.push(...revealed);
                    if (revealed.length > 0) game.log(`${player.name}は${names(revealed)}を公開して手札に加えました`);
                }
            );
        }
    },
    UNIVERSITY: {
        id: 'university',
        name: '大学',
        cost: 2,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +2。コスト5以下のアクションカードを1枚獲得してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 2 });
            game.promptGain({
                player,
                maxCost: 5,
                filter: isAction,
                optional: true,
                title: '大学',
                message: 'コスト5以下のアクションカードを1枚獲得できます（選ばなくてもかまいません）。'
            });
        }
    },

    // ===== コスト3＋ポーション =====
    ALCHEMIST: {
        id: 'alchemist',
        name: '錬金術師',
        cost: 3,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1。これを場から捨て札にするとき、場にポーションがあれば、これを山札の上に置いてもよい',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2, actions: 1 }),
        onCleanup: (player, game, alchemist) => {
            if (!player.playArea.some(card => card.id === 'potion')) return;
            game.promptConfirm({
                player,
                card: alchemist,
                title: '錬金術師',
                message: '場にポーションがあります。錬金術師を山札の上に置きますか？',
                yesLabel: '山札の上に置く',
                noLabel: '捨て札にする',
                purpose: 'alchemist-topdeck',
                callback: (yes) => {
                    if (yes) topdeckFromPlay(player, game, alchemist);
                }
            });
        }
    },
    FAMILIAR: {
        id: 'familiar',
        name: '使い魔',
        cost: 3,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。他のプレイヤーは呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            curseAttack(game, player);
        }
    },
    PHILOSOPHERS_STONE: {
        id: 'philosophers_stone',
        name: '賢者の石',
        cost: 3,
        potionCost: 1,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: 'プレイしたとき、山札と捨て札の枚数を数え、5枚につき財宝 +1（端数切り捨て）',
        count: 10,
        onPlay: (player, game) => {
            const coins = Math.floor((player.deck.length + player.discard.length) / 5);
            player.coins += coins;
            game.log(`${player.name}は賢者の石で財宝+${coins}を得ました`);
        }
    },

    // ===== コスト4＋ポーション =====
    GOLEM: {
        id: 'golem',
        name: 'ゴーレム',
        cost: 4,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: 'ゴーレム以外のアクションカードが2枚出るまで山札を公開する。他のカードを捨て札にし、そのアクションカードを好きな順でプレイする',
        count: 10,
        onPlay: (player, game) => {
            const actions = [];
            const others = [];
            while (actions.length < 2) {
                const [card] = takeTopCards(player, 1);
                if (!card) break;
                (isAction(card) && card.id !== 'golem' ? actions : others).push(card);
            }
            logReveal(game, player, [...actions, ...others], '山札のカード');
            // 公開したアクションカードは、プレイするまで脇に置いておく
            player.setAside.push(...actions);
            game.discardCards(player, others);
            const playInOrder = (ordered) => game.runNext(...ordered.map(card => () => {
                if (player.setAside.includes(card)) game.playCardFrom(player, card);
            }));
            if (actions.length < 2 || actions[0].id === actions[1].id) {
                playInOrder(actions);
                return;
            }
            game.runNext(() => game.promptSelect({
                player,
                cards: actions,
                min: 1,
                max: 1,
                title: 'ゴーレム',
                message: '先にプレイするカードを選んでください。',
                confirmLabel: '先にプレイする',
                purpose: 'golem-first',
                callback: ([index]) => playInOrder([actions[index], actions[1 - index]])
            }));
        }
    },

    // ===== コスト5 =====
    APPRENTICE: {
        id: 'apprentice',
        name: '弟子',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。手札のカードを1枚廃棄し、そのコスト1につきカードを1枚引く。コストにポーションがあればさらにカードを2枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            promptTrashFromHand(game, player, {
                title: '弟子',
                message: '廃棄するカードを1枚選んでください。コストの分だけカードを引きます。',
                purpose: 'apprentice-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const count = game.getCost(trashed) + 2 * game.getPotionCost(trashed);
                    if (count > 0) gainBenefits(player, game, { cards: count }, '弟子');
                }
            });
        }
    },

    // ===== コスト6＋ポーション =====
    POSSESSION: {
        id: 'possession',
        name: '支配',
        cost: 6,
        potionCost: 1,
        types: [CARD_TYPES.ACTION],
        description: '左隣のプレイヤーは、このターンの後に追加のターンを行う。そのターンはあなたがすべての選択をし、そのプレイヤーが獲得するカードは代わりにあなたが獲得する。そのプレイヤーの廃棄されたカードは、ターンの終わりにそのプレイヤーの捨て札に戻る',
        count: 10,
        onPlay: (player, game) => {
            game.queuePossession(player);
            game.log(`${game.getPlayerToLeft(player).name}は${player.name}に支配された追加のターンを行います`);
        }
    }
};
