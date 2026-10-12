/** 拡張「異郷」（第2版）のカードイラスト */

import { svg, ground, coin } from './card-art-helpers.js';

export const HINTERLANDS_ART = {
    // ===== コスト2 =====
    // 岐路：分かれ道と道しるべ
    crossroads: svg(`
        ${ground()}
        <path d="M20 32 L24 18 L6 12 L4 15 L20 20 L16 32 Z" fill="#d9c39a"/>
        <path d="M28 32 L24 18 L42 12 L44 15 L28 20 L32 32 Z" fill="#d9c39a"/>
        <rect x="23" y="4" width="2" height="16" fill="#8b5a2b"/>
        <path d="M25 6 h10 l3 2.5 l-3 2.5 h-10 z" fill="#c8a165" stroke="#8b6b4a" stroke-width="0.6"/>
        <path d="M23 11 h-10 l-3 2.5 l3 2.5 h10 z" fill="#c8a165" stroke="#8b6b4a" stroke-width="0.6"/>
    `),
    // 愚者の黄金：くすんだ黄鉄鉱のコイン
    fools_gold: coin('#d4b45a', '#8a7a2a', '#efe1a0', `
        <path d="M18 18 l4 -6 l4 6 l4 -6" fill="none" stroke="#8a7a2a" stroke-width="1"/>
        <path d="M40 5 l1 2.5 l2.5 1 l-2.5 1 l-1 2.5 l-1 -2.5 l-2.5 -1 l2.5 -1z" fill="#efe1a0" opacity="0.6"/>
    `),

    // ===== コスト3 =====
    // 開発：上下の矢印と建物
    develop: svg(`
        ${ground()}
        <rect x="16" y="14" width="16" height="13" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M13 14 L24 6 L35 14 Z" fill="#b5523b"/>
        <path d="M6 22 V10 M3 13 L6 9 L9 13" fill="none" stroke="#27ae60" stroke-width="2" stroke-linecap="round"/>
        <path d="M42 8 V20 M39 17 L42 21 L45 17" fill="none" stroke="#c0392b" stroke-width="2" stroke-linecap="round"/>
    `),
    // 番犬：座った犬
    guard_dog: svg(`
        ${ground()}
        <ellipse cx="22" cy="21" rx="9" ry="6" fill="#a0703c"/>
        <rect x="15" y="22" width="3" height="5" fill="#8b5a2b"/>
        <rect x="26" y="22" width="3" height="5" fill="#8b5a2b"/>
        <circle cx="32" cy="13" r="5" fill="#a0703c"/>
        <path d="M30 9 l-2 -5 l4 3 z" fill="#6b4423"/>
        <path d="M35 14 h4 l-1 2 h-3 z" fill="#6b4423"/>
        <circle cx="33" cy="12" r="0.9" fill="#2b2620"/>
        <path d="M13 19 q-5 -3 -4 -8" fill="none" stroke="#a0703c" stroke-width="2" stroke-linecap="round"/>
        <rect x="28" y="16" width="6" height="2" fill="#c0392b"/>
    `),
    // オアシス：ヤシの木と水たまり
    oasis: svg(`
        ${ground('#e3c98f')}
        <ellipse cx="28" cy="27" rx="13" ry="3" fill="#5dade2"/>
        <path d="M16 27 Q15 17 18 8" fill="none" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M18 8 Q11 5 6 10 M18 8 Q24 3 30 7 M18 8 Q13 11 11 17 M18 8 Q24 9 27 15" fill="none" stroke="#3f8a4c" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="40" cy="7" r="3.5" fill="#f7dc6f"/>
    `),
    // 策略：巻物の計画書と羽根ペン
    scheme: svg(`
        <rect x="8" y="7" width="26" height="19" rx="1" fill="#f5ecd7" stroke="#a0703c"/>
        <path d="M12 12 h14 M12 16 h18 M12 20 h10" stroke="#8b6b4a" stroke-width="1"/>
        <path d="M24 20 l4 -3 l3 3" fill="none" stroke="#c0392b" stroke-width="1"/>
        <path d="M44 3 Q34 8 32 22 Q38 12 44 3 Z" fill="#fdfefe" stroke="#7f8c8d" stroke-width="0.6"/>
        <line x1="44" y1="3" x2="31" y2="25" stroke="#7f8c8d" stroke-width="0.8"/>
    `),
    // 坑道：岩山に開いた坑道の入口
    tunnel: svg(`
        ${ground('#9c9c8c')}
        <path d="M2 27 L12 8 L22 4 L36 6 L46 27 Z" fill="#8d8478" stroke="#6b6555"/>
        <path d="M16 27 v-9 a8 8 0 0 1 16 0 v9 z" fill="#2b2620"/>
        <path d="M16 27 v-9 a8 8 0 0 1 16 0 v9" fill="none" stroke="#8b5a2b" stroke-width="2"/>
        <circle cx="22" cy="24" r="1.8" fill="#f2c14e"/>
        <circle cx="26" cy="23" r="1.5" fill="#f2c14e"/>
    `),

    // ===== コスト4 =====
    // よろず屋：道具がいろいろ入った箱
    jack_of_all_trades: svg(`
        <rect x="8" y="16" width="32" height="12" rx="1" fill="#a0703c" stroke="#6b4423"/>
        <line x1="14" y1="16" x2="12" y2="4" stroke="#8b5a2b" stroke-width="2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" fill="#7f8c8d" transform="rotate(-10 12 4)"/>
        <line x1="22" y1="16" x2="24" y2="5" stroke="#7f8c8d" stroke-width="2"/>
        <circle cx="24" cy="5" r="2.5" fill="none" stroke="#7f8c8d" stroke-width="1.5"/>
        <path d="M30 16 l4 -10 l2 1 l-4 9" fill="#bdc3c7" stroke="#7f8c8d" stroke-width="0.6"/>
        <circle cx="38" cy="12" r="3" fill="#c9ced6" stroke="#7e858f"/>
    `),
    // 遊牧民：テントとラクダ
    nomads: svg(`
        ${ground('#e3c98f')}
        <path d="M4 27 L14 10 L24 27 Z" fill="#c0623b" stroke="#7b3f2a"/>
        <path d="M12 27 L14 20 L16 27 Z" fill="#7b3f2a"/>
        <path d="M28 20 q3 -7 6 -2 q3 -6 6 0 h2 q1 -6 4 -5 l-1 4 q-2 1 -2 3 v1 z" fill="#c8a165"/>
        <path d="M30 20 v7 M34 20 v7 M38 20 v7 M42 20 v7" stroke="#a0703c" stroke-width="1.5"/>
    `),
    // 香辛料商人：色とりどりの香辛料の袋
    spice_merchant: svg(`
        <path d="M5 28 q-2 -10 4 -14 h8 q6 4 4 14 z" fill="#e67e22" stroke="#a0522d"/>
        <path d="M18 28 q-2 -12 5 -16 h6 q7 4 5 16 z" fill="#c0392b" stroke="#7b241c"/>
        <path d="M33 28 q-2 -9 3 -12 h5 q6 3 4 12 z" fill="#f1c40f" stroke="#b7950b"/>
        <ellipse cx="13" cy="14" rx="4" ry="1.5" fill="#d35400"/>
        <ellipse cx="26" cy="12" rx="3.5" ry="1.5" fill="#922b21"/>
        <ellipse cx="38.5" cy="16" rx="3" ry="1.2" fill="#d4ac0d"/>
    `),
    // 交易商：天秤の上の荷物と銀貨
    trader: svg(`
        <line x1="24" y1="5" x2="24" y2="28" stroke="#8b5a2b" stroke-width="2"/>
        <rect x="17" y="27" width="14" height="3" rx="1" fill="#8b5a2b"/>
        <line x1="8" y1="9" x2="40" y2="9" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M4 18 h12 a6 3 0 0 1 -12 0 Z M32 18 h12 a6 3 0 0 1 -12 0 Z" fill="#c9971f"/>
        <path d="M10 9 L4 18 M10 9 L16 18 M38 9 L32 18 M38 9 L44 18" stroke="#7f8c8d" stroke-width="0.6"/>
        <rect x="6" y="11" width="8" height="7" fill="#c8a165" stroke="#8b6b4a" stroke-width="0.6"/>
        <circle cx="36" cy="16" r="2.4" fill="#c9ced6" stroke="#7e858f"/>
        <circle cx="40" cy="16" r="2.4" fill="#c9ced6" stroke="#7e858f"/>
    `),
    // 小道：森の中の曲がりくねった道
    trail: svg(`
        ${ground('#6f9a55')}
        <path d="M18 32 Q30 26 22 20 Q14 15 26 10 Q32 8 30 4" fill="none" stroke="#d9c39a" stroke-width="4" stroke-linecap="round"/>
        <path d="M6 24 l4 -12 l4 12 z M38 20 l4 -13 l4 13 z M40 30 l3 -9 l3 9 z" fill="#3f8a4c"/>
        <path d="M8 27 v-3 M42 23 v-3" stroke="#6b4423" stroke-width="1.5"/>
    `),
    // 織工：織機と布
    weaver: svg(`
        <rect x="8" y="4" width="3" height="24" fill="#8b5a2b"/>
        <rect x="37" y="4" width="3" height="24" fill="#8b5a2b"/>
        <rect x="8" y="4" width="32" height="3" fill="#a0703c"/>
        <path d="M14 7 V22 M18 7 V22 M22 7 V22 M26 7 V22 M30 7 V22 M34 7 V22" stroke="#d5d8dc" stroke-width="0.8"/>
        <rect x="11" y="15" width="26" height="9" fill="#2e86c1"/>
        <path d="M11 18 h26 M11 21 h26" stroke="#aed6f1" stroke-width="0.8"/>
        <ellipse cx="24" cy="12" rx="6" ry="1.5" fill="#c8a165" stroke="#8b6b4a" stroke-width="0.6"/>
    `),

    // ===== コスト5 =====
    // 狂戦士：角付きの兜と斧
    berserker: svg(`
        <path d="M12 22 v-6 a9 9 0 0 1 18 0 v6 z" fill="#7f8c8d" stroke="#4a4f57"/>
        <rect x="11" y="21" width="20" height="3" fill="#5d646d"/>
        <path d="M12 14 Q5 12 6 4 Q9 10 14 11 Z M30 14 Q37 12 36 4 Q33 10 28 11 Z" fill="#f5ecd7" stroke="#a0703c" stroke-width="0.6"/>
        <rect x="19" y="15" width="4" height="9" fill="#4a4f57"/>
        <line x1="40" y1="8" x2="40" y2="30" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M40 9 Q47 12 46 19 L40 16 Z" fill="#bdc3c7" stroke="#7f8c8d" stroke-width="0.6"/>
    `),
    // 地図職人：広げた地図とコンパス
    cartographer: svg(`
        <path d="M4 8 L16 5 L30 8 L44 5 V25 L30 28 L16 25 L4 28 Z" fill="#f5ecd7" stroke="#a0703c"/>
        <path d="M16 5 V25 M30 8 V28" stroke="#d9c39a" stroke-width="0.8"/>
        <path d="M7 20 Q12 12 20 16 T36 12" fill="none" stroke="#2e86c1" stroke-width="1.2"/>
        <path d="M34 19 l2 3 l3 -1 l-2 -3 z" fill="#3f8a4c"/>
        <path d="M9 11 l4 4 M13 11 l-4 4" stroke="#c0392b" stroke-width="1.2"/>
    `),
    // 大釜：煮え立つ緑色の大釜
    cauldron: svg(`
        <path d="M10 13 h28 q0 14 -14 14 q-14 0 -14 -14 z" fill="#2b2620"/>
        <rect x="8" y="11" width="32" height="3" rx="1.5" fill="#4a4f57"/>
        <ellipse cx="24" cy="12" rx="13" ry="2" fill="#58d68d"/>
        <circle cx="18" cy="8" r="2" fill="#82e0aa"/>
        <circle cx="26" cy="5" r="1.6" fill="#82e0aa"/>
        <circle cx="31" cy="8" r="1.2" fill="#82e0aa"/>
        <path d="M14 27 l-2 4 M34 27 l2 4" stroke="#2b2620" stroke-width="2"/>
        <path d="M18 31 q3 -4 6 0 q3 -4 6 0" fill="#e67e22"/>
    `),
    // 値切り屋：手と値札
    haggler: svg(`
        <path d="M6 10 h18 l6 6 l-6 6 h-18 z" fill="#f5ecd7" stroke="#a0703c"/>
        <circle cx="25" cy="16" r="1.5" fill="#a0703c"/>
        <path d="M10 14 h8 M10 18 h6" stroke="#c0392b" stroke-width="1.2"/>
        <line x1="9" y1="12" x2="19" y2="20" stroke="#c0392b" stroke-width="1"/>
        <circle cx="38" cy="12" r="4" fill="#f2c14e" stroke="#b8860b"/>
        <circle cx="36" cy="22" r="3.5" fill="#c9ced6" stroke="#7e858f"/>
        <circle cx="42" cy="24" r="2.5" fill="#c8793a" stroke="#8a4b1f"/>
    `),
    // 街道：遠くへ続く石畳の道
    highway: svg(`
        <rect x="0" y="12" width="48" height="20" fill="#8cbf73"/>
        <path d="M18 32 L23 12 h2 L30 32 Z" fill="#a6a08f"/>
        <path d="M24 14 v3 M24 20 v4 M24 27 v4" stroke="#f5ecd7" stroke-width="1"/>
        <path d="M0 12 Q10 8 18 12 Q28 6 36 11 Q42 8 48 12 Z" fill="#7fb069"/>
        <rect x="36" y="18" width="2" height="9" fill="#8b5a2b"/>
        <rect x="33" y="15" width="8" height="4" fill="#2e86c1"/>
    `),
    // 宿屋：看板のある宿
    inn: svg(`
        ${ground()}
        <rect x="8" y="12" width="26" height="15" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M5 12 L21 3 L37 12 Z" fill="#a8432f"/>
        <rect x="12" y="16" width="5" height="4" fill="#f7dc6f" stroke="#8b6b4a" stroke-width="0.6"/>
        <rect x="25" y="16" width="5" height="4" fill="#f7dc6f" stroke="#8b6b4a" stroke-width="0.6"/>
        <rect x="19" y="20" width="4" height="7" fill="#8b6b4a"/>
        <line x1="34" y1="14" x2="42" y2="14" stroke="#6b4423" stroke-width="1.5"/>
        <rect x="38" y="15" width="7" height="6" fill="#c8a165" stroke="#6b4423" stroke-width="0.6"/>
        <path d="M40 17 h3 v3 h-3 z" fill="#c9971f"/>
    `),
    // 辺境伯：国境の城と旗
    margrave: svg(`
        ${ground('#9c9c8c')}
        <rect x="6" y="11" width="10" height="16" fill="#b8b2a0" stroke="#6b6555"/>
        <path d="M6 11 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2 h2 v2" fill="none" stroke="#6b6555"/>
        <rect x="16" y="15" width="16" height="12" fill="#cfc6b2" stroke="#6b6555"/>
        <path d="M21 27 v-5 a3 3 0 0 1 6 0 v5 z" fill="#6b5a45"/>
        <line x1="11" y1="9" x2="11" y2="2" stroke="#5b4a3a"/>
        <path d="M11 2 l7 2 l-7 2 z" fill="#2e86c1"/>
        <path d="M34 27 l5 -20 l5 20" fill="none" stroke="#8b5a2b" stroke-width="1.5"/>
        <path d="M37 15 h4 M36 21 h6" stroke="#8b5a2b" stroke-width="1"/>
    `),
    // スーク：屋根付きの市場の屋台
    souk: svg(`
        ${ground('#e3c98f')}
        <path d="M4 12 Q12 4 20 12 Q28 4 36 12 Q42 6 46 12 V14 H4 Z" fill="#8e44ad"/>
        <path d="M4 14 h42" stroke="#f1c40f" stroke-width="1.5"/>
        <rect x="6" y="14" width="2" height="13" fill="#8b5a2b"/>
        <rect x="42" y="14" width="2" height="13" fill="#8b5a2b"/>
        <rect x="9" y="21" width="32" height="6" fill="#a0703c"/>
        <ellipse cx="15" cy="20" rx="3.5" ry="2" fill="#e67e22"/>
        <path d="M22 21 l3 -5 l3 5 z" fill="#c0392b"/>
        <circle cx="34" cy="19" r="2.2" fill="#f1c40f"/>
        <circle cx="38" cy="19.5" r="1.6" fill="#27ae60"/>
    `),
    // 厩舎：馬小屋と蹄鉄
    stables: svg(`
        ${ground('#c8a165')}
        <rect x="6" y="12" width="28" height="15" fill="#a0522d" stroke="#6b4423"/>
        <path d="M3 12 L20 4 L37 12 Z" fill="#7b3f2a"/>
        <rect x="11" y="16" width="8" height="11" fill="#6b4423"/>
        <path d="M11 16 l8 11 M19 16 l-8 11" stroke="#a0522d" stroke-width="1"/>
        <path d="M23 18 h8 v4 h-8 z" fill="#2b2620"/>
        <path d="M36 26 v-6 a5 5 0 0 1 10 0 v6" fill="none" stroke="#7f8c8d" stroke-width="2.2"/>
        <circle cx="37" cy="23" r="0.6" fill="#2b2620"/><circle cx="45" cy="23" r="0.6" fill="#2b2620"/>
    `),
    // 車大工：木の車輪
    wheelwright: svg(`
        <circle cx="22" cy="16" r="12" fill="none" stroke="#8b5a2b" stroke-width="3"/>
        <circle cx="22" cy="16" r="3" fill="#6b4423"/>
        <path d="M22 4 V28 M10 16 H34 M13.5 7.5 L30.5 24.5 M30.5 7.5 L13.5 24.5" stroke="#a0703c" stroke-width="1.6"/>
        <line x1="41" y1="8" x2="37" y2="26" stroke="#8b5a2b" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="36.5" y="3" width="9" height="5" rx="1" fill="#7f8c8d" transform="rotate(14 41 5.5)"/>
    `),
    // 魔女の小屋：森の中の傾いた小屋
    witchs_hut: svg(`
        ${ground('#6f9a55')}
        <rect x="12" y="14" width="20" height="13" fill="#7b5a44" stroke="#4a3426" transform="rotate(-4 22 20)"/>
        <path d="M8 15 L23 3 L35 13 Z" fill="#4b3363"/>
        <rect x="16" y="17" width="4" height="4" fill="#82e0aa"/>
        <path d="M24 27 v-5 h4 v5 z" fill="#4a3426"/>
        <rect x="27" y="3" width="3" height="7" fill="#4a3426"/>
        <circle cx="30" cy="1.5" r="1.5" fill="#bdc3c7" opacity="0.8"/>
        <circle cx="40" cy="6" r="3.5" fill="#f7dc6f"/>
        <circle cx="41.5" cy="5" r="3" fill="#dce8f5"/>
    `),

    // ===== コスト6 =====
    // 国境の村：関所の門と家
    border_village: svg(`
        ${ground()}
        <rect x="4" y="16" width="12" height="11" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M2 16 L10 9 L18 16 Z" fill="#b5523b"/>
        <rect x="8" y="21" width="3" height="6" fill="#8b6b4a"/>
        <rect x="22" y="10" width="3" height="17" fill="#8b5a2b"/>
        <rect x="22" y="12" width="22" height="2.5" fill="#c0392b"/>
        <path d="M26 12 h3 v2.5 h-3 z M33 12 h3 v2.5 h-3 z M40 12 h3 v2.5 h-3 z" fill="#fdfefe"/>
        <rect x="20" y="8" width="7" height="3" fill="#6b4423"/>
    `),
    // 肥沃な土地：耕された畑と実り
    farmland: svg(`
        <rect x="0" y="12" width="48" height="20" fill="#8b6b4a"/>
        <path d="M0 16 h48 M0 21 h48 M0 26 h48" stroke="#6b4423" stroke-width="1.2"/>
        <path d="M6 16 v-4 M14 16 v-5 M22 16 v-4 M30 16 v-5 M38 16 v-4 M8 21 v-4 M18 21 v-4 M28 21 v-4 M40 21 v-4" stroke="#3f8a4c" stroke-width="1.5"/>
        <circle cx="14" cy="10" r="1.5" fill="#f1c40f"/>
        <circle cx="30" cy="10" r="1.5" fill="#f1c40f"/>
        <circle cx="40" cy="5" r="3.5" fill="#f7dc6f"/>
    `)
};
