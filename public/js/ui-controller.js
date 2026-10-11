/**
 * ドミニオンのUIコントローラー
 * ゲームの状態を画面に表示し、ユーザー操作を処理する役割を持ちます
 */

import UIView from './ui-view.js';
import UIModal from './ui-modal.js';
import UIEventHandler from './ui-event-handler.js';
import { ALL_CARDS } from './card-data.js';

class UIController {
    // CPUが1手進めるまでの待ち時間（ミリ秒）
    static CPU_STEP_DELAY_MS = 700;

    constructor(gameController) {
        this.gameController = gameController;
        this.gameController.setUIController(this);
        
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
            deckCount: document.getElementById('deck-count'),
            discardCards: document.getElementById('discard-cards'),
            logEntries: document.getElementById('log-entries'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            actionButtons: document.getElementById('action-buttons'),
            gameModal: document.getElementById('game-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalClose: document.querySelector('.close')
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
        this.elements.modalClose.addEventListener('click', () => {
            this.modal.closeModal();

            // カード選択中に閉じた場合は「何も選ばない」として解決し、ゲームが止まらないようにする
            if (this.gameController.hasPendingPrompt()) {
                this.gameController.resolvePrompt([]);
            }
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
    
    // ゲームの初期化画面を表示
    showGameSetup() {
        this.modal.showGameSetup();
    }
    
    // ゲーム開始処理
    startGame() {
        this.eventHandler.startGame();
    }
    
    // ゲーム画面を更新
    updateGameView() {
        const gameState = this.gameController.getGameState();
        this.view.updateGameView(gameState);

        this.scheduleCpuStep();
    }

    // CPUの手番なら、ログを追えるよう少し間を置いて1手進める
    scheduleCpuStep() {
        if (this.cpuTimer || !this.gameController.isCpuTurn()) return;

        this.cpuTimer = setTimeout(() => {
            this.cpuTimer = null;
            this.gameController.runCpuStep();
            // 画面が更新されない手でも止まらないよう、次の手を予約し直す
            this.scheduleCpuStep();
        }, UIController.CPU_STEP_DELAY_MS);
    }
    
    // ログエントリ追加
    addLogEntry(logEntry) {
        this.view.addLogEntry(logEntry);
    }
    
    // カード捨て選択モーダル表示
    showDiscardModal(player, cardId, callback) {
        this.modal.showDiscardModal(player, cardId, callback);
    }
    
    // カード廃棄選択モーダル表示
    showTrashModal(player, maxCount, callback) {
        this.modal.showTrashModal(player, maxCount, callback);
    }
    
    // ゲーム結果表示
    showGameResults(scores) {
        this.modal.showGameResults(scores);
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
        const gameState = this.gameController.getGameState();
        if (!gameState) return;
        
        const card = ALL_CARDS[cardId.toUpperCase()];
        this.modal.showCardDetail(card, { count: gameState.supply[cardId] ?? 0 });
    }
    
    // 手札・場札のカードの説明を表示する（長押し時）
    showCardDetail(card) {
        this.modal.showCardDetail(card);
    }
    
    // カード購入処理
    handleCardPurchase(cardId) {
        this.eventHandler.handleCardPurchase(cardId);
    }
}

export default UIController;