/**
 * リアルタイムモード：各プレイヤーが同時に自分の番を進め、全員が番を終えたら次の番に進む
 * - プレイヤーごとに「番の状態」（コンテキスト：手番のプレイヤー・フェーズ・ターンの記録・選択待ち・手順の列など）を持ち、
 *   操作を受けるたびにそのプレイヤーのコンテキストに切り替えて処理する。カードの効果はふつうのモードと同じコードで動く
 * - 他のプレイヤーに作用する効果（攻撃・議事堂の「他のプレイヤーは1枚引く」など）は affectPlayer で包み、
 *   相手の次の番の開始時（手札を引いた後）にまとめて効かせる
 * - 他のプレイヤーが選ぶ選択は、その人に出す（答えるまで、手番のプレイヤーは待つ）。選択は番号（id）で区別する
 * - 追加のターン（前哨地・支配・好機・航海・旅程・島の民・伝道）は、全員が番を終えた後の「追加の番」で行う
 * - ゲームの終わりは、番の区切りで判定する（属州が空になっても、その番は全員が最後までプレイする）
 * Game.prototype に処理を加える
 */

// コンテキストごとに切り替える Game の項目
const CONTEXT_FIELDS = [
    'currentPlayerIndex', 'phase', 'turnState', 'pendingPrompt', 'effectQueue', 'possessor', 'possessionTrash',
    'isExtraTurn', 'missionTurn', 'currentTurnPlayer', 'previousTurnPlayer'
];

// リアルタイムモードでは王国に出さないカード（全員が同時に手札を隣へ渡すため、次の番に遅らせる形と両立しない）
export const REALTIME_EXCLUDED_CARDS = ['masquerade'];

const realtimeMethods = {
    isRealtime() {
        return Boolean(this.options.realtime);
    },

    // 各プレイヤーのコンテキストを作り、最初の番を始める（setup から呼ぶ）
    setupRealtime() {
        this.contexts = this.players.map(player => ({
            owner: player,
            taking: false, // この番に、自分のターンを行うか（追加の番では行わない人がいる）
            done: true,    // この番の自分のターンを終えたか
            outpostNext: false,
            currentPlayerIndex: player.id,
            phase: 'waiting',
            turnState: this.turnState,
            pendingPrompt: null,
            effectQueue: [],
            possessor: null,
            possessionTrash: [],
            isExtraTurn: false,
            missionTurn: false,
            currentTurnPlayer: null,
            previousTurnPlayer: null
        }));
        this.activeContext = null;
        this.roundNumber = 0;
        this.fleetRoundDone = false;
        this.startRealtimeRound(this.players.map(player => ({ player })));
    },

    // コンテキストに切り替えて fn を実行し、終わったら元に戻す
    withContext(ctx, fn) {
        const previous = this.activeContext;
        if (previous === ctx) return fn();
        this.saveContext();
        this.loadContext(ctx);
        try {
            return fn();
        } finally {
            this.saveContext();
            if (previous) this.loadContext(previous);
            else this.activeContext = null;
        }
    },

    saveContext() {
        const ctx = this.activeContext;
        if (ctx) CONTEXT_FIELDS.forEach(field => { ctx[field] = this[field]; });
    },

    loadContext(ctx) {
        CONTEXT_FIELDS.forEach(field => { this[field] = ctx[field]; });
        this.activeContext = ctx;
    },

    contextOf(player) {
        return this.contexts[player.id];
    },

    // 番を始める。entries は { player, kind, possessor, handPlayLimit }（kind は追加の番の種類）
    startRealtimeRound(entries, { extra = false } = {}) {
        this.roundNumber++;
        this.extraRound = extra;
        this.contexts.forEach(ctx => {
            ctx.taking = false;
            ctx.done = true;
            if (this.phase !== 'end') ctx.phase = 'waiting';
        });
        this.log(extra ? '追加の番です' : `第${this.roundNumber}番です`);
        // 前のターンから続く効果（猿・私掠船・封鎖など）は、ターンを始める全員の分を先に終わらせる
        // （先に終わらせないと、先にターンを始めた人に遅れて効いた攻撃を、後の人の開始で消してしまう）
        entries.forEach(({ player }) => this.clearLingeringEffects(player));
        entries.forEach(entry => {
            const ctx = this.contextOf(entry.player);
            ctx.taking = true;
            ctx.done = false;
            this.withContext(ctx, () => {
                this.possessor = entry.possessor ?? null;
                this.isExtraTurn = entry.kind === 'outpost';
                this.missionTurn = entry.kind === 'mission';
                this.possessionTrash = [];
                // 「直前のターンが自分のターンでなければ」（航海・旅程・島の民・伝道）：追加の番では、直前も自分のターンとみなす
                this.currentTurnPlayer = extra ? entry.player : null;
                if (entry.kind === 'possession') this.log(`${entry.possessor.name}が${entry.player.name}の追加のターンを支配します`);
                this.startTurn(entry.player, { regular: !extra, handPlayLimit: entry.handPlayLimit ?? null, skipLingering: true });
            });
        });
        // 番は操作を処理し終えた後で始まるので、画面にも描き直しを知らせる
        this.notifyStateChanged();
    },

    // ターンを終えた（finishTurn から呼ぶ。ふつうのモードの advanceTurn の代わり）
    finishRealtimeTurn(player, takesExtraTurn) {
        const ctx = this.activeContext ?? this.contextOf(player);
        ctx.done = true;
        if (takesExtraTurn) ctx.outpostNext = true;
        this.phase = 'waiting';
    },

    // 全員が番を終え、誰の選択待ちも手順も残っていなければ、次の番に進む
    advanceRealtimeRoundIfReady() {
        // 切り替えている途中のコンテキストの最新の状態を、先に書き戻してから調べる
        this.saveContext();
        if (this.phase === 'end' || this.contexts.some(ctx => ctx.phase === 'end')) return;
        const busy = this.contexts.some(ctx => !ctx.done || ctx.pendingPrompt || ctx.effectQueue.length > 0);
        if (busy) return;

        // 艦隊の追加の番が終わったら、ゲームを終える
        if (this.fleetRoundDone) {
            this.endRealtimeGame();
            return;
        }
        if (this.checkGameEnd()) {
            const fleet = this.players.filter(player => player.projects.has('fleet'));
            if (fleet.length > 0) {
                this.fleetRoundDone = true;
                this.log('艦隊を持つプレイヤーが、追加のターンを行います');
                this.startRealtimeRound(fleet.map(player => ({ player })), { extra: true });
                return;
            }
            this.endRealtimeGame();
            return;
        }

        // 追加のターンがあれば、それを行う人だけの「追加の番」にする（1人1回ずつ。残りは次の追加の番に回す）
        const entries = [];
        const used = new Set();
        const add = (entry, controllers = [entry.player]) => {
            if (controllers.some(player => used.has(player))) return false;
            controllers.forEach(player => used.add(player));
            entries.push(entry);
            return true;
        };
        this.contexts.forEach(ctx => {
            if (!ctx.outpostNext) return;
            ctx.outpostNext = false;
            add({ player: ctx.owner, kind: 'outpost' });
        });
        this.extraTurns = this.extraTurns.filter(item => !add({ player: item.player ?? item, kind: 'extra', handPlayLimit: item.handPlayLimit ?? null }));
        this.missions = this.missions.filter(player => !add({ player, kind: 'mission' }));
        this.possessions = this.possessions.filter(({ possessor, target }) =>
            !add({ player: target, possessor, kind: 'possession' }, [target, possessor]));
        if (entries.length > 0) {
            this.startRealtimeRound(entries, { extra: true });
            return;
        }

        // ふつうの番：全員がターンを行う（リッチでターンを飛ばす人を除く）
        const takers = this.players.filter(player => {
            if (player.skipTurns <= 0) return true;
            player.skipTurns--;
            this.log(`${player.name}はリッチの効果でターンを飛ばしました`);
            return false;
        });
        this.startRealtimeRound((takers.length > 0 ? takers : this.players).map(player => ({ player })));
    },

    endRealtimeGame() {
        this.endGame();
        this.contexts.forEach(ctx => { ctx.phase = 'end'; });
        this.notifyStateChanged();
    },

    // 他のプレイヤーに作用する効果。リアルタイムモードでは、相手の次の番の開始時に効かせる
    affectPlayer(target, effect) {
        if (!this.isRealtime() || !this.activeContext || this.activeContext.owner === target || this.phase === 'end') {
            effect();
            return;
        }
        target.deferredEffects.push(effect);
    },

    // 操作を受ける（リアルタイムモード）。操作したプレイヤーのコンテキストに切り替えて処理する
    applyRealtimeCommand(playerId, command) {
        const player = this.players[playerId];
        if (!player) return false;
        let accepted = false;
        if (command.type === 'proxy') {
            accepted = this.startProxy(playerId);
        } else if (command.type === 'answer') {
            const ctx = this.findPromptContext(playerId, command.promptId);
            if (!ctx) {
                this.reject('答える選択がありません');
                return false;
            }
            accepted = this.withContext(ctx, () => this.resolvePrompt(command.answer));
        } else {
            const ctx = this.contexts.find(c => c.taking && !c.done && (c.possessor ?? c.owner) === player);
            if (!ctx) {
                this.reject(this.phase === 'end' ? 'ゲームは終了しています' : '他のプレイヤーが番を終えるのを待っています');
                return false;
            }
            accepted = this.withContext(ctx, () => this.applyTurnCommand(playerId, command));
        }
        if (accepted) this.advanceRealtimeRoundIfReady();
        return accepted;
    },

    // そのプレイヤーが答える選択待ちのあるコンテキスト（promptId を指定すれば、その選択）
    // 指定がなければ、他のプレイヤーの番から来た選択を先に答える（相手を待たせないため）
    findPromptContext(playerId, promptId = undefined) {
        this.saveContext();
        const answerable = this.contexts.filter(ctx => ctx.pendingPrompt &&
            this.getControllerIn(ctx, ctx.pendingPrompt.player).id === playerId);
        if (promptId !== undefined && promptId !== null) return answerable.find(ctx => ctx.pendingPrompt.id === promptId) ?? null;
        return answerable.find(ctx => ctx.owner.id !== playerId) ?? answerable[0] ?? null;
    },

    // コンテキストの中での、そのプレイヤーを操作するプレイヤー（支配のターン中は支配したプレイヤー）
    getControllerIn(ctx, player) {
        return ctx.possessor && player === ctx.owner ? ctx.possessor : player;
    },

    // そのプレイヤーが答える選択待ち（画面に出す順。他のプレイヤーの番から来た選択が先）
    promptsFor(playerId) {
        const ctx = this.findPromptContext(playerId);
        return ctx ? { prompt: ctx.pendingPrompt, ctx } : null;
    },

    // 画面に表示するときのコンテキスト（自分が操作しているターンか、自分のコンテキスト）
    viewContextFor(viewerId) {
        const viewer = this.players[viewerId];
        if (!viewer) return this.contexts[0];
        return this.contexts.find(ctx => ctx.taking && !ctx.done && ctx.possessor === viewer) ?? this.contextOf(viewer);
    }
};

export function installRealtime(Game) {
    Object.assign(Game.prototype, realtimeMethods);
}
