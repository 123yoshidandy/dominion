/**
 * ドミニオンのカードイラスト
 * 公式イラストは使わず、カードの内容を表すシンプルなSVGを描いている
 * すべて viewBox 0 0 48 32 の横長の絵
 */

import { svg, ground, sea, coin } from './card-art-helpers.js';
import { INTRIGUE_ART } from './card-art-intrigue.js';
import { PROSPERITY_ART } from './card-art-prosperity.js';
import { HINTERLANDS_ART } from './card-art-hinterlands.js';
import { CORNUCOPIA_GUILDS_ART } from './card-art-cornucopia-guilds.js';

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

    // ===== 基本セット第2版の追加分 =====
    harbinger: svg(`
        <path d="M6 13 L22 15 L36 7 L36 25 L22 17 L6 19 Z" fill="#e6b84f" stroke="#a87b1f" stroke-width="1"/>
        <ellipse cx="36" cy="16" rx="3" ry="9" fill="#c9971f" stroke="#a87b1f"/>
        <rect x="3" y="13.5" width="4" height="5" rx="1" fill="#a87b1f"/>
        <path d="M41 9 l4 -3 M42 16 h5 M41 23 l4 3" stroke="#f7dc6f" stroke-width="1.5" stroke-linecap="round"/>
    `),
    merchant: svg(`
        <line x1="24" y1="4" x2="24" y2="28" stroke="#8b5a2b" stroke-width="2"/>
        <rect x="17" y="27" width="14" height="3" rx="1" fill="#8b5a2b"/>
        <line x1="10" y1="8" x2="38" y2="8" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M10 8 L5 18 h10 Z M38 8 L33 18 h10 Z" fill="none" stroke="#7f8c8d" stroke-width="0.8"/>
        <path d="M4 18 h12 a6 3 0 0 1 -12 0 Z M32 18 h12 a6 3 0 0 1 -12 0 Z" fill="#c9971f"/>
        <circle cx="10" cy="15" r="3" fill="#c9ced6" stroke="#7e858f"/>
        <circle cx="38" cy="15" r="3" fill="#c9ced6" stroke="#7e858f"/>
    `),
    vassal: svg(`
        <path d="M14 5 h16 v10 c0 7 -4 11 -8 13 c-4 -2 -8 -6 -8 -13 z" fill="#2e86c1" stroke="#1b4f72" stroke-width="1.2"/>
        <path d="M22 8 v17 M16 14 h12" stroke="#f5ecd7" stroke-width="1.6"/>
        <line x1="36" y1="4" x2="36" y2="26" stroke="#bdc3c7" stroke-width="2.4"/>
        <rect x="32" y="24" width="8" height="2" fill="#8b5a2b"/>
        <rect x="35" y="26" width="2" height="4" fill="#8b5a2b"/>
    `),
    poacher: svg(`
        ${ground('#6f9a55')}
        <path d="M10 4 Q22 16 10 28" fill="none" stroke="#8b5a2b" stroke-width="2.2"/>
        <line x1="10" y1="4" x2="10" y2="28" stroke="#d9c39a" stroke-width="0.8"/>
        <line x1="10" y1="16" x2="34" y2="16" stroke="#6b4423" stroke-width="1.4"/>
        <path d="M34 13 L39 16 L34 19 Z" fill="#7f8c8d"/>
        <path d="M38 6 l2 -4 M40 6 l3 -3 M40 8 l4 -1" stroke="#8b5a2b" stroke-width="1.2" stroke-linecap="round"/>
    `),
    bandit: svg(`
        <circle cx="18" cy="15" r="10" fill="#e0b48a"/>
        <path d="M8 13 h20 v4 h-20 z" fill="#2b2620"/>
        <circle cx="14" cy="15" r="1.3" fill="#fdfefe"/>
        <circle cx="22" cy="15" r="1.3" fill="#fdfefe"/>
        <path d="M8 7 Q18 0 28 7 Z" fill="#7b3f2a"/>
        <circle cx="37" cy="22" r="7" fill="#f2c14e" stroke="#b8860b" stroke-width="1.5"/>
        <circle cx="37" cy="22" r="4" fill="none" stroke="#fff1b8"/>
    `),
    sentry: svg(`
        ${ground('#9c9c8c')}
        <rect x="12" y="8" width="16" height="20" fill="#a6a08f" stroke="#6b6555"/>
        <path d="M10 4 h4 v4 h3 v-4 h4 v4 h3 v-4 h4 v6 h-18 z" fill="#b8b2a0" stroke="#6b6555" stroke-width="0.8"/>
        <rect x="18" y="13" width="4" height="6" rx="2" fill="#2b2620"/>
        <line x1="36" y1="4" x2="36" y2="30" stroke="#8b5a2b" stroke-width="1.8"/>
        <path d="M36 0 l2.5 5 h-5 z" fill="#bdc3c7"/>
    `),
    artisan: svg(`
        <path d="M24 10 q-10 2 -10 10 q0 8 10 8 q10 0 10 -8 q0 -8 -10 -10 z" fill="#c0623b" stroke="#7b3f2a"/>
        <rect x="20" y="6" width="8" height="5" rx="1.5" fill="#c0623b" stroke="#7b3f2a"/>
        <path d="M16 19 h16" stroke="#f5ecd7" stroke-width="1.2"/>
        <line x1="40" y1="8" x2="34" y2="26" stroke="#8b5a2b" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="35.5" y="3" width="9" height="5" rx="1" fill="#7f8c8d" transform="rotate(18 40 5.5)"/>
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

    // ===== 海辺（第2版） =====
    haven: svg(`
        ${sea()}
        <path d="M4 22 Q12 10 24 9 Q36 10 44 22" fill="none" stroke="#8b6b4a" stroke-width="2"/>
        <path d="M18 23 h14 l-2 4 h-10 z" fill="#8b5a2b"/>
        <line x1="25" y1="11" x2="25" y2="23" stroke="#6b4423" stroke-width="1.5"/>
        <path d="M25 12 l6 8 h-6 z" fill="#fdfefe"/>
    `),
    lighthouse: svg(`
        ${sea()}
        <path d="M19 26 L21 9 h6 L29 26 Z" fill="#fdfefe" stroke="#7f8c8d" stroke-width="0.8"/>
        <path d="M20.2 15 h7.6 l0.7 5 h-9 z" fill="#c0392b"/>
        <rect x="20" y="5" width="8" height="4" fill="#f7dc6f" stroke="#7f8c8d" stroke-width="0.8"/>
        <path d="M22 4 l2 -3 l2 3 z" fill="#c0392b"/>
        <path d="M28 6 L46 2 L46 11 Z M20 6 L2 2 L2 11 Z" fill="#f7dc6f" opacity="0.55"/>
    `),
    native_village: svg(`
        ${ground('#d9c39a')}
        <path d="M6 27 L16 10 L26 27 Z" fill="#c8a165" stroke="#8b6b4a"/>
        <path d="M14 27 L16 20 L18 27 Z" fill="#6b4423"/>
        <path d="M30 27 V12 M30 12 Q36 8 42 13 M30 12 Q35 14 38 20 M30 12 Q24 8 22 14" fill="none" stroke="#3f8a4c" stroke-width="2"/>
        <rect x="29" y="12" width="2" height="15" fill="#8b5a2b"/>
    `),
    astrolabe: svg(`
        <circle cx="24" cy="17" r="12" fill="#e6b84f" stroke="#a87b1f" stroke-width="2"/>
        <circle cx="24" cy="17" r="8" fill="none" stroke="#a87b1f" stroke-width="1"/>
        <path d="M24 5 v24 M12 17 h24" stroke="#a87b1f" stroke-width="0.8"/>
        <line x1="17" y1="23" x2="31" y2="11" stroke="#6b4f2a" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="24" cy="4" r="2" fill="none" stroke="#a87b1f" stroke-width="1.5"/>
    `),
    fishing_village: svg(`
        ${sea()}
        <path d="M8 22 h20 l-3 4 h-14 z" fill="#8b5a2b"/>
        <line x1="17" y1="8" x2="17" y2="22" stroke="#6b4423" stroke-width="1.4"/>
        <path d="M17 9 l8 11 h-8 z" fill="#f5ecd7"/>
        <path d="M33 14 q5 -4 10 0 q-5 4 -10 0 z M43 14 l3 -3 v6 z" fill="#5dade2"/>
    `),
    lookout: svg(`
        ${sea()}
        <path d="M14 6 h8 l-1 4 h-6 z" fill="#8b5a2b"/>
        <line x1="18" y1="10" x2="18" y2="30" stroke="#6b4423" stroke-width="2"/>
        <rect x="26" y="6" width="14" height="5" rx="2.5" fill="#c9971f" transform="rotate(-12 33 8)"/>
        <rect x="38" y="3.5" width="5" height="6.5" rx="1.5" fill="#a87b1f" transform="rotate(-12 40 7)"/>
    `),
    monkey: svg(`
        <circle cx="24" cy="15" r="10" fill="#8b5a2b"/>
        <circle cx="13" cy="13" r="4" fill="#8b5a2b"/><circle cx="35" cy="13" r="4" fill="#8b5a2b"/>
        <circle cx="13" cy="13" r="2" fill="#e0b48a"/><circle cx="35" cy="13" r="2" fill="#e0b48a"/>
        <ellipse cx="24" cy="18" rx="7" ry="6" fill="#e0b48a"/>
        <circle cx="21" cy="14" r="1.3" fill="#2b2620"/><circle cx="27" cy="14" r="1.3" fill="#2b2620"/>
        <path d="M21 20 q3 2 6 0" fill="none" stroke="#6b4423" stroke-width="1"/>
        <path d="M30 27 q8 4 12 -6" fill="none" stroke="#8b5a2b" stroke-width="2"/>
    `),
    sea_chart: svg(`
        <rect x="6" y="4" width="36" height="24" rx="1.5" fill="#f5e6c4" stroke="#a0703c"/>
        <path d="M10 20 q6 -6 12 -2 t12 -6" fill="none" stroke="#5dade2" stroke-width="1.5"/>
        <path d="M14 10 q3 -3 6 0 q-1 4 -6 0 z" fill="#7fb069"/>
        <circle cx="34" cy="20" r="4" fill="none" stroke="#a0703c"/>
        <path d="M34 15 v10 M29 20 h10" stroke="#a0703c" stroke-width="0.8"/>
    `),
    smugglers: svg(`
        ${sea()}
        <path d="M6 22 h22 l-4 5 h-14 z" fill="#2b2620"/>
        <rect x="11" y="16" width="7" height="6" fill="#a0703c" stroke="#6b4423" stroke-width="0.8"/>
        <rect x="18" y="17" width="6" height="5" fill="#8b5a2b" stroke="#6b4423" stroke-width="0.8"/>
        <circle cx="38" cy="8" r="4" fill="#fdfefe" opacity="0.9"/>
        <circle cx="36.5" cy="7" r="4" fill="#23345c"/>
    `),
    warehouse: svg(`
        ${ground('#b8b0a0')}
        <path d="M6 27 V12 L24 4 L42 12 V27 Z" fill="#a0703c" stroke="#6b4423"/>
        <rect x="16" y="15" width="16" height="12" fill="#6b4423"/>
        <rect x="18" y="19" width="6" height="8" fill="#c8a165" stroke="#8b6b4a" stroke-width="0.6"/>
        <rect x="24" y="21" width="6" height="6" fill="#d9b07a" stroke="#8b6b4a" stroke-width="0.6"/>
    `),
    blockade: svg(`
        ${sea()}
        <path d="M4 20 h16 l-3 5 h-10 z M28 20 h16 l-3 5 h-10 z" fill="#5d3a1a"/>
        <line x1="12" y1="8" x2="12" y2="20" stroke="#6b4423" stroke-width="1.4"/>
        <line x1="36" y1="8" x2="36" y2="20" stroke="#6b4423" stroke-width="1.4"/>
        <path d="M12 8 h7 v6 h-7 z M36 8 h7 v6 h-7 z" fill="#c0392b"/>
        <path d="M18 23 q6 -3 12 0" fill="none" stroke="#7f8c8d" stroke-width="1.5" stroke-dasharray="2 1.2"/>
    `),
    caravan: svg(`
        ${ground('#e3c98c')}
        <path d="M8 18 q4 -10 9 -2 q3 -6 6 0 h2 v4 h-17 z" fill="#c8a165"/>
        <path d="M10 22 v6 M21 22 v6" stroke="#8b6b4a" stroke-width="1.6"/>
        <path d="M25 16 q2 -6 4 -6 l2 2" fill="none" stroke="#c8a165" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="31" y="14" width="12" height="8" rx="1" fill="#a0703c"/>
        <circle cx="34" cy="24" r="2.4" fill="#6b4423"/><circle cx="40" cy="24" r="2.4" fill="#6b4423"/>
    `),
    cutpurse: svg(`
        <path d="M14 10 q-6 6 -6 12 q0 6 10 6 q10 0 10 -6 q0 -6 -6 -12 z" fill="#a8432f" stroke="#6d2a1d"/>
        <path d="M14 10 h8" stroke="#e6b84f" stroke-width="2"/>
        <path d="M30 6 L44 20" stroke="#bdc3c7" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="27" y="3" width="5" height="5" rx="1" fill="#2b2620" transform="rotate(45 29.5 5.5)"/>
        <circle cx="40" cy="26" r="3.5" fill="#c8793a" stroke="#8a4b1f"/>
    `),
    island: svg(`
        ${sea()}
        <ellipse cx="22" cy="25" rx="14" ry="4" fill="#e3c98c"/>
        <path d="M22 24 q-1 -10 3 -16" fill="none" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M25 8 q-8 -2 -12 4 M25 8 q8 -2 12 4 M25 8 q-3 -5 -9 -5 M25 8 q4 -5 10 -4" fill="none" stroke="#3f8a4c" stroke-width="2.2" stroke-linecap="round"/>
    `),
    sailor: svg(`
        ${sea()}
        <path d="M10 20 h28 l-4 6 h-20 z" fill="#8b5a2b"/>
        <line x1="24" y1="3" x2="24" y2="20" stroke="#6b4423" stroke-width="1.6"/>
        <path d="M24 4 q12 7 0 14 z" fill="#fdfefe" stroke="#bdc3c7" stroke-width="0.6"/>
        <path d="M24 6 q-9 6 0 12 z" fill="#f5ecd7" stroke="#bdc3c7" stroke-width="0.6"/>
    `),
    salvager: svg(`
        ${sea()}
        <path d="M6 26 q4 -6 10 -4 l4 -6 l10 3 l-2 7 z" fill="#7d6b5a" opacity="0.9"/>
        <path d="M34 3 v14" stroke="#7f8c8d" stroke-width="1.2"/>
        <path d="M34 17 q0 5 -4 5 M34 17 q0 5 4 5" fill="none" stroke="#5d646d" stroke-width="2"/>
        <rect x="30" y="20" width="8" height="5" fill="#c9971f" stroke="#8b6b2a" stroke-width="0.8"/>
    `),
    tide_pools: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#d9c39a"/>
        <ellipse cx="18" cy="17" rx="14" ry="9" fill="#5dade2" stroke="#7d6b5a" stroke-width="2"/>
        <path d="M14 15 l1.5 -4 l1.5 4 l4 0 l-3 2.5 l1 4 l-3.5 -2.5 l-3.5 2.5 l1 -4 l-3 -2.5 z" fill="#e67e22"/>
        <ellipse cx="38" cy="22" rx="7" ry="5" fill="#5dade2" stroke="#7d6b5a" stroke-width="2"/>
        <circle cx="38" cy="22" r="2" fill="#f1948a"/>
    `),
    treasure_map: svg(`
        <path d="M5 6 L16 4 L30 7 L43 4 L43 27 L30 29 L16 26 L5 28 Z" fill="#f5e6c4" stroke="#a0703c"/>
        <path d="M10 22 q8 -2 10 -8 t14 -4" fill="none" stroke="#a0703c" stroke-width="1.2" stroke-dasharray="2 1.5"/>
        <path d="M32 7 l5 5 M37 7 l-5 5" stroke="#c0392b" stroke-width="2" stroke-linecap="round"/>
    `),
    bazaar: svg(`
        ${ground('#d9c39a')}
        <path d="M4 12 L24 4 L44 12 Z" fill="#c0392b"/>
        <path d="M4 12 h40 v3 h-40 z" fill="#f5ecd7"/>
        <path d="M8 15 v12 M40 15 v12" stroke="#8b5a2b" stroke-width="2"/>
        <circle cx="16" cy="24" r="3" fill="#e67e22"/><circle cx="23" cy="24" r="3" fill="#f1c40f"/>
        <circle cx="30" cy="24" r="3" fill="#27ae60"/>
    `),
    corsair: svg(`
        ${sea()}
        <path d="M6 21 h30 l-5 6 h-20 z" fill="#2b2620"/>
        <line x1="20" y1="3" x2="20" y2="21" stroke="#6b4423" stroke-width="1.6"/>
        <path d="M20 4 h14 v12 h-14 z" fill="#c0392b"/>
        <circle cx="27" cy="9" r="2.4" fill="#fdfefe"/>
        <path d="M24 13 l6 0" stroke="#fdfefe" stroke-width="1.2"/>
    `),
    merchant_ship: svg(`
        ${sea()}
        <path d="M4 20 h40 l-6 7 h-28 z" fill="#8b5a2b"/>
        <line x1="16" y1="4" x2="16" y2="20" stroke="#6b4423" stroke-width="1.4"/>
        <line x1="32" y1="4" x2="32" y2="20" stroke="#6b4423" stroke-width="1.4"/>
        <path d="M10 6 h12 v11 h-12 z M26 6 h12 v11 h-12 z" fill="#f5ecd7" stroke="#bdc3c7" stroke-width="0.6"/>
        <circle cx="24" cy="23" r="2" fill="#f2c14e"/>
    `),
    outpost: svg(`
        ${ground('#7fb069')}
        <g fill="#a0703c" stroke="#6b4423" stroke-width="0.6">
            <path d="M8 27 V12 l2 -3 l2 3 V27 z"/><path d="M12 27 V12 l2 -3 l2 3 V27 z"/>
            <path d="M32 27 V12 l2 -3 l2 3 V27 z"/><path d="M36 27 V12 l2 -3 l2 3 V27 z"/>
        </g>
        <rect x="16" y="16" width="16" height="11" fill="#c8a165" stroke="#6b4423" stroke-width="0.6"/>
        <line x1="24" y1="4" x2="24" y2="16" stroke="#6b4423" stroke-width="1.2"/>
        <path d="M24 4 h8 l-2 3 l2 3 h-8 z" fill="#2e86c1"/>
    `),
    pirate: svg(`
        <path d="M8 14 Q24 2 40 14 Z" fill="#2b2620"/>
        <circle cx="24" cy="10" r="2.2" fill="#fdfefe"/>
        <circle cx="24" cy="20" r="8" fill="#e0b48a"/>
        <path d="M17 18 h14" stroke="#2b2620" stroke-width="1"/>
        <circle cx="21" cy="19" r="2.4" fill="#2b2620"/>
        <circle cx="27" cy="19" r="1.2" fill="#2b2620"/>
        <path d="M21 25 q3 2 6 0" fill="none" stroke="#6b4423" stroke-width="1"/>
    `),
    sea_witch: svg(`
        ${sea()}
        <path d="M15 24 Q21 13 23 6 Q26 1 31 4 Q27 7 33 24 Z" fill="#1f6f78"/>
        <path d="M16.6 20.5 Q24 18.5 31.6 20.5 L32.4 23 Q24 21 15.8 23 Z" fill="#5dade2"/>
        <path d="M38 6 v10 M35 8 v5 M41 8 v5 M35 13 q3 3 6 0" fill="none" stroke="#c9971f" stroke-width="1.4"/>
    `),
    tactician: svg(`
        <rect x="4" y="5" width="40" height="23" rx="2" fill="#7fb069" stroke="#4f7a3f"/>
        <path d="M10 22 l6 -6 l6 4 l8 -9" fill="none" stroke="#c0392b" stroke-width="1.6"/>
        <path d="M28 10 l3 1 l-1 3" fill="none" stroke="#c0392b" stroke-width="1.6"/>
        <circle cx="12" cy="11" r="2.4" fill="#2e86c1"/><circle cx="36" cy="22" r="2.4" fill="#2b2620"/>
    `),
    treasury: svg(`
        <rect x="8" y="12" width="32" height="16" rx="2" fill="#8b5a2b" stroke="#5d3a1a"/>
        <path d="M8 12 q16 -10 32 0 z" fill="#a0703c" stroke="#5d3a1a"/>
        <rect x="21" y="16" width="6" height="6" rx="1" fill="#c9971f"/>
        <circle cx="14" cy="10" r="2.5" fill="#f2c14e"/><circle cx="34" cy="10" r="2.5" fill="#f2c14e"/>
        <circle cx="24" cy="7" r="2.5" fill="#f2c14e"/>
    `),
    wharf: svg(`
        ${sea()}
        <rect x="2" y="17" width="26" height="4" fill="#a0703c"/>
        <path d="M6 21 v8 M14 21 v8 M22 21 v8" stroke="#6b4423" stroke-width="2"/>
        <rect x="8" y="11" width="6" height="6" fill="#c8a165" stroke="#8b6b4a" stroke-width="0.6"/>
        <path d="M30 20 h14 l-3 5 h-9 z" fill="#8b5a2b"/>
        <line x1="37" y1="8" x2="37" y2="20" stroke="#6b4423" stroke-width="1.2"/>
        <path d="M37 9 l6 9 h-6 z" fill="#fdfefe"/>
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

// 拡張のイラストは拡張ごとのファイルに分けている
const ALL_ART = { ...CARD_ART, ...INTRIGUE_ART, ...PROSPERITY_ART, ...HINTERLANDS_ART, ...CORNUCOPIA_GUILDS_ART };

// カードIDに対応するイラストのSVG（なければ空文字）
export function getCardArt(cardId) {
    return ALL_ART[cardId.toLowerCase()] ?? '';
}
