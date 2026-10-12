/**
 * 拡張「海辺」（第2版）の王国カードデータ
 * 持続カードは player.addDuration(card, effect) で登録すると次のターンの開始時まで場に残り、
 * 開始時に effect が実行される（effect が null なら場に残るだけ）
 */

import { CARD_TYPES } from './card-types.js';

// 手札のカードを1枚選ばせる共通の選択（手札がなければ何もしない）
const promptOneFromHand = (game, player, { title, message, confirmLabel, purpose, min = 1, callback }) => {
    if (player.hand.length === 0) return;
    game.promptSelect({ player, cards: player.hand, min, max: 1, title, message, confirmLabel, purpose, callback });
};

// 手札を指定枚数捨てさせる（手札が足りなければ全部）
const promptDiscard = (game, player, count, title) => {
    const discardCount = Math.min(count, player.hand.length);
    if (discardCount === 0) return;
    game.promptSelect({
        player,
        cards: player.hand,
        min: discardCount,
        max: discardCount,
        title,
        message: `捨てるカードを${discardCount}枚選んでください。`,
        confirmLabel: '捨てる',
        purpose: 'discard-down',
        callback: (indices) => {
            game.discardFromHand(player, indices);
            game.log(`${player.name}は手札を${indices.length}枚捨てました`);
        }
    });
};

export const SEASIDE_CARDS = {
    // ===== コスト2 =====
    HAVEN: {
        id: 'haven',
        name: '停泊所',
        cost: 2,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを1枚引く。アクション +1。手札のカードを1枚脇に置き、次のターンの開始時に手札に加える',
        count: 10,
        onPlay: (player, game, haven) => {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
            promptOneFromHand(game, player, {
                title: '停泊所',
                message: '次のターンまで脇に置くカードを1枚選んでください。',
                confirmLabel: '脇に置く',
                purpose: 'haven',
                callback: ([index]) => {
                    const [card] = player.hand.splice(index, 1);
                    player.setAside.push(card);
                    game.log(`${player.name}はカードを1枚脇に置きました`);
                    player.addDuration(haven, () => {
                        player.setAside.splice(player.setAside.indexOf(card), 1);
                        player.hand.push(card);
                        game.log(`${player.name}は脇に置いた${card.name}を手札に加えました`);
                    });
                }
            });
        }
    },
    LIGHTHOUSE: {
        id: 'lighthouse',
        name: '灯台',
        cost: 2,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +1。財宝 +1。次のターンの開始時に財宝 +1。このカードが場にある間、他のプレイヤーの攻撃を受けない',
        count: 10,
        onPlay: (player, game, card) => {
            player.actions += 1;
            player.coins += 1;
            game.log(`${player.name}はアクション+1、財宝+1を得ました`);
            player.addDuration(card, () => {
                player.coins += 1;
                game.log(`${player.name}は灯台の効果で財宝+1を得ました`);
            });
        }
    },
    NATIVE_VILLAGE: {
        id: 'native_village',
        name: '原住民の村',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +2。山札の一番上を原住民の村マットに置くか、マットのカードをすべて手札に加える',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 2;
            game.log(`${player.name}はアクション+2を得ました`);
            const mat = player.mats.nativeVillage;

            const putOnMat = () => {
                const card = player.takeTopCard();
                if (!card) return;
                mat.push(card);
                game.log(`${player.name}は山札の一番上を原住民の村マットに置きました`);
            };
            if (mat.length === 0) {
                putOnMat();
                return;
            }
            game.promptConfirm({
                player,
                title: '原住民の村',
                message: `マットのカード：${mat.map(card => card.name).join('・')}`,
                yesLabel: '山札の上をマットに置く',
                noLabel: `マットの${mat.length}枚を手札に加える`,
                purpose: 'native-village',
                callback: (put) => {
                    if (put) {
                        putOnMat();
                        return;
                    }
                    player.hand.push(...mat.splice(0));
                    game.log(`${player.name}は原住民の村マットのカードを手札に加えました`);
                }
            });
        }
    },

    // ===== コスト3 =====
    ASTROLABE: {
        id: 'astrolabe',
        name: 'アストロラーベ',
        cost: 3,
        types: [CARD_TYPES.TREASURE, CARD_TYPES.DURATION],
        value: 1,
        description: '財宝 +1。購入 +1。次のターンの開始時に財宝 +1、購入 +1',
        count: 10,
        onPlay: (player, game, card) => {
            // 財宝 +1 はほかの財宝と同じく value で数える
            player.buys += 1;
            player.addDuration(card, () => {
                player.coins += 1;
                player.buys += 1;
                game.log(`${player.name}はアストロラーベの効果で財宝+1、購入+1を得ました`);
            });
        }
    },
    FISHING_VILLAGE: {
        id: 'fishing_village',
        name: '漁村',
        cost: 3,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +2。財宝 +1。次のターンの開始時にアクション +1、財宝 +1',
        count: 10,
        onPlay: (player, game, card) => {
            player.actions += 2;
            player.coins += 1;
            game.log(`${player.name}はアクション+2、財宝+1を得ました`);
            player.addDuration(card, () => {
                player.actions += 1;
                player.coins += 1;
                game.log(`${player.name}は漁村の効果でアクション+1、財宝+1を得ました`);
            });
        }
    },
    LOOKOUT: {
        id: 'lookout',
        name: '見張り',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。山札の上から3枚を見て、1枚を廃棄し、1枚を捨て札にし、残り1枚を山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 1;
            game.log(`${player.name}はアクション+1を得ました`);
            const revealed = [player.takeTopCard(), player.takeTopCard(), player.takeTopCard()].filter(Boolean);
            if (revealed.length === 0) return;

            const chooseDiscard = (cards) => {
                if (cards.length === 0) return;
                game.promptSelect({
                    player,
                    cards,
                    min: 1,
                    max: 1,
                    title: '見張り',
                    message: '捨て札にするカードを1枚選んでください。残りは山札の上に戻します。',
                    confirmLabel: '捨て札にする',
                    purpose: 'lookout-discard',
                    callback: ([index]) => {
                        game.log(`${player.name}は${cards[index].name}を捨て札にしました`);
                        player.deck.unshift(...cards.filter((card, i) => i !== index));
                        game.discardCards(player, [cards[index]]);
                    }
                });
            };

            game.promptSelect({
                player,
                cards: revealed,
                min: 1,
                max: 1,
                title: '見張り',
                message: '山札の上から見たカードです。廃棄するカードを1枚選んでください。',
                confirmLabel: '廃棄する',
                purpose: 'lookout-trash',
                callback: ([index]) => {
                    game.trashCard(player, revealed[index]);
                    game.log(`${player.name}は${revealed[index].name}を廃棄しました`);
                    chooseDiscard(revealed.filter((card, i) => i !== index));
                }
            });
        }
    },
    MONKEY: {
        id: 'monkey',
        name: '猿',
        cost: 3,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンまで、右隣のプレイヤーがカードを獲得するたびにカードを1枚引く。次のターンの開始時にカードを1枚引く',
        count: 10,
        onPlay: (player, game, card) => {
            player.monkeys += 1;
            player.addDuration(card, () => {
                player.drawCards(1);
                game.log(`${player.name}は猿の効果でカードを1枚引きました`);
            });
        }
    },
    SEA_CHART: {
        id: 'sea_chart',
        name: '海図',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、同じカードが場にあれば手札に加える',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
            const card = player.takeTopCard();
            if (!card) return;
            if (player.playArea.some(played => played.id === card.id)) {
                player.hand.push(card);
                game.log(`${player.name}は${card.name}を公開し、手札に加えました`);
            } else {
                player.deck.unshift(card);
                game.log(`${player.name}は${card.name}を公開し、山札に戻しました`);
            }
        }
    },
    SMUGGLERS: {
        id: 'smugglers',
        name: '密輸人',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '右隣のプレイヤーが直前のターンに獲得したカードのうち、コスト6以下のものと同じカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            const right = game.getPlayerToRight(player);
            const gained = new Set(right.gainedLastTurn);
            game.promptGain({
                player,
                maxCost: 6,
                filter: (data) => gained.has(data.id),
                title: '密輸人',
                message: `${right.name}が直前のターンに獲得したカードから1枚選んでください。`
            });
        }
    },
    WAREHOUSE: {
        id: 'warehouse',
        name: '倉庫',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。アクション +1。手札を3枚捨てる',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(3);
            player.actions += 1;
            game.log(`${player.name}はカードを3枚引き、アクション+1を得ました`);
            promptDiscard(game, player, 3, '倉庫');
        }
    },

    // ===== コスト4 =====
    BLOCKADE: {
        id: 'blockade',
        name: '封鎖',
        cost: 4,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'コスト4以下のカードを1枚獲得して脇に置き、次のターンの開始時に手札に加える。それまで、他のプレイヤーが自分のターンにそのカードを獲得すると呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game, blockade) => {
            const victims = new Set();
            game.promptGain({
                player,
                maxCost: 4,
                destination: 'setAside',
                title: '封鎖',
                message: 'コスト4以下のカードを1枚選んでください。次のターンに手札に加えます。',
                onGained: (card) => {
                    player.blockades.push({ cardId: card.id, victims });
                    player.addDuration(blockade, () => {
                        const index = player.setAside.indexOf(card);
                        if (index < 0) return;
                        player.setAside.splice(index, 1);
                        player.hand.push(card);
                        game.log(`${player.name}は脇に置いた${card.name}を手札に加えました`);
                    });
                }
            });
            game.attackOtherPlayers(player, (target) => victims.add(target));
        }
    },
    CARAVAN: {
        id: 'caravan',
        name: '隊商',
        cost: 4,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを1枚引く。アクション +1。次のターンの開始時にカードを1枚引く',
        count: 10,
        onPlay: (player, game, card) => {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
            player.addDuration(card, () => {
                player.drawCards(1);
                game.log(`${player.name}は隊商の効果でカードを1枚引きました`);
            });
        }
    },
    CUTPURSE: {
        id: 'cutpurse',
        name: '巾着切り',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。他のプレイヤーは手札の銅貨を1枚捨てる（なければ手札を公開する）',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            game.attackOtherPlayers(player, (target) => {
                const index = target.hand.findIndex(card => card.id === 'copper');
                if (index < 0) {
                    game.log(`${target.name}は手札を公開しました（銅貨はありません）`);
                    return;
                }
                game.discardFromHand(target, [index]);
                game.log(`${target.name}は銅貨を1枚捨てました`);
            });
        }
    },
    ISLAND: {
        id: 'island',
        name: '島',
        cost: 4,
        types: [CARD_TYPES.ACTION, CARD_TYPES.VICTORY],
        points: 2,
        description: '勝利点 +2。このカードと手札のカード1枚を島マットに置く（マットのカードはゲーム終了まで使わない）',
        onPlay: (player, game, island) => {
            // 玉座の間で2回目にプレイしたときは、すでにマットにあるので手札のカードだけを置く
            const index = player.playArea.indexOf(island);
            if (index >= 0) {
                player.playArea.splice(index, 1);
                player.mats.island.push(island);
                game.log(`${player.name}は島を島マットに置きました`);
            }
            promptOneFromHand(game, player, {
                title: '島',
                message: '島マットに置くカードを1枚選んでください。',
                confirmLabel: '島マットに置く',
                purpose: 'island',
                callback: ([cardIndex]) => {
                    const [card] = player.hand.splice(cardIndex, 1);
                    player.mats.island.push(card);
                    game.log(`${player.name}は${card.name}を島マットに置きました`);
                }
            });
        }
    },
    SAILOR: {
        id: 'sailor',
        name: '船乗り',
        cost: 4,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +1。このターンに1回、持続カードを獲得したときにそれをプレイしてもよい。次のターンの開始時に財宝 +2、手札を1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game, card) => {
            player.actions += 1;
            player.sailorUses += 1;
            game.log(`${player.name}はアクション+1を得ました`);
            player.addDuration(card, () => {
                player.coins += 2;
                game.log(`${player.name}は船乗りの効果で財宝+2を得ました`);
                promptOneFromHand(game, player, {
                    min: 0,
                    title: '船乗り',
                    message: '廃棄するカードを1枚選んでください（選ばなくてもかまいません）。',
                    confirmLabel: '廃棄する',
                    purpose: 'sailor-trash',
                    callback: (indices) => {
                        const [trashed] = game.trashFromHand(player, indices);
                        if (trashed) game.log(`${player.name}は${trashed.name}を廃棄しました`);
                    }
                });
            });
        }
    },
    SALVAGER: {
        id: 'salvager',
        name: '引揚水夫',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。手札のカードを1枚廃棄し、そのコスト分の財宝を得る',
        count: 10,
        onPlay: (player, game) => {
            player.buys += 1;
            game.log(`${player.name}は購入+1を得ました`);
            promptOneFromHand(game, player, {
                title: '引揚水夫',
                message: '廃棄するカードを1枚選んでください。そのコスト分の財宝を得ます。',
                confirmLabel: '廃棄する',
                purpose: 'salvager-trash',
                callback: (indices) => {
                    const [trashed] = game.trashFromHand(player, indices);
                    const cost = game.getCost(trashed);
                    player.coins += cost;
                    game.log(`${player.name}は${trashed.name}を廃棄し、財宝+${cost}を得ました`);
                }
            });
        }
    },
    TIDE_POOLS: {
        id: 'tide_pools',
        name: '潮だまり',
        cost: 4,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを3枚引く。アクション +1。次のターンの開始時に手札を2枚捨てる',
        count: 10,
        onPlay: (player, game, card) => {
            player.drawCards(3);
            player.actions += 1;
            game.log(`${player.name}はカードを3枚引き、アクション+1を得ました`);
            player.addDuration(card, () => promptDiscard(game, player, 2, '潮だまり'));
        }
    },
    TREASURE_MAP: {
        id: 'treasure_map',
        name: '宝の地図',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'このカードと手札の宝の地図を1枚廃棄する。2枚廃棄したら、金貨を4枚獲得して山札の上に置く',
        count: 10,
        onPlay: (player, game, map) => {
            let trashed = 0;
            const index = player.playArea.indexOf(map);
            if (index >= 0) {
                player.playArea.splice(index, 1);
                game.trash.push(map);
                trashed++;
            }
            const handIndex = player.hand.findIndex(card => card.id === 'treasure_map');
            if (handIndex >= 0) {
                game.trashFromHand(player, [handIndex]);
                trashed++;
            }
            game.log(`${player.name}は宝の地図を${trashed}枚廃棄しました`);
            if (trashed < 2) return;

            let golds = 0;
            for (let i = 0; i < 4; i++) {
                if (game.gainCardFromSupply(player, 'gold', 'deck')) golds++;
            }
            game.log(`${player.name}は金貨を${golds}枚獲得し、山札の上に置きました`);
        }
    },

    // ===== コスト5 =====
    BAZAAR: {
        id: 'bazaar',
        name: 'バザー',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 2;
            player.coins += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+2、財宝+1を得ました`);
        }
    },
    CORSAIR: {
        id: 'corsair',
        name: '私掠船',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '財宝 +2。次のターンの開始時にカードを1枚引く。それまで、他のプレイヤーは各ターンに最初にプレイした銀貨か金貨を廃棄する',
        isAttack: true,
        count: 10,
        onPlay: (player, game, card) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            player.addDuration(card, () => {
                player.drawCards(1);
                game.log(`${player.name}は私掠船の効果でカードを1枚引きました`);
            });
            game.attackOtherPlayers(player, (target) => player.corsairVictims.add(target));
        }
    },
    MERCHANT_SHIP: {
        id: 'merchant_ship',
        name: '商船',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '財宝 +2。次のターンの開始時に財宝 +2',
        count: 10,
        onPlay: (player, game, card) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            player.addDuration(card, () => {
                player.coins += 2;
                game.log(`${player.name}は商船の効果で財宝+2を得ました`);
            });
        }
    },
    OUTPOST: {
        id: 'outpost',
        name: '前哨地',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次の手札は3枚だけ引く。このターンの後に追加のターンを行う（3ターン連続にはならない）',
        count: 10,
        onPlay: (player, game, card) => {
            if (game.isExtraTurn) {
                game.log('追加のターン中なので、前哨地の効果はありません');
                return;
            }
            player.outpostPending = true;
            player.addDuration(card, null);
            game.log(`${player.name}はこのターンの後に追加のターンを行います`);
        }
    },
    PIRATE: {
        id: 'pirate',
        name: '海賊',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '次のターンの開始時に、コスト6以下の財宝を1枚獲得して手札に加える。誰かが財宝を獲得したとき、手札のこのカードを自動でプレイする',
        reactsToTreasureGain: true,
        count: 10,
        onPlay: (player, game, card) => {
            player.addDuration(card, () => {
                game.promptGain({
                    player,
                    maxCost: 6,
                    filter: (data) => data.types.includes(CARD_TYPES.TREASURE),
                    destination: 'hand',
                    title: '海賊',
                    message: 'コスト6以下の財宝を1枚選んでください。手札に加えます。'
                });
            });
        }
    },
    SEA_WITCH: {
        id: 'sea_witch',
        name: '海の魔女',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを2枚引く。他のプレイヤーは呪いを1枚獲得する。次のターンの開始時にカードを2枚引き、手札を2枚捨てる',
        isAttack: true,
        count: 10,
        onPlay: (player, game, card) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
            player.addDuration(card, () => {
                player.drawCards(2);
                game.log(`${player.name}は海の魔女の効果でカードを2枚引きました`);
                promptDiscard(game, player, 2, '海の魔女');
            });
            game.attackOtherPlayers(player, (target) => game.gainCurse(target));
        }
    },
    TACTICIAN: {
        id: 'tactician',
        name: '策士',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '手札が1枚以上あれば手札をすべて捨て、次のターンの開始時にカードを5枚引き、アクション +1、購入 +1',
        count: 10,
        onPlay: (player, game, card) => {
            if (player.hand.length === 0) {
                game.log(`${player.name}の手札がないため、策士の効果はありません`);
                return;
            }
            game.log(`${player.name}は手札を${player.hand.length}枚すべて捨てました`);
            game.discardCards(player, player.hand.splice(0));
            player.addDuration(card, () => {
                player.drawCards(5);
                player.actions += 1;
                player.buys += 1;
                game.log(`${player.name}は策士の効果でカードを5枚引き、アクション+1、購入+1を得ました`);
            });
        }
    },
    TREASURY: {
        id: 'treasury',
        name: '宝物庫',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。このターンの購入フェーズで勝利点カードを獲得しなければ、ターンの終わりにこのカードを山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            player.coins += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1、財宝+1を得ました`);
        }
    },
    WHARF: {
        id: 'wharf',
        name: '波止場',
        cost: 5,
        types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを2枚引く。購入 +1。次のターンの開始時にカードを2枚引き、購入 +1',
        count: 10,
        onPlay: (player, game, card) => {
            player.drawCards(2);
            player.buys += 1;
            game.log(`${player.name}はカードを2枚引き、購入+1を得ました`);
            player.addDuration(card, () => {
                player.drawCards(2);
                player.buys += 1;
                game.log(`${player.name}は波止場の効果でカードを2枚引き、購入+1を得ました`);
            });
        }
    }
};
