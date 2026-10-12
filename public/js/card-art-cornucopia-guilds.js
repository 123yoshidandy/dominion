/** 拡張「収穫祭＆ギルド」のカードイラスト（viewBox 0 0 48 32） */

import { svg, ground } from './card-art-helpers.js';

// 財源のコイン（小さな銅色のトークン）
const token = (x, y, r = 3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9a441" stroke="#9c6b1e" stroke-width="0.8"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="#f3d08a" stroke-width="0.6"/>`;

export const CORNUCOPIA_GUILDS_ART = {
    // ===== コスト2 =====
    // 燭台と蝋燭
    candlestick_maker: svg(`
        <rect x="21" y="9" width="6" height="14" fill="#f5ecd7" stroke="#b9a882" stroke-width="0.8"/>
        <path d="M24 2 q-3 4 0 7 q3 -3 0 -7z" fill="#f5b041"/>
        <path d="M24 4.5 q-1.2 2 0 3.5 q1.2 -1.5 0 -3.5z" fill="#fdebd0"/>
        <path d="M16 23 h16 l-3 3 h-10 z" fill="#c9971f" stroke="#a87b1f" stroke-width="0.8"/>
        <rect x="18" y="26" width="12" height="3" rx="1" fill="#a87b1f"/>
        ${token(39, 22)}
    `),
    // 蹄鉄と金槌
    farrier: svg(`
        <path d="M10 26 V14 a9 9 0 0 1 18 0 V26 h-5 V14 a4 4 0 0 0 -8 0 V26 z" fill="#7f8c8d" stroke="#4a4f57" stroke-width="1"/>
        <circle cx="12.5" cy="18" r="0.8" fill="#2b2620"/><circle cx="25.5" cy="18" r="0.8" fill="#2b2620"/>
        <circle cx="13" cy="12" r="0.8" fill="#2b2620"/><circle cx="25" cy="12" r="0.8" fill="#2b2620"/>
        <g transform="rotate(25 38 16)">
            <rect x="36.5" y="10" width="3" height="16" rx="1" fill="#8b5a2b"/>
            <rect x="32" y="6" width="12" height="5" rx="1" fill="#5d646d"/>
        </g>
    `),
    // 小さな村落（家が2軒と小道）
    hamlet: svg(`
        ${ground()}
        <rect x="8" y="18" width="11" height="9" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M6 18 L13.5 11 L21 18 Z" fill="#a0703c"/>
        <rect x="29" y="19" width="10" height="8" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M27 19 L34 13 L41 19 Z" fill="#b5523b"/>
        <path d="M20 32 Q24 28 24 27" fill="none" stroke="#d9c39a" stroke-width="3"/>
        <rect x="12" y="22" width="3" height="5" fill="#8b6b4a"/>
    `),
    // 石を積む石工
    stonemason: svg(`
        ${ground('#9c9c8c')}
        <rect x="6" y="21" width="12" height="6" fill="#b8b0a0" stroke="#7d7362"/>
        <rect x="18" y="21" width="12" height="6" fill="#a6a08f" stroke="#7d7362"/>
        <rect x="12" y="15" width="12" height="6" fill="#c4bcac" stroke="#7d7362"/>
        <path d="M36 24 l-5 -5" stroke="#8b5a2b" stroke-width="2" stroke-linecap="round"/>
        <path d="M30 18 l4 -4 l3 3 l-4 4 z" fill="#7f8c8d"/>
        <path d="M40 10 l2 -2 M42 13 h3 M39 7 l1 -3" stroke="#bdc3c7" stroke-width="1.2" stroke-linecap="round"/>
    `),

    // ===== コスト3 =====
    // 赤十字のある診療所
    infirmary: svg(`
        ${ground()}
        <rect x="10" y="12" width="28" height="15" fill="#fdfefe" stroke="#8b8b8b"/>
        <path d="M8 12 L24 5 L40 12 Z" fill="#7f8c8d"/>
        <rect x="22" y="14" width="4" height="10" fill="#c0392b"/>
        <rect x="19" y="17" width="10" height="4" fill="#c0392b"/>
        <rect x="13" y="20" width="4" height="7" fill="#85c1e9" stroke="#8b8b8b" stroke-width="0.6"/>
    `),
    // 檻の中の動物たち
    menagerie: svg(`
        ${ground('#d9c39a')}
        <rect x="6" y="9" width="36" height="18" fill="#f5ecd7" stroke="#6b4423"/>
        <path d="M12 9 v18 M18 9 v18 M24 9 v18 M30 9 v18 M36 9 v18" stroke="#6b4423" stroke-width="1"/>
        <circle cx="15" cy="20" r="4" fill="#e67e22"/>
        <circle cx="13.5" cy="19" r="0.7" fill="#2b2620"/><circle cx="16.5" cy="19" r="0.7" fill="#2b2620"/>
        <ellipse cx="32" cy="21" rx="5" ry="3.5" fill="#95a5a6"/>
        <path d="M36 20 q4 1 3 5" fill="none" stroke="#95a5a6" stroke-width="1.6"/>
        <path d="M6 9 Q24 2 42 9" fill="#c0392b"/>
    `),
    // 日よけのある小さな店
    shop: svg(`
        ${ground()}
        <rect x="10" y="13" width="28" height="14" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M8 13 l3 -6 h26 l3 6 z" fill="#2e86c1"/>
        <path d="M14 7 l-2 6 M20 7 l-1 6 M26 7 l1 6 M32 7 l2 6" stroke="#fdfefe" stroke-width="1.5"/>
        <rect x="13" y="16" width="12" height="7" fill="#85c1e9" stroke="#8b6b4a" stroke-width="0.6"/>
        <circle cx="16" cy="20" r="1.4" fill="#e74c3c"/><circle cx="20" cy="20" r="1.4" fill="#f1c40f"/>
        <rect x="29" y="18" width="5" height="9" fill="#8b6b4a"/>
    `),

    // ===== コスト4 =====
    // 耳打ちする助言者と巻物
    advisor: svg(`
        <circle cx="14" cy="11" r="5" fill="#e0b48a"/>
        <path d="M7 28 q0 -11 7 -11 q7 0 7 11 z" fill="#5b3a72"/>
        <path d="M9 9 q5 -7 10 0" fill="#7d7362"/>
        <rect x="27" y="9" width="14" height="16" fill="#f5ecd7" stroke="#b9a882"/>
        <rect x="25" y="7" width="18" height="3" rx="1.5" fill="#d9c39a"/>
        <rect x="25" y="24" width="18" height="3" rx="1.5" fill="#d9c39a"/>
        <path d="M30 13 h8 M30 16 h8 M30 19 h6" stroke="#8b6b4a" stroke-width="0.8"/>
    `),
    // 鍬を持つ農場の働き手と畑
    farmhands: svg(`
        ${ground('#a9733f')}
        <path d="M0 27 h48 M0 29.5 h48" stroke="#8b5a2b" stroke-width="0.6"/>
        <circle cx="18" cy="9" r="4" fill="#e0b48a"/>
        <path d="M13 8 h10 l-2 -3 h-6 z" fill="#d4ac0d"/>
        <rect x="14" y="13" width="8" height="10" rx="2" fill="#2e86c1"/>
        <path d="M15 23 v4 M21 23 v4" stroke="#5d4037" stroke-width="2"/>
        <line x1="26" y1="6" x2="34" y2="26" stroke="#8b5a2b" stroke-width="1.6"/>
        <path d="M32 25 h6 v2 h-6 z" fill="#7f8c8d"/>
        <path d="M40 22 q2 -5 0 -9 M43 23 q2 -4 0 -7" fill="none" stroke="#27ae60" stroke-width="1.4"/>
    `),
    // ラッパを吹く伝令官と旗
    herald: svg(`
        <path d="M8 13 L26 10 L36 4 V26 L26 20 L8 17 Z" fill="#d4ac0d" stroke="#a87b1f"/>
        <ellipse cx="36" cy="15" rx="2.5" ry="11" fill="#c9971f" stroke="#a87b1f"/>
        <rect x="14" y="17" width="10" height="9" fill="#c0392b"/>
        <path d="M14 26 l2.5 -2 l2.5 2 l2.5 -2 l2.5 2" fill="#c0392b"/>
        <path d="M17 19 l2 2 l2 -2" fill="none" stroke="#f7dc6f" stroke-width="1"/>
        <path d="M41 9 l4 -3 M42 15 h5 M41 21 l4 3" stroke="#f7dc6f" stroke-width="1.4" stroke-linecap="round"/>
    `),
    // 噴水のある広場
    plaza: svg(`
        <rect x="0" y="22" width="48" height="10" fill="#d5ccb9"/>
        <path d="M0 26 h48 M8 22 v10 M20 22 v10 M32 22 v10 M44 22 v10" stroke="#b8ae98" stroke-width="0.6"/>
        <ellipse cx="24" cy="22" rx="13" ry="3.5" fill="#b8b0a0" stroke="#7d7362"/>
        <ellipse cx="24" cy="21.5" rx="10" ry="2.2" fill="#5dade2"/>
        <rect x="22.5" y="11" width="3" height="10" fill="#b8b0a0"/>
        <path d="M24 11 q-6 -2 -8 6 M24 11 q6 -2 8 6 M24 11 v-6" fill="none" stroke="#85c1e9" stroke-width="1.4"/>
        ${token(9, 15, 3)}
    `),
    // 足場を組んで建て直す家
    remake: svg(`
        ${ground()}
        <rect x="12" y="13" width="20" height="14" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M10 13 L22 5 L34 13 Z" fill="none" stroke="#8b6b4a" stroke-width="1.2" stroke-dasharray="2 1.5"/>
        <path d="M36 27 V8 M42 27 V8 M36 12 h6 M36 18 h6 M36 24 h6 M36 12 l6 6 M36 18 l6 6" stroke="#a0703c" stroke-width="1.2"/>
        <path d="M14 18 h16 M14 22 h16" stroke="#c8a165" stroke-width="0.8"/>
        <path d="M5 8 a4 4 0 1 1 3 6" fill="none" stroke="#27ae60" stroke-width="1.4"/>
        <path d="M7 14 l1 -3 l2.5 2" fill="none" stroke="#27ae60" stroke-width="1.4"/>
    `),
    // 箒に乗った魔女娘
    young_witch: svg(`
        <circle cx="40" cy="7" r="3.5" fill="#f7dc6f"/>
        <circle cx="41.5" cy="6" r="3" fill="#dce8f5"/>
        <line x1="4" y1="23" x2="34" y2="17" stroke="#8b5a2b" stroke-width="1.8"/>
        <path d="M34 17 l8 -3 l-1 4 l2 2 l-8 0 z" fill="#d4ac0d"/>
        <circle cx="18" cy="11" r="3.5" fill="#f0c8a0"/>
        <path d="M13 9 h10 L18 1 Z" fill="#7d3c98"/>
        <path d="M14 14 q4 -1 8 0 l1 7 h-10 z" fill="#9b59b6"/>
        <path d="M8 26 l0.8 2 l2 0.8 l-2 0.8 l-0.8 2 l-0.8 -2 l-2 -0.8 l2 -0.8z" fill="#f7dc6f"/>
    `),

    // ===== コスト5 =====
    // パンとパン屋の窯
    baker: svg(`
        <path d="M6 27 V16 a18 12 0 0 1 36 0 V27 z" fill="#b5523b" stroke="#7b3f2a"/>
        <path d="M15 27 v-6 a9 7 0 0 1 18 0 v6 z" fill="#2b2620"/>
        <path d="M18 27 q2 -4 4 0 q2 -4 4 0 q2 -4 4 0" fill="#f39c12"/>
        <ellipse cx="13" cy="12" rx="5" ry="3" fill="#e6b06b" stroke="#a0703c"/>
        <ellipse cx="35" cy="12" rx="5" ry="3" fill="#e6b06b" stroke="#a0703c"/>
        <path d="M11 11 l1 2 M14 10.5 l1 2 M33 11 l1 2 M36 10.5 l1 2" stroke="#a0703c" stroke-width="0.7"/>
    `),
    // 肉切り包丁と肉
    butcher: svg(`
        <ellipse cx="17" cy="19" rx="11" ry="8" fill="#c0392b" stroke="#922b21"/>
        <ellipse cx="17" cy="19" rx="7" ry="4.5" fill="#e6a0a0"/>
        <circle cx="12" cy="17" r="2" fill="#fdfefe" stroke="#c4bcac" stroke-width="0.6"/>
        <rect x="30" y="6" width="13" height="10" rx="1" fill="#bdc3c7" stroke="#7f8c8d"/>
        <circle cx="40" cy="9" r="1.2" fill="#7f8c8d"/>
        <rect x="33" y="16" width="3" height="11" rx="1" fill="#8b5a2b"/>
        ${token(42, 25, 2.6)}
    `),
    // 縞模様のテントと旗
    carnival: svg(`
        ${ground()}
        <path d="M8 27 L24 7 L40 27 Z" fill="#fdf2e9" stroke="#922b21"/>
        <path d="M24 7 L14 27 h4 L24 7 L22 27 h4 L24 7 L30 27 h4 Z" fill="#c0392b"/>
        <line x1="24" y1="7" x2="24" y2="2" stroke="#6b5a45"/>
        <path d="M24 2 l6 1.5 l-6 1.5 z" fill="#f1c40f"/>
        <circle cx="6" cy="9" r="3" fill="#3498db"/><line x1="6" y1="12" x2="7" y2="20" stroke="#6b5a45" stroke-width="0.6"/>
        <circle cx="43" cy="11" r="3" fill="#27ae60"/><line x1="43" y1="14" x2="42" y2="21" stroke="#6b5a45" stroke-width="0.6"/>
    `),
    // 川を渡る渡し舟
    ferryman: svg(`
        <rect x="0" y="20" width="48" height="12" fill="#5dade2"/>
        <path d="M0 25 q4 -2 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" stroke="#eaf6fd" stroke-width="0.8"/>
        <path d="M8 20 h28 l-4 5 h-20 z" fill="#8b5a2b"/>
        <circle cx="22" cy="10" r="3" fill="#e0b48a"/>
        <path d="M18 20 q0 -7 4 -7 q4 0 4 7 z" fill="#4a4f57"/>
        <line x1="30" y1="4" x2="38" y2="30" stroke="#6b4423" stroke-width="1.4"/>
        <path d="M18.5 8.5 h7 l-1 -3 h-5 z" fill="#2b2620"/>
    `),
    // 覆面の追い剥ぎと奪った財源
    footpad: svg(`
        <circle cx="18" cy="14" r="9" fill="#e0b48a"/>
        <path d="M9 14 h18 v9 q-9 4 -18 0 z" fill="#4a4f57"/>
        <path d="M9 9 Q18 1 27 9 Z" fill="#2b2620"/>
        <circle cx="14.5" cy="12" r="1.2" fill="#2b2620"/>
        <circle cx="21.5" cy="12" r="1.2" fill="#2b2620"/>
        <path d="M30 18 q5 -4 10 0 q2 6 -5 9 q-7 -3 -5 -9 z" fill="#a0703c" stroke="#6b4423"/>
        <path d="M32 18 l6 0" stroke="#6b4423" stroke-width="1"/>
        ${token(41, 9)}${token(35, 7, 2.4)}
    `),
    // 果物があふれる豊穣の角
    horn_of_plenty: svg(`
        <path d="M6 8 Q4 26 26 26 L34 18 Q20 18 14 8 Q11 4 6 8 z" fill="#c8a165" stroke="#8b6b4a"/>
        <path d="M10 10 q3 3 2 7 M16 16 q2 3 0 6" stroke="#8b6b4a" stroke-width="0.8" fill="none"/>
        <circle cx="34" cy="17" r="4" fill="#e74c3c"/>
        <circle cx="39" cy="22" r="3.5" fill="#f1c40f"/>
        <circle cx="31" cy="24" r="3" fill="#e67e22"/>
        <circle cx="40" cy="14" r="2.5" fill="#8e44ad"/>
        <circle cx="43" cy="18" r="2" fill="#8e44ad"/>
        <path d="M36 12 q2 -4 5 -4" stroke="#27ae60" stroke-width="1.4" fill="none"/>
    `),
    // 森の狩猟団（弓と矢・木）
    hunting_party: svg(`
        ${ground('#6f9a55')}
        <path d="M6 27 L11 10 L16 27 Z" fill="#3f8a4c"/><rect x="10" y="24" width="2" height="3" fill="#6b4423"/>
        <path d="M38 27 L43 12 L48 27 Z" fill="#3f8a4c"/>
        <path d="M20 4 Q32 16 20 28" fill="none" stroke="#8b5a2b" stroke-width="2"/>
        <line x1="20" y1="4" x2="20" y2="28" stroke="#d9c39a" stroke-width="0.7"/>
        <line x1="20" y1="16" x2="38" y2="16" stroke="#6b4423" stroke-width="1.2"/>
        <path d="M38 13.5 L42 16 L38 18.5 Z" fill="#7f8c8d"/>
        <path d="M21 14 l-3 -2 M21 18 l-3 2" stroke="#c0392b" stroke-width="1.2"/>
    `),
    // 鈴付き帽子の道化師
    jester: svg(`
        <circle cx="24" cy="19" r="8" fill="#f0c8a0"/>
        <path d="M14 15 Q10 4 4 6 Q10 9 16 13 Z" fill="#c0392b"/>
        <path d="M17 12 Q24 0 31 12 Z" fill="#27ae60"/>
        <path d="M34 15 Q38 4 44 6 Q38 9 32 13 Z" fill="#f1c40f"/>
        <circle cx="4" cy="6" r="2" fill="#f7dc6f"/><circle cx="24" cy="3" r="2" fill="#f7dc6f"/><circle cx="44" cy="6" r="2" fill="#f7dc6f"/>
        <circle cx="21" cy="18" r="1" fill="#2b2620"/><circle cx="27" cy="18" r="1" fill="#2b2620"/>
        <path d="M20 22 q4 3 8 0" fill="none" stroke="#922b21" stroke-width="1.2"/>
        <path d="M16 27 l4 -2 l4 2 l4 -2 l4 2 v5 h-16 z" fill="#2e86c1"/>
    `),
    // 道具袋を背負って旅する職人見習い
    journeyman: svg(`
        ${ground('#d9c39a')}
        <path d="M0 27 Q24 22 48 27" fill="#c8a165"/>
        <circle cx="20" cy="8" r="3.5" fill="#e0b48a"/>
        <path d="M15.5 7 h9 l-1.5 -3 h-6 z" fill="#6b4423"/>
        <rect x="16" y="12" width="8" height="9" rx="2" fill="#a0522d"/>
        <path d="M17 21 l-2 6 M23 21 l2 6" stroke="#5d4037" stroke-width="2"/>
        <ellipse cx="27.5" cy="15" rx="4" ry="5" fill="#c8a165" stroke="#8b6b4a"/>
        <line x1="10" y1="10" x2="12" y2="27" stroke="#8b5a2b" stroke-width="1.4"/>
        <path d="M36 8 l3 3 M39 8 l-3 3" stroke="#7f8c8d" stroke-width="1.6"/>
    `),
    // 交差する騎馬槍と盾
    joust: svg(`
        <line x1="2" y1="28" x2="40" y2="6" stroke="#8b5a2b" stroke-width="2.2"/>
        <line x1="46" y1="28" x2="8" y2="6" stroke="#8b5a2b" stroke-width="2.2"/>
        <path d="M40 6 l5 -4 l-1 6 z M8 6 l-5 -4 l1 6 z" fill="#bdc3c7"/>
        <path d="M16 10 h16 v8 c0 6 -4 10 -8 12 c-4 -2 -8 -6 -8 -12 z" fill="#c0392b" stroke="#7b241c" stroke-width="1.2"/>
        <path d="M24 12 l2 4 l4 0.5 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -0.5 z" fill="#f7dc6f"/>
    `),
    // ギルドの紋章と天秤
    merchant_guild: svg(`
        ${ground('#9c9c8c')}
        <rect x="8" y="10" width="32" height="17" fill="#d5ccb9" stroke="#7d7362"/>
        <path d="M6 10 L24 3 L42 10 Z" fill="#6d4c41"/>
        <rect x="18" y="13" width="12" height="10" rx="1" fill="#1a5276" stroke="#c9971f"/>
        <line x1="24" y1="14.5" x2="24" y2="21" stroke="#f7dc6f" stroke-width="0.8"/>
        <line x1="20" y1="16" x2="28" y2="16" stroke="#f7dc6f" stroke-width="0.8"/>
        <path d="M19 19 a1.5 1 0 0 0 3 0 z M26 19 a1.5 1 0 0 0 3 0 z" fill="#f7dc6f"/>
        ${token(12, 22, 2.4)}${token(36, 22, 2.4)}
    `),
    // 水晶を覗く占い師と星
    soothsayer: svg(`
        <path d="M10 28 q0 -14 10 -14 q10 0 10 14 z" fill="#4b3363"/>
        <circle cx="20" cy="10" r="5" fill="#e0b48a"/>
        <path d="M14 10 q6 -10 12 0 l1 6 q-7 -3 -14 0 z" fill="#4b3363"/>
        <circle cx="35" cy="20" r="6" fill="#a9cce3" stroke="#5b7a96"/>
        <circle cx="33" cy="18" r="1.6" fill="#eaf2f8"/>
        <rect x="31" y="26" width="8" height="2.5" rx="1" fill="#6b4423"/>
        <path d="M40 4 l1 2.5 l2.5 1 l-2.5 1 l-1 2.5 l-1 -2.5 l-2.5 -1 l2.5 -1z" fill="#f7dc6f"/>
        <path d="M6 5 l0.7 1.6 l1.6 0.7 l-1.6 0.7 l-0.7 1.6 l-0.7 -1.6 l-1.6 -0.7 l1.6 -0.7z" fill="#f7dc6f"/>
    `),

    // ===== コスト6 =====
    // 品評会のリボンと旗
    fairgrounds: svg(`
        ${ground()}
        <path d="M2 6 Q24 14 46 6" fill="none" stroke="#6b5a45" stroke-width="0.8"/>
        <path d="M6 7.5 l3 0.8 l-1 4 z M15 9.8 l3 0.4 l-1.6 4 z M30 10.2 l3 -0.4 l-1.4 4 z M39 8.3 l3 -0.8 l-2 3.8 z" fill="#e74c3c"/>
        <path d="M22 10.5 l4 0 l-2 4 z" fill="#3498db"/>
        <circle cx="24" cy="21" r="5" fill="#2e86c1" stroke="#1b4f72"/>
        <circle cx="24" cy="21" r="2.6" fill="#f7dc6f"/>
        <path d="M21 25 l-2 6 l3 -1.5 l2 2 M27 25 l2 6 l-3 -1.5 l-2 2" fill="#2e86c1"/>
        <path d="M8 27 v-8 h6 v8 M34 27 v-6 h6 v6" fill="#f1e3c6" stroke="#8b6b4a"/>
    `),

    // ===== 褒賞 =====
    // 宝石をあしらった宝冠
    coronet: svg(`
        <path d="M10 22 L8 9 L16 15 L24 6 L32 15 L40 9 L38 22 Z" fill="#f2c14e" stroke="#b8860b" stroke-width="1.2"/>
        <rect x="10" y="22" width="28" height="4" rx="1" fill="#d4ac0d" stroke="#b8860b"/>
        <circle cx="24" cy="15" r="2" fill="#c0392b"/>
        <circle cx="16" cy="18" r="1.4" fill="#2e86c1"/>
        <circle cx="32" cy="18" r="1.4" fill="#27ae60"/>
        <circle cx="8" cy="9" r="1.2" fill="#fff1b8"/><circle cx="24" cy="6" r="1.2" fill="#fff1b8"/><circle cx="40" cy="9" r="1.2" fill="#fff1b8"/>
    `),
    // 駆ける駿馬
    courser: svg(`
        ${ground('#d9c39a')}
        <path d="M10 14 Q14 10 26 11 Q32 6 36 4 L38 8 Q35 10 34 14 Q34 18 30 19 L29 26 h-2 l0 -6 Q20 21 15 19 L11 26 h-2 L11 18 Q7 18 6 22 Q5 17 10 14 z" fill="#8b5a2b"/>
        <path d="M30 6 Q27 9 28 12" fill="none" stroke="#5d3a1a" stroke-width="1.6"/>
        <circle cx="35" cy="7" r="0.7" fill="#2b2620"/>
        <path d="M40 12 h6 M41 16 h5 M40 20 h6" stroke="#b9a882" stroke-width="1" stroke-linecap="round"/>
    `),
    // 金貨の積まれた領地の館
    demesne: svg(`
        ${ground()}
        <rect x="8" y="12" width="24" height="15" fill="#f1e3c6" stroke="#8b6b4a"/>
        <path d="M5 12 L20 3 L35 12 Z" fill="#a8432f"/>
        <rect x="12" y="15" width="5" height="4" fill="#85c1e9" stroke="#8b6b4a" stroke-width="0.6"/>
        <rect x="23" y="15" width="5" height="4" fill="#85c1e9" stroke="#8b6b4a" stroke-width="0.6"/>
        <rect x="18" y="20" width="4" height="7" fill="#8b6b4a"/>
        <ellipse cx="40" cy="25" rx="5" ry="1.8" fill="#d4ac0d" stroke="#b8860b" stroke-width="0.6"/>
        <ellipse cx="40" cy="22.5" rx="5" ry="1.8" fill="#f2c14e" stroke="#b8860b" stroke-width="0.6"/>
        <ellipse cx="40" cy="20" rx="5" ry="1.8" fill="#f2c14e" stroke="#b8860b" stroke-width="0.6"/>
    `),
    // 斧と丸盾の親衛兵
    housecarl: svg(`
        <circle cx="20" cy="17" r="11" fill="#a0703c" stroke="#6b4423" stroke-width="1.2"/>
        <circle cx="20" cy="17" r="3" fill="#bdc3c7" stroke="#7f8c8d"/>
        <path d="M20 6 v8 M20 20 v8 M9 17 h8 M23 17 h8" stroke="#6b4423" stroke-width="1"/>
        <line x1="38" y1="4" x2="34" y2="30" stroke="#8b5a2b" stroke-width="2"/>
        <path d="M37 6 q8 -2 8 6 q-4 -2 -9 0 z" fill="#7f8c8d" stroke="#4a4f57" stroke-width="0.8"/>
    `),
    // 大きなカブ
    huge_turnip: svg(`
        ${ground('#a9733f')}
        <path d="M24 6 Q36 8 36 18 Q36 27 24 29 Q12 27 12 18 Q12 8 24 6 z" fill="#f5ecf7" stroke="#9b7fb0"/>
        <path d="M24 6 Q34 8 35 15 Q24 10 13 15 Q14 8 24 6 z" fill="#9b59b6"/>
        <path d="M24 29 v3" stroke="#d7c7e3" stroke-width="1.2"/>
        <path d="M24 6 Q18 0 14 2 Q19 3 23 6 M24 6 Q24 -1 27 0 Q25 3 25 6 M25 6 Q31 1 35 3 Q30 4 26 7" fill="#27ae60" stroke="#1e8449" stroke-width="0.8"/>
        ${token(41, 23, 2.6)}${token(7, 23, 2.6)}
    `),
    // 月桂冠（名声）
    renown: svg(`
        <path d="M24 28 Q8 26 9 10" fill="none" stroke="#1e8449" stroke-width="1.4"/>
        <path d="M24 28 Q40 26 39 10" fill="none" stroke="#1e8449" stroke-width="1.4"/>
        <path d="M10 12 q-4 -1 -4 -4 q4 0 4 4 M11 18 q-4 0 -5 -3 q4 -1 5 3 M14 23 q-3 1 -6 -1 q3 -2 6 1 M19 26 q-2 2 -5 1 q2 -3 5 -1" fill="#27ae60"/>
        <path d="M38 12 q4 -1 4 -4 q-4 0 -4 4 M37 18 q4 0 5 -3 q-4 -1 -5 3 M34 23 q3 1 6 -1 q-3 -2 -6 1 M29 26 q2 2 5 1 q-2 -3 -5 -1" fill="#27ae60"/>
        <path d="M24 5 l2 4.5 l5 0.5 l-3.8 3.3 l1.2 4.8 l-4.4 -2.6 l-4.4 2.6 l1.2 -4.8 l-3.8 -3.3 l5 -0.5 z" fill="#f2c14e" stroke="#b8860b" stroke-width="0.6"/>
    `)
};
