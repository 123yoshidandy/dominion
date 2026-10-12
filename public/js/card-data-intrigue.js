/**
 * 拡張「陰謀」（第2版）の王国カードデータ
 */

import Card from './card.js';
import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, isCurse, names, gainBenefits, promptFromHand, promptTrashFromHand,
    promptDiscardFromHand, takeTopCards, putBackInAnyOrder, logReveal
} from './card-helpers.js';

export const INTRIGUE_CARDS = {
    // ===== コスト2 =====
    COURTYARD: {
        id: 'courtyard',
        name: '中庭',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。手札のカードを1枚、山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            promptFromHand(game, player, {
                title: '中庭',
                message: '山札の上に置くカードを1枚選んでください。',
                confirmLabel: '山札の上に置く',
                purpose: 'topdeck-from-hand',
                callback: ([card]) => {
                    player.hand.splice(player.hand.indexOf(card), 1);
                    player.deck.unshift(card);
                    game.log(`${player.name}はカードを1枚山札の上に置きました`);
                }
            });
        }
    },
    LURKER: {
        id: 'lurker',
        name: '待ち伏せ',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。サプライのアクションカードを1枚廃棄するか、廃棄置き場のアクションカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const trashActions = game.trash.filter(isAction);
            game.promptChoose({
                player,
                options: ['サプライのアクションを廃棄する', `廃棄置き場のアクションを獲得する（${trashActions.length}枚）`],
                title: '待ち伏せ',
                message: 'どちらかを選んでください。',
                purpose: 'lurker',
                callback: ([choice]) => {
                    if (choice === 0) {
                        const candidates = game.getGainableCards({ filter: isAction });
                        if (candidates.length === 0) return;
                        game.promptSelect({
                            player,
                            cards: candidates.map(data => new Card(data)),
                            min: 1,
                            max: 1,
                            title: '待ち伏せ',
                            message: '廃棄するサプライのアクションカードを選んでください。',
                            confirmLabel: '廃棄する',
                            purpose: 'lurker-trash',
                            callback: ([index]) => {
                                const data = candidates[index];
                                game.supply[data.id]--;
                                game.log(`${player.name}はサプライの${data.name}を廃棄しました`);
                                game.trashCard(player, new Card(data));
                            }
                        });
                        return;
                    }
                    const candidates = game.trash.filter(isAction);
                    if (candidates.length === 0) {
                        game.log('廃棄置き場にアクションカードはありませんでした');
                        return;
                    }
                    game.promptSelect({
                        player,
                        cards: candidates,
                        min: 1,
                        max: 1,
                        title: '待ち伏せ',
                        message: '獲得するアクションカードを廃棄置き場から選んでください。',
                        confirmLabel: '獲得する',
                        purpose: 'gain-from-trash',
                        callback: ([index]) => {
                            const card = candidates[index];
                            game.trash.splice(game.trash.indexOf(card), 1);
                            game.log(`${player.name}は廃棄置き場の${card.name}を獲得しました`);
                            game.gainCardInstance(player, card);
                        }
                    });
                }
            });
        }
    },
    PAWN: {
        id: 'pawn',
        name: '手先',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '次のうち異なる2つを選ぶ：カードを1枚引く、アクション +1、購入 +1、財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            const options = [{ cards: 1 }, { actions: 1 }, { buys: 1 }, { coins: 1 }];
            game.promptChoose({
                player,
                options: ['カードを1枚引く', 'アクション +1', '購入 +1', '財宝 +1'],
                min: 2,
                max: 2,
                title: '手先',
                message: '異なる2つを選んでください。',
                purpose: 'pawn',
                callback: (indices) => {
                    const total = {};
                    indices.forEach(index => Object.entries(options[index]).forEach(([key, value]) => { total[key] = value; }));
                    gainBenefits(player, game, total);
                }
            });
        }
    },

    // ===== コスト3 =====
    MASQUERADE: {
        id: 'masquerade',
        name: '仮面舞踏会',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。手札のあるプレイヤーは全員、手札を1枚選んで、手札のある次のプレイヤー（左隣側）に同時に渡す。その後、手札を1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            const passers = game.getPlayersFrom(player).filter(p => p.hand.length > 0);
            const passed = new Map();

            const choose = (passer) => () => promptFromHand(game, passer, {
                title: '仮面舞踏会',
                message: '左隣（手札のある次のプレイヤー）に渡すカードを1枚選んでください。',
                confirmLabel: '渡す',
                purpose: 'masquerade-pass',
                callback: ([card]) => passed.set(passer, card)
            });

            const pass = () => {
                if (passers.length < 2) return;
                passers.forEach(passer => {
                    const card = passed.get(passer);
                    passer.hand.splice(passer.hand.indexOf(card), 1);
                });
                passers.forEach((passer, i) => {
                    const receiver = passers[(i + 1) % passers.length];
                    receiver.hand.push(passed.get(passer));
                });
                game.log('手札のあるプレイヤーは左隣にカードを1枚渡しました');
            };

            const trash = () => promptTrashFromHand(game, player, {
                min: 0,
                title: '仮面舞踏会',
                message: '廃棄するカードを1枚選んでください（選ばなくてもかまいません）。',
                purpose: 'optional-trash'
            });

            game.runNext(...(passers.length >= 2 ? passers.map(choose) : []), pass, trash);
        }
    },
    SHANTY_TOWN: {
        id: 'shanty_town',
        name: '貧民街',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +2。手札を公開し、アクションカードがなければカードを2枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 2 });
            logReveal(game, player, player.hand);
            if (!player.hand.some(isAction)) gainBenefits(player, game, { cards: 2 });
        }
    },
    STEWARD: {
        id: 'steward',
        name: '執事',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '次のうち1つを選ぶ：カードを2枚引く、財宝 +2、手札を2枚廃棄する',
        count: 10,
        onPlay: (player, game) => {
            game.promptChoose({
                player,
                options: ['カードを2枚引く', '財宝 +2', '手札を2枚廃棄する'],
                title: '執事',
                message: '1つを選んでください。',
                purpose: 'steward',
                callback: ([choice]) => {
                    if (choice === 0) gainBenefits(player, game, { cards: 2 });
                    if (choice === 1) gainBenefits(player, game, { coins: 2 });
                    if (choice === 2) {
                        const count = Math.min(2, player.hand.length);
                        promptTrashFromHand(game, player, {
                            min: count,
                            max: count,
                            title: '執事',
                            message: `廃棄するカードを${count}枚選んでください。`,
                            purpose: 'steward-trash'
                        });
                    }
                }
            });
        }
    },
    SWINDLER: {
        id: 'swindler',
        name: '詐欺師',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。他のプレイヤーは山札の一番上を廃棄し、あなたが選んだ同じコストのカードを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                const [card] = takeTopCards(target, 1);
                if (!card) return;
                game.trashCard(target, card);
                const cost = game.getCost(card);
                game.log(`${target.name}は山札の一番上の${card.name}を廃棄しました`);
                const candidates = game.getGainableCards({ exactCost: cost, ...game.costExtras(card) });
                if (candidates.length === 0) return;
                game.promptSelect({
                    player,
                    cards: candidates.map(data => new Card(data)),
                    min: 1,
                    max: 1,
                    title: '詐欺師',
                    message: `${target.name}が獲得するコスト${cost}のカードを選んでください。`,
                    confirmLabel: '獲得させる',
                    purpose: 'swindler',
                    callback: ([index]) => {
                        game.log(`${target.name}は${candidates[index].name}を獲得しました`);
                        game.gainCardFromSupply(target, candidates[index].id);
                    }
                });
            });
        }
    },
    WISHING_WELL: {
        id: 'wishing_well',
        name: '願いの井戸',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。カードを1種指定し、山札の一番上を公開する。指定したカードなら手札に加える',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.promptNameCard({
                player,
                title: '願いの井戸',
                message: '山札の一番上にありそうなカードを1種指定してください。',
                purpose: 'name-card',
                callback: (named) => {
                    const [card] = takeTopCards(player, 1);
                    if (!card) return;
                    if (card.id === named.id) {
                        player.hand.push(card);
                        game.log(`${player.name}は${card.name}を公開し、手札に加えました`);
                    } else {
                        player.deck.unshift(card);
                        game.log(`${player.name}は${card.name}を公開し、山札に戻しました`);
                    }
                }
            });
        }
    },

    // ===== コスト4 =====
    BARON: {
        id: 'baron',
        name: '男爵',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。手札の屋敷を1枚捨ててもよい。捨てたら財宝 +4。捨てなければ屋敷を1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            const gainEstate = () => {
                if (game.gainCardFromSupply(player, 'estate')) game.log(`${player.name}は屋敷を獲得しました`);
            };
            if (!player.hand.some(card => card.id === 'estate')) {
                gainEstate();
                return;
            }
            game.promptConfirm({
                player,
                title: '男爵',
                message: '手札の屋敷を1枚捨てて、財宝+4を得ますか？（捨てなければ屋敷を獲得します）',
                yesLabel: '捨てる',
                noLabel: '屋敷を獲得する',
                purpose: 'baron',
                callback: (yes) => {
                    if (!yes) {
                        gainEstate();
                        return;
                    }
                    game.discardFromHand(player, [player.hand.findIndex(card => card.id === 'estate')]);
                    game.log(`${player.name}は屋敷を捨てました`);
                    gainBenefits(player, game, { coins: 4 });
                }
            });
        }
    },
    BRIDGE: {
        id: 'bridge',
        name: '橋',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +1。このターン、すべてのカードのコストは1少なくなる（0未満にはならない）',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1, coins: 1 });
            game.turnState.costReduction += 1;
        }
    },
    CONSPIRATOR: {
        id: 'conspirator',
        name: '共謀者',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。このターンにアクションを3回以上プレイしていれば（これを含む）、カードを1枚引き、アクション +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            if (game.turnState.actionsPlayed >= 3) gainBenefits(player, game, { cards: 1, actions: 1 });
        }
    },
    DIPLOMAT: {
        id: 'diplomat',
        name: '外交官',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。引いた後の手札が5枚以下ならアクション +2。他のプレイヤーがアタックカードをプレイしたとき、手札が5枚以上なら、これを公開してカードを2枚引き、手札を3枚捨ててもよい',
        reactionType: 'attack',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            if (player.hand.length <= 5) gainBenefits(player, game, { actions: 2 });
        },
        onAttackReaction: (player, game, card) => {
            if (player.hand.length < 5) return;
            game.promptConfirm({
                player,
                card,
                title: '外交官',
                message: '外交官を公開して、カードを2枚引き、手札を3枚捨てますか？',
                yesLabel: '公開する',
                noLabel: '公開しない',
                purpose: 'diplomat-react',
                callback: (yes) => {
                    if (!yes) return;
                    game.log(`${player.name}は外交官を公開しました`);
                    gainBenefits(player, game, { cards: 2 });
                    promptDiscardFromHand(game, player, 3, '外交官');
                }
            });
        }
    },
    IRONWORKS: {
        id: 'ironworks',
        name: '鉄工所',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得する。それがアクションならアクション +1、財宝なら財宝 +1、勝利点ならカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            game.promptGain({
                player,
                maxCost: 4,
                title: '鉄工所',
                message: 'コスト4以下のカードを1枚獲得してください。',
                onGained: (card) => gainBenefits(player, game, {
                    actions: isAction(card) ? 1 : 0,
                    coins: isTreasure(card) ? 1 : 0,
                    cards: isVictory(card) ? 1 : 0
                })
            });
        }
    },
    MILL: {
        id: 'mill',
        name: '風車',
        cost: 4,
        types: [CARD_TYPES.ACTION, CARD_TYPES.VICTORY],
        points: 1,
        description: 'カードを1枚引く。アクション +1。手札を2枚捨ててもよい。捨てたら財宝 +2。勝利点 1',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            if (player.hand.length < 2) return;
            game.promptSelect({
                player,
                cards: player.hand,
                min: 0,
                max: 2,
                title: '風車',
                message: '手札を2枚捨てると財宝+2を得ます（捨てなくてもかまいません）。',
                confirmLabel: '捨てる',
                purpose: 'mill-discard',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices);
                    if (discarded.length > 0) game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
                    if (discarded.length === 2) gainBenefits(player, game, { coins: 2 });
                }
            });
        }
    },
    MINING_VILLAGE: {
        id: 'mining_village',
        name: '鉱山の村',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。このカードを廃棄してもよい。廃棄したら財宝 +2',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            if (!player.playArea.includes(card)) return;
            game.promptConfirm({
                player,
                card,
                title: '鉱山の村',
                message: '鉱山の村を廃棄して、財宝+2を得ますか？',
                yesLabel: '廃棄する',
                noLabel: '廃棄しない',
                purpose: 'mining-village',
                callback: (yes) => {
                    if (!yes || !player.playArea.includes(card)) return;
                    player.playArea.splice(player.playArea.indexOf(card), 1);
                    game.trashCard(player, card);
                    game.log(`${player.name}は鉱山の村を廃棄しました`);
                    gainBenefits(player, game, { coins: 2 });
                }
            });
        }
    },
    SECRET_PASSAGE: {
        id: 'secret_passage',
        name: '秘密の通路',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1。手札のカードを1枚、山札の好きな位置に置く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2, actions: 1 });
            promptFromHand(game, player, {
                title: '秘密の通路',
                message: '山札に入れるカードを1枚選んでください。',
                confirmLabel: '選ぶ',
                purpose: 'secret-passage-card',
                callback: ([card]) => {
                    player.hand.splice(player.hand.indexOf(card), 1);
                    const positions = Array.from({ length: Math.min(player.deck.length, 5) + 1 }, (_, i) => i);
                    if (player.deck.length > 5) positions.push(player.deck.length);
                    game.promptChoose({
                        player,
                        card,
                        options: positions.map(position => (position === 0 ? '一番上'
                            : position === player.deck.length ? '一番下' : `上から${position + 1}枚目`)),
                        title: '秘密の通路',
                        message: `${card.name}を山札のどこに置きますか？`,
                        purpose: 'secret-passage-position',
                        callback: ([index]) => {
                            player.deck.splice(positions[index], 0, card);
                            game.log(`${player.name}はカードを1枚山札に入れました`);
                        }
                    });
                }
            });
        }
    },

    // ===== コスト5 =====
    COURTIER: {
        id: 'courtier',
        name: '廷臣',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚公開する。その種類の数（アクション・アタックなど）だけ、異なるものを選ぶ：アクション +1、購入 +1、財宝 +3、金貨を1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            promptFromHand(game, player, {
                title: '廷臣',
                message: '公開するカードを1枚選んでください。種類の数だけ効果を選べます。',
                confirmLabel: '公開する',
                purpose: 'courtier-reveal',
                callback: ([card]) => {
                    const count = Math.min(card.types.length, 4);
                    game.log(`${player.name}は${card.name}を公開しました（種類 ${card.types.length}）`);
                    game.promptChoose({
                        player,
                        options: ['アクション +1', '購入 +1', '財宝 +3', '金貨を獲得する'],
                        min: count,
                        max: count,
                        title: '廷臣',
                        message: `異なるものを${count}つ選んでください。`,
                        purpose: 'courtier',
                        callback: (indices) => {
                            gainBenefits(player, game, {
                                actions: indices.includes(0) ? 1 : 0,
                                buys: indices.includes(1) ? 1 : 0,
                                coins: indices.includes(2) ? 3 : 0
                            });
                            if (indices.includes(3) && game.gainCardFromSupply(player, 'gold')) {
                                game.log(`${player.name}は金貨を獲得しました`);
                            }
                        }
                    });
                }
            });
        }
    },
    DUKE: {
        id: 'duke',
        name: '公爵',
        cost: 5,
        types: [CARD_TYPES.VICTORY],
        description: '持っている公領1枚につき勝利点 1',
        pointsFor: (allCards) => allCards.filter(card => card.id === 'duchy').length
    },
    MINION: {
        id: 'minion',
        name: '寵臣',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。財宝 +2 か、手札をすべて捨ててカードを4枚引き、手札が5枚以上の他のプレイヤーも手札をすべて捨てて4枚引く、のどちらかを選ぶ',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            game.promptChoose({
                player,
                options: ['財宝 +2', '手札を捨てて4枚引く（攻撃）'],
                title: '寵臣',
                message: 'どちらかを選んでください。',
                purpose: 'minion',
                callback: ([choice]) => {
                    if (choice === 0) {
                        gainBenefits(player, game, { coins: 2 });
                        return;
                    }
                    const redraw = (target) => {
                        game.log(`${target.name}は手札を${target.hand.length}枚すべて捨てました`);
                        game.discardCards(target, target.hand.splice(0));
                        gainBenefits(target, game, { cards: 4 });
                    };
                    redraw(player);
                    game.attackOtherPlayers(player, (target) => {
                        if (target.hand.length >= 5) redraw(target);
                    });
                }
            });
        }
    },
    PATROL: {
        id: 'patrol',
        name: '巡回',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。山札の上から4枚を公開し、勝利点カードと呪いを手札に加え、残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            const revealed = takeTopCards(player, 4);
            if (revealed.length === 0) return;
            game.log(`${player.name}は${names(revealed)}を公開しました`);
            const taken = revealed.filter(card => isVictory(card) || isCurse(card));
            player.hand.push(...taken);
            if (taken.length > 0) game.log(`${player.name}は${names(taken)}を手札に加えました`);
            putBackInAnyOrder(game, player, revealed.filter(card => !taken.includes(card)), '巡回');
        }
    },
    REPLACE: {
        id: 'replace',
        name: '交換',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄し、それよりコストが最大2多いカードを1枚獲得する。獲得したのがアクションか財宝なら山札の上に置く。勝利点カードなら他のプレイヤーは呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                title: '交換',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'remodel-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const maxCost = game.getCost(trashed) + 2;
                    game.promptGain({
                        player,
                        maxCost,
                        ...game.costExtras(trashed),
                        title: '交換',
                        message: `コスト${maxCost}以下のカードを1枚獲得してください。`,
                        onGained: (card) => {
                            if (isAction(card) || isTreasure(card)) {
                                if (player.removeCard(card)) {
                                    player.deck.unshift(card);
                                    game.log(`${player.name}は${card.name}を山札の上に置きました`);
                                }
                            }
                            if (isVictory(card)) {
                                game.attackOtherPlayers(player, (target) => game.gainCurse(target));
                            }
                        }
                    });
                }
            });
        }
    },
    TORTURER: {
        id: 'torturer',
        name: '拷問人',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。他のプレイヤーは、手札を2枚捨てるか、呪いを1枚獲得して手札に加えるかを選ぶ',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            game.attackOtherPlayers(player, (target) => {
                game.promptChoose({
                    player: target,
                    options: ['手札を2枚捨てる', '呪いを手札に獲得する'],
                    title: '拷問人',
                    message: 'どちらかを選んでください。',
                    purpose: 'torturer',
                    callback: ([choice]) => {
                        if (choice === 0) {
                            promptDiscardFromHand(game, target, 2, '拷問人');
                        } else {
                            game.gainCurse(target, 'hand');
                        }
                    }
                });
            });
        }
    },
    TRADING_POST: {
        id: 'trading_post',
        name: '交易場',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札を2枚廃棄する。2枚廃棄したら、銀貨を1枚獲得して手札に加える',
        count: 10,
        onPlay: (player, game) => {
            const count = Math.min(2, player.hand.length);
            promptTrashFromHand(game, player, {
                min: count,
                max: count,
                title: '交易場',
                message: `廃棄するカードを${count}枚選んでください。2枚廃棄すると銀貨を手札に獲得します。`,
                purpose: 'trading-post',
                callback: (trashed) => {
                    if (trashed.length === 2 && game.gainCardFromSupply(player, 'silver', 'hand')) {
                        game.log(`${player.name}は銀貨を獲得し、手札に加えました`);
                    }
                }
            });
        }
    },
    UPGRADE: {
        id: 'upgrade',
        name: '改良',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。手札のカードを1枚廃棄し、それよりコストがちょうど1多いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            promptTrashFromHand(game, player, {
                title: '改良',
                message: '廃棄するカードを1枚選んでください。',
                purpose: 'upgrade-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const cost = game.getCost(trashed) + 1;
                    game.promptGain({
                        player,
                        exactCost: cost,
                        ...game.costExtras(trashed),
                        title: '改良',
                        message: `コストがちょうど${cost}のカードを1枚獲得してください。`
                    });
                }
            });
        }
    },

    // ===== コスト6 =====
    FARM: {
        id: 'farm',
        name: '農場',
        cost: 6,
        types: [CARD_TYPES.TREASURE, CARD_TYPES.VICTORY],
        value: 2,
        points: 2,
        description: '財宝 +2。勝利点 2'
    },
    NOBLES: {
        id: 'nobles',
        name: '貴族',
        cost: 6,
        types: [CARD_TYPES.ACTION, CARD_TYPES.VICTORY],
        points: 2,
        description: 'カードを3枚引くか、アクション +2 のどちらかを選ぶ。勝利点 2',
        onPlay: (player, game) => {
            game.promptChoose({
                player,
                options: ['カードを3枚引く', 'アクション +2'],
                title: '貴族',
                message: 'どちらかを選んでください。',
                purpose: 'nobles',
                callback: ([choice]) => gainBenefits(player, game, choice === 0 ? { cards: 3 } : { actions: 2 })
            });
        }
    }
};
