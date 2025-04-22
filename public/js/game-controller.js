/**
 * ドミニオンのゲームコントローラー
 * ゲームロジックとUIの橋渡しをします
 */

class GameController {
    constructor() {
        this.game = null;
        this.uiController = null;
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
        if (!this.game) return false;
        return this.game.playActionCard(cardIndex);
    }
    
    // 購入フェーズに移行
    enterBuyPhase() {
        if (!this.game) return false;
        return this.game.enterBuyPhase();
    }
    
    // カードを購入
    buyCard(cardId) {
        if (!this.game) return false;
        
        // カードIDの大文字小文字を統一するため、まず大文字に変換してALL_CARDSから情報を取得
        const upperCardId = cardId.toUpperCase();
        // 購入には小文字のIDを使用
        const lowerCardId = cardId.toLowerCase();
        
        return this.game.buyCard(upperCardId);
    }
    
    // ターン終了
    endTurn() {
        if (!this.game) return false;
        return this.game.endTurn();
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
        if (!this.game || !this.game.callbacks.onDiscardPrompt) return;
        
        const discardPrompt = this.game.callbacks.onDiscardPrompt;
        
        // 選択されたカードを捨てる（インデックスの大きい順に処理）
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            player.discardCard(index);
        });
        
        // コールバック関数を呼び出す
        discardPrompt.callback(selectedIndices.length);
        
        // コールバックをクリア
        this.game.callbacks.onDiscardPrompt = null;
        
        // UIを更新
        if (this.uiController) {
            this.uiController.updateGameView();
        }
    }
    
    // カード廃棄選択の結果を処理
    handleTrashSelection(player, selectedIndices) {
        if (!this.game || !this.game.callbacks.onTrashPrompt) return;
        
        const trashPrompt = this.game.callbacks.onTrashPrompt;
        
        // 選択されたカードを廃棄（インデックスの大きい順に処理）
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            const trashedCard = player.trashCard(index);
            if (trashedCard) {
                this.game.trash.push(trashedCard);
            }
        });
        
        // コールバック関数を呼び出す
        trashPrompt.callback();
        
        // コールバックをクリア
        this.game.callbacks.onTrashPrompt = null;
        
        // UIを更新
        if (this.uiController) {
            this.uiController.updateGameView();
        }
    }
}