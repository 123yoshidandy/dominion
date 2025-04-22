/**
 * ドミニオンのゲームアクションハンドラー
 * ゲーム内のアクション処理を担当
 */

class GameActionHandler {
    constructor(gameController) {
        this.gameController = gameController;
    }
    
    // アクションカードをプレイ
    playActionCard(cardIndex) {
        const game = this.gameController.game;
        if (!game) return false;
        return game.playActionCard(cardIndex);
    }
    
    // 購入フェーズに移行
    enterBuyPhase() {
        const game = this.gameController.game;
        if (!game) return false;
        return game.enterBuyPhase();
    }
    
    // カードを購入
    buyCard(cardId) {
        const game = this.gameController.game;
        if (!game) return false;
        
        // カードIDの大文字小文字を統一するため、まず大文字に変換してALL_CARDSから情報を取得
        const upperCardId = cardId.toUpperCase();
        // 購入には小文字のIDを使用
        const lowerCardId = cardId.toLowerCase();
        
        return game.buyCard(upperCardId);
    }
    
    // ターン終了
    endTurn() {
        const game = this.gameController.game;
        if (!game) return false;
        return game.endTurn();
    }
    
    // カード捨て選択の結果を処理
    handleDiscardSelection(player, selectedIndices) {
        const game = this.gameController.game;
        if (!game || !game.callbacks.onDiscardPrompt) return;
        
        const discardPrompt = game.callbacks.onDiscardPrompt;
        
        // 選択されたカードを捨てる（インデックスの大きい順に処理）
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            player.discardCard(index);
        });
        
        // コールバック関数を呼び出す
        discardPrompt.callback(selectedIndices.length);
        
        // コールバックをクリア
        game.callbacks.onDiscardPrompt = null;
        
        // UIを更新
        if (this.gameController.uiController) {
            this.gameController.uiController.updateGameView();
        }
    }
    
    // カード廃棄選択の結果を処理
    handleTrashSelection(player, selectedIndices) {
        const game = this.gameController.game;
        if (!game || !game.callbacks.onTrashPrompt) return;
        
        const trashPrompt = game.callbacks.onTrashPrompt;
        
        // 選択されたカードを廃棄（インデックスの大きい順に処理）
        selectedIndices.sort((a, b) => b - a).forEach(index => {
            const trashedCard = player.trashCard(index);
            if (trashedCard) {
                game.trash.push(trashedCard);
            }
        });
        
        // コールバック関数を呼び出す
        trashPrompt.callback();
        
        // コールバックをクリア
        game.callbacks.onTrashPrompt = null;
        
        // UIを更新
        if (this.gameController.uiController) {
            this.gameController.uiController.updateGameView();
        }
    }
}

export default GameActionHandler;