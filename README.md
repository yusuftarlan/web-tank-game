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
- Express.js 5.2.1
- WebSocket (ws 8.20.1)
- UUID 14.0.0
### Frontend
- HTML5
- CSS3
- Canvas API
- Vanilla JavaScript (ESM)
### Database
- RAM tabanlı geçici depolama
### Test
- Jest 30.4.2
- Supertest 7.2.2
## 📦 Kurulum Adımları
```bash
# Depoyu klonla
git clone https://github.com/yusuftarlan/web-tank-game.git
cd web-tank-game
20
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
### Offline Oyun
1. Ana menüde "OFFLINE OYNA" butonuna tıkla
2. `offline-setup.html` üzerinde oyuncu sayısını seç
3. `offline-game.html` ekranında aynı klavyede 2-4 oyunculu maçı başlat
## 🔌 Güncel API Özeti
| Metod | Yol | Açıklama |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Kullanıcı adını trim eder, boş/tekrar kullanıcıyı
reddeder ve `cmd_` prefix'li geçici token üretir. |
| `POST` | `/api/rooms` | Geçerli token ile oda oluşturur, kullanıcıyı `host` yapar
ve session `currentRoom` alanını günceller. |
| `GET` | `/api/rooms` | Sadece `waiting` durumundaki odaları listeler. |
| `GET` | `/api/rooms/:id` | Oda detaylarını `id`, `name`, `host`, `maxPlayers`,
`status`, `players`, `gameId` alanlarıyla döner. |
| `POST` | `/api/rooms/:id/join` | Uygun bekleme odasına oyuncu ekler ve session
`currentRoom` alanını günceller. |
| `POST` | `/api/rooms/:id/leave` | Oyuncuyu odadan çıkarır; oda boşsa siler, kurucu
çıktıysa host devreder. |
| `POST` | `/api/rooms/:id/start` | Sadece host tarafından çalışır; odayı `playing`
yapar ve `{ success, roomId, gameId }` döner. |
Oda modelinde `gameId` ve `startedAt` alanları bulunur. `gameId`, bekleme odasından
online Canvas oyun ekranına güvenli geçiş için kullanılır.
## 📂 Proje Yapısı
```
21
web-tank-game/
├── src/
│ ├── server.js # Ana sunucu dosyası
│ ├── meta/ # Lobi ve API işlemleri
│ │ ├── api/
│ │ │ ├── index.js
│ │ │ ├── authRoutes.js
│ │ │ └── roomRoutes.js
│ │ └── pages/
│ │ └── pageRoutes.js
│ ├── game/ # Oyun mantığı
│ │ ├── gameServer.js
│ │ ├── gameLoop.js
│ │ ├── maps.js
│ │ ├── entities/
│ │ │ ├── tank.js
│ │ │ └── bullet.js
│ │ ├── physics/
│ │ │ ├── collision.js
│ │ │ └── movement.js
│ │ └── systems/
│ │ ├── combatSystem.js
│ │ ├── powerUpSystem.js
│ │ └── respawnSystem.js
│ ├── shared/ # Paylaşılan kodlar
│ │ ├── gameConstants.js
│ │ └── messageTypes.js
│ └── data/
│ └── store.js # Veri depolama
├── public/
│ ├── index.html
│ ├── main-menu.html
│ ├── new-game.html
│ ├── game-room.html
│ ├── game.html
│ ├── offline-setup.html
│ ├── offline-game.html
│ ├── js/
│ │ ├── login.js
│ │ ├── main-menu.js
│ │ ├── new-game.js
│ │ ├── game-room.js
│ │ ├── game-client.js
│ │ ├── offline-setup.js
│ │ ├── input/
│ │ │ └── inputManager.js
│ │ ├── render/
│ │ │ ├── canvasRenderer.js
│ │ │ ├── hudRenderer.js
│ │ │ └── cameraConfig.js
│ │ ├── state/
│ │ │ └── gameState.js
│ │ ├── assets/
│ │ │ └── assetLoader.js
│ │ ├── audio/
│ │ │ └── audioManager.js
22
│ │ ├── feedback/
│ │ │ └── feedbackManager.js
│ │ └── offline/
│ │ ├── offline-game-client.js
│ │ └── offline-maps.js
│ ├── css/
│ │ └── game.css
│ └── assets/
│ ├── sprites/
│ ├── audio/
│ ├── effects/
│ ├── maps/
│ └── ui/
├── Documents/
│ └── SDD.tex # Sistem Tasarım Dökümanı
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
23
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
