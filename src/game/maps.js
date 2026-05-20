// src/game/maps.js

// Tüm haritalarda standart olan dış sınırları bir değişkende tutalım
const BORDERS = [
    { x: 0, y: 0, width: 1920, height: 20 },
    { x: 0, y: 1060, width: 1920, height: 20 },
    { x: 0, y: 0, width: 20, height: 1080 },
    { x: 1900, y: 0, width: 20, height: 1080 }
];

export const MAPS = {

    // ─── 1. FORTRESS ────────────────────────────────────────────────────────────
    // Ortada çift duvarlı kale, köşelerde L-şekilli barikatlar.
    // Strateji: merkezi tutmak büyük avantaj sağlar, ama savunmak zordur.
    FORTRESS: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Dış kale duvarları (kare çerçeve)
            { x: 760, y: 340, width: 400, height: 40 },  // üst
            { x: 760, y: 340, width: 40, height: 400 },  // sol
            { x: 1120, y: 340, width: 40, height: 400 }, // sağ
            { x: 760, y: 700, width: 400, height: 40 },  // alt
            // İç kale duvarları (küçük kare)
            { x: 855, y: 430, width: 210, height: 220 },
            // Köşe barikatları (L şekil, 4 köşe)
            { x: 200, y: 150, width: 40, height: 280 },
            { x: 200, y: 150, width: 200, height: 40 },
            { x: 1480, y: 150, width: 40, height: 280 },
            { x: 1520, y: 150, width: 200, height: 40 },
            { x: 200, y: 650, width: 40, height: 280 },
            { x: 200, y: 890, width: 200, height: 40 },
            { x: 1480, y: 650, width: 40, height: 280 },
            { x: 1520, y: 890, width: 200, height: 40 },
            // Yan koridorları daraltan bloklar
            { x: 500, y: 500, width: 120, height: 40 },
            { x: 1300, y: 500, width: 120, height: 40 },
        ]
    },

    // ─── 2. SPIRAL ──────────────────────────────────────────────────────────────
    // İçe doğru daralan sarmal koridor. Merkezde açık küçük alan.
    // Strateji: pozisyon tahmin etmek zordur; yavaş ilerlemek kritik.
    SPIRAL: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // 1. spiral katmanı (dış)
            { x: 200, y: 200, width: 1520, height: 40 },
            { x: 200, y: 200, width: 40, height: 680 },
            { x: 360, y: 840, width: 1200, height: 40 },
            { x: 1520, y: 360, width: 40, height: 520 },
            // 2. spiral katmanı
            { x: 360, y: 360, width: 1000, height: 40 },
            { x: 360, y: 360, width: 40, height: 440 },
            { x: 520, y: 760, width: 800, height: 40 },
            { x: 1360, y: 440, width: 40, height: 360 },
            // 3. spiral katmanı
            { x: 520, y: 440, width: 680, height: 40 },
            { x: 520, y: 440, width: 40, height: 280 },
            { x: 680, y: 680, width: 520, height: 40 },
            // 4. spiral katmanı (iç)
            { x: 680, y: 520, width: 480, height: 40 },
            { x: 1160, y: 520, width: 40, height: 200 },
        ]
    },

    // ─── 3. BUNKER_HILL ─────────────────────────────────────────────────────────
    // Yatay üç koridor katmanı, dikey geçiş noktalarıyla.
    // Strateji: katta kalmak ve koridorları kontrol etmek.
    BUNKER_HILL: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Üst yatay barikat çizgisi (3 bölüm, ortada 2 geçiş)
            { x: 0, y: 420, width: 600, height: 40 },
            { x: 660, y: 420, width: 600, height: 40 },
            { x: 1320, y: 420, width: 600, height: 40 },
            // Alt yatay barikat çizgisi
            { x: 0, y: 620, width: 600, height: 40 },
            { x: 660, y: 620, width: 600, height: 40 },
            { x: 1320, y: 620, width: 600, height: 40 },
            // Dikey destek sütunları (üst bölge)
            { x: 280, y: 200, width: 40, height: 220 },
            { x: 960, y: 200, width: 40, height: 220 },
            { x: 1640, y: 200, width: 40, height: 220 },
            // Dikey destek sütunları (alt bölge)
            { x: 280, y: 660, width: 40, height: 220 },
            { x: 960, y: 660, width: 40, height: 220 },
            { x: 1640, y: 660, width: 40, height: 220 },
            // Orta koridoru zorlayan bloklar
            { x: 100, y: 520, width: 140, height: 100 },
            { x: 840, y: 520, width: 240, height: 40 },
            { x: 1580, y: 520, width: 140, height: 100 },
        ]
    },

    // ─── 4. CORRIDORS ───────────────────────────────────────────────────────────
    // Beş paralel dikey duvar, geçişler farklı yüksekliklerde.
    // Strateji: yana geçmek zor, doğrusal hamleler tehlikeli.
    CORRIDORS: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // 1. dikey duvar
            { x: 300, y: 0, width: 40, height: 360 },
            { x: 300, y: 460, width: 40, height: 280 },
            { x: 300, y: 840, width: 40, height: 240 },
            // 2. dikey duvar
            { x: 620, y: 0, width: 40, height: 100 },
            { x: 620, y: 200, width: 40, height: 280 },
            { x: 620, y: 600, width: 40, height: 280 },
            { x: 620, y: 980, width: 40, height: 100 },
            // 3. dikey duvar (orta, tek geçiş)
            { x: 940, y: 0, width: 40, height: 440 },
            { x: 940, y: 540, width: 40, height: 540 },
            // 4. dikey duvar
            { x: 1260, y: 0, width: 40, height: 100 },
            { x: 1260, y: 200, width: 40, height: 280 },
            { x: 1260, y: 600, width: 40, height: 280 },
            { x: 1260, y: 980, width: 40, height: 100 },
            // 5. dikey duvar
            { x: 1580, y: 0, width: 40, height: 360 },
            { x: 1580, y: 460, width: 40, height: 280 },
            { x: 1580, y: 840, width: 40, height: 240 },
            // Yatay geçişleri engelleyen bariyerler
            { x: 300, y: 410, width: 260, height: 40 },
            { x: 1380, y: 410, width: 260, height: 40 },
        ]
    },

    // ─── 5. CATHEDRAL ───────────────────────────────────────────────────────────
    // Dikey nef ve iki yan kanat; içe açılan apsis koridorları.
    // Strateji: orta nef açık ve tehlikeli, kanatlar güvenli ama dar.
    CATHEDRAL: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Merkez dikey duvarlar (nef)
            { x: 880, y: 80, width: 160, height: 380 },
            { x: 880, y: 620, width: 160, height: 380 },
            // Yan sütunlar
            { x: 560, y: 280, width: 40, height: 520 },
            { x: 1320, y: 280, width: 40, height: 520 },
            // Sol kanat üst ve alt duvarlar
            { x: 200, y: 150, width: 320, height: 40 },
            { x: 200, y: 890, width: 320, height: 40 },
            // Sağ kanat üst ve alt duvarlar
            { x: 1400, y: 150, width: 320, height: 40 },
            { x: 1400, y: 890, width: 320, height: 40 },
            // Sol kanat dikey duvarlar
            { x: 200, y: 150, width: 40, height: 400 },
            { x: 200, y: 650, width: 40, height: 280 },
            // Sağ kanat dikey duvarlar
            { x: 1680, y: 150, width: 40, height: 400 },
            { x: 1680, y: 650, width: 40, height: 280 },
            // Apsis blokları (yan geçiş odaları)
            { x: 380, y: 490, width: 140, height: 100 },
            { x: 1400, y: 490, width: 140, height: 100 },
        ]
    },

    // ─── 6. RICOCHET ────────────────────────────────────────────────────────────
    // Çerçeveli iç oda, köşelerde kancalar ve çok sayıda dar giriş.
    // Strateji: merkezde gizlenmek kolay, ama çıkış noktaları öngörülebilir.
    RICOCHET: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Köşe kancaları (4 köşe, L şekil)
            { x: 200, y: 200, width: 200, height: 40 },
            { x: 200, y: 200, width: 40, height: 200 },
            { x: 1520, y: 200, width: 200, height: 40 },
            { x: 1680, y: 200, width: 40, height: 200 },
            { x: 200, y: 840, width: 200, height: 40 },
            { x: 200, y: 640, width: 40, height: 200 },
            { x: 1520, y: 840, width: 200, height: 40 },
            { x: 1680, y: 640, width: 40, height: 200 },
            // Üst ve alt uzun barlar
            { x: 700, y: 180, width: 520, height: 40 },
            { x: 700, y: 860, width: 520, height: 40 },
            // Yan kısa dikey barlar
            { x: 400, y: 440, width: 40, height: 200 },
            { x: 1480, y: 440, width: 40, height: 200 },
            // İç çerçeve üst ve alt
            { x: 600, y: 340, width: 720, height: 40 },
            { x: 600, y: 700, width: 720, height: 40 },
            // Merkez kapalı blok
            { x: 800, y: 440, width: 320, height: 200 },
            // İç çerçeve sol-sağ bağlantı segmentleri
            { x: 640, y: 440, width: 60, height: 40 },
            { x: 1220, y: 440, width: 60, height: 40 },
            { x: 640, y: 660, width: 60, height: 40 },
            { x: 1220, y: 660, width: 60, height: 40 },
        ]
    },

    // ─── 7. WARZONE ─────────────────────────────────────────────────────────────
    // İki kamp (sol-sağ), merkezde çatışma bölgesi ve ateş noktaları.
    // Strateji: kamp içi savunma kolayken merkeze geçmek büyük risk.
    WARZONE: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Sol kamp siperleri
            { x: 100, y: 300, width: 200, height: 40 },
            { x: 100, y: 400, width: 40, height: 280 },
            { x: 100, y: 680, width: 200, height: 40 },
            // Sağ kamp siperleri
            { x: 1620, y: 300, width: 200, height: 40 },
            { x: 1780, y: 400, width: 40, height: 280 },
            { x: 1620, y: 680, width: 200, height: 40 },
            // Sol orta bölge sütunları
            { x: 400, y: 150, width: 40, height: 300 },
            { x: 400, y: 630, width: 40, height: 300 },
            // Sağ orta bölge sütunları
            { x: 1480, y: 150, width: 40, height: 300 },
            { x: 1480, y: 630, width: 40, height: 300 },
            // Merkez oda üst ve alt
            { x: 700, y: 300, width: 520, height: 40 },
            { x: 700, y: 740, width: 520, height: 40 },
            // Merkez oda yan duvarlar (geçişli)
            { x: 700, y: 300, width: 40, height: 200 },
            { x: 700, y: 600, width: 40, height: 140 },
            { x: 1180, y: 300, width: 40, height: 200 },
            { x: 1180, y: 600, width: 40, height: 140 },
            // Merkez iç blok
            { x: 840, y: 440, width: 240, height: 200 },
            // Açık alan siperler
            { x: 550, y: 490, width: 100, height: 100 },
            { x: 1270, y: 490, width: 100, height: 100 },
        ]
    },

    // ─── 8. PIPELINE ────────────────────────────────────────────────────────────
    // Üst ve alt uzun boru hatları; merkezi oda ve geçiş vanları.
    // Strateji: yatay koşu avantajlı ama boru geçişleri tuzak noktası.
    PIPELINE: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Üst boru hattı (3 parça, 2 geçiş)
            { x: 0, y: 240, width: 500, height: 40 },
            { x: 560, y: 240, width: 800, height: 40 },
            { x: 1420, y: 240, width: 500, height: 40 },
            // Alt boru hattı (3 parça, 2 geçiş)
            { x: 0, y: 800, width: 500, height: 40 },
            { x: 560, y: 800, width: 800, height: 40 },
            { x: 1420, y: 800, width: 500, height: 40 },
            // Vana bağlantı dikey segmentleri (üst)
            { x: 460, y: 240, width: 40, height: 200 },
            { x: 1420, y: 240, width: 40, height: 200 },
            // Vana bağlantı dikey segmentleri (alt)
            { x: 460, y: 640, width: 40, height: 200 },
            { x: 1420, y: 640, width: 40, height: 200 },
            // Yan depo blokları
            { x: 200, y: 400, width: 40, height: 280 },
            { x: 1680, y: 400, width: 40, height: 280 },
            // Merkez pompa odası
            { x: 760, y: 380, width: 400, height: 40 },
            { x: 760, y: 640, width: 400, height: 40 },
            { x: 760, y: 380, width: 40, height: 310 },
            { x: 1120, y: 380, width: 40, height: 310 },
        ]
    },

    // ─── 9. MAZE_RUNNER ─────────────────────────────────────────────────────────
    // Asimetrik labirent; her köşe farklı, merkez geçişsiz iki büyük blok.
    // Strateji: haritayı ezberlemek kritik avantaj sağlar.
    MAZE_RUNNER: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Sol üst labirent bölümü
            { x: 100, y: 100, width: 300, height: 40 },
            { x: 100, y: 100, width: 40, height: 260 },
            { x: 100, y: 460, width: 40, height: 260 },
            { x: 100, y: 820, width: 300, height: 40 },
            // Sol orta labirent bölümü
            { x: 500, y: 200, width: 300, height: 40 },
            { x: 500, y: 200, width: 40, height: 240 },
            { x: 500, y: 600, width: 40, height: 280 },
            { x: 500, y: 840, width: 300, height: 40 },
            // Orta dikey ayırıcı (iki parça)
            { x: 900, y: 100, width: 40, height: 380 },
            { x: 900, y: 600, width: 40, height: 380 },
            // Sağ orta labirent bölümü
            { x: 1000, y: 240, width: 300, height: 40 },
            { x: 1000, y: 780, width: 300, height: 40 },
            { x: 1300, y: 240, width: 40, height: 280 },
            { x: 1300, y: 680, width: 40, height: 260 },
            // Sağ üst labirent bölümü
            { x: 1300, y: 100, width: 300, height: 40 },
            { x: 1300, y: 940, width: 300, height: 40 },
            { x: 1500, y: 340, width: 40, height: 400 },
            // İki büyük iç blok (merkez engeller)
            { x: 660, y: 440, width: 200, height: 200 },
            { x: 1060, y: 440, width: 200, height: 200 },
        ]
    },

    // ─── 10. DUEL_ISLAND ────────────────────────────────────────────────────────
    // Sol ve sağ ada bölgeleri, ortada köprü odası; her iki taraf simetrik.
    // Strateji: ada içi savunma güçlü, köprüye geçmek yüksek riskli.
    DUEL_ISLAND: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Köprü odası (merkez dikey duvarlar + üst-alt kapılar)
            { x: 800, y: 0, width: 40, height: 380 },
            { x: 800, y: 700, width: 40, height: 380 },
            { x: 1080, y: 0, width: 40, height: 380 },
            { x: 1080, y: 700, width: 40, height: 380 },
            { x: 800, y: 380, width: 320, height: 40 },
            { x: 800, y: 660, width: 320, height: 40 },
            // Sol ada dış duvarı
            { x: 300, y: 200, width: 40, height: 680 },
            // Sağ ada dış duvarı
            { x: 1580, y: 200, width: 40, height: 680 },
            // Sol ada üst ve alt kapaklar
            { x: 300, y: 200, width: 200, height: 40 },
            { x: 300, y: 840, width: 200, height: 40 },
            // Sağ ada üst ve alt kapaklar
            { x: 1420, y: 200, width: 200, height: 40 },
            { x: 1420, y: 840, width: 200, height: 40 },
            // Sol ada iç siper çiftleri
            { x: 100, y: 400, width: 160, height: 40 },
            { x: 100, y: 640, width: 160, height: 40 },
            // Sağ ada iç siper çiftleri
            { x: 1660, y: 400, width: 160, height: 40 },
            { x: 1660, y: 640, width: 160, height: 40 },
            // Köprü yaklaşım siperleri (sol ve sağ)
            { x: 560, y: 340, width: 180, height: 40 },
            { x: 1180, y: 340, width: 180, height: 40 },
            { x: 560, y: 700, width: 180, height: 40 },
            { x: 1180, y: 700, width: 180, height: 40 },
        ]
    }
};