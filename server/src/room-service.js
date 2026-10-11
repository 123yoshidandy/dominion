/**
 * オンライン対戦の部屋の処理
 * 保存先（store）と送信（send）は外から渡すので、AWS でも手元のテスト用サーバーでも同じ処理を使える
 *
 * 部屋には参加者・シード・操作の記録だけを保存し、操作を受けるたびに記録からゲームを再現する
 * 各プレイヤーには、そのプレイヤーから見える状態（ビュー）だけを送る
 */

import Game from '../../public/js/game.js';
import { createGameView } from '../../public/js/game-view.js';
import { runCpuStep, hasCpuPrompt } from '../../public/js/cpu-player.js';
import { createSeed } from '../../public/js/random.js';
import { CARD_SETS } from '../../public/js/card-types.js';

export const MAX_PLAYERS = 4;
const ROOM_TTL_SECONDS = 2 * 24 * 60 * 60;             // 部屋は最後の操作から2日で消える
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 見間違えやすい I・O・0・1 は使わない
const CODE_LENGTH = 5;
const MAX_NAME_LENGTH = 12;
const RECENT_LOGS = 200;    // 参加・再接続したときに送るログの数
const MAX_CPU_STEPS = 5000; // CPUが止まらなくなったときの安全装置
const MAX_RETRIES = 3;      // 同時に操作されて保存がぶつかったときのやり直し回数

// 保存がぶつかったとき（他の操作が先に保存した）に store が投げるエラー
export class ConflictError extends Error {}

// 利用者に伝えるエラー（メッセージをそのまま画面に出す）
class UserError extends Error {}

export class RoomService {
    // store: getRoom(code) / putRoom(room, previousVersion) / getConnection(id) / putConnection(connection) / deleteConnection(id)
    // send: (connectionId, message) => Promise（接続が切れていれば失敗してよい）
    constructor({ store, send, createToken = () => crypto.randomUUID(), now = () => Date.now(), random = Math.random }) {
        this.store = store;
        this.sendRaw = send;
        this.createToken = createToken;
        this.now = now;
        this.random = random;
    }

    // ===== 入口 =====

    // 端末からのメッセージを処理する。保存がぶつかったら読み直してやり直す
    async handle(connectionId, message) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const outbox = await this.route(connectionId, message ?? {});
                await this.flush(outbox);
                return;
            } catch (error) {
                if (error instanceof ConflictError) continue;
                if (error instanceof UserError) {
                    await this.send(connectionId, { type: 'error', message: error.message });
                    return;
                }
                throw error;
            }
        }
        await this.send(connectionId, { type: 'error', message: '混み合っています。もう一度操作してください' });
    }

    // 接続が切れたら、部屋の参加者を「切断中」にする（席はそのまま残し、再接続できるようにする）
    async disconnect(connectionId) {
        const connection = await this.store.getConnection(connectionId);
        await this.store.deleteConnection(connectionId);
        if (!connection) return;

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const room = await this.store.getRoom(connection.roomCode);
            const player = room?.players[connection.seat];
            if (!player || player.connectionId !== connectionId) return;
            player.connectionId = null;
            try {
                await this.saveRoom(room);
                await this.flush(this.lobbyMessages(room));
                return;
            } catch (error) {
                if (!(error instanceof ConflictError)) throw error;
            }
        }
    }

    async route(connectionId, message) {
        switch (message.action) {
            case 'create': return this.createRoom(connectionId, message);
            case 'join': return this.joinRoom(connectionId, message);
        }

        // ここから先は部屋に入っている端末だけ
        const { room, seat } = await this.loadMember(connectionId);
        switch (message.action) {
            case 'addCpu': return this.addCpu(room, seat);
            case 'removePlayer': return this.removePlayer(room, seat, message.seat);
            case 'setCardSets': return this.setCardSets(room, seat, message.cardSets);
            case 'start': return this.startGame(room, seat);
            case 'command': return this.applyCommand(room, seat, connectionId, message.command);
            case 'backToLobby': return this.backToLobby(room, seat);
            default: throw new UserError('不明な操作です');
        }
    }

    // ===== 部屋に入る =====

    async createRoom(connectionId, { name }) {
        const player = this.newPlayer(name, connectionId);
        const room = {
            code: null,
            version: 0,
            status: 'lobby',
            cardSets: Object.values(CARD_SETS),
            players: [player],
            game: null
        };

        // 部屋コードが既存の部屋とぶつかったら作り直す
        for (let attempt = 0; ; attempt++) {
            room.code = this.createRoomCode();
            try {
                await this.saveRoom(room);
                break;
            } catch (error) {
                if (!(error instanceof ConflictError) || attempt >= 5) throw error;
            }
        }
        await this.store.putConnection({ connectionId, roomCode: room.code, seat: 0, expiresAt: this.expiresAt() });
        return [this.joinedMessage(room, 0), ...this.lobbyMessages(room)];
    }

    // 部屋に参加する。token が参加者のものなら、その席に再接続する
    async joinRoom(connectionId, { roomCode, name, token }) {
        const room = await this.store.getRoom(String(roomCode ?? '').toUpperCase());
        if (!room) throw new UserError('部屋が見つかりません');

        let seat = token ? room.players.findIndex(player => player.token === token) : -1;
        if (seat >= 0) {
            room.players[seat].connectionId = connectionId;
        } else {
            if (room.status !== 'lobby') throw new UserError('この部屋はゲームが始まっています');
            if (room.players.length >= MAX_PLAYERS) throw new UserError('この部屋は満員です');
            room.players.push(this.newPlayer(name, connectionId));
            seat = room.players.length - 1;
        }

        await this.saveRoom(room);
        await this.store.putConnection({ connectionId, roomCode: room.code, seat, expiresAt: this.expiresAt() });

        const messages = [this.joinedMessage(room, seat), ...this.lobbyMessages(room)];
        if (room.game) {
            // ゲーム中なら、今の状態を最近のログと一緒に送る
            const game = this.replay(room);
            messages.push(this.stateMessage(game, connectionId, seat, Math.max(0, game.logs.length - RECENT_LOGS)));
        }
        return messages;
    }

    // ===== ロビー（部屋を作った人＝席0の人だけが操作できる） =====

    addCpu(room, seat) {
        this.assertHostInLobby(room, seat);
        if (room.players.length >= MAX_PLAYERS) throw new UserError('これ以上参加できません');
        const cpuCount = room.players.filter(player => player.isCPU).length;
        room.players.push({ name: `CPU${cpuCount + 1}`, isCPU: true, token: null, connectionId: null });
        return this.saveAndAnnounce(room);
    }

    // CPUを外す（人間の参加者は外さない）
    removePlayer(room, seat, targetSeat) {
        this.assertHostInLobby(room, seat);
        if (!room.players[targetSeat]?.isCPU) throw new UserError('外せるのはCPUだけです');
        room.players.splice(targetSeat, 1);
        return this.saveAndAnnounce(room, { reseat: true });
    }

    setCardSets(room, seat, cardSets) {
        this.assertHostInLobby(room, seat);
        const valid = Object.values(CARD_SETS);
        if (!Array.isArray(cardSets) || cardSets.length === 0 || cardSets.some(set => !valid.includes(set))) {
            throw new UserError('使うカードの指定が正しくありません');
        }
        room.cardSets = [...new Set(cardSets)];
        return this.saveAndAnnounce(room);
    }

    async startGame(room, seat) {
        this.assertHostInLobby(room, seat);
        if (room.players.length < 2) throw new UserError('2人以上で始めてください');

        room.status = 'playing';
        room.game = {
            players: room.players.map(({ name, isCPU }) => ({ name, isCPU })),
            options: { cardSets: room.cardSets, seed: createSeed() },
            commands: []
        };
        const game = this.replay(room);
        const snapshots = [this.snapshot(room, game, 0), ...this.runCpu(room, game)];
        return [...await this.saveWithSnapshots(room, game, snapshots), ...this.lobbyMessages(room)];
    }

    backToLobby(room, seat) {
        if (seat !== 0) throw new UserError('部屋を作った人だけが操作できます');
        if (room.status !== 'playing') return [];
        room.status = 'lobby';
        room.game = null;
        return this.saveAndAnnounce(room);
    }

    // ===== ゲーム中 =====

    async applyCommand(room, seat, connectionId, command) {
        if (room.status !== 'playing' || !room.game) throw new UserError('ゲームが始まっていません');

        const game = this.replay(room);
        const logsBefore = game.logs.length;
        if (!command || !game.applyCommand(seat, command)) {
            // 受け付けられなかったら理由と今の状態を返し、画面を正しい状態に戻す
            return [
                { connectionId, message: { type: 'error', message: game.lastError ?? '今はその操作はできません' } },
                this.stateMessage(game, connectionId, seat, game.logs.length)
            ];
        }

        room.game.commands = game.commands;
        const snapshots = [this.snapshot(room, game, logsBefore), ...this.runCpu(room, game)];
        return this.saveWithSnapshots(room, game, snapshots);
    }

    // 人間の操作が必要になるまでCPUを進め、1手ごとの各プレイヤーのビューを残す（画面で順に見せるため）
    runCpu(room, game) {
        const snapshots = [];
        for (let step = 0; step < MAX_CPU_STEPS && this.needsCpu(game); step++) {
            const logsBefore = game.logs.length;
            const commandsBefore = game.commands.length;
            runCpuStep(game);
            if (game.commands.length === commandsBefore) break; // 進まなければ止める
            snapshots.push(this.snapshot(room, game, logsBefore, { cpu: true }));
        }
        room.game.commands = game.commands;
        return snapshots;
    }

    needsCpu(game) {
        if (game.phase === 'end') return false;
        if (game.pendingPrompt) return hasCpuPrompt(game);
        return game.getCurrentPlayer().isCPU;
    }

    // ===== 保存と送信 =====

    async saveWithSnapshots(room, game, snapshots) {
        await this.saveRoom(room);
        return snapshots.flat();
    }

    async saveAndAnnounce(room, { reseat = false } = {}) {
        await this.saveRoom(room);
        if (reseat) {
            // 席が詰まったので、接続の席番号を書き直す
            await Promise.all(room.players.map((player, seat) => player.connectionId
                ? this.store.putConnection({ connectionId: player.connectionId, roomCode: room.code, seat, expiresAt: this.expiresAt() })
                : null));
        }
        return this.lobbyMessages(room);
    }

    // 部屋を保存する（読み込んだときと版が違えば ConflictError）
    async saveRoom(room) {
        const previousVersion = room.version;
        room.version = previousVersion + 1;
        room.expiresAt = this.expiresAt();
        try {
            await this.store.putRoom(room, previousVersion);
        } catch (error) {
            room.version = previousVersion;
            throw error;
        }
    }

    async flush(outbox) {
        // 同じ端末へのメッセージは順番を守り、端末どうしは並べて送る
        const byConnection = new Map();
        outbox.forEach(({ connectionId, message }) => {
            if (!byConnection.has(connectionId)) byConnection.set(connectionId, []);
            byConnection.get(connectionId).push(message);
        });
        await Promise.all([...byConnection].map(async ([connectionId, messages]) => {
            for (const message of messages) {
                await this.send(connectionId, message);
            }
        }));
    }

    async send(connectionId, message) {
        try {
            await this.sendRaw(connectionId, message);
        } catch {
            // 切れた接続には送れなくてよい（切断の通知で片付ける）
        }
    }

    // ===== メッセージ =====

    joinedMessage(room, seat) {
        const player = room.players[seat];
        return { connectionId: player.connectionId, message: { type: 'joined', roomCode: room.code, seat, token: player.token } };
    }

    // ロビーの状態（参加者・接続状況・使うカード）を全員に送る
    lobbyMessages(room) {
        const lobby = {
            type: 'lobby',
            roomCode: room.code,
            status: room.status,
            cardSets: room.cardSets,
            players: room.players.map((player, seat) => ({
                seat,
                name: player.name,
                isCPU: player.isCPU,
                connected: player.isCPU || Boolean(player.connectionId)
            }))
        };
        return this.toConnected(room, () => lobby);
    }

    stateMessage(game, connectionId, seat, logsFrom, extra = {}) {
        return { connectionId, message: { type: 'state', view: createGameView(game, seat, { logsFrom }), ...extra } };
    }

    // 今のゲームの状態を、接続している人間それぞれのビューにして残す
    snapshot(room, game, logsFrom, extra = {}) {
        return room.players
            .map((player, seat) => ({ player, seat }))
            .filter(({ player }) => player.connectionId)
            .map(({ player, seat }) => this.stateMessage(game, player.connectionId, seat, logsFrom, extra));
    }

    toConnected(room, createMessage) {
        return room.players
            .filter(player => player.connectionId)
            .map(player => ({ connectionId: player.connectionId, message: createMessage(player) }));
    }

    // ===== 補助 =====

    async loadMember(connectionId) {
        const connection = await this.store.getConnection(connectionId);
        if (!connection) throw new UserError('部屋に入っていません');
        const room = await this.store.getRoom(connection.roomCode);
        if (!room || room.players[connection.seat]?.connectionId !== connectionId) {
            throw new UserError('部屋に入っていません');
        }
        return { room, seat: connection.seat };
    }

    assertHostInLobby(room, seat) {
        if (seat !== 0) throw new UserError('部屋を作った人だけが操作できます');
        if (room.status !== 'lobby') throw new UserError('ゲーム中は変更できません');
    }

    replay(room) {
        const { players, options, commands } = room.game;
        return Game.replay(players, options, commands);
    }

    newPlayer(name, connectionId) {
        const trimmed = String(name ?? '').trim().slice(0, MAX_NAME_LENGTH);
        return { name: trimmed || 'プレイヤー', isCPU: false, token: this.createToken(), connectionId };
    }

    createRoomCode() {
        return Array.from({ length: CODE_LENGTH },
            () => CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)]).join('');
    }

    expiresAt() {
        return Math.floor(this.now() / 1000) + ROOM_TTL_SECONDS;
    }
}
