/**
 * ドミニオンのカードアニメーション機能
 * カードの移動やエフェクトを視覚的に表現します
 */

// カード1枚が移動する時間（ミリ秒）。CSS の --anim-ms にも同じ値を渡す
export const ANIMATION_MS = 250;

// 複数枚を続けて動かすときに、1枚ごとにずらす時間（ミリ秒）
export const STAGGER_MS = 60;

class CardAnimator {
    constructor() {
        this.overlay = document.getElementById('animation-overlay');
        this.animationDuration = ANIMATION_MS;
        this.animationsInProgress = 0; // 実行中のアニメーション数
        document.documentElement.style.setProperty('--anim-ms', `${ANIMATION_MS}ms`);
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
     * カードを引くアニメーション（描画済みの手札のカードを、山札の位置から飛ばして置く）
     * 手札は横スクロールの枠で切り取られるので、複製をオーバーレイに置いて動かす
     * @param {Element} cardElement - 手札に描画済みのカード要素
     * @param {Element} sourceElement - 山札の要素
     * @param {number} delay - 開始までの待ち時間（ミリ秒）
     */
    drawCard(cardElement, sourceElement, delay = 0) {
        cardElement.style.visibility = 'hidden';
        
        setTimeout(() => {
            // 待っている間に再描画で要素が置き換わっていたら何もしない
            if (!cardElement.isConnected) return;
            
            const from = sourceElement.getBoundingClientRect();
            const to = cardElement.getBoundingClientRect();
            
            const clone = cardElement.cloneNode(true);
            clone.classList.add('card-animating');
            Object.assign(clone.style, {
                position: 'absolute',
                margin: '0',
                visibility: 'visible',
                left: `${from.left + (from.width - to.width) / 2}px`,
                top: `${from.top + (from.height - to.height) / 2}px`,
                width: `${to.width}px`,
                height: `${to.height}px`,
                transform: 'scale(0.6)',
                opacity: '0.7'
            });
            this.overlay.appendChild(clone);
            
            // 開始位置を確定させてから移動させる（そうしないとトランジションが効かないことがある）
            clone.getBoundingClientRect();
            const d = this.animationDuration;
            clone.style.transition = `left ${d}ms ease-out, top ${d}ms ease-out, transform ${d}ms ease-out, opacity ${d}ms ease-out`;
            Object.assign(clone.style, {
                left: `${to.left}px`,
                top: `${to.top}px`,
                transform: 'none',
                opacity: '1'
            });
            
            setTimeout(() => {
                clone.remove();
                cardElement.style.visibility = '';
            }, d);
        }, delay);
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
        
        // 移動先：要素ならその中央へ、{ left, top, width, height } ならその位置・大きさで着地させる
        const landsOnRect = typeof targetContainer.getBoundingClientRect !== 'function';
        const targetRect = landsOnRect ? targetContainer : targetContainer.getBoundingClientRect();
        
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
            if (landsOnRect) {
                clone.style.left = `${targetRect.left}px`;
                clone.style.top = `${targetRect.top}px`;
                clone.style.width = `${targetRect.width}px`;
                clone.style.height = `${targetRect.height}px`;
            } else {
                clone.style.left = `${targetRect.left + (targetRect.width - cardRect.width) / 2}px`;
                clone.style.top = `${targetRect.top + (targetRect.height - cardRect.height) / 2}px`;
            }
            
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

// グローバルにCardAnimatorインスタンスを作成して公開
const cardAnimator = new CardAnimator();

// 後方互換性のために公開（古い方法）
window.cardAnimator = cardAnimator;

// モジュールとしてエクスポート（新しい方法）
export default cardAnimator;