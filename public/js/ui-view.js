/**
 * ドミニオンのUI表示管理
 * ゲームの状態を画面に表示する機能を提供
 */

import { CARD_TYPES, ALL_CARDS, LANDSCAPES, BOONS } from './card-data.js';
import { LANDSCAPE_KIND_LABELS } from './card-types.js';
import { ARTIFACT_NAMES } from './game.js';
import { onPress } from './press-handler.js';
import { getCardArt, CARD_BACK } from './card-art.js';
import cardAnimator, { STAGGER_MS } from './card-animations.js';

// サプライの基本カードの並び順（左から勝利点の列、財宝の列、その右にアクション）
const VICTORY_SUPPLY_ORDER = ['estate', 'duchy', 'province', 'colony', 'curse'];
const TREASURE_SUPPLY_ORDER = ['copper', 'silver', 'gold', 'platinum', 'potion'];
const BASIC_SUPPLY_ORDER = [...VICTORY_SUPPLY_ORDER, ...TREASURE_SUPPLY_ORDER];

// 手札に夜のカードがあるか（夜フェイズに移るボタンを出すか）
export const hasNightCard = (player) => (player?.hand ?? []).some(card => card.isType(CARD_TYPES.NIGHT));

// 手札の表示順（種類）。同じ種類の中ではコストの高い順に並べる
const HAND_TYPE_ORDER = [CARD_TYPES.ACTION, CARD_TYPES.TREASURE, CARD_TYPES.VICTORY, CARD_TYPES.CURSE];

class UIView {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
        
        // プレイヤーごとの前回描画した手札（カードIDごとの枚数）。増えたカード（＝引いたカード）を見つけるのに使う
        this.lastHands = new Map();
    }
    
    // 新しいゲームを始めるときに、前のゲームの描画の記録を消す
    reset() {
        this.lastHands.clear();
    }

    // ゲーム画面を更新（view は hydrateGameView したプレイヤーから見た状態）
    updateGameView(view) {
        if (!view) return;

        this.updateGameStatus(view);
        this.updateSupplyPiles(view);
        this.updatePlayersInfo(view);
        this.updateDock(view);
        this.updatePlayArea(view);
        this.updateGameControls(view);
    }

    // ゲームステータスと、現在のプレイヤーの残りリソースを更新
    updateGameStatus(view) {
        const currentPlayer = view.current;

        if (view.phase === 'end') {
            this.elements.gameStatus.textContent = 'ゲーム終了';
            this.elements.turnStats.innerHTML = '';
            return;
        }

        const cpuLabel = currentPlayer.isCPU ? '（CPU）' : '';
        // 支配のターン中は、誰が操作しているかを出す
        const controller = view.controllerId !== undefined && view.controllerId !== view.currentPlayerId
            ? view.players.find(player => player.id === view.controllerId) : null;
        this.elements.gameStatus.innerHTML = `
            <span class="status-player">${currentPlayer.name}${cpuLabel}</span>
            ${controller ? `<span class="status-waiting">${controller.name}が支配中</span>` : ''}
            ${view.missionTurn ? '<span class="status-waiting">伝道のターン（カードは購入できない）</span>' : ''}
            <span class="status-phase phase-${view.phase}">${this.getPhaseText(view.phase)}</span>
            ${view.prompt?.waiting ? `<span class="status-waiting">${view.prompt.playerName}が選択中</span>` : ''}
        `;

        const stat = (label, value, dim) => `
            <div class="stat ${dim ? 'dim' : ''}">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${value}</span>
            </div>
        `;

        this.elements.turnStats.innerHTML =
            stat('アクション', currentPlayer.actions, view.phase !== 'action') +
            stat('購入', currentPlayer.buys, false) +
            stat('コイン', currentPlayer.coins, false) +
            (currentPlayer.potions > 0 ? stat('ポーション', currentPlayer.potions, false) : '') +
            (currentPlayer.debt > 0 ? stat('負債', currentPlayer.debt, false) : '') +
            (currentPlayer.coffers > 0 ? stat('財源', currentPlayer.coffers, view.phase !== 'buy') : '') +
            (currentPlayer.villagers > 0 ? stat('村人', currentPlayer.villagers, view.phase !== 'action') : '') +
            (currentPlayer.favors > 0 ? stat('恩恵', currentPlayer.favors, false) : '');
    }

    // フェーズの日本語テキストを取得
    getPhaseText(phase) {
        switch (phase) {
            case 'action': return 'アクション';
            case 'buy': return '購入';
            case 'night': return '夜';
            case 'cleanup': return 'クリーンアップ';
            default: return phase;
        }
    }

    // サプライパイルを更新
    updateSupplyPiles(view) {
        const supply = view.supply;
        const currentPlayer = view.current;

        // 自分の購入フェーズでは、コインが足りず買えないカードをグレーアウトする
        // （アクションフェーズや他のプレイヤーの手番では、すべて通常の表示にする）
        // コストは橋・街道などで下がることがあるので、ビューの今のコストを表示する
        const isBuying = view.isMyTurn && view.phase === 'buy' && currentPlayer.buys > 0;
        const costOf = (cardId) => view.costs?.[cardId] ?? ALL_CARDS[cardId.toUpperCase()].cost;
        const potionCostOf = (cardId) => view.potionCosts?.[cardId] ?? ALL_CARDS[cardId.toUpperCase()].potionCost ?? 0;

        const tilesHtml = (cardIds) => cardIds
            .filter(cardId => supply[cardId] !== undefined)
            .map(cardId => {
                // 中身の混ざった山は一番上のカードを見せる（空なら山の名前の札）
                const card = ALL_CARDS[(view.pileTops?.[cardId] ?? cardId).toUpperCase()];
                const cost = costOf(cardId);
                // 負債は購入の前に財宝で返すので、残りのコインかポーションが足りなければ買えない
                const unaffordable = currentPlayer.coins - (currentPlayer.debt ?? 0) < cost ||
                    (currentPlayer.potions ?? 0) < potionCostOf(cardId);
                return this.createSupplyCardHtml(card, supply[cardId], isBuying && unaffordable, {
                    pileId: cardId,
                    cost,
                    debtCost: view.debtCosts?.[cardId] ?? 0,
                    vp: view.pileVp?.[cardId] ?? 0,
                    pileDebt: view.pileDebt?.[cardId] ?? 0,
                    favorTokens: view.inventorTokens?.[cardId] ?? 0,
                    isObelisk: cardId === view.obelisk,
                    isBane: cardId === view.bane,
                    // 略奪：この山に置かれた特性の名前
                    traitNames: Object.entries(view.traits ?? {}).filter(([, pileId]) => pileId === cardId)
                        .map(([traitId]) => LANDSCAPES[traitId.toUpperCase()]?.name ?? traitId)
                });
            })
            .join('');
        
        // サプライ外の山（褒賞・渡し守の山）は買えないので、説明を見るためだけに並べる
        const nonSupplyIds = Object.keys(view.nonSupply ?? {});
        const nonSupplyHtml = nonSupplyIds.map(cardId =>
            this.createSupplyCardHtml(ALL_CARDS[cardId.toUpperCase()], view.nonSupply[cardId], false, { nonSupply: true })
        ).join('');

        // 王国カードはサプライのキーから基本カード以外を取り出し、コスト順に並べる
        const kingdomCardIds = Object.keys(supply)
            .filter(cardId => !BASIC_SUPPLY_ORDER.includes(cardId) && ALL_CARDS[cardId.toUpperCase()])
            .sort((a, b) => ALL_CARDS[a.toUpperCase()].cost - ALL_CARDS[b.toUpperCase()].cost ||
                ALL_CARDS[a.toUpperCase()].name.localeCompare(ALL_CARDS[b.toUpperCase()].name, 'ja'));

        this.elements.supplyPiles.innerHTML = `
            <div class="supply-group supply-victory">
                <h3>勝利点</h3>
                <div class="supply-grid">${tilesHtml(VICTORY_SUPPLY_ORDER)}</div>
            </div>
            <div class="supply-group supply-treasure">
                <h3>財宝</h3>
                <div class="supply-grid">${tilesHtml(TREASURE_SUPPLY_ORDER)}</div>
            </div>
            <div class="supply-group supply-kingdom">
                <h3>アクション</h3>
                <div class="supply-grid">${tilesHtml(kingdomCardIds)}</div>
            </div>
            ${(view.landscapes ?? []).length > 0 ? `
                <div class="supply-group supply-landscapes">
                    <h3>イベントなど</h3>
                    <div class="landscape-grid">${view.landscapes.map(({ id, cost, vp }) => {
                        const data = LANDSCAPES[id.toUpperCase()];
                        // ランドマークは購入しないので、コストの代わりに置かれた勝利点トークンを出す
                        const buyable = Boolean(data.onBuy);
                        // プロジェクトは、キューブを置いたプレイヤーの名前を出す（自分が置き済みなら買えない）
                        const cubes = view.players.filter(p => p.projects?.includes(id)).map(p => p.name);
                        const unaffordable = buyable && isBuying && (currentPlayer.coins - (currentPlayer.debt ?? 0) < cost ||
                            currentPlayer.projects?.includes(id));
                        return `
                            <div class="landscape-tile landscape-${data.kind} ${unaffordable ? 'unaffordable' : ''}" data-landscape-id="${id}">
                                ${buyable ? `<span class="card-cost">${cost}</span>` : ''}
                                ${data.debtCost ? `<span class="card-debt">${data.debtCost}</span>` : ''}
                                <span class="landscape-name">${data.name}</span>
                                ${view.traits?.[id] ? `<span class="landscape-cubes">→ ${ALL_CARDS[(view.pileTops?.[view.traits[id]] ?? view.traits[id]).toUpperCase()]?.name ?? view.traits[id]}</span>` : ''}
                                ${vp !== null ? `<span class="vp-badge">${vp}</span>` : ''}
                                ${cubes.length > 0 ? `<span class="landscape-cubes">${cubes.join('・')}</span>` : ''}
                                <span class="landscape-kind">${LANDSCAPE_KIND_LABELS[data.kind] ?? ''}</span>
                            </div>
                        `;
                    }).join('')}</div>
                </div>
            ` : ''}
            ${(view.druidBoons ?? []).length > 0 ? `
                <div class="supply-group supply-landscapes">
                    <h3>ドルイドの祝福</h3>
                    <div class="landscape-grid">${view.druidBoons.map(id => `
                        <div class="landscape-tile landscape-boon" data-boon-id="${id}">
                            <span class="landscape-name">${BOONS[id.toUpperCase()].name}</span>
                            <span class="landscape-kind">祝福</span>
                        </div>
                    `).join('')}</div>
                </div>
            ` : ''}
            ${nonSupplyIds.length > 0 ? `
                <div class="supply-group supply-extra">
                    <h3>サプライ外（購入できない）</h3>
                    <div class="supply-grid">${nonSupplyHtml}</div>
                </div>
            ` : ''}
        `;

        this.fitSupplyTitles();

        // イベントなどもタップで購入、長押しで説明を表示する（祝福は説明だけ）
        this.elements.supplyPiles.querySelectorAll('.landscape-tile').forEach(tile => {
            const id = tile.getAttribute('data-landscape-id');
            const boonId = tile.getAttribute('data-boon-id');
            const showDetail = () => (boonId ? this.uiController.showBoonDetail(boonId) : this.uiController.showLandscapeDetail(id));
            onPress(tile, {
                onTap: boonId ? showDetail : () => this.uiController.handleLandscapePurchase(id),
                onLongPress: showDetail
            });
        });

        // タップで購入、長押しで説明を表示する（サプライ外の山はタップでも説明を表示する）
        const supplyCards = this.elements.supplyPiles.querySelectorAll('.card');
        supplyCards.forEach(card => {
            const cardId = card.getAttribute('data-card-id');
            const showDetail = () => this.uiController.showSupplyCardDetail(cardId);
            onPress(card, {
                onTap: card.classList.contains('non-supply') ? showDetail : () => this.uiController.handleCardPurchase(cardId),
                onLongPress: showDetail
            });
        });
    }

    // サプライカードのHTML生成
    // タイルに収まらないカード名は、収まる大きさまで文字を小さくする
    // それでも読めないほど小さくなるなら、タイルの小さな絵を消して名前の幅を空ける
    fitSupplyTitles() {
        const fit = (title, minFontSize) => {
            title.style.fontSize = '';
            if (title.scrollWidth <= title.clientWidth) return true;
            const fontSize = parseFloat(getComputedStyle(title).fontSize);
            const fitted = Math.floor(fontSize * title.clientWidth / title.scrollWidth * 10) / 10;
            title.style.fontSize = `${Math.max(minFontSize, fitted)}px`;
            return fitted >= minFontSize;
        };
        this.elements.supplyPiles.querySelectorAll('.card-title').forEach(title => {
            if (fit(title, 8)) return;
            title.closest('.supply-tile').classList.add('no-art');
            fit(title, 7);
        });
    }

    createSupplyCardHtml(card, count, unaffordable, { pileId = card.id, cost = card.cost, debtCost = card.debtCost ?? 0, vp = 0, pileDebt = 0, favorTokens = 0, isObelisk = false, isBane = false, nonSupply = false, traitNames = [] } = {}) {
        const stateClass = count <= 0 ? 'empty' : (unaffordable ? 'unaffordable' : '');

        // 購入や説明には山のIDを使う（中身の混ざった山では、見せているカードと山のIDが違う）
        const cardId = pileId.toLowerCase();

        return `
            <div class="card supply-tile ${this.getCardTypeClass(card)} ${stateClass} ${nonSupply ? 'non-supply' : ''}" data-card-id="${cardId}">
                ${cost > 0 || !debtCost ? `<span class="card-cost ${cost < card.cost ? 'reduced' : ''} ${card.potionCost ? 'has-potion' : ''}">${cost}</span>` : ''}
                ${debtCost ? `<span class="card-debt ${cost > 0 ? 'with-coin' : ''}">${debtCost}</span>` : ''}
                ${isBane ? '<span class="bane-badge">災い</span>' : ''}
                ${isObelisk ? '<span class="bane-badge">オベリスク</span>' : ''}
                ${traitNames.length > 0 ? `<span class="bane-badge trait-badge">${traitNames.join('・')}</span>` : ''}
                ${vp > 0 || pileDebt > 0 || favorTokens > 0 ? `<span class="pile-tokens">${vp > 0 ? `<span class="vp-badge">${vp}</span>` : ''}${pileDebt > 0 ? `<span class="card-debt">${pileDebt}</span>` : ''}${favorTokens > 0 ? `<span class="favor-badge" title="恩恵トークン（コスト-${favorTokens}）">${favorTokens}</span>` : ''}</span>` : ''}
                <span class="tile-art">${getCardArt(card.id)}</span>
                <span class="card-title">${card.name}</span>
                <span class="card-count">${count}</span>
            </div>
        `;
    }

    // 手札・場札などに使う通常サイズのカードのHTML生成（stackCount が2以上なら重ねて枚数を表示する）
    createCardHtml(card, attributes = '', extraClass = '', stackCount = 1) {
        const stacked = stackCount > 1;
        return `
            <div class="card ${this.getCardTypeClass(card)} ${extraClass} ${stacked ? 'stacked' : ''}" ${attributes}>
                ${stacked ? `<span class="stack-count">×${stackCount}</span>` : ''}
                <div class="card-head">
                    ${card.cost > 0 || !card.debtCost ? `<span class="card-cost ${card.potionCost ? 'has-potion' : ''}">${card.cost}</span>` : ''}
                    ${card.debtCost ? `<span class="card-debt">${card.debtCost}</span>` : ''}
                    <span class="card-title">${card.name}</span>
                </div>
                <div class="card-art">${getCardArt(card.id)}</div>
                <div class="card-type">${this.getCardTypeText(card.types)}</div>
                <div class="card-description">${card.description}</div>
            </div>
        `;
    }

    // カードタイプに応じたクラス名
    getCardTypeClass(card) {
        return card.types.map(type => `${type}-card`).join(' ');
    }

    // カードタイプの日本語テキスト取得
    getCardTypeText(types) {
        const typeMap = {
            [CARD_TYPES.TREASURE]: '財宝',
            [CARD_TYPES.VICTORY]: '勝利点',
            [CARD_TYPES.ACTION]: 'アクション',
            [CARD_TYPES.CURSE]: '呪い',
            [CARD_TYPES.DURATION]: '持続',
            [CARD_TYPES.REACTION]: 'リアクション',
            [CARD_TYPES.ATTACK]: 'アタック',
            [CARD_TYPES.REWARD]: '褒賞',
            [CARD_TYPES.KNIGHT]: '騎士',
            [CARD_TYPES.RUINS]: '廃墟',
            [CARD_TYPES.SHELTER]: '避難所',
            [CARD_TYPES.LOOTER]: '略奪者',
            [CARD_TYPES.COMMAND]: '命令',
            [CARD_TYPES.RESERVE]: 'リザーブ',
            [CARD_TYPES.TRAVELLER]: 'トラベラー',
            [CARD_TYPES.CASTLE]: '城',
            [CARD_TYPES.GATHERING]: '集合',
            [CARD_TYPES.NIGHT]: '夜',
            [CARD_TYPES.HEIRLOOM]: '家宝',
            [CARD_TYPES.FATE]: '運命',
            [CARD_TYPES.DOOM]: '呪い',
            [CARD_TYPES.SPIRIT]: '精霊',
            [CARD_TYPES.ZOMBIE]: 'ゾンビ',
            [CARD_TYPES.LIAISON]: '連絡役',
            [CARD_TYPES.TOWNSFOLK]: '町民',
            [CARD_TYPES.AUGUR]: '鳥占い師',
            [CARD_TYPES.CLASH]: '衝突',
            [CARD_TYPES.FORT]: '砦',
            [CARD_TYPES.ODYSSEY]: '冒険旅行',
            [CARD_TYPES.WIZARD]: '魔法使い'
        };

        return types.map(type => typeMap[type] || type).join(' - ');
    }

    // プレイヤー情報を更新
    updatePlayersInfo(view) {
        const html = view.players.map(player => {
            const isCurrentPlayer = player === view.current;

            return `
                <div class="player-stats ${isCurrentPlayer ? 'active-player' : ''}">
                    <div class="player-name">
                        ${player.name}${player.isCPU ? '<span class="cpu-badge">CPU</span>' : ''}
                    </div>
                    <div class="player-meta">
                        <span>勝利点 <b>${player.victoryPoints}</b>${player.vpTokens > 0 ? `（トークン${player.vpTokens}）` : ''}</span>
                        ${player.coffers > 0 ? `<span>財源 ${player.coffers}</span>` : ''}
                        ${player.debt > 0 ? `<span>負債 ${player.debt}</span>` : ''}
                        ${player.favors > 0 ? `<span>恩恵 ${player.favors}</span>` : ''}
                        <span>山札 ${player.deckCount}</span>
                        <span>手札 ${player.handCount}</span>
                        <span>捨て札 ${player.discardCount}</span>
                        ${this.createMatsHtml(player, view)}
                    </div>
                </div>
            `;
        }).join('');

        this.elements.playersInfo.innerHTML = html;
    }

    // 島マット・原住民の村マット・脇に置いたカードの枚数、酒場マットのカードとトークン（あるときだけ表示する）
    createMatsHtml(player, view) {
        const counts = [
            ['島', player.islandMat.length],
            ['村マット', player.nativeVillageCount],
            ['脇', player.setAsideCount]
        ]
            .filter(([, count]) => count > 0)
            .map(([label, count]) => `<span>${label} ${count}</span>`);
        const pileName = (pileId) => ALL_CARDS[(view.pileTops?.[pileId] ?? pileId).toUpperCase()]?.name ?? pileId;
        const tokenLabels = { plusCard: '+1カード', plusAction: '+1アクション', plusBuy: '+1購入', plusCoin: '+1財宝', minusCost: '-2コスト', trashing: '廃棄' };
        const tokens = [
            ...Object.entries(player.pileTokens ?? {}).map(([kind, pileId]) => `${tokenLabels[kind]}→${pileName(pileId)}`),
            ...(player.minusCardToken ? ['-1カード'] : []),
            ...(player.minusCoinToken ? ['-1財宝'] : []),
            ...(player.inheritance ? [`屋敷→${ALL_CARDS[player.inheritance.toUpperCase()]?.name}`] : []),
            ...(player.journeyFaceUp === false ? ['旅：裏'] : [])
        ];
        const tavern = (player.tavern ?? []).map(card => card.name);
        // 夜想曲の状態
        const states = [
            ...(view.lostInTheWoods === player.id ? ['森で迷う'] : []),
            ...(player.states?.deluded ? ['妄想'] : []),
            ...(player.states?.envious ? ['羨望'] : []),
            ...(player.states?.miserable === 1 ? ['不幸'] : []),
            ...(player.states?.miserable === 2 ? ['二重の不幸'] : [])
        ];
        // ルネサンス：村人・アーティファクト・陰謀の企てのトークン
        const artifacts = Object.entries(view.artifacts ?? {}).filter(([, owner]) => owner === player.id).map(([id]) => ARTIFACT_NAMES[id]);
        return [
            ...counts,
            ...(player.villagers > 0 ? [`<span>村人 ${player.villagers}</span>`] : []),
            ...(artifacts.length > 0 ? [`<span>${artifacts.join('・')}</span>`] : []),
            ...(player.sinisterPlotTokens > 0 ? [`<span>陰謀の企て ${player.sinisterPlotTokens}</span>`] : []),
            ...(tavern.length > 0 ? [`<span>酒場 ${tavern.join('・')}</span>`] : []),
            ...((player.exile ?? []).length > 0 ? [`<span>追放 ${player.exile.map(card => card.name).join('・')}</span>`] : []),
            ...(tokens.length > 0 ? [`<span>トークン ${tokens.join('、')}</span>`] : []),
            ...(states.length > 0 ? [`<span>状態 ${states.join('・')}</span>`] : [])
        ].join('');
    }

    // 手札を表示する順に並べた、手札のインデックスの配列（手札そのものは並び替えない）
    getSortedHandIndices(hand) {
        const typeRank = (card) => {
            const rank = HAND_TYPE_ORDER.findIndex(type => card.isType(type));
            return rank < 0 ? HAND_TYPE_ORDER.length : rank;
        };
        
        return hand
            .map((card, index) => index)
            .sort((a, b) =>
                typeRank(hand[a]) - typeRank(hand[b]) ||
                hand[b].cost - hand[a].cost ||
                hand[a].name.localeCompare(hand[b].name, 'ja') ||
                a - b
            );
    }
    
    // 手札を表示単位にまとめる。重ねる設定なら同じカードを1つにまとめる
    getHandGroups(hand, stack) {
        const groups = [];
        
        this.getSortedHandIndices(hand).forEach(index => {
            const last = groups[groups.length - 1];
            if (stack && last && last.card.id === hand[index].id) {
                last.indices.push(index);
            } else {
                groups.push({ card: hand[index], indices: [index] });
            }
        });
        
        return groups;
    }
    
    // 下段（自分の手札・山札・捨て札）を更新
    updateDock(view) {
        const me = view.me;
        const hand = me?.hand ?? [];

        // 今プレイできるアクションカードを強調する
        const canPlayActions = view.isMyTurn && view.phase === 'action' && me.actions > 0;
        const canPlayNight = view.isMyTurn && view.phase === 'night';

        // 手札を種類・コスト順に並べて表示する。重ねたカードは先頭の1枚の番号を持たせ、タップでその1枚をプレイする
        const groups = this.getHandGroups(hand, this.uiController.settings.stackHand);
        
        this.elements.handCards.innerHTML = groups.map(({ card, indices }) => {
            // 相続した屋敷も、そのカードとしてプレイできる
            const playable = (canPlayActions && (card.isType(CARD_TYPES.ACTION) || (card.id === 'estate' && me.inheritance))) ||
                (canPlayNight && card.isType(CARD_TYPES.NIGHT));
            return this.createCardHtml(card, `data-card-index="${indices[0]}"`, playable ? 'playable' : '', indices.length);
        }).join('');

        // 手札はタップでプレイ、長押しで説明を表示する
        this.elements.handCards.querySelectorAll('.card').forEach(element => {
            const index = parseInt(element.getAttribute('data-card-index'));
            onPress(element, {
                onTap: () => this.uiController.handleCardPlay(index),
                onLongPress: () => this.uiController.showCardDetail(hand[index])
            });
        });
        
        if (me) {
            this.animateDrawnCards(me, groups);
        }

        // 山札は裏向き、捨て札は一番上のカードを表向きにして、枚数を ×N で表示する
        const topDiscard = me?.discardTop ?? null;
        this.elements.deckPile.innerHTML = this.createPileHtml(me?.deckCount ?? 0);
        this.elements.discardCards.innerHTML = this.createPileHtml(me?.discardCount ?? 0, topDiscard);
        
        // 捨て札は長押しで一番上のカードの説明を表示する（要素は描画のたびに作り直すので、リスナーは重ならない）
        const discardCard = this.elements.discardCards.querySelector('.pile-card:not(.empty)');
        if (discardCard) {
            onPress(discardCard, {
                onLongPress: () => this.uiController.showCardDetail(topDiscard)
            });
        }
    }
    
    // 場札（手番のプレイヤーがプレイしたカード）を更新
    // 同じカードは常にまとめ、最初にプレイした位置に ×枚数 で表示する
    updatePlayArea(view) {
        const playGroups = [];
        view.current.playArea.forEach(card => {
            const group = playGroups.find(g => g.card.id === card.id);
            if (group) {
                group.count++;
            } else {
                playGroups.push({ card, count: 1 });
            }
        });
        
        this.elements.playedCards.innerHTML = playGroups.length > 0
            ? playGroups.map(({ card, count }) => this.createCardHtml(card, `data-card-id="${card.id}"`, 'mini', count)).join('')
            : '<p class="empty-note">まだカードをプレイしていません</p>';
        
        // 場札は長押しで説明を表示する
        this.elements.playedCards.querySelectorAll('.card').forEach((card, index) => {
            onPress(card, {
                onLongPress: () => this.uiController.showCardDetail(playGroups[index].card)
            });
        });
    }
    
    // 前回の描画から手札に増えたカードを、山札から飛んでくるように見せる
    // ビューのカードは毎回作り直されるので、カードIDごとの枚数が増えた分を引いたカードとみなす
    // 初めて描画するプレイヤーは手札すべてが対象（ゲーム開始時の5枚）
    animateDrawnCards(player, groups) {
        const countById = (cards) => cards.reduce((counts, card) => counts.set(card.id, (counts.get(card.id) ?? 0) + 1), new Map());
        const previous = this.lastHands.get(player.id) ?? new Map();
        const current = countById(player.hand);
        this.lastHands.set(player.id, current);
        
        const increased = new Map([...current].map(([id, count]) => [id, count - (previous.get(id) ?? 0)]));
        const elements = this.elements.handCards.querySelectorAll('.card');
        let order = 0;
        
        groups.forEach((group, i) => {
            const id = group.card.id;
            if ((increased.get(id) ?? 0) <= 0) return;
            increased.set(id, increased.get(id) - group.indices.length);
            cardAnimator.drawCard(elements[i], this.elements.deckPile, order * STAGGER_MS);
            order++;
        });
    }
    
    // 山札・捨て札の表示。faceCard を渡すと表向き、渡さなければ裏向きにする
    createPileHtml(count, faceCard = null) {
        if (count === 0) {
            return '<div class="pile-card empty"></div>';
        }
        
        const countHtml = `<span class="stack-count">×${count}</span>`;
        const stackedClass = count > 1 ? 'piled' : '';
        
        if (!faceCard) {
            return `<div class="pile-card card-back ${stackedClass}">${CARD_BACK}${countHtml}</div>`;
        }
        
        return `
            <div class="pile-card ${this.getCardTypeClass(faceCard)} ${stackedClass}">
                <span class="pile-card-name">${faceCard.name}</span>
                <div class="card-art">${getCardArt(faceCard.id)}</div>
                ${countHtml}
            </div>
        `;
    }

    // ゲームコントロールを更新
    updateGameControls(view) {
        // 自分の手番でなければ操作ボタンを無効にする
        this.elements.endTurnBtn.disabled = !view.isMyTurn;

        // アクションボタン
        let actionButtonsHtml = '';

        if (view.phase === 'action' && view.isMyTurn) {
            actionButtonsHtml += `
                <button id="buy-phase-btn" ${view.me.actions <= 0 ? 'class="highlight"' : ''}>購入へ</button>
            `;
        }
        
        // 財源は購入フェーズに1つずつ使える
        if (view.phase === 'buy' && view.isMyTurn && view.me.coffers > 0) {
            actionButtonsHtml += `<button id="coffers-btn">財源を使う（残り${view.me.coffers}）</button>`;
        }

        // 村人はアクションフェーズに1人ずつ使える
        if (view.phase === 'action' && view.isMyTurn && view.me.villagers > 0) {
            actionButtonsHtml += `<button id="villager-btn">村人を使う（残り${view.me.villagers}）</button>`;
        }

        // 夜のカードが手札にあれば、購入フェーズから夜フェイズに移れる
        if (['action', 'buy'].includes(view.phase) && view.isMyTurn && hasNightCard(view.me)) {
            actionButtonsHtml += '<button id="night-btn">夜へ</button>';
        }

        this.elements.actionButtons.innerHTML = actionButtonsHtml;

        document.getElementById('coffers-btn')?.addEventListener('click', () => {
            this.uiController.handleUseCoffers();
        });
        document.getElementById('night-btn')?.addEventListener('click', () => {
            this.uiController.handleEnterNightPhase();
        });
        document.getElementById('villager-btn')?.addEventListener('click', () => {
            this.uiController.handleUseVillager();
        });

        // 購入フェーズボタンのイベント
        const buyPhaseBtn = document.getElementById('buy-phase-btn');
        if (buyPhaseBtn) {
            buyPhaseBtn.addEventListener('click', () => {
                this.uiController.handleEnterBuyPhase();
            });
        }
    }

    // ログを消す（新しいゲームを始めるとき）
    clearLog() {
        this.elements.logEntries.innerHTML = '';
        this.elements.latestLog.textContent = '';
    }

    // ログエントリ追加
    addLogEntry(message) {
        const logElement = document.createElement('div');
        logElement.className = 'log-entry';
        logElement.textContent = message;

        // 最新のログを強調表示するクラスを追加
        logElement.classList.add('new-log');

        // 既存のログから 'new-log' クラスを削除
        const existingLogs = this.elements.logEntries.querySelectorAll('.new-log');
        existingLogs.forEach(log => log.classList.remove('new-log'));

        this.elements.logEntries.appendChild(logElement);

        // ヘッダーにも最新のログを1行表示する
        this.elements.latestLog.textContent = message;

        // アニメーション効果のためのクラスを追加して少し遅れて削除
        logElement.classList.add('log-entry-animation');
        setTimeout(() => {
            logElement.classList.remove('log-entry-animation');
        }, 1000);

        // 自動スクロール
        this.elements.logEntries.scrollTop = this.elements.logEntries.scrollHeight;

        // スクロールボタンの表示状態を更新
        this.updateScrollToBottomButton();
    }

    // スクロールボタンの表示状態を更新
    updateScrollToBottomButton() {
        if (this.elements.scrollToBottomBtn) {
            // スクロール位置が下部から一定以上離れていればボタンを表示
            const isScrolledUp = this.elements.logEntries.scrollHeight -
                                this.elements.logEntries.scrollTop -
                                this.elements.logEntries.clientHeight > 50;

            this.elements.scrollToBottomBtn.style.display = isScrolledUp ? 'block' : 'none';
        }
    }
}

export default UIView;
