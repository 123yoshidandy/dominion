/**
 * 拡張「暗黒時代」の王国カードデータと、騎士・廃墟・避難所・略奪品・狂人・傭兵
 * 騎士と廃墟は中身の混ざった山で、一番上のカードだけを獲得できる（pileCards）
 * 略奪品・狂人・傭兵はサプライ外の山に置き（nonSupplyPiles）、使うと山に戻すものがある
 * 避難所は、暗黒時代のゲームで屋敷の代わりに初期デッキに入る
 */

import Card from './card.js';
import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, isCurse, names, gainBenefits, promptFromHand, promptTrashFromHand,
    promptDiscardFromHand, discardDownTo, takeTopCards, putBackInAnyOrder, logReveal
} from './card-helpers.js';

const isType = (type) => (card) => card.types.includes(type);
const isKnight = isType(CARD_TYPES.KNIGHT);
const isRuins = isType(CARD_TYPES.RUINS);
const isShelter = isType(CARD_TYPES.SHELTER);
const isAttackData = (data) => Boolean(data.isAttack) || data.types.includes(CARD_TYPES.ATTACK);
// コストがコイン3〜6（ポーションなし）か（騎士・ならず者・墓暴き）
const costs3to6 = (game, card) => {
    const cost = game.getCost(card);
    return cost >= 3 && cost <= 6 && !game.hasExtraCost(card);
};

// 山から獲得してログに書く（獲得できなければ何もしない）
const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};
const gainSpoils = (game, player) => {
    const card = game.gainFromNonSupply(player, 'spoils');
    if (card) game.log(`${player.name}は略奪品を獲得しました`);
};
const gainRuins = (game, target) => {
    if (!gainAndLog(game, target, 'ruins')) game.log(`廃墟の山がないため、${target.name}は廃墟を獲得しませんでした`);
};

// 場のカードを廃棄する（廃棄できたら true）
const trashFromPlay = (game, player, card) => {
    const index = player.playArea.indexOf(card);
    if (index < 0) return false;
    player.playArea.splice(index, 1);
    game.trashCard(player, card);
    game.log(`${player.name}は${card.name}を廃棄しました`);
    return true;
};

// 騎士・ならず者の攻撃：山札の上から2枚を公開し、コスト3〜6のカードを1枚廃棄し、残りを捨て札にする
// 騎士の攻撃で騎士が廃棄されたら、攻撃した騎士も廃棄する
const revealAndTrash = (game, attacker, target, { knight = null } = {}) => {
    const revealed = takeTopCards(target, 2);
    if (revealed.length === 0) return;
    logReveal(game, target, revealed, '山札の上から2枚');
    const candidates = revealed.filter(card => costs3to6(game, card));
    const finish = (trashed) => {
        const rest = revealed.filter(card => card !== trashed);
        if (rest.length > 0) game.discardCards(target, rest);
        if (!trashed) return;
        game.trashCard(target, trashed);
        game.log(`${target.name}は${trashed.name}を廃棄しました`);
        if (knight && isKnight(trashed)) trashFromPlay(game, attacker, knight);
    };
    if (candidates.length <= 1) {
        finish(candidates[0] ?? null);
        return;
    }
    game.promptSelect({
        player: target,
        cards: candidates,
        min: 1,
        max: 1,
        title: knight ? knight.name : 'ならず者',
        message: '廃棄するカードを1枚選んでください。',
        confirmLabel: '廃棄する',
        purpose: 'knight-trash',
        callback: ([index]) => finish(candidates[index])
    });
};

// 騎士のカード（固有の効果のあと、騎士の攻撃をする）
const knight = (key, id, name, description, ability, extra = {}) => ({
    [key]: {
        id,
        name,
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.KNIGHT],
        description: `${description}。他のプレイヤーは山札の上から2枚を公開し、コスト3〜6のカードを1枚廃棄し、残りを捨て札にする。これで騎士が廃棄されたら、このカードを廃棄する`,
        isAttack: true,
        ...extra,
        onPlay: (player, game, card) => {
            ability(player, game, card);
            game.runNext(() => game.attackOtherPlayers(player, (target) => revealAndTrash(game, player, target, { knight: card })));
        }
    }
});

export const KNIGHT_CARDS = {
    ...knight('DAME_ANNA', 'dame_anna', '女騎士アンナ', '手札を2枚まで廃棄してもよい', (player, game) => promptTrashFromHand(game, player, {
        min: 0, max: 2, title: '女騎士アンナ', message: '廃棄するカードを2枚まで選んでください。', purpose: 'optional-trash'
    })),
    ...knight('DAME_JOSEPHINE', 'dame_josephine', '女騎士ジョセフィーヌ', '勝利点 2', () => {}, {
        types: [CARD_TYPES.ACTION, CARD_TYPES.KNIGHT, CARD_TYPES.VICTORY],
        points: 2
    }),
    ...knight('DAME_MOLLY', 'dame_molly', '女騎士モリー', 'アクション +2', (player, game) => gainBenefits(player, game, { actions: 2 })),
    ...knight('DAME_NATALIE', 'dame_natalie', '女騎士ナタリー', 'コスト3以下のカードを1枚獲得してもよい', (player, game) => game.promptGain({
        player, maxCost: 3, optional: true, title: '女騎士ナタリー', message: 'コスト3以下のカードを1枚獲得できます（選ばなくてもかまいません）。'
    })),
    ...knight('DAME_SYLVIA', 'dame_sylvia', '女騎士シルビア', '財宝 +2', (player, game) => gainBenefits(player, game, { coins: 2 })),
    ...knight('SIR_BAILEY', 'sir_bailey', 'ベイリー卿', 'カードを1枚引く。アクション +1', (player, game) => gainBenefits(player, game, { cards: 1, actions: 1 })),
    ...knight('SIR_DESTRY', 'sir_destry', 'デストリー卿', 'カードを2枚引く', (player, game) => gainBenefits(player, game, { cards: 2 })),
    ...knight('SIR_MARTIN', 'sir_martin', 'マーティン卿', '購入 +2', (player, game) => gainBenefits(player, game, { buys: 2 }), { cost: 4 }),
    ...knight('SIR_MICHAEL', 'sir_michael', 'マイケル卿', '他のプレイヤーは手札が3枚になるまで捨てる', (player, game) => {
        game.attackOtherPlayers(player, (target) => discardDownTo(game, target, 3, 'マイケル卿'));
    }),
    ...knight('SIR_VANDER', 'sir_vander', 'ヴァンデル卿', 'これを廃棄したとき、金貨を1枚獲得する', () => {}, {
        onTrash: (player, game) => gainAndLog(game, player, 'gold')
    })
};

// 廃墟（略奪者などで獲得させられる。中身の混ざった山）
export const RUINS_CARDS = {
    ABANDONED_MINE: {
        id: 'abandoned_mine', name: '廃坑', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.RUINS],
        description: '財宝 +1',
        onPlay: (player, game) => gainBenefits(player, game, { coins: 1 })
    },
    RUINED_LIBRARY: {
        id: 'ruined_library', name: '図書館跡地', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.RUINS],
        description: 'カードを1枚引く',
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1 })
    },
    RUINED_MARKET: {
        id: 'ruined_market', name: '市場跡地', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.RUINS],
        description: '購入 +1',
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1 })
    },
    RUINED_VILLAGE: {
        id: 'ruined_village', name: '廃村', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.RUINS],
        description: 'アクション +1',
        onPlay: (player, game) => gainBenefits(player, game, { actions: 1 })
    },
    SURVIVORS: {
        id: 'survivors', name: '生存者', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.RUINS],
        description: '山札の上から2枚を見て、両方を捨て札にするか、好きな順で山札の上に戻す',
        onPlay: (player, game) => {
            const cards = takeTopCards(player, 2);
            if (cards.length === 0) return;
            game.promptConfirm({
                player,
                card: cards[0],
                title: '生存者',
                message: `山札の上の${names(cards)}を捨て札にしますか？`,
                yesLabel: '捨て札にする',
                noLabel: '山札に戻す',
                purpose: 'survivors',
                callback: (discard) => {
                    if (discard) {
                        game.discardCards(player, cards);
                        game.log(`${player.name}は${names(cards)}を捨て札にしました`);
                    } else {
                        putBackInAnyOrder(game, player, cards, '生存者');
                    }
                }
            });
        }
    }
};

// 避難所（暗黒時代のゲームで屋敷の代わりに初期デッキに入る）
export const SHELTER_CARDS = {
    HOVEL: {
        id: 'hovel', name: '納屋', cost: 1, types: [CARD_TYPES.REACTION, CARD_TYPES.SHELTER],
        description: '勝利点カードを獲得したとき、手札のこれを廃棄してもよい',
        onOwnGain: (player, game, hovel, gained) => {
            if (!isVictory(gained)) return;
            game.promptConfirm({
                player,
                card: hovel,
                title: '納屋',
                message: `${gained.name}を獲得しました。手札の納屋を廃棄しますか？`,
                yesLabel: '廃棄する',
                noLabel: '廃棄しない',
                purpose: 'hovel',
                callback: (yes) => {
                    if (!yes || !player.hand.includes(hovel)) return;
                    game.trashFromHand(player, [player.hand.indexOf(hovel)]);
                    game.log(`${player.name}は納屋を廃棄しました`);
                }
            });
        }
    },
    NECROPOLIS: {
        id: 'necropolis', name: '共同墓地', cost: 1, types: [CARD_TYPES.ACTION, CARD_TYPES.SHELTER],
        description: 'アクション +2',
        onPlay: (player, game) => gainBenefits(player, game, { actions: 2 })
    },
    OVERGROWN_ESTATE: {
        id: 'overgrown_estate', name: '草茂る屋敷', cost: 1, types: [CARD_TYPES.VICTORY, CARD_TYPES.SHELTER],
        points: 0,
        description: '勝利点 0。これを廃棄したとき、カードを1枚引く',
        onTrash: (player, game) => gainBenefits(player, game, { cards: 1 }, '草茂る屋敷')
    }
};

// サプライ外のカード（略奪品・狂人・傭兵）
export const DARK_AGES_NON_SUPPLY_CARDS = {
    SPOILS: {
        id: 'spoils', name: '略奪品', cost: 0, types: [CARD_TYPES.TREASURE],
        value: 3,
        description: '財宝 +3。プレイしたとき、これを略奪品の山に戻す（サプライにない）',
        count: 15,
        onPlay: (player, game, spoils) => {
            if (game.returnToSupply(player, spoils)) game.log(`${player.name}は略奪品を山に戻しました`);
        }
    },
    MADMAN: {
        id: 'madman', name: '狂人', cost: 0, types: [CARD_TYPES.ACTION],
        description: 'アクション +2。これを狂人の山に戻してもよい。戻したら、手札1枚につきカードを1枚引く（サプライにない）',
        count: 10,
        onPlay: (player, game, madman) => {
            gainBenefits(player, game, { actions: 2 });
            if (!player.playArea.includes(madman)) return;
            game.returnToSupply(player, madman);
            game.log(`${player.name}は狂人を山に戻しました`);
            if (player.hand.length > 0) gainBenefits(player, game, { cards: player.hand.length }, '狂人');
        }
    },
    MERCENARY: {
        id: 'mercenary', name: '傭兵', cost: 0, types: [CARD_TYPES.ACTION],
        description: '手札を2枚廃棄してもよい。そうしたら、カードを2枚引き、財宝 +2、他のプレイヤーは手札が3枚になるまで捨てる（サプライにない）',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, {
                min: 0,
                max: 2,
                title: '傭兵',
                message: '廃棄するカードを2枚選んでください（2枚廃棄すると効果があります。選ばなくてもかまいません）。',
                purpose: 'mercenary-trash',
                callback: (trashed) => {
                    if (trashed.length < 2) return;
                    gainBenefits(player, game, { cards: 2, coins: 2 });
                    game.attackOtherPlayers(player, (target) => discardDownTo(game, target, 3, '傭兵'));
                }
            });
        }
    }
};

export const DARK_AGES_CARDS = {
    // ===== コスト1 =====
    POOR_HOUSE: {
        id: 'poor_house', name: '救貧院', cost: 1, types: [CARD_TYPES.ACTION],
        description: '財宝 +4。手札を公開し、手札の財宝1枚につき財宝 -1（0未満にはならない）',
        count: 10,
        onPlay: (player, game) => {
            logReveal(game, player, player.hand);
            const treasures = player.hand.filter(isTreasure).length;
            const before = player.coins;
            player.coins = Math.max(0, player.coins + 4 - treasures);
            game.log(`${player.name}は救貧院で財宝+${player.coins - before}を得ました`);
        }
    },

    // ===== コスト2 =====
    BEGGAR: {
        id: 'beggar', name: '物乞い', cost: 2, types: [CARD_TYPES.ACTION],
        description: '銅貨を3枚獲得し、手札に加える。他のプレイヤーがアタックカードをプレイしたとき、手札のこれを捨て札にしてもよい。そうしたら、銀貨を2枚獲得し、1枚を山札の上に置く',
        reactionType: 'attack',
        count: 10,
        onPlay: (player, game) => {
            const gained = [0, 1, 2].filter(() => game.gainCardFromSupply(player, 'copper', 'hand')).length;
            game.log(`${player.name}は銅貨を${gained}枚獲得し、手札に加えました`);
        },
        onAttackReaction: (target, game, beggar) => {
            game.promptConfirm({
                player: target,
                card: beggar,
                title: '物乞い',
                message: '物乞いを捨て札にして、銀貨を2枚獲得しますか（1枚は山札の上に置きます）？',
                yesLabel: '捨て札にする',
                noLabel: '使わない',
                purpose: 'beggar-react',
                callback: (yes) => {
                    if (!yes || !target.hand.includes(beggar)) return;
                    game.discardFromHand(target, [target.hand.indexOf(beggar)]);
                    game.log(`${target.name}は物乞いを捨て札にしました`);
                    gainAndLog(game, target, 'silver', 'deck');
                    gainAndLog(game, target, 'silver');
                }
            });
        }
    },
    SQUIRE: {
        id: 'squire', name: '従者', cost: 2, types: [CARD_TYPES.ACTION],
        description: '財宝 +1。次のうち1つを選ぶ：アクション +2、購入 +2、銀貨を1枚獲得する。これを廃棄したとき、アタックカードを1枚獲得する',
        count: 10,
        onPlay: (player, game, squire) => {
            gainBenefits(player, game, { coins: 1 });
            game.promptChoose({
                player,
                card: squire,
                options: ['アクション +2', '購入 +2', '銀貨を1枚獲得する'],
                title: '従者',
                message: '1つ選んでください。',
                purpose: 'squire',
                callback: ([index]) => {
                    if (index === 0) gainBenefits(player, game, { actions: 2 });
                    if (index === 1) gainBenefits(player, game, { buys: 2 });
                    if (index === 2) gainAndLog(game, player, 'silver');
                }
            });
        },
        onTrash: (player, game) => game.promptGain({
            player, filter: isAttackData, title: '従者', message: 'アタックカードを1枚獲得してください。'
        })
    },
    VAGRANT: {
        id: 'vagrant', name: '浮浪者', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、呪い・廃墟・避難所・勝利点のカードなら手札に加える',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            if (isCurse(card) || isRuins(card) || isShelter(card) || isVictory(card)) {
                player.hand.push(card);
                game.log(`${player.name}は${card.name}を手札に加えました`);
            } else {
                player.deck.unshift(card);
            }
        }
    },

    // ===== コスト3 =====
    FORAGER: {
        id: 'forager', name: '採集者', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。購入 +1。手札のカードを1枚廃棄する。廃棄置き場の財宝の種類1つにつき財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, buys: 1 });
            promptTrashFromHand(game, player, {
                title: '採集者', message: '廃棄するカードを1枚選んでください。', purpose: 'forager-trash',
                callback: () => {
                    const kinds = new Set(game.trash.filter(isTreasure).map(card => card.id)).size;
                    if (kinds > 0) gainBenefits(player, game, { coins: kinds }, '採集者');
                }
            });
        }
    },
    HERMIT: {
        id: 'hermit', name: '隠遁者', cost: 3, types: [CARD_TYPES.ACTION],
        description: '捨て札か手札の財宝以外のカードを1枚廃棄してもよい。コスト3以下のカードを1枚獲得する。購入フェーズの終わりに、そのフェーズにカードを獲得していなければ、これを廃棄して狂人を獲得する',
        count: 10,
        nonSupplyPiles: { madman: 10 },
        onPlay: (player, game) => {
            const candidates = [...player.discard, ...player.hand].filter(card => !isTreasure(card));
            if (candidates.length > 0) {
                game.promptSelect({
                    player,
                    cards: candidates,
                    min: 0,
                    max: 1,
                    title: '隠遁者',
                    message: '捨て札か手札から、廃棄する財宝以外のカードを選んでください（選ばなくてもかまいません）。',
                    confirmLabel: '廃棄する',
                    purpose: 'hermit-trash',
                    callback: ([index]) => {
                        const card = candidates[index];
                        if (!card || !player.removeCard(card)) return;
                        game.trashCard(player, card);
                        game.log(`${player.name}は${card.name}を廃棄しました`);
                    }
                });
            }
            game.runNext(() => game.promptGain({ player, maxCost: 3, title: '隠遁者', message: 'コスト3以下のカードを1枚獲得してください。' }));
        },
        onEndOfBuyPhase: (player, game, hermit) => {
            if (game.turnState.buyPhaseGains > 0) return;
            if (!trashFromPlay(game, player, hermit)) return;
            if (game.gainFromNonSupply(player, 'madman')) game.log(`${player.name}は狂人を獲得しました`);
        }
    },
    MARKET_SQUARE: {
        id: 'market_square', name: '市場広場', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。自分のカードが廃棄されたとき、手札のこれを捨て札にしてもよい。そうしたら金貨を1枚獲得する',
        reactionType: 'trash',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, buys: 1 }),
        onOwnCardTrashed: (player, game, square, trashed) => {
            game.promptConfirm({
                player,
                card: square,
                title: '市場広場',
                message: `${trashed.name}が廃棄されました。市場広場を捨て札にして、金貨を獲得しますか？`,
                yesLabel: '捨て札にする',
                noLabel: '使わない',
                purpose: 'market-square',
                callback: (yes) => {
                    if (!yes || !player.hand.includes(square)) return;
                    game.discardFromHand(player, [player.hand.indexOf(square)]);
                    gainAndLog(game, player, 'gold');
                }
            });
        }
    },
    SAGE: {
        id: 'sage', name: '賢者', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。コスト3以上のカードが出るまで山札を公開し、そのカードを手札に加え、残りを捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const others = [];
            for (;;) {
                const [card] = takeTopCards(player, 1);
                if (!card) break;
                if (game.getCost(card) >= 3) {
                    player.hand.push(card);
                    game.log(`${player.name}は${card.name}を手札に加えました`);
                    break;
                }
                others.push(card);
            }
            if (others.length > 0) {
                game.log(`${player.name}は${names(others)}を捨て札にしました`);
                game.discardCards(player, others);
            }
        }
    },
    STOREROOM: {
        id: 'storeroom', name: '物置', cost: 3, types: [CARD_TYPES.ACTION],
        description: '購入 +1。手札を好きな枚数捨て、その枚数カードを引く。その後、手札を好きな枚数捨て、1枚につき財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            const discard = (purpose, message, after) => {
                if (player.hand.length === 0) return;
                game.promptSelect({
                    player, cards: player.hand, min: 0, max: player.hand.length,
                    title: '物置', message, confirmLabel: '捨てる', purpose,
                    callback: (indices) => {
                        const discarded = game.discardFromHand(player, indices);
                        if (discarded.length > 0) game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
                        after(discarded.length);
                    }
                });
            };
            discard('storeroom-draw', '捨てるカードを選んでください。同じ枚数カードを引きます。', (count) => {
                if (count > 0) gainBenefits(player, game, { cards: count }, '物置');
                game.runNext(() => discard('storeroom-coins', '捨てるカードを選んでください。1枚につき財宝+1を得ます。', (coins) => {
                    if (coins > 0) gainBenefits(player, game, { coins }, '物置');
                }));
            });
        }
    },
    URCHIN: {
        id: 'urchin', name: '浮浪児', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。他のプレイヤーは手札が4枚になるまで捨てる。これが場にあるときに他のアタックカードをプレイしたら、先にこれを廃棄して傭兵を獲得してもよい',
        isAttack: true,
        count: 10,
        nonSupplyPiles: { mercenary: 10 },
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.attackOtherPlayers(player, (target) => discardDownTo(game, target, 4, '浮浪児'));
        },
        onOtherAttackPlayed: (player, game, urchin, attack) => {
            if ((game.nonSupply.mercenary ?? 0) <= 0) return;
            game.promptConfirm({
                player,
                card: urchin,
                title: '浮浪児',
                message: `${attack.name}をプレイします。先に浮浪児を廃棄して、傭兵を獲得しますか？`,
                yesLabel: '廃棄して傭兵を獲得する',
                noLabel: 'そのままにする',
                purpose: 'urchin',
                callback: (yes) => {
                    if (!yes || !trashFromPlay(game, player, urchin)) return;
                    if (game.gainFromNonSupply(player, 'mercenary')) game.log(`${player.name}は傭兵を獲得しました`);
                }
            });
        }
    },

    // ===== コスト4 =====
    ARMORY: {
        id: 'armory', name: '武器庫', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得し、山札の上に置く',
        count: 10,
        onPlay: (player, game) => game.promptGain({
            player, maxCost: 4, destination: 'deck', title: '武器庫', message: 'コスト4以下のカードを1枚獲得してください（山札の上に置きます）。'
        })
    },
    DEATH_CART: {
        id: 'death_cart', name: '死の荷車', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.LOOTER],
        description: 'これか手札のアクションカードを1枚廃棄してもよい。そうしたら財宝 +5。これを獲得したとき、廃墟を2枚獲得する',
        count: 10,
        onPlay: (player, game, cart) => {
            const candidates = [...(player.playArea.includes(cart) ? [cart] : []), ...player.hand.filter(isAction)];
            if (candidates.length === 0) return;
            game.promptSelect({
                player,
                cards: candidates,
                min: 0,
                max: 1,
                title: '死の荷車',
                message: '廃棄するカード（場の死の荷車か手札のアクションカード）を選んでください。廃棄すると財宝+5を得ます。',
                confirmLabel: '廃棄する',
                purpose: 'death-cart',
                callback: ([index]) => {
                    const card = candidates[index];
                    if (!card || !player.removeCard(card)) return;
                    game.trashCard(player, card);
                    game.log(`${player.name}は${card.name}を廃棄しました`);
                    gainBenefits(player, game, { coins: 5 });
                }
            });
        },
        onGain: (player, game) => {
            gainRuins(game, player);
            gainRuins(game, player);
        }
    },
    FEODUM: {
        id: 'feodum', name: '封土', cost: 4, types: [CARD_TYPES.VICTORY],
        description: '持っている銀貨3枚につき勝利点 1（端数切り捨て）。これを廃棄したとき、銀貨を3枚獲得する',
        pointsFor: (allCards) => Math.floor(allCards.filter(card => card.id === 'silver').length / 3),
        onTrash: (player, game) => {
            const gained = [0, 1, 2].filter(() => game.gainCardFromSupply(player, 'silver')).length;
            game.log(`${player.name}は銀貨を${gained}枚獲得しました`);
        }
    },
    FORTRESS: {
        id: 'fortress', name: '城砦', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。これを廃棄したとき、手札に加える',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onTrash: (player, game, fortress) => {
            if (!game.takeFromTrash(fortress)) return;
            player.hand.push(fortress);
            game.log(`${player.name}は城砦を手札に戻しました`);
        }
    },
    IRONMONGER: {
        id: 'ironmonger', name: '金物商', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、捨て札にしてもよい。それがアクションならアクション +1、財宝なら財宝 +1、勝利点ならカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            game.promptConfirm({
                player,
                card,
                title: '金物商',
                message: `${card.name}を捨て札にしますか？`,
                yesLabel: '捨て札にする',
                noLabel: '山札に戻す',
                purpose: 'ironmonger',
                callback: (discard) => {
                    if (discard) {
                        game.discardCards(player, [card]);
                    } else {
                        player.deck.unshift(card);
                    }
                    gainBenefits(player, game, {
                        actions: isAction(card) ? 1 : 0,
                        coins: isTreasure(card) ? 1 : 0,
                        cards: isVictory(card) ? 1 : 0
                    }, '金物商');
                }
            });
        }
    },
    MARAUDER: {
        id: 'marauder', name: '略奪者', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.LOOTER],
        description: '略奪品を1枚獲得する。他のプレイヤーは廃墟を1枚獲得する',
        isAttack: true,
        count: 10,
        nonSupplyPiles: { spoils: 15 },
        onPlay: (player, game) => {
            gainSpoils(game, player);
            game.attackOtherPlayers(player, (target) => gainRuins(game, target));
        }
    },
    PROCESSION: {
        id: 'procession', name: '行進', cost: 4, types: [CARD_TYPES.ACTION],
        description: '手札の持続以外のアクションカードを1枚、2回プレイしてもよい。そのカードを廃棄し、それよりコストがちょうど1多いアクションカードを1枚獲得する',
        count: 10,
        onPlay: (player, game, procession) => {
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => isAction(card) && !card.types.includes(CARD_TYPES.DURATION),
                title: '行進',
                message: '2回プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'procession',
                callback: ([card]) => {
                    if (!card) return;
                    // 廃棄したときの効果（従者など）を、獲得より先に起こすため、廃棄と獲得を別の手順にする
                    let trashed = false;
                    game.runNext(
                        () => { trashed = trashFromPlay(game, player, card); },
                        () => {
                            if (!trashed) return;
                            const cost = game.getCost(card) + 1;
                            game.promptGain({
                                player, exactCost: cost, ...game.costExtras(card), filter: isAction,
                                title: '行進', message: `コストがちょうど${cost}のアクションカードを1枚獲得してください。`
                            });
                        }
                    );
                    game.playMultipleTimes(player, card, 2, procession, { asTreasure: false });
                }
            });
        }
    },
    RATS: {
        id: 'rats', name: 'ネズミ', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。ネズミを1枚獲得する。手札のネズミ以外のカードを1枚廃棄する（手札がすべてネズミなら公開する）。これを廃棄したとき、カードを1枚引く',
        count: 20,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            gainAndLog(game, player, 'rats');
            if (player.hand.length > 0 && player.hand.every(card => card.id === 'rats')) {
                logReveal(game, player, player.hand);
                return;
            }
            promptTrashFromHand(game, player, {
                filter: (card) => card.id !== 'rats', title: 'ネズミ', message: '廃棄するネズミ以外のカードを1枚選んでください。', purpose: 'rats-trash'
            });
        },
        onTrash: (player, game) => gainBenefits(player, game, { cards: 1 }, 'ネズミ')
    },
    SCAVENGER: {
        id: 'scavenger', name: '屑拾い', cost: 4, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。山札をすべて捨て札にしてもよい。捨て札からカードを1枚選び、山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            const pickFromDiscard = () => {
                if (player.discard.length === 0) return;
                game.promptSelect({
                    player, cards: [...player.discard], min: 1, max: 1,
                    title: '屑拾い', message: '山札の上に置くカードを捨て札から1枚選んでください。', confirmLabel: '山札の上に置く', purpose: 'scavenger-topdeck',
                    callback: ([index]) => {
                        const card = player.discard[index];
                        player.discard.splice(index, 1);
                        player.deck.unshift(card);
                        game.log(`${player.name}は${card.name}を山札の上に置きました`);
                    }
                });
            };
            if (player.deck.length === 0) {
                pickFromDiscard();
                return;
            }
            game.promptConfirm({
                player,
                title: '屑拾い',
                message: `山札（${player.deck.length}枚）をすべて捨て札にしますか？`,
                yesLabel: '捨て札にする',
                noLabel: 'そのままにする',
                purpose: 'scavenger-deck',
                callback: (yes) => {
                    if (yes) {
                        player.discard.push(...player.deck.splice(0));
                        game.log(`${player.name}は山札をすべて捨て札にしました`);
                    }
                    pickFromDiscard();
                }
            });
        }
    },
    WANDERING_MINSTREL: {
        id: 'wandering_minstrel', name: '吟遊詩人', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。山札の上から3枚を公開し、アクションカードを好きな順で山札の上に戻し、残りを捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            const revealed = takeTopCards(player, 3);
            if (revealed.length === 0) return;
            logReveal(game, player, revealed, '山札の上から3枚');
            const others = revealed.filter(card => !isAction(card));
            if (others.length > 0) game.discardCards(player, others);
            putBackInAnyOrder(game, player, revealed.filter(isAction), '吟遊詩人');
        }
    },

    // ===== コスト5 =====
    BAND_OF_MISFITS: {
        id: 'band_of_misfits', name: 'はみだし者', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.COMMAND],
        description: 'これより安い命令以外のアクションカードを、サプライに置いたままプレイする',
        count: 10,
        onPlay: (player, game, band) => {
            const candidates = game.getGainableCards({
                lessThan: band,
                filter: (data) => data.types.includes(CARD_TYPES.ACTION) && !data.types.includes(CARD_TYPES.COMMAND)
            });
            if (candidates.length === 0) return;
            game.promptSelect({
                player,
                cards: candidates.map(data => new Card(data)),
                min: 1,
                max: 1,
                title: 'はみだし者',
                message: 'サプライに置いたままプレイするカードを選んでください。',
                confirmLabel: 'プレイする',
                purpose: 'band-of-misfits',
                callback: ([index]) => {
                    const card = new Card(candidates[index]);
                    game.log(`${player.name}ははみだし者で${card.name}をプレイしました`);
                    card.play(player, game);
                }
            });
        }
    },
    BANDIT_CAMP: {
        id: 'bandit_camp', name: '山賊の宿営地', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。略奪品を1枚獲得する',
        count: 10,
        nonSupplyPiles: { spoils: 15 },
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            gainSpoils(game, player);
        }
    },
    CATACOMBS: {
        id: 'catacombs', name: '地下墓所', cost: 5, types: [CARD_TYPES.ACTION],
        description: '山札の上から3枚を見て、それを手札に加えるか、捨て札にしてカードを3枚引く。これを廃棄したとき、これより安いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            const cards = takeTopCards(player, 3);
            if (cards.length === 0) return;
            game.promptConfirm({
                player,
                card: cards[0],
                title: '地下墓所',
                message: `山札の上の${names(cards)}を手札に加えますか？（加えないなら、捨て札にしてカードを3枚引きます）`,
                yesLabel: '手札に加える',
                noLabel: '捨てて3枚引く',
                purpose: 'catacombs',
                callback: (take) => {
                    if (take) {
                        player.hand.push(...cards);
                        game.log(`${player.name}は${names(cards)}を手札に加えました`);
                    } else {
                        game.discardCards(player, cards);
                        game.log(`${player.name}は${names(cards)}を捨て札にしました`);
                        gainBenefits(player, game, { cards: 3 });
                    }
                }
            });
        },
        onTrash: (player, game, catacombs) => game.promptGain({
            player, lessThan: catacombs, title: '地下墓所', message: '地下墓所より安いカードを1枚獲得してください。'
        })
    },
    COUNT: {
        id: 'count', name: '伯爵', cost: 5, types: [CARD_TYPES.ACTION],
        description: '次のうち1つを選ぶ：手札を2枚捨てる、手札を1枚山札の上に置く、銅貨を1枚獲得する。次のうち1つを選ぶ：財宝 +3、手札をすべて廃棄する、公領を1枚獲得する',
        count: 10,
        onPlay: (player, game, count) => {
            game.promptChoose({
                player,
                card: count,
                options: ['手札を2枚捨てる', '手札を1枚山札の上に置く', '銅貨を1枚獲得する'],
                title: '伯爵',
                message: '1つ目の効果を選んでください。',
                purpose: 'count-first',
                callback: ([index]) => {
                    if (index === 0) promptDiscardFromHand(game, player, 2, '伯爵');
                    if (index === 1) {
                        promptFromHand(game, player, {
                            title: '伯爵', message: '山札の上に置くカードを1枚選んでください。', confirmLabel: '山札の上に置く', purpose: 'topdeck-from-hand',
                            callback: ([card]) => {
                                player.hand.splice(player.hand.indexOf(card), 1);
                                player.deck.unshift(card);
                                game.log(`${player.name}は手札を1枚山札の上に置きました`);
                            }
                        });
                    }
                    if (index === 2) gainAndLog(game, player, 'copper');
                    game.runNext(() => game.promptChoose({
                        player,
                        card: count,
                        options: ['財宝 +3', '手札をすべて廃棄する', '公領を1枚獲得する'],
                        title: '伯爵',
                        message: '2つ目の効果を選んでください。',
                        purpose: 'count-second',
                        callback: ([second]) => {
                            if (second === 0) gainBenefits(player, game, { coins: 3 });
                            if (second === 1) {
                                const trashed = game.trashFromHand(player, player.hand.map((card, i) => i));
                                game.log(`${player.name}は手札（${trashed.length > 0 ? names(trashed) : 'なし'}）をすべて廃棄しました`);
                            }
                            if (second === 2) gainAndLog(game, player, 'duchy');
                        }
                    }));
                }
            });
        }
    },
    COUNTERFEIT: {
        id: 'counterfeit', name: '偽造通貨', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1。購入 +1。プレイしたとき、手札の財宝を1枚、2回プレイしてもよい。そうしたら、その財宝を廃棄する',
        count: 10,
        onPlay: (player, game, counterfeit) => {
            player.buys += 1;
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => game.isTreasure(card),
                title: '偽造通貨',
                message: '2回プレイして廃棄する財宝を選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'counterfeit',
                callback: ([card]) => {
                    if (!card) return;
                    game.runNext(() => trashFromPlay(game, player, card));
                    game.playMultipleTimes(player, card, 2, counterfeit, { asTreasure: true });
                }
            });
        }
    },
    CULTIST: {
        id: 'cultist', name: '狂信者', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.LOOTER],
        description: 'カードを2枚引く。他のプレイヤーは廃墟を1枚獲得する。手札の狂信者を1枚プレイしてもよい。これを廃棄したとき、カードを3枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            game.attackOtherPlayers(player, (target) => gainRuins(game, target));
            game.runNext(() => {
                const next = player.hand.find(card => card.id === 'cultist');
                if (!next) return;
                game.promptConfirm({
                    player,
                    card: next,
                    title: '狂信者',
                    message: '手札の狂信者をプレイしますか？',
                    yesLabel: 'プレイする',
                    noLabel: 'プレイしない',
                    purpose: 'cultist-play',
                    callback: (yes) => {
                        if (yes && player.hand.includes(next)) game.playCardFrom(player, next);
                    }
                });
            });
        },
        onTrash: (player, game) => gainBenefits(player, game, { cards: 3 }, '狂信者')
    },
    GRAVEROBBER: {
        id: 'graverobber', name: '墓暴き', cost: 5, types: [CARD_TYPES.ACTION],
        description: '次のうち1つを選ぶ：廃棄置き場のコスト3〜6のカードを1枚獲得し、山札の上に置く。または、手札のアクションカードを1枚廃棄し、それよりコストが3多いカードまでを1枚獲得する',
        count: 10,
        onPlay: (player, game, graverobber) => {
            const fromTrash = game.trash.filter(card => costs3to6(game, card));
            const actions = player.hand.filter(isAction);
            const options = ['廃棄置き場からカードを獲得する', '手札のアクションカードを廃棄して改築する'];
            game.promptChoose({
                player,
                card: graverobber,
                options,
                title: '墓暴き',
                message: `1つ選んでください（廃棄置き場の候補${fromTrash.length}枚、手札のアクション${actions.length}枚）。`,
                purpose: 'graverobber',
                callback: ([index]) => {
                    if (index === 0) {
                        if (fromTrash.length === 0) return;
                        game.promptSelect({
                            player, cards: fromTrash, min: 1, max: 1,
                            title: '墓暴き', message: '獲得するカードを選んでください（山札の上に置きます）。', confirmLabel: '獲得する', purpose: 'gain-from-trash',
                            callback: ([i]) => {
                                const card = fromTrash[i];
                                if (!game.takeFromTrash(card)) return;
                                game.log(`${player.name}は廃棄置き場の${card.name}を獲得しました`);
                                game.gainCardInstance(player, card, 'deck');
                            }
                        });
                        return;
                    }
                    promptTrashFromHand(game, player, {
                        filter: isAction, title: '墓暴き', message: '廃棄するアクションカードを1枚選んでください。', purpose: 'remodel-trash',
                        callback: ([trashed]) => {
                            if (!trashed) return;
                            const maxCost = game.getCost(trashed) + 3;
                            game.promptGain({ player, maxCost, ...game.costExtras(trashed), title: '墓暴き', message: `コスト${maxCost}以下のカードを1枚獲得してください。` });
                        }
                    });
                }
            });
        }
    },
    JUNK_DEALER: {
        id: 'junk_dealer', name: 'がらくた屋', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。手札のカードを1枚廃棄する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 });
            promptTrashFromHand(game, player, { title: 'がらくた屋', message: '廃棄するカードを1枚選んでください。', purpose: 'junk-dealer-trash' });
        }
    },
    KNIGHTS: {
        id: 'knights', name: '騎士', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.KNIGHT],
        description: '騎士10種を混ぜた山。一番上のカードだけを購入・獲得できる。どの騎士も、固有の効果のあと、他のプレイヤーに山札の上から2枚を公開させ、コスト3〜6のカードを1枚廃棄させる',
        isAttack: true,
        count: 10,
        pileCards: Object.values(KNIGHT_CARDS).map(data => data.id)
    },
    MYSTIC: {
        id: 'mystic', name: '秘術師', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。財宝 +2。カードを1種指定し、山札の一番上を公開する。指定したカードなら手札に加える',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, coins: 2 });
            game.promptNameCard({
                player, title: '秘術師', message: '山札の一番上にありそうなカードを指定してください。', purpose: 'name-card',
                callback: (data) => {
                    const [card] = takeTopCards(player, 1);
                    if (!card) return;
                    game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
                    if (card.id === data.id) {
                        player.hand.push(card);
                        game.log(`${player.name}は${card.name}を手札に加えました`);
                    } else {
                        player.deck.unshift(card);
                    }
                }
            });
        }
    },
    PILLAGE: {
        id: 'pillage', name: '略奪', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'これを廃棄する。そうしたら、略奪品を2枚獲得し、手札が5枚以上の他のプレイヤーは手札を公開し、あなたの選んだカードを1枚捨てる',
        isAttack: true,
        count: 10,
        nonSupplyPiles: { spoils: 15 },
        onPlay: (player, game, pillage) => {
            if (!trashFromPlay(game, player, pillage)) return;
            gainSpoils(game, player);
            gainSpoils(game, player);
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length < 5) return;
                logReveal(game, target, target.hand);
                game.promptSelect({
                    player,
                    cards: [...target.hand],
                    min: 1,
                    max: 1,
                    title: '略奪',
                    message: `${target.name}に捨てさせるカードを1枚選んでください。`,
                    confirmLabel: '捨てさせる',
                    purpose: 'advisor',
                    callback: ([index]) => {
                        const [card] = game.discardFromHand(target, [index]);
                        if (card) game.log(`${target.name}は${card.name}を捨てました`);
                    }
                });
            });
        }
    },
    REBUILD: {
        id: 'rebuild', name: '建て直し', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。カードを1種指定する。指定したカード以外の勝利点カードが出るまで山札を公開し、他を捨て札にする。その勝利点カードを廃棄し、それよりコストが3多いカードまでの勝利点カードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            game.promptNameCard({
                player, title: '建て直し', message: '廃棄しない勝利点カードを指定してください。', purpose: 'rebuild-name',
                callback: (named) => {
                    const others = [];
                    let found = null;
                    for (;;) {
                        const [card] = takeTopCards(player, 1);
                        if (!card) break;
                        if (isVictory(card) && card.id !== named.id) {
                            found = card;
                            break;
                        }
                        others.push(card);
                    }
                    if (others.length > 0) {
                        game.log(`${player.name}は${names(others)}を公開して捨て札にしました`);
                        game.discardCards(player, others);
                    }
                    if (!found) return;
                    game.trashCard(player, found);
                    game.log(`${player.name}は${found.name}を廃棄しました`);
                    const maxCost = game.getCost(found) + 3;
                    game.promptGain({
                        player, maxCost, ...game.costExtras(found), filter: (data) => data.types.includes(CARD_TYPES.VICTORY),
                        title: '建て直し', message: `コスト${maxCost}以下の勝利点カードを1枚獲得してください。`
                    });
                }
            });
        }
    },
    ROGUE: {
        id: 'rogue', name: 'ならず者', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。廃棄置き場にコスト3〜6のカードがあれば、1枚獲得する。なければ、他のプレイヤーは山札の上から2枚を公開し、コスト3〜6のカードを1枚廃棄し、残りを捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            const fromTrash = game.trash.filter(card => costs3to6(game, card));
            if (fromTrash.length === 0) {
                game.attackOtherPlayers(player, (target) => revealAndTrash(game, player, target));
                return;
            }
            game.promptSelect({
                player, cards: fromTrash, min: 1, max: 1,
                title: 'ならず者', message: '廃棄置き場から獲得するカードを選んでください。', confirmLabel: '獲得する', purpose: 'gain-from-trash',
                callback: ([index]) => {
                    const card = fromTrash[index];
                    if (!game.takeFromTrash(card)) return;
                    game.log(`${player.name}は廃棄置き場の${card.name}を獲得しました`);
                    game.gainCardInstance(player, card);
                }
            });
        }
    },

    // ===== コスト6 =====
    ALTAR: {
        id: 'altar', name: '祭壇', cost: 6, types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。コスト5以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            promptTrashFromHand(game, player, { title: '祭壇', message: '廃棄するカードを1枚選んでください。', purpose: 'altar-trash' });
            game.runNext(() => game.promptGain({ player, maxCost: 5, title: '祭壇', message: 'コスト5以下のカードを1枚獲得してください。' }));
        }
    },
    HUNTING_GROUNDS: {
        id: 'hunting_grounds', name: '狩場', cost: 6, types: [CARD_TYPES.ACTION],
        description: 'カードを4枚引く。これを廃棄したとき、公領を1枚か屋敷を3枚獲得する',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 4 }),
        onTrash: (player, game, grounds) => game.promptChoose({
            player,
            card: grounds,
            options: ['公領を1枚獲得する', '屋敷を3枚獲得する'],
            title: '狩場',
            message: '獲得するカードを選んでください。',
            purpose: 'hunting-grounds',
            callback: ([index]) => {
                if (index === 0) {
                    gainAndLog(game, player, 'duchy');
                } else {
                    [0, 1, 2].forEach(() => gainAndLog(game, player, 'estate'));
                }
            }
        })
    }
};

// 中身の混ざった山（廃墟）の置き場所。山の名前の札として使う
export const RUINS_PILE = {
    RUINS: {
        id: 'ruins', name: '廃墟', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.RUINS],
        description: '廃墟5種（廃坑・図書館跡地・市場跡地・廃村・生存者）を混ぜた山。一番上のカードだけを獲得できる'
    }
};
