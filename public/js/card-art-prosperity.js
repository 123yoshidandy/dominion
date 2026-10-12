/** 拡張「繁栄」のカードイラスト（白金貨・植民地を含む） */

import { svg, ground, coin } from './card-art-helpers.js';

// 小さな金貨（絵の飾りに使う）
const goldDot = (cx, cy, r = 2.5) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f2c14e" stroke="#b8860b" stroke-width="0.6"/>`;

// 勝利点トークン（緑の盾形）
const vpToken = (cx, cy) => `
    <path d="M${cx - 4} ${cy - 4} h8 v4 q0 4 -4 6 q-4 -2 -4 -6z" fill="#5a9e4b" stroke="#3b6b31" stroke-width="0.8"/>
    <path d="M${cx - 2} ${cy - 1} l2 2 l2 -3" fill="none" stroke="#e2f0dc" stroke-width="1"/>
`;

// 小さな家
const house = (x, y, w, h, roof = '#b5523b') => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f1e3c6" stroke="#8b6b4a" stroke-width="0.8"/>
    <path d="M${x - 2} ${y} L${x + w / 2} ${y - h * 0.7} L${x + w + 2} ${y} Z" fill="${roof}"/>
`;

export const PROSPERITY_ART = {
    platinum: coin('#e5e8ec', '#8a9099', '#ffffff', `
        <path d="M40 4 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2z" fill="#eef3f8"/>
        <path d="M8 22 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8z" fill="#eef3f8"/>
        <path d="M6 6 l0.6 1.5 l1.5 0.6 l-1.5 0.6 l-0.6 1.5 l-0.6 -1.5 l-1.5 -0.6 l1.5 -0.6z" fill="#eef3f8"/>
    `),

    // 植民地：属州より大きな、塔の並ぶ都市
    colony: svg(`
        ${ground()}
        <rect x="2" y="13" width="8" height="14" fill="#cfc6b2" stroke="#7d7362"/>
        <rect x="38" y="13" width="8" height="14" fill="#cfc6b2" stroke="#7d7362"/>
        <rect x="9" y="17" width="30" height="10" fill="#d5ccb9" stroke="#7d7362"/>
        <rect x="14" y="8" width="7" height="19" fill="#cfc6b2" stroke="#7d7362"/>
        <rect x="27" y="8" width="7" height="19" fill="#cfc6b2" stroke="#7d7362"/>
        <rect x="21" y="4" width="6" height="23" fill="#d9d0bd" stroke="#7d7362"/>
        <path d="M21 4 L24 0.5 L27 4 Z" fill="#2e86c1"/>
        <path d="M14 8 L17.5 4.5 L21 8 Z M27 8 L30.5 4.5 L34 8 Z" fill="#c0392b"/>
        <path d="M2 13 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2 M38 13 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2" fill="none" stroke="#7d7362"/>
        <path d="M22 27 v-5 a2 2 0 0 1 4 0 v5 z" fill="#6b5a45"/>
        <rect x="16" y="12" width="3" height="3" fill="#85c1e9"/>
        <rect x="29" y="12" width="3" height="3" fill="#85c1e9"/>
    `),

    // ===== コスト3 =====
    anvil: svg(`
        <path d="M8 9 h26 q6 0 10 4 h-12 v3 h-24 z" fill="#5d646d" stroke="#3c4047"/>
        <rect x="16" y="16" width="12" height="5" fill="#4a4f57"/>
        <path d="M12 26 h20 l-4 -5 h-12 z" fill="#4a4f57"/>
        ${goldDot(38, 22, 3)}
        <circle cx="30" cy="5" r="1" fill="#f5b041"/><circle cx="34" cy="4" r="0.8" fill="#f5b041"/>
    `),
    watchtower: svg(`
        ${ground()}
        <path d="M18 27 L20 10 h8 L30 27" fill="none" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M19 18 h10 M18.5 23 h11" stroke="#8b5a2b" stroke-width="1.2"/>
        <rect x="16" y="6" width="16" height="5" fill="#a0703c" stroke="#6b4423"/>
        <path d="M15 6 L24 1 L33 6 Z" fill="#b5523b"/>
        <circle cx="24" cy="8.5" r="1.3" fill="#2b2620"/>
    `),

    // ===== コスト4 =====
    bishop: svg(`
        <path d="M24 2 q6 4 5 10 h-10 q-1 -6 5 -10z" fill="#f4f1ea" stroke="#c9971f" stroke-width="1"/>
        <path d="M24 4 v6 M22 6.5 h4" stroke="#c9971f" stroke-width="1"/>
        <path d="M16 30 L19 12 h10 L32 30 Z" fill="#8e44ad"/>
        <path d="M22 12 h4 v18 h-4 z" fill="#f4f1ea"/>
        <line x1="36" y1="6" x2="36" y2="30" stroke="#c9971f" stroke-width="1.5"/>
        <path d="M36 6 q4 0 3 4 q-1 2 -3 0" fill="none" stroke="#c9971f" stroke-width="1.5"/>
        ${vpToken(10, 20)}
    `),
    clerk: svg(`
        <rect x="8" y="18" width="32" height="3" fill="#8b5a2b"/>
        <path d="M11 21 v8 M37 21 v8" stroke="#6b4423" stroke-width="2"/>
        <path d="M14 7 h17 l3 11 h-17 z" fill="#fdfaf2" stroke="#8b6b4a"/>
        <path d="M18 10 h11 M18.6 12.5 h11 M19.2 15 h8" stroke="#a89f8a" stroke-width="0.8"/>
        <line x1="31" y1="15" x2="38" y2="4" stroke="#2b2620" stroke-width="1.3"/>
        <path d="M38 4 q3 -2 4 -1 q-1 2 -4 1z" fill="#ecf0f1" stroke="#7f8c8d" stroke-width="0.5"/>
    `),
    investment: svg(`
        <path d="M6 27 h36" stroke="#7d7362" stroke-width="1"/>
        <rect x="9" y="20" width="6" height="7" fill="#7fb069"/>
        <rect x="19" y="15" width="6" height="12" fill="#5a9e4b"/>
        <rect x="29" y="9" width="6" height="18" fill="#3f8a4c"/>
        <path d="M8 18 L20 12 L28 9 L38 3" fill="none" stroke="#c0392b" stroke-width="1.5"/>
        <path d="M35 2.5 l3.5 0.5 l-1 3.2" fill="none" stroke="#c0392b" stroke-width="1.5"/>
        ${goldDot(41, 18)}${goldDot(41, 23)}
    `),
    monument: svg(`
        ${ground()}
        <rect x="14" y="23" width="20" height="4" fill="#b8b0a0" stroke="#7d7362"/>
        <path d="M20 23 L22 5 h4 L28 23 Z" fill="#d5ccb9" stroke="#7d7362"/>
        <path d="M22 5 L24 2 L26 5 Z" fill="#c9971f"/>
        ${vpToken(38, 14)}
        ${goldDot(9, 18)}
    `),
    quarry: svg(`
        <path d="M0 10 L12 6 L22 12 L30 8 L48 12 V32 H0 Z" fill="#b8a888"/>
        <path d="M6 16 h14 v8 h-14 z M24 18 h12 v9 h-12 z" fill="#d5c9ad" stroke="#8b7d62"/>
        <path d="M14 16 v8 M30 18 v9" stroke="#8b7d62" stroke-width="0.6"/>
        <g transform="rotate(30 40 8)">
            <rect x="39" y="4" width="2" height="12" fill="#8b5a2b"/>
            <path d="M34 4 q6 -3 12 0" fill="none" stroke="#5d646d" stroke-width="2"/>
        </g>
        ${goldDot(10, 7, 2)}
    `),
    tiara: svg(`
        <path d="M8 24 Q24 28 40 24 L38 14 L32 20 L28 8 L24 18 L20 8 L16 20 L10 14 Z" fill="#f2c14e" stroke="#b8860b" stroke-width="1"/>
        <circle cx="24" cy="21" r="2.2" fill="#c0392b"/>
        <circle cx="16" cy="22" r="1.4" fill="#2e86c1"/>
        <circle cx="32" cy="22" r="1.4" fill="#2e86c1"/>
        <circle cx="20" cy="8" r="1.3" fill="#ecf0f1"/>
        <circle cx="28" cy="8" r="1.3" fill="#ecf0f1"/>
    `),
    workers_village: svg(`
        ${ground()}
        ${house(5, 17, 11, 10)}
        ${house(19, 15, 11, 12, '#c76b3a')}
        ${house(33, 18, 10, 9)}
        <g transform="rotate(-30 40 8)">
            <rect x="39" y="3" width="1.8" height="10" fill="#8b5a2b"/>
            <rect x="36" y="2" width="8" height="3" fill="#6c737d"/>
        </g>
    `),

    // ===== コスト5 =====
    charlatan: svg(`
        <rect x="8" y="22" width="32" height="3" fill="#8b5a2b"/>
        <path d="M12 25 v5 M36 25 v5" stroke="#6b4423" stroke-width="2"/>
        <path d="M14 22 L16 12 h6 l2 10 z" fill="#5dade2" stroke="#2e6f9a" stroke-width="0.8"/>
        <rect x="17" y="8" width="4" height="4" fill="#5dade2" stroke="#2e6f9a" stroke-width="0.8"/>
        <path d="M27 22 L29 12 h6 l2 10 z" fill="#a569bd" stroke="#6c3483" stroke-width="0.8"/>
        <rect x="30" y="8" width="4" height="4" fill="#a569bd" stroke="#6c3483" stroke-width="0.8"/>
        <circle cx="19" cy="17" r="1" fill="#fdfefe"/><circle cx="32" cy="17" r="1" fill="#fdfefe"/>
        <path d="M40 4 q2 2 0 4 q-2 2 0 4" fill="none" stroke="#a569bd" stroke-width="1"/>
        ${goldDot(8, 8)}
    `),
    city: svg(`
        ${ground('#9aa3a8')}
        <rect x="3" y="12" width="9" height="15" fill="#d5ccb9" stroke="#7d7362"/>
        <rect x="13" y="6" width="9" height="21" fill="#cfc6b2" stroke="#7d7362"/>
        <rect x="23" y="10" width="10" height="17" fill="#d9d0bd" stroke="#7d7362"/>
        <rect x="34" y="14" width="11" height="13" fill="#cfc6b2" stroke="#7d7362"/>
        <path d="M5 15 h2 M9 15 h2 M5 19 h2 M9 19 h2 M15 9 h2 M19 9 h2 M15 13 h2 M19 13 h2 M15 17 h2 M19 17 h2 M25 13 h2 M29 13 h2 M25 17 h2 M29 17 h2 M36 17 h2 M40 17 h2 M36 21 h2 M40 21 h2" stroke="#85c1e9" stroke-width="2"/>
    `),
    collection: svg(`
        <rect x="6" y="14" width="36" height="13" rx="1" fill="#8b5a2b" stroke="#5d3a1a"/>
        <path d="M6 18 h36 M18 14 v13 M30 14 v13" stroke="#5d3a1a" stroke-width="0.8"/>
        <path d="M11 13 l2 -6 l2 6 z" fill="#2e86c1"/>
        ${goldDot(24, 11, 3)}
        <path d="M33 13 q2 -6 4 0 z" fill="#c0392b"/>
        <circle cx="12" cy="22" r="2" fill="#f2c14e"/>
        <circle cx="24" cy="22.5" r="2" fill="#c9ced6"/>
        <circle cx="36" cy="22" r="2" fill="#a569bd"/>
    `),
    crystal_ball: svg(`
        <circle cx="24" cy="13" r="10" fill="#d6eaf8" stroke="#5b7c99" stroke-width="1.2"/>
        <circle cx="24" cy="13" r="6" fill="#aed6f1" opacity="0.7"/>
        <path d="M19 9 q2 -3 5 -3" fill="none" stroke="#fdfefe" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M24 10 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8z" fill="#a569bd"/>
        <path d="M16 28 L18 22 h12 L32 28 Z" fill="#a0703c" stroke="#6b4423"/>
    `),
    magnate: svg(`
        <path d="M14 30 L17 16 h14 L34 30 Z" fill="#2c3e50"/>
        <circle cx="24" cy="11" r="5" fill="#f0c8a0"/>
        <rect x="18" y="2" width="12" height="5" fill="#2b2620"/>
        <rect x="16" y="6.5" width="16" height="1.5" fill="#2b2620"/>
        <path d="M23 16 l1 6 l1 -6 z" fill="#c0392b"/>
        ${goldDot(8, 24, 3)}${goldDot(8, 18, 3)}${goldDot(40, 24, 3)}${goldDot(40, 18, 3)}
    `),
    mint: svg(`
        <rect x="18" y="2" width="12" height="12" fill="#6c737d" stroke="#3c4047"/>
        <rect x="21" y="14" width="6" height="4" fill="#4a4f57"/>
        <rect x="10" y="24" width="28" height="4" fill="#5d646d"/>
        <rect x="20" y="20" width="8" height="4" fill="#3c4047"/>
        ${goldDot(24, 21.5, 2)}
        ${goldDot(8, 20)}${goldDot(40, 20)}${goldDot(36, 14, 2)}${goldDot(12, 14, 2)}
    `),
    rabble: svg(`
        ${ground('#b8a888')}
        <circle cx="10" cy="15" r="3" fill="#c8a165"/><path d="M6 27 q4 -10 8 0z" fill="#7d5a44"/>
        <circle cx="19" cy="13" r="3" fill="#e0b48a"/><path d="M15 27 q4 -12 8 0z" fill="#8e6b4f"/>
        <circle cx="29" cy="13" r="3" fill="#c8a165"/><path d="M25 27 q4 -12 8 0z" fill="#6b5a45"/>
        <circle cx="38" cy="15" r="3" fill="#e0b48a"/><path d="M34 27 q4 -10 8 0z" fill="#7d5a44"/>
        <line x1="21" y1="11" x2="17" y2="2" stroke="#8b5a2b" stroke-width="1.2"/>
        <line x1="31" y1="11" x2="35" y2="3" stroke="#8b5a2b" stroke-width="1.2"/>
        <path d="M33 3 l2 -3 l2 3z" fill="#7f8c8d"/>
    `),
    vault: svg(`
        <rect x="8" y="3" width="32" height="26" rx="2" fill="#7f8c8d" stroke="#4a4f57" stroke-width="1.2"/>
        <circle cx="24" cy="16" r="8" fill="#95a5a6" stroke="#4a4f57"/>
        <circle cx="24" cy="16" r="2" fill="#4a4f57"/>
        <path d="M24 8 v4 M24 20 v4 M16 16 h4 M28 16 h4" stroke="#4a4f57" stroke-width="1.5"/>
        <rect x="35" y="9" width="3" height="5" fill="#4a4f57"/><rect x="35" y="18" width="3" height="5" fill="#4a4f57"/>
    `),
    war_chest: svg(`
        <rect x="8" y="14" width="32" height="14" rx="1" fill="#8b5a2b" stroke="#5d3a1a"/>
        <path d="M8 14 q16 -9 32 0 z" fill="#a0703c" stroke="#5d3a1a"/>
        <path d="M14 14 v14 M34 14 v14" stroke="#4a4f57" stroke-width="2"/>
        <path d="M17 22 l14 -8 M17 14 l14 8" stroke="#c9ced6" stroke-width="1.5"/>
        ${goldDot(24, 7, 2.5)}
    `),

    // ===== コスト6 =====
    grand_market: svg(`
        <rect x="5" y="13" width="2" height="14" fill="#8b5a2b"/>
        <rect x="41" y="13" width="2" height="14" fill="#8b5a2b"/>
        <path d="M3 13 L24 3 L45 13 Z" fill="#8e44ad"/>
        <path d="M3 13 h42" stroke="#c9971f" stroke-width="1.5"/>
        <rect x="6" y="21" width="36" height="6" fill="#a0703c"/>
        <circle cx="12" cy="19" r="2.3" fill="#e74c3c"/>
        <circle cx="18" cy="19" r="2.3" fill="#f1c40f"/>
        ${goldDot(24, 19, 2.3)}
        <circle cx="30" cy="19" r="2.3" fill="#27ae60"/>
        <circle cx="36" cy="19" r="2.3" fill="#e67e22"/>
    `),
    hoard: svg(`
        <path d="M6 28 q18 -18 36 0 z" fill="#e6b84f" stroke="#b8860b"/>
        ${goldDot(14, 22)}${goldDot(20, 18)}${goldDot(27, 17)}${goldDot(33, 21)}${goldDot(24, 23)}
        <path d="M18 14 l3 -6 l3 6 z" fill="#c0392b"/>
        <path d="M30 13 h6 v4 h-6z" fill="#2e86c1"/>
    `),

    // ===== コスト7 =====
    bank: svg(`
        ${ground('#b8b0a0')}
        <path d="M6 10 L24 2 L42 10 Z" fill="#d5ccb9" stroke="#7d7362"/>
        <rect x="7" y="10" width="34" height="3" fill="#cfc6b2" stroke="#7d7362"/>
        <path d="M11 13 v12 M18 13 v12 M30 13 v12 M37 13 v12" stroke="#ece6d8" stroke-width="3"/>
        <rect x="5" y="25" width="38" height="2" fill="#b8b0a0"/>
        ${goldDot(24, 19, 3.5)}
    `),
    expand: svg(`
        ${ground()}
        ${house(6, 19, 8, 8)}
        <path d="M17 20 h6 l-2 -2 M23 20 l-2 2" fill="none" stroke="#7d7362" stroke-width="1.3"/>
        <rect x="27" y="13" width="17" height="14" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M24 13 L35.5 4 L47 13 Z" fill="#a8432f"/>
        <rect x="30" y="16" width="4" height="3" fill="#85c1e9"/><rect x="37" y="16" width="4" height="3" fill="#85c1e9"/>
        <rect x="33.5" y="21" width="4" height="6" fill="#8b6b4a"/>
    `),
    forge: svg(`
        <rect x="4" y="12" width="18" height="16" fill="#7d5a44" stroke="#4e3628"/>
        <path d="M8 28 v-8 a5 5 0 0 1 10 0 v8 z" fill="#2b2620"/>
        <path d="M10 27 q3 -8 6 0 z" fill="#e67e22"/><path d="M11.5 27 q1.5 -5 3 0 z" fill="#f7dc6f"/>
        <rect x="9" y="4" width="8" height="8" fill="#6b4423"/>
        <path d="M28 20 h12 q4 0 6 3 h-8 v2 h-10 z" fill="#5d646d" stroke="#3c4047" stroke-width="0.8"/>
        <rect x="31" y="25" width="6" height="3" fill="#4a4f57"/>
        <rect x="30" y="16" width="10" height="3" rx="1" fill="#e67e22"/>
    `),
    kings_court: svg(`
        <rect x="4" y="22" width="40" height="6" fill="#8e44ad"/>
        <path d="M14 22 v-10 h20 v10" fill="#a0703c" stroke="#6b4423"/>
        <rect x="16" y="6" width="16" height="7" fill="#c0392b" stroke="#7b241c"/>
        <path d="M17 6 L19 1 L21.5 5 L24 0 L26.5 5 L29 1 L31 6 Z" fill="#f2c14e" stroke="#b8860b" stroke-width="0.6"/>
        <path d="M6 22 l2 -4 l2 4 M38 22 l2 -4 l2 4" fill="#c9971f" stroke="#b8860b" stroke-width="0.6"/>
        <circle cx="19" cy="17" r="1.2" fill="#f2c14e"/><circle cx="24" cy="17" r="1.2" fill="#f2c14e"/><circle cx="29" cy="17" r="1.2" fill="#f2c14e"/>
    `),

    // ===== コスト8 =====
    peddler: svg(`
        ${ground('#d9c39a')}
        <circle cx="16" cy="8" r="3.5" fill="#f0c8a0"/>
        <path d="M11 4 h10 l-2 -3 h-6 z" fill="#8b5a2b"/>
        <path d="M12 27 l2 -15 h4 l2 15" fill="#6b4f2a"/>
        <rect x="20" y="10" width="14" height="13" rx="1" fill="#a0703c" stroke="#6b4423"/>
        <path d="M20 14 h14" stroke="#6b4423" stroke-width="0.8"/>
        <circle cx="24" cy="18" r="1.6" fill="#e74c3c"/><circle cx="28" cy="18" r="1.6" fill="#f1c40f"/>
        <circle cx="31.5" cy="19" r="1.4" fill="#27ae60"/>
        <path d="M18 12 l2 -2" stroke="#6b4423" stroke-width="1"/>
    `)
};
