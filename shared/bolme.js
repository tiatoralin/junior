/* ============================================================
   Bolme — bölme işleminin dik ("bölü çizgili") gösterimi.

   MEB 2. sınıf Matematik Ders Kitabı 2 bu düzeni dokuz sayfada
   kullanıyor (s.25-28, 33, 37-39 ve tema değerlendirmede s.51).
   Oyunlarımız yalnızca "12 ÷ 3 = 4" satırını gösteriyordu;
   çocuk kitabı açtığında bu düzenle ilk kez karşılaşmasın diye
   aynısını burada da gösteriyoruz.

     bölünen →  12 │ 3  ← bölen
              − 12 │ 4  ← bölüm
                ────
       kalan →  00

   Dikey çizgi bölüneni bölenden ayırır, bölenin altındaki çizgi
   bölümü ondan ayırır, "− 12" altındaki çizgi çıkarma çizgisidir.
   2. sınıfta bölme hep kalansız, yani kalan her zaman 0 —
   ama kitap çocuktan onu yazmasını istiyor, biz de yazıyoruz.
   Kalan, bölünenin basamak sayısı kadar sıfırla gösterilir:
   12 için "00", 8 için "0". Kitap da böyle yazıyor.

     Bolme.dik(12, 3)                 etiketsiz, dar
     Bolme.dik(12, 3, {etiket:true})  ok ve adlarla
     Bolme.dik(12, 3, {soru:true})    bölüm yerine "?", çıkarma ve
                                      kalan satırı yok — çocuk daha
                                      çözmedi, kitapta da o satırlar
                                      boş bırakılıyor
   ============================================================ */
(function(global){
  'use strict';

  function dik(bolunen, bolen, opts){
    opts = opts || {};
    var bolum = bolunen / bolen;
    /* Kalansız olmayan bir çift gelirse sessizce boş dön: yanlış
       bir tablo çizmektense hiç çizmemek yeğdir. */
    if(!bolen || bolunen % bolen !== 0) return '';

    var kalan = String(bolunen).replace(/[0-9]/g, '0');
    /* Soru hâlinde cevabı sesli okuyucuya da vermiyoruz — yoksa ekranda
       "?" görünürken ekran okuyucu sonucu söyleyip soruyu bozar. */
    var oku = opts.soru
      ? bolunen + ' bölü ' + bolen + ' kaç eder'
      : bolunen + ' bölü ' + bolen + ' eşittir ' + bolum + ', kalan 0';

    var h = '<div class="dikbol' + (opts.etiket ? ' etiketli' : '')
          + (opts.soru ? ' soru' : '')
          + '" role="img" aria-label="' + oku + '">';
    if(opts.etiket) h += '<b class="db-l1">bölünen &rarr;</b>';
    h += '<span class="db-bolunen">' + bolunen + '</span>'
      +  '<span class="db-bolen">'   + bolen   + '</span>';
    if(opts.etiket) h += '<b class="db-l2">&larr; bölen</b>';
    if(opts.soru){
      /* Çubuğun bölüm satırı boyunca da inmesi için boş hücre. */
      h += '<span class="db-bosluk"></span>'
        +  '<span class="db-bolum">?</span>';
    }else{
      h += '<span class="db-cikan">&minus;&thinsp;' + bolunen + '</span>'
        +  '<span class="db-bolum">' + bolum + '</span>';
    }
    if(opts.etiket) h += '<b class="db-l3">&larr; bölüm</b>';
    if(!opts.soru){
      if(opts.etiket) h += '<b class="db-l4">kalan &rarr;</b>';
      h += '<span class="db-kalan">' + kalan + '</span>';
    }
    return h + '</div>';
  }

  /* Sonsuz bölümlerin kazanma ekranı yok — bölüm sonu oyun tahtasında
     kutlanıp devam ediliyor. Orada da gösterebilmek için tahtanın
     üstüne kaplama kart koyuyoruz: hiçbir şeyi aşağı itmez, bu yüzden
     düzen kaymaz. .board zaten position:relative.

     Bolme.goster(tahta, 12, 3, 2000) */
  function goster(board, bolunen, bolen, ms){
    if(!board) return;
    var ic = dik(bolunen, bolen, {etiket:true});
    if(!ic) return;

    /* Arka arkaya bölüm bitirilirse kart üst üste binmesin. */
    var eski = board.querySelectorAll('.bolkart');
    for(var i=0;i<eski.length;i++){
      if(eski[i].parentNode) eski[i].parentNode.removeChild(eski[i]);
    }

    var k = document.createElement('div');
    k.className = 'bolkart';
    k.innerHTML = '<p class="bolkart-t">Bunu kitaptaki gibi de yazabiliriz:</p>' + ic;
    board.appendChild(k);
    setTimeout(function(){
      if(k.parentNode) k.parentNode.removeChild(k);
    }, ms || 2000);
  }

  /* Kitabın iki okunuşu (Ders Kitabı 2, s.25). Sesli okuma için. */
  function okunus(bolunen, bolen){
    return bolunen + ' bölü ' + bolen + ' eşittir ' + (bolunen / bolen);
  }

  global.Bolme = { dik: dik, goster: goster, okunus: okunus };
})(window);
