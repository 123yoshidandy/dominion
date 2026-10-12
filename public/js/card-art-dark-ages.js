/** 拡張「暗黒時代」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground, coin } from './card-art-helpers.js';

// くすんだ色合い
const SOIL = '#7d7a5e';
const DIRT = '#6f6450';
const SKIN = '#cfae8f';
const WOOD = '#6b5844';
const STONE = '#8a857a';
const STONE_EDGE = '#5a564e';
const STEEL = '#8e959b';
const STEEL_EDGE = '#4a4f57';

// 立っている人（x は体の中心、cloth は服の色）
const person = (x, cloth, { skin = SKIN, hair = '', scale = 1 } = {}) => `
    <g transform="translate(${x} 27) scale(${scale}) translate(${-x} -27)">
        <path d="M${x - 2} 23 v4 M${x + 2} 23 v4" stroke="#4a3f35" stroke-width="1.6"/>
        <path d="M${x - 4} 23 L${x - 3} 14.5 h6 L${x + 4} 23 z" fill="${cloth}"/>
        <circle cx="${x}" cy="11" r="3" fill="${skin}"/>
        ${hair}
    </g>`;

// 騎士の盾
const shield = (x, y, fill, mark = '') => `
    <path d="M${x} ${y} h10 v6 q0 5 -5 7 q-5 -2 -5 -7z" fill="${fill}" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
    ${mark}`;

// 騎士の上半身（兜・羽根飾り・陣羽織・盾）。dame は女騎士で、兜の後ろに髪が流れる
const knight = ({ plume, coat, shieldColor, mark = '', item = '', hair = '' }) => svg(`
    ${ground(DIRT)}
    ${item}
    <path d="M12 27 L14 16 h12 L28 27 z" fill="${coat}"/>
    <path d="M14 16 h12 v3 h-12z" fill="${STEEL}"/>
    ${hair ? `<path d="M16 9 q-6 6 -4 16 q2 -1 3 -4 q0 -6 2 -10z" fill="${hair}"/>` : ''}
    <rect x="15" y="4" width="10" height="12" rx="3" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
    <path d="M16.5 9.5 h7" stroke="#2e2a26" stroke-width="1.4"/>
    <path d="M20 10.5 v4" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
    <path d="M20 4 q1 -4 8 -3 q-4 1 -6 4z" fill="${plume}"/>
    ${shield(28, 14, shieldColor, mark)}
`);

// 骸骨の頭
const skull = (x, y, r = 2.5) => `
    <circle cx="${x}" cy="${y}" r="${r}" fill="#d8d2c0"/>
    <rect x="${x - r * 0.6}" y="${y + r * 0.6}" width="${r * 1.2}" height="${r * 0.7}" fill="#d8d2c0"/>
    <circle cx="${x - r * 0.38}" cy="${y}" r="${r * 0.28}" fill="#3a352e"/>
    <circle cx="${x + r * 0.38}" cy="${y}" r="${r * 0.28}" fill="#3a352e"/>`;

// 屋根つきの家（くすんだ色）
const house = (x, y, w, h, wall = '#a39880', roof = '#5e4a3a') => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}" stroke="#5a4a3a" stroke-width="0.8"/>
    <path d="M${x - 2} ${y} L${x + w / 2} ${y - w / 2.4} L${x + w + 2} ${y} Z" fill="${roof}"/>`;

export const DARK_AGES_ART = {
    // ===== コスト1 =====
    // 板でふさいだ窓と継ぎはぎの屋根の粗末な施設
    poor_house: svg(`
        ${ground(SOIL)}
        <rect x="10" y="14" width="28" height="13" fill="#8a7a62" stroke="#5a4a3a"/>
        <path d="M8 14 L24 6 L40 14 Z" fill="${WOOD}"/>
        <rect x="15" y="9" width="5" height="3.5" fill="#9a8a6e" stroke="#4a3c2e" stroke-width="0.6"/>
        <path d="M12 17 l5 3 M33 22 l3 3" stroke="#5a4a3a" stroke-width="0.8"/>
        <rect x="21" y="19" width="6" height="8" fill="#4a3c2e"/>
        <rect x="30" y="16" width="5" height="4.5" fill="#3d3a36"/>
        <path d="M29.5 17 l6 2.5 M29.5 19.5 l6 -2" stroke="#9a8a6e" stroke-width="1"/>
    `),

    // ===== コスト2 =====
    // 座って器を差し出す人
    beggar: svg(`
        ${ground(SOIL)}
        <path d="M12 27 q0 -11 7 -12 q7 1 7 12z" fill="#7a6a55"/>
        <path d="M15 24 l3 -2 M21 25 l2 -3" stroke="#5a4c3c" stroke-width="0.8"/>
        <circle cx="19" cy="11.5" r="3.2" fill="${SKIN}"/>
        <path d="M15.8 11 q3 -5 6.4 0" fill="#5a4c3c"/>
        <path d="M23 19 l7 1" stroke="${SKIN}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M28 19 h9 q-1 5 -4.5 5 q-3.5 0 -4.5 -5z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <circle cx="32.5" cy="20.5" r="1" fill="#b08d57"/>
    `),
    // 盾と槍を持つ若者
    squire: svg(`
        ${ground(SOIL)}
        <path d="M13 6 V27" stroke="${WOOD}" stroke-width="1.4"/>
        <path d="M13 1.5 l-1.8 4.5 h3.6z" fill="${STEEL}"/>
        ${person(20, '#5d6b7a', { hair: '<path d="M17 10 q3 -5 6 0" fill="#7a5a3a"/>' })}
        <path d="M17 17 l-4 1" stroke="${SKIN}" stroke-width="1.4" stroke-linecap="round"/>
        ${shield(24, 14, '#7a4a3a', '<path d="M29 15.5 v10 M25.5 19.5 h7" stroke="#c9b27a" stroke-width="1"/>')}
    `),
    // 荷物を棒に下げて担いで歩く人
    vagrant: svg(`
        ${ground(SOIL)}
        <path d="M18 23 l-3 4 M22 23 l3 4" stroke="#4a3f35" stroke-width="1.6"/>
        <path d="M16 23 L17 14.5 h6 L24 23 z" fill="#6e6a52"/>
        <circle cx="20" cy="11" r="3" fill="${SKIN}"/>
        <path d="M16.5 10 h7 l-1 -2.5 h-5z" fill="#5a4c3c"/>
        <path d="M18 15 L31 6" stroke="${WOOD}" stroke-width="1.2"/>
        <circle cx="32" cy="7" r="4" fill="#9a8a6a" stroke="#6b5a40" stroke-width="0.6"/>
        <path d="M30 4 l2 1.5 l2 -1.5" fill="none" stroke="#6b5a40" stroke-width="0.6"/>
        <path d="M11 13 L9 27" stroke="${WOOD}" stroke-width="1.2"/>
        <path d="M17 17 l-6 -1" stroke="${SKIN}" stroke-width="1.3" stroke-linecap="round"/>
    `),

    // ===== コスト3 =====
    // 籠に入ったきのこ
    forager: svg(`
        ${ground(SOIL)}
        <path d="M12 17 q9 -13 18 0" fill="none" stroke="#7a5c38" stroke-width="1.6"/>
        <ellipse cx="17" cy="16" rx="3.5" ry="2" fill="#9a5a3a"/><rect x="16.3" y="16" width="1.4" height="3" fill="#e0d6c0"/>
        <ellipse cx="24" cy="15" rx="3.5" ry="2" fill="#b08d57"/><rect x="23.3" y="15" width="1.4" height="3" fill="#e0d6c0"/>
        <path d="M9 18 h24 l-3 9 h-18z" fill="#8b6b45" stroke="#5e4a30" stroke-width="0.8"/>
        <path d="M10 21 h22 M11 24 h20 M15 18 v9 M21 18 v9 M27 18 v9" stroke="#5e4a30" stroke-width="0.6"/>
        <rect x="38.3" y="22" width="1.6" height="5" fill="#e0d6c0"/>
        <path d="M35 22.5 q4 -6 8 0z" fill="#9a5a3a"/>
        <circle cx="38" cy="20.5" r="0.6" fill="#e0d6c0"/><circle cx="40.5" cy="21" r="0.6" fill="#e0d6c0"/>
    `),
    // 粗末な小屋と杖をつく白ひげの老人
    hermit: svg(`
        ${ground(SOIL)}
        <rect x="5" y="17" width="14" height="10" fill="#7a6a52" stroke="#4a3c2e" stroke-width="0.8"/>
        <path d="M3 18 L12 9 L21 18 Z" fill="#8f7d4f"/>
        <path d="M6 15 l2 -2 M10 12 l2 -1 M15 14 l2 1" stroke="#6b5a35" stroke-width="0.6"/>
        <rect x="10" y="21" width="4" height="6" fill="#3a2f24"/>
        ${person(30, '#5e5a4a', { hair: '<path d="M28 12.5 q2 6 4 0z" fill="#e6e2d6"/><path d="M27 10 q3 -4 6 0" fill="#c9c4b6"/>' })}
        <path d="M36 9 V27" stroke="${WOOD}" stroke-width="1.4"/>
        <path d="M33 17 l3 -1" stroke="${SKIN}" stroke-width="1.3" stroke-linecap="round"/>
    `),
    // 日よけの屋台が並ぶ石畳の広場
    market_square: svg(`
        ${ground('#8a857a')}
        <path d="M0 29 h48 M8 27 v5 M20 27 v5 M32 27 v5 M44 27 v5" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        ${[[3, '#7a4a3a'], [17, '#5d6b7a'], [31, '#6e7a4a']].map(([x, c]) => `
            <rect x="${x + 1}" y="16" width="12" height="11" fill="#a39880" stroke="#5a4a3a" stroke-width="0.6"/>
            <path d="M${x} 16 l2 -6 h10 l2 6z" fill="${c}"/>
            <path d="M${x + 5} 10 l-1 6 M${x + 9} 10 l1 6" stroke="#d6cdb8" stroke-width="1"/>
            <rect x="${x + 1}" y="20" width="12" height="2" fill="${WOOD}"/>
            <circle cx="${x + 4}" cy="19" r="1.2" fill="#b08d57"/><circle cx="${x + 8}" cy="19" r="1.2" fill="#9a5a3a"/>
        `).join('')}
    `),
    // 本を読む白ひげの老人
    sage: svg(`
        <path d="M10 32 q0 -14 14 -14 q14 0 14 14z" fill="#4e5a6a"/>
        <circle cx="24" cy="10" r="5.5" fill="${SKIN}"/>
        <path d="M18.5 9 q5.5 -9 11 0 q-1 -3 -5.5 -3 q-4.5 0 -5.5 3z" fill="#c9c4b6"/>
        <path d="M20 13 q4 10 8 0 q-4 2 -8 0z" fill="#e6e2d6"/>
        <path d="M13 29 l11 -3 l11 3 v-8 l-11 -3 l-11 3z" fill="#e0d6c0" stroke="#8a7a5a" stroke-width="0.8"/>
        <path d="M24 18 v8" stroke="#8a7a5a" stroke-width="0.8"/>
        <path d="M15 22.5 l7 -2 M15 25 l7 -2 M26 20.5 l7 2 M26 23 l7 2" stroke="#a89a78" stroke-width="0.6"/>
    `),
    // 箱を並べた棚
    storeroom: svg(`
        <rect x="5" y="3" width="2" height="25" fill="${WOOD}"/><rect x="41" y="3" width="2" height="25" fill="${WOOD}"/>
        <rect x="5" y="13" width="38" height="2" fill="${WOOD}"/><rect x="5" y="26" width="38" height="2" fill="${WOOD}"/>
        <rect x="9" y="6" width="8" height="7" fill="#9a7d55" stroke="#5e4a30" stroke-width="0.6"/>
        <rect x="19" y="8" width="6" height="5" fill="#8a6d48" stroke="#5e4a30" stroke-width="0.6"/>
        <ellipse cx="33" cy="9" rx="4" ry="4" fill="#7a6a55"/><rect x="31.5" y="4" width="3" height="2" fill="#5a4c3c"/>
        <rect x="9" y="18" width="12" height="8" fill="#8a6d48" stroke="#5e4a30" stroke-width="0.6"/>
        <path d="M9 22 h12 M15 18 v8" stroke="#5e4a30" stroke-width="0.6"/>
        <rect x="24" y="20" width="7" height="6" fill="#9a7d55" stroke="#5e4a30" stroke-width="0.6"/>
        <rect x="33" y="17" width="7" height="9" fill="#a39880" stroke="#5e4a30" stroke-width="0.6"/>
    `),
    // 継ぎはぎの服を着た小さな子ども
    urchin: svg(`
        ${ground(SOIL)}
        ${person(24, '#7a6a55', { scale: 1.1,hair: '<path d="M20.5 10 q3.5 -5 7 0 l1 -1 l-4.5 -3 l-4.5 3z" fill="#5a4c3c"/>' })}
        <rect x="22" y="19" width="2.5" height="2.5" fill="#5d6b7a"/>
        <rect x="25" y="21" width="2" height="2" fill="#7a4a3a"/>
    `),

    // ===== コスト4 =====
    // 剣と盾が並ぶ武器棚
    armory: svg(`
        <rect x="4" y="26" width="40" height="3" fill="${WOOD}"/>
        <rect x="4" y="5" width="40" height="2" fill="${WOOD}"/>
        ${[9, 15, 21].map(x => `
            <path d="M${x} 8 V22" stroke="${STEEL}" stroke-width="2"/>
            <path d="M${x - 2.5} 22 h5" stroke="#5a4c3c" stroke-width="1.4"/>
            <path d="M${x} 22 V26" stroke="${WOOD}" stroke-width="1.6"/>
        `).join('')}
        ${shield(27, 9, '#7a4a3a', '<path d="M32 10.5 v10 M28.5 14.5 h7" stroke="#c9b27a" stroke-width="1"/>')}
        <circle cx="40" cy="17" r="4" fill="#5d6b7a" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
        <circle cx="40" cy="17" r="1.2" fill="${STEEL}"/>
    `),
    // 骸骨を積んだ荷車
    death_cart: svg(`
        ${ground(DIRT)}
        ${skull(16, 12)}${skull(22, 11)}${skull(28, 12.5)}${skull(19, 8)}
        <path d="M8 15 h28 l-2 7 h-24z" fill="${WOOD}" stroke="#3e3226" stroke-width="0.8"/>
        <path d="M12 15 v7 M20 15 v7 M28 15 v7" stroke="#3e3226" stroke-width="0.6"/>
        <path d="M36 17 l8 -4" stroke="#3e3226" stroke-width="1.4"/>
        ${[14, 30].map(x => `
            <circle cx="${x}" cy="24" r="3.5" fill="none" stroke="#3e3226" stroke-width="1.2"/>
            <path d="M${x - 3.5} 24 h7 M${x} 20.5 v7" stroke="#3e3226" stroke-width="0.6"/>
        `).join('')}
    `),
    // 耕した土地と銀貨
    feodum: svg(`
        <path d="M0 16 h48 v16 h-48z" fill="#6e7a4a"/>
        <path d="M0 20 h48 M0 24 h48 M0 28 h48" stroke="#5a6438" stroke-width="1"/>
        <path d="M0 16 q12 -4 24 -1 q12 3 24 -2 v3 h-48z" fill="#7d8a55"/>
        ${[[18, 21], [24, 18], [30, 21]].map(([x, y]) => `
            <circle cx="${x}" cy="${y}" r="4.5" fill="#b8bcc0" stroke="#6e7378" stroke-width="1"/>
            <circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="#e0e3e6" stroke-width="0.7"/>
        `).join('')}
    `),
    // 石を積んだ砦
    fortress: svg(`
        ${ground(DIRT)}
        <rect x="6" y="9" width="10" height="18" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <rect x="32" y="9" width="10" height="18" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <rect x="16" y="14" width="16" height="13" fill="#7a756a" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        ${[6, 10, 14, 32, 36, 40].map(x => `<rect x="${x}" y="6" width="2.5" height="3" fill="${STONE}"/>`).join('')}
        ${[16, 20, 24, 28].map(x => `<rect x="${x + 0.5}" y="11.5" width="2.5" height="2.5" fill="#7a756a"/>`).join('')}
        <path d="M21 27 v-6 a3 3 0 0 1 6 0 v6z" fill="#3a352e"/>
        <rect x="10" y="14" width="2" height="4" fill="#3a352e"/><rect x="36" y="14" width="2" height="4" fill="#3a352e"/>
        <path d="M6 15 h10 M6 21 h10 M32 15 h10 M32 21 h10 M16 19 h16" stroke="${STONE_EDGE}" stroke-width="0.5"/>
    `),
    // 鉄の鍋と釘
    ironmonger: svg(`
        <rect x="4" y="27" width="40" height="2" fill="${WOOD}"/>
        <path d="M6 15 h20 q0 12 -10 12 q-10 0 -10 -12z" fill="#4a4f57" stroke="#2e3238" stroke-width="0.8"/>
        <rect x="5" y="13.5" width="22" height="2" rx="1" fill="#5d646d"/>
        <path d="M10 13.5 q6 -9 12 0" fill="none" stroke="#5d646d" stroke-width="1.2"/>
        ${[[31, 14], [35, 12], [39, 15], [42, 13]].map(([x, y]) => `
            <rect x="${x - 1.8}" y="${y}" width="3.6" height="1.2" fill="${STEEL}"/>
            <path d="M${x} ${y + 1} V${y + 10} l-0.6 1.5" stroke="${STEEL}" stroke-width="1"/>
        `).join('')}
    `),
    // 斧を振り上げる荒くれ者
    marauder: svg(`
        ${ground(DIRT)}
        <path d="M19 23 l-3 4 M25 23 l3 4" stroke="#3e3226" stroke-width="2"/>
        <path d="M16 23 L17 14 h10 L28 23 z" fill="#6b4a3a"/>
        <path d="M17 14 h10 v3 h-10z" fill="#8a7a62"/>
        <circle cx="22" cy="10" r="3.5" fill="${SKIN}"/>
        <path d="M18.5 9 q3.5 -5 7 0 l-0.5 -2 l-3 -2 l-3 2z" fill="#5a3a2a"/>
        <path d="M19.5 11.5 q2.5 5 5 0" fill="#5a3a2a"/>
        <path d="M27 15 L34 7" stroke="${SKIN}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M33 10 L38 2" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M35 2 q6 -1 7 5 l-6 -1z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
    `),
    // 旗を掲げて一列に並ぶ人々
    procession: svg(`
        ${ground(SOIL)}
        ${person(12, '#5d6b7a', { scale: 0.85 })}
        ${person(24, '#6e5a6a', { scale: 0.85 })}
        ${person(36, '#6e7a4a', { scale: 0.85 })}
        ${[16, 28, 40].map((x, i) => `
            <path d="M${x} 2 V24" stroke="${WOOD}" stroke-width="1"/>
            <path d="M${x} 3 h-6 v6 l-3 -1.5 l3 -1.5" fill="${['#7a4a3a', '#8a7a4a', '#4e5a6a'][i]}"/>
        `).join('')}
    `),
    // 灰色のネズミ
    rats: svg(`
        ${ground(DIRT)}
        <path d="M10 24 q-6 0 -8 -6" fill="none" stroke="#a08a80" stroke-width="1.2"/>
        <ellipse cx="20" cy="21" rx="10" ry="6" fill="#6e6a64"/>
        <path d="M28 17 q8 1 10 5 q-6 3 -10 2z" fill="#6e6a64"/>
        <circle cx="29" cy="15" r="2.6" fill="#7e7a74"/><circle cx="29" cy="15" r="1.3" fill="#b8a0a0"/>
        <circle cx="33.5" cy="19.5" r="0.8" fill="#1e1c1a"/>
        <circle cx="38.2" cy="22" r="0.8" fill="#b8a0a0"/>
        <path d="M37 22 l5 -2 M37 22.5 l5 1" stroke="#4a4640" stroke-width="0.4"/>
        <path d="M15 26.5 v1 M24 26.5 v1" stroke="#b8a0a0" stroke-width="1.4"/>
    `),
    // がらくたの山と拾う棒
    scavenger: svg(`
        ${ground(DIRT)}
        <path d="M4 27 q6 -12 14 -10 q6 -6 12 0 q4 2 4 10z" fill="#7a6e5c"/>
        <rect x="10" y="19" width="5" height="4" fill="#8a6d48" transform="rotate(-15 12 21)"/>
        <circle cx="22" cy="16" r="2.5" fill="none" stroke="#5d646d" stroke-width="1.2"/>
        <path d="M24 21 l6 -2" stroke="${STEEL}" stroke-width="1.4"/>
        <path d="M17 24 h4 v-2.5 h-4z" fill="#9a5a3a"/>
        <path d="M28 12 a2 2 0 1 0 0.1 0" fill="none" stroke="#5a4c3c" stroke-width="0.8"/>
        <path d="M44 3 L33 25" stroke="${WOOD}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M33 25 l-1.5 2 M33 25 l0.5 2.5" stroke="${STEEL}" stroke-width="0.8"/>
    `),
    // 吟遊詩人のリュート
    wandering_minstrel: svg(`
        <g transform="rotate(-30 24 16)">
            <ellipse cx="17" cy="16" rx="9" ry="7.5" fill="#9a6e3e" stroke="#5e4226" stroke-width="0.8"/>
            <circle cx="18" cy="16" r="2.2" fill="#3e2a18"/>
            <rect x="25" y="14.5" width="14" height="3" fill="#6b4a2a"/>
            <path d="M39 14 l5 -1.5 v6 l-5 -1.5z" fill="#5e4226"/>
            <path d="M12 15 H42 M12 17 H42" stroke="#e0d6c0" stroke-width="0.4"/>
            <rect x="11" y="14" width="2" height="4" fill="#3e2a18"/>
        </g>
        <path d="M38 24 q1 -3 3 -2 v5 M42 20 q1 -3 3 -2 v5" fill="none" stroke="#8a7a62" stroke-width="0.9"/>
        <circle cx="37.5" cy="27" r="1.3" fill="#8a7a62"/><circle cx="44.5" cy="25" r="1.3" fill="#8a7a62"/>
    `),

    // ===== コスト5 =====
    // ばらばらの格好をした3人組
    band_of_misfits: svg(`
        ${ground(SOIL)}
        ${person(12, '#7a4a3a', { scale: 1.05, hair: '<path d="M8.5 9 h7 l-3.5 -5z" fill="#4e5a6a"/>' })}
        ${person(24, '#6e7a4a', { scale: 0.8, hair: '<rect x="21" y="7" width="6" height="2" fill="#8a7a4a"/><rect x="22" y="4" width="4" height="3.5" fill="#8a7a4a"/>' })}
        ${person(36, '#5d6b7a', { scale: 0.95, hair: '<path d="M33 9.5 q3 -4 6 0z" fill="#9a5a3a"/><path d="M39 9 l3 -3" stroke="#b8a46a" stroke-width="1"/>' })}
        <path d="M14 15 l3 -2" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/>
        <rect x="9" y="17" width="2" height="2" fill="#5d6b7a"/><rect x="34" y="19" width="2.5" height="2" fill="#7a4a3a"/>
    `),
    // テントと焚き火
    bandit_camp: svg(`
        ${ground(DIRT)}
        <path d="M2 27 L14 7 L26 27 Z" fill="#7a6e52" stroke="#4a3f2e" stroke-width="0.8"/>
        <path d="M14 7 L11 27 h6z" fill="#3a3226"/>
        <path d="M14 7 l-2 -3 M14 7 l2 -3" stroke="${WOOD}" stroke-width="1"/>
        <path d="M30 27 l12 -3 M30 24 l12 3" stroke="#4a3626" stroke-width="1.6"/>
        <path d="M31 25 q2 -7 5 -4 q1 -7 4 -1 q2 -2 2 5z" fill="#c8702e"/>
        <path d="M34 25 q1.5 -4 3 -1 q1.5 -2 2 1z" fill="#e8c46a"/>
        <path d="M37 13 q-2 -3 0 -6 M40 10 q2 -3 0 -6" fill="none" stroke="#8a857a" stroke-width="0.8"/>
    `),
    // 地下の通路と壁のくぼみに並ぶ頭蓋骨
    catacombs: svg(`
        <rect x="0" y="0" width="48" height="32" fill="#4a4640"/>
        <path d="M14 32 V14 a10 10 0 0 1 20 0 V32z" fill="#1e1c1a"/>
        <path d="M18 32 V16 a6 6 0 0 1 12 0 V32z" fill="#2e2b27"/>
        ${[[7, 8], [7, 20], [41, 8], [41, 20]].map(([x, y]) => `
            <path d="M${x - 4.5} ${y + 4} v-4 a4.5 4.5 0 0 1 9 0 v4z" fill="#2e2b27"/>
            ${skull(x, y + 1, 2.2)}
        `).join('')}
        <path d="M0 28 h14 M34 28 h14 M0 16 h3 M45 16 h3" stroke="#5e5a52" stroke-width="0.6"/>
    `),
    // 羽根飾りのある貴族の帽子
    count: svg(`
        <ellipse cx="24" cy="23" rx="18" ry="4" fill="#3e2e4a"/>
        <path d="M14 22 q0 -12 10 -12 q10 0 10 12z" fill="#4e3a5e"/>
        <path d="M14 20 h20 v2.5 h-20z" fill="#b8a46a"/>
        <rect x="22.5" y="19.5" width="3" height="3.5" fill="#c9b27a" stroke="#8a7a4a" stroke-width="0.5"/>
        <path d="M32 18 q6 -12 12 -12 q-4 3 -6 7 q-2 4 -6 5z" fill="#d6cdb8"/>
        <path d="M32 18 q5 -6 11 -11" fill="none" stroke="#a89a80" stroke-width="0.6"/>
    `),
    // ひびの入った硬貨
    counterfeit: coin('#a8986a', '#6e6040', '#c9ba8a',
        '<path d="M22 4.5 l2 5 l-3 3 l3 4 l-2 4 l3 4 l-1 5" fill="none" stroke="#3e3626" stroke-width="1.2"/>'),
    // 目だけが光るフードの人物
    cultist: svg(`
        ${ground(DIRT)}
        <path d="M12 27 q2 -14 6 -18 q6 -6 12 0 q4 4 6 18z" fill="#3a2e3e"/>
        <path d="M18 14 q6 -9 12 0 q-1 5 -6 5 q-5 0 -6 -5z" fill="#1a1618"/>
        <circle cx="22" cy="14" r="1" fill="#c8702e"/><circle cx="26" cy="14" r="1" fill="#c8702e"/>
        <path d="M24 9 v18" stroke="#2a222e" stroke-width="0.8"/>
        <path d="M21 22 h6 M24 19 v7" stroke="#8a3a3a" stroke-width="1.2"/>
    `),
    // 墓石とシャベル
    graverobber: svg(`
        ${ground(DIRT)}
        <path d="M8 27 V12 a7 7 0 0 1 14 0 V27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <path d="M15 11 v8 M12 14 h6" stroke="${STONE_EDGE}" stroke-width="1.2"/>
        <path d="M24 27 q6 -5 12 0z" fill="#5a4c3c"/>
        <path d="M40 2 L33 22" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M38.5 1 h3" stroke="${WOOD}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M31 20 l5 1.8 l-2 6 q-4 -0.5 -4.5 -3z" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
    `),
    // がらくたを積み上げた店
    junk_dealer: svg(`
        ${ground(DIRT)}
        <rect x="6" y="12" width="30" height="15" fill="#8a7a62" stroke="#4a3c2e" stroke-width="0.8"/>
        <path d="M4 12 l4 -6 h26 l4 6z" fill="#5e4a3a"/>
        <rect x="9" y="15" width="12" height="6" fill="#3d3a36"/>
        <rect x="26" y="17" width="6" height="10" fill="#4a3c2e"/>
        <path d="M34 27 q3 -10 6 -8 q4 -2 6 8z" fill="#7a6e5c"/>
        <circle cx="40" cy="19" r="2" fill="none" stroke="#5d646d" stroke-width="1"/>
        <path d="M37 23 l5 -2 M42 24 l3 1" stroke="${STEEL}" stroke-width="1.2"/>
        <rect x="36" y="22" width="3" height="3" fill="#8a6d48"/>
        <path d="M10 8 l-2 -3 h4z" fill="#8a857a"/>
    `),
    // 羽根飾りのある騎士の兜と交差した剣
    knights: svg(`
        <path d="M6 28 L42 4 M42 28 L6 4" stroke="${STEEL}" stroke-width="2.2"/>
        <path d="M4 26.5 l5 3 M44 26.5 l-5 3" stroke="#5a4c3c" stroke-width="1.6"/>
        <rect x="15" y="7" width="18" height="21" rx="6" fill="${STEEL}" stroke="${STEEL_EDGE}" stroke-width="1"/>
        <path d="M17 16 h14" stroke="#2e2a26" stroke-width="2.2"/>
        <path d="M24 18 v8" stroke="${STEEL_EDGE}" stroke-width="0.8"/>
        <circle cx="20" cy="22" r="0.6" fill="#2e2a26"/><circle cx="28" cy="22" r="0.6" fill="#2e2a26"/>
        <path d="M24 7 q2 -7 13 -6 q-7 1 -10 7z" fill="#8a3a3a"/>
    `),
    // 水晶玉にかざした手
    mystic: svg(`
        <path d="M16 26 h16 l-2 -4 h-12z" fill="#5e4a3a"/>
        <circle cx="24" cy="15" r="8" fill="#8fa0b4" stroke="#5a6478" stroke-width="0.8"/>
        <circle cx="24" cy="15" r="4" fill="#b8c4d4" opacity="0.7"/>
        <circle cx="21" cy="12" r="1.5" fill="#e6ecf2"/>
        <path d="M6 12 q3 -2 6 1 l3 2 M42 12 q-3 -2 -6 1 l-3 2" fill="none" stroke="${SKIN}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M14 5 l1 2 M34 5 l-1 2 M24 2 v2" stroke="#a090b8" stroke-width="1"/>
    `),
    // 炎に包まれた家
    pillage: svg(`
        ${ground(DIRT)}
        ${house(12, 15, 22, 12, '#7a6a52', '#4a3a2e')}
        <rect x="20" y="20" width="5" height="7" fill="#2e2620"/>
        <path d="M10 15 q2 -8 5 -4 q1 -8 5 -2 q2 -6 4 0 q3 -7 5 -1 q3 -5 6 2 q2 -1 1 5z" fill="#c8702e"/>
        <path d="M15 14 q2 -5 3 -1 q2 -4 3 0 q2 -4 4 0 q2 -3 3 1z" fill="#e8c46a"/>
        <path d="M30 20 q2 -4 3 -1 q1 -3 2 1z" fill="#c8702e"/>
        <path d="M14 5 q-2 -3 1 -5 M24 4 q2 -3 0 -4 M33 6 q-2 -3 1 -5" fill="none" stroke="#6e6a64" stroke-width="1.2"/>
    `),
    // 足場を組んで建て直す家
    rebuild: svg(`
        ${ground(SOIL)}
        ${house(10, 15, 24, 12, '#a39880', '#6b5844')}
        <rect x="19" y="20" width="5" height="7" fill="#4a3c2e"/>
        <path d="M10 15 h12 l-4 -5z" fill="#a39880" opacity="0.6"/>
        <path d="M8 6 V27 M38 6 V27 M8 12 H38 M8 20 H38" stroke="#8a6d48" stroke-width="1.2"/>
        <path d="M8 12 L16 20 M30 12 L38 20" stroke="#8a6d48" stroke-width="0.8"/>
        <rect x="40" y="23" width="6" height="4" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
    `),
    // 短剣と黒いマント
    rogue: svg(`
        <path d="M8 4 q8 -2 16 0 q-3 8 -1 24 q-8 2 -16 -2 q4 -10 1 -22z" fill="#2e2a2e"/>
        <path d="M12 6 q4 12 1 22" fill="none" stroke="#423c42" stroke-width="0.8"/>
        <circle cx="16" cy="6" r="1.5" fill="#b8a46a"/>
        <g transform="rotate(35 34 16)">
            <path d="M34 2 l2 3 v13 h-4 v-13z" fill="#a8b0b6" stroke="${STEEL_EDGE}" stroke-width="0.6"/>
            <path d="M29 18 h10" stroke="#5a4c3c" stroke-width="2" stroke-linecap="round"/>
            <rect x="33" y="19" width="2" height="6" fill="#4a3626"/>
            <circle cx="34" cy="26" r="1.3" fill="#8a3a3a"/>
        </g>
    `),

    // ===== コスト6 =====
    // 石の祭壇とろうそく
    altar: svg(`
        <rect x="10" y="16" width="28" height="12" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <rect x="8" y="14" width="32" height="3" fill="#9a958a" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <path d="M24 18 v8 M21 21 h6" stroke="#5a564e" stroke-width="1.2"/>
        ${[13, 35].map(x => `
            <rect x="${x - 1.5}" y="7" width="3" height="7" fill="#e0d6c0"/>
            <path d="M${x} 2.5 q-2 2.5 0 4.5 q2 -2 0 -4.5z" fill="#d8a04a"/>
        `).join('')}
        <path d="M21 14 q3 -3 6 0z" fill="#8a3a3a"/>
    `),
    // 森の中の鹿
    hunting_grounds: svg(`
        ${ground('#5e6a44')}
        ${[[5, 12], [12, 8], [41, 10]].map(([x, y]) => `
            <rect x="${x - 1}" y="${y + 9}" width="2" height="${18 - y}" fill="#4a3626"/>
            <path d="M${x - 5} ${y + 10} L${x} ${y - 4} L${x + 5} ${y + 10}z" fill="#3e5236"/>
        `).join('')}
        <ellipse cx="27" cy="19" rx="7" ry="3.5" fill="#8a6440"/>
        <path d="M22 21 v6 M24 21.5 v5.5 M30 21.5 v5.5 M32 21 v6" stroke="#6b4a2e" stroke-width="1.2"/>
        <path d="M32 17 l3 -5 l2 1 l-3 6z" fill="#8a6440"/>
        <ellipse cx="36" cy="11.5" rx="2.6" ry="1.6" fill="#8a6440"/>
        <path d="M35 10 l-1 -4 M34.4 7.5 l-2 -1 M37 10 l1 -4 M37.6 7.5 l2 -1" stroke="#6b5440" stroke-width="0.8"/>
    `),

    // ===== 騎士（コスト5、マーティン卿のみコスト4） =====
    // 斧を持つ女騎士（青い羽根飾り）
    dame_anna: knight({
        plume: '#4e6a8a', coat: '#4e5a6a', shieldColor: '#6a7a8e', hair: '#7a5a3a',
        mark: '<path d="M33 16 v9 M30 20 h6" stroke="#d6cdb8" stroke-width="1"/>',
        item: '<path d="M8 6 V27" stroke="#6b4a2a" stroke-width="1.4"/><path d="M8 6 q-6 1 -5 6 q3 -1 5 -2z" fill="#8e959b"/>'
    }),
    // 月桂冠の盾を持つ女騎士（緑の羽根飾り）
    dame_josephine: knight({
        plume: '#5e7a4a', coat: '#4e6a44', shieldColor: '#6e8a5a', hair: '#b8a46a',
        mark: '<path d="M30.5 18 q0.5 5 2.5 6 q2 -1 2.5 -6" fill="none" stroke="#c9b27a" stroke-width="1"/>',
        item: '<path d="M8 8 l-2 4 h4z M8 12 V27" fill="#c9b27a" stroke="#c9b27a" stroke-width="1"/>'
    }),
    // 二本の旗を掲げる女騎士（黄の羽根飾り）
    dame_molly: knight({
        plume: '#b8a04a', coat: '#7a6a3a', shieldColor: '#9a8a4a',
        hair: '#5a3a2a',
        mark: '<circle cx="33" cy="20" r="2.2" fill="none" stroke="#3e3226" stroke-width="1"/>',
        item: '<path d="M5 3 V27 M10 6 V27" stroke="#6b4a2a" stroke-width="1"/><path d="M5 3.5 h-0 l5 1.5 l-5 1.5z M10 6.5 l4 1.5 l-4 1.5z" fill="#8a3a3a"/>'
    }),
    // 弓を持つ女騎士（紫の羽根飾り）
    dame_natalie: knight({
        plume: '#6e4a7a', coat: '#4e3a5e', shieldColor: '#7a6a8a', hair: '#2e2620',
        mark: '<path d="M30.5 18 l2.5 4 l2.5 -4" fill="none" stroke="#d6cdb8" stroke-width="1"/>',
        item: '<path d="M10 4 q-8 11 0 22" fill="none" stroke="#6b4a2a" stroke-width="1.4"/><path d="M10 4 V26" stroke="#d6cdb8" stroke-width="0.5"/>'
    }),
    // 金貨の袋を下げた女騎士（赤茶の羽根飾り）
    dame_sylvia: knight({
        plume: '#9a4a3a', coat: '#6b3a32', shieldColor: '#8a5a4a', hair: '#c8702e',
        mark: '<circle cx="33" cy="20" r="2.4" fill="#c9a441" stroke="#8a6a1e" stroke-width="0.6"/>',
        item: '<path d="M5 22 q0 -5 4 -6 q4 1 4 6 q-4 3 -8 0z" fill="#8a6d48"/><path d="M7 16 h4" stroke="#5e4a30"/><circle cx="6" cy="25.5" r="1.4" fill="#c9a441"/><circle cx="10" cy="26" r="1.4" fill="#c9a441"/>'
    }),
    // 槍を立てた騎士（白の羽根飾り）
    sir_bailey: knight({
        plume: '#d6cdb8', coat: '#5d6b7a', shieldColor: '#d6cdb8',
        mark: '<path d="M33 15 v10" stroke="#5d6b7a" stroke-width="2"/>',
        item: '<path d="M9 5 V27" stroke="#6b4a2a" stroke-width="1.6"/><path d="M9 0 l-2 5 h4z" fill="#8e959b"/><path d="M9 7 l5 1.5 l-5 1.5z" fill="#5d6b7a"/>'
    }),
    // 剣を掲げた騎士（赤の羽根飾り）
    sir_destry: knight({
        plume: '#8a3a3a', coat: '#7a3a32', shieldColor: '#8a3a3a',
        mark: '<path d="M30 17 l6 6 M36 17 l-6 6" stroke="#d6cdb8" stroke-width="1"/>',
        item: '<path d="M9 2 V21" stroke="#a8b0b6" stroke-width="2"/><path d="M6 21 h6" stroke="#5a4c3c" stroke-width="1.6"/><path d="M9 21 v4" stroke="#4a3626" stroke-width="1.6"/>'
    }),
    // 鎚矛を持つ騎士（茶の羽根飾り）
    sir_martin: knight({
        plume: '#8a6d48', coat: '#5e4a3a', shieldColor: '#8a7a62',
        mark: '<rect x="31" y="18" width="4" height="4" fill="#5e4a3a"/>',
        item: '<path d="M9 10 V27" stroke="#6b4a2a" stroke-width="1.4"/><circle cx="9" cy="8" r="3" fill="#8e959b" stroke="#4a4f57" stroke-width="0.6"/><path d="M9 4 v1 M5 8 h1 M12 8 h1" stroke="#4a4f57" stroke-width="1"/>'
    }),
    // 鎖付きの鉄球を振るう騎士（黒の羽根飾り）
    sir_michael: knight({
        plume: '#2e2a2e', coat: '#3a3a42', shieldColor: '#5a5a62',
        mark: '<path d="M30 18 h6 l-3 5z" fill="#8a3a3a"/>',
        item: '<path d="M10 27 V16" stroke="#6b4a2a" stroke-width="1.4"/><path d="M10 16 q-3 -4 -4 -8" fill="none" stroke="#4a4f57" stroke-width="0.8" stroke-dasharray="1 0.6"/><circle cx="6" cy="6" r="2.6" fill="#5d646d"/><path d="M3 6 h-1 M9 6 h1 M6 3 v-1" stroke="#5d646d" stroke-width="1"/>'
    }),
    // 金の盾と金の杯を持つ騎士（金の羽根飾り）
    sir_vander: knight({
        plume: '#c9a441', coat: '#6e5a32', shieldColor: '#b8963a',
        mark: '<circle cx="33" cy="20" r="2.2" fill="none" stroke="#6e5a32" stroke-width="1"/>',
        item: '<path d="M5 14 h8 q0 6 -4 6 q-4 0 -4 -6z" fill="#c9a441" stroke="#8a6a1e" stroke-width="0.6"/><path d="M9 20 v5 M6 26 h6" stroke="#c9a441" stroke-width="1.6"/>'
    }),

    // ===== 廃墟（コスト0） =====
    // 崩れた石の壁
    ruins: svg(`
        ${ground(DIRT)}
        <path d="M6 27 V10 h6 v4 h4 v-2 h5 v6 h5 v4 h6 v-6 h4 v11z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.8"/>
        <path d="M6 15 h10 M6 21 h20 M16 18 h10 M30 21 h6 M11 15 v6 M21 21 v6 M33 21 v6" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        <rect x="38" y="24" width="4" height="3" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.5"/>
        <rect x="42" y="25" width="3" height="2" fill="#7a756a"/>
        <path d="M9 10 q-1 -3 1 -5 M13 26 q1 -3 0 -5" fill="none" stroke="#5e6a44" stroke-width="1"/>
    `),
    // 崩れかけた坑道の入り口
    abandoned_mine: svg(`
        <path d="M0 6 q12 -6 24 -2 q12 -4 24 2 v26 h-48z" fill="#6e6450"/>
        <path d="M14 32 V14 h20 V32z" fill="#1e1c1a"/>
        <path d="M13 32 V13 M35 32 V13" stroke="${WOOD}" stroke-width="2"/>
        <path d="M12 13.5 L36 12" stroke="${WOOD}" stroke-width="2"/>
        <path d="M30 13 L26 22" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M16 28 l6 4 M30 27 l4 5" stroke="#5a4c3c" stroke-width="1"/>
        <path d="M38 26 h7 l-1 4 h-5z" fill="#4a3c2e"/><circle cx="40" cy="31" r="1" fill="#3a352e"/>
    `),
    // 倒れた本棚と破れた本
    ruined_library: svg(`
        ${ground(DIRT)}
        <path d="M6 27 L10 6 h5 L12 27z" fill="${WOOD}" opacity="0.9"/>
        <path d="M14 27 L34 18 L36 21 L17 27z" fill="#5e4a3a"/>
        <rect x="20" y="22" width="6" height="4" fill="#6b3a32" transform="rotate(-20 23 24)"/>
        <rect x="30" y="23" width="5" height="3.5" fill="#4e5a6a" transform="rotate(15 32 25)"/>
        <path d="M38 24 l4 -2 l3 3 l-4 2z" fill="#d6cdb8"/>
        <path d="M40 18 l3 -1 l1 3 l-3 1z M36 14 l2 0 l0.5 2.5 l-2 0z" fill="#c9c0aa"/>
    `),
    // 日よけの破れた空っぽの屋台
    ruined_market: svg(`
        ${ground(DIRT)}
        <path d="M10 27 V12 M36 27 V16" stroke="${WOOD}" stroke-width="1.6"/>
        <path d="M8 12 h16 l-2 4 l-3 -2 l-2 5 l-2 -3 l-3 2z" fill="#6e5a4a"/>
        <path d="M38 16 l-6 6 l-2 -3" fill="none" stroke="#6e5a4a" stroke-width="2"/>
        <path d="M10 21 h18 l4 3" stroke="#4a3c2e" stroke-width="1.6" fill="none"/>
        <path d="M14 27 l2 -3 l3 3z" fill="#7a6a52"/>
        <circle cx="34" cy="26" r="1.2" fill="#8a7a62"/>
    `),
    // 屋根の落ちた空き家
    ruined_village: svg(`
        ${ground(DIRT)}
        <rect x="6" y="15" width="16" height="12" fill="#7a6e5c" stroke="#4a3c2e" stroke-width="0.8"/>
        <path d="M4 15 l9 -7 l4 3" fill="none" stroke="#4a3626" stroke-width="1.4"/>
        <path d="M6 15 l5 -1 l3 3 l4 -2 l4 0" fill="none" stroke="#4a3c2e" stroke-width="0.8"/>
        <rect x="11" y="20" width="5" height="7" fill="#2e2620"/>
        <path d="M28 27 V18 l4 -3 l3 4 l3 -2 v10z" fill="#7a6e5c" stroke="#4a3c2e" stroke-width="0.8"/>
        <path d="M30 13 L42 22" stroke="#4a3626" stroke-width="1.4"/>
        <path d="M24 27 l1 -3 l2 3z M40 27 l2 -2 l3 2z" fill="#6e6450"/>
    `),
    // ぼろをまとって寄り添う二人
    survivors: svg(`
        ${ground(DIRT)}
        ${person(19, '#6e6450', { hair: '<path d="M16 10 q3 -5 6 0z" fill="#4a3c2e"/>' })}
        ${person(28, '#5e5a4a', { scale: 0.9, hair: '<path d="M25 12 q0 -6 3 -5 q3 -1 3 5" fill="#5a4c3c"/>' })}
        <path d="M22 16 l3 1" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M16 20 l2 3 M30 21 l-1 3" stroke="#4a4436" stroke-width="0.8"/>
    `),

    // ===== 避難所（コスト1） =====
    // 板張りの古びた納屋
    hovel: svg(`
        ${ground(SOIL)}
        <rect x="10" y="14" width="26" height="13" fill="#6b5844" stroke="#3e3226" stroke-width="0.8"/>
        <path d="M8 14 L23 5 L38 14 Z" fill="#8f7d4f"/>
        <path d="M14 14 v13 M18 14 v13 M28 14 v13 M32 14 v13" stroke="#4a3c2e" stroke-width="0.6"/>
        <rect x="19" y="17" width="8" height="10" fill="#4a3c2e"/>
        <path d="M19 17 l8 10 M27 17 l-8 10" stroke="#6b5844" stroke-width="0.8"/>
        <path d="M40 27 q1 -4 3 -5 q1 3 0 5z" fill="#a89a5a"/>
    `),
    // 墓石と十字架の並ぶ墓地
    necropolis: svg(`
        ${ground('#5e6a44')}
        <path d="M0 27 h48" stroke="#4a5434" stroke-width="0.8"/>
        ${[[8, 16], [30, 15]].map(([x, y]) => `
            <path d="M${x} 27 V${y + 3} a4 4 0 0 1 8 0 V27z" fill="${STONE}" stroke="${STONE_EDGE}" stroke-width="0.6"/>
        `).join('')}
        ${[[22, 12], [42, 17]].map(([x, y]) => `
            <path d="M${x} ${y} V27 M${x - 3} ${y + 4} h6" stroke="#6b5f50" stroke-width="2"/>
        `).join('')}
        <path d="M40 4 a4 4 0 1 0 3 7 a3 3 0 1 1 -3 -7z" fill="#c9c0aa"/>
    `),
    // 草が生い茂った屋敷
    overgrown_estate: svg(`
        ${ground('#5e6a44')}
        ${house(12, 15, 24, 12, '#a39880', '#5e4a3a')}
        <rect x="21" y="20" width="6" height="7" fill="#4a3c2e"/>
        <path d="M12 27 q-1 -6 2 -9 M14 27 q1 -5 -1 -8 M34 27 q2 -8 -1 -12 M36 27 q-1 -5 2 -9" fill="none" stroke="#4e6a3a" stroke-width="1.2"/>
        ${[[13, 19], [33, 16], [35, 21], [17, 12], [30, 10]].map(([x, y]) =>
            `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1" fill="#5e7a44"/>`).join('')}
        ${[6, 9, 40, 43].map(x => `<path d="M${x} 27 l-1 -4 M${x} 27 l0 -5 M${x} 27 l1 -4" stroke="#5e7a44" stroke-width="0.8"/>`).join('')}
    `),

    // ===== サプライ外（コスト0） =====
    // 口の開いた袋とこぼれた金貨
    spoils: svg(`
        ${ground(DIRT)}
        <path d="M12 27 q-4 -1 -4 -7 q0 -7 7 -9 q7 2 7 9 q0 6 -4 7z" fill="#8a6d48" stroke="#5e4a30" stroke-width="0.8"/>
        <path d="M11 11 q4 -4 8 0" fill="none" stroke="#5e4a30" stroke-width="1.2"/>
        <circle cx="15" cy="10" r="2" fill="#c9a441"/>
        ${[[26, 25], [31, 25.5], [36, 25], [28.5, 22], [33.5, 22], [31, 18.5]].map(([x, y]) => `
            <circle cx="${x}" cy="${y}" r="2.6" fill="#c9a441" stroke="#8a6a1e" stroke-width="0.6"/>
        `).join('')}
        <path d="M40 12 l1 2 l2 0.5 l-2 0.5 l-1 2 l-1 -2 l-2 -0.5 l2 -0.5z" fill="#e8d48a"/>
    `),
    // 頭を抱える人
    madman: svg(`
        ${ground(DIRT)}
        <path d="M22 23 l-3 4 M26 23 l3 4" stroke="#4a3f35" stroke-width="1.6"/>
        <path d="M20 23 L21 15 h6 L28 23 z" fill="#6e6450"/>
        <circle cx="24" cy="11" r="3.2" fill="${SKIN}"/>
        <path d="M20.8 9 l-1 -3 l2 1 l1 -3 l1.5 2.5 l1.5 -3 l1 3 l2 -1 l-0.8 3.5" fill="#5a4c3c"/>
        <path d="M21 16 L19 11 L21 9 M27 16 L29 11 L27 9" fill="none" stroke="${SKIN}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M12 6 a2.5 2.5 0 1 1 2.5 2.5 a1.2 1.2 0 1 1 -1.2 -1.2" fill="none" stroke="#8a6a8a" stroke-width="0.9"/>
        <path d="M33 4 a2.5 2.5 0 1 0 2.5 2.5 a1.2 1.2 0 1 0 -1.2 -1.2" fill="none" stroke="#8a6a8a" stroke-width="0.9"/>
        <path d="M36 12 l2 -1 M10 13 l-2 -1" stroke="#8a6a8a" stroke-width="0.9"/>
    `),
    // 剣を構えた兵
    mercenary: svg(`
        ${ground(DIRT)}
        ${person(20, '#5e5a4a', { hair: '<path d="M16.5 10 q3.5 -6 7 0z" fill="#8e959b"/><path d="M16 10 h8" stroke="#4a4f57" stroke-width="0.8"/>' })}
        <path d="M17 15 h6 v3 h-6z" fill="#8a7a62"/>
        <path d="M23 16 l5 2" stroke="${SKIN}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M28 18 L40 6" stroke="#a8b0b6" stroke-width="2"/>
        <path d="M26 16 l4 4" stroke="#5a4c3c" stroke-width="1.6"/>
        <path d="M28 18 l-2.5 2.5" stroke="#4a3626" stroke-width="1.6"/>
        <path d="M14 17 l-3 4 v6" stroke="#6b5844" stroke-width="1"/>
    `)
};
