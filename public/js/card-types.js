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
    REWARD: 'reward'      // 褒賞：サプライ外の山にあり、馬上槍試合で獲得する
};

// 王国カードの収録セット
export const CARD_SETS = {
    BASE: 'base',
    INTRIGUE: 'intrigue',
    SEASIDE: 'seaside',
    PROSPERITY: 'prosperity',
    HINTERLANDS: 'hinterlands',
    CORNUCOPIA_GUILDS: 'cornucopia_guilds'
};

// 収録セットの表示名（開始画面とロビーで使う）
export const CARD_SET_LABELS = {
    base: '基本',
    intrigue: '陰謀',
    seaside: '海辺',
    prosperity: '繁栄',
    hinterlands: '異郷',
    cornucopia_guilds: '収穫祭＆ギルド'
};
