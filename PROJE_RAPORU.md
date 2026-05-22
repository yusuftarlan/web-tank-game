# WEB TANK GAME - PRO
JE RAPORU

---

## İÇİNDEKİLER

1. [Proje Bilgileri](#proje-bilgileri)
2. [Clean Code Prensipleri](#1-clean-code-prensipleri)
3. [Sistem Mimarileri](#2-sistem-mimarileri)
4. [UI Mimarileri](#3-ui-mimarileri)
5. [Tasarım Desenleri](#4-tasarım-desenleri)
6. [Test Aşaması](#5-test-aşaması)
7. [README ve Proje Paylaşımı](#6-readme-ve-proje-paylaşımı)
8. [Ekran Görüntüleri](#7-ekran-görüntüleri)

---

## Proje Bilgileri

**Proje Adı:** Web Tank Game  
**Tanımı:** Tarayıcı üzerinden oynanabilen, gerçek zamanlı ve çok oyunculu bir 2D tank savaşı oyunu  
**Teknolojiler:**
- **Backend:** Node.js, Express.js, WebSocket (ws)
- **Frontend:** HTML5, CSS3, Canvas, Vanilla JavaScript
- **Database:** RAM tabanlı geçici veri depolama
- **Diller:** JavaScript (ESM Modules)
- **Versiyon:** 1.0.0

**Proje Linki:** https://github.com/yusuftarlan/web-tank-game

---

## 1. Clean Code Prensipleri

### 1.1 Clean Code Nedir?

Clean Code, yazılım geliştirmede kodun okunabilirliğini, bakımlanabilirliğini ve anlaşılabilirliğini maksimum seviyeye çıkarmayı hedefleyen bir yaklaşımdır. Robert C. Martin tarafından ortaya konmuş prensiplerdir.

### 1.2 Projeye Uygulanmış Clean Code Prensipleri

#### **a) Anlamlı İsimler (Meaningful Names)**

✅ **Yapılan:**
```javascript
// src/meta/api/authRoutes.js
const token = `cmd_${uuidv4()}`;
const session = {
    username: username,
    currentRoom: null
};
```
Token ve session gibi açık, kendini açıklayan isimler kullanılmıştır.

#### **b) Dosya Organizasyonu (Modular Structure)**

✅ **Yapılan:**
```
src/
  ├── meta/          (Lobi ve API işlemleri)
  │   ├── api/       (API route'ları)
  │   └── pages/     (HTML sayfalarını sunan route'lar)
  ├── game/          (Oyun mantığı)
  ├── data/          (Veri depolama)
  └── shared/        (Paylaşılan sabitler)
```
Sorumluluklar kat kat ayırılmıştır (Separation of Concerns).

#### **c) Fonksiyonlar Tekil Sorumluluk Taşımalı (Single Responsibility)**

✅ **Yapılan:**
```javascript
// src/game/gameServer.js
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function getSafeSpawnPosition(room) {
    // Sadece spawn pozisyonu bulmakla ilgilenir
}
```
Her fonksiyon tek bir amaca hizmet eder.

#### **d) DRY Prensibinin Uygulanması (Don't Repeat Yourself)**

✅ **Yapılan:**
```javascript
// src/shared/messageTypes.js
export const MESSAGE_TYPES = {
    PLAYER_INPUT: 'PLAYER_INPUT',
    GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
    EXPLOSION: 'EXPLOSION'
};
```
Sabit mesaj tipleri merkezi yerde tanımlanmıştır, tekrarlama yoktur.

#### **⚠️ İyileştirilmesi Gereken Noktalar:**

1. **Yorum Eksikliği:** Karmaşık mantık bölümleri yorum içermemektedir
2. **Hata Yönetimi:** Try-catch blokları eksik, hata işleme yetersizdir
3. **Input Validation:** Girdi doğrulaması tam olarak yapılmamıştır
4. **Magic Numbers:** Sabit sayılar kodda doğrudan kullanılmakta

---

## 2. Sistem Mimarileri

### 2.1 Sistem Mimarilerine Genel Bakış

#### **a) Monolitik Mimari**
**Tanım:** Tüm fonksiyonların tek bir büyük uygulamada birleştirildiği mimaridir.

**Avantajları:**
- Basit deployment
- Düşük network latency
- Debugging kolaylığı

**Dezavantajları:**
- Scaling zorluğu
- Bir bileşen hata yaparsa tüm sistem etkilenir
- Teknoloji yükseltme zorluğu
- Büyük ve karmaşık kod tabanı

#### **b) Mikroservis Mimari**
**Tanım:** Uygulamanın bağımsız, küçük servislerden oluştuğu mimaridir.

**Avantajları:**
- Bağımsız scaling
- Hata izolasyonu
- Teknoloji esnekliği
- Hızlı deployment

**Dezavantajları:**
- Yüksek karmaşıklık
- Ağ latency problemleri
- Veri tutarlılığı sorunları
- DevOps bilgisi zorunlu

#### **c) Katmanlı Mimari**
**Tanım:** Uygulamanın birbirinden ayrı katmanlara (Presentation, Business Logic, Data) bölündüğü mimaridir.

**Avantajları:**
- Sorumluluk ayrımı
- Bakım kolaylığı
- Test edilebilirlik

**Dezavantajları:**
- Tight coupling riski
- Performance overhead
- Katmanlar arasında zor veri akışı

### 2.2 Web Tank Game'de Seçilen Mimari

**🎯 Katmanlı Mimari (Layered Architecture)**

Web Tank Game, katmanlı mimari yapısını kullanmıştır:

```
┌─────────────────────────────────────┐
│   PRESENTATION LAYER                 │
│   (HTML, CSS, Canvas UI)             │
│   public/                            │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   API LAYER                          │
│   (REST API Routes)                  │
│   src/meta/api/                      │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   BUSINESS LOGIC LAYER               │
│   (Game Logic, Authentication)       │
│   src/game/                          │
│   src/meta/                          │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   DATA LAYER                         │
│   (Data Storage, Management)         │
│   src/data/store.js                  │
└─────────────────────────────────────┘
```

**Seçilme Nedenleri:**

1. **Proje Ölçeği:** Başlangıç aşamasında mikroservis gerekmemektedir
2. **Basitlik:** Öğrenme ve geliştirme kolaylığı
3. **Hızlı Prototype:** Hızlı iterasyon için uygundur
4. **Bakım:** Yapı ve sorumluluk ayrımı net

**Dezavantajlara Karşı Alınan Önlemler:**

✅ Modüler yapı ve dosya organizasyonu  
✅ Route'ların `api` ve `pages` olarak ayrılması  
✅ İş mantığının oyun ve meta bölümlerine ayrılması

---

## 3. UI Mimarileri

### 3.1 UI Mimari Türleri

#### **a) MVC (Model-View-Controller)**
**Tanım:** Model (veri), View (görünüm) ve Controller (kontrol) olmak üzere üç bileşene ayrılan mimaridir.

```
┌─────────┐     ┌──────────┐     ┌────────────┐
│  Model  │────▶│ Controller├────▶│    View    │
│  (Data) │     │ (Logic)  │     │ (Display)  │
└─────────┘     └──────────┘     └────────────┘
     ▲                                   │
     └───────────────────────────────────┘
```

**Kullanım Alanları:** Geleneksel web uygulamaları, Java Spring, ASP.NET

#### **b) MVP (Model-View-Presenter)**
**Tanım:** Presenter'ın View ve Model arasında aracı olduğu mimaridir.

```
┌─────────┐                    ┌──────────┐
│  Model  │                    │   View   │
│  (Data) │                    │(Display) │
└────┬────┘                    └────▲─────┘
     │                              │
     │      ┌──────────────────────┤
     │      │   Presenter          │
     │      │   (Logic + Mediation)│
     │      │                      │
     └──────┼──────────────────────┘
            │
            │ (Geliştirilmiş Event Handling)
```

**Kullanım Alanları:** Android Uygulamaları, MVP Test Tabanlı Geliştirme

#### **c) MVVM (Model-View-ViewModel)**
**Tanım:** ViewModel'in View ile Model arasındaki dönüştürmeyi yaptığı, Data Binding ile otomatik senkronize olduğu mimaridir.

```
┌─────────┐
│  Model  │ (Data & Logic)
└────┬────┘
     │
     ▼
┌──────────────┐
│  ViewModel   │ (Transformation, State)
│              │ ◀───────────┐
│              │             │ Data Binding
│              ├─────────────▶│
└──────────────┘              │
                             ▼
                          ┌──────────┐
                          │   View   │
                          │(Display) │
                          └──────────┘
```

**Kullanım Alanları:** WPF, Angular, Vue.js, XAML

#### **d) Component-Based Architecture**
**Tanım:** UI'nın kendine yeterli, tekrar kullanılabilir bileşenlerden oluştuğu mimaridir.

```
┌────────────────────────────────────┐
│          Main App                   │
│  ┌──────────┐  ┌──────────┐       │
│  │Component1│  │Component2│  ...  │
│  └──────────┘  └──────────┘       │
│       ▲              ▲              │
│       │ Props/State  │              │
│       │              │              │
│    ┌──────────────────┐            │
│    │  State Manager   │            │
│    └──────────────────┘            │
└────────────────────────────────────┘
```

**Kullanım Alanları:** React, Vue.js, Angular, Modern SPA'lar

### 3.2 Web Tank Game'de Kullanılan UI Mimarisi

**🎯 Component-Based Architecture + MVP Hibrit Yapı**

#### **Frontend Yapısı:**

```javascript
// public/js/game-client.js (Main Component)
import { createCanvasRenderer } from './render/canvasRenderer.js';    // View
import { createHudRenderer } from './render/hudRenderer.js';          // View
import { createGameState } from './state/gameState.js';               // Model
import { initInput } from './input/inputManager.js';                  // Controller
import { createFeedbackManager } from './feedback/feedbackManager.js';// Presenter
```

#### **Bileşen Yapısı:**

| Bileşen | Sorumluluk | Tür |
|---------|-----------|-----|
| `canvasRenderer` | Canvas'a oyun çizme | View |
| `hudRenderer` | HUD bilgileri gösterme | View |
| `gameState` | Oyun durumu yönetimi | Model |
| `inputManager` | Kullanıcı girdisi toplama | Controller |
| `feedbackManager` | Oyuncu geri bildirimi | Presenter |
| `audioManager` | Ses yönetimi | Presenter |
| `assetLoader` | Asset yükleme | Service |

#### **Uygulanmış Paternler:**

```javascript
// Factory Pattern ile bileşen oluşturma
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);
const feedbackManager = createFeedbackManager({ overlayElement, audioManager });

// Separation of Concerns
// Her bileşen sadece kendi alanında sorumluluk taşır
// View katmanı (renderer) - Business Logic (gameState) - Input (inputManager) ayrı
```

#### **✅ Kullanılan Avantajlar:**

1. **Modülerlik:** Her bileşen bağımsız olarak geliştirilebilir
2. **Reusability:** Bileşenler başka yerlerde kullanılabilir
3. **Testability:** Bileşenleri ayrı ayrı test etmek kolaydır
4. **Maintainability:** Kod değişiklikleri sınırlı alanda kalır

#### **⚠️ İyileştirilmesi Gereken Noktalar:**

1. State management merkezi değildir (Redux/Vuex gibi tool yok)
2. Props flow direkt değil, global session storage kullanılmakta
3. İki yönlü data binding sağlanmamıştır
4. Component lifecycle hooks eksiktir

---

## 4. Tasarım Desenleri

### 4.1 Tasarım Desenleri Nedir?

Tasarım desenleri (Design Patterns), yazılım geliştirmede tekrarlanan sorunlara karşı, kanıtlanmış ve yeniden kullanılabilir çözüm şablonlarıdır. Gang of Four (GoF) tarafından 23 temel desen tanımlanmıştır.

**Yazılım Geliştirmede Önemi:**

1. **Kod Yeniden Kullanılabilirliği:** Kanıtlanmış çözümler
2. **Sürdürülebilirlik:** Kod bakım ve güncellemeleri kolaylaştırır
3. **Ekip İletişimi:** Ortak dil ve anlayış sağlar
4. **Hata Azaltma:** Bilinen problemlere karşı bilinmeyen çözümler yerine
5. **Performance:** Optimized çözümler

### 4.2 Tasarım Desenleri Kategorileri

---

#### **A) CREATIONAL (OLUŞTURUCU) DESENLER**

Nesnelerin yaratılış mekanizmalarını tanımlayan desenlerdir.

##### **1. Singleton Pattern (Tek Örnek Deseni)**

**Tanım:** Bir sınıftan sadece tek bir örnek yaratılmasını garantileyen desendir.

```javascript
// src/data/store.js - Singleton Pattern Örneği
const activeSessions = new Map();
const activeUsernames = new Set();
const rooms = new Map();

export { activeSessions, activeUsernames, rooms };
```

**Projede Kullanımı:**
```javascript
// Tüm route'lar aynı store örneğini kullanır
import { activeSessions, rooms } from '../data/store.js';

// Her import aynı Map örneğine erişir - Singleton
router.post('/auth/login', (req, res) => {
    activeSessions.set(token, session); // Aynı instance
});
```

**Avantajları:**
- Bellek tasarrufu (tek örnek)
- Global erişim
- Kontrollü örnek yönetimi

**Dezavantajları:**
- Testing zorluğu
- Global state kullanımı

---

##### **2. Factory Pattern (Fabrika Deseni)**

**Tanım:** Nesne oluşturma mantığını saklayan, esneklik sağlayan desendir.

```javascript
// public/js/game-client.js - Factory Pattern Örneği
const canvasRenderer = createCanvasRenderer(canvas);
const hudRenderer = createHudRenderer(hud);
const feedbackManager = createFeedbackManager({ overlayElement, audioManager });
const audioManager = createAudioManager();
```

**Proje Kod Örneği:**
```javascript
// public/js/render/canvasRenderer.js
export function createCanvasRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    
    return {
        renderGame: (state) => { /* render logic */ },
        renderTank: (tank) => { /* tank render */ },
        renderBullet: (bullet) => { /* bullet render */ },
        clear: () => { ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
}

// public/js/state/gameState.js
export function createGameState() {
    return {
        players: {},
        bullets: [],
        activeItems: [],
        obstacles: [],
        world: { width: 1920, height: 1080 }
    };
}
```

**Avantajları:**
- Nesne oluşturma mantığının merkezi kontrolü
- Esneklik ve değişebilirlik
- Yeni nesne türleri eklemek kolay

---

##### **3. Builder Pattern (İnşaatçı Deseni)**

**Tanım:** Karmaşık nesneleri adım adım oluşturmayı sağlayan desendir.

```javascript
// Projede geçici olarak kullanılmış - Game State Oluşturma
const gameState = {
    players: {},
    bullets: [],
    activeItems: [],
    obstacles: [],
    world: { width: 1920, height: 1080 },
    lastItemSpawnTime: Date.now(),
    currentMap: null
};
```

---

#### **B) STRUCTURAL (YAPISAL) DESENLER**

Nesneleri ve sınıfları daha büyük yapılar oluşturacak şekilde birleştiren desenlerdir.

##### **1. Adapter Pattern (Uyarlayıcı Deseni)**

**Tanım:** İlişkisiz arayüzleri birbirine uyumlu hale getiren desendir.

```javascript
// public/js/audio/audioManager.js - Adapter Pattern Örneği
export function createAudioManager() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    return {
        playSound: (url) => {
            // Web Audio API'yi uygulamaya uyar
        },
        playBackgroundMusic: (url) => {
            // Müzik oynatma
        },
        stop: () => {
            // Durdur
        }
    };
}
```

**Avantajı:** Farklı kütüphaneleri tek arayüz altında sunma

---

##### **2. Decorator Pattern (Dekoratör Deseni)**

**Tanım:** Nesnelere dinamik olarak sorumluluk ekleme desenidir.

```javascript
// Projede FeedbackManager bunu yapıyor
export function createFeedbackManager({ overlayElement, audioManager }) {
    return {
        showDamage: (amount) => {
            overlayElement.style.opacity = 0.5;  // Visual feedback
            audioManager.playSound('damage.mp3'); // Audio feedback
        }
    };
}
```

---

##### **3. Facade Pattern (Cephe Deseni)**

**Tanım:** Karmaşık sistemin basit arayüzünü sunan desendir.

```javascript
// src/server.js - Express Application Facade
import apiRoutes from './meta/api/index.js';
import pageRoutes from './meta/pages/pageRoutes.js';
import { initGameServer } from './game/gameServer.js';

const app = express();
// Karmaşık setup'ı basit API'ye çevirir
app.use('/api', apiRoutes);
app.use('/', pageRoutes);
initGameServer(server);
```

---

#### **C) BEHAVIORAL (DAVRANIŞSAL) DESENLER**

Nesneler arasındaki iletişim ve sorumluluk dağılımını tanımlayan desenlerdir.

##### **1. Observer Pattern (Gözlemci Deseni)**

**Tanım:** Nesneler arasında bire çok bağımlılık kurarak, birinin durumu değişince diğerlerine otomatik bildirim gönderen desendir.

```javascript
// WebSocket Game Server - Observer Pattern
// Server oyun durumunu broadcast yapıyor (gözlemcilere bildirim)

socket.on('message', (data) => {
    // Oyuncunun input'u al
    const parsed = JSON.parse(data);
    
    // Oyun durumunu güncelle
    room.gameState.players[playerId].x += parsed.moveX;
    
    // Tüm istemcilere (gözlemcilere) broadcast yap
    room.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'GAME_STATE_UPDATE',
                state: room.gameState
            }));
        }
    });
});
```

**Projede Kullanımı:**
- WebSocket server → Game state değişir → Tüm client'lara broadcast
- Client soket listener'ları durum güncellemelerini gözlemler

---

##### **2. Strategy Pattern (Strateji Deseni)**

**Tanım:** Algoritmaları kapsülleyerek, çalışma zamanında seçebilme imkanı sunan desendir.

```javascript
// src/game/systems/ - Farklı Stratejiler
// combatSystem.js - Savaş stratejisi
// respawnSystem.js - Yeniden doğum stratejisi
// powerUpSystem.js - Power-up stratejisi

// Her sistem bağımsız strateji olarak çalışır
const combatSystem = {
    handleBulletCollision: (bullet, target) => { /* ... */ }
};

const powerUpSystem = {
    applyPowerUp: (player, powerUpType) => { /* ... */ }
};
```

---

##### **3. State Pattern (Durum Deseni)**

**Tanım:** Nesnelerin durum değişikliğine göre davranışı değiştiren desendir.

```javascript
// Oda durumları - State Pattern
const roomStates = {
    'waiting': {
        canJoin: true,
        canStart: false,
        allowedActions: ['join', 'leave']
    },
    'playing': {
        canJoin: false,
        canStart: false,
        allowedActions: ['play', 'leave']
    },
    'finished': {
        canJoin: false,
        canStart: false,
        allowedActions: ['leave', 'viewStats']
    }
};

// Oda durumuna göre davranış değişir
if (room.status === 'waiting') {
    // Oyuncuları kabul et
} else if (room.status === 'playing') {
    // Oyunu çalıştır
}
```

---

##### **4. Command Pattern (Komut Deseni)**

**Tanım:** Talepleri nesneler olarak kapsülleyen, geçmiş ve tekrar özelliği sağlayan desendir.

```javascript
// public/js/input/inputManager.js - Command Pattern
const inputCommands = {
    'W': { action: 'moveUp', execute: () => sendInput({ moveY: -1 }) },
    'A': { action: 'moveLeft', execute: () => sendInput({ moveX: -1 }) },
    'S': { action: 'moveDown', execute: () => sendInput({ moveY: 1 }) },
    'D': { action: 'moveRight', execute: () => sendInput({ moveX: 1 }) },
    'SPACE': { action: 'shoot', execute: () => sendInput({ shoot: true }) }
};

// Komutlar istek olarak kaydedilip yürütülebilir
function executeCommand(keyCode) {
    const command = inputCommands[keyCode];
    if (command) {
        command.execute();
    }
}
```

---

### 4.3 Projede Uygulanmış Desenlerin Özeti

| Desen | Yeri | Kullanım |
|-------|------|----------|
| **Singleton** | src/data/store.js | Global veri depolama |
| **Factory** | public/js/game-client.js | Bileşen oluşturma |
| **Adapter** | public/js/audio/audioManager.js | API uyumlaştırma |
| **Decorator** | public/js/feedback/feedbackManager.js | Dinamik özellik ekleme |
| **Facade** | src/server.js | Karmaşık setup basitleştirme |
| **Observer** | src/game/gameServer.js | WebSocket broadcast |
| **Strategy** | src/game/systems/ | Farklı sistem stratejileri |
| **State** | src/meta/api/roomRoutes.js | Oda durumu yönetimi |
| **Command** | public/js/input/inputManager.js | Input komutları |

### 4.4 ⚠️ Eksik Desenler ve Yapılabilecekler

| Desen | Neden Gerekli | Nasıl Uygulanabilir |
|-------|---|---|
| **Repository Pattern** | Veri erişimi abstraksionu | Veri katmanı abstraktı oluşturma |
| **Dependency Injection** | Loosely coupled kod | Constructor'a dependencies geçme |
| **Chain of Responsibility** | Event işleme zinciri | Request/response zinciri kurma |
| **Composite Pattern** | Hiyerarşik yapı | Oyun entity'leri için composite kullanma |

---

## 5. Test Aşaması

### 5.1 Test Türleri

#### **A) STATİK TEST (Static Testing)**

**Tanım:** Kodu çalıştırmadan yapılan test türüdür. Kaynak kodu inceleyerek hata aranır.

**Özellikleri:**
- Kod çalıştırılmaz
- Code review, statik analiz, linting yapılır
- Erken hata bulma
- Düşük maliyet

**Statik Test Teknikleri:**

```markdown
1. **Code Review**
   - İnsan gözüyle kod incelemesi
   - Proje: Daha sık yapılmalı

2. **Static Analysis Tools (Linting)**
   - ESLint, SonarQube, Pylint
   - Proje: npm scripts'e eklenebilir
   
3. **Type Checking**
   - TypeScript, Flow
   - Proje: Şu an JavaScript kullanılıyor
   
4. **Dead Code Analysis**
   - Kullanılmayan kod bulma
```

**Projede Statik Test:**

⚠️ **Mevcut Durum:**
```javascript
// package.json
"scripts": {
    "start": "node src/server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
}
```

Test script boştur! Statik test araçları tanımlanmamıştır.

**Yapılabilecekler:**

```bash
# ESLint kurulumu ve kullanımı
npm install --save-dev eslint
npx eslint --init

# .eslintrc.json
{
  "env": {
    "node": true,
    "es2021": true,
    "browser": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "eqeqeq": "error"
  }
}

# package.json'da script ekle
"lint": "eslint src/ public/js/",
"lint:fix": "eslint src/ public/js/ --fix"
```

---

#### **B) DİNAMİK TEST (Dynamic Testing)**

**Tanım:** Kodu çalıştırarak yapılan test türüdür. Program çalışırken davranışı gözlenir.

**Özellikleri:**
- Kod çalıştırılır
- Gerçek sonuçlar kontrol edilir
- Daha kapsamlı hata bulma
- Yüksek maliyet ve zaman

**Dinamik Test Türleri:**

```markdown
1. **Unit Test**
   - Tek bir fonksiyon/bileşen test
   - Framework: Jest, Mocha, Vitest
   
2. **Integration Test**
   - Bileşenlerin birbiriyle çalışması
   - Framework: Jest, Supertest
   
3. **System Test**
   - Tüm sistem test
   - Framework: Selenium, Cypress
   
4. **Acceptance Test**
   - Kullanıcı gereksinimleri test
   - Framework: Cucumber, Playwright
   
5. **Performance Test**
   - Hız ve resource kullanımı
   - Framework: Apache JMeter, Lighthouse
```

---

### 5.2 Projede Test Eksiklikleri

**⚠️ Kritik Eksikler:**

```javascript
// test 1: API Route'ları Test Yok
// POST /api/auth/login
// POST /api/rooms
// GET /api/rooms/:id
// Test edilmemektedir!

// test 2: Game Logic Test Yok
// Collision detection
// Spawn position safety
// Bullet movement
// Test edilmemektedir!

// test 3: Frontend Component Test Yok
// Canvas Renderer
// HUD Renderer
// Input Manager
// Test edilmemektedir!
```

---

### 5.3 Test İmplementasyonu Önerileri

#### **1. Unit Test Örneği (Jest ile)**

```javascript
// __tests__/collision.test.js
import { checkCollision } from '../src/game/gameServer.js';

describe('Collision Detection', () => {
    test('should detect collision between overlapping rectangles', () => {
        const rect1 = { x: 0, y: 0, width: 50, height: 50 };
        const rect2 = { x: 30, y: 30, width: 50, height: 50 };
        
        expect(checkCollision(rect1, rect2)).toBe(true);
    });
    
    test('should not detect collision between non-overlapping rectangles', () => {
        const rect1 = { x: 0, y: 0, width: 50, height: 50 };
        const rect2 = { x: 100, y: 100, width: 50, height: 50 };
        
        expect(checkCollision(rect1, rect2)).toBe(false);
    });
});
```

#### **2. Integration Test Örneği (Supertest ile)**

```javascript
// __tests__/api.test.js
import request from 'supertest';
import app from '../src/server.js';

describe('POST /api/auth/login', () => {
    test('should create session and return token', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: 'testUser' });
        
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.username).toBe('testUser');
    });
    
    test('should return 400 for empty username', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ username: '' });
        
        expect(response.status).toBe(400);
    });
});
```

#### **3. Game Logic Test Örneği**

```javascript
// __tests__/gameLogic.test.js
import { getSafeSpawnPosition } from '../src/game/gameServer.js';

describe('Safe Spawn Position', () => {
    test('should return position within world bounds', () => {
        const room = {
            gameState: {
                world: { width: 1920, height: 1080 },
                obstacles: []
            }
        };
        
        const pos = getSafeSpawnPosition(room);
        
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.x).toBeLessThan(1920);
        expect(pos.y).toBeGreaterThan(0);
        expect(pos.y).toBeLessThan(1080);
    });
});
```

---

### 5.4 Test Türleri Karşılaştırması

| Özellik | STATİK TEST | DİNAMİK TEST |
|---------|-----------|------------|
| **Kod Çalışması** | Hayır | Evet |
| **Maliyeti** | Düşük | Yüksek |
| **Hızı** | Hızlı | Yavaş |
| **Erken Hata Bulma** | İyi | Sınırlı |
| **Gerçek Davranış Test** | Hayır | Evet |
| **Kapsamı** | Kısmi | Kapsamlı |
| **Örnek Araçlar** | ESLint, SonarQube | Jest, Cypress |

---

### 5.5 Projede Test Implementasyonu Önerisi

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src/ public/js/",
    "lint:fix": "eslint src/ public/js/ --fix",
    "test:e2e": "cypress open"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "eslint": "^8.0.0",
    "cypress": "^13.0.0",
    "nodemon": "^3.0.0"
  }
}
```

---

## 6. README ve Proje Paylaşımı

### 6.1 README Dosyasının Amacı ve Önemi

**README Nedir?**  
README, projenin ilk aşaması olarak, geliştiricilerin ve kullanıcıların projeyi anlamaları, kurup çalıştırmaları için gerekli bilgileri içeren belgedir.

**Yazılım Projelerinde Neden Önemli?**

1. **İlk İzlenim:** Projenin kalitesi ve profesyonelliğini gösterir
2. **Kurulum Rehberi:** Hızlı başlangıç sağlar
3. **Katkı İsteyen Geliştiricileri Çeker:** Açık kaynak projelerde kritik
4. **Dokümantasyon:** Proje yapısını ve hedefleri açıklar
5. **SEO:** GitHub'da aranabilirliği artırır

### 6.2 İyi Bir README İçermesi Gereken Başlıklar

```markdown
# Web Tank Game

## 📋 Proje Tanımı
Tarayıcı üzerinden oynanabilen, gerçek zamanlı çok oyunculu 2D tank savaş oyunudur.

## ✨ Özellikler
- Çok oyunculu oyun desteği
- WebSocket tabanlı gerçek zamanlı iletişim
- HTML5 Canvas oyun motor
- Lobi ve oda sistemi
- Offline oyun modu

## 🛠️ Kullanılan Teknolojiler

### Backend
- Node.js 18+
- Express.js 5.2
- WebSocket (ws 8.20)
- UUID (14.0)

### Frontend
- HTML5
- CSS3
- Canvas API
- Vanilla JavaScript (ESM)

### Database
- RAM tabanlı geçici depolama

## 📦 Kurulum Adımları

```bash
# Depoyu klonla
git clone https://github.com/yusuftarlan/web-tank-game.git
cd web-tank-game

# Bağımlılıkları yükle
npm install

# Development sunucusunu başlat
npm start

# Tarayıcıda aç
http://localhost:3000
```

## 🚀 Kullanım

### Login
1. Ana sayfada kullanıcı adı gir
2. "KARAGÂH GİRİŞ YAP" butonuna tıkla
3. Token oluşturulup ana menüye yönlendirilirsin

### Oyun Oluşturma
1. "YENİ ODA OLUŞTUR" butonuna tıkla
2. Oda adı ve oyuncu sayısı belirt
3. Oda oluşturulup bekleme odasına yönlendirilirsin

### Oyuna Katılma
1. Ana menüdeki oda listesinden bir oda seç
2. "KATIL" butonuna tıkla
3. Bekleme odasında kurucu oyunu başlatana kadar bekle

## 📂 Proje Yapısı

```
web-tank-game/
├── src/
│   ├── server.js              # Ana sunucu dosyası
│   ├── meta/                  # Lobi ve API işlemleri
│   │   ├── api/
│   │   │   ├── index.js
│   │   │   ├── authRoutes.js
│   │   │   └── roomRoutes.js
│   │   └── pages/
│   │       └── pageRoutes.js
│   ├── game/                  # Oyun mantığı
│   │   ├── gameServer.js
│   │   ├── gameLoop.js
│   │   ├── maps.js
│   │   ├── entities/
│   │   │   ├── tank.js
│   │   │   └── bullet.js
│   │   ├── physics/
│   │   │   ├── collision.js
│   │   │   └── movement.js
│   │   └── systems/
│   │       ├── combatSystem.js
│   │       ├── powerUpSystem.js
│   │       └── respawnSystem.js
│   ├── shared/                # Paylaşılan kodlar
│   │   ├── gameConstants.js
│   │   └── messageTypes.js
│   └── data/
│       └── store.js           # Veri depolama
├── public/
│   ├── index.html
│   ├── main-menu.html
│   ├── new-game.html
│   ├── game-room.html
│   ├── game.html
│   ├── js/
│   │   ├── login.js
│   │   ├── main-menu.js
│   │   ├── new-game.js
│   │   ├── game-room.js
│   │   ├── game-client.js
│   │   ├── input/
│   │   │   └── inputManager.js
│   │   ├── render/
│   │   │   ├── canvasRenderer.js
│   │   │   ├── hudRenderer.js
│   │   │   └── cameraConfig.js
│   │   ├── state/
│   │   │   └── gameState.js
│   │   ├── assets/
│   │   │   └── assetLoader.js
│   │   ├── audio/
│   │   │   └── audioManager.js
│   │   └── feedback/
│   │       └── feedbackManager.js
│   ├── css/
│   │   └── game.css
│   └── assets/
│       ├── sprites/
│       ├── audio/
│       ├── effects/
│       ├── maps/
│       └── ui/
├── Documents/
│   └── SDD.tex                # Sistem Tasarım Dökümanı
├── package.json
└── README.md
```

## 🤝 Katkı (Contribution)

Projeye katkı sağlamak isterseniz:

1. Depoyu fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'ınızı push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

### Katkı Kuralları
- Clean Code prensiplerini takip edin
- Var olan dosya yapısını korumuşun
- Yeni özellikleri test edin
- Yorum ve dokümantasyon ekleyin

## 📝 Lisans

Bu proje ISC License altında yayımlanmıştır. [LICENSE](LICENSE) dosyasına bakınız.

## 👥 Ekip

- **Backend & Game Logic:** Fizik ve mekanik ekibi
- **Frontend & Rendering:** Frontend ve asset ekibi
- **Lobi & API:** Meta ekibi

## 📞 İletişim

- Issues: https://github.com/yusuftarlan/web-tank-game/issues
- Discussions: https://github.com/yusuftarlan/web-tank-game/discussions

## 🔗 Bağlantılar

- GitHub Repository: https://github.com/yusuftarlan/web-tank-game
- Sistem Tasarım Dökümanı: [SDD.pdf](Documents/SDD.pdf)
- Proje Rehberi: [AGENTS.md](AGENTS.md)

## ✅ Yapılacaklar (Roadmap)

- [ ] Tam oyun dongusu implementasyonu
- [ ] Client-side prediction
- [ ] Server reconciliation
- [ ] Entity interpolation
- [ ] Tam skor sistemi
- [ ] Health ve respawn sistemi
- [ ] Power-up sistemi
- [ ] Yer imi ve pervasive storage
- [ ] Production-grade authentication
- [ ] Database entegrasyonu (PostgreSQL/MongoDB)
- [ ] Ranking sistemi
- [ ] Matchmaking algoritması
- [ ] Replay sistemi
- [ ] In-game chat
- [ ] Mobile desteği

## 📊 İstatistikler

- **Backend Dosyaları:** 12
- **Frontend Dosyaları:** 18
- **Satır Kod:** ~2500+ (backend + frontend)
- **Aktif Bileşenler:** 9
- **API Endpoint'leri:** 8
```

---

## 7. Ekran Görüntüleri

### 7.1 Login Sayfası (Giriş Ekranı)

![Login Sayfası](login-screenshot.png)

**Açıklama:**  
Oyunun ilk aşaması olan login sayfasıdır. Kullanıcı adı giriş alanı ve "KARAGÂH GİRİŞ YAP" butonu bulunmaktadır. Sayfanın arka planında tank savaşı temalı görseller yer almaktadır.

---

### 7.2 Ana Menü (Karagâh)

![Ana Menü Sayfası](main-menu-screenshot.png)

**Açıklama:**  
Başarılı giriş sonrasında görünen ana menü ekranıdır. Sol tarafta aktif savaş odaları listesi gösterilmektedir. Sağ tarafta:
- "YENİ ODA OLUŞTUR" butonu (yeşil)
- "OFFLINE OYUNA" butonu (mavi)
- Kontrol paneli (WASD tuşları, MOUSE, SOL TIK açıklamaları)

---

### 7.3 Tek Oyunculu Oyun Ekranı

![Offline Oyun Ekranı](offline-game-screenshot.png)

**Açıklama:**  
Offline modunda çalışan oyun ekranıdır. Sol üst köşede HUD bilgileri (oyuncu adı, sağlık, mühimmat) gösterilmektedir. Merkez alanda harita, tank'lar, engeller ve mühimmatlar yer almaktadır. Oyuncu WASD tuşları ile hareket edebilmekte, fare ile nişan alıp sol tık ile ateş etmektedir.

---

### 7.4 Çok Oyunculu Oyun Ekranı (2 Oyuncu)

![Multiplayer Oyun Ekranı](multiplayer-screenshot.png)

**Açıklama:**  
Çok oyunculu modu gösteren ekran görüntüsüdür. İki farklı tank gösterilmektedir:
- Sol üst: "OYUNCU 1" - Sağlık: 100, Mühimmat: 7/7
- Sağ üst: "OYUNCU 2" - Sağlık: 100, Mühimmat: 7/7

Ortasında açık alanda savaş devam etmektedir. Sağ tarafta kırmızı power-up görülmektedir.

---

## SONUÇ

Web Tank Game, yazılım mühendisliği prensiplerinin uygulandığı, modern web teknolojileriyle geliştirilmiş bir projedir.

### ✅ Başarılar

1. **Mimari Yapı:** Katmanlı mimari düzgün uygulanmıştır
2. **Tasarım Desenleri:** Factory, Singleton, Observer gibi desenler kullanılmıştır
3. **Frontend:** Component-based approach başarıyla uygulanmıştır
4. **Modüler Yapı:** Dosyalar ve sorumluluklar net bir şekilde ayrılmıştır
5. **Teknoloji Stack:** Modern ve uygun teknolojiler seçilmiştir

### ⚠️ İyileştirilmesi Gereken Alanlar

1. **Test Eksikliği:** Statik ve dinamik test tamamen yoktur
2. **Hata Yönetimi:** Girdi doğrulaması ve exception handling yetersizdir
3. **Dokümantasyon:** Kod yorumları minimal seviyededir
4. **State Management:** Global state yönetim merkezi değildir
5. **TypeScript:** Tip güvenliği için TypeScript kullanılabilir

### 🎯 Öneriler

1. Jest ile Unit test ve Integration test ekleyin
2. ESLint ile code quality kontrol kurulumu yapın
3. TypeScript geçişini planlayın
4. Kapsamlı API dokümantasyonu (Swagger/OpenAPI) ekleyin
5. CI/CD pipeline (GitHub Actions) kurun
6. Database tabanlı persistent storage'a geçin

---

**Rapor Tarihi:** 22 Mayıs 2026  
**Hazırlayan:** Yazılım Ekibi  
**Versiyonu:** 1.0
