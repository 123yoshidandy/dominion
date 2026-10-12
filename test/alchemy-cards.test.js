import { describe, it, expect, beforeEach } from 'vitest';
import { getKingdomCardIds } from '../public/js/card-data.js';
import { runCpuStep } from '../public/js/cpu-player.js';
import { createGameView, hydrateGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const ALCHEMY = getKingdomCardIds(['alchemy']).map(id => id.toLowerCase());

describe('錬金術', () => {
    let game;
    let player;
    let opponent;

    beforeEach(() => {
        // ブドウ園・薬草商・弟子はサプライになくてもテストできるので外す
        const kingdom = ALCHEMY.filter(id => !['vineyard', 'herbalist', 'apprentice'].includes(id));
        game = createGame(['A', 'B'], [...kingdom, 'remodel'], { colonies: false });
        player = game.getCurrentPlayer();
        opponent = game.players.find(p => p !== player);
        player.deck = makeCards(Array(15).fill('COPPER'));
        player.discard = [];
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        opponent.deck = makeCards(Array(15).fill('COPPER'));
        opponent.discard = [];
    });

    const play = (hand) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(0)).toBe(true);
    };

    it('ポーションのコストのカードがあればポーションの山を置く', () => {
        expect(game.supply.potion).toBe(16);
        const plain = createGame(['A', 'B']);
        expect(plain.supply.potion).toBeUndefined();
    });

    it('ポーションのコストのカードは、場のポーションがないと購入できない', () => {
        player.hand = makeCards(['GOLD', 'COPPER']);
        game.enterBuyPhase();
        expect(game.buyCard('familiar')).toBe(false);
        expect(game.lastError).toContain('ポーション');

        game.endTurn();
        const next = game.getCurrentPlayer();
        next.hand = makeCards(['POTION', 'SILVER', 'COPPER']);
        game.enterBuyPhase();
        expect(next.potions).toBe(1);
        expect(game.buyCard('familiar')).toBe(true);
        expect(next.potions).toBe(0);
        expect(next.coins).toBe(0);
    });

    it('「コスト○以下」ではポーションのコストのカードは獲得できず、基準のカードにポーションがあれば獲得できる', () => {
        const gainable = (options) => game.getGainableCards(options).map(data => data.id);
        expect(gainable({ maxCost: 6 })).not.toContain('familiar');
        expect(gainable({ maxCost: 5, potion: 1 })).toContain('familiar');
        expect(gainable({ exactCost: 3, potion: 1 })).toEqual(expect.arrayContaining(['familiar', 'alchemist']));
        expect(gainable({ exactCost: 3, potion: 1 })).not.toContain('silver');
        // 使い魔（3＋ポーション）より安い：コイン3以下でポーションなし、またはコイン2以下でポーションあり
        const cheaper = gainable({ lessThan: 'familiar' });
        expect(cheaper).toEqual(expect.arrayContaining(['silver', 'scrying_pool', 'transmute']));
        expect(cheaper).not.toContain('familiar');
        expect(cheaper).not.toContain('potion');
    });

    it('改築でポーションのコストのカードを廃棄すると、ポーションのコストのカードも獲得できる', () => {
        play(['REMODEL', 'FAMILIAR']);
        game.resolvePrompt([0]);
        const choices = ids(game.pendingPrompt.cards);
        expect(choices).toContain('golem');
        expect(choices).toContain('duchy');
        expect(choices).not.toContain('gold');
    });

    it('変成は廃棄したカードの種類に応じて獲得する', () => {
        play(['TRANSMUTE', 'ESTATE']);
        game.resolvePrompt([0]);
        expect(ids(player.discard)).toEqual(['gold']);
    });

    it('ブドウ園はアクションカード3枚につき勝利点1', () => {
        player.hand = [];
        player.deck = makeCards(['VINEYARD', 'FAMILIAR', 'FAMILIAR', 'GOLEM', 'UNIVERSITY', 'COPPER']);
        player.discard = [];
        player.playArea = [];
        expect(player.calculateVictoryPoints()).toBe(1);
    });

    it('薬草商は場から捨て札にするとき、場の財宝を山札の上に置ける', () => {
        play(['HERBALIST', 'GOLD']);
        game.enterBuyPhase();
        game.endTurn();
        expect(game.pendingPrompt.purpose).toBe('herbalist');
        game.resolvePrompt([0]);
        expect(ids(player.hand)).toContain('gold');
    });

    it('錬金術師は場にポーションがあれば山札の上に置ける', () => {
        play(['ALCHEMIST', 'POTION']);
        game.enterBuyPhase();
        game.endTurn();
        expect(game.pendingPrompt.purpose).toBe('alchemist-topdeck');
        game.resolvePrompt(true);
        expect(ids(player.hand)).toContain('alchemist');
    });

    it('薬師は山札の上の銅貨とポーションを手札に加え、残りを戻す', () => {
        player.deck = makeCards(['SILVER', 'COPPER', 'POTION', 'ESTATE', 'GOLD', 'COPPER']);
        play(['APOTHECARY']);
        // 1枚引いた（銀貨）後、銅貨・ポーション・屋敷・金貨を公開する
        expect(ids(player.hand)).toEqual(['silver', 'copper', 'potion']);
        game.resolvePrompt([0]);
        expect(ids(player.deck).slice(0, 2).sort()).toEqual(['estate', 'gold']);
    });

    it('念視の泉は全員の山札の上を選んで捨て札にし、アクション以外が出るまで手札に加える', () => {
        player.deck = makeCards(['ESTATE', 'FAMILIAR', 'GOLEM', 'SILVER', 'COPPER']);
        opponent.deck = makeCards(['GOLD', 'COPPER']);
        play(['SCRYING_POOL']);
        expect(game.pendingPrompt.purpose).toBe('scrying-pool-self');
        game.resolvePrompt(true);   // 自分の屋敷を捨てる
        expect(game.pendingPrompt.purpose).toBe('scrying-pool-other');
        game.resolvePrompt(true);   // 相手の金貨を捨てさせる
        expect(ids(opponent.discard)).toEqual(['gold']);
        expect(ids(player.hand)).toEqual(['familiar', 'golem', 'silver']);
    });

    it('使い魔は他のプレイヤーに呪いを獲得させる', () => {
        play(['FAMILIAR']);
        expect(ids(opponent.discard)).toEqual(['curse']);
        expect(player.actions).toBe(1);
    });

    it('賢者の石は山札と捨て札5枚につき財宝+1', () => {
        player.deck = makeCards(Array(8).fill('COPPER'));
        player.discard = makeCards(Array(4).fill('ESTATE'));
        player.hand = makeCards(['PHILOSOPHERS_STONE']);
        game.enterBuyPhase();
        expect(player.coins).toBe(2);
    });

    it('ゴーレムはゴーレム以外のアクション2枚を好きな順でプレイし、他を捨てる', () => {
        player.deck = makeCards(['COPPER', 'GOLEM', 'FAMILIAR', 'ESTATE', 'UNIVERSITY', 'SILVER']);
        play(['GOLEM']);
        expect(game.pendingPrompt.purpose).toBe('golem-first');
        game.resolvePrompt([1]); // 大学を先に
        expect(ids(player.discard).sort()).toEqual(['copper', 'estate', 'golem']);
        expect(ids(player.playArea)).toEqual(['golem', 'university']);
        game.resolvePrompt([]); // 大学では獲得しない
        expect(ids(player.playArea)).toEqual(['golem', 'university', 'familiar']);
        expect(player.actions).toBe(3); // 大学 +2、使い魔 +1（ゴーレムで使ったアクションは別）
    });

    it('弟子は廃棄したカードのコストの分だけ引き、ポーションがあれば2枚多く引く', () => {
        play(['APPRENTICE', 'FAMILIAR']);
        game.resolvePrompt([0]);
        expect(player.hand).toHaveLength(5);
        expect(game.trash.map(card => card.id)).toContain('familiar');
    });

    describe('支配', () => {
        it('左隣のプレイヤーの追加のターンを操作し、獲得したカードは自分が獲得する', () => {
            play(['POSSESSION']);
            game.enterBuyPhase();
            game.endTurn();

            // 相手の追加のターン。操作するのは支配したプレイヤー
            expect(game.getCurrentPlayer()).toBe(opponent);
            expect(game.possessor).toBe(player);
            opponent.hand = makeCards(['GOLD', 'SILVER', 'COPPER', 'CHAPEL', 'ESTATE']);
            expect(game.applyCommand(opponent.id, { type: 'buyPhase' })).toBe(false);
            expect(game.applyCommand(player.id, { type: 'buyPhase' })).toBe(true);
            const before = player.discard.length;
            expect(game.applyCommand(player.id, { type: 'buy', cardId: 'gold' })).toBe(true);
            expect(player.discard).toHaveLength(before + 1);
            expect(ids(opponent.discard)).not.toContain('gold');

            // ビューでは、支配したプレイヤーが手番のプレイヤーの手札を自分のものとして操作できる
            const view = hydrateGameView(createGameView(game, player.id));
            expect(view.isMyTurn).toBe(true);
            expect(view.me.id).toBe(opponent.id);
            expect(hydrateGameView(createGameView(game, opponent.id)).isMyTurn).toBe(false);

            expect(game.applyCommand(player.id, { type: 'endTurn' })).toBe(true);
            // 支配のターンの後は、ふつうの順番に戻る（相手のふつうのターン）
            expect(game.possessor).toBe(null);
            expect(game.getCurrentPlayer()).toBe(opponent);
            expect(game.applyCommand(opponent.id, { type: 'buyPhase' })).toBe(true);
        });

        it('支配のターンに廃棄された手番のプレイヤーのカードは、ターンの終わりに捨て札に戻る', () => {
            play(['POSSESSION']);
            game.enterBuyPhase();
            game.endTurn();
            opponent.hand = makeCards(['TRANSMUTE', 'ESTATE']);
            expect(game.applyCommand(player.id, { type: 'play', cardIndex: 0 })).toBe(true);
            expect(game.applyCommand(player.id, { type: 'answer', answer: [0] })).toBe(true);
            // 変成で屋敷を廃棄して獲得する金貨は、支配したプレイヤーのもの
            expect(game.trash.map(card => card.id)).not.toContain('estate');
            expect(ids(player.discard)).toContain('gold');
            game.applyCommand(player.id, { type: 'buyPhase' });
            game.applyCommand(player.id, { type: 'endTurn' });
            expect(opponent.getAllCards().map(card => card.id)).toContain('estate');
        });

        it('CPU同士でも支配のターンを進められる', () => {
            const cpuGame = createGame([{ name: 'C1', isCPU: true }, { name: 'C2', isCPU: true }], ALCHEMY.slice(0, 10), { colonies: false });
            cpuGame.players.forEach(p => {
                p.deck.push(...makeCards(['POSSESSION', 'POSSESSION', 'GOLEM', 'SCRYING_POOL']));
                p.shuffleDeck();
            });
            let possessed = false;
            for (let step = 0; step < 20000 && cpuGame.phase !== 'end'; step++) {
                if (cpuGame.possessor) possessed = true;
                runCpuStep(cpuGame);
            }
            expect(cpuGame.phase).toBe('end');
            expect(possessed).toBe(true);
        });
    });
});
