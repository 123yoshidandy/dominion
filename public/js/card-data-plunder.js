/**
 * 拡張「略奪」の王国カードデータ、分捕り品、イベント、特性
 * - 分捕り品：15種を2枚ずつ混ぜたサプライ外の山（game.lootPile）。game.gainLoot で一番上を獲得する
 * - 「次に〜したとき」まで場に残る持続カードは game.addWait で登録し、きっかけが起きたら効果を使って場から離れる
 * - 特性（LANDSCAPES の kind: 'trait'）は、準備でアクションか財宝の山に1つずつ置く（game.traits。効果は game-plunder.js）
 */

import Card from './card.js';
import { CARD_TYPES, LANDSCAPE_KINDS } from './card-types.js';
import {
    isAction, names, gainBenefits, promptFromHand, promptTrashFromHand, promptDiscardFromHand,
    discardDownTo, takeTopCards, putBackInAnyOrder, logReveal, curseAttack
} from './card-helpers.js';

const { ACTION, TREASURE, DURATION, COMMAND, LOOT } = CARD_TYPES;
const { EVENT, TRAIT } = LANDSCAPE_KINDS;

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};

// 場のこのカードを取り除く（廃棄・山札に置くときなど）。場になければ false
const takeFromPlay = (player, card) => {
    const index = player.playArea.indexOf(card);
    if (index < 0) return false;
    player.playArea.splice(index, 1);
    return true;
};

// 場のこのカードを廃棄する
const trashFromPlay = (game, player, card) => {
    if (!takeFromPlay(player, card)) return false;
    game.trashCard(player, card);
    game.log(`${player.name}は${card.name}を廃棄しました`);
    return true;
};

// 手札のカードを脇に置き、ターンの終わりに手札に戻す（からくり箱・檻）
const returnToHandAtEndOfTurn = (game, player, cards) => {
    cards.forEach(card => game.turnState.endOfTurnToHand.push({ player, card }));
};

// 手札のカードを選んで脇に置く。callback には脇に置いたカードの配列が渡る
const setAsideFromHand = (game, player, { max, title, message, purpose, callback }) => {
    if (player.hand.length === 0) {
        callback([]);
        return;
    }
    promptFromHand(game, player, {
        min: 0, max, title, message, confirmLabel: '脇に置く', purpose,
        callback: (cards) => {
            cards.forEach(card => player.hand.splice(player.hand.indexOf(card), 1));
            player.setAside.push(...cards);
            if (cards.length > 0) game.log(`${player.name}はカードを${cards.length}枚脇に置きました`);
            callback(cards);
        }
    });
};

// 脇に置いたカードを手札に戻す
const takeSetAsideToHand = (game, player, cards, source) => {
    const back = cards.filter(card => player.setAside.includes(card));
    back.forEach(card => player.setAside.splice(player.setAside.indexOf(card), 1));
    player.hand.push(...back);
    if (back.length > 0) game.log(`${player.name}は${source}で脇に置いたカードを${back.length}枚手札に加えました`);
};

// 今すぐか、次のターンの開始時に効果を使う（ゴンドラ・アンフォラ）
const nowOrLater = (player, game, card, label, benefits) => game.promptConfirm({
    player, card, title: card.name, message: `${label}を今すぐ得ますか？（得ないなら、次のターンの開始時に得ます）`,
    yesLabel: '今すぐ得る', noLabel: '次のターンに得る', purpose: 'now-or-later',
    callback: (now) => {
        if (now) {
            gainBenefits(player, game, benefits, card.name);
            return;
        }
        player.addDuration(card, () => gainBenefits(player, game, benefits, card.name));
    }
});

// 手札を1枚廃棄し、それよりコストが2まで高いカードを獲得する（拡大）
const enlargeOnce = (player, game, source) => promptTrashFromHand(game, player, {
    title: source, message: '廃棄するカードを選んでください。そのカードよりコストが2まで高いカードを獲得します。', purpose: 'remodel-trash',
    callback: ([trashed]) => {
        if (!trashed) return;
        game.promptGain({
            player, maxCost: game.getCost(trashed) + 2, ...game.costExtras(trashed), title: source,
            message: `コスト${game.getCost(trashed) + 2}以下のカードを1枚獲得してください。`
        });
    }
});

// 獲得したカードをプレイしてよい（呪文の巻物）
const mayPlayGained = (player, game, card, source) => {
    if (!isAction(card) && !game.isTreasure(card)) return;
    game.promptConfirm({
        player, card, title: source, message: `獲得した${card.name}をプレイしますか？`, yesLabel: 'プレイする', noLabel: 'プレイしない',
        purpose: 'play-gained',
        callback: (yes) => {
            if (!yes || !player.getAllCards().includes(card) || player.playArea.includes(card)) return;
            if (isAction(card)) {
                game.playCardFrom(player, card);
            } else {
                game.log(`${player.name}は${card.name}をプレイしました`);
                game.playTreasure(player, card);
            }
        }
    });
};

// 場にある財宝の名前の種類の数（ペンダント・裕福な村）
const treasureNamesInPlay = (game, player) => new Set(player.playArea.filter(card => game.isTreasure(card)).map(card => card.id)).size;

export const PLUNDER_CARDS = {
    // ===== コスト2 =====
    CAGE: {
        id: 'cage', name: '檻', cost: 2, types: [TREASURE, DURATION],
        description: '手札を4枚まで、これの上に裏向きで脇に置く。次に勝利点カードを獲得したとき、これを廃棄し、脇に置いたカードをターンの終わりに手札に加える',
        count: 10,
        onPlay: (player, game, cage) => setAsideFromHand(game, player, {
            max: 4, title: '檻', message: '檻の上に脇に置くカードを4枚まで選んでください（選ばなくてもかまいません）。', purpose: 'cage-set-aside',
            callback: (cards) => game.addWait(player, cage, 'gainVictory', () => {
                trashFromPlay(game, player, cage);
                const held = cards.filter(card => player.setAside.includes(card));
                if (held.length === 0) return;
                returnToHandAtEndOfTurn(game, player, held);
                game.log(`${player.name}は檻のカードを${held.length}枚、ターンの終わりに手札に加えます`);
            })
        })
    },
    GROTTO: {
        id: 'grotto', name: '洞窟', cost: 2, types: [ACTION, DURATION],
        description: 'アクション +1。手札を4枚まで、これの上に裏向きで脇に置く。次のターンの開始時に、それらを捨て札にし、同じ枚数のカードを引く',
        count: 10,
        onPlay: (player, game, grotto) => {
            gainBenefits(player, game, { actions: 1 });
            setAsideFromHand(game, player, {
                max: 4, title: '洞窟', message: '洞窟の上に脇に置くカードを4枚まで選んでください。次のターンの開始時に捨て札にして、同じ枚数を引きます。',
                purpose: 'grotto-set-aside',
                callback: (cards) => player.addDuration(grotto, () => {
                    const held = cards.filter(card => player.setAside.includes(card));
                    held.forEach(card => player.setAside.splice(player.setAside.indexOf(card), 1));
                    game.discardCards(player, held);
                    if (held.length > 0) gainBenefits(player, game, { cards: held.length }, '洞窟');
                })
            });
        }
    },
    JEWELLED_EGG: {
        id: 'jewelled_egg', name: '宝石の卵', cost: 2, types: [TREASURE],
        value: 1,
        description: '財宝1。購入 +1。これを廃棄したとき、分捕り品を1枚獲得する',
        count: 10,
        usesLoot: true,
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1 }),
        onTrash: (player, game) => game.gainLoot(player)
    },
    SEARCH: {
        id: 'search', name: '捜索', cost: 2, types: [ACTION, DURATION],
        description: '財宝 +2。次にサプライの山が空になったとき、これを廃棄し、分捕り品を1枚獲得する',
        count: 10,
        usesLoot: true,
        onPlay: (player, game, search) => {
            gainBenefits(player, game, { coins: 2 });
            game.addWait(player, search, 'pileEmpty', () => {
                if (trashFromPlay(game, player, search)) game.gainLoot(player);
            });
        }
    },
    SHAMAN: {
        id: 'shaman', name: 'シャーマン', cost: 2, types: [ACTION],
        description: 'アクション +1。財宝 +1。手札を1枚廃棄してもよい。このカードを使うゲームでは、各プレイヤーはターンの開始時に、廃棄置き場からコスト6以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, coins: 1 });
            promptTrashFromHand(game, player, {
                min: 0, title: 'シャーマン', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash'
            });
        }
    },

    // ===== コスト3 =====
    SECLUDED_SHRINE: {
        id: 'secluded_shrine', name: '人里離れた祠', cost: 3, types: [ACTION, DURATION],
        description: '財宝 +1。次に財宝を獲得したとき、手札を2枚まで廃棄する',
        count: 10,
        onPlay: (player, game, shrine) => {
            gainBenefits(player, game, { coins: 1 });
            game.addWait(player, shrine, 'gainTreasure', () => {
                promptTrashFromHand(game, player, {
                    min: 0, max: 2, title: '人里離れた祠', message: '廃棄するカードを2枚まで選んでください（選ばなくてもかまいません）。', purpose: 'sentinel-trash'
                });
            });
        }
    },
    SIREN: {
        id: 'siren', name: 'セイレーン', cost: 3, types: [ACTION, DURATION],
        description: '他のプレイヤーは呪いを1枚獲得する。次のターンの開始時に、手札が8枚になるまで引く。これを獲得したとき、手札のアクションカードを1枚廃棄しなければ、これを廃棄する',
        isAttack: true,
        count: 10,
        onPlay: (player, game, siren) => {
            curseAttack(game, player);
            player.addDuration(siren, () => {
                const count = 8 - player.hand.length;
                if (count > 0) gainBenefits(player, game, { cards: count }, 'セイレーン');
            });
        },
        onGain: (player, game, siren) => promptTrashFromHand(game, player, {
            min: 0, filter: isAction, title: 'セイレーン',
            message: '手札のアクションカードを1枚廃棄してください。廃棄しなければ、セイレーンを廃棄します。', purpose: 'siren-trash',
            callback: (trashed) => {
                if (trashed.length > 0 || !player.removeCard(siren)) return;
                game.trashCard(player, siren);
                game.log(`${player.name}はセイレーンを廃棄しました`);
            }
        })
    },
    STOWAWAY: {
        id: 'stowaway', name: '密航者', cost: 3, types: [ACTION, DURATION],
        description: '次のターンの開始時に、カード +2。誰かが持続カードを獲得したとき、これを手札からプレイしてもよい',
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game, stowaway) => player.addDuration(stowaway, () => gainBenefits(player, game, { cards: 2 }, '密航者'))
    },
    TASKMASTER: {
        id: 'taskmaster', name: '監督', cost: 3, types: [ACTION, DURATION],
        description: 'アクション +1。財宝 +1。このターンにちょうどコスト5のカードを獲得したら、次のターンの開始時に、この効果をもう一度使う',
        count: 10,
        onPlay: (player, game, taskmaster) => {
            gainBenefits(player, game, { actions: 1, coins: 1 });
            game.turnState.taskmasters.push(taskmaster);
        }
    },

    // ===== コスト4 =====
    ABUNDANCE: {
        id: 'abundance', name: '豊穣', cost: 4, types: [TREASURE, DURATION],
        description: '次にアクションカードを獲得したとき、購入 +1、財宝 +3',
        count: 10,
        onPlay: (player, game, abundance) => game.addWait(player, abundance, 'gainAction', () => {
            gainBenefits(player, game, { buys: 1, coins: 3 }, '豊穣');
        })
    },
    CABIN_BOY: {
        id: 'cabin_boy', name: '給仕', cost: 4, types: [ACTION, DURATION],
        description: 'カードを1枚引く。アクション +1。次のターンの開始時に、1つを選ぶ：財宝 +2、これを廃棄して持続カードを1枚獲得する',
        count: 10,
        onPlay: (player, game, boy) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            player.addDuration(boy, () => game.promptChoose({
                player, card: boy, options: ['財宝 +2', '給仕を廃棄して、持続カードを1枚獲得する'], title: '給仕', message: '1つを選んでください。',
                purpose: 'cabin-boy',
                callback: ([index]) => {
                    if (index === 0) {
                        gainBenefits(player, game, { coins: 2 }, '給仕');
                        return;
                    }
                    if (!trashFromPlay(game, player, boy)) return;
                    game.promptGain({
                        player, filter: (data) => data.types.includes(DURATION), title: '給仕', message: '持続カードを1枚獲得してください。'
                    });
                }
            }));
        }
    },
    CRUCIBLE: {
        id: 'crucible', name: 'るつぼ', cost: 4, types: [TREASURE],
        description: '手札を1枚廃棄する。そのコスト1につき、財宝 +1',
        count: 10,
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            title: 'るつぼ', message: '廃棄するカードを選んでください。コスト1につき財宝 +1 を得ます。', purpose: 'crucible-trash',
            callback: ([trashed]) => {
                if (trashed && game.getCost(trashed) > 0) gainBenefits(player, game, { coins: game.getCost(trashed) }, 'るつぼ');
            }
        })
    },
    FLAGSHIP: {
        id: 'flagship', name: '旗艦', cost: 4, types: [ACTION, DURATION, COMMAND],
        description: '財宝 +2。次に命令でないアクションカードをプレイしたとき、それをもう一度プレイする',
        count: 10,
        onPlay: (player, game, flagship) => {
            gainBenefits(player, game, { coins: 2 });
            game.addWait(player, flagship, 'playAction', (played) => {
                game.log(`${player.name}は旗艦で${played.name}をもう一度プレイしました`);
                played.play(player, game);
            });
        }
    },
    FORTUNE_HUNTER: {
        id: 'fortune_hunter', name: '富の探求者', cost: 4, types: [ACTION],
        description: '財宝 +2。山札の上から3枚を見る。その中の財宝を1枚プレイしてもよい。残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            const cards = takeTopCards(player, 3);
            if (cards.length === 0) return;
            const treasures = cards.filter(card => game.isTreasure(card));
            const putBack = (rest) => putBackInAnyOrder(game, player, rest, '富の探求者');
            if (treasures.length === 0) {
                putBack(cards);
                return;
            }
            game.promptSelect({
                player, cards: treasures, min: 0, max: 1, title: '富の探求者',
                message: `山札の上の3枚（${names(cards)}）から、プレイする財宝を選んでください（選ばなくてもかまいません）。`,
                confirmLabel: 'プレイする', purpose: 'fortune-hunter',
                callback: ([index]) => {
                    const chosen = treasures[index];
                    game.runNext(() => putBack(cards.filter(card => card !== chosen)));
                    if (!chosen) return;
                    game.log(`${player.name}は${chosen.name}をプレイしました`);
                    game.playTreasure(player, chosen);
                }
            });
        }
    },
    GONDOLA: {
        id: 'gondola', name: 'ゴンドラ', cost: 4, types: [TREASURE, DURATION],
        description: '今すぐか次のターンの開始時に、財宝 +2。これを獲得したとき、手札のアクションカードを1枚プレイしてもよい',
        count: 10,
        onPlay: (player, game, gondola) => nowOrLater(player, game, gondola, '財宝 +2', { coins: 2 }),
        onGain: (player, game) => promptFromHand(game, player, {
            min: 0, filter: isAction, title: 'ゴンドラ', message: 'プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
            confirmLabel: 'プレイする', purpose: 'play-new-action',
            callback: ([card]) => { if (card) game.playCardFrom(player, card); }
        })
    },
    HARBOR_VILLAGE: {
        id: 'harbor_village', name: '港村', cost: 4, types: [ACTION],
        description: 'カードを1枚引く。アクション +2。このターン次にプレイしたアクションで財宝が増えたら、その後に財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            game.turnState.harborVillages++;
        }
    },
    LANDING_PARTY: {
        id: 'landing_party', name: '上陸部隊', cost: 4, types: [ACTION, DURATION],
        description: 'カードを2枚引く。アクション +2。次にターンの最初にプレイしたカードが財宝だったら、その後でこれを山札の上に置く',
        count: 10,
        onPlay: (player, game, party) => {
            gainBenefits(player, game, { cards: 2, actions: 2 });
            game.addWait(player, party, 'firstTreasure', () => {
                if (!takeFromPlay(player, party)) return;
                player.deck.unshift(party);
                game.log(`${player.name}は上陸部隊を山札の上に置きました`);
            });
        }
    },
    MAPMAKER: {
        id: 'mapmaker', name: '地図作り', cost: 4, types: [ACTION],
        description: '山札の上から4枚を見る。そのうち2枚を手札に加え、残りを捨て札にする。誰かが勝利点カードを獲得したとき、これを手札からプレイしてもよい',
        reactionType: 'gain',
        count: 10,
        onPlay: (player, game) => {
            const cards = takeTopCards(player, 4);
            if (cards.length === 0) return;
            const take = Math.min(2, cards.length);
            game.promptSelect({
                player, cards, min: take, max: take, title: '地図作り', message: `手札に加えるカードを${take}枚選んでください。残りは捨て札にします。`,
                confirmLabel: '手札に加える', purpose: 'mapmaker',
                callback: (indices) => {
                    const taken = indices.map(index => cards[index]);
                    player.hand.push(...taken);
                    game.discardCards(player, cards.filter(card => !taken.includes(card)));
                    game.log(`${player.name}は${names(taken)}を手札に加え、残りを捨て札にしました`);
                }
            });
        }
    },
    MAROON: {
        id: 'maroon', name: '島流し', cost: 4, types: [ACTION],
        description: '手札を1枚廃棄する。その種類1つにつき、カード +2',
        count: 10,
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            title: '島流し', message: '廃棄するカードを選んでください。種類1つにつきカードを2枚引きます。', purpose: 'maroon-trash',
            callback: ([trashed]) => {
                if (trashed) gainBenefits(player, game, { cards: 2 * trashed.types.length }, '島流し');
            }
        })
    },
    ROPE: {
        id: 'rope', name: 'ロープ', cost: 4, types: [TREASURE, DURATION],
        value: 1,
        description: '財宝1。購入 +1。次のターンの開始時に、カードを1枚引き、手札を1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game, rope) => {
            gainBenefits(player, game, { buys: 1 });
            player.addDuration(rope, () => {
                gainBenefits(player, game, { cards: 1 }, 'ロープ');
                promptTrashFromHand(game, player, {
                    min: 0, title: 'ロープ', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash'
                });
            });
        }
    },
    SWAMP_SHACKS: {
        id: 'swamp_shacks', name: '沼地の小屋', cost: 4, types: [ACTION],
        description: 'アクション +2。場のカード3枚につき、カード +1（端数は切り捨て）',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { actions: 2, cards: Math.floor(player.playArea.length / 3) })
    },
    TOOLS: {
        id: 'tools', name: '工具', cost: 4, types: [TREASURE],
        description: '誰かの場にあるカードと同じカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            const ids = [...new Set(game.players.flatMap(p => p.playArea.map(card => card.id)))]
                .filter(id => {
                    const { pileId, cardId } = game.resolvePile(id);
                    return cardId === id && game.supply[pileId] > 0;
                });
            if (ids.length === 0) {
                game.log(`${player.name}が獲得できるカードはありませんでした`);
                return;
            }
            const cards = ids.map(id => new Card(game.getPileTopData(game.resolvePile(id).pileId)));
            game.promptSelect({
                player, cards, min: 1, max: 1, title: '工具', message: '誰かの場にあるカードと同じカードを1枚獲得してください。',
                confirmLabel: '獲得する', purpose: 'gain',
                callback: ([index]) => gainAndLog(game, player, cards[index].id)
            });
        }
    },

    // ===== コスト5 =====
    BURIED_TREASURE: {
        id: 'buried_treasure', name: '埋蔵金', cost: 5, types: [TREASURE, DURATION],
        description: '次のターンの開始時に、購入 +1、財宝 +3。これを獲得したとき、これをプレイする',
        count: 10,
        onPlay: (player, game, treasure) => player.addDuration(treasure, () => gainBenefits(player, game, { buys: 1, coins: 3 }, '埋蔵金')),
        onGain: (player, game, treasure) => {
            if (!player.getAllCards().includes(treasure) || player.playArea.includes(treasure)) return;
            game.log(`${player.name}は埋蔵金をプレイしました`);
            game.playTreasure(player, treasure);
        }
    },
    CREW: {
        id: 'crew', name: '乗組員', cost: 5, types: [ACTION, DURATION],
        description: 'カードを3枚引く。次のターンの開始時に、これを山札の上に置く',
        count: 10,
        onPlay: (player, game, crew) => {
            gainBenefits(player, game, { cards: 3 });
            player.addDuration(crew, () => {
                if (!takeFromPlay(player, crew)) return;
                player.deck.unshift(crew);
                game.log(`${player.name}は乗組員を山札の上に置きました`);
            });
        }
    },
    CUTTHROAT: {
        id: 'cutthroat', name: '悪漢', cost: 5, types: [ACTION, DURATION],
        description: '他のプレイヤーは手札が3枚になるまで捨て札にする。次に誰かがコスト5以上の財宝を獲得したとき、分捕り品を1枚獲得する',
        isAttack: true,
        count: 10,
        usesLoot: true,
        onPlay: (player, game, cutthroat) => {
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length > 3) discardDownTo(game, target, 3, '悪漢');
            });
            game.addWait(player, cutthroat, 'anyTreasure5', () => {
                game.gainLoot(player);
            });
        }
    },
    ENLARGE: {
        id: 'enlarge', name: '拡大', cost: 5, types: [ACTION, DURATION],
        description: '今と次のターンの開始時に：手札を1枚廃棄し、それよりコストが2まで高いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game, enlarge) => {
            enlargeOnce(player, game, '拡大');
            player.addDuration(enlarge, () => enlargeOnce(player, game, '拡大'));
        }
    },
    FIGURINE: {
        id: 'figurine', name: '小像', cost: 5, types: [TREASURE],
        description: 'カードを2枚引く。手札のアクションカードを1枚捨て札にして、購入 +1、財宝 +1 してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '小像', message: '捨て札にするアクションカードを選んでください。購入 +1、財宝 +1 を得ます（選ばなくてもかまいません）。',
                confirmLabel: '捨て札にする', purpose: 'figurine-discard',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    gainBenefits(player, game, { buys: 1, coins: 1 }, '小像');
                }
            });
        }
    },
    FIRST_MATE: {
        id: 'first_mate', name: '一等航海士', cost: 5, types: [ACTION],
        description: '手札の同じ名前のアクションカードを好きな枚数プレイする。その後、手札が6枚になるまで引く',
        count: 10,
        onPlay: (player, game) => {
            const drawUpTo6 = () => {
                const count = 6 - player.hand.length;
                if (count > 0) gainBenefits(player, game, { cards: count }, '一等航海士');
            };
            const actions = player.hand.filter(isAction);
            if (actions.length === 0) {
                drawUpTo6();
                return;
            }
            game.promptSelect({
                player, cards: player.hand, min: 0, max: 1, title: '一等航海士',
                message: 'プレイするアクションカードを選んでください。同じ名前のカードをすべてプレイします（選ばなくてもかまいません）。',
                confirmLabel: 'プレイする', purpose: 'first-mate',
                callback: ([index]) => {
                    const chosen = player.hand[index];
                    if (!chosen || !isAction(chosen)) {
                        drawUpTo6();
                        return;
                    }
                    const copies = player.hand.filter(card => card.id === chosen.id);
                    game.runNext(
                        ...copies.map(card => () => { if (player.hand.includes(card)) game.playCardFrom(player, card); }),
                        drawUpTo6
                    );
                }
            });
        }
    },
    FRIGATE: {
        id: 'frigate', name: 'フリゲート艦', cost: 5, types: [ACTION, DURATION],
        description: '財宝 +3。次のターンの開始時まで、他のプレイヤーはアクションカードをプレイするたびに、その後で手札が4枚になるまで捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game, frigate) => {
            gainBenefits(player, game, { coins: 3 });
            game.attackOtherPlayers(player, (target) => player.frigateVictims.add(target));
            player.addDuration(frigate, null);
        }
    },
    LONGSHIP: {
        id: 'longship', name: 'ロングシップ', cost: 5, types: [ACTION, DURATION],
        description: 'アクション +2。次のターンの開始時に、カード +2',
        count: 10,
        onPlay: (player, game, longship) => {
            gainBenefits(player, game, { actions: 2 });
            player.addDuration(longship, () => gainBenefits(player, game, { cards: 2 }, 'ロングシップ'));
        }
    },
    MINING_ROAD: {
        id: 'mining_road', name: '鉱山道', cost: 5, types: [ACTION],
        description: 'アクション +1。購入 +1。財宝 +2。このターンに1回、財宝を獲得したとき、それをプレイしてもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1, buys: 1, coins: 2 });
            game.turnState.miningRoads++;
        }
    },
    PENDANT: {
        id: 'pendant', name: 'ペンダント', cost: 5, types: [TREASURE],
        description: '場にある財宝の名前1種類につき、財宝 +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { coins: treasureNamesInPlay(game, player) }, 'ペンダント')
    },
    PICKAXE: {
        id: 'pickaxe', name: 'つるはし', cost: 5, types: [TREASURE],
        value: 1,
        description: '財宝1。手札を1枚廃棄する。それがコスト3以上なら、分捕り品を1枚手札に獲得する',
        count: 10,
        usesLoot: true,
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            title: 'つるはし', message: '廃棄するカードを選んでください。コスト3以上なら分捕り品を手札に獲得します。', purpose: 'pickaxe-trash',
            callback: ([trashed]) => {
                if (trashed && game.getCost(trashed) >= 3) game.gainLoot(player, 'hand');
            }
        })
    },
    PILGRIM: {
        id: 'pilgrim', name: '巡礼者', cost: 5, types: [ACTION],
        description: 'カードを4枚引く。手札を1枚山札の上に置く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 4 });
            promptFromHand(game, player, {
                title: '巡礼者', message: '山札の上に置くカードを選んでください。', confirmLabel: '山札の上に置く', purpose: 'topdeck-from-hand',
                callback: ([card]) => {
                    player.hand.splice(player.hand.indexOf(card), 1);
                    player.deck.unshift(card);
                    game.log(`${player.name}は手札を1枚山札の上に置きました`);
                }
            });
        }
    },
    QUARTERMASTER: {
        id: 'quartermaster', name: '補給係', cost: 5, types: [ACTION, DURATION],
        description: 'このゲームの残りの間、自分のターンの開始時に、1つを選ぶ：コスト4以下のカードを1枚獲得して、これの上に脇に置く、これの上のカードを1枚手札に加える',
        count: 10,
        onPlay: (player, game, quartermaster) => {
            const held = [];
            const turnStart = () => {
                const stored = held.filter(card => player.setAside.includes(card));
                held.splice(0, held.length, ...stored);
                game.promptChoose({
                    player, card: quartermaster,
                    options: ['コスト4以下のカードを獲得して、補給係の上に置く', ...(held.length > 0 ? [`補給係の上のカード（${names(held)}）を1枚手札に加える`] : [])],
                    title: '補給係', message: '1つを選んでください。', purpose: 'quartermaster',
                    callback: ([index]) => {
                        if (index === 0) {
                            game.promptGain({
                                player, maxCost: 4, destination: 'setAside', title: '補給係', message: 'コスト4以下のカードを1枚獲得してください。補給係の上に置きます。',
                                onGained: (card) => { if (player.setAside.includes(card)) held.push(card); }
                            });
                            return;
                        }
                        game.promptSelect({
                            player, cards: [...held], min: 1, max: 1, title: '補給係', message: '手札に加えるカードを選んでください。',
                            confirmLabel: '手札に加える', purpose: 'take-from-quartermaster',
                            callback: ([i]) => {
                                const card = held[i];
                                held.splice(i, 1);
                                takeSetAsideToHand(game, player, [card], '補給係');
                            }
                        });
                    }
                });
            };
            player.addDuration(quartermaster, turnStart, { permanent: true });
        }
    },
    SILVER_MINE: {
        id: 'silver_mine', name: '銀鉱山', cost: 5, types: [TREASURE],
        description: 'これより安い財宝を1枚、手札に獲得する',
        count: 10,
        onPlay: (player, game, mine) => game.promptGain({
            player, lessThan: mine, filter: (data) => data.types.includes(TREASURE), destination: 'hand', title: '銀鉱山',
            message: '銀鉱山より安い財宝を1枚、手札に獲得してください。'
        })
    },
    TRICKSTER: {
        id: 'trickster', name: 'いたずら者', cost: 5, types: [ACTION],
        description: '他のプレイヤーは呪いを1枚獲得する。このターンに1回、財宝を場から捨て札にするとき、それを脇に置いてもよい。それをターンの終わりに手札に加える',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            curseAttack(game, player);
            game.turnState.tricksters++;
        }
    },
    WEALTHY_VILLAGE: {
        id: 'wealthy_village', name: '裕福な村', cost: 5, types: [ACTION],
        description: 'カードを1枚引く。アクション +2。これを獲得したとき、場に名前の違う財宝が3種類以上あれば、分捕り品を1枚獲得する',
        count: 10,
        usesLoot: true,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onGain: (player, game) => {
            if (treasureNamesInPlay(game, player) >= 3) game.gainLoot(player);
        }
    },

    // ===== コスト6・7 =====
    SACK_OF_LOOT: {
        id: 'sack_of_loot', name: '分捕り品の袋', cost: 6, types: [TREASURE],
        value: 1,
        description: '財宝1。購入 +1。分捕り品を1枚獲得する',
        count: 10,
        usesLoot: true,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.gainLoot(player);
        }
    },
    KINGS_CACHE: {
        id: 'kings_cache', name: '王の隠し財宝', cost: 7, types: [TREASURE],
        description: '手札の財宝を1枚、3回プレイしてもよい',
        count: 10,
        onPlay: (player, game, cache) => promptFromHand(game, player, {
            min: 0, filter: (card) => game.isTreasure(card), title: '王の隠し財宝',
            message: '3回プレイする財宝を選んでください（選ばなくてもかまいません）。', confirmLabel: '3回プレイする', purpose: 'kings-cache',
            callback: ([card]) => { if (card) game.playMultipleTimes(player, card, 3, cache, { asTreasure: true }); }
        })
    }
};

// 分捕り品（すべてコスト7。サプライ外の混ぜた山から獲得する）
const LOOT_BASE = { cost: 7, count: 2, isLoot: true };

export const PLUNDER_LOOT = {
    AMPHORA: {
        ...LOOT_BASE, id: 'amphora', name: 'アンフォラ', types: [TREASURE, DURATION, LOOT],
        description: '今すぐか次のターンの開始時に、購入 +1、財宝 +3',
        onPlay: (player, game, amphora) => nowOrLater(player, game, amphora, '購入 +1、財宝 +3', { buys: 1, coins: 3 })
    },
    DOUBLOONS: {
        ...LOOT_BASE, id: 'doubloons', name: 'ダブロン金貨', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。これを獲得したとき、金貨を1枚獲得する',
        onGain: (player, game) => gainAndLog(game, player, 'gold')
    },
    ENDLESS_CHALICE: {
        ...LOOT_BASE, id: 'endless_chalice', name: '尽きない杯', types: [TREASURE, DURATION, LOOT],
        value: 1,
        description: '今と、このゲームの残りの間の自分のターンの開始時に：財宝1、購入 +1',
        onPlay: (player, game, chalice) => {
            gainBenefits(player, game, { buys: 1 });
            player.addDuration(chalice, () => gainBenefits(player, game, { coins: 1, buys: 1 }, '尽きない杯'), { permanent: true });
        }
    },
    FIGUREHEAD: {
        ...LOOT_BASE, id: 'figurehead', name: '船首像', types: [TREASURE, DURATION, LOOT],
        value: 3,
        description: '財宝3。次のターンの開始時に、カード +2',
        onPlay: (player, game, figurehead) => player.addDuration(figurehead, () => gainBenefits(player, game, { cards: 2 }, '船首像'))
    },
    HAMMER: {
        ...LOOT_BASE, id: 'hammer', name: 'ハンマー', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。コスト4以下のカードを1枚獲得する',
        onPlay: (player, game) => game.promptGain({ player, maxCost: 4, title: 'ハンマー', message: 'コスト4以下のカードを1枚獲得してください。' })
    },
    INSIGNIA: {
        ...LOOT_BASE, id: 'insignia', name: '記章', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。このターン、カードを獲得したとき、それを山札の上に置いてもよい',
        onPlay: (player, game) => { if (player === game.getCurrentPlayer()) game.turnState.insignia = true; }
    },
    JEWELS: {
        ...LOOT_BASE, id: 'jewels', name: '宝石', types: [TREASURE, DURATION, LOOT],
        value: 3,
        description: '財宝3。購入 +1。次のターンの開始時に、これを山札の一番下に置く',
        onPlay: (player, game, jewels) => {
            gainBenefits(player, game, { buys: 1 });
            player.addDuration(jewels, () => {
                if (!takeFromPlay(player, jewels)) return;
                player.deck.push(jewels);
                game.log(`${player.name}は宝石を山札の一番下に置きました`);
            });
        }
    },
    ORB: {
        ...LOOT_BASE, id: 'orb', name: '宝珠', types: [TREASURE, LOOT],
        description: '捨て札を見る。1つを選ぶ：その中のアクションか財宝を1枚プレイする、購入 +1 と財宝 +3',
        onPlay: (player, game) => {
            const playable = player.discard.filter(card => isAction(card) || game.isTreasure(card));
            game.log(`${player.name}は捨て札を見ました`);
            game.promptChoose({
                player, options: [...(playable.length > 0 ? ['捨て札のアクションか財宝を1枚プレイする'] : []), '購入 +1、財宝 +3'],
                title: '宝珠', message: '1つを選んでください。', purpose: 'orb',
                callback: ([index]) => {
                    if (playable.length === 0 || index === 1) {
                        gainBenefits(player, game, { buys: 1, coins: 3 }, '宝珠');
                        return;
                    }
                    game.promptSelect({
                        player, cards: playable, min: 1, max: 1, title: '宝珠', message: 'プレイするカードを選んでください。',
                        confirmLabel: 'プレイする', purpose: 'orb-play',
                        callback: ([i]) => {
                            const card = playable[i];
                            if (!player.discard.includes(card)) return;
                            if (isAction(card)) {
                                game.playCardFrom(player, card);
                            } else {
                                game.log(`${player.name}は${card.name}をプレイしました`);
                                game.playTreasure(player, card);
                            }
                        }
                    });
                }
            });
        }
    },
    PRIZE_GOAT: {
        ...LOOT_BASE, id: 'prize_goat', name: '品評会のヤギ', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。購入 +1。手札を1枚廃棄してもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            promptTrashFromHand(game, player, {
                min: 0, title: '品評会のヤギ', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash'
            });
        }
    },
    PUZZLE_BOX: {
        ...LOOT_BASE, id: 'puzzle_box', name: 'からくり箱', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。購入 +1。手札を1枚、裏向きで脇に置いてもよい。それをターンの終わりに手札に加える',
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            setAsideFromHand(game, player, {
                max: 1, title: 'からくり箱', message: 'ターンの終わりまで脇に置くカードを選んでください（選ばなくてもかまいません）。', purpose: 'puzzle-box',
                callback: (cards) => returnToHandAtEndOfTurn(game, player, cards)
            });
        }
    },
    SEXTANT: {
        ...LOOT_BASE, id: 'sextant', name: '六分儀', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。購入 +1。山札の上から5枚を見て、好きな枚数を捨て札にし、残りを好きな順で山札の上に戻す',
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            const cards = takeTopCards(player, 5);
            if (cards.length === 0) return;
            game.promptSelect({
                player, cards, min: 0, max: cards.length, title: '六分儀', message: '捨て札にするカードを選んでください。残りは好きな順で山札の上に戻します。',
                confirmLabel: '捨て札にする', purpose: 'sentry-discard',
                callback: (indices) => {
                    const discarded = indices.map(index => cards[index]);
                    game.discardCards(player, discarded);
                    if (discarded.length > 0) game.log(`${player.name}は${names(discarded)}を捨て札にしました`);
                    putBackInAnyOrder(game, player, cards.filter(card => !discarded.includes(card)), '六分儀');
                }
            });
        }
    },
    SHIELD: {
        ...LOOT_BASE, id: 'shield', name: '盾', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。購入 +1。他のプレイヤーがアタックカードをプレイしたとき、これを手札から公開して、その影響を受けなくてもよい',
        isReaction: true,
        onPlay: (player, game) => gainBenefits(player, game, { buys: 1 }),
        onReact: (player, game, attacker) => {
            game.log(`${player.name}は盾を公開して${attacker.name}の攻撃を防ぎました`);
            return true;
        }
    },
    SPELL_SCROLL: {
        ...LOOT_BASE, id: 'spell_scroll', name: '呪文の巻物', types: [ACTION, TREASURE, LOOT],
        description: 'これを廃棄して、これより安いカードを1枚獲得する。それがアクションか財宝なら、それをプレイしてもよい',
        onPlay: (player, game, scroll) => {
            if (!trashFromPlay(game, player, scroll)) return;
            game.promptGain({
                player, lessThan: scroll, title: '呪文の巻物', message: '呪文の巻物より安いカードを1枚獲得してください。',
                onGained: (card) => mayPlayGained(player, game, card, '呪文の巻物')
            });
        }
    },
    STAFF: {
        ...LOOT_BASE, id: 'staff', name: '杖', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。アクション +1。手札のアクションカードを1枚プレイしてもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '杖', message: 'プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([card]) => { if (card) game.playCardFrom(player, card); }
            });
        }
    },
    SWORD: {
        ...LOOT_BASE, id: 'sword', name: '剣', types: [TREASURE, LOOT],
        value: 3,
        description: '財宝3。購入 +1。他のプレイヤーは手札が4枚になるまで捨て札にする',
        isAttack: true,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length > 4) discardDownTo(game, target, 4, '剣');
            });
        }
    }
};

// 分捕り品の山の札（画面のサプライ外の山に、残りの枚数を出すため。獲得はしない）
export const PLUNDER_PILE_CARDS = {
    LOOT: {
        id: 'loot', name: '分捕り品', cost: 7, types: [TREASURE, LOOT],
        description: '分捕り品15種を2枚ずつ混ぜた、サプライ外の山。分捕り品を獲得するときは、この山の一番上を獲得する'
    }
};

export const LOOT_CARD_IDS = Object.values(PLUNDER_LOOT).map(data => data.id);

export const PLUNDER_EVENTS = {
    AVOID: {
        id: 'avoid', name: '回避', kind: EVENT, cost: 2,
        description: '購入 +1。このターン次にシャッフルするとき、そのうち3枚まで選んで捨て札に置いてもよい（引く途中では選べないので、勝利点・呪いのカードを自動で選ぶ）',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.avoid = true;
        }
    },
    BURY: {
        id: 'bury', name: '埋葬', kind: EVENT, cost: 1,
        description: '購入 +1。捨て札のカードを1枚、山札の一番下に置く',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            if (player.discard.length === 0) return;
            game.promptSelect({
                player, cards: [...player.discard], min: 1, max: 1, title: '埋葬', message: '山札の一番下に置くカードを選んでください。',
                confirmLabel: '山札の一番下に置く', purpose: 'bury',
                callback: ([index]) => {
                    const card = [...player.discard][index];
                    if (!player.discard.includes(card)) return;
                    player.discard.splice(player.discard.indexOf(card), 1);
                    player.deck.push(card);
                    game.log(`${player.name}は${card.name}を山札の一番下に置きました`);
                }
            });
        }
    },
    DELIVER: {
        id: 'deliver', name: '配達', kind: EVENT, cost: 2,
        description: '購入 +1。このターン、カードを獲得するたびに、それを脇に置き、ターンの終わりに手札に加える',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.deliver = true;
        }
    },
    FORAY: {
        id: 'foray', name: '急襲', kind: EVENT, cost: 3,
        description: '手札を3枚捨て札にして公開する。名前が3種類なら、分捕り品を1枚獲得する',
        usesLoot: true,
        onBuy: (player, game) => promptDiscardFromHand(game, player, 3, '急襲', {
            callback: (discarded) => {
                logReveal(game, player, discarded, '捨てたカード');
                if (discarded.length === 3 && new Set(discarded.map(card => card.id)).size === 3) game.gainLoot(player);
            }
        })
    },
    INVASION: {
        id: 'invasion', name: '侵略', kind: EVENT, cost: 10,
        description: '手札のアタックカードを1枚プレイしてもよい。公領を1枚獲得する。アクションカードを1枚山札の上に獲得する。分捕り品を1枚獲得して、それをプレイする',
        usesLoot: true,
        onBuy: (player, game) => game.runNext(
            () => promptFromHand(game, player, {
                min: 0, filter: (card) => card.isType(CARD_TYPES.ATTACK), title: '侵略',
                message: 'プレイするアタックカードを選んでください（選ばなくてもかまいません）。', confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([card]) => { if (card) game.playCardFrom(player, card); }
            }),
            () => gainAndLog(game, player, 'duchy'),
            () => game.promptGain({
                player, filter: (data) => data.types.includes(ACTION), destination: 'deck', title: '侵略',
                message: 'アクションカードを1枚獲得してください。山札の上に置きます。'
            }),
            () => {
                const loot = game.gainLoot(player);
                if (!loot || !player.getAllCards().includes(loot) || player.playArea.includes(loot)) return;
                game.log(`${player.name}は${loot.name}をプレイしました`);
                if (game.isTreasure(loot)) {
                    game.playTreasure(player, loot);
                } else {
                    game.playCardFrom(player, loot);
                }
            }
        )
    },
    JOURNEY: {
        id: 'journey', name: '旅程', kind: EVENT, cost: 4,
        description: 'このターンのクリーンアップでは、場のカードを捨て札にしない。このターンの後に追加のターンを行う（3ターン続けては行えない）',
        onBuy: (player, game) => {
            game.turnState.journey = true;
            if (game.previousTurnPlayer === player) {
                game.log('3ターン続けては行えないので、追加のターンは行いません');
                return;
            }
            game.extraTurns.push(player);
            game.log(`${player.name}はこのターンの後に追加のターンを行います`);
        }
    },
    LAUNCH: {
        id: 'launch', name: '出航', kind: EVENT, cost: 3,
        oncePerTurn: true,
        description: '1ターンに1回：アクションフェーズに戻る。カード +1、アクション +1、購入 +1',
        onBuy: (player, game) => {
            game.returnToActionPhase(player);
            gainBenefits(player, game, { cards: 1, actions: 1, buys: 1 }, '出航');
        }
    },
    LOOTING: {
        id: 'looting', name: '分捕り', kind: EVENT, cost: 6,
        description: '分捕り品を1枚獲得する',
        usesLoot: true,
        onBuy: (player, game) => game.gainLoot(player)
    },
    MAELSTROM: {
        id: 'maelstrom', name: '大渦', kind: EVENT, cost: 4,
        description: '手札を3枚廃棄する。手札が5枚以上の他のプレイヤーは、手札を1枚廃棄する',
        onBuy: (player, game) => game.runNext(
            () => promptTrashFromHand(game, player, {
                min: Math.min(3, player.hand.length), max: 3, title: '大渦', message: '廃棄するカードを3枚選んでください。', purpose: 'maelstrom-trash'
            }),
            ...game.getOtherPlayers(player).map(other => () => {
                if (other.hand.length < 5) return;
                promptTrashFromHand(game, other, { title: '大渦', message: '廃棄するカードを1枚選んでください。', purpose: 'maelstrom-other' });
            })
        )
    },
    MIRROR: {
        id: 'mirror', name: '鏡', kind: EVENT, cost: 3,
        description: '購入 +1。このターン次にアクションカードを獲得したとき、同じカードをもう1枚獲得する',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.mirrors++;
        }
    },
    PERIL: {
        id: 'peril', name: '危難', kind: EVENT, cost: 2,
        description: '購入 +1。手札のアクションカードを1枚廃棄して、分捕り品を1枚獲得してもよい',
        usesLoot: true,
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            promptTrashFromHand(game, player, {
                min: 0, filter: isAction, title: '危難', message: '廃棄するアクションカードを選んでください。分捕り品を獲得します（選ばなくてもかまいません）。',
                purpose: 'peril',
                callback: (trashed) => { if (trashed.length > 0) game.gainLoot(player); }
            });
        }
    },
    PREPARE: {
        id: 'prepare', name: '準備', kind: EVENT, cost: 3,
        description: '手札をすべて表向きで脇に置く。次のターンの開始時に、その中のアクションと財宝をプレイし、残りを捨て札にする（プレイする順は、アクション、財宝の順に自動で決める）',
        onBuy: (player) => {
            const cards = player.hand.splice(0);
            player.setAside.push(...cards);
            player.prepared.push(...cards);
        }
    },
    PROSPER: {
        id: 'prosper', name: '栄華', kind: EVENT, cost: 10,
        description: '分捕り品を1枚獲得する。さらに、名前の違う財宝を好きな枚数獲得する',
        usesLoot: true,
        onBuy: (player, game) => game.runNext(
            () => game.gainLoot(player),
            () => {
                const candidates = game.getGainableCards({ filter: (data) => data.types.includes(TREASURE) });
                if (candidates.length === 0) return;
                game.promptSelect({
                    player, cards: candidates.map(data => new Card(data)), min: 0, max: candidates.length, title: '栄華',
                    message: '獲得する財宝を選んでください（名前の違うものを好きな枚数）。', confirmLabel: '獲得する', purpose: 'prosper',
                    callback: (indices) => game.runNext(...indices.map(index => () => gainAndLog(game, player, candidates[index].id)))
                });
            }
        )
    },
    RUSH: {
        id: 'rush', name: '突進', kind: EVENT, cost: 2,
        description: '購入 +1。このターン次にアクションカードを獲得したとき、それをプレイする',
        onBuy: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.turnState.rushes++;
        }
    },
    SCROUNGE: {
        id: 'scrounge', name: 'あさる', kind: EVENT, cost: 3,
        description: '1つを選ぶ：手札を1枚廃棄する、廃棄置き場の屋敷を1枚獲得し、そうしたらコスト5以下のカードを1枚獲得する',
        onBuy: (player, game) => game.promptChoose({
            player, options: ['手札を1枚廃棄する', '廃棄置き場の屋敷を獲得し、コスト5以下のカードを獲得する'], title: 'あさる', message: '1つを選んでください。',
            purpose: 'scrounge',
            callback: ([index]) => {
                if (index === 0) {
                    promptTrashFromHand(game, player, { title: 'あさる', message: '廃棄するカードを選んでください。', purpose: 'remodel-trash' });
                    return;
                }
                const estate = game.trash.find(card => card.id === 'estate');
                if (!estate || !game.takeFromTrash(estate)) {
                    game.log('廃棄置き場に屋敷がありませんでした');
                    return;
                }
                game.gainCardInstance(player, estate);
                game.log(`${player.name}は廃棄置き場の屋敷を獲得しました`);
                game.promptGain({ player, maxCost: 5, title: 'あさる', message: 'コスト5以下のカードを1枚獲得してください。' });
            }
        })
    }
};

// 特性：準備で、アクションか財宝の王国カードの山に1つずつ置く（効果は game-plunder.js）
export const PLUNDER_TRAITS = {
    CHEAP: { id: 'cheap', name: '安価', kind: TRAIT, description: 'この山のカードのコストは1少ない' },
    CURSED: { id: 'cursed', name: '呪われた', kind: TRAIT, description: 'この山のカードを獲得したとき、廃墟と呪いを1枚ずつ獲得する' },
    FATED: {
        id: 'fated', name: '宿命の', kind: TRAIT,
        description: 'シャッフルしたとき、この山のカードを山札の一番上か一番下に置いてもよい（引く途中では選べないので、自動で一番上に置く）'
    },
    FAWNING: { id: 'fawning', name: 'へつらう', kind: TRAIT, description: '属州を獲得したとき、この山のカードを1枚獲得する' },
    FRIENDLY: { id: 'friendly', name: '友好的', kind: TRAIT, description: 'クリーンアップの開始時に、手札のこの山のカードを1枚捨て札にして、この山のカードを1枚獲得してもよい' },
    HASTY: { id: 'hasty', name: '性急な', kind: TRAIT, description: 'この山のカードを獲得したとき、それを脇に置き、次のターンの開始時にプレイする' },
    INHERITED: {
        id: 'inherited', name: '受け継がれた', kind: TRAIT,
        description: '準備：各プレイヤーは、初期デッキの1枚の代わりにこの山のカードを持って始める（自動で屋敷か納屋の1枚と入れ替える）'
    },
    INSPIRING: {
        id: 'inspiring', name: '鼓舞する', kind: TRAIT,
        description: '自分のターンにこの山のカードをプレイした後、場にない名前の、手札のアクションカードを1枚プレイしてもよい'
    },
    NEARBY: { id: 'nearby', name: '手近な', kind: TRAIT, description: 'この山のカードを獲得したとき、購入 +1' },
    PATIENT: { id: 'patient', name: '忍耐強い', kind: TRAIT, description: 'クリーンアップの開始時に、手札のこの山のカードを好きな枚数脇に置き、次のターンの開始時にプレイしてもよい' },
    PIOUS: { id: 'pious', name: '敬虔な', kind: TRAIT, description: 'この山のカードを獲得したとき、手札を1枚廃棄してもよい' },
    RECKLESS: { id: 'reckless', name: '無謀な', kind: TRAIT, description: 'この山のカードをプレイしたら、その指示を2回行う。場から捨て札にするとき、それを山に戻す' },
    RICH: { id: 'rich', name: '裕福な', kind: TRAIT, description: 'この山のカードを獲得したとき、銀貨を1枚獲得する' },
    SHY: { id: 'shy', name: '内気な', kind: TRAIT, description: 'ターンの開始時に、手札のこの山のカードを1枚捨て札にして、カード +2 してもよい' },
    TIRELESS: { id: 'tireless', name: '疲れ知らずの', kind: TRAIT, description: 'この山のカードを場から捨て札にするとき、それを脇に置き、ターンの終わりに山札の上に置く' }
};
