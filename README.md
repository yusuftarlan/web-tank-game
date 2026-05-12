# Web Tank Game

Web Tank Game, tarayici uzerinden oynanmasi hedeflenen, gercek zamanli ve cok oyunculu bir 2D tank savasi oyunudur.

Proje su anda erken asamadadir: Express tabanli Meta Server, RAM tabanli gecici oturum/oda yapisi, basit lobi ekranlari ve oyun ekibi icin hazirlanmis frontend/backend iskeleti vardir. WebSocket Game Server, gercek oyun dongusu ve tamamlanmis oyun mekanikleri henuz uygulanmamistir.

Daha detayli teknik aciklama icin [AGENTS.md](AGENTS.md) dosyasina bak.

## Kurulum

Bagimliliklari yukle:

```bash
npm install
```

Server'i baslat:

```bash
npm start
```

Tarayicida ac:

```text
http://localhost:3000
```

## Mevcut Akis

1. `GET /` login sayfasini acar.
2. Kullanici adi girilip "Giris Yap" butonuna basilir.
3. `POST /api/login` gecici token uretir.
4. Frontend `username` ve `token` degerlerini `sessionStorage` icine yazar.
5. Kullanici `/main-menu` sayfasina gecer.
6. Main menu mevcut odalari listeler ve yeni oyun olusturma butonu sunar.
7. `/new-game.html` uzerinden oda adi ve maksimum oyuncu sayisi girilerek oda olusturulur.
8. Basarili oda olusturma sonrasi kullanici `/game-room/:roomId` bekleme odasina yonlendirilir.
9. Game room sayfasi oda bilgilerini gosterir; "Cik" butonu odadan ayrilma API'sini tetikler.

## Route Ozeti

API route'lari JSON doner:

| Metod | Yol | Aciklama |
| --- | --- | --- |
| `POST` | `/api/login` | Kullanici adi ile gecici oturum token'i olusturur. |
| `POST` | `/api/room/create` | Gecerli token ile yeni oda olusturur ve kullaniciyi game master yapar. |
| `GET` | `/api/rooms` | Bekleyen odalari listeler. |
| `GET` | `/api/room/:roomId` | Tek bir odanin detayini doner. |
| `POST` | `/api/room/leave` | Kullaniciyi odadan cikarir; gerekirse game master devreder veya odayi kapatir. |

Page/statik route'lar HTML sayfasi sunar:

| Metod | Yol | Aciklama |
| --- | --- | --- |
| `GET` | `/` | Login sayfasini sunar. |
| `GET` | `/main-menu` | Ana menu/lobi sayfasini sunar. |
| `GET` | `/new-game.html` | Yeni oda olusturma formunu sunar. |
| `GET` | `/game-room/:roomId` | Oda bekleme sayfasini sunar. |
| `GET` | `/game.html` | Canvas oyun ekrani placeholder sayfasini sunar. |

## Ekip Alanlari

- Meta/lobi backend kodlari `src/meta/` altindadir.
- Oyun fizigi ve mekanigi icin server tarafi iskeleti `src/game/` altindadir.
- Paylasilan sabitler ve mesaj tipleri `src/shared/` altindadir.
- Frontend, render, local state ve asset loader iskeleti `public/js/` altindadir.
- Sprite, ses, harita, efekt ve UI varliklari `public/assets/` altinda tutulur.

## Mevcut Sinirlar

- WebSocket/Game Server gercek anlamda baglanmis degildir.
- `src/game/` icindeki oyun dongusu, fizik ve sistem dosyalari iskelet seviyesindedir.
- `/game.html` canvas ekrani placeholder seviyesindedir.
- Odaya katilma ve oyunu baslatma API'leri henuz tamamlanmamistir.
- Veriler RAM'de tutulur; server kapaninca oturumlar ve odalar silinir.
- `npm test` su anda gercek test calistirmaz.
