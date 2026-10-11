/**
 * ドミニオンのカードイラスト
 * 公式イラストは使わず、カードの内容を表すシンプルなSVGを描いている
 * すべて viewBox 0 0 48 32 の横長の絵
 */

const svg = (body) => `<svg viewBox="0 0 48 32" aria-hidden="true">${body}</svg>`;

// 地面
const ground = (color = '#8cbf73') => `<rect x="0" y="27" width="48" height="5" fill="${color}"/>`;

// 財宝のコイン（色違い）
const coin = (fill, edge, shine, sparkle = '') => svg(`
    <circle cx="24" cy="16" r="12" fill="${fill}" stroke="${edge}" stroke-width="2"/>
    <circle cx="24" cy="16" r="7.5" fill="none" stroke="${shine}" stroke-width="1.5"/>
    <path d="M20 12 Q24 8 28 12" fill="none" stroke="${shine}" stroke-width="1.5" stroke-linecap="round"/>
    ${sparkle}
`);

const CARD_ART = {
    copper: coin('#c8793a', '#8a4b1f', '#eaa86b'),
    silver: coin('#c9ced6', '#7e858f', '#f4f6f8'),
    gold: coin('#f2c14e', '#b8860b', '#fff1b8', `
        <path d="M40 4 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2z" fill="#fff6c9"/>
        <path d="M8 22 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8z" fill="#fff6c9"/>
    `),

    // 屋敷 → 公領 → 属州 と建物が大きくなる
    estate: svg(`
        ${ground()}
        <rect x="16" y="16" width="16" height="11" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M13 16 L24 7 L35 16 Z" fill="#b5523b"/>
        <rect x="22" y="20" width="4" height="7" fill="#8b6b4a"/>
    `),
    duchy: svg(`
        ${ground()}
        <rect x="31" y="6" width="3" height="7" fill="#7d5a44"/>
        <rect x="10" y="15" width="28" height="12" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M7 15 L24 5 L41 15 Z" fill="#a8432f"/>
        <rect x="13" y="18" width="5" height="4" fill="#85c1e9" stroke="#8b6b4a" stroke-width="0.8"/>
        <rect x="30" y="18" width="5" height="4" fill="#85c1e9" stroke="#8b6b4a" stroke-width="0.8"/>
        <rect x="22" y="20" width="4" height="7" fill="#8b6b4a"/>
    `),
    province: svg(`
        ${ground()}
        <line x1="24" y1="3" x2="24" y2="14" stroke="#5b4a3a" stroke-width="1"/>
        <path d="M24 3 L31 5 L24 7 Z" fill="#c0392b"/>
        <rect x="12" y="14" width="24" height="13" fill="#d5ccb9" stroke="#7d7362"/>
        <rect x="7" y="9" width="8" height="18" fill="#cfc6b2" stroke="#7d7362"/>
        <rect x="33" y="9" width="8" height="18" fill="#cfc6b2" stroke="#7d7362"/>
        <path d="M7 9 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2" fill="none" stroke="#7d7362"/>
        <path d="M33 9 v-2 h2 v2 h2 v-2 h2 v2 h2 v-2" fill="none" stroke="#7d7362"/>
        <path d="M21 27 v-6 a3 3 0 0 1 6 0 v6 z" fill="#6b5a45"/>
    `),

    curse: svg(`
        <path d="M24 4 a10 10 0 0 0 -10 10 c0 4 2 6 4 7 v5 h12 v-5 c2 -1 4 -3 4 -7 a10 10 0 0 0 -10 -10z" fill="#ece4f3" stroke="#5b3a72" stroke-width="1.5"/>
        <circle cx="20" cy="14" r="2.6" fill="#5b3a72"/>
        <circle cx="28" cy="14" r="2.6" fill="#5b3a72"/>
        <path d="M24 17 l-1.5 3 h3z" fill="#5b3a72"/>
        <path d="M21 23 v3 M24 23 v3 M27 23 v3" stroke="#5b3a72" stroke-width="1"/>
    `),

    village: svg(`
        ${ground()}
        <rect x="7" y="18" width="12" height="9" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M5 18 L13 11 L21 18 Z" fill="#b5523b"/>
        <rect x="25" y="16" width="16" height="11" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M23 16 L33 8 L43 16 Z" fill="#c76b3a"/>
        <rect x="11" y="22" width="3" height="5" fill="#8b6b4a"/>
        <rect x="31" y="21" width="4" height="6" fill="#8b6b4a"/>
    `),
    smithy: svg(`
        <path d="M12 15 L4 16 L12 19 Z" fill="#4a4f57"/>
        <rect x="12" y="15" width="20" height="4" fill="#4a4f57"/>
        <rect x="18" y="19" width="8" height="4" fill="#3c4047"/>
        <rect x="14" y="23" width="16" height="4" fill="#4a4f57"/>
        <g transform="rotate(-35 35 10)">
            <rect x="33.5" y="5" width="3" height="15" rx="1" fill="#8b5a2b"/>
            <rect x="29" y="2" width="12" height="5" rx="1" fill="#6c737d"/>
        </g>
        <circle cx="27" cy="11" r="1.2" fill="#f5b041"/>
        <circle cx="24" cy="9" r="0.9" fill="#f5b041"/>
        <circle cx="29" cy="8" r="0.8" fill="#f5b041"/>
    `),
    market: svg(`
        <rect x="9" y="14" width="2" height="13" fill="#8b5a2b"/>
        <rect x="37" y="14" width="2" height="13" fill="#8b5a2b"/>
        <rect x="8" y="7" width="8" height="7" fill="#c0392b"/>
        <rect x="16" y="7" width="8" height="7" fill="#fdf2e9"/>
        <rect x="24" y="7" width="8" height="7" fill="#c0392b"/>
        <rect x="32" y="7" width="8" height="7" fill="#fdf2e9"/>
        <rect x="8" y="21" width="32" height="6" fill="#a0703c"/>
        <circle cx="15" cy="19" r="2.5" fill="#e74c3c"/>
        <circle cx="21" cy="19" r="2.5" fill="#f1c40f"/>
        <circle cx="27" cy="19" r="2.5" fill="#27ae60"/>
        <circle cx="33" cy="19" r="2.5" fill="#e67e22"/>
    `),
    laboratory: svg(`
        <path d="M20 4 h8 v9 l7 12 a2 2 0 0 1 -2 3 h-18 a2 2 0 0 1 -2 -3 l7 -12z" fill="#eef7fc" stroke="#4a6b80" stroke-width="1.5"/>
        <path d="M16.5 20 h15 l3 5 a1.5 1.5 0 0 1 -1.5 2 h-18 a1.5 1.5 0 0 1 -1.5 -2z" fill="#5dade2"/>
        <circle cx="22" cy="17" r="1.5" fill="#5dade2"/>
        <circle cx="26" cy="12" r="1.2" fill="#5dade2"/>
        <circle cx="23" cy="8" r="1" fill="#5dade2"/>
    `),
    festival: svg(`
        <path d="M2 8 Q24 18 46 8" fill="none" stroke="#6b5a45" stroke-width="1"/>
        <path d="M5 10.4 L11 10.4 L8 17.4 Z" fill="#e74c3c"/>
        <path d="M13 12.3 L19 12.3 L16 19.3 Z" fill="#f1c40f"/>
        <path d="M21 13 L27 13 L24 20 Z" fill="#3498db"/>
        <path d="M29 12.3 L35 12.3 L32 19.3 Z" fill="#27ae60"/>
        <path d="M37 10.4 L43 10.4 L40 17.4 Z" fill="#9b59b6"/>
        <circle cx="10" cy="25" r="1.2" fill="#e74c3c"/>
        <circle cx="19" cy="28" r="1.2" fill="#3498db"/>
        <circle cx="29" cy="24" r="1.2" fill="#f1c40f"/>
        <circle cx="39" cy="27" r="1.2" fill="#27ae60"/>
    `),
    woodcutter: svg(`
        <rect x="6" y="20" width="30" height="8" rx="4" fill="#a0703c"/>
        <ellipse cx="36" cy="24" rx="3" ry="4" fill="#d9b07a" stroke="#8b5a2b"/>
        <line x1="15" y1="5" x2="32" y2="19" stroke="#8b5a2b" stroke-width="3" stroke-linecap="round"/>
        <path d="M10 3 L19 6 L14 13 Q8 9 10 3 Z" fill="#9aa3ad" stroke="#5d646d"/>
    `),
    cellar: svg(`
        <path d="M14 5 h20 q4 11 0 22 h-20 q-4 -11 0 -22z" fill="#a0703c" stroke="#6b4423" stroke-width="1.5"/>
        <path d="M20 5 q-2 11 0 22 M28 5 q2 11 0 22" fill="none" stroke="#6b4423" stroke-width="0.8"/>
        <line x1="12.5" y1="10" x2="35.5" y2="10" stroke="#5d646d" stroke-width="2"/>
        <line x1="12.5" y1="22" x2="35.5" y2="22" stroke="#5d646d" stroke-width="2"/>
    `),
    moat: svg(`
        <rect x="10" y="7" width="28" height="14" fill="#b8b0a0" stroke="#7d7362"/>
        <path d="M10 7 v-3 h4 v3 h2 v-3 h4 v3 h2 v-3 h4 v3 h2 v-3 h4 v3 h2 v-3 h4 v3" fill="#b8b0a0" stroke="#7d7362"/>
        <path d="M21 21 v-5 a3 3 0 0 1 6 0 v5 z" fill="#6b5a45"/>
        <rect x="0" y="21" width="48" height="11" fill="#5dade2"/>
        <path d="M0 25 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" stroke="#eaf6fd" stroke-width="1"/>
        <path d="M-4 29 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" stroke="#eaf6fd" stroke-width="1"/>
    `),
    chapel: svg(`
        ${ground()}
        <line x1="24" y1="1" x2="24" y2="7" stroke="#c9971f" stroke-width="1.5"/>
        <line x1="21.5" y1="3" x2="26.5" y2="3" stroke="#c9971f" stroke-width="1.5"/>
        <rect x="14" y="14" width="20" height="13" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M11 14 L24 6 L37 14 Z" fill="#6d4c41"/>
        <circle cx="24" cy="17.5" r="2" fill="#85c1e9" stroke="#8b6b4a" stroke-width="0.6"/>
        <path d="M21 27 v-4 a3 3 0 0 1 6 0 v4 z" fill="#8b6b4a"/>
    `),
    witch: svg(`
        <circle cx="40" cy="7" r="3.5" fill="#f7dc6f"/>
        <circle cx="41.5" cy="6" r="3" fill="#dce8f5"/>
        <path d="M15 24 Q21 13 23 6 Q26 1 31 4 Q27 7 33 24 Z" fill="#4b3363"/>
        <path d="M16.6 20.5 Q24 18.5 31.6 20.5 L32.4 23 Q24 21 15.8 23 Z" fill="#c9971f"/>
        <ellipse cx="24" cy="25" rx="17" ry="3.5" fill="#3d2a4f"/>
        <path d="M8 8 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8z" fill="#f7dc6f"/>
    `),

    // ===== 基本セット初版の追加分 =====
    chancellor: svg(`
        <rect x="11" y="7" width="24" height="19" rx="1.5" fill="#f5ecd7" stroke="#8b6b4a"/>
        <rect x="9" y="5" width="28" height="4" rx="2" fill="#e6d6b0" stroke="#8b6b4a"/>
        <rect x="9" y="24" width="28" height="4" rx="2" fill="#e6d6b0" stroke="#8b6b4a"/>
        <path d="M15 13 h16 M15 16.5 h16 M15 20 h10" stroke="#a89474" stroke-width="1"/>
        <path d="M44 2 Q36 8 31 21 L32.5 21.5 Q39 10 44 2 Z" fill="#fdfefe" stroke="#7f8c8d" stroke-width="0.8"/>
    `),
    workshop: svg(`
        <rect x="5" y="18" width="38" height="4" fill="#a0703c"/>
        <rect x="8" y="22" width="3" height="8" fill="#8b5a2b"/>
        <rect x="37" y="22" width="3" height="8" fill="#8b5a2b"/>
        <path d="M14 17 L30 9 L32 12 L16 18 Z" fill="#bdc3c7" stroke="#7f8c8d" stroke-width="0.8"/>
        <path d="M17 17 l1 -1.5 M20 15.8 l1 -1.5 M23 14.5 l1 -1.5 M26 13.2 l1 -1.5" stroke="#7f8c8d" stroke-width="0.8"/>
        <rect x="30" y="7" width="7" height="4" rx="1" fill="#8b5a2b"/>
    `),
    bureaucrat: svg(`
        <rect x="8" y="6" width="20" height="23" rx="1.5" fill="#fdfefe" stroke="#7f8c8d"/>
        <path d="M11 11 h14 M11 14.5 h14 M11 18 h9" stroke="#bdc3c7" stroke-width="1"/>
        <circle cx="21" cy="23" r="3.6" fill="none" stroke="#c0392b" stroke-width="1.4"/>
        <rect x="31" y="4" width="6" height="9" rx="3" fill="#8b5a2b"/>
        <rect x="33" y="13" width="2" height="5" fill="#6b4423"/>
        <rect x="29" y="18" width="10" height="4" rx="1" fill="#c0392b"/>
    `),
    feast: svg(`
        <ellipse cx="22" cy="24" rx="17" ry="4.5" fill="#ecf0f1" stroke="#95a5a6"/>
        <ellipse cx="21" cy="18" rx="10" ry="6.5" fill="#c97b3a"/>
        <ellipse cx="18" cy="16" rx="4" ry="2" fill="#e09a5a"/>
        <path d="M29 15 l5 -4" stroke="#f5ecd7" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M38 9 h7 l-1 6 a2.5 2.5 0 0 1 -5 0 z" fill="#c9971f"/>
        <rect x="40.6" y="17" width="1.8" height="6" fill="#c9971f"/>
        <rect x="38.5" y="23" width="6" height="1.5" rx="0.7" fill="#c9971f"/>
    `),
    gardens: svg(`
        ${ground('#7fb069')}
        <rect x="4" y="17" width="40" height="10" rx="4" fill="#3f8a4c"/>
        <circle cx="10" cy="15" r="5" fill="#4f9a5a"/>
        <circle cx="24" cy="13" r="6" fill="#4f9a5a"/>
        <circle cx="38" cy="15" r="5" fill="#4f9a5a"/>
        <circle cx="9" cy="21" r="1.6" fill="#f1948a"/>
        <circle cx="17" cy="19" r="1.6" fill="#f7dc6f"/>
        <circle cx="26" cy="21" r="1.6" fill="#f1948a"/>
        <circle cx="33" cy="18" r="1.6" fill="#fdfefe"/>
        <circle cx="40" cy="22" r="1.6" fill="#f7dc6f"/>
    `),
    militia: svg(`
        <line x1="34" y1="3" x2="34" y2="30" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M34 0 l3 5 h-6 z" fill="#95a5a6"/>
        <path d="M12 6 h18 v10 c0 7 -5 11 -9 13 c-4 -2 -9 -6 -9 -13 z" fill="#a8432f" stroke="#6d2a1d" stroke-width="1.2"/>
        <path d="M21 8 v19 M14 15 h14" stroke="#e6b84f" stroke-width="2"/>
    `),
    moneylender: svg(`
        <path d="M17 9 q-9 6 -9 13 q0 6 11 6 q11 0 11 -6 q0 -7 -9 -13 z" fill="#c8a165" stroke="#8b6b4a"/>
        <path d="M16 9 l3 -4 l3 4 z" fill="#b08c55" stroke="#8b6b4a" stroke-width="0.8"/>
        <rect x="15" y="8" width="8" height="2" rx="1" fill="#8b6b4a"/>
        <text x="19" y="23" font-size="9" font-weight="700" text-anchor="middle" fill="#6b4f2a">¥</text>
        <circle cx="37" cy="24" r="5" fill="#c8793a" stroke="#8a4b1f"/>
        <circle cx="34" cy="17" r="5" fill="#c8793a" stroke="#8a4b1f"/>
    `),
    remodel: svg(`
        <g fill="#c0623b" stroke="#f5ecd7" stroke-width="1">
            <rect x="4" y="22" width="10" height="5"/><rect x="14" y="22" width="10" height="5"/><rect x="24" y="22" width="10" height="5"/>
            <rect x="9" y="17" width="10" height="5"/><rect x="19" y="17" width="10" height="5"/>
            <rect x="14" y="12" width="10" height="5"/>
        </g>
        <path d="M30 6 L42 6 L38 14 Z" fill="#bdc3c7" stroke="#7f8c8d" stroke-width="0.8"/>
        <line x1="36" y1="6" x2="40" y2="1" stroke="#8b5a2b" stroke-width="2.4" stroke-linecap="round"/>
    `),
    spy: svg(`
        <circle cx="20" cy="14" r="9" fill="#d6eaf8" stroke="#5d646d" stroke-width="2.5"/>
        <path d="M15 11 a6 6 0 0 1 6 -3" fill="none" stroke="#fdfefe" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="27" y1="21" x2="36" y2="29" stroke="#5d646d" stroke-width="4" stroke-linecap="round"/>
        <circle cx="20" cy="14" r="2.6" fill="#2b2620"/>
    `),
    thief: svg(`
        <path d="M5 13 Q24 7 43 13 L41 21 Q24 25 7 21 Z" fill="#2b2620"/>
        <ellipse cx="17" cy="16" rx="4.5" ry="3" fill="#dce8f5"/>
        <ellipse cx="31" cy="16" rx="4.5" ry="3" fill="#dce8f5"/>
        <circle cx="18" cy="16" r="1.5" fill="#2b2620"/>
        <circle cx="32" cy="16" r="1.5" fill="#2b2620"/>
        <path d="M43 13 l3 -3 M43 17 l4 0" stroke="#2b2620" stroke-width="1.5"/>
    `),
    throne_room: svg(`
        <rect x="15" y="3" width="18" height="18" rx="3" fill="#a8432f" stroke="#c9971f" stroke-width="1.5"/>
        <path d="M19 3 l2 -2.5 l3 2.5 l3 -2.5 l2 2.5" fill="none" stroke="#c9971f" stroke-width="1.2"/>
        <rect x="11" y="19" width="26" height="5" rx="1.5" fill="#c9971f"/>
        <rect x="13" y="24" width="3" height="6" fill="#8b6b2a"/>
        <rect x="32" y="24" width="3" height="6" fill="#8b6b2a"/>
        <rect x="9" y="13" width="4" height="9" rx="1.5" fill="#c9971f"/>
        <rect x="35" y="13" width="4" height="9" rx="1.5" fill="#c9971f"/>
    `),
    council_room: svg(`
        ${ground('#b8b0a0')}
        <path d="M6 11 L24 3 L42 11 Z" fill="#d5ccb9" stroke="#7d7362"/>
        <rect x="7" y="11" width="34" height="3" fill="#cfc6b2" stroke="#7d7362" stroke-width="0.8"/>
        <g fill="#f1ebe0" stroke="#7d7362" stroke-width="0.8">
            <rect x="9" y="14" width="4" height="13"/><rect x="17" y="14" width="4" height="13"/>
            <rect x="27" y="14" width="4" height="13"/><rect x="35" y="14" width="4" height="13"/>
        </g>
    `),
    library: svg(`
        <rect x="6" y="3" width="36" height="26" rx="1.5" fill="#8b5a2b"/>
        <rect x="8" y="5" width="32" height="10" fill="#5d3a1a"/>
        <rect x="8" y="17" width="32" height="10" fill="#5d3a1a"/>
        <g>
            <rect x="9" y="6" width="3" height="9" fill="#c0392b"/><rect x="12.5" y="7" width="3" height="8" fill="#2e86c1"/>
            <rect x="16" y="6" width="2.5" height="9" fill="#27ae60"/><rect x="19" y="8" width="3" height="7" fill="#f1c40f"/>
            <rect x="22.5" y="6" width="3" height="9" fill="#8e44ad"/><rect x="29" y="7" width="3" height="8" fill="#e67e22"/>
            <rect x="32.5" y="6" width="2.5" height="9" fill="#c0392b"/><rect x="35.5" y="8" width="3" height="7" fill="#2e86c1"/>
            <rect x="9" y="19" width="3" height="8" fill="#27ae60"/><rect x="12.5" y="18" width="2.5" height="9" fill="#f1c40f"/>
            <rect x="15.5" y="19" width="3" height="8" fill="#c0392b"/><rect x="22" y="18" width="3" height="9" fill="#2e86c1"/>
            <rect x="25.5" y="20" width="3" height="7" fill="#8e44ad"/><rect x="29" y="18" width="2.5" height="9" fill="#27ae60"/>
            <rect x="34" y="19" width="3" height="8" fill="#e67e22"/>
        </g>
    `),
    mine: svg(`
        <path d="M4 30 L12 18 L20 22 L28 14 L36 20 L44 30 Z" fill="#7d6b5a"/>
        <path d="M14 26 l3 -3 l3 3 l-3 3 z" fill="#f4d03f"/>
        <path d="M26 25 l2.5 -2.5 l2.5 2.5 l-2.5 2.5 z" fill="#d6eaf8"/>
        <path d="M8 6 Q20 0 32 6" fill="none" stroke="#7f8c8d" stroke-width="3" stroke-linecap="round"/>
        <line x1="20" y1="3.5" x2="30" y2="17" stroke="#8b5a2b" stroke-width="2.5" stroke-linecap="round"/>
    `),
    adventurer: svg(`
        <path d="M6 5 L17 8 L29 4 L42 7 L42 28 L29 25 L17 29 L6 26 Z" fill="#f5e6c4" stroke="#a0703c"/>
        <path d="M17 8 v21 M29 4 v21" stroke="#d9c39a" stroke-width="0.8"/>
        <path d="M10 22 Q16 12 24 18 T36 12" fill="none" stroke="#a0703c" stroke-width="1.2" stroke-dasharray="2 1.5"/>
        <path d="M34 9 l4 4 M38 9 l-4 4" stroke="#c0392b" stroke-width="1.8" stroke-linecap="round"/>
    `),
};

// カードの裏面（山札の表示に使う）。縦長なので viewBox が他の絵と違う
export const CARD_BACK = `<svg viewBox="0 0 52 74" aria-hidden="true">
    <rect width="52" height="74" fill="#23345c"/>
    <rect x="3.5" y="3.5" width="45" height="67" rx="4" fill="none" stroke="#e6b84f" stroke-width="1.2"/>
    <rect x="6.5" y="6.5" width="39" height="61" rx="3" fill="none" stroke="#e6b84f" stroke-width="0.6" opacity="0.6"/>
    <path d="M26 14 l3 3 l-3 3 l-3 -3z M26 54 l3 3 l-3 3 l-3 -3z" fill="#e6b84f" opacity="0.7"/>
    <path d="M16 43 L18 30 L22.5 36 L26 27 L29.5 36 L34 30 L36 43 Z" fill="#e6b84f"/>
    <rect x="16" y="44" width="20" height="3" rx="1" fill="#e6b84f"/>
    <circle cx="18" cy="29.5" r="1.4" fill="#fff3c4"/>
    <circle cx="26" cy="26.5" r="1.6" fill="#fff3c4"/>
    <circle cx="34" cy="29.5" r="1.4" fill="#fff3c4"/>
</svg>`;

// カードIDに対応するイラストのSVG（なければ空文字）
export function getCardArt(cardId) {
    return CARD_ART[cardId.toLowerCase()] ?? '';
}
