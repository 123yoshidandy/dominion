/**
 * 拡張「冒険」の王国カードデータ、トラベラーの上位カード、イベント
 * - リザーブ：プレイすると酒場マットに置き、決まったときに呼び出す（onCallStartOfTurn・onCallAfterAction・onCallOnGain）
 * - トラベラー：場から捨て札にするとき、exchangeFor のカードと交換できる（上位のカードはサプライ外の山）
 * - トークン：山に置く +1 カードなど（player.pileTokens）と、-1 カード・-1 財宝・旅のトークン（player の項目）
 * - イベント：カードではなく、購入フェーズに購入して効果を使う（LANDSCAPES に入る）
 */

import Card from './card.js';
import { CARD_TYPES, LANDSCAPE_KINDS } from './card-types.js';
import {
    isAction, isTreasure, isCurse, names, gainBenefits, promptFromHand, promptTrashFromHand, promptDiscardFromHand,
    takeTopCards, putBackInAnyOrder, logReveal
} from './card-helpers.js';

const isAttack = (card) => card.types.includes(CARD_TYPES.ATTACK);
const isTraveller = (card) => card.types.includes(CARD_TYPES.TRAVELLER);

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};

// 場のカードを酒場マットに置く（リザーブ）
const putOnTavern = (player, game, card) => {
    const index = player.playArea.indexOf(card);
    if (index < 0) return;
    player.playArea.splice(index, 1);
    player.mats.tavern.push(card);
    game.log(`${player.name}は${card.name}を酒場マットに置きました`);
};

// 酒場マットのカードを呼び出すか聞き、呼び出したら effect を使う
const offerCall = (player, game, card, message, purpose, effect) => game.promptConfirm({
    player,
    card,
    title: card.name,
    message,
    yesLabel: '呼び出す',
    noLabel: '呼び出さない',
    purpose,
    callback: (yes) => {
        if (yes && game.callReserve(player, card)) effect();
    }
});

// 旅のトークンを裏返し、表になったかを返す
const flipJourney = (player, game) => {
    player.journeyFaceUp = !player.journeyFaceUp;
    game.log(`${player.name}は旅のトークンを${player.journeyFaceUp ? '表' : '裏'}にしました`);
    return player.journeyFaceUp;
};

// 山のトークンを動かす（kind は plusCard・plusAction・plusBuy・plusCoin・minusCost・trashing）
const TOKEN_LABELS = {
    plusCard: '+1 カード', plusAction: '+1 アクション', plusBuy: '+1 購入', plusCoin: '+1 財宝', minusCost: '-2 コスト', trashing: '廃棄'
};
const moveToken = (player, game, kind, { title, filter } = {}) => game.promptActionPile({
    player,
    title,
    message: `${TOKEN_LABELS[kind]}のトークンを置くアクションの山を選んでください。`,
    purpose: `token-${kind}`,
    filter,
    callback: (pileId) => {
        player.pileTokens[kind] = pileId;
        game.log(`${player.name}は${TOKEN_LABELS[kind]}のトークンを${game.getPileName(pileId)}の山に置きました`);
    }
});

// 持続：今と次のターンの開始時に同じ効果を使う
const nowAndNextTurn = (player, game, card, effect) => {
    effect();
    player.addDuration(card, () => effect());
};

// ===== トラベラーの上位カード（サプライ外） =====
export const TRAVELLER_CARDS = {
    TREASURE_HUNTER: {
        id: 'treasure_hunter', name: 'トレジャーハンター', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: 'アクション +1。財宝 +1。右隣のプレイヤーが直前のターンに獲得したカード1枚につき、銀貨を1枚獲得する。場から捨て札にするとき、戦士と交換してもよい（サプライにない）',
        exchangeFor: 'warrior',
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, coins: 1 });
            const count = game.getPlayerToRight(player).gainedLastTurn.length;
            const gained = Array.from({ length: count }).filter(() => game.gainCardFromSupply(player, 'silver')).length;
            if (gained > 0) game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
        }
    },
    WARRIOR: {
        id: 'warrior', name: '戦士', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: 'カードを2枚引く。場のトラベラー（これを含む）1枚につき、他のプレイヤーは山札の一番上を捨て札にし、それがコスト3か4なら廃棄する。場から捨て札にするとき、英雄と交換してもよい（サプライにない）',
        isAttack: true,
        exchangeFor: 'hero',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            const count = player.playArea.filter(isTraveller).length;
            game.attackOtherPlayers(player, (target) => {
                for (let i = 0; i < count; i++) {
                    const [card] = takeTopCards(target, 1);
                    if (!card) return;
                    const cost = game.getCost(card);
                    if ((cost === 3 || cost === 4) && !game.getPotionCost(card)) {
                        game.trashCard(target, card);
                        game.log(`${target.name}は山札の一番上の${card.name}を廃棄しました`);
                    } else {
                        game.discardCards(target, [card]);
                        game.log(`${target.name}は山札の一番上の${card.name}を捨て札にしました`);
                    }
                }
            });
        }
    },
    HERO: {
        id: 'hero', name: '英雄', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: '財宝 +2。財宝カードを1枚獲得する。場から捨て札にするとき、チャンピオンと交換してもよい（サプライにない）',
        exchangeFor: 'champion',
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.promptGain({ player, filter: (data) => data.types.includes(CARD_TYPES.TREASURE), title: '英雄', message: '財宝カードを1枚獲得してください。' });
        }
    },
    CHAMPION: {
        id: 'champion', name: 'チャンピオン', cost: 6, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +1。ゲームの終わりまで場に残り、他のプレイヤーのアタックの影響を受けず、アクションをプレイするたびにアクション +1（サプライにない）',
        onPlay: (player, game, champion) => {
            gainBenefits(player, game, { actions: 1 });
            player.addDuration(champion, null, { permanent: true });
        }
    },
    SOLDIER: {
        id: 'soldier', name: '兵士', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: '財宝 +2。場の他のアタックカード1枚につき財宝 +1。手札が4枚以上の他のプレイヤーは手札を1枚捨てる。場から捨て札にするとき、脱走兵と交換してもよい（サプライにない）',
        isAttack: true,
        exchangeFor: 'fugitive',
        onPlay: (player, game, soldier) => {
            gainBenefits(player, game, { coins: 2 + player.playArea.filter(card => card !== soldier && isAttack(card)).length });
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length >= 4) promptDiscardFromHand(game, target, 1, '兵士');
            });
        }
    },
    FUGITIVE: {
        id: 'fugitive', name: '脱走兵', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: 'カードを2枚引く。アクション +1。手札を1枚捨てる。場から捨て札にするとき、門弟と交換してもよい（サプライにない）',
        exchangeFor: 'disciple',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2, actions: 1 });
            promptDiscardFromHand(game, player, 1, '脱走兵');
        }
    },
    DISCIPLE: {
        id: 'disciple', name: '門弟', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: '手札のアクションカードを1枚、2回プレイしてもよい。そのカードを1枚獲得する。場から捨て札にするとき、教師と交換してもよい（サプライにない）',
        exchangeFor: 'teacher',
        onPlay: (player, game, disciple) => {
            promptFromHand(game, player, {
                min: 0,
                filter: isAction,
                title: '門弟',
                message: '2回プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'throne-room',
                callback: ([card]) => {
                    if (!card) return;
                    game.runNext(() => gainAndLog(game, player, card.id));
                    game.playMultipleTimes(player, card, 2, disciple, { asTreasure: false });
                }
            });
        }
    },
    TEACHER: {
        id: 'teacher', name: '教師', cost: 6, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: '酒場マットに置く。ターンの開始時に呼び出して、+1 カード・+1 アクション・+1 購入・+1 財宝のトークンのどれかを、自分のトークンのないアクションの山に動かしてもよい（サプライにない）',
        onPlay: (player, game, teacher) => putOnTavern(player, game, teacher),
        onCallStartOfTurn: (player, game, teacher) => offerCall(player, game, teacher, '教師を呼び出して、トークンを動かしますか？', 'call-teacher', () => {
            const kinds = ['plusCard', 'plusAction', 'plusBuy', 'plusCoin'];
            game.promptChoose({
                player,
                card: teacher,
                options: kinds.map(kind => TOKEN_LABELS[kind]),
                title: '教師',
                message: '動かすトークンを選んでください。',
                purpose: 'teacher-token',
                callback: ([index]) => {
                    const used = new Set(Object.values(player.pileTokens));
                    moveToken(player, game, kinds[index], { title: '教師', filter: (pileId) => !used.has(pileId) });
                }
            });
        })
    }
};

// ===== 王国カード =====
export const ADVENTURES_CARDS = {
    // ===== コスト2 =====
    COIN_OF_THE_REALM: {
        id: 'coin_of_the_realm', name: '王国の硬貨', cost: 2, types: [CARD_TYPES.TREASURE, CARD_TYPES.RESERVE],
        value: 1,
        description: '財宝 +1。プレイしたとき、酒場マットに置く。アクションを解決した直後に呼び出して、アクション +2 を得てもよい',
        count: 10,
        onPlay: (player, game, coin) => putOnTavern(player, game, coin),
        onCallAfterAction: (player, game, coin) => offerCall(player, game, coin, '王国の硬貨を呼び出して、アクション+2を得ますか？', 'call-coin-of-the-realm', () => {
            gainBenefits(player, game, { actions: 2 });
        })
    },
    PAGE: {
        id: 'page', name: '小姓', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: 'カードを1枚引く。アクション +1。場から捨て札にするとき、トレジャーハンターと交換してもよい',
        count: 10,
        exchangeFor: 'treasure_hunter',
        nonSupplyPiles: { treasure_hunter: 5, warrior: 5, hero: 5, champion: 5 },
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1 })
    },
    PEASANT: {
        id: 'peasant', name: '農民', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.TRAVELLER],
        description: '購入 +1。財宝 +1。場から捨て札にするとき、兵士と交換してもよい',
        count: 10,
        exchangeFor: 'soldier',
        nonSupplyPiles: { soldier: 5, fugitive: 5, disciple: 5, teacher: 5 },
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1, coins: 1 })
    },
    RATCATCHER: {
        id: 'ratcatcher', name: 'ネズミ捕り', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: 'カードを1枚引く。アクション +1。酒場マットに置く。ターンの開始時に呼び出して、手札のカードを1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            putOnTavern(player, game, card);
        },
        onCallStartOfTurn: (player, game, card) => {
            if (player.hand.length === 0) return;
            offerCall(player, game, card, 'ネズミ捕りを呼び出して、手札を1枚廃棄しますか？', 'call-ratcatcher', () => promptTrashFromHand(game, player, {
                title: 'ネズミ捕り', message: '廃棄するカードを1枚選んでください。', purpose: 'ratcatcher-trash'
            }));
        }
    },
    RAZE: {
        id: 'raze', name: '破壊', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。これか手札のカードを1枚廃棄する。廃棄したカードのコストと同じ枚数を山札の上から見て、1枚を手札に加え、残りを捨て札にする',
        count: 10,
        onPlay: (player, game, raze) => {
            gainBenefits(player, game, { actions: 1 });
            const candidates = [...(player.playArea.includes(raze) ? [raze] : []), ...player.hand];
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates, min: 1, max: 1,
                title: '破壊', message: '廃棄するカード（場の破壊か手札のカード）を選んでください。', confirmLabel: '廃棄する', purpose: 'raze-trash',
                callback: ([index]) => {
                    const trashed = candidates[index];
                    if (!player.removeCard(trashed)) return;
                    game.trashCard(player, trashed);
                    game.log(`${player.name}は${trashed.name}を廃棄しました`);
                    const looked = takeTopCards(player, game.getCost(trashed));
                    if (looked.length === 0) return;
                    game.promptSelect({
                        player, cards: looked, min: 1, max: 1,
                        title: '破壊', message: '手札に加えるカードを1枚選んでください。残りは捨て札にします。', confirmLabel: '手札に加える', purpose: 'raze-take',
                        callback: ([i]) => {
                            const [card] = looked.splice(i, 1);
                            player.hand.push(card);
                            game.discardCards(player, looked);
                            game.log(`${player.name}はカードを1枚手札に加え、${looked.length}枚を捨て札にしました`);
                        }
                    });
                }
            });
        }
    },

    // ===== コスト3 =====
    AMULET: {
        id: 'amulet', name: 'お守り', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '今と次のターンの開始時に、次のうち1つを選ぶ：財宝 +1、手札のカードを1枚廃棄する、銀貨を1枚獲得する',
        count: 10,
        onPlay: (player, game, amulet) => nowAndNextTurn(player, game, amulet, () => game.promptChoose({
            player,
            card: amulet,
            options: ['財宝 +1', '手札のカードを1枚廃棄する', '銀貨を1枚獲得する'],
            title: 'お守り',
            message: '1つ選んでください。',
            purpose: 'amulet',
            callback: ([index]) => {
                if (index === 0) gainBenefits(player, game, { coins: 1 });
                if (index === 1) promptTrashFromHand(game, player, { title: 'お守り', message: '廃棄するカードを1枚選んでください。', purpose: 'amulet-trash' });
                if (index === 2) gainAndLog(game, player, 'silver');
            }
        }))
    },
    CARAVAN_GUARD: {
        id: 'caravan_guard', name: '隊商の護衛', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを1枚引く。アクション +1。次のターンの開始時に財宝 +1。他のプレイヤーがアタックカードをプレイしたとき、手札のこれをプレイしてもよい',
        reactionType: 'attack',
        count: 10,
        onPlay: (player, game, guard) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            player.addDuration(guard, () => gainBenefits(player, game, { coins: 1 }, '隊商の護衛'));
        },
        onAttackReaction: (target, game, guard) => game.promptConfirm({
            player: target,
            card: guard,
            title: '隊商の護衛',
            message: '隊商の護衛をプレイしますか？',
            yesLabel: 'プレイする',
            noLabel: 'プレイしない',
            purpose: 'reaction-play',
            callback: (yes) => {
                if (yes && target.hand.includes(guard)) game.playCardFrom(target, guard);
            }
        })
    },
    DUNGEON: {
        id: 'dungeon', name: '地下牢', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +1。今と次のターンの開始時に、カードを2枚引き、手札を2枚捨てる',
        count: 10,
        onPlay: (player, game, dungeon) => {
            gainBenefits(player, game, { actions: 1 });
            nowAndNextTurn(player, game, dungeon, () => {
                gainBenefits(player, game, { cards: 2 }, '地下牢');
                promptDiscardFromHand(game, player, 2, '地下牢');
            });
        }
    },
    GEAR: {
        id: 'gear', name: '道具', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを2枚引く。手札を2枚まで脇に置く。次のターンの開始時に、それを手札に加える',
        count: 10,
        onPlay: (player, game, gear) => {
            gainBenefits(player, game, { cards: 2 });
            if (player.hand.length === 0) return;
            game.promptSelect({
                player, cards: player.hand, min: 0, max: 2,
                title: '道具', message: '次のターンまで脇に置くカードを2枚まで選んでください。', confirmLabel: '脇に置く', purpose: 'gear',
                callback: (indices) => {
                    const cards = indices.map(index => player.hand[index]);
                    if (cards.length === 0) return;
                    cards.forEach(card => player.hand.splice(player.hand.indexOf(card), 1));
                    player.setAside.push(...cards);
                    game.log(`${player.name}はカードを${cards.length}枚脇に置きました`);
                    player.addDuration(gear, () => {
                        const back = cards.filter(card => player.setAside.includes(card));
                        back.forEach(card => player.setAside.splice(player.setAside.indexOf(card), 1));
                        player.hand.push(...back);
                        game.log(`${player.name}は道具で脇に置いたカードを${back.length}枚手札に加えました`);
                    });
                }
            });
        }
    },
    GUIDE: {
        id: 'guide', name: '案内人', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: 'カードを1枚引く。アクション +1。酒場マットに置く。ターンの開始時に呼び出して、手札をすべて捨ててカードを5枚引いてもよい',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            putOnTavern(player, game, card);
        },
        onCallStartOfTurn: (player, game, card) => offerCall(player, game, card, '案内人を呼び出して、手札を捨てて5枚引きますか？', 'call-guide', () => {
            const discarded = game.discardFromHand(player, player.hand.map((c, i) => i));
            game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
            gainBenefits(player, game, { cards: 5 }, '案内人');
        })
    },

    // ===== コスト4 =====
    DUPLICATE: {
        id: 'duplicate', name: '複製', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: '酒場マットに置く。コスト6以下のカードを獲得したとき、呼び出して、そのカードをもう1枚獲得してもよい',
        count: 10,
        onPlay: (player, game, card) => putOnTavern(player, game, card),
        onCallOnGain: (player, game, duplicate, gained) => {
            if (game.getCost(gained) > 6 || game.getPotionCost(gained) || !(game.supply[game.pileOf[gained.id] ?? gained.id] > 0)) return;
            // 確認には獲得したカードを見せる（呼び出すかの判断に使うため）
            game.promptConfirm({
                player,
                card: gained,
                title: '複製',
                message: `複製を呼び出して、${gained.name}をもう1枚獲得しますか？`,
                yesLabel: '呼び出す',
                noLabel: '呼び出さない',
                purpose: 'call-duplicate',
                callback: (yes) => {
                    if (yes && game.callReserve(player, duplicate)) gainAndLog(game, player, gained.id);
                }
            });
        }
    },
    MAGPIE: {
        id: 'magpie', name: 'カササギ', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、財宝なら手札に加える。アクションか勝利点のカードなら、カササギを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            if (isTreasure(card)) {
                player.hand.push(card);
                game.log(`${player.name}は${card.name}を手札に加えました`);
                return;
            }
            player.deck.unshift(card);
            if (isAction(card) || card.types.includes(CARD_TYPES.VICTORY)) gainAndLog(game, player, 'magpie');
        }
    },
    MESSENGER: {
        id: 'messenger', name: '使者', cost: 4, types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +2。山札をすべて捨て札にしてもよい。このターン最初の購入でこれを購入したとき、コスト4以下のカードを1枚獲得し、他のプレイヤーもそれを1枚ずつ獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1, coins: 2 });
            if (player.deck.length === 0) return;
            game.promptConfirm({
                player,
                title: '使者',
                message: `山札（${player.deck.length}枚）をすべて捨て札にしますか？`,
                yesLabel: '捨て札にする',
                noLabel: 'そのままにする',
                purpose: 'messenger-deck',
                callback: (yes) => {
                    if (!yes) return;
                    player.discard.push(...player.deck.splice(0));
                    game.log(`${player.name}は山札をすべて捨て札にしました`);
                }
            });
        },
        onBuy: (player, game) => {
            if (game.turnState.cardsBought !== 1) return;
            game.promptGain({
                player, maxCost: 4, title: '使者', message: 'コスト4以下のカードを1枚獲得してください。他のプレイヤーも1枚ずつ獲得します。',
                onGained: (card) => game.getOtherPlayers(player).forEach(other => gainAndLog(game, other, card.id))
            });
        }
    },
    MISER: {
        id: 'miser', name: '守銭奴', cost: 4, types: [CARD_TYPES.ACTION],
        description: '次のうち1つを選ぶ：手札の銅貨を1枚酒場マットに置く、酒場マットの銅貨1枚につき財宝 +1',
        count: 10,
        onPlay: (player, game, miser) => {
            const onMat = player.mats.tavern.filter(card => card.id === 'copper').length;
            game.promptChoose({
                player,
                card: miser,
                options: ['手札の銅貨を1枚酒場マットに置く', `酒場マットの銅貨1枚につき財宝 +1（今は${onMat}枚）`],
                title: '守銭奴',
                message: '1つ選んでください。',
                purpose: 'miser',
                callback: ([index]) => {
                    if (index === 1) {
                        if (onMat > 0) gainBenefits(player, game, { coins: onMat });
                        return;
                    }
                    const copper = player.hand.find(card => card.id === 'copper');
                    if (!copper) return;
                    player.hand.splice(player.hand.indexOf(copper), 1);
                    player.mats.tavern.push(copper);
                    game.log(`${player.name}は銅貨を酒場マットに置きました`);
                }
            });
        }
    },
    PORT: {
        id: 'port', name: '港町', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。これを購入したとき、港町をもう1枚獲得する',
        count: 12,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onBuy: (player, game) => game.runNext(() => gainAndLog(game, player, 'port'))
    },
    RANGER: {
        id: 'ranger', name: 'レンジャー', cost: 4, types: [CARD_TYPES.ACTION],
        description: '購入 +1。旅のトークンを裏返す（最初は表）。表になったら、カードを5枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            if (flipJourney(player, game)) gainBenefits(player, game, { cards: 5 }, 'レンジャー');
        }
    },
    TRANSMOGRIFY: {
        id: 'transmogrify', name: '変容', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: 'アクション +1。酒場マットに置く。ターンの開始時に呼び出して、手札のカードを1枚廃棄し、それよりコストが1多いカードまでを1枚獲得して手札に加えてもよい',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { actions: 1 });
            putOnTavern(player, game, card);
        },
        onCallStartOfTurn: (player, game, card) => {
            if (player.hand.length === 0) return;
            offerCall(player, game, card, '変容を呼び出して、手札を1枚廃棄して改築しますか？', 'call-transmogrify', () => promptTrashFromHand(game, player, {
                title: '変容', message: '廃棄するカードを1枚選んでください。', purpose: 'upgrade-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const maxCost = game.getCost(trashed) + 1;
                    game.promptGain({
                        player, maxCost, potion: game.getPotionCost(trashed), destination: 'hand',
                        title: '変容', message: `コスト${maxCost}以下のカードを1枚獲得してください（手札に加えます）。`
                    });
                }
            }));
        }
    },

    // ===== コスト5 =====
    ARTIFICER: {
        id: 'artificer', name: '工匠', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。手札を好きな枚数捨てる。捨てた枚数とコストがちょうど同じカードを1枚獲得し、山札の上に置いてもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 });
            const gain = (count) => game.promptGain({
                player, exactCost: count, destination: 'deck', optional: true,
                title: '工匠', message: `コストがちょうど${count}のカードを1枚獲得できます（山札の上に置きます。選ばなくてもかまいません）。`
            });
            if (player.hand.length === 0) {
                gain(0);
                return;
            }
            game.promptSelect({
                player, cards: player.hand, min: 0, max: player.hand.length,
                title: '工匠', message: '捨てるカードを選んでください。捨てた枚数のコストのカードを獲得できます。', confirmLabel: '捨てる', purpose: 'artificer-discard',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices);
                    if (discarded.length > 0) game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
                    gain(discarded.length);
                }
            });
        }
    },
    BRIDGE_TROLL: {
        id: 'bridge_troll', name: 'トロルの橋', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '他のプレイヤーは -1 財宝のトークンを受け取る。今と次のターンの開始時に、購入 +1。これが場にある間、自分のターンにカードのコストは1少なくなる（0未満にはならない）',
        isAttack: true,
        count: 10,
        onPlay: (player, game, troll) => {
            game.attackOtherPlayers(player, (target) => {
                target.minusCoinToken = true;
                game.log(`${target.name}は -1 財宝のトークンを受け取りました`);
            });
            nowAndNextTurn(player, game, troll, () => gainBenefits(player, game, { buys: 1 }, 'トロルの橋'));
        }
    },
    DISTANT_LANDS: {
        id: 'distant_lands', name: '遠隔地', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE, CARD_TYPES.VICTORY],
        description: '酒場マットに置く。ゲームの終わりに酒場マットにあれば勝利点 4（そうでなければ勝利点 0）',
        points: 0,
        tavernPoints: 4,
        onPlay: (player, game, card) => putOnTavern(player, game, card)
    },
    GIANT: {
        id: 'giant', name: '巨人', cost: 5, types: [CARD_TYPES.ACTION],
        description: '旅のトークンを裏返す（最初は表）。裏になったら財宝 +1。表になったら財宝 +5、他のプレイヤーは山札の一番上を公開し、コスト3〜6なら廃棄し、それ以外なら捨て札にして呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            if (!flipJourney(player, game)) {
                gainBenefits(player, game, { coins: 1 });
                return;
            }
            gainBenefits(player, game, { coins: 5 });
            game.attackOtherPlayers(player, (target) => {
                const [card] = takeTopCards(target, 1);
                if (!card) return;
                const cost = game.getCost(card);
                if (cost >= 3 && cost <= 6 && !game.getPotionCost(card)) {
                    game.trashCard(target, card);
                    game.log(`${target.name}は山札の一番上の${card.name}を廃棄しました`);
                } else {
                    game.discardCards(target, [card]);
                    game.log(`${target.name}は山札の一番上の${card.name}を捨て札にしました`);
                    game.gainCurse(target);
                }
            });
        }
    },
    HAUNTED_WOODS: {
        id: 'haunted_woods', name: '幽霊の森', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンまで、他のプレイヤーはカードを購入するたびに、手札を好きな順で山札の上に置く。次のターンの開始時に、カードを3枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game, woods) => {
            game.attackOtherPlayers(player, (target) => player.hauntedVictims.add(target));
            player.addDuration(woods, () => gainBenefits(player, game, { cards: 3 }, '幽霊の森'));
        }
    },
    LOST_CITY: {
        id: 'lost_city', name: '失われし都市', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +2。これを獲得したとき、他のプレイヤーはカードを1枚引く',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2, actions: 2 }),
        onGain: (player, game) => game.getOtherPlayers(player).forEach(other => gainBenefits(other, game, { cards: 1 }, '失われし都市'))
    },
    RELIC: {
        id: 'relic', name: '聖遺物', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。プレイしたとき、他のプレイヤーは -1 カードのトークンを山札の上に置く（次に引くとき1枚少なく引く）',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => game.attackOtherPlayers(player, (target) => {
            target.minusCardToken = true;
            game.log(`${target.name}は -1 カードのトークンを山札の上に置きました`);
        })
    },
    ROYAL_CARRIAGE: {
        id: 'royal_carriage', name: '王家の馬車', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: 'アクション +1。酒場マットに置く。アクションを解決した直後、それがまだ場にあれば、呼び出してそのアクションをもう一度プレイしてもよい',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { actions: 1 });
            putOnTavern(player, game, card);
        },
        onCallAfterAction: (player, game, carriage, action) => {
            if (!player.playArea.includes(action)) return;
            offerCall(player, game, carriage, `王家の馬車を呼び出して、${action.name}をもう一度プレイしますか？`, 'call-royal-carriage', () => {
                game.log(`${player.name}は${action.name}をもう一度プレイしました`);
                game.runNext(
                    () => action.play(player, game),
                    () => {
                        // 持続カードを場に残すなら、王家の馬車も一緒に残す
                        if (player.hasPendingDuration(action)) player.addDuration(carriage, null);
                    }
                );
            });
        }
    },
    STORYTELLER: {
        id: 'storyteller', name: '語り部', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。財宝 +1。手札の財宝を3枚までプレイする。持っている財宝をすべて払い、払った1につきカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, coins: 1 });
            const pay = () => {
                const paid = player.coins;
                player.coins = 0;
                game.log(`${player.name}は財宝を${paid}払いました`);
                if (paid > 0) gainBenefits(player, game, { cards: paid }, '語り部');
            };
            const treasures = player.hand.filter(card => game.isTreasure(card));
            if (treasures.length === 0) {
                pay();
                return;
            }
            game.promptSelect({
                player, cards: treasures, min: 0, max: 3,
                title: '語り部', message: 'プレイする財宝を3枚まで選んでください。その後、財宝をすべて払ってカードを引きます。', confirmLabel: 'プレイする', purpose: 'storyteller',
                callback: (indices) => {
                    const cards = indices.map(index => treasures[index]);
                    if (cards.length > 0) game.log(`${player.name}は${names(cards)}をプレイしました`);
                    game.runNext(
                        ...cards.map(card => () => {
                            if (player.hand.includes(card)) game.playTreasure(player, card);
                        }),
                        pay
                    );
                }
            });
        }
    },
    SWAMP_HAG: {
        id: 'swamp_hag', name: '沼の妖婆', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンまで、他のプレイヤーはカードを購入するたびに呪いを1枚獲得する。次のターンの開始時に、財宝 +3',
        isAttack: true,
        count: 10,
        onPlay: (player, game, hag) => {
            game.attackOtherPlayers(player, (target) => player.swampHagVictims.set(target, (player.swampHagVictims.get(target) ?? 0) + 1));
            player.addDuration(hag, () => gainBenefits(player, game, { coins: 3 }, '沼の妖婆'));
        }
    },
    TREASURE_TROVE: {
        id: 'treasure_trove', name: '宝物', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。プレイしたとき、金貨と銅貨を1枚ずつ獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainAndLog(game, player, 'gold');
            gainAndLog(game, player, 'copper');
        }
    },
    WINE_MERCHANT: {
        id: 'wine_merchant', name: 'ワイン商', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.RESERVE],
        description: '購入 +1。財宝 +4。酒場マットに置く。購入フェーズの終わりに、使っていない財宝が2以上あれば、酒場マットのこれを捨て札にしてもよい',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { buys: 1, coins: 4 });
            putOnTavern(player, game, card);
        },
        onEndOfBuyPhaseFromTavern: (player, game, card) => {
            if (player.coins < 2) return;
            game.promptConfirm({
                player,
                card,
                title: 'ワイン商',
                message: '財宝が2以上残っています。酒場マットのワイン商を捨て札にしますか？',
                yesLabel: '捨て札にする',
                noLabel: 'そのままにする',
                purpose: 'wine-merchant',
                callback: (yes) => {
                    const index = player.mats.tavern.indexOf(card);
                    if (!yes || index < 0) return;
                    player.mats.tavern.splice(index, 1);
                    player.discard.push(card);
                    game.log(`${player.name}は酒場マットのワイン商を捨て札にしました`);
                }
            });
        }
    },

    // ===== コスト6 =====
    HIRELING: {
        id: 'hireling', name: '雇人', cost: 6, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'ゲームの終わりまで場に残り、自分のターンの開始時に毎回カードを1枚引く',
        count: 10,
        onPlay: (player, game, hireling) => {
            player.addDuration(hireling, () => gainBenefits(player, game, { cards: 1 }, '雇人'), { permanent: true });
        }
    }
};

// ===== イベント（カードではない。購入フェーズに購入して効果を使う） =====
const event = (key, data) => ({ [key]: { kind: LANDSCAPE_KINDS.EVENT, ...data } });

export const ADVENTURES_EVENTS = {
    ...event('ALMS', {
        id: 'alms', name: '施し', cost: 0, oncePerTurn: true,
        description: '1ターンに1回：場に財宝がなければ、コスト4以下のカードを1枚獲得する',
        onBuy: (player, game) => {
            if (player.playArea.some(card => game.isTreasure(card))) {
                game.log(`${player.name}の場に財宝があるため、施しの効果はありません`);
                return;
            }
            game.promptGain({ player, maxCost: 4, title: '施し', message: 'コスト4以下のカードを1枚獲得してください。' });
        }
    }),
    ...event('BORROW', {
        id: 'borrow', name: '借入', cost: 0, oncePerTurn: true,
        description: '購入 +1。1ターンに1回：-1 カードのトークンが山札の上になければ、山札の上に置いて財宝 +1',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            if (player.minusCardToken) return;
            player.minusCardToken = true;
            game.log(`${player.name}は -1 カードのトークンを山札の上に置きました`);
            gainBenefits(player, game, { coins: 1 });
        }
    }),
    ...event('QUEST', {
        id: 'quest', name: '探求', cost: 0,
        description: 'アタックカード1枚、呪い2枚、カード6枚のどれかを捨ててもよい。捨てたら金貨を1枚獲得する',
        onBuy: (player, game) => {
            const attacks = player.hand.filter(isAttack);
            const curses = player.hand.filter(isCurse);
            const options = [];
            if (attacks.length > 0) options.push(['アタックカードを1枚捨てる', 'attack']);
            if (curses.length >= 2) options.push(['呪いを2枚捨てる', 'curses']);
            if (player.hand.length >= 6) options.push(['カードを6枚捨てる', 'six']);
            options.push(['捨てない', 'none']);
            const finish = (cards) => {
                const discarded = game.discardFromHand(player, cards.map(card => player.hand.indexOf(card)));
                game.log(`${player.name}は${names(discarded)}を捨てました`);
                gainAndLog(game, player, 'gold');
            };
            game.promptChoose({
                player,
                options: options.map(([label]) => label),
                title: '探求',
                message: '捨てるものを選んでください。捨てると金貨を獲得します。',
                purpose: 'quest',
                callback: ([index]) => {
                    const kind = options[index][1];
                    if (kind === 'curses') finish(curses.slice(0, 2));
                    if (kind === 'attack') {
                        promptFromHand(game, player, {
                            filter: isAttack, title: '探求', message: '捨てるアタックカードを選んでください。', confirmLabel: '捨てる', purpose: 'quest-attack',
                            callback: (cards) => finish(cards)
                        });
                    }
                    if (kind === 'six') {
                        game.promptSelect({
                            player, cards: player.hand, min: 6, max: 6,
                            title: '探求', message: '捨てるカードを6枚選んでください。', confirmLabel: '捨てる', purpose: 'quest-six',
                            callback: (indices) => finish(indices.map(i => player.hand[i]))
                        });
                    }
                }
            });
        }
    }),
    ...event('SAVE', {
        id: 'save', name: '保存', cost: 1, oncePerTurn: true,
        description: '購入 +1。1ターンに1回：手札のカードを1枚脇に置き、ターンの終わり（カードを引いた後）に手札に加える',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            promptFromHand(game, player, {
                title: '保存', message: '次のターンまで残すカードを1枚選んでください。', confirmLabel: '脇に置く', purpose: 'save',
                callback: ([card]) => {
                    player.hand.splice(player.hand.indexOf(card), 1);
                    player.setAside.push(card);
                    game.turnState.savedCards.push(card);
                    game.log(`${player.name}はカードを1枚脇に置きました`);
                }
            });
        }
    }),
    ...event('SCOUTING_PARTY', {
        id: 'scouting_party', name: '偵察隊', cost: 2,
        description: '購入 +1。山札の上から5枚を見て、3枚を捨て札にし、残りを好きな順で山札の上に戻す',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            const cards = takeTopCards(player, 5);
            if (cards.length === 0) return;
            const count = Math.min(3, cards.length);
            game.promptSelect({
                player, cards, min: count, max: count,
                title: '偵察隊', message: `捨て札にするカードを${count}枚選んでください。残りは山札の上に戻します。`, confirmLabel: '捨てる', purpose: 'cartographer',
                callback: (indices) => {
                    const discarded = indices.map(index => cards[index]);
                    game.discardCards(player, discarded);
                    game.log(`${player.name}は${names(discarded)}を捨て札にしました`);
                    putBackInAnyOrder(game, player, cards.filter(card => !discarded.includes(card)), '偵察隊');
                }
            });
        }
    }),
    ...event('TRAVELLING_FAIR', {
        id: 'travelling_fair', name: '旅の祭り', cost: 2,
        description: '購入 +2。このターン、カードを獲得したとき、それを山札の上に置いてもよい',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 2 });
            game.turnState.travellingFair = true;
        }
    }),
    ...event('BONFIRE', {
        id: 'bonfire', name: '焚き火', cost: 3,
        description: '場にある自分のカードを2枚まで廃棄する',
        onBuy: (player, game) => {
            const cards = player.playArea.filter(card => !player.hasPendingDuration(card));
            if (cards.length === 0) return;
            game.promptSelect({
                player, cards, min: 0, max: 2,
                title: '焚き火', message: '廃棄する場のカードを2枚まで選んでください。', confirmLabel: '廃棄する', purpose: 'bonfire',
                callback: (indices) => indices.map(index => cards[index]).forEach(card => {
                    player.playArea.splice(player.playArea.indexOf(card), 1);
                    game.trashCard(player, card);
                    game.log(`${player.name}は${card.name}を廃棄しました`);
                })
            });
        }
    }),
    ...event('EXPEDITION', {
        id: 'expedition', name: '遠征', cost: 3,
        description: '次の手札を引くとき、カードを2枚多く引く',
        onBuy: (player, game) => {
            game.turnState.expeditionDraw += 2;
            game.log(`${player.name}は次の手札を2枚多く引きます`);
        }
    }),
    ...event('FERRY', {
        id: 'ferry', name: '渡し船', cost: 3,
        description: '-2 コストのトークンをアクションの山に動かす（その山のカードは、自分のターンにコストが2少なくなる）',
        onBuy: (player, game) => moveToken(player, game, 'minusCost', { title: '渡し船' })
    }),
    ...event('PLAN', {
        id: 'plan', name: '計画', cost: 3,
        description: '廃棄のトークンをアクションの山に動かす（その山のカードを購入したとき、手札のカードを1枚廃棄してもよい）',
        onBuy: (player, game) => moveToken(player, game, 'trashing', { title: '計画' })
    }),
    ...event('MISSION', {
        id: 'mission', name: '伝道', cost: 4, oncePerTurn: true,
        description: '1ターンに1回：直前のターンが自分のターンでなければ、このターンの後に追加のターンを行う。そのターンはカードを購入できない',
        onBuy: (player, game) => {
            if (game.previousTurnPlayer === player || game.missions.includes(player)) {
                game.log(`${player.name}は直前のターンも自分のターンなので、伝道の効果はありません`);
                return;
            }
            game.missions.push(player);
            game.log(`${player.name}はこのターンの後に、伝道の追加のターンを行います`);
        }
    }),
    ...event('PILGRIMAGE', {
        id: 'pilgrimage', name: '巡礼', cost: 4, oncePerTurn: true,
        description: '1ターンに1回：旅のトークンを裏返す（最初は表）。表になったら、場にある名前の違うカードを3枚まで選び、それぞれ1枚ずつ獲得する',
        onBuy: (player, game) => {
            if (!flipJourney(player, game)) return;
            const distinct = [...new Map(player.playArea.map(card => [card.id, card])).values()];
            if (distinct.length === 0) return;
            game.promptSelect({
                player, cards: distinct, min: 0, max: 3,
                title: '巡礼', message: '獲得するカードを3枚まで選んでください（名前の違うカード）。', confirmLabel: '獲得する', purpose: 'pilgrimage',
                callback: (indices) => indices.forEach(index => gainAndLog(game, player, distinct[index].id))
            });
        }
    }),
    ...event('BALL', {
        id: 'ball', name: '舞踏会', cost: 5,
        description: '-1 財宝のトークンを受け取る。コスト4以下のカードを2枚獲得する',
        onBuy: (player, game) => {
            player.minusCoinToken = true;
            game.log(`${player.name}は -1 財宝のトークンを受け取りました`);
            const gain = () => game.promptGain({ player, maxCost: 4, title: '舞踏会', message: 'コスト4以下のカードを1枚獲得してください。' });
            game.runNext(gain, gain);
        }
    }),
    ...event('RAID', {
        id: 'raid', name: '襲撃', cost: 5,
        description: '場の銀貨1枚につき銀貨を1枚獲得する。他のプレイヤーは -1 カードのトークンを山札の上に置く',
        onBuy: (player, game) => {
            const silvers = player.playArea.filter(card => card.id === 'silver').length;
            const gained = Array.from({ length: silvers }).filter(() => game.gainCardFromSupply(player, 'silver')).length;
            game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
            game.getOtherPlayers(player).forEach(other => {
                other.minusCardToken = true;
                game.log(`${other.name}は -1 カードのトークンを山札の上に置きました`);
            });
        }
    }),
    ...event('SEAWAY', {
        id: 'seaway', name: '海路', cost: 5,
        description: 'コスト4以下のアクションカードを1枚獲得し、+1 購入のトークンをその山に動かす（その山のカードをプレイしたとき、最初に購入 +1）',
        onBuy: (player, game) => game.promptGain({
            player, maxCost: 4, filter: (data) => data.types.includes(CARD_TYPES.ACTION),
            title: '海路', message: 'コスト4以下のアクションカードを1枚獲得してください。',
            onGained: (card) => {
                player.pileTokens.plusBuy = game.pileOf[card.id] ?? card.id;
                game.log(`${player.name}は +1 購入のトークンを${card.name}の山に置きました`);
            }
        })
    }),
    ...event('TRADE', {
        id: 'trade', name: '交易', cost: 5,
        description: '手札のカードを2枚まで廃棄し、廃棄した1枚につき銀貨を1枚獲得する',
        onBuy: (player, game) => promptTrashFromHand(game, player, {
            min: 0, max: 2, title: '交易', message: '廃棄するカードを2枚まで選んでください。1枚につき銀貨を獲得します。', purpose: 'trade-trash',
            callback: (trashed) => {
                const gained = trashed.filter(() => game.gainCardFromSupply(player, 'silver')).length;
                if (gained > 0) game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
            }
        })
    }),
    ...event('LOST_ARTS', {
        id: 'lost_arts', name: '失われた技術', cost: 6,
        description: '+1 アクションのトークンをアクションの山に動かす（その山のカードをプレイしたとき、最初にアクション +1）',
        onBuy: (player, game) => moveToken(player, game, 'plusAction', { title: '失われた技術' })
    }),
    ...event('TRAINING', {
        id: 'training', name: '鍛錬', cost: 6,
        description: '+1 財宝のトークンをアクションの山に動かす（その山のカードをプレイしたとき、最初に財宝 +1）',
        onBuy: (player, game) => moveToken(player, game, 'plusCoin', { title: '鍛錬' })
    }),
    ...event('INHERITANCE', {
        id: 'inheritance', name: '相続', cost: 7, oncePerGame: true,
        description: '1ゲームに1回：サプライのコスト4以下の命令以外のアクションカードを1枚脇に置き、屋敷のトークンを置く（自分の屋敷は、そのカードとしてプレイできるアクションになる）',
        onBuy: (player, game) => {
            // 獲得ではなく脇に置くので、獲得したときの効果は起きない
            const candidates = game.getGainableCards({
                maxCost: 4, filter: (data) => data.types.includes(CARD_TYPES.ACTION) && !data.types.includes(CARD_TYPES.COMMAND)
            });
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates.map(data => new Card(data)), min: 1, max: 1,
                title: '相続', message: '屋敷のトークンを置くカードを選んでください（サプライから脇に置きます）。', confirmLabel: '脇に置く', purpose: 'inheritance',
                callback: ([index]) => {
                    const data = candidates[index];
                    game.takeFromSupply(data.id);
                    player.inheritance = data.id;
                    game.log(`${player.name}の屋敷は、${data.name}としてプレイできるようになりました`);
                }
            });
        }
    }),
    ...event('PATHFINDING', {
        id: 'pathfinding', name: '道の開拓', cost: 8,
        description: '+1 カードのトークンをアクションの山に動かす（その山のカードをプレイしたとき、最初にカードを1枚引く）',
        onBuy: (player, game) => moveToken(player, game, 'plusCard', { title: '道の開拓' })
    })
};
