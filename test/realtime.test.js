import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/js/game.js';
import { createGameView, hydrateGameView } from '../public/js/game-view.js';
import { runCpuStep, isCpuToMove } from '../public/js/cpu-player.js';
import { makeCards } from './helpers.js';

const KINGDOM = ['militia', 'witch', 'council_room', 'advisor', 'outpost', 'possession', 'village', 'smithy', 'market', 'cellar'];
const ids = (cards) => cards.map(card => card.id);

describe('リアルタイムモード', () => {
    let game;
    let a;
    let b;

    const setup = (players = ['A', 'B'], options = {}) => {
        game = new Game(players, { kingdom: KINGDOM, colonies: false, shelters: false, seed: 1, realtime: true, ...options });
        game.setup();
        [a, b] = game.players;
        game.players.forEach(p => {
            p.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            p.deck = makeCards(Array(20).fill('COPPER'));
            p.discard = [];
        });
    };

    const send = (player, command) => game.applyCommand(player.id, command);
    const endTurn = (player) => expect(send(player, { type: 'endTurn' })).toBe(true);
    // そのプレイヤーが答える選択（他のプレイヤーの番から来たものも）
    const promptFor = (player) => game.promptsFor(player.id)?.prompt ?? null;
    const answer = (player, value) => {
        const prompt = promptFor(player);
        expect(prompt).not.toBeNull();
        expect(send(player, { type: 'answer', answer: value, promptId: prompt.id })).toBe(true);
    };

    beforeEach(() => setup());

    describe('番の進め方', () => {
        it('全員が同時に自分のターンを始め、どの順でも操作できる', () => {
            expect(game.contexts.every(ctx => ctx.taking && !ctx.done)).toBe(true);
            b.hand = makeCards(['VILLAGE', 'COPPER']);
            expect(send(b, { type: 'play', cardIndex: 0 })).toBe(true);
            a.hand = makeCards(['SMITHY']);
            expect(send(a, { type: 'play', cardIndex: 0 })).toBe(true);
            expect(a.hand).toHaveLength(3);
            expect(b.actions).toBe(2);
        });

        it('全員がターンを終えるまで、次の番に進まない', () => {
            endTurn(a);
            expect(game.roundNumber).toBe(1);
            expect(send(a, { type: 'endTurn' })).toBe(false);
            expect(game.lastError).toBe('他のプレイヤーが番を終えるのを待っています');
            endTurn(b);
            expect(game.roundNumber).toBe(2);
            expect(game.contexts.every(ctx => ctx.taking && !ctx.done)).toBe(true);
        });

        it('購入はサプライから早い者勝ち', () => {
            game.supply.market = 1;
            [a, b].forEach(p => {
                p.hand = [];
                expect(send(p, { type: 'buyPhase' })).toBe(true);
                p.coins = 5;
            });
            expect(send(b, { type: 'buy', cardId: 'market' })).toBe(true);
            expect(send(a, { type: 'buy', cardId: 'market' })).toBe(false);
        });

        it('属州が空になっても、その番は全員が最後までプレイしてからゲームを終える', () => {
            game.supply.province = 1;
            a.hand = [];
            send(a, { type: 'buyPhase' });
            a.coins = 8;
            expect(send(a, { type: 'buy', cardId: 'province' })).toBe(true);
            endTurn(a);
            expect(game.phase).not.toBe('end');
            b.hand = [];
            send(b, { type: 'buyPhase' });
            b.coins = 5;
            expect(send(b, { type: 'buy', cardId: 'duchy' })).toBe(true);
            endTurn(b);
            expect(game.contexts.every(ctx => ctx.phase === 'end')).toBe(true);
            expect(game.result).toBeTruthy();
        });

        it('仮面舞踏会は王国に出さない', () => {
            for (let seed = 1; seed <= 40; seed++) {
                const g = new Game(['A', 'B'], { cardSets: ['intrigue'], seed, realtime: true });
                g.setup();
                expect(g.selectedKingdomCards).not.toContain('masquerade');
            }
        });

        it('操作の記録から同じゲームを再現できる', () => {
            const players = [{ name: 'A' }, { name: 'B' }];
            const options = { kingdom: KINGDOM, colonies: false, shelters: false, seed: 3, realtime: true };
            const g = new Game(players, options);
            g.setup();
            g.applyCommand(1, { type: 'buyPhase' });
            g.applyCommand(1, { type: 'buy', cardId: 'silver' });
            g.applyCommand(0, { type: 'endTurn' });
            g.applyCommand(1, { type: 'endTurn' });
            g.applyCommand(0, { type: 'endTurn' });
            const again = Game.replay(players, options, g.commands);
            expect(again.roundNumber).toBe(g.roundNumber);
            expect(again.players.map(p => ids(p.hand))).toEqual(g.players.map(p => ids(p.hand)));
            expect(again.contexts.map(ctx => ctx.done)).toEqual(g.contexts.map(ctx => ctx.done));
        });
    });

    describe('他のプレイヤーへの効果', () => {
        it('攻撃は、相手の次の番の開始時に、そのときの手札で受ける', () => {
            a.hand = makeCards(['MILITIA']);
            expect(send(a, { type: 'play', cardIndex: 0 })).toBe(true);
            expect(b.hand).toHaveLength(5);
            expect(b.deferredEffects).toHaveLength(1);
            endTurn(a);
            endTurn(b);
            const prompt = promptFor(b);
            expect(prompt.purpose).toBe('discard-down');
            expect(prompt.min).toBe(2);
            answer(b, [0, 1]);
            expect(b.hand).toHaveLength(3);
        });

        it('魔女の呪いも、相手の次の番の開始時に獲得する', () => {
            a.hand = makeCards(['WITCH']);
            send(a, { type: 'play', cardIndex: 0 });
            expect(ids(b.discard)).not.toContain('curse');
            endTurn(a);
            endTurn(b);
            expect(ids(b.discard)).toContain('curse');
        });

        it('お堀などのリアクションは、攻撃を受けるときの手札で使う', () => {
            a.hand = makeCards(['WITCH']);
            send(a, { type: 'play', cardIndex: 0 });
            endTurn(a);
            b.deck = makeCards(['MOAT', 'COPPER', 'COPPER', 'COPPER', 'COPPER', ...Array(10).fill('COPPER')]);
            endTurn(b);
            expect(ids(b.discard)).not.toContain('curse');
        });

        it('議事堂の「他のプレイヤーは1枚引く」は、相手の次の番の開始時に引く', () => {
            a.hand = makeCards(['COUNCIL_ROOM']);
            send(a, { type: 'play', cardIndex: 0 });
            expect(b.hand).toHaveLength(5);
            endTurn(a);
            endTurn(b);
            expect(b.hand).toHaveLength(6);
        });

        it('他のプレイヤーが選ぶ選択は、その人に出し、答えるまで手番の人は待つ', () => {
            a.hand = makeCards(['ADVISOR', 'VILLAGE']);
            a.deck = makeCards(['GOLD', 'SILVER', 'COPPER', ...Array(10).fill('COPPER')]);
            expect(send(a, { type: 'play', cardIndex: 0 })).toBe(true);
            const prompt = promptFor(b);
            expect(prompt.player).toBe(b);
            expect(promptFor(a)).toBeNull();
            expect(send(a, { type: 'play', cardIndex: 0 })).toBe(false);
            expect(game.lastError).toBe('Bの選択を待っています');
            // 選ばれる側の人も、自分のターンは進められる
            b.hand = makeCards(['VILLAGE']);
            expect(send(b, { type: 'play', cardIndex: 0 })).toBe(true);
            answer(b, [prompt.cards.findIndex(card => card.id === 'gold')]);
            expect(ids(a.hand)).toEqual(expect.arrayContaining(['silver', 'copper', 'village']));
            expect(ids(a.discard)).toContain('gold');
            expect(send(a, { type: 'play', cardIndex: a.hand.findIndex(card => card.id === 'village') })).toBe(true);
        });

        it('ビューには、他のプレイヤーの番から来た選択に、誰の番からかを添える', () => {
            a.hand = makeCards(['ADVISOR']);
            send(a, { type: 'play', cardIndex: 0 });
            const view = createGameView(game, b.id);
            expect(view.prompt.fromPlayerName).toBe('A');
            expect(view.prompt.purpose).toBe('advisor');
            expect(createGameView(game, a.id).prompt.waiting).toBe(true);
        });
    });

    describe('追加の番', () => {
        it('前哨地：全員が番を終えた後、その人だけが追加の番を行う', () => {
            a.hand = makeCards(['OUTPOST']);
            send(a, { type: 'play', cardIndex: 0 });
            endTurn(a);
            expect(a.hand).toHaveLength(3);
            endTurn(b);
            expect(game.extraRound).toBe(true);
            expect(game.contextOf(a).taking).toBe(true);
            expect(game.contextOf(b).taking).toBe(false);
            expect(send(b, { type: 'endTurn' })).toBe(false);
            endTurn(a);
            expect(game.extraRound).toBe(false);
            expect(game.contexts.every(ctx => ctx.taking)).toBe(true);
        });

        it('支配：追加の番に、支配した人が相手のターンを操作する', () => {
            a.hand = makeCards(['POSSESSION']);
            send(a, { type: 'play', cardIndex: 0 });
            endTurn(a);
            endTurn(b);
            expect(game.extraRound).toBe(true);
            expect(game.contextOf(b).possessor).toBe(a);
            expect(send(b, { type: 'endTurn' })).toBe(false);
            b.hand = makeCards(['VILLAGE']);
            expect(send(a, { type: 'play', cardIndex: 0 })).toBe(true);
            expect(b.actions).toBe(2);
            endTurn(a);
            expect(game.extraRound).toBe(false);
        });
    });

    describe('ビューとCPU', () => {
        it('ビューは見ている人の番の状態で作り、番を終えたら待っていることを示す', () => {
            const view = hydrateGameView(createGameView(game, b.id));
            expect(view.currentPlayerId).toBe(b.id);
            expect(view.phase).toBe('action');
            expect(view.isMyTurn).toBe(true);
            endTurn(b);
            const waiting = hydrateGameView(createGameView(game, b.id));
            expect(waiting.realtime.waiting).toBe(true);
            expect(waiting.isMyTurn).toBe(false);
            expect(waiting.realtime.status).toEqual({ [a.id]: 'playing', [b.id]: 'done' });
        });

        it('CPUは、人間が操作していなくても自分のターンを進める', () => {
            setup(['A', { name: 'C', isCPU: true }]);
            expect(isCpuToMove(game)).toBe(true);
            let steps = 0;
            while (isCpuToMove(game) && steps < 200) { runCpuStep(game); steps++; }
            expect(game.contextOf(b).done).toBe(true);
            expect(game.contextOf(a).done).toBe(false);
            expect(game.roundNumber).toBe(1);
            endTurn(a);
            expect(game.roundNumber).toBe(2);
        });

        it('CPU同士で、全セットを混ぜた試合を最後まで進められ、操作の記録から再現できる', () => {
            for (let seed = 1; seed <= 6; seed++) {
                const players = Array.from({ length: 2 + (seed % 3) }, (_, i) => ({ name: `CPU${i + 1}`, isCPU: true }));
                const options = { seed: 7000 + seed, realtime: true };
                const g = new Game(players, options);
                g.setup();
                let steps = 0;
                while (g.phase !== 'end' && isCpuToMove(g) && steps < 60000) { runCpuStep(g); steps++; }
                expect(g.result).toBeTruthy();
                expect(Game.replay(players, options, g.commands).result).toEqual(g.result);
            }
        });

        it('CPUは、他のプレイヤーの番から来た選択にも答える', () => {
            setup(['A', { name: 'C', isCPU: true }]);
            a.hand = makeCards(['ADVISOR']);
            send(a, { type: 'play', cardIndex: 0 });
            expect(promptFor(b)).not.toBeNull();
            runCpuStep(game);
            expect(promptFor(b)).toBeNull();
            expect(a.hand.length).toBeGreaterThan(0);
        });
    });
});
