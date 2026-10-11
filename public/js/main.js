/**
 * ドミニオンのメインJavaScriptファイル
 * アプリケーションの起動と初期化を行います
 */

import GameController from './game-controller.js';
import UIController from './ui-controller.js';

// DOMの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', () => {
    // ゲームコントローラーを初期化
    const gameController = new GameController();
    
    // UIコントローラーを初期化
    const uiController = new UIController(gameController);
    
    // 招待のURL（?room=部屋コード）で開いたら、オンライン対戦の参加画面を出す
    const roomCode = new URLSearchParams(location.search).get('room');
    if (roomCode) {
        uiController.showOnlineMenu({ roomCode });
    } else {
        uiController.showGameSetup();
    }
});