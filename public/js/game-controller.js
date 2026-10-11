/**
 * ドミニオンのゲームコントローラー
 * ゲームロジックとUIの橋渡しをします
 */

import Game from './game.js';
import GameActionHandler from './game-action-handler.js';
import { runCpuStep, hasCpuPrompt } from './cpu-player.js';

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
        
        // プレイヤーの選択待ちのコールバック（CPUの選択は runCpuStep で答えるので、人間のときだけ画面を出す）
        this.game.setCallback('onPrompt', (prompt) => {
            if (this.uiController && !prompt.player.isCPU) {
                this.uiController.showPrompt(prompt);
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
    
    // カード選択（捨てる・廃棄する）の結果を処理
    resolvePrompt(selectedIndices) {
        return this.actionHandler.resolvePrompt(selectedIndices);
    }

    // 現在のプレイヤーがCPUで、まだゲームが続いているか
    isCpuTurn() {
        if (!this.game || this.game.phase === 'end') return false;
        return this.game.getCurrentPlayer().isCPU;
    }
    
    // CPUがやることがあるか（CPUの手番、または人間の手番中にCPUが答える選択待ちがある）
    // 人間の選択待ちのあいだは、答えが出るまでCPUは待つ
    hasCpuWork() {
        if (!this.game || this.game.phase === 'end') return false;
        if (this.game.pendingPrompt) return hasCpuPrompt(this.game);
        return this.game.getCurrentPlayer().isCPU;
    }
    
    // CPUの手番を1手進める
    runCpuStep() {
        if (!this.game) return;
        runCpuStep(this.game);
    }
}

export default GameController;