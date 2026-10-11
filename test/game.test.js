import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/js/game.js';
import Card from '../public/js/card.js';
import { ALL_CARDS } from '../public/js/card-data.js';

// カードIDの配列から手札を作る
const makeCards = (ids) => ids.map(id => new Card(ALL_CARDS[id]));

describe('Game', () => {
    let game;
    let player;
    let opponent;

    beforeEach(() => {
        game = new Game(['A', 'B']);
        game.setup();
        player = game.getCurrentPlayer();
        opponent = game.players.find(p => p !== player);
    });

    describe('サプライ', () => {
        it('2人プレイでは屋敷・公領・属州が8枚ずつ、呪いが10枚', () => {
            expect(game.supply.estate).toBe(8);
            expect(game.supply.duchy).toBe(8);
            expect(game.supply.province).toBe(8);
            expect(game.supply.curse).toBe(10);
        });
    });

    describe('魔女', () => {
        it('他のプレイヤーが呪いを獲得し、サプライの呪いが減る', () => {
            player.hand = makeCards(['WITCH']);
            opponent.hand = makeCards(['COPPER']);

            expect(game.playActionCard(0)).toBe(true);

            expect(opponent.discard.map(c => c.id)).toContain('curse');
            expect(game.supply.curse).toBe(9);
        });

        it('呪いのサプライが空なら獲得しない', () => {
            game.supply.curse = 0;
            player.hand = makeCards(['WITCH']);

            game.playActionCard(0);

            expect(opponent.discard.map(c => c.id)).not.toContain('curse');
            expect(game.supply.curse).toBe(0);
        });

        it('お堀を持っていれば攻撃を防ぐ', () => {
            player.hand = makeCards(['WITCH']);
            opponent.hand = makeCards(['MOAT']);

            game.playActionCard(0);

            expect(opponent.discard.map(c => c.id)).not.toContain('curse');
            expect(game.supply.curse).toBe(10);
        });
    });

    describe('地下室', () => {
        it('選んだ枚数を捨てて、同じ枚数を引く', () => {
            player.hand = makeCards(['CELLAR', 'ESTATE', 'ESTATE', 'COPPER']);
            player.deck = makeCards(['GOLD', 'GOLD']);

            game.playActionCard(0);
            expect(game.pendingPrompt.type).toBe('discard');

            // 屋敷2枚を捨てる
            game.resolvePrompt([0, 1]);

            expect(game.pendingPrompt).toBeNull();
            expect(player.hand.map(c => c.id).sort()).toEqual(['copper', 'gold', 'gold']);
            expect(player.actions).toBe(1);
        });

        it('選択待ちの間は購入フェーズに移れない', () => {
            player.hand = makeCards(['CELLAR', 'COPPER']);

            game.playActionCard(0);

            expect(game.enterBuyPhase()).toBe(false);
            expect(game.endTurn()).toBe(false);
            expect(game.phase).toBe('action');
        });
    });

    describe('礼拝堂', () => {
        it('選んだカードを廃棄置き場に送る（最大4枚）', () => {
            player.hand = makeCards(['CHAPEL', 'ESTATE', 'ESTATE', 'ESTATE', 'COPPER', 'COPPER']);

            game.playActionCard(0);
            expect(game.pendingPrompt.type).toBe('trash');

            // 5枚選んでも4枚までしか廃棄されない
            game.resolvePrompt([0, 1, 2, 3, 4]);

            expect(game.trash).toHaveLength(4);
            expect(player.hand).toHaveLength(1);
        });
    });

    describe('ゲーム終了', () => {
        it('最後の属州を買ってもターン終了までは終わらない', () => {
            game.supply.province = 1;
            game.phase = 'buy';
            player.coins = 8;
            player.buys = 2;

            game.buyCard('province');
            expect(game.phase).toBe('buy');

            game.endTurn();
            expect(game.phase).toBe('end');
            expect(game.winner).toBeDefined();
        });

        it('ゲーム終了後はターンを進められない', () => {
            game.supply.province = 0;
            game.endTurn();

            expect(game.endTurn()).toBe(false);
        });
    });
});
