// public/js/state/gameState.js

/**
 * Oyunun o anki tüm durumunu (state) barındıran objeyi oluşturur.
 * Başlangıçta test edebilmek için sahte (mock) bir oyuncu verisi ekliyoruz.
 * @returns {Object} Oyun durum objesi
 */
export function createGameState() {
    // sessionStorage'dan giriş yapan kullanıcının adını alıyoruz (yoksa 'Misafir' yapıyoruz)
    const currentUsername = sessionStorage.getItem('username') || 'Misafir';

    return {
        // Oyundaki tüm oyuncuların listesi
        players: [
            {
                id: 'local_player_1',       // İleride bu sunucudan gelen benzersiz ID olacak
                username: currentUsername,  // Ekranda gösterilecek isim
                x: 480,                     // Haritanın ortasından başlat (960 / 2)
                y: 270,                     // Haritanın ortasından başlat (540 / 2)
                rotation: 0,                // Tankın gövdesinin dönüş açısı (radyan cinsinden)
                turretRotation: 0,          // Namlunun (farenin baktığı) dönüş açısı
                health: 100,                // Tankın canı
                score: 0,                   // Oyuncunun skoru
                color: 'blue'               // Takım veya tank rengi
            }
        ],
        
        // Ekranda süzülen tüm mermiler
        bullets: [],

        // Haritadaki sabit duvarlar ve engeller (YENİ EKLENDİ)
        obstacles: [
            { x: 150, y: 150, width: 200, height: 40, color: '#555' }, // Sol üst yatay duvar
            { x: 650, y: 150, width: 40, height: 200, color: '#555' }, // Sağ dikey duvar
            { x: 300, y: 400, width: 300, height: 40, color: '#555' }  // Alt yatay duvar
        ],

        // Harita bilgileri (Çarpışma hesaplamaları ve kamera sınırları için)
        world: {
            width: 960,
            height: 540
        }
    };
}