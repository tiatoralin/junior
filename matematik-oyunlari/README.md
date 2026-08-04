# Mathmazel Oyun Bahçesi

2. sınıf matematik oyunları. Build adımı yok, bağımlılık yok, internetsiz çalışır.

## Yerel olarak açmak

```bash
cd matematik-oyunlari
python3 -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` aç.

> `index.html`'e çift tıklayarak da açılır ama `file://` altında bazı tarayıcılar
> yan dosyaları engelleyebilir. Sunucu yöntemi daha güvenli.

## Klasör yapısı

```
index.html              çatı sayfa — oyun kartları
shared/
  theme.css             tüm sayfaların ortak görünümü
  fonts.css             self-host font tanımları
  audio.js              ses efektleri (WebAudio) + Türkçe sesli okuma
  storage.js            ilerleme kaydı (localStorage)
  hud.js                oyun içi "Menü" ve "Ses" düğmeleri
  celebrate.js          kutlama efektleri (uçan yıldız, konfeti)
oyunlar/
  balon-standi.html            2. sınıf
  zip-zip-karnavali.html       2. sınıf
  carpim-cadirlari-2sinif.html 2. sınıf — dört çadır
  carpim-cadirlari.html        3-4. sınıf — aynı dört çadır, 10×10'a kadar
fonts/                  Baloo 2 + Nunito (woff2, ~135 KB)
```

## Çarpım Çadırları'nın iki sürümü

Aynı dört çadır (Örüntü Keşfi, Türetme Köprüsü, Çekirdek Avı, Ritmik Ritim)
iki seviyede. Ayrı dosyalar, ayrı kayıt anahtarları — biri diğerinin ilerlemesini
etkilemez. Farklar sadece veri katmanında:

| | 2. sınıf | İleri |
|---|---|---|
| Örüntü çarpanları | 1-5 ve 10 (×10 satırı 5'te durur) | 1-10 |
| Köprü çiftleri | `3×6 … 5×9`, en büyük 50 | `6×6 … 9×8`, en büyük 81 |
| Av havuzu | çarpanlardan biri 1-5 | 2-10 arası tüm çiftler |
| Çekirdekler | `3×7, 3×8, 3×9, 4×6, 4×7, 4×8` | `6×6, 7×6, 8×6, 7×7, 8×7, 8×8` |

Ritmik Ritim iki sürümde de aynı (2, 3, 4, 5, 10'ar sayma).

## Yeni oyun eklemek

1. Oyunu `oyunlar/yeni-oyun.html` olarak koy.
2. `<head>` kısmına ekle:
   ```html
   <link rel="stylesheet" href="../shared/theme.css">
   ```
3. `<div class="wrap">` içine ilk satır olarak `<div id="hud"></div>` koy.
4. Script sırası önemli — `storage.js` her zaman `audio.js`'ten önce:
   ```html
   <script src="../shared/storage.js"></script>
   <script src="../shared/audio.js"></script>
   <script> /* oyunun kendi kodu */ </script>
   <script src="../shared/hud.js"></script>
   ```
5. `index.html` içindeki `GAMES` dizisine bir satır ekle.

## Paylaşılan API

```js
// ses
Sfx.good()  Sfx.bad()  Sfx.pop()  Sfx.win()  Sfx.click()  Sfx.star()  Sfx.hop()
Sfx.tone('C4')          // nota adı veya Hz
Sfx.toggleMute()  Sfx.isMuted()

// sesli okuma (Türkçe)
Speech.speak('Üç kere dört kaç eder?')
Speech.cancel()
Speech.supported

// ilerleme
var S = Progress.load('oyun-id', varsayilanDurum);
Progress.save('oyun-id', S);
Progress.summary('oyun-id');   // {stars, unlocked, prizes, played}
Progress.totalStars();
Progress.reset();              // hepsi;  reset('oyun-id') tek oyun

// zorlanılan çarpımlar (öğretmene dönük)
Progress.logHit(3, 4);         // ilk denemede bildi
Progress.logMiss(3, 4);        // ilk denemede bilemedi
Progress.hardFacts(12);        // [{fact:'3x4', miss:2, seen:5, rate:.4}, ...]
Progress.clearMisses();

// ayarlar
Settings.get('autoRead', false);
Settings.set('autoRead', true);
```

Ses, mobil tarayıcı kuralı gereği ilk dokunuşa kadar sessizdir; `audio.js` bunu
kendisi çözer, ek bir şey yapman gerekmez.

## Yayınlamak

Klasörü olduğu gibi Netlify'a sürükle-bırak, ya da GitHub'a koyup Pages'i aç.
Derleme ayarı gerekmez.

## Müfredat uyumu

Soru üreticileri MEB 2. sınıf matematik programının sınırına bağlıdır:

> "10'a kadar olan sayıları 1, 2, 3, 4 ve 5 ile çarpmaları istenir."
> Çarpım tablosu 5'e kadar (5 dâhil) oluşturulur.

Yani her soruda **çarpanlardan biri 1-5 arasında, diğeri en çok 10** olur.
Bunu iki oyunda da `scopeClamp()` / `makeQuestion()` içindeki kelepçe garanti eder;
üretilebilen en büyük çarpım 50'dir. Yeni bir seviye eklerken bu kelepçeyi
atlama — `zor` havuzuna 10 koyup çarpanı da 10'a çıkarırsan kapsam dışına çıkarsın.

## Notlar

- İlerleme her cihazda ayrı tutulur (localStorage). Tablet paylaşılıyorsa
  çocuklar aynı kaydı görür.
- Sesli okuma cihazda Türkçe ses yüklüyse çalışır; yoksa "Dinle" düğmesi
  kendini gizler.
- Tarayıcıda "İlerlemeyi sıfırla" düğmesi çatı sayfanın üstündedir.
