import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/js/game.js';
import Card from '../public/js/card.js';
import { ALL_CARDS } from '../public/js/card-data.js';
import {
    chooseActionCard,
    chooseCardToBuy,
    choosePromptSelection,
    runCpuStep
} from '../public/js/cpu-player.js';

// カードIDの配列から手札を作る
const makeCards = (ids) => ids.map(id => new Card(ALL_CARDS[id]));

describe('CPUプレイヤー', () => {
    let game;
    let cpu;

    beforeEach(() => {
        game = new Game([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }]);
        game.setup();
        cpu = game.getCurrentPlayer();
    });

    describe('アクションカードの選択', () => {
        it('アクションを増やすカードをターミナルより先にプレイする', () => {
            cpu.hand = makeCards(['SMITHY', 'VILLAGE', 'COPPER']);
            expect(chooseActionCard(cpu)).toBe(1);
        });

        it('廃棄するカードがなければ礼拝堂はプレイしない', () => {
            cpu.hand = makeCards(['CHAPEL', 'COPPER', 'SILVER']);
            expect(chooseActionCard(cpu)).toBe(-1);
        });

        it('アクションが残っていなければプレイしない', () => {
            cpu.hand = makeCards(['VILLAGE']);
            cpu.actions = 0;
            expect(chooseActionCard(cpu)).toBe(-1);
        });
    });

    describe('購入するカードの選択', () => {
        it('8コインなら属州を買う', () => {
            cpu.coins = 8;
            expect(chooseCardToBuy(cpu, game)).toBe('province');
        });

        it('序盤の6コインなら金貨、終盤なら公領を買う', () => {
            cpu.coins = 6;
            expect(chooseCardToBuy(cpu, game)).toBe('gold');

            game.supply.province = 3;
            expect(chooseCardToBuy(cpu, game)).toBe('duchy');
        });

        it('序盤の5コインなら魔女を買い、すでにターミナルが多ければ買わない', () => {
            cpu.coins = 5;
            expect(chooseCardToBuy(cpu, game)).toBe('witch');

            cpu.deck.push(...makeCards(['SMITHY']));
            expect(chooseCardToBuy(cpu, game)).toBe('laboratory');
        });

        it('2コインでは序盤は何も買わない', () => {
            cpu.coins = 2;
            expect(chooseCardToBuy(cpu, game)).toBeNull();
        });
    });

    describe('カード選択', () => {
        it('地下室では勝利点と呪いを捨てる', () => {
            cpu.hand = makeCards(['ESTATE', 'COPPER', 'CURSE', 'DUCHY']);
            const selection = choosePromptSelection({ type: 'discard', player: cpu });
            expect(selection).toEqual([0, 2, 3]);
        });

        it('礼拝堂では呪いと屋敷だけを最大枚数まで廃棄する', () => {
            cpu.hand = makeCards(['ESTATE', 'DUCHY', 'CURSE', 'ESTATE', 'ESTATE', 'COPPER']);
            const selection = choosePromptSelection({ type: 'trash', player: cpu, maxCount: 3 });
            expect(selection).toEqual([0, 2, 3]);
        });
    });

    it('人間の手番では何もしない', () => {
        cpu.isCPU = false;
        const phase = game.phase;
        runCpuStep(game);
        expect(game.phase).toBe(phase);
    });

    it('CPU同士で最後までゲームを進められる', () => {
        for (let round = 0; round < 20; round++) {
            const cpuGame = new Game([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }]);
            cpuGame.setup();

            let steps = 0;
            while (cpuGame.phase !== 'end' && steps < 10000) {
                runCpuStep(cpuGame);
                steps++;
            }

            expect(cpuGame.phase).toBe('end');
            expect(cpuGame.winner).toBeDefined();
        }
    });
});
