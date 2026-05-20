# Web Tank Game - Proje Rehberi

Bu dosya, projeyi devralacak gelistirici veya ajanlar icin guncel teknik durumu anlatir. README kisa kullanim rehberidir; bu dosya ise projenin mimari haritasidir.

## Proje Amaci

Web Tank Game'in nihai hedefi, tarayici uzerinden oynanabilen, gercek zamanli ve cok oyunculu bir 2D tank savasi oyunu gelistirmektir. Tasarim dokumani `Documents/SDD.pdf` icinde Meta Server, Game Server, HTML5 Canvas frontend, WebSocket ile anlik oyun akisi ve RAM tabanli gecici oturum mimarisini tarif eder.

Mevcut kod bu hedefin erken asamasindadir. Su anda calisan ana bolumler:

- Express tabanli HTTP server.
- HTTP server'a bagli WebSocket Game Server iskeleti.
- JSON donen Meta Server API route'lari.
- HTML sayfalari sunan page route'lari.
- RAM tabanli gecici kullanici ve oda store'u.
- Login, main menu, yeni oda olusturma, odaya katilma ve game room bekleme akisi.
- Oda olusturma, oda listeleme, oda detay, odaya katilma, odadan cikma ve oyunu baslatma API'leri.
- Odadan cikinca oyuncu listesinden dusme, oda bosalinca silinme ve kurucu cikarsa `host` devri.
- Bekleme odasinda 2 saniyelik polling ile oyuncu listesi ve kurucu bilgisinin guncellenmesi.
- Canvas oyun ekrani, WebSocket client, input manager, renderer, HUD, asset loader ve map/game server dosyalari.

Henuz tamamlanmamis veya erken asamada olan ana bolumler:

- Production kalitesinde authoritative oyun dongusu.
- Tam ve dengelenmis tank hareketi, mermi fizigi ve collision entegrasyonu.
- Tam skor, health, power-up, respawn ve oyun sonu sistemleri.
- Client-side prediction, reconciliation ve interpolation.
- Tamamlanmis Canvas render deneyimi ve oyun polish'i.
- Logout/disconnect temizleme ve RAM store TTL mekanizmalari.

## Calisma ve Giris Noktasi

Proje Node.js ESM mod yapisini kullanir. `package.json` icinde `"type": "module"` vardir.

Server giris noktasi:

```text
src/server.js
```

Calistirma komutu:

```bash
npm start
```

Varsayilan port:

```text
3000
```

Varsayilan adres:

```text
http://localhost:3000
```

`src/server.js` su islemleri yapar:

- Express uygulamasini olusturur.
- Express uygulamasini `http.createServer(app)` ile HTTP server icine alir.
- CORS middleware'ini ekler.
- JSON body parsing icin `express.json()` kullanir.
- `public/` klasorunu statik dosya klasoru olarak sunar.
- API router'ini `/api` prefix'i ile baglar.
- Page router'i prefix olmadan baglar.
- `initGameServer(server)` ile WebSocket Game Server'i ayni HTTP server'a baglar.

## Aktif Klasor Yapisi

```text
src/
  server.js
  data/
    store.js
  meta/
    api/
      index.js
      authRoutes.js
      roomRoutes.js
    pages/
      pageRoutes.js
  game/
    gameServer.js
    gameLoop.js
    maps.js
    entities/
      tank.js
      bullet.js
    physics/
      movement.js
      collision.js
    systems/
      combatSystem.js
      respawnSystem.js
      powerUpSystem.js
  shared/
    gameConstants.js
    messageTypes.js
public/
  index.html
  main-menu.html
  new-game.html
  game-room.html
  game.html
  js/
    login.js
    main-menu.js
    new-game.js
    game-room.js
    game-client.js
    input/
      inputManager.js
    render/
      canvasRenderer.js
      hudRenderer.js
    state/
      gameState.js
    assets/
      assetLoader.js
  css/
    game.css
  assets/
    sprites/
    effects/
    audio/
    maps/
    ui/
Documents/
  SDD.pdf
  SDD.tex
  SDD.synctex.gz
```

## Router Ayrimi

Projede API route'lari ile HTML sayfasi sunan route'lar ayni dosyada tutulmaz.

API route'lari:

```text
src/meta/api/
```

HTML page route'lari:

```text
src/meta/pages/
```

Bu ayrim korunmalidir. API route'lari JSON donmelidir. Page route'lari HTML dosyasi sunmalidir.

Eski tek dosyali `src/meta/routes.js` yapisi kullanilmamalidir; aktif server bu dosyayi import etmez. Yeni API giris noktasi `src/meta/api/index.js` dosyasidir.

## API Route'lari

Aktif API prefix'i:

```text
/api
```

`src/meta/api/index.js` su alt router'lari baglar:

- `/api/auth` -> `src/meta/api/authRoutes.js`
- `/api/rooms` -> `src/meta/api/roomRoutes.js`

API'lerde oturum token'i body icinden degil, genellikle su header ile gonderilir:

```http
Authorization: Bearer <token>
```

### POST /api/auth/login

Dosya:

```text
src/meta/api/authRoutes.js
```

Beklenen body:

```json
{
  "username": "Yusuf"
}
```

Basarili yanit:

```json
{
  "success": true,
  "token": "cmd_xxxxx",
  "username": "Yusuf"
}
```

Hata durumlari:

- Bos username: `400`
- Aktif kullanici adi tekrar kullanilirsa: `400`
- Beklenmeyen server hatasi: `500`

Token su anda JWT degildir; `cmd_` prefix'li gecici oturum biletidir. Kullanici bilgisi RAM'deki `activeSessions` Map'i icinde tutulur.

### POST /api/rooms

Dosya:

```text
src/meta/api/roomRoutes.js
```

Beklenen header:

```http
Authorization: Bearer <token>
```

Beklenen body:

```json
{
  "roomName": "Oda Adi",
  "maxPlayers": 4
}
```

Token RAM store icinde bulunmazsa `401` doner. Basarili olursa yeni oda `rooms` Map'i icine eklenir. Odayi olusturan kullanici:

- `host` olur.
- `players` listesinin ilk oyuncusu olur.
- Kendi session bilgisinde `currentRoom` alanina oda id'si yazilir.

Basarili yanit:

```json
{
  "success": true,
  "roomId": "room_abc123"
}
```

### GET /api/rooms

Dosya:

```text
src/meta/api/roomRoutes.js
```

`waiting` durumundaki odalari JSON olarak listeler. `test-room` listede gosterilmez.

Basarili yanit sekli:

```json
{
  "rooms": [
    {
      "id": "room_abc123",
      "name": "Oda Adi",
      "host": "Yusuf",
      "currentPlayers": 1,
      "maxPlayers": 4
    }
  ]
}
```

`currentPlayers`, artik session taranarak degil, odanin resmi `players.length` degeriyle hesaplanir.

### POST /api/rooms/:id/join

Dosya:

```text
src/meta/api/roomRoutes.js
```

Beklenen header:

```http
Authorization: Bearer <token>
```

Davranis:

- Token gecersizse `401` doner.
- Oda yoksa `404` doner.
- Oda `waiting` degilse `400` doner.
- Oda doluysa `400` doner.
- Oyuncu zaten odadaysa ikinci kez eklenmez.
- Oyuncu `room.players` listesine eklenir.
- Oyuncunun `session.currentRoom` alani oda id'sine set edilir.

Basarili yanit:

```json
{
  "success": true,
  "roomId": "room_abc123"
}
```

### POST /api/rooms/:id/leave

Dosya:

```text
src/meta/api/roomRoutes.js
```

Beklenen header:

```http
Authorization: Bearer <token>
```

Davranis:

- Token gecersizse `401` doner.
- Oda yoksa ve oyuncunun session'i bu odayi gosteriyorsa `currentRoom` temizlenir.
- Oyuncu `room.players` listesinden cikarilir.
- Oyuncunun `session.currentRoom` alani `null` yapilir.
- Oda bos kalirsa `rooms.delete(roomId)` ile RAM'den silinir.
- Cikan oyuncu `host` ise ve odada oyuncu kaldiysa `host` kalan ilk oyuncuya devredilir.

Oda silinirse yanit:

```json
{
  "success": true,
  "roomDeleted": true
}
```

Oda devam ederse yanit:

```json
{
  "success": true,
  "roomDeleted": false,
  "host": "YeniHost",
  "players": ["YeniHost"]
}
```

### GET /api/rooms/:id

Dosya:

```text
src/meta/api/roomRoutes.js
```

Tek bir odanin detayini JSON olarak doner. Oda bulunamazsa `404` doner.

Basarili yanit:

```json
{
  "id": "room_abc123",
  "name": "Oda Adi",
  "host": "Yusuf",
  "maxPlayers": 4,
  "status": "waiting",
  "players": ["Yusuf"]
}
```

Bekleme odasi frontend'i bu endpoint'i 2 saniyede bir cagirarak oyuncu listesini ve kurucu bilgisini gunceller.

### POST /api/rooms/:id/start

Dosya:

```text
src/meta/api/roomRoutes.js
```

Beklenen header:

```http
Authorization: Bearer <token>
```

Davranis:

- Token gecersizse `401` doner.
- Oda yoksa `404` doner.
- Sadece odanin `host` kullanicisi oyunu baslatabilir; aksi halde `403` doner.
- Basarili olursa `room.status = "playing"` yapilir.

Basarili yanit:

```json
{
  "success": true
}
```

## Page ve Statik Route'lar

Dosya:

```text
src/meta/pages/pageRoutes.js
```

Aktif page route'lari:

- `GET /`: `public/index.html` dosyasini sunar.
- `GET /main-menu`: `public/main-menu.html` dosyasini sunar.
- `GET /game-room/:roomId`: `public/game-room.html` dosyasini sunar.

Express `public/` klasorunu statik sundugu icin su HTML dosyalari da dogrudan acilir:

- `GET /new-game.html`
- `GET /game-room.html?roomId=<roomId>`
- `GET /game.html`

Mevcut frontend akisi bekleme odasina query string ile gider:

```text
/game-room.html?roomId=room_abc123
```

## Frontend Durumu

Frontend su anda lobi, bekleme odasi ve WebSocket'e baglanan oyun ekrani akisini destekler. Oyun ekrani oynanabilirlik acisindan gelismis parcalar icerse de proje hala erken asamadadir.

### public/index.html ve public/js/login.js

Basit login sayfasidir.

Akis:

1. Kullanici adini input'tan okur.
2. Bos username icin frontend tarafinda mesaj gosterir.
3. `POST /api/auth/login` istegi atar.
4. Backend basarili donerse `username` ve `token` degerlerini `sessionStorage` icine yazar.
5. Kisa bekleme sonrasi `/main-menu` sayfasina gecer.
6. Backend hata donerse mesaji ekranda gosterir.

### public/main-menu.html ve public/js/main-menu.js

Ana menu/lobi ekranidir.

- `sessionStorage` icinden `token` ve `username` okur.
- Token yoksa login sayfasina geri yollar.
- Kullanici adini ekranda gosterir.
- `GET /api/rooms` ile bekleyen odalari listeler.
- Her oda icin doluluk sayaci ve "KATIL" butonu gosterir.
- Oda doluysa buton disabled olur ve "DOLU" yazar.
- "KATIL" butonu `POST /api/rooms/:id/join` istegi atar.
- Katilma basarili olursa `/game-room.html?roomId=<roomId>` adresine gider.
- "Yeni Oyun Olustur" butonu `/new-game.html` adresine gider.
- Logout butonu sadece `sessionStorage` temizler; server tarafinda aktif kullanici temizligi henuz yoktur.

### public/new-game.html ve public/js/new-game.js

Yeni oda olusturma formudur.

- Oyun adi ve maksimum oyuncu sayisi alir.
- `sessionStorage` icinden `token` kontrol eder.
- `POST /api/rooms` istegi atar.
- Basarili olursa `/game-room.html?roomId=<roomId>` bekleme odasina yonlendirir.
- "Iptal Et" butonu `/main-menu` adresine gider.

### public/game-room.html ve public/js/game-room.js

Oda bekleme ekranidir.

- URL query string icinden `roomId` okur.
- Token veya room id yoksa `/main-menu` adresine doner.
- `GET /api/rooms/:id` ile oda bilgisini ceker.
- Oda adi, oda id'si, oyuncu sayisi, maksimum oyuncu sayisi ve oyuncu listesini gosterir.
- `players` listesindeki `host` kullanicisini "Kurucu" etiketiyle gosterir.
- Bekleme odasi 2 saniyede bir polling yapar:

```js
setInterval(fetchRoomDetails, 2000);
```

- Bu polling sayesinde bir oyuncu odadan cikinca veya kurucu degisince odada kalanlarin ekrani en gec yaklasik 2 saniye icinde guncellenir.
- "MERKEZE DON" butonu once `POST /api/rooms/:id/leave` istegi atar, sonra `/main-menu` adresine doner.
- Cikis sirasinda tekrar tekrar tiklamayi azaltmak icin `isLeavingRoom` flag'i kullanilir.
- "SAVASI BASLAT" butonu sadece `currentUsername === data.host` ise gorunur.
- Oyun baslatilinca oda `playing` durumuna gecer; bekleme odasindaki client'lar polling ile bunu gorup `/game.html` adresine gecer.

### public/game.html ve public/js/game-client.js

Canvas tabanli oyun ekranidir.

- `#game-canvas` canvas elementi vardir.
- Canvas boyutu su anda `1920x1080` olarak set edilir.
- `public/js/input/inputManager.js` input toplar.
- `public/js/game-client.js`, `sessionStorage` icindeki token ile WebSocket'e baglanir.
- Client `PLAYER_INPUT` mesajlarini WebSocket uzerinden server'a gonderir.
- Server'dan `GAME_STATE_UPDATE`, `EXPLOSION` ve `MAP_CHANGED` mesajlarini dinler.
- `public/js/render/canvasRenderer.js` oyun state'ini canvas'a cizer.
- `public/js/render/hudRenderer.js` HUD bilgisini cizer.
- `public/js/state/gameState.js` local game state iskeletini olusturur.
- `public/js/assets/assetLoader.js` sprite ve efekt assetlerini yukler.

## Game Server Durumu

Dosya:

```text
src/game/gameServer.js
```

`initGameServer(server)`, `ws` paketiyle WebSocket server kurar ve HTTP server'a baglanir.

Mevcut Game Server tarafinda su parcalar vardir:

- WebSocket baglantisi token ve username ile kabul edilir.
- Oyuncunun `session.currentRoom` degeri kullanilarak oda bulunur.
- Test veya fallback akislar icin `test-room` kullanimi bulunur.
- Oda icinde `clients` Set'i ile WebSocket client'lari tutulur.
- `gameState.players`, `bullets`, `activeItems`, `obstacles`, `world` gibi alanlar uzerinden state tutulur.
- 60 FPS hedefli oyun dongusu `setInterval` ile calistirilir.
- Oyuncu input'u `PLAYER_INPUT` mesaji ile islenir.
- Tank hareketi, mermi uretimi, power-up, item spawn, collision ve explosion mesajlari icin erken asama uygulamalar vardir.
- `src/game/maps.js` icindeki harita verileri kullanilir.

Bu kod oyun hedefinin onemli bir iskeletidir; ancak hala production kalitesinde authoritative server, denge, anti-cheat, reconnect, cleanup ve tam test kapsamindan uzaktir.

## Veri Modeli ve RAM Store

Dosya:

```text
src/data/store.js
```

Aktif store nesneleri:

- `activeSessions`: token -> oturum bilgisi eslestirmesi.
- `activeUsernames`: aktif kullanici adlarinin benzersizlik kontrolu.
- `rooms`: oda id -> oda bilgisi eslestirmesi.

Login sonrasi session sekli:

```js
{
  username: "Yusuf",
  currentRoom: null
}
```

Oda sekli:

```js
{
  id: "room_abc123",
  name: "Oda Adi",
  maxPlayers: 4,
  host: "Yusuf",
  players: ["Yusuf"],
  status: "waiting",
  clients: new Set(),
  gameState: null,
  gameInterval: null
}
```

Bu veriler RAM uzerindedir. Server yeniden baslatilinca tum kullanicilar, token'lar ve odalar silinir. Bu davranis su an icin bilincli ve SDD'deki gecici oturum yaklasimina uygundur.

Oda modeli icin dikkat edilmesi gereken zihinsel ayrim:

- `room.players`: Odanin resmi oyuncu listesi.
- `session.currentRoom`: Oyuncunun hangi odada oldugunu gosteren oturum referansi.

Bu iki alan join/leave/create akislari sirasinda senkron tutulmalidir.

## Ekip Gorev Ayrimi

### Meta/lobi ekibi

Calisma alani:

```text
src/meta/
src/data/store.js
public/index.html
public/main-menu.html
public/new-game.html
public/game-room.html
public/js/login.js
public/js/main-menu.js
public/js/new-game.js
public/js/game-room.js
```

Sorumluluklar:

- Login.
- Oda listeleme.
- Oda olusturma.
- Odaya katilma.
- Oda bekleme ekrani.
- Odadan cikma, oda silme ve `host` devri.
- Oyunu baslatma status degisimi.
- Lobi/bekleme odasi polling davranisi.

### Fizik ve mekanik ekibi

Calisma alani:

```text
src/game/
src/shared/
```

Sorumluluklar:

- Authoritative Game Server iskeleti.
- WebSocket baglanti ve oda-client iliskisi.
- Oyun dongusu.
- Tank ve mermi entity'leri.
- Hareket ve collision fizigi.
- Combat, respawn ve power-up sistemleri.
- Harita verileri ve map degisimi.

### Frontend ve asset ekibi

Calisma alani:

```text
public/game.html
public/js/game-client.js
public/js/input/
public/js/render/
public/js/state/
public/js/assets/
public/css/
public/assets/
```

Sorumluluklar:

- Canvas oyun ekrani.
- Input toplama.
- HUD.
- Renderer.
- Local game state.
- Asset loader.
- Sprite, ses, harita, efekt ve UI assetleri.
- Ileride client-side prediction, reconciliation ve interpolation taraflari.

## SDD ile Mevcut Kod Arasindaki Fark

`Documents/SDD.pdf` hedef mimariyi anlatir. Kod ise hedef mimarinin erken bir uygulamasidir.

SDD'de hedeflenen ama henuz tam olgunlasmayan basliklar:

- Production kalitesinde authoritative Game Server.
- WebSocket ile dusuk gecikmeli ve temiz reconnect/cleanup destekli oyun iletisimi.
- Stabil ve testli 60 Hz oyun dongusu.
- Client-side prediction.
- Server reconciliation.
- Entity interpolation.
- Tam tank hareket fizigi.
- Tam mermi fizigi.
- Collision detection'in tum oyun kurallariyla tutarli entegrasyonu.
- Health, respawn, skor, power-up ve oyun sonu sistemlerinin tamamlanmasi.
- Tam Canvas tabanli oyun render hatti.
- Oyunu baslatma sonrasi Game Server handover akisini temizlestirme.

Bu farki karistirmamak onemlidir. SDD yol haritasidir; mevcut kod ise bu yolun calisan ama hala erken asamadaki uygulamasidir.

## Gelistirme Kurallari

- JSON donen sistem API'leri `src/meta/api/` altinda tutulmalidir.
- HTML sayfasi sunan router fonksiyonlari `src/meta/pages/` altinda tutulmalidir.
- Tarayici tarafli JavaScript dosyalari `public/js/` altinda tutulmalidir.
- Statik HTML dosyalari `public/` altinda tutulmalidir.
- Oyun mekanigi ve Game Server kodlari `src/game/` altina eklenmelidir.
- Meta Server ve Game Server arasinda paylasilacak sabitler veya yardimcilar `src/shared/` altina eklenmelidir.
- Canvas render, HUD, input, local state ve asset loader kodlari `public/js/` altinda ilgili alt klasorlerde tutulmalidir.
- Asset dosyalari `public/assets/` altinda turlerine gore ayrilmalidir.
- Dosyalar her zaman UTF-8 encoding ile acilmali ve kaydedilmelidir.
- RAM store kullanilirken verinin kalici olmadigi unutulmamalidir.
- `room.players` ve `session.currentRoom` birlikte guncellenmelidir; sadece birini degistirmek lobi/bekleme odasi tutarsizligi yaratir.
- Lobi/bekleme odasi anlik bildirimleri su anda WebSocket push ile degil polling ile guncellenir.
- `Documents/SDD.pdf` ve `Documents/SDD.tex` proje tasarim kaynaklaridir; kod davranisi ile celisen bir durum varsa once mevcut kod dogrulanmalidir.

## Bilinen Eksikler

- `npm test` gercek test calistirmaz.
- Login icin logout/disconnect server temizligi yoktur; `activeUsernames` temizlenmez.
- RAM store icin TTL/zombi oda temizleme mekanizmasi henuz yoktur.
- Lobi ve bekleme odasi guncellemeleri WebSocket push yerine polling ile yapilir.
- Game Server WebSocket'e baglidir ancak oyun sistemi hala erken asamadadir.
- Oyun dongusu, hareket, mermi, collision, combat, respawn ve power-up sistemleri tamamlanmis/denge testleri yapilmis kabul edilmemelidir.
- Client-side prediction, reconciliation ve interpolation yoktur.
- Reconnect ve oyun ici disconnect cleanup akislari eksiktir.
- Canvas render ve HUD calismalari devam eden erken asama uygulamalardir.

## Temizlik Notlari

- Gecici test loglari repo icinde tutulmamalidir.
- `server-test.out.log` ve `server-test.err.log` kaynak dosya degildir.
- Eski tek dosyali router yaklasimi tekrar canlandirilmamalidir.
- Eski tekil `room` route semasi tekrar eklenmemelidir; guncel oda API'si `/api/rooms` altindadir.
- Mevcut oda kurucu alaninin adi `host` tur; yeni kodda eski kurucu alan adina geri donulmemelidir.
