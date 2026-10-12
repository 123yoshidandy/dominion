/** 拡張「冒険」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground, sea, coin } from './card-art-helpers.js';

// 旅を感じる明るい色合い
const MEADOW = '#9ccc65';
const ROAD = '#d9b77a';
const SKIN = '#f5cba7';
const WOOD = '#9c6b3c';
const WOOD_EDGE = '#6e4a28';
const PARCHMENT = '#f6e3b4';
const PARCHMENT_EDGE = '#c49a52';
const STEEL = '#b8c4cc';
const STEEL_EDGE = '#6b7b86';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';

// 立っている人（x は体の中心、cloth は服の色）
const person = (x, cloth, { skin = SKIN, hair = '', scale = 1 } = {}) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 2} 23 v4 M${x + 2} 23 v4" stroke="#5d4037" stroke-width="1.6"/>
        <path d="M${x - 4} 23 L${x - 3} 14.5 h6 L${x + 4} 23 z" fill="${cloth}"/>
        <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
        ${hair}
    </g>`;

// 髪（person の上に重ねる）
const hairCap = (x, color) => `<path d="M${x - 3} 10.5 q3 -5 6 0" fill="${color}"/>`;

// 腕（肩から手先まで）
const arm = (x1, y1, x2, y2) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${SKIN}" stroke-width="1.4" stroke-linecap="round"/>`;

// 剣（柄が下で刃が上、x,y は柄の位置）
const sword = (x, y, len = 12) => `
    <path d="M${x} ${y} V${y - len}" stroke="${STEEL}" stroke-width="1.6"/>
    <path d="M${x} ${y - len - 1.5} l-0.8 1.5 h1.6z" fill="${STEEL}"/>
    <path d="M${x - 2.2} ${y} h4.4" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
    <path d="M${x} ${y} v2.5" stroke="${WOOD_EDGE}" stroke-width="1.4"/>`;

// 丸い盾（色と模様）
const roundShield = (x, y, r, fill, mark = '') => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${GOLD_EDGE}" stroke-width="1"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${GOLD}"/>
    ${mark}`;

// 槍（下端 x,y から上へ）
const spear = (x, y, len = 22) => `
    <path d="M${x} ${y} V${y - len}" stroke="${WOOD}" stroke-width="1.2"/>
    <path d="M${x} ${y - len - 4} l-1.6 4 h3.2z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>`;

// 広げた地図（x,y は左上）
const map = (x, y, w = 16, h = 11) => `
    <path d="M${x} ${y + 1} l${w / 3} -1 l${w / 3} 1 l${w / 3} -1 v${h} l${-w / 3} 1 l${-w / 3} -1 l${-w / 3} 1z"
        fill="${PARCHMENT}" stroke="${PARCHMENT_EDGE}" stroke-width="0.7"/>
    <path d="M${x + w / 3} ${y} v${h + 1} M${x + w * 2 / 3} ${y + 1} v${h}" stroke="${PARCHMENT_EDGE}" stroke-width="0.4"/>
    <path d="M${x + 2} ${y + h - 2} q${w / 4} -5 ${w / 2} -2 t${w / 2 - 4} -4" fill="none" stroke="#c0392b" stroke-width="0.7" stroke-dasharray="1.2 0.8"/>
    <path d="M${x + w - 3.5} ${y + 2.5} l2 2 M${x + w - 1.5} ${y + 2.5} l-2 2" stroke="#c0392b" stroke-width="0.8"/>`;

// 馬（横向き、x は胴の中心、頭は右向き）
const horse = (x, color = '#a0522d', mane = '#5d3a1a') => `
    <path d="M${x - 6} 21 v6 M${x - 3} 21 v6 M${x + 3} 21 v6 M${x + 6} 21 v6" stroke="${color}" stroke-width="1.6"/>
    <ellipse cx="${x}" cy="18" rx="8" ry="4.5" fill="${color}"/>
    <path d="M${x + 5} 16 l4 -7 l3 1 l2 3 l-2 1 l-3 -1 l-1 5z" fill="${color}"/>
    <path d="M${x + 6} 14 l3 -6 l-2 0 l-3 6z" fill="${mane}"/>
    <path d="M${x - 8} 17 q-4 2 -3 7" fill="none" stroke="${mane}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="${x + 11.5}" cy="11" r="0.6" fill="#2b2620"/>`;

// 木（幹と丸い葉）
const tree = (x, y, r = 5, leaf = '#5aa64a') => `
    <rect x="${x - 1}" y="${y}" width="2" height="${27 - y}" fill="${WOOD}"/>
    <circle cx="${x}" cy="${y - r * 0.4}" r="${r}" fill="${leaf}"/>`;

// とがった針葉樹
const pine = (x, y, h = 12, leaf = '#3e8e41') => `
    <rect x="${x - 0.8}" y="${y + h}" width="1.6" height="${27 - y - h}" fill="${WOOD}"/>
    <path d="M${x} ${y} l${h * 0.35} ${h} h${-h * 0.7}z" fill="${leaf}"/>`;

// 金貨（小さな丸）
const gold = (x, y, r = 2) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>`;

// きらめき（十字の星）
const sparkle = (x, y, s = 2, color = '#fff59d') =>
    `<path d="M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}z" fill="${color}"/>`;

// 開いた本（x,y は綴じ目の下端）
const book = (x, y, w = 8, cover = '#2e86c1') => `
    <path d="M${x} ${y} l${-w} -2 v-7 l${w} 2z M${x} ${y} l${w} -2 v-7 l${-w} 2z" fill="#fdf6e3" stroke="${cover}" stroke-width="0.9"/>
    <path d="M${x - w + 1.5} ${y - 6} l${w - 3} 1 M${x - w + 1.5} ${y - 4} l${w - 3} 1 M${x + 1.5} ${y - 5} l${w - 3} -1 M${x + 1.5} ${y - 3} l${w - 3} -1"
        stroke="#c9b98e" stroke-width="0.5"/>`;

// 空（上半分の明るい青）
const sky = (color = '#d6eefc') => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

export const ADVENTURES_ART = {
    // ===== コスト2 =====
    // 王冠の紋章が入った硬貨
    coin_of_the_realm: coin('#f4c430', '#b8860b', '#fff2a8', `
        <path d="M19 19 v-5 l2.5 2 l2.5 -3 l2.5 3 l2.5 -2 v5z" fill="#c0392b" stroke="#8e2a1e" stroke-width="0.5"/>
        ${sparkle(38, 6, 2.4)}
    `),
    // 剣を掲げる少年
    page: svg(`
        ${ground(MEADOW)}
        ${person(21, '#3498db', { hair: hairCap(21, '#d4a04c'), scale: 0.9 })}
        ${arm(23.5, 17, 28, 14)}
        ${sword(28.5, 14.5, 11)}
        <path d="M17 15 l-2 9 h4z" fill="#e74c3c"/>
    `),
    // 鍬を持つ農民
    peasant: svg(`
        ${ground('#b5884f')}
        <path d="M2 29 h44" stroke="#8d6239" stroke-width="0.6"/>
        ${person(20, '#8bc34a', { hair: '<path d="M15.5 9.5 h9 l-2 -3.5 h-5z" fill="#e8c96a"/>' })}
        <path d="M30 4 L24 26" stroke="${WOOD}" stroke-width="1.4"/>
        <path d="M24 26 l-4 0.5 l1 -2.5z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        ${arm(22, 16, 27, 13)}
        <path d="M36 27 q1 -5 3 -6 M40 27 q0 -4 2 -6" stroke="#4caf50" stroke-width="1.2" fill="none"/>
    `),
    // 縦笛とネズミ
    ratcatcher: svg(`
        ${ground(MEADOW)}
        <path d="M8 6 L20 18" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="11" cy="9" r="0.6" fill="#3e2723"/><circle cx="13.5" cy="11.5" r="0.6" fill="#3e2723"/><circle cx="16" cy="14" r="0.6" fill="#3e2723"/>
        <path d="M22 8 q2 -2 1 -4 M25 11 q3 -1 3 -3" fill="none" stroke="#7e57c2" stroke-width="0.8"/>
        <circle cx="25" cy="5" r="1" fill="#7e57c2"/><path d="M26 5 v-3" stroke="#7e57c2" stroke-width="0.6"/>
        <ellipse cx="34" cy="23.5" rx="6" ry="3.5" fill="#8d8d8d"/>
        <circle cx="39.5" cy="21.5" r="2.5" fill="#8d8d8d"/>
        <circle cx="38.5" cy="19.3" r="1.2" fill="#f8bbd0"/>
        <circle cx="41" cy="21" r="0.5" fill="#2b2620"/>
        <path d="M28 24 q-4 0 -6 -3" fill="none" stroke="#f8bbd0" stroke-width="0.9"/>
    `),
    // 崩れる石壁とハンマー
    raze: svg(`
        ${ground(ROAD)}
        ${[[6, 21], [14, 21], [10, 15], [18, 15], [6, 9]].map(([x, y]) =>
            `<rect x="${x}" y="${y}" width="7.5" height="5.5" fill="#c8b89a" stroke="#8a7a5e" stroke-width="0.6"/>`).join('')}
        <rect x="22" y="23" width="5" height="4" fill="#c8b89a" stroke="#8a7a5e" stroke-width="0.6" transform="rotate(15 24 25)"/>
        <rect x="16" y="11" width="4" height="3" fill="#c8b89a" stroke="#8a7a5e" stroke-width="0.6" transform="rotate(-20 18 12)"/>
        <path d="M29 7 l3 -1 l1 1 M30 12 l2 1" stroke="#8a7a5e" stroke-width="0.8"/>
        <path d="M42 25 L33 8" stroke="${WOOD}" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="27" y="4" width="11" height="5" rx="1" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.7" transform="rotate(-28 32.5 6.5)"/>
    `),

    // ===== コスト3 =====
    // 鎖で下げた首飾りのお守り
    amulet: svg(`
        <path d="M10 3 Q24 26 38 3" fill="none" stroke="${GOLD_EDGE}" stroke-width="1" stroke-dasharray="1.4 0.8"/>
        <circle cx="24" cy="19" r="7" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <circle cx="24" cy="19" r="4" fill="#26a69a"/>
        <circle cx="22.8" cy="17.8" r="1.2" fill="#b2dfdb"/>
        ${sparkle(35, 15, 2)}${sparkle(12, 20, 1.6)}
    `),
    // 槍を持つ護衛と荷馬車
    caravan_guard: svg(`
        ${ground(ROAD)}
        <rect x="22" y="13" width="20" height="8" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        <path d="M22 13 q10 -10 20 0z" fill="#f5f0e1" stroke="#c9bfa2" stroke-width="0.7"/>
        <circle cx="26" cy="23" r="3.5" fill="none" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <circle cx="38" cy="23" r="3.5" fill="none" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        ${person(12, '#c0392b', { hair: '<path d="M8.6 10.5 q3.4 -6 6.8 0z" fill="' + STEEL + '"/>' })}
        ${spear(6, 27, 20)}
        ${arm(9.5, 17, 6.5, 16)}
    `),
    // 石壁の鉄格子
    dungeon: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#a1887f"/>
        ${[0, 8, 16, 24].map((y, i) => [0, 1, 2, 3, 4, 5, 6].map(c =>
            `<rect x="${c * 8 - (i % 2) * 4}" y="${y}" width="8" height="8" fill="none" stroke="#8d6e63" stroke-width="0.6"/>`).join('')).join('')}
        <rect x="12" y="6" width="24" height="20" fill="#3e3a46" stroke="#5d4037" stroke-width="1.2"/>
        ${[16, 21, 26, 31].map(x => `<rect x="${x}" y="6" width="1.6" height="20" fill="${STEEL}"/>`).join('')}
        <rect x="12" y="13" width="24" height="1.4" fill="${STEEL}"/>
        <circle cx="40" cy="18" r="2" fill="none" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <path d="M40 20 v4 h1.5" stroke="${GOLD_EDGE}" stroke-width="0.8" fill="none"/>
    `),
    // 背負い袋と巻いたロープ
    gear: svg(`
        ${ground(MEADOW)}
        <path d="M10 26 v-14 q0 -6 7 -6 q7 0 7 6 v14z" fill="#c68642" stroke="#8d5524" stroke-width="0.8"/>
        <path d="M10 13 q7 -4 14 0 v4 q-7 3 -14 0z" fill="#a0522d"/>
        <rect x="15.5" y="15.5" width="3" height="2.4" fill="${GOLD}"/>
        <path d="M11 9 q-3 1 -3 6 M23 9 q3 1 3 6" fill="none" stroke="#8d5524" stroke-width="1"/>
        <ellipse cx="35" cy="21" rx="8" ry="5.5" fill="none" stroke="#d4b483" stroke-width="2.2"/>
        <ellipse cx="35" cy="21" rx="5" ry="3.2" fill="none" stroke="#d4b483" stroke-width="2"/>
        <path d="M43 21 q2 3 0 6" fill="none" stroke="#d4b483" stroke-width="1.6"/>
    `),
    // 地図を広げて杖を持つ人
    guide: svg(`
        ${ground(MEADOW)}
        ${person(14, '#2e7d32', { hair: '<path d="M9.5 9.5 h9 l-1.5 -3.5 h-6z" fill="#795548"/>' })}
        <path d="M9 5 V27" stroke="${WOOD}" stroke-width="1.4"/>
        <circle cx="9" cy="5" r="1.4" fill="${WOOD_EDGE}"/>
        ${arm(11, 17, 9, 17)}
        ${arm(17, 17, 22, 16)}
        ${map(22, 10, 18, 12)}
    `),

    // ===== コスト4 =====
    // 鏡に映る同じ形
    duplicate: svg(`
        <rect x="25" y="3" width="18" height="24" rx="2" fill="#d6eefc" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
        <path d="M28 6 l3 -2 M28 10 l7 -5" stroke="#fff" stroke-width="0.9"/>
        <path d="M10 22 l5 -11 l5 11z" fill="#ef5350" stroke="#b71c1c" stroke-width="0.7"/>
        <path d="M29 22 l5 -11 l5 11z" fill="#ef9a9a" stroke="#e57373" stroke-width="0.7"/>
        <circle cx="15" cy="24.5" r="1.4" fill="${GOLD}"/><circle cx="34" cy="24.5" r="1.4" fill="#fbe7a1"/>
        <rect x="31" y="27" width="6" height="2" fill="${GOLD_EDGE}"/>
    `),
    // 白黒の鳥と光る物
    magpie: svg(`
        ${sky()}
        ${ground(MEADOW)}
        <path d="M6 27 q4 -8 10 -6" fill="none" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M14 19 q4 -9 14 -6 l4 3 l-4 2 q-6 5 -14 1z" fill="#263238"/>
        <path d="M17 18.5 q5 -3 10 -1 q-4 4 -10 1z" fill="#fafafa"/>
        <path d="M14 18 l-10 5 l1 -2.5 l9 -4z" fill="#1e3a5f"/>
        <circle cx="28" cy="13.5" r="0.8" fill="#fff"/>
        <path d="M32 16 l2 0.6 l-2 0.6z" fill="#424242"/>
        <path d="M23 21 l-1 4 M26 21 l0 4" stroke="#424242" stroke-width="0.8"/>
        ${gold(38, 24, 2.4)}${sparkle(38, 18, 2.2, '#fff176')}${sparkle(43, 22, 1.4, '#fff176')}
    `),
    // 手紙を運ぶ馬
    messenger: svg(`
        ${sky()}
        ${ground(ROAD)}
        ${horse(18)}
        <path d="M14 13.5 h8 v4 h-8z" fill="#e53935"/>
        <rect x="32" y="4" width="13" height="9" fill="#fff8e1" stroke="${PARCHMENT_EDGE}" stroke-width="0.8"/>
        <path d="M32 4 l6.5 5 l6.5 -5" fill="none" stroke="${PARCHMENT_EDGE}" stroke-width="0.8"/>
        <circle cx="38.5" cy="9" r="1.5" fill="#c0392b"/>
        <path d="M4 10 h6 M2 14 h5" stroke="#90a4ae" stroke-width="0.8"/>
    `),
    // 硬貨の袋を抱える老人
    miser: svg(`
        ${ground('#d7ccc8')}
        ${person(17, '#6d4c41', { skin: SKIN })}
        <path d="M14 13 q3 4 6 0 q-1 5 -3 5 q-2 0 -3 -5z" fill="#eceff1"/>
        <path d="M13.5 9.5 q3.5 -4 7 0 M14 9 v1" stroke="#eceff1" stroke-width="1" fill="none"/>
        <path d="M20 20 q4 -7 9 -7 q6 0 7 7 q0 7 -8 7 q-8 0 -8 -7z" fill="#a1887f" stroke="#6d4c41" stroke-width="0.7"/>
        <path d="M26 13 l2 -2 l2 2" fill="none" stroke="#6d4c41" stroke-width="0.8"/>
        ${gold(28, 20, 2.2)}
        ${arm(14, 17, 22, 21)}
        ${gold(38, 25.5, 1.6)}${gold(41.5, 25.5, 1.6)}${gold(39.8, 23, 1.6)}
    `),
    // 桟橋と帆船
    port: svg(`
        ${sky()}
        ${sea()}
        <rect x="0" y="20" width="18" height="3" fill="${WOOD}"/>
        ${[3, 9, 15].map(x => `<rect x="${x}" y="23" width="1.6" height="9" fill="${WOOD_EDGE}"/>`).join('')}
        <rect x="2" y="13" width="9" height="7" fill="#ffe0b2" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M1 13 l5.5 -4 l5.5 4z" fill="#e57373"/>
        <path d="M24 22 h20 l-3 5 h-14z" fill="#8d6e63"/>
        <path d="M34 22 V5" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <path d="M34 6 q8 7 0 14z" fill="#fff"/>
        <path d="M33 7 q-6 6 0 12z" fill="#fafafa"/>
        <path d="M34 5 l4 1.5 l-4 1.5z" fill="#e53935"/>
    `),
    // 弓を引く森の狩人
    ranger: svg(`
        ${ground('#7cb342')}
        ${pine(5, 6, 16, '#2e7d32')}${pine(42, 4, 18, '#388e3c')}
        ${person(20, '#558b2f', { hair: '<path d="M16.5 10 L20 3 L23.5 10z" fill="#33691e"/>' })}
        <path d="M30 6 q6 9 0 18" fill="none" stroke="${WOOD}" stroke-width="1.4"/>
        <path d="M30 6 L23 15 L30 24" fill="none" stroke="#eceff1" stroke-width="0.5"/>
        <path d="M23 15 H38" stroke="${WOOD_EDGE}" stroke-width="0.9"/>
        <path d="M38 15 l-2 -1.2 v2.4z" fill="${STEEL_EDGE}"/>
        ${arm(22, 16, 30, 15)}
    `),
    // 渦の中で形が変わる物
    transmogrify: svg(`
        <path d="M24 16 m-1 0 a1 1 0 0 1 2 0 a3 3 0 0 1 -5 1 a5 5 0 0 1 9 -3 a7 7 0 0 1 -10 9 a9 9 0 0 1 3 -16"
            fill="none" stroke="#ab47bc" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="3" y="12" width="8" height="8" fill="#42a5f5" stroke="#1565c0" stroke-width="0.8"/>
        <path d="M13 16 h4" stroke="#7e57c2" stroke-width="1.2"/>
        <path d="M31 16 h4" stroke="#7e57c2" stroke-width="1.2"/>
        <path d="M34 15 l1.5 1 l-1.5 1" fill="none" stroke="#7e57c2" stroke-width="1"/>
        <path d="M42 10 l2 4.5 l4.5 0.5 l-3.5 3 l1 4.5 l-4 -2.5 l-4 2.5 l1 -4.5 l-3.5 -3 l4.5 -0.5z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        ${sparkle(20, 5, 1.6, '#e1bee7')}${sparkle(30, 27, 1.4, '#e1bee7')}
    `),

    // ===== コスト5 =====
    // 作業台と金槌・のこぎり
    artificer: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#fbe9d0"/>
        <rect x="4" y="16" width="40" height="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M7 19 v9 M41 19 v9" stroke="${WOOD_EDGE}" stroke-width="2"/>
        <path d="M9 15 l3 -6" stroke="${WOOD}" stroke-width="1.4"/>
        <rect x="9" y="6" width="6" height="3" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5" transform="rotate(25 12 7.5)"/>
        <path d="M20 15 h12 l-1 -4 h-11z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        <path d="M20 14 l1 -1 l1 1 l1 -1 l1 1 l1 -1 l1 1 l1 -1 l1 1 l1 -1 l1 1" fill="none" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <rect x="32" y="10" width="4" height="5" rx="1" fill="${WOOD_EDGE}"/>
        <path d="M37 15 l2 -8 l2 8z" fill="#ffb74d" stroke="#e65100" stroke-width="0.5"/>
        <circle cx="39" cy="9" r="0.6" fill="#e65100"/>
        <path d="M2 4 h12 M34 4 h12" stroke="${WOOD_EDGE}" stroke-width="1"/>
    `),
    // 石橋の下にいる緑のトロル
    bridge_troll: svg(`
        ${sky()}
        <rect x="0" y="27" width="48" height="5" fill="#64b5f6"/>
        <path d="M0 6 h48 v6 h-6 q-18 -2 -36 0 h-6z" fill="#bcaaa4" stroke="#8d6e63" stroke-width="0.7"/>
        <path d="M0 12 h6 v15 h-6z M42 12 h6 v15 h-6z" fill="#bcaaa4" stroke="#8d6e63" stroke-width="0.7"/>
        <path d="M14 6 v6 M24 6 v5 M34 6 v6" stroke="#8d6e63" stroke-width="0.6"/>
        <ellipse cx="24" cy="25" rx="9" ry="6" fill="#7cb342"/>
        <circle cx="24" cy="17" r="5" fill="#8bc34a"/>
        <circle cx="22" cy="16.5" r="1" fill="#fff"/><circle cx="26" cy="16.5" r="1" fill="#fff"/>
        <circle cx="22" cy="16.7" r="0.5" fill="#2b2620"/><circle cx="26" cy="16.7" r="0.5" fill="#2b2620"/>
        <path d="M21 20 q3 2 6 0" fill="none" stroke="#33691e" stroke-width="0.8"/>
        <path d="M22.5 20.4 l0.6 1.2 l0.6 -1 M25.5 20.4 l-0.6 1.2 l-0.6 -1" fill="#fff"/>
    `),
    // 遠くの山並みと地平線へ続く道
    distant_lands: svg(`
        ${sky('#bfe3f7')}
        <circle cx="38" cy="8" r="3.5" fill="#ffe082"/>
        <path d="M0 18 l8 -8 l6 5 l8 -10 l9 9 l6 -5 l11 9 v4 h-48z" fill="#9fa8da"/>
        <path d="M22 5 l-3 3.6 h2 l1 -1 l1.2 1.4 l2.4 -0.3z" fill="#fff"/>
        <path d="M0 20 h48 v12 h-48z" fill="${MEADOW}"/>
        <path d="M22 20 h4 l10 12 h-24z" fill="${ROAD}"/>
        <path d="M24 22 v2 M24 26 v3" stroke="#fff8e1" stroke-width="0.8"/>
        ${pine(6, 14, 10, '#43a047')}${pine(42, 15, 9, '#43a047')}
    `),
    // 大きな足と小さな木
    giant: svg(`
        ${sky()}
        ${ground(MEADOW)}
        <path d="M14 0 h12 v15 q4 0 10 3 q6 3 4 9 h-26z" fill="#d7a77a" stroke="#8d5524" stroke-width="0.8"/>
        <path d="M13 0 h14 v8 h-14z" fill="#795548"/>
        <path d="M30 22 a1.5 1.5 0 0 1 3 0 M34 22.5 a1.5 1.5 0 0 1 3 0 M37.5 24 a1.3 1.3 0 0 1 2.6 0" fill="none" stroke="#8d5524" stroke-width="0.6"/>
        ${tree(6, 22, 3, '#4caf50')}${tree(44, 21, 3, '#66bb6a')}
        <path d="M10 27 l2 -2 M42 26 l3 -1" stroke="#8d6e63" stroke-width="0.6"/>
    `),
    // 暗い森と白い幽霊
    haunted_woods: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#37474f"/>
        <circle cx="40" cy="6" r="3.5" fill="#fff9c4"/>
        ${ground('#2e3d2f')}
        ${pine(5, 5, 18, '#1b5e20')}${pine(14, 8, 15, '#2e7d32')}${pine(42, 9, 15, '#1b5e20')}
        <path d="M22 26 q-2 -4 0 -14 q4 -8 8 0 q2 10 0 14 l-1.5 -2 l-1.5 2 l-1.5 -2 l-1.5 2 l-1 -2z" fill="#eceff1" opacity="0.92"/>
        <circle cx="24.5" cy="13" r="1" fill="#263238"/><circle cx="28" cy="13" r="1" fill="#263238"/>
        <ellipse cx="26.2" cy="16.5" rx="1" ry="1.4" fill="#263238"/>
    `),
    // 崩れた柱の並ぶ遺跡の都市
    lost_city: svg(`
        ${sky('#ffe0b2')}
        ${ground('#e0c48a')}
        <path d="M4 27 v-12 l6 -4 l6 4 v12z" fill="#d7ccc8" stroke="#a1887f" stroke-width="0.7"/>
        <path d="M8 27 v-6 a2 2 0 0 1 4 0 v6z" fill="#8d6e63"/>
        <rect x="20" y="9" width="20" height="2.5" fill="#d7ccc8" stroke="#a1887f" stroke-width="0.6"/>
        <path d="M18 9 l12 -5 l12 5z" fill="#d7ccc8" stroke="#a1887f" stroke-width="0.6"/>
        ${[22, 27, 32, 37].map((x, i) => `<rect x="${x}" y="${i === 2 ? 17 : 11.5}" width="2.4" height="${i === 2 ? 10 : 15.5}" fill="#efebe9" stroke="#a1887f" stroke-width="0.5"/>`).join('')}
        <rect x="31" y="24" width="5" height="2.5" fill="#efebe9" stroke="#a1887f" stroke-width="0.5" transform="rotate(-15 33 25)"/>
        <path d="M5 15 q-2 -4 1 -6 M16 16 q3 -2 2 -6" fill="none" stroke="#66bb6a" stroke-width="1"/>
    `),
    // 光る聖杯
    relic: svg(`
        <circle cx="24" cy="13" r="12" fill="#fff9c4" opacity="0.8"/>
        <path d="M24 0 v3 M12 3 l2 2 M36 3 l-2 2 M8 13 h3 M40 13 h-3" stroke="#ffd54f" stroke-width="1.2"/>
        <path d="M16 7 h16 q0 9 -8 10 q-8 -1 -8 -10z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <path d="M23 17 h2 v6 h-2z" fill="${GOLD_EDGE}"/>
        <path d="M18 27 q6 -5 12 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <circle cx="24" cy="11" r="1.6" fill="#e53935"/>
        <circle cx="19.5" cy="10" r="0.9" fill="#1e88e5"/><circle cx="28.5" cy="10" r="0.9" fill="#1e88e5"/>
    `),
    // 王冠の飾りのついた豪華な馬車
    royal_carriage: svg(`
        ${ground(ROAD)}
        <path d="M10 22 v-10 q0 -4 4 -4 h14 q4 0 4 4 v10z" fill="#8e24aa" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <rect x="14" y="11" width="6" height="6" fill="#e1f5fe" stroke="${GOLD}" stroke-width="0.8"/>
        <rect x="23" y="11" width="6" height="6" fill="#e1f5fe" stroke="${GOLD}" stroke-width="0.8"/>
        <path d="M17 8 v-3 l2 1.5 l2 -2.5 l2 2.5 l2 -1.5 v3z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <circle cx="14" cy="24" r="4" fill="#fff8e1" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <circle cx="29" cy="24" r="4" fill="#fff8e1" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <path d="M14 20 v8 M10 24 h8 M29 20 v8 M25 24 h8" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M32 18 L44 14" stroke="${WOOD}" stroke-width="1.2"/>
        <path d="M6 10 l2 -3 M4 15 h-3" stroke="${GOLD}" stroke-width="0.9"/>
    `),
    // たき火のそばで本を読み聞かせる人
    storyteller: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#283593"/>
        ${sparkle(8, 5, 1.2)}${sparkle(42, 4, 1.2)}${sparkle(30, 3, 0.9)}
        ${ground('#5d4037')}
        ${person(14, '#ff8f00', { hair: '<path d="M10.5 10.5 q3.5 -6 7 0 v3 q-3.5 -2 -7 0z" fill="#90a4ae"/>' })}
        ${book(22, 20, 6, '#c62828')}
        ${arm(16.5, 17, 19, 17)}
        <path d="M32 27 l8 -2 M32 25 l8 2" stroke="${WOOD_EDGE}" stroke-width="1.4"/>
        <path d="M32 25 q1 -7 4 -10 q0 4 2 3 q1 -2 0 -5 q4 4 3 12z" fill="#ff7043"/>
        <path d="M34 25 q1 -4 2.5 -6 q0 3 1.5 2 q1 2 0 4z" fill="#ffee58"/>
    `),
    // 沼の水面と魔女の帽子をかぶった老婆
    swamp_hag: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#c5e1a5"/>
        <path d="M0 24 q6 -2 12 0 t12 0 t12 0 t12 0 V32 H0z" fill="#558b2f"/>
        <ellipse cx="38" cy="27" rx="5" ry="1.4" fill="#33691e"/>
        <path d="M6 24 v-6 M8 24 v-8 M42 24 v-7" stroke="#689f38" stroke-width="1"/>
        <ellipse cx="8" cy="15.5" rx="0.9" ry="2" fill="#6d4c41"/>
        <path d="M16 28 L19 15 h10 L32 28z" fill="#4a148c"/>
        <circle cx="24" cy="12" r="3.5" fill="#aed581"/>
        <path d="M17 9.5 h14 l-3 -1 l-4 -8 l-3 9z" fill="#311b92"/>
        <path d="M26.5 12.5 l2 1.5 l-2 0.3" fill="#9ccc65"/>
        <circle cx="23" cy="11.5" r="0.6" fill="#2b2620"/>
        <circle cx="37" cy="20" r="0.9" fill="#aed581"/><circle cx="34" cy="17" r="0.6" fill="#aed581"/>
    `),
    // ふたの開いた宝箱と金貨
    treasure_trove: svg(`
        ${ground('#e6cf95')}
        <path d="M11 14 L13 3 h22 L37 14z" fill="#7a4f28" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M13 3 h22" stroke="${GOLD}" stroke-width="1.4"/>
        ${gold(16, 13, 2.2)}${gold(20, 11.5, 2.2)}${gold(24, 12.5, 2.2)}${gold(28, 11.5, 2.2)}${gold(32, 13, 2.2)}
        <rect x="10" y="14" width="28" height="12" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M10 14 h28 M15 14 v12 M33 14 v12" stroke="${GOLD}" stroke-width="1.6"/>
        <rect x="22" y="16" width="4" height="4.5" rx="0.5" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        ${gold(6, 25.5, 1.8)}${gold(42, 25.5, 1.8)}${gold(44, 22.5, 1.6)}
        ${sparkle(40, 7, 2.2)}${sparkle(7, 9, 1.6)}
    `),
    // ワイン樽とワイン瓶
    wine_merchant: svg(`
        ${ground('#d7b98a')}
        <ellipse cx="17" cy="18" rx="11" ry="9" fill="#a1662f" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M8 13 q9 -3 18 0 M8 23 q9 3 18 0" fill="none" stroke="#5d4037" stroke-width="1.4"/>
        <path d="M14 10 v16 M20 10 v16" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <circle cx="17" cy="18" r="1.4" fill="#5d4037"/>
        <path d="M34 27 v-11 q0 -3 2 -4 v-5 h3 v5 q2 1 2 4 v11z" fill="#2e7d32" stroke="#1b5e20" stroke-width="0.6"/>
        <rect x="35" y="18" width="5" height="5" fill="#fff8e1"/>
        <rect x="36" y="5.5" width="3" height="2" fill="#8e244d"/>
        <path d="M41 27 v-4 q-2 -1 -2 -4 h6 q0 3 -2 4 v4z" fill="#ad1457" opacity="0.85"/>
        <path d="M40 27 h4" stroke="#ad1457" stroke-width="0.8"/>
    `),

    // ===== コスト6 =====
    // 契約書と羽ペンを持つ人
    hireling: svg(`
        ${ground(MEADOW)}
        ${person(13, '#5c6bc0', { hair: hairCap(13, '#4e342e') })}
        ${arm(15.5, 17, 20, 16)}
        <path d="M21 5 h18 v20 h-18z" fill="#fff8e1" stroke="${PARCHMENT_EDGE}" stroke-width="0.8"/>
        <path d="M23.5 9 h13 M23.5 12 h13 M23.5 15 h10 M23.5 18 h7" stroke="#bcaaa4" stroke-width="0.7"/>
        <circle cx="34" cy="21" r="2.2" fill="#c62828"/>
        <path d="M44 3 q-4 3 -7 12 l1 0.5 q4 -7 6 -12.5z" fill="#eceff1" stroke="#90a4ae" stroke-width="0.5"/>
        <path d="M37 15 l-1 3" stroke="#455a64" stroke-width="0.7"/>
    `),

    // ===== トラベラーの上位カード =====
    // シャベルと宝の地図
    treasure_hunter: svg(`
        ${ground('#e6cf95')}
        ${map(4, 8, 22, 15)}
        <path d="M34 2 L38 22" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M32 2 h4" stroke="${WOOD_EDGE}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M35.5 21 l5 -1 l1.5 6 q-3 2 -5 0z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
        <path d="M28 27 q4 -3 8 0" fill="#c8a165"/>
        ${gold(45, 25.5, 1.6)}
    `),
    // 剣と盾を構える戦士
    warrior: svg(`
        ${ground(ROAD)}
        ${person(22, '#b71c1c', { hair: '<path d="M18.5 11 q3.5 -7 7 0 v-1 h-7z" fill="' + STEEL + '"/><path d="M22 4 v-2" stroke="' + STEEL_EDGE + '" stroke-width="1"/>' })}
        ${arm(24.5, 16, 31, 13)}
        ${sword(31.5, 13.5, 11)}
        ${roundShield(15, 19, 6, '#1565c0')}
    `),
    // マントをなびかせる英雄
    hero: svg(`
        ${sky()}
        ${ground(MEADOW)}
        <path d="M21 14 q-10 3 -14 12 q6 -2 9 1 q2 -5 7 -9z" fill="#e53935"/>
        ${person(24, '#1e88e5', { hair: hairCap(24, '#f9a825') })}
        <path d="M21 15 h6" stroke="${GOLD}" stroke-width="1.2"/>
        ${arm(26.5, 16, 31, 9)}
        ${sword(31.5, 9.5, 8)}
        ${sparkle(40, 6, 2)}
    `),
    // 月桂冠と鎧
    champion: svg(`
        <circle cx="24" cy="16" r="15" fill="#fff8e1"/>
        <path d="M14 6 q-6 10 4 20 M34 6 q6 10 -4 20" fill="none" stroke="#558b2f" stroke-width="1"/>
        ${[[13, 9], [11.5, 14], [12.5, 19], [15.5, 23]].map(([x, y]) =>
            `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1" fill="#7cb342" transform="rotate(-50 ${x} ${y})"/>
             <ellipse cx="${48 - x}" cy="${y}" rx="2.2" ry="1" fill="#7cb342" transform="rotate(50 ${48 - x} ${y})"/>`).join('')}
        <path d="M18 8 h12 l2 4 l-2 13 h-12 l-2 -13z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
        <path d="M24 8 v17 M19 13 q5 2 10 0" fill="none" stroke="${STEEL_EDGE}" stroke-width="0.7"/>
        <path d="M14 10 q2 -3 4 -2 l-2 6z M34 10 q-2 -3 -4 -2 l2 6z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M20 25 h8 l-1 3 h-6z" fill="#c62828"/>
    `),
    // 槍を構えた兵士
    soldier: svg(`
        ${ground(ROAD)}
        ${person(20, '#e65100', { hair: '<path d="M16.5 10.5 q3.5 -6 7 0z" fill="' + STEEL + '"/><path d="M15.5 10.5 h9" stroke="' + STEEL_EDGE + '" stroke-width="0.8"/>' })}
        <path d="M18 16 h4 v6 h-4z" fill="${STEEL}" opacity="0.8"/>
        ${spear(28, 27, 22)}
        ${arm(22.5, 17, 28, 17)}
        <path d="M30 6 l5 1 l-5 1.5z" fill="#ffca28"/>
    `),
    // 走って逃げる人
    fugitive: svg(`
        ${ground(ROAD)}
        <path d="M22 22 l-5 2 l-2 3 M24 22 l4 2 l1 3" fill="none" stroke="#5d4037" stroke-width="1.6"/>
        <path d="M19 22 l2 -8.5 h5 l1 8.5z" fill="#78909c" transform="rotate(15 23 18)"/>
        <circle cx="27" cy="10" r="3" fill="${SKIN}"/>
        <path d="M24 9.5 q3 -4.5 6 0" fill="#3e2723"/>
        <path d="M22 15 l-5 3 M27 15 l4 -3" stroke="${SKIN}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M5 13 h9 M3 17 h10 M6 21 h8" stroke="#bcaaa4" stroke-width="1"/>
        <path d="M33 7 l1 -3 M35 9 l2 -2" stroke="#90a4ae" stroke-width="0.8"/>
    `),
    // 本を抱えた弟子
    disciple: svg(`
        ${ground(MEADOW)}
        ${person(20, '#8d6e63', { hair: hairCap(20, '#5d4037') })}
        <rect x="18" y="15.5" width="8" height="7" rx="0.6" fill="#1565c0" stroke="#0d47a1" stroke-width="0.6"/>
        <rect x="19" y="16.5" width="6" height="0.8" fill="${GOLD}"/>
        <path d="M17 17 l2 2 M23 17 l2 2" stroke="${SKIN}" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="31" y="21" width="10" height="2.5" fill="#43a047"/>
        <rect x="32" y="18.5" width="9" height="2.5" fill="#e53935"/>
        <rect x="31.5" y="24" width="11" height="3" fill="#fbc02d"/>
    `),
    // 黒板の前の先生
    teacher: svg(`
        ${ground('#d7ccc8')}
        <rect x="18" y="3" width="27" height="17" fill="#2e7d32" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M21 8 h8 M21 12 h12 M21 16 h6 M35 7 l3 5 l3 -5" fill="none" stroke="#f1f8e9" stroke-width="0.8"/>
        <path d="M18 21 h27" stroke="${WOOD}" stroke-width="1"/>
        ${person(10, '#6a1b9a', { hair: '<path d="M7 10.5 q3 -5 6 0 v2 l-1 -2 h-4 l-1 2z" fill="#9e9e9e"/>' })}
        <circle cx="8.8" cy="11" r="0.9" fill="none" stroke="#424242" stroke-width="0.4"/><circle cx="11.2" cy="11" r="0.9" fill="none" stroke="#424242" stroke-width="0.4"/>
        ${arm(12.5, 16, 19, 12)}
    `)
};
