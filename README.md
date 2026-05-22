# 🛡️ Web Tank Game

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📖 Proje Tanımı

Web Tank Game, tarayıcı üzerinden oynanabilen gerçek zamanlı ve çok oyunculu bir 2D top-down tank savaşı oyunudur. Oyun, **Server-Authoritative** bir fizik motoruna sahiptir. Gelişmiş lobi sistemi üzerinden arkadaşlarınızla odalar kurabilir, rastgele oluşturulan dinamik haritalarda taktiksel savaşlara girebilirsiniz.

---

## 🚀 Özellikler

- **Gelişmiş Oyun Fiziği:** AABB ve dairesel çarpışma algılama, vektörel mermi balistiği ve tank hareketleri.
- **Dinamik Harita Sistemi:** Her turda procedural olarak oluşturulan siper/duvar dizilimleri, tileable retro pixel-art dokular ve HTML5 Canvas tabanlı render motoru.
- **Özel Güçler (Power-Ups):** Güdümlü Füze, Taramalı Tüfek, Hayalet Mermi, Turbo Drive, AOE Bomba ve Seken Mermi.
- **Çok Oyunculu Lobi Sistemi:** Geçici token ve `sessionStorage` ile güvenli oturum yönetimi. Oda kurma, Game Master atama, odadan ayrılma ve master devri.
- **Offline Mod:** İnternet bağlantısı olmadan yerel sistemde antrenman imkânı.

---

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknoloji |
|---|---|
| Backend | Node.js, Express.js |
| Gerçek Zamanlı İletişim | Socket.io (WebSocket), RESTful API |
| Frontend | HTML5 Canvas, Vanilla JavaScript, Tailwind CSS |
| Veri Yönetimi | RAM tabanlı geçici oturum/oda yapısı |

---

## ⚙️ Kurulum

```bash
# 1. Depoyu klonlayın
git clone <repo-url>
cd web-tank-game

# 2. Bağımlılıkları yükleyin
npm install

# 3. Sunucuyu başlatın
npm start
```

Tarayıcıda açın: [http://localhost:3000](http://localhost:3000)

---

## 🕹️ Kullanım Akışı

1. `GET /` — Giriş sayfası açılır.
2. Komutan adı girilip **Giriş Yap**'a basılır → `POST /api/login` ile geçici token üretilir.
3. Kullanıcı adı ve token `sessionStorage`'a yazılır, ana menüye yönlendirilir.
4. Ana menüde mevcut odalar listelenir. `/new-game.html` üzerinden yeni oda oluşturulabilir.
5. Odayı kuran kişi **Game Master** olur ve `/game-room/:roomId` bekleme odasına yönlendirilir.
6. Savaş başladığında HTML5 Canvas tabanlı oyun ekranına geçilir.

---

## 🛣️ API Referansı

### REST Endpoint'leri (JSON döner)

| Metod | Yol | Açıklama |
|---|---|---|
| `POST` | `/api/login` | Geçici oturum token'ı oluşturur. |
| `POST` | `/api/room/create` | Yeni oda oluşturur ve kullanıcıyı master yapar. |
| `GET` | `/api/rooms` | Bekleyen odaları listeler. |
| `GET` | `/api/room/:roomId` | Tek bir odanın detayını döner. |
| `POST` | `/api/room/leave` | Kullanıcıyı odadan çıkarır; gerekirse master'ı devreder veya odayı kapatır. |

### Sayfa Route'ları (HTML döner)

| Metod | Yol | Açıklama |
|---|---|---|
| `GET` | `/` | Login (giriş) sayfası. |
| `GET` | `/main-menu` | Ana menü / Lobi sayfası. |
| `GET` | `/new-game.html` | Yeni oda oluşturma formu. |
| `GET` | `/game-room/:roomId` | Oda bekleme sayfası. |
| `GET` | `/game.html` | Canvas oyun render ekranı. |
| `GET` | `/offline-setup.html` | Çevrimdışı oyun yapılandırma sayfası. |

---

## 👨‍💻 Geliştirici Ekibi

| İsim | Sorumluluk |
|---|---|
| Muhammed Kızıldağ | Frontend Geliştirme & Asset Entegrasyonu |
| Nuri Sarı | Frontend Mimari Geliştirme |
| Yusuf Eren Çelebi | Oyun Fiziği, Çarpışma Mekanikleri ve Balistik Algoritmaları |
| Yusuf Tarlan | Lobi Sistemi, REST API ve Backend Mimarisi |
| Mhd Diaa Alsebai | Offline Mod Geliştirme |

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
