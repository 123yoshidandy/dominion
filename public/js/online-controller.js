/**
 * オンライン対戦のゲームコントローラー
 * ローカル対戦の GameController と同じく、画面には getView() でビューを渡し、操作は send() で受け取る
 * ゲームはサーバーが進め、ここではサーバーから届いた自分のビューを表示するだけ
 * サーバーとの接続・再接続・参加情報の保存・CPUの手を間を置いて見せる処理は、共通部品の NetplayClient が行う
 */

import NetplayClient from './netplay/netplay-client.mjs';
import { hydrateGameView } from './game-view.js';

const SESSION_KEY = 'dominion.online'; // 再接続に使う部屋コードとトークン（NetplayClient が保存する）
const CPU_STEP_DELAY_MS = 450;          // CPUの手はローカル対戦と同じ間隔で順に見せる

// 保存した参加情報（部屋コード・トークン・名前）
export function loadOnlineSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
        return null;
    }
}

class OnlineGameController {
    // listeners: onLobby(lobby) / onError(message) / onConnectionChange(connected)
    constructor(serverUrl, listeners = {}) {
        this.listeners = listeners;
        this.uiController = null;
        this.lobby = null;
        this.view = null;              // 表示中のビュー（hydrate 済み）
        this.matchId = null;           // 表示中の対戦（変わったら前の表示を片付ける）
        this.awaitingResponse = false; // 操作を送ってから返事が届くまで

        this.net = new NetplayClient({ serverUrl, storageKey: SESSION_KEY, cpuStepDelayMs: CPU_STEP_DELAY_MS });
        this.net.on('connection', (connected) => this.listeners.onConnectionChange?.(connected));
        this.net.on('lobby', (lobby) => this.receiveLobby(lobby));
        this.net.on('state', (state) => this.receiveState(state));
        this.net.on('error', ({ message }) => {
            this.awaitingResponse = false;
            this.listeners.onError?.(message);
        });
        this.net.on('left', () => this.net.close());
    }

    setUIController(uiController) {
        this.uiController = uiController;
    }

    // ===== 部屋の操作 =====

    createRoom(name) { return this.net.createRoom(name); }
    joinRoom(roomCode, name) { return this.net.joinRoom(roomCode, name); }
    resume() { return this.net.resume(); }
    // 部屋を出る（対戦中なら、自分の席は以後CPUが代わりに操作する）
    leave() { this.net.leave(); }

    addCpu() { this.net.addCpu(); }
    removePlayer(seat) { this.net.removeCpu(seat); }
    setCardSets(cardSets) { this.net.setSettings({ cardSets }); }
    startGame() { this.net.start(); }
    backToLobby() { this.net.backToLobby(); }

    isHost() {
        return this.net.isHost();
    }

    get session() {
        return this.net.session;
    }

    // ===== 画面とのやり取り（ローカル対戦のコントローラーと同じ形） =====

    getView() {
        if (!this.view) return null;
        // 操作の返事を待つ間は、二重に操作しないよう自分の手番として扱わない
        return this.awaitingResponse ? { ...this.view, isMyTurn: false } : this.view;
    }

    send(command) {
        if (!this.net.send('command', { command })) return false;
        this.awaitingResponse = true;
        return true;
    }

    hasCpuWork() {
        return false; // CPUはサーバーが動かす
    }

    runCpuStep() {}

    // ===== サーバーからのメッセージ =====

    // 部屋の状態。画面には、退出した人を除き、使うカードを cardSets に入れた形で渡す
    receiveLobby(lobby) {
        this.lobby = {
            ...lobby,
            cardSets: lobby.settings?.cardSets ?? [],
            players: lobby.players.filter(player => !player.left)
        };
        if (lobby.status === 'lobby') {
            // ロビーに戻ったら、前のゲームの表示を消す
            this.view = null;
            this.matchId = null;
        }
        this.listeners.onLobby?.(this.lobby);
    }

    // 自分のビュー（CPUの手は NetplayClient が間を置いて1手ずつ届ける）
    receiveState({ view, matchId }) {
        this.awaitingResponse = false;
        // 部屋に入って最初のビュー、または新しい対戦なら、前の表示を片付ける
        if (!this.view || matchId !== this.matchId) this.uiController?.resetForNewGame();
        this.matchId = matchId;
        this.view = hydrateGameView(view);
        this.uiController?.updateGameView();
    }
}

export default OnlineGameController;
