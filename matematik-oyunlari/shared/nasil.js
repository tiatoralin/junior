/* ============================================================
   Nasil — "Nasıl oynanır?" kartı.

   Çocuklar bazen bölüme girip ne yapacaklarını anlamıyor. Ekrandaki
   görev satırı matematiği anlatıyor ("2 grup, her grupta 4 balon")
   ama oynanışı anlatmıyor: hangi düğmeye basılacak, nereye
   dokunulacak.

   Kart OYUN başına değil BÖLÜM başına: bir oyunun bölümleri
   birbirinden çok farklı oynanıyor (sayı doğrusu, eşleştirme
   tahtası, terazi). Tek bir açıklama hepsini kapsamaz.

   İlk girişte bir kez çıkar, "Başla"ya basınca kapanır ve bir daha
   çıkmaz. Başlıktaki "?" düğmesiyle her zaman geri açılır.

   Yazım kuralları (adım metinleri için):
     - en çok 3 adım, her adım tek cümle, 5-8 kelime
     - emir kipi: Bas, Dokun, Say, Sürükle
     - ekrandaki kelimenin AYNISI: düğmede "Vardım!" yazıyorsa
       metinde de "Vardım!", eşanlamlısı değil
     - köşeli parantez içi düğme olarak çizilir: "[Vardım!] tuşuna bas"
     - son adım hep cevabı verme adımı olsun

   Kullanım:
     Nasil.tanit('balon-standi', 'count', ADIMLAR, {board:el})  ilk kez ise göster
     Nasil.ac('balon-standi', 'count', ADIMLAR, {board:el})     her hâlükârda göster
     Nasil.gorulduMu('balon-standi', 'count')
   ============================================================ */
(function(global){
  'use strict';

  var AYAR = 'nasilGorulen';

  function gorulenler(){
    var g = (global.Settings && Settings.get(AYAR, null));
    return (g && typeof g === 'object') ? g : {};
  }
  function gorulduMu(gameId, key){
    return gorulenler()[gameId + ':' + key] === true;
  }
  function isaretle(gameId, key){
    if(!global.Settings) return;
    var g = gorulenler();
    g[gameId + ':' + key] = true;
    Settings.set(AYAR, g);
  }

  function kacis(t){
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  /* "[Vardım!] tuşuna bas" -> düğme rozetli HTML.
     Köşeli parantez, gerçek düğmenin kopyasını çizmek için: okuması
     zayıf olan çocuk yazıyı sökemese de şekli ekranda eşleştirir. */
  function adimHtml(t){
    var out = '', i = 0, s = String(t);
    while(i < s.length){
      var a = s.indexOf('[', i);
      if(a < 0){ out += kacis(s.slice(i)); break; }
      var b = s.indexOf(']', a);
      if(b < 0){ out += kacis(s.slice(i)); break; }
      out += kacis(s.slice(i, a))
          +  '<span class="ntus">' + kacis(s.slice(a+1, b)) + '</span>';
      i = b + 1;
    }
    return out;
  }
  /* Sesli okuma için düz metin: köşeli parantezler okunmasın. */
  function duzMetin(adimlar){
    return adimlar.map(function(t){
      return String(t).replace(/[\[\]]/g, '');
    }).join(' ');
  }

  function kapat(kart){
    if(kart && kart.parentNode) kart.parentNode.removeChild(kart);
    if(global.Speech && Speech.cancel) Speech.cancel();
  }

  function ac(gameId, key, adimlar, opts){
    opts = opts || {};
    var board = opts.board || document.querySelector('.board');
    if(!board || !adimlar || !adimlar.length) return;

    /* Arka arkaya açılırsa üst üste binmesin. */
    var eski = board.querySelectorAll('.nasilkart');
    for(var e=0;e<eski.length;e++){
      if(eski[e].parentNode) eski[e].parentNode.removeChild(eski[e]);
    }

    var kart = document.createElement('div');
    kart.className = 'nasilkart';
    kart.setAttribute('role','dialog');
    kart.setAttribute('aria-label', opts.baslik || 'Nasıl oynanır');

    var h = '<div class="nk-ic">'
          + '<p class="nk-bas">' + kacis(opts.baslik || 'Nasıl oynanır?') + '</p>'
          + '<ol class="nk-adimlar">';
    adimlar.forEach(function(t){ h += '<li>' + adimHtml(t) + '</li>'; });
    h += '</ol><div class="nk-alt">'
      +  '<button type="button" class="nk-basla">Başla</button>';
    /* "Dinle" yalnızca cihazda Türkçe ses varsa: yoksa çalışmayan bir
       düğme koymaktansa hiç koymamak yeğ. */
    var sesVar = !!(global.Speech && Speech.supported);
    if(sesVar) h += '<button type="button" class="nk-dinle">Dinle</button>';
    h += '</div></div>';
    kart.innerHTML = h;
    board.appendChild(kart);

    kart.querySelector('.nk-basla').onclick = function(){
      if(global.Sfx && Sfx.click) Sfx.click();
      isaretle(gameId, key);
      kapat(kart);
      if(opts.bitince) opts.bitince();
    };
    if(sesVar){
      kart.querySelector('.nk-dinle').onclick = function(){
        Speech.speak(duzMetin(adimlar));
      };
    }
    /* Odağı karta al: klavye/ekran okuyucu kullanan çocuk arkadaki
       oyuna değil önce buraya düşsün. */
    try{ kart.querySelector('.nk-basla').focus(); }catch(err){}
    return kart;
  }

  function tanit(gameId, key, adimlar, opts){
    if(gorulduMu(gameId, key)) return null;
    return ac(gameId, key, adimlar, opts);
  }

  /* Başlıktaki "?" düğmesi. Her oyun kendi başlığına ekler. */
  function soruDugmesi(tiklayinca){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'nasilbtn';
    b.textContent = '?';
    b.setAttribute('aria-label','Nasıl oynanır?');
    b.onclick = tiklayinca;
    return b;
  }

  global.Nasil = {
    tanit: tanit,
    ac: ac,
    gorulduMu: gorulduMu,
    soruDugmesi: soruDugmesi
  };
})(window);
