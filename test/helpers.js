import Game from '../public/js/game.js';
import Card from '../public/js/card.js';
import { ALL_CARDS } from '../public/js/card-data.js';

// 以前から実装していた王国カード10種（テストの既定のサプライ）
export const ORIGINAL_KINGDOM = [
    'cellar', 'moat', 'chapel', 'village', 'woodcutter', 'smithy', 'festival', 'laboratory', 'market', 'witch'
];

// カードIDの配列からカードを作る
export const makeCards = (ids) => ids.map(id => new Card(ALL_CARDS[id]));

// 王国カードを指定してゲームを始める（ランダムに選ばれると結果が変わるテストのため）
export function createGame(players, kingdom = ORIGINAL_KINGDOM) {
    const game = new Game(players);
    game.selectRandomKingdomCards = () => [...kingdom];
    game.setup();
    return game;
}
