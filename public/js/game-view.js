/**
 * プレイヤーごとに見える状態（ビュー）
 * サーバーとブラウザのどちらでも使う。ビューはJSONにできる値だけで作り、カードはIDで表す
 * 他のプレイヤーの手札や山札の中身など、見えてはいけない情報は入れない
 */

import Card from './card.js';
import { ALL_CARDS } from './card-data.js';

const cardIds = (cards) => cards.map(card => card.id);

// 選択待ちのビュー。答えるプレイヤーにだけ中身を見せ、他のプレイヤーには誰が選択中かだけを伝える
function createPromptView(prompt, viewerId) {
    if (!prompt) return null;
    
    const base = { id: prompt.id, playerId: prompt.player.id, playerName: prompt.player.name };
    if (prompt.player.id !== viewerId) {
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
        isExtraTurn: game.isExtraTurn,
        supply: { ...game.supply },
        // 今のコスト（橋・街道などで変わる）
        costs: Object.fromEntries(Object.keys(game.supply).map(cardId => [cardId, game.getCost(cardId)])),
        bane: game.bane,
        ferrymanPile: game.ferrymanPile,
        nonSupply: { ...game.nonSupply },
        trashCount: game.trash.length,
        players: game.players.map(player => {
            const isViewer = player.id === viewerId;
            const topDiscard = player.discard[player.discard.length - 1];
            return {
                id: player.id,
                name: player.name,
                isCPU: player.isCPU,
                victoryPoints: player.calculateVictoryPoints(),
                actions: player.actions,
                buys: player.buys,
                coins: player.coins,
                coffers: player.coffers,
                vpTokens: player.vpTokens,
                handCount: player.hand.length,
                deckCount: player.deck.length,
                discardCount: player.discard.length,
                discardTop: topDiscard ? topDiscard.id : null,
                playArea: cardIds(player.playArea),
                islandMat: cardIds(player.mats.island), // 島マットは表向きなので誰でも見られる
                nativeVillageCount: player.mats.nativeVillage.length,
                setAsideCount: player.setAside.length,
                // 手札と原住民の村マットの中身は本人だけ
                hand: isViewer ? cardIds(player.hand) : null,
                nativeVillage: isViewer ? cardIds(player.mats.nativeVillage) : null
            };
        }),
        prompt: createPromptView(game.pendingPrompt, viewerId),
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
        hand: toCards(player.hand),
        nativeVillage: toCards(player.nativeVillage)
    }));
    const prompt = view.prompt && !view.prompt.waiting
        ? { ...view.prompt, cards: toCards(view.prompt.cards), card: toCard(view.prompt.card) }
        : view.prompt;
    
    const me = players.find(player => player.id === view.viewerId) ?? null;
    const current = players.find(player => player.id === view.currentPlayerId);
    return {
        ...view,
        players,
        prompt,
        me,
        current,
        // 自分の手番で、まだゲームが続いているか
        isMyTurn: Boolean(me) && me === current && view.phase !== 'end'
    };
}
