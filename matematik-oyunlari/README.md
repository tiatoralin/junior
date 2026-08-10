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
  nasil.js              "Nasıl oynanır?" kartı
  bolme.js              bölmenin dik (bölü çizgili) gösterimi
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

// nasıl oynanır kartı
Nasil.tanit('balon-standi', 'count', ADIMLAR);   // ilk kez ise göster
Nasil.ac('balon-standi', 'count', ADIMLAR);      // her hâlükârda göster
Nasil.soruDugmesi(fn);                           // başlıktaki "?" düğmesi

// bölmenin dik gösterimi (ders kitabındaki bölü çizgili düzen)
Bolme.dik(12, 3);                    // '<div class="dikbol">…'
Bolme.dik(12, 3, {etiket:true});     // bölünen/bölen/bölüm/kalan adlarıyla
Bolme.goster(board, 12, 3, 2000);    // tahtanın üstünde kaplama kart
Bolme.okunus(12, 3);                 // '12 bölü 3 eşittir 4'

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

## Bölme oyunlarının bölümleri

İki bölme oyunu MAT.2.2.4'ün iki anlamını taşıyor (paylaştırma ve ardışık
çıkarma). Son iki bölüm temanın diğer iki çıktısını kapatıyor:

| Bölüm | Oyun | Çıktı | Kitap |
|---|---|---|---|
| Kontrol Et | Geri Zıp Zıp, 5. stant | MAT.2.2.5 b — çarpma ve bölme birbirini doğrular | Ders-2 s.38, 39, **51 (değerlendirme)**; Çalışma-2 s.38, 42 |
| Denge Terazisi | Şölen, 4. sofra | MAT.2.2.6 — eşitlik "iki taraf aynı değerde" | Ders-2 s.44, 45, 47 |

Karışık bölümler ("Karışık Yol", "Şölen Sofrası") her zaman **en sonda**
durur ve kendinden önceki bütün bölümlerden soru getirir; yeni bir bölüm
eklerken onların önüne koy.

Kontrol Et'in karışıkta iki hâli var. Kendi standında 5 çiftlik bir tahta
verir ve her eşleşme bir yıldızdır. Karışıkta her sorunun bir yıldız olması
gerektiği için orada tek çarpma + üç bölme şıkkı olarak gelir (`check1`).

**Kontrol Et** solda çarpma, sağda bölü çizgili bölme kartları verir; çocuk
çarpmayı yapıp sonucu bölmenin üstünde arar. Bir tahtadaki çarpımlar
birbirinden farklı seçilir — aynı çarpım iki kez olursa (12÷3 ve 12÷4) bir
çarpmayı iki bölme birden doğrular ve eşleştirmenin tek doğru cevabı kalmaz.

**Denge Terazisi**'nin dört soru tipi var, basitten karmaşığa:
`12÷3 ⚖ ?`, `? ⚖ 12÷3`, `12÷3 ⚖ 2+?`, `? ÷ 2 ⚖ 8÷4`. Dördünde de terazinin
dengelendiği ortak değer bölümdür; kefeye konan taş ise son ikisinde bundan
farklıdır (`12÷3 ⚖ 2+?` için denge 4, taş 2). Kodda ilki `Q.deger`, ikincisi
`Q.ans`.

Bilinmeyenin bölen olması da 2. sınıf kapsamında (Çalışma-2 s.42 üç konumu da
boş bırakıyor); terazide bölünen tercih edildi, `? ÷ 2` okuması daha kolay.

## Nasıl oynanır kartı

`shared/nasil.js`. Çocuklar bölüme girip ne yapacaklarını anlamıyordu:
görev satırı matematiği anlatıyor ("2 grup, her grupta 4 balon") ama
oynanışı anlatmıyordu — hangi düğmeye basılacağı hiçbir yerde yazmıyordu.

Kart **oyun başına değil bölüm başına**: bir oyunun bölümleri çok farklı
oynanıyor (sayı doğrusu, eşleştirme tahtası, terazi), tek açıklama
hepsini kapsamaz. İlk girişte bir kez çıkar, "Başla" ile kapanır ve bir
daha çıkmaz; başlıktaki `?` ile her zaman geri açılır. Görüldü bilgisi
`Settings`'te `nasilGorulen` altında, `oyunId:bolumAnahtari` biçiminde.

Kaplama olarak `.board`'ın üstüne biniyor: düzeni aşağı itmez ve
altındaki oyuna dokunulmasını engeller. "Standlara dön" ve zorluk çubuğu
kartın dışında kalır, çocuk sıkışıp kalmaz.

Adım metinlerinin kuralları:

1. En çok 3 adım, her adım tek cümle, 5-8 kelime
2. Emir kipi: Bas, Dokun, Say, Sürükle
3. **Ekrandaki kelimenin aynısı** — düğmede "Vardım!" yazıyorsa metinde de
   "Vardım!", eşanlamlısı değil
4. Köşeli parantez düğme olarak çizilir: `'[Vardım!] tuşuna bas.'`
   Okuması zayıf çocuk yazıyı sökemese de şekli ekranda eşleştirir
5. Son adım hep cevabı verme adımı olsun

Düğme yazısı değişkense (Kaçar Kaçar'da "◀ 2 geri", "◀ 5 geri") sabit ad
yazma, değişmeyen kısmı göster: `'[◀] tuşuna bas'`.

Şimdilik Balon Standı ve Geri Zıp Zıp'ta var.

## Bölüm sırasını değiştirmek

`LEVELS`'taki her bölümün bir `key`'i var ve ilerleme kaydı dizi indisine
değil bu ada bağlı. Sırayı istediğin gibi değiştirebilirsin, yıldızlar
yerinde kalır. **`key`'i asla değiştirme** — değiştirirsen o bölümün
yıldızları sıfırlanır.

`unlocked` hâlâ konuma bağlı bir sayı. Göç kodu (`kayitGocu`) eski
düzende açık olan son bölümün yeni konumunu bulup gerekiyorsa
`unlocked`'ı büyütür, asla küçültmez: çocuktan açtığı bölüm geri alınmaz.

`ESKI_SIRA` daha önce yayınlanmış **dizi** düzenlerini tutar; yalnızca
anahtarlı kayda geçmeden önceki sürümlerden gelen kayıtları okumak için
gerekli. Yeni sıralamalar için oraya bir şey eklemene gerek yok.

## Bölü çizgisi

Ders Kitabı 2 bölmeyi dokuz sayfada dik düzende yazıyor (s.25-28, 33, 37-39
ve tema değerlendirmesinde s.51). Oyunlar uzun süre yalnızca `12 ÷ 3 = 4`
satırını gösterdi; çocuk kitabı açtığında bu düzenle ilk kez karşılaşmasın
diye `shared/bolme.js` aynısını çiziyor:

```
bölünen →  12 │ 3  ← bölen
         − 12 │ 4  ← bölüm
           ────
  kalan →  00
```

Geri Zıp Zıp ve Şölen'de bölüm sonunda çıkar. Bölüm sonu ekranı olan
standlarda `#winBol` içine, sonsuz standlarda tahtanın üstüne kaplama kart
olarak — kaplama, düzeni aşağı itmediği için oyun alanı kaymaz.

2. sınıfta bölme hep kalansız, yani kalan her zaman 0. Kitap yine de
çocuktan yazmasını istiyor, biz de yazıyoruz; kalan bölünenin basamak
sayısı kadar sıfırla gösteriliyor (12 için `00`, 8 için `0`) — kitap da böyle.

## Notlar

- İlerleme her cihazda ayrı tutulur (localStorage). Tablet paylaşılıyorsa
  çocuklar aynı kaydı görür.
- Sesli okuma cihazda Türkçe ses yüklüyse çalışır; yoksa "Dinle" düğmesi
  kendini gizler.
- Tarayıcıda "İlerlemeyi sıfırla" düğmesi çatı sayfanın üstündedir.
