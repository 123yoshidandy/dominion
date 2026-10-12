/** 拡張「ルネサンス」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground, sea, coin } from './card-art-helpers.js';

// イタリアの都市・芸術・交易の色合い（テラコッタ・オーカー・深い青・金）
const TERRACOTTA = '#c8643b';
const TERRA_DARK = '#8e3b1f';
const OCHRE = '#d9a441';
const OCHRE_LIGHT = '#f2dca3';
const PLASTER = '#f3e3c3';
const BLUE = '#1f3a6e';
const BLUE_LIGHT = '#4a74b8';
const SKY = '#e4ecf4';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';
const CRIMSON = '#9c1f2e';
const GREEN = '#5d8a3a';
const CYPRESS = '#2f5b34';
const SKIN = '#f0c8a0';
const WOOD = '#8d5a2b';
const WOOD_EDGE = '#5d3a1a';
const STEEL = '#b8c4cc';
const STEEL_EDGE = '#6b7b86';
const STONE = '#c9b99a';
const STONE_EDGE = '#8a7a5c';
const MARBLE = '#f5f1e8';
const MARBLE_EDGE = '#b5ab98';
const PAPER = '#f6ead0';
const INK = '#3e2f2a';
const SHADOW = '#2a2230';
const PAVING = '#d9c9a8';

// 空（上半分の明るい色）
const sky = (color = SKY) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 漆喰の壁（室内の絵の背景。床は ground で重ねる）
const wall = (color = PLASTER) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 立っている人（x は体の中心、cloth は服の色）
const person = (x, cloth, { skin = SKIN, hair = '', scale = 1 } = {}) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 2} 23 v4 M${x + 2} 23 v4" stroke="${INK}" stroke-width="1.6"/>
        <path d="M${x - 4} 23 L${x - 3} 14.5 h6 L${x + 4} 23 z" fill="${cloth}"/>
        <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
        ${hair}
    </g>`;

// 長い法衣の人（裾が地面まである）
const robed = (x, cloth, { skin = SKIN, hair = '' } = {}) => `
    <path d="M${x - 5} 27 L${x - 3} 14.5 h6 L${x + 5} 27 z" fill="${cloth}"/>
    <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
    ${hair}`;

// 髪（person の上に重ねる）
const hairCap = (x, color) => `<path d="M${x - 3} 10.5 q3 -5 6 0" fill="${color}"/>`;

// ルネサンス風のベレー帽（person の hair に渡す）
const beret = (x, color, feather = '') => `
    <ellipse cx="${x + 0.6}" cy="8.6" rx="4.2" ry="1.8" fill="${color}"/>
    ${feather ? `<path d="M${x + 3} 8 q3 -4 5 -4.5 q-2 2 -4 5z" fill="${feather}"/>` : ''}`;

// 腕（肩から手先まで）
const arm = (x1, y1, x2, y2, color = SKIN) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`;

// 糸杉（細長い濃い緑の木）
const cypress = (x, y, h = 14) => `
    <rect x="${x - 0.6}" y="${y + h - 1}" width="1.2" height="${27 - y - h + 1}" fill="${WOOD_EDGE}"/>
    <ellipse cx="${x}" cy="${y + h / 2}" rx="${h * 0.16}" ry="${h / 2}" fill="${CYPRESS}"/>`;

// テラコッタ屋根の家（x,y は壁の左上）
const house = (x, y, w, h, wallColor = OCHRE_LIGHT, roof = TERRACOTTA) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wallColor}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
    <path d="M${x - 1} ${y} L${x + w / 2} ${y - w / 3.5} L${x + w + 1} ${y} Z" fill="${roof}"/>`;

// 小さなアーチ窓
const win = (x, y, color = BLUE) =>
    `<path d="M${x - 0.9} ${y + 2.2} v-1.3 a0.9 0.9 0 0 1 1.8 0 v1.3z" fill="${color}"/>`;

// 閉じた本（横から見た背表紙。x,y は左上）
const book = (x, y, w, h, cover) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cover}" stroke="${INK}" stroke-width="0.4"/>
    <rect x="${x + w - 1.2}" y="${y + 0.5}" width="0.9" height="${h - 1}" fill="${PAPER}"/>
    <path d="M${x + 1} ${y + h / 2} h${w - 3}" stroke="${GOLD}" stroke-width="0.5"/>`;

// 金貨（小さな丸）
const gold = (x, y, r = 2) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>`;

// きらめき（十字の星）
const sparkle = (x, y, s = 2, color = '#fff59d') =>
    `<path d="M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}z" fill="${color}"/>`;

// 歯車（x,y は中心、r は半径、歯は8枚）
const gear = (x, y, r, color = OCHRE, edge = WOOD_EDGE) => {
    const teeth = Array.from({ length: 8 }, (_, i) =>
        `<rect x="${x - r * 0.18}" y="${y - r - r * 0.3}" width="${r * 0.36}" height="${r * 0.5}" fill="${color}" stroke="${edge}" stroke-width="0.4" transform="rotate(${i * 45} ${x} ${y})"/>`).join('');
    return `${teeth}
        <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="${edge}" stroke-width="0.6"/>
        <circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="${PLASTER}" stroke="${edge}" stroke-width="0.5"/>`;
};

// 袋（x は中心、y は底、色を変えて金袋や香辛料袋に）
const sack = (x, y, w, h, color, tie = WOOD_EDGE) => `
    <path d="M${x - w * 0.3} ${y - h} Q${x - w * 0.6} ${y - h * 0.5} ${x - w / 2} ${y} H${x + w / 2} Q${x + w * 0.6} ${y - h * 0.5} ${x + w * 0.3} ${y - h}z" fill="${color}" stroke="${tie}" stroke-width="0.4"/>
    <path d="M${x - w * 0.35} ${y - h - 1.2} l${w * 0.35} 1.2 l${w * 0.35} -1.2" fill="${color}" stroke="${tie}" stroke-width="0.4"/>
    <path d="M${x - w * 0.3} ${y - h} h${w * 0.6}" stroke="${tie}" stroke-width="0.8"/>`;

export const RENAISSANCE_ART = {
    // ===== コスト2 =====
    // 城壁の門の前で槍を持つ兵士
    border_guard: svg(`
        ${sky()}
        ${ground(PAVING)}
        <rect x="2" y="9" width="20" height="18" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        ${[2, 7.5, 13, 18.5].map((x) => `<rect x="${x}" y="6.5" width="3.5" height="2.5" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>`).join('')}
        <path d="M7 27 v-8 a5 5 0 0 1 10 0 v8z" fill="${WOOD_EDGE}"/>
        <path d="M9 27 v-11.5 M12 27 v-12.6 M15 27 v-11.5 M7 20 h10 M7 23.5 h10" stroke="${INK}" stroke-width="0.6"/>
        <path d="M12 6.5 V1" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M12 1 h6 l-1.5 1.5 l1.5 1.5 h-6z" fill="${BLUE}"/>
        ${person(31, BLUE_LIGHT, { hair: `<path d="M27.2 10.5 q3.8 -6 7.6 0 q0 0.8 -0.8 0.6 h-6 q-0.8 0.2 -0.8 -0.6z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/><path d="M31 4.8 q1 -1.5 2 -1" fill="none" stroke="${STEEL_EDGE}" stroke-width="0.6"/>` })}
        <path d="M28 14.5 h6 v3 h-6z" fill="${OCHRE}"/>
        ${arm(34, 16, 37, 16)}
        <path d="M37.5 27 V5" stroke="${WOOD}" stroke-width="1.2"/>
        <path d="M37.5 0.8 l-1.5 4.2 h3z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
    `),
    // 刻印のある金貨
    ducat: coin(GOLD, GOLD_EDGE, '#fff2a8', `
        <path d="M24 10.5 v11 M20.5 14 h7" stroke="${GOLD_EDGE}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="24" cy="16" r="10" fill="none" stroke="${GOLD_EDGE}" stroke-width="0.5" stroke-dasharray="1 1"/>
        ${sparkle(37, 6, 2.5, '#fff')}
        ${sparkle(10, 25, 1.6, '#fff')}
    `),
    // 杯を載せたお盆を運ぶ召使い
    lackeys: svg(`
        ${wall()}
        <path d="M34 4 v10 h10 v-10 a5 5 0 0 0 -10 0z" fill="${SKY}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M39 1 v13 M34 8 h10" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        ${ground(TERRA_DARK)}
        ${person(18, '#6d4c41', { hair: hairCap(18, INK) })}
        <path d="M15 14.5 h6 v5 h-6z" fill="${PLASTER}"/>
        <path d="M14.5 20 h7 l0.5 3 h-8z" fill="${PLASTER}"/>
        ${arm(21, 16, 26, 14)}
        <ellipse cx="27" cy="13.5" rx="5" ry="0.9" fill="#d4d4d4" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        <path d="M24.5 13 l-0.6 -3.5 h2.4 l-0.6 3.5z M25.1 12.8 v-1" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/>
        <path d="M28 13 l-0.6 -3.5 h2.4 l-0.6 3.5z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.3"/>
        <ellipse cx="25.1" cy="9.8" rx="1.1" ry="0.4" fill="${CRIMSON}"/>
        <ellipse cx="28.6" cy="9.8" rx="1.1" ry="0.4" fill="${CRIMSON}"/>
    `),

    // ===== コスト3 =====
    // 幕の上がった舞台と喜劇・悲劇の仮面
    acting_troupe: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${SHADOW}"/>
        <rect x="0" y="24" width="48" height="8" fill="${WOOD}"/>
        <path d="M0 24 h48" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M0 0 h48 v4 q-6 3 -12 0 q-6 3 -12 0 q-6 3 -12 0 q-6 3 -12 0z" fill="${CRIMSON}"/>
        <path d="M0 0 H9 Q7 14 10 24 H0z" fill="${CRIMSON}"/>
        <path d="M48 0 H39 Q41 14 38 24 H48z" fill="${CRIMSON}"/>
        <path d="M2 4 Q1 14 3 24 M5 4 Q4 14 6 24 M46 4 Q47 14 45 24 M43 4 Q44 14 42 24" stroke="#6e1420" stroke-width="0.6" fill="none"/>
        <path d="M0 4 q6 3 12 0 q6 3 12 0 q6 3 12 0 q6 3 12 0" stroke="${GOLD}" stroke-width="0.7" fill="none"/>
        <g transform="rotate(-12 19 15)">
            <path d="M13 9 h12 v5 q0 7 -6 7 q-6 0 -6 -7z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
            <path d="M15 12.5 q1.5 -1.5 3 0 M20 12.5 q1.5 -1.5 3 0" stroke="${INK}" stroke-width="0.9" fill="none"/>
            <path d="M15.5 16 q3.5 4 7 0z" fill="${INK}"/>
        </g>
        <g transform="rotate(12 30 16)">
            <path d="M24 10 h12 v5 q0 7 -6 7 q-6 0 -6 -7z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
            <path d="M26 14 q1.5 1.5 3 0 M31 14 q1.5 1.5 3 0" stroke="${INK}" stroke-width="0.9" fill="none"/>
            <path d="M26.5 19.5 q3.5 -3.5 7 0z" fill="${INK}"/>
        </g>
    `),
    // 木箱と樽を積んだ帆船
    cargo_ship: svg(`
        ${sky()}
        ${sea()}
        <path d="M6 20 H42 L38 27 H10z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M7 22 H41" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M24 20 V2" stroke="${WOOD_EDGE}" stroke-width="1"/>
        <path d="M16 3 H32 Q34 9 32 15 H16 Q14 9 16 3z" fill="${PAPER}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M24 4.5 v9 M20 9 h8" stroke="${CRIMSON}" stroke-width="1.6"/>
        <path d="M24 2 h4 l-1 1 l1 1 h-4" fill="${BLUE}"/>
        <rect x="9" y="15" width="5" height="5" fill="${OCHRE}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M9 15 l5 5 M14 15 l-5 5" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <rect x="14" y="16.5" width="4" height="3.5" fill="${TERRACOTTA}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <rect x="31" y="15.5" width="4" height="4.5" rx="1.2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <rect x="35.5" y="15.5" width="4" height="4.5" rx="1.2" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
        <path d="M31 17 h4 M31 18.5 h4 M35.5 17 h4 M35.5 18.5 h4" stroke="${WOOD_EDGE}" stroke-width="0.4"/>
        <rect x="11" y="11.5" width="4" height="3.5" fill="${OCHRE_LIGHT}" stroke="${WOOD_EDGE}" stroke-width="0.5"/>
    `),
    // 作業台の上、スタンドに留めたフラスコをランプで熱する
    experiment: svg(`
        ${wall('#e9dcc0')}
        <rect x="2" y="4" width="10" height="1" fill="${WOOD}"/>
        <rect x="3" y="1.5" width="2" height="2.5" fill="${BLUE_LIGHT}"/><rect x="6" y="2" width="2" height="2" fill="${GREEN}"/><rect x="9" y="1" width="2" height="3" fill="${TERRACOTTA}"/>
        <rect x="0" y="22" width="48" height="10" fill="${WOOD}"/>
        <path d="M0 22 h48" stroke="${WOOD_EDGE}" stroke-width="1"/>
        <path d="M5 32 v-10 M43 32 v-10" stroke="${WOOD_EDGE}" stroke-width="1.6"/>
        <rect x="9" y="20.5" width="10" height="1.5" fill="${STEEL_EDGE}"/>
        <path d="M11 20.5 V3 M11 9 h7" stroke="${STEEL_EDGE}" stroke-width="1" stroke-linecap="round"/>
        <path d="M16.5 7.5 v3 h3 v-3" fill="none" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
        <path d="M17 8 v4 q-5 2 -4 6 q1 3 5 3 q4 0 5 -3 q1 -4 -4 -6 v-4z" fill="#d6eef5" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
        <path d="M13.3 17 q0.2 3 4.7 3.6 q4.5 -0.6 4.7 -3.6z" fill="#7cb342"/>
        <path d="M19 8 Q28 4 33 12" fill="none" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
        <path d="M31 12 h4 v8 q0 2 -2 2 q-2 0 -2 -2z" fill="#d6eef5" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
        <path d="M31.2 17 h3.6 v3 q0 1.6 -1.8 1.6 q-1.8 0 -1.8 -1.6z" fill="#7cb342"/>
        <circle cx="16.5" cy="16" r="0.7" fill="#fff"/><circle cx="19" cy="14.5" r="0.5" fill="#fff"/>
        <circle cx="17.5" cy="5" r="0.9" fill="#c5e1a5"/><circle cx="19" cy="2.5" r="0.7" fill="#c5e1a5"/>
        <path d="M38 22 v-4 h6 v4z" fill="${INK}"/><path d="M39.5 18 v-2.5 h3 v2.5" fill="${PAPER}"/>
    `),
    // 広げた設計図とコンパス・金づち
    improve: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${WOOD}"/>
        <rect x="3" y="3" width="32" height="24" fill="${BLUE}" stroke="${PAPER}" stroke-width="0.6"/>
        <path d="M3 3 l-1 1 v24 l1 -1 M35 3 l1 1 v24 l-1 -1" fill="${BLUE_LIGHT}"/>
        <g fill="none" stroke="#dbe7f7" stroke-width="0.6">
            <path d="M9 23 V13 H27 V23 M7 13 L18 6 L29 13"/>
            <path d="M16 23 v-5 a2 2 0 0 1 4 0 v5"/>
            <path d="M11 15.5 h3 v3 h-3z M22 15.5 h3 v3 h-3z"/>
            <path d="M9 25 h18 M9 24.3 v1.4 M27 24.3 v1.4" stroke-dasharray="1 0.6"/>
        </g>
        <path d="M30 6 L25 25 M30 6 L34 24" stroke="${STEEL_EDGE}" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="30" cy="6" r="1.4" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M41 30 L41 12" stroke="${OCHRE}" stroke-width="2" stroke-linecap="round"/>
        <rect x="37" y="8" width="8" height="4" rx="0.6" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
    `),

    // ===== コスト4 =====
    // 大きな旗を高く掲げる人
    flag_bearer: svg(`
        ${sky()}
        ${house(1, 18, 8, 9)}${house(39, 17, 8, 10, PLASTER, TERRA_DARK)}
        ${ground(PAVING)}
        ${person(17, CRIMSON, { hair: beret(17, BLUE) })}
        ${arm(19.5, 16, 22, 11)}
        <path d="M22.5 27 V1" stroke="${WOOD}" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="22.5" cy="1" r="0.9" fill="${GOLD}"/>
        <path d="M23 2 Q30 0 38 3 Q36 8 39 13 Q31 10 23 12z" fill="${BLUE}"/>
        <path d="M23 5.5 Q30 3.5 37.6 6.5 M23 8.5 Q30 6.8 38 9.5" stroke="${GOLD}" stroke-width="1.2" fill="none"/>
        <circle cx="30.5" cy="6.3" r="2" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
    `),
    // 茂みに隠れた小さな小屋
    hideout: svg(`
        ${sky('#d9e3cf')}
        ${cypress(4, 4, 18)}${cypress(44, 6, 16)}
        ${ground('#6f8f4a')}
        <rect x="17" y="15" width="14" height="12" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M15 15 L24 8 L33 15z" fill="${TERRA_DARK}"/>
        <rect x="22" y="20" width="4" height="7" fill="${SHADOW}"/>
        <circle cx="10" cy="22" r="5.5" fill="${GREEN}"/><circle cx="15" cy="24" r="4.5" fill="#4c7a2f"/>
        <circle cx="36" cy="22" r="5.5" fill="#4c7a2f"/><circle cx="31" cy="24.5" r="4" fill="${GREEN}"/>
        <circle cx="20" cy="26" r="3.5" fill="#3f6b28"/><circle cx="28" cy="26.5" r="3" fill="#3f6b28"/>
        <circle cx="13" cy="19" r="3" fill="#6b9a45"/><circle cx="34" cy="18.5" r="3" fill="#6b9a45"/>
        <circle cx="23" cy="22" r="0.6" fill="#fff59d"/><circle cx="25" cy="22" r="0.6" fill="#fff59d"/>
    `),
    // 歯車で羽ばたく木と布の翼の発明品
    inventor: svg(`
        ${wall(OCHRE_LIGHT)}
        ${ground(WOOD)}
        <path d="M24 13 Q14 1 2 6 Q8 9 6 13 Q12 11 14 15 Q19 12 24 13z" fill="${PAPER}" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        <path d="M24 13 Q34 1 46 6 Q40 9 42 13 Q36 11 34 15 Q29 12 24 13z" fill="${PAPER}" stroke="${WOOD_EDGE}" stroke-width="0.7"/>
        <path d="M24 13 L4 6.5 M24 13 L44 6.5 M14 9.5 v5 M34 9.5 v5" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        ${gear(19, 21, 4.5)}
        ${gear(28.5, 21.5, 3.2, TERRACOTTA)}
        <path d="M24 13 V18" stroke="${WOOD_EDGE}" stroke-width="1"/>
    `),
    // 山の斜面に段々に並ぶ村
    mountain_village: svg(`
        ${sky()}
        <path d="M0 27 L0 20 L18 3 L28 9 L36 4 L48 14 V27z" fill="#9aa66b"/>
        <path d="M14.5 6.3 L18 3 L21.5 5.1 L19 6 L17 5.5z M33.5 5.8 L36 4 L39 6.6 L36.5 6.2z" fill="#fafafa"/>
        ${cypress(42, 14, 10)}
        ${house(13, 11, 6, 4)}${house(22, 13, 6, 4, PLASTER)}
        ${house(7, 17, 6, 5, PLASTER, TERRA_DARK)}${house(16, 18, 7, 5)}${house(27, 18, 6, 5, OCHRE_LIGHT, TERRA_DARK)}
        ${house(3, 23, 7, 4)}${house(13, 24, 6, 3, OCHRE_LIGHT, TERRA_DARK)}${house(30, 24, 7, 3, PLASTER)}
        <rect x="35.5" y="12" width="3" height="10" fill="${PLASTER}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <path d="M35 12 L37 9 L39 12z" fill="${TERRACOTTA}"/>
        ${win(15, 11.8)}${win(25, 13.8)}${win(10, 18)}${win(19.5, 19)}${win(30, 19)}${win(37, 13)}
        ${ground('#7e8c55')}
    `),
    // 金の袋を差し出す豪華な服の貴族
    patron: svg(`
        ${wall()}
        <rect x="0" y="0" width="48" height="4" fill="${BLUE}"/>
        <path d="M0 4 h48" stroke="${GOLD}" stroke-width="0.8"/>
        <rect x="34" y="7" width="10" height="13" fill="${OCHRE}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <path d="M35.5 18.5 l3 -5 l2 3 l1 -1.5 l1 3.5z" fill="${GREEN}"/><circle cx="41" cy="10.5" r="1.2" fill="${GOLD}"/>
        ${ground(TERRA_DARK)}
        <path d="M11 27 L14 14.5 h8 L25 27z" fill="${CRIMSON}"/>
        <path d="M18 14.5 V27" stroke="${GOLD}" stroke-width="1"/>
        <path d="M13.4 17 Q18 19.5 22.6 17" stroke="#f5f5f5" stroke-width="1.4" fill="none"/>
        <circle cx="18" cy="11" r="3" fill="${SKIN}"/>
        <path d="M14.5 9 q3.5 -4 7 0 v-1.6 h-7z" fill="${CRIMSON}"/>
        <rect x="14.5" y="7" width="7" height="2" fill="${CRIMSON}"/>
        <path d="M14.5 9 h7" stroke="${GOLD}" stroke-width="0.6"/>
        ${arm(22, 16, 26, 17)}
        ${sack(28.5, 24, 6, 5, GOLD, GOLD_EDGE)}
        <path d="M27 21.5 l1.5 -1 l1.5 1" stroke="${GOLD_EDGE}" stroke-width="0.6" fill="none"/>
        ${gold(31, 26.2, 1.2)}${gold(33.5, 26.4, 1.2)}
        ${sparkle(32, 15.5, 1.6)}
    `),
    // 教会の窓の前に立つ法衣の司祭
    priest: svg(`
        ${wall('#efe2c6')}
        <path d="M30 22 V8 a6 6 0 0 1 12 0 V22z" fill="${BLUE_LIGHT}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <path d="M36 2 V22 M30 12 h12" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M31 13 h4.5 v8.5 h-4.5z M36.5 13 h4.5 v8.5 h-4.5z" fill="#c45a5a" opacity="0.6"/>
        <circle cx="36" cy="7" r="2.4" fill="${GOLD}" opacity="0.7"/>
        ${ground(PAVING)}
        ${robed(17, '#2d2d38', { hair: `<path d="M14 10 q3 -4.5 6 0" fill="${INK}"/><circle cx="17" cy="7.3" r="1.6" fill="${INK}"/>` })}
        <path d="M14 16 h6 v11 h-1.5 v-9.5 h-3 V27 h-1.5z" fill="#f5f5f5"/>
        <path d="M14.5 14.5 L17 17 L19.5 14.5" fill="none" stroke="${CRIMSON}" stroke-width="1"/>
        <path d="M17 18.5 v6 M15 20.5 h4" stroke="${GOLD}" stroke-width="1.2"/>
        ${arm(20, 16, 23, 13)}
        <path d="M23 13 v-3 M21.8 11 h2.4" stroke="${GOLD}" stroke-width="0.9"/>
    `),
    // 開いた本と金の天体儀
    research: svg(`
        ${wall()}
        <rect x="0" y="23" width="48" height="9" fill="${WOOD}"/>
        <path d="M0 23 h48" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M3 24 Q9 21 16 23 Q23 21 29 24 L29 28 Q23 26 16 28 Q9 26 3 28z" fill="${PAPER}" stroke="${INK}" stroke-width="0.5"/>
        <path d="M16 23 V28" stroke="${INK}" stroke-width="0.5"/>
        <path d="M5 24.8 q5 -1.5 9 -0.3 M5 26.2 q5 -1.5 9 -0.3 M18 24.5 q5 -1.5 9 0.3 M18 26 q5 -1.5 9 0.3" stroke="${STONE_EDGE}" stroke-width="0.4" fill="none"/>
        <path d="M33 23 h10 l-2 -2 h-6z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M38 21 V18" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <circle cx="38" cy="11" r="7.5" fill="none" stroke="${GOLD_EDGE}" stroke-width="1"/>
        <ellipse cx="38" cy="11" rx="7.5" ry="2.6" fill="none" stroke="${GOLD}" stroke-width="0.9" transform="rotate(-20 38 11)"/>
        <ellipse cx="38" cy="11" rx="2.6" ry="7.5" fill="none" stroke="${GOLD}" stroke-width="0.9" transform="rotate(-20 38 11)"/>
        <circle cx="38" cy="11" r="2.2" fill="${BLUE}"/>
        <circle cx="32.5" cy="7" r="0.8" fill="${TERRACOTTA}"/>
    `),
    // 棚に並ぶ色とりどりの反物
    silk_merchant: svg(`
        ${wall(OCHRE_LIGHT)}
        ${ground(TERRA_DARK)}
        <rect x="2" y="13" width="30" height="1.2" fill="${WOOD_EDGE}"/>
        ${[[CRIMSON, 4], [BLUE, 10], [GOLD, 16], ['#4f9a6a', 22], ['#8e44ad', 28]].map(([c, x]) =>
            `<rect x="${x - 2.6}" y="7.6" width="5.2" height="5.4" rx="2.6" fill="${c}" stroke="${INK}" stroke-width="0.3"/><circle cx="${x}" cy="10.3" r="0.8" fill="${PAPER}"/>`).join('')}
        ${[[CRIMSON, 7], ['#e07a5f', 13], [BLUE_LIGHT, 19], [OCHRE, 25]].map(([c, x]) =>
            `<rect x="${x - 2.6}" y="19" width="5.2" height="5.4" rx="2.6" fill="${c}" stroke="${INK}" stroke-width="0.3"/><circle cx="${x}" cy="21.7" r="0.8" fill="${PAPER}"/>`).join('')}
        <rect x="2" y="24.4" width="30" height="1.2" fill="${WOOD_EDGE}"/>
        <path d="M36 3 Q42 5 38 12 Q34 19 42 27 H46 Q40 18 43 11 Q47 4 40 1z" fill="#c2185b"/>
        <path d="M38 4 Q43 6 40 12 Q36 19 43 26" stroke="#f48fb1" stroke-width="0.6" fill="none"/>
        <path d="M34 1 h12" stroke="${WOOD_EDGE}" stroke-width="1"/>
    `),

    // ===== コスト5 =====
    // 煮え立つ大鍋をかき混ぜる腰の曲がった老婆
    old_witch: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3b3048"/>
        <circle cx="40" cy="6" r="3" fill="#fff4a3"/>
        ${ground('#4a3c34')}
        <path d="M8 27 Q8 19 11 15 Q13 9 18 10 Q21 13 20 18 L22 27z" fill="#4a3a5c"/>
        <path d="M11 13 L15 2 L19 12z" fill="#2b1d40"/>
        <path d="M9 12.5 h12" stroke="#2b1d40" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="16.5" cy="15" r="2.5" fill="#cbd5a8"/>
        <path d="M18.5 15 l2.3 1.2 l-2.1 0.5z" fill="#cbd5a8"/>
        <path d="M13.5 13.5 q-1.5 4 0.5 7" stroke="#e0e0e0" stroke-width="1" fill="none"/>
        ${arm(19, 19, 26, 15, '#cbd5a8')}
        <path d="M25 10 L30 22" stroke="${WOOD}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M24 20 h18 q1 7 -9 7 q-10 0 -9 -7z" fill="#212121"/>
        <ellipse cx="33" cy="20" rx="9" ry="1.6" fill="#7cb342"/>
        <circle cx="29" cy="17.5" r="1.3" fill="#9ccc65"/><circle cx="35" cy="16" r="1.6" fill="#9ccc65"/><circle cx="38" cy="13" r="1" fill="#9ccc65"/>
        <path d="M27 27 l-1 2 M39 27 l1 2" stroke="#212121" stroke-width="1"/>
        <path d="M28 29.5 q5 -3 10 0" fill="#ff7043"/>
    `),
    // 名簿を広げる帽子の役人
    recruiter: svg(`
        ${sky()}
        ${house(36, 14, 11, 13)}
        ${ground(PAVING)}
        ${person(16, BLUE, { hair: beret(16, CRIMSON, MARBLE) })}
        <path d="M13 14.5 h6 l0.5 2 h-7z" fill="${GOLD}"/>
        ${arm(19, 16, 23, 15)}
        <rect x="22" y="5" width="10" height="16" fill="${PAPER}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <rect x="21" y="4" width="12" height="2" rx="1" fill="${OCHRE}"/>
        <rect x="21" y="20" width="12" height="2" rx="1" fill="${OCHRE}"/>
        ${[8, 10.5, 13, 15.5, 18].map((y) => `<path d="M24 ${y} h6" stroke="${INK}" stroke-width="0.5"/><path d="M23.2 ${y} l0.3 0.4 l0.5 -0.8" stroke="${CRIMSON}" stroke-width="0.4" fill="none"/>`).join('')}
        <path d="M33 4 L38 0 M33.5 3.5 q2 -3 4.5 -3.5" stroke="${MARBLE_EDGE}" stroke-width="0.8" fill="none"/>
    `),
    // 先端に宝石のついた金の笏
    scepter: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${BLUE}"/>
        <path d="M2 30 Q24 22 46 30 V32 H2z" fill="${CRIMSON}"/>
        <path d="M12 29 L32 9" stroke="${GOLD_EDGE}" stroke-width="3" stroke-linecap="round"/>
        <path d="M12 29 L32 9" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="18" cy="23" r="1.6" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <circle cx="26" cy="15" r="1.4" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M30 11 L31 5 L34 8 L37 6 L36 12 Q33 14 30 11z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="34.5" cy="6" r="3" fill="#d81b60" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="33.6" cy="5.2" r="0.9" fill="#f8bbd0"/>
        <circle cx="21.5" cy="19.5" r="1" fill="#26a69a"/>
        ${sparkle(41, 4, 2.2, '#fff')}${sparkle(8, 8, 1.4, '#fff59d')}
    `),
    // 積み上げた本と大きな眼鏡
    scholar: svg(`
        ${wall()}
        <rect x="0" y="25" width="48" height="7" fill="${WOOD}"/>
        <path d="M0 25 h48" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        ${book(5, 21, 18, 4, CRIMSON)}${book(7, 17, 15, 4, BLUE)}${book(4, 13, 17, 4, '#4f7a3a')}${book(8, 9.5, 13, 3.5, OCHRE)}${book(6, 6, 15, 3.5, TERRA_DARK)}
        <circle cx="31" cy="19" r="4" fill="#e3f2fd" fill-opacity="0.6" stroke="${INK}" stroke-width="1.2"/>
        <circle cx="41" cy="19" r="4" fill="#e3f2fd" fill-opacity="0.6" stroke="${INK}" stroke-width="1.2"/>
        <path d="M35 18.5 q1 -1.5 2 0" stroke="${INK}" stroke-width="1.2" fill="none"/>
        <path d="M29.5 17.5 q1 -1 2.5 -1 M39.5 17.5 q1 -1 2.5 -1" stroke="#fff" stroke-width="0.7" fill="none"/>
        <path d="M26 25 v-3 q0 -1.5 1.5 -1.5 h1 q1.5 0 1.5 1.5 v3z" fill="${INK}"/>
        <path d="M28 21 L33 4 Q35 9 28.6 19z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.5"/>
    `),
    // 大理石の彫像と、のみと木槌
    sculptor: svg(`
        ${wall(OCHRE_LIGHT)}
        ${ground(PAVING)}
        <rect x="8" y="22" width="14" height="5" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M11 22 L12 13 Q15 11 18 13 L19 22z" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M12 13 Q10 9 11 6 M18 13 Q20 17 21 15" stroke="${MARBLE}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <path d="M13 16 q2 1 4 0 M14 19 v3" stroke="${MARBLE_EDGE}" stroke-width="0.4" fill="none"/>
        <circle cx="15" cy="9" r="3" fill="${MARBLE}" stroke="${MARBLE_EDGE}" stroke-width="0.6"/>
        <path d="M12.5 8 q2.5 -3.5 5 0" stroke="${MARBLE_EDGE}" stroke-width="0.5" fill="none"/>
        <path d="M19.5 25 l1.5 -1 l1 1.2 M7.5 25.5 l1 -0.8" stroke="${MARBLE}" stroke-width="0.8"/>
        <path d="M26 22 L34 14" stroke="${STEEL_EDGE}" stroke-width="1" stroke-linecap="round"/>
        <path d="M31 17 L35 13" stroke="${WOOD}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M40 25 L36 10" stroke="${WOOD}" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="32" y="6" width="8" height="4.5" rx="1" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.5" transform="rotate(-15 36 8)"/>
        <circle cx="25" cy="23" r="0.6" fill="${MARBLE_EDGE}"/><circle cx="24" cy="25" r="0.5" fill="${MARBLE_EDGE}"/><circle cx="27" cy="25.5" r="0.5" fill="${MARBLE_EDGE}"/>
    `),
    // 光る水晶玉を覗き込むフードの人
    seer: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${BLUE}"/>
        ${[[4, 4], [10, 9], [42, 3], [45, 10], [36, 2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.5" fill="#fffde7"/>`).join('')}
        <rect x="0" y="24" width="48" height="8" fill="${TERRA_DARK}"/>
        <path d="M6 27 Q6 17 9 12 Q14 3 19 12 Q22 17 22 27z" fill="#5b3f8a"/>
        <ellipse cx="15" cy="12.5" rx="2.6" ry="3" fill="${SHADOW}"/>
        <circle cx="14.3" cy="12.5" r="0.4" fill="#b3e5fc"/><circle cx="16.2" cy="12.5" r="0.4" fill="#b3e5fc"/>
        ${arm(20, 18, 24.5, 18.5, '#5b3f8a')}${arm(9, 19, 13, 21, '#5b3f8a')}
        <circle cx="31" cy="17" r="9" fill="#b3e5fc" opacity="0.2"/>
        <circle cx="31" cy="17" r="5.5" fill="#81d4fa" stroke="#e1f5fe" stroke-width="0.6"/>
        <path d="M28 15 q1.5 -2.5 4 -2.5" stroke="#fff" stroke-width="0.8" fill="none"/>
        <circle cx="32" cy="18" r="1.5" fill="#e1f5fe" opacity="0.8"/>
        <path d="M26 24 l1.5 -2.5 h7 l1.5 2.5z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        ${sparkle(39, 10, 1.6)}${sparkle(24, 9, 1.2)}
    `),
    // 香辛料の袋と壺
    spices: svg(`
        ${wall(OCHRE_LIGHT)}
        <rect x="0" y="24" width="48" height="8" fill="${WOOD}"/>
        <path d="M0 24 h48" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        ${sack(9, 25, 11, 9, '#d7c29a')}
        <ellipse cx="9" cy="16" rx="3.6" ry="1.2" fill="#e65100"/>
        ${sack(20, 25, 9, 7, '#d7c29a')}
        <ellipse cx="20" cy="18" rx="3" ry="1" fill="#c62828"/>
        <path d="M28 25 q-2 -5 1 -8 h-1 v-2 h8 v2 h-1 q3 3 1 8z" fill="${TERRACOTTA}" stroke="${TERRA_DARK}" stroke-width="0.5"/>
        <path d="M28.5 20 h7" stroke="${OCHRE}" stroke-width="0.8"/>
        <path d="M38 25 v-6 q0 -2 2 -2 h3 q2 0 2 2 v6z" fill="${BLUE}" stroke="${INK}" stroke-width="0.4"/>
        <rect x="39.5" y="15" width="4" height="2" fill="${WOOD}"/>
        <path d="M38.5 21 h6" stroke="${GOLD}" stroke-width="0.7"/>
        <circle cx="24" cy="27.5" r="0.6" fill="#e65100"/><circle cx="26" cy="28.5" r="0.5" fill="#c62828"/><circle cx="14" cy="28" r="0.6" fill="#6d4c41"/>
        <path d="M30 28 l2 1 l-1 1z" fill="#3e2723"/>
        ${gold(4, 28.5, 1.2)}${gold(44, 28.5, 1.2)}
    `),
    // 交差したレイピアと羽根つき帽子
    swashbuckler: svg(`
        ${wall('#ead7b0')}
        ${ground(TERRA_DARK)}
        <path d="M6 28 L40 4 M42 28 L8 4" stroke="${STEEL}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M7.5 23 l3 3.5 M40.5 23 l-3 3.5" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <path d="M5 28 l2.5 -1.5 M43 28 l-2.5 -1.5" stroke="${WOOD_EDGE}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M9 24.6 q-2.5 -3.5 1.5 -4 M39 24.6 q2.5 -3.5 -1.5 -4" stroke="${GOLD}" stroke-width="0.8" fill="none"/>
        <ellipse cx="24" cy="17" rx="12" ry="3" fill="${INK}"/>
        <path d="M17 17 q0 -8 7 -8 q7 0 7 8z" fill="${INK}"/>
        <path d="M17.5 15 h13" stroke="${CRIMSON}" stroke-width="1.6"/>
        <path d="M29 14 Q36 6 44 9 Q38 9 34 13 Q38 11 41 13 Q35 13 30 15z" fill="#f5f5f5" stroke="${MARBLE_EDGE}" stroke-width="0.4"/>
        <path d="M30 14.5 Q36 9 42 10" stroke="${MARBLE_EDGE}" stroke-width="0.4" fill="none"/>
    `),
    // 開いた帳簿と大きな鍵
    treasurer: svg(`
        ${wall()}
        <rect x="0" y="22" width="48" height="10" fill="${WOOD}"/>
        <path d="M0 22 h48" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M3 9 h14 v16 h-14z" fill="${PAPER}" stroke="${INK}" stroke-width="0.5"/>
        <path d="M17 9 h14 v16 h-14z" fill="${PAPER}" stroke="${INK}" stroke-width="0.5"/>
        <path d="M3 25 h28 v1.2 h-28z" fill="${CRIMSON}"/>
        <path d="M11 9 v16 M25 9 v16" stroke="${CRIMSON}" stroke-width="0.4"/>
        ${[12, 14.5, 17, 19.5, 22].map((y) => `<path d="M5 ${y} h5 M12 ${y} h3.5 M19 ${y} h5 M26 ${y} h3.5" stroke="${INK}" stroke-width="0.5"/>`).join('')}
        <circle cx="38" cy="8" r="4" fill="none" stroke="${GOLD_EDGE}" stroke-width="2.6"/>
        <circle cx="38" cy="8" r="4" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
        <path d="M38 12 V24" stroke="${GOLD_EDGE}" stroke-width="2.6"/>
        <path d="M38 12 V24" stroke="${GOLD}" stroke-width="1.4"/>
        <path d="M38 19 h3.5 v1.8 h-2 v1.6 h2 v1.8 h-3.5" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        ${gold(44, 27, 1.6)}${gold(41, 28.5, 1.6)}${gold(45.5, 29.5, 1.4)}
    `),
    // マントで顔を隠したつば広帽子の男
    villain: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2c3550"/>
        <circle cx="40" cy="6" r="3.5" fill="#fff4a3"/>
        <rect x="0" y="3" width="10" height="24" fill="#3e4663"/><rect x="38" y="13" width="10" height="14" fill="#3e4663"/>
        ${win(5, 8, '#f2c46b')}${win(43, 17, '#f2c46b')}
        ${ground('#252b3f')}
        <path d="M13 27 Q14 18 18 13 L30 13 Q34 18 35 27z" fill="#1a1a22"/>
        <path d="M17 14 Q24 10 31 14 L31 17 Q24 15 17 17z" fill="#1a1a22"/>
        <rect x="19" y="8" width="10" height="7" fill="${SKIN}"/>
        <path d="M16.5 16 Q24 12 31.5 16 L31 20 Q24 17 17 20z" fill="${CRIMSON}"/>
        <path d="M20.5 11.5 l2.5 0.8 M27.5 11.5 l-2.5 0.8" stroke="${INK}" stroke-width="0.8"/>
        <circle cx="21.8" cy="12.8" r="0.7" fill="${INK}"/><circle cx="26.2" cy="12.8" r="0.7" fill="${INK}"/>
        <ellipse cx="24" cy="8.5" rx="11" ry="2" fill="#111"/>
        <path d="M18 8.5 q0 -6 6 -6 q6 0 6 6z" fill="#111"/>
        <path d="M33 22 L40 26" stroke="${STEEL}" stroke-width="0.9" stroke-linecap="round"/>
    `),
};
