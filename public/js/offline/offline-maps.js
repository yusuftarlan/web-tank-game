

// Tüm haritalarda standart olan dış sınırları bir değişkende tutalım
const BORDERS = [
    { x: 0, y: 0, width: 1920, height: 20 },
    { x: 0, y: 1060, width: 1920, height: 20 },
    { x: 0, y: 0, width: 20, height: 1080 },
    { x: 1900, y: 0, width: 20, height: 1080 }
];

export const MAPS = {

    // ─── 1. FORTRESS ────────────────────────────────────────────────────────────
    // Ortada U-şekilli kale (tek tarafı açık), köşelerde L-barikatlar.
    // İç kale duvarı kaldırıldı — tamamen kapalı kutu oluşturuyordu.
    FORTRESS: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Dış kale duvarları — sağ taraf açık (giriş var)
            { x: 760, y: 340, width: 400, height: 40 },  // üst
            { x: 760, y: 340, width: 40, height: 400 },  // sol
            { x: 760, y: 700, width: 400, height: 40 },  // alt
            // sağ duvar YOK → merkeze girilip çıkılabilir
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
    // Sarmal koridor — her katmanda açık geçiş bırakıldı, kapalı döngü yok.
    // Her duvar segmenti arasında tank geçecek kadar boşluk var (min 160px).
    SPIRAL: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // 1. spiral katmanı (dış) — sol alt köşe açık
            { x: 200, y: 200, width: 1520, height: 40 },
            { x: 200, y: 200, width: 40, height: 480 },  // eski 680 → 480, alt geçiş açık
            { x: 360, y: 840, width: 1200, height: 40 },
            { x: 1520, y: 360, width: 40, height: 520 },
            // 2. spiral katmanı — üst geçiş açık
            { x: 520, y: 360, width: 840, height: 40 },  // sol boşluk bırakıldı (360→520)
            { x: 360, y: 520, width: 40, height: 280 },  // eski 440 → 280
            { x: 520, y: 760, width: 800, height: 40 },
            { x: 1360, y: 440, width: 40, height: 360 },
            // 3. spiral katmanı — sağ geçiş açık
            { x: 520, y: 520, width: 520, height: 40 },  // eski 680 → 520
            { x: 520, y: 520, width: 40, height: 200 },  // eski 280 → 200
            { x: 680, y: 680, width: 360, height: 40 },  // eski 520 → 360, sağ geçiş açık
        ]
    },

    // ─── 3. BUNKER_HILL ─────────────────────────────────────────────────────────
    // Yatay üç koridor katmanı — değişiklik gerekmedi, zaten açık geçişler var.
    BUNKER_HILL: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            { x: 0,    y: 420, width: 580, height: 40 },
            { x: 680,  y: 420, width: 560, height: 40 },
            { x: 1340, y: 420, width: 580, height: 40 },
            { x: 0,    y: 620, width: 580, height: 40 },
            { x: 680,  y: 620, width: 560, height: 40 },
            { x: 1340, y: 620, width: 580, height: 40 },
            { x: 280,  y: 200, width: 40, height: 220 },
            { x: 960,  y: 200, width: 40, height: 220 },
            { x: 1640, y: 200, width: 40, height: 220 },
            { x: 280,  y: 660, width: 40, height: 220 },
            { x: 960,  y: 660, width: 40, height: 220 },
            { x: 1640, y: 660, width: 40, height: 220 },
            { x: 100,  y: 520, width: 140, height: 100 },
            { x: 840,  y: 520, width: 240, height: 40  },
            { x: 1580, y: 520, width: 140, height: 100 },
        ]
    },

    // ─── 4. CORRIDORS ───────────────────────────────────────────────────────────
    // Beş paralel dikey duvar — değişiklik gerekmedi, geçişler zaten var.
    CORRIDORS: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            { x: 300, y: 0,   width: 40, height: 360 },
            { x: 300, y: 460, width: 40, height: 280 },
            { x: 300, y: 840, width: 40, height: 240 },
            { x: 620, y: 0,   width: 40, height: 100 },
            { x: 620, y: 200, width: 40, height: 280 },
            { x: 620, y: 600, width: 40, height: 280 },
            { x: 620, y: 980, width: 40, height: 100 },
            { x: 940, y: 0,   width: 40, height: 440 },
            { x: 940, y: 540, width: 40, height: 540 },
            { x: 1260, y: 0,   width: 40, height: 100 },
            { x: 1260, y: 200, width: 40, height: 280 },
            { x: 1260, y: 600, width: 40, height: 280 },
            { x: 1260, y: 980, width: 40, height: 100 },
            { x: 1580, y: 0,   width: 40, height: 360 },
            { x: 1580, y: 460, width: 40, height: 280 },
            { x: 1580, y: 840, width: 40, height: 240 },
            { x: 300, y: 410,  width: 260, height: 40 },
            { x: 1380, y: 410, width: 260, height: 40 },
        ]
    },

    // ─── 5. CATHEDRAL ───────────────────────────────────────────────────────────
    // Yan kanat duvarları ortada geçiş bırakıyor — kapan yok.
    CATHEDRAL: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            { x: 880, y: 80,  width: 160, height: 380 },
            { x: 880, y: 620, width: 160, height: 380 },
            { x: 560, y: 280, width: 40, height: 520 },
            { x: 1320, y: 280, width: 40, height: 520 },
            { x: 200, y: 150, width: 320, height: 40 },
            { x: 200, y: 890, width: 320, height: 40 },
            { x: 1400, y: 150, width: 320, height: 40 },
            { x: 1400, y: 890, width: 320, height: 40 },
            { x: 200, y: 150, width: 40, height: 400 },
            { x: 200, y: 650, width: 40, height: 280 },
            { x: 1680, y: 150, width: 40, height: 400 },
            { x: 1680, y: 650, width: 40, height: 280 },
            { x: 380, y: 490, width: 140, height: 100 },
            { x: 1400, y: 490, width: 140, height: 100 },
        ]
    },

    // ─── 6. RICOCHET ────────────────────────────────────────────────────────────
    // İç çerçeve bağlantı segmentleri KALDIRILDI — bunlar kapalı oda yapıyordu.
    // Merkez blok tek parça, etrafı her yönden açık.
    RICOCHET: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Köşe kancaları (L şekil)
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
            // İç çerçeve — sadece üst ve alt bar, yan duvar YOK (kapalı oda olmasin)
            { x: 600, y: 340, width: 720, height: 40 },
            { x: 600, y: 700, width: 720, height: 40 },
            // Merkez tek blok
            { x: 840, y: 440, width: 240, height: 200 },
            // Bağlantı segmentleri KALDIRILDI (640,440 ve 1220,440 vb.) — kapalı oda yapıyordu
        ]
    },

    // ─── 7. WARZONE ─────────────────────────────────────────────────────────────
    // Merkez oda yan duvarları kaldırıldı — sadece üst/alt bar ve iç blok kaldı.
    // Eski yan segmentler (700,300,40,200) ve (700,600,40,140) kapan oluşturuyordu.
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
            // Orta bölge sütunları
            { x: 400, y: 150, width: 40, height: 300 },
            { x: 400, y: 630, width: 40, height: 300 },
            { x: 1480, y: 150, width: 40, height: 300 },
            { x: 1480, y: 630, width: 40, height: 300 },
            // Merkez — sadece üst/alt bar (yan duvarlar kaldırıldı)
            { x: 700, y: 300, width: 520, height: 40 },
            { x: 700, y: 740, width: 520, height: 40 },
            // Merkez iç blok (tek parça, etrafı açık)
            { x: 840, y: 440, width: 240, height: 200 },
            // Açık alan siperler
            { x: 550, y: 490, width: 100, height: 100 },
            { x: 1270, y: 490, width: 100, height: 100 },
        ]
    },

    // ─── 8. PIPELINE ────────────────────────────────────────────────────────────
    // Pompa odası sol duvarı kaldırıldı — 3 tarafı kapalıydı, şimdi U-şekli.
    PIPELINE: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            { x: 0,    y: 240, width: 500, height: 40 },
            { x: 560,  y: 240, width: 800, height: 40 },
            { x: 1420, y: 240, width: 500, height: 40 },
            { x: 0,    y: 800, width: 500, height: 40 },
            { x: 560,  y: 800, width: 800, height: 40 },
            { x: 1420, y: 800, width: 500, height: 40 },
            { x: 460,  y: 240, width: 40, height: 200 },
            { x: 1420, y: 240, width: 40, height: 200 },
            { x: 460,  y: 640, width: 40, height: 200 },
            { x: 1420, y: 640, width: 40, height: 200 },
            { x: 200,  y: 400, width: 40, height: 280 },
            { x: 1680, y: 400, width: 40, height: 280 },
            // Pompa odası — sol duvar KALDIRILDI, U-şekli (üst+alt+sağ)
            { x: 760,  y: 380, width: 400, height: 40 },
            { x: 760,  y: 640, width: 400, height: 40 },
            { x: 1120, y: 380, width: 40, height: 310 },
            // sol duvar (760,380,40,310) KALDIRILDI
        ]
    },

    // ─── 9. MAZE_RUNNER ─────────────────────────────────────────────────────────
    // Her labirent köşesinde en az bir açık geçiş var — değişiklik gerekmedi.
    MAZE_RUNNER: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            { x: 100, y: 100, width: 300, height: 40 },
            { x: 100, y: 100, width: 40, height: 260 },
            { x: 100, y: 460, width: 40, height: 260 },
            { x: 100, y: 820, width: 300, height: 40 },
            { x: 500, y: 200, width: 300, height: 40 },
            { x: 500, y: 200, width: 40, height: 240 },
            { x: 500, y: 600, width: 40, height: 280 },
            { x: 500, y: 840, width: 300, height: 40 },
            { x: 900, y: 100, width: 40, height: 380 },
            { x: 900, y: 600, width: 40, height: 380 },
            { x: 1000, y: 240, width: 300, height: 40 },
            { x: 1000, y: 780, width: 300, height: 40 },
            { x: 1300, y: 240, width: 40, height: 280 },
            { x: 1300, y: 680, width: 40, height: 260 },
            { x: 1300, y: 100, width: 300, height: 40 },
            { x: 1300, y: 940, width: 300, height: 40 },
            { x: 1500, y: 340, width: 40, height: 400 },
            { x: 660,  y: 440, width: 200, height: 200 },
            { x: 1060, y: 440, width: 200, height: 200 },
        ]
    },

    // ─── 10. DUEL_ISLAND ────────────────────────────────────────────────────────
    // Köprü odası tamamen kapalıydı — üst ve alt duvarlar KALDIRILDI.
    // Şimdi merkez kanal: sadece iki dikey duvar, üstten ve alttan geçilebilir.
    DUEL_ISLAND: {
        world: { width: 1920, height: 1080 },
        obstacles: [
            ...BORDERS,
            // Merkez kanal — sadece iki dikey duvar (üst/alt kapılar kaldırıldı)
            { x: 800,  y: 0,   width: 40, height: 420 },
            { x: 800,  y: 660, width: 40, height: 420 },
            { x: 1080, y: 0,   width: 40, height: 420 },
            { x: 1080, y: 660, width: 40, height: 420 },
            // yatay kapılar (800,380 ve 800,660) KALDIRILDI — kapalı kutu yapıyordu
            // Sol ada dış duvarı
            { x: 300, y: 200, width: 40, height: 680 },
            // Sağ ada dış duvarı
            { x: 1580, y: 200, width: 40, height: 680 },
            // Sol ada kapaklar
            { x: 300, y: 200, width: 200, height: 40 },
            { x: 300, y: 840, width: 200, height: 40 },
            // Sağ ada kapaklar
            { x: 1420, y: 200, width: 200, height: 40 },
            { x: 1420, y: 840, width: 200, height: 40 },
            // İç siperler
            { x: 100, y: 400, width: 160, height: 40 },
            { x: 100, y: 640, width: 160, height: 40 },
            { x: 1660, y: 400, width: 160, height: 40 },
            { x: 1660, y: 640, width: 160, height: 40 },
            // Köprü yaklaşım siperleri
            { x: 560,  y: 340, width: 180, height: 40 },
            { x: 1180, y: 340, width: 180, height: 40 },
            { x: 560,  y: 700, width: 180, height: 40 },
            { x: 1180, y: 700, width: 180, height: 40 },
        ]
    }
};