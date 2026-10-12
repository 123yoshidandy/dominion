/**
 * カードイラストの共通部品（すべて viewBox 0 0 48 32 の横長の絵）
 */

export const svg = (body) => `<svg viewBox="0 0 48 32" aria-hidden="true">${body}</svg>`;

// 地面
export const ground = (color = '#8cbf73') => `<rect x="0" y="27" width="48" height="5" fill="${color}"/>`;

// 海（下側の波）
export const sea = () => `<path d="M0 26 q4 -2 8 0 t8 0 t8 0 t8 0 t8 0 t8 0 V32 H0 Z" fill="#5dade2"/>`;

// 財宝のコイン（色違い）
export const coin = (fill, edge, shine, sparkle = '') => svg(`
    <circle cx="24" cy="16" r="12" fill="${fill}" stroke="${edge}" stroke-width="2"/>
    <circle cx="24" cy="16" r="7.5" fill="none" stroke="${shine}" stroke-width="1.5"/>
    <path d="M20 12 Q24 8 28 12" fill="none" stroke="${shine}" stroke-width="1.5" stroke-linecap="round"/>
    ${sparkle}
`);
