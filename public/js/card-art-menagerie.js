/** 拡張「移動動物園」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground } from './card-art-helpers.js';

// 動物・旅回り・雪の村の色合い（草原の緑・空の青・雪の白・木の茶）
const SKY = '#cfe7f7';
const SKY_WINTER = '#dde8f2';
const GRASS = '#86bf5e';
const GRASS_DARK = '#5b9440';
const GRASS_FAR = '#a9d18a';
const LEAF = '#4f8a3a';
const PINE = '#2f6b3f';
const SNOW = '#f7fbff';
const SNOW_SHADE = '#d3e2ef';
const WATER = '#5dade2';
const WATER_DARK = '#3b8cc4';
const SAND = '#e6c88e';
const SAND_DARK = '#c9a865';
const WOOD = '#8d5a2b';
const WOOD_LIGHT = '#b9824a';
const WOOD_EDGE = '#5d3a1a';
const HAY = '#e8c66a';
const BRICK = '#b5523b';
const BRICK_EDGE = '#7a3324';
const STONE = '#b9b3a6';
const STONE_EDGE = '#7a7468';
const STEEL = '#c3ccd3';
const STEEL_EDGE = '#6b7b86';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';
const RED = '#c0392b';
const RED_DARK = '#8e1f1f';
const BLUE = '#2f5d9e';
const CANVAS = '#efe3c6';
const PAPER = '#f6ead0';
const SKIN = '#f0c8a0';
const INK = '#3e2f2a';
const BAY = '#9a5b2e';
const BAY_DARK = '#4a2a14';
const CHESTNUT = '#c07a3e';
const GREY_HORSE = '#d9d4cc';
const WOOL = '#f4f1ea';
const WOOL_EDGE = '#c9c1b0';
const FIRE = '#ff9a3c';
const FIRE_CORE = '#ffe08a';
const NIGHT = '#2c2546';

// 空（上半分の明るい色）
const sky = (color = SKY) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 室内や建物の壁（床は ground で重ねる）
const wall = (color = CANVAS) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 白い雲
const cloud = (x, y, s = 1) => `
    <g fill="#fff" opacity="0.9">
        <ellipse cx="${x}" cy="${y}" rx="${4 * s}" ry="${1.6 * s}"/>
        <circle cx="${x - 1.2 * s}" cy="${y - 1 * s}" r="${1.6 * s}"/>
        <circle cx="${x + 1.2 * s}" cy="${y - 1.2 * s}" r="${2 * s}"/>
    </g>`;

// 雪のつぶ
const snowflakes = (points) =>
    points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.6" fill="#fff"/>`).join('');

// 丸い葉の木
const tree = (x, y, r = 5, leaf = LEAF, trunk = WOOD) => `
    <rect x="${x - 1}" y="${y}" width="2" height="${27 - y}" fill="${trunk}"/>
    <circle cx="${x}" cy="${y - r * 0.4}" r="${r}" fill="${leaf}"/>`;

// とがった針葉樹（snowy で雪をかぶせる）
const pine = (x, y, h = 12, { leaf = PINE, snowy = false } = {}) => `
    <rect x="${x - 0.8}" y="${y + h}" width="1.6" height="${27 - y - h}" fill="${WOOD_EDGE}"/>
    <path d="M${x} ${y} l${h * 0.35} ${h} h${-h * 0.7}z" fill="${leaf}"/>
    ${snowy ? `<path d="M${x} ${y} l${h * 0.14} ${h * 0.4} q${-h * 0.14} ${-h * 0.08} ${-h * 0.28} 0z M${x - h * 0.3} ${y + h * 0.86} q${h * 0.3} ${-h * 0.12} ${h * 0.6} 0 l${h * 0.05} ${h * 0.14} h${-h * 0.7}z" fill="${SNOW}"/>` : ''}`;

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

// 髪（person の上に重ねる）
const hairCap = (x, color) => `<path d="M${x - 3} 10.5 q3 -5 6 0" fill="${color}"/>`;

// つば広の帽子（person の hair に渡す）
const brimHat = (x, color) => `
    <ellipse cx="${x}" cy="8.8" rx="5" ry="1.1" fill="${color}"/>
    <path d="M${x - 2.6} 8.8 q0 -3.4 2.6 -3.4 q2.6 0 2.6 3.4z" fill="${color}"/>`;

// 腕（肩から手先まで）
const arm = (x1, y1, x2, y2, color = SKIN) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`;

// 向きと大きさをそろえる枠（足もと y=27 を基準に、flip で左向き）
const place = (x, scale, flip, body) =>
    `<g transform="translate(${x} 27) scale(${flip ? -scale : scale} ${scale}) translate(${-x} -27)">${body}</g>`;

// 馬（右向き。x は胴の中心。headOnly で首から上だけ）
const horse = (x, { color = BAY, mane = BAY_DARK, scale = 1, flip = false, headOnly = false, extra = '' } = {}) => place(x, scale, flip, `
    ${headOnly ? '' : `
    <path d="M${x - 6.2} 16.5 q-2.6 1.5 -2.2 6.5" stroke="${mane}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M${x - 4.6} 20 v7 M${x - 2.8} 20 v7 M${x + 3} 20 v7 M${x + 4.8} 20 v7" stroke="${color}" stroke-width="1.5"/>
    <path d="M${x - 4.6} 26 v1 M${x - 2.8} 26 v1 M${x + 3} 26 v1 M${x + 4.8} 26 v1" stroke="${INK}" stroke-width="1.6"/>
    <ellipse cx="${x}" cy="18" rx="6.5" ry="3.5" fill="${color}"/>`}
    <path d="M${x + 3} 15.5 L${x + 6.2} 8.6 L${x + 8.8} 9.6 L${x + 7.2} 18.5z" fill="${color}"/>
    <path d="M${x + 6.2} 9.2 L${x + 8} 7.6 L${x + 12.4} 11.4 Q${x + 12.8} 13 ${x + 11.3} 13 L${x + 8.4} 11.9z" fill="${color}"/>
    <path d="M${x + 7} 8.6 l-0.1 -2.2 l1.4 1.5z" fill="${color}"/>
    <path d="M${x + 7.4} 8 L${x + 3.6} 15.6" stroke="${mane}" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="${x + 9}" cy="9.9" r="0.45" fill="${INK}"/>
    ${extra}`);

// 犬（右向き。白黒の牧羊犬）
const dog = (x, { color = '#2b2b2b', chest = '#fff', scale = 1, flip = false } = {}) => place(x, scale, flip, `
    <path d="M${x - 4.2} 20.6 q-2.6 -0.8 -3 -3.6" stroke="${color}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M${x - 3} 22 v5 M${x - 1.5} 22 v5 M${x + 2} 22 v5 M${x + 3.5} 22 v5" stroke="${color}" stroke-width="1.2"/>
    <path d="M${x + 2} 26 v1 M${x + 3.5} 26 v1" stroke="${chest}" stroke-width="1.2"/>
    <ellipse cx="${x}" cy="21.5" rx="4.6" ry="2.4" fill="${color}"/>
    <ellipse cx="${x + 3.6}" cy="21.8" rx="1.4" ry="1.9" fill="${chest}"/>
    <circle cx="${x + 4.8}" cy="18" r="2.2" fill="${color}"/>
    <path d="M${x + 5.6} 17.4 l2.6 1 q0.3 1.2 -0.6 1.3 l-2.4 0.1z" fill="${chest}"/>
    <circle cx="${x + 8.1}" cy="18.5" r="0.45" fill="${INK}"/>
    <path d="M${x + 3.4} 16.6 l-0.4 -2 l1.8 1z" fill="${color}"/>
    <circle cx="${x + 5.4}" cy="17.3" r="0.35" fill="#fff"/>`);

// 羊（右向き。もこもこの毛）
const sheep = (x, { scale = 1, flip = false } = {}) => place(x, scale, flip, `
    <path d="M${x - 2.6} 23 v4 M${x - 1} 23 v4 M${x + 1.6} 23 v4 M${x + 3} 23 v4" stroke="${INK}" stroke-width="1.1"/>
    <g fill="${WOOL}" stroke="${WOOL_EDGE}" stroke-width="0.4">
        ${[[-3, 21], [-1, 19.4], [1.5, 19.4], [3, 21.2], [-2, 23], [0.5, 23.2], [2.4, 22.8], [0, 21]].map(([dx, y]) =>
            `<circle cx="${x + dx}" cy="${y}" r="2.1"/>`).join('')}
    </g>
    <ellipse cx="${x + 4.9}" cy="19.6" rx="1.5" ry="1.9" fill="${INK}"/>
    <path d="M${x + 3.8} 18.6 l-1.4 0.6" stroke="${INK}" stroke-width="0.9" stroke-linecap="round"/>
    <circle cx="${x + 5.3}" cy="19" r="0.3" fill="#fff"/>`);

// ヤギ（右向き。角とあごひげ）
const goat = (x, { color = '#e9e2d4', edge = '#9c8f78', scale = 1, flip = false } = {}) => place(x, scale, flip, `
    <path d="M${x - 4.2} 19.5 l-1.4 -1.8" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M${x - 3} 22 v5 M${x - 1.6} 22 v5 M${x + 2} 22 v5 M${x + 3.4} 22 v5" stroke="${edge}" stroke-width="1.1"/>
    <ellipse cx="${x}" cy="20.6" rx="4.6" ry="2.5" fill="${color}" stroke="${edge}" stroke-width="0.4"/>
    <path d="M${x + 2.6} 19.6 L${x + 4.4} 15 L${x + 6} 15.6 L${x + 4.6} 21z" fill="${color}"/>
    <path d="M${x + 4.2} 15.2 L${x + 5.4} 14 L${x + 8} 16.6 Q${x + 8} 17.8 ${x + 7} 17.6 L${x + 5.4} 16.6z" fill="${color}" stroke="${edge}" stroke-width="0.4"/>
    <path d="M${x + 4.6} 14.6 q-1 -2.6 -3 -2.4" stroke="${edge}" stroke-width="0.9" fill="none" stroke-linecap="round"/>
    <path d="M${x + 6.6} 17.4 l-0.3 2" stroke="${edge}" stroke-width="0.8" stroke-linecap="round"/>
    <circle cx="${x + 5.8}" cy="15.4" r="0.35" fill="${INK}"/>`);

// 座っている猫（正面向き）
const cat = (x, { color = '#1e1e24', eye = '#ffd54f', scale = 1 } = {}) => place(x, scale, false, `
    <path d="M${x + 4} 26.5 q5 0.5 4.6 -4.5 q-0.2 -2 1.4 -2.6" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M${x - 4.2} 27 Q${x - 5} 20 ${x - 2.2} 16.5 h4.4 Q${x + 5} 20 ${x + 4.2} 27z" fill="${color}"/>
    <circle cx="${x}" cy="13.8" r="3.4" fill="${color}"/>
    <path d="M${x - 3.2} 12.6 l0.1 -3.8 l2.4 2.2z M${x + 3.2} 12.6 l-0.1 -3.8 l-2.4 2.2z" fill="${color}"/>
    <ellipse cx="${x - 1.3}" cy="13.6" rx="0.95" ry="0.8" fill="${eye}"/>
    <ellipse cx="${x + 1.3}" cy="13.6" rx="0.95" ry="0.8" fill="${eye}"/>
    <path d="M${x - 1.3} 12.9 v1.4 M${x + 1.3} 12.9 v1.4" stroke="${INK}" stroke-width="0.4"/>
    <path d="M${x - 0.4} 15.2 h0.8 l-0.4 0.5z" fill="#e57373"/>`);

// ラクダ（右向き。こぶ1つ、背に布）
const camel = (x, { color = '#d4a868', edge = '#a57a3c', cloth = RED, scale = 1, flip = false } = {}) => place(x, scale, flip, `
    <path d="M${x - 5.2} 17 q-1.2 1.5 -1 4" stroke="${edge}" stroke-width="0.9" fill="none"/>
    <path d="M${x - 3.8} 18 v9 M${x - 2.2} 18 v9 M${x + 2.4} 18 v9 M${x + 4} 18 v9" stroke="${color}" stroke-width="1.3"/>
    <path d="M${x - 3.8} 26.4 v0.6 M${x - 2.2} 26.4 v0.6 M${x + 2.4} 26.4 v0.6 M${x + 4} 26.4 v0.6" stroke="${edge}" stroke-width="1.5"/>
    <ellipse cx="${x}" cy="17" rx="5.4" ry="2.7" fill="${color}"/>
    <path d="M${x - 3.8} 15.6 Q${x - 0.6} 8.4 ${x + 2.8} 15.6z" fill="${color}"/>
    <path d="M${x - 2.6} 15.4 q1.6 -2.6 4.2 0 v2.8 h-4.2z" fill="${cloth}"/>
    <path d="M${x - 2.6} 18.2 h4.2" stroke="${GOLD}" stroke-width="0.6"/>
    <path d="M${x + 4} 16.6 Q${x + 7.4} 17.4 ${x + 7.6} 12.6 L${x + 8.2} 10" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="${x + 9.4}" cy="10.2" rx="2.1" ry="1.2" fill="${color}"/>
    <path d="M${x + 7.6} 9 l0.2 -1" stroke="${edge}" stroke-width="0.7" stroke-linecap="round"/>
    <circle cx="${x + 9.2}" cy="9.7" r="0.35" fill="${INK}"/>`);

// 止まっている鷹（右向き。x,y は足もと）
const falcon = (x, y, scale = 1) => `
    <g transform="translate(${x} ${y}) scale(${scale})">
        <path d="M-1.6 0 l-2.8 4.5 h2.4z" fill="#5a4030"/>
        <ellipse cx="0" cy="-3.4" rx="2.6" ry="3.8" fill="#8a6a4a"/>
        <ellipse cx="0.6" cy="-2.6" rx="1.5" ry="2.6" fill="#efe4cf"/>
        <path d="M0.4 -2 l0.6 0.5 M0.4 -3.4 l0.6 0.5 M0.4 -0.8 l0.6 0.5" stroke="#8a6a4a" stroke-width="0.4"/>
        <path d="M-2.6 -5.6 Q-3.4 -1 -1.6 1.2 Q0 -2 -0.6 -5.8z" fill="#5a4030"/>
        <circle cx="0.4" cy="-7.4" r="1.9" fill="#5a4030"/>
        <path d="M2 -7.8 l1.4 0.5 l-1 1.2z" fill="${GOLD}"/>
        <circle cx="1" cy="-7.7" r="0.5" fill="${GOLD}"/><circle cx="1.1" cy="-7.7" r="0.25" fill="${INK}"/>
        <path d="M-0.8 0 v0.8 M0.8 0 v0.8" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
    </g>`;

// 袋（x は中心、y は底）
const sack = (x, y, w, h, color = '#d7c29a', tie = WOOD_EDGE) => `
    <path d="M${x - w * 0.3} ${y - h} Q${x - w * 0.6} ${y - h * 0.5} ${x - w / 2} ${y} H${x + w / 2} Q${x + w * 0.6} ${y - h * 0.5} ${x + w * 0.3} ${y - h}z" fill="${color}" stroke="${tie}" stroke-width="0.4"/>
    <path d="M${x - w * 0.35} ${y - h - 1.2} l${w * 0.35} 1.2 l${w * 0.35} -1.2" fill="${color}" stroke="${tie}" stroke-width="0.4"/>
    <path d="M${x - w * 0.3} ${y - h} h${w * 0.6}" stroke="${tie}" stroke-width="0.8"/>`;

// 樽（x は中心、y は底）
const barrel = (x, y, w, h) => `
    <path d="M${x - w * 0.4} ${y - h} Q${x - w * 0.56} ${y - h / 2} ${x - w * 0.4} ${y} H${x + w * 0.4} Q${x + w * 0.56} ${y - h / 2} ${x + w * 0.4} ${y - h}z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <path d="M${x - w * 0.47} ${y - h * 0.75} h${w * 0.94} M${x - w * 0.47} ${y - h * 0.25} h${w * 0.94}" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
    <path d="M${x - w * 0.15} ${y - h} v${h} M${x + w * 0.15} ${y - h} v${h}" stroke="${WOOD}" stroke-width="0.4"/>`;

// 馬の蹄鉄（下向きに開いたU字。x,y は弧の中心）
const horseshoe = (x, y, r) => `
    <path d="M${x - r} ${y + r} V${y} A${r} ${r} 0 0 1 ${x + r} ${y} V${y + r}" fill="none" stroke="${STEEL_EDGE}" stroke-width="${r * 0.62}"/>
    <path d="M${x - r} ${y + r} V${y} A${r} ${r} 0 0 1 ${x + r} ${y} V${y + r}" fill="none" stroke="${STEEL}" stroke-width="${r * 0.42}"/>
    ${[[-r, y + r * 0.5], [-r * 0.72, y - r * 0.68], [r * 0.72, y - r * 0.68], [r, y + r * 0.5]].map(([dx, yy]) =>
        `<circle cx="${x + dx}" cy="${yy}" r="${r * 0.09}" fill="${INK}"/>`).join('')}`;

// 木の柵（横木2本と杭）
const fence = (y = 20, posts = [2, 12, 22, 32, 42]) => `
    <path d="M0 ${y + 1.5} h48 M0 ${y + 4.5} h48" stroke="${WOOD_LIGHT}" stroke-width="1.3"/>
    ${posts.map((x) => `<rect x="${x - 0.8}" y="${y}" width="1.6" height="${27 - y}" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.3"/>`).join('')}`;

// 三角屋根の家（x,y は壁の左上。snowy で屋根に雪）
const house = (x, y, w, h, { wallColor = WOOD_LIGHT, roof = RED_DARK, snowy = false } = {}) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wallColor}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <path d="M${x - 1} ${y} L${x + w / 2} ${y - w / 3} L${x + w + 1} ${y} Z" fill="${snowy ? SNOW : roof}" ${snowy ? `stroke="${SNOW_SHADE}" stroke-width="0.5"` : ''}/>
    ${snowy ? `<path d="M${x - 1.2} ${y} q${(w + 2.4) / 4} 1.4 ${(w + 2.4) / 2} 0 q${(w + 2.4) / 4} 1.4 ${(w + 2.4) / 2} 0" fill="${SNOW}"/>` : ''}`;

// 光る窓
const lit = (x, y, w = 2.4, h = 2.4, color = '#ffd76a') =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>`;

// 金貨（小さな丸）
const gold = (x, y, r = 2) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>`;

// 炎
const flame = (x, y, s = 1) => `
    <path d="M${x} ${y} q${-3 * s} ${-2 * s} ${-1 * s} ${-6 * s} q${0.5 * s} ${2 * s} ${1.5 * s} ${2 * s} q${0 * s} ${-2 * s} ${1.5 * s} ${-3.5 * s} q${1 * s} ${4 * s} ${1 * s} ${5 * s} q${-0.2 * s} ${2.5 * s} ${-3 * s} ${2.5 * s}z" fill="${FIRE}"/>
    <path d="M${x} ${y} q${-1.4 * s} ${-1 * s} ${-0.4 * s} ${-3 * s} q${0.6 * s} ${1 * s} ${1 * s} ${0.6 * s} q${0.8 * s} ${1.6 * s} ${-0.6 * s} ${2.4 * s}z" fill="${FIRE_CORE}"/>`;

// とんがり帽子の魔女（正面向き。x は中心、scale で大きさ）
const witch = (x, robe, scale = 1) => place(x, scale, false, `
    <path d="M${x - 4.5} 27 L${x - 2.6} 15 h5.2 L${x + 4.5} 27z" fill="${robe}"/>
    <circle cx="${x}" cy="12.5" r="2.6" fill="#cbd5a8"/>
    <path d="M${x - 2.6} 11.5 q-0.6 3 -0.4 5 M${x + 2.6} 11.5 q0.6 3 0.4 5" stroke="${INK}" stroke-width="1" fill="none"/>
    <path d="M${x - 2.2} 10.6 L${x + 1} 2.5 L${x + 2.4} 10.6z" fill="#1e1530"/>
    <path d="M${x - 4.4} 10.6 h8.8" stroke="#1e1530" stroke-width="1.3" stroke-linecap="round"/>`);

export const MENAGERIE_ART = {
    // ===== コスト2 =====
    // 柵の前に座る黄色い目の黒猫
    black_cat: svg(`
        ${sky('#d8d4ec')}
        <circle cx="40" cy="7" r="3" fill="#fff4a3"/>
        ${fence(15, [3, 13, 35, 45])}
        ${ground(GRASS_DARK)}
        ${cat(24, { scale: 1.1 })}
    `),
    // 雪原を馬が引く赤いそり
    sleigh: svg(`
        ${sky(SKY_WINTER)}
        ${pine(44, 9, 14, { snowy: true })}${pine(3, 12, 11, { snowy: true })}
        ${ground(SNOW)}
        <path d="M0 27 q12 -1.5 24 0 t24 0" fill="${SNOW_SHADE}"/>
        ${horse(32, { color: BAY, scale: 0.78 })}
        <path d="M18 20.5 L29 21" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M5 14 h3 v4 h10 l-1.5 6 H7 q-3 0 -3 -4z" fill="${RED}" stroke="${RED_DARK}" stroke-width="0.6"/>
        <path d="M5 16 h3 M7 21 h10" stroke="${GOLD}" stroke-width="0.7"/>
        <path d="M3 26 h16 q3 0 3 -3" stroke="${GOLD_EDGE}" stroke-width="1" fill="none" stroke-linecap="round"/>
        <path d="M7 24 v2 M15 24 v2" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        ${sack(12.5, 18, 5, 4, '#7a5a9e', INK)}
        ${snowflakes([[8, 4], [15, 9], [22, 3], [27, 8], [36, 4], [41, 2]])}
    `),
    // 補給の袋と馬の蹄鉄（財宝）
    supplies: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#e9dcb8"/>
        <path d="M0 6 h48 M0 13 h48 M0 20 h48" stroke="#d6c69a" stroke-width="0.6"/>
        <rect x="0" y="26" width="48" height="6" fill="${WOOD}"/>
        <path d="M0 26 h48" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        ${sack(15, 27, 14, 13, '#d7c29a')}
        <path d="M12 21 q3 1 6 0" stroke="${WOOD}" stroke-width="0.5" fill="none"/>
        ${horseshoe(34, 13, 7)}
        ${gold(26, 26, 1.8)}${gold(42, 27, 1.6)}
    `),

    // ===== コスト3 =====
    // 砂丘を一列に進むラクダの隊列
    camel_train: svg(`
        ${sky('#f6e6c0')}
        <circle cx="41" cy="6" r="3.5" fill="#ffd27a"/>
        <path d="M0 22 q10 -5 22 -1 q12 -5 26 -1 V27 H0z" fill="${SAND_DARK}" opacity="0.6"/>
        ${ground(SAND)}
        <path d="M12.4 16.2 Q14 19 16.6 19.6 M26.4 16.2 Q28 19 30.6 19.6" stroke="${WOOD_EDGE}" stroke-width="0.4" fill="none"/>
        ${camel(6, { scale: 0.68, cloth: BLUE })}
        ${camel(20, { scale: 0.68 })}
        ${camel(34, { scale: 0.68, cloth: '#2e8b57' })}
    `),
    // 杖を持ったヤギ飼いと2頭のヤギ
    goatherd: svg(`
        ${sky()}
        ${cloud(36, 5)}
        <path d="M0 20 q14 -8 30 -2 q10 -3 18 0 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        ${person(11, '#7a8f3a', { hair: brimHat(11, '#8a6a3a') })}
        ${arm(14, 16, 17, 15)}
        <path d="M17 27 V7 q0 -3 -2.4 -3 q-2 0 -2 2" stroke="${WOOD}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
        ${goat(27)}
        ${goat(39, { color: '#a4836a', edge: '#6b513c', scale: 0.85 })}
    `),
    // ばらばらに分解された荷車（車輪と板）
    scrap: svg(`
        ${sky()}
        ${ground(GRASS_DARK)}
        <path d="M22 25 L42 19 L44 23 L24 29z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M27 23.5 l1.2 4 M33 21.8 l1.2 4 M38.5 20.2 l1.2 4" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <circle cx="12" cy="17" r="7.5" fill="none" stroke="${WOOD}" stroke-width="1.8"/>
        ${[0, 45, 90, 135].map((a) => `<path d="M12 9.5 V24.5" stroke="${WOOD}" stroke-width="0.9" transform="rotate(${a} 12 17)"/>`).join('')}
        <circle cx="12" cy="17" r="1.6" fill="${WOOD_EDGE}"/>
        <rect x="24" y="8" width="14" height="2.4" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4" transform="rotate(-18 31 9)"/>
        <rect x="30" y="12" width="13" height="2.4" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4" transform="rotate(12 36 13)"/>
        <path d="M26 15 l1.5 1.5 M41 6 l-1 1.6 M22 20 l1.6 0.6" stroke="${STEEL_EDGE}" stroke-width="0.8" stroke-linecap="round"/>
        <circle cx="45" cy="27.5" r="2" fill="none" stroke="${WOOD}" stroke-width="1"/>
    `),
    // 羊を追う白黒の牧羊犬
    sheepdog: svg(`
        ${sky()}
        ${cloud(12, 5, 0.9)}
        <path d="M0 21 q16 -6 30 -1 q10 -3 18 -1 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        ${sheep(39, { scale: 0.85 })}
        ${sheep(29)}
        ${dog(11, { scale: 1.1 })}
    `),
    // 雪の積もった屋根の村と針葉樹
    snowy_village: svg(`
        ${sky(SKY_WINTER)}
        ${pine(5, 8, 15, { snowy: true })}${pine(43, 10, 13, { snowy: true })}
        ${house(10, 15, 11, 12, { snowy: true })}
        ${house(26, 17, 12, 10, { snowy: true, wallColor: '#a87444' })}
        <rect x="31" y="10" width="2" height="4" fill="${BRICK}"/>
        <path d="M32 9 q-2 -2 0 -4 q2 -2 0 -4" stroke="#fff" stroke-width="1" fill="none" opacity="0.8"/>
        ${lit(12, 18)}${lit(17, 18)}${lit(28.5, 20)}
        <rect x="33" y="21" width="3" height="6" fill="${WOOD_EDGE}"/>
        ${ground(SNOW)}
        <path d="M0 27 q6 -1.6 12 0 t12 0 t12 0 t12 0" fill="${SNOW}"/>
        ${snowflakes([[3, 3], [10, 6], [17, 2], [24, 7], [30, 3], [38, 6], [46, 3], [22, 12], [40, 14]])}
    `),
    // 積み上げた樽と袋（財宝）
    stockpile: svg(`
        ${wall('#c9a26e')}
        ${[6, 12, 18, 24, 30, 36, 42].map((x) => `<path d="M${x} 0 V27" stroke="#a9824f" stroke-width="0.6"/>`).join('')}
        ${ground('#8a6a40')}
        ${barrel(10, 28, 9, 10)}${barrel(20, 28, 9, 10)}${barrel(15, 18, 9, 10)}
        ${sack(32, 28, 9, 8)}${sack(41, 28, 8, 7, '#c9b07f')}${sack(36.5, 20.5, 7, 6, '#e0cfa6')}
        ${gold(26, 27, 1.5)}
    `),

    // ===== コスト4 =====
    // 手配書を見上げるつば広帽子の賞金稼ぎ
    bounty_hunter: svg(`
        ${wall('#c9a26e')}
        ${[5, 13, 21, 29, 37, 45].map((x) => `<path d="M${x} 0 V27" stroke="#a9824f" stroke-width="0.6"/>`).join('')}
        ${ground('#b08a5a')}
        <rect x="4" y="3" width="16" height="20" fill="${PAPER}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <rect x="6" y="4.5" width="12" height="2.4" fill="${RED_DARK}"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="${INK}" stroke-width="0.8"/>
        <path d="M8 18 q4 -4 8 0" stroke="${INK}" stroke-width="0.8" fill="none"/>
        ${gold(12, 20.5, 1.5)}
        <circle cx="5.5" cy="4" r="0.5" fill="${STEEL_EDGE}"/><circle cx="18.5" cy="4" r="0.5" fill="${STEEL_EDGE}"/>
        ${person(33, '#6b4a2e', { hair: brimHat(33, INK) })}
        <path d="M30 14.5 l6 8.5" stroke="${INK}" stroke-width="0.8"/>
        <circle cx="38.5" cy="21.5" r="2.6" fill="none" stroke="${HAY}" stroke-width="1.2"/>
        ${arm(36, 16, 38.5, 19.5)}
        ${arm(30, 16, 25, 12)}
    `),
    // 赤いつば広帽子と法衣の枢機卿
    cardinal: svg(`
        ${wall('#efe2c6')}
        <path d="M30 23 V9 a6 6 0 0 1 12 0 V23z" fill="#8fb6dc" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <path d="M36 3 V23 M30 13 h12" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        ${ground(STONE)}
        ${robed(18, RED, { hair: `<ellipse cx="18" cy="8.6" rx="6" ry="1.3" fill="${RED_DARK}"/><path d="M15 8.6 q0 -3.4 3 -3.4 q3 0 3 3.4z" fill="${RED_DARK}"/><path d="M12.4 8.8 q-1 4 -0.6 8 M23.6 8.8 q1 4 0.6 8" stroke="${RED_DARK}" stroke-width="0.5" fill="none"/>` })}
        <path d="M14.5 16 h7 v1.8 h-7z" fill="#f5f5f5"/>
        <path d="M18 18.5 v6 M16 20.5 h4" stroke="${GOLD}" stroke-width="1.2"/>
        ${arm(21.5, 17, 25, 14)}
    `),
    // 槍と旗を持って馬に乗る騎兵
    cavalry: svg(`
        ${sky()}
        ${cloud(40, 6)}
        ${ground(GRASS)}
        ${horse(30, { color: '#6b4a3a', mane: INK, scale: 0.7 })}
        ${horse(18, { color: BAY })}
        <path d="M17 14 L19.5 17.5 L18.6 21" stroke="${BLUE}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M14.5 15 L15.2 8.5 h4.2 L20 15z" fill="${BLUE}"/>
        <path d="M14.8 11 h5" stroke="${GOLD}" stroke-width="0.6"/>
        <circle cx="17.3" cy="6" r="2.2" fill="${SKIN}"/>
        <path d="M14.9 6 q0 -3.4 2.4 -3.4 q2.4 0 2.4 3.4z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        ${arm(19, 10, 22, 12)}
        <path d="M12 18 L40 1" stroke="${WOOD}" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M40 1 l-2.2 0.2 l1.2 1.6z" fill="${STEEL_EDGE}"/>
        <path d="M37.4 2.6 l-5 -1 l1.6 2 l-0.4 2z" fill="${RED}"/>
    `),
    // 馬にブラシをかける馬丁
    groom: svg(`
        ${wall('#d8b98a')}
        ${[8, 16, 24, 32, 40].map((x) => `<path d="M${x} 0 V27" stroke="#bf9e6c" stroke-width="0.6"/>`).join('')}
        <path d="M2 27 l4 -6 l4 6 z M38 27 q3 -5 8 0z" fill="${HAY}"/>
        ${ground('#b08a5a')}
        ${person(20, '#4f7a3a', { hair: hairCap(20, '#6d4c41') })}
        ${horse(21, { color: CHESTNUT })}
        ${arm(19, 15.5, 22.5, 18.5)}
        <rect x="21.4" y="18" width="4" height="1.8" rx="0.6" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.3"/>
        <path d="M22 19.8 v0.8 M23 19.8 v0.8 M24 19.8 v0.8 M25 19.8 v0.8" stroke="${INK}" stroke-width="0.4"/>
        <path d="M28 16 l1 -1 M29.5 17.5 l1.2 -0.6 M27 18.8 l1.2 0.2" stroke="#fff" stroke-width="0.5" stroke-linecap="round"/>
    `),
    // 看板を下げた旅籠と、つながれた馬
    hostelry: svg(`
        ${sky()}
        ${ground(GRASS)}
        <rect x="2" y="10" width="22" height="17" fill="${CANVAS}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M2 14 h22 M8 10 v17 M18 10 v17" stroke="${WOOD}" stroke-width="0.9"/>
        <path d="M0 10 L13 2 L26 10z" fill="${RED_DARK}"/>
        ${lit(4, 16, 3, 3)}${lit(19.5, 16, 3, 3)}
        <path d="M10.5 27 v-7 a2.5 2.5 0 0 1 5 0 v7z" fill="${WOOD_EDGE}"/>
        <path d="M24 7 h8" stroke="${INK}" stroke-width="0.9"/>
        <path d="M27 7 v1.5 M31 7 v1.5" stroke="${INK}" stroke-width="0.4"/>
        <rect x="25.5" y="8.5" width="7" height="5.5" rx="0.6" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M27.4 13 v-3 h2.4 v3z M29.8 10.6 h1 v1.6 h-1" fill="none" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M27 27 v-7 M26 20 h2" stroke="${WOOD}" stroke-width="1"/>
        ${horse(37, { color: GREY_HORSE, mane: '#8a837a', scale: 0.78, flip: true })}
        <path d="M27 21 L30.2 19" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    `),
    // 芝生の広場に立つ大きな木とベンチ
    village_green: svg(`
        ${sky()}
        ${house(1, 12, 7, 6, { roof: '#9c3b2a' })}${house(40, 11, 7, 7, { wallColor: CANVAS, roof: '#6b4a3a' })}
        <rect x="0" y="18" width="48" height="14" fill="${GRASS}"/>
        <path d="M18 32 Q22 24 24 18 h2 Q26 24 32 32z" fill="#d9c9a0"/>
        ${tree(13, 14, 7, LEAF)}
        <circle cx="10" cy="9" r="3" fill="#62a043"/><circle cx="16" cy="12" r="2.6" fill="#62a043"/>
        <rect x="33" y="22" width="9" height="1.2" fill="${WOOD}"/>
        <path d="M33 19.5 h9 M34 23 v3 M41 23 v3" stroke="${WOOD}" stroke-width="1"/>
        ${[[5, 27], [8, 29], [44, 28], [38, 30], [28, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.8" fill="#ffd54f"/>`).join('')}
        ${[[7, 25], [41, 25], [3, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.8" fill="#f48fb1"/>`).join('')}
    `),

    // ===== コスト5 =====
    // 荷を積んで川を進む平底船と竿をさす船頭
    barge: svg(`
        ${sky()}
        <rect x="0" y="12" width="48" height="5" fill="${GRASS}"/>
        ${tree(6, 9, 3.5)}${tree(40, 8, 4)}
        <rect x="0" y="17" width="48" height="15" fill="${WATER}"/>
        <path d="M3 29 q3 -1 6 0 M30 30 q3 -1 6 0 M40 27.5 q3 -1 6 0" stroke="#fff" stroke-width="0.5" fill="none" opacity="0.7"/>
        <path d="M4 22 H42 L39 26 H8z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M5 23.5 h36" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <rect x="8" y="17.5" width="5" height="4.5" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <rect x="13.5" y="18.5" width="4" height="3.5" fill="${HAY}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${barrel(21, 22, 4.5, 5)}
        ${sack(26.5, 22, 4.5, 4)}
        <g transform="translate(0 -5)">${person(35, BLUE, { hair: hairCap(35, '#6d4c41'), scale: 0.85 })}</g>
        <path d="M30 3 L41 31" stroke="${WOOD_EDGE}" stroke-width="0.8" stroke-linecap="round"/>
        ${arm(36.5, 13, 33, 11)}
    `),
    // 大鍋を囲む3人の魔女
    coven: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${NIGHT}"/>
        ${[[4, 4], [12, 2], [33, 5], [44, 3], [26, 1]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.5" fill="#fffde7"/>`).join('')}
        <path d="M38 5 a3 3 0 1 0 3 3.5 a2.4 2.4 0 1 1 -3 -3.5z" fill="#fff4a3"/>
        ${ground('#3b3326')}
        ${witch(24, '#4b2e6e', 0.8)}
        ${witch(9, '#2f5b3f')}
        ${witch(39, '#6e2e4b')}
        <path d="M17 22 h14 q1 5 -7 5 q-8 0 -7 -5z" fill="#1a1a1a"/>
        <ellipse cx="24" cy="22" rx="7" ry="1.4" fill="#7cb342"/>
        <circle cx="21" cy="19.5" r="1.1" fill="#9ccc65"/><circle cx="26" cy="18" r="1.4" fill="#9ccc65"/><circle cx="24" cy="15" r="0.8" fill="#9ccc65"/>
        ${flame(21.5, 30.5, 0.6)}${flame(26.5, 30.5, 0.6)}
    `),
    // 木箱を元の場所から新しい場所へ運ぶ矢印
    displace: svg(`
        ${sky()}
        ${ground(GRASS)}
        <rect x="4" y="17" width="10" height="10" fill="none" stroke="${WOOD}" stroke-width="0.8" stroke-dasharray="1.4 1"/>
        <rect x="32" y="15" width="12" height="12" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        <path d="M32 15 l12 12 M44 15 l-12 12" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M32 21 h12" stroke="${WOOD}" stroke-width="0.5"/>
        <path d="M10 14 Q22 -2 34 10" stroke="${RED}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M36.5 12.5 l-6 -0.2 l3.6 -4.6z" fill="${RED}"/>
    `),
    // 腕の革手袋に鷹をとまらせる鷹匠
    falconer: svg(`
        ${sky()}
        ${cloud(10, 5, 0.8)}
        <path d="M34 4 q2 -1.5 4 0 q2 -1.5 4 0" stroke="${INK}" stroke-width="0.6" fill="none"/>
        <path d="M0 22 q20 -6 48 -1 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        ${person(14, '#2e6b5a', { hair: hairCap(14, '#4a2e1a') })}
        <path d="M17 16 L23 14.5 L27 14.5" stroke="${WOOD}" stroke-width="1.8" stroke-linecap="round"/>
        ${falcon(26.5, 13.2, 1.2)}
    `),
    // 釣り竿にかかって跳ねる魚
    fisherman: svg(`
        ${sky()}
        ${cloud(22, 5, 0.8)}
        <path d="M0 19 H14 L16 32 H0z" fill="${GRASS_DARK}"/>
        <path d="M14 19 L48 19 V32 H16z" fill="${WATER}"/>
        <path d="M22 26 q3 -1 6 0 M38 29 q3 -1 6 0 M30 22 q2 -1 4 0" stroke="#fff" stroke-width="0.5" fill="none" opacity="0.7"/>
        <g transform="translate(0 -8)">${person(8, '#c47a2c', { hair: brimHat(8, '#e8c66a') })}</g>
        ${arm(10.5, 9, 13, 8)}
        <path d="M12 9.5 Q24 -1 34 3" stroke="${WOOD_EDGE}" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        <path d="M34 3 L36 15" stroke="${INK}" stroke-width="0.3"/>
        <g transform="rotate(-35 37 19)">
            <path d="M31 19 q6 -4.5 11 0 q-5 4.5 -11 0z" fill="#6fa8c8" stroke="${WATER_DARK}" stroke-width="0.4"/>
            <path d="M42 19 l3 -2.4 v4.8z" fill="#6fa8c8" stroke="${WATER_DARK}" stroke-width="0.4"/>
            <circle cx="33.5" cy="18.4" r="0.6" fill="${INK}"/>
        </g>
        <path d="M33 24 q1 -1.6 2 0 M40 23 q1 -1.6 2 0" stroke="#fff" stroke-width="0.6" fill="none"/>
    `),
    // 石の門と大きな鍵束
    gatekeeper: svg(`
        ${sky()}
        ${ground(GRASS)}
        <rect x="0" y="6" width="34" height="21" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        ${[0, 6, 12, 18, 24, 30].map((x) => `<rect x="${x}" y="3.5" width="3.5" height="2.5" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>`).join('')}
        <path d="M7 27 v-10 a10 9 0 0 1 20 0 v10z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M17 27 V8 M7 19 h20 M7 24 h20" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        <circle cx="15.5" cy="21" r="0.7" fill="${STEEL_EDGE}"/><circle cx="18.5" cy="21" r="0.7" fill="${STEEL_EDGE}"/>
        <circle cx="40" cy="12" r="4" fill="none" stroke="${GOLD_EDGE}" stroke-width="1"/>
        ${[[-25, GOLD], [5, STEEL], [35, GOLD]].map(([a, c]) => `
            <g transform="rotate(${a} 40 16)">
                <circle cx="40" cy="18" r="1.6" fill="none" stroke="${c}" stroke-width="1"/>
                <path d="M40 19.6 V27 M40 25 h1.6 M40 23 h1.2" stroke="${c}" stroke-width="1"/>
            </g>`).join('')}
    `),
    // 鹿の角を飾った森の丸太小屋
    hunting_lodge: svg(`
        ${sky('#dbe9e2')}
        ${pine(4, 5, 17)}${pine(44, 4, 18)}${pine(38, 10, 12, { leaf: '#3d7a4c' })}
        ${ground(GRASS_DARK)}
        <rect x="10" y="13" width="26" height="14" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        ${[15.5, 18, 20.5, 23, 25.5].map((y) => `<path d="M10 ${y} h26" stroke="${WOOD_EDGE}" stroke-width="0.5"/>`).join('')}
        <path d="M7 13.5 L23 3 L39 13.5z" fill="#6b3a1e" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <rect x="31" y="3" width="2.4" height="5" fill="${STONE}"/>
        <rect x="20" y="19" width="6" height="8" fill="${WOOD_EDGE}"/>
        ${lit(12.5, 18, 4, 3)}${lit(29.5, 18, 4, 3)}
        <path d="M23 15.5 q-1.5 -2 -4 -2.4 M23 15.5 q1.5 -2 4 -2.4 M20.6 13.4 l-0.6 -2 M19 13.2 l-1.4 -1.2 M25.4 13.4 l0.6 -2 M27 13.2 l1.4 -1.2" stroke="${PAPER}" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        <circle cx="23" cy="16" r="1.1" fill="${WOOD_LIGHT}"/>
    `),
    // れんがの窯の口で燃える炎と焼き物の壺
    kiln: svg(`
        ${sky('#e9dcc8')}
        ${ground('#a4846a')}
        <path d="M8 27 V14 Q8 3 20 3 Q32 3 32 14 V27z" fill="${BRICK}" stroke="${BRICK_EDGE}" stroke-width="0.7"/>
        ${[7, 11, 15, 19, 23].map((y, i) => `<path d="M8.5 ${y} h23" stroke="${BRICK_EDGE}" stroke-width="0.4"/>${[12, 18, 24, 30].map((x) => `<path d="M${x - (i % 2) * 3} ${y} v4" stroke="${BRICK_EDGE}" stroke-width="0.4"/>`).join('')}`).join('')}
        <path d="M14 27 v-6 a6 5.5 0 0 1 12 0 v6z" fill="#3a1a10"/>
        ${flame(18.5, 27, 1.1)}${flame(22, 27, 0.9)}
        <path d="M37 27 q-3 -3 -1 -6 h-0.5 v-1.5 h5 v1.5 h-0.5 q2 3 -1 6z" fill="#c8643b" stroke="#8e3b1f" stroke-width="0.4"/>
        <path d="M42.5 27 q-1.5 -2 -0.4 -4 h3.8 q1.1 2 -0.4 4z" fill="#d9a441" stroke="#8e3b1f" stroke-width="0.4"/>
        <path d="M18 2 q-2 -1 0 -2 M22 2 q2 -1 0 -2" stroke="#9e9e9e" stroke-width="0.6" fill="none"/>
    `),
    // 厩舎の戸口から顔を出す2頭の馬
    livery: svg(`
        ${sky()}
        ${ground(GRASS)}
        <rect x="2" y="9" width="44" height="18" fill="${RED_DARK}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M0 9.5 L8 3 H40 L48 9.5z" fill="#5d4037"/>
        <rect x="6" y="11" width="13" height="16" fill="#2a1a12"/>
        <rect x="29" y="11" width="13" height="16" fill="#2a1a12"/>
        ${horse(5, { color: CHESTNUT, headOnly: true, extra: '' })}
        ${horse(28, { color: GREY_HORSE, mane: '#8a837a', headOnly: true })}
        <rect x="6" y="18" width="13" height="9" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <rect x="29" y="18" width="13" height="9" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M6 18 l13 9 M19 18 l-13 9 M29 18 l13 9 M42 18 l-13 9" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M22 27 l2 -5 l2 5z" fill="${HAY}"/>
        ${horseshoe(24, 13.5, 2.2)}
    `),
    // チェス盤の騎士の駒を動かす手
    mastermind: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2e2a3a"/>
        <path d="M2 30 L10 16 H38 L46 30z" fill="${WOOD_LIGHT}"/>
        ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 6 }, (_, c) => {
            if ((r + c) % 2) return '';
            const y0 = 16 + r * 3.5, y1 = y0 + 3.5;
            const xl = (y) => 10 - (y - 16) * 8 / 14, xr = (y) => 38 + (y - 16) * 8 / 14;
            const w0 = (xr(y0) - xl(y0)) / 6, w1 = (xr(y1) - xl(y1)) / 6;
            return `<path d="M${xl(y0) + c * w0} ${y0} h${w0} L${xl(y1) + (c + 1) * w1} ${y1} h${-w1}z" fill="${WOOD_EDGE}"/>`;
        }).join('')).join('')}
        <path d="M34 22 h4 l-0.5 -1.2 q1.2 -3 -1.5 -4.5 q-2.5 0.5 -1.6 4.5z" fill="#f5f1e8"/>
        <path d="M11 25 h4 l-0.5 -1.2 q0.5 -2.8 -1.5 -3.8 q-2 1 -1.5 3.8z" fill="#f5f1e8"/>
        <circle cx="13" cy="19.6" r="1" fill="#f5f1e8"/>
        <path d="M18.5 15 h6 l-0.5 -1.5 q1.4 -4.5 -1.6 -6.5 q-0.6 -1.2 -2 -0.6 l-2.6 2.6 l1 1.2 l1.8 -0.8 q-1.2 2 -1.6 4.1z" fill="#1a1a1a" stroke="#555" stroke-width="0.4"/>
        <path d="M30 0 L25 6 Q22 8 23.5 10 L28 6 L34 0z" fill="#4a2e5c"/>
        <path d="M22.6 6.2 q2 -1 3.4 0.4 l-1 2.8 q-1.6 0.6 -2.8 -0.6z" fill="${SKIN}"/>
        <path d="M23 9 v3 M24.2 9.2 v3 M25 8.6 l0.6 2.4" stroke="${SKIN}" stroke-width="0.8" stroke-linecap="round"/>
        <circle cx="22" cy="12" r="0.5" fill="${SKIN}"/>
    `),
    // 木の柵に囲まれた放牧場の馬たち
    paddock: svg(`
        ${sky()}
        ${cloud(9, 5, 0.9)}
        <path d="M0 17 q14 -4 26 0 q12 -3 22 0 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        ${horse(34, { color: GREY_HORSE, mane: '#8a837a', scale: 0.72, flip: true })}
        ${horse(15, { color: BAY })}
        ${fence(19, [2, 14, 26, 38, 46])}
    `),
    // 光の差す森の中の小さな祠と小鹿
    sanctuary: svg(`
        ${sky('#e6f0d8')}
        ${pine(3, 2, 22)}${pine(10, 6, 17, { leaf: '#3d7a4c' })}${pine(45, 1, 23)}${pine(38, 7, 16, { leaf: '#3d7a4c' })}
        <path d="M18 0 L13 27 H35 L30 0z" fill="#fff6b0" opacity="0.45"/>
        <path d="M21 0 L18 27 H30 L27 0z" fill="#fff6b0" opacity="0.5"/>
        ${ground(GRASS)}
        <rect x="18" y="14" width="12" height="13" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M16 14.5 L24 8 L32 14.5z" fill="#6b8e5a" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M21.5 27 v-6 a2.5 2.5 0 0 1 5 0 v6z" fill="#fff6b0"/>
        <path d="M24 9.5 v-3 M22.6 7.6 h2.8" stroke="${GOLD}" stroke-width="0.8"/>
        ${place(35, 0.6, true, `
            <path d="M33 21 v6 M34.5 21 v6 M37.5 21 v6 M39 21 v6" stroke="#b07a48" stroke-width="1.4"/>
            <ellipse cx="36" cy="20.5" rx="4" ry="2.4" fill="#b07a48"/>
            <path d="M38.5 19.5 L40.5 14.5 L42 15.2 L40.8 20.5z" fill="#b07a48"/>
            <ellipse cx="42" cy="15" rx="2" ry="1.3" fill="#b07a48"/>
            <path d="M40.6 13.8 l-0.8 -1.6 l1.4 0.6z" fill="#b07a48"/>
            <circle cx="36" cy="19.5" r="0.4" fill="#fff"/><circle cx="34.6" cy="20.6" r="0.4" fill="#fff"/><circle cx="37.2" cy="21" r="0.4" fill="#fff"/>
            <circle cx="42.3" cy="14.6" r="0.35" fill="${INK}"/>`)}
    `),

    // ===== コスト6 =====
    // 鎧と飾り布をまとった軍馬
    destrier: svg(`
        ${sky()}
        ${ground(GRASS)}
        ${horse(20, { color: '#3e2e28', mane: INK, scale: 1.15, extra: `
            <path d="M14.5 15.5 Q20 13.6 25.8 15.5 L26.8 21.4 L24.4 23.8 L22.4 21.6 L20.2 24 L18 21.6 L15.8 24 L13.6 21.4z" fill="${RED}" stroke="${GOLD}" stroke-width="0.5"/>
            <circle cx="20" cy="18.5" r="1.6" fill="${GOLD}"/>
            <path d="M26.2 9.2 L28 7.6 L32.4 11.4 L31.4 12.6 L28.4 11.9z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
            <path d="M23.2 15.5 L26.2 8.6 L28.8 9.6 L27.2 16z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
            <path d="M24.4 13 l3 1 M25.4 10.8 l3 1" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
            <path d="M27 7.6 q-1 -4 2 -5.6 q-0.4 3 0.6 5z" fill="${RED}"/>
            <circle cx="29" cy="9.9" r="0.45" fill="${INK}"/>` })}
        ${[[4, RED], [44, BLUE]].map(([x, c]) => `<path d="M${x} 27 V3" stroke="${WOOD}" stroke-width="0.8"/><path d="M${x} 3 h${x < 24 ? 5 : -5} l${x < 24 ? -1.5 : 1.5} 2 l${x < 24 ? 1.5 : -1.5} 2 h${x < 24 ? -5 : 5}z" fill="${c}"/>`).join('')}
    `),
    // 杖をついて道しるべの前を行く旅人
    wayfarer: svg(`
        ${sky()}
        ${cloud(36, 5)}
        <path d="M0 18 q12 -4 24 -1 q12 -4 24 0 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        <path d="M26 17 Q20 22 24 27 H34 Q26 22 28 17z" fill="#d9c9a0"/>
        <path d="M38 27 V8" stroke="${WOOD}" stroke-width="1.3"/>
        <path d="M33 8 h10 l2 1.6 l-2 1.6 h-10z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M43 13 h-10 l-2 1.6 l2 1.6 h10z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${person(13, '#7a5a3a', { hair: brimHat(13, '#4a6b3a') })}
        <path d="M9.5 15 q-3 4 -2.5 9 h3z" fill="#5d7a4a"/>
        <path d="M10 14.5 l-3 -2" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        ${sack(7.5, 13.5, 4, 3, '#c9b07f')}
        ${arm(16, 16, 19, 16)}
        <path d="M19.5 27 V7" stroke="${WOOD}" stroke-width="1.1" stroke-linecap="round"/>
    `),

    // ===== コスト7 =====
    // 縞模様のテントと集まった動物たち
    animal_fair: svg(`
        ${sky()}
        <path d="M0 3 Q12 8 24 3 Q36 8 48 3" stroke="${INK}" stroke-width="0.4" fill="none"/>
        ${[[4, RED], [10, GOLD], [16, BLUE], [30, RED], [36, GOLD], [42, BLUE]].map(([x, c]) => {
            const y = 3 + Math.sin(((x % 24) / 24) * Math.PI) * 3.6;
            return `<path d="M${x - 1.2} ${y} h2.4 l-1.2 2.4z" fill="${c}"/>`;
        }).join('')}
        <path d="M10 18 L24 6 L38 18z" fill="${RED}"/>
        <path d="M24 6 L14.7 18 M24 6 L19.3 18 M24 6 L28.7 18 M24 6 L33.3 18" stroke="#fff" stroke-width="1.6"/>
        <rect x="12" y="18" width="24" height="9" fill="#fff" stroke="${RED_DARK}" stroke-width="0.5"/>
        <path d="M16 18 v9 M20 18 v9 M28 18 v9 M32 18 v9" stroke="${RED}" stroke-width="1.6"/>
        <path d="M21.5 27 L24 19 L26.5 27z" fill="#3a1a10"/>
        <path d="M24 6 V2" stroke="${WOOD_EDGE}" stroke-width="0.6"/><path d="M24 2 h3 l-1 1 l1 1 h-3z" fill="${GOLD}"/>
        ${ground(GRASS)}
        ${horse(5, { color: CHESTNUT, scale: 0.55 })}
        ${goat(19, { scale: 0.6 })}
        ${sheep(30, { scale: 0.62 })}
        ${dog(41, { scale: 0.6, flip: true, color: '#8a5a2e', chest: '#f5e6c8' })}
    `),

    // ===== サプライ外 =====
    // 草原に立つ栗毛の馬
    horse: svg(`
        ${sky()}
        ${cloud(9, 6)}${cloud(40, 4, 0.8)}
        <path d="M0 20 q14 -5 26 -1 q12 -4 22 0 V27 H0z" fill="${GRASS_FAR}"/>
        ${ground(GRASS)}
        ${horse(19, { color: CHESTNUT, mane: BAY_DARK, scale: 1.15 })}
    `),
};
