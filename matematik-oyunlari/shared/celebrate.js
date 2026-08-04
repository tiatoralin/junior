/* ============================================================
   Celebrate — kutlama efektleri. Her iki oyun da kullanır.

     Celebrate.flyStar(nereden, nereye, bittiginde)  yıldız uçur
     Celebrate.bump(el)                              zıplat
     Celebrate.pulse(el, ms)                         parlat

   İki kural:
   - Web Animations API eski tarayıcılarda yok. Yoksa efekt atlanır,
     geri çağrı yine de çalışır — oyun akışı asla durmaz.
   - prefers-reduced-motion açıksa hiç animasyon yapılmaz.
   ============================================================ */
(function(global){
  'use strict';

  var reduced = false;
  try{
    reduced = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }catch(e){}

  function canAnimate(el){ return !reduced && el && typeof el.animate === 'function'; }

  function center(el){
    var r = el.getBoundingClientRect();
    return {x:r.left + r.width/2, y:r.top + r.height/2};
  }

  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
           + '<path d="M12 2l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.8 6.1 20.6l1.3-6.6L2.5 8.9l6.6-.8z"/></svg>';

  /* Doğru cevaptan sayaca uçan yıldız.
     "done" yıldız varınca çağrılır — sayının orada artması için. */
  function flyStar(fromEl, toEl, done){
    done = done || function(){};
    if(!fromEl || !toEl || reduced){ done(); return; }

    var a = center(fromEl), b = center(toEl);
    var host = document.createElement('div');
    host.className = 'flystar';
    host.style.left = a.x + 'px';
    host.style.top  = a.y + 'px';
    var inner = document.createElement('i');
    inner.innerHTML = STAR;
    host.appendChild(inner);
    document.body.appendChild(host);

    var finished = false;
    function end(){
      if(finished) return;
      finished = true;
      if(host.parentNode) host.parentNode.removeChild(host);
      done();
    }

    if(!canAnimate(inner)){ end(); return; }

    var dx = b.x - a.x, dy = b.y - a.y;
    /* Yavaş ve iri: çocuk yıldızın nereye gittiğini gözüyle takip edebilmeli.
       Önce yerinde büyüyüp bekler, sonra yay çizerek sayaca gider. */
    var anim = inner.animate([
      {transform:'translate(0px,0px) scale(.3) rotate(0deg)',    opacity:0,  offset:0},
      {transform:'translate(0px,-18px) scale(1.55) rotate(60deg)', opacity:1,  offset:0.28},
      {transform:'translate(0px,-24px) scale(1.4) rotate(110deg)', opacity:1, offset:0.42},
      {transform:'translate(' + (dx*0.55) + 'px,' + (dy*0.4 - 54) + 'px) scale(1.05) rotate(260deg)',
       opacity:1, offset:0.72},
      {transform:'translate(' + dx + 'px,' + dy + 'px) scale(.5) rotate(430deg)', opacity:.9, offset:1}
    ], {duration:1050, easing:'cubic-bezier(.4,.05,.3,1)'});

    anim.onfinish = end;
    /* onfinish bazı tarayıcılarda sekme arka plandayken gelmez */
    setTimeout(end, 1500);
  }

  /* ============================================================
     Final konfetisi — bölüm bitince ekranın altından fışkırır.
     Sabit konumlu kaplama kullanır ki kart kenarlarında kırpılmasın.
     ============================================================ */
  var CONF_COLORS = ['#E24B7A','#378ADD','#5DA828','#EF9F27','#8B5CD6','#EF7D2A','#3E97C9','#F2C94C'];

  /* CSS değişkeni desteği yoksa (çok eski tarayıcı) konfeti hiç kurulmasın —
     yoksa hareketsiz kareler ekranda asılı kalır.
     CSS.supports'a bakmak yerine tam olarak kullandığımız şeyi deniyoruz:
     inline stile özel değişken yazıp geri okuyabiliyor muyuz? */
  var cssVars = false;
  try{
    var probe = document.createElement('div');
    probe.style.setProperty('--mm-probe','1px');
    cssVars = (probe.style.getPropertyValue('--mm-probe') === '1px');
  }catch(e){ cssVars = false; }

  function finale(opts){
    opts = opts || {};
    if(reduced || !cssVars) return;
    var count = opts.count || 90;

    /* Arka arkaya kutlama olursa (ör. üst üste köprü kurmak) katmanlar
       üst üste yığılıyordu — her biri 3,6 sn DOM'da kalıyor. Yenisini
       kurmadan önce eskisini kaldır: tek katman, temiz görüntü. */
    var eski = document.querySelectorAll('.conffx');
    for(var e=0;e<eski.length;e++){
      if(eski[e].parentNode) eski[e].parentNode.removeChild(eski[e]);
    }

    var layer = document.createElement('div');
    layer.className = 'conffx';
    layer.setAttribute('aria-hidden','true');
    document.body.appendChild(layer);

    var W = layer.clientWidth || global.innerWidth || 360;
    var H = layer.clientHeight || global.innerHeight || 640;

    for(var i=0;i<count;i++){
      var p = document.createElement('span');
      var round = (i % 4 === 0);
      var w = 7 + Math.random()*7;
      p.style.background = CONF_COLORS[i % CONF_COLORS.length];
      p.style.width  = w + 'px';
      p.style.height = (round ? w : w*1.7) + 'px';
      if(round) p.style.borderRadius = '50%';

      /* İki popper sol-alt ve sağ-alt köşeden yukarı fışkırır;
         kalan parçalar tepeden yağar, böylece etki uzun sürer. */
      var wave = i % 3;
      var ox, oy, dx, dy, dur, delay;
      if(wave < 2){
        var left = (wave === 0);
        ox = left ? W*0.06 : W*0.94;
        oy = H*0.92;
        dx = (left ? 1 : -1) * (W*0.18 + Math.random()*W*0.62);
        dy = -(H*0.42 + Math.random()*H*0.40);
        dur = 1600 + Math.random()*900;
        delay = Math.random()*220;
      }else{
        ox = Math.random()*W;
        oy = -24;
        dx = (Math.random()-0.5) * W*0.35;
        dy = H*0.5;
        dur = 2000 + Math.random()*1000;
        delay = 250 + Math.random()*900;
      }
      var spin = (Math.random()*900 - 450) + 360;

      p.style.left = ox + 'px';
      p.style.top  = oy + 'px';
      p.style.setProperty('--mx', (dx*0.65) + 'px');
      p.style.setProperty('--my', (dy*0.85) + 'px');
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', (dy + H*0.6) + 'px');
      p.style.setProperty('--spinmid', (spin*0.6) + 'deg');
      p.style.setProperty('--spin', spin + 'deg');
      p.style.setProperty('--dur', dur + 'ms');
      p.style.setProperty('--delay', delay + 'ms');
      layer.appendChild(p);
    }

    setTimeout(function(){
      if(layer.parentNode) layer.parentNode.removeChild(layer);
    }, 3600);
  }

  /* Zıplama — sayaç, ödül, rozet için */
  function bump(el, scale){
    if(!canAnimate(el)) return;
    var s = scale || 1.55;
    el.animate([
      {transform:'scale(1)'},
      {transform:'scale(' + s + ')'},
      {transform:'scale(.94)'},
      {transform:'scale(1)'}
    ], {duration:620, easing:'cubic-bezier(.3,1.7,.5,1)'});
  }

  /* Belirli süre parlat (yeni kazanılan ödülü rafta göstermek için) */
  function pulse(el, ms){
    if(!el) return;
    el.classList.add('justwon');
    setTimeout(function(){ el.classList.remove('justwon'); }, ms || 2600);
  }

  global.Celebrate = {
    flyStar: flyStar,
    bump: bump,
    pulse: pulse,
    finale: finale,
    reduced: reduced,
    starMarkup: STAR
  };
})(window);
