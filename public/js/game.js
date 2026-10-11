/**
 * ドミニオンのゲームモデル
 */

import Card from './card.js';
import Player from './player.js';
import { ALL_CARDS, BASIC_CARDS, KINGDOM_CARD_IDS, CARD_TYPES } from './card-data.js';

// ゲームクラス
class Game {
    constructor(playerNames) {
        this.players = [];
        this.supply = {};   // サプライパイル
        this.trash = [];    // 廃棄置き場
        this.currentPlayerIndex = 0;
        this.phase = 'setup'; // ゲームフェーズ: setup, action, buy, cleanup
        this.logs = [];      // ゲームログ
        this.callbacks = {}; // コールバック関数
        this.pendingPrompt = null; // プレイヤーの選択待ち（地下室・礼拝堂など）
        
        // プレイヤーの作成
        playerNames.forEach((name, index) => {
            const player = new Player(name, index);
            this.players.push(player);
        });
    }
    
    // ゲーム開始の準備
    setup() {
        // サプライパイルの初期化
        this.initializeSupply();
        
        // 各プレイヤーの初期デッキを作成して5枚引く
        this.players.forEach(player => {
            player.createInitialDeck();
            player.drawCards(5);
        });
        
        // 最初のプレイヤーを設定
        this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
        
        // ゲームフェーズをアクションフェーズに変更
        this.phase = 'action';
        this.getCurrentPlayer().actions = 1;
        this.getCurrentPlayer().buys = 1;
        
        this.log('ゲームが開始されました');
        this.log(`${this.getCurrentPlayer().name}のターンです`);
    }
    
    // サプライパイルの初期化
    initializeSupply() {
        // 基本カードをサプライに追加
        this.supply.copper = BASIC_CARDS.COPPER.count;
        this.supply.silver = BASIC_CARDS.SILVER.count;
        this.supply.gold = BASIC_CARDS.GOLD.count;
        
        // プレイヤー数に応じて勝利点カードの枚数を調整
        const victoryCardCount = this.players.length <= 2 ? 8 : 12;
        this.supply.estate = victoryCardCount;
        this.supply.duchy = victoryCardCount;
        this.supply.province = victoryCardCount;
        
        // 呪いカードの枚数を調整
        this.supply.curse = (this.players.length - 1) * 10;
        
        // 王国カードをランダムに10種類選ぶ
        this.selectedKingdomCards = this.selectRandomKingdomCards(10);
        
        // 選んだ王国カードをサプライに追加
        this.selectedKingdomCards.forEach(cardId => {
            // 小文字のIDでサプライに追加し、大文字のIDでカードデータを参照
            const upperCardId = cardId.toUpperCase();
            if (ALL_CARDS[upperCardId]) {
                this.supply[cardId] = ALL_CARDS[upperCardId].count;
                console.log(`サプライに追加: ${cardId}, 枚数: ${ALL_CARDS[upperCardId].count}`);
            } else {
                console.error(`カードデータが見つかりません: ${upperCardId}`);
            }
        });
        
        console.log('初期化されたサプライ:', this.supply);
    }
    
    // 王国カードをランダムに選ぶ
    selectRandomKingdomCards(count) {
        const kingdomCardIds = [...KINGDOM_CARD_IDS];
        const selectedCards = [];
        
        for (let i = 0; i < count; i++) {
            if (kingdomCardIds.length === 0) break;
            
            const randomIndex = Math.floor(Math.random() * kingdomCardIds.length);
            const cardId = kingdomCardIds.splice(randomIndex, 1)[0];
            // 小文字に変換して返す
            selectedCards.push(cardId.toLowerCase());
        }
        
        console.log('選択された王国カード:', selectedCards);
        return selectedCards;
    }
    
    // 現在のプレイヤーを取得
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    // 次のプレイヤーに切り替える
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        return this.getCurrentPlayer();
    }
    
    // ゲームログを追加
    log(message) {
        const logEntry = {
            message,
            timestamp: new Date().toISOString()
        };
        this.logs.push(logEntry);
        
        // UIに通知するためのコールバックがあれば呼び出す
        if (this.callbacks.onLog) {
            this.callbacks.onLog(logEntry);
        }
    }
    
    // 選択待ちの間は他の操作を受け付けない
    isAwaitingPrompt() {
        if (this.pendingPrompt) {
            this.log('カードの選択を完了してください');
            return true;
        }
        return false;
    }

    // UIを更新するためのコールバックがあれば呼び出す
    notifyStateChanged() {
        if (this.callbacks.onStateChanged) {
            this.callbacks.onStateChanged();
        }
    }

    // アクションカードをプレイ
    playActionCard(cardIndex) {
        const player = this.getCurrentPlayer();

        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'action') {
            this.log('アクションフェーズではありません');
            return false;
        }
        
        if (player.actions <= 0) {
            this.log('アクションが残っていません');
            return false;
        }
        
        const card = player.hand[cardIndex];
        
        if (!card || !card.isType(CARD_TYPES.ACTION)) {
            this.log('選択されたカードはアクションカードではありません');
            return false;
        }
        
        // アクションカードをプレイ（効果のログより先にプレイしたことを記録する）
        player.actions--;
        this.log(`${player.name}は${card.name}をプレイしました`);
        player.playCard(cardIndex, this);

        this.notifyStateChanged();

        return true;
    }

    // 購入フェーズに移行
    enterBuyPhase() {
        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'action') {
            return false;
        }
        
        const player = this.getCurrentPlayer();
        
        // すべての財宝カードをプレイ
        const treasuresPlayed = player.playAllTreasures(this);
        this.log(`${player.name}は財宝カードを${treasuresPlayed}枚プレイしました`);
        
        this.phase = 'buy';
        this.log('購入フェーズに移行しました');

        this.notifyStateChanged();

        return true;
    }

    // サプライからカードを獲得する（サプライの枚数を減らす）
    gainCardFromSupply(player, cardId, destination = 'discard') {
        const lowerCardId = cardId.toLowerCase();

        if (!this.supply[lowerCardId] || this.supply[lowerCardId] <= 0) {
            return null;
        }

        this.supply[lowerCardId]--;
        return player.gainCard(cardId, destination);
    }

    // カードを購入
    buyCard(cardId) {
        const player = this.getCurrentPlayer();

        if (this.isAwaitingPrompt()) {
            return false;
        }

        if (this.phase !== 'buy') {
            this.log('購入フェーズではありません');
            return false;
        }

        if (player.buys <= 0) {
            this.log('購入回数が残っていません');
            return false;
        }

        // ALL_CARDSには大文字のID、サプライには小文字のIDで参照する
        const upperCardId = cardId.toUpperCase();
        const lowerCardId = cardId.toLowerCase();

        if (!this.supply[lowerCardId] || this.supply[lowerCardId] <= 0) {
            this.log('選択されたカードはサプライにありません');
            return false;
        }

        const card = ALL_CARDS[upperCardId];

        if (!card) {
            this.log(`カードID ${cardId} は定義されていません`);
            return false;
        }

        if (player.coins < card.cost) {
            this.log(`${card.name}を購入するためのコインが足りません（必要: ${card.cost}, 所持: ${player.coins}）`);
            return false;
        }

        // カードを購入
        this.gainCardFromSupply(player, upperCardId);
        player.buys--;
        player.coins -= card.cost;

        this.log(`${player.name}は${card.name}を購入しました`);

        this.notifyStateChanged();

        return true;
    }

    // ターン終了
    endTurn() {
        if (this.phase === 'end' || this.isAwaitingPrompt()) {
            return false;
        }

        const player = this.getCurrentPlayer();

        // クリーンアップフェーズ
        player.cleanup();
        this.log(`${player.name}のターンが終了しました`);

        // ゲーム終了条件はターン終了時にチェックする
        if (this.checkGameEnd()) {
            this.endGame();
            this.notifyStateChanged();
            return true;
        }

        // 次のプレイヤーに切り替え
        const nextPlayer = this.nextPlayer();
        nextPlayer.actions = 1;
        nextPlayer.buys = 1;

        this.phase = 'action';
        this.log(`${nextPlayer.name}のターンです`);

        this.notifyStateChanged();

        return true;
    }
    
    // ゲーム終了条件をチェック
    checkGameEnd() {
        // 属州の山札が空になったらゲーム終了
        if (this.supply.province <= 0) {
            return true;
        }
        
        // 3つ以上の山札が空になったらゲーム終了
        let emptyPiles = 0;
        for (const cardId in this.supply) {
            if (this.supply[cardId] <= 0) {
                emptyPiles++;
                if (emptyPiles >= 3) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // ゲーム終了処理
    endGame() {
        this.phase = 'end';
        
        // 各プレイヤーの勝利点を計算
        const scores = this.players.map(player => {
            const points = player.calculateVictoryPoints();
            return { player, points };
        });
        
        // 勝利点が高い順にソート
        scores.sort((a, b) => b.points - a.points);
        
        this.log('ゲームが終了しました');
        
        // 結果をログに記録
        scores.forEach((score, index) => {
            this.log(`${index + 1}位: ${score.player.name} - ${score.points}点`);
        });
        
        // 勝者を記録
        this.winner = scores[0].player;
        
        // UIに通知するためのコールバックがあれば呼び出す
        if (this.callbacks.onGameEnd) {
            this.callbacks.onGameEnd(scores);
        }
    }
    
    // 他のプレイヤーに攻撃効果を適用
    attackOtherPlayers(attacker, attackEffect) {
        this.players.forEach(player => {
            // 攻撃者以外のプレイヤーに効果を適用
            if (player.id !== attacker.id) {
                // お堀などのリアクションカードがあるかチェック
                const isProtected = player.hand.some(card => {
                    if (card.isReaction) {
                        // リアクションカードを使うか確認
                        if (this.promptReaction(player, card, attacker)) {
                            return card.react(player, this, attacker);
                        }
                    }
                    return false;
                });
                
                // 守られていなければ攻撃効果を適用
                if (!isProtected) {
                    attackEffect(player);
                }
            }
        });
    }
    
    // プレイヤーにリアクションカードの使用を確認
    promptReaction(player, card, attacker) {
        // 実際の実装ではUIと連携して確認ダイアログを表示する
        // ここではシンプルに常に使用すると仮定
        return true;
    }
    
    // 地下室などで捨てるカードを選ぶプロンプト
    promptDiscardForBenefit(player, cardId, callback) {
        this.pendingPrompt = { type: 'discard', player, cardId, callback };

        // 選択待ちをUIに通知する。結果は resolvePrompt で受け取る
        if (this.callbacks.onDiscardPrompt) {
            this.callbacks.onDiscardPrompt(this.pendingPrompt);
        }
    }

    // 礼拝堂などで廃棄するカードを選ぶプロンプト
    promptTrash(player, maxCount, callback) {
        this.pendingPrompt = { type: 'trash', player, maxCount, callback };

        // 選択待ちをUIに通知する。結果は resolvePrompt で受け取る
        if (this.callbacks.onTrashPrompt) {
            this.callbacks.onTrashPrompt(this.pendingPrompt);
        }
    }

    // 選択待ちを、選ばれた手札のインデックスで解決する
    resolvePrompt(selectedIndices) {
        const prompt = this.pendingPrompt;
        if (!prompt) return false;

        const { player } = prompt;

        // 不正なインデックスと重複を除き、大きい順に処理する（手札から抜いてもずれないように）
        let indices = [...new Set(selectedIndices)]
            .filter(index => index >= 0 && index < player.hand.length);
        if (prompt.type === 'trash') {
            indices = indices.slice(0, prompt.maxCount);
        }
        indices.sort((a, b) => b - a);

        this.pendingPrompt = null;

        if (prompt.type === 'discard') {
            indices.forEach(index => player.discardCard(index));
            prompt.callback(indices.length);
        } else if (prompt.type === 'trash') {
            indices.forEach(index => {
                const trashedCard = player.trashCard(index);
                if (trashedCard) {
                    this.trash.push(trashedCard);
                }
            });
            prompt.callback(indices.length);
        }

        this.notifyStateChanged();

        return true;
    }
    
    // コールバック関数を設定
    setCallback(name, callback) {
        this.callbacks[name] = callback;
    }
}

// クラスをエクスポート
export default Game;