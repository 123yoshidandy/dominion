/**
 * ドミニオンのUIコントローラー
 * ゲームの状態を画面に表示し、ユーザー操作を処理する役割を持ちます
 */

import UIView from './ui-view.js';
import UIModal from './ui-modal.js';
import UIEventHandler from './ui-event-handler.js';
import { ALL_CARDS, CARD_SETS, LANDSCAPES, BOONS } from './card-data.js';
import OnlineGameController from './online-controller.js';
import { getServerUrl } from './online-config.js';

// 表示設定はブラウザに保存し、次回以降も引き継ぐ
const SETTINGS_KEY = 'dominion.settings';
const DEFAULT_SETTINGS = {
    stackHand: false, // 手札の同じカードを重ねて表示する
    cardSets: Object.values(CARD_SETS).join('+'), // 王国カードを選ぶセットを + でつないだもの（'base+seaside' など）
    playerCount: 2,           // ローカル対戦の人数
    localPlayers: [],         // ローカル対戦の各席の { name, isCPU }
    onlineName: ''            // オンライン対戦で使う名前
};

class UIController {
    // CPUが1手進めるまでの待ち時間（ミリ秒）
    static CPU_STEP_DELAY_MS = 450;

    constructor(gameController) {
        this.localController = gameController; // ローカル対戦のコントローラー（オンラインから戻るときに使う）
        this.useController(gameController);
        this.settings = this.loadSettings();
        
        // DOM要素の参照を保持
        this.elements = {
            gameStatus: document.getElementById('game-status'),
            turnStats: document.getElementById('turn-stats'),
            latestLog: document.getElementById('latest-log'),
            gameLog: document.getElementById('game-log'),
            supplyPiles: document.getElementById('supply-piles'),
            playersInfo: document.getElementById('players-info'),
            handCards: document.getElementById('hand-cards'),
            playedCards: document.getElementById('played-cards'),
            deckPile: document.getElementById('deck-pile'),
            discardCards: document.getElementById('discard-cards'),
            logEntries: document.getElementById('log-entries'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            actionButtons: document.getElementById('action-buttons'),
            gameModal: document.getElementById('game-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalClose: document.querySelector('.close'),
            settingsBtn: document.getElementById('settings-btn'),
            homeBtn: document.getElementById('home-btn'),
            helpBtn: document.getElementById('help-btn')
        };
        
        // サブコンポーネントを初期化
        this.view = new UIView(this);
        this.modal = new UIModal(this);
        this.eventHandler = new UIEventHandler(this);
        
        // UIの初期設定
        this.setupUI();
    }
    
    // UIの初期設定
    setupUI() {
        // モーダルを閉じるイベントを設定
        // 選択待ちの画面には×を出さない（答えるまで閉じられない）ので、ここでは閉じるだけ
        this.elements.modalClose.addEventListener('click', () => {
            this.modal.handleCloseButton();
        });

        // ホームに戻る（確認してから）・遊び方を見る。閉じたらゲーム画面と選択を出し直す
        this.elements.homeBtn.addEventListener('click', () => {
            this.modal.showHomeConfirm({ online: this.isOnline(), onCancel: () => this.restoreGameScreen() });
        });
        this.elements.helpBtn.addEventListener('click', () => {
            this.modal.showHelp({ onClose: () => this.restoreGameScreen() });
        });
        
        // 設定ボタンのイベントを設定
        this.elements.settingsBtn.addEventListener('click', () => {
            this.modal.showSettings();
        });
        
        // ゲーム終了ボタンのイベントを設定
        this.elements.endTurnBtn.addEventListener('click', () => {
            this.eventHandler.handleEndTurn();
        });

        // スクロールボタンのセットアップ
        this.eventHandler.setupScrollToBottomButton();
        
        // 広い画面ではログを最初から開いておく（スマホでは折りたたむ）
        if (window.matchMedia('(min-width: 900px)').matches) {
            this.elements.gameLog.open = true;
        }
    }
    
    // 保存された設定を読み込む（保存できない環境では初期値を使う）
    loadSettings() {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    }
    
    // 設定を変更して保存し、ゲーム中なら画面に反映する
    updateSettings(changes) {
        this.settings = { ...this.settings, ...changes };
        
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
        } catch {
            // 保存できなくても、このセッション中は設定が有効
        }
        
        if (this.gameController.getView()) {
            this.updateGameView();
        }
    }
    
    // ゲームの初期化画面を表示
    showGameSetup() {
        this.modal.showGameSetup();
    }
    
    // ゲーム開始処理
    startGame() {
        this.eventHandler.startGame();
    }
    
    // 画面が使うコントローラー（ローカル対戦／オンライン対戦）を切り替える
    useController(controller) {
        this.gameController = controller;
        controller.setUIController(this);
    }
    
    isOnline() {
        return this.gameController instanceof OnlineGameController;
    }
    
    // ===== オンライン対戦 =====
    
    showOnlineMenu(options = {}) {
        this.modal.showOnlineMenu(options);
    }
    
    // オンライン対戦のコントローラーに切り替える（まだなら作る）
    useOnlineController() {
        if (!this.isOnline()) {
            this.useController(new OnlineGameController(getServerUrl(), {
                onLobby: (lobby) => this.handleLobby(lobby),
                onError: (message) => this.handleOnlineError(message),
                onConnectionChange: (connected) => {
                    if (!connected) this.showToast('サーバーとの接続が切れました。再接続しています…');
                }
            }));
        }
        return this.gameController;
    }
    
    // 部屋を作る・部屋に入る・前の部屋に戻る。つながらなければオンラインのメニューにエラーを出す
    async enterOnlineRoom(action) {
        try {
            await action(this.useOnlineController());
        } catch (error) {
            this.showOnlineMenu({ error: error.message });
        }
    }
    
    createOnlineRoom(name) {
        return this.enterOnlineRoom(controller => controller.createRoom(name));
    }
    
    joinOnlineRoom(roomCode, name) {
        return this.enterOnlineRoom(controller => controller.joinRoom(roomCode, name));
    }
    
    resumeOnlineRoom() {
        return this.enterOnlineRoom(controller => controller.resume());
    }
    
    // ロビーの状態が届いた。ロビーにいる間はロビーの画面を出す（ゲーム中は接続状況の更新だけなので何もしない）
    handleLobby(lobby) {
        if (lobby.status !== 'lobby') return;
        this.latestLobby = lobby;
        // 拡張を選ぶ画面を開いている間は描き直さない（決定して戻るときに showLatestLobby で出す）
        if (this.modal.kind === 'card-sets') return;
        this.resetForNewGame();
        this.modal.showLobby(lobby, { isHost: this.gameController.isHost() });
    }
    
    // サーバーから受け付けられなかった操作の理由が届いた
    handleOnlineError(message) {
        if (this.modal.kind === 'online-menu' || !this.gameController.lobby) {
            this.showOnlineMenu({ error: message });
            return;
        }
        // 答えた選択が受け付けられなかったときは、次に届く状態で選択を出し直す
        this.shownPromptId = null;
        this.showToast(message);
    }
    
    // 最後に届いた部屋の状態を出す（拡張を選ぶ画面から戻るとき）
    showLatestLobby() {
        if (!this.latestLobby) return;
        this.resetForNewGame();
        this.modal.showLobby(this.latestLobby, { isHost: this.gameController.isHost() });
    }

    // ゲームをやめてホーム（タイトル画面）に戻る。オンライン対戦なら部屋を出る
    goHome() {
        clearTimeout(this.cpuTimer);
        this.cpuTimer = null;
        if (this.isOnline()) {
            this.leaveOnline();
            return;
        }
        this.gameController.quit();
        this.resetForNewGame();
        this.showGameSetup();
    }

    // 遊び方などを閉じて、ゲーム画面に戻る。選択待ちや結果の画面があれば出し直す
    restoreGameScreen() {
        this.modal.closeModal();
        this.shownPromptId = null;
        this.isResultShown = false;
        if (this.gameController.getView()) {
            this.updateGameView();
        } else if (this.isOnline() && this.latestLobby) {
            this.showLatestLobby();
        } else {
            this.showGameSetup();
        }
    }

    // オンライン対戦をやめて、ローカル対戦の設定画面に戻る
    leaveOnline() {
        if (this.isOnline()) this.gameController.leave();
        this.latestLobby = null;
        this.useController(this.localController);
        this.resetForNewGame();
        this.showGameSetup();
    }
    
    // 画面の下に短いお知らせを出す
    showToast(message) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
    }
    
    // 新しいゲームを始める前に、前のゲームの表示を片付ける
    resetForNewGame() {
        this.view.reset();
        this.view.clearLog();
        this.renderedLogCount = 0;
        this.shownPromptId = null;
        this.isResultShown = false;
    }
    
    // ゲーム画面を更新（ゲームの状態が変わるたびに呼ばれる）
    updateGameView() {
        const view = this.gameController.getView();
        if (!view) return;
        
        // オンライン対戦でゲームが始まった・ゲーム中の部屋に戻ったら、ロビーや参加の画面を閉じる
        // 同じ顔ぶれでもう一度始めたときは、前のゲームの結果の画面も閉じる
        if (['lobby', 'online-menu'].includes(this.modal.kind) || (this.modal.kind === 'result' && !view.result)) {
            this.modal.closeModal();
        }
        
        this.eventHandler.clearPendingActions();
        this.view.updateGameView(view);
        this.syncLogs(view);
        this.syncPrompt(view);
        this.syncResult(view);
        this.eventHandler.endTurnIfNoBuysLeft(view);

        this.scheduleCpuStep();
    }
    
    // まだ表示していないログを追加する（ビューには logsFrom 番目以降のログが入っている）
    syncLogs(view) {
        const skip = Math.max(0, this.renderedLogCount - view.logsFrom);
        view.logs.slice(skip).forEach(message => this.view.addLogEntry(message));
        this.renderedLogCount = Math.max(this.renderedLogCount, view.logsFrom + view.logs.length);
    }
    
    // 自分が答える選択待ちがあれば、まだ出していないものだけ表示する
    syncPrompt(view) {
        const prompt = view.prompt;
        if (!prompt || prompt.waiting || prompt.id === this.shownPromptId) return;
        this.shownPromptId = prompt.id;
        this.modal.showPrompt(prompt, view);
    }
    
    // ゲームが終わったら結果を1回だけ表示する
    syncResult(view) {
        if (!view.result || this.isResultShown) return;
        this.isResultShown = true;
        this.modal.showGameResults(view.result, {
            online: this.isOnline(),
            isHost: this.isOnline() && this.gameController.isHost()
        });
    }

    // CPUにやることがあれば、ログを追えるよう少し間を置いて1手進める
    scheduleCpuStep() {
        if (this.cpuTimer || !this.gameController.hasCpuWork()) return;

        this.cpuTimer = setTimeout(() => {
            this.cpuTimer = null;
            this.gameController.runCpuStep();
            // 画面が更新されない手でも止まらないよう、次の手を予約し直す
            this.scheduleCpuStep();
        }, UIController.CPU_STEP_DELAY_MS);
    }
    
    // カードプレイ処理
    handleCardPlay(cardIndex) {
        this.eventHandler.handleCardPlay(cardIndex);
    }
    
    // 購入フェーズへの移行処理
    handleEnterBuyPhase() {
        this.eventHandler.handleEnterBuyPhase();
    }
    
    // サプライのカードの説明を表示する（長押し時）
    showSupplyCardDetail(cardId) {
        const view = this.gameController.getView();
        if (!view) return;
        
        // 中身の混ざった山は、一番上のカードの説明を出す
        const card = ALL_CARDS[(view.pileTops?.[cardId] ?? cardId).toUpperCase()];
        this.modal.showCardDetail(card, {
            count: view.supply[cardId] ?? view.nonSupply?.[cardId] ?? 0,
            cost: view.costs?.[cardId]
        });
    }
    
    // 手札・場札のカードの説明を表示する（長押し時）
    showCardDetail(card) {
        this.modal.showCardDetail(card);
    }
    
    // カード購入処理
    handleCardPurchase(cardId) {
        this.eventHandler.handleCardPurchase(cardId);
    }
    
    // 財源を1つ使う
    handleLandscapePurchase(landscapeId) {
        this.eventHandler.handleLandscapePurchase(landscapeId);
    }

    // イベントなどの説明を表示する
    showLandscapeDetail(landscapeId) {
        this.modal.showLandscapeDetail(LANDSCAPES[landscapeId.toUpperCase()]);
    }

    // 祝福の説明を表示する（ドルイド）
    showBoonDetail(boonId) {
        this.modal.showLandscapeDetail({ ...BOONS[boonId.toUpperCase()], kind: 'boon' });
    }

    // 村人を1人使う
    handleUseVillager() {
        this.eventHandler.handleUseVillager();
    }

    // 夜フェイズに移る
    handleEnterNightPhase() {
        this.eventHandler.handleEnterNightPhase();
    }

    handleUseCoffers() {
        this.eventHandler.handleUseCoffers();
    }
}

export default UIController;