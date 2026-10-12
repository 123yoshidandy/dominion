/** 拡張「帝国」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground } from './card-art-helpers.js';

// 古代ローマ風の色合い（大理石の白・赤・金・紫）
const MARBLE = '#f5f1e8';
const MARBLE_EDGE = '#b5ab98';
const RED = '#c0392b';
const RED_DARK = '#8e1b12';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';
const PURPLE = '#6a1b9a';
const PURPLE_LIGHT = '#ab47bc';
const SKIN = '#f0c8a0';
const WOOD = '#8d5a2b';
const WOOD_EDGE = '#5d3a1a';
const STEEL = '#b8c4cc';
const STEEL_EDGE = '#6b7b86';
const STONE = '#c9bfae';
const STONE_EDGE = '#8a7f6c';
const SAND = '#e9d8a6';
const PAVING = '#ddd3c0';
const LAUREL = '#6b8e23';
const TILE = '#c8643b';

// 空（上半分の明るい青）
const sky = (color = '#e3eef7') => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

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

// 赤い羽根飾りのついたローマ兵の兜（person の hair に渡す）
const helmet = (x) => `
    <path d="M${x - 3.4} 11 q3.4 -6.5 6.8 0z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
    <path d="M${x - 3.5} 7.5 q3.5 -3.5 7 0 l-1 1.2 q-2.5 -2 -5 0z" fill="${RED}"/>`;

// 腕（肩から手先まで）
const arm = (x1, y1, x2, y2) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${SKIN}" stroke-width="1.4" stroke-linecap="round"/>`;

// 大理石の円柱（x は中心、top は柱頭の上端、bottom は台座の下端）
const column = (x, top, bottom = 27, w = 3) => `
    <rect x="${x - w / 2}" y="${top + 1.2}" width="${w}" height="${bottom - top - 2.4}" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
    <path d="M${x - w / 6} ${top + 1.6} V${bottom - 1.6} M${x + w / 6} ${top + 1.6} V${bottom - 1.6}" stroke="${MARBLE_EDGE}" stroke-width="0.3"/>
    <rect x="${x - w / 2 - 0.8}" y="${top}" width="${w + 1.6}" height="1.2" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
    <rect x="${x - w / 2 - 0.8}" y="${bottom - 1.2}" width="${w + 1.6}" height="1.2" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>`;

// 月桂冠（cx,cy を中心に、下から左右に伸びる2本の枝。上側は開いている）
const laurel = (cx, cy, r, leaf = '#7cb342') => {
    const at = (deg, rr = r) => {
        const t = (deg * Math.PI) / 180;
        return [cx + rr * Math.cos(t), cy + rr * Math.sin(t)];
    };
    const [sx, sy] = at(105);
    const [ex, ey] = at(250);
    const stems = `<path d="M${sx.toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}
        M${(2 * cx - sx).toFixed(1)} ${sy.toFixed(1)} A${r} ${r} 0 0 0 ${(2 * cx - ex).toFixed(1)} ${ey.toFixed(1)}"
        fill="none" stroke="${LAUREL}" stroke-width="${Math.max(0.4, r * 0.06)}"/>`;
    const leaves = [115, 140, 165, 190, 215, 240].map((deg, i) => {
        const side = i % 2 === 0 ? 1.13 : 0.87;
        const [x, y] = at(deg, r * side).map(v => v.toFixed(1));
        const tilt = deg + 90 + (side > 1 ? 30 : -30);
        return `<ellipse cx="${x}" cy="${y}" rx="${r * 0.2}" ry="${r * 0.08}" fill="${leaf}" transform="rotate(${tilt} ${x} ${y})"/>
            <ellipse cx="${(2 * cx - x).toFixed(1)}" cy="${y}" rx="${r * 0.2}" ry="${r * 0.08}" fill="${leaf}" transform="rotate(${-tilt} ${(2 * cx - x).toFixed(1)} ${y})"/>`;
    }).join('');
    return stems + leaves;
};

// 馬（横向き、x は胴の中心、頭は右向き）
const horse = (x, color = '#a0522d', mane = '#5d3a1a') => `
    <path d="M${x - 6} 21 v6 M${x - 3} 21 v6 M${x + 3} 21 v6 M${x + 6} 21 v6" stroke="${color}" stroke-width="1.6"/>
    <ellipse cx="${x}" cy="18" rx="8" ry="4.5" fill="${color}"/>
    <path d="M${x + 5} 16 l4 -7 l3 1 l2 3 l-2 1 l-3 -1 l-1 5z" fill="${color}"/>
    <path d="M${x + 6} 14 l3 -6 l-2 0 l-3 6z" fill="${mane}"/>
    <path d="M${x - 8} 17 q-4 2 -3 7" fill="none" stroke="${mane}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="${x + 11.5}" cy="11" r="0.6" fill="#2b2620"/>`;

// 金貨（小さな丸）
const gold = (x, y, r = 2) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>`;

// 横から見た金貨の積み重ね（x は中心、y は一番下、n は枚数）
const coinStack = (x, y, n, w = 7) => Array.from({ length: n }, (_, i) =>
    `<rect x="${x - w / 2}" y="${y - (i + 1) * 1.8}" width="${w}" height="1.8" rx="0.8" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>`).join('');

// きらめき（十字の星）
const sparkle = (x, y, s = 2, color = '#fff59d') =>
    `<path d="M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}z" fill="${color}"/>`;

// 炎（x は中心、y は根元、h は高さ）
const flame = (x, y, h = 10) => `
    <path d="M${x - h * 0.45} ${y} q${-h * 0.1} ${-h * 0.6} ${h * 0.2} ${-h * 0.75} q0 ${h * 0.3} ${h * 0.15} ${h * 0.25} q${h * 0.05} ${-h * 0.5} ${h * 0.1} ${-h * 0.5} q${h * 0.45} ${h * 0.4} ${h * 0.45} ${h * 1.0}z" fill="#ff7043"/>
    <path d="M${x - h * 0.22} ${y} q0 ${-h * 0.35} ${h * 0.15} ${-h * 0.45} q0 ${h * 0.2} ${h * 0.1} ${h * 0.15} q${h * 0.2} ${h * 0.15} ${h * 0.2} ${h * 0.3}z" fill="#ffee58"/>`;

// 歯車（cx,cy は中心、r は半径）
const gear = (cx, cy, r, fill = STEEL, edge = STEEL_EDGE) => `
    ${[0, 45, 90, 135].map(deg =>
        `<rect x="${cx - r * 0.25}" y="${cy - r - 1.6}" width="${r * 0.5}" height="${2 * r + 3.2}" fill="${fill}" stroke="${edge}" stroke-width="0.5" transform="rotate(${deg} ${cx} ${cy})"/>`).join('')}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${edge}" stroke-width="0.6"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#fff" stroke="${edge}" stroke-width="0.6"/>`;

// 赤い瓦屋根の家（x,y は壁の左上）
const house = (x, y, w, h, wall = MARBLE, roof = TILE) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    <path d="M${x - 1} ${y} L${x + w / 2} ${y - w / 3} L${x + w + 1} ${y} Z" fill="${roof}"/>`;

// 城の塔の上端の凸凹（x,y は塔の左上、w は塔の幅）
const battlements = (x, y, w, fill, edge) => {
    const n = Math.max(2, Math.round(w / 3));
    const step = w / (2 * n - 1);
    return Array.from({ length: n }, (_, i) =>
        `<rect x="${(x + i * 2 * step).toFixed(2)}" y="${y - 1.8}" width="${step.toFixed(2)}" height="1.8" fill="${fill}" stroke="${edge}" stroke-width="0.4"/>`).join('');
};

// 城の塔（x は左端、top は壁の上端。roof を渡すととんがり屋根、無ければ凸凹）
const tower = (x, top, w, { wall = STONE, edge = STONE_EDGE, roof = '', flag = '' } = {}) => `
    <rect x="${x}" y="${top}" width="${w}" height="${27 - top}" fill="${wall}" stroke="${edge}" stroke-width="0.6"/>
    ${roof
        ? `<path d="M${x - 1} ${top} L${x + w / 2} ${top - w * 0.9} L${x + w + 1} ${top}z" fill="${roof}"/>`
        : battlements(x, top, w, wall, edge)}
    ${flag
        ? `<path d="M${x + w / 2} ${top - (roof ? w * 0.9 : 1.8)} v-4" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
           <path d="M${x + w / 2} ${top - (roof ? w * 0.9 : 1.8) - 4} l3 1 l-3 1z" fill="${flag}"/>`
        : ''}`;

// 城の門（アーチ。x は中心、w は幅、h は高さ）
const gate = (x, w, h, color = '#4e342e') =>
    `<path d="M${x - w / 2} 27 v${-(h - w / 2)} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2}z" fill="${color}"/>`;

// 小さなアーチ窓
const win = (x, y, color = '#4e342e') =>
    `<path d="M${x - 0.8} ${y + 2} v-1.2 a0.8 0.8 0 0 1 1.6 0 v1.2z" fill="${color}"/>`;

// 2種のカードの山：それぞれの絵の真ん中（x 12〜36）を左右に並べる
const halves = (left, right) => svg(`
    <svg x="0" y="0" width="24" height="32" viewBox="12 0 24 32">${left}</svg>
    <svg x="24" y="0" width="24" height="32" viewBox="12 0 24 32">${right}</svg>
    <path d="M24 0 V32" stroke="${GOLD}" stroke-width="1.4"/>
    <path d="M24 0 V32" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
`);

// ===== 2種で1山のカードの絵（山の札でも使う） =====

// 赤い旗の立つテント
const ENCAMPMENT = `
    ${sky()}
    ${ground(SAND)}
    <path d="M8 27 L20 9 L32 27z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.7"/>
    <path d="M14 27 L20 9 L26 27z" fill="${RED}"/>
    <path d="M17.5 27 L20 18 L22.5 27z" fill="${RED_DARK}"/>
    <path d="M36 27 V5" stroke="${WOOD_EDGE}" stroke-width="1"/>
    <path d="M32.5 6 h7" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
    <path d="M33 6 h6 v9 l-3 -1.5 l-3 1.5z" fill="${RED}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
    <circle cx="36" cy="9.5" r="1.4" fill="${GOLD}"/>
    <path d="M36 4 l-1 1.5 h2z" fill="${GOLD}"/>
    <path d="M40 27 l4 -2 M40 25 l4 2" stroke="${WOOD}" stroke-width="1"/>
    ${flame(42, 26, 5)}`;

// 宝石をはめた金の器
const PLUNDER = `
    <rect x="0" y="0" width="48" height="32" fill="#f7ecd2"/>
    <path d="M14 10 q-6 0 -5 6 q1 4 7 3" fill="none" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
    <path d="M34 10 q6 0 5 6 q-1 4 -7 3" fill="none" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
    <path d="M13 7 h22 q0 13 -11 14 q-11 -1 -11 -14z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
    <path d="M13 7 h22" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
    <path d="M22.5 21 h3 v3 h-3z" fill="${GOLD_EDGE}"/>
    <path d="M17 27 q7 -5 14 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
    <circle cx="24" cy="12.5" r="2" fill="${RED}"/>
    <circle cx="18.5" cy="11.5" r="1.1" fill="${PURPLE_LIGHT}"/><circle cx="29.5" cy="11.5" r="1.1" fill="${PURPLE_LIGHT}"/>
    ${gold(8, 26, 1.8)}${gold(40, 26, 1.8)}
    ${sparkle(38, 5, 2.2)}${sparkle(9, 6, 1.6)}`;

// 紫の縁取りのトーガを着た貴族
const PATRICIAN = `
    <rect x="0" y="0" width="48" height="32" fill="#efe6f3"/>
    ${column(6, 3)}${column(42, 3)}
    <rect x="0" y="27" width="48" height="5" fill="${PAVING}"/>
    ${person(24, MARBLE, { hair: hairCap(24, '#5d4037') })}
    <path d="M21 14.5 L27 14.5 L25.5 23 h-2z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.4"/>
    <path d="M21 15 L27.5 22.5" stroke="${PURPLE}" stroke-width="1.4"/>
    <path d="M20.2 23 h7.6" stroke="${PURPLE}" stroke-width="1"/>
    ${laurel(24, 11, 3.4)}
    ${arm(27, 16.5, 31, 18)}
    <rect x="30.5" y="16" width="2.4" height="6" rx="1" fill="#fff8e1" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>`;

// 円柱にはさまれた交易所の店先
const EMPORIUM = `
    ${sky()}
    <rect x="0" y="27" width="48" height="5" fill="${PAVING}"/>
    <rect x="4" y="6" width="40" height="3" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    <path d="M2 6 L24 0.5 L46 6z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    <rect x="9" y="9" width="30" height="18" fill="#7a4a2a"/>
    <path d="M9 9 h30 v3 l-2.5 1.5 l-2.5 -1.5 l-2.5 1.5 l-2.5 -1.5 l-2.5 1.5 l-2.5 -1.5 l-2.5 1.5 l-2.5 -1.5 l-2.5 1.5 l-2.5 -1.5 l-2.5 1.5 l-2.5 -1.5z" fill="${RED}"/>
    ${column(6.5, 9)}${column(41.5, 9)}
    <rect x="10" y="21" width="28" height="6" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    <path d="M13 21 q-2 -3 0 -5 h2 q2 2 0 5z" fill="${TILE}"/>
    <path d="M18 21 q-2 -3 0 -5 h2 q2 2 0 5z" fill="${TILE}"/>
    <rect x="23" y="17" width="5" height="4" fill="${PURPLE}"/>
    ${gold(32, 19.5, 1.5)}${gold(35, 19.5, 1.5)}${gold(33.5, 17.5, 1.5)}`;

// 荷物を積んだ荷車を引く開拓民
const SETTLERS = `
    ${sky()}
    ${ground('#a5c26b')}
    <path d="M18 18 h20 v4 h-20z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
    <rect x="20" y="13" width="7" height="5" fill="#d7b98a" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <rect x="28" y="11" width="8" height="7" fill="#e6d3a3" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <ellipse cx="24" cy="12" rx="3" ry="1.8" fill="${RED}"/>
    <circle cx="28" cy="23" r="4" fill="none" stroke="${WOOD_EDGE}" stroke-width="1.3"/>
    <path d="M28 19 v8 M24 23 h8" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
    <path d="M18 20 L11 18" stroke="${WOOD_EDGE}" stroke-width="1"/>
    ${person(9, '#8d6e63', { hair: hairCap(9, '#4e342e') })}
    ${arm(11, 17, 13, 18.5)}
    <path d="M42 27 v-6 M40 27 v-4 M44 27 v-5" stroke="#558b2f" stroke-width="1"/>`;

// 赤い屋根の家並みと大勢の村人
const BUSTLING_VILLAGE = `
    ${sky()}
    ${ground(PAVING)}
    ${house(3, 12, 11, 15)}${house(17, 9, 13, 18, '#f3dfbf')}${house(33, 13, 12, 14)}
    ${win(8.5, 16)}${win(23.5, 13)}${win(39, 17)}
    ${person(7, RED, { hair: hairCap(7, '#4e342e'), scale: 0.6 })}
    ${person(15, PURPLE, { hair: hairCap(15, '#212121'), scale: 0.65 })}
    ${person(22, '#1e88e5', { hair: hairCap(22, '#795548'), scale: 0.55 })}
    ${person(29, GOLD_EDGE, { hair: hairCap(29, '#3e2723'), scale: 0.62 })}
    ${person(36, '#2e7d32', { hair: hairCap(36, '#5d4037'), scale: 0.58 })}
    ${person(42, RED_DARK, { hair: hairCap(42, '#212121'), scale: 0.64 })}`;

// 石を載せた木の投石機
const CATAPULT = `
    ${sky()}
    ${ground('#a5c26b')}
    <rect x="8" y="21" width="28" height="3" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
    <circle cx="12" cy="25" r="2.5" fill="${WOOD_EDGE}"/><circle cx="32" cy="25" r="2.5" fill="${WOOD_EDGE}"/>
    <circle cx="12" cy="25" r="0.8" fill="${GOLD}"/><circle cx="32" cy="25" r="0.8" fill="${GOLD}"/>
    <path d="M20 21 L24 12 L28 21" fill="none" stroke="${WOOD}" stroke-width="1.6"/>
    <path d="M30 21 L12 6" stroke="${WOOD}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M8.5 4 q3.5 5 7 1" fill="${WOOD_EDGE}"/>
    <circle cx="11.5" cy="3.8" r="2.4" fill="#9e9e9e" stroke="#616161" stroke-width="0.5"/>
    <path d="M24 12 h4" stroke="${RED}" stroke-width="1.2"/>
    <path d="M38 8 q3 -2 6 0 M36 13 q4 -2 8 -1" fill="none" stroke="#90a4ae" stroke-width="0.7" stroke-dasharray="1 1"/>`;

// 金色に光る岩の山
const ROCKS = `
    <rect x="0" y="0" width="48" height="32" fill="#f3ecdc"/>
    ${ground(SAND)}
    <ellipse cx="14" cy="24" rx="8" ry="5" fill="#9e9e9e" stroke="#616161" stroke-width="0.7"/>
    <ellipse cx="33" cy="24" rx="9" ry="5" fill="#8d8d8d" stroke="#616161" stroke-width="0.7"/>
    <ellipse cx="23" cy="16" rx="8" ry="5.5" fill="#b0b0b0" stroke="#616161" stroke-width="0.7"/>
    <ellipse cx="27" cy="8.5" rx="5" ry="3.8" fill="#9e9e9e" stroke="#616161" stroke-width="0.7"/>
    <path d="M18 14 q3 -2 6 -1 M10 22 q3 -1.5 5 0 M30 22 q3 -1.5 6 0" fill="none" stroke="#e0e0e0" stroke-width="0.8"/>
    <path d="M20 18 l2 1.5 M36 25 l2 -1" stroke="${GOLD}" stroke-width="1.2"/>
    ${sparkle(21, 18.5, 1.8, GOLD)}${sparkle(37, 24.5, 1.6, GOLD)}${sparkle(40, 8, 2.2)}`;

// 剣と網を持つ剣闘士
const GLADIATOR = `
    <rect x="0" y="0" width="48" height="27" fill="#e9c58a"/>
    <rect x="0" y="0" width="48" height="10" fill="${STONE}"/>
    ${[4, 12, 20, 28, 36, 44].map(x => `<path d="M${x - 2.5} 10 v-5 a2.5 2.5 0 0 1 5 0 v5z" fill="#5d4037"/>`).join('')}
    <path d="M0 10 h48" stroke="${RED}" stroke-width="1.2"/>
    ${ground(SAND)}
    ${person(24, RED, { hair: `<path d="M20.5 11.5 q3.5 -7 7 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/><path d="M21.5 10.5 h5" stroke="${GOLD_EDGE}" stroke-width="0.6"/><path d="M22 6 q2 -3 4 0" fill="${RED}"/>` })}
    <path d="M21 14.5 h6 v2 h-6z" fill="${GOLD_EDGE}"/>
    ${arm(26.5, 16, 31, 12)}
    <path d="M31.5 12.5 V3" stroke="${STEEL}" stroke-width="1.6"/>
    <path d="M29.5 12.5 h4" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
    ${arm(21.5, 16, 16, 18)}
    <path d="M16 18 L6 16 L4 26 L14 27z" fill="none" stroke="#a1887f" stroke-width="0.8"/>
    <path d="M8.5 16.5 L7 26.3 M11 17 L10 26.6 M13.5 17.5 L13 26.9 M5.5 18.5 L15.5 20 M5 21.5 L15 23.5 M4.5 24.5 L14.5 26" stroke="#a1887f" stroke-width="0.5"/>`;

// 紫の袋からあふれる金貨
const FORTUNE = `
    <circle cx="24" cy="15" r="16" fill="#fff8e1"/>
    <path d="M10 27 q-3 -10 4 -15 l-2 -4 h12 l-2 4 q7 5 4 15z" fill="${PURPLE}" stroke="#4a148c" stroke-width="0.8"/>
    <path d="M13 9 h10" stroke="${GOLD}" stroke-width="1.6"/>
    ${gold(18, 7, 2.2)}${gold(22, 5.5, 2.2)}${gold(15, 5, 2)}
    ${coinStack(33, 27, 6)}${coinStack(41, 27, 4, 6)}
    ${gold(28, 25.5, 2)}${gold(30, 21, 2)}${gold(27, 17, 1.8)}${gold(24, 12, 1.8)}
    ${sparkle(40, 10, 2.6)}${sparkle(8, 12, 1.8)}${sparkle(33, 4, 1.6)}`;

// ===== 城の絵（山の札でも使う） =====

// 小さな石の塔
const HUMBLE_CASTLE = `
    ${sky()}
    ${ground('#9ccc65')}
    ${tower(17, 13, 14, { wall: '#b3a68f', edge: '#7d705a' })}
    <path d="M17 18 h14 M17 22.5 h14 M22 13 v5 M27 18 v4.5 M21 22.5 v4.5" stroke="#7d705a" stroke-width="0.4"/>
    ${gate(24, 4, 6, WOOD)}
    ${win(20.5, 15)}
    <path d="M6 27 v-5 M10 27 v-5 M4 23.5 h8 M36 27 v-4 M40 27 v-4 M34 24.5 h8" stroke="${WOOD}" stroke-width="0.9"/>`;

// 上が欠けてひびの入った城
const CRUMBLING_CASTLE = `
    ${sky('#dde3e8')}
    ${ground('#a5a58d')}
    <rect x="14" y="16" width="20" height="11" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
    <path d="M8 27 V10 l2 -1 l1 2 l2 -3 l1 2 l1 -1 V27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
    <path d="M33 27 V14 l2 2 l2 -4 l2 3 l2 -1 V27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
    <path d="M14 16 l3 -1.5 l2 2 l4 -1 l3 2 l4 -2 l4 1" fill="none" stroke="${STONE_EDGE}" stroke-width="0.6"/>
    <path d="M11 12 l-1 4 l2 3 l-1 4 M37 17 l1 3 l-2 3 M22 18 l2 3 l-1 3" fill="none" stroke="#5d5448" stroke-width="0.6"/>
    ${gate(24, 4, 6)}
    <rect x="40" y="24" width="4" height="3" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5" transform="rotate(-15 42 25.5)"/>
    <rect x="3" y="25" width="3" height="2" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5" transform="rotate(20 4.5 26)"/>`;

// 赤い屋根の塔が2本ある小さな城
const SMALL_CASTLE = `
    ${sky()}
    ${ground('#9ccc65')}
    <rect x="15" y="15" width="18" height="12" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    ${battlements(15, 15, 18, MARBLE, MARBLE_EDGE)}
    ${tower(9, 11, 7, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE })}
    ${tower(32, 11, 7, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE, flag: RED })}
    ${gate(24, 5, 7)}
    ${win(12.5, 15)}${win(35.5, 15)}`;

// 月夜の暗い城と幽霊
const HAUNTED_CASTLE = `
    <rect x="0" y="0" width="48" height="32" fill="#2e2442"/>
    <circle cx="40" cy="6" r="4" fill="#fff9c4"/>
    ${ground('#3b3350')}
    <rect x="12" y="15" width="20" height="12" fill="#4a3f63" stroke="#2a2238" stroke-width="0.6"/>
    ${battlements(12, 15, 20, '#4a3f63', '#2a2238')}
    ${tower(7, 9, 7, { wall: '#4a3f63', edge: '#2a2238', roof: '#33294a' })}
    ${tower(29, 7, 8, { wall: '#4a3f63', edge: '#2a2238', roof: '#33294a' })}
    ${win(10.5, 13, '#ffd54f')}${win(33, 11, '#ffd54f')}${win(22, 18, '#ffd54f')}
    ${gate(22, 4, 6, '#1d1729')}
    <path d="M37 26 q-1.5 -3 0 -9 q3 -5 6 0 q1.5 6 0 9 l-1 -1.5 l-1 1.5 l-1 -1.5 l-1 1.5 l-1 -1.5z" fill="#eceff1" opacity="0.9"/>
    <circle cx="39" cy="19.5" r="0.7" fill="#2e2442"/><circle cx="41.5" cy="19.5" r="0.7" fill="#2e2442"/>
    <path d="M16 5 q1.5 -1.5 3 0 q1.5 -1.5 3 0 l-1.5 0.8 l-1.5 -0.4 l-1.5 0.4z M3 4 q1 -1 2 0 q1 -1 2 0 l-1 0.5 l-1 -0.3 l-1 0.3z" fill="#1d1729"/>`;

// 金の丸屋根と紫の旗の華やかな城
const OPULENT_CASTLE = `
    ${sky('#f3e5f5')}
    ${ground('#9ccc65')}
    <rect x="12" y="14" width="24" height="13" fill="${MARBLE}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    <path d="M12 14 h24" stroke="${GOLD}" stroke-width="1.4"/>
    <path d="M18 14 a6 6 0 0 1 12 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    <path d="M24 8 v-3" stroke="${GOLD_EDGE}" stroke-width="0.6"/><circle cx="24" cy="4.6" r="0.9" fill="${GOLD}"/>
    ${[7, 37].map(x => `
        <rect x="${x}" y="11" width="6" height="16" fill="${MARBLE}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M${x - 0.5} 11 a3.5 3.5 0 0 1 7 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M${x + 3} 7.5 v-3" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M${x + 3} 4.5 l3 1 l-3 1z" fill="${PURPLE}"/>
        <rect x="${x + 1.5}" y="14" width="3" height="6" fill="${PURPLE}"/>`).join('')}
    ${gate(24, 5, 8, PURPLE)}
    <path d="M21.5 27 v-5.5 a2.5 2.5 0 0 1 5 0 v5.5" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
    ${win(16, 18, GOLD_EDGE)}${win(32, 18, GOLD_EDGE)}
    ${sparkle(44, 4, 1.6)}`;

// 横に長く広がる、塔の多い城
const SPRAWLING_CASTLE = `
    ${sky()}
    ${ground('#9ccc65')}
    <rect x="2" y="18" width="44" height="9" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    ${battlements(2, 18, 44, MARBLE, MARBLE_EDGE)}
    ${tower(1, 13, 5, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE })}
    ${tower(10, 10, 6, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE, flag: RED })}
    ${tower(21, 8, 6, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE })}
    ${tower(32, 10, 6, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE, flag: RED })}
    ${tower(42, 13, 5, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE })}
    ${gate(24, 4, 6)}
    ${win(13, 14)}${win(35, 14)}${win(18, 21)}${win(30, 21)}`;

// 高い天守のそびえる壮大な城
const GRAND_CASTLE = `
    ${sky()}
    ${ground('#9ccc65')}
    <rect x="6" y="17" width="36" height="10" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
    ${battlements(6, 17, 36, MARBLE, MARBLE_EDGE)}
    ${tower(4, 11, 7, { wall: MARBLE, edge: MARBLE_EDGE, roof: RED, flag: GOLD })}
    ${tower(37, 11, 7, { wall: MARBLE, edge: MARBLE_EDGE, roof: RED, flag: GOLD })}
    ${tower(18, 9, 12, { wall: MARBLE, edge: MARBLE_EDGE })}
    ${tower(21, 3, 6, { wall: MARBLE, edge: MARBLE_EDGE, flag: RED })}
    <path d="M18 9 h12" stroke="${GOLD}" stroke-width="0.9"/>
    ${gate(24, 6, 9)}
    <path d="M21 27 v-6 a3 3 0 0 1 6 0 v6" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
    ${win(24, 5)}${win(20.5, 11.5)}${win(27.5, 11.5)}${win(7.5, 15)}${win(40.5, 15)}`;

// 金の王冠を戴いた王の城
const KINGS_CASTLE = `
    ${sky('#ede0f5')}
    <circle cx="24" cy="6" r="9" fill="#fff8e1" opacity="0.9"/>
    ${ground('#9ccc65')}
    <rect x="3" y="18" width="42" height="9" fill="${MARBLE}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    ${battlements(3, 18, 42, MARBLE, GOLD_EDGE)}
    ${tower(2, 12, 6, { wall: MARBLE, edge: GOLD_EDGE, roof: PURPLE, flag: GOLD })}
    ${tower(40, 12, 6, { wall: MARBLE, edge: GOLD_EDGE, roof: PURPLE, flag: GOLD })}
    ${tower(11, 14, 6, { wall: MARBLE, edge: GOLD_EDGE, roof: RED })}
    ${tower(31, 14, 6, { wall: MARBLE, edge: GOLD_EDGE, roof: RED })}
    <rect x="18" y="9" width="12" height="18" fill="${MARBLE}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    <path d="M18 9 h12" stroke="${GOLD}" stroke-width="1.2"/>
    <path d="M18.5 8.5 v-5 l2.8 2.5 l2.7 -4 l2.7 4 l2.8 -2.5 v5z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    <circle cx="24" cy="6.5" r="0.9" fill="${RED}"/><circle cx="20.5" cy="7" r="0.6" fill="${PURPLE}"/><circle cx="27.5" cy="7" r="0.6" fill="${PURPLE}"/>
    <rect x="19.5" y="11" width="2.5" height="6" fill="${PURPLE}"/><rect x="26" y="11" width="2.5" height="6" fill="${PURPLE}"/>
    ${gate(24, 5, 8, PURPLE)}
    <path d="M21.5 27 v-5.5 a2.5 2.5 0 0 1 5 0 v5.5" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
    ${sparkle(9, 4, 1.6)}${sparkle(39, 4, 1.6)}`;

export const EMPIRES_ART = {
    // ===== コスト2 =====
    // 赤い旗の立つ野営のテント
    encampment: svg(ENCAMPMENT),
    // トーガを着た貴族
    patrician: svg(PATRICIAN),
    // 荷車を引く開拓民
    settlers: svg(SETTLERS),

    // ===== コスト3 =====
    // 馬が引く赤い戦車
    chariot_race: svg(`
        ${sky()}
        ${ground(SAND)}
        <path d="M2 21 h3 M1 24 h4 M3 18 h3" stroke="#d7c38f" stroke-width="0.8"/>
        ${horse(30)}
        <path d="M7 22 h11 v-6 q-6 -2 -11 1z" fill="${RED}" stroke="${GOLD_EDGE}" stroke-width="0.7"/>
        <path d="M7 17 q5 -2.5 11 -1" fill="none" stroke="${GOLD}" stroke-width="1"/>
        <circle cx="12" cy="23" r="4" fill="none" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <path d="M12 19 v8 M8 23 h8" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M18 20 L23 19" stroke="${WOOD_EDGE}" stroke-width="1"/>
        <path d="M10 16 l1 -4.5 h4 l1 4.5z" fill="${MARBLE}"/>
        <circle cx="13" cy="9.5" r="2.4" fill="${SKIN}"/>
        <path d="M10.6 9 q2.4 -4 4.8 0z" fill="${STEEL}"/><path d="M10.8 6.8 q2.2 -2.5 4.4 0" fill="${RED}"/>
        <path d="M15 13 L38 11.5" stroke="#5d4037" stroke-width="0.5"/>
    `),
    // 石を載せた木の投石機
    catapult: svg(CATAPULT),
    // 光る杖を持つ紫の魔女
    enchantress: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3b2459"/>
        ${sparkle(6, 6, 1.2)}${sparkle(42, 25, 1.2)}${sparkle(40, 4, 1)}
        ${ground('#2a1a40')}
        <path d="M14 27 L17 14 h8 L28 27z" fill="${PURPLE}"/>
        <path d="M17 14 q4 3 8 0" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
        <path d="M17.5 10 q-2 6 -1 12 l2 -2 q-1 -6 0 -10z M24.5 10 q2 6 1 12 l-2 -2 q1 -6 0 -10z" fill="#212121"/>
        <circle cx="21" cy="10.5" r="3" fill="${SKIN}"/>
        <path d="M18 10 q3 -5 6 0 q-3 -2 -6 0z" fill="#212121"/>
        <path d="M18.5 7.5 l2.5 -1 l2.5 1" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
        ${arm(25, 16, 30, 13)}
        <path d="M31 27 V7" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <circle cx="31" cy="6" r="5.5" fill="#e1bee7" opacity="0.35"/>
        <circle cx="31" cy="6" r="2.4" fill="#f3e5f5" stroke="${GOLD}" stroke-width="0.6"/>
        ${sparkle(37, 9, 1.6, '#e1bee7')}${sparkle(35, 2, 1.2, '#e1bee7')}${sparkle(26, 3, 1, '#e1bee7')}
    `),
    // 赤い日よけの屋台と野菜
    farmers_market: svg(`
        ${sky()}
        ${ground('#cdb88f')}
        <path d="M8 27 V8 M40 27 V8" stroke="${WOOD}" stroke-width="1.4"/>
        <path d="M5 8 h38 l-2 5 h-34z" fill="${MARBLE}"/>
        ${[5, 13, 21, 29, 37].map(x => `<path d="M${x} 8 h6 l-0.4 5 h-5.6z" fill="${RED}"/>`).join('')}
        <path d="M7 13 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0" fill="none" stroke="${RED_DARK}" stroke-width="0.6"/>
        <rect x="6" y="20" width="36" height="7" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <circle cx="12" cy="18" r="3" fill="#7cb342" stroke="#558b2f" stroke-width="0.5"/>
        <path d="M10.5 17 q1.5 2 3 0" fill="none" stroke="#558b2f" stroke-width="0.4"/>
        <circle cx="18.5" cy="18.8" r="1.6" fill="#e53935"/><circle cx="21.5" cy="18.8" r="1.6" fill="#e53935"/><circle cx="20" cy="16.5" r="1.6" fill="#e53935"/>
        ${[[26, 20], [29, 20], [32, 20]].map(([x, y]) => `<path d="M${x} ${y} l1.5 -5 l1.5 5z" fill="#fb8c00" transform="rotate(180 ${x + 1.5} ${y - 2.5})"/><path d="M${x + 1.5} ${y - 5} l-1 -1.5 M${x + 1.5} ${y - 5} l1 -1.5" stroke="#43a047" stroke-width="0.6"/>`).join('')}
        <ellipse cx="38" cy="18.5" rx="2.6" ry="2" fill="#8e24aa"/>
        <path d="M38 16.5 v-1.5" stroke="#43a047" stroke-width="0.7"/>
    `),
    // 剣と網を持つ剣闘士
    gladiator: svg(GLADIATOR),

    // ===== コスト4 =====
    // 金色に光る岩の山
    rocks: svg(ROCKS),
    // 大理石の祭壇に燃える炎
    sacrifice: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f9e6cf"/>
        <rect x="0" y="27" width="48" height="5" fill="${PAVING}"/>
        <path d="M22 9 q-3 -4 1 -7 M27 8 q3 -3 0 -7" fill="none" stroke="#bdbdbd" stroke-width="0.9"/>
        ${flame(24.5, 16, 12)}
        <rect x="13" y="16" width="23" height="3" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <rect x="15" y="19" width="19" height="6" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M15 21 h19" stroke="${RED}" stroke-width="1.4"/>
        <rect x="13" y="25" width="23" height="2" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M5 27 v-10 l-1.5 -2 h5 l-1.5 2 v10z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M43 27 v-10 l-1.5 -2 h5 l-1.5 2 v10z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        ${flame(6, 15, 4)}${flame(44, 15, 4)}
    `),
    // 円柱の並ぶ大理石の神殿
    temple: svg(`
        ${sky()}
        ${ground(PAVING)}
        <path d="M6 9 L24 2 L42 9z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.7"/>
        <path d="M14 8 L24 4.2 L34 8z" fill="none" stroke="${GOLD}" stroke-width="0.6"/>
        <rect x="6" y="9" width="36" height="2.5" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M6 10.2 h36" stroke="${RED}" stroke-width="0.6"/>
        ${[10, 17, 24, 31, 38].map(x => column(x, 11.5, 24, 3.2)).join('')}
        <rect x="4" y="24" width="40" height="1.5" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
        <rect x="2" y="25.5" width="44" height="1.5" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
    `),
    // 池のある中庭を囲む赤い瓦の別荘
    villa: svg(`
        ${sky()}
        ${ground('#9ccc65')}
        <rect x="3" y="13" width="15" height="14" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <rect x="30" y="13" width="15" height="14" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M1.5 13 L10.5 8 L19.5 13z M28.5 13 L37.5 8 L46.5 13z" fill="${TILE}"/>
        <rect x="18" y="16" width="12" height="11" fill="${PAVING}"/>
        <path d="M18 16 h12" stroke="${TILE}" stroke-width="1.4"/>
        <ellipse cx="24" cy="24" rx="5" ry="1.8" fill="#5dade2" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M24 23.5 v-3 M24 20.5 q-1.5 0 -2 1.5 M24 20.5 q1.5 0 2 1.5" fill="none" stroke="#85c1e9" stroke-width="0.6"/>
        <path d="M19.5 26 q0.5 -8 1.5 -8 q1 0 1.5 8z" fill="#2e7d32"/>
        ${win(8, 17)}${win(13, 17)}${win(35, 17)}${win(40, 17)}
        <rect x="9" y="21" width="3" height="6" fill="${RED_DARK}"/><rect x="36" y="21" width="3" height="6" fill="${RED_DARK}"/>
    `),

    // ===== コスト5 =====
    // 巻物が並ぶ記録庫の棚
    archive: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f3e6cc"/>
        <rect x="5" y="2" width="38" height="27" fill="#6d4423" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        ${[2, 11, 20].map(y => `<rect x="7" y="${y + 1.5}" width="34" height="7" fill="#4e2f17"/><rect x="5" y="${y + 8.5}" width="38" height="1" fill="${WOOD}"/>`).join('')}
        ${[3.5, 12.5, 21.5].map((y, row) => [0, 1, 2, 3, 4, 5].map(i => {
            const x = 10 + i * 5.6 + (row % 2) * 1.4;
            return `<circle cx="${x}" cy="${y + 3.5}" r="2.4" fill="#fdf3d7" stroke="#c49a52" stroke-width="0.5"/><circle cx="${x}" cy="${y + 3.5}" r="0.8" fill="#c49a52"/>`;
        }).join('')).join('')}
        <path d="M15.6 9.5 v3 M27 18.5 v3 M33 27.5 v-1" stroke="${RED}" stroke-width="1"/>
    `),
    // 金貨の山と金庫
    capital: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f7ecd2"/>
        ${ground('#d7c9a7')}
        <rect x="24" y="8" width="19" height="19" rx="1" fill="#78909c" stroke="#455a64" stroke-width="0.8"/>
        <rect x="26" y="10" width="15" height="15" rx="0.6" fill="#90a4ae" stroke="#546e7a" stroke-width="0.6"/>
        <circle cx="33.5" cy="17.5" r="3.6" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M33.5 14 v7 M30 17.5 h7 M31 15 l5 5 M36 15 l-5 5" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M24 12 h-1.5 M24 23 h-1.5" stroke="#455a64" stroke-width="1.4"/>
        ${coinStack(8, 27, 7)}${coinStack(16, 27, 9)}
        ${gold(12, 9, 2)}${gold(4, 13, 1.6)}
        ${sparkle(20, 6, 2)}${sparkle(44, 4, 1.6)}
    `),
    // 赤いひもに下がった三日月形の金のお守り
    charm: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f3e5f5"/>
        <path d="M8 2 Q24 22 40 2" fill="none" stroke="${RED}" stroke-width="1.2"/>
        ${[[11.5, 6.2], [15.5, 9.8], [32.5, 9.8], [36.5, 6.2]].map(([x, y], i) =>
            `<circle cx="${x}" cy="${y}" r="1.3" fill="${i % 3 === 0 ? PURPLE_LIGHT : GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/>`).join('')}
        <path d="M24 12 v2" stroke="${GOLD_EDGE}" stroke-width="0.9"/>
        <path d="M14.5 15 a9.5 9.5 0 0 0 19 0 a8 6.5 0 0 1 -19 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <circle cx="24" cy="18" r="2.6" fill="${PURPLE}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="23.2" cy="17.2" r="0.8" fill="#e1bee7"/>
        <circle cx="24" cy="13.6" r="1.2" fill="${RED}"/>
        ${sparkle(38, 20, 2)}${sparkle(10, 22, 1.6)}
    `),
    // 月桂冠に囲まれた金の王冠
    crown: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f3e5f5"/>
        ${laurel(24, 17, 13)}
        <path d="M15 24 v-12 l4.5 5 l4.5 -8 l4.5 8 l4.5 -5 v12z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <rect x="15" y="21" width="18" height="3" fill="${PURPLE}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <circle cx="24" cy="16" r="1.6" fill="${RED}"/>
        <circle cx="15" cy="11" r="1" fill="${GOLD}"/><circle cx="24" cy="8" r="1" fill="${GOLD}"/><circle cx="33" cy="11" r="1" fill="${GOLD}"/>
        <circle cx="19" cy="22.5" r="0.7" fill="${GOLD}"/><circle cx="24" cy="22.5" r="0.7" fill="${GOLD}"/><circle cx="29" cy="22.5" r="0.7" fill="${GOLD}"/>
        <path d="M19 28 q5 -2 10 0" fill="none" stroke="${RED}" stroke-width="1.2"/>
    `),
    // 柱廊に囲まれた石畳の広場
    forum: svg(`
        ${sky()}
        <rect x="0" y="18" width="48" height="14" fill="${PAVING}"/>
        <path d="M0 22 h48 M0 27 h48 M8 18 l-4 14 M18 18 l-2 14 M30 18 l2 14 M40 18 l4 14" stroke="${MARBLE_EDGE}" stroke-width="0.4"/>
        <rect x="1" y="4" width="46" height="2.5" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M1 5.2 h46" stroke="${RED}" stroke-width="0.5"/>
        ${[4, 10, 16, 22, 28, 34, 40, 46].map(x => column(x === 46 ? 44 : x, 6.5, 18, 2.4)).join('')}
        <rect x="21" y="22" width="6" height="3" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
        <path d="M22.5 22 v-5 h3 v5z" fill="#cfd8dc"/>
        <circle cx="24" cy="15.5" r="1.6" fill="#cfd8dc"/>
        ${person(9, PURPLE, { hair: hairCap(9, '#3e2723'), scale: 0.5 })}
        ${person(37, RED, { hair: hairCap(37, '#5d4037'), scale: 0.55 })}
    `),
    // 剪定ばさみと刈りそろえた生け垣
    groundskeeper: svg(`
        ${sky()}
        ${ground('#9ccc65')}
        <rect x="3" y="15" width="26" height="12" rx="3" fill="#388e3c"/>
        <circle cx="8" cy="15" r="3" fill="#43a047"/><circle cx="16" cy="14" r="3.4" fill="#43a047"/><circle cx="24" cy="15" r="3" fill="#43a047"/>
        <path d="M6 20 l1.5 -1 M14 22 l1.5 -1 M21 19 l1.5 -1" stroke="#2e7d32" stroke-width="0.6"/>
        <path d="M36 27 v-6" stroke="${WOOD}" stroke-width="1.4"/>
        <circle cx="36" cy="16" r="6" fill="#43a047"/>
        <path d="M30 8 L42 2.5 L40.5 6z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        <path d="M30 8 L42.5 10 L40 7.5z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        <path d="M30 8 L22 4 M30 8 L22.5 12" stroke="${RED}" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="30" cy="8" r="0.9" fill="${GOLD}"/>
    `),
    // 赤い盾と兜のローマ兵
    legionary: svg(`
        ${sky()}
        ${ground(SAND)}
        ${person(16, RED, { hair: helmet(16) })}
        <path d="M13 15 h6 v5 h-6z" fill="${STEEL}" opacity="0.85"/>
        <path d="M13 16.5 h6 M13 18 h6" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        ${arm(13.5, 16, 9, 12)}
        <path d="M9 12.5 V3" stroke="${STEEL}" stroke-width="1.6"/>
        <path d="M7.2 12.5 h3.6" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <path d="M21 11 q5 -1.5 10 0 v15 q-5 1.5 -10 0z" fill="${RED}" stroke="${GOLD}" stroke-width="1"/>
        <circle cx="26" cy="18.5" r="2" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M22.5 14 l3.5 3 l3.5 -3 M22.5 23 l3.5 -3 l3.5 3" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
        <path d="M38 27 V4" stroke="${WOOD_EDGE}" stroke-width="0.9"/>
        <path d="M35 6 h6 v6 h-6z" fill="${RED}" stroke="${GOLD}" stroke-width="0.6"/>
        <path d="M38 4 l-1.2 -2 h2.4z" fill="${GOLD}"/>
        <path d="M36 8 q2 -1.5 4 0 M38 7.5 v3" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
    `),
    // 月夜に吹き鳴らす角笛と駆ける猟犬
    wild_hunt: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2c3e50"/>
        <circle cx="41" cy="6" r="3.5" fill="#fff9c4"/>
        ${ground('#2e4a3a')}
        <path d="M3 27 l3 -10 l3 10z M42 27 l3 -12 l3 12z" fill="#1e3a2a"/>
        <path d="M5 4 q8 10 16 6 l1.5 3 q-10 5 -18.5 -7z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <ellipse cx="22.3" cy="11.5" rx="1.4" ry="2.6" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6" transform="rotate(-25 22.3 11.5)"/>
        <path d="M10 8.8 l1.6 -0.8 M14 9.8 l1.4 -1" stroke="${RED}" stroke-width="1"/>
        <path d="M26 8 q2 2 0 4 M28.5 6.5 q3 3.5 0 7" fill="none" stroke="#ecf0f1" stroke-width="0.7"/>
        <path d="M14 21 q6 -4 14 -1 l4 -3 l3 -0.5 l2 2 l-2 1 l-2 0 l-2 3 q-1 2 -3 2 l2 4 h-1.5 l-3 -3.5 h-5 l-3 3.5 h-1.5 l1.5 -4 q-3 -1 -5 -3 q-3 1 -6 -1 q3 0 5 0z" fill="#8d6e63"/>
        <path d="M33 17 l1 -3 l1 3z" fill="#6d4c41"/>
        <circle cx="35" cy="18" r="0.5" fill="#2b2620"/>
    `),

    // 宝石をはめた金の器
    plunder: svg(PLUNDER),
    // 円柱にはさまれた交易所の店先
    emporium: svg(EMPORIUM),
    // 赤い屋根の家並みと大勢の村人
    bustling_village: svg(BUSTLING_VILLAGE),

    // ===== コスト8 =====
    // 紫の袋からあふれる金貨
    fortune: svg(FORTUNE),

    // ===== 負債4 =====
    // 青い設計図と歯車
    engineer: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f5f1e8"/>
        <rect x="3" y="4" width="28" height="22" fill="#1e5aa8" stroke="#0d3c78" stroke-width="0.8"/>
        <path d="M3 9 h28 M3 14 h28 M3 19 h28 M8 4 v22 M13 4 v22 M18 4 v22 M23 4 v22 M28 4 v22" stroke="#3a78c8" stroke-width="0.3"/>
        <path d="M7 22 v-8 l5 -4 l5 4 v8z M10 22 v-4 h4 v4" fill="none" stroke="#fff" stroke-width="0.8"/>
        <path d="M20 22 h8 M20 22 a4 4 0 0 1 8 0 M24 18 v-6" fill="none" stroke="#fff" stroke-width="0.7"/>
        <path d="M7 7 h10" stroke="#fff" stroke-width="0.5" stroke-dasharray="1 0.6"/>
        ${gear(38, 12, 5.5, '#bdbdbd', '#616161')}
        ${gear(37, 24, 3.6, GOLD, GOLD_EDGE)}
    `),

    // ===== 負債8 =====
    // ぎっしり建ち並ぶ街の建物
    city_quarter: svg(`
        ${sky()}
        ${ground(PAVING)}
        ${[
            [1, 12, 8, '#f3dfbf'], [8, 7, 9, MARBLE], [16, 14, 7, '#e8c39e'], [22, 5, 9, '#f3dfbf'],
            [30, 11, 8, MARBLE], [37, 8, 10, '#e8c39e']
        ].map(([x, y, w, c]) => `
            <rect x="${x}" y="${y}" width="${w}" height="${27 - y}" fill="${c}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
            <rect x="${x - 0.5}" y="${y - 1.5}" width="${w + 1}" height="1.8" fill="${TILE}"/>
            ${Array.from({ length: Math.floor((24 - y) / 4) }, (_, r) => [0, 1].map(c2 =>
                `<rect x="${x + 1.5 + c2 * (w - 4.5)}" y="${y + 2 + r * 4}" width="1.5" height="2" fill="#5d4037"/>`).join('')).join('')}`).join('')}
        <rect x="0" y="23" width="48" height="4" fill="${STONE}"/>
        ${[4, 12, 20, 28, 36, 44].map(x => `<path d="M${x - 2} 27 v-2.5 a2 2 0 0 1 4 0 v2.5z" fill="#5d4037"/>`).join('')}
    `),
    // 紫のトーガで玉座に座る支配者
    overlord: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${RED_DARK}"/>
        <path d="M0 0 q6 16 0 32z M48 0 q-6 16 0 32z" fill="${RED}"/>
        <rect x="0" y="27" width="48" height="5" fill="${PAVING}"/>
        <rect x="12" y="25" width="24" height="2" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
        <path d="M14 25 V6 q10 -5 20 0 V25z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <path d="M16.5 23 V8 q7.5 -3.5 15 0 V23z" fill="${PURPLE_LIGHT}"/>
        <path d="M18 25 l2 -10 h8 l2 10z" fill="${PURPLE}"/>
        <path d="M20 15 L28 22" stroke="${GOLD}" stroke-width="1"/>
        <circle cx="24" cy="11" r="3.2" fill="${SKIN}"/>
        ${laurel(24, 11, 3.6, GOLD)}
        <path d="M13 17 h4 v8 h-4z M31 17 h4 v8 h-4z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        ${arm(27.5, 16.5, 32, 16)}
        <path d="M32.5 19 V9" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <circle cx="32.5" cy="8.5" r="1.3" fill="${GOLD}"/>
    `),
    // 王冠の印の金床と鍛冶の炎
    royal_blacksmith: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3e2723"/>
        <path d="M0 6 h14 v21 h-14z" fill="#5d4037"/>
        <path d="M2 27 v-11 a5 5 0 0 1 10 0 v11z" fill="#1b1210"/>
        ${flame(7, 27, 11)}
        ${ground('#4e342e')}
        <path d="M18 14 h22 q-1 3 -6 4 v3 h3 v3 h-14 v-3 h3 v-3 q-6 0 -10 -4z" fill="#546e7a" stroke="#263238" stroke-width="0.7"/>
        <path d="M26 24 h8 l1 3 h-10z" fill="#37474f"/>
        <path d="M27.5 18.5 v-1.8 l1.2 0.9 l1.3 -1.5 l1.3 1.5 l1.2 -0.9 v1.8z" fill="${GOLD}"/>
        <path d="M33 4 L28 13" stroke="${WOOD}" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="29" y="1.5" width="8" height="4" rx="0.6" fill="#90a4ae" stroke="#455a64" stroke-width="0.6" transform="rotate(25 33 3.5)"/>
        ${sparkle(22, 11, 1.4, '#ffca28')}${sparkle(40, 9, 1.6, '#ffca28')}${sparkle(25, 7, 1, '#ffca28')}${sparkle(42, 14, 1, '#ffca28')}
    `),

    // ===== 城 =====
    // 小さな石の塔
    humble_castle: svg(HUMBLE_CASTLE),
    // 上が欠けてひびの入った城
    crumbling_castle: svg(CRUMBLING_CASTLE),
    // 赤い屋根の塔が2本ある小さな城
    small_castle: svg(SMALL_CASTLE),
    // 月夜の暗い城と幽霊
    haunted_castle: svg(HAUNTED_CASTLE),
    // 金の丸屋根と紫の旗の華やかな城
    opulent_castle: svg(OPULENT_CASTLE),
    // 横に長く広がる、塔の多い城
    sprawling_castle: svg(SPRAWLING_CASTLE),
    // 高い天守のそびえる壮大な城
    grand_castle: svg(GRAND_CASTLE),
    // 金の王冠を戴いた王の城
    kings_castle: svg(KINGS_CASTLE),

    // ===== 山の札 =====
    // 野営地のテントと戦利品の金の器
    encampment_plunder: halves(ENCAMPMENT, PLUNDER),
    // トーガの貴族と交易所の店先
    patrician_emporium: halves(PATRICIAN, EMPORIUM),
    // 荷車の開拓民と賑やかな村
    settlers_bustling_village: halves(SETTLERS, BUSTLING_VILLAGE),
    // 投石機と岩の山
    catapult_rocks: halves(CATAPULT, ROCKS),
    // 剣闘士とあふれる金貨
    gladiator_fortune: halves(GLADIATOR, FORTUNE),
    // 大きさの違う城が3つ並ぶ
    castles: svg(`
        ${sky('#ede0f5')}
        ${ground('#9ccc65')}
        ${tower(2, 19, 8, { wall: '#b3a68f', edge: '#7d705a' })}
        ${gate(6, 3, 4, WOOD)}
        <rect x="14" y="17" width="14" height="10" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        ${battlements(14, 17, 14, MARBLE, MARBLE_EDGE)}
        ${tower(12, 13, 5, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE })}
        ${tower(25, 13, 5, { wall: MARBLE, edge: MARBLE_EDGE, roof: TILE, flag: RED })}
        ${gate(21, 4, 6)}
        ${tower(32, 14, 4, { wall: MARBLE, edge: GOLD_EDGE, roof: PURPLE })}
        ${tower(43, 14, 4, { wall: MARBLE, edge: GOLD_EDGE, roof: PURPLE })}
        <rect x="35" y="9" width="9" height="18" fill="${MARBLE}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M35.5 8.5 v-4 l2 2 l2 -3 l2 3 l2 -2 v4z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <circle cx="39.5" cy="6.8" r="0.7" fill="${RED}"/>
        ${gate(39.5, 4, 7, PURPLE)}
        ${sparkle(30, 5, 1.4)}
    `)
};
