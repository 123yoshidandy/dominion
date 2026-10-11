/**
 * タップと長押しを区別するヘルパー
 * 長押し（またはPCでの右クリック）でカードの説明を出すために使う
 */

// 長押しと判定するまでの時間（ミリ秒）
const LONG_PRESS_MS = 450;

// この距離以上指が動いたらスクロールとみなして長押しを取り消す（px）
const MOVE_TOLERANCE_PX = 10;

export function onPress(element, { onTap, onLongPress }) {
    let timer = null;
    let startX = 0;
    let startY = 0;
    let longPressed = false;

    const cancel = () => {
        clearTimeout(timer);
        timer = null;
    };

    element.addEventListener('pointerdown', (event) => {
        longPressed = false;
        startX = event.clientX;
        startY = event.clientY;
        cancel();
        timer = setTimeout(() => {
            timer = null;
            longPressed = true;
            onLongPress();
        }, LONG_PRESS_MS);
    });

    element.addEventListener('pointermove', (event) => {
        if (timer && Math.hypot(event.clientX - startX, event.clientY - startY) > MOVE_TOLERANCE_PX) {
            cancel();
        }
    });

    element.addEventListener('pointerup', cancel);
    element.addEventListener('pointercancel', cancel);
    element.addEventListener('pointerleave', cancel);

    // 長押しの後に続くクリックはタップとして扱わない
    element.addEventListener('click', () => {
        if (longPressed) {
            longPressed = false;
            return;
        }
        if (onTap) onTap();
    });

    // 長押し時のブラウザのメニューを出さず、PCの右クリックでも説明を出す
    element.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        if (!longPressed) {
            cancel();
            // 直後のクリックを無視する（次の pointerdown でリセットされる）
            longPressed = true;
            onLongPress();
        }
    });
}
