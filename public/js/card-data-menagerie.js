/**
 * 拡張「移動動物園」の王国カードデータ、馬、イベント、習性
 * - 追放：game.exileCard・exileFromSupply で追放マットに置く（同じカードを獲得したとき捨て札にしてよい）
 * - 馬：サプライ外の山（nonSupplyPiles）。プレイすると山に戻る
 * - 習性：アクションカードをプレイするとき、本来の効果の代わりに wayEffect を使ってよい（game-menagerie.js）
 */

import Card from './card.js';
import { CARD_TYPES, LANDSCAPE_KINDS } from './card-types.js';
import {
    isAction, isTreasure, isVictory, gainBenefits, promptFromHand, promptTrashFromHand,
    takeTopCards, logReveal
} from './card-helpers.js';

const HORSES = { horse: 30 };

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};
const gainHorses = (game, player, count, destination) => {
    const gained = Array.from({ length: count }).filter(() => game.gainFromNonSupply(player, 'horse', destination)).length;
    if (gained > 0) game.log(`${player.name}は馬を${gained}枚獲得しました`);
};
const emptyPiles = (game) => game.countEmptySupplyPiles();

// 「今か次のターンの開始時」に効果を使う持続カード（はしけ・村の緑地）
const nowOrNextTurn = (player, game, card, label, effect) => game.promptConfirm({
    player,
    card,
    title: card.name,
    message: `${label}を今使いますか？（使わなければ次のターンの開始時に使います）`,
    yesLabel: '今使う',
    noLabel: '次のターンに使う',
    purpose: 'now-or-later',
    callback: (now) => {
        if (now) {
            effect();
        } else {
            player.addDuration(card, effect);
        }
    }
});

// 手札・山札などのカードをプレイする（獲得をきっかけにするリアクションで使う）
const playReaction = (game, player, card) => {
    if (!player.hand.includes(card)) return;
    game.playCardFrom(player, card);
};

export const HORSE_CARDS = {
    HORSE: {
        id: 'horse', name: '馬', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1。これを馬の山に戻す（サプライにない）',
        count: 30,
        onPlay: (player, game, horse) => {
            gainBenefits(player, game, { cards: 2, actions: 1 });
            if (game.returnToSupply(player, horse)) game.log(`${player.name}は馬を山に戻しました`);
        }
    }
};

export const MENAGERIE_CARDS = {
    // ===== コスト2 =====
    BLACK_CAT: {
        id: 'black_cat', name: '黒猫', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。自分のターンでなければ、他のプレイヤーは呪いを1枚獲得する。他のプレイヤーが勝利点カードを獲得したとき、手札のこれをプレイしてもよい',
        isAttack: true,
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            if (game.getCurrentPlayer() !== player) game.attackOtherPlayers(player, (target) => game.gainCurse(target));
        },
        onOtherGain: (owner, game, cat, gainer, card) => {
            if (!isVictory(card)) return;
            game.promptConfirm({
                player: owner, card: cat, title: '黒猫', message: `${gainer.name}が${card.name}を獲得しました。黒猫をプレイしますか？`,
                yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'reaction-play',
                callback: (yes) => { if (yes) playReaction(game, owner, cat); }
            });
        }
    },
    SLEIGH: {
        id: 'sleigh', name: 'そり', cost: 2, types: [CARD_TYPES.ACTION],
        description: '馬を2枚獲得する。カードを獲得したとき、手札のこれを捨てて、そのカードを手札に加えるか山札の上に置いてもよい',
        reactionType: 'gain',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => gainHorses(game, player, 2),
        onOwnGain: (player, game, sleigh, card) => {
            if (!player.discard.includes(card)) return;
            game.promptChoose({
                player, card, options: ['使わない', '手札に加える', '山札の上に置く'],
                title: 'そり', message: `そりを捨てて、獲得した${card.name}をどこに置きますか？`, purpose: 'sleigh',
                callback: ([index]) => {
                    if (index === 0 || !player.hand.includes(sleigh) || !player.removeCard(card)) return;
                    game.discardFromHand(player, [player.hand.indexOf(sleigh)]);
                    if (index === 1) {
                        player.hand.push(card);
                    } else {
                        player.deck.unshift(card);
                    }
                    game.log(`${player.name}はそりを捨てて、${card.name}を${index === 1 ? '手札に加えました' : '山札の上に置きました'}`);
                }
            });
        }
    },
    SUPPLIES: {
        id: 'supplies', name: '補給品', cost: 2, types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1。プレイしたとき、馬を1枚獲得し、山札の上に置く',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => gainHorses(game, player, 1, 'deck')
    },

    // ===== コスト3 =====
    CAMEL_TRAIN: {
        id: 'camel_train', name: 'ラクダの隊列', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'サプライの勝利点以外のカードを1枚追放する。これを獲得したとき、サプライの金貨を1枚追放する',
        count: 10,
        onPlay: (player, game) => {
            const candidates = game.getGainableCards({ filter: (data) => !data.types.includes(CARD_TYPES.VICTORY) });
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates.map(data => new Card(data)), min: 1, max: 1,
                title: 'ラクダの隊列', message: '追放するサプライのカードを選んでください。', confirmLabel: '追放する', purpose: 'camel-train',
                callback: ([index]) => game.exileFromSupply(player, candidates[index].id)
            });
        },
        onGain: (player, game) => game.exileFromSupply(player, 'gold')
    },
    GOATHERD: {
        id: 'goatherd', name: 'ヤギ飼い', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。手札のカードを1枚廃棄してもよい。右隣のプレイヤーが直前のターンに廃棄したカード1枚につき、カードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            promptTrashFromHand(game, player, { min: 0, title: 'ヤギ飼い', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash' });
            game.runNext(() => {
                const count = game.getPlayerToRight(player).trashedLastTurn;
                if (count > 0) gainBenefits(player, game, { cards: count }, 'ヤギ飼い');
            });
        }
    },
    SCRAP: {
        id: 'scrap', name: '解体', cost: 3, types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。そのコスト1につき、次から違うものを1つ選ぶ：カード+1、アクション+1、購入+1、財宝+1、銀貨を獲得、馬を獲得',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game, scrap) => promptTrashFromHand(game, player, {
            title: '解体', message: '廃棄するカードを1枚選んでください。', purpose: 'scrap-trash',
            callback: ([trashed]) => {
                const count = Math.min(6, trashed ? game.getCost(trashed) : 0);
                if (count === 0) return;
                const options = ['カード +1', 'アクション +1', '購入 +1', '財宝 +1', '銀貨を獲得する', '馬を獲得する'];
                game.promptChoose({
                    player, card: scrap, options, min: count, max: count,
                    title: '解体', message: `違うものを${count}つ選んでください。`, purpose: 'scrap',
                    callback: (indices) => {
                        gainBenefits(player, game, {
                            cards: indices.includes(0) ? 1 : 0, actions: indices.includes(1) ? 1 : 0,
                            buys: indices.includes(2) ? 1 : 0, coins: indices.includes(3) ? 1 : 0
                        });
                        if (indices.includes(4)) gainAndLog(game, player, 'silver');
                        if (indices.includes(5)) gainHorses(game, player, 1);
                    }
                });
            }
        })
    },
    SHEEPDOG: {
        id: 'sheepdog', name: '牧羊犬', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。カードを獲得したとき、手札のこれをプレイしてもよい',
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2 }),
        onOwnGain: (player, game, dog, card) => game.promptConfirm({
            player, card: dog, title: '牧羊犬', message: `${card.name}を獲得しました。牧羊犬をプレイしますか？`,
            yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'reaction-play',
            callback: (yes) => { if (yes) playReaction(game, player, dog); }
        })
    },
    SNOWY_VILLAGE: {
        id: 'snowy_village', name: '雪深い村', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +4。購入 +1。このターン、これ以降のアクション+は受けない',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 4, buys: 1 });
            player.noMoreActions = true;
        }
    },
    STOCKPILE: {
        id: 'stockpile', name: '備蓄品', cost: 3, types: [CARD_TYPES.TREASURE],
        value: 3,
        description: '財宝 +3。購入 +1。プレイしたとき、これを追放する',
        count: 10,
        onPlay: (player, game, stockpile) => {
            player.buys += 1;
            if (player.playArea.includes(stockpile)) game.exileCard(player, stockpile);
        }
    },

    // ===== コスト4 =====
    BOUNTY_HUNTER: {
        id: 'bounty_hunter', name: '賞金稼ぎ', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。手札のカードを1枚追放する。追放マットに同じカードがなかったなら、財宝 +3',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            promptFromHand(game, player, {
                title: '賞金稼ぎ', message: '追放するカードを1枚選んでください。', confirmLabel: '追放する', purpose: 'bounty-hunter',
                callback: ([card]) => {
                    const hadCopy = player.mats.exile.some(exiled => exiled.id === card.id);
                    game.exileCard(player, card);
                    if (!hadCopy) gainBenefits(player, game, { coins: 3 });
                }
            });
        }
    },
    CARDINAL: {
        id: 'cardinal', name: '枢機卿', cost: 4, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。他のプレイヤーは山札の上から2枚を公開し、コスト3〜6のカードを1枚追放し、残りを捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                const revealed = takeTopCards(target, 2);
                if (revealed.length === 0) return;
                logReveal(game, target, revealed, '山札の上から2枚');
                const candidates = revealed.filter(card => game.getCost(card) >= 3 && game.getCost(card) <= 6 && !game.hasExtraCost(card));
                const finish = (exiled) => {
                    if (exiled) {
                        target.mats.exile.push(exiled);
                        game.log(`${target.name}は${exiled.name}を追放しました`);
                    }
                    const rest = revealed.filter(card => card !== exiled);
                    if (rest.length > 0) game.discardCards(target, rest);
                };
                if (candidates.length <= 1) {
                    finish(candidates[0] ?? null);
                    return;
                }
                game.promptSelect({
                    player: target, cards: candidates, min: 1, max: 1,
                    title: '枢機卿', message: '追放するカードを1枚選んでください。', confirmLabel: '追放する', purpose: 'knight-trash',
                    callback: ([index]) => finish(candidates[index])
                });
            });
        }
    },
    CAVALRY: {
        id: 'cavalry', name: '騎兵隊', cost: 4, types: [CARD_TYPES.ACTION],
        description: '馬を2枚獲得する。これを獲得したとき、カードを2枚引き、購入 +1。購入フェーズならアクションフェーズに戻る',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => gainHorses(game, player, 2),
        onGain: (player, game) => {
            gainBenefits(player, game, { cards: 2, buys: 1 }, '騎兵隊');
            game.returnToActionPhase(player);
        }
    },
    GROOM: {
        id: 'groom', name: '馬丁', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得する。それがアクションなら馬を、財宝なら銀貨を獲得し、勝利点ならカードを1枚引きアクション +1',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => game.promptGain({
            player, maxCost: 4, title: '馬丁', message: 'コスト4以下のカードを1枚獲得してください。',
            onGained: (card) => {
                if (isAction(card)) gainHorses(game, player, 1);
                if (isTreasure(card)) gainAndLog(game, player, 'silver');
                if (isVictory(card)) gainBenefits(player, game, { cards: 1, actions: 1 });
            }
        })
    },
    HOSTELRY: {
        id: 'hostelry', name: '旅籠', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。これを獲得したとき、手札の財宝を好きな枚数、公開して捨て、同じ枚数の馬を獲得する',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onGain: (player, game) => {
            const treasures = player.hand.filter(isTreasure);
            if (treasures.length === 0) return;
            game.promptSelect({
                player, cards: treasures, min: 0, max: treasures.length,
                title: '旅籠', message: '捨てる財宝を選んでください。同じ枚数の馬を獲得します。', confirmLabel: '捨てる', purpose: 'hostelry',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices.map(index => player.hand.indexOf(treasures[index])));
                    gainHorses(game, player, discarded.length);
                }
            });
        }
    },
    VILLAGE_GREEN: {
        id: 'village_green', name: '村の緑地', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '今か次のターンの開始時に、カードを1枚引きアクション +2。クリーンアップ以外でこれを捨てたとき、公開してプレイしてもよい',
        reactionType: 'discard',
        count: 10,
        onPlay: (player, game, green) => nowOrNextTurn(player, game, green, 'カード+1・アクション+2', () => gainBenefits(player, game, { cards: 1, actions: 2 }, '村の緑地')),
        onDiscard: (player, game, green) => game.promptConfirm({
            player, card: green, title: '村の緑地', message: '捨てた村の緑地をプレイしますか？', yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'reaction-play',
            callback: (yes) => {
                if (yes && player.discard.includes(green)) game.playCardFrom(player, green);
            }
        })
    },

    // ===== コスト5 =====
    BARGE: {
        id: 'barge', name: 'はしけ', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '今か次のターンの開始時に、カードを3枚引き購入 +1',
        count: 10,
        onPlay: (player, game, barge) => nowOrNextTurn(player, game, barge, 'カード+3・購入+1', () => gainBenefits(player, game, { cards: 3, buys: 1 }, 'はしけ'))
    },
    COVEN: {
        id: 'coven', name: '魔女集会', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。財宝 +2。他のプレイヤーはサプライの呪いを1枚追放する。できなければ、追放マットの呪いをすべて捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                if (game.exileFromSupply(target, 'curse')) return;
                const curses = target.mats.exile.filter(card => card.id === 'curse');
                curses.forEach(card => target.mats.exile.splice(target.mats.exile.indexOf(card), 1));
                target.discard.push(...curses);
                if (curses.length > 0) game.log(`${target.name}は追放マットの呪いを${curses.length}枚捨て札にしました`);
            });
        }
    },
    DISPLACE: {
        id: 'displace', name: '移転', cost: 5, types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚追放する。それと名前が違い、コストが2多いカードまでを1枚獲得する',
        count: 10,
        onPlay: (player, game) => promptFromHand(game, player, {
            title: '移転', message: '追放するカードを1枚選んでください。', confirmLabel: '追放する', purpose: 'displace',
            callback: ([card]) => {
                game.exileCard(player, card);
                const maxCost = game.getCost(card) + 2;
                game.promptGain({
                    player, maxCost, ...game.costExtras(card), filter: (data) => data.id !== card.id,
                    title: '移転', message: `コスト${maxCost}以下の、${card.name}以外のカードを1枚獲得してください。`
                });
            }
        })
    },
    FALCONER: {
        id: 'falconer', name: '鷹匠', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'これより安いカードを1枚獲得して手札に加える。誰かが種類を2つ以上持つカードを獲得したとき、手札のこれをプレイしてもよい',
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game, falconer) => game.promptGain({
            player, lessThan: falconer, destination: 'hand', title: '鷹匠', message: '鷹匠より安いカードを1枚獲得してください（手札に加えます）。'
        }),
        onOtherGain: (owner, game, falconer, gainer, card) => {
            if (card.types.length < 2) return;
            game.promptConfirm({
                player: owner, card: falconer, title: '鷹匠', message: `${gainer.name}が${card.name}を獲得しました。鷹匠をプレイしますか？`,
                yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'reaction-play',
                callback: (yes) => { if (yes) playReaction(game, owner, falconer); }
            });
        },
        onOwnGain: (player, game, falconer, card) => {
            if (card.types.length < 2 || card === falconer) return;
            game.promptConfirm({
                player, card: falconer, title: '鷹匠', message: `${card.name}を獲得しました。鷹匠をプレイしますか？`,
                yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'reaction-play',
                callback: (yes) => { if (yes) playReaction(game, player, falconer); }
            });
        }
    },
    FISHERMAN: {
        id: 'fisherman', name: '漁師', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。自分のターンの間、捨て札がなければ、これのコストは3少ない',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 })
    },
    GATEKEEPER: {
        id: 'gatekeeper', name: '門番', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンの開始時に、財宝 +3。それまで、他のプレイヤーが追放マットにないアクションか財宝を獲得したら、それを追放する',
        isAttack: true,
        count: 10,
        onPlay: (player, game, gatekeeper) => {
            game.attackOtherPlayers(player, (target) => player.gatekeeperVictims.add(target));
            player.addDuration(gatekeeper, () => gainBenefits(player, game, { coins: 3 }, '門番'));
        }
    },
    HUNTING_LODGE: {
        id: 'hunting_lodge', name: '狩猟小屋', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。手札をすべて捨ててカードを5枚引いてもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            game.promptConfirm({
                player, title: '狩猟小屋', message: '手札をすべて捨てて、カードを5枚引きますか？', yesLabel: '引き直す', noLabel: 'そのままにする', purpose: 'hunting-lodge',
                callback: (yes) => {
                    if (!yes) return;
                    game.discardFromHand(player, player.hand.map((card, index) => index));
                    gainBenefits(player, game, { cards: 5 }, '狩猟小屋');
                }
            });
        }
    },
    KILN: {
        id: 'kiln', name: '窯', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。このターン次にカードをプレイするとき、先にそのカードを1枚獲得してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.turnState.kilns++;
        }
    },
    LIVERY: {
        id: 'livery', name: '馬屋', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財宝 +3。このターン、コスト4以上のカードを獲得するたびに馬を1枚獲得する',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 3 });
            game.turnState.liveries++;
        }
    },
    MASTERMIND: {
        id: 'mastermind', name: '黒幕', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンの開始時に、手札のアクションカードを1枚、3回プレイしてもよい',
        count: 10,
        onPlay: (player, game, mastermind) => player.addDuration(mastermind, () => promptFromHand(game, player, {
            min: 0, filter: isAction, title: '黒幕', message: '3回プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
            confirmLabel: '3回プレイする', purpose: 'throne-room',
            callback: ([card]) => {
                if (card) game.playMultipleTimes(player, card, 3, mastermind, { asTreasure: false });
            }
        }))
    },
    PADDOCK: {
        id: 'paddock', name: '放牧場', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。馬を2枚獲得する。空のサプライの山1つにつきアクション +1',
        count: 10,
        nonSupplyPiles: HORSES,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2, actions: emptyPiles(game) });
            gainHorses(game, player, 2);
        }
    },
    SANCTUARY: {
        id: 'sanctuary', name: '聖域', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。手札のカードを1枚追放してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1, buys: 1 });
            promptFromHand(game, player, {
                min: 0, title: '聖域', message: '追放するカードを選んでください（選ばなくてもかまいません）。', confirmLabel: '追放する', purpose: 'sanctuary',
                callback: ([card]) => { if (card) game.exileCard(player, card); }
            });
        }
    },

    // ===== コスト6以上 =====
    DESTRIER: {
        id: 'destrier', name: '軍馬', cost: 6, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1。自分のターンの間、このターンに獲得したカード1枚につき、これのコストは1少ない',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2, actions: 1 })
    },
    WAYFARER: {
        id: 'wayfarer', name: '旅人', cost: 6, types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。銀貨を1枚獲得してもよい。このターンに最後に獲得した他のカードがあれば、これのコストはそれと同じ',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            game.promptConfirm({
                player, title: '旅人', message: '銀貨を獲得しますか？', yesLabel: '獲得する', noLabel: '獲得しない', purpose: 'wayfarer',
                callback: (yes) => { if (yes) gainAndLog(game, player, 'silver'); }
            });
        }
    },
    ANIMAL_FAIR: {
        id: 'animal_fair', name: '動物見本市', cost: 7, types: [CARD_TYPES.ACTION],
        description: '財宝 +4。空のサプライの山1つにつき購入 +1。このカードのコストを払う代わりに、手札のアクションカードを1枚廃棄してもよい',
        count: 10,
        altPayment: true,
        onPlay: (player, game) => gainBenefits(player, game, { coins: 4, buys: emptyPiles(game) })
    }
};

// ===== イベント =====
const event = (key, data) => ({ [key]: { kind: LANDSCAPE_KINDS.EVENT, ...data } });

export const MENAGERIE_EVENTS = {
    ...event('DELAY', {
        id: 'delay', name: '延期', cost: 0,
        description: '手札のアクションカードを1枚脇に置いてもよい。次のターンの開始時に、それをプレイする',
        onBuy: (player, game) => promptFromHand(game, player, {
            min: 0, filter: isAction, title: '延期', message: '次のターンにプレイするアクションカードを選んでください（選ばなくてもかまいません）。',
            confirmLabel: '脇に置く', purpose: 'delay',
            callback: ([card]) => {
                if (!card) return;
                player.hand.splice(player.hand.indexOf(card), 1);
                player.setAside.push(card);
                player.startOfTurnPlays.push(card);
                game.log(`${player.name}は${card.name}を脇に置きました`);
            }
        })
    }),
    ...event('DESPERATION', {
        id: 'desperation', name: '自暴自棄', cost: 0, oncePerTurn: true,
        description: '1ターンに1回：呪いを獲得してもよい。そうしたら、購入 +1 と財宝 +2',
        onBuy: (player, game) => game.promptConfirm({
            player, title: '自暴自棄', message: '呪いを獲得して、購入+1と財宝+2を得ますか？', yesLabel: '獲得する', noLabel: '獲得しない', purpose: 'desperation',
            callback: (yes) => {
                if (yes && game.gainCurse(player)) gainBenefits(player, game, { buys: 1, coins: 2 });
            }
        })
    }),
    ...event('GAMBLE', {
        id: 'gamble', name: '賭け', cost: 2,
        description: '購入 +1。山札の一番上を公開する。財宝かアクションならプレイしてもよい。そうでなければ捨て札にする',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            if (!isTreasure(card) && !isAction(card)) {
                game.discardCards(player, [card]);
                return;
            }
            game.promptConfirm({
                player, card, title: '賭け', message: `${card.name}をプレイしますか？`, yesLabel: 'プレイする', noLabel: '捨て札にする', purpose: 'gamble',
                callback: (yes) => {
                    if (!yes) {
                        game.discardCards(player, [card]);
                        return;
                    }
                    if (isTreasure(card)) {
                        game.log(`${player.name}は${card.name}をプレイしました`);
                        player.playArea.push(card);
                        game.applyTreasure(player, card);
                    } else {
                        game.playCardFrom(player, card, { remove: false });
                    }
                }
            });
        }
    }),
    ...event('PURSUE', {
        id: 'pursue', name: '追跡', cost: 2,
        description: '購入 +1。カードを1種指定し、山札の上から4枚を公開する。指定したカードを山札に戻し、残りを捨て札にする',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.promptNameCard({
                player, title: '追跡', message: '山札に残すカードを指定してください。', purpose: 'name-card',
                callback: (data) => {
                    const cards = takeTopCards(player, 4);
                    logReveal(game, player, cards, '山札の上から4枚');
                    const keep = cards.filter(card => card.id === data.id);
                    const rest = cards.filter(card => card.id !== data.id);
                    player.deck.unshift(...keep);
                    if (rest.length > 0) game.discardCards(player, rest);
                }
            });
        }
    }),
    ...event('RIDE', {
        id: 'ride', name: '騎乗', cost: 2, nonSupplyPiles: HORSES,
        description: '馬を1枚獲得する',
        onBuy: (player, game) => gainHorses(game, player, 1)
    }),
    ...event('TOIL', {
        id: 'toil', name: '苦役', cost: 2,
        description: '購入 +1。手札のアクションカードを1枚プレイしてもよい',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '苦役', message: 'プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([card]) => { if (card) game.playCardFrom(player, card); }
            });
        }
    }),
    ...event('ENHANCE', {
        id: 'enhance', name: '強化', cost: 3,
        description: '手札の勝利点以外のカードを1枚廃棄してもよい。そうしたら、それよりコストが2多いカードまでを1枚獲得する',
        onBuy: (player, game) => promptTrashFromHand(game, player, {
            min: 0, filter: (card) => !isVictory(card), title: '強化', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'remodel-trash',
            callback: ([trashed]) => {
                if (!trashed) return;
                const maxCost = game.getCost(trashed) + 2;
                game.promptGain({ player, maxCost, ...game.costExtras(trashed), title: '強化', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
            }
        })
    }),
    ...event('MARCH', {
        id: 'march', name: '進軍', cost: 3,
        description: '捨て札を見て、アクションカードを1枚プレイしてもよい',
        onBuy: (player, game) => {
            const actions = player.discard.filter(isAction);
            if (actions.length === 0) return;
            game.promptSelect({
                player, cards: actions, min: 0, max: 1,
                title: '進軍', message: '捨て札からプレイするアクションカードを選んでください（選ばなくてもかまいません）。', confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([index]) => { if (index !== undefined) game.playCardFrom(player, actions[index]); }
            });
        }
    }),
    ...event('TRANSPORT', {
        id: 'transport', name: '輸送', cost: 3,
        description: '次のうち1つを選ぶ：サプライのアクションカードを1枚追放する。または、追放マットのアクションカードを1枚山札の上に置く',
        onBuy: (player, game) => game.promptChoose({
            player, options: ['サプライのアクションを追放する', '追放マットのアクションを山札の上に置く'],
            title: '輸送', message: '1つ選んでください。', purpose: 'transport',
            callback: ([index]) => {
                if (index === 0) {
                    game.promptActionPile({
                        player, title: '輸送', message: '追放するアクションの山を選んでください。', purpose: 'camel-train',
                        callback: (pileId) => game.exileFromSupply(player, pileId)
                    });
                    return;
                }
                const actions = player.mats.exile.filter(isAction);
                if (actions.length === 0) return;
                game.promptSelect({
                    player, cards: actions, min: 1, max: 1,
                    title: '輸送', message: '山札の上に置くカードを選んでください。', confirmLabel: '山札の上に置く', purpose: 'archive',
                    callback: ([i]) => {
                        const card = actions[i];
                        player.mats.exile.splice(player.mats.exile.indexOf(card), 1);
                        player.deck.unshift(card);
                        game.log(`${player.name}は追放マットの${card.name}を山札の上に置きました`);
                    }
                });
            }
        })
    }),
    ...event('BANISH', {
        id: 'banish', name: '追放', cost: 4,
        description: '手札の同じ名前のカードを好きな枚数追放する',
        onBuy: (player, game) => promptFromHand(game, player, {
            min: 0, title: '追放', message: '追放するカードを1枚選んでください。同じ名前のカードをすべて追放します。', confirmLabel: '追放する', purpose: 'banish',
            callback: ([card]) => {
                if (!card) return;
                player.hand.filter(c => c.id === card.id).forEach(c => game.exileCard(player, c));
            }
        })
    }),
    ...event('BARGAIN', {
        id: 'bargain', name: '取引', cost: 4, nonSupplyPiles: HORSES,
        description: 'コスト5以下の勝利点以外のカードを1枚獲得する。他のプレイヤーは馬を1枚獲得する',
        onBuy: (player, game) => {
            game.promptGain({ player, maxCost: 5, filter: (data) => !data.types.includes(CARD_TYPES.VICTORY), title: '取引', message: 'コスト5以下の勝利点以外のカードを1枚獲得してください。' });
            game.runNext(() => game.getOtherPlayers(player).forEach(other => gainHorses(game, other, 1)));
        }
    }),
    ...event('INVEST', {
        id: 'invest', name: '出資', cost: 4,
        description: 'サプライのアクションカードを1枚追放する。それが追放マットにある間、他のプレイヤーがそのカードを獲得するか出資するたびに、カードを2枚引く',
        onBuy: (player, game) => game.promptActionPile({
            player, title: '出資', message: '追放するアクションの山を選んでください。', purpose: 'camel-train',
            callback: (pileId) => {
                const card = game.exileFromSupply(player, pileId);
                if (!card) return;
                // 他のプレイヤーで、同じカードに出資して追放マットに置いている人はカードを2枚引く
                game.getOtherPlayers(player).filter(other => other.mats.exile.some(c => c.id === card.id && c.invested)).forEach(other => gainBenefits(other, game, { cards: 2 }, '出資'));
                card.invested = true;
            }
        })
    }),
    ...event('SEIZE_THE_DAY', {
        id: 'seize_the_day', name: '好機', cost: 4, oncePerGame: true,
        description: '1ゲームに1回：このターンの後に追加のターンを行う',
        onBuy: (player, game) => {
            game.extraTurns.push(player);
            game.log(`${player.name}はこのターンの後に追加のターンを行います`);
        }
    }),
    ...event('COMMERCE', {
        id: 'commerce', name: '商業', cost: 5,
        description: 'このターンに獲得した名前の違うカード1枚につき、金貨を1枚獲得する',
        onBuy: (player, game) => {
            const count = new Set(player.gainedThisTurn).size;
            for (let i = 0; i < count; i++) gainAndLog(game, player, 'gold');
        }
    }),
    ...event('DEMAND', {
        id: 'demand', name: '需要', cost: 5, nonSupplyPiles: HORSES,
        description: '馬とコスト4以下のカードを1枚ずつ獲得し、どちらも山札の上に置く',
        onBuy: (player, game) => {
            gainHorses(game, player, 1, 'deck');
            game.promptGain({ player, maxCost: 4, destination: 'deck', title: '需要', message: 'コスト4以下のカードを1枚獲得してください（山札の上に置きます）。' });
        }
    }),
    ...event('STAMPEDE', {
        id: 'stampede', name: '暴走', cost: 5, nonSupplyPiles: HORSES,
        description: '場のカードが5枚以下なら、馬を5枚獲得して山札の上に置く',
        onBuy: (player, game) => {
            if (player.playArea.length > 5) return;
            gainHorses(game, player, 5, 'deck');
        }
    }),
    ...event('REAP', {
        id: 'reap', name: '刈り取り', cost: 7,
        description: '金貨を1枚獲得し、脇に置く。そうしたら、次のターンの開始時にそれをプレイする',
        onBuy: (player, game) => {
            const gold = gainAndLog(game, player, 'gold');
            if (!gold || !player.removeCard(gold)) return;
            player.setAside.push(gold);
            player.startOfTurnPlays.push(gold);
        }
    }),
    ...event('ENCLAVE', {
        id: 'enclave', name: '飛び地', cost: 8,
        description: '金貨を1枚獲得する。サプライの公領を1枚追放する',
        onBuy: (player, game) => {
            gainAndLog(game, player, 'gold');
            game.exileFromSupply(player, 'duchy');
        }
    }),
    ...event('ALLIANCE', {
        id: 'alliance', name: '同盟関係', cost: 10,
        description: '属州・公領・屋敷・金貨・銀貨・銅貨を1枚ずつ獲得する',
        onBuy: (player, game) => ['province', 'duchy', 'estate', 'gold', 'silver', 'copper'].forEach(id => gainAndLog(game, player, id))
    }),
    ...event('POPULATE', {
        id: 'populate', name: '入植', cost: 10,
        description: 'サプライのアクションの山から1枚ずつ獲得する',
        onBuy: (player, game) => Object.keys(game.supply)
            .filter(pileId => game.getPileTopData(pileId)?.types.includes(CARD_TYPES.ACTION) && game.supply[pileId] > 0)
            .forEach(pileId => gainAndLog(game, player, pileId))
    })
};

// ===== 習性（アクションカードをプレイするとき、本来の効果の代わりに使ってよい） =====
const way = (key, id, name, description, wayEffect, extra = {}) => ({
    [key]: { id, name, description, kind: LANDSCAPE_KINDS.WAY, wayEffect, ...extra }
});

export const MENAGERIE_WAYS = {
    ...way('WAY_OF_THE_BUTTERFLY', 'way_of_the_butterfly', '蝶の習性', 'これを山に戻して、コストがちょうど1多いカードを1枚獲得してもよい', (player, game, card) => {
        if (!player.playArea.includes(card)) return;
        game.promptConfirm({
            player, card, title: '蝶の習性', message: `${card.name}を山に戻して、コストが1多いカードを獲得しますか？`, yesLabel: '戻す', noLabel: '戻さない', purpose: 'butterfly',
            callback: (yes) => {
                if (!yes || !game.returnToSupply(player, card)) return;
                const cost = game.getCost(card) + 1;
                game.promptGain({ player, exactCost: cost, ...game.costExtras(card), title: '蝶の習性', message: `コストがちょうど${cost}のカードを1枚獲得してください。` });
            }
        });
    }),
    ...way('WAY_OF_THE_CAMEL', 'way_of_the_camel', 'ラクダの習性', 'サプライの金貨を1枚追放する', (player, game) => game.exileFromSupply(player, 'gold')),
    ...way('WAY_OF_THE_CHAMELEON', 'way_of_the_chameleon', 'カメレオンの習性', 'このカードの効果を使う。このターン、その効果でカード+を得るときは財宝+を、財宝+を得るときはカード+を代わりに得る', (player, game, card) => {
        player.chameleonActive = true;
        card.onPlay?.(player, game, card);
        game.runNext(() => { player.chameleonActive = false; });
    }),
    ...way('WAY_OF_THE_FROG', 'way_of_the_frog', 'カエルの習性', 'アクション +1。このターン、これを場から捨て札にするとき、山札の上に置く', (player, game, card) => {
        gainBenefits(player, game, { actions: 1 });
        card.frogTurn = game.turnCount;
    }),
    ...way('WAY_OF_THE_GOAT', 'way_of_the_goat', 'ヤギの習性', '手札のカードを1枚廃棄する', (player, game) => promptTrashFromHand(game, player, {
        title: 'ヤギの習性', message: '廃棄するカードを1枚選んでください。', purpose: 'goat-trash'
    })),
    ...way('WAY_OF_THE_HORSE', 'way_of_the_horse', '馬の習性', 'カードを2枚引く。アクション +1。これを山に戻す', (player, game, card) => {
        gainBenefits(player, game, { cards: 2, actions: 1 });
        if (game.returnToSupply(player, card)) game.log(`${player.name}は${card.name}を山に戻しました`);
    }),
    ...way('WAY_OF_THE_MOLE', 'way_of_the_mole', 'モグラの習性', 'アクション +1。手札をすべて捨てる。カードを3枚引く', (player, game) => {
        gainBenefits(player, game, { actions: 1 });
        game.discardFromHand(player, player.hand.map((card, index) => index));
        gainBenefits(player, game, { cards: 3 });
    }),
    ...way('WAY_OF_THE_MONKEY', 'way_of_the_monkey', '猿の習性', '購入 +1。財宝 +1', (player, game) => gainBenefits(player, game, { buys: 1, coins: 1 })),
    ...way('WAY_OF_THE_MOUSE', 'way_of_the_mouse', 'ネズミの習性', '脇に置いたカードを、そこに置いたままプレイする。準備：使わないコスト2か3のアクションカードを1枚脇に置く', (player, game) => {
        const id = game.landscapeState.mouseCard;
        if (!id) return;
        const card = new Card(game.getPileTopData(id));
        game.log(`${player.name}はネズミの習性で${card.name}をプレイしました`);
        card.onPlay?.(player, game, card);
    }, {
        setup: (game) => {
            const id = game.pickUnusedKingdomCard(data => [2, 3].includes(data.cost) && data.types.includes(CARD_TYPES.ACTION) && !data.pileCards && !data.potionCost && !data.debtCost);
            game.landscapeState.mouseCard = id;
            if (id) game.log(`ネズミの習性で脇に置いたカードは${game.getPileName(id)}です`);
        }
    }),
    ...way('WAY_OF_THE_MULE', 'way_of_the_mule', 'ラバの習性', 'アクション +1。財宝 +1', (player, game) => gainBenefits(player, game, { actions: 1, coins: 1 })),
    ...way('WAY_OF_THE_OTTER', 'way_of_the_otter', 'カワウソの習性', 'カードを2枚引く', (player, game) => gainBenefits(player, game, { cards: 2 })),
    ...way('WAY_OF_THE_OWL', 'way_of_the_owl', 'フクロウの習性', '手札が6枚になるまでカードを引く', (player, game) => {
        const count = Math.max(0, 6 - player.hand.length);
        if (count > 0) gainBenefits(player, game, { cards: count });
    }),
    ...way('WAY_OF_THE_OX', 'way_of_the_ox', '牛の習性', 'アクション +2', (player, game) => gainBenefits(player, game, { actions: 2 })),
    ...way('WAY_OF_THE_PIG', 'way_of_the_pig', '豚の習性', 'カードを1枚引く。アクション +1', (player, game) => gainBenefits(player, game, { cards: 1, actions: 1 })),
    ...way('WAY_OF_THE_RAT', 'way_of_the_rat', 'ドブネズミの習性', '手札の財宝を1枚捨ててもよい。そうしたら、このカードを1枚獲得する', (player, game, card) => promptFromHand(game, player, {
        min: 0, filter: isTreasure, title: 'ドブネズミの習性', message: `捨てる財宝を選んでください（捨てると${card.name}を獲得します）。`, confirmLabel: '捨てる', purpose: 'rat',
        callback: ([treasure]) => {
            if (!treasure) return;
            game.discardFromHand(player, [player.hand.indexOf(treasure)]);
            gainAndLog(game, player, card.id);
        }
    })),
    ...way('WAY_OF_THE_SEAL', 'way_of_the_seal', 'アザラシの習性', '財宝 +1。このターン、カードを獲得したとき、それを山札の上に置いてもよい', (player, game) => {
        gainBenefits(player, game, { coins: 1 });
        game.turnState.sealGains = true;
    }),
    ...way('WAY_OF_THE_SHEEP', 'way_of_the_sheep', '羊の習性', '財宝 +2', (player, game) => gainBenefits(player, game, { coins: 2 })),
    ...way('WAY_OF_THE_SQUIRREL', 'way_of_the_squirrel', 'リスの習性', 'このターンの終わりに、カードを2枚引く', (player, game) => {
        game.turnState.riverDraw += 2;
        game.log(`${player.name}はターンの終わりにカードを2枚引きます`);
    }),
    ...way('WAY_OF_THE_TURTLE', 'way_of_the_turtle', 'カメの習性', 'これを脇に置く。そうしたら、次のターンの開始時にプレイする', (player, game, card) => {
        const index = player.playArea.indexOf(card);
        if (index < 0) return;
        player.playArea.splice(index, 1);
        player.setAside.push(card);
        player.startOfTurnPlays.push(card);
        game.log(`${player.name}は${card.name}を脇に置きました`);
    }),
    ...way('WAY_OF_THE_WORM', 'way_of_the_worm', 'ミミズの習性', 'サプライの屋敷を1枚追放する', (player, game) => game.exileFromSupply(player, 'estate'))
};
