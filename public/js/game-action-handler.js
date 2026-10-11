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
    
    // カード選択（捨てる・廃棄する）の結果を処理
    resolvePrompt(selectedIndices) {
        const game = this.gameController.game;
        if (!game) return false;
        return game.resolvePrompt(selectedIndices);
    }
}

export default GameActionHandler;