import { describe, it, expect } from 'vitest';
import Game from '../public/js/game.js';
import { getKingdomCardIds } from '../public/js/card-data.js';
import { createGameView, hydrateGameView } from '../public/js/game-view.js';
import { runCpuStep } from '../public/js/cpu-player.js';
import { createGame, makeCards } from './helpers.js';

const ALL_KINGDOM = getKingdomCardIds(['base', 'seaside']).map(id => id.toLowerCase());
const views = (game) => game.players.map(player => JSON.stringify(createGameView(game, player.id)));

describe('操作の記録と再現', () => {
    it('同じシードと同じ操作なら、CPU同士の試合を最後まで同じように再現できる', () => {
        for (let round = 0; round < 5; round++) {
            const players = [{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }, { name: 'CPU3', isCPU: true }];
            const options = { cardSets: ['base', 'seaside'], seed: 1000 + round };
            const game = new Game(players, options);
            game.setup();
            let steps = 0;
            while (game.phase !== 'end' && steps < 30000) {
                runCpuStep(game);
                steps++;
            }
            expect(game.phase).toBe('end');

            const replayed = Game.replay(players, options, game.commands);
            expect(views(replayed)).toEqual(views(game));
            expect(replayed.logs).toEqual(game.logs);
        }
    });

    it('選択待ちの途中で再現しても、同じ選択待ちになる', () => {
        const players = [{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }];
        const options = { kingdom: ['militia', 'cellar', 'chapel', 'remodel', 'warehouse', 'lookout', 'sentry', 'haven', 'tide_pools', 'artisan'], seed: 5 };
        const game = new Game(players, options);
        game.setup();

        let checked = 0;
        while (game.phase !== 'end') {
            runCpuStep(game);
            if (!game.pendingPrompt) continue;
            const replayed = Game.replay(players, options, game.commands);
            expect(replayed.pendingPrompt.id).toBe(game.pendingPrompt.id);
            expect(views(replayed)).toEqual(views(game));
            checked++;
        }
        expect(checked).toBeGreaterThanOrEqual(5);
    });

    it('他のプレイヤーの操作や、自分宛てでない選択への答えは受け付けず、記録にもログにも残さない', () => {
        const game = createGame(['A', 'B'], ALL_KINGDOM.slice(0, 10), { seed: 7 });
        const player = game.getCurrentPlayer();
        const opponent = game.players.find(p => p !== player);
        const logCount = game.logs.length;

        expect(game.applyCommand(opponent.id, { type: 'endTurn' })).toBe(false);
        expect(game.applyCommand(player.id, { type: 'buy', cardId: 'province' })).toBe(false);
        expect(game.lastError).toBe('購入フェーズではありません');
        expect(game.commands).toHaveLength(0);
        expect(game.logs).toHaveLength(logCount);

        // 民兵の選択は攻撃を受けた相手だけが答えられる
        player.hand = makeCards(['MILITIA']);
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        game.playActionCard(0);
        expect(game.applyCommand(player.id, { type: 'answer', answer: [3, 4] })).toBe(false);
        expect(game.applyCommand(opponent.id, { type: 'answer', answer: [3, 4] })).toBe(true);
        expect(game.commands).toEqual([{ playerId: opponent.id, type: 'answer', answer: [3, 4] }]);
    });
});

describe('プレイヤーごとのビュー', () => {
    const setupMilitia = () => {
        const game = createGame(['A', 'B'], ALL_KINGDOM.slice(0, 10), { seed: 3 });
        const player = game.getCurrentPlayer();
        const opponent = game.players.find(p => p !== player);
        player.hand = makeCards(['MILITIA', 'GOLD']);
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        game.applyCommand(player.id, { type: 'play', cardIndex: 0 });
        return { game, player, opponent };
    };

    it('他のプレイヤーの手札の中身は入らず、枚数だけが分かる', () => {
        const { game, player, opponent } = setupMilitia();
        const view = createGameView(game, player.id);
        const other = view.players.find(p => p.id === opponent.id);

        expect(other.hand).toBeNull();
        expect(other.nativeVillage).toBeNull();
        expect(other.handCount).toBe(5);
        expect(view.players.find(p => p.id === player.id).hand).toEqual(['gold']);
        // ビューに山札の並びは入らない
        expect(JSON.stringify(view)).not.toContain('"deck"');
    });

    it('選択の中身は答えるプレイヤーにだけ入り、他のプレイヤーには誰が選択中かだけが分かる', () => {
        const { game, player, opponent } = setupMilitia();

        const attackerView = createGameView(game, player.id);
        expect(attackerView.prompt).toEqual({
            id: game.pendingPrompt.id, playerId: opponent.id, playerName: opponent.name, waiting: true
        });

        const targetView = hydrateGameView(createGameView(game, opponent.id));
        expect(targetView.prompt.type).toBe('select');
        expect(targetView.prompt.fromHand).toBe(true);
        expect(targetView.prompt.min).toBe(2);
        expect(targetView.prompt.cards.map(card => card.name)).toEqual(['銅貨', '銅貨', '銅貨', '屋敷', '屋敷']);
        expect(targetView.isMyTurn).toBe(false);
    });

    it('logsFrom 以降のログだけを入れる', () => {
        const { game, player } = setupMilitia();
        const view = createGameView(game, player.id, { logsFrom: 2 });
        expect(view.logsFrom).toBe(2);
        expect(view.logs).toEqual(game.logs.slice(2).map(entry => entry.message));
    });

    it('ゲームが終わったら結果が入る', () => {
        const game = createGame([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }], ALL_KINGDOM.slice(0, 10), { seed: 9 });
        while (game.phase !== 'end') runCpuStep(game);
        const view = createGameView(game, null);
        expect(view.result).toHaveLength(2);
        expect(view.result[0].points).toBeGreaterThanOrEqual(view.result[1].points);
    });
});
