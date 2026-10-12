/**
 * ドミニオンのカードデータ
 */

import { CARD_TYPES, CARD_SETS } from './card-types.js';
import { INTRIGUE_CARDS } from './card-data-intrigue.js';
import { SEASIDE_CARDS } from './card-data-seaside.js';
import { PROSPERITY_CARDS, PROSPERITY_BASIC_CARDS } from './card-data-prosperity.js';
import { HINTERLANDS_CARDS } from './card-data-hinterlands.js';
import { CORNUCOPIA_GUILDS_CARDS, REWARD_CARDS } from './card-data-cornucopia-guilds.js';
import { ALCHEMY_CARDS, ALCHEMY_BASIC_CARDS } from './card-data-alchemy.js';
import {
    DARK_AGES_CARDS, KNIGHT_CARDS, RUINS_CARDS, SHELTER_CARDS, DARK_AGES_NON_SUPPLY_CARDS, RUINS_PILE
} from './card-data-dark-ages.js';
import { ADVENTURES_CARDS, TRAVELLER_CARDS, ADVENTURES_EVENTS } from './card-data-adventures.js';
import { EMPIRES_CARDS, EMPIRES_PILE_CARDS, CASTLE_CARDS, EMPIRES_EVENTS, EMPIRES_LANDMARKS } from './card-data-empires.js';

export { CARD_TYPES, CARD_SETS };

// 基本カードデータ
export const BASIC_CARDS = {
    // 財宝カード
    COPPER: {
        id: 'copper',
        name: '銅貨',
        cost: 0,
        types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1',
        count: 60
    },
    SILVER: {
        id: 'silver',
        name: '銀貨',
        cost: 3,
        types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2',
        count: 40
    },
    GOLD: {
        id: 'gold',
        name: '金貨',
        cost: 6,
        types: [CARD_TYPES.TREASURE],
        value: 3,
        description: '財宝 +3',
        count: 30
    },
    
    // 勝利点カード
    ESTATE: {
        id: 'estate',
        name: '屋敷',
        cost: 2,
        types: [CARD_TYPES.VICTORY],
        points: 1,
        description: '勝利点 +1',
        count: 24
    },
    DUCHY: {
        id: 'duchy',
        name: '公領',
        cost: 5,
        types: [CARD_TYPES.VICTORY],
        points: 3,
        description: '勝利点 +3',
        count: 12
    },
    PROVINCE: {
        id: 'province',
        name: '属州',
        cost: 8,
        types: [CARD_TYPES.VICTORY],
        points: 6,
        description: '勝利点 +6',
        count: 12
    },
    
    // 呪いカード
    CURSE: {
        id: 'curse',
        name: '呪い',
        cost: 0,
        types: [CARD_TYPES.CURSE],
        points: -1,
        description: '勝利点 -1',
        count: 30
    }
};

// 王国カードデータ（基本セット第2版の26種）
// onPlay(player, game, card) の中で選択が必要なときは game.promptSelect / promptConfirm / promptGain を使い、
// 続きの処理はそのコールバックに書く。攻撃や繰り返しは game.attackOtherPlayers / game.runNext で手順として積む
const isAction = (card) => card.isType(CARD_TYPES.ACTION);
const isTreasure = (card) => card.isType(CARD_TYPES.TREASURE);

const BASE_KINGDOM_CARDS = {
    // ===== コスト2 =====
    CELLAR: {
        id: 'cellar',
        name: '地下室',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。任意の枚数のカードを捨て、捨てた枚数分カードを引く',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 1;
            game.log(`${player.name}はアクション+1を得ました`);
            game.promptSelect({
                player,
                cards: player.hand,
                title: '地下室',
                message: '捨てるカードを選んでください。捨てた枚数だけカードを引きます。',
                confirmLabel: '捨てて引く',
                purpose: 'cellar-discard',
                callback: (indices) => {
                    game.discardFromHand(player, indices);
                    player.drawCards(indices.length);
                    game.log(`${player.name}は${indices.length}枚のカードを捨て、${indices.length}枚のカードを引きました`);
                }
            });
        }
    },
    CHAPEL: {
        id: 'chapel',
        name: '礼拝堂',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '手札から最大4枚までのカードを廃棄する',
        count: 10,
        onPlay: (player, game) => {
            game.promptSelect({
                player,
                cards: player.hand,
                max: 4,
                title: '礼拝堂',
                message: '廃棄するカードを選んでください（最大4枚）。',
                confirmLabel: '廃棄する',
                purpose: 'chapel-trash',
                callback: (indices) => {
                    game.trashFromHand(player, indices);
                    game.log(`${player.name}はカードを${indices.length}枚廃棄しました`);
                }
            });
        }
    },
    MOAT: {
        id: 'moat',
        name: 'お堀',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。攻撃を受けたとき、手札のこのカードを公開すれば攻撃を受けない',
        isReaction: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
        },
        onReact: (player, game, attacker) => {
            game.log(`${player.name}はお堀を公開し、${attacker.name}の攻撃を防ぎました`);
            return true; // 攻撃を防いだことを示す
        }
    },

    // ===== コスト3 =====
    HARBINGER: {
        id: 'harbinger',
        name: '前駆者',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。捨て札の中からカードを1枚選び、山札の上に置いてもよい',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
            if (player.discard.length === 0) return;

            const cards = [...player.discard];
            game.promptSelect({
                player,
                cards,
                max: 1,
                title: '前駆者',
                message: '山札の上に置くカードを捨て札から選んでください（選ばなくてもかまいません）。',
                confirmLabel: '山札の上に置く',
                purpose: 'harbinger',
                callback: ([index]) => {
                    if (index === undefined) return;
                    const card = cards[index];
                    player.discard.splice(player.discard.indexOf(card), 1);
                    player.deck.unshift(card);
                    game.log(`${player.name}は捨て札の${card.name}を山札の上に置きました`);
                }
            });
        }
    },
    MERCHANT: {
        id: 'merchant',
        name: '商人',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。このターンに最初に銀貨をプレイしたとき、財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            player.merchantBonus += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
        }
    },
    VASSAL: {
        id: 'vassal',
        name: '家臣',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。山札の一番上を捨て札にする。それがアクションカードなら、プレイしてもよい',
        count: 10,
        onPlay: (player, game) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            const card = player.takeTopCard();
            if (!card) return;

            player.discard.push(card);
            game.log(`${player.name}は山札の一番上の${card.name}を捨て札にしました`);
            if (!isAction(card)) return;

            game.promptConfirm({
                player,
                card,
                title: '家臣',
                message: `捨て札にした${card.name}をプレイしますか？（アクションは使いません）`,
                yesLabel: 'プレイする',
                noLabel: 'プレイしない',
                purpose: 'vassal-play',
                callback: (play) => {
                    if (!play) return;
                    player.discard.splice(player.discard.indexOf(card), 1);
                    player.playArea.push(card);
                    game.log(`${player.name}は${card.name}をプレイしました`);
                    card.play(player, game);
                }
            });
        }
    },
    VILLAGE: {
        id: 'village',
        name: '村',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 2;
            game.log(`${player.name}はカードを1枚引き、アクション+2を得ました`);
        }
    },
    WORKSHOP: {
        id: 'workshop',
        name: '工房',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            game.promptGain({
                player,
                maxCost: 4,
                title: '工房',
                message: 'コスト4以下のカードを1枚獲得してください。'
            });
        }
    },

    // ===== コスト4 =====
    BUREAUCRAT: {
        id: 'bureaucrat',
        name: '役人',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '銀貨を1枚獲得し、山札の上に置く。他のプレイヤーは手札の勝利点カードを1枚、山札の上に置く（なければ手札を公開する）',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            if (game.gainCardFromSupply(player, 'silver', 'deck')) {
                game.log(`${player.name}は銀貨を獲得し、山札の上に置きました`);
            }
            game.attackOtherPlayers(player, (target) => {
                const index = target.hand.findIndex(card => card.isType(CARD_TYPES.VICTORY));
                if (index < 0) {
                    game.log(`${target.name}は手札を公開しました（勝利点カードはありません）`);
                    return;
                }
                const [card] = target.hand.splice(index, 1);
                target.deck.unshift(card);
                game.log(`${target.name}は${card.name}を公開し、山札の上に置きました`);
            });
        }
    },
    GARDENS: {
        id: 'gardens',
        name: '庭園',
        cost: 4,
        types: [CARD_TYPES.VICTORY],
        description: 'デッキのカード10枚につき勝利点 +1（端数切り捨て）',
        pointsFor: (allCards) => Math.floor(allCards.length / 10)
    },
    MILITIA: {
        id: 'militia',
        name: '民兵',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。他のプレイヤーは手札が3枚になるまで捨てる',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            game.attackOtherPlayers(player, (target) => {
                const discardCount = target.hand.length - 3;
                if (discardCount <= 0) return;
                
                game.promptSelect({
                    player: target,
                    cards: target.hand,
                    min: discardCount,
                    max: discardCount,
                    title: '民兵',
                    message: `手札が3枚になるように、捨てるカードを${discardCount}枚選んでください。`,
                    confirmLabel: '捨てる',
                    purpose: 'discard-down',
                    callback: (indices) => {
                        game.discardFromHand(target, indices);
                        game.log(`${target.name}は手札を${indices.length}枚捨てました`);
                    }
                });
            });
        }
    },
    MONEYLENDER: {
        id: 'moneylender',
        name: '金貸し',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札の銅貨を1枚廃棄してもよい。廃棄したら財宝 +3',
        count: 10,
        onPlay: (player, game) => {
            if (!player.hand.some(card => card.id === 'copper')) {
                game.log(`${player.name}の手札に銅貨がありませんでした`);
                return;
            }
            game.promptConfirm({
                player,
                title: '金貸し',
                message: '手札の銅貨を1枚廃棄して、財宝+3を得ますか？',
                yesLabel: '廃棄する',
                noLabel: '廃棄しない',
                purpose: 'moneylender',
                callback: (yes) => {
                    if (!yes) return;
                    game.trashFromHand(player, [player.hand.findIndex(card => card.id === 'copper')]);
                    player.coins += 3;
                    game.log(`${player.name}は銅貨を廃棄し、財宝+3を得ました`);
                }
            });
        }
    },
    POACHER: {
        id: 'poacher',
        name: '密猟者',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。空のサプライの山1つにつき、手札を1枚捨てる',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            player.coins += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1、財宝+1を得ました`);

            const discardCount = Math.min(game.countEmptySupplyPiles(), player.hand.length);
            if (discardCount === 0) return;
            game.promptSelect({
                player,
                cards: player.hand,
                min: discardCount,
                max: discardCount,
                title: '密猟者',
                message: `空のサプライの山があるため、捨てるカードを${discardCount}枚選んでください。`,
                confirmLabel: '捨てる',
                purpose: 'discard-down',
                callback: (indices) => {
                    game.discardFromHand(player, indices);
                    game.log(`${player.name}は手札を${indices.length}枚捨てました`);
                }
            });
        }
    },
    REMODEL: {
        id: 'remodel',
        name: '改築',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。廃棄したカードよりコストが最大2多いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            if (player.hand.length === 0) {
                game.log(`${player.name}の手札にカードがありませんでした`);
                return;
            }
            game.promptSelect({
                player,
                cards: player.hand,
                min: 1,
                max: 1,
                title: '改築',
                message: '廃棄するカードを1枚選んでください。',
                confirmLabel: '廃棄する',
                purpose: 'remodel-trash',
                callback: ([index]) => {
                    const [trashed] = game.trashFromHand(player, [index]);
                    game.log(`${player.name}は${trashed.name}を廃棄しました`);
                    const maxCost = game.getCost(trashed) + 2;
                    game.promptGain({
                        player,
                        maxCost,
                        ...game.costExtras(trashed),
                        title: '改築',
                        message: `コスト${maxCost}以下のカードを1枚獲得してください。`
                    });
                }
            });
        }
    },
    SMITHY: {
        id: 'smithy',
        name: '鍛冶屋',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(3);
            game.log(`${player.name}はカードを3枚引きました`);
        }
    },
    THRONE_ROOM: {
        id: 'throne_room',
        name: '玉座の間',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札のアクションカードを1枚選び、2回プレイしてもよい',
        count: 10,
        onPlay: (player, game, throneRoom) => {
            const actionCards = player.hand.filter(isAction);
            if (actionCards.length === 0) {
                game.log(`${player.name}の手札にアクションカードがありませんでした`);
                return;
            }
            game.promptSelect({
                player,
                cards: actionCards,
                max: 1,
                title: '玉座の間',
                message: '2回プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '2回プレイする',
                purpose: 'throne-room',
                callback: ([index]) => {
                    if (index === undefined) return;
                    const chosen = actionCards[index];
                    player.hand.splice(player.hand.indexOf(chosen), 1);
                    player.playArea.push(chosen);
                    game.log(`${player.name}は玉座の間で${chosen.name}を2回プレイします`);
                    game.runNext(
                        () => chosen.play(player, game),
                        () => {
                            game.log(`${player.name}は${chosen.name}をもう一度プレイしました`);
                            chosen.play(player, game);
                        },
                        // 持続カードが場に残るなら、玉座の間も一緒に残す
                        () => {
                            if (player.hasPendingDuration(chosen)) player.addDuration(throneRoom, null);
                        }
                    );
                }
            });
        }
    },

    // ===== コスト5 =====
    BANDIT: {
        id: 'bandit',
        name: '山賊',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '金貨を1枚獲得する。他のプレイヤーは山札の上から2枚を公開し、銅貨以外の財宝を1枚廃棄して、残りを捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            if (game.gainCardFromSupply(player, 'gold')) {
                game.log(`${player.name}は金貨を獲得しました`);
            }
            game.attackOtherPlayers(player, (target) => {
                const revealed = [target.takeTopCard(), target.takeTopCard()].filter(Boolean);
                if (revealed.length === 0) {
                    game.log(`${target.name}の山札にはカードがありませんでした`);
                    return;
                }
                game.log(`${target.name}は${revealed.map(card => card.name).join('と')}を公開しました`);
                
                const trashTreasure = (trashed) => {
                    game.discardCards(target, revealed.filter(card => card !== trashed));
                    if (!trashed) return;
                    game.trashCard(target, trashed);
                    game.log(`${target.name}は${trashed.name}を廃棄しました`);
                };
                
                const treasures = revealed.filter(card => isTreasure(card) && card.id !== 'copper');
                if (treasures.length <= 1 || treasures[0].id === treasures[1].id) {
                    trashTreasure(treasures[0] ?? null);
                    return;
                }
                // 廃棄する財宝は攻撃を受けたプレイヤーが選ぶ
                game.promptSelect({
                    player: target,
                    cards: treasures,
                    min: 1,
                    max: 1,
                    title: '山賊',
                    message: '廃棄する財宝を1枚選んでください。もう1枚は捨て札になります。',
                    confirmLabel: '廃棄する',
                    purpose: 'bandit-trash',
                    callback: ([index]) => trashTreasure(treasures[index])
                });
            });
        }
    },
    COUNCIL_ROOM: {
        id: 'council_room',
        name: '議事堂',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを4枚引く。購入 +1。他のプレイヤーはカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(4);
            player.buys += 1;
            game.log(`${player.name}はカードを4枚引き、購入+1を得ました`);
            game.getOtherPlayers(player).forEach(other => {
                other.drawCards(1);
                game.log(`${other.name}はカードを1枚引きました`);
            });
        }
    },
    FESTIVAL: {
        id: 'festival',
        name: '祝祭',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +2。購入 +1。財宝 +2',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 2;
            player.buys += 1;
            player.coins += 2;
            game.log(`${player.name}はアクション+2、購入+1、財宝+2を得ました`);
        }
    },
    LABORATORY: {
        id: 'laboratory',
        name: '研究所',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            player.actions += 1;
            game.log(`${player.name}はカードを2枚引き、アクション+1を得ました`);
        }
    },
    LIBRARY: {
        id: 'library',
        name: '書庫',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札が7枚になるまでカードを引く。引いたアクションカードは脇に置いてもよく、最後に捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            const setAside = [];
            
            const finish = () => {
                if (setAside.length > 0) {
                    game.discardCards(player, setAside);
                    game.log(`${player.name}は脇に置いた${setAside.map(card => card.name).join('・')}を捨て札にしました`);
                }
                game.log(`${player.name}は手札が${player.hand.length}枚になるまで引きました`);
            };
            
            // 1枚ずつ引き、アクションカードなら脇に置くかを決めてから次を引く
            const drawStep = () => {
                if (player.hand.length >= 7) return finish();
                const card = player.takeTopCard();
                if (!card) return finish();
                
                if (!isAction(card)) {
                    player.hand.push(card);
                    game.runNext(drawStep);
                    return;
                }
                game.promptConfirm({
                    player,
                    card,
                    title: '書庫',
                    message: `${card.name}を引きました。脇に置きますか？（脇に置くと手札に加えず、代わりに次のカードを引きます）`,
                    yesLabel: '脇に置く',
                    noLabel: '手札に加える',
                    purpose: 'library-skip',
                    callback: (skip) => {
                        if (skip) {
                            setAside.push(card);
                        } else {
                            player.hand.push(card);
                        }
                        game.runNext(drawStep);
                    }
                });
            };
            
            game.runNext(drawStep);
        }
    },
    MARKET: {
        id: 'market',
        name: '市場',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            player.buys += 1;
            player.coins += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1、購入+1、財宝+1を得ました`);
        }
    },
    MINE: {
        id: 'mine',
        name: '鉱山',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札の財宝を1枚廃棄してもよい。廃棄した財宝よりコストが最大3多い財宝を1枚獲得し、手札に加える',
        count: 10,
        onPlay: (player, game) => {
            const treasures = player.hand.filter(isTreasure);
            if (treasures.length === 0) {
                game.log(`${player.name}の手札に財宝がありませんでした`);
                return;
            }
            game.promptSelect({
                player,
                cards: treasures,
                max: 1,
                title: '鉱山',
                message: '廃棄する財宝を1枚選んでください（選ばなくてもかまいません）。',
                confirmLabel: '廃棄する',
                purpose: 'mine-trash',
                callback: ([index]) => {
                    if (index === undefined) return;
                    const trashed = treasures[index];
                    game.trashFromHand(player, [player.hand.indexOf(trashed)]);
                    game.log(`${player.name}は${trashed.name}を廃棄しました`);
                    const maxCost = game.getCost(trashed) + 3;
                    game.promptGain({
                        player,
                        maxCost,
                        ...game.costExtras(trashed),
                        filter: (data) => data.types.includes(CARD_TYPES.TREASURE),
                        destination: 'hand',
                        title: '鉱山',
                        message: `コスト${maxCost}以下の財宝を1枚選んでください。手札に加えます。`
                    });
                }
            });
        }
    },
    SENTRY: {
        id: 'sentry',
        name: '衛兵',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の上から2枚を見て、好きな枚数を廃棄・捨て札にし、残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
            const revealed = [player.takeTopCard(), player.takeTopCard()].filter(Boolean);
            if (revealed.length === 0) return;
            
            // 選ばれなかったカードを残す
            const without = (cards, indices) => cards.filter((card, index) => !indices.includes(index));
            
            // 残ったカードを山札の上に戻す（2枚なら一番上に置くカードを選ぶ）
            const putBack = (cards) => {
                if (cards.length === 0) return;
                if (cards.length === 1 || cards[0].id === cards[1].id) {
                    player.deck.unshift(...cards);
                    game.log(`${player.name}はカードを${cards.length}枚山札の上に戻しました`);
                    return;
                }
                game.promptSelect({
                    player,
                    cards,
                    min: 1,
                    max: 1,
                    title: '衛兵',
                    message: '山札の一番上に置くカードを選んでください。もう1枚はその下に置きます。',
                    confirmLabel: '一番上に置く',
                    purpose: 'sentry-top',
                    callback: ([index]) => {
                        player.deck.unshift(cards[index], cards[1 - index]);
                        game.log(`${player.name}はカードを2枚山札の上に戻しました`);
                    }
                });
            };
            
            const chooseDiscard = (cards) => {
                if (cards.length === 0) return;
                game.promptSelect({
                    player,
                    cards,
                    title: '衛兵',
                    message: '捨て札にするカードを選んでください。残りは山札の上に戻します。',
                    confirmLabel: '捨て札にする',
                    purpose: 'sentry-discard',
                    callback: (indices) => {
                        game.discardCards(player, indices.map(index => cards[index]));
                        if (indices.length > 0) {
                            game.log(`${player.name}は${indices.map(index => cards[index].name).join('と')}を捨て札にしました`);
                        }
                        putBack(without(cards, indices));
                    }
                });
            };
            
            game.promptSelect({
                player,
                cards: revealed,
                title: '衛兵',
                message: '山札の上から見たカードです。廃棄するカードを選んでください。',
                confirmLabel: '廃棄する',
                purpose: 'sentry-trash',
                callback: (indices) => {
                    indices.forEach(index => game.trashCard(player, revealed[index]));
                    if (indices.length > 0) {
                        game.log(`${player.name}は${indices.map(index => revealed[index].name).join('と')}を廃棄しました`);
                    }
                    chooseDiscard(without(revealed, indices));
                }
            });
        }
    },
    WITCH: {
        id: 'witch',
        name: '魔女',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。他のプレイヤーは呪いカードを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
            game.attackOtherPlayers(player, (target) => game.gainCurse(target));
        }
    },

    // ===== コスト6 =====
    ARTISAN: {
        id: 'artisan',
        name: '職人',
        cost: 6,
        types: [CARD_TYPES.ACTION],
        description: 'コスト5以下のカードを1枚獲得し、手札に加える。手札のカードを1枚、山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            game.promptGain({
                player,
                maxCost: 5,
                destination: 'hand',
                title: '職人',
                message: 'コスト5以下のカードを1枚選んでください。手札に加えます。'
            });
            // 獲得が終わってから、手札のカードを山札の上に置く
            game.runNext(() => {
                if (player.hand.length === 0) return;
                game.promptSelect({
                    player,
                    cards: player.hand,
                    min: 1,
                    max: 1,
                    title: '職人',
                    message: '山札の上に置くカードを手札から1枚選んでください。',
                    confirmLabel: '山札の上に置く',
                    purpose: 'artisan-topdeck',
                    callback: ([index]) => {
                        const [card] = player.hand.splice(index, 1);
                        player.deck.unshift(card);
                        game.log(`${player.name}は${card.name}を山札の上に置きました`);
                    }
                });
            });
        }
    }
};

// 収録セットを書き込んだ王国カード
const withSet = (cards, set) =>
    Object.fromEntries(Object.entries(cards).map(([key, data]) => [key, { ...data, set }]));

export const KINGDOM_CARDS = {
    ...withSet(BASE_KINGDOM_CARDS, CARD_SETS.BASE),
    ...withSet(INTRIGUE_CARDS, CARD_SETS.INTRIGUE),
    ...withSet(SEASIDE_CARDS, CARD_SETS.SEASIDE),
    ...withSet(PROSPERITY_CARDS, CARD_SETS.PROSPERITY),
    ...withSet(HINTERLANDS_CARDS, CARD_SETS.HINTERLANDS),
    ...withSet(CORNUCOPIA_GUILDS_CARDS, CARD_SETS.CORNUCOPIA_GUILDS),
    ...withSet(ALCHEMY_CARDS, CARD_SETS.ALCHEMY),
    ...withSet(DARK_AGES_CARDS, CARD_SETS.DARK_AGES),
    ...withSet(ADVENTURES_CARDS, CARD_SETS.ADVENTURES),
    ...withSet(EMPIRES_CARDS, CARD_SETS.EMPIRES)
};

// 王国カード以外で、一部のゲームだけで使うカード（白金貨・植民地・ポーション・褒賞・騎士・廃墟・避難所など）
export const EXTRA_CARDS = {
    ...withSet(PROSPERITY_BASIC_CARDS, CARD_SETS.PROSPERITY),
    ...withSet(ALCHEMY_BASIC_CARDS, CARD_SETS.ALCHEMY),
    ...withSet({ ...KNIGHT_CARDS, ...RUINS_CARDS, ...SHELTER_CARDS, ...DARK_AGES_NON_SUPPLY_CARDS, ...RUINS_PILE }, CARD_SETS.DARK_AGES),
    ...withSet(TRAVELLER_CARDS, CARD_SETS.ADVENTURES),
    ...withSet({ ...EMPIRES_PILE_CARDS, ...CASTLE_CARDS }, CARD_SETS.EMPIRES),
    ...withSet(REWARD_CARDS, CARD_SETS.CORNUCOPIA_GUILDS)
};

// イベントなど、カードではない横長の札（ランドスケープ）
export const LANDSCAPES = {
    ...withSet(ADVENTURES_EVENTS, CARD_SETS.ADVENTURES),
    ...withSet({ ...EMPIRES_EVENTS, ...EMPIRES_LANDMARKS }, CARD_SETS.EMPIRES)
};

// 廃墟のカードID（小文字。廃墟の山にはこれを10枚ずつ混ぜる）
export const RUINS_CARD_IDS = Object.values(RUINS_CARDS).map(data => data.id);

// 褒賞のカードID（小文字）
export const REWARD_CARD_IDS = Object.values(REWARD_CARDS).map(data => data.id);

// 全カードデータの結合
export const ALL_CARDS = { ...BASIC_CARDS, ...EXTRA_CARDS, ...KINGDOM_CARDS };

// カードIDの配列を生成
export const ALL_CARD_IDS = Object.keys(ALL_CARDS);
export const BASIC_CARD_IDS = Object.keys(BASIC_CARDS);
export const KINGDOM_CARD_IDS = Object.keys(KINGDOM_CARDS);

// 指定したセットの王国カードのID（大文字）
export const getKingdomCardIds = (sets) => KINGDOM_CARD_IDS.filter(id => sets.includes(KINGDOM_CARDS[id].set));