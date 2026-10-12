/** 拡張「陰謀」のカードイラスト */

import { svg, ground } from './card-art-helpers.js';

export const INTRIGUE_ART = {
    // 中庭：石畳の庭と噴水
    courtyard: svg(`
        <rect x="4" y="18" width="40" height="11" fill="#d9cfb8" stroke="#a69a7f"/>
        <path d="M4 23 h40 M14 18 v11 M24 18 v11 M34 18 v11" stroke="#a69a7f" stroke-width="0.6"/>
        <ellipse cx="24" cy="20" rx="9" ry="3" fill="#5dade2" stroke="#7d7362"/>
        <rect x="22.5" y="9" width="3" height="10" fill="#b8b0a0" stroke="#7d7362" stroke-width="0.6"/>
        <path d="M24 9 Q19 5 17 12 M24 9 Q29 5 31 12" fill="none" stroke="#85c1e9" stroke-width="1.2"/>
    `),
    // 待ち伏せ：茂みから覗く目
    lurker: svg(`
        ${ground('#6f9a55')}
        <ellipse cx="16" cy="20" rx="12" ry="8" fill="#3f7a3a"/>
        <ellipse cx="32" cy="19" rx="13" ry="9" fill="#4f8a47"/>
        <ellipse cx="22" cy="18" rx="2.2" ry="1.4" fill="#f7dc6f"/>
        <ellipse cx="28" cy="18" rx="2.2" ry="1.4" fill="#f7dc6f"/>
        <circle cx="22" cy="18" r="0.8" fill="#2b2620"/>
        <circle cx="28" cy="18" r="0.8" fill="#2b2620"/>
    `),
    // 手先：チェスのポーン
    pawn: svg(`
        <circle cx="24" cy="8" r="4.5" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M20 13 h8 l-1.5 3 l3 9 h-11 l3 -9 z" fill="#f1e3c6" stroke="#8b6b4a"/>
        <rect x="15" y="25" width="18" height="4" rx="1" fill="#f1e3c6" stroke="#8b6b4a"/>
    `),
    // 仮面舞踏会：仮面と羽根
    masquerade: svg(`
        <path d="M8 12 Q24 6 40 12 Q38 24 28 21 Q24 17 20 21 Q10 24 8 12 Z" fill="#8e44ad" stroke="#4b3363"/>
        <ellipse cx="17" cy="15" rx="4" ry="2.5" fill="#2b2620"/>
        <ellipse cx="31" cy="15" rx="4" ry="2.5" fill="#2b2620"/>
        <path d="M38 11 Q42 3 46 2 Q44 8 40 12" fill="#e6b84f"/>
        <line x1="10" y1="20" x2="8" y2="30" stroke="#c9971f" stroke-width="1.5"/>
    `),
    // 貧民街：傾いた小屋が並ぶ
    shanty_town: svg(`
        ${ground('#b9a37a')}
        <path d="M4 27 v-9 l7 -4 l6 4 v9 z" fill="#a0896a" stroke="#6b5a45"/>
        <path d="M17 27 v-11 l8 -3 l5 4 v10 z" fill="#8d7b62" stroke="#6b5a45"/>
        <path d="M30 27 v-8 l6 -4 l8 4 v8 z" fill="#a69478" stroke="#6b5a45"/>
        <rect x="9" y="21" width="3" height="6" fill="#5d4a36"/>
        <rect x="23" y="20" width="3" height="7" fill="#5d4a36"/>
        <path d="M18 18 l4 -1 M33 22 h4" stroke="#6b5a45" stroke-width="0.8"/>
    `),
    // 執事：銀の盆とクロッシュ
    steward: svg(`
        <ellipse cx="24" cy="24" rx="17" ry="3" fill="#c9ced6" stroke="#7e858f"/>
        <path d="M11 23 Q11 10 24 10 Q37 10 37 23 Z" fill="#dfe3e8" stroke="#7e858f"/>
        <circle cx="24" cy="8.5" r="2" fill="#c9ced6" stroke="#7e858f"/>
        <path d="M16 18 Q18 13 23 12" fill="none" stroke="#f4f6f8" stroke-width="1.5"/>
    `),
    // 詐欺師：シルクハットと隠したカード
    swindler: svg(`
        <rect x="14" y="4" width="14" height="13" fill="#2b2620"/>
        <rect x="14" y="13" width="14" height="2.5" fill="#c0392b"/>
        <ellipse cx="21" cy="17" rx="13" ry="2.5" fill="#2b2620"/>
        <rect x="32" y="14" width="9" height="13" rx="1" fill="#fdfefe" stroke="#7f8c8d" transform="rotate(15 36 20)"/>
        <path d="M36 18 l1.5 2.5 l-1.5 2.5 l-1.5 -2.5 z" fill="#c0392b" transform="rotate(15 36 20)"/>
        <path d="M10 26 q6 -4 12 0" fill="none" stroke="#6b5a45" stroke-width="1.2"/>
    `),
    // 願いの井戸：石の井戸と屋根
    wishing_well: svg(`
        ${ground()}
        <rect x="12" y="18" width="24" height="9" fill="#b8b0a0" stroke="#7d7362"/>
        <path d="M12 22 h24 M18 18 v4 M30 18 v4 M24 22 v5" stroke="#7d7362" stroke-width="0.6"/>
        <rect x="13" y="8" width="2" height="10" fill="#8b5a2b"/>
        <rect x="33" y="8" width="2" height="10" fill="#8b5a2b"/>
        <path d="M9 9 L24 2 L39 9 Z" fill="#b5523b"/>
        <line x1="24" y1="9" x2="24" y2="15" stroke="#6b4423"/>
        <rect x="22" y="14" width="4" height="3" fill="#a0703c"/>
        <circle cx="40" cy="15" r="2" fill="#f2c14e" stroke="#b8860b" stroke-width="0.6"/>
    `),
    // 男爵：家紋の盾と屋敷
    baron: svg(`
        ${ground()}
        <path d="M6 6 h14 v8 c0 6 -3 9 -7 11 c-4 -2 -7 -5 -7 -11 z" fill="#8e2f2f" stroke="#5a1d1d"/>
        <path d="M9 11 l4 4 l4 -4" fill="none" stroke="#f2c14e" stroke-width="1.5"/>
        <rect x="26" y="17" width="16" height="10" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M23 17 L34 9 L45 17 Z" fill="#b5523b"/>
        <rect x="32" y="21" width="4" height="6" fill="#8b6b4a"/>
    `),
    // 橋：川にかかる石橋
    bridge: svg(`
        <rect x="0" y="22" width="48" height="10" fill="#5dade2"/>
        <path d="M0 26 q4 -2 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" stroke="#eaf6fd" stroke-width="0.8"/>
        <path d="M2 14 Q24 4 46 14 v4 h-6 q-4 -8 -8 0 h-16 q-4 -8 -8 0 h-6 z" fill="#b8b0a0" stroke="#7d7362"/>
        <path d="M4 12 Q24 2 44 12" fill="none" stroke="#7d7362" stroke-width="1"/>
    `),
    // 共謀者：フードの二人がささやく
    conspirator: svg(`
        <path d="M6 28 Q6 12 16 10 Q24 12 23 28 Z" fill="#4a4f57"/>
        <path d="M25 28 Q24 12 32 10 Q42 12 42 28 Z" fill="#5b4a6b"/>
        <ellipse cx="17" cy="17" rx="4" ry="4.5" fill="#2b2620"/>
        <ellipse cx="31" cy="17" rx="4" ry="4.5" fill="#2b2620"/>
        <circle cx="19" cy="16.5" r="0.8" fill="#f7dc6f"/>
        <circle cx="29" cy="16.5" r="0.8" fill="#f7dc6f"/>
        <path d="M22 6 q2 -2 4 0" fill="none" stroke="#7f8c8d" stroke-width="1"/>
    `),
    // 外交官：封蝋の書状
    diplomat: svg(`
        <rect x="8" y="7" width="32" height="20" fill="#fdf2e9" stroke="#8b6b4a"/>
        <path d="M8 7 L24 18 L40 7" fill="none" stroke="#8b6b4a"/>
        <circle cx="24" cy="18" r="4" fill="#c0392b"/>
        <path d="M22 18 h4 M24 16 v4" stroke="#8e2f2f" stroke-width="0.8"/>
        <path d="M21 21 l-2 5 M27 21 l2 5" stroke="#2e86c1" stroke-width="1.5"/>
    `),
    // 鉄工所：金床と炎
    ironworks: svg(`
        <path d="M12 14 L4 15 L12 18 Z" fill="#4a4f57"/>
        <rect x="12" y="14" width="20" height="4" fill="#4a4f57"/>
        <rect x="18" y="18" width="8" height="5" fill="#3c4047"/>
        <rect x="14" y="23" width="16" height="4" fill="#4a4f57"/>
        <path d="M36 27 Q32 20 36 14 Q38 18 40 12 Q44 19 42 27 Z" fill="#e67e22"/>
        <path d="M37 27 Q35 22 38 19 Q40 23 41 27 Z" fill="#f7dc6f"/>
    `),
    // 風車
    mill: svg(`
        ${ground()}
        <path d="M18 27 L20 13 h8 L30 27 Z" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M19 13 L24 8 L29 13 Z" fill="#b5523b"/>
        <g stroke="#6b4423" stroke-width="1.2">
            <path d="M24 13 L12 3 L10 6 Z" fill="#fdfefe"/>
            <path d="M24 13 L36 3 L38 6 Z" fill="#fdfefe"/>
            <path d="M24 13 L12 23 L10 20 Z" fill="#fdfefe"/>
            <path d="M24 13 L36 23 L38 20 Z" fill="#fdfefe"/>
        </g>
        <circle cx="24" cy="13" r="1.5" fill="#6b4423"/>
        <rect x="22.5" y="21" width="3" height="6" fill="#8b6b4a"/>
    `),
    // 鉱山の村：坑道の入口と家
    mining_village: svg(`
        ${ground('#9c8c74')}
        <path d="M2 27 L14 8 L26 27 Z" fill="#8d7b62"/>
        <path d="M10 27 v-6 a4 4 0 0 1 8 0 v6 z" fill="#2b2620"/>
        <path d="M9.5 21 h9 M10 21 v6 M18 21 v6" stroke="#a0703c" stroke-width="1.2"/>
        <rect x="30" y="18" width="13" height="9" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M28 18 L36.5 11 L45 18 Z" fill="#b5523b"/>
        <rect x="35" y="22" width="3" height="5" fill="#8b6b4a"/>
    `),
    // 秘密の通路：本棚の隠し扉
    secret_passage: svg(`
        <rect x="6" y="4" width="36" height="24" fill="#8b5a2b" stroke="#5d3a1a"/>
        <path d="M6 12 h36 M6 20 h36" stroke="#5d3a1a"/>
        <rect x="8" y="6" width="3" height="6" fill="#c0392b"/><rect x="11" y="7" width="2.5" height="5" fill="#2e86c1"/>
        <rect x="14" y="6" width="3" height="6" fill="#27ae60"/><rect x="9" y="14" width="3" height="6" fill="#e6b84f"/>
        <rect x="12" y="15" width="2.5" height="5" fill="#8e44ad"/><rect x="8" y="22" width="3" height="6" fill="#2e86c1"/>
        <path d="M24 4 h18 v24 h-18 z" fill="#2b2620"/>
        <path d="M24 4 L34 7 V25 L24 28 Z" fill="#a0703c" stroke="#5d3a1a"/>
        <path d="M24 12 L34 12 M24 20 L34 20" stroke="#5d3a1a" stroke-width="0.8"/>
    `),
    // 廷臣：羽根付き帽子
    courtier: svg(`
        <ellipse cx="22" cy="20" rx="16" ry="4" fill="#6c3483"/>
        <path d="M12 19 Q13 9 22 9 Q31 9 32 19 Z" fill="#8e44ad"/>
        <rect x="12.5" y="16" width="19" height="2.5" fill="#f2c14e"/>
        <path d="M30 14 Q40 4 46 6 Q40 10 34 17" fill="#fdfefe" stroke="#bdc3c7" stroke-width="0.6"/>
        <circle cx="30" cy="17" r="1.6" fill="#c0392b"/>
    `),
    // 公爵：冠と公領
    duke: svg(`
        ${ground()}
        <path d="M14 13 L16 4 L20 9 L24 3 L28 9 L32 4 L34 13 Z" fill="#f2c14e" stroke="#b8860b"/>
        <rect x="14" y="13" width="20" height="3" fill="#c9971f"/>
        <circle cx="24" cy="10" r="1.2" fill="#c0392b"/>
        <rect x="8" y="20" width="32" height="7" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M6 20 L24 16 L42 20 Z" fill="#a8432f"/>
    `),
    // 寵臣：短剣
    minion: svg(`
        <g transform="rotate(-30 24 16)">
            <path d="M24 2 L27 6 L27 20 L21 20 L21 6 Z" fill="#dfe3e8" stroke="#7e858f"/>
            <line x1="24" y1="5" x2="24" y2="19" stroke="#7e858f" stroke-width="0.6"/>
            <rect x="16" y="20" width="16" height="3" rx="1" fill="#c9971f"/>
            <rect x="22.5" y="23" width="3" height="6" fill="#6b4423"/>
            <circle cx="24" cy="30" r="1.8" fill="#c9971f"/>
        </g>
    `),
    // 巡回：たいまつを持って見回る道
    patrol: svg(`
        ${ground('#9c9c8c')}
        <path d="M2 27 Q24 18 46 27" fill="none" stroke="#b8b0a0" stroke-width="3"/>
        <line x1="20" y1="10" x2="18" y2="27" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M20 10 Q16 5 20 1 Q21 5 23 3 Q25 7 20 10 Z" fill="#e67e22"/>
        <path d="M20 9 Q18 6 20 4 Q22 7 20 9 Z" fill="#f7dc6f"/>
        <circle cx="34" cy="8" r="2.4" fill="#f7dc6f" opacity="0.7"/>
        <circle cx="40" cy="12" r="1.4" fill="#f7dc6f" opacity="0.5"/>
    `),
    // 交換：入れ替わる2つの矢印
    replace: svg(`
        <rect x="5" y="8" width="11" height="16" rx="1.5" fill="#f1e3c6" stroke="#8b6b4a"/>
        <rect x="32" y="8" width="11" height="16" rx="1.5" fill="#dce8f5" stroke="#4a6b80"/>
        <path d="M18 12 h10 l-3 -3 M30 20 h-10 l3 3" fill="none" stroke="#c0392b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `),
    // 拷問人：鎖と手枷
    torturer: svg(`
        <path d="M4 6 q4 -3 8 0 q4 3 8 0 q4 -3 8 0" fill="none" stroke="#5d646d" stroke-width="2"/>
        <line x1="24" y1="6" x2="24" y2="14" stroke="#5d646d" stroke-width="2"/>
        <circle cx="16" cy="20" r="6" fill="none" stroke="#4a4f57" stroke-width="3"/>
        <circle cx="32" cy="20" r="6" fill="none" stroke="#4a4f57" stroke-width="3"/>
        <rect x="21" y="18" width="6" height="4" fill="#4a4f57"/>
        <circle cx="24" cy="14" r="1.6" fill="none" stroke="#5d646d" stroke-width="1.5"/>
    `),
    // 交易場：天秤と荷物
    trading_post: svg(`
        ${ground('#c8a165')}
        <rect x="6" y="15" width="14" height="12" fill="#a0703c" stroke="#6b4423"/>
        <path d="M6 21 h14 M13 15 v12" stroke="#6b4423" stroke-width="0.8"/>
        <line x1="34" y1="6" x2="34" y2="27" stroke="#8b5a2b" stroke-width="2"/>
        <line x1="25" y1="8" x2="43" y2="8" stroke="#8b5a2b" stroke-width="1.5"/>
        <path d="M23 15 h6 a3 2 0 0 1 -6 0 Z M39 15 h6 a3 2 0 0 1 -6 0 Z" fill="#c9971f"/>
        <path d="M26 8 L24 15 M26 8 L28 15 M42 8 L40 15 M42 8 L44 15" stroke="#7f8c8d" stroke-width="0.6"/>
        <circle cx="42" cy="13" r="2" fill="#c9ced6" stroke="#7e858f" stroke-width="0.6"/>
    `),
    // 改良：上向きの矢印と階段
    upgrade: svg(`
        <rect x="6" y="22" width="9" height="6" fill="#c8793a" stroke="#8a4b1f"/>
        <rect x="15" y="16" width="9" height="12" fill="#c9ced6" stroke="#7e858f"/>
        <rect x="24" y="10" width="9" height="18" fill="#f2c14e" stroke="#b8860b"/>
        <path d="M34 22 L42 6 M42 6 l-5 1 M42 6 l1 5" fill="none" stroke="#27ae60" stroke-width="2.2" stroke-linecap="round"/>
    `),
    // 農場：畑と納屋（財宝・勝利点）
    farm: svg(`
        ${ground('#c8a165')}
        <path d="M0 27 L14 20 L48 20 L48 27 Z" fill="#d4ac0d"/>
        <path d="M6 25 L18 21 M14 26 L26 21 M24 26 L34 21 M34 26 L42 21" stroke="#b7950b" stroke-width="0.8"/>
        <rect x="28" y="9" width="14" height="11" fill="#b03a2e" stroke="#78281f"/>
        <path d="M26 10 L35 3 L44 10 Z" fill="#78281f"/>
        <path d="M32 20 v-6 h6 v6 M32 14 l6 6 M38 14 l-6 6" fill="none" stroke="#fdfefe" stroke-width="0.8"/>
        <circle cx="10" cy="10" r="4" fill="#f2c14e" stroke="#b8860b"/>
    `),
    // 貴族：王冠と勲章
    nobles: svg(`
        <path d="M10 15 L12 4 L18 10 L24 3 L30 10 L36 4 L38 15 Z" fill="#f2c14e" stroke="#b8860b"/>
        <rect x="10" y="15" width="28" height="4" fill="#c9971f"/>
        <circle cx="17" cy="12" r="1.3" fill="#2e86c1"/>
        <circle cx="24" cy="10" r="1.6" fill="#c0392b"/>
        <circle cx="31" cy="12" r="1.3" fill="#27ae60"/>
        <path d="M20 19 L18 28 L24 25 L30 28 L28 19" fill="#8e44ad"/>
    `)
};

