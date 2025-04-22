/**
 * ドミニオンのカードアニメーション機能
 * カードの移動やエフェクトを視覚的に表現します
 */

class CardAnimator {
    constructor() {
        this.overlay = document.getElementById('animation-overlay');
        this.animationDuration = 500; // アニメーション時間（ミリ秒）
        this.animationsInProgress = 0; // 実行中のアニメーション数
    }

    /**
     * カードをプレイするアニメーション
     * @param {Element} cardElement - アニメーションするカード要素
     * @param {Element} targetContainer - 移動先のコンテナ
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    playCard(cardElement, targetContainer, callback) {
        this.animateCardMovement(cardElement, targetContainer, 'card-played', callback);
    }

    /**
     * カードを購入するアニメーション
     * @param {Element} cardElement - アニメーションするカード要素
     * @param {Element} targetContainer - 移動先のコンテナ
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    purchaseCard(cardElement, targetContainer, callback) {
        this.animateCardMovement(cardElement, targetContainer, 'card-purchased', callback);
    }

    /**
     * カードを捨て札にするアニメーション
     * @param {Element} cardElement - アニメーションするカード要素
     * @param {Element} targetContainer - 移動先のコンテナ
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    discardCard(cardElement, targetContainer, callback) {
        this.animateCardMovement(cardElement, targetContainer, 'card-discarded', callback);
    }

    /**
     * カードを山札に戻すアニメーション
     * @param {Element} cardElement - アニメーションするカード要素
     * @param {Element} targetContainer - 移動先のコンテナ
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    returnToDeck(cardElement, targetContainer, callback) {
        this.animateCardMovement(cardElement, targetContainer, 'card-returned', callback);
    }

    /**
     * カードを引くアニメーション
     * @param {Element} sourceContainer - カードの移動元コンテナ
     * @param {Element} targetContainer - カードの移動先コンテナ
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    drawCard(sourceContainer, targetContainer, callback) {
        // 山札からカードを複製して使う
        const clonedCard = this.createTemporaryCard('山札のカード');
        this.animateCardMovement(clonedCard, targetContainer, 'card-drawn', callback);
    }

    /**
     * 一時的なカード要素を作成
     * @param {string} cardName - カード名
     * @returns {Element} 作成されたカード要素
     */
    createTemporaryCard(cardName) {
        const card = document.createElement('div');
        card.className = 'card temp-card';
        card.innerHTML = `<div class="card-title">${cardName}</div>`;
        
        // オーバーレイに一時的なカードを追加
        this.overlay.appendChild(card);
        
        return card;
    }

    /**
     * カード移動のアニメーション基本処理
     * @param {Element} cardElement - アニメーションするカード要素
     * @param {Element} targetContainer - 移動先のコンテナ
     * @param {string} animationClass - 適用するアニメーションクラス
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    animateCardMovement(cardElement, targetContainer, animationClass, callback) {
        // 実行中のアニメーション数をインクリメント
        this.animationsInProgress++;
        
        // カードの現在位置を取得
        const cardRect = cardElement.getBoundingClientRect();
        
        // 移動先の位置を取得
        const targetRect = targetContainer.getBoundingClientRect();
        
        // クローンを作成してオーバーレイに追加
        const clone = cardElement.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.left = `${cardRect.left}px`;
        clone.style.top = `${cardRect.top}px`;
        clone.style.width = `${cardRect.width}px`;
        clone.style.height = `${cardRect.height}px`;
        clone.style.zIndex = '1000';
        clone.classList.add('card-animating');
        this.overlay.appendChild(clone);
        
        // 元のカードを非表示
        if (cardElement.classList.contains('temp-card')) {
            // 一時的なカードは削除
            cardElement.remove();
        } else {
            // 実際のカードは非表示
            cardElement.style.visibility = 'hidden';
        }
        
        // アニメーションクラスを適用
        clone.classList.add(animationClass);
        
        // アニメーションの開始
        requestAnimationFrame(() => {
            // 終了位置に移動
            clone.style.transition = `all ${this.animationDuration}ms ease-in-out`;
            clone.style.left = `${targetRect.left + (targetRect.width - cardRect.width) / 2}px`;
            clone.style.top = `${targetRect.top + (targetRect.height - cardRect.height) / 2}px`;
            
            // アニメーション終了後の処理
            setTimeout(() => {
                // クローンを削除
                clone.remove();
                
                // 元のカードを再表示（一時的なカードでない場合）
                if (!cardElement.classList.contains('temp-card')) {
                    cardElement.style.visibility = 'visible';
                }
                
                // コールバックを呼び出し
                if (callback) callback();
                
                // 実行中のアニメーション数をデクリメント
                this.animationsInProgress--;
            }, this.animationDuration);
        });
    }

    /**
     * すべてのアニメーションが完了するのを待つ
     * @param {Function} callback - すべてのアニメーション完了後に実行されるコールバック
     */
    waitForAllAnimations(callback) {
        const checkInterval = 100; // チェック間隔（ミリ秒）
        
        const check = () => {
            if (this.animationsInProgress <= 0) {
                callback();
            } else {
                setTimeout(check, checkInterval);
            }
        };
        
        check();
    }
}

// グローバルにCardAnimatorインスタンスを作成
window.cardAnimator = new CardAnimator();