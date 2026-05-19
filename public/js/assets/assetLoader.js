// public/js/assets/assetLoader.js

// Yüklenen tüm görselleri ve sesleri hafızada tutacağımız depo
const assets = {
    images: {},
    audio: {}
};

/**
 * Tek bir görseli yükleyen ve Promise döndüren yardımcı fonksiyon.
 * @param {string} name - Görsele vereceğimiz isim (ör: 'tankBlue')
 * @param {string} src - Görselin dosya yolu (ör: '/assets/sprites/tank.png')
 * @returns {Promise} Görsel yüklendiğinde çözülen (resolve) promise.
 */
function loadImage(name, src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            assets.images[name] = img; // Yüklenen görseli depoya ekle
            resolve(img);
        };
        img.onerror = () => {
            console.error(`Görsel yüklenemedi: ${src}`);
            reject(new Error(`Görsel yükleme hatası: ${src}`));
        };
        img.src = src;
    });
}

/**
 * Oyunun ihtiyaç duyduğu tüm varlıkları asenkron olarak yükler.
 * Bu fonksiyon game-client.js içinde 'await' ile beklenir.
 */
export async function loadGameAssets() {
    console.log('Oyun varlıkları yükleniyor...');

    // Yüklenmesini istediğimiz tüm görsellerin listesi
    // İleride kendi png/jpg dosyalarını oluşturduğunda başındaki // işaretlerini kaldırabilirsin.
    const imagePromises = [
        // Gerçek tank görselini 'tankBody' adıyla yüklüyoruz.
        // DİKKAT: 'public/assets/sprites/tank-blue.png' dosyasının var olduğundan emin ol!
        loadImage('tankBody', '/assets/sprites/tank-blue.png')
    ];

    try {
        // Promise.all, dizideki TÜM yükleme işlemleri bitene kadar bekler
        await Promise.all(imagePromises);
        console.log('Tüm varlıklar başarıyla yüklendi!');
    } catch (error) {
        console.error('Oyun başlatılırken kritik bir varlık yüklenemedi!', error);
        throw error; // Hatayı fırlatıyoruz ki oyun hatalı durumda başlamasın
    }
}

/**
 * Renderer (Çizim Motoru) tarafından yüklü görselleri almak için kullanılır.
 * Örnek kullanım: const tankImg = getImage('tankBlue');
 * @param {string} name - Alınmak istenen görselin ismi
 * @returns {HTMLImageElement} Yüklü görsel nesnesi
 */
export function getImage(name) {
    return assets.images[name];
}