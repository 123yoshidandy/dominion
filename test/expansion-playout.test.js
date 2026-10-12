import { describe, it, expect } from 'vitest';
import Game from '../public/js/game.js';
import { getKingdomCardIds, EXTRA_CARDS } from '../public/js/card-data.js';
import { runCpuStep } from '../public/js/cpu-player.js';
import { createGame, makeCards } from './helpers.js';

const SETS = [
    ['intrigue', '陰謀'],
    ['prosperity', '繁栄'],
    ['hinterlands', '異郷'],
    ['cornucopia_guilds', '収穫祭＆ギルド'],
    ['alchemy', '錬金術'],
    ['dark_ages', '暗黒時代'],
    ['adventures', '冒険'],
    ['empires', '帝国']
];

// CPU同士でゲームを最後まで進める
const playOut = (game, maxSteps = 40000) => {
    let steps = 0;
    while (game.phase !== 'end' && steps < maxSteps) {
        runCpuStep(game);
        steps++;
    }
    return game;
};

const cpus = (count) => Array.from({ length: count }, (_, i) => ({ name: `CPU${i + 1}`, isCPU: true }));

describe.each(SETS)('%s（%s）のCPU同士の試合', (set) => {
    const ids = getKingdomCardIds([set]);
    const kingdom = ids.map(id => id.toLowerCase());

    it('全カードを最初からデッキに入れても、すべてプレイして最後まで進められる', () => {
        // CPUは購入戦略にないカードを買わないので、デッキに入れておいて全カードの効果と選択を通す
        // 王国カードのほか、そのセットの王国カード以外のカード（騎士・廃墟・褒賞など）もプレイされることを確かめる
        const extraIds = Object.keys(EXTRA_CARDS).filter(id => EXTRA_CARDS[id].set === set);
        const playable = makeCards([...ids, ...extraIds]).filter(card => card.onPlay);
        const played = new Set();

        for (let round = 0; round < 20; round++) {
            // セットのカードをすべてサプライに置く
            const game = createGame(cpus(2 + (round % 3)), kingdom, { seed: 600 + round });
            game.players.forEach(p => {
                p.deck.push(...makeCards(ids), ...makeCards(Object.keys(EXTRA_CARDS)).filter(card => card.onPlay));
                p.shuffleDeck();
            });
            // 財宝はまとめてログに出るので、効果を使ったことで数える
            const applyTreasure = game.applyTreasure.bind(game);
            game.applyTreasure = (player, card) => {
                played.add(card.name);
                return applyTreasure(player, card);
            };
            const log = game.log.bind(game);
            game.log = (message) => {
                const match = message.match(/は(.+)をプレイしました$/);
                if (match) played.add(match[1]);
                return log(message);
            };
            playOut(game);
            expect(game.phase).toBe('end');
        }

        expect(playable.map(card => card.name).filter(name => !played.has(name))).toEqual([]);
    });

    it('ランダムな王国カードで最後まで進められる', () => {
        for (let round = 0; round < 10; round++) {
            const game = new Game(cpus(2 + (round % 3)), { cardSets: [set], seed: 700 + round });
            game.setup();
            expect(playOut(game).phase).toBe('end');
        }
    });
});

describe('すべてのセットを混ぜた試合', () => {
    it('ランダムな王国カードで最後まで進められ、操作の記録から同じゲームを再現できる', () => {
        for (let round = 0; round < 20; round++) {
            const players = cpus(2 + (round % 3));
            const game = new Game(players, { seed: 1000 + round });
            game.setup();
            playOut(game);
            expect(game.phase).toBe('end');

            const replayed = Game.replay(players, { seed: 1000 + round }, game.commands);
            expect(replayed.result).toEqual(game.result);
        }
    });
});
