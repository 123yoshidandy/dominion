/**
 * ドミニオンのゲームモデル
 * このファイルは後方互換性のために残されています。
 * 実際のクラス定義は個別のファイルに移動されました。
 */

import Card from './card.js';
import Player from './player.js';
import Game from './game.js';

// 後方互換性のためにクラスをグローバルスコープに公開
window.Card = Card;
window.Player = Player;
window.Game = Game;