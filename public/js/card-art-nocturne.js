/** 拡張「夜想曲」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground, coin } from './card-art-helpers.js';

// 夜・妖精・魔物の色合い（夜空の紺・紫・月の黄色・森の深緑）
const NIGHT = '#1d2547';
const NIGHT_GROUND = '#2b2f4c';
const VIOLET = '#4b2e6e';
const VIOLET_DARK = '#2b1d40';
const VIOLET_LIGHT = '#b39ddb';
const MOON = '#fff4a3';
const MOON_EDGE = '#e6c84f';
const FOREST = '#2f6b3f';
const FOREST_DARK = '#1f4a2b';
const MEADOW = '#7fae5f';
const DUSK = '#ddd8ee';
const SKIN = '#f0c8a0';
const PALE = '#e6e4f0';
const ZOMBIE = '#a7bf86';
const WOOD = '#8d5a2b';
const WOOD_EDGE = '#5d3a1a';
const STONE = '#9a93a8';
const STONE_EDGE = '#5c556b';
const STEEL = '#b8c4cc';
const STEEL_EDGE = '#6b7b86';
const GOLD = '#f4c430';
const GOLD_EDGE = '#b8860b';
const RED = '#c0392b';
const RED_DARK = '#7f1d1d';
const BONE = '#eeeae0';
const GHOST = '#eef1f8';
const SHADOW = '#0d1020';

// 星空（夜のカードの背景。全面を夜空の色で塗り、小さな星を散らす）
const nightSky = (color = NIGHT, stars = [[4, 4], [11, 9], [17, 3], [30, 6], [36, 2], [45, 12], [24, 10]]) => `
    <rect x="0" y="0" width="48" height="32" fill="${color}"/>
    ${stars.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.5" fill="#fffde7"/>`).join('')}`;

// 空（上半分の明るい色。昼のカード用）
const sky = (color = DUSK) => `<rect x="0" y="0" width="48" height="27" fill="${color}"/>`;

// 満月（ぼんやり光る輪つき）
const moon = (x, y, r) => `
    <circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="${MOON}" opacity="0.18"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${MOON}"/>`;

// 三日月（bg は背景色で欠けた部分を塗る）
const crescent = (x, y, r, bg = NIGHT) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="${MOON}"/>
    <circle cx="${x + r * 0.45}" cy="${y - r * 0.25}" r="${r * 0.85}" fill="${bg}"/>`;

// 立っている人（x は体の中心、cloth は服の色）
const person = (x, cloth, { skin = SKIN, hair = '', scale = 1 } = {}) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 2} 23 v4 M${x + 2} 23 v4" stroke="#3e2f2a" stroke-width="1.6"/>
        <path d="M${x - 4} 23 L${x - 3} 14.5 h6 L${x + 4} 23 z" fill="${cloth}"/>
        <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
        ${hair}
    </g>`;

// 髪（person の上に重ねる）
const hairCap = (x, color) => `<path d="M${x - 3} 10.5 q3 -5 6 0" fill="${color}"/>`;

// 頭をすっぽり覆うフード（person の hair に渡す）
const hood = (x, color) =>
    `<path d="M${x - 3.8} 14.5 q-0.5 -9 3.8 -9 q4.3 0 3.8 9 l-1.2 0 q0.2 -5.5 -2.6 -5.5 q-2.8 0 -2.6 5.5z" fill="${color}"/>`;

// 腕（肩から手先まで）
const arm = (x1, y1, x2, y2, color = SKIN) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>`;

// フードをかぶった顔の見えない人（x は中心、scale で大きさ）
const hooded = (x, color, scale = 1, face = SHADOW) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 5} 27 Q${x - 4.5} 18 ${x - 3.4} 14 Q${x} 5 ${x + 3.4} 14 Q${x + 4.5} 18 ${x + 5} 27z" fill="${color}"/>
        <ellipse cx="${x}" cy="13" rx="1.9" ry="2.4" fill="${face}"/>
    </g>`;

// 丸い葉の木
const tree = (x, y, r = 5, leaf = FOREST, trunk = WOOD) => `
    <rect x="${x - 1}" y="${y}" width="2" height="${27 - y}" fill="${trunk}"/>
    <circle cx="${x}" cy="${y - r * 0.4}" r="${r}" fill="${leaf}"/>`;

// とがった針葉樹
const pine = (x, y, h = 12, leaf = FOREST_DARK, trunk = WOOD_EDGE) => `
    <rect x="${x - 0.8}" y="${y + h}" width="1.6" height="${27 - y - h}" fill="${trunk}"/>
    <path d="M${x} ${y} l${h * 0.35} ${h} h${-h * 0.7}z" fill="${leaf}"/>`;

// 葉のない枯れ木
const deadTree = (x, color = '#3a2f3f') => `
    <path d="M${x} 27 V14 M${x} 19 l-4 -4 M${x} 16 l3 -4 l2 -1 M${x - 4} 15 l-1 -3 M${x} 14 l-1 -4"
        fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>`;

// 家（x,y は壁の左上）
const house = (x, y, w, h, wall, roof, edge = STONE_EDGE) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}" stroke="${edge}" stroke-width="0.6"/>
    <path d="M${x - 1} ${y} L${x + w / 2} ${y - w / 2.6} L${x + w + 1} ${y} Z" fill="${roof}"/>`;

// 四角い窓（color で明かりの色）
const pane = (x, y, color = MOON, s = 2.4) =>
    `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="${color}" stroke="${WOOD_EDGE}" stroke-width="0.3"/>`;

// 小さなアーチ窓
const win = (x, y, color = MOON) =>
    `<path d="M${x - 0.9} ${y + 2.2} v-1.3 a0.9 0.9 0 0 1 1.8 0 v1.3z" fill="${color}"/>`;

// 金貨（小さな丸）
const gold = (x, y, r = 2) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>`;

// きらめき（十字の星）
const sparkle = (x, y, s = 2, color = '#fff59d') =>
    `<path d="M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}z" fill="${color}"/>`;

// 炎（x は中心、y は根元、h は高さ。色を変えると鬼火にもなる）
const flame = (x, y, h = 10, outer = '#ff7043', inner = '#ffee58') => `
    <path d="M${x - h * 0.45} ${y} q${-h * 0.1} ${-h * 0.6} ${h * 0.2} ${-h * 0.75} q0 ${h * 0.3} ${h * 0.15} ${h * 0.25} q${h * 0.05} ${-h * 0.5} ${h * 0.1} ${-h * 0.5} q${h * 0.45} ${h * 0.4} ${h * 0.45} ${h * 1.0}z" fill="${outer}"/>
    <path d="M${x - h * 0.22} ${y} q0 ${-h * 0.35} ${h * 0.15} ${-h * 0.45} q0 ${h * 0.2} ${h * 0.1} ${h * 0.15} q${h * 0.2} ${h * 0.15} ${h * 0.2} ${h * 0.3}z" fill="${inner}"/>`;

// 光の輪（ぼんやりした明かり）
const glow = (x, y, r, color = MOON, opacity = 0.3) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}"/>`;

// コウモリ（x,y は胴の中心、s は大きさ。幅はおよそ 12*s）
const bat = (x, y, s = 1, color = SHADOW) => {
    const wing = `<path d="M-0.8 -0.6 Q-3 -2.6 -6 -1.2 Q-5 0 -5 1.4 Q-4 0.5 -3.2 1.3 Q-2.4 0.5 -1.6 1.3 Q-1.2 0.6 -0.8 0.8z" fill="${color}"/>`;
    return `<g transform="translate(${x} ${y}) scale(${s})">
        ${wing}<g transform="scale(-1 1)">${wing}</g>
        <ellipse cx="0" cy="0" rx="1.1" ry="1.7" fill="${color}"/>
        <path d="M-1 -1.2 l-0.2 -1.4 l0.9 0.8z M1 -1.2 l0.2 -1.4 l-0.9 0.8z" fill="${color}"/>
    </g>`;
};

// 幽霊（x,y は体の中心、s は大きさ。高さはおよそ 11*s）
const ghost = (x, y, s = 1, color = GHOST, opacity = 0.95) => `
    <g transform="translate(${x} ${y}) scale(${s})" opacity="${opacity}">
        <path d="M-4 5 V-2 a4 4 0 0 1 8 0 V5 l-1.33 -1.5 l-1.33 1.5 l-1.34 -1.5 l-1.33 1.5 l-1.33 -1.5z" fill="${color}"/>
        <ellipse cx="-1.5" cy="-1.8" rx="0.8" ry="1.1" fill="#263238"/>
        <ellipse cx="1.5" cy="-1.8" rx="0.8" ry="1.1" fill="#263238"/>
        <ellipse cx="0" cy="1" rx="0.9" ry="1.2" fill="#263238"/>
    </g>`;

// どくろ（x,y は頭の中心、s は大きさ）
const skull = (x, y, s = 1, color = BONE) => `
    <g transform="translate(${x} ${y}) scale(${s})">
        <circle cx="0" cy="0" r="3" fill="${color}"/>
        <rect x="-1.8" y="1.6" width="3.6" height="2.2" rx="0.6" fill="${color}"/>
        <circle cx="-1.2" cy="0.2" r="0.9" fill="#212121"/>
        <circle cx="1.2" cy="0.2" r="0.9" fill="#212121"/>
        <path d="M0 1.2 l-0.5 0.9 h1z M-0.9 3.8 v-1 M0 3.8 v-1 M0.9 3.8 v-1" fill="#212121" stroke="#212121" stroke-width="0.3"/>
    </g>`;

// 墓石（x は中心、y は上端、w は幅）
const tombstone = (x, y, w = 6, color = STONE, edge = STONE_EDGE) => `
    <path d="M${x - w / 2} 27 V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V27z" fill="${color}" stroke="${edge}" stroke-width="0.6"/>
    <path d="M${x} ${y + w * 0.35} v${w * 0.8} M${x - w * 0.22} ${y + w * 0.6} h${w * 0.44}" stroke="${edge}" stroke-width="0.6"/>`;

// 羊（x,y は胴の中心、s は大きさ）
const sheep = (x, y, s = 1) => `
    <g transform="translate(${x} ${y}) scale(${s})">
        <path d="M-3.5 2 v4 M-1.5 2 v4 M1.5 2 v4 M3.5 2 v4" stroke="#37474f" stroke-width="0.9"/>
        <circle cx="-3" cy="0" r="2.6" fill="#fafafa"/><circle cx="0" cy="-1" r="3" fill="#fafafa"/>
        <circle cx="3" cy="0" r="2.6" fill="#fafafa"/><circle cx="0" cy="1.5" r="2.6" fill="#fafafa"/>
        <ellipse cx="6" cy="-1" rx="1.7" ry="2.2" fill="#37474f"/>
        <path d="M5 -2.6 l-1.6 -0.6" stroke="#37474f" stroke-width="0.8" stroke-linecap="round"/>
    </g>`;

// 足跡（獣の肉球。x,y は中心、rot は向き）
const paw = (x, y, rot = 0, color = '#5d4037') => `
    <g transform="translate(${x} ${y}) rotate(${rot})">
        <ellipse cx="0" cy="0.6" rx="1.3" ry="1.1" fill="${color}"/>
        <circle cx="-1.4" cy="-1" r="0.5" fill="${color}"/><circle cx="-0.5" cy="-1.6" r="0.5" fill="${color}"/>
        <circle cx="0.5" cy="-1.6" r="0.5" fill="${color}"/><circle cx="1.4" cy="-1" r="0.5" fill="${color}"/>
    </g>`;

// 音符
const note = (x, y, color = VIOLET) => `
    <ellipse cx="${x}" cy="${y}" rx="1.3" ry="0.9" fill="${color}" transform="rotate(-20 ${x} ${y})"/>
    <path d="M${x + 1.1} ${y - 0.3} v-5 q1.5 0.8 2 2.5" fill="none" stroke="${color}" stroke-width="0.6"/>`;

// 立っているゾンビ（緑がかった肌、両腕を前に突き出す）
const zombie = (x, cloth, hair = '#4e4a3a') => `
    ${person(x, cloth, { skin: ZOMBIE, hair: `<path d="M${x - 3} 10.5 l1 -3 l1 1.2 l1 -1.8 l1 1.6 l1 -1.2 l1 3.2" fill="${hair}"/>` })}
    <circle cx="${x - 1.1}" cy="11.2" r="0.6" fill="#c62828"/><circle cx="${x + 1.1}" cy="11.2" r="0.6" fill="#c62828"/>
    <path d="M${x - 1.2} 13 l0.8 -0.5 l0.8 0.5 l0.8 -0.5" fill="none" stroke="#3e2f2a" stroke-width="0.4"/>`;

// 薄暗い墓場（ゾンビのカードの背景）
const graveyard = () => `
    <rect x="0" y="0" width="48" height="32" fill="#454a6b"/>
    ${crescent(40, 6, 3.5, '#454a6b')}
    ${ground('#3b4a35')}
    ${tombstone(6, 17, 6)}${tombstone(42, 19, 5)}
    <path d="M0 26 q6 -2 12 0 t12 0 t12 0 t12 0 V27 H0z" fill="#9fa8c7" opacity="0.35"/>`;

export const NOCTURNE_ART = {
    // ===== コスト2 =====
    // 木の杖を持つ白ひげの僧
    druid: svg(`
        ${sky('#dfe8d4')}
        ${tree(6, 15, 6)}${tree(43, 14, 6, FOREST_DARK)}
        ${ground(MEADOW)}
        ${person(22, '#6d7d4b', { hair: hairCap(22, '#f5f5f5') })}
        <path d="M19.4 11 q2.6 9 5.2 0 q-2.6 2 -5.2 0z" fill="#fafafa" stroke="#bdbdbd" stroke-width="0.3"/>
        <path d="M18.5 19 h7" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        ${arm(25, 16, 29, 17)}
        <path d="M29.5 27 V7" stroke="${WOOD}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M29.5 7 q-2.5 -1.5 -1 -4 q2.5 0 2.5 2.5" fill="none" stroke="${WOOD}" stroke-width="1.2"/>
        <ellipse cx="32" cy="5" rx="1.8" ry="0.9" fill="#7cb342" transform="rotate(-30 32 5)"/>
        <ellipse cx="27" cy="6.5" rx="1.8" ry="0.9" fill="#7cb342" transform="rotate(30 27 6.5)"/>
        <circle cx="30" cy="3.5" r="0.7" fill="#fafafa"/>
    `),
    // 首輪をつけて座る犬
    faithful_hound: svg(`
        ${sky()}
        ${ground(MEADOW)}
        <path d="M14 25 q-4.5 -1 -4 -7" fill="none" stroke="#8d5a2b" stroke-width="1.8" stroke-linecap="round"/>
        <ellipse cx="18" cy="23" rx="5" ry="4" fill="#a0703c"/>
        <path d="M16 21 Q18 13 24 12 L28.5 14 Q28 20 26.5 27 H17 Z" fill="#a0703c"/>
        <path d="M23 20 v7 M26.5 19 v8" stroke="#8d5a2b" stroke-width="1.8"/>
        <ellipse cx="15.5" cy="26.6" rx="3" ry="1" fill="#8d5a2b"/>
        <circle cx="27" cy="10" r="4" fill="#a0703c"/>
        <ellipse cx="31" cy="11.6" rx="3" ry="2" fill="#a0703c"/>
        <ellipse cx="31" cy="12.6" rx="2.6" ry="1" fill="#f3d9b1"/>
        <circle cx="33.7" cy="11" r="0.9" fill="#212121"/>
        <circle cx="28.3" cy="8.8" r="0.7" fill="#212121"/>
        <path d="M25 6.5 q-3.5 1 -2 7 q2.2 0 3 -4.5z" fill="#6d4423"/>
        <path d="M24 14.2 q2.5 1.8 5 -0.4" fill="none" stroke="${RED}" stroke-width="1.3"/>
        <circle cx="26.6" cy="15.8" r="0.8" fill="${GOLD}"/>
    `),
    // 盾と槍を持つ月夜の見張り
    guardian: svg(`
        ${nightSky()}
        ${moon(41, 6, 3.5)}
        ${ground(NIGHT_GROUND)}
        ${person(24, '#3f51b5', { hair: `<path d="M20.6 11 q3.4 -6.5 6.8 0z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/><path d="M24 4.6 v-1.6" stroke="${STEEL_EDGE}" stroke-width="0.8"/>` })}
        ${arm(27, 16, 31, 15)}
        <path d="M31.5 27 V5" stroke="${WOOD}" stroke-width="1.2"/>
        <path d="M31.5 1 l-1.6 4 h3.2z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        <path d="M14 14 h10 v6 q0 5 -5 7 q-5 -2 -5 -7z" fill="#5c6bc0" stroke="${GOLD_EDGE}" stroke-width="0.9"/>
        ${crescent(19, 19, 2.6, '#5c6bc0')}
    `),
    // 鐘楼のある夜の修道院
    monastery: svg(`
        ${nightSky()}
        ${crescent(7, 6, 3.5)}
        ${ground(NIGHT_GROUND)}
        <rect x="6" y="15" width="26" height="12" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M4.5 15 L19 9 L33.5 15z" fill="#3e3557"/>
        <rect x="32" y="7" width="9" height="20" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M31 7 L36.5 1 L42 7z" fill="#3e3557"/>
        <path d="M34.2 14 v-3.4 a2.3 2.3 0 0 1 4.6 0 v3.4z" fill="${SHADOW}"/>
        <path d="M35.2 13.6 q0 -3 1.3 -3 q1.3 0 1.3 3z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        ${win(10, 18)}${win(15, 18)}${win(23, 18)}${win(28, 18)}${win(36.5, 19)}
        <path d="M17 27 v-3.5 a2 2 0 0 1 4 0 v3.5z" fill="${WOOD_EDGE}"/>
    `),
    // 羽のある小さな妖精
    pixie: svg(`
        ${sky('#e6def5')}
        ${ground(MEADOW)}
        ${[[5, 26, '#f48fb1'], [10, 27, '#fff59d'], [38, 26, '#ce93d8'], [44, 27, '#f48fb1']].map(([x, y, c]) =>
            `<path d="M${x} ${y + 1} v-2" stroke="#558b2f" stroke-width="0.6"/><circle cx="${x}" cy="${y - 1}" r="1.2" fill="${c}"/>`).join('')}
        <ellipse cx="19.5" cy="10" rx="5.5" ry="3" fill="#b3e5fc" opacity="0.8" stroke="#4fc3f7" stroke-width="0.5" transform="rotate(25 19.5 10)"/>
        <ellipse cx="28.5" cy="10" rx="5.5" ry="3" fill="#b3e5fc" opacity="0.8" stroke="#4fc3f7" stroke-width="0.5" transform="rotate(-25 28.5 10)"/>
        <ellipse cx="20.5" cy="16" rx="3.5" ry="2" fill="#b3e5fc" opacity="0.8" stroke="#4fc3f7" stroke-width="0.5" transform="rotate(-20 20.5 16)"/>
        <ellipse cx="27.5" cy="16" rx="3.5" ry="2" fill="#b3e5fc" opacity="0.8" stroke="#4fc3f7" stroke-width="0.5" transform="rotate(20 27.5 16)"/>
        <path d="M23 20 v3 M25 20 v3" stroke="${SKIN}" stroke-width="0.8"/>
        <path d="M22.4 12.5 h3.2 l1.8 7.5 h-6.8z" fill="#66bb6a"/>
        <circle cx="24" cy="10" r="2.3" fill="${SKIN}"/>
        <path d="M21.7 9.8 q2.3 -4 4.6 0 q-2.3 -1.2 -4.6 0z" fill="#ffb74d"/>
        <path d="M21.8 10 l-1.2 -1.2 l1.5 0.4 M26.2 10 l1.2 -1.2 l-1.5 0.4" fill="${SKIN}" stroke="${SKIN}" stroke-width="0.4"/>
        ${arm(25.8, 14, 31, 11.5)}
        ${sparkle(32.5, 10.5, 2)}
        <circle cx="35" cy="13" r="0.6" fill="#fff59d"/><circle cx="37" cy="15.5" r="0.5" fill="#fff59d"/><circle cx="38.5" cy="18.5" r="0.4" fill="#fff59d"/>
    `),
    // 地面の足跡と虫眼鏡
    tracker: svg(`
        ${sky('#dfe8d4')}
        ${pine(5, 3, 13)}${pine(12, 5, 11, FOREST)}${pine(43, 4, 12)}
        <rect x="0" y="16" width="48" height="16" fill="#c8b48a"/>
        ${paw(6, 28, 70)}${paw(11, 24.5, 60)}${paw(16, 27, 70)}${paw(21, 23, 55)}
        <path d="M36 23 L43 30" stroke="${WOOD}" stroke-width="2.6" stroke-linecap="round"/>
        <circle cx="31" cy="18.5" r="6.5" fill="#e1f5fe" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
        ${paw(31, 19, 50)}
        <path d="M27.5 16 q1.5 -2.5 4 -3" fill="none" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
    `),

    // ===== コスト3 =====
    // 揺りかごに忍び寄る妖精の影
    changeling: svg(`
        ${nightSky()}
        ${crescent(8, 7, 3.5)}
        <path d="M31 4 l-1.5 -3.5 l2.5 2 z M37 4 l1.5 -3.5 l-2.5 2 z" fill="${SHADOW}"/>
        <path d="M33 10 Q24 4 22 12 Q27 10 30 13z M35 10 Q44 4 46 12 Q41 10 38 13z" fill="${VIOLET}" opacity="0.85"/>
        <path d="M30 27 Q29 14 31 10 Q34 6 37 10 Q39 14 38 27z" fill="${SHADOW}"/>
        <circle cx="34" cy="7" r="3.2" fill="${SHADOW}"/>
        <ellipse cx="32.8" cy="7" rx="0.7" ry="0.4" fill="#b2ff59"/><ellipse cx="35.2" cy="7" rx="0.7" ry="0.4" fill="#b2ff59"/>
        <path d="M31 14 Q27 15 25 17" fill="none" stroke="${SHADOW}" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M8 29 q10 3 20 0" fill="none" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <path d="M9 27 h18 l1 -8 h-20z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M8 19 q0 -7 7 -7.5 v7.5z" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <circle cx="19" cy="18" r="2.6" fill="${SKIN}"/>
        <path d="M14 19.5 h13 v2 h-13z" fill="#90caf9"/>
    `),
    // 道化の帽子をかぶった愚か者と森
    fool: svg(`
        ${sky('#dfe8d4')}
        ${pine(5, 6, 14)}${pine(11, 9, 11, FOREST)}${pine(38, 7, 13, FOREST)}${pine(44, 5, 15)}
        ${ground(MEADOW)}
        ${person(24, '#e53935')}
        <path d="M24 14.5 h3 L28 23 H24z" fill="#fdd835"/>
        <path d="M21 10.5 Q17 3.5 13 7.5 Q18 6.5 21.5 11z" fill="#e53935"/>
        <path d="M22 9.5 Q24 0.5 26 9.5z" fill="#fdd835"/>
        <path d="M27 10.5 Q31 3.5 35 7.5 Q30 6.5 26.5 11z" fill="#43a047"/>
        <path d="M20.8 10.6 h6.4" stroke="${VIOLET}" stroke-width="1.2"/>
        ${gold(13, 7.6, 1)}${gold(24, 1.6, 1)}${gold(35, 7.6, 1)}
        <path d="M22.5 12.5 q1.5 1.2 3 0" fill="none" stroke="#5d4037" stroke-width="0.5"/>
        <path d="M20 14.5 l1.2 1.5 l1.2 -1.5 l1.2 1.5 l1.2 -1.5 l1.2 1.5 l1.2 -1.5 l1.2 1.5" fill="none" stroke="${VIOLET}" stroke-width="0.6"/>
    `),
    // さびれて傾いた夜の町並み
    ghost_town: svg(`
        ${nightSky('#232842')}
        ${moon(40, 6, 3)}
        ${ground('#3a3448')}
        <g transform="rotate(-4 10 27)">${house(3, 14, 12, 13, '#6d6577', '#4a4255')}</g>
        ${house(19, 11, 11, 16, '#776d80', '#4a4255')}
        <g transform="rotate(5 38 27)">${house(33, 15, 11, 12, '#6d6577', '#4a4255')}</g>
        ${pane(7, 18, SHADOW)}${pane(11, 22, SHADOW)}${pane(24.5, 16, SHADOW)}${pane(38, 19, SHADOW)}
        <path d="M5 21 l4 2 M21 21 l6 -1 M35 23 l5 1" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <path d="M22.5 27 v-5 h4 v5z" fill="${SHADOW}"/>
        <path d="M27 9 l2 3 l-3 0z" fill="${NIGHT}"/>
        ${ghost(24.5, 16, 0.3, GHOST, 0.85)}
        <circle cx="44" cy="25.5" r="1.5" fill="none" stroke="#8d7b5a" stroke-width="0.5"/>
    `),
    // 緑の帽子と金貨の壺
    leprechaun: svg(`
        ${sky('#e3eedd')}
        ${['#e57373', '#ffb74d', '#fff176', '#81c784', '#64b5f6', '#9575cd'].map((c, i) =>
            `<path d="M${22 + i * 1.2} 27 A${16 - i * 1.2} ${18 - i * 1.2} 0 0 1 ${54 - i * 1.2} 27" fill="none" stroke="${c}" stroke-width="1.2"/>`).join('')}
        ${ground(MEADOW)}
        <ellipse cx="14" cy="24" rx="9" ry="2.2" fill="#2e7d32" stroke="#1b5e20" stroke-width="0.6"/>
        <path d="M9 24 L10 9 h8 L19 24z" fill="#2e7d32" stroke="#1b5e20" stroke-width="0.6"/>
        <path d="M9.3 19.5 h9.4 v2.6 h-9.4z" fill="#212121"/>
        <rect x="12.4" y="19" width="3.2" height="3.6" fill="none" stroke="${GOLD}" stroke-width="0.9"/>
        <path d="M5 26 l1 -2 l1 2 M6 24 v-1" stroke="#2e7d32" stroke-width="0.6" fill="none"/>
        <path d="M27 18 h16 q0 10 -8 10 q-8 0 -8 -10z" fill="#263238"/>
        <ellipse cx="35" cy="18" rx="8.5" ry="1.8" fill="#37474f"/>
        ${gold(30, 16.5, 2)}${gold(34, 15.5, 2.2)}${gold(38, 16, 2)}${gold(32, 13.5, 1.8)}${gold(36, 13, 1.8)}
        ${sparkle(41, 11, 1.8)}
    `),
    // ランタンをかざす夜警
    night_watchman: svg(`
        ${nightSky()}
        ${crescent(42, 6, 3)}
        <path d="M0 27 V17 h6 v-3 h5 v13 M32 27 V15 h5 v-4 l3 -2 l3 2 v4 h5 v12" fill="#141a30"/>
        <rect x="0" y="27" width="48" height="5" fill="#3a3f5c"/>
        <path d="M4 29.5 h6 M14 28.5 h6 M26 30 h6 M38 28.5 h6" stroke="#2b2f4c" stroke-width="0.6"/>
        ${glow(29, 18, 8, '#ffe082', 0.25)}${glow(29, 18, 4.5, '#ffe082', 0.35)}
        ${person(19, '#5d4037', { hair: `<path d="M15 8.8 h8" stroke="#212121" stroke-width="1.3"/><path d="M16.5 8.5 v-3 h5 v3z" fill="#212121"/>` })}
        <path d="M15 14.5 l-2 9 h3z" fill="#4e342e"/>
        ${arm(22, 16, 27, 15)}
        <path d="M27.5 14.5 v1.5" stroke="#212121" stroke-width="0.5"/>
        <rect x="26.8" y="15.6" width="4" height="5" rx="0.5" fill="#ffe082" stroke="${GOLD_EDGE}" stroke-width="0.7"/>
        <path d="M26.3 15.6 h5 M26.3 20.6 h5" stroke="#212121" stroke-width="0.8"/>
        ${flame(28.8, 19.8, 3)}
    `),
    // 洞窟の入口と光るランプ
    secret_cave: svg(`
        ${sky('#dfe8d4')}
        ${pine(4, 8, 12)}${pine(44, 7, 13)}
        ${ground(MEADOW)}
        <path d="M5 27 Q8 8 24 6 Q40 8 43 27z" fill="#7b7a8a" stroke="#4f4e5c" stroke-width="0.7"/>
        <path d="M12 12 q6 -5 14 -5 M30 9 q6 2 8 6" fill="none" stroke="#5a8f4a" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M14 27 Q14 13.5 24 13.5 Q34 13.5 34 27z" fill="#1a1626"/>
        ${glow(24, 22, 7, '#ffd54f', 0.25)}${glow(24, 22, 4, '#ffd54f', 0.35)}
        <path d="M19.5 24.5 q4.5 2.5 9 0 l-1.2 -2 h-6.6z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M28.5 24 q2 -0.5 1.5 -2" fill="none" stroke="${GOLD}" stroke-width="0.7"/>
        ${flame(24, 22.5, 4)}
        ${sparkle(30, 17, 1.2)}${sparkle(18, 18, 1)}
    `),

    // ===== コスト4 =====
    // 金の竪琴と音符
    bard: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#ece4f6"/>
        <path d="M17 26 Q10 18 14 8 Q15.5 4.5 19 6" fill="none" stroke="${GOLD}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M31 26 Q38 18 34 8 Q32.5 4.5 29 6" fill="none" stroke="${GOLD}" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M17 26 Q10 18 14 8 Q15.5 4.5 19 6 M31 26 Q38 18 34 8 Q32.5 4.5 29 6" fill="none" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M14.5 9.5 h19" stroke="${WOOD}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M16 26 q8 3 16 0 v-1.5 h-16z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M19 10 V25 M21.5 10 V25 M24 10 V25 M26.5 10 V25 M29 10 V25" stroke="#fff8e1" stroke-width="0.5"/>
        ${note(6, 12)}${note(40, 9)}${note(42, 22, '#7e57c2')}${note(7, 24, '#7e57c2')}
    `),
    // 光に包まれた村
    blessed_village: svg(`
        ${sky('#fbf1cf')}
        <path d="M24 -2 L6 27 H14z M24 -2 L20 27 H28z M24 -2 L34 27 H42z" fill="#fff59d" opacity="0.6"/>
        ${glow(24, 2, 8, '#fff59d', 0.8)}
        ${ground(MEADOW)}
        ${house(3, 16, 11, 11, '#f3e0c0', '#7e57c2', '#b5a07a')}
        ${house(18, 13, 12, 14, '#f7e7c9', '#5e35b1', '#b5a07a')}
        ${house(34, 17, 11, 10, '#f3e0c0', '#7e57c2', '#b5a07a')}
        ${pane(8.5, 20, '#ffe082')}${pane(24, 17.5, '#ffe082')}${pane(39.5, 21, '#ffe082')}
        <path d="M22.5 27 v-4.5 h3 v4.5z" fill="${WOOD}"/>
        ${sparkle(10, 6, 1.6)}${sparkle(38, 7, 1.8)}${sparkle(31, 3, 1.2)}
    `),
    // 墓石が並ぶ夕暮れの墓地
    cemetery: svg(`
        ${sky('#7e6d9e')}
        ${moon(40, 6, 3.5)}
        ${ground('#4f6b3f')}
        ${deadTree(6)}
        ${tombstone(14, 16, 6)}${tombstone(24, 14, 7)}${tombstone(34, 17, 6)}
        <path d="M40 27 v-9 M38 20.5 h4" stroke="${STONE}" stroke-width="1.6"/>
        <path d="M0 23 h48 M1 27 v-6 M47 27 v-6" stroke="#212121" stroke-width="0.5"/>
        ${[3, 9, 19, 29, 44].map(x => `<path d="M${x} 27 v-6.5 l0.6 -0.8 l0.6 0.8" stroke="#212121" stroke-width="0.5" fill="none"/>`).join('')}
    `),
    // ろうそくを囲むフードの人々
    conclave: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${VIOLET_DARK}"/>
        ${glow(24, 18, 12, '#ffe082', 0.12)}${glow(24, 18, 6, '#ffe082', 0.2)}
        <rect x="0" y="27" width="48" height="5" fill="#1b1229"/>
        ${hooded(15, '#5e35b1', 0.65)}${hooded(24, '#6a1b9a', 0.6)}${hooded(33, '#5e35b1', 0.65)}
        <rect x="22.8" y="20" width="2.4" height="6" fill="#fff8e1"/>
        ${flame(24, 20, 4)}
        ${hooded(7, VIOLET, 0.95)}${hooded(41, VIOLET, 0.95)}
    `),
    // 赤い炉と金槌を振る小鬼
    devils_workshop: svg(`
        ${nightSky()}
        ${ground(NIGHT_GROUND)}
        <rect x="3" y="9" width="17" height="18" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <rect x="8" y="2" width="7" height="7" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M6 27 v-7 a5.5 5.5 0 0 1 11 0 v7z" fill="#5d1010"/>
        ${glow(11.5, 22, 7, '#ff7043', 0.3)}
        ${flame(11.5, 27, 8)}
        <path d="M24 27 l1 -3 h8 l1 3z M23 24 h12 l-2 -2 h-8z" fill="#455a64"/>
        <path d="M37 27 v-4 M41 27 v-4" stroke="#e53935" stroke-width="1.4"/>
        <ellipse cx="39" cy="19.5" rx="3.8" ry="4" fill="#e53935"/>
        <circle cx="39" cy="13" r="3.2" fill="#e53935"/>
        <path d="M36.6 11 l-1 -3 l2 1.8z M41.4 11 l1 -3 l-2 1.8z" fill="#fff59d"/>
        <circle cx="38" cy="12.8" r="0.6" fill="#fff59d"/><circle cx="40" cy="12.8" r="0.6" fill="#fff59d"/>
        <path d="M37.8 14.6 q1.2 0.8 2.4 0" fill="none" stroke="#5d1010" stroke-width="0.5"/>
        <path d="M42.5 21 q4 1 3 5 l1 0.5 l-1.5 0.5" fill="none" stroke="#e53935" stroke-width="0.9"/>
        <path d="M36 18 L31 14" stroke="#e53935" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M31 14 L29 20" stroke="${WOOD}" stroke-width="1.1"/>
        <rect x="27.5" y="12" width="4.5" height="2.6" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5" transform="rotate(20 29.7 13.3)"/>
        ${sparkle(30, 22, 1.2, '#ffcc80')}
    `),
    // 聖印をかざして幽霊を払う人
    exorcist: svg(`
        ${nightSky()}
        ${ground(NIGHT_GROUND)}
        ${person(15, '#eceff1', { hair: hairCap(15, '#4e342e') })}
        <path d="M13 14.5 v8.5 M17 14.5 v8.5" stroke="${VIOLET}" stroke-width="1"/>
        ${arm(18, 16, 22, 11)}
        <path d="M24 4 L34 2 M24 9 L37 9 M24 14 L34 17" stroke="#fff59d" stroke-width="0.6" opacity="0.7"/>
        ${glow(23, 9, 5, '#fff59d', 0.35)}
        <path d="M23 4.5 v9 M20 7.5 h6" stroke="${GOLD}" stroke-width="1.6"/>
        ${ghost(38, 15, 1.1, GHOST, 0.6)}
        <path d="M43.5 12 h3 M44 16 h3 M43.5 20 h3" stroke="${GHOST}" stroke-width="0.5" opacity="0.6"/>
    `),
    // 紫の光の中で起き上がる骸骨
    necromancer: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${VIOLET_DARK}"/>
        <rect x="0" y="27" width="48" height="5" fill="#3a2c4f"/>
        ${glow(32, 17, 11, '#ab47bc', 0.25)}${glow(32, 17, 6, '#ce93d8', 0.25)}
        ${hooded(10, '#311b4f', 1, '#120c1e')}
        <ellipse cx="9.2" cy="13" rx="0.5" ry="0.3" fill="#e1bee7"/><ellipse cx="10.8" cy="13" rx="0.5" ry="0.3" fill="#e1bee7"/>
        <path d="M17 27 V5" stroke="#5d4037" stroke-width="1.1"/>
        ${glow(17, 4.5, 3, '#e1bee7', 0.5)}
        <circle cx="17" cy="4.5" r="1.3" fill="#e1bee7"/>
        <path d="M14 18 L17 16" stroke="#311b4f" stroke-width="1.4"/>
        ${skull(32, 10, 0.95)}
        <path d="M32 14 V24 M28.5 16 q3.5 1.5 7 0 M28.5 18.5 q3.5 1.5 7 0 M29 21 q3 1.2 6 0" fill="none" stroke="${BONE}" stroke-width="0.9"/>
        <path d="M29 15.5 L25 9 M35 15.5 L39 9" stroke="${BONE}" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M24 27 q8 -4 16 0z" fill="#3a2c4f"/>
        ${sparkle(23, 5, 1.2, '#e1bee7')}${sparkle(42, 6, 1.4, '#e1bee7')}
    `),
    // 羊の群れと曲がった杖の羊飼い
    shepherd: svg(`
        ${sky('#dfe8d4')}
        <path d="M0 22 Q12 14 26 20 Q38 14 48 20 V27 H0z" fill="#8cbf73"/>
        ${ground(MEADOW)}
        ${person(10, '#8d6e63', { hair: hairCap(10, '#5d4037') })}
        ${arm(13, 16, 16, 17)}
        <path d="M16.5 27 V8 q0 -3 -2.5 -3 q-2 0 -2 2" fill="none" stroke="${WOOD}" stroke-width="1.2" stroke-linecap="round"/>
        ${sheep(26, 21, 0.95)}${sheep(38, 22, 0.85)}${sheep(33, 15.5, 0.6)}
    `),
    // 物陰にひそむ光る目の黒い影
    skulk: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#5c4f78"/>
        <rect x="0" y="0" width="16" height="32" fill="#7a6a6a"/>
        <path d="M0 5 h16 M0 11 h16 M0 17 h16 M0 23 h16 M4 0 v5 M10 5 v6 M4 11 v6 M10 17 v6 M4 23 v4" stroke="#5a4b4b" stroke-width="0.5"/>
        <rect x="36" y="0" width="12" height="32" fill="#6a5c6a"/>
        <path d="M36 6 h12 M36 13 h12 M36 20 h12 M40 0 v6 M44 6 v7 M40 13 v7 M44 20 v7" stroke="#4d424d" stroke-width="0.5"/>
        <rect x="16" y="27" width="20" height="5" fill="#3d3450"/>
        <path d="M16 27 L23 10 L36 27z" fill="${SHADOW}" opacity="0.35"/>
        <path d="M18 27 Q17 18 20 13 Q23 8 26 12 Q28 16 30 27z" fill="${SHADOW}"/>
        <path d="M27 18 q4 0 6 3" fill="none" stroke="${SHADOW}" stroke-width="1.4" stroke-linecap="round"/>
        <ellipse cx="21.8" cy="13.6" rx="0.9" ry="0.45" fill="#ffeb3b"/><ellipse cx="24.4" cy="13.6" rx="0.9" ry="0.45" fill="#ffeb3b"/>
    `),

    // ===== コスト5 =====
    // 夜なべの作業台に靴と金槌
    cobbler: svg(`
        ${nightSky()}
        ${crescent(42, 6, 3)}
        <rect x="0" y="24" width="48" height="8" fill="${WOOD}" stroke="${WOOD_EDGE}" stroke-width="0.6"/>
        <path d="M0 24 h48" stroke="${WOOD_EDGE}" stroke-width="1"/>
        ${glow(8, 13, 7, '#ffe082', 0.25)}
        <rect x="6.8" y="16" width="2.4" height="8" fill="#fff8e1"/>
        ${flame(8, 16, 4)}
        <path d="M15 8 h8 v10 q8 0 13 3 q1 1 1 3 h-22z" fill="#8d4f2a" stroke="#4e2a14" stroke-width="0.6"/>
        <path d="M15 24 h22" stroke="#3e2111" stroke-width="1.4"/>
        <path d="M15 11 h8 M17 13 l4 0 M17 15 l4 0" stroke="#4e2a14" stroke-width="0.5"/>
        <path d="M30 23 L43 13" stroke="${WOOD}" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="40" y="9.5" width="3.4" height="6" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5" transform="rotate(-37 41.7 12.5)"/>
    `),
    // 石の棺を囲む地下聖堂のアーチ
    crypt: svg(`
        ${nightSky()}
        <path d="M0 0 V27 h3 V12 a9 9 0 0 1 18 0 V27 h6 V12 a9 9 0 0 1 18 0 V27 h3 V0z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M0 6 h48 M8 0 v3 M24 0 v6 M40 0 v3" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <rect x="0" y="27" width="48" height="5" fill="#4a4458"/>
        <path d="M9 14 h30 l-2 4 h-26z" fill="#b8b0c4" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <rect x="10" y="18" width="28" height="9" fill="#a39bb0" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M13 21 h22 M13 24 h22" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M24 14.5 v3 M22.5 15.8 h3" stroke="${GOLD}" stroke-width="0.8"/>
        <rect x="3.2" y="21" width="1.6" height="6" fill="#fff8e1"/>${flame(4, 21, 3)}
        <rect x="43.2" y="21" width="1.6" height="6" fill="#fff8e1"/>${flame(44, 21, 3)}
    `),
    // 黒い霧に包まれた村
    cursed_village: svg(`
        ${sky('#7d7391')}
        ${ground('#4a4458')}
        ${deadTree(44, '#2b2238')}
        ${house(3, 15, 11, 12, '#6d6577', '#3e3557')}
        ${house(18, 12, 12, 15, '#776d80', '#3e3557')}
        ${house(33, 16, 9, 11, '#6d6577', '#3e3557')}
        ${pane(8.5, 19, '#b388ff')}${pane(24, 16, '#b388ff')}${pane(37.5, 20, '#b388ff')}
        <path d="M0 22 q6 -3 12 0 t12 0 t12 0 t12 0 V32 H0z" fill="#1b1427" opacity="0.6"/>
        <path d="M0 26 q6 -3 12 0 t12 0 t12 0 t12 0 V32 H0z" fill="#1b1427" opacity="0.7"/>
        <path d="M-2 10 q8 -4 16 0 t16 0" fill="none" stroke="#1b1427" stroke-width="2" opacity="0.5"/>
        <path d="M22 7 q8 -4 16 0 t12 0" fill="none" stroke="#1b1427" stroke-width="2" opacity="0.4"/>
    `),
    // 窓が赤く光る夜の酒場
    den_of_sin: svg(`
        ${nightSky()}
        ${ground(NIGHT_GROUND)}
        ${glow(24, 22, 14, '#e53935', 0.18)}
        ${house(8, 11, 32, 16, '#4e3b4f', '#2b1d30', '#2b1d30')}
        ${pane(14, 17, '#ff5252', 4)}${pane(34, 17, '#ff5252', 4)}
        <path d="M21 27 v-8 h6 v8z" fill="#ff5252"/>
        <path d="M24 19 v8" stroke="#7f1d1d" stroke-width="0.5"/>
        <path d="M40 13 h4 M42.5 13 v1.5" stroke="${WOOD_EDGE}" stroke-width="0.8"/>
        <rect x="40" y="14.5" width="5" height="4" fill="${RED_DARK}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        <path d="M41.5 17.5 v-2 l1 1 l1 -1 v2" fill="none" stroke="${GOLD}" stroke-width="0.5"/>
        <path d="M18 27 l-6 5 M30 27 l6 5" stroke="#e53935" stroke-width="0.6" opacity="0.5"/>
    `),
    // 台座の上の金の像
    idol: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#2f4f3a"/>
        ${glow(24, 13, 12, '#fff59d', 0.15)}
        <path d="M2 0 q4 8 1 16 M46 0 q-4 8 -1 16 M8 0 q1 5 -2 9 M40 0 q-1 5 2 9" fill="none" stroke="#5a8f4a" stroke-width="1.2"/>
        <rect x="14" y="23" width="20" height="4" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <rect x="12" y="27" width="24" height="5" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M17 23 q0 -6 3 -8 h8 q3 2 3 8z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M20 15 L18 10 h12 L28 15z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="24" cy="7" r="3.6" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M20.5 5.5 l3.5 -4.5 l3.5 4.5" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <path d="M22.5 6.8 h1 M24.5 6.8 h1" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="24" cy="12" r="1" fill="${RED}"/>
        <path d="M20.5 18 q3.5 2 7 0" fill="none" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        ${sparkle(12, 8, 2)}${sparkle(36, 6, 2.2)}${sparkle(38, 18, 1.4)}
    `),
    // 黄色い目の黒い妖精の馬
    pooka: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3d4a6b"/>
        ${crescent(6, 6, 3, '#3d4a6b')}
        ${pine(41, 4, 14, '#1f3a2b')}${pine(46, 8, 11, '#1f3a2b')}${pine(14, 6, 10, '#2a4535')}
        ${ground('#2e4733')}
        <g transform="translate(-2 0)">
        <path d="M14 21 v6 M17 21 v6 M23 21 v6 M26 21 v6" stroke="#15151f" stroke-width="1.6"/>
        <ellipse cx="20" cy="18" rx="8" ry="4.5" fill="#15151f"/>
        <path d="M25 16 l4 -7 l3 1 l2 3 l-2 1 l-3 -1 l-1 5z" fill="#15151f"/>
        <path d="M26 14 q1 -4 3 -6.5 q-3 0 -4 3 q-1 2 -2 4z" fill="#3a3a6a"/>
        <path d="M12 17 q-5 1 -4 8 q1 -3 3 -5" fill="#3a3a6a"/>
        <ellipse cx="31.4" cy="11" rx="0.9" ry="0.6" fill="#ffeb3b"/>
        ${glow(31.4, 11, 2, '#ffeb3b', 0.35)}
        </g>
        ${sparkle(36, 18, 1.2, VIOLET_LIGHT)}${sparkle(8, 14, 1, VIOLET_LIGHT)}${sparkle(33, 4, 1, VIOLET_LIGHT)}
    `),
    // 光に包まれた聖なる木々
    sacred_grove: svg(`
        ${sky('#eef5d6')}
        <path d="M20 -2 L8 27 H16z M26 -2 L22 27 H30z M32 -2 L34 27 H42z" fill="#fff59d" opacity="0.55"/>
        ${ground(MEADOW)}
        ${glow(10, 13, 8, '#fff59d', 0.5)}${glow(24, 10, 9, '#fff59d', 0.5)}${glow(38, 13, 8, '#fff59d', 0.5)}
        ${tree(10, 16, 6, '#43a047')}${tree(24, 13, 7, '#2e7d32')}${tree(38, 16, 6, '#43a047')}
        <ellipse cx="24" cy="27" rx="6" ry="1.2" fill="#c5e1a5"/>
        ${sparkle(17, 6, 1.4)}${sparkle(31, 5, 1.6)}${sparkle(5, 22, 1.2)}${sparkle(44, 22, 1.2)}
    `),
    // 鞭を振るう赤い悪魔
    tormentor: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3a1a2a"/>
        ${glow(20, 16, 12, '#e53935', 0.15)}
        <rect x="0" y="27" width="48" height="5" fill="#2a1020"/>
        <path d="M12 16 Q4 8 3 18 Q7 15 9 19 Q10 16 13 19z M28 16 Q36 8 37 18 Q33 15 31 19 Q30 16 27 19z" fill="#7f1d1d"/>
        <path d="M23 24 q6 4 10 0 l1.2 -1.6 l0.4 2.2z" fill="none" stroke="#d84343" stroke-width="0.9"/>
        ${person(20, '#b71c1c', { skin: '#d84343' })}
        <path d="M17.6 9 l-1.5 -4 l2.8 2.6z M22.4 9 l1.5 -4 l-2.8 2.6z" fill="#fff8e1"/>
        <path d="M18.4 10.6 l1 0.6 M21.6 10.6 l-1 0.6" stroke="#fff59d" stroke-width="0.7"/>
        <path d="M18.8 12.8 q1.2 0.8 2.4 0" fill="none" stroke="#3a1a2a" stroke-width="0.5"/>
        ${arm(23, 16, 28, 12, '#d84343')}
        <path d="M28 12 L29 10" stroke="${WOOD_EDGE}" stroke-width="1.2"/>
        <path d="M29 10 Q36 0 43 6 Q47 11 40 14 Q36 15 38 19" fill="none" stroke="#5d4037" stroke-width="0.8" stroke-linecap="round"/>
        <path d="M39 20 l-2 -1 M39 20 l1 -2" stroke="#fff59d" stroke-width="0.5"/>
    `),
    // 地面に刺さった折れた剣と赤いマント
    tragic_hero: svg(`
        ${sky('#6b5a8c')}
        <circle cx="38" cy="27" r="7" fill="#e57373" opacity="0.7"/>
        ${ground('#4a4458')}
        <path d="M6 27 q4 -4 9 -2 q5 2 9 -1 q2 2 3 3z" fill="${RED}"/>
        <path d="M22 27 V14 l1 -1.2 l0.6 1.5 l0.6 -1.8 l0.8 1.5 V27z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        <path d="M19 14 h10" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
        <path d="M24 14 V7" stroke="${WOOD_EDGE}" stroke-width="1.8"/>
        <circle cx="24" cy="6.3" r="1.3" fill="${GOLD}"/>
        <path d="M30 26.5 l10 -2.5 l1.5 0.6 l-1.2 1 z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.5"/>
        <path d="M23 20 l1.5 -2 M24 22 l1 2" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
    `),
    // 満月を背にしたマントの吸血鬼
    vampire: svg(`
        ${nightSky()}
        ${moon(24, 11, 9)}
        ${ground(NIGHT_GROUND)}
        <path d="M24 13 L9 27 Q12 21 10 15 Q15 18 18 14z M24 13 L39 27 Q36 21 38 15 Q33 18 30 14z" fill="${SHADOW}"/>
        <path d="M19 14 L24 13 L29 14 L31 27 H17z" fill="${SHADOW}"/>
        <path d="M18 14 L24 18 L30 14 L31 27 H17z" fill="${RED_DARK}"/>
        <path d="M21.5 14 L24 18 L26.5 14z" fill="#fafafa"/>
        <path d="M17 13.5 L19.5 6 L21 12 M31 13.5 L28.5 6 L27 12" fill="${SHADOW}"/>
        <circle cx="24" cy="10" r="3.2" fill="${PALE}"/>
        <path d="M20.8 9.8 q0 -4.5 3.2 -4.5 q3.2 0 3.2 4.5 l-1 -1.8 l-2.2 1.5 l-2.2 -1.5z" fill="#111"/>
        <path d="M22.8 10.4 l1 0.3 M25.2 10.4 l-1 0.3" stroke="#c62828" stroke-width="0.7"/>
        <path d="M23 12 l0.4 1 l0.4 -0.9 M24.2 12.1 l0.4 0.9 l0.4 -1" fill="#fafafa" stroke="#fafafa" stroke-width="0.3"/>
        ${bat(7, 7, 0.6)}${bat(41, 5, 0.5)}${bat(42, 20, 0.45, '#2b2f4c')}
    `),
    // 満月に吠える狼男
    werewolf: svg(`
        ${nightSky()}
        ${moon(30, 11, 9)}
        <path d="M14 27 L18 19 L28 17 L35 22 L38 27z" fill="#3a3448"/>
        ${ground(NIGHT_GROUND)}
        <path d="M21 19.5 V14 Q20 9 23 7 L24 3.5 L25.2 5.8 L29.5 3 L28 5.5 L26.5 8 Q28 11 26.5 14 L27 19.5 L25 19 L24.5 15.5 L23 19.5z" fill="${SHADOW}"/>
        <path d="M22.4 10 L18 13 L17 16 M26.5 11 L30 13 L31.5 11" fill="none" stroke="${SHADOW}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M17 16 l-1 1.5 M17 16 l-1.5 0.5 M31.5 11 l1 -1.5 M31.5 11 l1.5 -0.3" stroke="${SHADOW}" stroke-width="0.6"/>
        <path d="M21 14 Q17 16 18 19" fill="none" stroke="${SHADOW}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M30 5 l3 -2 M30.5 6.5 l3.5 -1" stroke="#fffde7" stroke-width="0.5"/>
    `),
    // 松明を掲げる覆面の盗賊と燃える家
    raider: svg(`
        ${nightSky()}
        ${ground(NIGHT_GROUND)}
        ${house(30, 15, 13, 12, '#5d4b45', '#3e2f2a', '#2b1d1a')}
        ${flame(36.5, 11, 9)}${flame(41, 15, 5)}
        ${pane(33, 20, '#ff7043')}${pane(40, 20, '#ff7043')}
        ${person(15, '#37474f', { hair: hairCap(15, '#212121') })}
        <path d="M11.8 10.2 h6.4 v1.6 h-6.4z" fill="#212121"/>
        <circle cx="14" cy="11" r="0.45" fill="#fff"/><circle cx="16" cy="11" r="0.45" fill="#fff"/>
        <path d="M12 14.5 l6 8.5" stroke="#795548" stroke-width="0.8"/>
        ${arm(18, 16, 22, 11)}
        <path d="M22 13 L23.5 7" stroke="${WOOD}" stroke-width="1.2"/>
        ${glow(23.8, 4, 4, '#ffb74d', 0.35)}
        ${flame(23.8, 7, 6)}
        <path d="M8 27 q-2 -5 1.5 -6 q2 -0.5 2.5 1 l1 5z" fill="#a1887f"/>
    `),

    // ===== 家宝 =====
    // ひげと角のあるヤギ
    goat: svg(`
        ${sky('#e3eedd')}
        ${ground(MEADOW)}
        <path d="M14 21 v6 M17 21 v6 M27 21 v6 M30 21 v6" stroke="#9e9e9e" stroke-width="1.5"/>
        <ellipse cx="22" cy="18" rx="10" ry="5" fill="#f5f5f5" stroke="#bdbdbd" stroke-width="0.5"/>
        <path d="M12 16 l-2 -2" stroke="#f5f5f5" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M29 16 L32 9 L37 9 L38 12 L35 13 L32 17z" fill="#f5f5f5" stroke="#bdbdbd" stroke-width="0.5"/>
        <path d="M33 9 q-1 -5 -5 -6 q3 2 3 6.5 M35 9 q0 -5 -3 -6.5 q2 2 1.5 6.5" fill="#8d6e63"/>
        <path d="M32.5 10 l-3 0.5" stroke="#e0e0e0" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M36 12.5 q0 3 -1.2 4.5 q-0.3 -2.5 0 -4z" fill="#e0e0e0"/>
        <circle cx="34.6" cy="10.6" r="0.6" fill="#212121"/>
    `),
    // 金貨のこぼれる革の小袋
    pouch: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#ece6f5"/>
        <path d="M14 27 q-5 -8 2 -14 l-2 -4 l4 1 l3 -2 l3 2 l4 -1 l-2 4 q7 6 2 14z" fill="#a1683a" stroke="#6d4423" stroke-width="0.7"/>
        <path d="M16 12.5 q5 2 10 0" fill="none" stroke="#e6c38f" stroke-width="1"/>
        <path d="M26 12.5 q4 0 4 3" fill="none" stroke="#e6c38f" stroke-width="0.8"/>
        <path d="M17 21 q4 2 8 0" fill="none" stroke="#6d4423" stroke-width="0.5"/>
        ${gold(33, 25.5, 2.2)}${gold(37.5, 26, 2)}${gold(35, 22, 2)}
        ${sparkle(40, 15, 1.8)}${sparkle(8, 8, 1.4)}
    `),
    // 四つ葉のクローバーの刻まれた幸運のコイン
    lucky_coin: coin('#ffd54f', '#b8860b', '#fff59d', `
        ${[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy]) =>
            `<circle cx="${24 + dx * 1.7}" cy="${17 + dy * 1.7}" r="2" fill="#43a047"/>`).join('')}
        <path d="M24 17 q1 3 3 4.5" fill="none" stroke="#2e7d32" stroke-width="0.8"/>
        ${sparkle(40, 6, 2)}${sparkle(8, 26, 1.4)}
    `),
    // 紫の煙が立ちのぼる魔法のランプ
    magic_lamp: svg(`
        ${nightSky(VIOLET_DARK)}
        <path d="M27 14 q-4 -4 0 -7 q4 -3 0 -6 M27 14 q3 -3 6 -2 q4 1 4 -3" fill="none" stroke="${VIOLET_LIGHT}" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
        ${sparkle(36, 7, 1.6, VIOLET_LIGHT)}${sparkle(21, 4, 1.2, VIOLET_LIGHT)}
        <path d="M12 21 q6 6 16 3 q4 -1 6 -5 l5 -3 l-1 3 l-4 2 q-1 7 -8 8 q-10 1 -14 -8z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.7"/>
        <path d="M12 21 q-4 -2 -5 2 q1 3 6 2" fill="none" stroke="${GOLD_EDGE}" stroke-width="1.2"/>
        <path d="M17 21 q5 -6 11 0z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.6"/>
        <circle cx="22.5" cy="16.5" r="1" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.4"/>
        <path d="M17 29 h12" stroke="${GOLD_EDGE}" stroke-width="1.6"/>
        <circle cx="22" cy="24.5" r="1.1" fill="${RED}"/>
    `),
    // 幽霊の顔が映る金縁の鏡
    haunted_mirror: svg(`
        <rect x="0" y="0" width="48" height="32" fill="${VIOLET_DARK}"/>
        <ellipse cx="24" cy="15" rx="9" ry="12" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.8"/>
        <ellipse cx="24" cy="15" rx="7" ry="10" fill="#9fb8d6"/>
        ${ghost(24, 15, 1, GHOST, 0.75)}
        <path d="M19.5 9 q1 -3 3.5 -4" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.7" stroke-linecap="round"/>
        <path d="M24 3 l-1.5 -2 h3z M22 27 h4 v3 h-4z" fill="${GOLD}" stroke="${GOLD_EDGE}" stroke-width="0.5"/>
        ${sparkle(8, 8, 1.4, VIOLET_LIGHT)}${sparkle(40, 24, 1.4, VIOLET_LIGHT)}
    `),
    // 柵に囲まれた牧草地
    pasture: svg(`
        ${sky('#dfe8d4')}
        <path d="M0 20 Q14 13 30 18 Q40 14 48 17 V32 H0z" fill="#8cbf73"/>
        <path d="M0 24 Q20 19 48 23 V32 H0z" fill="${MEADOW}"/>
        <path d="M2 30 v-10 M12 29 v-10 M22 28.5 v-10 M32 28.5 v-10 M42 29 v-10" stroke="${WOOD}" stroke-width="1.4"/>
        <path d="M1 22 L43 21 M1 26 L43 25.5" stroke="${WOOD}" stroke-width="1.2"/>
        ${sheep(30, 15.5, 0.55)}
        ${[[7, 30], [17, 30], [27, 31], [37, 30], [45, 30]].map(([x, y]) =>
            `<path d="M${x - 1} ${y} l-0.5 -2 M${x} ${y} v-2.5 M${x + 1} ${y} l0.5 -2" stroke="#558b2f" stroke-width="0.6"/>`).join('')}
    `),
    // 黒い靄をまとう呪われた金貨
    cursed_gold: coin('#c9a227', '#5d4037', '#8d6e63', `
        <path d="M4 10 q4 -6 8 0 t8 -4 M30 6 q6 -4 10 1 t6 -2 M2 26 q5 -4 9 0 M36 28 q5 -4 10 0" fill="none" stroke="${VIOLET}" stroke-width="1.6" opacity="0.8" stroke-linecap="round"/>
        ${skull(24, 16, 0.9, '#5d4037')}
    `),

    // ===== サプライ外 =====
    // 暗い森に浮かぶ青い鬼火
    will_o_wisp: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#16233a"/>
        ${pine(5, 4, 15, '#0f2a1d')}${pine(13, 8, 12, '#163826')}${pine(36, 6, 14, '#163826')}${pine(44, 3, 16, '#0f2a1d')}
        ${ground('#132a1e')}
        ${glow(24, 14, 10, '#81d4fa', 0.15)}${glow(24, 14, 6, '#81d4fa', 0.3)}
        ${flame(24, 19, 11, '#4fc3f7', '#e1f5fe')}
        <circle cx="24" cy="17" r="2" fill="#e1f5fe"/>
        <circle cx="17" cy="21" r="0.6" fill="#81d4fa"/><circle cx="14" cy="23" r="0.5" fill="#81d4fa"/><circle cx="11" cy="24" r="0.4" fill="#81d4fa"/>
    `),
    // 角とコウモリの羽の小さな悪魔
    imp: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#3a2340"/>
        ${glow(24, 16, 12, '#e53935', 0.12)}
        <path d="M21 14 Q14 4 9 10 Q12 11 12 14 Q15 12 16 15 Q18 13 21 17z M27 14 Q34 4 39 10 Q36 11 36 14 Q33 12 32 15 Q30 13 27 17z" fill="#7f1d1d"/>
        <path d="M21.5 25 v3 M26.5 25 v3" stroke="#e53935" stroke-width="1.6"/>
        <ellipse cx="24" cy="20" rx="4.5" ry="5.5" fill="#e53935"/>
        <circle cx="24" cy="11" r="4.5" fill="#e53935"/>
        <path d="M20.5 8.5 l-1.5 -4 l3.2 2.6z M27.5 8.5 l1.5 -4 l-3.2 2.6z" fill="#fff8e1"/>
        <ellipse cx="22.3" cy="10.5" rx="0.9" ry="1.1" fill="#fff59d"/><ellipse cx="25.7" cy="10.5" rx="0.9" ry="1.1" fill="#fff59d"/>
        <path d="M21.5 13.2 q2.5 2 5 0 l-0.8 1 l-0.6 -0.5 l-0.6 0.7 l-0.6 -0.7 l-0.6 0.7 l-0.6 -0.6z" fill="#5d1010"/>
        <path d="M28 22 q6 2 5 6 l1.5 0.5 l-1.8 1" fill="none" stroke="#e53935" stroke-width="0.9"/>
    `),
    // 夜空に浮かぶ白い幽霊
    ghost: svg(`
        ${nightSky()}
        ${crescent(40, 6, 3.5)}
        ${ground(NIGHT_GROUND)}
        ${tombstone(9, 18, 6)}
        ${glow(24, 15, 9, GHOST, 0.15)}
        ${ghost(24, 15, 1.4)}
        <path d="M33 18 q2 1 3 3 M15 19 q-2 1 -2.5 3" fill="none" stroke="${GHOST}" stroke-width="0.6" opacity="0.6"/>
    `),
    // 流れ星と願いの瓶
    wish: svg(`
        ${nightSky(VIOLET_DARK)}
        <path d="M4 3 L30 12" stroke="#fff59d" stroke-width="1.4" opacity="0.5" stroke-linecap="round"/>
        <path d="M14 6.5 L30 12" stroke="#fff59d" stroke-width="0.8" stroke-linecap="round"/>
        ${sparkle(31, 12.5, 3, MOON)}
        <rect x="35.5" y="10" width="5" height="3" rx="0.6" fill="${WOOD}"/>
        <path d="M36 13 h4 v2 q4 2 4 7 v3 q0 2 -2 2 h-8 q-2 0 -2 -2 v-3 q0 -5 4 -7z" fill="#b3e5fc" opacity="0.6" stroke="#e1f5fe" stroke-width="0.7"/>
        ${glow(38, 22, 3.5, MOON, 0.6)}
        ${sparkle(38, 22, 1.8, MOON)}${sparkle(36, 25, 0.8, MOON)}${sparkle(40.5, 19.5, 0.8, MOON)}
    `),
    // 月夜を飛ぶコウモリ
    bat: svg(`
        ${nightSky()}
        ${moon(28, 13, 9)}
        ${bat(24, 15, 2.6)}
        <circle cx="23.3" cy="13.5" r="0.4" fill="#ff5252"/><circle cx="24.7" cy="13.5" r="0.4" fill="#ff5252"/>
        ${bat(8, 6, 0.6)}${bat(42, 26, 0.5, '#3a3f5c')}
    `),
    // 本を抱えたゾンビの弟子
    zombie_apprentice: svg(`
        ${graveyard()}
        ${zombie(22, '#6d7d4b')}
        <path d="M19 15 v8 h6 v-8" fill="#d7ccc8" opacity="0.9"/>
        ${arm(25, 16, 31, 16, ZOMBIE)}${arm(19, 16, 27, 18, ZOMBIE)}
        <rect x="27" y="13.5" width="6" height="7" fill="${VIOLET}" stroke="#2b1d40" stroke-width="0.5" transform="rotate(-10 30 17)"/>
        <path d="M29 15 h3 M29 16.5 h3" stroke="${GOLD}" stroke-width="0.4" transform="rotate(-10 30 17)"/>
    `),
    // 鏝と煉瓦を持つゾンビの石工
    zombie_mason: svg(`
        ${graveyard()}
        ${zombie(19, '#8d6e63')}
        ${arm(22, 16, 28, 15, ZOMBIE)}${arm(16, 16, 22, 17, ZOMBIE)}
        <path d="M28 15 l2 -1" stroke="${WOOD}" stroke-width="1"/>
        <path d="M29.5 13.5 l4.5 -0.5 l-2 3z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.4"/>
        ${[[31, 24.5], [36.5, 24.5], [33.75, 21.5], [39.25, 21.5], [42, 24.5]].map(([x, y]) =>
            `<rect x="${x - 2.5}" y="${y}" width="5" height="2.5" fill="#b5553c" stroke="#7a3322" stroke-width="0.4"/>`).join('')}
    `),
    // 望遠鏡をのぞくゾンビのスパイ
    zombie_spy: svg(`
        ${graveyard()}
        ${zombie(18, '#37474f', '#212121')}
        <path d="M14.5 10 q3.5 -6.5 7 0 l0.8 4.5 h-1 q0 -4 -3.3 -6 q-3.3 2 -3.3 6 h-1z" fill="#263238"/>
        ${arm(21, 16, 25, 12, ZOMBIE)}
        <path d="M20.5 11 L32 7" stroke="#8d6e63" stroke-width="2"/>
        <path d="M27 8.8 L32 7" stroke="${GOLD}" stroke-width="2.6"/>
        <path d="M20.5 11 l1 -0.4" stroke="${GOLD_EDGE}" stroke-width="2"/>
        <path d="M33 5 l4 -2 M33.5 7.5 l5 0 M33 10 l4 2" stroke="${MOON}" stroke-width="0.5" opacity="0.7"/>
    `)
};
