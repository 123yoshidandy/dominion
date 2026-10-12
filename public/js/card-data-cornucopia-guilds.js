/**
 * 拡張「収穫祭＆ギルド」（第2版）の王国カードデータと褒賞
 * 財源（player.coffers）は購入フェーズに使うと財宝+1ずつになる
 * 超過支払い（overpay）のあるカードは、購入するときにコストより多く払うと、獲得した後で効果がある
 */

import Card from './card.js';
import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, names, gainBenefits, promptFromHand, promptTrashFromHand,
    promptDiscardFromHand, discardDownTo, takeTopCards, logReveal
} from './card-helpers.js';

const isReward = (card) => card.types.includes(CARD_TYPES.REWARD);
const distinctCount = (cards) => new Set(cards.map(card => card.id)).size;

// 褒賞（サプライ外。馬上槍試合で獲得する）
export const REWARD_CARDS = {
    CORONET: {
        id: 'coronet',
        name: '宝冠',
        cost: 0,
        types: [CARD_TYPES.ACTION, CARD_TYPES.TREASURE, CARD_TYPES.REWARD],
        value: 0,
        description: '手札の褒賞以外のアクションカードを1枚、2回プレイしてもよい。手札の褒賞以外の財宝を1枚、2回プレイしてもよい（サプライにない）',
        onPlay: (player, game, coronet) => {
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => isAction(card) && !isReward(card),
                title: '宝冠',
                message: '2回プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'throne-room',
                callback: ([card]) => {
                    if (card) game.playMultipleTimes(player, card, 2, coronet, { asTreasure: false });
                }
            });
            game.runNext(() => promptFromHand(game, player, {
                min: 0,
                filter: (card) => game.isTreasure(card) && !isReward(card),
                title: '宝冠',
                message: '2回プレイする財宝を選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'tiara',
                callback: ([card]) => {
                    if (card) game.playMultipleTimes(player, card, 2, coronet, { asTreasure: true });
                }
            }));
        }
    },
    COURSER: {
        id: 'courser',
        name: '駿馬',
        cost: 0,
        types: [CARD_TYPES.ACTION, CARD_TYPES.REWARD],
        description: '次のうち異なる2つを選ぶ：カードを2枚引く、アクション +2、財宝 +2、銀貨を4枚獲得する（サプライにない）',
        onPlay: (player, game) => {
            game.promptChoose({
                player,
                options: ['カードを2枚引く', 'アクション +2', '財宝 +2', '銀貨を4枚獲得する'],
                min: 2,
                max: 2,
                title: '駿馬',
                message: '異なる2つを選んでください。',
                purpose: 'courser',
                callback: (indices) => {
                    gainBenefits(player, game, {
                        cards: indices.includes(0) ? 2 : 0,
                        actions: indices.includes(1) ? 2 : 0,
                        coins: indices.includes(2) ? 2 : 0
                    });
                    if (indices.includes(3)) {
                        const gained = [0, 1, 2, 3].filter(() => game.gainCardFromSupply(player, 'silver')).length;
                        game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
                    }
                }
            });
        }
    },
    DEMESNE: {
        id: 'demesne',
        name: '領地',
        cost: 0,
        types: [CARD_TYPES.ACTION, CARD_TYPES.VICTORY, CARD_TYPES.REWARD],
        description: 'アクション +2。購入 +2。金貨を1枚獲得する。持っている金貨1枚につき勝利点 1（サプライにない）',
        pointsFor: (allCards) => allCards.filter(card => card.id === 'gold').length,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 2, buys: 2 });
            if (game.gainCardFromSupply(player, 'gold')) game.log(`${player.name}は金貨を獲得しました`);
        }
    },
    HOUSECARL: {
        id: 'housecarl',
        name: '親衛兵',
        cost: 0,
        types: [CARD_TYPES.ACTION, CARD_TYPES.REWARD],
        description: '場の異なる名前のアクションカード1種につきカードを1枚引く（サプライにない）',
        onPlay: (player, game) => gainBenefits(player, game, { cards: distinctCount(player.playArea.filter(isAction)) })
    },
    HUGE_TURNIP: {
        id: 'huge_turnip',
        name: '巨大カブ',
        cost: 0,
        types: [CARD_TYPES.TREASURE, CARD_TYPES.REWARD],
        value: 0,
        description: '財源 +2。持っている財源1つにつき財宝 +1（サプライにない）',
        onPlay: (player, game) => {
            gainBenefits(player, game, { coffers: 2 });
            gainBenefits(player, game, { coins: player.coffers }, '巨大カブ');
        }
    },
    RENOWN: {
        id: 'renown',
        name: '名声',
        cost: 0,
        types: [CARD_TYPES.ACTION, CARD_TYPES.REWARD],
        description: '購入 +1。このターン、カードのコストは2少なくなる（サプライにない）',
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.costReduction += 2;
        }
    }
};

export const CORNUCOPIA_GUILDS_CARDS = {
    // ===== コスト2 =====
    CANDLESTICK_MAKER: {
        id: 'candlestick_maker',
        name: '蝋燭職人',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。購入 +1。財源 +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { actions: 1, buys: 1, coffers: 1 })
    },
    FARRIER: {
        id: 'farrier',
        name: '蹄鉄工',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。超過支払い：超過した1につき、このターンの終わりにカードを1枚引く',
        overpayText: '超過した1につき、このターンの終わりにカードを1枚引きます。',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, buys: 1 }),
        overpay: (player, game, amount) => {
            game.turnState.farrierDraw += amount;
        }
    },
    HAMLET: {
        id: 'hamlet',
        name: '村落',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。手札を1枚捨ててもよい。捨てたらアクション +1。手札を1枚捨ててもよい。捨てたら購入 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const offer = (label, benefit, purpose) => () => promptDiscardFromHand(game, player, 1, '村落', {
                optional: true,
                purpose,
                message: `手札を1枚捨てると${label}を得ます（捨てなくてもかまいません）。`,
                callback: (discarded) => {
                    if (discarded.length > 0) gainBenefits(player, game, benefit);
                }
            });
            game.runNext(offer('アクション+1', { actions: 1 }, 'hamlet-action'), offer('購入+1', { buys: 1 }, 'hamlet-buy'));
        }
    },
    STONEMASON: {
        id: 'stonemason',
        name: '石工',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄し、それよりコストの低いカードを2枚獲得する。超過支払い：超過した額とちょうど同じコストのアクションカードを2枚獲得する',
        overpayText: '超過した額とちょうど同じコストのアクションカードを2枚獲得します。',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '石工',
                message: '廃棄するカードを1枚選んでください。それよりコストの低いカードを2枚獲得します。',
                purpose: 'stonemason-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const maxCost = game.getCost(trashed) - 1;
                    if (maxCost < 0 && !game.getPotionCost(trashed)) return;
                    const gain = () => game.promptGain({ player, lessThan: trashed, title: '石工', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
                    game.runNext(gain, gain);
                }
            });
        },
        overpay: (player, game, amount) => {
            const gain = () => game.promptGain({
                player,
                exactCost: amount,
                filter: (data) => data.types.includes(CARD_TYPES.ACTION),
                title: '石工',
                message: `コストがちょうど${amount}のアクションカードを1枚獲得してください。`
            });
            game.runNext(gain, gain);
        }
    },

    // ===== コスト3 =====
    INFIRMARY: {
        id: 'infirmary',
        name: '診療所',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。手札のカードを1枚廃棄してもよい。超過支払い：超過した1につき、これを1回プレイする',
        overpayText: '超過した1につき、獲得した診療所を1回プレイします。',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1 });
            promptTrashFromHand(game, player, {
                min: 0,
                title: '診療所',
                message: '廃棄するカードを1枚選んでください（選ばなくてもかまいません）。',
                purpose: 'optional-trash'
            });
        },
        overpay: (player, game, amount, card) => {
            if (!card) return;
            game.runNext(...Array.from({ length: amount }, (_, i) => () => {
                if (i === 0) {
                    if (player.removeCard(card)) game.playCardFrom(player, card, { remove: false });
                } else if (player.playArea.includes(card)) {
                    game.log(`${player.name}は${card.name}をもう一度プレイしました`);
                    card.play(player, game);
                }
            }));
        }
    },
    MENAGERIE: {
        id: 'menagerie',
        name: '移動動物園',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。手札を公開し、同じ名前のカードがなければカードを3枚引く。あればカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            logReveal(game, player, player.hand);
            const unique = distinctCount(player.hand) === player.hand.length;
            gainBenefits(player, game, { cards: unique ? 3 : 1 });
        }
    },
    SHOP: {
        id: 'shop',
        name: '商店',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。財宝 +1。場に同じカードがない、手札のアクションカードを1枚プレイしてもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, coins: 1 });
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => isAction(card) && !player.playArea.some(played => played.id === card.id),
                title: '商店',
                message: 'プレイするアクションカードを選んでください（アクションは使いません。選ばなくてもかまいません）。',
                confirmLabel: 'プレイする',
                purpose: 'shop',
                callback: ([card]) => {
                    if (card) game.playCardFrom(player, card);
                }
            });
        }
    },

    // ===== コスト4 =====
    ADVISOR: {
        id: 'advisor',
        name: '助言者',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。山札の上から3枚を公開し、左隣のプレイヤーが選んだ1枚を捨て札にして、残りを手札に加える',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const revealed = takeTopCards(player, 3);
            if (revealed.length === 0) return;
            game.log(`${player.name}は${names(revealed)}を公開しました`);
            const left = game.getPlayerToLeft(player);
            game.promptSelect({
                player: left,
                cards: revealed,
                min: 1,
                max: 1,
                title: '助言者',
                message: `${player.name}が捨て札にするカードを1枚選んでください。残りは${player.name}の手札に入ります。`,
                confirmLabel: '捨て札にさせる',
                purpose: 'advisor',
                callback: ([index]) => {
                    const discarded = revealed[index];
                    player.hand.push(...revealed.filter(card => card !== discarded));
                    game.log(`${player.name}は${discarded.name}を捨て札にし、残りを手札に加えました`);
                    game.discardCards(player, [discarded]);
                }
            });
        }
    },
    FARMHANDS: {
        id: 'farmhands',
        name: '農場労働者',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。これを獲得したとき、手札のアクションか財宝を1枚脇に置き、次のターンの開始時にプレイしてもよい',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onGain: (player, game) => {
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => isAction(card) || isTreasure(card),
                title: '農場労働者',
                message: '次のターンの開始時にプレイするカードを1枚選んでください（選ばなくてもかまいません）。',
                confirmLabel: '脇に置く',
                purpose: 'farmhands',
                callback: ([card]) => {
                    if (!card) return;
                    player.hand.splice(player.hand.indexOf(card), 1);
                    player.setAside.push(card);
                    player.startOfTurnPlays.push(card);
                    game.log(`${player.name}は${card.name}を脇に置きました`);
                }
            });
        }
    },
    HERALD: {
        id: 'herald',
        name: '伝令官',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、アクションカードならプレイする。超過支払い：超過した1につき、捨て札のカードを1枚山札の上に置く',
        overpayText: '超過した1につき、捨て札のカードを1枚山札の上に置きます。',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は${card.name}を公開しました`);
            if (isAction(card)) {
                game.playCardFrom(player, card, { remove: false });
            } else {
                player.deck.unshift(card);
            }
        },
        overpay: (player, game, amount) => {
            game.runNext(...Array.from({ length: amount }, () => () => {
                if (player.discard.length === 0) return;
                const cards = [...player.discard];
                game.promptSelect({
                    player,
                    cards,
                    min: 1,
                    max: 1,
                    title: '伝令官',
                    message: '山札の上に置くカードを捨て札から選んでください。',
                    confirmLabel: '山札の上に置く',
                    purpose: 'harbinger',
                    callback: ([index]) => {
                        const card = cards[index];
                        player.discard.splice(player.discard.indexOf(card), 1);
                        player.deck.unshift(card);
                        game.log(`${player.name}は捨て札の${card.name}を山札の上に置きました`);
                    }
                });
            }));
        }
    },
    PLAZA: {
        id: 'plaza',
        name: '広場',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。手札の財宝を1枚捨ててもよい。捨てたら財源 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => game.isTreasure(card),
                title: '広場',
                message: '財宝を1枚捨てると財源+1を得ます（捨てなくてもかまいません）。',
                confirmLabel: '捨てる',
                purpose: 'plaza',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    game.log(`${player.name}は${card.name}を捨てました`);
                    gainBenefits(player, game, { coffers: 1 });
                }
            });
        }
    },
    REMAKE: {
        id: 'remake',
        name: '再建',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '次を2回行う：手札のカードを1枚廃棄し、それよりコストがちょうど1多いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            const once = () => promptTrashFromHand(game, player, {
                title: '再建',
                message: '廃棄するカードを1枚選んでください。コストがちょうど1多いカードを獲得します。',
                purpose: 'upgrade-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const cost = game.getCost(trashed) + 1;
                    game.promptGain({ player, exactCost: cost, potion: game.getPotionCost(trashed), title: '再建', message: `コストがちょうど${cost}のカードを1枚獲得してください。` });
                }
            });
            game.runNext(once, once);
        }
    },
    YOUNG_WITCH: {
        id: 'young_witch',
        name: '魔女娘',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。手札を2枚捨てる。他のプレイヤーは手札の災いカードを公開しなければ呪いを1枚獲得する。準備：コスト2か3の王国カードの山を1つ加え、それを災いカードとする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            promptDiscardFromHand(game, player, 2, '魔女娘');
            game.runNext(() => game.attackOtherPlayers(player, (target) => {
                const bane = target.hand.find(card => card.id === game.bane);
                if (bane) {
                    game.log(`${target.name}は災いカードの${bane.name}を公開しました`);
                    return;
                }
                game.gainCurse(target);
            }));
        }
    },

    // ===== コスト5 =====
    BAKER: {
        id: 'baker',
        name: 'パン屋',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財源 +1。準備：各プレイヤーは財源を1つ得る',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, coffers: 1 })
    },
    BUTCHER: {
        id: 'butcher',
        name: '肉屋',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '財源 +2。手札のカードを1枚廃棄してもよい。廃棄したら好きな数の財源を払い、それよりコストが払った数まで多いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coffers: 2 });
            promptTrashFromHand(game, player, {
                min: 0,
                title: '肉屋',
                message: '廃棄するカードを1枚選んでください（選ばなくてもかまいません）。',
                purpose: 'butcher-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const amounts = Array.from({ length: player.coffers + 1 }, (_, amount) => amount);
                    const baseCost = game.getCost(trashed);
                    game.promptChoose({
                        player,
                        options: amounts.map(amount => `${amount}つ払う（コスト${baseCost + amount}以下）`),
                        title: '肉屋',
                        message: '払う財源の数を選んでください。',
                        purpose: 'butcher-pay',
                        callback: ([index]) => {
                            const paid = amounts[index];
                            player.coffers -= paid;
                            if (paid > 0) game.log(`${player.name}は財源を${paid}つ払いました`);
                            const maxCost = baseCost + paid;
                            game.promptGain({ player, maxCost, potion: game.getPotionCost(trashed), title: '肉屋', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
                        }
                    });
                }
            });
        }
    },
    CARNIVAL: {
        id: 'carnival',
        name: 'カーニバル',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '山札の上から4枚を公開し、異なる名前のカードを1枚ずつ手札に加え、残りを捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            const revealed = takeTopCards(player, 4);
            if (revealed.length === 0) return;
            game.log(`${player.name}は${names(revealed)}を公開しました`);
            const taken = revealed.filter((card, i) => revealed.findIndex(other => other.id === card.id) === i);
            player.hand.push(...taken);
            game.log(`${player.name}は${names(taken)}を手札に加えました`);
            game.discardCards(player, revealed.filter(card => !taken.includes(card)));
        }
    },
    FERRYMAN: {
        id: 'ferryman',
        name: '渡し守',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1。手札を1枚捨てる。準備：使っていないコスト3か4の王国カードの山を1つ選ぶ。渡し守を獲得したとき、その山のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2, actions: 1 });
            promptDiscardFromHand(game, player, 1, '渡し守');
        },
        onGain: (player, game) => {
            const card = game.ferrymanPile ? game.gainFromNonSupply(player, game.ferrymanPile) : null;
            if (card) game.log(`${player.name}は渡し守の効果で${card.name}を獲得しました`);
        }
    },
    FOOTPAD: {
        id: 'footpad',
        name: '追い剥ぎ',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '財源 +2。他のプレイヤーは手札が3枚になるまで捨てる。これを使うゲームでは、アクションフェーズにカードを獲得するたびにカードを1枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coffers: 2 });
            game.attackOtherPlayers(player, (target) => discardDownTo(game, target, 3, '追い剥ぎ'));
        }
    },
    HORN_OF_PLENTY: {
        id: 'horn_of_plenty',
        name: '豊穣の角',
        cost: 5,
        types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '場の異なる名前のカード1種につきコスト1まで（これを含む）のカードを1枚獲得する。それが勝利点カードなら、これを廃棄する',
        count: 10,
        onPlay: (player, game, horn) => {
            const maxCost = distinctCount(player.playArea);
            game.promptGain({
                player,
                maxCost,
                title: '豊穣の角',
                message: `コスト${maxCost}以下のカードを1枚獲得してください。勝利点カードなら豊穣の角を廃棄します。`,
                onGained: (card) => {
                    if (!isVictory(card) || !player.playArea.includes(horn)) return;
                    player.playArea.splice(player.playArea.indexOf(horn), 1);
                    game.trashCard(player, horn);
                    game.log(`${player.name}は豊穣の角を廃棄しました`);
                }
            });
        }
    },
    HUNTING_PARTY: {
        id: 'hunting_party',
        name: '狩猟団',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。手札を公開し、手札にないカードが出るまで山札を公開して、それを手札に加え、残りを捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            logReveal(game, player, player.hand);
            const inHand = new Set(player.hand.map(card => card.id));
            const discarded = [];
            for (;;) {
                const card = player.takeTopCard();
                if (!card) break;
                if (!inHand.has(card.id)) {
                    player.hand.push(card);
                    game.log(`${player.name}は${card.name}を手札に加えました`);
                    break;
                }
                discarded.push(card);
            }
            if (discarded.length > 0) game.log(`${player.name}は${names(discarded)}を捨て札にしました`);
            game.discardCards(player, discarded);
        }
    },
    JESTER: {
        id: 'jester',
        name: '道化師',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。他のプレイヤーは山札の一番上を捨て札にする。それが勝利点カードなら呪いを1枚獲得し、そうでなければ、あなたが選んで、そのプレイヤーかあなたが同じカードを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                const [card] = takeTopCards(target, 1);
                if (!card) return;
                game.log(`${target.name}は山札の一番上の${card.name}を捨て札にしました`);
                game.discardCards(target, [card]);
                if (isVictory(card)) {
                    game.gainCurse(target);
                    return;
                }
                if (!(game.supply[card.id] > 0)) return;
                game.promptChoose({
                    player,
                    card,
                    options: [`${target.name}が獲得する`, '自分が獲得する'],
                    title: '道化師',
                    message: `${card.name}を誰が獲得しますか？`,
                    purpose: 'jester',
                    callback: ([choice]) => {
                        const gainer = choice === 0 ? target : player;
                        if (game.gainCardFromSupply(gainer, card.id)) game.log(`${gainer.name}は${card.name}を獲得しました`);
                    }
                });
            });
        }
    },
    JOURNEYMAN: {
        id: 'journeyman',
        name: '職人見習い',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1種指定する。指定したカード以外が3枚出るまで山札を公開し、その3枚を手札に加え、残りを捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            game.promptNameCard({
                player,
                title: '職人見習い',
                message: '手札に加えたくないカードを1種指定してください。',
                purpose: 'journeyman-name',
                callback: (named) => {
                    const taken = [];
                    const discarded = [];
                    while (taken.length < 3) {
                        const card = player.takeTopCard();
                        if (!card) break;
                        (card.id === named.id ? discarded : taken).push(card);
                    }
                    player.hand.push(...taken);
                    if (taken.length > 0) game.log(`${player.name}は${names(taken)}を手札に加えました`);
                    if (discarded.length > 0) game.log(`${player.name}は${names(discarded)}を捨て札にしました`);
                    game.discardCards(player, discarded);
                }
            });
        }
    },
    JOUST: {
        id: 'joust',
        name: '馬上槍試合',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。手札の属州を1枚脇に置いてもよい。置いたら褒賞を1枚選んで手札に獲得する。属州はクリーンアップで捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 });
            const rewards = Object.values(REWARD_CARDS).filter(data => game.nonSupply[data.id] > 0);
            if (!player.hand.some(card => card.id === 'province') || rewards.length === 0) return;
            game.promptSelect({
                player,
                cards: rewards.map(data => new Card(data)),
                max: 1,
                title: '馬上槍試合',
                message: '属州を脇に置いて獲得する褒賞を選んでください（選ばなければ属州を置きません）。',
                confirmLabel: '獲得する',
                purpose: 'joust',
                callback: ([index]) => {
                    if (index === undefined) return;
                    const province = player.hand.find(card => card.id === 'province');
                    player.hand.splice(player.hand.indexOf(province), 1);
                    player.setAside.push(province);
                    game.turnState.joustProvinces.push(province);
                    const reward = game.gainFromNonSupply(player, rewards[index].id, 'hand');
                    game.log(`${player.name}は属州を脇に置き、${reward.name}を手札に獲得しました`);
                }
            });
        }
    },
    MERCHANT_GUILD: {
        id: 'merchant_guild',
        name: '商人ギルド',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +1。これが場にある間、カードを購入するたびに財源 +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { coins: 1 }),
        onBuyWhileInPlay: (player, game) => gainBenefits(player, game, { coffers: 1 }, '商人ギルド')
    },
    SOOTHSAYER: {
        id: 'soothsayer',
        name: '占い師',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '金貨を1枚獲得する。他のプレイヤーは呪いを1枚獲得し、獲得したらカードを1枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            if (game.gainCardFromSupply(player, 'gold')) game.log(`${player.name}は金貨を獲得しました`);
            game.attackOtherPlayers(player, (target) => {
                if (game.gainCurse(target)) gainBenefits(target, game, { cards: 1 });
            });
        }
    },

    // ===== コスト6 =====
    FAIRGROUNDS: {
        id: 'fairgrounds',
        name: '品評会',
        cost: 6,
        types: [CARD_TYPES.VICTORY],
        description: 'デッキの異なる名前のカード5種につき勝利点 2（端数切り捨て）',
        pointsFor: (allCards) => 2 * Math.floor(distinctCount(allCards) / 5)
    }
};

