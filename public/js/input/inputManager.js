// public/js/input/inputManager.js

// Oyuncunun o anki komutlarını tutan merkezi obje
const inputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    mouseX: 0,
    mouseY: 0,
    isShooting: false,
    reloadRequested: false
};

let reloadKeyHeld = false;

/**
 * Klavye ve fare dinleyicilerini (event listener) başlatır.
 * Sadece bir kere oyun başlarken çağrılır.
 * @param {HTMLCanvasElement} canvas - Fare koordinatlarını hesaplamak için canvas elementi
 */
export function initInput(canvas) {
    // Klavye tuşuna basıldığında (keydown)
    window.addEventListener('keydown', (e) => handleKey(e.code, true));
    
    // Klavye tuşu bırakıldığında (keyup)
    window.addEventListener('keyup', (e) => handleKey(e.code, false));

    // Fare canvas üzerinde hareket ettiğinde (namluyu çevirmek için)
    window.addEventListener('mousemove', (e) => {
        // ÇÖZÜM: Ekran çözünürlüğü ile oyun içi (1920x1080) çözünürlüğü oranla
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        inputState.mouseX = (e.clientX - rect.left) * scaleX;
        inputState.mouseY = (e.clientY - rect.top) * scaleY;
    });

    // Farenin sol tuşuna basıldığında (ateş etmek için)
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) inputState.isShooting = true; // 0 = Sol tık
    });

    // Farenin sol tuşu bırakıldığında
    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) inputState.isShooting = false;
    });
}

/**
 * Basılan tuşlara göre inputState objesini günceller.
 * WASD veya Yön Tuşlarını destekler.
 */
function handleKey(keyCode, isPressed) {
    switch(keyCode) {
        case 'KeyW':
        case 'ArrowUp':
            inputState.up = isPressed;
            break;
        case 'KeyS':
        case 'ArrowDown':
            inputState.down = isPressed;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            inputState.left = isPressed;
            break;
        case 'KeyD':
        case 'ArrowRight':
            inputState.right = isPressed;
            break;
        case 'KeyR':
            if (isPressed && !reloadKeyHeld) {
                inputState.reloadRequested = true;
            }
            reloadKeyHeld = isPressed;
            break;
    }
}

/**
 * Oyun döngüsü (game loop) tarafından güncel girdileri okumak için kullanılır.
 * @returns {Object} Güncel input durumu
 */
export function getInputState() {
    // Referans sorunlarını önlemek için objenin bir kopyasını döndürüyoruz
    const snapshot = { ...inputState };
    inputState.reloadRequested = false;
    return snapshot;
}
