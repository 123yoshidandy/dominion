import Game from '../public/js/game.js';
import Card from '../public/js/card.js';
import { ALL_CARDS } from '../public/js/card-data.js';

// テストの既定のサプライにする王国カード10種
export const DEFAULT_KINGDOM = [
    'cellar', 'moat', 'chapel', 'village', 'merchant', 'smithy', 'festival', 'laboratory', 'market', 'witch'
];

// カードIDの配列からカードを作る
export const makeCards = (ids) => ids.map(id => new Card(ALL_CARDS[id]));

// 王国カードを指定してゲームを始める（ランダムに選ばれると結果が変わるテストのため）
export function createGame(players, kingdom = DEFAULT_KINGDOM, options = {}) {
    const game = new Game(players, { kingdom, ...options });
    game.setup();
    return game;
}
