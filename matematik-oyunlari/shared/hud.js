/* ============================================================
   HUD — her oyun sayfasının en üstüne "Menü" ve "Ses" düğmelerini koyar.
   Oyun HTML'inde tek satır:  <div id="hud"></div>
   theme.css + audio.js + storage.js yüklendikten sonra çalıştırılmalı.
   ============================================================ */
(function(global){
  'use strict';

  function icon(paths){
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           paths + '</svg>';
  }
  var HOME    = icon('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>');
  var SOUND_ON  = icon('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 6a9 9 0 0 1 0 12"/>');
  var SOUND_OFF = icon('<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none"/><path d="M17 9.5l4 5"/><path d="M21 9.5l-4 5"/>');

  function build(opts){
    opts = opts || {};
    var host = document.getElementById('hud');
    if(!host) return;

    host.className = 'hud';
    host.innerHTML =
      '<a href="' + (opts.home || '../index.html') + '" id="hudHome">' + HOME + ' Menü</a>' +
      '<span class="spacer"></span>' +
      '<button type="button" id="hudSound" aria-pressed="false"></button>';

    var btn = document.getElementById('hudSound');

    function paint(){
      var m = global.Sfx ? global.Sfx.isMuted() : false;
      btn.innerHTML = (m ? SOUND_OFF : SOUND_ON) + (m ? ' Ses kapalı' : ' Ses açık');
      btn.className = m ? 'off' : 'on';
      btn.setAttribute('aria-pressed', m ? 'true' : 'false');
      btn.setAttribute('aria-label', m ? 'Sesi aç' : 'Sesi kapat');
    }

    btn.addEventListener('click', function(){
      if(!global.Sfx) return;
      var nowMuted = global.Sfx.toggleMute();
      paint();
      if(!nowMuted) global.Sfx.click();   /* açıldığını duyur */
    });

    /* Menüye dönerken konuşmayı kes — Safari sayfadan sonra da okumaya devam eder */
    document.getElementById('hudHome').addEventListener('click', function(){
      if(global.Speech) global.Speech.cancel();
    });

    paint();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ build(global.HUD_OPTIONS); });
  }else{
    build(global.HUD_OPTIONS);
  }

  global.HUD = {refresh: build};
})(window);
