/**
 * 拡張「夜想曲」の王国カードデータ、家宝、サプライ外のカード（精霊・願い・コウモリ・ゾンビ）、祝福、呪詛
 * - 夜のカードは、購入フェーズの後の夜フェイズに、アクションを使わずにプレイする
 * - gainToHand のカードは、獲得すると手札に入る
 * - heirloom は家宝のカードID（その王国カードがあれば、初期デッキの銅貨1枚の代わりに入る）
 * - 祝福・呪詛は effect(player, game) で効果を使う（受け取り方は game-nocturne.js）
 */

import Card from './card.js';
import { CARD_TYPES } from './card-types.js';
import {
    isAction, isTreasure, isVictory, gainBenefits, promptFromHand, promptTrashFromHand,
    promptDiscardFromHand, discardDownTo, takeTopCards, putBackInAnyOrder, logReveal, curseAttack
} from './card-helpers.js';

const isDuration = (card) => card.types.includes(CARD_TYPES.DURATION);

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};
const gainNonSupply = (game, player, cardId, destination) => {
    const card = game.gainFromNonSupply(player, cardId, destination) ?? null;
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

// カードを交換する（このカードを山に戻し、もう一方のカードを山から捨て札に置く。獲得ではない）
const exchange = (game, player, card, otherId) => {
    const piles = game.supply[otherId] !== undefined ? game.supply : game.nonSupply;
    if (!(piles[otherId] > 0) || !game.returnToSupply(player, card)) return;
    piles[otherId]--;
    const other = new Card(game.getPileTopData(otherId) ?? { id: otherId });
    player.discard.push(other);
    game.log(`${player.name}は${card.name}を${other.name}と交換しました`);
};

// 手札の、場にないアクションカードを1枚プレイしてもよい（秘密集会・インプ）。プレイしたら onPlayed を呼ぶ
const playNewAction = (game, player, title, onPlayed = () => {}) => {
    const inPlay = new Set(player.playArea.map(card => card.id));
    promptFromHand(game, player, {
        min: 0,
        filter: (card) => isAction(card) && !inPlay.has(card.id),
        title,
        message: '場にないアクションカードを1枚プレイできます（選ばなくてもかまいません）。',
        confirmLabel: 'プレイする',
        purpose: 'play-new-action',
        callback: ([card]) => {
            if (!card) return;
            game.playCardFrom(player, card);
            onPlayed();
        }
    });
};

// 今のターンの開始時に、脇に置いたカードを1枚ずつ手札に加える（地下聖堂）
const takeOneEachTurn = (game, player, owner, cards, title) => {
    const take = () => {
        const remaining = cards.filter(card => player.setAside.includes(card));
        if (remaining.length === 0) return;
        const put = (card) => {
            player.setAside.splice(player.setAside.indexOf(card), 1);
            player.hand.push(card);
            game.log(`${player.name}は${title}のカードを1枚手札に加えました`);
            if (remaining.length > 1) player.addDuration(owner, take);
        };
        if (remaining.length === 1) {
            put(remaining[0]);
            return;
        }
        game.promptSelect({
            player, cards: remaining, min: 1, max: 1,
            title, message: '手札に加えるカードを1枚選んでください。', confirmLabel: '手札に加える', purpose: 'archive',
            callback: ([index]) => put(remaining[index])
        });
    };
    return take;
};

// ===== 家宝（その王国カードがあると、初期デッキの銅貨1枚の代わりに入る） =====
export const HEIRLOOM_CARDS = {
    GOAT: {
        id: 'goat', name: 'ヤギ', cost: 2, types: [CARD_TYPES.TREASURE, CARD_TYPES.HEIRLOOM], value: 1,
        description: '財宝 +1。プレイしたとき、手札のカードを1枚廃棄してもよい',
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            min: 0, title: 'ヤギ', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash'
        })
    },
    POUCH: {
        id: 'pouch', name: '小袋', cost: 2, types: [CARD_TYPES.TREASURE, CARD_TYPES.HEIRLOOM], value: 1,
        description: '財宝 +1。購入 +1',
        onPlay: (player) => { player.buys += 1; }
    },
    LUCKY_COIN: {
        id: 'lucky_coin', name: '幸運のコイン', cost: 4, types: [CARD_TYPES.TREASURE, CARD_TYPES.HEIRLOOM], value: 1,
        description: '財宝 +1。プレイしたとき、銀貨を1枚獲得する',
        onPlay: (player, game) => gainAndLog(game, player, 'silver')
    },
    MAGIC_LAMP: {
        id: 'magic_lamp', name: '魔法のランプ', cost: 0, types: [CARD_TYPES.TREASURE, CARD_TYPES.HEIRLOOM], value: 1,
        description: '財宝 +1。プレイしたとき、場にちょうど1枚だけのカードが6種類以上あれば、これを廃棄して願いを3枚獲得する',
        onPlay: (player, game, lamp) => {
            const counts = player.playArea.reduce((map, card) => map.set(card.id, (map.get(card.id) ?? 0) + 1), new Map());
            if ([...counts.values()].filter(count => count === 1).length < 6) return;
            if (!trashFromPlay(game, player, lamp)) return;
            [0, 1, 2].forEach(() => gainNonSupply(game, player, 'wish'));
        }
    },
    HAUNTED_MIRROR: {
        id: 'haunted_mirror', name: '呪いの鏡', cost: 0, types: [CARD_TYPES.TREASURE, CARD_TYPES.HEIRLOOM], value: 1,
        description: '財宝 +1。これを廃棄したとき、手札のアクションカードを1枚捨てて、幽霊を1枚獲得してもよい',
        onTrash: (player, game) => {
            if (!(game.nonSupply.ghost > 0)) return;
            promptFromHand(game, player, {
                min: 0, filter: isAction, title: '呪いの鏡', message: '捨てるアクションカードを選んでください（捨てると幽霊を獲得します）。',
                confirmLabel: '捨てる', purpose: 'haunted-mirror',
                callback: ([card]) => {
                    if (!card) return;
                    game.discardFromHand(player, [player.hand.indexOf(card)]);
                    gainNonSupply(game, player, 'ghost');
                }
            });
        }
    },
    PASTURE: {
        id: 'pasture', name: '牧草地', cost: 2, types: [CARD_TYPES.TREASURE, CARD_TYPES.VICTORY, CARD_TYPES.HEIRLOOM], value: 1,
        description: '財宝 +1。持っている屋敷1枚につき勝利点 1',
        pointsFor: (cards) => cards.filter(card => card.id === 'estate').length
    },
    CURSED_GOLD: {
        id: 'cursed_gold', name: '呪われた金貨', cost: 4, types: [CARD_TYPES.TREASURE, CARD_TYPES.HEIRLOOM], value: 3,
        description: '財宝 +3。プレイしたとき、呪いを1枚獲得する',
        onPlay: (player, game) => game.gainCurse(player)
    }
};

// ===== サプライ外のカード =====
export const NOCTURNE_NON_SUPPLY_CARDS = {
    WILL_O_WISP: {
        id: 'will_o_wisp', name: 'ウィル・オ・ウィスプ', cost: 0, types: [CARD_TYPES.ACTION, CARD_TYPES.SPIRIT],
        description: 'カードを1枚引く。アクション +1。山札の一番上を公開し、コスト2以下なら手札に加える（サプライにない）',
        count: 12,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            if (game.getCost(card) <= 2 && !game.hasExtraCost(card)) {
                player.hand.push(card);
                game.log(`${player.name}は${card.name}を手札に加えました`);
            } else {
                player.deck.unshift(card);
            }
        }
    },
    IMP: {
        id: 'imp', name: 'インプ', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.SPIRIT],
        description: 'カードを2枚引く。手札の、場にないアクションカードを1枚プレイしてもよい（サプライにない）',
        count: 13,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            playNewAction(game, player, 'インプ');
        }
    },
    GHOST: {
        id: 'ghost', name: '幽霊', cost: 4, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION, CARD_TYPES.SPIRIT],
        description: 'アクションカードが出るまで山札を公開し、他を捨て札にして、そのアクションカードを脇に置く。次のターンの開始時に、それを2回プレイする（サプライにない）',
        count: 6,
        onPlay: (player, game, ghost) => {
            const others = [];
            let action = null;
            for (;;) {
                const [card] = takeTopCards(player, 1);
                if (!card) break;
                if (isAction(card)) {
                    action = card;
                    break;
                }
                others.push(card);
            }
            if (others.length > 0) game.discardCards(player, others);
            if (!action) return;
            player.setAside.push(action);
            game.log(`${player.name}は${action.name}を脇に置きました`);
            player.addDuration(ghost, () => {
                if (!player.setAside.includes(action)) return;
                game.playMultipleTimes(player, action, 2, ghost, { asTreasure: false });
            });
        }
    },
    WISH: {
        id: 'wish', name: '願い', cost: 0, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。これを願いの山に戻す。戻したら、コスト6以下のカードを1枚獲得して手札に加える（サプライにない）',
        count: 12,
        onPlay: (player, game, wish) => {
            gainBenefits(player, game, { actions: 1 });
            if (!game.returnToSupply(player, wish)) return;
            game.log(`${player.name}は願いを山に戻しました`);
            game.promptGain({ player, maxCost: 6, destination: 'hand', title: '願い', message: 'コスト6以下のカードを1枚獲得してください（手札に加えます）。' });
        }
    },
    BAT: {
        id: 'bat', name: 'コウモリ', cost: 2, types: [CARD_TYPES.NIGHT],
        description: '手札のカードを2枚まで廃棄する。1枚以上廃棄したら、これをヴァンパイアと交換する（サプライにない）',
        count: 10,
        onPlay: (player, game, bat) => promptTrashFromHand(game, player, {
            min: 0, max: 2, title: 'コウモリ', message: '廃棄するカードを2枚まで選んでください。',
            purpose: 'bat-trash',
            callback: (trashed) => {
                if (trashed.length > 0) exchange(game, player, bat, 'vampire');
            }
        })
    },
    ZOMBIE_APPRENTICE: {
        id: 'zombie_apprentice', name: 'ゾンビの弟子', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.ZOMBIE],
        description: '手札のアクションカードを1枚廃棄してもよい。そうしたら、カードを3枚引きアクション +1',
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            min: 0, filter: isAction, title: 'ゾンビの弟子', message: '廃棄するアクションカードを選んでください（選ばなくてもかまいません）。',
            purpose: 'zombie-apprentice',
            callback: ([trashed]) => {
                if (trashed) gainBenefits(player, game, { cards: 3, actions: 1 });
            }
        })
    },
    ZOMBIE_MASON: {
        id: 'zombie_mason', name: 'ゾンビの石工', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.ZOMBIE],
        description: '山札の一番上のカードを廃棄する。それよりコストが1多いカードまでを1枚獲得してもよい',
        onPlay: (player, game) => {
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.trashCard(player, card);
            game.log(`${player.name}は山札の一番上の${card.name}を廃棄しました`);
            const maxCost = game.getCost(card) + 1;
            game.promptGain({
                player, maxCost, ...game.costExtras(card), optional: true,
                title: 'ゾンビの石工', message: `コスト${maxCost}以下のカードを1枚獲得できます（選ばなくてもかまいません）。`
            });
        }
    },
    ZOMBIE_SPY: {
        id: 'zombie_spy', name: 'ゾンビのスパイ', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.ZOMBIE],
        description: 'カードを1枚引く。アクション +1。山札の一番上を見て、捨て札にするか戻す',
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.promptConfirm({
                player, card, title: 'ゾンビのスパイ', message: `山札の一番上の${card.name}を捨て札にしますか？`,
                yesLabel: '捨て札にする', noLabel: '山札に戻す', purpose: 'scrying-pool-self',
                callback: (discard) => {
                    if (discard) {
                        game.discardCards(player, [card]);
                    } else {
                        player.deck.unshift(card);
                    }
                }
            });
        }
    }
};

// ===== 王国カード =====
export const NOCTURNE_CARDS = {
    // ===== コスト2 =====
    DRUID: {
        id: 'druid', name: 'ドルイド', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: '購入 +1。脇に置いた3枚の祝福から1つを受ける（祝福はそのまま残る）。準備：祝福の山の上から3枚を脇に置く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            if (game.druidBoons.length === 0) return;
            game.promptChoose({
                player,
                options: game.druidBoons.map(id => game.getBoon(id).name),
                title: 'ドルイド',
                message: '受ける祝福を選んでください。',
                purpose: 'druid',
                callback: ([index]) => game.receiveBoon(player, game.druidBoons[index], { discard: false })
            });
        }
    },
    FAITHFUL_HOUND: {
        id: 'faithful_hound', name: '忠犬', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。クリーンアップ以外でこれを捨てたとき、脇に置いて、ターンの終わりに手札に加えてもよい',
        reactionType: 'discard',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2 }),
        onDiscard: (player, game, hound) => game.promptConfirm({
            player, card: hound, title: '忠犬', message: '捨てた忠犬を脇に置き、ターンの終わりに手札に戻しますか？',
            yesLabel: '脇に置く', noLabel: 'そのままにする', purpose: 'faithful-hound',
            callback: (yes) => {
                if (!yes || !player.discard.includes(hound)) return;
                player.discard.splice(player.discard.indexOf(hound), 1);
                player.setAside.push(hound);
                game.turnState.hounds.push({ player, card: hound });
            }
        })
    },
    GUARDIAN: {
        id: 'guardian', name: '守護者', cost: 2, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION],
        description: '次のターンまで、他のプレイヤーのアタックの影響を受けない。次のターンの開始時に、財宝 +1。これは手札に獲得する',
        count: 10,
        gainToHand: true,
        onPlay: (player, game, guardian) => {
            player.guarded = true;
            player.addDuration(guardian, () => {
                player.guarded = false;
                gainBenefits(player, game, { coins: 1 }, '守護者');
            });
        }
    },
    MONASTERY: {
        id: 'monastery', name: '修道院', cost: 2, types: [CARD_TYPES.NIGHT],
        description: 'このターンに獲得したカード1枚につき、手札のカードか場の銅貨を1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game) => {
            const count = player.gainedThisTurn.length;
            const candidates = [...player.hand, ...player.playArea.filter(card => card.id === 'copper')];
            if (count === 0 || candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates, min: 0, max: count,
                title: '修道院', message: `廃棄するカード（手札か場の銅貨）を${count}枚まで選んでください。`, confirmLabel: '廃棄する', purpose: 'monastery',
                callback: (indices) => indices.map(index => candidates[index]).forEach(card => {
                    if (!player.removeCard(card)) return;
                    game.trashCard(player, card);
                    game.log(`${player.name}は${card.name}を廃棄しました`);
                })
            });
        }
    },
    PIXIE: {
        id: 'pixie', name: 'ピクシー', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: 'カードを1枚引く。アクション +1。祝福の山の一番上を捨て札にする。これを廃棄すると、その祝福を2回受けてもよい',
        count: 10,
        heirloom: 'goat',
        onPlay: (player, game, pixie) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const boonId = game.takeBoon();
            if (!boonId) return;
            game.boonDiscard.push(boonId);
            const boon = game.getBoon(boonId);
            game.log(`${player.name}は${boon.name}を捨て札にしました`);
            if (!player.playArea.includes(pixie)) return;
            game.promptConfirm({
                player, title: 'ピクシー', message: `ピクシーを廃棄して、${boon.name}を2回受けますか？（${boon.description}）`,
                yesLabel: '廃棄して受ける', noLabel: '受けない', purpose: 'pixie',
                callback: (yes) => {
                    if (!yes || !trashFromPlay(game, player, pixie)) return;
                    game.runNext(
                        () => game.receiveBoon(player, boonId, { discard: false }),
                        () => game.receiveBoon(player, boonId, { discard: false })
                    );
                }
            });
        }
    },
    TRACKER: {
        id: 'tracker', name: '追跡者', cost: 2, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: '財宝 +1。祝福を受ける。これが場にある間、カードを獲得したとき、それを山札の上に置いてもよい',
        count: 10,
        heirloom: 'pouch',
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 1 });
            game.receiveBoon(player);
        }
    },

    // ===== コスト3 =====
    CHANGELING: {
        id: 'changeling', name: '取り替え子', cost: 3, types: [CARD_TYPES.NIGHT],
        description: 'これを廃棄する。場にあるカードを1枚選び、同じカードを獲得する。このゲームでは、コスト3以上のカードを獲得したとき、取り替え子と交換してもよい',
        count: 10,
        onPlay: (player, game, changeling) => {
            if (!trashFromPlay(game, player, changeling)) return;
            const distinct = [...new Map(player.playArea.map(card => [card.id, card])).values()];
            if (distinct.length === 0) return;
            game.promptSelect({
                player, cards: distinct, min: 1, max: 1,
                title: '取り替え子', message: '獲得するカードを場から選んでください。', confirmLabel: '獲得する', purpose: 'changeling',
                callback: ([index]) => gainAndLog(game, player, distinct[index].id)
            });
        }
    },
    FOOL: {
        id: 'fool', name: '愚か者', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: '森で迷うを持っていなければ、それを受け取り、祝福を3枚取り、好きな順で受ける',
        count: 10,
        heirloom: 'lucky_coin',
        onPlay: (player, game) => {
            if (game.lostInTheWoods === player) return;
            game.takeState(player, 'lostInTheWoods');
            const boons = [game.takeBoon(), game.takeBoon(), game.takeBoon()].filter(Boolean);
            const next = () => {
                if (boons.length === 0) return;
                if (boons.length === 1) {
                    game.receiveBoon(player, boons.shift());
                    return;
                }
                game.promptChoose({
                    player,
                    options: boons.map(id => game.getBoon(id).name),
                    title: '愚か者',
                    message: '次に受ける祝福を選んでください。',
                    purpose: 'fool',
                    callback: ([index]) => {
                        const [id] = boons.splice(index, 1);
                        game.runNext(() => game.receiveBoon(player, id), next);
                    }
                });
            };
            next();
        }
    },
    GHOST_TOWN: {
        id: 'ghost_town', name: 'ゴーストタウン', cost: 3, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION],
        description: '次のターンの開始時に、カードを1枚引きアクション +1。これは手札に獲得する',
        count: 10,
        gainToHand: true,
        onPlay: (player, game, town) => player.addDuration(town, () => gainBenefits(player, game, { cards: 1, actions: 1 }, 'ゴーストタウン'))
    },
    LEPRECHAUN: {
        id: 'leprechaun', name: 'レプラコーン', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DOOM],
        description: '金貨を1枚獲得する。場にちょうど7枚のカードがあれば願いを1枚獲得する。そうでなければ呪詛を受ける',
        count: 10,
        nonSupplyPiles: { wish: 12 },
        onPlay: (player, game) => {
            gainAndLog(game, player, 'gold');
            if (player.playArea.length === 7) {
                gainNonSupply(game, player, 'wish');
            } else {
                game.receiveHex(player);
            }
        }
    },
    NIGHT_WATCHMAN: {
        id: 'night_watchman', name: '夜警', cost: 3, types: [CARD_TYPES.NIGHT],
        description: '山札の上から5枚を見て、好きな枚数を捨て札にし、残りを好きな順で山札の上に戻す。これは手札に獲得する',
        count: 10,
        gainToHand: true,
        onPlay: (player, game) => {
            const cards = takeTopCards(player, 5);
            if (cards.length === 0) return;
            game.promptSelect({
                player, cards, min: 0, max: cards.length,
                title: '夜警', message: '捨て札にするカードを選んでください。残りは山札の上に戻します。', confirmLabel: '捨てる', purpose: 'cartographer',
                callback: (indices) => {
                    const discarded = indices.map(index => cards[index]);
                    if (discarded.length > 0) game.discardCards(player, discarded);
                    putBackInAnyOrder(game, player, cards.filter(card => !discarded.includes(card)), '夜警');
                }
            });
        }
    },
    SECRET_CAVE: {
        id: 'secret_cave', name: '秘密の洞窟', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'カードを1枚引く。アクション +1。手札を3枚捨ててもよい。捨てたら、次のターンの開始時に財宝 +3',
        count: 10,
        heirloom: 'magic_lamp',
        nonSupplyPiles: { wish: 12 },
        onPlay: (player, game, cave) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            if (player.hand.length < 3) return;
            game.promptSelect({
                player, cards: player.hand, min: 0, max: 3,
                title: '秘密の洞窟', message: '手札を3枚捨てると、次のターンに財宝+3を得ます（捨てないなら選ばない）。', confirmLabel: '捨てる', purpose: 'secret-cave',
                callback: (indices) => {
                    if (indices.length < 3) return;
                    game.discardFromHand(player, indices);
                    game.log(`${player.name}は手札を3枚捨てました`);
                    player.addDuration(cave, () => gainBenefits(player, game, { coins: 3 }, '秘密の洞窟'));
                }
            });
        }
    },

    // ===== コスト4 =====
    BARD: {
        id: 'bard', name: '詩人', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: '財宝 +2。祝福を受ける',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            game.receiveBoon(player);
        }
    },
    BLESSED_VILLAGE: {
        id: 'blessed_village', name: '祝福の村', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: 'カードを1枚引く。アクション +2。これを獲得したとき、祝福を1枚取り、今か次のターンの開始時に受ける',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 1, actions: 2 }),
        onGain: (player, game) => {
            const boonId = game.takeBoon();
            if (!boonId) return;
            const boon = game.getBoon(boonId);
            game.promptConfirm({
                player, title: '祝福の村', message: `${boon.name}（${boon.description}）を今受けますか？（受けなければ次のターンの開始時に受けます）`,
                yesLabel: '今受ける', noLabel: '次のターンに受ける', purpose: 'blessed-village',
                callback: (now) => {
                    if (now) {
                        game.receiveBoon(player, boonId);
                    } else {
                        player.addDuration(null, () => game.receiveBoon(player, boonId));
                    }
                }
            });
        }
    },
    CEMETERY: {
        id: 'cemetery', name: '墓地', cost: 4, types: [CARD_TYPES.VICTORY],
        points: 2,
        description: '勝利点 2。これを獲得したとき、手札のカードを4枚まで廃棄する',
        heirloom: 'haunted_mirror',
        nonSupplyPiles: { ghost: 6 },
        onGain: (player, game) => promptTrashFromHand(game, player, {
            min: 0, max: 4, title: '墓地', message: '廃棄するカードを4枚まで選んでください。', purpose: 'cemetery'
        })
    },
    CONCLAVE: {
        id: 'conclave', name: '秘密集会', cost: 4, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。手札の、場にないアクションカードを1枚プレイしてもよい。プレイしたらアクション +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            playNewAction(game, player, '秘密集会', () => gainBenefits(player, game, { actions: 1 }, '秘密集会'));
        }
    },
    DEVILS_WORKSHOP: {
        id: 'devils_workshop', name: '悪魔の工房', cost: 4, types: [CARD_TYPES.NIGHT],
        description: 'このターンに獲得したカードが2枚以上ならインプを、1枚ならコスト4以下のカードを、0枚なら金貨を1枚獲得する',
        count: 10,
        nonSupplyPiles: { imp: 13 },
        onPlay: (player, game) => {
            const gained = player.gainedThisTurn.length;
            if (gained >= 2) gainNonSupply(game, player, 'imp');
            if (gained === 1) game.promptGain({ player, maxCost: 4, title: '悪魔の工房', message: 'コスト4以下のカードを1枚獲得してください。' });
            if (gained === 0) gainAndLog(game, player, 'gold');
        }
    },
    EXORCIST: {
        id: 'exorcist', name: '祓魔師', cost: 4, types: [CARD_TYPES.NIGHT],
        description: '手札のカードを1枚廃棄する。それより安い精霊（ウィル・オ・ウィスプ・インプ・幽霊）を1枚獲得する',
        count: 10,
        nonSupplyPiles: { will_o_wisp: 12, imp: 13, ghost: 6 },
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            title: '祓魔師', message: '廃棄するカードを1枚選んでください。', purpose: 'exorcist-trash',
            callback: ([trashed]) => {
                if (!trashed) return;
                const spirits = ['will_o_wisp', 'imp', 'ghost'].filter(id =>
                    game.nonSupply[id] > 0 && game.costsLessThan(NOCTURNE_NON_SUPPLY_CARDS[id.toUpperCase()], trashed));
                if (spirits.length === 0) return;
                game.promptSelect({
                    player, cards: spirits.map(id => new Card(NOCTURNE_NON_SUPPLY_CARDS[id.toUpperCase()])), min: 1, max: 1,
                    title: '祓魔師', message: '獲得する精霊を選んでください。', confirmLabel: '獲得する', purpose: 'gain',
                    callback: ([index]) => gainNonSupply(game, player, spirits[index])
                });
            }
        })
    },
    NECROMANCER: {
        id: 'necromancer', name: '死霊術師', cost: 4, types: [CARD_TYPES.ACTION],
        description: '廃棄置き場の表向きの持続以外のアクションカードを1枚、そこに置いたままプレイし、このターンの間は裏向きにする。準備：3種のゾンビを廃棄置き場に置く',
        count: 10,
        onPlay: (player, game) => {
            const candidates = [...new Map(game.trash
                .filter(card => isAction(card) && !isDuration(card) && !game.turnState.necromancerUsed.includes(card))
                .map(card => [card.id, card])).values()];
            if (candidates.length === 0) return;
            game.promptSelect({
                player, cards: candidates, min: 1, max: 1,
                title: '死霊術師', message: '廃棄置き場からプレイするカードを選んでください。', confirmLabel: 'プレイする', purpose: 'band-of-misfits',
                callback: ([index]) => {
                    const card = candidates[index];
                    game.turnState.necromancerUsed.push(card);
                    game.log(`${player.name}は死霊術師で廃棄置き場の${card.name}をプレイしました`);
                    card.play(player, game);
                }
            });
        }
    },
    SHEPHERD: {
        id: 'shepherd', name: '羊飼い', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。手札の勝利点カードを好きな枚数、公開して捨てる。1枚につきカードを2枚引く',
        count: 10,
        heirloom: 'pasture',
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            const victories = player.hand.filter(isVictory);
            if (victories.length === 0) return;
            game.promptSelect({
                player, cards: victories, min: 0, max: victories.length,
                title: '羊飼い', message: '捨てる勝利点カードを選んでください。1枚につきカードを2枚引きます。', confirmLabel: '捨てる', purpose: 'opulent-castle',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices.map(index => player.hand.indexOf(victories[index])));
                    if (discarded.length > 0) gainBenefits(player, game, { cards: 2 * discarded.length }, '羊飼い');
                }
            });
        }
    },
    SKULK: {
        id: 'skulk', name: '忍び寄る者', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.DOOM],
        description: '購入 +1。他のプレイヤーは次の呪詛を受ける。これを獲得したとき、金貨を1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1 });
            game.othersReceiveNextHex(player);
        },
        onGain: (player, game) => gainAndLog(game, player, 'gold')
    },

    // ===== コスト5 =====
    COBBLER: {
        id: 'cobbler', name: '靴屋', cost: 5, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION],
        description: '次のターンの開始時に、コスト4以下のカードを1枚獲得して手札に加える',
        count: 10,
        onPlay: (player, game, cobbler) => player.addDuration(cobbler, () => game.promptGain({
            player, maxCost: 4, destination: 'hand', title: '靴屋', message: 'コスト4以下のカードを1枚獲得してください（手札に加えます）。'
        }))
    },
    CRYPT: {
        id: 'crypt', name: '地下聖堂', cost: 5, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION],
        description: '場の財宝を好きな枚数脇に置く。それが残っている間、ターンの開始時に1枚ずつ手札に加える',
        count: 10,
        onPlay: (player, game, crypt) => {
            const treasures = player.playArea.filter(card => game.isTreasure(card));
            if (treasures.length === 0) return;
            game.promptSelect({
                player, cards: treasures, min: 0, max: treasures.length,
                title: '地下聖堂', message: '脇に置く場の財宝を選んでください。次のターンから1枚ずつ手札に加えます。', confirmLabel: '脇に置く', purpose: 'crypt',
                callback: (indices) => {
                    const cards = indices.map(index => treasures[index]);
                    if (cards.length === 0) return;
                    cards.forEach(card => player.playArea.splice(player.playArea.indexOf(card), 1));
                    player.setAside.push(...cards);
                    game.log(`${player.name}は財宝を${cards.length}枚脇に置きました`);
                    player.addDuration(crypt, takeOneEachTurn(game, player, crypt, cards, '地下聖堂'));
                }
            });
        }
    },
    CURSED_VILLAGE: {
        id: 'cursed_village', name: '呪われた村', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DOOM],
        description: 'アクション +2。手札が6枚になるまでカードを引く。これを獲得したとき、呪詛を受ける',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 2 });
            const count = Math.max(0, 6 - player.hand.length);
            if (count > 0) gainBenefits(player, game, { cards: count }, '呪われた村');
        },
        onGain: (player, game) => game.receiveHex(player)
    },
    DEN_OF_SIN: {
        id: 'den_of_sin', name: '悪の巣', cost: 5, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION],
        description: '次のターンの開始時に、カードを2枚引く。これは手札に獲得する',
        count: 10,
        gainToHand: true,
        onPlay: (player, game, den) => player.addDuration(den, () => gainBenefits(player, game, { cards: 2 }, '悪の巣'))
    },
    IDOL: {
        id: 'idol', name: '偶像', cost: 5, types: [CARD_TYPES.TREASURE, CARD_TYPES.FATE],
        value: 2,
        description: '財宝 +2。プレイしたとき、場の偶像が奇数枚なら祝福を受け、偶数枚なら他のプレイヤーは呪いを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            const idols = player.playArea.filter(card => card.id === 'idol').length;
            if (idols % 2 === 1) {
                game.receiveBoon(player);
            } else {
                curseAttack(game, player);
            }
        }
    },
    POOKA: {
        id: 'pooka', name: 'プーカ', cost: 5, types: [CARD_TYPES.ACTION],
        description: '手札の呪われた金貨以外の財宝を1枚廃棄してもよい。そうしたら、カードを4枚引く',
        count: 10,
        heirloom: 'cursed_gold',
        onPlay: (player, game) => promptTrashFromHand(game, player, {
            min: 0, filter: (card) => isTreasure(card) && card.id !== 'cursed_gold',
            title: 'プーカ', message: '廃棄する財宝を選んでください（廃棄するとカードを4枚引きます）。', purpose: 'pooka-trash',
            callback: ([trashed]) => {
                if (trashed) gainBenefits(player, game, { cards: 4 }, 'プーカ');
            }
        })
    },
    SACRED_GROVE: {
        id: 'sacred_grove', name: '聖なる木立', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.FATE],
        description: '購入 +1。財宝 +3。祝福を受ける。それが財宝 +1 を与えないなら、他のプレイヤーもそれを受けてよい',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { buys: 1, coins: 3 });
            const boonId = game.receiveBoon(player);
            if (!boonId || ['the_fields_gift', 'the_forests_gift'].includes(boonId)) return;
            game.runNext(...game.getOtherPlayers(player).map(other => () => game.promptConfirm({
                player: other, title: '聖なる木立', message: `${game.getBoon(boonId).name}を受けますか？`,
                yesLabel: '受ける', noLabel: '受けない', purpose: 'sacred-grove',
                callback: (yes) => {
                    if (yes) game.receiveBoon(other, boonId, { discard: false });
                }
            })));
        }
    },
    TORMENTOR: {
        id: 'tormentor', name: '苦悶を与える者', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.DOOM],
        description: '財宝 +2。場に他のカードがなければインプを1枚獲得する。そうでなければ、他のプレイヤーは次の呪詛を受ける',
        isAttack: true,
        count: 10,
        nonSupplyPiles: { imp: 13 },
        onPlay: (player, game, tormentor) => {
            gainBenefits(player, game, { coins: 2 });
            if (player.playArea.every(card => card === tormentor)) {
                gainNonSupply(game, player, 'imp');
            } else {
                game.othersReceiveNextHex(player);
            }
        }
    },
    TRAGIC_HERO: {
        id: 'tragic_hero', name: '悲劇のヒーロー', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。購入 +1。引いた後で手札が8枚以上なら、これを廃棄して財宝を1枚獲得する',
        count: 10,
        onPlay: (player, game, hero) => {
            gainBenefits(player, game, { cards: 3, buys: 1 });
            if (player.hand.length < 8 || !trashFromPlay(game, player, hero)) return;
            game.promptGain({ player, filter: (data) => data.types.includes(CARD_TYPES.TREASURE), title: '悲劇のヒーロー', message: '財宝を1枚獲得してください。' });
        }
    },
    VAMPIRE: {
        id: 'vampire', name: 'ヴァンパイア', cost: 5, types: [CARD_TYPES.NIGHT, CARD_TYPES.DOOM],
        description: '他のプレイヤーは次の呪詛を受ける。ヴァンパイア以外のコスト5以下のカードを1枚獲得する。これをコウモリと交換する',
        isAttack: true,
        count: 10,
        nonSupplyPiles: { bat: 10 },
        onPlay: (player, game, vampire) => {
            game.othersReceiveNextHex(player);
            game.runNext(
                () => game.promptGain({ player, maxCost: 5, filter: (data) => data.id !== 'vampire', title: 'ヴァンパイア', message: 'ヴァンパイア以外のコスト5以下のカードを1枚獲得してください。' }),
                () => {
                    if (player.playArea.includes(vampire)) exchange(game, player, vampire, 'bat');
                }
            );
        }
    },
    WEREWOLF: {
        id: 'werewolf', name: '人狼', cost: 5, types: [CARD_TYPES.ACTION, CARD_TYPES.NIGHT, CARD_TYPES.DOOM],
        description: '夜フェイズなら、他のプレイヤーは次の呪詛を受ける。そうでなければ、カードを3枚引く',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            if (game.phase === 'night') {
                game.othersReceiveNextHex(player);
            } else {
                gainBenefits(player, game, { cards: 3 });
            }
        }
    },

    // ===== コスト6 =====
    RAIDER: {
        id: 'raider', name: '襲撃者', cost: 6, types: [CARD_TYPES.NIGHT, CARD_TYPES.DURATION],
        description: '手札が5枚以上の他のプレイヤーは、あなたの場にあるカードと同じカードを1枚捨てる（なければ手札を公開する）。次のターンの開始時に、財宝 +3',
        isAttack: true,
        count: 10,
        onPlay: (player, game, raider) => {
            const inPlay = new Set(player.playArea.map(card => card.id));
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length < 5) return;
                const copies = target.hand.filter(card => inPlay.has(card.id));
                if (copies.length === 0) {
                    logReveal(game, target, target.hand);
                    return;
                }
                promptFromHand(game, target, {
                    filter: (card) => inPlay.has(card.id), title: '襲撃者', message: `${player.name}の場にあるカードと同じカードを1枚捨ててください。`,
                    confirmLabel: '捨てる', purpose: 'raider-discard',
                    callback: ([card]) => {
                        game.discardFromHand(target, [target.hand.indexOf(card)]);
                        game.log(`${target.name}は${card.name}を捨てました`);
                    }
                });
            });
            player.addDuration(raider, () => gainBenefits(player, game, { coins: 3 }, '襲撃者'));
        }
    }
};

// ===== 祝福 =====
const boon = (key, id, name, description, effect) => ({ [key]: { id, name, description, effect } });

export const BOONS = {
    ...boon('THE_EARTHS_GIFT', 'the_earths_gift', '大地の恵み', '手札の財宝を1枚捨ててもよい。そうしたら、コスト4以下のカードを1枚獲得する', (player, game) => promptFromHand(game, player, {
        min: 0, filter: isTreasure, title: '大地の恵み', message: '捨てる財宝を選んでください（捨てるとコスト4以下のカードを獲得します）。',
        confirmLabel: '捨てる', purpose: 'earths-gift',
        callback: ([card]) => {
            if (!card) return;
            game.discardFromHand(player, [player.hand.indexOf(card)]);
            game.promptGain({ player, maxCost: 4, title: '大地の恵み', message: 'コスト4以下のカードを1枚獲得してください。' });
        }
    })),
    ...boon('THE_FIELDS_GIFT', 'the_fields_gift', '野の恵み', 'アクション +1。財宝 +1', (player, game) => gainBenefits(player, game, { actions: 1, coins: 1 })),
    ...boon('THE_FLAMES_GIFT', 'the_flames_gift', '炎の恵み', '手札のカードを1枚廃棄してもよい', (player, game) => promptTrashFromHand(game, player, {
        min: 0, title: '炎の恵み', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash'
    })),
    ...boon('THE_FORESTS_GIFT', 'the_forests_gift', '森の恵み', '購入 +1。財宝 +1', (player, game) => gainBenefits(player, game, { buys: 1, coins: 1 })),
    ...boon('THE_MOONS_GIFT', 'the_moons_gift', '月の恵み', '捨て札を見て、1枚を山札の上に置いてもよい', (player, game) => {
        if (player.discard.length === 0) return;
        game.promptSelect({
            player, cards: [...player.discard], min: 0, max: 1,
            title: '月の恵み', message: '山札の上に置くカードを捨て札から選んでください（選ばなくてもかまいません）。', confirmLabel: '山札の上に置く', purpose: 'harbinger',
            callback: ([index]) => {
                if (index === undefined) return;
                const [card] = player.discard.splice(index, 1);
                player.deck.unshift(card);
                game.log(`${player.name}は${card.name}を山札の上に置きました`);
            }
        });
    }),
    ...boon('THE_MOUNTAINS_GIFT', 'the_mountains_gift', '山の恵み', '銀貨を1枚獲得する', (player, game) => gainAndLog(game, player, 'silver')),
    ...boon('THE_RIVERS_GIFT', 'the_rivers_gift', '川の恵み', 'このターンの終わりに、カードを1枚引く', (player, game) => {
        if (player === game.getCurrentPlayer()) {
            game.turnState.riverDraw++;
        } else {
            gainBenefits(player, game, { cards: 1 }, '川の恵み');
        }
    }),
    ...boon('THE_SEAS_GIFT', 'the_seas_gift', '海の恵み', 'カードを1枚引く', (player, game) => gainBenefits(player, game, { cards: 1 })),
    ...boon('THE_SKYS_GIFT', 'the_skys_gift', '空の恵み', '手札を3枚捨ててもよい。そうしたら、金貨を1枚獲得する', (player, game) => {
        if (player.hand.length < 3) return;
        game.promptSelect({
            player, cards: player.hand, min: 0, max: 3,
            title: '空の恵み', message: '手札を3枚捨てると金貨を獲得します（捨てないなら選ばない）。', confirmLabel: '捨てる', purpose: 'skys-gift',
            callback: (indices) => {
                if (indices.length < 3) return;
                game.discardFromHand(player, indices);
                gainAndLog(game, player, 'gold');
            }
        });
    }),
    ...boon('THE_SUNS_GIFT', 'the_suns_gift', '太陽の恵み', '山札の上から4枚を見て、好きな枚数を捨て札にし、残りを好きな順で山札の上に戻す', (player, game) => {
        const cards = takeTopCards(player, 4);
        if (cards.length === 0) return;
        game.promptSelect({
            player, cards, min: 0, max: cards.length,
            title: '太陽の恵み', message: '捨て札にするカードを選んでください。残りは山札の上に戻します。', confirmLabel: '捨てる', purpose: 'cartographer',
            callback: (indices) => {
                const discarded = indices.map(index => cards[index]);
                if (discarded.length > 0) game.discardCards(player, discarded);
                putBackInAnyOrder(game, player, cards.filter(card => !discarded.includes(card)), '太陽の恵み');
            }
        });
    }),
    ...boon('THE_SWAMPS_GIFT', 'the_swamps_gift', '沼の恵み', 'ウィル・オ・ウィスプを1枚獲得する', (player, game) => gainNonSupply(game, player, 'will_o_wisp')),
    ...boon('THE_WINDS_GIFT', 'the_winds_gift', '風の恵み', 'カードを2枚引く。手札を2枚捨てる', (player, game) => {
        gainBenefits(player, game, { cards: 2 });
        promptDiscardFromHand(game, player, 2, '風の恵み');
    })
};

// ===== 呪詛 =====
const hex = (key, id, name, description, effect) => ({ [key]: { id, name, description, effect } });

export const HEXES = {
    ...hex('BAD_OMENS', 'bad_omens', '凶兆', '山札をすべて捨て札にする。捨て札から銅貨を2枚山札の上に置く（なければ公開する）', (player, game) => {
        player.discard.push(...player.deck.splice(0));
        const coppers = player.discard.filter(card => card.id === 'copper').slice(0, 2);
        coppers.forEach(card => player.discard.splice(player.discard.indexOf(card), 1));
        player.deck.unshift(...coppers);
        game.log(`${player.name}は山札を捨て札にし、銅貨を${coppers.length}枚山札の上に置きました`);
    }),
    ...hex('DELUSION', 'delusion', '妄想', '妄想も羨望も持っていなければ、妄想を受け取る（次の購入フェーズに、アクションを購入できない）', (player, game) => game.takeState(player, 'deluded')),
    ...hex('ENVY', 'envy', '羨望', '妄想も羨望も持っていなければ、羨望を受け取る（次の購入フェーズに、銀貨と金貨は財宝1）', (player, game) => game.takeState(player, 'envious')),
    ...hex('FAMINE', 'famine', '飢饉', '山札の上から3枚を公開し、アクションを捨て札にし、残りを山札に混ぜる', (player, game) => {
        const cards = takeTopCards(player, 3);
        logReveal(game, player, cards, '山札の上から3枚');
        const actions = cards.filter(isAction);
        if (actions.length > 0) game.discardCards(player, actions);
        player.deck.push(...cards.filter(card => !actions.includes(card)));
        player.shuffleDeck();
    }),
    ...hex('FEAR', 'fear', '恐怖', '手札が5枚以上なら、アクションか財宝を1枚捨てる（なければ公開する）', (player, game) => {
        if (player.hand.length < 5) return;
        if (!player.hand.some(card => isAction(card) || isTreasure(card))) {
            logReveal(game, player, player.hand);
            return;
        }
        promptFromHand(game, player, {
            filter: (card) => isAction(card) || isTreasure(card), title: '恐怖', message: '捨てるアクションか財宝を1枚選んでください。',
            confirmLabel: '捨てる', purpose: 'discard-down',
            callback: ([card]) => game.discardFromHand(player, [player.hand.indexOf(card)])
        });
    }),
    ...hex('GREED', 'greed', '強欲', '銅貨を1枚獲得し、山札の上に置く', (player, game) => gainAndLog(game, player, 'copper', 'deck')),
    ...hex('HAUNTING', 'haunting', '憑依', '手札が4枚以上なら、1枚を山札の上に置く', (player, game) => {
        if (player.hand.length < 4) return;
        promptFromHand(game, player, {
            title: '憑依', message: '山札の上に置くカードを1枚選んでください。', confirmLabel: '山札の上に置く', purpose: 'topdeck-from-hand',
            callback: ([card]) => {
                player.hand.splice(player.hand.indexOf(card), 1);
                player.deck.unshift(card);
            }
        });
    }),
    ...hex('LOCUSTS', 'locusts', 'イナゴ', '山札の一番上のカードを廃棄する。銅貨か屋敷なら呪いを獲得する。そうでなければ、それより安く種類が共通するカードを1枚獲得する', (player, game) => {
        const [card] = takeTopCards(player, 1);
        if (!card) return;
        game.trashCard(player, card);
        game.log(`${player.name}は山札の一番上の${card.name}を廃棄しました`);
        if (card.id === 'copper' || card.id === 'estate') {
            game.gainCurse(player);
            return;
        }
        game.promptGain({
            player, lessThan: card, filter: (data) => data.types.some(type => card.types.includes(type)),
            title: 'イナゴ', message: `${card.name}より安く、種類が共通するカードを1枚獲得してください。`
        });
    }),
    ...hex('MISERY', 'misery', '不幸', 'このゲームで初めてなら不幸を受け取る（勝利点 -2）。そうでなければ二重の不幸にする（勝利点 -4）', (player, game) => game.takeState(player, 'miserable')),
    ...hex('PLAGUE', 'plague', '疫病', '呪いを1枚獲得して手札に加える', (player, game) => game.gainCurse(player, 'hand')),
    ...hex('POVERTY', 'poverty', '貧困', '手札が3枚になるまで捨てる', (player, game) => discardDownTo(game, player, 3, '貧困')),
    ...hex('WAR', 'war', '戦争', 'コスト3か4のカードが出るまで山札を公開し、それを廃棄して、残りを捨て札にする', (player, game) => {
        const others = [];
        for (;;) {
            const [card] = takeTopCards(player, 1);
            if (!card) break;
            const cost = game.getCost(card);
            if ((cost === 3 || cost === 4) && !game.hasExtraCost(card)) {
                game.trashCard(player, card);
                game.log(`${player.name}は${card.name}を廃棄しました`);
                break;
            }
            others.push(card);
        }
        if (others.length > 0) game.discardCards(player, others);
    })
};

// ゾンビのカードID（死霊術師があれば、準備で廃棄置き場に置く）
export const ZOMBIE_IDS = ['zombie_apprentice', 'zombie_mason', 'zombie_spy'];
