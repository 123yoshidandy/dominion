/**
 * ドミニオンのUIイベントハンドラー
 * ユーザーイベントの処理を担当
 */

import { CARD_TYPES, ALL_CARDS } from './card-data.js';
import cardAnimator from './card-animations.js';

class UIEventHandler {
    constructor(uiController) {
        this.uiController = uiController;
        this.gameController = uiController.gameController;
        this.elements = uiController.elements;
    }
    
    // カードプレイ処理
    handleCardPlay(cardIndex) {
        const gameState = this.gameController.getGameState();
        if (!gameState) return;
        
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const card = currentPlayer.hand[cardIndex];
        
        // アクションフェーズでアクションカードの場合
        if (gameState.phase === 'action' && card.isType(CARD_TYPES.ACTION)) {
            // カード要素を取得
            const cardElement = this.elements.handCards.querySelectorAll('.card')[cardIndex];
            const playArea = this.elements.playedCards;
            
            // アニメーションで移動させてからプレイする
            cardAnimator.playCard(cardElement, playArea, () => {
                this.gameController.playActionCard(cardIndex);
            });
        }
    }
    
    // 購入フェーズへの移行処理
    handleEnterBuyPhase() {
        // 財宝カードをアニメーションするためのカード要素を取得
        const treasureCards = Array.from(this.elements.handCards.querySelectorAll('.card'))
            .filter((card, index) => {
                const gameState = this.gameController.getGameState();
                if (!gameState) return false;
                
                const currentPlayer = gameState.players[gameState.currentPlayerIndex];
                const cardData = currentPlayer.hand[index];
                return cardData && cardData.isType(CARD_TYPES.TREASURE);
            });
        
        if (treasureCards.length > 0) {
            // 連続してアニメーションする
            const playArea = this.elements.playedCards;
            let cardIndex = 0;
            
            const playNextCard = () => {
                if (cardIndex < treasureCards.length) {
                    const card = treasureCards[cardIndex];
                    cardIndex++;
                    
                    cardAnimator.playCard(card, playArea, playNextCard);
                } else {
                    // すべてのカードをプレイした後に購入フェーズに移行
                    this.gameController.enterBuyPhase();
                }
            };
            
            // 最初のカードからアニメーション開始
            playNextCard();
        } else {
            // 財宝カードがない場合は直接購入フェーズに移行
            this.gameController.enterBuyPhase();
        }
    }
    
    // カード購入処理
    handleCardPurchase(cardId) {
        const gameState = this.gameController.getGameState();
        if (!gameState || gameState.phase !== 'buy') return;
        
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // カード情報を取得して購入可能かチェック
        const upperCardId = cardId.toUpperCase();
        const card = ALL_CARDS[upperCardId];
        
        if (!card || currentPlayer.coins < card.cost) {
            // 購入できない場合（コスト不足）はアニメーションしない
            this.gameController.buyCard(cardId);
            return;
        }
        
        // 購入するカード要素を取得
        const cardElement = Array.from(this.elements.supplyPiles.querySelectorAll('.card'))
            .find(card => card.getAttribute('data-card-id') === cardId);
        
        // 捨て札エリアを取得
        const discardArea = this.elements.discardCards;
        
        if (cardElement && discardArea) {
            // アニメーションで移動させてから購入処理
            cardAnimator.purchaseCard(cardElement, discardArea, () => {
                this.gameController.buyCard(cardId);
            });
        } else {
            // 要素が見つからない場合は直接購入処理
            this.gameController.buyCard(cardId);
        }
    }
    
    // ターン終了処理
    handleEndTurn() {
        const gameState = this.gameController.getGameState();
        if (!gameState) return;
        
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // 手札と場のカードを捨て札にアニメーションする
        const handCards = Array.from(this.elements.handCards.querySelectorAll('.card'));
        const playedCards = Array.from(this.elements.playedCards.querySelectorAll('.card'));
        const discardArea = this.elements.discardCards;
        
        // アニメーションする総カード数
        const totalCards = handCards.length + playedCards.length;
        
        if (totalCards > 0) {
            let processedCards = 0;
            
            // アニメーション完了後の処理
            const onAnimationComplete = () => {
                processedCards++;
                if (processedCards >= totalCards) {
                    // すべてのアニメーションが完了したらターン終了
                    this.gameController.endTurn();
                }
            };
            
            // 手札のカードをアニメーション
            handCards.forEach(card => {
                cardAnimator.discardCard(card, discardArea, onAnimationComplete);
            });
            
            // 場のカードをアニメーション
            playedCards.forEach(card => {
                cardAnimator.discardCard(card, discardArea, onAnimationComplete);
            });
        } else {
            // カードがない場合は直接ターン終了
            this.gameController.endTurn();
        }
    }
    
    // ゲーム開始処理
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
        this.uiController.modal.closeModal();
        
        // ゲーム画面を更新
        this.uiController.updateGameView();
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
                this.uiController.view.updateScrollToBottomButton();
            });
        }
    }
}

export default UIEventHandler;