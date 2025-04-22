/**
 * ドミニオンのカードデータ
 */

// カードタイプの定義
const CARD_TYPES = {
    TREASURE: 'treasure',
    VICTORY: 'victory',
    ACTION: 'action',
    CURSE: 'curse'
};

// 基本カードデータ
const BASIC_CARDS = {
    // 財宝カード
    COPPER: {
        id: 'copper',
        name: '銅貨',
        cost: 0,
        types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1',
        count: 60
    },
    SILVER: {
        id: 'silver',
        name: '銀貨',
        cost: 3,
        types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2',
        count: 40
    },
    GOLD: {
        id: 'gold',
        name: '金貨',
        cost: 6,
        types: [CARD_TYPES.TREASURE],
        value: 3,
        description: '財宝 +3',
        count: 30
    },
    
    // 勝利点カード
    ESTATE: {
        id: 'estate',
        name: '屋敷',
        cost: 2,
        types: [CARD_TYPES.VICTORY],
        points: 1,
        description: '勝利点 +1',
        count: 24
    },
    DUCHY: {
        id: 'duchy',
        name: '公領',
        cost: 5,
        types: [CARD_TYPES.VICTORY],
        points: 3,
        description: '勝利点 +3',
        count: 12
    },
    PROVINCE: {
        id: 'province',
        name: '属州',
        cost: 8,
        types: [CARD_TYPES.VICTORY],
        points: 6,
        description: '勝利点 +6',
        count: 12
    },
    
    // 呪いカード
    CURSE: {
        id: 'curse',
        name: '呪い',
        cost: 0,
        types: [CARD_TYPES.CURSE],
        points: -1,
        description: '勝利点 -1',
        count: 30
    }
};

// 王国カードデータ (初期セット)
const KINGDOM_CARDS = {
    // アクションカード
    VILLAGE: {
        id: 'village',
        name: '村',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 2;
            game.log(`${player.name}はカードを1枚引き、アクション+2を得ました`);
        }
    },
    SMITHY: {
        id: 'smithy',
        name: '鍛冶屋',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(3);
            game.log(`${player.name}はカードを3枚引きました`);
        }
    },
    MARKET: {
        id: 'market',
        name: '市場',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            player.buys += 1;
            player.coins += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1、購入+1、財宝+1を得ました`);
        }
    },
    LABORATORY: {
        id: 'laboratory',
        name: '研究所',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            player.actions += 1;
            game.log(`${player.name}はカードを2枚引き、アクション+1を得ました`);
        }
    },
    FESTIVAL: {
        id: 'festival',
        name: '祝祭',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +2。購入 +1。財宝 +2',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 2;
            player.buys += 1;
            player.coins += 2;
            game.log(`${player.name}はアクション+2、購入+1、財宝+2を得ました`);
        }
    },
    WOODCUTTER: {
        id: 'woodcutter',
        name: '木こり',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +2',
        count: 10,
        onPlay: (player, game) => {
            player.buys += 1;
            player.coins += 2;
            game.log(`${player.name}は購入+1、財宝+2を得ました`);
        }
    },
    CELLAR: {
        id: 'cellar',
        name: '地下室',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。任意の枚数のカードを捨て、捨てた枚数分カードを引く',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 1;
            game.log(`${player.name}はアクション+1を得ました`);
            // 捨てるカードを選択する処理は別途実装が必要
            game.promptDiscardForBenefit(player, 'cellar', (discardCount) => {
                player.drawCards(discardCount);
                game.log(`${player.name}は${discardCount}枚のカードを捨て、${discardCount}枚のカードを引きました`);
            });
        }
    },
    MOAT: {
        id: 'moat',
        name: 'お堀',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。攻撃が指定された時、このカードを公開することでその攻撃を無視できる',
        isReaction: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
        },
        onReact: (player, game, attacker) => {
            game.log(`${player.name}はお堀を公開し、${attacker.name}の攻撃を防ぎました`);
            return true; // 攻撃を防いだことを示す
        }
    },
    CHAPEL: {
        id: 'chapel',
        name: '礼拝堂',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '最大4枚までのカードを廃棄する',
        count: 10,
        onPlay: (player, game) => {
            // 廃棄するカードを選択する処理は別途実装が必要
            game.promptTrash(player, 4, () => {
                game.log(`${player.name}はカードを廃棄しました`);
            });
        }
    },
    WITCH: {
        id: 'witch',
        name: '魔女',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。他のプレイヤーは呪いカードを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
            game.attackOtherPlayers(player, (target) => {
                if (game.supply.curse > 0) {
                    target.gainCard(BASIC_CARDS.CURSE.id);
                    game.log(`${target.name}は呪いカードを獲得しました`);
                } else {
                    game.log(`呪いカードの山札がないため、${target.name}は呪いカードを獲得しませんでした`);
                }
            });
        }
    }
};

// 全カードデータの結合
const ALL_CARDS = { ...BASIC_CARDS, ...KINGDOM_CARDS };

// カードIDの配列を生成
const ALL_CARD_IDS = Object.keys(ALL_CARDS);
const BASIC_CARD_IDS = Object.keys(BASIC_CARDS);
const KINGDOM_CARD_IDS = Object.keys(KINGDOM_CARDS);