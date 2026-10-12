/**
 * オンライン対戦の部屋に差し込む、ドミニオンのゲームの定義（部屋の仕組みは server/netplay/ の共通部品）
 *
 * 部屋には参加者・シード・操作の記録だけを保存し、操作を受けるたびに記録からゲームを再現する
 * 各プレイヤーには、そのプレイヤーから見える状態（ビュー）だけを送る
 */

import { GameError } from '../netplay/room-service.js';
import Game from '../../public/js/game.js';
import { createGameView } from '../../public/js/game-view.js';
import { runCpuStep, isCpuToMove } from '../../public/js/cpu-player.js';
import { CARD_SETS } from '../../public/js/card-types.js';

const RECENT_LOGS = 200; // 参加・再接続したときに送るログの数

// 端末から受け付ける操作と、記録する項目（proxy はサーバーだけが使う）
const COMMAND_FIELDS = {
    play: ['cardIndex'],
    buyPhase: [],
    night: [],
    coffers: ['amount'],
    villager: ['amount'],
    buy: ['cardId'],
    buyLandscape: ['landscapeId'],
    endTurn: [],
    answer: ['answer']
};

export default {
    minPlayers: 2,
    maxPlayers: 4,
    allowCpu: true,
    maxCpuSteps: 5000, // CPUだけが残った部屋でも、ゲームの終わりまで進められるように

    settings: {
        defaults: () => ({ cardSets: Object.values(CARD_SETS) }),
        validate(patch, current) {
            if (patch.cardSets === undefined) return current;
            const valid = Object.values(CARD_SETS);
            const { cardSets } = patch;
            if (!Array.isArray(cardSets) || cardSets.length === 0 || cardSets.some(set => !valid.includes(set))) {
                throw new GameError('使うカードの指定が正しくありません');
            }
            return { ...current, cardSets: [...new Set(cardSets)] };
        }
    },

    create({ players, settings, random }) {
        const options = { cardSets: settings.cardSets, seed: Math.floor(random() * 2 ** 32) };
        return startGame(players.map(({ name, isCPU }) => ({ name, isCPU })), options, []);
    },

    // 保存するのは参加者（開始したときの CPU の指定）・オプション・操作の記録だけ
    persist: (game) => ({ players: game.startingPlayers, options: game.startingOptions, commands: game.commands }),
    restore: (saved) => startGame(saved.players, saved.options, saved.commands),

    // ログは操作の前の数から送る。再接続したときは最近のログだけ送る
    mark: (game) => game.logs.length,
    joinMark: (game) => Math.max(0, game.logs.length - RECENT_LOGS),
    view: (game, seat, { since }) => createGameView(game, seat, { logsFrom: since ?? 0 }),

    actions: {
        command({ game, seat, message, reject }) {
            const command = message.command;
            const fields = command && typeof command === 'object' ? COMMAND_FIELDS[command.type] : null;
            if (!fields) reject('不明な操作です');
            // 記録する項目だけに絞る
            const accepted = { type: command.type, ...Object.fromEntries(fields.map(field => [field, command[field]])) };
            if (!game.applyCommand(seat, accepted)) reject(game.lastError ?? '今はその操作はできません');
        }
    },

    isOver: (game) => game.phase === 'end',

    // CPUの手番・CPUへの選択待ち（支配のターン中は、支配したプレイヤーで判断する）
    cpu: {
        needsStep: (game) => isCpuToMove(game),
        step: (game) => { runCpuStep(game); },
        progress: (game) => game.commands.length
    },

    // 対戦中に部屋を出た人は、以後CPUが代わりに操作する（切断は戻ってくるかもしれないので待つ）
    onPlayerGone(ctx, { seat, reason }) {
        if (reason !== 'left' || !ctx.game.applyCommand(seat, { type: 'proxy' })) ctx.ignore();
    }
};

// 記録からゲームを作る（開始したときの参加者とオプションは、保存するために残しておく）
function startGame(players, options, commands) {
    const game = Game.replay(players, options, commands);
    game.startingPlayers = players;
    game.startingOptions = options;
    return game;
}
