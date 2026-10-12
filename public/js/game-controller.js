/**
 * ドミニオンのゲームコントローラー（ローカル対戦）
 * 画面には getView() でプレイヤーから見た状態だけを渡し、操作は send() で受け取る
 * オンライン対戦のコントローラーも同じ形にして、画面からは区別なく使えるようにする
 */

import Game from './game.js';
import { createGameView, hydrateGameView } from './game-view.js';
import { runCpuStep, isCpuToMove } from './cpu-player.js';

class GameController {
    constructor() {
        this.game = null;
        this.uiController = null;
        this.viewerId = null; // 画面に表示しているプレイヤー
    }

    // ゲームを初期化
    initGame(playerNames, options) {
        this.game = new Game(playerNames, options);

        // ゲーム状態が変わったら画面を描き直す
        this.game.setCallback('onStateChanged', () => {
            if (this.uiController) {
                this.uiController.updateGameView();
            }
        });

        this.game.setup();
        this.viewerId = null;

        return this.game;
    }

    // ゲームをやめる（ホームに戻るとき）
    quit() {
        this.game = null;
        this.viewerId = null;
    }

    // UIコントローラーを設定
    setUIController(uiController) {
        this.uiController = uiController;
    }

    // 画面に表示するプレイヤー。人間の選択待ちならその人、人間の手番ならその人
    // CPUの手番中は、直前に表示していた人間のままにする（同じ端末で人間が交代で遊ぶときにも使える）
    getViewerId() {
        const game = this.game;
        const prompt = game.pendingPrompt;
        const current = game.getCurrentPlayer();

        // 支配のターン中は、支配したプレイヤーが手番のプレイヤーを操作する
        const promptController = prompt ? game.getController(prompt.player) : null;
        const currentController = game.getController(current);
        if (promptController && !promptController.isCPU) {
            this.viewerId = promptController.id;
        } else if (!currentController.isCPU) {
            this.viewerId = currentController.id;
        } else if (this.viewerId === null) {
            this.viewerId = (game.players.find(player => !player.isCPU) ?? game.players[0]).id;
        }
        return this.viewerId;
    }

    // 画面に表示するプレイヤーから見たゲームの状態
    getView() {
        if (!this.game) return null;
        return hydrateGameView(createGameView(this.game, this.getViewerId()));
    }

    // 画面に表示しているプレイヤーの操作を送る。受け付けられたかを返す
    send(command) {
        if (!this.game) return false;
        return this.game.applyCommand(this.getViewerId(), command);
    }

    // CPUがやることがあるか（CPUの手番、または人間の手番中にCPUが答える選択待ちがある）
    // 人間の選択待ちのあいだは、答えが出るまでCPUは待つ
    hasCpuWork() {
        return Boolean(this.game) && isCpuToMove(this.game);
    }

    // CPUの手番を1手進める
    runCpuStep() {
        if (!this.game) return;
        runCpuStep(this.game);
    }
}

export default GameController;
