/** 拡張「略奪」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground } from './card-art-helpers.js';

// 海・船・宝の色合い（海の青・砂の黄・木の茶・金）
const SKY = '#cfe7f7';
const SKY_DUSK = '#f3d9b5';
const SKY_NIGHT = '#24304f';
const SEA = '#3f8fc4';
const SEA_DARK = '#2a6a99';
const SEA_DEEP = '#1f4f78';
const FOAM = '#e8f4fb';
const SAND = '#e6c88e';
const SAND_DARK = '#c9a865';
const GRASS = '#86bf5e';
const GRASS_DARK = '#5b9440';
const WOOD = '#8d5a2b';
const WOOD_LIGHT = '#b9824a';
const WOOD_EDGE = '#5d3a1a';
const STONE = '#b9b3a6';
const STONE_LIGHT = '#d6d0c2';
const STONE_EDGE = '#7a7468';
const STEEL = '#c3ccd3';
const STEEL_EDGE = '#6b7b86';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';
const SILVER = '#d5dbe2';
const SILVER_EDGE = '#7e858f';
const RED = '#c0392b';
const RED_DARK = '#8e1f1f';
const BLUE = '#2f5d9e';
const GREEN = '#2e8b57';
const PURPLE = '#6c3f8f';
const PURPLE_LIGHT = '#b48ad6';
const GEM_RED = '#e74c5b';
const GEM_GREEN = '#3cb371';
const GEM_BLUE = '#4a90e2';
const CANVAS = '#efe3c6';
const PAPER = '#f6ead0';
const PLASTER = '#f1e3c6';
const SKIN = '#f0c8a0';
const SKIN_DARK = '#c99a6e';
const INK = '#3e2f2a';
const FIRE = '#ff9a3c';
const FIRE_CORE = '#ffe08a';

// 空・室内の壁
const sky = (color = SKY) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;
const wall = (color = CANVAS) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;
const floor = () => `${ground(WOOD_LIGHT)}<path d="M0 27 h48" stroke="${WOOD_EDGE}" stroke-width="0.6"/>`;

// 海（y から下）
const sea = (y = 22, color = SEA) => `
    <path d="M0 ${y} q4 -1.6 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V32 H0z" fill="${color}"/>
    <path d="M3 ${y + 3} q2 -1 4 0 M19 ${y + 5} q2 -1 4 0 M35 ${y + 3} q2 -1 4 0" stroke="${FOAM}" stroke-width="0.5" fill="none"/>`;

// 白い雲
const cloud = (x, y, s = 1) => `
    <g fill="#fff" opacity="0.9">
        <ellipse cx="${x}" cy="${y}" rx="${4 * s}" ry="${1.6 * s}"/>
        <circle cx="${x - 1.2 * s}" cy="${y - 1 * s}" r="${1.6 * s}"/>
        <circle cx="${x + 1.2 * s}" cy="${y - 1.2 * s}" r="${2 * s}"/>
    </g>`;

const stars = (points) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.5" fill="#fff6c9"/>`).join('');

// 光のきらめき
const sparkle = (x, y, r = 2, color = '#fff6c9') =>
    `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}z" fill="${color}"/>`;

// 立っている人（x は体の中心）
const person = (x, cloth, { skin = SKIN, hair = '', scale = 1 } = {}) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 2} 23 v4 M${x + 2} 23 v4" stroke="${INK}" stroke-width="1.6"/>
        <path d="M${x - 4} 23 L${x - 3} 14.5 h6 L${x + 4} 23 z" fill="${cloth}"/>
        <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
        ${hair}
    </g>`;

// 長い衣の人
const robed = (x, cloth, { skin = SKIN, hair = '' } = {}) => `
    <path d="M${x - 5} 27 L${x - 3} 14.5 h6 L${x + 5} 27 z" fill="${cloth}"/>
    <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
    ${hair}`;

const hairCap = (x, color) => `<path d="M${x - 3} 10.5 q3 -5 6 0" fill="${color}"/>`;

// 海賊の三角帽
const tricorn = (x, color = '#1f1f1f') => `
    <path d="M${x - 5} 9 q5 -2 10 0 q-1.5 -4 -5 -4.4 q-3.5 0.4 -5 4.4z" fill="${color}"/>
    <path d="M${x - 1} 6.6 l1 -1 l1 1 l-1 1z" fill="#fff"/>`;

// バンダナ
const bandana = (x, color = RED) => `
    <path d="M${x - 3.2} 10 q3.2 -4.6 6.4 0z" fill="${color}"/>
    <path d="M${x + 3} 9.4 l2 1.4 l-1.4 0.6z" fill="${color}"/>`;

// 眼帯
const eyepatch = (x) => `<path d="M${x - 3} 9.4 L${x + 3} 11.6" stroke="#111" stroke-width="0.5"/><circle cx="${x + 1.1}" cy="11" r="0.9" fill="#111"/>`;

const crown = (x, y, w = 6, color = GOLD) =>
    `<path d="M${x - w / 2} ${y} v-${w * 0.45} l${w * 0.25} ${w * 0.25} l${w * 0.25} -${w * 0.35} l${w * 0.25} ${w * 0.35} l${w * 0.25} -${w * 0.25} v${w * 0.45}z" fill="${color}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>`;

const arm = (x1, y1, x2, y2, color = SKIN) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`;

// 硬貨・宝石
const coin = (x, y, r = 2.2, fill = GOLD, edge = GOLD_EDGE) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${edge}" stroke-width="0.5"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="${edge}" stroke-width="0.35"/>`;
const gem = (x, y, s = 1, color = GEM_RED) => `
    <path d="M${x - 2 * s} ${y - 1 * s} l${s} -${1.2 * s} h${2 * s} l${s} ${1.2 * s} l-${2 * s} ${2.6 * s}z" fill="${color}" stroke="${INK}" stroke-width="0.3"/>
    <path d="M${x - 2 * s} ${y - 1 * s} h${4 * s}" stroke="#fff" stroke-width="0.3" opacity="0.7"/>`;

// 宝箱（x は中心、y は底）
const chest = (x, y, w = 14, h = 9, open = false) => `
    <rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    ${open
        ? `<path d="M${x - w / 2} ${y - h} l1 -4 h${w - 2} l1 4z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
           ${coin(x - 3, y - h - 0.6, 1.6)}${coin(x + 1, y - h - 1, 1.6)}${coin(x + 4, y - h - 0.4, 1.4)}`
        : `<path d="M${x - w / 2} ${y - h} q${w / 2} -${h * 0.6} ${w} 0z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>`}
    <path d="M${x - w / 2} ${y - h + 2} h${w}" stroke="${GOLD_EDGE}" stroke-width="0.7"/>
    <rect x="${x - 1}" y="${y - h + 1}" width="2" height="3" fill="${GOLD}"/>`;

// 帆船（x は船体の中心）
const ship = (x, { sail = '#fdfefe', hull = WOOD, scale = 1, flagColor = '', masts = 1, oars = false } = {}) => `
    <g transform="translate(${x} 26) scale(${scale}) translate(${-x} -26)">
        <path d="M${x - 11} 21 h22 l-3 5 h-16z" fill="${hull}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        ${Array.from({ length: masts }, (_, i) => {
            const mx = x + (i - (masts - 1) / 2) * 9;
            return `<line x1="${mx}" y1="21" x2="${mx}" y2="5" stroke="${WOOD_EDGE}" stroke-width="0.9"/>
                <path d="M${mx - 5} 7 q5 -1.4 10 0 v9 q-5 -1.4 -10 0z" fill="${sail}" stroke="#c9c1b0" stroke-width="0.4"/>`;
        }).join('')}
        ${flagColor ? `<path d="M${x} 5 l4 1.2 l-4 1.2z" fill="${flagColor}"/>` : ''}
        ${oars ? [-8, -5, -2, 1, 4, 7].map(dx => `<path d="M${x + dx} 24 l-2 4" stroke="${WOOD_EDGE}" stroke-width="0.6"/>`).join('') : ''}
    </g>`;

// 骸骨の旗の印
const skull = (x, y, s = 1, color = '#fff') => `
    <circle cx="${x}" cy="${y}" r="${1.6 * s}" fill="${color}"/>
    <rect x="${x - 0.9 * s}" y="${y + 1 * s}" width="${1.8 * s}" height="${1 * s}" fill="${color}"/>
    <circle cx="${x - 0.6 * s}" cy="${y - 0.1 * s}" r="${0.4 * s}" fill="#111"/>
    <circle cx="${x + 0.6 * s}" cy="${y - 0.1 * s}" r="${0.4 * s}" fill="#111"/>`;

// 剣（柄の位置 x,y から上へ、angle で傾ける）
const sword = (x, y, angle = 0, len = 12) => `
    <g transform="rotate(${angle} ${x} ${y})">
        <path d="M${x - 0.8} ${y - 2} v-${len} l0.8 -1.6 l0.8 1.6 v${len}z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.3"/>
        <rect x="${x - 2.6}" y="${y - 2.4}" width="5.2" height="1" fill="${GOLD_EDGE}"/>
        <rect x="${x - 0.6}" y="${y - 1.4}" width="1.2" height="3" fill="${WOOD_EDGE}"/>
    </g>`;

// 曲刀（カトラス）
const cutlass = (x, y, angle = 0) => `
    <g transform="rotate(${angle} ${x} ${y})">
        <path d="M${x - 0.8} ${y - 2} q-1 -6 2 -11 q0.6 5 -0.4 11z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.3"/>
        <path d="M${x - 2.4} ${y - 2} h4" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <rect x="${x - 0.6}" y="${y - 1.4}" width="1.2" height="3" fill="${WOOD_EDGE}"/>
    </g>`;

// 袋
const sack = (x, y, w, h, color = '#d7c29a', edge = WOOD_EDGE) => `
    <path d="M${x - w / 2} ${y} q-1 -${h * 0.7} ${w * 0.25} -${h * 0.85} l${w * 0.1} -${h * 0.15} h${w * 0.3} l${w * 0.1} ${h * 0.15} q${w * 0.35} ${h * 0.15} ${w * 0.25} ${h * 0.85}z" fill="${color}" stroke="${edge}" stroke-width="0.5"/>`;

// 炎
const flame = (x, y, s = 1) => `
    <path d="M${x} ${y} q-${3 * s} -${2 * s} -${1 * s} -${6 * s} q${0.5 * s} ${2 * s} ${1.5 * s} ${1.5 * s} q0 -${2 * s} ${1.5 * s} -${3.5 * s} q${0.5 * s} ${3 * s} ${1.5 * s} ${4.5 * s} q${1 * s} ${2.5 * s} -${2.5 * s} ${3.5 * s}z" fill="${FIRE}"/>
    <path d="M${x} ${y} q-${1.4 * s} -${1 * s} -${0.4 * s} -${3 * s} q${0.6 * s} ${1 * s} ${1 * s} ${0.6 * s} q${0.8 * s} ${1.6 * s} -${0.6 * s} ${2.4 * s}z" fill="${FIRE_CORE}"/>`;

// 島（ヤシの木つき）
const island = (x, y, w = 20) => `
    <path d="M${x - w / 2} ${y} q${w / 2} -6 ${w} 0z" fill="${SAND}"/>
    <path d="M${x} ${y - 3} q0.6 -5 -1 -9" stroke="${WOOD}" stroke-width="0.9" fill="none"/>
    <path d="M${x - 1} ${y - 12} q-4 -1 -6 1.4 M${x - 1} ${y - 12} q3 -2.6 6 -0.6 M${x - 1} ${y - 12} q-2 1.6 -3 4 M${x - 1} ${y - 12} q2 1 3 4" stroke="${GREEN}" stroke-width="1" fill="none"/>`;

// 巻物
const scroll = (x, y, w = 14, h = 9, color = PAPER) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <rect x="${x - 1}" y="${y - 0.8}" width="${w + 2}" height="1.6" rx="0.8" fill="#d9c49a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
    <rect x="${x - 1}" y="${y + h - 0.8}" width="${w + 2}" height="1.6" rx="0.8" fill="#d9c49a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>`;

// 家
const house = (x, w, h, { wallColor = PLASTER, roof = '#b5523b', door = true } = {}) => `
    <rect x="${x}" y="${27 - h}" width="${w}" height="${h}" fill="${wallColor}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    <path d="M${x - 1.5} ${27 - h} L${x + w / 2} ${27 - h - w * 0.45} L${x + w + 1.5} ${27 - h}z" fill="${roof}"/>
    ${door ? `<rect x="${x + w / 2 - 1.4}" y="23" width="2.8" height="4" fill="${WOOD}"/>` : ''}`;

// 木の桟橋
const pier = (x1, x2, y = 21) => `
    <rect x="${x1}" y="${y}" width="${x2 - x1}" height="2.4" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
    ${Array.from({ length: Math.floor((x2 - x1) / 6) + 1 }, (_, i) => `<path d="M${x1 + 1 + i * 6} ${y + 2.4} v8" stroke="${WOOD_EDGE}" stroke-width="1.2"/>`).join('')}`;

export const PLUNDER_ART = {
    // ===== コスト2 =====
    // 檻：鉄格子の檻に閉じ込めた宝
    cage: svg(`
        ${wall('#3e3530')}
        ${ground('#2c2420')}
        <rect x="12" y="6" width="24" height="21" fill="#4a3f38"/>
        ${chest(24, 26, 12, 7)}
        ${[13, 17, 21, 25, 29, 33, 35].map(x => `<path d="M${x} 6 V27" stroke="${STEEL_EDGE}" stroke-width="1"/>`).join('')}
        <rect x="11" y="4.6" width="26" height="2" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <rect x="11" y="25.6" width="26" height="1.6" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <circle cx="24" cy="3" r="1.6" fill="none" stroke="${STEEL}" stroke-width="0.8"/>
    `),
    // 洞窟：海辺の岩の洞窟にしまった荷
    grotto: svg(`
        ${sky()}
        ${sea(24)}
        <path d="M2 26 Q4 6 24 4 Q44 6 46 26z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M12 26 Q14 12 24 11 Q34 12 36 26z" fill="#2c2b30"/>
        ${sack(20, 26, 6, 6)}${chest(28, 26, 7, 5)}
        <path d="M6 14 l3 -2 M40 12 l-3 -1.6 M8 20 l2 0" stroke="${STONE_EDGE}" stroke-width="0.6"/>
    `),
    // 宝石の卵：金の台に乗った宝石の卵
    jewelled_egg: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2b4a5c"/>
        <rect x="0" y="24" width="48" height="8" fill="#1f3644"/>
        <path d="M18 27 h12 l-2 -4 h-8z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <ellipse cx="24" cy="15" rx="6.4" ry="8.4" fill="#e8d3f5" stroke="${PURPLE}" stroke-width="0.6"/>
        <path d="M18 14 q6 3 12 0 M18.4 18 q5.6 3 11.2 0" stroke="${GOLD}" stroke-width="0.8" fill="none"/>
        ${gem(24, 10.6, 0.8, GEM_RED)}${gem(20.6, 16.6, 0.6, GEM_GREEN)}${gem(27.4, 16.6, 0.6, GEM_BLUE)}
        ${sparkle(33, 8, 1.6)}${sparkle(14, 12, 1)}
    `),
    // 捜索：望遠鏡で水平線を探す見張り
    search: svg(`
        ${sky()}
        ${cloud(36, 6)}
        ${sea(21)}
        ${ship(38, { scale: 0.35 })}
        ${person(14, BLUE, { hair: bandana(14, RED) })}
        ${arm(17, 14.6, 22, 11)}
        <path d="M17 12.6 L28 9" stroke="${GOLD_EDGE}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M24 10 L29 8.4" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>
    `),
    // シャーマン：煙を立てる、骨の飾りの呪術師
    shaman: svg(`
        ${sky(SKY_DUSK)}
        ${ground(SAND_DARK)}
        ${robed(16, '#7a5a3a', { skin: SKIN_DARK, hair: `<path d="M13 10 q3 -6 6 0" fill="#2b1a10"/><path d="M12 8 l2 2 M20 8 l-2 2 M16 5 v2.4" stroke="#ece6d6" stroke-width="0.8"/>` })}
        <path d="M13 16 q3 2 6 0" stroke="#ece6d6" stroke-width="0.8" fill="none"/>
        ${arm(19, 17, 25, 15, SKIN_DARK)}
        <path d="M28 27 l2 -4 h4 l2 4z" fill="${WOOD_EDGE}"/>
        ${flame(32, 23, 0.8)}
        <path d="M32 16 q-3 -3 0 -6 q3 -3 0 -6" stroke="#c9c1b0" stroke-width="1" fill="none" opacity="0.8"/>
    `),

    // ===== コスト3 =====
    // 人里離れた祠：森の奥の小さな祠
    secluded_shrine: svg(`
        ${sky('#d9ebd0')}
        ${ground(GRASS_DARK)}
        ${[5, 11, 37, 43].map((x, i) => `<rect x="${x - 1}" y="10" width="2" height="17" fill="${WOOD_EDGE}"/><circle cx="${x}" cy="${8 + (i % 2)}" r="5" fill="#3f7a3a"/>`).join('')}
        <path d="M17 13 L24 7 L31 13z" fill="${RED_DARK}"/>
        <rect x="18.6" y="13" width="10.8" height="12" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <rect x="21.6" y="16" width="4.8" height="9" fill="#3a2a1a"/>
        <circle cx="24" cy="19" r="1.2" fill="${GOLD}"/>
        <rect x="16" y="25" width="16" height="2" fill="${STONE}"/>
    `),
    // セイレーン：岩の上で歌う人魚
    siren: svg(`
        ${sky('#c9d9ec')}
        ${sea(20, SEA_DARK)}
        <path d="M10 26 Q14 14 26 15 Q34 16 36 26z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M19 16 q-2 5 2 8 q4 2 9 -1 l3 -3 l-1 4 l3 -1 l-3 3 q-7 3 -13 0 q-3 -4 0 -10z" fill="#3cb39b"/>
        <path d="M18.6 16.4 L20 10.6 h4 L25 16.4z" fill="${SKIN}"/>
        <circle cx="22" cy="8" r="2.6" fill="${SKIN}"/>
        <path d="M19.4 8 q0 -4 2.6 -4 q3.4 0 3.4 4 q1 4 -1 8 q-0.2 -5 -1 -6 q-1.4 1 -3 0 q-1 4 -2 7 q-0.4 -4 1 -9z" fill="#e8a33c"/>
        <path d="M29 6 q1 -1.6 2.4 0 M31 4 q1.4 -2 3 0 M33 7 q1 -1.4 2 0" stroke="${INK}" stroke-width="0.5" fill="none"/>
    `),
    // 密航者：樽から顔をのぞかせる密航者
    stowaway: svg(`
        ${wall('#6b4a32')}
        ${floor()}
        <path d="M0 6 h48 M0 14 h48 M0 22 h48" stroke="#5a3d28" stroke-width="0.6"/>
        <ellipse cx="34" cy="20" rx="6" ry="7" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M28.4 17 h11.2 M28.4 23 h11.2" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <ellipse cx="18" cy="19" rx="7" ry="8" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M11.4 15 h13.2 M11.4 23 h13.2" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <ellipse cx="18" cy="11.4" rx="6" ry="1.6" fill="#5a3d28"/>
        <circle cx="18" cy="10" r="2.6" fill="${SKIN}"/>
        <path d="M15.4 9.6 q2.6 -4 5.2 0" fill="#3a2a1a"/>
        <circle cx="17" cy="10.2" r="0.4" fill="${INK}"/><circle cx="19" cy="10.2" r="0.4" fill="${INK}"/>
        <path d="M14 11.4 l-2 -1 M22 11.4 l2 -1" stroke="${SKIN}" stroke-width="1" stroke-linecap="round"/>
    `),
    // 監督：鞭を手に甲板を見張る監督
    taskmaster: svg(`
        ${sky()}
        <rect x="0" y="20" width="48" height="12" fill="${WOOD_LIGHT}"/>
        <path d="M0 20 h48 M0 24 h48 M0 28 h48" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${person(34, RED_DARK, { hair: tricorn(34) })}
        ${arm(31, 15, 26, 18)}
        <path d="M26 18 q-6 -2 -8 -8 q4 6 -2 9" stroke="${WOOD_EDGE}" stroke-width="0.6" fill="none"/>
        ${person(10, '#8a7a5a', { hair: bandana(10, BLUE), scale: 0.8 })}
        <rect x="13" y="16" width="5" height="4" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
    `),

    // ===== コスト4 =====
    // 豊穣：あふれる果物と硬貨の角
    abundance: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#f3e2c0"/>
        ${floor()}
        <path d="M8 24 Q4 10 16 6 Q12 14 22 22z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <circle cx="25" cy="20" r="3" fill="${RED}"/><circle cx="30" cy="22" r="2.6" fill="#8bc34a"/>
        <circle cx="27" cy="24.6" r="2.4" fill="${PURPLE}"/><circle cx="33.6" cy="24.6" r="2" fill="#ff9800"/>
        ${coin(37, 25, 1.8)}${coin(41, 26, 1.6)}${coin(23, 25.4, 1.4)}
        <path d="M24 17 q1 -2 2 -1.6" stroke="${GREEN}" stroke-width="0.6" fill="none"/>
    `),
    // 給仕：盆を運ぶ見習い船員
    cabin_boy: svg(`
        ${wall('#8a6340')}
        ${floor()}
        <circle cx="38" cy="10" r="4" fill="${SKY}" stroke="${WOOD_EDGE}" stroke-width="1"/>
        <path d="M34 10 h8 M38 6 v8" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        ${person(20, '#e8e1d0', { hair: hairCap(20, '#c98a3a'), scale: 0.9 })}
        <path d="M17 16.6 h6" stroke="${BLUE}" stroke-width="0.8"/>
        ${arm(22, 17, 27, 15)}
        <ellipse cx="29" cy="14.6" rx="5" ry="1" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <rect x="27" y="11.6" width="2.4" height="3" fill="#fff" stroke="${STEEL_EDGE}" stroke-width="0.3"/>
        <circle cx="31.4" cy="13.4" r="1.2" fill="${RED}"/>
    `),
    // るつぼ：炎の上で金を溶かするつぼ
    crucible: svg(`
        ${wall('#3b2e2a')}
        ${ground('#2a201c')}
        <path d="M14 27 l4 -6 h12 l4 6z" fill="#4a3a32"/>
        ${flame(20, 24, 1)}${flame(28, 24, 1)}${flame(24, 25, 1.1)}
        <path d="M15 8 h18 l-3 12 h-12z" fill="#6c737d" stroke="#4a4f57" stroke-width="0.6"/>
        <ellipse cx="24" cy="8.4" rx="9" ry="2" fill="#ff8c1a"/>
        <ellipse cx="24" cy="8.4" rx="6" ry="1.2" fill="${FIRE_CORE}"/>
        <path d="M33 8 l4 -3" stroke="#6c737d" stroke-width="1.4"/>
        ${coin(40, 14, 1.6)}${coin(8, 16, 1.4)}
    `),
    // 旗艦：旗をなびかせる三本マストの大型船
    flagship: svg(`
        ${sky()}
        ${cloud(9, 6)}
        ${ship(24, { masts: 3, scale: 1.05, flagColor: RED, hull: '#6b3a1a' })}
        ${sea(25)}
        <path d="M30 5 L36 3 L36 7z" fill="${GOLD}"/>
    `),
    // 富の探求者：宝の地図を広げてシャベルを持つ探求者
    fortune_hunter: svg(`
        ${sky()}
        ${ground(SAND)}
        <path d="M30 27 q4 -4 8 0z" fill="${SAND_DARK}"/>
        <path d="M34 20 l2 2 M36 20 l-2 2" stroke="${RED}" stroke-width="0.9"/>
        ${person(16, GREEN, { hair: `<ellipse cx="16" cy="8.8" rx="5" ry="1.1" fill="#8a6a3a"/><path d="M13.4 8.8 q0 -3.4 2.6 -3.4 q2.6 0 2.6 3.4z" fill="#8a6a3a"/>` })}
        ${arm(19, 16, 24, 14)}
        <path d="M24 14 L30 25" stroke="${WOOD}" stroke-width="0.9"/>
        <path d="M29 24 l3 1 l-1 2.6 l-3 -1z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.3"/>
        ${coin(40, 25, 1.6)}${sparkle(42, 20, 1.2)}
    `),
    // ゴンドラ：運河を進む細長い舟と漕ぎ手
    gondola: svg(`
        ${sky(SKY_DUSK)}
        <rect x="0" y="6" width="10" height="16" fill="#e0b48a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <rect x="38" y="4" width="10" height="18" fill="#d99a7a" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M3 10 v3 M6 10 v3 M41 8 v3 M44 8 v3" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        ${sea(21, '#3a8a9a')}
        <path d="M6 22 q18 4 34 -2 l3 -4 l-1 5 q-16 6 -36 2z" fill="#1f1f1f"/>
        ${person(30, '#fff', { hair: `<ellipse cx="30" cy="8.6" rx="3.6" ry="0.8" fill="#e8c66a"/><path d="M28 8.6 q0 -2.4 2 -2.4 q2 0 2 2.4z" fill="#e8c66a"/>`, scale: 0.8 })}
        <path d="M30 22 L28 14" stroke="${RED}" stroke-width="0.6"/>
        <path d="M34 14 L24 30" stroke="${WOOD}" stroke-width="0.8"/>
    `),
    // 港村：桟橋と船の見える港の村
    harbor_village: svg(`
        ${sky()}
        ${cloud(10, 5)}
        <rect x="0" y="16" width="48" height="6" fill="${GRASS}"/>
        ${house(2, 9, 8)}${house(14, 8, 7, { roof: '#c76b3a' })}
        <path d="M0 22 h26 v-2 h-26z" fill="${GRASS}"/>
        ${sea(22)}
        ${pier(22, 40, 20)}
        ${ship(38, { scale: 0.55 })}
    `),
    // 上陸部隊：小舟から浜に上がる兵士たち
    landing_party: svg(`
        ${sky()}
        <path d="M0 22 h48 V27 H0z" fill="${SEA}"/>
        <path d="M18 27 Q30 18 48 20 V32 H0 V27z" fill="${SAND}"/>
        <path d="M2 22 h14 l-2 4 h-10z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${person(7, RED, { hair: tricorn(7), scale: 0.7 })}
        ${person(26, RED, { hair: tricorn(26), scale: 0.85 })}
        ${person(38, BLUE, { hair: bandana(38), scale: 0.85 })}
        ${cutlass(41, 19, 20)}
        <path d="M30 18 l0 -12" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M30 6 l5 1.4 l-5 1.4z" fill="#111"/>
    `),
    // 地図作り：机で羽根ペンを走らせ、海図を描く
    mapmaker: svg(`
        ${wall('#d9c4a0')}
        <path d="M4 30 L8 14 H40 L44 30z" fill="${WOOD}"/>
        <path d="M10 28 L13 16 H35 L38 28z" fill="#e8d6a8" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M14 22 q4 -4 8 -1 q4 3 7 -1 q3 -3 6 0" stroke="${SEA}" stroke-width="0.8" fill="none"/>
        <path d="M17 19 q2 -1.4 3 0 q-1 1.6 -3 0z M30 24 q2 -1 3 0.4 q-1.4 1.4 -3 -0.4z" fill="${GRASS_DARK}"/>
        <path d="M34 18 l1.6 0 l-0.8 2z" fill="${RED}"/>
        <path d="M38 25 L44 8 q2 2 0 7z" fill="#fff" stroke="#c9c1b0" stroke-width="0.4"/>
        <circle cx="12" cy="10" r="3" fill="${PAPER}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M12 7.4 l0.6 2.6 l-0.6 2.6 l-0.6 -2.6z" fill="${RED}"/>
    `),
    // 島流し：小さな島に取り残された人
    maroon: svg(`
        ${sky()}
        ${cloud(36, 5)}
        ${sea(21)}
        ${island(22, 25, 26)}
        ${person(16, '#c9b48a', { hair: hairCap(16, '#3a2a1a'), scale: 0.7 })}
        <path d="M14 19 l-2 -3" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
        ${ship(42, { scale: 0.3 })}
    `),
    // ロープ：巻いたロープと結び目
    rope: svg(`
        ${wall('#5d7a8a')}
        ${floor()}
        ${[0, 1, 2, 3].map(i => `<ellipse cx="20" cy="${24 - i * 3}" rx="${11 - i}" ry="3" fill="none" stroke="#c8a165" stroke-width="2"/>`).join('')}
        ${[0, 1, 2, 3].map(i => `<ellipse cx="20" cy="${24 - i * 3}" rx="${11 - i}" ry="3" fill="none" stroke="${WOOD_EDGE}" stroke-width="0.3" stroke-dasharray="1 1"/>`).join('')}
        <path d="M30 14 q8 -6 10 2 q2 6 -4 8 q-4 1 -2 -4" stroke="#c8a165" stroke-width="2" fill="none"/>
        <path d="M40 8 V2" stroke="#c8a165" stroke-width="2"/>
    `),
    // 沼地の小屋：沼の上に建つ高床の小屋
    swamp_shacks: svg(`
        ${sky('#cfd9c0')}
        <rect x="0" y="22" width="48" height="10" fill="#5a6e4a"/>
        <path d="M0 24 q6 -1 12 0 t12 0 t12 0 t12 0" stroke="#7a8e5a" stroke-width="0.6" fill="none"/>
        ${[[6, 12], [28, 14]].map(([x, w]) => `
            <path d="M${x + 1} 22 v6 M${x + w - 1} 22 v6" stroke="${WOOD_EDGE}" stroke-width="1"/>
            <rect x="${x}" y="13" width="${w}" height="9" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
            <path d="M${x - 1} 13 L${x + w / 2} 8 L${x + w + 1} 13z" fill="#8a7a4a"/>
            <rect x="${x + w / 2 - 1.2}" y="16" width="2.4" height="6" fill="#3a2a1a"/>`).join('')}
        <path d="M18 18 h10" stroke="${WOOD}" stroke-width="1"/>
        <path d="M2 22 q0 -4 1 -6 M44 22 q1 -4 0 -7 M45 22 q-1 -3 1 -5" stroke="${GRASS_DARK}" stroke-width="0.8" fill="none"/>
    `),
    // 工具：工具箱に並んだハンマー・のこぎり・ペンチ
    tools: svg(`
        ${wall('#d7c7a8')}
        ${floor()}
        <rect x="8" y="18" width="32" height="9" fill="${RED_DARK}" stroke="${INK}" stroke-width="0.5"/>
        <path d="M18 18 q6 -6 12 0" stroke="${STEEL_EDGE}" stroke-width="1.2" fill="none"/>
        <path d="M12 18 L14 6" stroke="${WOOD}" stroke-width="1.4"/>
        <rect x="10.6" y="4" width="7" height="3" fill="${STEEL_EDGE}" transform="rotate(10 14 5.5)"/>
        <path d="M33 18 L37 6 l2 0.6 l-3.4 11.4z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.3"/>
        <path d="M24 18 L23 9 M26 18 L27 9" stroke="#6c737d" stroke-width="1"/>
        <circle cx="25" cy="9" r="1.4" fill="none" stroke="#6c737d" stroke-width="0.8"/>
    `),

    // ===== コスト5 =====
    // 埋蔵金：砂浜に掘り出した宝箱
    buried_treasure: svg(`
        ${sky()}
        ${sea(18)}
        <path d="M0 22 Q24 16 48 22 V32 H0z" fill="${SAND}"/>
        <ellipse cx="24" cy="27" rx="12" ry="3" fill="${SAND_DARK}"/>
        ${chest(24, 28, 14, 8, true)}
        <path d="M38 27 L42 14" stroke="${WOOD}" stroke-width="0.9"/>
        <path d="M41 14 l3 -1 l0.4 3 l-3 0.6z" fill="${STEEL}"/>
        ${sparkle(14, 16, 1.4)}${sparkle(34, 15, 1)}
    `),
    // 乗組員：甲板に並ぶ船乗りたち
    crew: svg(`
        ${sky()}
        <rect x="0" y="20" width="48" height="12" fill="${WOOD_LIGHT}"/>
        <path d="M0 20 h48" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M24 20 V2" stroke="${WOOD_EDGE}" stroke-width="1"/>
        <path d="M24 4 l-10 2 l10 6z" fill="#fdfefe" stroke="#c9c1b0" stroke-width="0.3"/>
        ${person(9, '#e8e1d0', { hair: bandana(9, RED), scale: 0.85 })}
        ${person(19, BLUE, { hair: hairCap(19, '#c98a3a'), scale: 0.9 })}
        ${person(31, '#e8e1d0', { hair: bandana(31, GREEN), scale: 0.9 })}
        ${person(41, RED_DARK, { hair: tricorn(41), scale: 0.85 })}
        <path d="M6.6 17 h4.8 M28.6 17 h4.8" stroke="${BLUE}" stroke-width="0.6"/>
    `),
    // 悪漢：短剣をくわえた眼帯の海賊
    cutthroat: svg(`
        ${sky('#9fb2c8')}
        <rect x="0" y="22" width="48" height="10" fill="${WOOD}"/>
        ${person(22, '#2b2b2b', { hair: `${bandana(22, RED_DARK)}${eyepatch(22)}`, scale: 1.1 })}
        <path d="M18 13.6 h9" stroke="${STEEL}" stroke-width="1"/>
        <path d="M26 13.2 h2.4" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        ${arm(25, 17, 31, 13)}
        ${cutlass(31, 14, 30)}
        <path d="M16 20 q6 3 12 0" stroke="${GOLD}" stroke-width="0.6" fill="none"/>
    `),
    // 拡大：小さな小屋が大きな屋敷に建て替わる
    enlarge: svg(`
        ${sky()}
        ${ground(GRASS)}
        ${house(4, 8, 6, { door: false })}
        <path d="M15 20 h8 l-2 -2 M23 20 l-2 2" stroke="${INK}" stroke-width="0.9" fill="none" stroke-linecap="round"/>
        <rect x="27" y="12" width="18" height="15" fill="${PLASTER}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M25 12 L36 4 L47 12z" fill="#a8432f"/>
        ${[30, 39].map(x => `<rect x="${x}" y="15" width="3.6" height="3" fill="#85c1e9" stroke="${WOOD_EDGE}" stroke-width="0.4"/>`).join('')}
        <rect x="34.4" y="21" width="3.2" height="6" fill="${WOOD}"/>
        ${sparkle(46, 3, 1.2)}
    `),
    // 小像：台座の上の金の小像
    figurine: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#4a3a5a"/>
        <rect x="0" y="24" width="48" height="8" fill="#3a2a46"/>
        <rect x="17" y="22" width="14" height="5" fill="${STONE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M21 22 l1 -7 h4 l1 7z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <circle cx="24" cy="12.4" r="2.4" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M22 15.6 l-3 -3.6 M26 15.6 l3 -3.6" stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round"/>
        ${gem(24, 17.6, 0.5, GEM_RED)}
        ${sparkle(32, 9, 1.6)}${sparkle(15, 14, 1)}
    `),
    // 一等航海士：舵輪を握る航海士
    first_mate: svg(`
        ${sky()}
        ${cloud(38, 6)}
        <rect x="0" y="20" width="48" height="12" fill="${WOOD_LIGHT}"/>
        <path d="M0 20 h48" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        ${person(16, BLUE, { hair: `<path d="M13 9 h6 l-1 -3 h-4z" fill="#1f2a44"/><rect x="12.4" y="8.4" width="7.2" height="1" fill="#1f2a44"/>` })}
        <path d="M14 16 h4" stroke="${GOLD}" stroke-width="0.6"/>
        <circle cx="30" cy="15" r="6" fill="none" stroke="${WOOD}" stroke-width="1.6"/>
        ${[0, 45, 90, 135].map(a => `<path d="M30 7 V23" stroke="${WOOD}" stroke-width="1" transform="rotate(${a} 30 15)"/>`).join('')}
        <circle cx="30" cy="15" r="1.4" fill="${GOLD_EDGE}"/>
        ${arm(19, 16, 25, 15)}
        <path d="M30 21 V27" stroke="${WOOD_EDGE}" stroke-width="1.6"/>
    `),
    // フリゲート艦：大砲を撃つ軍艦
    frigate: svg(`
        ${sky('#c8d6e0')}
        ${ship(22, { masts: 2, hull: '#3a3a4a', flagColor: BLUE })}
        <rect x="13" y="22" width="18" height="1.6" fill="#f4f1ea"/>
        ${[15, 20, 25, 30].map(x => `<rect x="${x - 0.8}" y="22.2" width="1.6" height="1.2" fill="#111"/>`).join('')}
        ${sea(25)}
        <circle cx="38" cy="20" r="2.6" fill="#fff" opacity="0.85"/>
        <circle cx="41" cy="18.6" r="2" fill="#fff" opacity="0.7"/>
        <circle cx="45" cy="17.6" r="1" fill="#2b2b2b"/>
    `),
    // ロングシップ：竜頭の舳先と櫂を並べた長い船
    longship: svg(`
        ${sky()}
        ${cloud(10, 5)}
        <path d="M6 20 h34 q4 0 6 -6 q1 -3 -1 -4 q1 4 -3 6 l-1 4 l-3 4 h-28 l-4 -4z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M6 20 q-4 -2 -3 -8 q2 -2 3 0 q-2 1 0 4z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <line x1="22" y1="20" x2="22" y2="3" stroke="${WOOD_EDGE}" stroke-width="0.9"/>
        <path d="M14 5 h16 v11 h-16z" fill="${RED}"/>
        <path d="M14 8 h16 M14 11 h16 M14 14 h16" stroke="#fff" stroke-width="0.8"/>
        ${[11, 16, 21, 26, 31].map(x => `<circle cx="${x}" cy="21.4" r="1.4" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/><path d="M${x} 22.6 l-2 6" stroke="${WOOD_EDGE}" stroke-width="0.6"/>`).join('')}
        ${sea(25)}
    `),
    // 鉱山道：トロッコの線路が坑道へ続く道
    mining_road: svg(`
        ${sky('#e4d8c0')}
        <path d="M28 27 Q30 4 48 6 V27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M34 27 v-8 a5 5 0 0 1 10 0 v8z" fill="#2c2b30"/>
        <path d="M33 19 h12 M34 19 v8 M44 19 v8" stroke="${WOOD}" stroke-width="1"/>
        ${ground('#a58b6a')}
        <path d="M0 30 L38 26 M0 32 L38 27.4" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
        ${[4, 12, 20, 28].map(x => `<path d="M${x} ${31 - x * 0.1} v-2" stroke="${WOOD_EDGE}" stroke-width="1"/>`).join('')}
        <path d="M12 22 h12 l-2 5 h-8z" fill="#6c737d" stroke="#4a4f57" stroke-width="0.4"/>
        <circle cx="15" cy="27.4" r="1.2" fill="#2b2b2b"/><circle cx="21" cy="27.4" r="1.2" fill="#2b2b2b"/>
        ${coin(16, 21, 1.4, SILVER, SILVER_EDGE)}${coin(20, 20.6, 1.4)}
    `),
    // ペンダント：鎖に下がった宝石のペンダント
    pendant: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2f3f5a"/>
        <path d="M10 2 q14 20 28 0" stroke="${GOLD}" stroke-width="0.9" fill="none" stroke-dasharray="1.4 0.6"/>
        <circle cx="24" cy="18" r="6" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="24" cy="18" r="4" fill="${GEM_BLUE}" stroke="#1f4f8a" stroke-width="0.5"/>
        <path d="M22 16 q1 -1 2.4 -1" stroke="#fff" stroke-width="0.6" fill="none"/>
        ${[0, 60, 120, 180, 240, 300].map(a => `<circle cx="24" cy="12.6" r="0.6" fill="#fff6c9" transform="rotate(${a} 24 18)"/>`).join('')}
        ${sparkle(34, 12, 1.6)}${sparkle(13, 22, 1)}
    `),
    // つるはし：岩に打ち込んだつるはしと金塊
    pickaxe: svg(`
        ${wall('#6a5a4a')}
        ${ground('#4a3f34')}
        <path d="M4 27 Q8 14 20 15 Q30 16 32 27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M14 22 l3 -2 l2 3z M22 19 l2 1 l-1 2z" fill="${GOLD}"/>
        <g transform="rotate(-30 30 14)">
            <rect x="29" y="8" width="2" height="18" fill="${WOOD}"/>
            <path d="M20 9 q10 -5 20 0 l-1 1.4 q-9 -3.6 -18 0z" fill="#6c737d" stroke="#4a4f57" stroke-width="0.4"/>
        </g>
        ${gem(40, 24, 0.8, GOLD)}
    `),
    // 巡礼者：杖を持って山道を歩く巡礼者
    pilgrim: svg(`
        ${sky()}
        <path d="M18 27 L32 6 L46 27z" fill="#9aa5ad"/>
        <path d="M29 10 L32 6 L35 10 q-3 1.4 -6 0z" fill="#fff"/>
        ${ground(GRASS_DARK)}
        <path d="M0 27 Q14 22 20 26" stroke="${SAND_DARK}" stroke-width="2" fill="none"/>
        ${robed(12, '#8a7a5a', { hair: `<path d="M8.4 12.6 q0 -7 3.6 -7 q3.6 0 3.6 7 l-1 -1 q-0.4 -3.6 -2.6 -3.6 q-2.2 0 -2.6 3.6z" fill="#6a5a3a"/>` })}
        <path d="M17 27 V8" stroke="${WOOD}" stroke-width="1"/>
        <path d="M15.6 9 q1.4 -2 2.8 0 q-1.4 1.6 -2.8 0z" fill="#f4f1ea"/>
        ${arm(15, 16, 17, 15)}
    `),
    // 補給係：帳簿を持って樽と木箱を数える
    quartermaster: svg(`
        ${wall('#c9a87a')}
        ${floor()}
        ${[[30, 18], [38, 18], [34, 10]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="8" fill="#c8a165" stroke="${WOOD_EDGE}" stroke-width="0.5"/><path d="M${x} ${y} l8 8 M${x + 8} ${y} l-8 8" stroke="${WOOD_EDGE}" stroke-width="0.3"/>`).join('')}
        <ellipse cx="24" cy="22" rx="3.6" ry="5" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M20.6 20 h6.8 M20.6 24 h6.8" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        ${person(11, '#4a5a3a', { hair: hairCap(11, '#6a6a6a') })}
        <rect x="13" y="15" width="5" height="6" fill="${PAPER}" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <path d="M14 17 h3 M14 18.6 h3" stroke="#a89878" stroke-width="0.4"/>
    `),
    // 銀鉱山：坑道から運び出される銀の塊
    silver_mine: svg(`
        ${sky('#dcd6c8')}
        <path d="M0 27 Q4 4 24 3 Q44 4 48 27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M14 27 v-10 a10 10 0 0 1 20 0 v10z" fill="#2c2b30"/>
        <path d="M13 17 h22 M14 17 v10 M34 17 v10" stroke="${WOOD}" stroke-width="1.4"/>
        ${ground('#8a7a6a')}
        <path d="M16 23 h16 l-2 4 h-12z" fill="#6c737d"/>
        ${coin(20, 22, 1.8, SILVER, SILVER_EDGE)}${coin(24, 21, 1.8, SILVER, SILVER_EDGE)}${coin(28, 22, 1.8, SILVER, SILVER_EDGE)}
        ${sparkle(24, 14, 1.6, '#fff')}
    `),
    // いたずら者：帽子から呪いを飛ばす道化
    trickster: svg(`
        ${sky('#3b2f52')}
        ${stars([[5, 4], [42, 4], [36, 10]])}
        ${ground('#2c2546')}
        ${person(18, PURPLE, { hair: `<path d="M15 10 l-3 -5 l4 3 l2 -5 l2 5 l4 -3 l-3 5z" fill="${RED}"/><circle cx="12" cy="5" r="0.8" fill="${GOLD}"/><circle cx="24" cy="5" r="0.8" fill="${GOLD}"/><circle cx="18" cy="3" r="0.8" fill="${GOLD}"/>` })}
        ${arm(21, 16, 27, 12)}
        <path d="M28 12 q5 -4 6 2 q1 5 6 4" stroke="${PURPLE_LIGHT}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        ${coin(30, 20, 1.4)}${sparkle(38, 13, 1.4, PURPLE_LIGHT)}
    `),
    // 裕福な村：金の屋根飾りの豊かな村
    wealthy_village: svg(`
        ${sky()}
        ${cloud(40, 5)}
        ${ground(GRASS)}
        ${house(3, 11, 10, { roof: '#c76b3a' })}
        ${house(19, 12, 12, { roof: '#a8432f' })}
        ${house(36, 10, 9)}
        <path d="M25 9 v-4" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="25" cy="4" r="1.2" fill="${GOLD}"/>
        ${coin(15, 25, 1.4)}${coin(34, 25.4, 1.4)}
    `),

    // ===== コスト6・7 =====
    // 分捕り品の袋：硬貨と宝石があふれる袋
    sack_of_loot: svg(`
        ${wall('#8a6340')}
        ${floor()}
        ${sack(22, 27, 18, 18, '#c8a165')}
        <path d="M18 12 q4 2 8 0" stroke="${WOOD_EDGE}" stroke-width="0.8" fill="none"/>
        ${coin(31, 25, 2)}${coin(35, 26.4, 1.6)}${coin(28, 26.6, 1.4)}
        ${gem(38, 24, 0.8, GEM_RED)}${gem(13, 25, 0.7, GEM_GREEN)}
        ${coin(22, 9.4, 1.6)}${sparkle(30, 8, 1.4)}
    `),
    // 王の隠し財宝：王冠と金貨の山
    kings_cache: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3a2a1a"/>
        <path d="M2 30 Q24 10 46 30z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        ${[[12, 26], [18, 22], [26, 20], [34, 23], [40, 27], [22, 26], [30, 27]].map(([x, y]) => coin(x, y, 1.6)).join('')}
        ${crown(24, 15, 12)}
        ${gem(24, 11.4, 0.6, GEM_RED)}
        ${sparkle(10, 10, 1.8)}${sparkle(38, 8, 1.4)}
    `)
};

// 分捕り品（とその山の札）
export const LOOT_ART = {
    // 分捕り品の山：骸骨の旗の下の宝箱
    loot: svg(`
        ${sky(SKY_NIGHT)}
        ${stars([[5, 5], [40, 4], [44, 12], [8, 13]])}
        ${ground(SAND_DARK)}
        <path d="M14 27 V4" stroke="${WOOD_EDGE}" stroke-width="0.9"/>
        <path d="M14 4 h14 v9 h-14z" fill="#111"/>
        ${skull(21, 8, 1.2)}
        ${chest(30, 27, 14, 8, true)}
    `),
    // アンフォラ：ワインを満たした2つの取っ手の壺
    amphora: svg(`
        ${wall('#e8d6b0')}
        ${floor()}
        <path d="M20 5 h8 v3 q6 3 5 10 q-1 6 -5 9 h-8 q-4 -3 -5 -9 q-1 -7 5 -10z" fill="#c8693a" stroke="#7a3a1a" stroke-width="0.6"/>
        <path d="M20 8 q-5 0 -4 5 M28 8 q5 0 4 5" stroke="#7a3a1a" stroke-width="1" fill="none"/>
        <path d="M17 16 h14 M17.4 19 h13.2" stroke="#1f1f1f" stroke-width="0.8"/>
        ${coin(38, 25, 1.6)}${coin(41, 26, 1.4)}
    `),
    // ダブロン金貨：積み上げた大きな金貨
    doubloons: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2a3a4a"/>
        <rect x="0" y="24" width="48" height="8" fill="#1f2c38"/>
        ${[0, 1, 2, 3].map(i => `<ellipse cx="16" cy="${25 - i * 2}" rx="7" ry="2.4" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>`).join('')}
        ${coin(32, 16, 7)}
        <path d="M30 13 l2 6 l2 -6 M29 16 h6" stroke="${GOLD_EDGE}" stroke-width="0.6" fill="none"/>
        ${sparkle(40, 8, 1.8)}
    `),
    // 尽きない杯：金の杯からあふれ続ける硬貨
    endless_chalice: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3a2a46"/>
        <rect x="0" y="25" width="48" height="7" fill="#2a1f34"/>
        <path d="M16 6 h16 q0 10 -8 12 q-8 -2 -8 -12z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M23 18 h2 v5 h-2z M18 23 h12 v2 h-12z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        ${gem(24, 11, 0.7, GEM_RED)}
        ${coin(14, 7, 1.6)}${coin(34, 6, 1.6)}${coin(12, 13, 1.4)}${coin(37, 12, 1.4)}${coin(32, 24, 1.4)}
        <path d="M17 6 q-2 -2 -1 -4 M31 6 q2 -2 1 -4" stroke="#fff6c9" stroke-width="0.5" fill="none"/>
    `),
    // 船首像：船の舳先を飾る女神の像
    figurehead: svg(`
        ${sky()}
        ${sea(24)}
        <path d="M2 28 L28 22 L34 10 L30 9 L22 20 L2 22z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M30 9 q4 -3 7 -1 q2 3 -1 6 q-2 2 -4 1z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <circle cx="35" cy="8" r="2.2" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M33 6.6 q2 -3 4 0 q2 3 -1 6" stroke="${GOLD_EDGE}" stroke-width="0.5" fill="none"/>
        <path d="M31 13 l6 -2" stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round"/>
    `),
    // ハンマー：金床と大きなハンマー
    hammer: svg(`
        ${wall('#4a3a32')}
        ${ground('#3a2e28')}
        <path d="M12 19 h20 l-3 3 h-3 v5 h-8 v-5 h-3z" fill="#4a4f57"/>
        <g transform="rotate(-25 30 14)">
            <rect x="29" y="8" width="2" height="17" fill="${WOOD}"/>
            <rect x="24" y="4" width="12" height="6" rx="1" fill="#6c737d" stroke="#4a4f57" stroke-width="0.4"/>
        </g>
        ${sparkle(22, 15, 1.6, FIRE_CORE)}${sparkle(14, 13, 1, FIRE)}
    `),
    // 記章：勲章のリボンと星
    insignia: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#1f2a44"/>
        <path d="M18 2 h4 l2 10 l2 -10 h4 l-4 14 h-4z" fill="${RED}"/>
        <path d="M20 2 h1 l3 12 M28 2 h-1 l-3 12" stroke="#fff" stroke-width="0.5" fill="none"/>
        <circle cx="24" cy="20" r="7" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M24 14.6 l1.6 3.4 l3.6 0.4 l-2.7 2.4 l0.8 3.6 l-3.3 -1.9 l-3.3 1.9 l0.8 -3.6 l-2.7 -2.4 l3.6 -0.4z" fill="${GOLD_EDGE}"/>
    `),
    // 宝石：ビロードの上に並んだ色とりどりの宝石
    jewels: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#5a1f34"/>
        <path d="M4 26 q20 -6 40 0 v6 h-40z" fill="#7a2a46"/>
        ${gem(14, 18, 1.6, GEM_RED)}${gem(24, 14, 2, GEM_GREEN)}${gem(34, 18, 1.6, GEM_BLUE)}
        ${gem(19, 24, 1, PURPLE_LIGHT)}${gem(29, 24, 1, GOLD)}
        ${sparkle(40, 8, 1.6)}${sparkle(8, 10, 1.2)}
    `),
    // 宝珠：光る水晶の宝珠
    orb: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#1f1a30"/>
        ${stars([[6, 5], [40, 6], [44, 20], [5, 24]])}
        <path d="M17 27 h14 l-2 -4 h-10z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <circle cx="24" cy="14" r="9" fill="${PURPLE_LIGHT}" fill-opacity="0.8" stroke="#e6d6f2" stroke-width="0.6"/>
        <circle cx="21" cy="11" r="2.4" fill="#fff" opacity="0.6"/>
        <path d="M18 16 q6 -4 12 0" stroke="#fff" stroke-width="0.5" fill="none" opacity="0.6"/>
        ${sparkle(36, 8, 1.4, PURPLE_LIGHT)}
    `),
    // 品評会のヤギ：リボンをつけた立派なヤギ
    prize_goat: svg(`
        ${sky()}
        ${ground(GRASS)}
        <path d="M14 22 v5 M17 22 v5 M27 22 v5 M30 22 v5" stroke="#a4836a" stroke-width="1.4"/>
        <ellipse cx="22" cy="19" rx="9" ry="4.6" fill="#f4f1ea" stroke="#c9c1b0" stroke-width="0.5"/>
        <path d="M30 17 l4 -6 l3 1 l-2 7z" fill="#f4f1ea" stroke="#c9c1b0" stroke-width="0.5"/>
        <path d="M34 11 q-2 -4 -5 -4 M35.4 11 q0 -4 -3 -5" stroke="#8a7a5a" stroke-width="0.9" fill="none"/>
        <path d="M36 16 l1 3" stroke="#c9c1b0" stroke-width="0.8"/>
        <circle cx="35" cy="12.6" r="0.5" fill="${INK}"/>
        <circle cx="26" cy="15" r="2.4" fill="${BLUE}"/>
        <path d="M25 17 l-1 4 l1.4 -1 l1 1.6 l0.4 -4.4" fill="${BLUE}"/>
        <circle cx="26" cy="15" r="1" fill="${GOLD}"/>
    `),
    // からくり箱：組み木細工の小箱
    puzzle_box: svg(`
        ${wall('#d9c4a0')}
        ${floor()}
        <path d="M14 14 L24 9 L34 14 L24 19z" fill="${WOOD_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M14 14 V24 L24 29 V19z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M34 14 V24 L24 29 V19z" fill="#a8743f" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M19 11.6 L29 16.6 M29 11.6 L19 16.6 M14 19 L24 24 M34 19 L24 24 M19 16.6 V26.6 M29 16.6 V26.6" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <circle cx="24" cy="14" r="1" fill="${GOLD}"/>
    `),
    // 六分儀：星を測る真鍮の六分儀
    sextant: svg(`
        ${sky(SKY_NIGHT)}
        ${stars([[6, 4], [14, 8], [38, 3], [44, 9], [30, 6]])}
        <circle cx="40" cy="6" r="2.4" fill="#fff4c4"/>
        <path d="M14 26 L24 6 L34 26z" fill="none" stroke="${GOLD}" stroke-width="1.2"/>
        <path d="M14 26 Q24 31 34 26" stroke="${GOLD}" stroke-width="1.4" fill="none"/>
        <path d="M24 6 L30 25" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <rect x="19" y="13" width="8" height="2.6" rx="1" fill="${GOLD_EDGE}" transform="rotate(-20 23 14)"/>
        ${[16, 20, 24, 28, 32].map(x => `<path d="M${x} ${26 + (x === 24 ? 2.4 : 1.6)} v1" stroke="${INK}" stroke-width="0.4"/>`).join('')}
    `),
    // 盾：紋章の入った丸い盾
    shield: svg(`
        ${wall('#8a6340')}
        ${floor()}
        <path d="M14 5 h20 v9 q0 10 -10 14 q-10 -4 -10 -14z" fill="${BLUE}" stroke="${INK}" stroke-width="0.6"/>
        <path d="M16 7 h16 v7 q0 8 -8 11.6 q-8 -3.6 -8 -11.6z" fill="none" stroke="${GOLD}" stroke-width="0.8"/>
        ${skull(24, 13, 1.4, '#f4f1ea')}
        <path d="M18 20 L30 24 M30 20 L18 24" stroke="#f4f1ea" stroke-width="1"/>
    `),
    // 呪文の巻物：光を放つ魔法の巻物
    spell_scroll: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2c2546"/>
        ${scroll(12, 8, 24, 14)}
        <path d="M16 12 h16 M16 15 h12 M16 18 h14" stroke="${PURPLE}" stroke-width="0.6"/>
        <circle cx="32" cy="17" r="2" fill="none" stroke="${PURPLE}" stroke-width="0.6"/>
        ${sparkle(10, 6, 1.6, PURPLE_LIGHT)}${sparkle(40, 24, 1.6, PURPLE_LIGHT)}${sparkle(38, 6, 1, PURPLE_LIGHT)}
    `),
    // 杖：先に宝石の光る長い杖
    staff: svg(`
        ${sky('#3b2f52')}
        ${stars([[6, 4], [40, 5], [44, 14]])}
        ${ground('#2c2546')}
        <path d="M18 30 L28 6" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M27 7 q-2 -4 1 -5 q3 1 2 5" stroke="${WOOD}" stroke-width="1" fill="none"/>
        <circle cx="28.4" cy="5.6" r="2" fill="${GEM_GREEN}" stroke="#1f6f4a" stroke-width="0.4"/>
        ${sparkle(34, 6, 1.6, '#b8f5cf')}${sparkle(22, 4, 1, '#b8f5cf')}
    `),
    // 剣：交差した2本の剣
    sword: svg(`
        ${wall('#5a4a3a')}
        ${ground('#3a2e24')}
        ${sword(18, 26, -32, 18)}
        ${sword(30, 26, 32, 18)}
        <circle cx="24" cy="15" r="3.6" fill="${RED_DARK}" stroke="${GOLD}" stroke-width="0.6"/>
        ${skull(24, 14.6, 0.8, '#f4f1ea')}
    `)
};
