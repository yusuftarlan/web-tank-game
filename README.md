# Web Tank Game


## Proje Tanımı
Web Tank Game, tarayıcı üzerinden oynanması hedeflenen, gerçek zamanlı ve çok oyunculu bir 2D tank savaşı oyunudur. 


Proje şu anda erken aşamadadır: Express tabanlı Meta Server, RAM tabanlı geçici oturum/oda yapısı, basit lobi ekranları ve oyun ekibi için hazırlanmış frontend/backend iskeleti bulunmaktadır. WebSocket Game Server, gerçek oyun döngüsü ve tamamlanmış oyun mekanikleri henüz uygulanmamıştır. Daha detaylı teknik açıklama için [AGENTS.md](AGENTS.md) dosyasına bakabilirsiniz.


## Özellikler
*   **Oturum Yönetimi:** Geçici token üretimi ve `sessionStorage` ile tarayıcı tarafında durum yönetimi.
*   **Lobi Sistemi:** Mevcut odaları listeleme, yeni oda oluşturma ve bekleme odası (game room) mekaniği.
*   **Oda Yönetimi:** Game master atanması, odadan ayrılma, master devri veya odanın kapatılması.
*   **Modüler Mimari:** Lobi backend kodları, oyun fiziği/mekaniği, paylaşılan mesaj tipleri ve frontend varlıkları olarak ayrılmış proje yapısı.


*(Not: Mevcut sınırlandırmalar gereği veriler RAM'de tutulmaktadır ve sunucu kapanınca oturumlar/odalar silinir. Oyuna katılma ve oyunu başlatma API'leri ile canvas oyun ekranı şu an iskelet seviyesindedir.)*


## Kullanılan Teknolojiler
*   **Backend:** Node.js, Express.js
*   **Frontend:** HTML5, CSS, Vanilla JavaScript (Local state ve asset loader iskeleti)
*   **Veritabanı:** RAM tabanlı geçici veri yapısı (Geliştirme aşamasında)
*   **İletişim:** RESTful API (Oyun içi iletişim için WebSocket planlanmaktadır)


## Kurulum Adımları
Projeyi yerel ortamında çalıştırmak için aşağıdaki adımları izleyebilirsin:


1. Bağımlılıkları yükle:
```bash
npm install

Sunucuyu başlat:
Bash
npm start

Tarayıcında projeyi aç:
Plaintext
http://localhost:3000

Kullanım
Mevcut Akış
GET / ile login sayfası açılır.
Kullanıcı adı girilip "Giriş Yap" butonuna basılır.
POST /api/login üzerinden geçici token üretilir.
Frontend username ve token değerlerini sessionStorage içine yazar.
Kullanıcı /main-menu (ana menü) sayfasına geçer.
Ana menü mevcut odaları listeler ve yeni oyun oluşturma butonu sunar.
/new-game.html üzerinden oda adı ve maksimum oyuncu sayısı girilerek oda oluşturulur.
Başarılı oda oluşturma sonrası kullanıcı /game-room/:roomId bekleme odasına yönlendirilir (Odayı kuran kişi game master olur).
Game room sayfası oda bilgilerini gösterir; "Çık" butonu odadan ayrılma API'sini tetikler.
Route Özeti
API Route'ları (JSON döner):
Metod
Yol
Açıklama
POST
/api/login
Kullanıcı adı ile geçici oturum token'ı oluşturur.
POST
/api/room/create
Geçerli token ile yeni oda oluşturur ve kullanıcıyı game master yapar.
GET
/api/rooms
Bekleyen odaları listeler.
GET
/api/room/:roomId
Tek bir odanın detayını döner.
POST
/api/room/leave
Kullanıcıyı odadan çıkarır; gerekirse game master'ı devreder veya odayı kapatır.

Sayfa/Statik Route'lar (HTML döner):
Metod
Yol
Açıklama
GET
/
Login sayfasını sunar.
GET
/main-menu
Ana menü/lobi sayfasını sunar.
GET
/new-game.html
Yeni oda oluşturma formunu sunar.
GET
/game-room/:roomId
Oda bekleme sayfasını sunar.
GET
/game.html
Canvas oyun ekranı placeholder sayfasını sunar.

Katkı (Contribution)
Projeye katkı sağlamak isteyen geliştiriciler için proje dizin yapısı ve ekip alanları şu şekildedir:
ofline mode:Mhd Diaa Alsebai
forntend ve asset:Muhammed Kızıldağ
frontend:Nuri Sarı
oyun fiziği ve mekaniği: Yusuf Eren Çelebi
lobi sistemi ve api: Yusuf Tarlan

Lisans
Bu proje MIT ile lisanslanmıştır.
