/**
 * ドミニオンのUI表示管理
 * ゲームの状態を画面に表示する機能を提供
 */

import { CARD_TYPES, ALL_CARDS } from './card-data.js';
import { onPress } from './press-handler.js';
import { getCardArt, CARD_BACK } from './card-art.js';
import cardAnimator, { STAGGER_MS } from './card-animations.js';

// サプライの基本カードの並び順（左から勝利点の列、財宝の列、その右にアクション）
const VICTORY_SUPPLY_ORDER = ['estate', 'duchy', 'province', 'curse'];
const TREASURE_SUPPLY_ORDER = ['copper', 'silver', 'gold'];
const BASIC_SUPPLY_ORDER = [...VICTORY_SUPPLY_ORDER, ...TREASURE_SUPPLY_ORDER];

// 手札の表示順（種類）。同じ種類の中ではコストの高い順に並べる
const HAND_TYPE_ORDER = [CARD_TYPES.ACTION, CARD_TYPES.TREASURE, CARD_TYPES.VICTORY, CARD_TYPES.CURSE];

class UIView {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
        
        // プレイヤーごとの前回描画した手札。新しく増えたカード（＝引いたカード）を見つけるのに使う
        this.lastHands = new Map();
    }

    // ゲーム画面を更新
    updateGameView(gameState) {
        if (!gameState) return;

        // ゲームステータスを更新
        this.updateGameStatus(gameState);

        // サプライパイルを更新
        this.updateSupplyPiles(gameState);

        // プレイヤー情報を更新
        this.updatePlayersInfo(gameState);

        // 現在のプレイヤーの手札と場を更新
        this.updateCurrentPlayerArea(gameState);

        // ボタンやアクション状態を更新
        this.updateGameControls(gameState);
    }

    // ゲームステータスと、現在のプレイヤーの残りリソースを更新
    updateGameStatus(gameState) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        if (gameState.phase === 'end') {
            this.elements.gameStatus.textContent = 'ゲーム終了';
            this.elements.turnStats.innerHTML = '';
            return;
        }

        const cpuLabel = currentPlayer.isCPU ? '（CPU）' : '';
        this.elements.gameStatus.innerHTML = `
            <span class="status-player">${currentPlayer.name}${cpuLabel}</span>
            <span class="status-phase phase-${gameState.phase}">${this.getPhaseText(gameState.phase)}</span>
        `;

        const stat = (label, value, dim) => `
            <div class="stat ${dim ? 'dim' : ''}">
                <span class="stat-label">${label}</span>
                <span class="stat-value">${value}</span>
            </div>
        `;

        this.elements.turnStats.innerHTML =
            stat('アクション', currentPlayer.actions, gameState.phase !== 'action') +
            stat('購入', currentPlayer.buys, false) +
            stat('コイン', currentPlayer.coins, false);
    }

    // フェーズの日本語テキストを取得
    getPhaseText(phase) {
        switch (phase) {
            case 'action': return 'アクション';
            case 'buy': return '購入';
            case 'cleanup': return 'クリーンアップ';
            default: return phase;
        }
    }

    // サプライパイルを更新
    updateSupplyPiles(gameState) {
        const supply = gameState.supply;
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // 人間の購入フェーズでは、コインが足りず買えないカードをグレーアウトする
        // （アクションフェーズやCPUの手番では、すべて通常の表示にする）
        const isHumanBuying = gameState.phase === 'buy' && !currentPlayer.isCPU && currentPlayer.buys > 0;
        const isUnaffordable = (card) => isHumanBuying && currentPlayer.coins < card.cost;

        const tilesHtml = (cardIds) => cardIds
            .filter(cardId => supply[cardId] !== undefined)
            .map(cardId => {
                const card = ALL_CARDS[cardId.toUpperCase()];
                return this.createSupplyCardHtml(card, supply[cardId], isUnaffordable(card));
            })
            .join('');

        // 王国カードはサプライのキーから基本カード以外を取り出し、コスト順に並べる
        const kingdomCardIds = Object.keys(supply)
            .filter(cardId => !BASIC_SUPPLY_ORDER.includes(cardId) && ALL_CARDS[cardId.toUpperCase()])
            .sort((a, b) => ALL_CARDS[a.toUpperCase()].cost - ALL_CARDS[b.toUpperCase()].cost);

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
        `;

        // タップで購入、長押しで説明を表示する
        const supplyCards = this.elements.supplyPiles.querySelectorAll('.card');
        supplyCards.forEach(card => {
            const cardId = card.getAttribute('data-card-id');
            onPress(card, {
                onTap: () => this.uiController.handleCardPurchase(cardId),
                onLongPress: () => this.uiController.showSupplyCardDetail(cardId)
            });
        });
    }

    // サプライカードのHTML生成
    createSupplyCardHtml(card, count, unaffordable) {
        const stateClass = count <= 0 ? 'empty' : (unaffordable ? 'unaffordable' : '');

        // カードIDは小文字に変換して一貫性を保つ
        const cardId = card.id.toLowerCase();

        return `
            <div class="card supply-tile ${this.getCardTypeClass(card)} ${stateClass}" data-card-id="${cardId}">
                <span class="card-cost">${card.cost}</span>
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
                    <span class="card-cost">${card.cost}</span>
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
            [CARD_TYPES.CURSE]: '呪い'
        };

        return types.map(type => typeMap[type] || type).join(' - ');
    }

    // プレイヤー情報を更新
    updatePlayersInfo(gameState) {
        const html = gameState.players.map((player, index) => {
            const isCurrentPlayer = index === gameState.currentPlayerIndex;

            return `
                <div class="player-stats ${isCurrentPlayer ? 'active-player' : ''}">
                    <div class="player-name">
                        ${player.name}${player.isCPU ? '<span class="cpu-badge">CPU</span>' : ''}
                    </div>
                    <div class="player-meta">
                        <span>勝利点 <b>${player.calculateVictoryPoints()}</b></span>
                        <span>山札 ${player.deck.length}</span>
                        <span>手札 ${player.hand.length}</span>
                        <span>捨て札 ${player.discard.length}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.playersInfo.innerHTML = html;
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
    
    // 現在のプレイヤーの手札と場を更新
    updateCurrentPlayerArea(gameState) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // 今プレイできるアクションカードを強調する
        const canPlayActions = gameState.phase === 'action' && !currentPlayer.isCPU && currentPlayer.actions > 0;

        // 手札を種類・コスト順に並べて表示する。重ねたカードは先頭の1枚の番号を持たせ、タップでその1枚をプレイする
        const groups = this.getHandGroups(currentPlayer.hand, this.uiController.settings.stackHand);
        
        this.elements.handCards.innerHTML = groups.map(({ card, indices }) => {
            const playable = canPlayActions && card.isType(CARD_TYPES.ACTION);
            return this.createCardHtml(card, `data-card-index="${indices[0]}"`, playable ? 'playable' : '', indices.length);
        }).join('');

        // 手札はタップでプレイ、長押しで説明を表示する
        this.elements.handCards.querySelectorAll('.card').forEach(element => {
            const index = parseInt(element.getAttribute('data-card-index'));
            onPress(element, {
                onTap: () => this.uiController.handleCardPlay(index),
                onLongPress: () => this.uiController.showCardDetail(currentPlayer.hand[index])
            });
        });
        
        this.animateDrawnCards(currentPlayer, groups);

        // 場札は同じカードを常にまとめ、最初にプレイした位置に ×枚数 で表示する
        const playGroups = [];
        currentPlayer.playArea.forEach(card => {
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

        // 山札は裏向き、捨て札は一番上のカードを表向きにして、枚数を ×N で表示する
        const topDiscard = currentPlayer.discard[currentPlayer.discard.length - 1];
        this.elements.deckPile.innerHTML = this.createPileHtml(currentPlayer.deck.length);
        this.elements.discardCards.innerHTML = this.createPileHtml(currentPlayer.discard.length, topDiscard);
        
        // 捨て札は長押しで一番上のカードの説明を表示する（要素は描画のたびに作り直すので、リスナーは重ならない）
        const discardCard = this.elements.discardCards.querySelector('.pile-card:not(.empty)');
        if (discardCard) {
            onPress(discardCard, {
                onLongPress: () => this.uiController.showCardDetail(topDiscard)
            });
        }
    }
    
    // 前回の描画から手札に増えたカードを、山札から飛んでくるように見せる
    // 初めて描画するプレイヤーは手札すべてが対象（ゲーム開始時の5枚）
    animateDrawnCards(player, groups) {
        const previous = this.lastHands.get(player.id) ?? new Set();
        this.lastHands.set(player.id, new Set(player.hand));
        
        const elements = this.elements.handCards.querySelectorAll('.card');
        let order = 0;
        
        groups.forEach((group, i) => {
            const isDrawn = group.indices.some(index => !previous.has(player.hand[index]));
            if (isDrawn) {
                cardAnimator.drawCard(elements[i], this.elements.deckPile, order * STAGGER_MS);
                order++;
            }
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
    updateGameControls(gameState) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        // CPUの手番中は人間の操作ボタンを無効にする
        const isCpuTurn = currentPlayer.isCPU;

        // ターン終了ボタン
        this.elements.endTurnBtn.disabled = gameState.phase === 'end' || isCpuTurn;

        // アクションボタン
        let actionButtonsHtml = '';

        if (gameState.phase === 'action' && !isCpuTurn) {
            actionButtonsHtml += `
                <button id="buy-phase-btn" ${currentPlayer.actions <= 0 ? 'class="highlight"' : ''}>購入へ</button>
            `;
        }

        this.elements.actionButtons.innerHTML = actionButtonsHtml;

        // 購入フェーズボタンのイベント
        const buyPhaseBtn = document.getElementById('buy-phase-btn');
        if (buyPhaseBtn) {
            buyPhaseBtn.addEventListener('click', () => {
                this.uiController.handleEnterBuyPhase();
            });
        }
    }

    // ログエントリ追加
    addLogEntry(logEntry) {
        const logElement = document.createElement('div');
        logElement.className = 'log-entry';
        logElement.textContent = logEntry.message;

        // 最新のログを強調表示するクラスを追加
        logElement.classList.add('new-log');

        // 既存のログから 'new-log' クラスを削除
        const existingLogs = this.elements.logEntries.querySelectorAll('.new-log');
        existingLogs.forEach(log => log.classList.remove('new-log'));

        this.elements.logEntries.appendChild(logElement);

        // ヘッダーにも最新のログを1行表示する
        this.elements.latestLog.textContent = logEntry.message;

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
