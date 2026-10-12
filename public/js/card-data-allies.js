/**
 * 拡張「同盟」の王国カードデータ、4種で1山の山の中身、同盟の札
 * - 恩恵トークン：game.gainFavors で得て、同盟の札（LANDSCAPES の kind: 'ally'）の効果に使う
 * - 連絡役が王国にあるゲームでは、同盟の札を1枚使い、各プレイヤーは恩恵トークンを1つ持って始める（game-allies.js）
 * - 4種で1山の山（町民など）は4枚ずつ決まった順に重ね、一番上だけを購入・獲得できる。「回す」と一番上の種類を一番下に移す
 * - 「1つを選ぶ」効果は game.promptAbilities で選ばせる（長老でプレイしたカードは、もう1つ選べる）
 */

import Card from './card.js';
import { CARD_TYPES, LANDSCAPE_KINDS } from './card-types.js';
import {
    isAction, isTreasure, isVictory, names, gainBenefits, promptFromHand, promptTrashFromHand, promptDiscardFromHand,
    discardDownTo, takeTopCards, putBackInAnyOrder, logReveal
} from './card-helpers.js';

const { ACTION, TREASURE, VICTORY, DURATION, LIAISON, TOWNSFOLK, AUGUR, CLASH, FORT, ODYSSEY, WIZARD } = CARD_TYPES;

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};

// 場のこのカードを山札の上に置く（商人の野営地・テント・学生）
const topdeckFromPlay = (game, player, card, source) => {
    const index = player.playArea.indexOf(card);
    if (index < 0) return;
    player.playArea.splice(index, 1);
    player.deck.unshift(card);
    game.log(`${player.name}は${source}を山札の上に置きました`);
};

// 場から捨て札にするとき、山札の上に置いてもよい（商人の野営地・テント）
const mayTopdeckOnCleanup = (player, game, card) => game.promptConfirm({
    player, card, title: card.name, message: `${card.name}を山札の上に置きますか？`,
    yesLabel: '山札の上に置く', noLabel: '捨て札にする', purpose: 'topdeck-from-play',
    callback: (yes) => { if (yes) topdeckFromPlay(game, player, card, card.name); }
});

// 手札・捨て札などの財宝かアクションをプレイする（宅配人・薬草集め・専門家）
const playFrom = (game, player, card) => {
    if (isAction(card)) {
        game.playCardFrom(player, card);
    } else {
        game.log(`${player.name}は${card.name}をプレイしました`);
        game.playTreasure(player, card);
    }
};

// 4種で1山の山（4枚ずつ、この順に上から重ねる）
const rotatingPile = (ids) => ids.flatMap(id => Array(4).fill(id));

// ===== 4種で1山の山の中身 =====
export const ALLIES_PILE_CARDS = {
    // ----- 町民 -----
    TOWN_CRIER: {
        id: 'town_crier', name: '触れ役', cost: 2, types: [ACTION, TOWNSFOLK],
        description: '1つを選ぶ：財宝 +2、銀貨を1枚獲得する、カードを1枚引きアクション +1。町民の山を回してもよい',
        onPlay: (player, game, card) => game.runNext(
            () => game.promptAbilities({
                player, card, options: ['財宝 +2', '銀貨を1枚獲得する', 'カード +1、アクション +1'],
                title: '触れ役', purpose: 'town-crier',
                callback: (indices) => indices.forEach(index => {
                    if (index === 0) gainBenefits(player, game, { coins: 2 }, '触れ役');
                    if (index === 1) gainAndLog(game, player, 'silver');
                    if (index === 2) gainBenefits(player, game, { cards: 1, actions: 1 }, '触れ役');
                })
            }),
            () => game.promptRotate(player, 'townsfolk')
        )
    },
    BLACKSMITH: {
        id: 'blacksmith', name: '鍛冶職人', cost: 3, types: [ACTION, TOWNSFOLK],
        description: '1つを選ぶ：手札が6枚になるまで引く、カードを2枚引く、カードを1枚引きアクション +1',
        onPlay: (player, game, card) => game.promptAbilities({
            player, card, options: ['手札が6枚になるまで引く', 'カード +2', 'カード +1、アクション +1'],
            title: '鍛冶職人', purpose: 'blacksmith',
            callback: (indices) => game.runNext(...indices.map(index => () => {
                if (index === 0) gainBenefits(player, game, { cards: Math.max(0, 6 - player.hand.length) }, '鍛冶職人');
                if (index === 1) gainBenefits(player, game, { cards: 2 }, '鍛冶職人');
                if (index === 2) gainBenefits(player, game, { cards: 1, actions: 1 }, '鍛冶職人');
            }))
        })
    },
    MILLER: {
        id: 'miller', name: '粉屋', cost: 4, types: [ACTION, TOWNSFOLK],
        description: 'アクション +1。山札の上から4枚を見て、1枚を手札に加え、残りを捨て札にする',
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const cards = takeTopCards(player, 4);
            if (cards.length === 0) return;
            game.promptSelect({
                player, cards, min: 1, max: 1, title: '粉屋', message: '手札に加えるカードを選んでください。残りは捨て札にします。',
                confirmLabel: '手札に加える', purpose: 'miller',
                callback: ([index]) => {
                    player.hand.push(cards[index]);
                    const rest = cards.filter((_, i) => i !== index);
                    game.discardCards(player, rest);
                    game.log(`${player.name}は1枚を手札に加え、${rest.length}枚を捨て札にしました`);
                }
            });
        }
    },
    ELDER: {
        id: 'elder', name: '長老', cost: 5, types: [ACTION, TOWNSFOLK],
        description: '財宝 +2。手札のアクションカードを1枚プレイしてもよい。このターン、そのカードで「1つを選ぶ」ときは、別の選択肢をもう1つ選んでもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '長老', message: 'プレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([card]) => {
                    if (!card) return;
                    card.elderTurn = game.turnCount;
                    game.playCardFrom(player, card);
                }
            });
        }
    },

    // ----- 鳥占い師 -----
    HERB_GATHERER: {
        id: 'herb_gatherer', name: '薬草集め', cost: 3, types: [ACTION, AUGUR],
        description: '購入 +1。山札をすべて捨て札に置く。捨て札を見て、財宝を1枚プレイしてもよい。鳥占い師の山を回してもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            if (player.deck.length > 0) {
                game.log(`${player.name}は山札を${player.deck.length}枚、捨て札に置きました`);
                player.discard.push(...player.deck.splice(0));
            }
            game.runNext(
                () => {
                    const treasures = player.discard.filter(isTreasure);
                    if (treasures.length === 0) return;
                    game.promptSelect({
                        player, cards: treasures, min: 0, max: 1, title: '薬草集め',
                        message: '捨て札からプレイする財宝を選んでください（選ばなくてもかまいません）。', confirmLabel: 'プレイする', purpose: 'herb-gatherer',
                        callback: ([index]) => {
                            const card = treasures[index];
                            if (card && player.discard.includes(card)) playFrom(game, player, card);
                        }
                    });
                },
                () => game.promptRotate(player, 'augurs')
            );
        }
    },
    ACOLYTE: {
        id: 'acolyte', name: '侍祭', cost: 4, types: [ACTION, AUGUR],
        description: '手札のアクションか勝利点のカードを1枚廃棄して、金貨を1枚獲得してもよい。これを廃棄して、鳥占い師を1枚獲得してもよい',
        onPlay: (player, game, acolyte) => game.runNext(
            () => promptFromHand(game, player, {
                min: 0, filter: (card) => isAction(card) || isVictory(card), title: '侍祭',
                message: '廃棄して金貨を獲得する、アクションか勝利点のカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '廃棄する', purpose: 'acolyte-trash',
                callback: ([card]) => {
                    if (!card) return;
                    game.trashFromHand(player, [player.hand.indexOf(card)]);
                    game.log(`${player.name}は${card.name}を廃棄しました`);
                    game.runNext(() => gainAndLog(game, player, 'gold'));
                }
            }),
            () => {
                if (!player.playArea.includes(acolyte) || !(game.supply.augurs > 0)) return;
                game.promptConfirm({
                    player, card: acolyte, title: '侍祭', message: `侍祭を廃棄して、${game.getPileName('augurs')}を獲得しますか？`,
                    yesLabel: '廃棄する', noLabel: '廃棄しない', purpose: 'acolyte-self',
                    callback: (yes) => {
                        if (!yes || !player.playArea.includes(acolyte)) return;
                        player.playArea.splice(player.playArea.indexOf(acolyte), 1);
                        game.log(`${player.name}は侍祭を廃棄しました`);
                        game.runNext(() => game.trashCard(player, acolyte), () => gainAndLog(game, player, 'augurs'));
                    }
                });
            }
        )
    },
    SORCERESS: {
        id: 'sorceress', name: '妖術師', cost: 5, types: [ACTION, AUGUR],
        description: 'アクション +1。カードを1種指定する。山札の一番上を公開して手札に加える。指定したカードなら、他のプレイヤーは呪いを1枚獲得する',
        isAttack: true,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            game.promptNameCard({
                player, title: '妖術師', message: '指定するカードを選んでください。', purpose: 'name-card',
                callback: (data) => {
                    const [top] = takeTopCards(player, 1);
                    if (!top) return;
                    game.log(`${player.name}は山札の一番上の${top.name}を公開して、手札に加えました`);
                    player.hand.push(top);
                    if (top.id === data.id) game.attackOtherPlayers(player, (target) => game.gainCurse(target));
                }
            });
        }
    },
    SIBYL: {
        id: 'sibyl', name: '巫女', cost: 6, types: [ACTION, AUGUR],
        description: 'カードを4枚引く。アクション +1。手札を1枚山札の上に、もう1枚を山札の一番下に置く',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 4, actions: 1 });
            game.runNext(
                () => promptFromHand(game, player, {
                    title: '巫女', message: '山札の上に置くカードを選んでください。', confirmLabel: '山札の上に置く', purpose: 'topdeck-from-hand',
                    callback: ([card]) => {
                        player.hand.splice(player.hand.indexOf(card), 1);
                        player.deck.unshift(card);
                        game.log(`${player.name}は手札を1枚山札の上に置きました`);
                    }
                }),
                () => promptFromHand(game, player, {
                    title: '巫女', message: '山札の一番下に置くカードを選んでください。', confirmLabel: '一番下に置く', purpose: 'topdeck-from-hand',
                    callback: ([card]) => {
                        player.hand.splice(player.hand.indexOf(card), 1);
                        player.deck.push(card);
                        game.log(`${player.name}は手札を1枚山札の一番下に置きました`);
                    }
                })
            );
        }
    },

    // ----- 衝突 -----
    BATTLE_PLAN: {
        id: 'battle_plan', name: '作戦', cost: 3, types: [ACTION, CLASH],
        description: 'カードを1枚引く。アクション +1。手札のアタックカードを1枚公開して、カードを1枚引いてもよい。サプライの山を1つ回してもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.runNext(
                () => {
                    const attack = player.hand.find(card => card.isType(CARD_TYPES.ATTACK));
                    if (!attack) return;
                    game.promptConfirm({
                        player, card: attack, title: '作戦', message: `${attack.name}を公開して、カードを1枚引きますか？`,
                        yesLabel: '公開する', noLabel: '公開しない', purpose: 'battle-plan-reveal',
                        callback: (yes) => {
                            if (!yes) return;
                            logReveal(game, player, [attack], 'アタックカード');
                            gainBenefits(player, game, { cards: 1 }, '作戦');
                        }
                    });
                },
                () => game.promptRotateAny(player)
            );
        }
    },
    ARCHER: {
        id: 'archer', name: '弓兵', cost: 4, types: [ACTION, CLASH],
        description: '財宝 +2。手札が5枚以上の他のプレイヤーは、1枚以外の手札を公開し、そのうちあなたが選んだ1枚を捨て札にする',
        isAttack: true,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length < 5) return;
                game.promptSelect({
                    player: target, cards: target.hand, min: 1, max: 1, title: '弓兵', message: '公開しないカードを1枚選んでください。',
                    confirmLabel: '選ぶ', purpose: 'archer-hide',
                    callback: ([hiddenIndex]) => {
                        const hidden = target.hand[hiddenIndex];
                        const revealed = target.hand.filter(card => card !== hidden);
                        logReveal(game, target, revealed, '手札（1枚以外）');
                        game.promptSelect({
                            player, cards: revealed, min: 1, max: 1, title: '弓兵', message: `${target.name}に捨てさせるカードを選んでください。`,
                            confirmLabel: '捨てさせる', purpose: 'archer-discard',
                            callback: ([index]) => {
                                const card = revealed[index];
                                if (!target.hand.includes(card)) return;
                                game.discardFromHand(target, [target.hand.indexOf(card)]);
                                game.log(`${target.name}は${card.name}を捨て札にしました`);
                            }
                        });
                    }
                });
            });
        }
    },
    WARLORD: {
        id: 'warlord', name: '将軍', cost: 5, types: [ACTION, DURATION, CLASH],
        description: 'アクション +1。次のターンの開始時に、カードを2枚引く。それまで、他のプレイヤーは、場に2枚以上あるアクションカードを手札からプレイできない',
        isAttack: true,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { actions: 1 });
            game.attackOtherPlayers(player, (target) => player.warlordVictims.add(target));
            player.addDuration(card, () => gainBenefits(player, game, { cards: 2 }, '将軍'));
        }
    },
    TERRITORY: {
        id: 'territory', name: '領土', cost: 6, types: [VICTORY, CLASH],
        description: '持っている勝利点カードの名前の種類1つにつき1勝利点。獲得したとき、空のサプライの山1つにつき金貨を1枚獲得する',
        pointsFor: (allCards) => new Set(allCards.filter(isVictory).map(card => card.id)).size,
        onGain: (player, game) => {
            const count = game.countEmptySupplyPiles();
            for (let i = 0; i < count; i++) gainAndLog(game, player, 'gold');
        }
    },

    // ----- 砦 -----
    TENT: {
        id: 'tent', name: 'テント', cost: 3, types: [ACTION, FORT],
        description: '財宝 +2。砦の山を回してもよい。場から捨て札にするとき、山札の上に置いてもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.promptRotate(player, 'forts');
        },
        onCleanup: mayTopdeckOnCleanup
    },
    GARRISON: {
        id: 'garrison', name: '守備隊', cost: 4, types: [ACTION, DURATION, FORT],
        description: '財宝 +2。このターン、カードを獲得するたびに、これにトークンを1つ置く。次のターンの開始時に、トークンを取り除き、1つにつきカードを1枚引く',
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { coins: 2 });
            const garrison = { tokens: 0 };
            game.turnState.garrisons.push(garrison);
            player.addDuration(card, () => {
                if (garrison.tokens > 0) gainBenefits(player, game, { cards: garrison.tokens }, '守備隊');
            });
        }
    },
    HILL_FORT: {
        id: 'hill_fort', name: '丘の砦', cost: 5, types: [ACTION, FORT],
        description: 'コスト4以下のカードを1枚獲得する。1つを選ぶ：それを手札に加える、カードを1枚引きアクション +1',
        onPlay: (player, game, fort) => game.promptGain({
            player, maxCost: 4, title: '丘の砦', message: 'コスト4以下のカードを1枚獲得してください。',
            onGained: (gained) => game.promptAbilities({
                player, card: fort, options: [`${gained.name}を手札に加える`, 'カード +1、アクション +1'], title: '丘の砦', purpose: 'hill-fort',
                callback: (indices) => indices.forEach(index => {
                    if (index === 0 && player.removeCard(gained)) {
                        player.hand.push(gained);
                        game.log(`${player.name}は${gained.name}を手札に加えました`);
                    }
                    if (index === 1) gainBenefits(player, game, { cards: 1, actions: 1 }, '丘の砦');
                })
            })
        })
    },
    STRONGHOLD: {
        id: 'stronghold', name: '要塞', cost: 6, types: [ACTION, VICTORY, DURATION, FORT],
        points: 2,
        description: '1つを選ぶ：財宝 +3、次のターンの開始時にカードを3枚引く。2勝利点',
        onPlay: (player, game, card) => game.promptAbilities({
            player, card, options: ['財宝 +3', '次のターンの開始時にカード +3'], title: '要塞', purpose: 'stronghold',
            callback: (indices) => indices.forEach(index => {
                if (index === 0) gainBenefits(player, game, { coins: 3 }, '要塞');
                if (index === 1) player.addDuration(card, () => gainBenefits(player, game, { cards: 3 }, '要塞'));
            })
        })
    },

    // ----- 冒険旅行 -----
    OLD_MAP: {
        id: 'old_map', name: '古地図', cost: 3, types: [ACTION, ODYSSEY],
        description: 'カードを1枚引く。アクション +1。手札を1枚捨て札にする。カードを1枚引く。冒険旅行の山を回してもよい',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.runNext(
                () => promptDiscardFromHand(game, player, 1, '古地図'),
                () => gainBenefits(player, game, { cards: 1 }, '古地図'),
                () => game.promptRotate(player, 'odysseys')
            );
        }
    },
    VOYAGE: {
        id: 'voyage', name: '航海', cost: 4, types: [ACTION, DURATION, ODYSSEY],
        description: 'アクション +1。直前のターンが自分のターンでなければ、このターンの後に追加のターンを行う。そのターンには、手札からカードを3枚までしかプレイできない',
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { actions: 1 });
            if (game.getCurrentPlayer() !== player || game.previousTurnPlayer === player) return;
            if (game.extraTurns.some(entry => (entry.player ?? entry) === player)) return;
            game.extraTurns.push({ player, handPlayLimit: 3 });
            player.addDuration(card, null);
            game.log(`${player.name}はこのターンの後に、航海の追加のターンを行います`);
        }
    },
    SUNKEN_TREASURE: {
        id: 'sunken_treasure', name: '沈没船の財宝', cost: 5, types: [TREASURE, ODYSSEY],
        value: 0,
        description: '場にないアクションカードを1枚獲得する',
        onPlay: (player, game) => game.promptGain({
            player, filter: (data) => data.types.includes(ACTION) && !player.playArea.some(card => card.id === data.id),
            title: '沈没船の財宝', message: '場にないアクションカードを1枚獲得してください。'
        })
    },
    DISTANT_SHORE: {
        id: 'distant_shore', name: '遠い岸辺', cost: 6, types: [ACTION, VICTORY, ODYSSEY],
        points: 2,
        description: 'カードを2枚引く。アクション +1。屋敷を1枚獲得する。2勝利点',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2, actions: 1 });
            gainAndLog(game, player, 'estate');
        }
    },

    // ----- 魔法使い -----
    STUDENT: {
        id: 'student', name: '学生', cost: 3, types: [ACTION, WIZARD],
        description: 'アクション +1。魔法使いの山を回してもよい。手札を1枚廃棄する。それが財宝なら、恩恵 +1 し、これを山札の上に置く',
        onPlay: (player, game, student) => {
            gainBenefits(player, game, { actions: 1 });
            game.runNext(
                () => game.promptRotate(player, 'wizards'),
                () => promptTrashFromHand(game, player, {
                    title: '学生', message: '廃棄するカードを選んでください。', purpose: 'student-trash',
                    callback: ([card]) => {
                        if (!card || !isTreasure(card)) return;
                        game.gainFavors(player, 1, '学生');
                        topdeckFromPlay(game, player, student, '学生');
                    }
                })
            );
        }
    },
    CONJURER: {
        id: 'conjurer', name: '奇術師', cost: 4, types: [ACTION, DURATION, WIZARD],
        description: 'コスト4以下のカードを1枚獲得する。次のターンの開始時に、これを手札に加える',
        onPlay: (player, game, card) => {
            game.promptGain({ player, maxCost: 4, title: '奇術師', message: 'コスト4以下のカードを1枚獲得してください。' });
            player.addDuration(card, () => {
                const index = player.playArea.indexOf(card);
                if (index < 0) return;
                player.playArea.splice(index, 1);
                player.hand.push(card);
                game.log(`${player.name}は奇術師を手札に加えました`);
            });
        }
    },
    SORCERER: {
        id: 'sorcerer', name: '呪術師', cost: 5, types: [ACTION, WIZARD],
        description: 'カードを1枚引く。アクション +1。他のプレイヤーはカードを1種指定し、山札の一番上を公開する。外れたら呪いを1枚獲得する',
        isAttack: true,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.attackOtherPlayers(player, (target) => game.promptNameCard({
                player: target, title: '呪術師', message: '山札の一番上にありそうなカードを指定してください。外れると呪いを獲得します。', purpose: 'name-card',
                callback: (data) => {
                    const [top] = takeTopCards(target, 1);
                    if (top) {
                        target.deck.unshift(top);
                        game.log(`${target.name}は山札の一番上の${top.name}を公開しました`);
                    }
                    if (top?.id !== data.id) game.gainCurse(target);
                }
            }));
        }
    },
    LICH: {
        id: 'lich', name: 'リッチ', cost: 6, types: [ACTION, WIZARD],
        description: 'カードを6枚引く。アクション +2。次の自分のターンを飛ばす。これを廃棄したとき、これを捨て札にし、廃棄置き場からこれより安いカードを1枚獲得する',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 6, actions: 2 });
            player.skipTurns++;
            game.log(`${player.name}は次のターンを飛ばします`);
        },
        onTrash: (player, game, lich) => {
            if (game.takeFromTrash(lich)) {
                player.discard.push(lich);
                game.log(`${player.name}はリッチを捨て札にしました`);
            }
            const candidates = game.trash.filter(card => game.costsLessThan(card, lich));
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates, min: 1, max: 1, title: 'リッチ', message: '廃棄置き場から獲得するカードを選んでください。',
                confirmLabel: '獲得する', purpose: 'gain-from-trash',
                callback: ([index]) => {
                    const card = candidates[index];
                    if (!game.takeFromTrash(card)) return;
                    game.log(`${player.name}は廃棄置き場の${card.name}を獲得しました`);
                    game.gainCardInstance(player, card);
                }
            });
        }
    }
};

// ===== 王国カード =====
export const ALLIES_CARDS = {
    // ===== 4種で1山の山（山の札。一番上のカードだけを購入・獲得できる） =====
    TOWNSFOLK: {
        id: 'townsfolk', name: '町民', cost: 2, types: [ACTION, TOWNSFOLK],
        description: '触れ役・鍛冶職人・粉屋・長老を4枚ずつ、この順に重ねた山。一番上のカードだけを購入・獲得できる',
        pileCards: rotatingPile(['town_crier', 'blacksmith', 'miller', 'elder']), pileOrdered: true
    },
    AUGURS: {
        id: 'augurs', name: '鳥占い師', cost: 3, types: [ACTION, AUGUR],
        description: '薬草集め・侍祭・妖術師・巫女を4枚ずつ、この順に重ねた山。一番上のカードだけを購入・獲得できる',
        isAttack: true,
        pileCards: rotatingPile(['herb_gatherer', 'acolyte', 'sorceress', 'sibyl']), pileOrdered: true
    },
    CLASHES: {
        id: 'clashes', name: '衝突', cost: 3, types: [ACTION, CLASH],
        description: '作戦・弓兵・将軍・領土を4枚ずつ、この順に重ねた山。一番上のカードだけを購入・獲得できる',
        isAttack: true,
        pileCards: rotatingPile(['battle_plan', 'archer', 'warlord', 'territory']), pileOrdered: true
    },
    FORTS: {
        id: 'forts', name: '砦', cost: 3, types: [ACTION, FORT],
        description: 'テント・守備隊・丘の砦・要塞を4枚ずつ、この順に重ねた山。一番上のカードだけを購入・獲得できる',
        pileCards: rotatingPile(['tent', 'garrison', 'hill_fort', 'stronghold']), pileOrdered: true
    },
    ODYSSEYS: {
        id: 'odysseys', name: '冒険旅行', cost: 3, types: [ACTION, ODYSSEY],
        description: '古地図・航海・沈没船の財宝・遠い岸辺を4枚ずつ、この順に重ねた山。一番上のカードだけを購入・獲得できる',
        pileCards: rotatingPile(['old_map', 'voyage', 'sunken_treasure', 'distant_shore']), pileOrdered: true
    },
    WIZARDS: {
        id: 'wizards', name: '魔法使い', cost: 3, types: [ACTION, WIZARD],
        description: '学生・奇術師・呪術師・リッチを4枚ずつ、この順に重ねた山。一番上のカードだけを購入・獲得できる',
        isAttack: true,
        pileCards: rotatingPile(['student', 'conjurer', 'sorcerer', 'lich']), pileOrdered: true
    },

    // ===== コスト2 =====
    BAUBLE: {
        id: 'bauble', name: '装身具', cost: 2, types: [TREASURE, LIAISON],
        value: 0,
        description: '違うものを2つ選ぶ：購入 +1、財宝 +1、恩恵 +1、このターン、獲得したカードを山札の上に置いてもよい',
        count: 10,
        onPlay: (player, game, card) => game.promptAbilities({
            player, card, count: 2,
            options: ['購入 +1', '財宝 +1', '恩恵 +1', 'このターン、獲得したカードを山札の上に置いてもよい'],
            title: '装身具', purpose: 'bauble',
            callback: (indices) => indices.forEach(index => {
                if (index === 0) gainBenefits(player, game, { buys: 1 }, '装身具');
                if (index === 1) gainBenefits(player, game, { coins: 1 }, '装身具');
                if (index === 2) game.gainFavors(player, 1, '装身具');
                if (index === 3) game.turnState.baubleGains = true;
            })
        })
    },
    SYCOPHANT: {
        id: 'sycophant', name: 'おべっか使い', cost: 2, types: [ACTION, LIAISON],
        description: 'アクション +1。手札を3枚捨て札にする。1枚以上捨てたら、財宝 +3。獲得したときと廃棄したとき、恩恵 +2',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            promptDiscardFromHand(game, player, 3, 'おべっか使い', {
                callback: (discarded) => { if (discarded.length > 0) gainBenefits(player, game, { coins: 3 }, 'おべっか使い'); }
            });
        },
        onGain: (player, game) => game.gainFavors(player, 2, 'おべっか使い'),
        onTrash: (player, game) => game.gainFavors(player, 2, 'おべっか使い')
    },

    // ===== コスト3 =====
    IMPORTER: {
        id: 'importer', name: '輸入業者', cost: 3, types: [ACTION, DURATION, LIAISON],
        description: '次のターンの開始時に、コスト5以下のカードを1枚獲得する。準備：各プレイヤーは恩恵 +4',
        count: 10,
        setupFavors: 4,
        onPlay: (player, game, card) => player.addDuration(card, () => game.promptGain({
            player, maxCost: 5, title: '輸入業者', message: 'コスト5以下のカードを1枚獲得してください。'
        }))
    },
    MERCHANT_CAMP: {
        id: 'merchant_camp', name: '商人の野営地', cost: 3, types: [ACTION],
        description: 'アクション +2。財宝 +1。場から捨て札にするとき、山札の上に置いてもよい',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { actions: 2, coins: 1 }),
        onCleanup: mayTopdeckOnCleanup
    },
    SENTINEL: {
        id: 'sentinel', name: '歩哨', cost: 3, types: [ACTION],
        description: '山札の上から5枚を見る。そのうち2枚まで廃棄してもよい。残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            const cards = takeTopCards(player, 5);
            if (cards.length === 0) return;
            game.promptSelect({
                player, cards, min: 0, max: 2, title: '歩哨', message: '廃棄するカードを2枚まで選んでください（選ばなくてもかまいません）。',
                confirmLabel: '廃棄する', purpose: 'sentinel-trash',
                callback: (indices) => {
                    const trashed = indices.map(index => cards[index]);
                    const rest = cards.filter(card => !trashed.includes(card));
                    if (trashed.length > 0) game.log(`${player.name}は${names(trashed)}を廃棄しました`);
                    game.runNext(
                        ...trashed.map(card => () => game.trashCard(player, card)),
                        () => putBackInAnyOrder(game, player, rest, '歩哨')
                    );
                }
            });
        }
    },
    UNDERLING: {
        id: 'underling', name: '下っ端', cost: 3, types: [ACTION, LIAISON],
        description: 'カードを1枚引く。アクション +1。恩恵 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            game.gainFavors(player, 1, '下っ端');
        }
    },

    // ===== コスト4 =====
    BROKER: {
        id: 'broker', name: '仲買人', cost: 4, types: [ACTION, LIAISON],
        description: '手札を1枚廃棄し、1つを選ぶ：そのコスト1につき、カード +1、アクション +1、財宝 +1、恩恵 +1 のどれか',
        count: 10,
        onPlay: (player, game, broker) => promptTrashFromHand(game, player, {
            title: '仲買人', message: '廃棄するカードを選んでください。', purpose: 'broker-trash',
            callback: ([card]) => {
                if (!card) return;
                const amount = game.getCost(card);
                game.promptAbilities({
                    player, card: broker, options: [`カード +${amount}`, `アクション +${amount}`, `財宝 +${amount}`, `恩恵 +${amount}`],
                    title: '仲買人', purpose: 'broker',
                    callback: (indices) => indices.forEach(index => {
                        if (index === 0) gainBenefits(player, game, { cards: amount }, '仲買人');
                        if (index === 1) gainBenefits(player, game, { actions: amount }, '仲買人');
                        if (index === 2) gainBenefits(player, game, { coins: amount }, '仲買人');
                        if (index === 3) game.gainFavors(player, amount, '仲買人');
                    })
                });
            }
        })
    },
    CARPENTER: {
        id: 'carpenter', name: '大工', cost: 4, types: [ACTION],
        description: 'サプライに空の山がなければ、アクション +1 し、コスト4以下のカードを1枚獲得する。あれば、手札を1枚廃棄し、それよりコストが2まで高いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            if (game.countEmptySupplyPiles() === 0) {
                gainBenefits(player, game, { actions: 1 });
                game.promptGain({ player, maxCost: 4, title: '大工', message: 'コスト4以下のカードを1枚獲得してください。' });
                return;
            }
            promptTrashFromHand(game, player, {
                title: '大工', message: '廃棄するカードを選んでください。', purpose: 'remodel-trash',
                callback: ([card]) => {
                    if (!card) return;
                    game.promptGain({
                        player, maxCost: game.getCost(card) + 2, ...game.costExtras(card),
                        title: '大工', message: `コスト${game.getCost(card) + 2}以下のカードを1枚獲得してください。`
                    });
                }
            });
        }
    },
    COURIER: {
        id: 'courier', name: '宅配人', cost: 4, types: [ACTION],
        description: '財宝 +1。山札の一番上を捨て札にする。捨て札を見て、アクションか財宝を1枚プレイしてもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 1 });
            const top = takeTopCards(player, 1);
            if (top.length > 0) {
                game.log(`${player.name}は山札の一番上の${top[0].name}を捨て札にしました`);
                game.discardCards(player, top);
            }
            game.runNext(() => {
                const candidates = player.discard.filter(card => isAction(card) || isTreasure(card));
                if (candidates.length === 0) return;
                game.promptSelect({
                    player, cards: candidates, min: 0, max: 1, title: '宅配人',
                    message: '捨て札からプレイするアクションか財宝を選んでください（選ばなくてもかまいません）。', confirmLabel: 'プレイする', purpose: 'courier',
                    callback: ([index]) => {
                        const card = candidates[index];
                        if (card && player.discard.includes(card)) playFrom(game, player, card);
                    }
                });
            });
        }
    },
    INNKEEPER: {
        id: 'innkeeper', name: '宿屋の主人', cost: 4, types: [ACTION],
        description: 'アクション +1。1つを選ぶ：カード +1、カードを3枚引いて3枚捨て札にする、カードを5枚引いて6枚捨て札にする',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { actions: 1 });
            game.promptAbilities({
                player, card, options: ['カード +1', 'カード +3 して、3枚捨て札にする', 'カード +5 して、6枚捨て札にする'],
                title: '宿屋の主人', purpose: 'innkeeper',
                callback: (indices) => game.runNext(...indices.flatMap(index => [
                    () => gainBenefits(player, game, { cards: [1, 3, 5][index] }, '宿屋の主人'),
                    () => { if (index > 0) promptDiscardFromHand(game, player, [0, 3, 6][index], '宿屋の主人'); }
                ]))
            });
        }
    },
    ROYAL_GALLEY: {
        id: 'royal_galley', name: '王家のガレー船', cost: 4, types: [ACTION, DURATION],
        description: 'カードを1枚引く。手札の持続でないアクションカードを1枚プレイしてもよい。そうしたら、それを脇に置き、次のターンの開始時にプレイする',
        count: 10,
        onPlay: (player, game, galley) => {
            gainBenefits(player, game, { cards: 1 });
            promptFromHand(game, player, {
                min: 0, filter: (card) => isAction(card) && !card.isType(DURATION), title: '王家のガレー船',
                message: 'プレイするアクションカードを選んでください（選ばなくてもかまいません）。', confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([card]) => {
                    if (!card) return;
                    game.runNext(
                        () => game.playCardFrom(player, card),
                        () => {
                            const index = player.playArea.indexOf(card);
                            if (index < 0) return;
                            player.playArea.splice(index, 1);
                            player.setAside.push(card);
                            game.log(`${player.name}は${card.name}を脇に置きました`);
                            player.addDuration(galley, () => {
                                if (player.setAside.includes(card)) game.playCardFrom(player, card);
                            });
                        }
                    );
                }
            });
        }
    },
    TOWN: {
        id: 'town', name: '町', cost: 4, types: [ACTION],
        description: '1つを選ぶ：カードを1枚引きアクション +2、購入 +1 と財宝 +2',
        count: 10,
        onPlay: (player, game, card) => game.promptAbilities({
            player, card, options: ['カード +1、アクション +2', '購入 +1、財宝 +2'], title: '町', purpose: 'town',
            callback: (indices) => indices.forEach(index => {
                if (index === 0) gainBenefits(player, game, { cards: 1, actions: 2 }, '町');
                if (index === 1) gainBenefits(player, game, { buys: 1, coins: 2 }, '町');
            })
        })
    },

    // ===== コスト5 =====
    BARBARIAN: {
        id: 'barbarian', name: '蛮族', cost: 5, types: [ACTION],
        description: '財宝 +2。他のプレイヤーは山札の一番上を廃棄する。それがコスト3以上なら、それと共通の種類を持つ、それより安いカードを1枚獲得する。そうでなければ呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.attackOtherPlayers(player, (target) => {
                const [card] = takeTopCards(target, 1);
                if (!card) return;
                game.log(`${target.name}は山札の一番上の${card.name}を廃棄しました`);
                game.runNext(
                    () => game.trashCard(target, card),
                    () => {
                        if (game.getCost(card) < 3) {
                            game.gainCurse(target);
                            return;
                        }
                        game.promptGain({
                            player: target, lessThan: card, filter: (data) => new Card(data).types.some(type => card.types.includes(type)),
                            title: '蛮族', message: `${card.name}と共通の種類を持つ、それより安いカードを1枚獲得してください。`
                        });
                    }
                );
            });
        }
    },
    CAPITAL_CITY: {
        id: 'capital_city', name: '首都', cost: 5, types: [ACTION],
        description: 'カードを1枚引く。アクション +2。手札を2枚捨て札にして、財宝 +2 してもよい。財宝を2払って、カードを2枚引いてもよい',
        count: 10,
        onPlay: (player, game, card) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            game.runNext(
                () => {
                    if (player.hand.length < 2) return;
                    game.promptConfirm({
                        player, card, title: '首都', message: '手札を2枚捨て札にして、財宝 +2 しますか？',
                        yesLabel: '捨てる', noLabel: '捨てない', purpose: 'capital-city-discard',
                        callback: (yes) => {
                            if (!yes) return;
                            promptDiscardFromHand(game, player, 2, '首都', {
                                callback: (discarded) => { if (discarded.length === 2) gainBenefits(player, game, { coins: 2 }, '首都'); }
                            });
                        }
                    });
                },
                () => {
                    if (player.coins < 2) return;
                    game.promptConfirm({
                        player, card, title: '首都', message: '財宝を2払って、カードを2枚引きますか？',
                        yesLabel: '払う', noLabel: '払わない', purpose: 'capital-city-pay',
                        callback: (yes) => {
                            if (!yes || player.coins < 2) return;
                            player.coins -= 2;
                            game.log(`${player.name}は財宝を2払いました`);
                            gainBenefits(player, game, { cards: 2 }, '首都');
                        }
                    });
                }
            );
        }
    },
    CONTRACT: {
        id: 'contract', name: '契約', cost: 5, types: [TREASURE, DURATION, LIAISON],
        value: 2,
        description: '財宝 +2。恩恵 +1。手札のアクションカードを1枚脇に置き、次のターンの開始時にプレイしてもよい',
        count: 10,
        onPlay: (player, game, contract) => {
            game.gainFavors(player, 1, '契約');
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '契約', message: '次のターンにプレイするアクションカードを選んでください（選ばなくてもかまいません）。',
                confirmLabel: '脇に置く', purpose: 'play-new-action',
                callback: ([card]) => {
                    if (!card) return;
                    player.hand.splice(player.hand.indexOf(card), 1);
                    player.setAside.push(card);
                    game.log(`${player.name}は${card.name}を脇に置きました`);
                    player.addDuration(contract, () => {
                        if (player.setAside.includes(card)) game.playCardFrom(player, card);
                    });
                }
            });
        }
    },
    EMISSARY: {
        id: 'emissary', name: '密使', cost: 5, types: [ACTION, LIAISON],
        description: 'カードを3枚引く。これでシャッフルしたら、アクション +1、恩恵 +2',
        count: 10,
        onPlay: (player, game) => {
            const shuffles = player.shuffleCount;
            gainBenefits(player, game, { cards: 3 });
            if (player.shuffleCount === shuffles) return;
            gainBenefits(player, game, { actions: 1 }, '密使');
            game.gainFavors(player, 2, '密使');
        }
    },
    GALLERIA: {
        id: 'galleria', name: 'ガレリア', cost: 5, types: [ACTION],
        description: '財宝 +3。このターン、コスト3か4のカードを獲得するたびに、購入 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 3 });
            game.turnState.galleria++;
        }
    },
    GUILDMASTER: {
        id: 'guildmaster', name: 'ギルドの親方', cost: 5, types: [ACTION, LIAISON],
        description: '財宝 +3。このターン、カードを獲得するたびに、恩恵 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 3 });
            game.turnState.guildmasters++;
        }
    },
    HIGHWAYMAN: {
        id: 'highwayman', name: '辻強盗', cost: 5, types: [ACTION, DURATION],
        description: '次のターンの開始時に、これを場から捨て札にし、カードを3枚引く。それまで、他のプレイヤーが毎ターン最初にプレイする財宝は何もしない',
        isAttack: true,
        count: 10,
        onPlay: (player, game, card) => {
            game.attackOtherPlayers(player, (target) => player.highwaymanVictims.add(target));
            player.addDuration(card, () => {
                const index = player.playArea.indexOf(card);
                if (index >= 0) {
                    player.playArea.splice(index, 1);
                    game.discardCards(player, [card]);
                }
                gainBenefits(player, game, { cards: 3 }, '辻強盗');
            });
        }
    },
    HUNTER: {
        id: 'hunter', name: '狩人', cost: 5, types: [ACTION],
        description: 'アクション +1。山札の上から3枚を公開する。その中から、アクション・財宝・勝利点のカードを1枚ずつ手札に加え、残りを捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const cards = takeTopCards(player, 3);
            if (cards.length === 0) return;
            logReveal(game, player, cards, '山札の上から3枚');
            const taken = [];
            [ACTION, TREASURE, VICTORY].forEach(type => {
                const card = cards.filter(c => !taken.includes(c) && c.isType(type)).sort((a, b) => b.cost - a.cost)[0];
                if (card) taken.push(card);
            });
            player.hand.push(...taken);
            const rest = cards.filter(card => !taken.includes(card));
            if (taken.length > 0) game.log(`${player.name}は${names(taken)}を手札に加えました`);
            game.discardCards(player, rest);
        }
    },
    MODIFY: {
        id: 'modify', name: '改変', cost: 5, types: [ACTION],
        description: '手札を1枚廃棄する。1つを選ぶ：カードを1枚引きアクション +1、廃棄したカードよりコストが2まで高いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game, modify) => promptTrashFromHand(game, player, {
            title: '改変', message: '廃棄するカードを選んでください。', purpose: 'modify-trash',
            callback: ([trashed]) => game.promptAbilities({
                player, card: trashed ?? modify,
                options: ['カード +1、アクション +1', trashed ? `コスト${game.getCost(trashed) + 2}以下のカードを1枚獲得する` : 'カードを獲得する（廃棄していないので何もしない）'],
                title: '改変', purpose: 'modify',
                callback: (indices) => indices.forEach(index => {
                    if (index === 0) gainBenefits(player, game, { cards: 1, actions: 1 }, '改変');
                    if (index === 1 && trashed) {
                        game.promptGain({
                            player, maxCost: game.getCost(trashed) + 2, ...game.costExtras(trashed),
                            title: '改変', message: `コスト${game.getCost(trashed) + 2}以下のカードを1枚獲得してください。`
                        });
                    }
                })
            })
        })
    },
    SKIRMISHER: {
        id: 'skirmisher', name: '散兵', cost: 5, types: [ACTION],
        description: 'カードを1枚引く。アクション +1。財宝 +1。このターン、アタックカードを獲得するたびに、他のプレイヤーは手札が3枚になるまで捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1, coins: 1 });
            game.turnState.skirmishers++;
        }
    },
    SPECIALIST: {
        id: 'specialist', name: '専門家', cost: 5, types: [ACTION],
        description: '手札のアクションか財宝を1枚プレイしてもよい。1つを選ぶ：それをもう一度プレイする、同じカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => promptFromHand(game, player, {
            min: 0, filter: (card) => isAction(card) || isTreasure(card), title: '専門家',
            message: 'プレイするアクションか財宝を選んでください（選ばなくてもかまいません）。', confirmLabel: 'プレイする', purpose: 'specialist',
            callback: ([card]) => {
                if (!card) return;
                game.runNext(
                    () => playFrom(game, player, card),
                    () => game.promptAbilities({
                        player, card, options: ['もう一度プレイする', `${card.name}を1枚獲得する`], title: '専門家', purpose: 'specialist-choice',
                        callback: (indices) => game.runNext(...indices.map(index => () => {
                            if (index === 0) {
                                game.log(`${player.name}は${card.name}をもう一度プレイしました`);
                                if (isAction(card)) card.play(player, game);
                                else game.applyTreasure(player, card);
                            }
                            if (index === 1) gainAndLog(game, player, card.id);
                        }))
                    })
                );
            }
        })
    },
    SWAP: {
        id: 'swap', name: 'すり替え', cost: 5, types: [ACTION],
        description: 'カードを1枚引く。アクション +1。手札のアクションカードを1枚山に戻して、別のコスト5以下のアクションカードを1枚手札に獲得してもよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            promptFromHand(game, player, {
                min: 0, filter: (card) => isAction(card) && game.supply[game.pileOf[card.id] ?? card.id] !== undefined, title: 'すり替え',
                message: '山に戻すアクションカードを選んでください（選ばなくてもかまいません）。', confirmLabel: '山に戻す', purpose: 'swap',
                callback: ([card]) => {
                    if (!card || !game.returnToSupply(player, card)) return;
                    game.log(`${player.name}は${card.name}を山に戻しました`);
                    game.promptGain({
                        player, maxCost: 5, destination: 'hand', filter: (data) => data.types.includes(ACTION) && data.id !== card.id,
                        title: 'すり替え', message: '手札に獲得するコスト5以下のアクションカードを選んでください。'
                    });
                }
            });
        }
    },

    // ===== コスト6 =====
    MARQUIS: {
        id: 'marquis', name: '侯爵', cost: 6, types: [ACTION],
        description: '購入 +1。手札1枚につきカードを1枚引く。手札が10枚になるまで捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1, cards: player.hand.length });
            if (player.hand.length > 10) discardDownTo(game, player, 10, '侯爵');
        }
    }
};

// ===== 同盟の札 =====
// きっかけ（game-allies.js と game.js が呼ぶ）：
//   onStartOfTurn / onStartBuyPhase(game, player)、afterPlay(game, player, card)、gainStep(game, player, card, isCurrent)、
//   beforeCleanup(game, player)、afterTurn(game, player)、score(game, player)、onShuffle(game, player)
// 選択は game.runNext で積み、他の札の選択と重ならないようにする

const hasFavors = (player, amount) => player.favors >= amount;

// 「好きなだけ繰り返す」効果：恩恵を1つ使うたびに effect を行い、また聞く
const repeatWithFavor = (game, player, ask) => {
    const step = () => {
        if (!hasFavors(player, 1)) return;
        ask(() => game.runNext(step));
    };
    game.runNext(step);
};

export const ALLIES_ALLIES = {
    ARCHITECTS_GUILD: {
        id: 'architects_guild', name: '建築家ギルド', kind: LANDSCAPE_KINDS.ALLY,
        description: 'カードを獲得したとき、恩恵を2つ使って、それより安い勝利点でないカードを1枚獲得してもよい',
        gainStep: (game, player, card) => () => {
            if (!hasFavors(player, 2)) return;
            const candidates = game.getGainableCards({ lessThan: card, filter: (data) => !data.types.includes(VICTORY) });
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates.map(data => new Card(data)), min: 0, max: 1, title: '建築家ギルド',
                message: `恩恵を2つ使って、${card.name}より安い勝利点でないカードを1枚獲得できます（選ばなくてもかまいません）。`,
                confirmLabel: '獲得する', purpose: 'architects-guild',
                callback: ([index]) => {
                    if (index === undefined) return;
                    game.spendFavors(player, 2, '建築家ギルド');
                    gainAndLog(game, player, candidates[index].id);
                }
            });
        }
    },
    BAND_OF_NOMADS: {
        id: 'band_of_nomads', name: '遊牧民の一団', kind: LANDSCAPE_KINDS.ALLY,
        description: 'コスト3以上のカードを獲得したとき、恩恵を1つ使って、カード +1、アクション +1、購入 +1 のどれかを得てもよい',
        gainStep: (game, player, card) => () => {
            if (!hasFavors(player, 1) || game.getCost(card) < 3) return;
            game.promptChoose({
                player, card, options: ['使わない', 'カード +1', 'アクション +1', '購入 +1'], title: '遊牧民の一団',
                message: '恩恵を1つ使って得るものを選んでください。', purpose: 'band-of-nomads',
                callback: ([index]) => {
                    if (index === 0) return;
                    game.spendFavors(player, 1, '遊牧民の一団');
                    gainBenefits(player, game, [{}, { cards: 1 }, { actions: 1 }, { buys: 1 }][index], '遊牧民の一団');
                }
            });
        }
    },
    CAVE_DWELLERS: {
        id: 'cave_dwellers', name: '洞窟の住人', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの開始時に、恩恵を1つ使って、手札を1枚捨て札にしてからカードを1枚引いてもよい。好きなだけ繰り返せる',
        onStartOfTurn: (game, player) => repeatWithFavor(game, player, (again) => {
            if (player.hand.length === 0) return;
            game.promptSelect({
                player, cards: player.hand, min: 0, max: 1, title: '洞窟の住人',
                message: `恩恵を1つ使って捨て札にするカードを選んでください（残り${player.favors}。選ばなければ終わります）。`,
                confirmLabel: '捨てて引く', purpose: 'cave-dwellers',
                callback: (indices) => {
                    if (indices.length === 0) return;
                    game.spendFavors(player, 1, '洞窟の住人');
                    game.discardFromHand(player, indices);
                    gainBenefits(player, game, { cards: 1 }, '洞窟の住人');
                    again();
                }
            });
        })
    },
    CIRCLE_OF_WITCHES: {
        id: 'circle_of_witches', name: '魔女の集会', kind: LANDSCAPE_KINDS.ALLY,
        description: '連絡役をプレイした後、恩恵を3つ使って、他のプレイヤーに呪いを1枚ずつ獲得させてもよい',
        afterPlay: (game, player, card) => {
            if (!card.isType(LIAISON) || !hasFavors(player, 3) || !(game.supply.curse > 0)) return;
            game.promptConfirm({
                player, card, title: '魔女の集会', message: '恩恵を3つ使って、他のプレイヤーに呪いを獲得させますか？',
                yesLabel: '使う', noLabel: '使わない', purpose: 'circle-of-witches',
                callback: (yes) => {
                    if (!yes) return;
                    game.spendFavors(player, 3, '魔女の集会');
                    game.getOtherPlayers(player).forEach(target => game.gainCurse(target));
                }
            });
        }
    },
    CITY_STATE: {
        id: 'city_state', name: '都市国家', kind: LANDSCAPE_KINDS.ALLY,
        description: '自分のターンにアクションカードを獲得したとき、恩恵を2つ使って、それをプレイしてもよい',
        gainStep: (game, player, card, isCurrent) => () => {
            if (!isCurrent || !isAction(card) || !hasFavors(player, 2)) return;
            if (![player.discard, player.deck, player.hand].some(zone => zone.includes(card))) return;
            game.promptConfirm({
                player, card, title: '都市国家', message: `恩恵を2つ使って、獲得した${card.name}をプレイしますか？`,
                yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'city-state',
                callback: (yes) => {
                    if (!yes || !player.removeCard(card)) return;
                    game.spendFavors(player, 2, '都市国家');
                    game.playCardFrom(player, card, { remove: false });
                }
            });
        }
    },
    COASTAL_HAVEN: {
        id: 'coastal_haven', name: '沿岸の避難港', kind: LANDSCAPE_KINDS.ALLY,
        description: 'クリーンアップで手札を捨て札にするとき、恩恵を好きな数だけ使って、その枚数の手札を次のターンまで残してもよい（それでも5枚引く）',
        beforeCleanup: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 1) || player.hand.length === 0) return;
            game.promptSelect({
                player, cards: player.hand, min: 0, max: player.favors, title: '沿岸の避難港',
                message: `恩恵1つにつき1枚、次のターンまで手札に残すカードを選んでください（恩恵${player.favors}。選ばなくてもかまいません）。`,
                confirmLabel: '残す', purpose: 'coastal-haven',
                callback: (indices) => {
                    if (indices.length === 0) return;
                    const kept = indices.map(index => player.hand[index]);
                    kept.forEach(card => player.hand.splice(player.hand.indexOf(card), 1));
                    player.setAside.push(...kept);
                    game.turnState.savedCards.push(...kept);
                    game.spendFavors(player, kept.length, '沿岸の避難港');
                }
            });
        })
    },
    CRAFTERS_GUILD: {
        id: 'crafters_guild', name: '職人ギルド', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの開始時に、恩恵を2つ使って、コスト4以下のカードを1枚獲得し、山札の上に置いてもよい',
        onStartOfTurn: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 2)) return;
            game.promptGain({
                player, maxCost: 4, destination: 'deck', optional: true, title: '職人ギルド',
                message: '恩恵を2つ使って、コスト4以下のカードを山札の上に獲得できます（選ばなくてもかまいません）。', purpose: 'crafters-guild',
                onGained: () => game.spendFavors(player, 2, '職人ギルド')
            });
        })
    },
    DESERT_GUIDES: {
        id: 'desert_guides', name: '砂漠の案内人', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの開始時に、恩恵を1つ使って、手札をすべて捨て札にし、カードを5枚引いてもよい。好きなだけ繰り返せる',
        onStartOfTurn: (game, player) => repeatWithFavor(game, player, (again) => game.promptConfirm({
            player, title: '砂漠の案内人', message: `恩恵を1つ使って、手札を捨てて5枚引き直しますか？（残り${player.favors}）`,
            yesLabel: '引き直す', noLabel: '引き直さない', purpose: 'desert-guides',
            callback: (yes) => {
                if (!yes) return;
                game.spendFavors(player, 1, '砂漠の案内人');
                game.discardFromHand(player, player.hand.map((_, index) => index));
                gainBenefits(player, game, { cards: 5 }, '砂漠の案内人');
                again();
            }
        }))
    },
    FAMILY_OF_INVENTORS: {
        id: 'family_of_inventors', name: '発明家の一族', kind: LANDSCAPE_KINDS.ALLY,
        description: '購入フェーズの開始時に、自分の恩恵トークンを1つ、勝利点でないサプライの山に置いてもよい。カードのコストは、その山の恩恵トークン1つにつき1少ない',
        onStartBuyPhase: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 1)) return;
            const pileIds = Object.keys(game.supply).filter(pileId => game.supply[pileId] > 0 && !game.getPileTopData(pileId)?.types.includes(VICTORY));
            if (pileIds.length === 0) return;
            game.promptSelect({
                player, cards: pileIds.map(pileId => new Card(game.getPileTopData(pileId))), min: 0, max: 1, title: '発明家の一族',
                message: '恩恵トークンを置く山を選んでください（選ばなくてもかまいません）。', confirmLabel: '置く', purpose: 'family-of-inventors',
                callback: ([index]) => {
                    if (index === undefined) return;
                    const pileId = pileIds[index];
                    game.spendFavors(player, 1, '発明家の一族');
                    game.inventorTokens[pileId] = (game.inventorTokens[pileId] ?? 0) + 1;
                    game.log(`${player.name}は${game.getPileName(pileId)}の山に恩恵トークンを置きました`);
                }
            });
        })
    },
    FELLOWSHIP_OF_SCRIBES: {
        id: 'fellowship_of_scribes', name: '書記の組合', kind: LANDSCAPE_KINDS.ALLY,
        description: 'アクションをプレイした後、手札が4枚以下なら、恩恵を1つ使って、カードを1枚引いてもよい',
        afterPlay: (game, player, card) => {
            if (!isAction(card) || player.hand.length > 4 || !hasFavors(player, 1)) return;
            game.promptConfirm({
                player, card, title: '書記の組合', message: '恩恵を1つ使って、カードを1枚引きますか？',
                yesLabel: '引く', noLabel: '引かない', purpose: 'fellowship-of-scribes',
                callback: (yes) => {
                    if (!yes) return;
                    game.spendFavors(player, 1, '書記の組合');
                    gainBenefits(player, game, { cards: 1 }, '書記の組合');
                }
            });
        }
    },
    FOREST_DWELLERS: {
        id: 'forest_dwellers', name: '森の住人', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの開始時に、恩恵を1つ使って、山札の上から3枚を見て、好きな枚数を捨て札にし、残りを好きな順で戻してもよい',
        onStartOfTurn: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 1)) return;
            game.promptConfirm({
                player, title: '森の住人', message: '恩恵を1つ使って、山札の上から3枚を見ますか？',
                yesLabel: '見る', noLabel: '見ない', purpose: 'forest-dwellers',
                callback: (yes) => {
                    if (!yes) return;
                    game.spendFavors(player, 1, '森の住人');
                    const cards = takeTopCards(player, 3);
                    if (cards.length === 0) return;
                    game.promptSelect({
                        player, cards, min: 0, max: cards.length, title: '森の住人', message: '捨て札にするカードを選んでください。残りは山札の上に戻します。',
                        confirmLabel: '捨て札にする', purpose: 'sentry-discard',
                        callback: (indices) => {
                            const discarded = indices.map(index => cards[index]);
                            const rest = cards.filter(card => !discarded.includes(card));
                            if (discarded.length > 0) game.log(`${player.name}は${names(discarded)}を捨て札にしました`);
                            game.discardCards(player, discarded);
                            game.runNext(() => putBackInAnyOrder(game, player, rest, '森の住人'));
                        }
                    });
                }
            });
        })
    },
    GANG_OF_PICKPOCKETS: {
        id: 'gang_of_pickpockets', name: 'スリの一味', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの開始時に、恩恵を1つ使わなければ、手札が4枚になるまで捨て札にする',
        onStartOfTurn: (game, player) => game.runNext(() => {
            if (player.hand.length <= 4) return;
            if (!hasFavors(player, 1)) {
                discardDownTo(game, player, 4, 'スリの一味');
                return;
            }
            game.promptConfirm({
                player, title: 'スリの一味', message: '恩恵を1つ使いますか？（使わなければ、手札が4枚になるまで捨て札にします）',
                yesLabel: '恩恵を使う', noLabel: '捨て札にする', purpose: 'gang-of-pickpockets',
                callback: (yes) => {
                    if (yes) {
                        game.spendFavors(player, 1, 'スリの一味');
                    } else {
                        discardDownTo(game, player, 4, 'スリの一味');
                    }
                }
            });
        })
    },
    ISLAND_FOLK: {
        id: 'island_folk', name: '島の民', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの終わりに、直前のターンが自分のターンでなければ、恩恵を5つ使って、追加のターンを行ってもよい',
        afterTurn: (game, player) => {
            if (!hasFavors(player, 5) || game.previousTurnPlayer === player || game.phase === 'end') return;
            game.promptConfirm({
                player, title: '島の民', message: '恩恵を5つ使って、追加のターンを行いますか？',
                yesLabel: '行う', noLabel: '行わない', purpose: 'island-folk',
                callback: (yes) => {
                    if (!yes) return;
                    game.spendFavors(player, 5, '島の民');
                    game.extraTurns.push(player);
                }
            });
        }
    },
    LEAGUE_OF_BANKERS: {
        id: 'league_of_bankers', name: '銀行家連盟', kind: LANDSCAPE_KINDS.ALLY,
        description: '購入フェーズの開始時に、恩恵4つにつき財宝 +1（端数は切り捨て）',
        onStartBuyPhase: (game, player) => {
            const amount = Math.floor(player.favors / 4);
            if (amount > 0) gainBenefits(player, game, { coins: amount }, '銀行家連盟');
        }
    },
    LEAGUE_OF_SHOPKEEPERS: {
        id: 'league_of_shopkeepers', name: '商店主連盟', kind: LANDSCAPE_KINDS.ALLY,
        description: '連絡役をプレイした後、恩恵が5つ以上なら財宝 +1、10以上ならさらにアクション +1 と購入 +1',
        afterPlay: (game, player, card) => {
            if (!card.isType(LIAISON) || player.favors < 5) return;
            gainBenefits(player, game, player.favors >= 10 ? { coins: 1, actions: 1, buys: 1 } : { coins: 1 }, '商店主連盟');
        }
    },
    MARKET_TOWNS: {
        id: 'market_towns', name: '市場町', kind: LANDSCAPE_KINDS.ALLY,
        description: '購入フェーズの開始時に、恩恵を1つ使って、手札のアクションカードを1枚プレイしてもよい。好きなだけ繰り返せる',
        onStartBuyPhase: (game, player) => repeatWithFavor(game, player, (again) => promptFromHand(game, player, {
            min: 0, filter: isAction, title: '市場町',
            message: `恩恵を1つ使ってプレイするアクションカードを選んでください（残り${player.favors}。選ばなければ終わります）。`,
            confirmLabel: 'プレイする', purpose: 'market-towns',
            callback: ([card]) => {
                if (!card) return;
                game.spendFavors(player, 1, '市場町');
                game.runNext(() => game.playCardFrom(player, card), again);
            }
        }))
    },
    MOUNTAIN_FOLK: {
        id: 'mountain_folk', name: '山の民', kind: LANDSCAPE_KINDS.ALLY,
        description: 'ターンの開始時に、恩恵を5つ使って、カードを3枚引いてもよい',
        onStartOfTurn: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 5)) return;
            game.promptConfirm({
                player, title: '山の民', message: '恩恵を5つ使って、カードを3枚引きますか？',
                yesLabel: '引く', noLabel: '引かない', purpose: 'mountain-folk',
                callback: (yes) => {
                    if (!yes) return;
                    game.spendFavors(player, 5, '山の民');
                    gainBenefits(player, game, { cards: 3 }, '山の民');
                }
            });
        })
    },
    ORDER_OF_ASTROLOGERS: {
        id: 'order_of_astrologers', name: '占星術師団', kind: LANDSCAPE_KINDS.ALLY,
        description: 'シャッフルしたとき、恩恵1つにつき1枚を選んで一番上に置いてもよい（引く途中では選べないので、勝利点・呪い以外でコスト3以上の高いカードを2枚まで自動で置く）',
        onShuffle: (game, player) => {
            const best = player.deck
                .filter(card => !card.isType(VICTORY) && !card.isType(CARD_TYPES.CURSE) && card.cost >= 3)
                .sort((a, b) => b.cost - a.cost)
                .slice(0, Math.min(2, player.favors));
            if (best.length === 0) return;
            best.reverse().forEach(card => player.deck.unshift(...player.deck.splice(player.deck.indexOf(card), 1)));
            game.spendFavors(player, best.length, '占星術師団');
        }
    },
    ORDER_OF_MASONS: {
        id: 'order_of_masons', name: '石工団', kind: LANDSCAPE_KINDS.ALLY,
        description: 'シャッフルしたとき、恩恵1つにつき2枚まで、捨て札に置くカードを選んでもよい（引く途中では選べないので、勝利点・呪いのカードを自動で選ぶ）',
        onShuffle: (game, player) => {
            const junk = player.deck
                .filter(card => (card.isType(VICTORY) || card.isType(CARD_TYPES.CURSE)) && !card.isType(ACTION) && !card.isType(TREASURE))
                .slice(0, player.favors * 2);
            if (junk.length === 0) return;
            junk.forEach(card => player.deck.splice(player.deck.indexOf(card), 1));
            player.discard.push(...junk);
            game.spendFavors(player, Math.ceil(junk.length / 2), '石工団');
            game.log(`${player.name}は石工団で${names(junk)}を捨て札に置きました`);
        }
    },
    PEACEFUL_CULT: {
        id: 'peaceful_cult', name: '平和の教団', kind: LANDSCAPE_KINDS.ALLY,
        description: '購入フェーズの開始時に、恩恵を好きな数だけ使って、その枚数の手札を廃棄してもよい',
        onStartBuyPhase: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 1) || player.hand.length === 0) return;
            game.promptSelect({
                player, cards: player.hand, min: 0, max: player.favors, title: '平和の教団',
                message: `恩恵1つにつき1枚、廃棄するカードを選んでください（恩恵${player.favors}。選ばなくてもかまいません）。`,
                confirmLabel: '廃棄する', purpose: 'peaceful-cult',
                callback: (indices) => {
                    if (indices.length === 0) return;
                    game.spendFavors(player, indices.length, '平和の教団');
                    const trashed = game.trashFromHand(player, indices);
                    game.log(`${player.name}は${names(trashed)}を廃棄しました`);
                }
            });
        })
    },
    PLATEAU_SHEPHERDS: {
        id: 'plateau_shepherds', name: '高原の羊飼い', kind: LANDSCAPE_KINDS.ALLY,
        description: '得点計算のとき、恩恵トークンと、持っているコスト2のカードを1つずつ組にし、1組につき2勝利点',
        score: (game, player) => {
            const twos = player.getAllCards().filter(card => card.cost === 2 && !card.potionCost && !card.debtCost).length;
            return 2 * Math.min(player.favors, twos);
        }
    },
    TRAPPERS_LODGE: {
        id: 'trappers_lodge', name: '猟師の小屋', kind: LANDSCAPE_KINDS.ALLY,
        description: 'カードを獲得したとき、恩恵を1つ使って、それを山札の上に置いてもよい',
        gainStep: (game, player, card) => () => {
            if (!hasFavors(player, 1) || !player.discard.includes(card)) return;
            game.promptConfirm({
                player, card, title: '猟師の小屋', message: `恩恵を1つ使って、獲得した${card.name}を山札の上に置きますか？`,
                yesLabel: '山札の上に置く', noLabel: 'そのままにする', purpose: 'trappers-lodge',
                callback: (yes) => {
                    if (!yes || !player.removeCard(card)) return;
                    game.spendFavors(player, 1, '猟師の小屋');
                    player.deck.unshift(card);
                    game.log(`${player.name}は${card.name}を山札の上に置きました`);
                }
            });
        }
    },
    WOODWORKERS_GUILD: {
        id: 'woodworkers_guild', name: '木工ギルド', kind: LANDSCAPE_KINDS.ALLY,
        description: '購入フェーズの開始時に、恩恵を1つ使って、手札のアクションカードを1枚廃棄してもよい。そうしたら、アクションカードを1枚獲得する',
        onStartBuyPhase: (game, player) => game.runNext(() => {
            if (!hasFavors(player, 1)) return;
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '木工ギルド',
                message: '恩恵を1つ使って廃棄するアクションカードを選んでください（選ばなくてもかまいません）。', confirmLabel: '廃棄する', purpose: 'woodworkers-guild',
                callback: ([card]) => {
                    if (!card) return;
                    game.spendFavors(player, 1, '木工ギルド');
                    game.trashFromHand(player, [player.hand.indexOf(card)]);
                    game.log(`${player.name}は${card.name}を廃棄しました`);
                    game.runNext(() => game.promptGain({
                        player, filter: (data) => data.types.includes(ACTION), title: '木工ギルド', message: 'アクションカードを1枚獲得してください。'
                    }));
                }
            });
        })
    }
};
