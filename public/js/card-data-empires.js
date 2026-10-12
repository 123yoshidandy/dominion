/**
 * 拡張「帝国」の王国カードデータ、2種で1山のカード・城、イベント、ランドマーク
 * - 負債：debtCost のあるカードやイベントを購入すると負債を負い、返すまで購入できない（game.takeDebt・payOffDebt）
 * - 2種で1山のカード（野営地／戦利品など）と城は、決まった順に重ねた中身の混ざった山（pileOrdered）
 * - 勝利点トークン：山に置くもの（game.pileVp）と、ランドマークに置くもの（game.landscapeVp）
 * - ランドマーク：購入しない札。setup・onGainAny・onBuyAny・onTrashAny・onStartBuyPhase・onEndTurn・afterTurn・score で効果がある
 */

import Card from './card.js';
import { CARD_TYPES, LANDSCAPE_KINDS } from './card-types.js';
import {
    isAction, isTreasure, isVictory, isCurse, names, gainBenefits, promptFromHand, promptTrashFromHand,
    promptDiscardFromHand, discardDownTo, takeTopCards, logReveal
} from './card-helpers.js';

const isCastle = (card) => card.types.includes(CARD_TYPES.CASTLE);

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
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

// サプライにない（はみだし者・大君主で）カードをプレイする
const playFromSupply = (game, player, { title, maxCost = null, lessThan = null, purpose }) => {
    const candidates = game.getGainableCards({
        ...(maxCost !== null ? { maxCost } : {}),
        ...(lessThan ? { lessThan } : {}),
        filter: (data) => data.types.includes(CARD_TYPES.ACTION) && !data.types.includes(CARD_TYPES.COMMAND)
    });
    if (candidates.length === 0) return;
    game.promptSelect({
        player,
        cards: candidates.map(data => new Card(data)),
        min: 1,
        max: 1,
        title,
        message: 'サプライに置いたままプレイするカードを選んでください。',
        confirmLabel: 'プレイする',
        purpose,
        callback: ([index]) => {
            const card = new Card(candidates[index]);
            game.log(`${player.name}は${title}で${card.name}をプレイしました`);
            card.play(player, game);
        }
    });
};

// 捨て札からカードを1枚選んで手札に加えてよい（開拓者・賑やかな村）
const takeFromDiscard = (game, player, cardId, title) => {
    const card = player.discard.find(c => c.id === cardId);
    if (!card) return;
    game.promptConfirm({
        player,
        card,
        title,
        message: `捨て札の${card.name}を公開して手札に加えますか？`,
        yesLabel: '手札に加える',
        noLabel: '加えない',
        purpose: 'take-from-discard',
        callback: (yes) => {
            if (!yes || !player.discard.includes(card)) return;
            player.discard.splice(player.discard.indexOf(card), 1);
            player.hand.push(card);
            game.log(`${player.name}は捨て札の${card.name}を手札に加えました`);
        }
    });
};

// 岩：獲得・廃棄したとき銀貨を獲得する（購入フェーズなら山札の上、それ以外は手札）
const rocksGainSilver = (player, game) => {
    const destination = game.phase === 'buy' && player === game.getCurrentPlayer() ? 'deck' : 'hand';
    gainAndLog(game, player, 'silver', destination);
};

// ===== 2種で1山のカード・城（王国カードの山の中身） =====
export const EMPIRES_PILE_CARDS = {
    ENCAMPMENT: {
        id: 'encampment', name: '野営地', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +2。手札の金貨か戦利品を公開してもよい。公開しなければ、これを脇に置き、クリーンアップの開始時にサプライに戻す',
        onPlay: (player, game, encampment) => {
            gainBenefits(player, game, { cards: 2, actions: 2 });
            const setAside = () => {
                const index = player.playArea.indexOf(encampment);
                if (index < 0) return;
                player.playArea.splice(index, 1);
                player.setAside.push(encampment);
                game.turnState.encampments.push(encampment);
                game.log(`${player.name}は野営地を脇に置きました`);
            };
            const reveal = player.hand.find(card => card.id === 'gold' || card.id === 'plunder');
            if (!reveal) {
                setAside();
                return;
            }
            game.promptConfirm({
                player,
                card: reveal,
                title: '野営地',
                message: `${reveal.name}を公開しますか？（公開しなければ野営地をサプライに戻します）`,
                yesLabel: '公開する',
                noLabel: '公開しない',
                purpose: 'encampment-reveal',
                callback: (yes) => {
                    if (yes) {
                        game.log(`${player.name}は${reveal.name}を公開しました`);
                    } else {
                        setAside();
                    }
                }
            });
        }
    },
    PLUNDER: {
        id: 'plunder', name: '戦利品', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。勝利点トークン +1',
        onPlay: (player, game) => game.gainVp(player, 1, '戦利品')
    },
    PATRICIAN: {
        id: 'patrician', name: 'パトリキ', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、コスト5以上なら手札に加える',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            if (game.getCost(card) >= 5) {
                player.hand.push(card);
                game.log(`${player.name}は${card.name}を手札に加えました`);
            } else {
                player.deck.unshift(card);
            }
        }
    },
    EMPORIUM: {
        id: 'emporium', name: 'エンポリウム', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。これを獲得したとき、場にアクションカードが5枚以上あれば、勝利点トークン +2',
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 }),
        onGain: (player, game) => {
            if (player.playArea.filter(isAction).length >= 5) game.gainVp(player, 2, 'エンポリウム');
        }
    },
    SETTLERS: {
        id: 'settlers', name: '開拓者', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。捨て札の銅貨を1枚公開して、手札に加えてもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            takeFromDiscard(game, player, 'copper', '開拓者');
        }
    },
    BUSTLING_VILLAGE: {
        id: 'bustling_village', name: '賑やかな村', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +3。捨て札の開拓者を1枚公開して、手札に加えてもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 3 });
            takeFromDiscard(game, player, 'settlers', '賑やかな村');
        }
    },
    CATAPULT: {
        id: 'catapult', name: '投石機', cost: 3, types: [CARD_TYPES.ACTION],
        description: '財宝 +1。手札のカードを1枚廃棄する。それがコスト3以上なら他のプレイヤーは呪いを獲得し、財宝なら他のプレイヤーは手札が3枚になるまで捨てる',
        isAttack: true,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 1 });
            promptTrashFromHand(game, player, {
                title: '投石機', message: '廃棄するカードを1枚選んでください。', purpose: 'catapult-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const curse = game.getCost(trashed) >= 3;
                    const discard = isTreasure(trashed);
                    if (!curse && !discard) return;
                    game.attackOtherPlayers(player, (target) => {
                        if (curse) game.gainCurse(target);
                        if (discard) game.runNext(() => discardDownTo(game, target, 3, '投石機'));
                    });
                }
            });
        }
    },
    ROCKS: {
        id: 'rocks', name: '岩', cost: 4, types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1。これを獲得したときと廃棄したとき、銀貨を1枚獲得する（購入フェーズなら山札の上に、それ以外は手札に置く）',
        onGain: rocksGainSilver,
        onTrash: rocksGainSilver
    },
    GLADIATOR: {
        id: 'gladiator', name: '剣闘士', cost: 3, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。手札のカードを1枚公開する。左隣のプレイヤーは同じカードを公開してもよい。公開しなければ、財宝 +1 し、サプライの剣闘士を1枚廃棄する',
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            const left = game.getPlayerToLeft(player);
            const win = () => {
                gainBenefits(player, game, { coins: 1 });
                if (game.getPileTop('gladiator_fortune') === 'gladiator' && game.takeFromSupply('gladiator')) {
                    game.trash.push(new Card(EMPIRES_PILE_CARDS.GLADIATOR));
                    game.log('サプライの剣闘士を1枚廃棄しました');
                }
            };
            if (player.hand.length === 0) {
                win();
                return;
            }
            promptFromHand(game, player, {
                title: '剣闘士', message: '公開するカードを1枚選んでください。', confirmLabel: '公開する', purpose: 'gladiator-reveal',
                callback: ([card]) => {
                    game.log(`${player.name}は${card.name}を公開しました`);
                    const copy = left.hand.find(c => c.id === card.id);
                    if (!copy) {
                        win();
                        return;
                    }
                    game.promptConfirm({
                        player: left,
                        card: copy,
                        title: '剣闘士',
                        message: `${player.name}が${card.name}を公開しました。同じカードを公開しますか？`,
                        yesLabel: '公開する',
                        noLabel: '公開しない',
                        purpose: 'gladiator-answer',
                        callback: (yes) => {
                            if (yes) {
                                game.log(`${left.name}も${card.name}を公開しました`);
                            } else {
                                win();
                            }
                        }
                    });
                }
            });
        }
    },
    FORTUNE: {
        id: 'fortune', name: '富', cost: 8, debtCost: 8, types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '購入 +1。プレイしたとき、このターンにまだしていなければ、財宝を2倍にする。これを獲得したとき、場の剣闘士1枚につき金貨を1枚獲得する',
        onPlay: (player, game) => {
            player.buys += 1;
            if (game.turnState.fortuneDoubled) return;
            game.turnState.fortuneDoubled = true;
            const before = player.coins;
            player.coins += before;
            game.log(`${player.name}は富で財宝を2倍（${before}→${player.coins}）にしました`);
        },
        onGain: (player, game) => {
            player.playArea.filter(card => card.id === 'gladiator').forEach(() => gainAndLog(game, player, 'gold'));
        }
    }
};

// 城（安い順に重ねた山。2人なら各1枚、3人以上なら12枚）
const castleCount = (cards) => cards.filter(isCastle).length;
export const CASTLE_CARDS = {
    HUMBLE_CASTLE: {
        id: 'humble_castle', name: '粗末な城', cost: 3, types: [CARD_TYPES.TREASURE, CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        value: 1,
        description: '財宝 +1。持っている城1枚につき勝利点 1',
        pointsFor: castleCount
    },
    CRUMBLING_CASTLE: {
        id: 'crumbling_castle', name: '崩れかけの城', cost: 4, types: [CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        points: 1,
        description: '勝利点 1。これを獲得したときと廃棄したとき、勝利点トークン +1 と銀貨を1枚獲得する',
        onGain: (player, game) => {
            game.gainVp(player, 1, '崩れかけの城');
            gainAndLog(game, player, 'silver');
        },
        onTrash: (player, game) => {
            game.gainVp(player, 1, '崩れかけの城');
            gainAndLog(game, player, 'silver');
        }
    },
    SMALL_CASTLE: {
        id: 'small_castle', name: '小さい城', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        points: 2,
        description: 'これか手札の城を1枚廃棄する。そうしたら、城を1枚獲得する。勝利点 2',
        onPlay: (player, game, small) => {
            const candidates = [...(player.playArea.includes(small) ? [small] : []), ...player.hand.filter(isCastle)];
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates, min: 0, max: 1,
                title: '小さい城', message: '廃棄する城（場の小さい城か手札の城）を選んでください。廃棄すると城を1枚獲得します。', confirmLabel: '廃棄する', purpose: 'small-castle',
                callback: ([index]) => {
                    const card = candidates[index];
                    if (!card || !player.removeCard(card)) return;
                    game.trashCard(player, card);
                    game.log(`${player.name}は${card.name}を廃棄しました`);
                    game.runNext(() => gainAndLog(game, player, 'castles'));
                }
            });
        }
    },
    HAUNTED_CASTLE: {
        id: 'haunted_castle', name: '幽霊城', cost: 6, types: [CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        points: 2,
        description: '勝利点 2。自分のターンにこれを獲得したとき、金貨を1枚獲得し、手札が5枚以上の他のプレイヤーは手札を2枚山札の上に置く',
        onGain: (player, game) => {
            if (player !== game.getCurrentPlayer()) return;
            gainAndLog(game, player, 'gold');
            game.getOtherPlayers(player).filter(other => other.hand.length >= 5).forEach(other => game.runNext(() => game.promptSelect({
                player: other, cards: other.hand, min: 2, max: 2,
                title: '幽霊城', message: '山札の上に置くカードを2枚選んでください。', confirmLabel: '山札の上に置く', purpose: 'haunted-castle',
                callback: (indices) => {
                    const cards = indices.map(index => other.hand[index]);
                    cards.forEach(card => other.hand.splice(other.hand.indexOf(card), 1));
                    other.deck.unshift(...cards);
                    game.log(`${other.name}は手札を2枚山札の上に置きました`);
                }
            })));
        }
    },
    OPULENT_CASTLE: {
        id: 'opulent_castle', name: '華やかな城', cost: 7, types: [CARD_TYPES.ACTION, CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        points: 3,
        description: '手札の勝利点カードを好きな枚数捨て、1枚につき財宝 +2。勝利点 3',
        onPlay: (player, game) => {
            const victories = player.hand.filter(isVictory);
            if (victories.length === 0) return;
            game.promptSelect({
                player, cards: victories, min: 0, max: victories.length,
                title: '華やかな城', message: '捨てる勝利点カードを選んでください。1枚につき財宝+2を得ます。', confirmLabel: '捨てる', purpose: 'opulent-castle',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices.map(index => player.hand.indexOf(victories[index])));
                    if (discarded.length > 0) gainBenefits(player, game, { coins: 2 * discarded.length }, '華やかな城');
                }
            });
        }
    },
    SPRAWLING_CASTLE: {
        id: 'sprawling_castle', name: '広大な城', cost: 8, types: [CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        points: 4,
        description: '勝利点 4。これを獲得したとき、公領を1枚か屋敷を3枚獲得する',
        onGain: (player, game, castle) => game.promptChoose({
            player, card: castle, options: ['公領を1枚獲得する', '屋敷を3枚獲得する'],
            title: '広大な城', message: '獲得するカードを選んでください。', purpose: 'hunting-grounds',
            callback: ([index]) => {
                if (index === 0) {
                    gainAndLog(game, player, 'duchy');
                } else {
                    [0, 1, 2].forEach(() => gainAndLog(game, player, 'estate'));
                }
            }
        })
    },
    GRAND_CASTLE: {
        id: 'grand_castle', name: '壮大な城', cost: 9, types: [CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        points: 5,
        description: '勝利点 5。これを獲得したとき、手札を公開し、手札と場の勝利点カード1枚につき勝利点トークン +1',
        onGain: (player, game) => {
            logReveal(game, player, player.hand);
            game.gainVp(player, [...player.hand, ...player.playArea].filter(isVictory).length, '壮大な城');
        }
    },
    KINGS_CASTLE: {
        id: 'kings_castle', name: '王の城', cost: 10, types: [CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        description: '持っている城1枚につき勝利点 2',
        pointsFor: (cards) => 2 * castleCount(cards)
    }
};

// 2種で1山のカードの山（上5枚と下5枚）
const splitPile = (top, bottom) => [...Array(5).fill(top), ...Array(5).fill(bottom)];

// ===== 王国カード =====
export const EMPIRES_CARDS = {
    // ===== 2種で1山のカード・城（山の札。一番上のカードだけを購入・獲得できる） =====
    ENCAMPMENT_PLUNDER: {
        id: 'encampment_plunder', name: '野営地／戦利品', cost: 2, types: [CARD_TYPES.ACTION],
        description: '上5枚が野営地、下5枚が戦利品の山。一番上のカードだけを購入・獲得できる',
        pileCards: splitPile('encampment', 'plunder'), pileOrdered: true
    },
    PATRICIAN_EMPORIUM: {
        id: 'patrician_emporium', name: 'パトリキ／エンポリウム', cost: 2, types: [CARD_TYPES.ACTION],
        description: '上5枚がパトリキ、下5枚がエンポリウムの山。一番上のカードだけを購入・獲得できる',
        pileCards: splitPile('patrician', 'emporium'), pileOrdered: true
    },
    SETTLERS_BUSTLING_VILLAGE: {
        id: 'settlers_bustling_village', name: '開拓者／賑やかな村', cost: 2, types: [CARD_TYPES.ACTION],
        description: '上5枚が開拓者、下5枚が賑やかな村の山。一番上のカードだけを購入・獲得できる',
        pileCards: splitPile('settlers', 'bustling_village'), pileOrdered: true
    },
    CATAPULT_ROCKS: {
        id: 'catapult_rocks', name: '投石機／岩', cost: 3, types: [CARD_TYPES.ACTION],
        description: '上5枚が投石機、下5枚が岩の山。一番上のカードだけを購入・獲得できる',
        isAttack: true,
        pileCards: splitPile('catapult', 'rocks'), pileOrdered: true
    },
    GLADIATOR_FORTUNE: {
        id: 'gladiator_fortune', name: '剣闘士／富', cost: 3, types: [CARD_TYPES.ACTION],
        description: '上5枚が剣闘士、下5枚が富の山。一番上のカードだけを購入・獲得できる',
        pileCards: splitPile('gladiator', 'fortune'), pileOrdered: true
    },
    CASTLES: {
        id: 'castles', name: '城', cost: 3, types: [CARD_TYPES.VICTORY, CARD_TYPES.CASTLE],
        description: '8種の城を安い順に重ねた山（2人なら各1枚、3人以上なら12枚）。一番上のカードだけを購入・獲得できる',
        pileOrdered: true,
        pileCardsFor: (playerCount) => (playerCount <= 2
            ? Object.values(CASTLE_CARDS).map(data => data.id)
            : ['humble_castle', 'humble_castle', 'crumbling_castle', 'small_castle', 'small_castle', 'haunted_castle',
                'opulent_castle', 'opulent_castle', 'sprawling_castle', 'grand_castle', 'kings_castle', 'kings_castle'])
    },

    // ===== コスト3 =====
    CHARIOT_RACE: {
        id: 'chariot_race', name: '戦車競走', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。山札の一番上を公開して手札に加える。左隣のプレイヤーも山札の一番上を公開する。自分のカードの方がコストが高ければ、財宝 +1 と勝利点トークン +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const [mine] = takeTopCards(player, 1);
            if (!mine) return;
            player.hand.push(mine);
            const left = game.getPlayerToLeft(player);
            const [theirs] = takeTopCards(left, 1);
            if (theirs) left.deck.unshift(theirs);
            game.log(`${player.name}は${mine.name}、${left.name}は${theirs?.name ?? 'なし'}を公開しました`);
            if (!theirs || game.costsLessThan(theirs, mine)) {
                gainBenefits(player, game, { coins: 1 });
                game.gainVp(player, 1, '戦車競走');
            }
        }
    },
    ENCHANTRESS: {
        id: 'enchantress', name: '女魔術師', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンまで、他のプレイヤーが自分のターンに最初にプレイするアクションカードは、効果の代わりにカード+1・アクション+1になる。次のターンの開始時に、カードを2枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game, enchantress) => {
            game.attackOtherPlayers(player, (target) => player.enchantedVictims.add(target));
            player.addDuration(enchantress, () => gainBenefits(player, game, { cards: 2 }, '女魔術師'));
        }
    },
    FARMERS_MARKET: {
        id: 'farmers_market', name: '農家の市場', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.GATHERING],
        description: '購入 +1。農家の市場の山に勝利点トークンが4つ以上あれば、それを取ってこれを廃棄する。そうでなければ、山に勝利点トークンを1つ置き、山の勝利点トークン1つにつき財宝 +1',
        count: 10,
        onPlay: (player, game, market) => {
            gainBenefits(player, game, { buys: 1 });
            if ((game.pileVp.farmers_market ?? 0) >= 4) {
                game.takeVpFrom(player, game.pileVp, 'farmers_market', '農家の市場');
                trashFromPlay(game, player, market);
                return;
            }
            game.pileVp.farmers_market = (game.pileVp.farmers_market ?? 0) + 1;
            gainBenefits(player, game, { coins: game.pileVp.farmers_market }, '農家の市場');
        }
    },

    // ===== コスト4 =====
    SACRIFICE: {
        id: 'sacrifice', name: '生贄', cost: 4, types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。それがアクションならカードを2枚引きアクション +2、財宝なら財宝 +2、勝利点なら勝利点トークン +2',
        count: 10,
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            title: '生贄', message: '廃棄するカードを1枚選んでください。', purpose: 'sacrifice-trash',
            callback: ([trashed]) => {
                if (!trashed) return;
                if (isAction(trashed)) gainBenefits(player, game, { cards: 2, actions: 2 }, '生贄');
                if (isTreasure(trashed)) gainBenefits(player, game, { coins: 2 }, '生贄');
                if (isVictory(trashed)) game.gainVp(player, 2, '生贄');
            }
        })
    },
    TEMPLE: {
        id: 'temple', name: '神殿', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.GATHERING],
        description: '勝利点トークン +1。手札の名前の違うカードを1〜3枚廃棄する。神殿の山に勝利点トークンを1つ置く。これを獲得したとき、神殿の山の勝利点トークンを取る',
        count: 10,
        onPlay: (player, game) => {
            game.gainVp(player, 1, '神殿');
            const distinct = [...new Map(player.hand.map(card => [card.id, card])).values()];
            if (distinct.length > 0) {
                game.promptSelect({
                    player, cards: distinct, min: 1, max: 3,
                    title: '神殿', message: '廃棄するカード（名前の違うもの）を1〜3枚選んでください。', confirmLabel: '廃棄する', purpose: 'temple-trash',
                    callback: (indices) => {
                        const trashed = game.trashFromHand(player, indices.map(index => player.hand.indexOf(distinct[index])));
                        if (trashed.length > 0) game.log(`${player.name}は${names(trashed)}を廃棄しました`);
                    }
                });
            }
            game.runNext(() => {
                game.pileVp.temple = (game.pileVp.temple ?? 0) + 1;
            });
        },
        onGain: (player, game) => game.takeVpFrom(player, game.pileVp, 'temple', '神殿')
    },
    VILLA: {
        id: 'villa', name: 'ヴィラ', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'アクション +2。購入 +1。財宝 +1。これを獲得したとき、手札に加え、アクション +1。購入フェーズならアクションフェーズに戻る',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { actions: 2, buys: 1, coins: 1 }),
        onGain: (player, game, villa) => {
            if (!player.removeCard(villa)) return;
            player.hand.push(villa);
            player.actions += 1;
            game.log(`${player.name}はヴィラを手札に加え、アクション+1を得ました`);
            game.returnToActionPhase(player);
        }
    },

    // ===== コスト5 =====
    ARCHIVE: {
        id: 'archive', name: '記録庫', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +1。山札の上から3枚を脇に置く（見てよい）。今と次の2回のターンの開始時に、そのうち1枚を手札に加える',
        count: 10,
        onPlay: (player, game, archive) => {
            gainBenefits(player, game, { actions: 1 });
            const cards = takeTopCards(player, 3);
            player.setAside.push(...cards);
            const takeOne = () => {
                const remaining = cards.filter(card => player.setAside.includes(card));
                if (remaining.length === 0) return;
                const take = (card) => {
                    player.setAside.splice(player.setAside.indexOf(card), 1);
                    player.hand.push(card);
                    game.log(`${player.name}は記録庫のカードを1枚手札に加えました`);
                    // 残りがあれば、次のターンにも続ける
                    if (remaining.length > 1) player.addDuration(archive, takeOne);
                };
                if (remaining.length === 1) {
                    take(remaining[0]);
                    return;
                }
                game.promptSelect({
                    player, cards: remaining, min: 1, max: 1,
                    title: '記録庫', message: '手札に加えるカードを1枚選んでください。', confirmLabel: '手札に加える', purpose: 'archive',
                    callback: ([index]) => take(remaining[index])
                });
            };
            takeOne();
        }
    },
    CAPITAL: {
        id: 'capital', name: '資本', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 6,
        description: '財宝 +6。購入 +1。これを場から捨て札にするとき、負債を6負い、その後で負債を返してもよい',
        count: 10,
        onPlay: (player) => {
            player.buys += 1;
        },
        onCleanup: (player, game) => {
            game.takeDebt(player, 6, '資本');
            game.payOffDebt(player);
        }
    },
    CHARM: {
        id: 'charm', name: '魔除け', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 0,
        description: 'プレイしたとき、次のうち1つを選ぶ：購入 +1 と財宝 +2、またはこのターン次にカードを獲得したとき、同じコストの名前の違うカードも獲得してよい',
        count: 10,
        onPlay: (player, game, charm) => game.promptChoose({
            player,
            card: charm,
            options: ['購入 +1 と財宝 +2', '次に獲得したとき、同じコストの別のカードも獲得する'],
            title: '魔除け',
            message: '1つ選んでください。',
            purpose: 'charm',
            callback: ([index]) => {
                if (index === 0) {
                    gainBenefits(player, game, { buys: 1, coins: 2 });
                } else {
                    game.turnState.charms++;
                }
            }
        })
    },
    CROWN: {
        id: 'crown', name: '王冠', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.TREASURE],
        value: 0,
        description: 'アクションフェーズなら、手札のアクションカードを1枚、2回プレイしてもよい。購入フェーズなら、手札の財宝を1枚、2回プレイしてもよい',
        count: 10,
        onPlay: (player, game, crown) => {
            const buying = game.phase === 'buy';
            promptFromHand(game, player, {
                min: 0,
                filter: (card) => (buying ? game.isTreasure(card) : isAction(card)),
                title: '王冠',
                message: `2回プレイする${buying ? '財宝' : 'アクションカード'}を選んでください（選ばなくてもかまいません）。`,
                confirmLabel: '2回プレイする',
                purpose: buying ? 'tiara' : 'throne-room',
                callback: ([card]) => {
                    if (card) game.playMultipleTimes(player, card, 2, crown, { asTreasure: buying });
                }
            });
        }
    },
    FORUM: {
        id: 'forum', name: 'フォルム', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。アクション +1。手札を2枚捨てる。これを購入したとき、購入 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3, actions: 1 });
            promptDiscardFromHand(game, player, 2, 'フォルム');
        },
        onBuy: (player, game) => gainBenefits(player, game, { buys: 1 }, 'フォルム')
    },
    GROUNDSKEEPER: {
        id: 'groundskeeper', name: '庭師', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。これが場にある間、勝利点カードを獲得するたびに勝利点トークン +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 1 })
    },
    LEGIONARY: {
        id: 'legionary', name: '軍団兵', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財宝 +3。手札の金貨を公開してもよい。そうしたら、他のプレイヤーは手札が2枚になるまで捨て、カードを1枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 3 });
            const gold = player.hand.find(card => card.id === 'gold');
            if (!gold) return;
            game.promptConfirm({
                player, card: gold, title: '軍団兵', message: '金貨を公開して攻撃しますか？', yesLabel: '公開する', noLabel: '公開しない', purpose: 'legionary',
                callback: (yes) => {
                    if (!yes) return;
                    game.log(`${player.name}は金貨を公開しました`);
                    game.attackOtherPlayers(player, (target) => {
                        discardDownTo(game, target, 2, '軍団兵');
                        game.runNext(() => gainBenefits(target, game, { cards: 1 }, '軍団兵'));
                    });
                }
            });
        }
    },
    WILD_HUNT: {
        id: 'wild_hunt', name: 'ワイルドハント', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.GATHERING],
        description: '次のうち1つを選ぶ：カードを3枚引き、ワイルドハントの山に勝利点トークンを1つ置く。または、屋敷を1枚獲得し、獲得したら山の勝利点トークンを取る',
        count: 10,
        onPlay: (player, game, hunt) => game.promptChoose({
            player,
            card: hunt,
            options: ['カードを3枚引き、山に勝利点トークンを置く', `屋敷を獲得して、山の勝利点トークン（${game.pileVp.wild_hunt ?? 0}）を取る`],
            title: 'ワイルドハント',
            message: '1つ選んでください。',
            purpose: 'wild-hunt',
            callback: ([index]) => {
                if (index === 0) {
                    gainBenefits(player, game, { cards: 3 });
                    game.pileVp.wild_hunt = (game.pileVp.wild_hunt ?? 0) + 1;
                } else if (gainAndLog(game, player, 'estate')) {
                    game.takeVpFrom(player, game.pileVp, 'wild_hunt', 'ワイルドハント');
                }
            }
        })
    },

    // ===== 負債のカード =====
    ENGINEER: {
        id: 'engineer', name: '技術者', cost: 0, debtCost: 4, types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得する。これを廃棄してもよい。そうしたら、コスト4以下のカードをもう1枚獲得する',
        count: 10,
        onPlay: (player, game, engineer) => {
            const gain = () => game.promptGain({ player, maxCost: 4, title: '技術者', message: 'コスト4以下のカードを1枚獲得してください。' });
            gain();
            game.runNext(() => {
                if (!player.playArea.includes(engineer)) return;
                game.promptConfirm({
                    player, card: engineer, title: '技術者', message: '技術者を廃棄して、もう1枚獲得しますか？',
                    yesLabel: '廃棄する', noLabel: '廃棄しない', purpose: 'engineer-trash',
                    callback: (yes) => {
                        if (yes && trashFromPlay(game, player, engineer)) game.runNext(gain);
                    }
                });
            });
        }
    },
    CITY_QUARTER: {
        id: 'city_quarter', name: '市街', cost: 0, debtCost: 8, types: [CARD_TYPES.ACTION],
        description: 'アクション +2。手札を公開し、アクションカード1枚につきカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 2 });
            logReveal(game, player, player.hand);
            const count = player.hand.filter(isAction).length;
            if (count > 0) gainBenefits(player, game, { cards: count }, '市街');
        }
    },
    OVERLORD: {
        id: 'overlord', name: '大君主', cost: 0, debtCost: 8, types: [CARD_TYPES.ACTION, CARD_TYPES.COMMAND],
        description: 'コスト5以下の命令以外のアクションカードを、サプライに置いたままプレイする',
        count: 10,
        onPlay: (player, game) => playFromSupply(game, player, { title: '大君主', maxCost: 5, purpose: 'band-of-misfits' })
    },
    ROYAL_BLACKSMITH: {
        id: 'royal_blacksmith', name: '王宮の鍛冶屋', cost: 0, debtCost: 8, types: [CARD_TYPES.ACTION],
        description: 'カードを5枚引く。手札を公開し、銅貨をすべて捨てる',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 5 });
            logReveal(game, player, player.hand);
            const coppers = player.hand.filter(card => card.id === 'copper');
            if (coppers.length === 0) return;
            game.discardFromHand(player, coppers.map(card => player.hand.indexOf(card)));
            game.log(`${player.name}は銅貨を${coppers.length}枚捨てました`);
        }
    }
};

// ===== イベント =====
const event = (key, data) => ({ [key]: { kind: LANDSCAPE_KINDS.EVENT, ...data } });

export const EMPIRES_EVENTS = {
    ...event('ADVANCE', {
        id: 'advance', name: '前進', cost: 0,
        description: '手札のアクションカードを1枚廃棄してもよい。そうしたら、コスト6以下のアクションカードを1枚獲得する',
        onBuy: (player, game) => promptTrashFromHand(game, player, {
            min: 0, filter: isAction, title: '前進', message: '廃棄するアクションカードを選んでください（選ばなくてもかまいません）。', purpose: 'advance-trash',
            callback: ([trashed]) => {
                if (trashed) game.promptGain({ player, maxCost: 6, filter: (data) => data.types.includes(CARD_TYPES.ACTION), title: '前進', message: 'コスト6以下のアクションカードを1枚獲得してください。' });
            }
        })
    }),
    ...event('ANNEX', {
        id: 'annex', name: '併合', cost: 0, debtCost: 8,
        description: '捨て札を見て、5枚まで残し、残りを山札に混ぜてシャッフルする。公領を1枚獲得する',
        onBuy: (player, game) => {
            const finish = (keep) => {
                const moving = player.discard.filter(card => !keep.includes(card));
                player.discard = keep;
                player.deck.push(...moving);
                player.shuffleDeck();
                game.log(`${player.name}は捨て札を${moving.length}枚山札に混ぜました`);
                gainAndLog(game, player, 'duchy');
            };
            if (player.discard.length === 0) {
                finish([]);
                return;
            }
            game.promptSelect({
                player, cards: [...player.discard], min: 0, max: 5,
                title: '併合', message: '捨て札に残すカードを5枚まで選んでください。残りは山札に混ぜます。', confirmLabel: '残す', purpose: 'annex',
                callback: (indices) => finish(indices.map(index => player.discard[index]))
            });
        }
    }),
    ...event('BANQUET', {
        id: 'banquet', name: '晩餐会', cost: 3,
        description: '銅貨を2枚と、コスト5以下の勝利点以外のカードを1枚獲得する',
        onBuy: (player, game) => {
            gainAndLog(game, player, 'copper');
            gainAndLog(game, player, 'copper');
            game.promptGain({ player, maxCost: 5, filter: (data) => !data.types.includes(CARD_TYPES.VICTORY), title: '晩餐会', message: 'コスト5以下の勝利点以外のカードを1枚獲得してください。' });
        }
    }),
    ...event('CONQUEST', {
        id: 'conquest', name: '征服', cost: 6,
        description: '銀貨を2枚獲得する。このターンに獲得した銀貨1枚につき勝利点トークン +1',
        onBuy: (player, game) => {
            gainAndLog(game, player, 'silver');
            gainAndLog(game, player, 'silver');
            game.gainVp(player, player.gainedThisTurn.filter(id => id === 'silver').length, '征服');
        }
    }),
    ...event('DELVE', {
        id: 'delve', name: '掘削', cost: 2,
        description: '購入 +1。銀貨を1枚獲得する',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            gainAndLog(game, player, 'silver');
        }
    }),
    ...event('DOMINATE', {
        id: 'dominate', name: '制圧', cost: 14,
        description: '属州を1枚獲得する。獲得したら、勝利点トークン +9',
        onBuy: (player, game) => {
            if (gainAndLog(game, player, 'province')) game.gainVp(player, 9, '制圧');
        }
    }),
    ...event('DONATE', {
        id: 'donate', name: '寄付', cost: 0, debtCost: 8,
        description: 'このターンの後に、山札と捨て札をすべて手札に加え、好きな枚数を廃棄し、手札を山札にしてシャッフルし、カードを5枚引く',
        onBuy: (player, game) => {
            player.donatePending = true;
            game.log(`${player.name}はこのターンの後に寄付を行います`);
        }
    }),
    ...event('RITUAL', {
        id: 'ritual', name: '儀式', cost: 4,
        description: '呪いを1枚獲得する。獲得したら、手札のカードを1枚廃棄し、そのコスト1につき勝利点トークン +1',
        onBuy: (player, game) => {
            if (!game.gainCurse(player)) return;
            promptTrashFromHand(game, player, {
                title: '儀式', message: '廃棄するカードを1枚選んでください。コスト1につき勝利点トークンを得ます。', purpose: 'ritual-trash',
                callback: ([trashed]) => {
                    if (trashed) game.gainVp(player, game.getCost(trashed), '儀式');
                }
            });
        }
    }),
    ...event('SALT_THE_EARTH', {
        id: 'salt_the_earth', name: '塩まき', cost: 4,
        description: '勝利点トークン +1。サプライの勝利点カードを1枚廃棄する',
        onBuy: (player, game) => {
            game.gainVp(player, 1, '塩まき');
            const candidates = game.getGainableCards({ filter: (data) => data.types.includes(CARD_TYPES.VICTORY) });
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates.map(data => new Card(data)), min: 1, max: 1,
                title: '塩まき', message: '廃棄するサプライの勝利点カードを選んでください。', confirmLabel: '廃棄する', purpose: 'salt-the-earth',
                callback: ([index]) => {
                    const data = candidates[index];
                    if (!game.takeFromSupply(data.id)) return;
                    game.trash.push(new Card(data));
                    game.log(`サプライの${data.name}を1枚廃棄しました`);
                }
            });
        }
    }),
    ...event('TAX', {
        id: 'tax', name: '徴税', cost: 2,
        description: 'サプライの山を1つ選び、負債を2置く。準備：サプライの各山に負債を1置く。カードを購入したプレイヤーは、その山の負債を負う',
        setup: (game) => {
            Object.keys(game.supply).forEach(pileId => { game.pileDebt[pileId] = 1; });
        },
        onBuy: (player, game) => {
            const pileIds = Object.keys(game.supply);
            game.promptSelect({
                player,
                cards: pileIds.map(pileId => new Card(game.getPileTopData(pileId))),
                min: 1, max: 1,
                title: '徴税', message: '負債を2置く山を選んでください。', confirmLabel: '置く', purpose: 'tax',
                callback: ([index]) => {
                    const pileId = pileIds[index];
                    game.pileDebt[pileId] = (game.pileDebt[pileId] ?? 0) + 2;
                    game.log(`${player.name}は${game.getPileName(pileId)}の山に負債を2置きました`);
                }
            });
        }
    }),
    ...event('TRIUMPH', {
        id: 'triumph', name: '凱旋', cost: 0, debtCost: 5,
        description: '屋敷を1枚獲得する。獲得したら、このターンに獲得したカード1枚につき勝利点トークン +1',
        onBuy: (player, game) => {
            if (gainAndLog(game, player, 'estate')) game.gainVp(player, player.gainedThisTurn.length, '凱旋');
        }
    }),
    ...event('WEDDING', {
        id: 'wedding', name: '結婚式', cost: 4, debtCost: 3,
        description: '勝利点トークン +1。金貨を1枚獲得する',
        onBuy: (player, game) => {
            game.gainVp(player, 1, '結婚式');
            gainAndLog(game, player, 'gold');
        }
    }),
    ...event('WINDFALL', {
        id: 'windfall', name: '棚ぼた', cost: 5,
        description: '山札と捨て札がどちらも空なら、金貨を3枚獲得する',
        onBuy: (player, game) => {
            if (player.deck.length > 0 || player.discard.length > 0) {
                game.log(`${player.name}の山札か捨て札にカードがあるため、棚ぼたの効果はありません`);
                return;
            }
            [0, 1, 2].forEach(() => gainAndLog(game, player, 'gold'));
        }
    })
};

// ===== ランドマーク =====
const landmark = (key, data) => ({ [key]: { kind: LANDSCAPE_KINDS.LANDMARK, ...data } });
// プレイヤーが持つすべてのカード
const cardsOf = (player) => player.getAllCards();
const countBy = (cards, keyOf = (card) => card.id) => cards.reduce((map, card) => map.set(keyOf(card), (map.get(keyOf(card)) ?? 0) + 1), new Map());
// 札に「プレイヤー1人につき6つ」勝利点トークンを置く準備
const sixPerPlayer = (id) => (game) => { game.landscapeVp[id] = 6 * game.players.length; };
const takeTwo = (game, player, id, name) => game.takeVpFrom(player, game.landscapeVp, id, name, 2);

export const EMPIRES_LANDMARKS = {
    ...landmark('AQUEDUCT', {
        id: 'aqueduct', name: '水道橋',
        description: '財宝を獲得したとき、その山の勝利点トークンを1つこれに移す。勝利点カードを獲得したとき、これの勝利点トークンを取る。準備：銀貨と金貨の山に勝利点トークンを8つずつ置く',
        setup: (game) => {
            game.pileVp.silver = 8;
            game.pileVp.gold = 8;
            game.landscapeVp.aqueduct = 0;
        },
        onGainAny: (game, player, card) => {
            const pileId = game.pileOf[card.id] ?? card.id;
            if (isTreasure(card) && game.pileVp[pileId] > 0) {
                game.pileVp[pileId]--;
                game.landscapeVp.aqueduct++;
            }
            if (isVictory(card)) game.takeVpFrom(player, game.landscapeVp, 'aqueduct', '水道橋');
        }
    }),
    ...landmark('ARENA', {
        id: 'arena', name: '闘技場',
        description: '購入フェーズの開始時に、手札のアクションカードを1枚捨ててもよい。そうしたら、これから勝利点トークンを2つ取る。準備：プレイヤー1人につき勝利点トークンを6つ置く',
        setup: sixPerPlayer('arena'),
        onStartBuyPhase: (game, player) => {
            if (!(game.landscapeVp.arena > 0) || !player.hand.some(isAction)) return;
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '闘技場', message: '捨てるアクションカードを選んでください（捨てると勝利点トークンを2つ取ります）。',
                confirmLabel: '捨てる', purpose: 'arena',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    takeTwo(game, player, 'arena', '闘技場');
                }
            });
        }
    }),
    ...landmark('BANDIT_FORT', {
        id: 'bandit_fort', name: '山賊の砦',
        description: '得点計算のとき、持っている銀貨と金貨1枚につき勝利点 -2',
        score: (game, player) => -2 * cardsOf(player).filter(card => card.id === 'silver' || card.id === 'gold').length
    }),
    ...landmark('BASILICA', {
        id: 'basilica', name: 'バシリカ',
        description: 'カードを購入したとき、財宝が2以上残っていれば、これから勝利点トークンを2つ取る。準備：プレイヤー1人につき勝利点トークンを6つ置く',
        setup: sixPerPlayer('basilica'),
        onBuyAny: (game, player) => {
            if (player.coins >= 2) takeTwo(game, player, 'basilica', 'バシリカ');
        }
    }),
    ...landmark('BATHS', {
        id: 'baths', name: '浴場',
        description: 'カードを獲得せずにターンを終えたとき、これから勝利点トークンを2つ取る。準備：プレイヤー1人につき勝利点トークンを6つ置く',
        setup: sixPerPlayer('baths'),
        onEndTurn: (game, player) => {
            if (player.gainedThisTurn.length === 0) takeTwo(game, player, 'baths', '浴場');
        }
    }),
    ...landmark('BATTLEFIELD', {
        id: 'battlefield', name: '戦場',
        description: '勝利点カードを獲得したとき、これから勝利点トークンを2つ取る。準備：プレイヤー1人につき勝利点トークンを6つ置く',
        setup: sixPerPlayer('battlefield'),
        onGainAny: (game, player, card) => {
            if (isVictory(card)) takeTwo(game, player, 'battlefield', '戦場');
        }
    }),
    ...landmark('COLONNADE', {
        id: 'colonnade', name: '列柱',
        description: 'アクションカードを購入したとき、場に同じカードがあれば、これから勝利点トークンを2つ取る。準備：プレイヤー1人につき勝利点トークンを6つ置く',
        setup: sixPerPlayer('colonnade'),
        onBuyAny: (game, player, data) => {
            if (data.types.includes(CARD_TYPES.ACTION) && player.playArea.some(card => card.id === data.id)) takeTwo(game, player, 'colonnade', '列柱');
        }
    }),
    ...landmark('DEFILED_SHRINE', {
        id: 'defiled_shrine', name: '汚された神殿',
        description: 'アクションカードを獲得したとき、その山の勝利点トークンを1つこれに移す。呪いを購入したとき、これの勝利点トークンを取る。準備：集合以外のアクションの山に勝利点トークンを2つずつ置く',
        setup: (game) => {
            game.landscapeVp.defiled_shrine = 0;
            Object.keys(game.supply).forEach(pileId => {
                const top = game.getPileTopData(pileId);
                if (top?.types.includes(CARD_TYPES.ACTION) && !top.types.includes(CARD_TYPES.GATHERING)) game.pileVp[pileId] = 2;
            });
        },
        onGainAny: (game, player, card) => {
            const pileId = game.pileOf[card.id] ?? card.id;
            if (isAction(card) && game.pileVp[pileId] > 0 && !card.types.includes(CARD_TYPES.GATHERING)) {
                game.pileVp[pileId]--;
                game.landscapeVp.defiled_shrine++;
            }
        },
        onBuyAny: (game, player, data) => {
            if (data.id === 'curse') game.takeVpFrom(player, game.landscapeVp, 'defiled_shrine', '汚された神殿');
        }
    }),
    ...landmark('FOUNTAIN', {
        id: 'fountain', name: '噴水',
        description: '得点計算のとき、銅貨を10枚以上持っていれば勝利点 15',
        score: (game, player) => (cardsOf(player).filter(card => card.id === 'copper').length >= 10 ? 15 : 0)
    }),
    ...landmark('KEEP', {
        id: 'keep', name: '天守閣',
        description: '得点計算のとき、持っている財宝の種類ごとに、他のどのプレイヤーより多い（同数を含む）なら勝利点 5',
        score: (game, player) => {
            const mine = countBy(cardsOf(player).filter(isTreasure));
            return [...mine].filter(([id, count]) => game.players.every(other =>
                other === player || cardsOf(other).filter(card => card.id === id).length <= count)).length * 5;
        }
    }),
    ...landmark('LABYRINTH', {
        id: 'labyrinth', name: '迷宮',
        description: '自分のターンに2枚目のカードを獲得したとき、これから勝利点トークンを2つ取る。準備：プレイヤー1人につき勝利点トークンを6つ置く',
        setup: sixPerPlayer('labyrinth'),
        onGainAny: (game, player) => {
            if (player === game.getCurrentPlayer() && player.gainedThisTurn.length === 2) takeTwo(game, player, 'labyrinth', '迷宮');
        }
    }),
    ...landmark('MOUNTAIN_PASS', {
        id: 'mountain_pass', name: '山道',
        description: '最初に属州を獲得したプレイヤーのターンの後、各プレイヤーはそのプレイヤーの左隣から順に1回ずつ、負債40までで入札する。一番高く入札したプレイヤーは、勝利点トークン +8 を得て、入札した負債を負う',
        onGainAny: (game, player, card) => {
            const state = game.landscapeState;
            if (card.id !== 'province' || state.mountainPassDone) return;
            state.mountainPassDone = true;
            state.mountainPassPlayer = player.id;
        },
        afterTurn: (game, player) => {
            const state = game.landscapeState;
            if (state.mountainPassPlayer !== player.id || state.mountainPassResolved) return;
            state.mountainPassResolved = true;
            let high = { player: null, bid: 0 };
            const order = [...game.getOtherPlayers(player), player];
            game.log('山道の入札を行います');
            game.runNext(...order.map(bidder => () => {
                const bids = Array.from({ length: 40 - high.bid }, (_, i) => high.bid + 1 + i);
                game.promptChoose({
                    player: bidder,
                    options: ['入札しない', ...bids.map(bid => `負債${bid}で入札する`)],
                    title: '山道',
                    message: `勝利点トークン8を得るための入札です（今の最高：${high.player ? `${high.player.name}の負債${high.bid}` : 'なし'}）。`,
                    purpose: 'mountain-pass',
                    callback: ([index]) => {
                        if (index === 0) {
                            game.log(`${bidder.name}は入札しませんでした`);
                            return;
                        }
                        high = { player: bidder, bid: bids[index - 1] };
                        game.log(`${bidder.name}は負債${high.bid}で入札しました`);
                    }
                });
            }), () => {
                if (!high.player) return;
                game.gainVp(high.player, 8, '山道');
                game.takeDebt(high.player, high.bid, '山道');
            });
        }
    }),
    ...landmark('MUSEUM', {
        id: 'museum', name: '博物館',
        description: '得点計算のとき、持っているカードの種類（名前の違うもの）1つにつき勝利点 2',
        score: (game, player) => 2 * countBy(cardsOf(player)).size
    }),
    ...landmark('OBELISK', {
        id: 'obelisk', name: 'オベリスク',
        description: '得点計算のとき、選ばれた山のカード1枚につき勝利点 2。準備：アクションの山を1つランダムに選ぶ',
        setup: (game) => {
            const piles = Object.keys(game.supply).filter(pileId => game.getPileTopData(pileId)?.types.includes(CARD_TYPES.ACTION));
            game.landscapeState.obelisk = piles.length > 0 ? piles[Math.floor(game.random() * piles.length)] : null;
            if (game.landscapeState.obelisk) game.log(`オベリスクの山は${game.getPileName(game.landscapeState.obelisk)}です`);
        },
        score: (game, player) => {
            const pileId = game.landscapeState.obelisk;
            if (!pileId) return 0;
            return 2 * cardsOf(player).filter(card => (game.pileOf[card.id] ?? card.id) === pileId).length;
        }
    }),
    ...landmark('ORCHARD', {
        id: 'orchard', name: '果樹園',
        description: '得点計算のとき、3枚以上持っているアクションカードの種類1つにつき勝利点 4',
        score: (game, player) => 4 * [...countBy(cardsOf(player).filter(isAction)).values()].filter(count => count >= 3).length
    }),
    ...landmark('PALACE', {
        id: 'palace', name: '宮殿',
        description: '得点計算のとき、銅貨・銀貨・金貨のそろい1組につき勝利点 3',
        score: (game, player) => {
            const counts = countBy(cardsOf(player));
            return 3 * Math.min(counts.get('copper') ?? 0, counts.get('silver') ?? 0, counts.get('gold') ?? 0);
        }
    }),
    ...landmark('TOMB', {
        id: 'tomb', name: '墓所',
        description: 'カードを廃棄したとき、勝利点トークン +1',
        onTrashAny: (game, player) => game.gainVp(player, 1, '墓所')
    }),
    ...landmark('TOWER', {
        id: 'tower', name: '塔',
        description: '得点計算のとき、空になったサプライの山の勝利点以外のカード1枚につき勝利点 1',
        score: (game, player) => cardsOf(player).filter(card => {
            const pileId = game.pileOf[card.id] ?? card.id;
            return !isVictory(card) && game.supply[pileId] === 0;
        }).length
    }),
    ...landmark('TRIUMPHAL_ARCH', {
        id: 'triumphal_arch', name: '凱旋門',
        description: '得点計算のとき、2番目に多く持っているアクションカードの枚数1枚につき勝利点 3',
        score: (game, player) => {
            const counts = [...countBy(cardsOf(player).filter(isAction)).values()].sort((a, b) => b - a);
            return 3 * (counts[1] ?? 0);
        }
    }),
    ...landmark('WALL', {
        id: 'wall', name: '城壁',
        description: '得点計算のとき、15枚を超えて持っているカード1枚につき勝利点 -1',
        score: (game, player) => -Math.max(0, cardsOf(player).length - 15)
    }),
    ...landmark('WOLF_DEN', {
        id: 'wolf_den', name: '狼の巣',
        description: '得点計算のとき、ちょうど1枚だけ持っているカードの種類1つにつき勝利点 -3',
        score: (game, player) => -3 * [...countBy(cardsOf(player)).values()].filter(count => count === 1).length
    })
};
