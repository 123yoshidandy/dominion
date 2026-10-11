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
        this.effectQueue = [];     // カード効果のまだ実行していない手順（選択待ちの後に続きを進める）
        
        // プレイヤーの作成（名前の文字列か { name, isCPU } を受け付ける）
        playerNames.forEach((config, index) => {
            const { name, isCPU = false } = typeof config === 'string' ? { name: config } : config;
            const player = new Player(name, index, isCPU);
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
                // 庭園など勝利点の王国カードは、公領・属州と同じ枚数にする
                const isVictory = ALL_CARDS[upperCardId].types.includes(CARD_TYPES.VICTORY);
                this.supply[cardId] = isVictory ? victoryCardCount : ALL_CARDS[upperCardId].count;
            } else {
                console.error(`カードデータが見つかりません: ${upperCardId}`);
            }
        });
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
        this.processEffects();

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
    
    // ===== カード効果の手順 =====
    // 効果は「手順」の列として処理し、プレイヤーの選択待ちの間は止めて、答えが出たら続きを進める
    
    // 手順を列の先頭に積む（渡した順に、残っている手順より先に実行される）
    runNext(...steps) {
        this.effectQueue.unshift(...steps);
    }
    
    // 選択待ちになるか、手順がなくなるまで効果を進める
    processEffects() {
        while (!this.pendingPrompt && this.effectQueue.length > 0) {
            const step = this.effectQueue.shift();
            step();
        }
    }
    
    // 指定したプレイヤーの次の席から順に並べた、他のプレイヤー
    getOtherPlayers(player) {
        const start = this.players.indexOf(player);
        return this.players
            .map((_, i) => this.players[(start + 1 + i) % this.players.length])
            .slice(0, -1);
    }
    
    // 他のプレイヤーに攻撃効果を適用する（1人ずつ順番に。選択待ちになればそこで止まる）
    attackOtherPlayers(attacker, attackEffect) {
        this.runNext(...this.getOtherPlayers(attacker).map(target => () => {
            if (!this.isProtectedFromAttack(target, attacker)) {
                attackEffect(target);
            }
        }));
    }
    
    // お堀などのリアクションで攻撃を防げるか（リアクションカードを持っていれば常に公開する）
    isProtectedFromAttack(target, attacker) {
        const reaction = target.hand.find(card => card.isReaction);
        return reaction ? reaction.react(target, this, attacker) : false;
    }
    
    // 手札の指定したカードを捨て札にする（大きい番号から抜いて、番号がずれないようにする）
    discardFromHand(player, indices) {
        [...indices].sort((a, b) => b - a).forEach(index => player.discardCard(index));
    }
    
    // 手札の指定したカードを廃棄し、廃棄したカードを返す
    trashFromHand(player, indices) {
        return [...indices]
            .sort((a, b) => b - a)
            .map(index => player.trashCard(index))
            .filter(Boolean)
            .map(card => {
                this.trash.push(card);
                return card;
            });
    }
    
    // ===== プレイヤーの選択 =====
    
    // cards の中から min〜max 枚を選ばせる。callback には選んだ cards のインデックスの配列が渡る
    promptSelect({ player, cards, min = 0, max = cards.length, title, message, confirmLabel = '決定', purpose, callback }) {
        this.setPrompt({
            type: 'select',
            player,
            cards,
            min: Math.min(min, cards.length),
            max: Math.min(max, cards.length),
            title,
            message,
            confirmLabel,
            purpose,
            callback
        });
    }
    
    // はい／いいえで答えさせる。callback には真偽値が渡る
    promptConfirm({ player, card = null, title, message, yesLabel = 'はい', noLabel = 'いいえ', purpose, callback }) {
        this.setPrompt({ type: 'confirm', player, card, title, message, yesLabel, noLabel, purpose, callback });
    }
    
    // サプライからコスト maxCost 以下のカードを1枚選んで獲得させる（filter でカードの種類を絞れる）
    promptGain({ player, maxCost, filter = () => true, destination = 'discard', title, message, purpose = 'gain' }) {
        const candidates = Object.keys(this.supply)
            .filter(cardId => this.supply[cardId] > 0)
            .map(cardId => ALL_CARDS[cardId.toUpperCase()])
            .filter(data => data && data.cost <= maxCost && filter(data))
            .sort((a, b) => b.cost - a.cost);
        
        if (candidates.length === 0) {
            this.log(`${player.name}が獲得できるカードはありませんでした`);
            return;
        }
        
        this.promptSelect({
            player,
            cards: candidates.map(data => new Card(data)),
            min: 1,
            max: 1,
            title,
            message,
            confirmLabel: '獲得する',
            purpose,
            callback: ([index]) => {
                const data = candidates[index];
                this.gainCardFromSupply(player, data.id, destination);
                this.log(`${player.name}は${data.name}を獲得しました`);
            }
        });
    }
    
    // 選択待ちにしてUIに知らせる。答えは resolvePrompt で受け取る
    setPrompt(prompt) {
        this.pendingPrompt = prompt;
        
        if (this.callbacks.onPrompt) {
            this.callbacks.onPrompt(prompt);
        }
    }
    
    // 選択待ちに答える。select はインデックスの配列、confirm は真偽値
    // 枚数が条件に合わない答えは受け付けずに false を返す
    resolvePrompt(answer) {
        const prompt = this.pendingPrompt;
        if (!prompt) return false;
        
        if (prompt.type === 'select') {
            const indices = [...new Set(answer)]
                .filter(index => Number.isInteger(index) && index >= 0 && index < prompt.cards.length);
            
            if (indices.length < prompt.min || indices.length > prompt.max) {
                this.log(prompt.min === prompt.max
                    ? `${prompt.min}枚選んでください`
                    : `${prompt.min}〜${prompt.max}枚選んでください`);
                return false;
            }
            
            this.pendingPrompt = null;
            prompt.callback(indices);
        } else {
            this.pendingPrompt = null;
            prompt.callback(Boolean(answer));
        }
        
        this.processEffects();
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