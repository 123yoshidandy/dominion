import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../server/src/room-service.js';
import { MemoryStore } from '../server/src/memory-store.js';

describe('オンライン対戦の部屋', () => {
    let service;
    let store;
    let inbox; // 接続IDごとに届いたメッセージ

    const messages = (connectionId, type) => (inbox.get(connectionId) ?? []).filter(m => !type || m.type === type);
    const last = (connectionId, type) => messages(connectionId, type).at(-1);
    const send = (connectionId, message) => service.handle(connectionId, message);

    beforeEach(() => {
        store = new MemoryStore();
        inbox = new Map();
        let tokenCount = 0;
        service = new RoomService({
            store,
            send: async (connectionId, message) => {
                if (!inbox.has(connectionId)) inbox.set(connectionId, []);
                inbox.get(connectionId).push(structuredClone(message));
            },
            createToken: () => `token-${++tokenCount}`
        });
    });

    // 2人の部屋を作ってゲームを始める
    const startTwoPlayers = async () => {
        await send('c1', { action: 'create', name: 'あき' });
        const { roomCode } = last('c1', 'joined');
        await send('c2', { action: 'join', roomCode, name: 'はる' });
        await send('c1', { action: 'start' });
        return roomCode;
    };

    it('部屋を作ると部屋コードと再接続用のトークンが届き、参加者はロビーで互いを見られる', async () => {
        await send('c1', { action: 'create', name: 'あき' });
        const joined = last('c1', 'joined');
        expect(joined.roomCode).toMatch(/^\d{5}$/);
        expect(joined.seat).toBe(0);
        expect(joined.token).toBe('token-1');

        await send('c2', { action: 'join', roomCode: joined.roomCode, name: 'はる' });
        expect(last('c2', 'joined').seat).toBe(1);
        expect(last('c1', 'lobby').players.map(p => p.name)).toEqual(['あき', 'はる']);
        // 他の人のトークンはロビーに入らない
        expect(JSON.stringify(last('c2', 'lobby'))).not.toContain('token-1');
    });

    it('存在しない部屋・満員の部屋には入れない', async () => {
        await send('c9', { action: 'join', roomCode: '00000', name: 'x' });
        expect(last('c9', 'error').message).toBe('部屋が見つかりません');

        await send('c1', { action: 'create', name: 'あき' });
        const { roomCode } = last('c1', 'joined');
        await send('c1', { action: 'addCpu' });
        await send('c1', { action: 'addCpu' });
        await send('c1', { action: 'addCpu' });
        await send('c2', { action: 'join', roomCode, name: 'はる' });
        expect(last('c2', 'error').message).toBe('この部屋は満員です');
    });

    it('ロビーの操作は部屋を作った人だけができる', async () => {
        await send('c1', { action: 'create', name: 'あき' });
        const { roomCode } = last('c1', 'joined');
        await send('c2', { action: 'join', roomCode, name: 'はる' });

        await send('c2', { action: 'addCpu' });
        expect(last('c2', 'error').message).toBe('部屋を作った人だけが操作できます');

        await send('c1', { action: 'addCpu' });
        await send('c1', { action: 'setCardSets', cardSets: ['seaside'] });
        const lobby = last('c2', 'lobby');
        expect(lobby.players.map(p => p.isCPU)).toEqual([false, false, true]);
        expect(lobby.cardSets).toEqual(['seaside']);

        await send('c1', { action: 'removePlayer', seat: 1 });
        expect(last('c1', 'error').message).toBe('外せるのはCPUだけです');
        await send('c1', { action: 'removePlayer', seat: 2 });
        expect(last('c1', 'lobby').players).toHaveLength(2);
    });

    it('ゲームを始めると、それぞれに自分から見た状態が届く', async () => {
        await startTwoPlayers();
        const v1 = last('c1', 'state').view;
        const v2 = last('c2', 'state').view;
        expect(v1.viewerId).toBe(0);
        expect(v2.viewerId).toBe(1);
        expect(v1.players[0].hand).toHaveLength(5);
        expect(v1.players[1].hand).toBeNull();
        expect(v2.players[0].hand).toBeNull();
        expect(last('c1', 'lobby').status).toBe('playing');
    });

    it('手番でない人の操作は受け付けず、理由と今の状態を返す', async () => {
        await startTwoPlayers();
        const { currentPlayerId } = last('c1', 'state').view;
        const other = currentPlayerId === 0 ? 'c2' : 'c1';
        const before = messages(other, 'state').length;

        await send(other, { action: 'command', command: { type: 'endTurn' } });
        expect(last(other, 'error')).toBeDefined();
        expect(messages(other, 'state').length).toBe(before + 1);
    });

    it('操作は全員に届き、ログは新しい分だけが届く', async () => {
        await startTwoPlayers();
        const { currentPlayerId } = last('c1', 'state').view;
        const mine = currentPlayerId === 0 ? 'c1' : 'c2';
        const logCount = last('c1', 'state').view.logs.length;

        await send(mine, { action: 'command', command: { type: 'endTurn' } });
        const view = last('c1', 'state').view;
        expect(view.currentPlayerId).not.toBe(currentPlayerId);
        expect(view.logsFrom).toBe(logCount);
        expect(view.logs.some(message => message.includes('ターンが終了しました'))).toBe(true);
    });

    it('切断しても、トークンで同じ席に戻れる', async () => {
        const roomCode = await startTwoPlayers();
        const token = last('c2', 'joined').token;

        await service.disconnect('c2');
        expect(last('c1', 'lobby').players[1].connected).toBe(false);

        await send('c3', { action: 'join', roomCode, token });
        expect(last('c3', 'joined').seat).toBe(1);
        expect(last('c3', 'state').view.viewerId).toBe(1);
        expect(last('c1', 'lobby').players[1].connected).toBe(true);

        // ゲーム中は新しい人は入れない
        await send('c4', { action: 'join', roomCode, name: 'なつ' });
        expect(last('c4', 'error').message).toBe('この部屋はゲームが始まっています');
    });

    it('同時に保存がぶつかったら、読み直してやり直す', async () => {
        await send('c1', { action: 'create', name: 'あき' });
        const { roomCode } = last('c1', 'joined');
        // 1回目の保存だけ、先に他の操作が保存したことにする
        const putRoom = store.putRoom.bind(store);
        let conflicted = false;
        store.putRoom = async (room, previousVersion) => {
            if (!conflicted && room.players.length === 2) {
                conflicted = true;
                const current = await store.getRoom(roomCode);
                current.version++;
                await putRoom(current, current.version - 1);
            }
            return putRoom(room, previousVersion);
        };
        await send('c2', { action: 'join', roomCode, name: 'はる' });
        expect(conflicted).toBe(true);
        expect(last('c2', 'joined').seat).toBe(1);
    });

    it('人間1人とCPU2人で最後まで遊べる（CPUの手は1手ずつ届く）', async () => {
        await send('c1', { action: 'create', name: 'あき' });
        await send('c1', { action: 'addCpu' });
        await send('c1', { action: 'addCpu' });
        await send('c1', { action: 'start' });

        // 人間は、選択には最小限で答え、アクションはせず、買える一番良い財宝か属州を買う
        for (let step = 0; step < 5000; step++) {
            const view = last('c1', 'state').view;
            if (view.phase === 'end') break;
            const me = view.players[view.viewerId];
            let command;
            if (view.prompt && !view.prompt.waiting) {
                command = { type: 'answer', answer: view.prompt.type === 'confirm' ? false : [...Array(view.prompt.min).keys()] };
            } else if (view.phase === 'action') {
                command = { type: 'buyPhase' };
            } else if (me.buys > 0 && me.coins >= 3) {
                command = { type: 'buy', cardId: me.coins >= 8 ? 'province' : me.coins >= 6 ? 'gold' : 'silver' };
            } else {
                command = { type: 'endTurn' };
            }
            await send('c1', { action: 'command', command });
        }

        const view = last('c1', 'state').view;
        expect(view.phase).toBe('end');
        expect(view.result).toHaveLength(3);
        expect(messages('c1', 'error')).toHaveLength(0);
        expect(messages('c1', 'state').filter(m => m.cpu).length).toBeGreaterThan(10);
    });

    it('ゲームが終わったら、部屋を作った人がロビーに戻せる', async () => {
        await startTwoPlayers();
        await send('c2', { action: 'backToLobby' });
        expect(last('c2', 'error').message).toBe('部屋を作った人だけが操作できます');
        await send('c1', { action: 'backToLobby' });
        expect(last('c2', 'lobby').status).toBe('lobby');
    });
});
