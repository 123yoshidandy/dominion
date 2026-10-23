/** 拡張「同盟」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground, sea } from './card-art-helpers.js';

// 町・ギルド・魔法の色合い（空の青・石の灰・布の色・魔法の紫）
const SKY = '#cfe7f7';
const SKY_DUSK = '#f3d9b5';
const SKY_NIGHT = '#2c2546';
const GRASS = '#86bf5e';
const GRASS_DARK = '#5b9440';
const GRASS_FAR = '#a9d18a';
const WATER = '#5dade2';
const WATER_DARK = '#3b8cc4';
const SAND = '#e6c88e';
const WOOD = '#8d5a2b';
const WOOD_LIGHT = '#b9824a';
const WOOD_EDGE = '#5d3a1a';
const BRICK = '#b5523b';
const BRICK_EDGE = '#7a3324';
const STONE = '#b9b3a6';
const STONE_LIGHT = '#d6d0c2';
const STONE_EDGE = '#7a7468';
const STEEL = '#c3ccd3';
const STEEL_EDGE = '#6b7b86';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';
const RED = '#c0392b';
const RED_DARK = '#8e1f1f';
const BLUE = '#2f5d9e';
const GREEN = '#2e8b57';
const PURPLE = '#6c3f8f';
const PURPLE_LIGHT = '#b48ad6';
const CANVAS = '#efe3c6';
const PAPER = '#f6ead0';
const PLASTER = '#f1e3c6';
const SKIN = '#f0c8a0';
const INK = '#3e2f2a';
const FIRE = '#ff9a3c';
const FIRE_CORE = '#ffe08a';
const BONE = '#ece6d6';

// 空（上半分の明るい色）
const sky = (color = SKY) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 室内の壁（床は ground で重ねる）
const wall = (color = CANVAS) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 木の床
const floor = () => `${ground(WOOD_LIGHT)}<path d="M0 27 h48" stroke="${WOOD_EDGE}" stroke-width="0.6"/>`;

// 白い雲
const cloud = (x, y, s = 1) => `
    <g fill="#fff" opacity="0.9">
        <ellipse cx="${x}" cy="${y}" rx="${4 * s}" ry="${1.6 * s}"/>
        <circle cx="${x - 1.2 * s}" cy="${y - 1 * s}" r="${1.6 * s}"/>
        <circle cx="${x + 1.2 * s}" cy="${y - 1.2 * s}" r="${2 * s}"/>
    </g>`;

// 星（夜空）
const stars = (points) =>
    points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.5" fill="#fff6c9"/>`).join('');

// 光のきらめき（4方向にとがった星）
const sparkle = (x, y, r = 2, color = '#fff6c9') =>
    `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}z" fill="${color}"/>`;

// 立っている人（x は体の中心、cloth は服の色）
const person = (x, cloth, { skin = SKIN, hair = '', scale = 1 } = {}) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 2} 23 v4 M${x + 2} 23 v4" stroke="${INK}" stroke-width="1.6"/>
        <path d="M${x - 4} 23 L${x - 3} 14.5 h6 L${x + 4} 23 z" fill="${cloth}"/>
        <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
        ${hair}
    </g>`;

// 長い衣の人（裾が地面まである）
const robed = (x, cloth, { skin = SKIN, hair = '' } = {}) => `
    <path d="M${x - 5} 27 L${x - 3} 14.5 h6 L${x + 5} 27 z" fill="${cloth}"/>
    <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
    ${hair}`;

// 髪
const hairCap = (x, color) => `<path d="M${x - 3} 10.5 q3 -5 6 0" fill="${color}"/>`;

// フード（衣の人の頭にかぶせる）
const hood = (x, color) => `<path d="M${x - 3.6} 12.5 q0 -6.5 3.6 -6.5 q3.6 0 3.6 6.5 l-1 -1 q-0.4 -3.6 -2.6 -3.6 q-2.2 0 -2.6 3.6z" fill="${color}"/>`;

// とんがり帽子（魔法使い）
const wizardHat = (x, color, star = GOLD) => `
    <path d="M${x - 4.5} 9 h9 l-3.5 -1.2 L${x + 1.5} 1 L${x - 2.5} 7.8z" fill="${color}"/>
    <circle cx="${x}" cy="6" r="0.6" fill="${star}"/>`;

// 王冠
const crown = (x, y, w = 6, color = GOLD) =>
    `<path d="M${x - w / 2} ${y} v-${w * 0.45} l${w * 0.25} ${w * 0.25} l${w * 0.25} -${w * 0.35} l${w * 0.25} ${w * 0.35} l${w * 0.25} -${w * 0.25} v${w * 0.45}z" fill="${color}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>`;

// 兜（兵士）
const helmet = (x, color = STEEL) => `
    <path d="M${x - 3.3} 10.6 q0 -4.6 3.3 -4.6 q3.3 0 3.3 4.6z" fill="${color}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
    <path d="M${x} 6 v-1.6" stroke="${RED}" stroke-width="1.2"/>`;

// つば広の帽子
const brimHat = (x, color) => `
    <ellipse cx="${x}" cy="8.8" rx="5" ry="1.1" fill="${color}"/>
    <path d="M${x - 2.6} 8.8 q0 -3.4 2.6 -3.4 q2.6 0 2.6 3.4z" fill="${color}"/>`;

// 腕（肩から手先まで）
const arm = (x1, y1, x2, y2, color = SKIN) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`;

// 硬貨
const coin = (x, y, r = 2.2) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="${GOLD_EDGE}" stroke-width="0.35"/>`;

// 積み上げた硬貨
const coinStack = (x, y, n = 3, r = 2.6) =>
    Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${y - i * 1.4}" rx="${r}" ry="${r * 0.4}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>`).join('');

// 恩恵トークン（同盟の握手の印）
const favor = (x, y, r = 3) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="#e8d3a2" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    <path d="M${x - r * 0.6} ${y + r * 0.1} q${r * 0.3} -${r * 0.5} ${r * 0.6} -${r * 0.1} q${r * 0.3} -${r * 0.4} ${r * 0.6} 0" stroke="${WOOD_EDGE}" stroke-width="${r * 0.22}" fill="none" stroke-linecap="round"/>`;

// 家（x は左端、w は幅）
const house = (x, w, h, { wallColor = PLASTER, roof = BRICK, door = true } = {}) => `
    <rect x="${x}" y="${27 - h}" width="${w}" height="${h}" fill="${wallColor}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <path d="M${x - 1.5} ${27 - h} L${x + w / 2} ${27 - h - w * 0.45} L${x + w + 1.5} ${27 - h}z" fill="${roof}"/>
    ${door ? `<rect x="${x + w / 2 - 1.4}" y="${23}" width="2.8" height="4" fill="${WOOD}"/>` : ''}`;

// 石の塔（x は左端）
const tower = (x, w, top, { color = STONE, edge = STONE_EDGE } = {}) => `
    <rect x="${x}" y="${top}" width="${w}" height="${27 - top}" fill="${color}" stroke="${edge}" stroke-width="0.5"/>
    <path d="M${x} ${top} ${Array.from({ length: Math.floor(w / 2) }, (_, i) => `v-1.6 h1 v1.6 h1`).join(' ')}" fill="${color}" stroke="${edge}" stroke-width="0.5"/>`;

// 旗（ポールの根元 x,y）
const flag = (x, y, color = RED, h = 8) => `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - h}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
    <path d="M${x} ${y - h} l5 1.5 l-5 1.5z" fill="${color}"/>`;

// 帆船（x は船体の中心）
const ship = (x, { sail = '#fdfefe', hull = WOOD, scale = 1, oars = false } = {}) => `
    <g transform="translate(${x} 26) scale(${scale}) translate(${-x} -26)">
        <path d="M${x - 10} 22 h20 l-3 4.5 h-14z" fill="${hull}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <line x1="${x}" y1="22" x2="${x}" y2="6" stroke="${WOOD_EDGE}" stroke-width="0.9"/>
        <path d="M${x - 6} 8 q6 -1.5 12 0 v10 q-6 -1.5 -12 0z" fill="${sail}" stroke="#c9c1b0" stroke-width="0.4"/>
        ${oars ? [-7, -4, -1, 2, 5].map(dx => `<path d="M${x + dx} 24 l-2 4" stroke="${WOOD_EDGE}" stroke-width="0.6"/>`).join('') : ''}
    </g>`;

// 巻物
const scroll = (x, y, w = 14, h = 9, color = PAPER) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <rect x="${x - 1}" y="${y - 0.8}" width="${w + 2}" height="1.6" rx="0.8" fill="#d9c49a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
    <rect x="${x - 1}" y="${y + h - 0.8}" width="${w + 2}" height="1.6" rx="0.8" fill="#d9c49a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>`;

// 本
const book = (x, y, w = 8, h = 6, color = RED) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${INK}" stroke-width="0.4"/>
    <rect x="${x + 0.6}" y="${y + h - 1.2}" width="${w - 0.6}" height="1" fill="${PAPER}"/>`;

// 剣（柄の位置 x,y から上へ、angle で傾ける）
const sword = (x, y, angle = 0, len = 12) => `
    <g transform="rotate(${angle} ${x} ${y})">
        <path d="M${x - 0.8} ${y - 2} v-${len} l0.8 -1.6 l0.8 1.6 v${len}z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.3"/>
        <rect x="${x - 2.6}" y="${y - 2.4}" width="5.2" height="1" fill="${GOLD_EDGE}"/>
        <rect x="${x - 0.6}" y="${y - 1.4}" width="1.2" height="3" fill="${WOOD_EDGE}"/>
    </g>`;

// 盾
const shield = (x, y, w = 7, color = BLUE, emblem = GOLD) => `
    <path d="M${x - w / 2} ${y} h${w} v${w * 0.5} q0 ${w * 0.6} -${w / 2} ${w * 0.9} q-${w / 2} -${w * 0.3} -${w / 2} -${w * 0.9}z" fill="${color}" stroke="${INK}" stroke-width="0.4"/>
    <path d="M${x} ${y + 1} v${w * 0.9} M${x - w * 0.3} ${y + w * 0.4} h${w * 0.6}" stroke="${emblem}" stroke-width="0.8"/>`;

// テーブル（天板の上端 y）
const table = (x, y, w) => `
    <rect x="${x}" y="${y}" width="${w}" height="1.6" fill="${WOOD}"/>
    <path d="M${x + 1.5} ${y + 1.6} V27 M${x + w - 1.5} ${y + 1.6} V27" stroke="${WOOD_EDGE}" stroke-width="1"/>`;

// 袋
const sack = (x, y, w, h, color = '#d7c29a', edge = WOOD_EDGE) => `
    <path d="M${x - w / 2} ${y} q-1 -${h * 0.7} ${w * 0.25} -${h * 0.85} l${w * 0.1} -${h * 0.15} h${w * 0.3} l${w * 0.1} ${h * 0.15} q${w * 0.35} ${h * 0.15} ${w * 0.25} ${h * 0.85}z" fill="${color}" stroke="${edge}" stroke-width="0.5"/>`;

// 炎
const flame = (x, y, s = 1) => `
    <path d="M${x} ${y} q-${3 * s} -${2 * s} -${1 * s} -${6 * s} q${0.5 * s} ${2 * s} ${1.5 * s} ${1.5 * s} q0 -${2 * s} ${1.5 * s} -${3.5 * s} q${0.5 * s} ${3 * s} ${1.5 * s} ${4.5 * s} q${1 * s} ${2.5 * s} -${2.5 * s} ${3.5 * s}z" fill="${FIRE}"/>
    <path d="M${x} ${y} q-${1.4 * s} -${1 * s} -${0.4 * s} -${3 * s} q${0.6 * s} ${1 * s} ${1 * s} ${0.6 * s} q${0.8 * s} ${1.6 * s} -${0.6 * s} ${2.4 * s}z" fill="${FIRE_CORE}"/>`;

// 呪いの紫の煙
const curseWisp = (x, y) => `
    <path d="M${x} ${y} q-3 -2 0 -4 q3 -2 0 -4 q-2 -1.5 0 -3" stroke="${PURPLE_LIGHT}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.85"/>`;

// 4枚が重なった山（4種で1山の札。colors は上から順の4色）
const pileOf4 = (colors, art = '') => `
    ${colors.slice().reverse().map((color, i) => `<rect x="${14 + (3 - i) * 2.2}" y="${4 + i * 1.6}" width="16" height="20" rx="1.4" fill="${color}" stroke="${INK}" stroke-width="0.4"/>`).join('')}
    <g>${art}</g>`;

export const ALLIES_ART = {
    // ===== 4種で1山の山 =====
    // 町民：触れ役の鐘と、町の人々のカードの重なり
    townsfolk: svg(`
        ${sky()}
        ${ground(GRASS)}
        ${pileOf4(['#e8c66a', '#9aa5ad', '#c9a865', '#7a5a9e'], `
            <path d="M19 9 q3 -3 6 0 l1 6 h-8z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
            <circle cx="22" cy="16" r="0.9" fill="${GOLD_EDGE}"/>`)}
    `),
    // 鳥占い師：飛ぶ鳥と、占い師たちのカードの重なり
    augurs: svg(`
        ${sky(SKY_DUSK)}
        ${ground(GRASS_DARK)}
        ${pileOf4(['#7bb662', '#c9b48a', '#6c3f8f', '#2f5d9e'], `
            <path d="M18 13 q2 -2 4 0 q2 -2 4 0" stroke="${INK}" stroke-width="0.9" fill="none"/>
            <path d="M21 17 q1.4 -1.4 2.8 0 q1.4 -1.4 2.8 0" stroke="${INK}" stroke-width="0.7" fill="none"/>`)}
    `),
    // 衝突：交差した剣と、戦いのカードの重なり
    clashes: svg(`
        ${sky('#e4d6c8')}
        ${ground('#a58b6a')}
        ${pileOf4(['#b5523b', '#7a8f3a', '#4a4f57', '#c9a865'], `
            ${sword(20, 20, -30, 9)}${sword(24, 20, 30, 9)}`)}
    `),
    // 砦：旗の立つ石の砦と、砦のカードの重なり
    forts: svg(`
        ${sky()}
        ${ground(GRASS)}
        ${pileOf4(['#efe3c6', '#9aa5ad', '#7a7468', '#5d4a3a'], `
            <rect x="18" y="11" width="8" height="7" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.4"/>
            <path d="M18 11 v-1.4 h1.6 v1.4 h1.6 v-1.4 h1.6 v1.4 h1.6 v-1.4 h1.6 v1.4" fill="none" stroke="${STONE_EDGE}" stroke-width="0.4"/>
            ${flag(22, 9.6, RED, 5)}`)}
    `),
    // 冒険旅行：帆船と、航海のカードの重なり
    odysseys: svg(`
        ${sky()}
        ${sea()}
        ${pileOf4(['#d9c49a', '#5dade2', '#f4c430', '#2f6b8f'], `
            <path d="M17 16 h10 l-1.6 2.4 h-6.8z" fill="${WOOD}"/>
            <line x1="22" y1="16" x2="22" y2="8" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
            <path d="M19 9 q3 -0.8 6 0 v5 q-3 -0.8 -6 0z" fill="#fdfefe"/>`)}
    `),
    // 魔法使い：星のついた帽子と、魔法使いのカードの重なり
    wizards: svg(`
        ${sky(SKY_NIGHT)}
        ${stars([[4, 4], [9, 9], [40, 5], [44, 12], [36, 2]])}
        ${ground('#3b3560')}
        ${pileOf4(['#b48ad6', '#6c3f8f', '#2f5d9e', '#4a4f57'], `
            <path d="M17 18 h10 l-3 -1 L22 7 L20 17z" fill="${PURPLE}" stroke="${PURPLE_LIGHT}" stroke-width="0.4"/>
            ${sparkle(22, 12, 1.4)}`)}
    `),

    // ===== コスト2 =====
    // 装身具：宝石のついた金の首飾り
    bauble: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#4a2f4f"/>
        <rect x="0" y="22" width="48" height="10" fill="#7a3b5a"/>
        <path d="M10 6 q14 20 28 0" stroke="${GOLD}" stroke-width="1.2" fill="none"/>
        ${[[13, 10.5], [17, 14.5], [31, 14.5], [35, 10.5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/>`).join('')}
        <path d="M24 16 l4 4 l-4 6 l-4 -6z" fill="#e74c8b" stroke="#8e1f4f" stroke-width="0.5"/>
        <path d="M24 16 l1.6 4 l-1.6 6 M20 20 h8" stroke="#f9b3d1" stroke-width="0.4" fill="none"/>
        ${sparkle(30, 22, 1.5)}${sparkle(14, 20, 1)}
    `),
    // おべっか使い：王にお辞儀して手を差し出す廷臣
    sycophant: svg(`
        ${wall('#e9dcb8')}
        <rect x="0" y="27" width="48" height="5" fill="${RED_DARK}"/>
        <rect x="31" y="9" width="14" height="18" rx="1.5" fill="${RED}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        ${person(38, PURPLE, { hair: crown(38, 8.4, 5) })}
        <g transform="rotate(28 14 23)">${person(14, GREEN, { hair: hairCap(14, '#5a3a20') })}</g>
        ${arm(19, 18, 25, 19)}
        ${coin(26, 18.4, 1.4)}
    `),

    // ===== コスト3 =====
    // 輸入業者：港に下ろされる木箱と樽
    importer: svg(`
        ${sky()}
        ${sea()}
        <rect x="0" y="22" width="26" height="10" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        ${ship(37, { scale: 0.8, sail: '#f3e2b5' })}
        <rect x="4" y="15" width="7" height="7" fill="#c8a165" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M4 15 l7 7 M11 15 l-7 7" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <rect x="12" y="17" width="5" height="5" fill="#c8a165" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <ellipse cx="21" cy="18.6" rx="2.6" ry="3.4" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M18.6 17.4 h4.8 M18.6 20 h4.8" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
    `),
    // 商人の野営地：たき火を囲む縞模様の天幕
    merchant_camp: svg(`
        ${sky(SKY_DUSK)}
        ${ground(SAND)}
        <path d="M2 27 L12 10 L22 27z" fill="#e8c66a" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M7 27 L12 10 L17 27" fill="${RED}" opacity="0.8"/>
        <path d="M26 27 L36 12 L46 27z" fill="#efe3c6" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M31 27 L36 12 L41 27" fill="${BLUE}" opacity="0.7"/>
        <path d="M21 27 l2 -2 l2 2" stroke="${WOOD_EDGE}" stroke-width="0.8" fill="none"/>
        ${flame(24, 26, 0.8)}
    `),
    // 歩哨：城壁の上で山札を見張る見張り
    sentinel: svg(`
        ${sky()}
        ${cloud(10, 5)}
        ${tower(4, 40, 18)}
        ${person(24, BLUE, { hair: helmet(24), scale: 0.95 })}
        <path d="M30 23 V2" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M29 4 l1 -3 l1 3z" fill="${STEEL}"/>
        ${arm(27, 16, 30, 13)}
    `),
    // 下っ端：重い荷を背負う若い手下
    underling: svg(`
        ${sky()}
        ${ground(GRASS)}
        ${house(32, 12, 9)}
        ${sack(21.5, 23, 9, 11)}
        ${person(17, '#8a6a3a', { hair: hairCap(17, '#3a2a1a') })}
        <path d="M15 15 L22 21" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        ${favor(9, 8, 2.6)}
    `),
    // ===== コスト4 =====
    // 仲買人：天秤の片方に品物、もう片方に硬貨
    broker: svg(`
        ${wall('#e9dcb8')}
        ${floor()}
        <path d="M24 6 V25 M19 25 h10" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <path d="M10 9 L38 7" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <circle cx="24" cy="8" r="1" fill="${GOLD}"/>
        <path d="M10 9 l-4 7 h8z M38 7 l-4 7 h8z" fill="none" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M5 16 h10 q-5 3 -10 0z M33 14 h10 q-5 3 -10 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <rect x="7" y="12" width="5" height="4" fill="#c8a165" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${coinStack(38, 13.4, 2, 2.2)}
    `),
    // 大工：のこぎりで板を切る職人
    carpenter: svg(`
        ${wall('#e8dcc0')}
        ${floor()}
        <rect x="18" y="19" width="26" height="2" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M22 21 v6 M40 21 v6" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <rect x="24" y="16.6" width="18" height="2.4" fill="#d9b27a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${person(11, '#7a8f3a', { hair: hairCap(11, '#6a4a2a') })}
        ${arm(14, 16, 20, 15)}
        <path d="M19 14 L30 12 L30 15.4 L20 16.4z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <path d="M21 16.2 l0.6 0.8 l0.6 -0.8 l0.6 0.8 l0.6 -0.8 l0.6 0.8 l0.6 -0.8 l0.6 0.8 l0.6 -0.8" stroke="${STEEL_EDGE}" stroke-width="0.3" fill="none"/>
        <path d="M2 27 l3 -2 M42 10 l2 -1" stroke="#d9b27a" stroke-width="0.6"/>
    `),
    // 宅配人：手紙と包みを抱えて走る使い
    courier: svg(`
        ${sky()}
        ${cloud(34, 5)}
        ${ground(GRASS)}
        <path d="M0 22 q12 -3 24 -1" stroke="#c9a865" stroke-width="3" fill="none"/>
        <g transform="rotate(12 22 27)">${person(22, RED, { hair: brimHat(22, '#5a3a20') })}</g>
        <rect x="26" y="15" width="7" height="5" fill="#c8a165" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M26 17.5 h7 M29.5 15 v5" stroke="${RED_DARK}" stroke-width="0.4"/>
        <path d="M6 16 h7 M4 19 h8 M7 22 h6" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
    `),
    // 宿屋の主人：ジョッキを掲げる宿屋の主人と看板
    innkeeper: svg(`
        ${wall('#d9b98a')}
        ${floor()}
        <path d="M6 3 v4 M14 3 v4" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <rect x="3" y="7" width="14" height="7" rx="1" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M8 9 h4 v3 h-4z M12 9.6 h1.2 v1.8 h-1.2" fill="${GOLD}"/>
        ${table(24, 20, 22)}
        ${person(34, '#efe3c6', { hair: hairCap(34, '#3a2a1a') })}
        <path d="M31 18 h6 v4 h-6z" fill="#fff" opacity="0.9"/>
        ${arm(37, 16, 41, 12)}
        <rect x="40" y="8" width="4" height="5" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M40 8 q2 -2 4 0" fill="#fff"/>
        <rect x="27" y="17" width="3" height="3" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/>
    `),
    // 王家のガレー船：櫂を並べた王家の帆船
    royal_galley: svg(`
        ${sky()}
        ${cloud(10, 6)}
        ${sea()}
        ${ship(24, { sail: RED, hull: '#6b3a1a', oars: true, scale: 1.05 })}
        ${crown(24, 13.6, 5)}
        ${flag(24, 6, GOLD, 4)}
    `),
    // 町：時計塔のある広場
    town: svg(`
        ${sky()}
        ${cloud(40, 5)}
        ${ground(STONE_LIGHT)}
        ${house(2, 10, 10)}
        ${house(36, 10, 9, { roof: '#c76b3a' })}
        <rect x="19" y="8" width="10" height="19" fill="${PLASTER}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M18 8 L24 2 L30 8z" fill="${BLUE}"/>
        <circle cx="24" cy="13" r="3" fill="#fff" stroke="${INK}" stroke-width="0.5"/>
        <path d="M24 13 v-2 M24 13 h1.6" stroke="${INK}" stroke-width="0.5"/>
        <path d="M21.6 27 v-5 a2.4 2.4 0 0 1 4.8 0 v5z" fill="${WOOD}"/>
    `),

    // ===== コスト5 =====
    // 蛮族：斧を振り上げる毛皮の戦士と燃える家
    barbarian: svg(`
        ${sky('#f0c8a0')}
        ${ground(GRASS_DARK)}
        ${house(32, 12, 9, { roof: '#7a3324' })}
        ${flame(36, 18, 1)}${flame(42, 17, 0.8)}
        ${person(15, '#8a6a3a', { hair: `<path d="M12 10 q3 -4 6 0" fill="#c9a865"/><path d="M12 9 l-1.4 -2.4 M18 9 l1.4 -2.4" stroke="${BONE}" stroke-width="0.9"/>` })}
        <path d="M11 14.5 h8 v2 h-8z" fill="#d9c49a"/>
        ${arm(18, 16, 22, 9)}
        <path d="M22 11 V3" stroke="${WOOD_EDGE}" stroke-width="1"/>
        <path d="M22 3 q4 0 4 3.6 q-4 0.4 -4 -1z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
    `),
    // 首都：城壁に囲まれた丸屋根の大都市
    capital_city: svg(`
        ${sky()}
        ${cloud(9, 5)}
        ${ground(GRASS)}
        <rect x="2" y="17" width="44" height="10" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M2 17 ${Array.from({ length: 11 }, () => 'v-1.4 h2 v1.4 h2').join(' ')}" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <rect x="18" y="9" width="12" height="8" fill="${PLASTER}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M18 9 q6 -9 12 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        ${tower(6, 6, 10)}${tower(36, 6, 10)}
        ${flag(9, 9, BLUE, 6)}${flag(39, 9, BLUE, 6)}
        <path d="M21.6 27 v-5 a2.4 2.4 0 0 1 4.8 0 v5z" fill="${WOOD}"/>
    `),
    // 契約：封蝋を押した契約書と羽根ペン
    contract: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${WOOD}"/>
        <path d="M0 10 h48 M0 21 h48" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        ${scroll(10, 5, 22, 20)}
        <path d="M13 9 h16 M13 12 h16 M13 15 h12 M13 18 h14" stroke="#a89878" stroke-width="0.6"/>
        <circle cx="27" cy="21" r="2.6" fill="${RED}" stroke="${RED_DARK}" stroke-width="0.5"/>
        <path d="M25.8 21 h2.4 M27 19.8 v2.4" stroke="${RED_DARK}" stroke-width="0.5"/>
        <path d="M38 26 L44 6 q2 3 -1 9 z" fill="#fff" stroke="#c9c1b0" stroke-width="0.4"/>
        <path d="M38 26 L42 13" stroke="${INK}" stroke-width="0.4"/>
    `),
    // 密使：封書を持って夜道を急ぐフードの使者
    emissary: svg(`
        ${sky('#3b4a6b')}
        ${stars([[5, 5], [12, 3], [33, 6], [42, 3]])}
        <circle cx="40" cy="9" r="2.6" fill="#fff4c4"/>
        ${ground('#4a5a3a')}
        ${robed(18, '#3a3f58', { hair: hood(18, '#2b2f45') })}
        ${arm(21, 17, 26, 17)}
        <rect x="25" y="15" width="6" height="4" fill="${PAPER}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <circle cx="28" cy="17" r="0.9" fill="${RED}"/>
    `),
    // ガレリア：絵の並ぶ柱廊の画廊
    galleria: svg(`
        ${wall('#efe6d4')}
        ${ground('#c9b48a')}
        ${[3, 19, 35].map(x => `<rect x="${x}" y="2" width="2" height="25" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.4"/>`).join('')}
        <rect x="7" y="8" width="9" height="7" fill="#7fb3d5" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <path d="M7 15 l3 -3 l2 2 l2 -3 l2 4" fill="${GREEN}"/>
        <rect x="23" y="7" width="9" height="9" fill="#f6d28b" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <circle cx="27.5" cy="11" r="2" fill="${SKIN}"/>
        <rect x="39" y="9" width="7" height="6" fill="#c39bd3" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <rect x="0" y="0" width="48" height="2" fill="${STONE}"/>
    `),
    // ギルドの親方：鎖の飾りをかけた親方と、職人の印の旗
    guildmaster: svg(`
        ${wall('#d9c8a6')}
        ${floor()}
        <path d="M6 3 h10 v12 l-5 -2.4 l-5 2.4z" fill="${BLUE}" stroke="${INK}" stroke-width="0.4"/>
        <path d="M9 6 l4 4 M13 6 l-4 4" stroke="${GOLD}" stroke-width="1"/>
        <path d="M32 3 h10 v12 l-5 -2.4 l-5 2.4z" fill="${RED}" stroke="${INK}" stroke-width="0.4"/>
        <circle cx="37" cy="8" r="2" fill="none" stroke="${GOLD}" stroke-width="0.9"/>
        ${robed(24, GREEN, { hair: hairCap(24, '#8a8a8a') })}
        <path d="M21 15 q3 4 6 0" stroke="${GOLD}" stroke-width="0.8" fill="none"/>
        <circle cx="24" cy="18.4" r="1.2" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/>
        ${favor(24, 23.4, 1.8)}
    `),
    // 辻強盗：街道で拳銃を向ける覆面の追いはぎ
    highwayman: svg(`
        ${sky('#9fb2c8')}
        ${ground('#7a6a4a')}
        <path d="M0 27 q24 -4 48 0" fill="#c9a865"/>
        <path d="M38 27 V10 q-4 -4 -8 0" stroke="${WOOD_EDGE}" stroke-width="1.6" fill="none"/>
        ${person(18, '#2b2b2b', { hair: `<path d="M15 10 h6 v1.6 h-6z" fill="#2b2b2b"/>${brimHat(18, '#1a1a1a')}` })}
        <path d="M14 14.5 L10 27 h4 l4 -12z" fill="#1a1a1a"/>
        ${arm(21, 16, 27, 15)}
        <path d="M27 14 h4 v1.2 h-4z M27 15.2 h1.2 v2 h-1.2z" fill="#4a4f57"/>
    `),
    // 狩人：弓を構えて森を進む狩人
    hunter: svg(`
        ${sky()}
        ${ground(GRASS_DARK)}
        ${[4, 44].map(x => `<rect x="${x - 1}" y="12" width="2" height="15" fill="${WOOD_EDGE}"/><circle cx="${x}" cy="10" r="5" fill="#4f8a3a"/>`).join('')}
        ${person(20, '#5b7a3a', { hair: brimHat(20, '#3a5a2a') })}
        <path d="M27 7 q-5 9 0 18" stroke="${WOOD}" stroke-width="1" fill="none"/>
        <path d="M27 7 V25" stroke="#d9d4cc" stroke-width="0.3"/>
        <path d="M22 16 h12" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M34 16 l-1.6 -1 v2z" fill="${STEEL_EDGE}"/>
        ${arm(23, 16, 27, 16)}
    `),
    // 改変：作り変えの台で、壊れた品が新しい品に変わる
    modify: svg(`
        ${wall('#e3d8c4')}
        ${floor()}
        <rect x="6" y="19" width="10" height="5" fill="#9aa5ad" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <path d="M8 19 l2 -3 l1 2 l2 -2.6 l1 3.6" fill="#7a7468"/>
        <path d="M19 19 h9 l-2 -2 M28 19 l-2 2" stroke="${INK}" stroke-width="0.9" fill="none" stroke-linecap="round"/>
        <rect x="31" y="14" width="11" height="10" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M31 17 h11 M36.5 14 v10" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        ${sparkle(43, 11, 1.6)}${sparkle(30, 10, 1)}
    `),
    // 散兵：槍を構えて散らばって進む軽装の兵士
    skirmisher: svg(`
        ${sky()}
        <path d="M0 21 q16 -6 30 -1 q10 -3 18 -1 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        ${person(10, RED, { hair: helmet(10), scale: 0.8 })}
        ${person(25, RED, { hair: helmet(25) })}
        ${person(40, RED, { hair: helmet(40), scale: 0.7 })}
        <path d="M28 25 L36 5" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        <path d="M36 5 l-0.4 2 l1.4 -0.6z" fill="${STEEL}"/>
        <path d="M13 25 L18 12 M42 26 L46 16" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    `),
    // 専門家：拡大鏡で宝石を調べる職人
    specialist: svg(`
        ${wall('#e8dcc0')}
        ${table(4, 20, 40)}
        ${floor()}
        ${person(13, BLUE, { hair: hairCap(13, '#6a6a6a') })}
        ${arm(16, 16, 24, 15)}
        <circle cx="27" cy="13" r="3.6" fill="#cfe7f7" fill-opacity="0.6" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <path d="M24.6 15.6 l-2 2" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <path d="M32 17 l2 -2.6 h3 l2 2.6 l-3.5 3z" fill="#5dade2" stroke="${WATER_DARK}" stroke-width="0.4"/>
        ${sparkle(40, 13, 1.2)}
    `),
    // すり替え：手の中のカードを入れ替える矢印
    swap: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2f5d4a"/>
        <rect x="6" y="6" width="12" height="18" rx="1.4" fill="${PAPER}" stroke="${INK}" stroke-width="0.5"/>
        <circle cx="12" cy="13" r="3" fill="${RED}"/>
        <rect x="30" y="6" width="12" height="18" rx="1.4" fill="${PAPER}" stroke="${INK}" stroke-width="0.5"/>
        <path d="M36 10 l3 3 l-3 3 l-3 -3z" fill="${BLUE}"/>
        <path d="M19 10 q5 -4 10 0 M29 20 q-5 4 -10 0" stroke="${GOLD}" stroke-width="1.2" fill="none"/>
        <path d="M27.4 8 l1.6 2 l-2.4 0.6 M20.6 22 l-1.6 -2 l2.4 -0.6" stroke="${GOLD}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    `),

    // ===== コスト6 =====
    // 侯爵：書状を広げる貴族と、山のような手札
    marquis: svg(`
        ${wall('#6b2a3a')}
        <rect x="0" y="27" width="48" height="5" fill="#3a1a24"/>
        ${robed(16, PURPLE, { hair: `${hairCap(16, '#d9d4cc')}${crown(16, 8.2, 4.4)}` })}
        <path d="M11 16 q5 3 10 0" stroke="#fff" stroke-width="1.2" fill="none"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${26 + i * 3}" y="${12 - Math.abs(i - 2)}" width="7" height="10" rx="0.8" fill="${PAPER}" stroke="${INK}" stroke-width="0.4" transform="rotate(${(i - 2) * 9} ${29.5 + i * 3} 22)"/>`).join('')}
    `),

    // ===== 町民 =====
    // 触れ役：鐘を鳴らして知らせる触れ役
    town_crier: svg(`
        ${sky()}
        ${ground(STONE_LIGHT)}
        ${house(32, 12, 10)}
        ${person(17, RED, { hair: brimHat(17, '#2b2b2b') })}
        ${arm(20, 16, 24, 10)}
        <path d="M22 10 q2 -4 4 0 l0.6 3 h-5.2z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M27 6 l2 -1.6 M28 9 l2.4 0 M27 12 l2 1.4" stroke="${INK}" stroke-width="0.5" stroke-linecap="round"/>
        ${scroll(5, 14, 6, 7)}
    `),
    // 鍛冶職人：金床で赤い鉄を打つ鍛冶屋
    blacksmith: svg(`
        ${wall('#4a3a32')}
        ${ground('#3a2e28')}
        ${flame(40, 22, 1.2)}
        <rect x="35" y="22" width="10" height="5" fill="${BRICK}" stroke="${BRICK_EDGE}" stroke-width="0.4"/>
        <path d="M18 19 h12 l-2 3 h-2 v5 h-4 v-5 h-2z" fill="#4a4f57"/>
        <rect x="22" y="17.6" width="5" height="1.4" fill="${FIRE}"/>
        ${person(11, '#6b4a2a', { hair: hairCap(11, '#2b1a10') })}
        ${arm(14, 16, 18, 11)}
        <path d="M18 13 L20 7" stroke="${WOOD}" stroke-width="0.9"/>
        <rect x="18" y="5" width="5" height="3" fill="#6c737d" transform="rotate(20 20 6)"/>
    `),
    // 粉屋：風車と小麦粉の袋
    miller: svg(`
        ${sky()}
        ${cloud(10, 6)}
        ${ground(GRASS)}
        <path d="M27 27 L29 12 h6 L37 27z" fill="${PLASTER}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M28.6 12 L32 8 L35.4 12z" fill="${BRICK}"/>
        <g transform="rotate(20 32 12)">
            <path d="M32 12 L32 1 M32 12 L43 12 M32 12 L32 23 M32 12 L21 12" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
            <path d="M32 2 h3 v8 h-3z M42 12 v3 h-8 v-3z M32 22 h-3 v-8 h3z M22 12 v-3 h8 v3z" fill="#efe3c6" stroke="${WOOD_EDGE}" stroke-width="0.3"/>
        </g>
        ${sack(10, 27, 10, 9, '#f4f1ea', '#c9c1b0')}
        ${sack(18, 27, 7, 6, '#f4f1ea', '#c9c1b0')}
    `),
    // 長老：杖を持ち、2本の道を示す白髪の長老
    elder: svg(`
        ${sky(SKY_DUSK)}
        ${ground(GRASS_DARK)}
        <rect x="36.4" y="10" width="1.6" height="17" fill="${WOOD_EDGE}"/>
        <path d="M38 11 h7 l2 2 l-2 2 h-7z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M36.4 17 h-7 l-2 2 l2 2 h7z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${robed(18, '#7a5a9e', { hair: `<path d="M15 10 q3 -5 6 0" fill="#f4f1ea"/><path d="M16.6 13 q1.4 5 2.8 0" fill="#f4f1ea"/>` })}
        <path d="M24 27 V8 q0 -2 -1.6 -2" stroke="${WOOD}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
        ${arm(21, 17, 24, 16)}
        ${coin(10, 20, 1.6)}${coin(6, 23, 1.6)}
    `),

    // ===== 鳥占い師 =====
    // 薬草集め：籠に薬草を摘む人
    herb_gatherer: svg(`
        ${sky()}
        ${ground(GRASS)}
        ${[8, 30, 38, 44].map((x, i) => `<path d="M${x} 27 q-1 -4 0 -6 M${x} 25 l-2 -2 M${x} 24 l2 -2" stroke="${GRASS_DARK}" stroke-width="0.8" fill="none"/><circle cx="${x}" cy="${20.6 - (i % 2)}" r="0.9" fill="${i % 2 ? '#f9e79f' : '#d7bde2'}"/>`).join('')}
        ${person(18, '#7a8f3a', { hair: brimHat(18, '#c9a865') })}
        <path d="M21 19 h7 l-1 5 h-5z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M22 19 q2.5 -4 5 0" stroke="${WOOD_EDGE}" stroke-width="0.5" fill="none"/>
        <path d="M23 19 l-1 -2.4 M25 19 v-3 M27 19 l1 -2" stroke="${GRASS_DARK}" stroke-width="0.7"/>
    `),
    // 侍祭：祭壇のろうそくをともす若い侍祭
    acolyte: svg(`
        ${wall('#d8cfe0')}
        ${ground('#9a8a7a')}
        <path d="M30 6 a6 6 0 0 1 12 0 V27 H30z" fill="#b8a8c8" opacity="0.6"/>
        <rect x="30" y="18" width="14" height="9" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        ${[33, 37, 41].map(x => `<rect x="${x - 0.6}" y="13" width="1.2" height="5" fill="#fff"/><path d="M${x} 13 q-0.8 -1.2 0 -2.4 q0.8 1.2 0 2.4z" fill="${FIRE}"/>`).join('')}
        ${robed(16, '#fdfefe', { hair: hairCap(16, '#6a4a2a') })}
        <path d="M13 15 v12 M19 15 v12" stroke="${RED}" stroke-width="0.8"/>
        ${arm(19, 17, 26, 14)}
        <path d="M26 14 l3 -1" stroke="${WOOD}" stroke-width="0.6"/>
    `),
    // 妖術師：水晶玉の前で手をかざす妖術師
    sorceress: svg(`
        ${sky(SKY_NIGHT)}
        ${stars([[4, 4], [42, 3], [36, 9], [10, 10]])}
        ${ground('#3b3560')}
        ${robed(16, PURPLE, { hair: `<path d="M13 10 q3 -5 6 0 v6 h-1 v-5 h-4 v5 h-1z" fill="#2b1a10"/>` })}
        ${arm(19, 17, 26, 16)}
        <rect x="28" y="22" width="10" height="5" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <circle cx="33" cy="18" r="4.4" fill="${PURPLE_LIGHT}" fill-opacity="0.75" stroke="#e6d6f2" stroke-width="0.5"/>
        <circle cx="31.6" cy="16.6" r="1.2" fill="#fff" opacity="0.7"/>
        ${curseWisp(41, 16)}
    `),
    // 巫女：神殿で煙の中から予言する巫女
    sibyl: svg(`
        ${wall('#e8dcc0')}
        ${ground('#c9b48a')}
        ${[4, 40].map(x => `<rect x="${x}" y="3" width="4" height="24" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.4"/><path d="M${x} 6 h4 M${x} 24 h4" stroke="${STONE_EDGE}" stroke-width="0.4"/>`).join('')}
        <path d="M0 3 h48" stroke="${STONE_EDGE}" stroke-width="1.6"/>
        ${robed(24, '#fdfefe', { hair: `<path d="M21 10 q3 -5 6 0 v7 h-1 v-6 h-4 v6 h-1z" fill="#5a3a20"/>` })}
        <path d="M21 9 h6" stroke="${GOLD}" stroke-width="0.8"/>
        <path d="M14 27 l2 -4 h4 l2 4z M26 27 l2 -4 h4 l2 4z" fill="${GOLD_EDGE}"/>
        <path d="M16 22 q-2 -4 1 -7 q2 -3 0 -6 M32 22 q2 -4 -1 -7 q-2 -3 0 -6" stroke="${PURPLE_LIGHT}" stroke-width="0.9" fill="none" opacity="0.8"/>
    `),

    // ===== 衝突 =====
    // 作戦：地図の上に駒を並べた作戦の机
    battle_plan: svg(`
        ${wall('#5d4a3a')}
        <path d="M2 30 L8 12 H40 L46 30z" fill="#e9dcb8" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M10 22 q8 -6 14 -1 q8 5 16 -2" stroke="#5dade2" stroke-width="1" fill="none"/>
        <path d="M14 15 l3 4 M30 14 l-2 5" stroke="#a89878" stroke-width="0.5"/>
        ${[[14, 25, RED], [20, 19, RED], [32, 24, BLUE], [36, 17, BLUE]].map(([x, y, c]) => `<path d="M${x - 1.4} ${y} h2.8 l-0.6 -2.4 a1 1 0 1 0 -1.6 0z" fill="${c}" stroke="${INK}" stroke-width="0.3"/>`).join('')}
        <path d="M21 17 L29 22" stroke="${RED_DARK}" stroke-width="0.8" stroke-dasharray="1 0.8"/>
        <path d="M29 22 l-2 -0.2 l1 -1.6z" fill="${RED_DARK}"/>
    `),
    // 弓兵：城壁から弓を引く弓兵
    archer: svg(`
        ${sky()}
        ${cloud(38, 5)}
        ${ground(GRASS)}
        <rect x="0" y="20" width="22" height="7" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.4"/>
        <path d="M0 20 v-1.6 h2 v1.6 h2 v-1.6 h2 v1.6 h2 v-1.6 h2 v1.6 h2 v-1.6 h2 v1.6 h2 v-1.6 h2 v1.6 h2 v-1.6 h2 v1.6" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.4"/>
        ${person(12, GREEN, { hair: helmet(12), scale: 0.85 })}
        <path d="M18 7 q4 6 0 12" stroke="${WOOD}" stroke-width="0.9" fill="none"/>
        <path d="M18 7 L14 13 L18 19" stroke="#d9d4cc" stroke-width="0.3" fill="none"/>
        <path d="M14 13 H24" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M30 9 H44 M40 7 l4 2 l-4 2" stroke="${WOOD_EDGE}" stroke-width="0.5" fill="none"/>
    `),
    // 将軍：旗を背に剣を掲げる将軍
    warlord: svg(`
        ${sky('#e4c8b0')}
        ${ground('#7a6a4a')}
        ${flag(8, 27, RED, 22)}${flag(42, 27, RED, 20)}
        <path d="M18 27 L20 14.5 h8 L30 27z" fill="#4a4f57"/>
        <path d="M18 27 L16 15 h-1 L14 27z M30 27 l2 -12 h1 l1 12z" fill="${RED_DARK}"/>
        <circle cx="24" cy="11" r="3" fill="${SKIN}"/>
        ${helmet(24, '#6c737d')}
        ${shield(19, 17, 5, RED, GOLD)}
        ${arm(27, 16, 30, 10)}
        ${sword(30, 11, 10, 9)}
    `),
    // 領土：境界の杭と旗が立つ広い土地
    territory: svg(`
        ${sky()}
        ${cloud(12, 5)}
        <path d="M0 18 q12 -5 24 -1 q12 -4 24 0 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        <path d="M0 22 L48 20" stroke="${WOOD_EDGE}" stroke-width="0.4" stroke-dasharray="1.4 1"/>
        ${[6, 18, 30, 42].map((x, i) => `<rect x="${x - 0.6}" y="${17 + (i % 2)}" width="1.2" height="5" fill="${WOOD}"/>`).join('')}
        ${flag(24, 21, BLUE, 12)}
        ${house(34, 7, 5, { door: false })}
    `),

    // ===== 砦 =====
    // テント：杭で張られた兵士の天幕
    tent: svg(`
        ${sky(SKY_DUSK)}
        ${ground(GRASS_DARK)}
        <path d="M8 27 L22 8 L36 27z" fill="${CANVAS}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M18 27 L22 14 L26 27z" fill="#5d4a3a"/>
        <path d="M22 8 V4" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M22 4 l4 1 l-4 1z" fill="${RED}"/>
        <path d="M8 27 L3 27 M36 27 L42 27 M14 19 L5 27 M30 19 L40 27" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${coin(43, 22, 1.6)}
    `),
    // 守備隊：門の前に並んで守る兵士たち
    garrison: svg(`
        ${sky()}
        ${tower(2, 44, 6)}
        <path d="M18 27 v-9 a6 6 0 0 1 12 0 v9z" fill="#5d4a3a"/>
        <path d="M18.6 21 h10.8 M18.6 24 h10.8 M21 18 v9 M24 15 v12 M27 18 v9" stroke="#3a2e28" stroke-width="0.4"/>
        ${person(9, BLUE, { hair: helmet(9), scale: 0.9 })}
        ${person(39, BLUE, { hair: helmet(39), scale: 0.9 })}
        <path d="M12 26 V8 M42 26 V8" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
    `),
    // 丘の砦：丘の上に建つ木の柵の砦
    hill_fort: svg(`
        ${sky()}
        ${cloud(40, 5)}
        <path d="M0 27 Q24 4 48 27z" fill="${GRASS_DARK}"/>
        ${ground(GRASS)}
        ${Array.from({ length: 10 }, (_, i) => `<path d="M${13 + i * 2.2} 15 v-4 l1 -1.4 l1 1.4 v4z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.3"/>`).join('')}
        <rect x="21" y="7" width="6" height="8" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M20 7 L24 4 L28 7z" fill="${BRICK}"/>
        ${flag(24, 4, RED, 4)}
    `),
    // 要塞：分厚い石壁と塔の要塞
    stronghold: svg(`
        ${sky('#c8d6e0')}
        ${ground(STONE_EDGE)}
        ${tower(2, 10, 6, { color: '#9a958a' })}
        ${tower(36, 10, 6, { color: '#9a958a' })}
        <rect x="12" y="12" width="24" height="15" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M12 12 ${Array.from({ length: 6 }, () => 'v-1.8 h2 v1.8 h2').join(' ')}" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M20 27 v-7 a4 4 0 0 1 8 0 v7z" fill="#3a2e28"/>
        <path d="M5 13 v3 M9 13 v3 M39 13 v3 M43 13 v3" stroke="#3a2e28" stroke-width="1"/>
        ${flag(7, 4.4, BLUE, 6)}${flag(41, 4.4, BLUE, 6)}
    `),

    // ===== 冒険旅行 =====
    // 古地図：宝の印のある古い地図とコンパス
    old_map: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${WOOD}"/>
        <path d="M4 5 L17 3 L31 6 L44 4 L44 27 L31 29 L17 26 L4 28z" fill="#e6d3a3" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M17 3 V26 M31 6 V29" stroke="#c9b07a" stroke-width="0.4"/>
        <path d="M8 18 q4 -6 9 -3 q5 3 8 -2 q3 -5 8 -1" stroke="${RED_DARK}" stroke-width="0.6" stroke-dasharray="1 0.8" fill="none"/>
        <path d="M33 10 l3 3 M36 10 l-3 3" stroke="${RED}" stroke-width="1"/>
        <path d="M6 9 q3 -3 6 0 q-1 3 -3 2 q-2 2 -3 -2z" fill="${GRASS_DARK}" opacity="0.6"/>
        <circle cx="38" cy="22" r="3.6" fill="${PAPER}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M38 19 l0.8 3 l-0.8 3 l-0.8 -3z" fill="${RED}"/>
    `),
    // 航海：大波を越えて進む帆船
    voyage: svg(`
        ${sky()}
        ${cloud(10, 5)}${cloud(38, 7, 0.8)}
        ${ship(24, { scale: 1.05 })}
        <path d="M0 24 q6 -4 12 0 t12 0 t12 0 t12 0 V32 H0z" fill="${WATER}"/>
        <path d="M0 28 q6 -3 12 0 t12 0 t12 0 t12 0 V32 H0z" fill="${WATER_DARK}"/>
        <path d="M4 24 q2 -1.4 4 0 M28 24 q2 -1.4 4 0" stroke="#fff" stroke-width="0.6" fill="none"/>
    `),
    // 沈没船の財宝：海底に沈んだ宝箱
    sunken_treasure: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2f6b8f"/>
        <rect x="0" y="0" width="48" height="8" fill="#4a8bb0"/>
        <path d="M0 27 q12 -3 24 0 t24 0 V32 H0z" fill="${SAND}"/>
        <path d="M30 26 L42 16 L46 20 L36 28z" fill="#5d3a1a" opacity="0.8"/>
        <path d="M40 18 V6" stroke="#5d3a1a" stroke-width="0.8" opacity="0.8"/>
        <rect x="10" y="18" width="14" height="9" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M10 18 q7 -5 14 0z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <rect x="16" y="20" width="2" height="3" fill="${GOLD}"/>
        ${coin(8, 26, 1.4)}${coin(27, 26.4, 1.4)}
        ${[[14, 13], [19, 9], [16, 5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.9" fill="none" stroke="#cfe7f7" stroke-width="0.4"/>`).join('')}
        <path d="M4 27 q-1 -6 1 -9 M6 27 q1 -4 0 -7" stroke="${GREEN}" stroke-width="0.9" fill="none"/>
    `),
    // 遠い岸辺：海の向こうの、小屋の建つ島
    distant_shore: svg(`
        ${sky(SKY_DUSK)}
        <circle cx="36" cy="16" r="5" fill="#ffd27a"/>
        <path d="M0 20 h48 V32 H0z" fill="${WATER}"/>
        <path d="M14 21 q10 -6 22 0z" fill="${SAND}"/>
        <path d="M22 18 q0 -6 -2 -9 M22 12 q-4 -2 -6 0 M22 12 q3 -3 6 -1 M22 12 q-3 1 -4 3" stroke="${GREEN}" stroke-width="0.9" fill="none"/>
        ${house(26, 5, 3.4, { door: false, roof: BRICK })}
        <path d="M2 26 q4 -1.4 8 0 M30 28 q4 -1.4 8 0" stroke="#fff" stroke-width="0.6" fill="none"/>
        <path d="M6 23 h5 l-1 1.4 h-3z" fill="${WOOD}"/>
    `),

    // ===== 魔法使い =====
    // 学生：魔法の本を開いて学ぶ若者
    student: svg(`
        ${wall('#e3d8c4')}
        ${floor()}
        ${table(22, 19, 22)}
        ${book(26, 16, 7, 3, BLUE)}${book(35, 15, 6, 4, RED)}
        ${person(14, '#5b7a8f', { hair: hairCap(14, '#8a5a2a') })}
        ${arm(17, 16, 24, 17)}
        <path d="M24 17 l4 -2 l4 2" stroke="${PAPER}" stroke-width="1.6" fill="none"/>
        ${sparkle(30, 9, 1.6, PURPLE_LIGHT)}${sparkle(36, 6, 1, PURPLE_LIGHT)}
    `),
    // 奇術師：帽子から品物を取り出す奇術師
    conjurer: svg(`
        ${sky(SKY_NIGHT)}
        ${stars([[5, 5], [40, 4], [44, 10]])}
        ${ground('#3b3560')}
        ${robed(16, BLUE, { hair: wizardHat(16, PURPLE) })}
        ${arm(19, 17, 26, 13)}
        <path d="M26 13 l3 -2" stroke="${INK}" stroke-width="0.7"/>
        <path d="M30 22 h10 l-1 5 h-8z" fill="#1a1a1a"/>
        <ellipse cx="35" cy="22" rx="6" ry="1.2" fill="#2b2b2b"/>
        <path d="M33 21 q2 -6 4 -8 M35 21 q-1 -4 2 -7" stroke="${PURPLE_LIGHT}" stroke-width="0.6" fill="none"/>
        ${coin(37, 12, 1.6)}${sparkle(32, 11, 1.4)}
    `),
    // 呪術師：杖から紫の呪いを放つ呪術師
    sorcerer: svg(`
        ${sky('#3b2f52')}
        ${stars([[6, 4], [14, 8], [42, 3]])}
        ${ground('#2c2546')}
        ${robed(14, '#4a2f6b', { hair: wizardHat(14, '#2b1a3a', PURPLE_LIGHT) })}
        ${arm(17, 17, 22, 13)}
        <path d="M22 13 L25 5" stroke="${WOOD}" stroke-width="1"/>
        <circle cx="25" cy="5" r="1.4" fill="${PURPLE_LIGHT}"/>
        <path d="M26 6 q6 2 8 8 q2 5 8 6" stroke="${PURPLE_LIGHT}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        ${curseWisp(42, 24)}${sparkle(34, 12, 1.2, PURPLE_LIGHT)}
    `),
    // リッチ：冠をかぶった骸骨の魔術師
    lich: svg(`
        ${sky('#1f1a30')}
        ${stars([[5, 4], [42, 5], [38, 11]])}
        ${ground('#2c2546')}
        <path d="M14 27 L18 14 h12 L34 27z" fill="#2b1a3a"/>
        <path d="M18 14 L14 27 h-2 L16 14z M30 14 L34 27 h2 L32 14z" fill="#4a2f6b"/>
        <circle cx="24" cy="10" r="4" fill="${BONE}"/>
        <circle cx="22.4" cy="9.6" r="1.1" fill="#6ff0a0"/>
        <circle cx="25.6" cy="9.6" r="1.1" fill="#6ff0a0"/>
        <path d="M22.4 12.6 h3.2 M23.2 12.2 v0.8 M24.8 12.2 v0.8" stroke="${INK}" stroke-width="0.4"/>
        ${crown(24, 6.6, 5)}
        <path d="M36 27 V6" stroke="${BONE}" stroke-width="1"/>
        <circle cx="36" cy="5" r="1.8" fill="#6ff0a0" opacity="0.8"/>
        ${arm(30, 17, 36, 15, BONE)}
    `),
};
