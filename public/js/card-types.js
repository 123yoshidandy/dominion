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
    TRAVELLER: 'traveller', // トラベラー（場から捨て札にするとき、次のカードと交換できる）
    CASTLE: 'castle',     // 城（帝国。城の山は安い順に重ねる）
    GATHERING: 'gathering', // 集合（帝国。山に勝利点トークンをためる）
    NIGHT: 'night',       // 夜（夜想曲。夜フェイズにアクションを使わずにプレイする）
    HEIRLOOM: 'heirloom', // 家宝（初期デッキの銅貨の代わりに入る）
    FATE: 'fate',         // 運命（祝福を使う）
    DOOM: 'doom',         // 呪い（呪詛を使う）
    SPIRIT: 'spirit',     // 精霊（サプライ外の山）
    ZOMBIE: 'zombie'      // ゾンビ（最初から廃棄置き場にある）
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
    ADVENTURES: 'adventures',
    EMPIRES: 'empires',
    NOCTURNE: 'nocturne',
    RENAISSANCE: 'renaissance'
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
    adventures: '冒険',
    empires: '帝国',
    nocturne: '夜想曲',
    renaissance: 'ルネサンス'
};

// カードではない横長の札（ランドスケープ）の種類
export const LANDSCAPE_KINDS = {
    EVENT: 'event',      // イベント：購入して効果を使う
    LANDMARK: 'landmark', // ランドマーク：得点や、獲得などのきっかけで効果がある（購入しない）
    PROJECT: 'project'   // プロジェクト：購入すると自分のキューブを置き、以後ずっと効果がある（1人1回）
};

export const LANDSCAPE_KIND_LABELS = {
    event: 'イベント',
    landmark: 'ランドマーク',
    project: 'プロジェクト',
    boon: '祝福'
};
