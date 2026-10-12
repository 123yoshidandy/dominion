/**
 * 拡張「ルネサンス」の王国カードデータとプロジェクト
 * - 村人（player.villagers）：アクションフェーズに使うとアクション+1ずつ
 * - アーティファクト（旗・角笛・鍵・ランタン・宝箱）：持ち主は1人だけ。カードの artifacts で使うものを決める（game.artifacts）
 * - プロジェクト：購入すると自分のキューブを置き、以後ずっと効果がある（1人1回。player.projects）
 *   onStartOfTurn・onGainAny・onTrashAny・onEndOfBuyPhase のきっかけと、運河・資本主義・城塞・星図・艦隊はゲーム本体で扱う
 */

import { CARD_TYPES, LANDSCAPE_KINDS } from './card-types.js';
import {
    isAction, isTreasure, isVictory, isCurse, names, gainBenefits, promptFromHand, promptTrashFromHand,
    takeTopCards, putBackInAnyOrder, logReveal
} from './card-helpers.js';

const gainAndLog = (game, player, cardId, destination) => {
    const card = game.gainCardFromSupply(player, cardId, destination) ?? null;
    if (card) game.log(`${player.name}は${card.name}を獲得しました`);
    return card;
};

// 村人・財源を得る
const villagers = (player, game, amount, source) => {
    player.villagers += amount;
    game.log(`${player.name}は${source ? `${source}で` : ''}村人を${amount}人得ました`);
};
const coffers = (player, game, amount, source) => {
    player.coffers += amount;
    game.log(`${player.name}は${source ? `${source}で` : ''}財源を${amount}つ得ました`);
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

export const RENAISSANCE_CARDS = {
    // ===== コスト2 =====
    BORDER_GUARD: {
        id: 'border_guard', name: '国境警備隊', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'アクション +1。山札の上から2枚を公開し、1枚を手札に加え、もう1枚を捨て札にする。両方アクションならランタンか角笛を受け取る',
        count: 10,
        artifacts: ['lantern', 'horn'],
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 1 });
            // ランタン：3枚公開して2枚捨てる（3枚ともアクションなら角笛などを受け取る）
            const count = game.hasArtifact(player, 'lantern') ? 3 : 2;
            const revealed = takeTopCards(player, count);
            if (revealed.length === 0) return;
            logReveal(game, player, revealed, `山札の上から${revealed.length}枚`);
            const finish = (kept) => {
                player.hand.push(kept);
                const rest = revealed.filter(card => card !== kept);
                if (rest.length > 0) game.discardCards(player, rest);
                game.log(`${player.name}は${kept.name}を手札に加えました`);
                if (revealed.length === count && revealed.every(isAction)) {
                    game.promptChoose({
                        player,
                        options: ['ランタン', '角笛'],
                        title: '国境警備隊',
                        message: '受け取るアーティファクトを選んでください。',
                        purpose: 'border-guard-artifact',
                        callback: ([index]) => game.takeArtifact(player, index === 0 ? 'lantern' : 'horn')
                    });
                }
            };
            if (revealed.length === 1) {
                finish(revealed[0]);
                return;
            }
            game.promptSelect({
                player, cards: revealed, min: 1, max: 1,
                title: '国境警備隊', message: '手札に加えるカードを1枚選んでください。残りは捨て札にします。', confirmLabel: '手札に加える', purpose: 'raze-take',
                callback: ([index]) => finish(revealed[index])
            });
        },
        // 角笛：1ターンに1回、場から捨て札にするとき、山札の上に置いてもよい
        onCleanup: (player, game, guard) => {
            if (!game.hasArtifact(player, 'horn') || game.turnState.hornUsed) return;
            game.promptConfirm({
                player, card: guard, title: '角笛', message: '国境警備隊を山札の上に置きますか？',
                yesLabel: '山札の上に置く', noLabel: '捨て札にする', purpose: 'horn',
                callback: (yes) => {
                    const index = player.playArea.indexOf(guard);
                    if (!yes || index < 0) return;
                    game.turnState.hornUsed = true;
                    player.playArea.splice(index, 1);
                    player.deck.unshift(guard);
                    game.log(`${player.name}は角笛で国境警備隊を山札の上に置きました`);
                }
            });
        }
    },
    DUCAT: {
        id: 'ducat', name: 'ドゥカート金貨', cost: 2, types: [CARD_TYPES.TREASURE],
        value: 0,
        description: '財源 +1。購入 +1。これを獲得したとき、手札の銅貨を1枚廃棄してもよい',
        count: 10,
        onPlay: (player, game) => {
            player.buys += 1;
            coffers(player, game, 1, 'ドゥカート金貨');
        },
        onGain: (player, game) => promptTrashFromHand(game, player, {
            min: 0, filter: (card) => card.id === 'copper', title: 'ドゥカート金貨', message: '廃棄する銅貨を選んでください（選ばなくてもかまいません）。',
            purpose: 'optional-trash'
        })
    },
    LACKEYS: {
        id: 'lackeys', name: '従僕', cost: 2, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。これを獲得したとき、村人 +2',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2 }),
        onGain: (player, game) => villagers(player, game, 2, '従僕')
    },

    // ===== コスト3 =====
    ACTING_TROUPE: {
        id: 'acting_troupe', name: '劇団', cost: 3, types: [CARD_TYPES.ACTION],
        description: '村人 +4。これを廃棄する',
        count: 10,
        onPlay: (player, game, troupe) => {
            villagers(player, game, 4, '劇団');
            trashFromPlay(game, player, troupe);
        }
    },
    CARGO_SHIP: {
        id: 'cargo_ship', name: '貨物船', cost: 3, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: '財宝 +2。このターンに1回、カードを獲得したとき、それを脇に置いてもよい。次のターンの開始時に、それを手札に加える',
        count: 10,
        onPlay: (player, game, ship) => {
            gainBenefits(player, game, { coins: 2 });
            game.turnState.cargoShips.push(ship);
        }
    },
    EXPERIMENT: {
        id: 'experiment', name: '実験', cost: 3, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1。これをサプライに戻す。これを獲得したとき、実験をもう1枚獲得する（そのときはもう1枚は来ない）',
        count: 10,
        onPlay: (player, game, experiment) => {
            gainBenefits(player, game, { cards: 2, actions: 1 });
            if (game.returnToSupply(player, experiment)) game.log(`${player.name}は実験をサプライに戻しました`);
        },
        onGain: (player, game, experiment) => {
            // 実験で一緒に獲得したもう1枚は、さらにもう1枚を連れてこない
            if (experiment.fromExperiment) return;
            const another = gainAndLog(game, player, 'experiment');
            if (another) another.fromExperiment = true;
        }
    },
    IMPROVE: {
        id: 'improve', name: '改善', cost: 3, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。クリーンアップの開始時に、このターン場から捨て札にするアクションカードを1枚廃棄し、それよりコストがちょうど1多いカードを獲得してもよい',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { coins: 2 }),
        onCleanup: (player, game) => {
            const actions = player.playArea.filter(card => isAction(card) && !player.hasPendingDuration(card));
            if (actions.length === 0) return;
            game.promptSelect({
                player, cards: actions, min: 0, max: 1,
                title: '改善', message: '廃棄して改善するアクションカードを選んでください（選ばなくてもかまいません）。', confirmLabel: '廃棄する', purpose: 'improve',
                callback: ([index]) => {
                    const card = actions[index];
                    if (!card) return;
                    let trashed = false;
                    game.runNext(
                        () => { trashed = trashFromPlay(game, player, card); },
                        () => {
                            if (!trashed) return;
                            const cost = game.getCost(card) + 1;
                            game.promptGain({ player, exactCost: cost, ...game.costExtras(card), title: '改善', message: `コストがちょうど${cost}のカードを1枚獲得してください。` });
                        }
                    );
                }
            });
        }
    },

    // ===== コスト4 =====
    FLAG_BEARER: {
        id: 'flag_bearer', name: '旗手', cost: 4, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。これを獲得したときと廃棄したとき、旗を受け取る（旗：手札を引くとき、カードを1枚多く引く）',
        count: 10,
        artifacts: ['flag'],
        onPlay: (player, game) => gainBenefits(player, game, { coins: 2 }),
        onGain: (player, game) => game.takeArtifact(player, 'flag'),
        onTrash: (player, game) => game.takeArtifact(player, 'flag')
    },
    HIDEOUT: {
        id: 'hideout', name: '隠れ家', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2。手札のカードを1枚廃棄する。それが勝利点カードなら、呪いを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 2 });
            promptTrashFromHand(game, player, {
                title: '隠れ家', message: '廃棄するカードを1枚選んでください。勝利点カードなら呪いを獲得します。', purpose: 'hideout-trash',
                callback: ([trashed]) => {
                    if (trashed && isVictory(trashed)) game.gainCurse(player);
                }
            });
        }
    },
    INVENTOR: {
        id: 'inventor', name: '発明家', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得する。その後、このターンのカードのコストは1少なくなる',
        count: 10,
        onPlay: (player, game) => {
            game.promptGain({ player, maxCost: 4, title: '発明家', message: 'コスト4以下のカードを1枚獲得してください。' });
            game.runNext(() => {
                game.turnState.costReduction += 1;
                game.log('このターン、カードのコストが1少なくなりました');
            });
        }
    },
    MOUNTAIN_VILLAGE: {
        id: 'mountain_village', name: '山村', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'アクション +2。捨て札を見て、1枚を手札に加える。できなければ、カードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { actions: 2 });
            if (player.discard.length === 0) {
                gainBenefits(player, game, { cards: 1 }, '山村');
                return;
            }
            game.promptSelect({
                player, cards: [...player.discard], min: 1, max: 1,
                title: '山村', message: '手札に加えるカードを捨て札から1枚選んでください。', confirmLabel: '手札に加える', purpose: 'scavenger-topdeck',
                callback: ([index]) => {
                    const [card] = player.discard.splice(index, 1);
                    player.hand.push(card);
                    game.log(`${player.name}は捨て札の${card.name}を手札に加えました`);
                }
            });
        }
    },
    PATRON: {
        id: 'patron', name: '後援者', cost: 4, types: [CARD_TYPES.ACTION],
        description: '村人 +1。財宝 +2。何かの効果でこれを公開したとき、財源 +1',
        reactionType: 'reveal',
        count: 10,
        onPlay: (player, game) => {
            villagers(player, game, 1, '後援者');
            gainBenefits(player, game, { coins: 2 });
        },
        onReveal: (player, game) => coffers(player, game, 1, '後援者')
    },
    PRIEST: {
        id: 'priest', name: '司祭', cost: 4, types: [CARD_TYPES.ACTION],
        description: '財宝 +2。手札のカードを1枚廃棄する。このターンの残りの間、カードを廃棄するたびに財宝 +2',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { coins: 2 });
            promptTrashFromHand(game, player, {
                title: '司祭', message: '廃棄するカードを1枚選んでください。', purpose: 'priest-trash',
                callback: () => { game.turnState.priests++; }
            });
            if (player.hand.length === 0) game.turnState.priests++;
        }
    },
    RESEARCH: {
        id: 'research', name: '研究', cost: 4, types: [CARD_TYPES.ACTION, CARD_TYPES.DURATION],
        description: 'アクション +1。手札のカードを1枚廃棄する。そのコスト1につき、山札の上から1枚を脇に置く。次のターンの開始時に、それを手札に加える',
        count: 10,
        onPlay: (player, game, research) => {
            gainBenefits(player, game, { actions: 1 });
            promptTrashFromHand(game, player, {
                title: '研究', message: '廃棄するカードを1枚選んでください。コストの分だけ山札のカードを脇に置きます。', purpose: 'research-trash',
                callback: ([trashed]) => {
                    if (!trashed) return;
                    const cards = takeTopCards(player, game.getCost(trashed));
                    if (cards.length === 0) return;
                    player.setAside.push(...cards);
                    game.log(`${player.name}は山札の上から${cards.length}枚を脇に置きました`);
                    player.addDuration(research, () => {
                        const back = cards.filter(card => player.setAside.includes(card));
                        back.forEach(card => player.setAside.splice(player.setAside.indexOf(card), 1));
                        player.hand.push(...back);
                        game.log(`${player.name}は研究で脇に置いたカードを${back.length}枚手札に加えました`);
                    });
                }
            });
        }
    },
    SILK_MERCHANT: {
        id: 'silk_merchant', name: '絹商人', cost: 4, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。購入 +1。これを獲得したときと廃棄したとき、財源 +1 と村人 +1',
        count: 10,
        onPlay: (player, game) => gainBenefits(player, game, { cards: 2, buys: 1 }),
        onGain: (player, game) => {
            coffers(player, game, 1, '絹商人');
            villagers(player, game, 1, '絹商人');
        },
        onTrash: (player, game) => {
            coffers(player, game, 1, '絹商人');
            villagers(player, game, 1, '絹商人');
        }
    },

    // ===== コスト5 =====
    OLD_WITCH: {
        id: 'old_witch', name: '老魔女', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。他のプレイヤーは呪いを1枚獲得し、手札の呪いを1枚廃棄してもよい',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            game.attackOtherPlayers(player, (target) => {
                game.gainCurse(target);
                promptTrashFromHand(game, target, {
                    min: 0, filter: isCurse, title: '老魔女', message: '手札の呪いを1枚廃棄できます（選ばなくてもかまいません）。', purpose: 'optional-trash'
                });
            });
        }
    },
    RECRUITER: {
        id: 'recruiter', name: '徴募官', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。手札のカードを1枚廃棄し、そのコスト1につき村人 +1',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 2 });
            promptTrashFromHand(game, player, {
                title: '徴募官', message: '廃棄するカードを1枚選んでください。コスト1につき村人+1を得ます。', purpose: 'recruiter-trash',
                callback: ([trashed]) => {
                    const cost = trashed ? game.getCost(trashed) : 0;
                    if (cost > 0) villagers(player, game, cost, '徴募官');
                }
            });
        }
    },
    SCEPTER: {
        id: 'scepter', name: '笏', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 0,
        description: 'プレイしたとき、次のうち1つを選ぶ：財宝 +2、またはこのターンにプレイしてまだ場にあるアクションカードを1枚もう一度プレイする',
        count: 10,
        onPlay: (player, game, scepter) => {
            const actions = [...new Map(player.playArea.filter(isAction).map(card => [card.id, card])).values()];
            game.promptChoose({
                player,
                card: scepter,
                options: ['財宝 +2', `場のアクションをもう一度プレイする${actions.length === 0 ? '（場にない）' : ''}`],
                title: '笏',
                message: '1つ選んでください。',
                purpose: 'scepter',
                callback: ([index]) => {
                    if (index === 0 || actions.length === 0) {
                        gainBenefits(player, game, { coins: 2 });
                        return;
                    }
                    game.promptSelect({
                        player, cards: actions, min: 1, max: 1,
                        title: '笏', message: 'もう一度プレイするアクションカードを選んでください。', confirmLabel: 'プレイする', purpose: 'play-new-action',
                        callback: ([i]) => {
                            const card = actions[i];
                            game.log(`${player.name}は笏で${card.name}をもう一度プレイしました`);
                            card.play(player, game);
                        }
                    });
                }
            });
        }
    },
    SCHOLAR: {
        id: 'scholar', name: '学者', cost: 5, types: [CARD_TYPES.ACTION],
        description: '手札をすべて捨てる。カードを7枚引く',
        count: 10,
        onPlay: (player, game) => {
            const discarded = game.discardFromHand(player, player.hand.map((card, index) => index));
            if (discarded.length > 0) game.log(`${player.name}は手札を${discarded.length}枚捨てました`);
            gainBenefits(player, game, { cards: 7 });
        }
    },
    SCULPTOR: {
        id: 'sculptor', name: '彫刻家', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得して手札に加える。それが財宝なら村人 +1',
        count: 10,
        onPlay: (player, game) => game.promptGain({
            player, maxCost: 4, destination: 'hand', title: '彫刻家', message: 'コスト4以下のカードを1枚獲得してください（手札に加えます）。',
            onGained: (card) => {
                if (isTreasure(card)) villagers(player, game, 1, '彫刻家');
            }
        })
    },
    SEER: {
        id: 'seer', name: '予見者', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。山札の上から3枚を公開し、コスト2〜4のカードを手札に加え、残りを好きな順で山札の上に戻す',
        count: 10,
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 1, actions: 1 });
            const revealed = takeTopCards(player, 3);
            if (revealed.length === 0) return;
            logReveal(game, player, revealed, '山札の上から3枚');
            const toHand = revealed.filter(card => {
                const cost = game.getCost(card);
                return cost >= 2 && cost <= 4 && !game.hasExtraCost(card);
            });
            player.hand.push(...toHand);
            if (toHand.length > 0) game.log(`${player.name}は${names(toHand)}を手札に加えました`);
            putBackInAnyOrder(game, player, revealed.filter(card => !toHand.includes(card)), '予見者');
        }
    },
    SPICES: {
        id: 'spices', name: '香辛料', cost: 5, types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2。購入 +1。これを獲得したとき、財源 +2',
        count: 10,
        onPlay: (player) => { player.buys += 1; },
        onGain: (player, game) => coffers(player, game, 2, '香辛料')
    },
    SWASHBUCKLER: {
        id: 'swashbuckler', name: '剣客', cost: 5, types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く。捨て札にカードがあれば、財源 +1。その後で財源が4以上なら、宝箱を受け取る（宝箱：購入フェーズの開始時に金貨を獲得する）',
        count: 10,
        artifacts: ['treasure_chest'],
        onPlay: (player, game) => {
            gainBenefits(player, game, { cards: 3 });
            if (player.discard.length === 0) return;
            coffers(player, game, 1, '剣客');
            if (player.coffers >= 4) game.takeArtifact(player, 'treasure_chest');
        }
    },
    TREASURER: {
        id: 'treasurer', name: '会計係', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財宝 +3。次のうち1つを選ぶ：手札の財宝を1枚廃棄する、廃棄置き場の財宝を1枚獲得して手札に加える、鍵を受け取る（鍵：ターンの開始時に財宝 +1）',
        count: 10,
        artifacts: ['key'],
        onPlay: (player, game, treasurer) => {
            gainBenefits(player, game, { coins: 3 });
            game.promptChoose({
                player,
                card: treasurer,
                options: ['手札の財宝を1枚廃棄する', '廃棄置き場の財宝を獲得する', '鍵を受け取る'],
                title: '会計係',
                message: '1つ選んでください。',
                purpose: 'treasurer',
                callback: ([index]) => {
                    if (index === 0) {
                        promptTrashFromHand(game, player, { filter: isTreasure, title: '会計係', message: '廃棄する財宝を選んでください。', purpose: 'optional-trash' });
                    }
                    if (index === 1) {
                        const treasures = game.trash.filter(isTreasure);
                        if (treasures.length === 0) return;
                        game.promptSelect({
                            player, cards: treasures, min: 1, max: 1,
                            title: '会計係', message: '獲得する財宝を選んでください（手札に加えます）。', confirmLabel: '獲得する', purpose: 'gain-from-trash',
                            callback: ([i]) => {
                                const card = treasures[i];
                                if (!game.takeFromTrash(card)) return;
                                game.log(`${player.name}は廃棄置き場の${card.name}を獲得しました`);
                                game.gainCardInstance(player, card, 'hand');
                            }
                        });
                    }
                    if (index === 2) game.takeArtifact(player, 'key');
                }
            });
        }
    },
    VILLAIN: {
        id: 'villain', name: '悪党', cost: 5, types: [CARD_TYPES.ACTION],
        description: '財源 +2。手札が5枚以上の他のプレイヤーは、コスト2以上のカードを1枚捨てる（なければ手札を公開する）',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            coffers(player, game, 2, '悪党');
            game.attackOtherPlayers(player, (target) => {
                if (target.hand.length < 5) return;
                const filter = (card) => game.getCost(card) >= 2 || game.hasExtraCost(card);
                if (!target.hand.some(filter)) {
                    logReveal(game, target, target.hand);
                    return;
                }
                promptFromHand(game, target, {
                    filter, title: '悪党', message: 'コスト2以上のカードを1枚捨ててください。', confirmLabel: '捨てる', purpose: 'discard-down',
                    callback: ([card]) => {
                        game.discardFromHand(target, [target.hand.indexOf(card)]);
                        game.log(`${target.name}は${card.name}を捨てました`);
                    }
                });
            });
        }
    }
};

// ===== プロジェクト（1人1回購入し、自分のキューブを置く。以後ずっと効果がある） =====
const project = (key, id, name, cost, description, hooks = {}) => ({
    [key]: {
        id, name, cost, description, kind: LANDSCAPE_KINDS.PROJECT,
        canBuy: (player) => !player.projects.has(id),
        onBuy: (player, game) => game.takeProject(player, id),
        // きっかけは、キューブを置いたプレイヤーにだけ効く
        ...Object.fromEntries(Object.entries(hooks).map(([hook, fn]) => [hook, (game, player, ...args) => {
            if (player.projects.has(id)) fn(game, player, ...args);
        }]))
    }
});
// 他のプレイヤーのきっかけで、キューブを置いたプレイヤーに効くもの（道路網）
const ownersOf = (game, id) => game.players.filter(player => player.projects.has(id));

export const RENAISSANCE_PROJECTS = {
    ...project('CATHEDRAL', 'cathedral', '大聖堂', 3, 'ターンの開始時に、手札のカードを1枚廃棄する', {
        onStartOfTurn: (game, player) => promptTrashFromHand(game, player, { title: '大聖堂', message: '廃棄するカードを1枚選んでください。', purpose: 'cathedral-trash' })
    }),
    ...project('CITY_GATE', 'city_gate', '城門', 3, 'ターンの開始時に、カードを1枚引き、手札を1枚山札の上に置く', {
        onStartOfTurn: (game, player) => {
            gainBenefits(player, game, { cards: 1 }, '城門');
            promptFromHand(game, player, {
                title: '城門', message: '山札の上に置くカードを1枚選んでください。', confirmLabel: '山札の上に置く', purpose: 'topdeck-from-hand',
                callback: ([card]) => {
                    player.hand.splice(player.hand.indexOf(card), 1);
                    player.deck.unshift(card);
                }
            });
        }
    }),
    ...project('PAGEANT', 'pageant', '野外劇', 3, '購入フェーズの終わりに、財宝1を払って財源 +1 を得てもよい', {
        onEndOfBuyPhase: (game, player) => {
            if (player.coins < 1) return;
            game.promptConfirm({
                player, title: '野外劇', message: '財宝1を払って財源+1を得ますか？', yesLabel: '払う', noLabel: '払わない', purpose: 'pageant',
                callback: (yes) => {
                    if (!yes || player.coins < 1) return;
                    player.coins -= 1;
                    coffers(player, game, 1, '野外劇');
                }
            });
        }
    }),
    ...project('SEWERS', 'sewers', '下水道', 3, '下水道以外でカードを廃棄したとき、手札のカードを1枚廃棄してもよい', {
        onTrashAny: (game, player) => {
            if (game.turnState.sewersActive || player.hand.length === 0) return;
            game.runNext(() => {
                game.turnState.sewersActive = true;
                promptTrashFromHand(game, player, {
                    min: 0, title: '下水道', message: 'もう1枚廃棄できます（選ばなくてもかまいません）。', purpose: 'optional-trash',
                    callback: () => game.runNext(() => { game.turnState.sewersActive = false; })
                });
                if (!game.pendingPrompt) game.turnState.sewersActive = false;
            });
        }
    }),
    ...project('STAR_CHART', 'star_chart', '星図', 3, 'シャッフルしたとき、1枚を選んで一番上に置いてもよい（勝利点・呪い以外で一番高いカードを自動で置く）'),
    ...project('EXPLORATION', 'exploration', '探検', 4, '購入フェーズの終わりに、カードを購入していなければ、財源 +1 と村人 +1', {
        onEndOfBuyPhase: (game, player) => {
            if (game.turnState.cardsBought > 0) return;
            coffers(player, game, 1, '探検');
            villagers(player, game, 1, '探検');
        }
    }),
    ...project('FAIR', 'fair', '市', 4, 'ターンの開始時に、購入 +1', {
        onStartOfTurn: (game, player) => gainBenefits(player, game, { buys: 1 }, '市')
    }),
    ...project('SILOS', 'silos', 'サイロ', 4, 'ターンの開始時に、銅貨を好きな枚数公開して捨て、同じ枚数カードを引く', {
        onStartOfTurn: (game, player) => {
            const coppers = player.hand.filter(card => card.id === 'copper');
            if (coppers.length === 0) return;
            game.promptSelect({
                player, cards: coppers, min: 0, max: coppers.length,
                title: 'サイロ', message: '捨てる銅貨を選んでください。同じ枚数カードを引きます。', confirmLabel: '捨てる', purpose: 'silos',
                callback: (indices) => {
                    const discarded = game.discardFromHand(player, indices.map(index => player.hand.indexOf(coppers[index])));
                    if (discarded.length > 0) gainBenefits(player, game, { cards: discarded.length }, 'サイロ');
                }
            });
        }
    }),
    ...project('SINISTER_PLOT', 'sinister_plot', '陰謀の企て', 4, 'ターンの開始時に、ここに自分のトークンを1つ置くか、自分のトークンをすべて取り除いて1つにつきカードを1枚引く', {
        onStartOfTurn: (game, player) => game.promptChoose({
            player,
            options: ['トークンを1つ置く', `トークン（${player.sinisterPlotTokens}）を取り除いてカードを引く`],
            title: '陰謀の企て',
            message: '1つ選んでください。',
            purpose: 'sinister-plot',
            callback: ([index]) => {
                if (index === 0) {
                    player.sinisterPlotTokens++;
                    return;
                }
                const count = player.sinisterPlotTokens;
                player.sinisterPlotTokens = 0;
                if (count > 0) gainBenefits(player, game, { cards: count }, '陰謀の企て');
            }
        })
    }),
    ...project('ACADEMY', 'academy', 'アカデミー', 5, 'アクションカードを獲得したとき、村人 +1', {
        onGainAny: (game, player, card) => {
            if (isAction(card)) villagers(player, game, 1, 'アカデミー');
        }
    }),
    ...project('CAPITALISM', 'capitalism', '資本主義', 5, '自分のターンの間、財宝 +の書かれたアクションカードは財宝でもある'),
    ...project('FLEET', 'fleet', '艦隊', 5, 'ゲームの終わりの後、これを持つプレイヤーだけで追加の1巡を行う'),
    ...project('GUILDHALL', 'guildhall', 'ギルドホール', 5, '財宝を獲得したとき、財源 +1', {
        onGainAny: (game, player, card) => {
            if (isTreasure(card)) coffers(player, game, 1, 'ギルドホール');
        }
    }),
    ...project('PIAZZA', 'piazza', 'ピアッツァ', 5, 'ターンの開始時に、山札の一番上を公開する。アクションならプレイする', {
        onStartOfTurn: (game, player) => {
            const [card] = takeTopCards(player, 1);
            if (!card) return;
            game.log(`${player.name}は山札の一番上の${card.name}を公開しました`);
            if (isAction(card)) {
                game.playCardFrom(player, card, { remove: false });
            } else {
                player.deck.unshift(card);
            }
        }
    }),
    ...project('ROAD_NETWORK', 'road_network', '道路網', 5, '他のプレイヤーが勝利点カードを獲得したとき、カードを1枚引く', {}),
    ...project('BARRACKS', 'barracks', '兵舎', 6, 'ターンの開始時に、アクション +1', {
        onStartOfTurn: (game, player) => gainBenefits(player, game, { actions: 1 }, '兵舎')
    }),
    ...project('CROP_ROTATION', 'crop_rotation', '輪作', 6, 'ターンの開始時に、勝利点カードを1枚捨ててカードを2枚引いてもよい', {
        onStartOfTurn: (game, player) => promptFromHand(game, player, {
            min: 0, filter: isVictory, title: '輪作', message: '捨てる勝利点カードを選んでください（捨てるとカードを2枚引きます）。', confirmLabel: '捨てる', purpose: 'crop-rotation',
            callback: ([card]) => {
                if (!card) return;
                game.discardFromHand(player, [player.hand.indexOf(card)]);
                gainBenefits(player, game, { cards: 2 }, '輪作');
            }
        })
    }),
    ...project('INNOVATION', 'innovation', '革新', 6, '自分のターンに最初にアクションカードを獲得したとき、それを脇に置いてプレイしてもよい', {
        onGainAny: (game, player, card) => {
            if (!isAction(card) || player !== game.getCurrentPlayer() || game.turnState.innovationUsed) return;
            game.turnState.innovationUsed = true;
            game.runNext(() => game.promptConfirm({
                player, card, title: '革新', message: `獲得した${card.name}をプレイしますか？`, yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'innovation',
                callback: (yes) => {
                    if (yes && player.removeCard(card)) game.playCardFrom(player, card, { remove: false });
                }
            }));
        }
    }),
    ...project('CANAL', 'canal', '運河', 7, '自分のターンの間、カードのコストは1少なくなる（0未満にはならない）'),
    ...project('CITADEL', 'citadel', '城塞', 8, '自分のターンに最初にプレイしたアクションカードを、その後でもう一度プレイする')
};

// 道路網：他のプレイヤーが勝利点カードを獲得したとき、持っているプレイヤーはカードを1枚引く（獲得した人のきっかけで起きるので別に書く）
RENAISSANCE_PROJECTS.ROAD_NETWORK.onGainAny = (game, player, card) => {
    if (!isVictory(card)) return;
    ownersOf(game, 'road_network').filter(owner => owner !== player).forEach(owner => gainBenefits(owner, game, { cards: 1 }, '道路網'));
};
