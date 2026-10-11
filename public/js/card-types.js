/**
 * カードの種類と収録セットの定義
 */

// カードタイプの定義
export const CARD_TYPES = {
    TREASURE: 'treasure',
    VICTORY: 'victory',
    ACTION: 'action',
    CURSE: 'curse',
    DURATION: 'duration' // 持続：次のターンの開始時まで場に残り、効果が続く
};

// 王国カードの収録セット
export const CARD_SETS = {
    BASE: 'base',
    SEASIDE: 'seaside'
};
