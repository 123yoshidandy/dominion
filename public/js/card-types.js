/**
 * カードの種類と収録セットの定義
 */

// カードタイプの定義
export const CARD_TYPES = {
    TREASURE: 'treasure',
    VICTORY: 'victory',
    ACTION: 'action',
    CURSE: 'curse',
    DURATION: 'duration', // 持続：次のターンの開始時まで場に残り、効果が続く
    REACTION: 'reaction', // リアクション（カードデータでは isReaction などで指定し、Card が types に加える）
    ATTACK: 'attack',     // アタック（カードデータでは isAttack で指定し、Card が types に加える）
    REWARD: 'reward',     // 褒賞：サプライ外の山にあり、馬上槍試合で獲得する
    KNIGHT: 'knight',     // 騎士（暗黒時代）
    RUINS: 'ruins',       // 廃墟（略奪者などで獲得させられる）
    SHELTER: 'shelter',   // 避難所（屋敷の代わりに初期デッキに入る）
    LOOTER: 'looter',     // 略奪者（サプライに廃墟の山を置く）
    COMMAND: 'command',   // 命令（サプライのカードをプレイするカード。命令のカードはプレイできない）
    RESERVE: 'reserve',   // リザーブ（酒場マットに置き、決まったときに呼び出す）
    TRAVELLER: 'traveller' // トラベラー（場から捨て札にするとき、次のカードと交換できる）
};

// 王国カードの収録セット
export const CARD_SETS = {
    BASE: 'base',
    INTRIGUE: 'intrigue',
    SEASIDE: 'seaside',
    PROSPERITY: 'prosperity',
    HINTERLANDS: 'hinterlands',
    CORNUCOPIA_GUILDS: 'cornucopia_guilds',
    ALCHEMY: 'alchemy',
    DARK_AGES: 'dark_ages',
    ADVENTURES: 'adventures'
};

// 収録セットの表示名（開始画面とロビーで使う）
export const CARD_SET_LABELS = {
    base: '基本',
    intrigue: '陰謀',
    seaside: '海辺',
    prosperity: '繁栄',
    hinterlands: '異郷',
    cornucopia_guilds: '収穫祭＆ギルド',
    alchemy: '錬金術',
    dark_ages: '暗黒時代',
    adventures: '冒険'
};

// カードではない横長の札（ランドスケープ）の種類
export const LANDSCAPE_KINDS = {
    EVENT: 'event' // イベント：購入して効果を使う
};

export const LANDSCAPE_KIND_LABELS = {
    event: 'イベント'
};
