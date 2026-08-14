/* ============================================================
   Progress + Settings — localStorage sarmalayıcı.
   audio.js'ten ÖNCE yüklenmeli (audio.js Settings'i kullanır).

   Kullanım (oyun içinde):
     var S = Progress.load('balon-standi', varsayilanDurum);
     ...
     Progress.save('balon-standi', S);

   Çatı sayfa:
     Progress.summary('balon-standi')  ->  {stars, unlocked, played}
   ============================================================ */
(function(global){
  'use strict';

  var PKEY = 'mm.progress.v1';
  var SKEY = 'mm.settings.v1';
  var MKEY = 'mm.facts.v1';      /* zorlanılan çarpımlar */

  /* localStorage gizli sekmede / kısıtlı tarayıcıda patlayabilir —
     o durumda bellekte tutup sessizce devam et. */
  var memory = {};
  var usable = (function(){
    try{
      localStorage.setItem('mm.test','1');
      localStorage.removeItem('mm.test');
      return true;
    }catch(e){ return false; }
  })();

  function readAll(key){
    if(!usable) return memory[key] || {};
    try{ return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch(e){ return {}; }
  }
  function writeAll(key, obj){
    if(!usable){ memory[key] = obj; return; }
    try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){}
  }

  var Progress = {
    /* Kayıtlı durumu varsayılanla birleştirip döndürür.
       Oyunun durum şekli değişirse eksik alanlar varsayılandan gelir. */
    load: function(gameId, defaults){
      var all = readAll(PKEY);
      var saved = all[gameId];
      var out = {};
      for(var k in defaults){ if(Object.prototype.hasOwnProperty.call(defaults,k)) out[k] = defaults[k]; }
      if(saved && typeof saved === 'object'){
        for(var j in saved){ if(Object.prototype.hasOwnProperty.call(saved,j)) out[j] = saved[j]; }
      }
      return out;
    },

    save: function(gameId, state){
      var all = readAll(PKEY);
      all[gameId] = state;
      writeAll(PKEY, all);
    },

    /* Çatı sayfanın kartlarda gösterdiği özet */
    summary: function(gameId){
      var all = readAll(PKEY);
      var s = all[gameId];
      if(!s) return {stars:0, unlocked:1, played:false};
      return {
        stars: s.stars || 0,
        unlocked: s.unlocked || 1,
        prizes: (s.prizes || []).length,
        played: true
      };
    },

    reset: function(gameId){
      if(gameId){
        var all = readAll(PKEY);
        delete all[gameId];
        writeAll(PKEY, all);
      }else{
        writeAll(PKEY, {});
        writeAll(MKEY, {});
      }
    },

    totalStars: function(){
      var all = readAll(PKEY), t = 0;
      for(var k in all){ if(all[k] && all[k].stars) t += all[k].stars; }
      return t;
    },

    /* ----- zorlanılan çarpımlar -----
       Öğretmene dönük kayıt: çocuk hangi çarpımda ilk denemede bilemedi?
       3x4 ile 4x3 aynı çarpım sayılır (değişme özelliği), küçük olan öne yazılır. */
    factKey: function(a, b){
      a = Math.abs(a|0); b = Math.abs(b|0);
      return (a <= b ? a + 'x' + b : b + 'x' + a);
    },

    /* ilk denemede bilinemedi */
    logMiss: function(a, b){
      var m = readAll(MKEY), k = Progress.factKey(a, b);
      if(!m[k]) m[k] = {miss:0, ok:0};
      m[k].miss++;
      writeAll(MKEY, m);
    },

    /* ilk denemede bilindi */
    logHit: function(a, b){
      var m = readAll(MKEY), k = Progress.factKey(a, b);
      if(!m[k]) m[k] = {miss:0, ok:0};
      m[k].ok++;
      writeAll(MKEY, m);
    },

    /* En az bir kez ilk denemede bilinemeyen çarpımlar; çok kaçırılandan aza doğru.
       Tek kaçırma da listeye girer — öğretmenin elindeki tek kanıt o olabilir.
       Chip'teki "kaçırma/karşılaşma" sayısı güveni değerlendirmesine yeter. */
    hardFacts: function(limit){
      var m = readAll(MKEY), out = [];
      for(var k in m){
        var r = m[k], seen = r.miss + r.ok;
        if(r.miss > 0){
          out.push({fact:k, miss:r.miss, seen:seen, rate:r.miss / seen});
        }
      }
      out.sort(function(x, y){
        if(y.miss !== x.miss) return y.miss - x.miss;
        return y.rate - x.rate;
      });
      return limit ? out.slice(0, limit) : out;
    },

    clearMisses: function(){ writeAll(MKEY, {}); }
  };

  var Settings = {
    get: function(key, fallback){
      var s = readAll(SKEY);
      return Object.prototype.hasOwnProperty.call(s, key) ? s[key] : fallback;
    },
    set: function(key, val){
      var s = readAll(SKEY);
      s[key] = val;
      writeAll(SKEY, s);
    }
  };

  global.Progress = Progress;
  global.Settings = Settings;
})(window);
