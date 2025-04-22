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
    
    // ゲームセットアップ画面を表示
    uiController.showGameSetup();
});