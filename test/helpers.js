import Game from '../public/js/game.js';
import Card from '../public/js/card.js';
import { ALL_CARDS } from '../public/js/card-data.js';
import { createRandom } from '../public/js/random.js';

// テストの既定のサプライにする王国カード10種
export const DEFAULT_KINGDOM = [
    'cellar', 'moat', 'chapel', 'village', 'merchant', 'smithy', 'festival', 'laboratory', 'market', 'witch'
];

// カードIDの配列からカードを作る
export const makeCards = (ids) => ids.map(id => new Card(ALL_CARDS[id]));

// 王国カードを指定してゲームを始める（ランダムに選ばれると結果が変わるテストのため）
// シードを決めておき、最初のプレイヤーや山札の並びもテストのたびに同じにする
export function createGame(players, kingdom = DEFAULT_KINGDOM, options = {}) {
    const game = new Game(players, { kingdom, seed: 1, ...options });
    game.setup();
    return game;
}

// シードで決まる順に並べ替える（テストの結果を毎回同じにするため）
export const seededShuffle = (items, seed) => {
    const random = createRandom(seed);
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};
