# Web Tank Game - Proje Rehberi

Bu dosya, projeyi devralacak gelistirici veya ajanlar icin guncel teknik durumu anlatir. README kisa kullanim rehberidir; bu dosya ise projenin mimari haritasidir.

## Proje Amaci

Web Tank Game'in nihai hedefi, tarayici uzerinden oynanabilen, gercek zamanli ve cok oyunculu bir 2D tank savasi oyunu gelistirmektir. Tasarim dokumani `Documents/SDD.pdf` icinde Meta Server, Game Server, HTML5 Canvas frontend, WebSocket ile anlik oyun akisi ve RAM tabanli gecici oturum mimarisini tarif eder.

Mevcut kod bu hedefin erken asamasindadir. Su anda calisan bolumler:

- Express tabanli HTTP server.
- JSON donen Meta Server API route'lari.
- HTML sayfalari sunan page route'lari.
- RAM tabanli gecici kullanici ve oda store'u.
- Login, main menu, yeni oda olusturma ve game room bekleme akisi.
- Oda olusturma, oda listeleme, oda detay ve odadan cikma API'leri.
- Game Server, mekanik, frontend render ve asset ekipleri icin dosya iskeleti.

Henuz uygulanmayan ana bolumler:

- WebSocket tabanli Game Server baglantisi.
- Gercek authoritative oyun dongusu.
- Tam tank hareketi ve mermi fizigi.
- Gercek carpismalar, skor, health, power-up ve respawn sistemleri.
- Tam Canvas render sistemi ve oynanabilir oyun ekrani.
- Odaya katilma ve oyunu baslatma akislarinin tamamlanmis halleri.

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
- CORS middleware'ini ekler.
- JSON body parsing icin `express.json()` kullanir.
- `public/` klasorunu statik dosya klasoru olarak sunar.
- API router'ini `/api` prefix'i ile baglar.
- Page router'i prefix olmadan baglar.

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
    audio/
    maps/
    effects/
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

### POST /api/login

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
  "message": "Giris basarili.",
  "token": "uuid-token",
  "username": "Yusuf",
  "redirectTo": "/main-menu"
}
```

Hata durumlari:

- Bos username: `400`
- Aktif kullanici adi tekrar kullanilirsa: `409`

Token su anda JWT degildir; UUID tabanli gecici oturum biletidir.

### POST /api/room/create

Dosya:

```text
src/meta/api/roomRoutes.js
```

Beklenen body:

```json
{
  "token": "uuid-token",
  "roomName": "Oda Adi",
  "maxPlayers": 4
}
```

Token RAM store icinde bulunmazsa `401` doner. Basarili olursa yeni oda `rooms` Map'i icine eklenir, olusturan kullanici odanin `gameMaster` degeri olur ve kullanicinin session bilgisinde `currentRoom` oda id'sine set edilir.

### GET /api/rooms

Dosya:

```text
src/meta/api/roomRoutes.js
```

`waiting` durumundaki odalari JSON olarak listeler.

### GET /api/room/:roomId

Dosya:

```text
src/meta/api/roomRoutes.js
```

Tek bir odanin detayini JSON olarak doner. Oda bulunamazsa `404` doner.

### POST /api/room/leave

Dosya:

```text
src/meta/api/roomRoutes.js
```

Beklenen body:

```json
{
  "token": "uuid-token",
  "roomId": "room_12345678"
}
```

Oyuncuyu odanin `players` listesinden cikarir ve session icindeki `currentRoom` degerini `null` yapar. Cikan oyuncu `gameMaster` ise ve odada oyuncu kaldiysa `gameMaster` kalan ilk oyuncuya devredilir. Oda bos kalirsa `rooms.delete(roomId)` ile RAM'den silinir.

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
- `GET /game.html`

## Frontend Durumu

Frontend su anda lobi ve bekleme odasi akislarini destekler. Gercek oynanabilir Canvas oyunu henuz yoktur.

### public/index.html ve public/js/login.js

Basit login sayfasidir.

Akis:

1. Kullanici adini input'tan okur.
2. Bos username icin frontend tarafinda mesaj gosterir.
3. `POST /api/login` istegi atar.
4. Backend basarili donerse `username` ve `token` degerlerini `sessionStorage` icine yazar.
5. `redirectTo` degeri ile `/main-menu` sayfasina gecer.
6. Backend hata donerse mesaji ekranda gosterir.

### public/main-menu.html ve public/js/main-menu.js

Ana menu/lobi ekranidir.

- `sessionStorage` icinden `username` okur.
- Username yoksa login sayfasina geri yollar.
- Kullanici adini ekranda gosterir.
- `GET /api/rooms` ile bekleyen odalari listeler.
- Her oda icin simdilik pasif bir "Katil" butonu gosterir.
- "Yeni Oyun Olustur" butonu `/new-game.html` adresine gider.

### public/new-game.html ve public/js/new-game.js

Yeni oda olusturma formudur.

- Oyun adi ve maksimum oyuncu sayisi alir.
- `sessionStorage` icinden `token` ve `username` kontrol eder.
- `POST /api/room/create` istegi atar.
- Basarili olursa `/game-room/:roomId` bekleme odasina yonlendirir.
- "Geri Don" butonu `/main-menu` adresine gider.

### public/game-room.html ve public/js/game-room.js

Oda bekleme ekranidir.

- URL path icinden `roomId` okur.
- `GET /api/room/:roomId` ile oda bilgisini ceker.
- Oda adi, oda id'si, game master ve oyuncu sayisini gosterir.
- "Cik" butonu `POST /api/room/leave` istegi atar ve basarili olursa `/main-menu` adresine doner.
- "Oyunu Baslat" butonu simdilik gorunur ama fonksiyonel degildir.

### public/game.html ve public/js/game-client.js

Canvas tabanli oyun ekrani icin placeholder iskelettir.

- `#game-canvas` canvas elementi vardir.
- `public/js/render/canvasRenderer.js` basit canvas renderer iskeletidir.
- `public/js/render/hudRenderer.js` HUD renderer iskeletidir.
- `public/js/state/gameState.js` local game state iskeletidir.
- `public/js/assets/assetLoader.js` asset preload iskeletidir.

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
  joinedAt: 1714300000000,
  currentRoom: null
}
```

Oda sekli:

```js
{
  roomId: "room_12345678",
  roomName: "Oda Adi",
  maxPlayers: 4,
  players: ["Yusuf"],
  gameMaster: "Yusuf",
  status: "waiting",
  createdAt: 1714300000000
}
```

Bu veriler RAM uzerindedir. Server yeniden baslatilinca tum kullanicilar, token'lar ve odalar silinir. Bu davranis su an icin bilincli ve SDD'deki gecici oturum yaklasimina uygundur.

## Ekip Gorev Ayrimi

### Meta/lobi ekibi

Calisma alani:

```text
src/meta/
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
- Oda bekleme ekrani.
- Odadan cikma ve game master devri.

### Fizik ve mekanik ekibi

Calisma alani:

```text
src/game/
src/shared/
```

Sorumluluklar:

- Authoritative Game Server iskeleti.
- Oyun dongusu.
- Tank ve mermi entity'leri.
- Hareket ve collision fizigi.
- Combat, respawn ve power-up sistemleri.
- Ileride WebSocket/Game Server entegrasyonu.

### Frontend ve asset ekibi

Calisma alani:

```text
public/game.html
public/js/game-client.js
public/js/render/
public/js/state/
public/js/assets/
public/css/
public/assets/
```

Sorumluluklar:

- Canvas oyun ekrani.
- HUD.
- Renderer.
- Local game state.
- Asset loader.
- Sprite, ses, harita, efekt ve UI assetleri.
- Ileride client-side prediction, reconciliation ve interpolation taraflari.

## SDD ile Mevcut Kod Arasindaki Fark

`Documents/SDD.pdf` hedef mimariyi anlatir. Kod ise hedef mimarinin erken bir uygulamasidir.

SDD'de hedeflenen ama henuz tam uygulanmayan basliklar:

- Authoritative Game Server.
- WebSocket ile dusuk gecikmeli oyun iletisimi.
- 60 Hz oyun dongusu.
- Client-side prediction.
- Server reconciliation.
- Entity interpolation.
- Tam tank hareket fizigi.
- Tam mermi fizigi.
- Collision detection'in oyun icine entegrasyonu.
- Health, respawn, skor ve power-up sistemleri.
- Tam Canvas tabanli oyun render hatti.
- Oyunu baslatma ve Game Server'a handover sureci.

Bu farki karistirmamak onemlidir. SDD yol haritasidir; mevcut kod ise bu yolun basindaki calisan iskelettir.

## Gelistirme Kurallari

- JSON donen sistem API'leri `src/meta/api/` altinda tutulmalidir.
- HTML sayfasi sunan router fonksiyonlari `src/meta/pages/` altinda tutulmalidir.
- Tarayici tarafli JavaScript dosyalari `public/js/` altinda tutulmalidir.
- Statik HTML dosyalari `public/` altinda tutulmalidir.
- Oyun mekanigi ve Game Server kodlari `src/game/` altina eklenmelidir.
- Meta Server ve Game Server arasinda paylasilacak sabitler veya yardimcilar `src/shared/` altina eklenmelidir.
- Canvas render, HUD, local state ve asset loader kodlari `public/js/` altinda ilgili alt klasorlerde tutulmalidir.
- Asset dosyalari `public/assets/` altinda turlerine gore ayrilmalidir.
- RAM store kullanilirken verinin kalici olmadigi unutulmamalidir.
- `Documents/SDD.pdf` ve `Documents/SDD.tex` proje tasarim kaynaklaridir; kod davranisi ile celisen bir durum varsa once mevcut kod dogrulanmalidir.

## Bilinen Eksikler

- `npm test` gercek test calistirmaz.
- WebSocket/Game Server gercek anlamda bagli degildir.
- Oyun dongusu iskelet seviyesindedir.
- Gercek tank hareketi, mermi fizigi ve collision oyuna entegre degildir.
- Combat, respawn ve power-up sistemleri placeholder seviyesindedir.
- Canvas render sistemi placeholder seviyesindedir.
- Oda join/start akislarinin tamamlanmis API'leri yoktur.
- Logout veya disconnect temizleme akisi yoktur.
- RAM store icin TTL/zombi oda temizleme mekanizmasi henuz yoktur.

## Temizlik Notlari

- Gecici test loglari repo icinde tutulmamalidir.
- `server-test.out.log` ve `server-test.err.log` kaynak dosya degildir.
- Eski tek dosyali router yaklasimi tekrar canlandirilmamalidir.
