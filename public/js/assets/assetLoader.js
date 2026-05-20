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
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            assets.images[name] = img; // Yüklenen görseli depoya ekle
            resolve(img);
        };
        img.onerror = () => {
            // YENİ: Reject (çökme) yerine konsola uyarı basıp devam ediyoruz
            console.warn(`[UYARI] Görsel bulunamadı: ${src}. Sistem yedek şekilleri kullanacak.`);
            resolve(null); 
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

    const imagePromises = [
        loadImage('tankBody', '/assets/sprites/tank-blue.png')
    ];

    try {
        await Promise.all(imagePromises);
        console.log('Varlık yükleme işlemi tamamlandı!');
    } catch (error) {
        // Artık buraya düşmeyecek çünkü loadImage hata fırlatmıyor
        console.error('Kritik varlık hatası!', error);
    }
}

/**
 * Renderer (Çizim Motoru) tarafından yüklü görselleri almak için kullanılır.
 * @param {string} name - Alınmak istenen görselin ismi
 * @returns {HTMLImageElement} Yüklü görsel nesnesi
 */
export function getImage(name) {
    return assets.images[name];
}