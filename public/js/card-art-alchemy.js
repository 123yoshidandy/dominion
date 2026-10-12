/** 拡張「錬金術」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground } from './card-art-helpers.js';

// 丸いフラスコ（中の液体の色を変えて使う）
const flask = (x, y, liquid, scale = 1) => `
    <g transform="translate(${x} ${y}) scale(${scale})">
        <rect x="-2" y="-12" width="4" height="6" fill="#dfe9ef" stroke="#7d8a93" stroke-width="0.8"/>
        <rect x="-2.8" y="-13" width="5.6" height="1.6" rx="0.6" fill="#8b5a2b"/>
        <circle cx="0" cy="0" r="7" fill="#dfe9ef" stroke="#7d8a93" stroke-width="0.8"/>
        <path d="M-6.6 1.5 a7 7 0 0 0 13.2 0 z" fill="${liquid}"/>
        <circle cx="-2.5" cy="-2.5" r="1.2" fill="#fff" opacity="0.8"/>
    </g>`;

export const ALCHEMY_ART = {
    // 青い液体の入ったフラスコ
    potion: svg(`
        ${flask(24, 18, '#3f7fd6', 1.3)}
        <circle cx="21" cy="17" r="1" fill="#9cc3f2"/><circle cx="27" cy="19" r="0.8" fill="#9cc3f2"/>
    `),

    // ===== コスト0＋ポーション =====
    // 鉛の塊が金に変わる
    transmute: svg(`
        <rect x="6" y="15" width="12" height="8" rx="1" fill="#6c7a89" stroke="#4a545e"/>
        <path d="M20 19 h7" stroke="#8e44ad" stroke-width="1.6"/>
        <path d="M26 16 l3 3 l-3 3" fill="none" stroke="#8e44ad" stroke-width="1.6"/>
        <rect x="31" y="15" width="12" height="8" rx="1" fill="#f1c40f" stroke="#b7950b"/>
        <path d="M33 16.5 h5" stroke="#fdeaa0" stroke-width="1"/>
        <path d="M24 8 l1 2 l2 0.5 l-2 0.5 l-1 2 l-1 -2 l-2 -0.5 l2 -0.5z" fill="#c39bd3"/>
    `),
    // ブドウ棚とブドウの房
    vineyard: svg(`
        ${ground('#9bbf6a')}
        <path d="M4 10 H44" stroke="#8b5a2b" stroke-width="1.5"/>
        <path d="M10 10 V27 M24 10 V27 M38 10 V27" stroke="#8b5a2b" stroke-width="1.5"/>
        ${[[16, 13], [31, 13]].map(([x, y]) => `
            <path d="M${x} ${y - 2} q2 -2 4 0" fill="#5d9b3a"/>
            ${[[0, 0], [2.4, 0], [4.8, 0], [1.2, 2.2], [3.6, 2.2], [2.4, 4.4]].map(([dx, dy]) =>
                `<circle cx="${x + dx}" cy="${y + dy}" r="1.4" fill="#7d3c98"/>`).join('')}
        `).join('')}
    `),

    // ===== コスト2 =====
    // 薬草の束とすり鉢
    herbalist: svg(`
        <path d="M14 6 q-4 8 0 16 M18 5 q0 9 -2 17 M22 7 q4 7 -4 15" fill="none" stroke="#3d8b3d" stroke-width="1.4"/>
        <ellipse cx="13" cy="9" rx="2.5" ry="1.4" fill="#5cb85c"/><ellipse cx="20" cy="8" rx="2.5" ry="1.4" fill="#5cb85c"/>
        <ellipse cx="22" cy="13" rx="2.5" ry="1.4" fill="#5cb85c"/>
        <path d="M26 18 h16 q-1 9 -8 9 q-7 0 -8 -9z" fill="#a0a7ae" stroke="#5f666d"/>
        <path d="M38 10 l-5 10" stroke="#8b5a2b" stroke-width="2.4" stroke-linecap="round"/>
    `),

    // ===== コスト2＋ポーション =====
    // 薬瓶の並ぶ棚
    apothecary: svg(`
        <rect x="4" y="22" width="40" height="3" fill="#8b5a2b"/>
        <rect x="4" y="11" width="40" height="2" fill="#8b5a2b"/>
        ${flask(12, 18, '#3f7fd6', 0.5)}
        <rect x="20" y="15" width="5" height="7" rx="1" fill="#c0392b"/><rect x="21" y="13" width="3" height="2" fill="#7f8c8d"/>
        ${flask(33, 18, '#27ae60', 0.5)}
        <rect x="39" y="16" width="4" height="6" rx="1" fill="#d68910"/>
        <circle cx="10" cy="8" r="2" fill="#b87333"/><circle cx="16" cy="8" r="2" fill="#b87333"/>
        <rect x="26" y="5" width="5" height="6" rx="1" fill="#8e44ad"/>
    `),
    // 泉の水面に映る目
    scrying_pool: svg(`
        ${ground('#8a9a5b')}
        <ellipse cx="24" cy="22" rx="18" ry="6" fill="#5b8fbf" stroke="#7f8c8d" stroke-width="2"/>
        <ellipse cx="24" cy="21.5" rx="7" ry="3" fill="#d6eaf8"/>
        <circle cx="24" cy="21.5" r="2" fill="#6c3483"/>
        <path d="M14 8 q3 -3 6 0 M28 6 q3 -3 6 0" fill="none" stroke="#c39bd3" stroke-width="1"/>
    `),
    // 大学の建物と角帽
    university: svg(`
        ${ground()}
        <path d="M6 13 L24 4 L42 13 Z" fill="#922b21"/>
        <rect x="8" y="13" width="32" height="14" fill="#f2e6d0" stroke="#a08c6c"/>
        ${[11, 17, 23, 29, 35].map(x => `<rect x="${x}" y="15" width="2.5" height="12" fill="#d5c4a1"/>`).join('')}
        <path d="M18 9 l6 -2.5 l6 2.5 l-6 2.5z" fill="#2b2620"/>
        <path d="M30 9 v3" stroke="#f1c40f" stroke-width="0.8"/>
    `),

    // ===== コスト3＋ポーション =====
    // 炎にかけたフラスコ
    alchemist: svg(`
        <rect x="14" y="26" width="20" height="3" fill="#5d4037"/>
        <path d="M18 26 q2 -5 4 -2 q2 -6 4 0 q2 -3 4 2z" fill="#e67e22"/>
        <path d="M21 26 q1.5 -3 3 -1 q1.5 -3 3 1z" fill="#f9e79f"/>
        ${flask(24, 13, '#27ae60', 0.9)}
        <circle cx="31" cy="4" r="1.2" fill="#a9dfbf"/><circle cx="34" cy="7" r="0.8" fill="#a9dfbf"/>
    `),
    // 黒猫の使い魔
    familiar: svg(`
        ${ground('#5b4a6b')}
        <ellipse cx="22" cy="21" rx="9" ry="6" fill="#2b2620"/>
        <circle cx="31" cy="13" r="5" fill="#2b2620"/>
        <path d="M27.5 9.5 l1 -4 l2.5 3z M34.5 9.5 l-1 -4 l-2.5 3z" fill="#2b2620"/>
        <circle cx="29.5" cy="12.5" r="1" fill="#f4d03f"/><circle cx="32.5" cy="12.5" r="1" fill="#f4d03f"/>
        <path d="M13 20 q-6 -2 -5 -9" fill="none" stroke="#2b2620" stroke-width="2" stroke-linecap="round"/>
        <path d="M40 6 a4 4 0 1 0 3 7 a3 3 0 1 1 -3 -7z" fill="#f9e79f"/>
    `),
    // 輝く赤い石
    philosophers_stone: svg(`
        <path d="M24 4 l9 7 l-3 13 h-12 l-3 -13z" fill="#c0392b" stroke="#7b241c"/>
        <path d="M24 4 l-3 7 h6z" fill="#e74c3c"/>
        <path d="M15 11 h18 M21 11 l-3 13 M27 11 l3 13" stroke="#922b21" stroke-width="0.6" fill="none"/>
        <path d="M8 8 l1.5 3 M40 8 l-1.5 3 M6 18 h3 M42 18 h-3" stroke="#f5b041" stroke-width="1.2"/>
        <rect x="14" y="25" width="20" height="3" rx="1" fill="#7f8c8d"/>
    `),

    // ===== コスト4＋ポーション =====
    // 土の巨人
    golem: svg(`
        ${ground('#8d6e63')}
        <rect x="17" y="10" width="14" height="12" rx="2" fill="#a1887f" stroke="#6d4c41"/>
        <rect x="19" y="3" width="10" height="8" rx="2" fill="#a1887f" stroke="#6d4c41"/>
        <rect x="21" y="6" width="2" height="1.5" fill="#f4d03f"/><rect x="25" y="6" width="2" height="1.5" fill="#f4d03f"/>
        <rect x="11" y="11" width="6" height="11" rx="2" fill="#8d6e63"/><rect x="31" y="11" width="6" height="11" rx="2" fill="#8d6e63"/>
        <rect x="18" y="22" width="5" height="6" fill="#8d6e63"/><rect x="25" y="22" width="5" height="6" fill="#8d6e63"/>
        <path d="M22 14 l2 2 l2 -2" fill="none" stroke="#6d4c41"/>
    `),

    // ===== コスト5 =====
    // 本を読む弟子とろうそく
    apprentice: svg(`
        <rect x="6" y="24" width="36" height="3" fill="#8b5a2b"/>
        <path d="M12 23 l9 -2 l9 2 v-9 l-9 -2 l-9 2z" fill="#f5ecd7" stroke="#a08c6c"/>
        <path d="M21 12 v9" stroke="#a08c6c"/>
        <path d="M14 15 h5 M14 17 h5 M23 15 h5 M23 17 h5" stroke="#b9a882" stroke-width="0.6"/>
        <rect x="35" y="15" width="3" height="9" fill="#f5ecd7"/>
        <path d="M36.5 10 q-2 3 0 5 q2 -2 0 -5z" fill="#f5b041"/>
    `),

    // ===== コスト6＋ポーション =====
    // 操り人形を動かす手
    possession: svg(`
        <path d="M14 4 h20 l-2 3 h-16z" fill="#6c3483"/>
        <path d="M18 7 L19 14 M24 7 V11 M30 7 L29 14" stroke="#bdc3c7" stroke-width="0.6"/>
        <circle cx="24" cy="13" r="3" fill="#f5cba7"/>
        <rect x="21" y="16" width="6" height="8" rx="1" fill="#2e86c1"/>
        <path d="M21 17 L19 14 M27 17 L29 14" stroke="#f5cba7" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M22 24 v5 M26 24 v5" stroke="#5d4037" stroke-width="1.6"/>
    `)
};
