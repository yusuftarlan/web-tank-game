// public/js/assets/assetLoader.js
const assets = {};

const imagePaths = {
    // Tanklar
    'tank-blue': '/assets/sprites/tank-blue.png',
    'tank-red': '/assets/sprites/tank-red.png',
    'tank-green': '/assets/sprites/tank-green.png',
    'tank-grey': '/assets/sprites/tank-grey.png',
    
    // Mermiler
    'bullet-NORMAL': '/assets/sprites/Gun_01_A.png',
    'bullet-AOE_EXPLOSION': '/assets/sprites/AOE_BULLET.png',
    'bullet-GHOST_BULLET': '/assets/sprites/Ghost_Bullet.png',
    'bullet-HOMING_MISSILE': '/assets/sprites/HOMING_MISSILE.png',
    
    // Duvar
    'wall': '/assets/sprites/Wall.png',

    // Namlu
        'turret': '/assets/sprites/Gun_01_A.png',

    // Güçlendirmeler
    'effect-aoe-cluster': '/assets/effects/AOE&CLUSTER_BOMB.png',
    
    // Patlama Animasyonu Kareleri
    'explosion-1': '/assets/effects/Explosion_D.png',
    'explosion-2': '/assets/effects/Explosion_E.png',
    'explosion-3': '/assets/effects/Explosion_F.png'
};

export async function loadGameAssets() {
    const promises = Object.entries(imagePaths).map(([key, path]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.src = path;

            img.onload = async () => {
                if (typeof img.decode === 'function') {
                    try {
                        await img.decode();
                    } catch (error) {
                        // Bazı tarayıcılar image load sonrası decode reject edebilir; görsel yine çizilebilir.
                    }
                }

                assets[key] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Görsel yüklenemedi: ${path}`);
                resolve(); // Oyunun çökmemesi için hatayı yoksay ve devam et
            };
        });
    });

    await Promise.all(promises);
    console.log('[SİSTEM] Tüm oyun görselleri başarıyla yüklendi.');
}

export function getImage(key) {
    return assets[key];
}
