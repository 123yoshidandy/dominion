/**
 * 拡張「略奪」の仕組み：分捕り品の山、特性、「次に〜したとき」まで場に残る持続カード、イベントの続く効果
 * - 分捕り品は15種を2枚ずつ混ぜたサプライ外の山（lootPile）。画面には nonSupply.loot で残りの枚数を出す
 * - 特性は traits（特性のID → 山のID）。準備で、アクションか財宝の王国カードの山に1つずつ置く
 * - 「次に〜したとき」のカードは player.waits に { card, kind, onTrigger } を登録し、きっかけで一度だけ効果を使う
 *   場に残すため、ずっと残る持続（permanent）として登録し、効果を使ったら外す（そのターンのクリーンアップで捨て札になる）
 * Game.prototype に処理を加える
 */

import Card from './card.js';
import { ALL_CARDS, CARD_TYPES, RUINS_CARD_IDS } from './card-data.js';
import { LANDSCAPE_KINDS } from './card-types.js';
import { LOOT_CARD_IDS } from './card-data-plunder.js';
import { discardDownTo, gainBenefits, promptFromHand, promptTrashFromHand } from './card-helpers.js';

const { ACTION, TREASURE, VICTORY, CURSE, DURATION, COMMAND } = CARD_TYPES;

const plunderMethods = {
    // 特性を山に置き、分捕り品の山を用意する（initializeSupply から呼ぶ）
    setupPlunder() {
        this.traits = {};
        const traitIds = this.landscapes.filter(id => this.getLandscape(id)?.kind === LANDSCAPE_KINDS.TRAIT);
        const candidates = this.selectedKingdomCards.filter(id => {
            const data = ALL_CARDS[id.toUpperCase()];
            return this.supply[id] !== undefined && (data?.types.includes(ACTION) || data?.types.includes(TREASURE));
        });
        traitIds.forEach(traitId => {
            const free = candidates.filter(id => !Object.values(this.traits).includes(id));
            const pileId = this.options.traitPiles?.[traitId] ?? (free.length > 0 ? free[Math.floor(this.random() * free.length)] : null);
            if (pileId) this.traits[traitId] = pileId;
        });
        // 呪われた：廃墟を獲得するので、廃墟の山を置く
        if (this.traits.cursed && !this.pileCards.ruins) {
            const ruins = this.shuffle(RUINS_CARD_IDS.flatMap(cardId => Array(10).fill(cardId)));
            this.setupMixedPile('ruins', ruins.slice(0, Math.max(10, (this.players.length - 1) * 10)));
        }
        // 分捕り品を使うカードかイベントがあれば、分捕り品の山を置く
        const usesLoot = [...this.selectedKingdomCards.map(id => ALL_CARDS[id.toUpperCase()]), ...this.landscapes.map(id => this.getLandscape(id))]
            .some(data => data?.usesLoot);
        this.lootPile = usesLoot ? this.shuffle(LOOT_CARD_IDS.flatMap(id => [id, id])) : [];
        if (usesLoot) this.nonSupply.loot = this.lootPile.length;
    },

    // 受け継がれた：初期デッキの屋敷（避難所なら納屋）1枚を、特性の山のカードと入れ替える（setup から呼ぶ）
    applyInheritedTrait(player) {
        const pileId = this.traits?.inherited;
        if (!pileId) return;
        const index = player.deck.findIndex(card => card.id === (this.useShelters ? 'hovel' : 'estate'));
        const { cardId } = this.resolvePile(pileId);
        if (index < 0 || !cardId || !this.takeFromSupply(pileId)) return;
        player.deck.splice(index, 1, new Card(ALL_CARDS[cardId.toUpperCase()]));
    },

    // 分捕り品の山の一番上を獲得する（山がなければ null）
    gainLoot(player, destination = 'discard') {
        if (!this.lootPile || this.lootPile.length === 0) {
            this.log('分捕り品の山がないため、分捕り品を獲得しませんでした');
            return null;
        }
        const cardId = this.lootPile.shift();
        this.nonSupply.loot = this.lootPile.length;
        const recipient = this.redirectGain(player, cardId);
        const card = recipient.gainCard(cardId, recipient === player ? destination : 'discard');
        this.log(`${recipient.name}は分捕り品の${card.name}を獲得しました`);
        this.onCardGained(recipient, card);
        return card;
    },

    // カードの山に置かれた特性のID
    traitsOf(card) {
        if (!this.traits || !card?.id) return [];
        const pileId = this.pileOf[card.id] ?? card.id;
        return Object.keys(this.traits).filter(traitId => this.traits[traitId] === pileId);
    },

    hasTrait(card, traitId) {
        return Boolean(this.traits?.[traitId]) && this.traits[traitId] === (this.pileOf[card?.id] ?? card?.id);
    },

    // 「次に〜したとき」まで場に残す。onTrigger はきっかけが起きたときに一度だけ呼ぶ
    addWait(player, card, kind, onTrigger) {
        const duration = { card, effect: null, permanent: true };
        player.durations.push(duration);
        player.waits.push({ card, kind, onTrigger, duration });
    },

    // 待っているきっかけが起きた：登録を外し、効果を使う手順を返す
    takeWaits(player, kind, payload) {
        const matched = player.waits.filter(wait => wait.kind === kind);
        if (matched.length === 0) return [];
        player.waits = player.waits.filter(wait => !matched.includes(wait));
        player.durations = player.durations.filter(duration => !matched.some(wait => wait.duration === duration));
        return matched.map(wait => () => wait.onTrigger(payload));
    },

    // サプライの山が空になったら、捜索を起こす
    checkPileEmptied(pileId) {
        if (this.supply[pileId] !== 0) return;
        this.runNext(...this.players.flatMap(player => this.takeWaits(player, 'pileEmpty')));
    },

    // カードを獲得したときの、略奪のカード・特性・イベントの効果
    plunderGainSteps(player, card, isCurrent) {
        const steps = [];
        const state = this.turnState;
        const isType = (type) => card.isType(type);

        // 特性
        if (this.hasTrait(card, 'nearby')) {
            player.buys += 1;
            this.log(`${player.name}は手近なで購入 +1`);
        }
        if (this.hasTrait(card, 'rich')) {
            steps.push(() => { if (this.gainCardFromSupply(player, 'silver')) this.log(`${player.name}は裕福なで銀貨を獲得しました`); });
        }
        if (this.hasTrait(card, 'cursed')) {
            steps.push(() => {
                const ruins = this.gainCardFromSupply(player, 'ruins');
                if (ruins) this.log(`${player.name}は呪われたで${ruins.name}を獲得しました`);
                this.gainCurse(player);
            });
        }
        if (card.id === 'province' && this.traits?.fawning) {
            steps.push(() => {
                const fawning = this.gainCardFromSupply(player, this.traits.fawning);
                if (fawning) this.log(`${player.name}はへつらうで${fawning.name}を獲得しました`);
            });
        }
        if (this.hasTrait(card, 'pious')) {
            steps.push(() => promptTrashFromHand(this, player, {
                min: 0, title: '敬虔な', message: '廃棄するカードを選んでください（選ばなくてもかまいません）。', purpose: 'optional-trash'
            }));
        }
        if (this.hasTrait(card, 'hasty')) {
            steps.push(() => {
                if (!player.removeCard(card)) return;
                player.setAside.push(card);
                player.startOfTurnPlays.push(card);
                this.log(`${player.name}は性急なで${card.name}を脇に置きました（次のターンの開始時にプレイします）`);
            });
        }

        // 鏡・突進（このターン次に獲得したアクション）
        if (isCurrent && isType(ACTION) && state.mirrors > 0) {
            const count = state.mirrors;
            state.mirrors = 0;
            for (let i = 0; i < count; i++) {
                steps.push(() => { if (this.gainCardFromSupply(player, card.id)) this.log(`${player.name}は鏡で${card.name}をもう1枚獲得しました`); });
            }
        }
        if (isCurrent && isType(ACTION) && state.rushes > 0) {
            state.rushes = 0;
            steps.push(() => {
                if (!player.getAllCards().includes(card) || player.playArea.includes(card)) return;
                this.log(`${player.name}は突進で${card.name}をプレイしました`);
                this.playCardFrom(player, card);
            });
        }
        // 鉱山道：このターンに1回、獲得した財宝をプレイしてもよい
        if (isCurrent && isType(TREASURE) && state.miningRoads > 0) {
            steps.push(() => {
                if (state.miningRoads <= 0 || !player.getAllCards().includes(card) || player.playArea.includes(card)) return;
                this.promptConfirm({
                    player, card, title: '鉱山道', message: `獲得した${card.name}をプレイしますか？`, yesLabel: 'プレイする', noLabel: 'プレイしない',
                    purpose: 'play-gained',
                    callback: (yes) => {
                        if (!yes || !player.getAllCards().includes(card)) return;
                        state.miningRoads--;
                        this.log(`${player.name}は鉱山道で${card.name}をプレイしました`);
                        this.playTreasure(player, card);
                    }
                });
            });
        }
        // 監督：ちょうどコスト5のカードを獲得した
        if (isCurrent && this.getCost(card) === 5 && !this.hasExtraCost(card)) state.gained5 = true;

        // 「次に〜を獲得したとき」まで残るカード
        if (isType(VICTORY)) steps.push(...this.takeWaits(player, 'gainVictory', card));
        if (isType(TREASURE)) steps.push(...this.takeWaits(player, 'gainTreasure', card));
        if (isType(ACTION)) steps.push(...this.takeWaits(player, 'gainAction', card));
        if (isType(TREASURE) && this.getCost(card) >= 5) {
            this.players.forEach(owner => steps.push(...this.takeWaits(owner, 'anyTreasure5', card)));
        }

        // 誰かが獲得したときに手札からプレイできるカード（密航者：持続カード、地図作り：勝利点カード）
        const reactions = [[isType(DURATION), 'stowaway'], [isType(VICTORY), 'mapmaker']];
        reactions.filter(([applies]) => applies).forEach(([, reactionId]) => {
            this.getPlayersFrom(this.getCurrentPlayer()).forEach(owner => {
                const reaction = owner.hand.find(handCard => handCard.id === reactionId);
                if (!reaction) return;
                steps.push(() => {
                    if (!owner.hand.includes(reaction)) return;
                    this.promptConfirm({
                        player: owner, card: reaction, title: reaction.name,
                        message: `${player.name}が${card.name}を獲得しました。手札の${reaction.name}をプレイしますか？`,
                        yesLabel: 'プレイする', noLabel: 'プレイしない', purpose: 'reaction-play',
                        callback: (yes) => { if (yes && owner.hand.includes(reaction)) this.playCardFrom(owner, reaction); }
                    });
                });
            });
        });

        // 配達：獲得したカードを脇に置き、ターンの終わりに手札に加える
        if (isCurrent && state.deliver) {
            steps.push(() => {
                if (player.playArea.includes(card) || player.setAside.includes(card) || !player.removeCard(card)) return;
                player.setAside.push(card);
                state.endOfTurnToHand.push({ player, card });
                this.log(`${player.name}は配達で${card.name}を脇に置きました`);
            });
        }
        return steps;
    },

    // カードをプレイした後に起きる効果（上陸部隊・旗艦・港村・フリゲート艦・鼓舞する）。play を呼んだときに一度だけ求める
    plunderAfterPlaySteps(player, card) {
        const steps = [];
        const state = this.turnState;
        const isCurrent = player === this.getCurrentPlayer();
        const isAction = card.isType(ACTION);

        // 上陸部隊：ターンの最初にプレイしたカードが財宝なら、その後で山札の上に置く
        if (isCurrent) {
            const first = !state.playedAny;
            state.playedAny = true;
            if (first && this.isTreasure(card)) steps.push(...this.takeWaits(player, 'firstTreasure', card));
        }
        // 旗艦：次に命令でないアクションをプレイしたら、もう一度プレイする
        if (isAction && !card.isType(COMMAND)) steps.push(...this.takeWaits(player, 'playAction', card));
        // 港村：このターン次にプレイしたアクションで財宝が増えたら、財宝 +1
        if (isCurrent && isAction && state.harborVillages > 0) {
            const bonus = state.harborVillages;
            const before = player.coins;
            state.harborVillages = 0;
            steps.push(() => {
                if (player.coins > before) gainBenefits(player, this, { coins: bonus }, '港村');
            });
        }
        // フリゲート艦：攻撃を受けているプレイヤーは、アクションをプレイした後で手札が4枚になるまで捨てる
        if (isAction && this.players.some(owner => owner !== player && owner.frigateVictims.has(player))) {
            steps.push(() => { if (player.hand.length > 4) discardDownTo(this, player, 4, 'フリゲート艦'); });
        }
        // 鼓舞する：自分のターンにプレイした後、場にない名前の手札のアクションを1枚プレイしてもよい
        if (isCurrent && this.hasTrait(card, 'inspiring')) {
            steps.push(() => promptFromHand(this, player, {
                min: 0, filter: (handCard) => handCard.isType(ACTION) && !player.playArea.some(played => played.id === handCard.id),
                title: '鼓舞する', message: '場にない名前のアクションカードを1枚プレイできます（選ばなくてもかまいません）。',
                confirmLabel: 'プレイする', purpose: 'play-new-action',
                callback: ([handCard]) => { if (handCard) this.playCardFrom(player, handCard); }
            }));
        }
        return steps;
    },

    // 無謀な：指示を2回行うか
    isReckless(card) {
        return this.hasTrait(card, 'reckless');
    },

    // クリーンアップの開始時の効果（友好的・忍耐強い・いたずら者）。endTurn から手順として積む
    plunderCleanupSteps(player) {
        const steps = [];
        const traitHand = (traitId) => player.hand.filter(card => this.hasTrait(card, traitId));
        if (this.traits?.friendly) {
            steps.push(() => {
                const friendly = traitHand('friendly');
                if (friendly.length === 0) return;
                this.promptSelect({
                    player, cards: friendly, min: 0, max: 1, title: '友好的',
                    message: '捨て札にするカードを選んでください。同じ山のカードを1枚獲得します（選ばなくてもかまいません）。',
                    confirmLabel: '捨てて獲得する', purpose: 'friendly',
                    callback: ([index]) => {
                        const card = friendly[index];
                        if (!card || !player.hand.includes(card)) return;
                        this.discardFromHand(player, [player.hand.indexOf(card)]);
                        const gained = this.gainCardFromSupply(player, this.traits.friendly);
                        if (gained) this.log(`${player.name}は友好的で${gained.name}を獲得しました`);
                    }
                });
            });
        }
        if (this.traits?.patient) {
            steps.push(() => {
                const patient = traitHand('patient');
                if (patient.length === 0) return;
                this.promptSelect({
                    player, cards: patient, min: 0, max: patient.length, title: '忍耐強い',
                    message: '脇に置いて、次のターンの開始時にプレイするカードを選んでください（選ばなくてもかまいません）。',
                    confirmLabel: '脇に置く', purpose: 'patient',
                    callback: (indices) => indices.map(index => patient[index]).forEach(card => {
                        if (!player.hand.includes(card)) return;
                        player.hand.splice(player.hand.indexOf(card), 1);
                        player.setAside.push(card);
                        player.startOfTurnPlays.push(card);
                        this.log(`${player.name}は忍耐強いで${card.name}を脇に置きました`);
                    })
                });
            });
        }
        // いたずら者：このターンに1回（プレイした数まで）、場の財宝を脇に置き、ターンの終わりに手札に加えてよい
        if (this.turnState.tricksters > 0) {
            steps.push(() => {
                const treasures = player.playArea.filter(card => this.isTreasure(card) && !player.hasPendingDuration(card));
                if (treasures.length === 0) return;
                this.promptSelect({
                    player, cards: treasures, min: 0, max: this.turnState.tricksters, title: 'いたずら者',
                    message: `ターンの終わりに手札に加える財宝を${this.turnState.tricksters}枚まで選んでください（選ばなくてもかまいません）。`,
                    confirmLabel: '脇に置く', purpose: 'trickster',
                    callback: (indices) => indices.map(index => treasures[index]).forEach(card => {
                        if (!player.playArea.includes(card)) return;
                        player.playArea.splice(player.playArea.indexOf(card), 1);
                        player.setAside.push(card);
                        this.turnState.endOfTurnToHand.push({ player, card });
                        this.log(`${player.name}はいたずら者で${card.name}を脇に置きました`);
                    })
                });
            });
        }
        return steps;
    },

    // 場のカードを捨て札にする直前（finishTurn から呼ぶ）：監督・旅程・無謀な・疲れ知らずの
    plunderBeforeCleanup(player) {
        const state = this.turnState;
        // 監督：ちょうどコスト5のカードを獲得していたら、次のターンの開始時にもう一度効果を使う
        if (state.gained5) {
            state.taskmasters.filter(card => player.playArea.includes(card)).forEach(card => {
                player.addDuration(card, () => {
                    gainBenefits(player, this, { actions: 1, coins: 1 }, '監督');
                    this.turnState.taskmasters.push(card);
                });
            });
        }
        // 旅程：場のカードを捨て札にしない（次のターンの終わりまで場に残す）
        if (state.journey) {
            player.playArea.filter(card => !player.hasPendingDuration(card)).forEach(card => player.addDuration(card, null));
            return;
        }
        const leaving = player.playArea.filter(card => !player.hasPendingDuration(card));
        // 無謀な：場から捨て札にするとき、山に戻す
        leaving.filter(card => this.isReckless(card)).forEach(card => {
            if (this.returnToSupply(player, card)) this.log(`${player.name}は無謀なの${card.name}を山に戻しました`);
        });
        // 疲れ知らずの：場から捨て札にするとき、脇に置き、ターンの終わりに山札の上に置く
        leaving.filter(card => this.hasTrait(card, 'tireless') && player.playArea.includes(card)).forEach(card => {
            player.playArea.splice(player.playArea.indexOf(card), 1);
            player.setAside.push(card);
            state.tireless.push(card);
        });
    },

    // 新しい手札を引いた後（finishTurn から呼ぶ）：脇に置いたカードを手札・山札に戻す
    plunderAfterCleanup(player) {
        const state = this.turnState;
        state.endOfTurnToHand.forEach(({ player: owner, card }) => {
            if (!owner.setAside.includes(card)) return;
            owner.setAside.splice(owner.setAside.indexOf(card), 1);
            owner.hand.push(card);
            this.log(`${owner.name}は脇に置いた${card.name}を手札に加えました`);
        });
        state.tireless.forEach(card => {
            if (!player.setAside.includes(card)) return;
            player.setAside.splice(player.setAside.indexOf(card), 1);
            player.deck.unshift(card);
            this.log(`${player.name}は疲れ知らずのの${card.name}を山札の上に置きました`);
        });
    },

    // ターンの開始時の効果（準備・シャーマン・内気な）。startTurn から手順として積む
    plunderStartOfTurnSteps(player) {
        const steps = [];
        // 準備：脇に置いた手札のアクションと財宝をプレイし、残りを捨て札にする
        if (player.prepared.length > 0) {
            const cards = player.prepared.splice(0).filter(card => player.setAside.includes(card));
            const ordered = [...cards.filter(card => card.isType(ACTION)), ...cards.filter(card => !card.isType(ACTION) && this.isTreasure(card))];
            steps.push(
                ...ordered.map(card => () => {
                    if (!player.setAside.includes(card)) return;
                    if (card.isType(ACTION)) {
                        this.playCardFrom(player, card);
                    } else {
                        this.log(`${player.name}は${card.name}をプレイしました`);
                        this.playTreasure(player, card);
                    }
                }),
                () => {
                    const rest = cards.filter(card => player.setAside.includes(card));
                    rest.forEach(card => player.setAside.splice(player.setAside.indexOf(card), 1));
                    this.discardCards(player, rest);
                    if (rest.length > 0) this.log(`${player.name}は準備で脇に置いた残りの${rest.length}枚を捨て札にしました`);
                }
            );
        }
        // シャーマン：廃棄置き場からコスト6以下のカードを1枚獲得する
        if (this.isInSupply('shaman')) {
            steps.push(() => {
                const candidates = this.trash.filter(card => this.getCost(card) <= 6 && !this.hasExtraCost(card));
                if (candidates.length === 0) return;
                this.promptSelect({
                    player, cards: [...candidates], min: 1, max: 1, title: 'シャーマン',
                    message: '廃棄置き場から獲得するカードを選んでください（コスト6以下）。', confirmLabel: '獲得する', purpose: 'gain-from-trash',
                    callback: ([index]) => {
                        const card = candidates[index];
                        if (!this.takeFromTrash(card)) return;
                        this.log(`${player.name}はシャーマンで廃棄置き場の${card.name}を獲得しました`);
                        this.gainCardInstance(player, card);
                    }
                });
            });
        }
        // 内気な：手札のこの山のカードを1枚捨て札にして、カード +2 してもよい
        if (this.traits?.shy) {
            steps.push(() => {
                const shy = player.hand.filter(card => this.hasTrait(card, 'shy'));
                if (shy.length === 0) return;
                this.promptSelect({
                    player, cards: shy, min: 0, max: 1, title: '内気な', message: '捨て札にして、カードを2枚引きますか？（選ばなくてもかまいません）',
                    confirmLabel: '捨てて引く', purpose: 'shy',
                    callback: ([index]) => {
                        const card = shy[index];
                        if (!card || !player.hand.includes(card)) return;
                        this.discardFromHand(player, [player.hand.indexOf(card)]);
                        gainBenefits(player, this, { cards: 2 }, '内気な');
                    }
                });
            });
        }
        return steps;
    },

    // シャッフルしたときの効果（宿命の・回避）。選ぶと引く途中で止まるので、自動で選ぶ
    plunderOnShuffle(player) {
        // 宿命の：特性の山のカードを一番上に置く
        if (this.traits?.fated) {
            const fated = player.deck.filter(card => this.hasTrait(card, 'fated'));
            if (fated.length > 0) {
                player.deck = [...fated, ...player.deck.filter(card => !fated.includes(card))];
                this.log(`${player.name}は宿命ので、${fated.length}枚を山札の一番上に置きました`);
            }
        }
        // 回避：このターン次にシャッフルしたとき、勝利点・呪いのカードを3枚まで捨て札に置く
        if (this.turnState.avoid && player === this.getCurrentPlayer()) {
            this.turnState.avoid = false;
            const junk = player.deck.filter(card => (card.isType(VICTORY) && !card.isType(ACTION) && !card.isType(TREASURE)) || card.isType(CURSE)).slice(0, 3);
            if (junk.length > 0) {
                player.deck = player.deck.filter(card => !junk.includes(card));
                player.discard.push(...junk);
                this.log(`${player.name}は回避で、${junk.length}枚を捨て札に置きました`);
            }
        }
    },

    // シャッフルのきっかけを使うか（installShuffleHooks から見る）
    usesPlunderShuffleHooks() {
        return Boolean(this.traits?.fated) || this.landscapes.includes('avoid');
    }
};

export function installPlunder(Game) {
    Object.assign(Game.prototype, plunderMethods);
}
