/**
 * ドミニオンのUIコントローラー
 * ゲームの状態を画面に表示する役割を持ちます
 */

class UIController {
    constructor(gameController) {
        this.gameController = gameController;
        this.gameController.setUIController(this);
        
        // DOM要素の参照を保持
        this.elements = {
            gameStatus: document.getElementById('game-status'),
            supplyPiles: document.getElementById('supply-piles'),
            playersInfo: document.getElementById('players-info'),
            handCards: document.getElementById('hand-cards'),
            playedCards: document.getElementById('played-cards'),
            deckCount: document.getElementById('deck-count'),
            discardCards: document.getElementById('discard-cards'),
            logEntries: document.getElementById('log-entries'),
            endTurnBtn: document.getElementById('end-turn-btn'),
            actionButtons: document.getElementById('action-buttons'),
            gameModal: document.getElementById('game-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalClose: document.querySelector('.close')
        };
        
        // モーダルを閉じるイベントを設定
        this.elements.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        // ゲーム終了ボタンのイベントを設定
        this.elements.endTurnBtn.addEventListener('click', () => {
            this.handleEndTurn();
        });

        // スクロールボタンのセットアップ
        this.setupScrollToBottomButton();
    }
    
    // ゲームの初期化画面を表示
    showGameSetup() {
        // モーダルを使ってゲーム設定画面を表示
        this.elements.modalTitle.textContent = 'ドミニオン - ゲーム設定';
        
        const setupHtml = `
            <div class="setup-form">
                <p>プレイヤー数を選択してください：</p>
                <select id="player-count">
                    <option value="2">2人</option>
                    <option value="3">3人</option>
                    <option value="4">4人</option>
                </select>
                
                <div id="player-names">
                    <div class="player-input">
                        <label for="player-1">プレイヤー1: </label>
                        <input type="text" id="player-1" value="プレイヤー1">
                    </div>
                    <div class="player-input">
                        <label for="player-2">プレイヤー2: </label>
                        <input type="text" id="player-2" value="プレイヤー2">
                    </div>
                </div>
                
                <button id="start-game-btn">ゲーム開始</button>
            </div>
        `;
        
        this.elements.modalBody.innerHTML = setupHtml;
        
        // プレイヤー数変更時のイベント
        const playerCountSelect = document.getElementById('player-count');
        playerCountSelect.addEventListener('change', () => {
            const count = parseInt(playerCountSelect.value);
            this.updatePlayerNameInputs(count);
        });
        
        // ゲーム開始ボタンのイベント
        const startGameBtn = document.getElementById('start-game-btn');
        startGameBtn.addEventListener('click', () => {
            this.startGame();
        });
        
        // モーダルを表示
        this.elements.gameModal.style.display = 'block';
    }
    
    // プレイヤー名入力欄を更新
    updatePlayerNameInputs(count) {
        const playerNamesDiv = document.getElementById('player-names');
        let html = '';
        
        for (let i = 1; i <= count; i++) {
            html += `
                <div class="player-input">
                    <label for="player-${i}">プレイヤー${i}: </label>
                    <input type="text" id="player-${i}" value="プレイヤー${i}">
                </div>
            `;
        }
        
        playerNamesDiv.innerHTML = html;
    }
    
    // ゲームを開始
    startGame() {
        // プレイヤー名を取得
        const playerCount = parseInt(document.getElementById('player-count').value);
        const playerNames = [];
        
        for (let i = 1; i <= playerCount; i++) {
            const nameInput = document.getElementById(`player-${i}`);
            playerNames.push(nameInput.value || `プレイヤー${i}`);
        }
        
        // ゲームを初期化
        this.gameController.initGame(playerNames);
        
        // モーダルを閉じる
        this.closeModal();
        
        // ゲーム画面を更新
        this.updateGameView();
    }
    
    // モーダルを閉じる
    closeModal() {
        this.elements.gameModal.style.display = 'none';
    }
    
    // ゲーム画面を更新
    updateGameView() {
        const gameState = this.gameController.getGameState();
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
            statusText = `${currentPlayer.name}のターン - ${this.getPhaseText(gameState.phase)}`;
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
                this.handleCardPurchase(cardId);
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
                    <div class="player-name">${player.name}</div>
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
                this.handleCardPlay(cardIndex);
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
        
        // ターン終了ボタン
        this.elements.endTurnBtn.disabled = gameState.phase === 'end';
        
        // アクションボタン
        let actionButtonsHtml = '';
        
        if (gameState.phase === 'action') {
            actionButtonsHtml += `
                <button id="buy-phase-btn" ${currentPlayer.actions <= 0 ? '' : 'class="highlight"'}>購入フェーズへ</button>
            `;
        }
        
        this.elements.actionButtons.innerHTML = actionButtonsHtml;
        
        // 購入フェーズボタンのイベント
        const buyPhaseBtn = document.getElementById('buy-phase-btn');
        if (buyPhaseBtn) {
            buyPhaseBtn.addEventListener('click', () => {
                this.handleEnterBuyPhase();
            });
        }
    }
    
    // カードプレイ処理
    handleCardPlay(cardIndex) {
        const gameState = this.gameController.getGameState();
        if (!gameState) return;
        
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const card = currentPlayer.hand[cardIndex];
        
        // アクションフェーズでアクションカードの場合
        if (gameState.phase === 'action' && card.isType(CARD_TYPES.ACTION)) {
            this.gameController.playActionCard(cardIndex);
        }
        // 購入フェーズで財宝カードの場合（自動プレイされるので不要）
        // else if (gameState.phase === 'buy' && card.isType(CARD_TYPES.TREASURE)) {
        //     // 財宝カードは購入フェーズで自動的にプレイされる
        // }
    }
    
    // 購入フェーズへの移行処理
    handleEnterBuyPhase() {
        this.gameController.enterBuyPhase();
    }
    
    // カード購入処理
    handleCardPurchase(cardId) {
        const gameState = this.gameController.getGameState();
        if (!gameState || gameState.phase !== 'buy') return;
        
        this.gameController.buyCard(cardId);
    }
    
    // ターン終了処理
    handleEndTurn() {
        this.gameController.endTurn();
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

    // スクロールボタンのセットアップ
    setupScrollToBottomButton() {
        // スクロールボタンがまだなければ作成
        if (!this.elements.scrollToBottomBtn) {
            const button = document.createElement('button');
            button.className = 'scroll-to-bottom-btn';
            button.innerHTML = '↓';
            button.title = '最新のログを表示';
            button.style.display = 'none';
            
            // ボタンクリック時に最下部へスクロール
            button.addEventListener('click', () => {
                this.elements.logEntries.scrollTop = this.elements.logEntries.scrollHeight;
                button.style.display = 'none';
            });
            
            // ログエントリのコンテナの後に挿入
            this.elements.logEntries.parentNode.appendChild(button);
            this.elements.scrollToBottomBtn = button;
            
            // スクロールイベントでボタンの表示/非表示を切り替え
            this.elements.logEntries.addEventListener('scroll', () => {
                this.updateScrollToBottomButton();
            });
        }
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
    
    // カード捨て選択モーダル表示
    showDiscardModal(player, cardId, callback) {
        this.elements.modalTitle.textContent = 'カードを捨てる';
        
        let html = `<p>${cardId === 'cellar' ? '捨てるカードを選択してください。選んだ枚数だけカードを引きます。' : '捨てるカードを選択してください。'}</p>`;
        
        html += '<div class="card-selection">';
        player.hand.forEach((card, index) => {
            const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
            
            html += `
                <div class="card ${cardTypeClass}" data-index="${index}">
                    <div class="card-title">${card.name}</div>
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-type">${this.getCardTypeText(card.types)}</div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-checkbox">
                        <input type="checkbox" id="card-${index}" class="card-select">
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        html += '<button id="confirm-discard">確定</button>';
        
        this.elements.modalBody.innerHTML = html;
        
        // 確定ボタンのイベント
        const confirmBtn = document.getElementById('confirm-discard');
        confirmBtn.addEventListener('click', () => {
            const selectedIndices = [];
            const checkboxes = document.querySelectorAll('.card-select');
            
            checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    selectedIndices.push(index);
                }
            });
            
            this.gameController.handleDiscardSelection(player, selectedIndices);
            this.closeModal();
        });
        
        this.elements.gameModal.style.display = 'block';
    }
    
    // カード廃棄選択モーダル表示
    showTrashModal(player, maxCount, callback) {
        this.elements.modalTitle.textContent = 'カードを廃棄する';
        
        let html = `<p>最大${maxCount}枚まで廃棄するカードを選択してください。</p>`;
        
        html += '<div class="card-selection">';
        player.hand.forEach((card, index) => {
            const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
            
            html += `
                <div class="card ${cardTypeClass}" data-index="${index}">
                    <div class="card-title">${card.name}</div>
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-type">${this.getCardTypeText(card.types)}</div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-checkbox">
                        <input type="checkbox" id="card-${index}" class="card-select">
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        html += '<button id="confirm-trash">確定</button>';
        
        this.elements.modalBody.innerHTML = html;
        
        // 最大選択数を制限
        const checkboxes = document.querySelectorAll('.card-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.card-select:checked').length;
                
                if (selectedCount > maxCount) {
                    checkbox.checked = false;
                }
            });
        });
        
        // 確定ボタンのイベント
        const confirmBtn = document.getElementById('confirm-trash');
        confirmBtn.addEventListener('click', () => {
            const selectedIndices = [];
            
            checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    selectedIndices.push(index);
                }
            });
            
            this.gameController.handleTrashSelection(player, selectedIndices);
            this.closeModal();
        });
        
        this.elements.gameModal.style.display = 'block';
    }
    
    // ゲーム結果表示
    showGameResults(scores) {
        this.elements.modalTitle.textContent = 'ゲーム終了';
        
        let html = '<div class="game-results">';
        html += '<h2>最終結果</h2>';
        
        scores.forEach((score, index) => {
            html += `<div class="result-row ${index === 0 ? 'winner' : ''}">
                <span class="rank">${index + 1}位</span>
                <span class="player-name">${score.player.name}</span>
                <span class="points">${score.points}点</span>
            </div>`;
        });
        
        html += '<button id="new-game-btn">新しいゲームを始める</button>';
        html += '</div>';
        
        this.elements.modalBody.innerHTML = html;
        
        // 新しいゲームボタンのイベント
        const newGameBtn = document.getElementById('new-game-btn');
        newGameBtn.addEventListener('click', () => {
            this.closeModal();
            this.showGameSetup();
        });
        
        this.elements.gameModal.style.display = 'block';
    }
}