/**
 * ドミニオンのUI表示管理
 * ゲームの状態を画面に表示する機能を提供
 */

import { CARD_TYPES, ALL_CARDS } from './card-data.js';

class UIView {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
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
    
    // ゲームステータスを更新
    updateGameStatus(gameState) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        let statusText = '';
        
        if (gameState.phase === 'end') {
            statusText = 'ゲーム終了';
        } else {
            const cpuLabel = currentPlayer.isCPU ? '（CPU）' : '';
            statusText = `${currentPlayer.name}${cpuLabel}のターン - ${this.getPhaseText(gameState.phase)}`;
        }
        
        this.elements.gameStatus.textContent = statusText;
    }
    
    // フェーズの日本語テキストを取得
    getPhaseText(phase) {
        switch (phase) {
            case 'action': return 'アクションフェーズ';
            case 'buy': return '購入フェーズ';
            case 'cleanup': return 'クリーンアップフェーズ';
            default: return phase;
        }
    }
    
    // サプライパイルを更新
    updateSupplyPiles(gameState) {
        const supply = gameState.supply;
        
        // サプライパイルのDOMをクリア
        this.elements.supplyPiles.innerHTML = `
            <div id="victory-cards" class="supply-area">
                <div class="supply-card-grid"></div>
            </div>
            <div id="action-cards-top" class="supply-area">
                <div class="supply-card-grid"></div>
            </div>
            <div id="treasure-cards" class="supply-area">
                <div class="supply-card-grid"></div>
            </div>
            <div id="action-cards-bottom" class="supply-area">
                <div class="supply-card-grid"></div>
            </div>
        `;
        
        // 勝利点カード (左上) - 呪いを屋敷の左側に配置
        const victoryCardsContainer = document.querySelector('#victory-cards .supply-card-grid');
        
        // まず呪いカードを配置
        if (supply['curse'] !== undefined) {
            const curseCard = ALL_CARDS['CURSE'];
            victoryCardsContainer.innerHTML += this.createSupplyCardHtml(curseCard, supply['curse']);
        }
        
        // 次に勝利点カードを配置
        const victoryCards = ['estate', 'duchy', 'province'];
        victoryCards.forEach(cardId => {
            if (supply[cardId] !== undefined) {
                const card = ALL_CARDS[cardId.toUpperCase()];
                victoryCardsContainer.innerHTML += this.createSupplyCardHtml(card, supply[cardId]);
            }
        });
        
        // 財宝カード (左下)
        const treasureCards = ['copper', 'silver', 'gold'];
        const treasureCardsContainer = document.querySelector('#treasure-cards .supply-card-grid');
        treasureCards.forEach(cardId => {
            if (supply[cardId] !== undefined) {
                const card = ALL_CARDS[cardId.toUpperCase()];
                treasureCardsContainer.innerHTML += this.createSupplyCardHtml(card, supply[cardId]);
            }
        });
        
        // アクションカード (右側上下)
        let actionCards = [];
        
        // 王国カードのリストを取得
        if (gameState.game && gameState.game.selectedKingdomCards) {
            actionCards = gameState.game.selectedKingdomCards.filter(cardId => {
                const card = ALL_CARDS[cardId.toUpperCase()];
                return card && card.types.includes(CARD_TYPES.ACTION);
            });
        } else {
            // 王国カードIDがない場合は、サプライオブジェクトのキーから取得
            actionCards = Object.keys(supply).filter(cardId => {
                if (treasureCards.includes(cardId) || victoryCards.includes(cardId) || cardId === 'curse') {
                    return false;
                }
                const cardKey = cardId.toUpperCase();
                return ALL_CARDS[cardKey] && ALL_CARDS[cardKey].types.includes(CARD_TYPES.ACTION);
            });
        }
        
        // アクションカードをコスト順にソート（低いものから順に）
        actionCards.sort((a, b) => {
            const cardA = ALL_CARDS[a.toUpperCase()];
            const cardB = ALL_CARDS[b.toUpperCase()];
            return cardA.cost - cardB.cost; // 低いコストが先に来るようにソート
        });
        
        // アクションカードを左下→右下→左上→右上の順に配置
        const actionCardsTopContainer = document.querySelector('#action-cards-top .supply-card-grid');
        const actionCardsBottomContainer = document.querySelector('#action-cards-bottom .supply-card-grid');
        
        // 半分のインデックスを計算（奇数個の場合は下段に多く配置）
        const halfIndex = Math.ceil(actionCards.length / 2);
        
        // 各カードにグリッド位置を割り当てる
        actionCards.forEach((cardId, index) => {
            if (supply[cardId] !== undefined) {
                const card = ALL_CARDS[cardId.toUpperCase()];
                
                // 下段（低コスト）と上段（高コスト）に分ける
                if (index < halfIndex) {
                    // 下段：左から右へ（低コスト→中コスト）
                    actionCardsBottomContainer.innerHTML += this.createSupplyCardHtml(card, supply[cardId]);
                } else {
                    // 上段：左から右へ（中コスト→高コスト）
                    actionCardsTopContainer.innerHTML += this.createSupplyCardHtml(card, supply[cardId]);
                }
            }
        });
        
        // カードクリックイベントを追加
        const supplyCards = this.elements.supplyPiles.querySelectorAll('.card');
        supplyCards.forEach(card => {
            card.addEventListener('click', () => {
                const cardId = card.getAttribute('data-card-id');
                this.uiController.handleCardPurchase(cardId);
            });
        });
    }
    
    // サプライカードのHTML生成
    createSupplyCardHtml(card, count) {
        const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
        
        // カードIDは小文字に変換して一貫性を保つ
        const cardId = card.id.toLowerCase();
        
        return `
            <div class="card ${cardTypeClass}" data-card-id="${cardId}">
                <div class="card-title">${card.name}</div>
                <div class="card-cost">${card.cost}</div>
                <div class="card-type">${this.getCardTypeText(card.types)}</div>
                <div class="card-description">${card.description}</div>
                <div class="card-count">${count}</div>
            </div>
        `;
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
        let html = '';
        
        gameState.players.forEach((player, index) => {
            const isCurrentPlayer = index === gameState.currentPlayerIndex;
            const playerClass = isCurrentPlayer ? 'player-stats active-player' : 'player-stats';
            
            html += `
                <div class="${playerClass}">
                    <div class="player-name">${player.name}${player.isCPU ? ' (CPU)' : ''}</div>
                    <div class="player-deck">山札: ${player.deck.length}枚</div>
                    <div class="player-hand">手札: ${player.hand.length}枚</div>
                    <div class="player-discard">捨て札: ${player.discard.length}枚</div>
                    ${isCurrentPlayer ? this.getCurrentPlayerStatsHtml(player, gameState.phase) : ''}
                </div>
            `;
        });
        
        this.elements.playersInfo.innerHTML = html;
    }
    
    // 現在のプレイヤーの詳細情報HTML生成
    getCurrentPlayerStatsHtml(player, phase) {
        if (phase === 'action') {
            return `
                <div class="player-actions">アクション: ${player.actions}</div>
                <div class="player-buys">購入: ${player.buys}</div>
                <div class="player-coins">財宝: ${player.coins}</div>
            `;
        } else if (phase === 'buy') {
            return `
                <div class="player-buys">購入: ${player.buys}</div>
                <div class="player-coins">財宝: ${player.coins}</div>
            `;
        }
        
        return '';
    }
    
    // 現在のプレイヤーの手札と場を更新
    updateCurrentPlayerArea(gameState) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // 手札を更新
        let handHtml = '';
        currentPlayer.hand.forEach((card, index) => {
            const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
            
            handHtml += `
                <div class="card ${cardTypeClass}" data-card-index="${index}">
                    <div class="card-title">${card.name}</div>
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-type">${this.getCardTypeText(card.types)}</div>
                    <div class="card-description">${card.description}</div>
                </div>
            `;
        });
        
        this.elements.handCards.innerHTML = handHtml;
        
        // 手札のカードクリックイベントを追加
        const handCards = this.elements.handCards.querySelectorAll('.card');
        handCards.forEach(card => {
            card.addEventListener('click', () => {
                const cardIndex = parseInt(card.getAttribute('data-card-index'));
                this.uiController.handleCardPlay(cardIndex);
            });
        });
        
        // 場のカードを更新
        let playedHtml = '';
        currentPlayer.playArea.forEach(card => {
            const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
            
            playedHtml += `
                <div class="card ${cardTypeClass}">
                    <div class="card-title">${card.name}</div>
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-type">${this.getCardTypeText(card.types)}</div>
                    <div class="card-description">${card.description}</div>
                </div>
            `;
        });
        
        this.elements.playedCards.innerHTML = playedHtml;
        
        // 山札と捨て札を更新
        this.elements.deckCount.textContent = currentPlayer.deck.length;
        
        let discardHtml = '';
        if (currentPlayer.discard.length > 0) {
            const topCard = currentPlayer.discard[currentPlayer.discard.length - 1];
            const cardTypeClass = topCard.types.map(type => `${type}-card`).join(' ');
            
            discardHtml = `
                <div class="card ${cardTypeClass}">
                    <div class="card-title">${topCard.name}</div>
                    <div class="card-count">${currentPlayer.discard.length}</div>
                </div>
            `;
        }
        
        this.elements.discardCards.innerHTML = discardHtml;
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
                <button id="buy-phase-btn" ${currentPlayer.actions <= 0 ? '' : 'class="highlight"'}>購入フェーズへ</button>
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