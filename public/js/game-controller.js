/**
 * ドミニオンのゲームコントローラー
 * ゲームロジックとUIの橋渡しをします
 */

import Game from './game.js';
import GameActionHandler from './game-action-handler.js';

class GameController {
    constructor() {
        this.game = null;
        this.uiController = null;
        this.actionHandler = new GameActionHandler(this);
    }
    
    // ゲームを初期化
    initGame(playerNames) {
        this.game = new Game(playerNames);
        
        // ゲームイベント用のコールバックを設定
        this.setupGameCallbacks();
        
        // ゲームの初期設定を行う
        this.game.setup();
        
        return this.game;
    }
    
    // UIコントローラーを設定
    setUIController(uiController) {
        this.uiController = uiController;
    }
    
    // ゲームのコールバックを設定
    setupGameCallbacks() {
        if (!this.game) return;
        
        // ゲーム状態が変更されたときのコールバック
        this.game.setCallback('onStateChanged', () => {
            if (this.uiController) {
                this.uiController.updateGameView();
            }
        });
        
        // ログが追加されたときのコールバック
        this.game.setCallback('onLog', (logEntry) => {
            if (this.uiController) {
                this.uiController.addLogEntry(logEntry);
            }
        });
        
        // ゲームが終了したときのコールバック
        this.game.setCallback('onGameEnd', (scores) => {
            if (this.uiController) {
                this.uiController.showGameResults(scores);
            }
        });
        
        // カード捨てる選択用のコールバック
        this.game.setCallback('onDiscardPrompt', (data) => {
            if (this.uiController) {
                this.uiController.showDiscardModal(data.player, data.cardId, data.callback);
            }
        });
        
        // カード廃棄選択用のコールバック
        this.game.setCallback('onTrashPrompt', (data) => {
            if (this.uiController) {
                this.uiController.showTrashModal(data.player, data.maxCount, data.callback);
            }
        });
    }
    
    // アクションカードをプレイ
    playActionCard(cardIndex) {
        return this.actionHandler.playActionCard(cardIndex);
    }
    
    // 購入フェーズに移行
    enterBuyPhase() {
        return this.actionHandler.enterBuyPhase();
    }
    
    // カードを購入
    buyCard(cardId) {
        return this.actionHandler.buyCard(cardId);
    }
    
    // ターン終了
    endTurn() {
        return this.actionHandler.endTurn();
    }
    
    // ゲームの状態を取得
    getGameState() {
        if (!this.game) return null;
        
        return {
            players: this.game.players,
            currentPlayerIndex: this.game.currentPlayerIndex,
            phase: this.game.phase,
            supply: this.game.supply,
            trash: this.game.trash,
            logs: this.game.logs
        };
    }
    
    // 現在のプレイヤーを取得
    getCurrentPlayer() {
        if (!this.game) return null;
        return this.game.getCurrentPlayer();
    }
    
    // カード捨て選択の結果を処理
    handleDiscardSelection(player, selectedIndices) {
        this.actionHandler.handleDiscardSelection(player, selectedIndices);
    }
    
    // カード廃棄選択の結果を処理
    handleTrashSelection(player, selectedIndices) {
        this.actionHandler.handleTrashSelection(player, selectedIndices);
    }
}

export default GameController;