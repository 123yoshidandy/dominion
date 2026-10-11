/**
 * ドミニオンのメインJavaScriptファイル
 * アプリケーションの起動と初期化を行います
 */

import GameController from './game-controller.js';
import UIController from './ui-controller.js';

// 長押し・右クリックでブラウザのメニューを出さない（入力欄では貼り付けなどに使うので出す）
// カードの右クリックで説明を出す処理（press-handler.js）は、カードの要素で先に動く
document.addEventListener('contextmenu', (event) => {
    if (!event.target.closest('input, textarea')) {
        event.preventDefault();
    }
});

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