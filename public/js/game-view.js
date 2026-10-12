/**
 * プレイヤーごとに見える状態（ビュー）
 * サーバーとブラウザのどちらでも使う。ビューはJSONにできる値だけで作り、カードはIDで表す
 * 他のプレイヤーの手札や山札の中身など、見えてはいけない情報は入れない
 */

import Card from './card.js';
import { ALL_CARDS } from './card-data.js';

const cardIds = (cards) => cards.map(card => card.id);

// 選択待ちのビュー。答えるプレイヤー（支配のターン中は支配したプレイヤー）にだけ中身を見せ、他のプレイヤーには誰が選択中かだけを伝える
function createPromptView(game, prompt, viewerId) {
    if (!prompt) return null;
    
    const controller = game.getController(prompt.player);
    const base = { id: prompt.id, playerId: prompt.player.id, playerName: controller.name };
    if (controller.id !== viewerId) {
        return { ...base, waiting: true };
    }
    
    return {
        ...base,
        type: prompt.type,
        purpose: prompt.purpose,
        title: prompt.title,
        message: prompt.message,
        // select
        cards: prompt.cards ? cardIds(prompt.cards) : null,
        // choose
        options: prompt.options ?? null,
        fromHand: prompt.cards === prompt.player.hand,
        min: prompt.min,
        max: prompt.max,
        confirmLabel: prompt.confirmLabel,
        // confirm
        card: prompt.card ? prompt.card.id : null,
        yesLabel: prompt.yesLabel,
        noLabel: prompt.noLabel
    };
}

// viewerId のプレイヤーから見たゲームの状態（logsFrom 番目以降のログだけを入れる）
export function createGameView(game, viewerId, { logsFrom = 0 } = {}) {
    return {
        viewerId,
        phase: game.phase,
        currentPlayerId: game.getCurrentPlayer().id,
        // 手番のプレイヤーを操作するプレイヤー（支配のターン中は支配したプレイヤー）
        controllerId: game.getController(game.getCurrentPlayer()).id,
        isExtraTurn: game.isExtraTurn,
        supply: { ...game.supply },
        // 今のコスト（橋・街道などで変わる）
        costs: Object.fromEntries(Object.keys(game.supply).map(cardId => [cardId, game.getCost(cardId)])),
        potionCosts: Object.fromEntries(Object.keys(game.supply).map(cardId => [cardId, game.getPotionCost(cardId)])),
        // 中身の混ざった山（騎士・廃墟）の一番上のカード（空なら null）
        pileTops: Object.fromEntries(Object.keys(game.pileCards).map(pileId => [pileId, game.getPileTop(pileId)])),
        // イベントなど（カードではない横長の札）と、そのコスト
        landscapes: game.landscapes.map(id => ({ id, cost: game.getLandscapeCost(id), vp: game.landscapeVp[id] ?? null })),
        // 帝国：コストの負債、山に置いた勝利点トークンと負債、オベリスクの山
        debtCosts: Object.fromEntries(Object.keys(game.supply).map(cardId => [cardId, game.getDebtCost(cardId)])),
        pileVp: { ...game.pileVp },
        pileDebt: { ...game.pileDebt },
        // 同盟：山に置いた恩恵トークン（発明家の一族）
        inventorTokens: { ...game.inventorTokens },
        obelisk: game.landscapeState.obelisk ?? null,
        // 夜想曲：ドルイドの祝福、森で迷うを持つプレイヤー、祝福・呪詛の山の残り
        druidBoons: [...(game.druidBoons ?? [])],
        lostInTheWoods: game.lostInTheWoods?.id ?? null,
        boonCount: game.boonDeck?.length ?? 0,
        // ルネサンス：アーティファクトの持ち主（誰も持っていなければ null）
        artifacts: Object.fromEntries(Object.entries(game.artifacts).map(([id, owner]) => [id, owner?.id ?? null])),
        hexCount: game.hexDeck?.length ?? 0,
        missionTurn: game.missionTurn,
        bane: game.bane,
        ferrymanPile: game.ferrymanPile,
        nonSupply: { ...game.nonSupply },
        trashCount: game.trash.length,
        players: game.players.map(player => {
            // 支配のターン中は、支配したプレイヤーにも手番のプレイヤーの手札が見える
            const isViewer = player.id === viewerId || game.getController(player).id === viewerId;
            const topDiscard = player.discard[player.discard.length - 1];
            return {
                id: player.id,
                name: player.name,
                isCPU: player.isCPU,
                victoryPoints: game.calculateScore(player),
                debt: player.debt,
                actions: player.actions,
                buys: player.buys,
                coins: player.coins,
                potions: player.potions,
                coffers: player.coffers,
                vpTokens: player.vpTokens,
                favors: player.favors,
                handCount: player.hand.length,
                deckCount: player.deck.length,
                discardCount: player.discard.length,
                discardTop: topDiscard ? topDiscard.id : null,
                playArea: cardIds(player.playArea),
                islandMat: cardIds(player.mats.island), // 島マットは表向きなので誰でも見られる
                tavern: cardIds(player.mats.tavern),    // 酒場マットも表向き
                exile: cardIds(player.mats.exile),      // 追放マットも表向き（移動動物園）
                // トークン（冒険）
                pileTokens: { ...player.pileTokens },
                minusCardToken: player.minusCardToken,
                minusCoinToken: player.minusCoinToken,
                journeyFaceUp: player.journeyFaceUp,
                inheritance: player.inheritance,
                states: { ...player.states },
                // ルネサンス：村人、キューブを置いたプロジェクト、陰謀の企てのトークン
                villagers: player.villagers,
                projects: [...player.projects],
                sinisterPlotTokens: player.sinisterPlotTokens,
                nativeVillageCount: player.mats.nativeVillage.length,
                setAsideCount: player.setAside.length,
                // 手札と原住民の村マットの中身は本人だけ
                hand: isViewer ? cardIds(player.hand) : null,
                nativeVillage: isViewer ? cardIds(player.mats.nativeVillage) : null
            };
        }),
        prompt: createPromptView(game, game.pendingPrompt, viewerId),
        logsFrom,
        logs: game.logs.slice(logsFrom).map(entry => entry.message),
        result: game.result ?? null
    };
}

// ブラウザで描画しやすいよう、ビューのカードIDを Card に戻す
export function hydrateGameView(view) {
    const toCard = (id) => (id ? new Card(ALL_CARDS[id.toUpperCase()]) : null);
    const toCards = (ids) => (ids ? ids.map(toCard) : null);
    
    const players = view.players.map(player => ({
        ...player,
        discardTop: toCard(player.discardTop),
        playArea: toCards(player.playArea),
        islandMat: toCards(player.islandMat),
        tavern: toCards(player.tavern ?? []),
        exile: toCards(player.exile ?? []),
        hand: toCards(player.hand),
        nativeVillage: toCards(player.nativeVillage)
    }));
    const prompt = view.prompt && !view.prompt.waiting
        ? { ...view.prompt, cards: toCards(view.prompt.cards), card: toCard(view.prompt.card) }
        : view.prompt;
    
    const current = players.find(player => player.id === view.currentPlayerId);
    // 支配のターン中に支配しているなら、手番のプレイヤーを自分として表示する（手札を見てプレイできるように）
    const controlsCurrent = view.controllerId === view.viewerId;
    const me = controlsCurrent ? current : (players.find(player => player.id === view.viewerId) ?? null);
    return {
        ...view,
        players,
        prompt,
        me,
        current,
        // 自分が操作する手番で、まだゲームが続いているか
        isMyTurn: Boolean(me) && controlsCurrent && view.phase !== 'end'
    };
}
