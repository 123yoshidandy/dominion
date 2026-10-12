import { describe, it, expect } from 'vitest';
import { createTestServer } from '../server/netplay/testing.js';
import game from '../server/src/game-definition.js';
import { CARD_SETS } from '../public/js/card-types.js';

// 部屋の仕組みそのもの（部屋番号・再接続・保存のぶつかり）は共通部品のテストで確かめる
// ここでは、ドミニオンのゲームの定義が部屋に正しく差し込まれているかを確かめる
describe('オンライン対戦の部屋（ドミニオン）', () => {
    // 2人の部屋を作ってゲームを始める
    const startTwoPlayers = async () => {
        const server = createTestServer(game);
        const [a, b] = await server.createRoom(['あき', 'はる']);
        await a.send('start');
        return { server, a, b, code: a.last('joined').roomCode };
    };

    // 自分の手番の人の接続
    const currentOf = (a, b) => (a.last('state').view.currentPlayerId === 0 ? [a, b] : [b, a]);

    it('ロビーで使うカードのセットを選べ、正しくない指定は受け付けない', async () => {
        const server = createTestServer(game);
        const [a, b] = await server.createRoom(['あき', 'はる']);
        expect(a.last('lobby').settings.cardSets).toEqual(Object.values(CARD_SETS));

        await a.send('setSettings', { settings: { cardSets: ['alchemy', 'base'] } });
        expect(b.last('lobby').settings.cardSets).toEqual(['alchemy', 'base']);

        await a.send('setSettings', { settings: { cardSets: ['nothing'] } });
        expect(a.last('error').message).toBe('使うカードの指定が正しくありません');
        await a.send('setSettings', { settings: { cardSets: [] } });
        expect(a.last('lobby').settings.cardSets).toEqual(['alchemy', 'base']);

        // ホストでない人は変えられない
        await b.send('setSettings', { settings: { cardSets: ['base'] } });
        expect(b.last('error').code).toBe('not_host');
    });

    it('ゲームを始めると、それぞれに自分から見た状態が届き、選んだセットの王国カードを使う', async () => {
        const server = createTestServer(game);
        const [a, b] = await server.createRoom(['あき', 'はる']);
        await a.send('setSettings', { settings: { cardSets: ['alchemy'] } });
        await a.send('start');

        const viewA = a.last('state').view;
        const viewB = b.last('state').view;
        expect(viewA.viewerId).toBe(0);
        expect(viewB.viewerId).toBe(1);
        expect(viewA.players[0].hand).toHaveLength(5);
        expect(viewA.players[1].hand).toBe(null);
        expect(viewA.supply.potion).toBe(16);
    });

    it('手番でない人の操作は受け付けず、理由と今の状態を返す', async () => {
        const { a, b } = await startTwoPlayers();
        const [, waiting] = currentOf(a, b);
        waiting.clear();
        await waiting.send('command', { command: { type: 'buyPhase' } });
        expect(waiting.last('error').message).toBe('今はその操作はできません');
        expect(waiting.last('state').view.phase).toBe('action');
    });

    it('知らない操作は記録せず、受け付けた操作は全員に届き、ログは新しい分だけが届く', async () => {
        const { server, a, b, code } = await startTwoPlayers();
        const [current, waiting] = currentOf(a, b);
        await current.send('command', { command: { type: 'proxy' } });
        expect(current.last('error').message).toBe('不明な操作です');

        const logsBefore = waiting.last('state').view.logs.length;
        waiting.clear();
        await current.send('command', { command: { type: 'buyPhase', extra: 'x' } });
        const state = waiting.last('state');
        expect(state.view.phase).toBe('buy');
        expect(state.view.logsFrom).toBe(logsBefore);
        const saved = await server.store.getRoom(code);
        expect(saved.game.commands.at(-1)).toEqual({ playerId: current.last('joined').seat, type: 'buyPhase' });
    });

    it('切断しても、同じ席に戻ると今の状態が最近のログと一緒に届く', async () => {
        const { server, a, b } = await startTwoPlayers();
        const b2 = await server.reconnect(b);
        expect(b2.all('joined')[0].seat).toBe(1);
        const view = b2.last('state').view;
        expect(view.viewerId).toBe(1);
        expect(view.players[1].hand).toHaveLength(5);
        expect(a.last('lobby').players[1].connected).toBe(true);
    });

    it('人間1人とCPU2人で最後まで遊べ、CPUの手は1手ずつ届く', async () => {
        const server = createTestServer(game);
        const [a] = await server.createRoom(['あき']);
        await a.send('addCpu');
        await a.send('addCpu');
        await a.send('start');

        // 人間は財宝をプレイして買えるものを買い、ターンを終える
        for (let turn = 0; turn < 500 && a.last('state').view.phase !== 'end'; turn++) {
            const view = a.last('state').view;
            if (view.prompt && !view.prompt.waiting) {
                const answer = view.prompt.type === 'confirm' ? false : Array.from({ length: view.prompt.min }, (_, i) => i);
                await a.send('command', { command: { type: 'answer', answer } });
            } else if (view.phase === 'action') {
                await a.send('command', { command: { type: 'buyPhase' } });
            } else {
                await a.send('command', { command: { type: 'endTurn' } });
            }
        }
        expect(a.last('state').view.phase).toBe('end');
        expect(a.all('state').some(state => state.cpu)).toBe(true);
        expect(a.last('lobby').status).toBe('ended');
    });

    it('対戦中に部屋を出た人の席は、CPUが代わりに操作して最後まで進む', async () => {
        const { a, b } = await startTwoPlayers();
        await b.send('leave');
        expect(b.last('left')).toBeTruthy();

        // 残った人は購入フェーズに入ってターンを終えるだけで、相手のターンはCPUが進める
        for (let turn = 0; turn < 500 && a.last('state').view.phase !== 'end'; turn++) {
            const view = a.last('state').view;
            if (view.prompt && !view.prompt.waiting) {
                const answer = view.prompt.type === 'confirm' ? false : Array.from({ length: view.prompt.min }, (_, i) => i);
                await a.send('command', { command: { type: 'answer', answer } });
            } else if (view.phase === 'action') {
                await a.send('command', { command: { type: 'buyPhase' } });
            } else {
                await a.send('command', { command: { type: 'endTurn' } });
            }
        }
        const view = a.last('state').view;
        expect(view.phase).toBe('end');
        expect(view.players[1].isCPU).toBe(true);
    });

    it('対戦が終わったら誰でも部屋に戻れ、部屋を作った人は同じ顔ぶれでもう一度始められる', async () => {
        const server = createTestServer(game);
        const [a, b] = await server.createRoom(['あき', 'はる']);
        await a.send('start');
        const firstMatch = a.last('state').matchId;
        // 対戦中は部屋を作った人だけがロビーに戻せる
        await b.send('backToLobby');
        expect(b.last('error').code).toBe('not_host');

        // 決着をつけて、もう一度始める
        const room = await server.store.getRoom(a.last('joined').roomCode);
        room.status = 'ended';
        await server.store.putRoom({ ...room, version: room.version + 1 }, room.version);
        await a.send('start');
        expect(a.last('state').matchId).toBe(firstMatch + 1);

        const ended = await server.store.getRoom(a.last('joined').roomCode);
        ended.status = 'ended';
        await server.store.putRoom({ ...ended, version: ended.version + 1 }, ended.version);
        await b.send('backToLobby');
        expect(a.last('lobby').status).toBe('lobby');
    });
});
