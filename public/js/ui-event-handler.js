/**
 * ドミニオンのUIイベントハンドラー
 * ユーザーイベントの処理を担当
 */

import { CARD_TYPES, ALL_CARDS } from './card-data.js';
import cardAnimator, { STAGGER_MS } from './card-animations.js';
import { hasNightCard } from './ui-view.js';

// 場札の小さなカードの大きさと間隔（styles.css の .card.mini・#played-cards と合わせる）
const MINI_CARD_WIDTH = 76;
const MINI_CARD_HEIGHT = 30;
const PLAYED_CARDS_GAP = 6;

class UIEventHandler {
    // 購入回数を使い切ってから自動でターンを終えるまでの待ち時間（ミリ秒）
    static AUTO_END_TURN_DELAY_MS = 200;
    
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
    }
    
    // ローカル対戦とオンライン対戦でコントローラーが切り替わるので、毎回 UIController から取る
    get gameController() {
        return this.uiController.gameController;
    }
    
    // カードプレイ処理
    handleCardPlay(cardIndex) {
        const view = this.gameController.getView();
        if (!view) return;

        const card = view.me?.hand[cardIndex];
        // 相続した屋敷も、そのカードとしてプレイできる。夜フェイズには夜のカードをプレイできる
        const canPlayAction = view.phase === 'action' && view.me.actions > 0 &&
            card && (card.isType(CARD_TYPES.ACTION) || (card.id === 'estate' && view.me.inheritance));
        const canPlayNight = view.phase === 'night' && card?.isType(CARD_TYPES.NIGHT);
        const canPlay = view.isMyTurn && (canPlayAction || canPlayNight) && !view.prompt;

        // 今プレイできないカードはタップしても何もしない（説明は長押しで表示する）
        // アニメーション中や返事を待つ間の連打で、別のカードまでプレイしないようにする
        if (!canPlay || this.isActionPending) return;
        this.isActionPending = true;

        // カード要素を取得（手札は並び替えて表示しているので、画面上の位置ではなく手札の番号で探す）
        const cardElement = this.elements.handCards.querySelector(`[data-card-index="${cardIndex}"]`);
        const target = this.planPlayTargets()(card.id);

        // 場札の着地点へアニメーションで移動させてからプレイする
        cardAnimator.playCard(cardElement, target, () => {
            // 受け付けられなければ描き直されないので、ここで次の操作を受け付けるようにする
            if (!this.gameController.send({ type: 'play', cardIndex })) this.clearPendingActions();
        });
    }
    
    // 購入フェーズへの移行処理
    handleEnterBuyPhase() {
        const view = this.gameController.getView();
        if (!view || !view.isMyTurn || view.phase !== 'action' || this.isActionPending) return;
        this.isActionPending = true;
        const hand = view.me.hand;
        const enterBuyPhase = () => {
            if (!this.gameController.send({ type: 'buyPhase' })) this.clearPendingActions();
        };
        
        // 財宝カードをアニメーションするためのカード要素を取得（要素の data-card-index で手札と対応させる）
        const treasureCards = Array.from(this.elements.handCards.querySelectorAll('.card'))
            .filter(card => {
                const cardData = hand[parseInt(card.getAttribute('data-card-index'))];
                return cardData && cardData.isType(CARD_TYPES.TREASURE);
            });
        
        if (treasureCards.length > 0) {
            // 少しずつずらしてほぼ同時に場へ出し、すべて終わったら購入フェーズに移行する
            // 着地点は動かし始める前にまとめて決める（同じ財宝は同じ位置へ向かう）
            const targetFor = this.planPlayTargets();
            let finished = 0;
            
            treasureCards.forEach((card, i) => {
                const cardId = hand[parseInt(card.getAttribute('data-card-index'))].id;
                const target = targetFor(cardId);
                setTimeout(() => {
                    cardAnimator.playCard(card, target, () => {
                        // 残りの財宝が飛んでいる間に手札へ戻って見えないよう、購入フェーズの再描画まで隠しておく
                        card.style.visibility = 'hidden';
                        finished++;
                        if (finished === treasureCards.length) {
                            enterBuyPhase();
                        }
                    });
                }, i * STAGGER_MS);
            });
        } else {
            // 財宝カードがない場合は直接購入フェーズに移行
            enterBuyPhase();
        }
    }
    
    // カード購入処理
    handleCardPurchase(cardId) {
        const view = this.gameController.getView();
        if (!view || !view.isMyTurn || view.phase !== 'buy') return;
        
        const currentPlayer = view.me;
        const card = ALL_CARDS[cardId.toUpperCase()];
        
        // 返事を待っている購入の分も差し引いて、購入回数とコインが足りなければ何もしない
        // （アニメーション中の連打や、オンライン対戦で結果が届く前のタップで二重に買わないように）
        // コストは橋・街道などで下がることがあるので、ビューの今のコストで判断する
        const pending = this.pendingPurchases ?? { count: 0, cost: 0, potions: 0 };
        const cost = view.costs?.[cardId] ?? card?.cost;
        const potionCost = view.potionCosts?.[cardId] ?? card?.potionCost ?? 0;
        // 負債は購入の前に財宝で返すので、その分を差し引いて足りるかを見る
        const usableCoins = currentPlayer.coins - (currentPlayer.debt ?? 0);
        if (!card || (view.supply[cardId] ?? 0) <= 0 || view.prompt ||
            currentPlayer.buys - pending.count <= 0 || usableCoins - pending.cost < cost ||
            (currentPlayer.potions ?? 0) - (pending.potions ?? 0) < potionCost) {
            return;
        }
        this.pendingPurchases = { count: pending.count + 1, cost: pending.cost + cost, potions: (pending.potions ?? 0) + potionCost };
        
        // 購入回数を使い切ったときのターン終了は、描き直すときに endTurnIfNoBuysLeft で判定する
        const purchase = () => {
            this.gameController.send({ type: 'buy', cardId });
        };
        
        // 購入するカード要素を取得
        const cardElement = Array.from(this.elements.supplyPiles.querySelectorAll('.card'))
            .find(card => card.getAttribute('data-card-id') === cardId);
        
        // 捨て札エリアを取得
        const discardArea = this.elements.discardCards;
        
        if (cardElement && discardArea) {
            // アニメーションで移動させてから購入処理
            cardAnimator.purchaseCard(cardElement, discardArea, purchase);
        } else {
            // 要素が見つからない場合は直接購入処理
            purchase();
        }
    }
    
    // イベントなどを購入する（購入フェーズに、購入回数とコインが足りるときだけ）
    handleLandscapePurchase(landscapeId) {
        const view = this.gameController.getView();
        if (!view || !view.isMyTurn || view.phase !== 'buy' || view.prompt || this.isActionPending) return;
        const landscape = view.landscapes?.find(item => item.id === landscapeId);
        if (!landscape || view.me.buys <= 0 || view.me.coins - (view.me.debt ?? 0) < landscape.cost) return;
        this.isActionPending = true;
        if (!this.gameController.send({ type: 'buyLandscape', landscapeId })) this.clearPendingActions();
    }

    // 夜フェイズに移る（購入フェーズの後に、手札の夜のカードをプレイする）
    handleEnterNightPhase() {
        const view = this.gameController.getView();
        if (!view || !view.isMyTurn || !['action', 'buy'].includes(view.phase) || view.prompt || this.isActionPending) return;
        this.isActionPending = true;
        if (!this.gameController.send({ type: 'night' })) this.clearPendingActions();
    }

    // 財源を1つ使って財宝+1を得る
    handleUseCoffers() {
        const view = this.gameController.getView();
        if (!view || !view.isMyTurn || view.phase !== 'buy' || view.me.coffers <= 0 || this.isActionPending) return;
        this.isActionPending = true;
        if (!this.gameController.send({ type: 'coffers', amount: 1 })) this.clearPendingActions();
    }
    
    // 場札の着地点を決める関数を返す。同じカードが場にあればその位置、なければ右端の次（空なら左端）
    // 新しく置く位置は呼ぶたびに右へずらすので、複数枚を同時に出しても重ならない
    planPlayTargets() {
        const container = this.elements.playedCards;
        const containerRect = container.getBoundingClientRect();
        const minis = Array.from(container.querySelectorAll('.card[data-card-id]'));
        
        const targets = new Map();
        minis.forEach(mini => {
            const rect = mini.getBoundingClientRect();
            targets.set(mini.getAttribute('data-card-id'), {
                left: rect.left, top: rect.top, width: rect.width, height: rect.height
            });
        });
        
        const last = minis.length > 0 ? minis[minis.length - 1].getBoundingClientRect() : null;
        const height = last ? last.height : MINI_CARD_HEIGHT;
        const top = last ? last.top : containerRect.top + (containerRect.height - height) / 2;
        let nextLeft = last ? last.right + PLAYED_CARDS_GAP : containerRect.left;
        
        return (cardId) => {
            if (!targets.has(cardId)) {
                // 帯からはみ出す位置は右端にそろえる（帯は横スクロールで続きを表示する）
                const left = Math.min(nextLeft, containerRect.right - MINI_CARD_WIDTH);
                targets.set(cardId, { left, top, width: MINI_CARD_WIDTH, height });
                nextLeft += MINI_CARD_WIDTH + PLAYED_CARDS_GAP;
            }
            return targets.get(cardId);
        };
    }
    
    // 新しい状態が届いたら、返事待ちの操作（プレイ・購入フェーズへ・購入）はなくなる
    clearPendingActions() {
        this.isActionPending = false;
        this.pendingPurchases = null;
    }
    
    // 自分の購入フェーズで購入回数を使い切っていたら、購入したカードが見える程度に間を置いてターンを終える
    // 画面を描き直すたびに呼ぶ。選択待ち（船乗りなど）の間は終えず、答えた後の描き直しでもう一度判定する
    endTurnIfNoBuysLeft(view) {
        if (this.autoEndTimer || !view.isMyTurn || view.phase !== 'buy') return;
        // 手札に夜のカードがあれば、夜フェイズに移れるようにターンを終えない
        if (view.me.buys > 0 || view.prompt || hasNightCard(view.me)) return;
        
        this.autoEndTimer = setTimeout(() => {
            this.autoEndTimer = null;
            this.handleEndTurn();
        }, UIEventHandler.AUTO_END_TURN_DELAY_MS);
    }
    
    // ターン終了処理
    handleEndTurn() {
        const view = this.gameController.getView();
        // 自動のターン終了とボタン操作が重なっても、二重にターンを進めない
        if (this.isEndingTurn || !view || !view.isMyTurn || view.prompt) return;
        
        this.isEndingTurn = true;
        const finishTurn = () => {
            this.isEndingTurn = false;
            this.gameController.send({ type: 'endTurn' });
        };
        
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
                    finishTurn();
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
            finishTurn();
        }
    }
    
    // ゲーム開始処理
    startGame() {
        // プレイヤー名を取得
        const playerCount = parseInt(document.getElementById('player-count').value);
        const playerNames = [];
        
        for (let i = 1; i <= playerCount; i++) {
            const nameInput = document.getElementById(`player-${i}`);
            const cpuCheckbox = document.getElementById(`player-${i}-cpu`);
            playerNames.push({
                name: nameInput.value || `プレイヤー${i}`,
                isCPU: cpuCheckbox.checked
            });
        }
        
        // 人数・名前・CPUの指定を保存して、次回の設定画面に入れておく
        const localPlayers = [...this.uiController.settings.localPlayers];
        playerNames.forEach((player, i) => { localPlayers[i] = player; });
        this.uiController.updateSettings({ playerCount, localPlayers });
        
        // ゲームを初期化（使うカードのセットは設定から）
        const cardSets = this.uiController.settings.cardSets.split('+');
        this.uiController.resetForNewGame();
        this.gameController.initGame(playerNames, { cardSets });
        
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