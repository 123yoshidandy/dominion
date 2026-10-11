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
};

// カードIDに対応するイラストのSVG（なければ空文字）
export function getCardArt(cardId) {
    return CARD_ART[cardId.toLowerCase()] ?? '';
}
