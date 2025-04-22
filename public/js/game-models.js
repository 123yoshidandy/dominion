/**
 * ドミニオンのゲームモデル
 */

// カードクラス
class Card {
    constructor(cardData) {
        this.id = cardData.id;
        this.name = cardData.name;
        this.cost = cardData.cost;
        this.types = cardData.types;
        this.description = cardData.description;
        
        // 財宝カード特有のプロパティ
        if (cardData.value !== undefined) {
            this.value = cardData.value;
        }
        
        // 勝利点カード特有のプロパティ
        if (cardData.points !== undefined) {
            this.points = cardData.points;
        }
        
        // アクションカード特有のプロパティ
        if (cardData.onPlay) {
            this.onPlay = cardData.onPlay;
        }
        
        // リアクションカード特有のプロパティ
        if (cardData.isReaction) {
            this.isReaction = true;
            this.onReact = cardData.onReact;
        }
        
        // 攻撃カード特有のプロパティ
        if (cardData.isAttack) {
            this.isAttack = true;
        }
    }
    
    // カードのタイプをチェックするユーティリティメソッド
    isType(type) {
        return this.types.includes(type);
    }
    
    // カードをプレイする
    play(player, game) {
        if (this.onPlay) {
            this.onPlay(player, game);
        }
    }
    
    // 攻撃に対する反応を処理する
    react(player, game, attacker) {
        if (this.isReaction && this.onReact) {
            return this.onReact(player, game, attacker);
        }
        return false;
    }
}

// プレイヤークラス
class Player {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.hand = [];      // 手札
        this.deck = [];      // 山札
        this.discard = [];   // 捨て札
        this.playArea = [];  // プレイエリア
        this.actions = 0;    // アクション数
        this.buys = 0;       // 購入数
        this.coins = 0;      // コイン数
    }
    
    // 初期デッキを作成
    createInitialDeck() {
        // 初期デッキは銅貨7枚と屋敷3枚
        for (let i = 0; i < 7; i++) {
            this.deck.push(new Card(ALL_CARDS.COPPER));
        }
        for (let i = 0; i < 3; i++) {
            this.deck.push(new Card(ALL_CARDS.ESTATE));
        }
        
        // デッキをシャッフル
        this.shuffleDeck();
    }
    
    // デッキをシャッフル
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    // カードを引く（指定枚数）
    drawCards(count) {
        const drawnCards = [];
        
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                // 山札が空の場合、捨て札を山札に戻してシャッフル
                if (this.discard.length === 0) {
                    // 捨て札も空なら引けない
                    break;
                }
                
                this.deck = [...this.discard];
                this.discard = [];
                this.shuffleDeck();
            }
            
            // 山札の一番上のカードを手札に加える
            if (this.deck.length > 0) {
                const card = this.deck.shift();
                this.hand.push(card);
                drawnCards.push(card);
            }
        }
        
        return drawnCards;
    }
    
    // カードを捨てる
    discardCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            const card = this.hand.splice(cardIndex, 1)[0];
            this.discard.push(card);
            return card;
        }
        return null;
    }
    
    // カードを廃棄する（サプライに戻す）
    trashCard(cardIndex) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            return this.hand.splice(cardIndex, 1)[0];
        }
        return null;
    }
    
    // カードをプレイする
    playCard(cardIndex, game) {
        if (cardIndex >= 0 && cardIndex < this.hand.length) {
            const card = this.hand.splice(cardIndex, 1)[0];
            this.playArea.push(card);
            
            // カードの効果を適用
            card.play(this, game);
            
            return card;
        }
        return null;
    }
    
    // カードを獲得する（サプライから）
    gainCard(cardId, destination = 'discard') {
        const card = new Card(ALL_CARDS[cardId]);
        
        if (destination === 'hand') {
            this.hand.push(card);
        } else if (destination === 'deck') {
            this.deck.unshift(card); // 山札の一番上に置く
        } else {
            this.discard.push(card); // デフォルトは捨て札に加える
        }
        
        return card;
    }
    
    // 手札の財宝カードをすべてプレイ
    playAllTreasures(game) {
        const treasureIndices = [];
        
        // 手札から財宝カードのインデックスを見つける
        this.hand.forEach((card, index) => {
            if (card.isType(CARD_TYPES.TREASURE)) {
                treasureIndices.push(index);
            }
        });
        
        // インデックスの大きい順に処理（小さいインデックスが削除されても問題ないように）
        treasureIndices.sort((a, b) => b - a).forEach(index => {
            const card = this.hand.splice(index, 1)[0];
            this.playArea.push(card);
            this.coins += card.value;
        });
        
        return treasureIndices.length;
    }
    
    // クリーンアップフェーズ
    cleanup() {
        // 手札と場のカードをすべて捨て札にする
        this.discard.push(...this.hand, ...this.playArea);
        this.hand = [];
        this.playArea = [];
        
        // 新しいターンのために5枚引く
        this.drawCards(5);
        
        // アクション、購入、コインをリセット
        this.actions = 1;
        this.buys = 1;
        this.coins = 0;
    }
    
    // プレイヤーの勝利点を計算
    calculateVictoryPoints() {
        let points = 0;
        
        // すべてのカード（手札、山札、捨て札、場のカード）を調べる
        const allCards = [...this.hand, ...this.deck, ...this.discard, ...this.playArea];
        
        allCards.forEach(card => {
            if (card.points !== undefined) {
                points += card.points;
            }
        });
        
        return points;
    }
}

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
        this.supply.estate = BASIC_CARDS.ESTATE.count;
        this.supply.duchy = victoryCardCount;
        this.supply.province = victoryCardCount;
        
        // 呪いカードの枚数を調整
        this.supply.curse = (this.players.length - 1) * 10;
        
        // 王国カードをランダムに10種類選ぶ
        this.selectedKingdomCards = this.selectRandomKingdomCards(10);
        
        // 選んだ王国カードをサプライに追加
        this.selectedKingdomCards.forEach(cardId => {
            this.supply[cardId] = ALL_CARDS[cardId].count;
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
            selectedCards.push(cardId);
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
    
    // アクションカードをプレイ
    playActionCard(cardIndex) {
        const player = this.getCurrentPlayer();
        
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
        
        // アクションカードをプレイ
        player.playCard(cardIndex, this);
        player.actions--;
        
        this.log(`${player.name}は${card.name}をプレイしました`);
        
        // UIを更新するためのコールバックがあれば呼び出す
        if (this.callbacks.onStateChanged) {
            this.callbacks.onStateChanged();
        }
        
        return true;
    }
    
    // 購入フェーズに移行
    enterBuyPhase() {
        if (this.phase !== 'action') {
            return false;
        }
        
        const player = this.getCurrentPlayer();
        
        // すべての財宝カードをプレイ
        const treasuresPlayed = player.playAllTreasures(this);
        this.log(`${player.name}は財宝カードを${treasuresPlayed}枚プレイしました`);
        
        this.phase = 'buy';
        this.log('購入フェーズに移行しました');
        
        // UIを更新するためのコールバックがあれば呼び出す
        if (this.callbacks.onStateChanged) {
            this.callbacks.onStateChanged();
        }
        
        return true;
    }
    
    // カードを購入
    buyCard(cardId) {
        const player = this.getCurrentPlayer();
        
        if (this.phase !== 'buy') {
            this.log('購入フェーズではありません');
            return false;
        }
        
        if (player.buys <= 0) {
            this.log('購入回数が残っていません');
            return false;
        }
        
        // カードIDを小文字に変換してサプライチェック
        const lowerCardId = cardId.toLowerCase();
        
        if (!this.supply[lowerCardId] || this.supply[lowerCardId] <= 0) {
            this.log('選択されたカードはサプライにありません');
            console.log('サプライに存在しないカードID:', lowerCardId, 'サプライ:', this.supply);
            return false;
        }
        
        // カードIDを大文字に変換してALL_CARDSから取得
        const card = ALL_CARDS[cardId.toUpperCase()];
        
        if (!card) {
            this.log(`カードID ${cardId} は定義されていません`);
            return false;
        }
        
        if (player.coins < card.cost) {
            this.log(`${card.name}を購入するためのコインが足りません（必要: ${card.cost}, 所持: ${player.coins}）`);
            return false;
        }
        
        // カードを購入
        player.gainCard(cardId.toUpperCase());
        player.buys--;
        player.coins -= card.cost;
        this.supply[lowerCardId]--;
        
        this.log(`${player.name}は${card.name}を購入しました`);
        
        // 勝利条件をチェック
        if (this.checkGameEnd()) {
            this.endGame();
            return true;
        }
        
        // UIを更新するためのコールバックがあれば呼び出す
        if (this.callbacks.onStateChanged) {
            this.callbacks.onStateChanged();
        }
        
        return true;
    }
    
    // ターン終了
    endTurn() {
        const player = this.getCurrentPlayer();
        
        // クリーンアップフェーズ
        player.cleanup();
        this.log(`${player.name}のターンが終了しました`);
        
        // 次のプレイヤーに切り替え
        const nextPlayer = this.nextPlayer();
        nextPlayer.actions = 1;
        nextPlayer.buys = 1;
        
        this.phase = 'action';
        this.log(`${nextPlayer.name}のターンです`);
        
        // UIを更新するためのコールバックがあれば呼び出す
        if (this.callbacks.onStateChanged) {
            this.callbacks.onStateChanged();
        }
        
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
        // 実際の実装ではUIと連携して選択インターフェースを表示する
        // ここではコールバックを登録して後で呼び出せるようにする
        this.callbacks.onDiscardPrompt = { player, cardId, callback };
    }
    
    // 礼拝堂などで廃棄するカードを選ぶプロンプト
    promptTrash(player, maxCount, callback) {
        // 実際の実装ではUIと連携して選択インターフェースを表示する
        // ここではコールバックを登録して後で呼び出せるようにする
        this.callbacks.onTrashPrompt = { player, maxCount, callback };
    }
    
    // コールバック関数を設定
    setCallback(name, callback) {
        this.callbacks[name] = callback;
    }
}

// クラスをグローバルスコープに公開
window.Card = Card;
window.Player = Player;
window.Game = Game;