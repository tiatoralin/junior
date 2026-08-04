/* ============================================================
   Sfx — çıplak WebAudio ses motoru. Tone.js'in yerine geçer.
   Dış dosya yok, CDN yok, çevrimdışı çalışır.

   Kullanım:
     Sfx.good()  Sfx.bad()  Sfx.pop()  Sfx.win()  Sfx.click()  Sfx.star()
     Sfx.toggleMute()  Sfx.isMuted()

   iOS/Android: AudioContext ilk kullanıcı dokunuşuna kadar kilitli.
   Aşağıdaki unlock() bunu ilk pointerdown/keydown'da kendi kendine açar.
   ============================================================ */
(function(global){
  'use strict';

  var ctx = null;
  var muted = false;

  /* --- ayar kalıcılığı (storage.js varsa onu kullan) --- */
  function loadMuted(){
    try{
      if(global.Settings) return !!global.Settings.get('muted', false);
      return localStorage.getItem('mm.muted') === '1';
    }catch(e){ return false; }
  }
  function saveMuted(v){
    try{
      if(global.Settings) global.Settings.set('muted', v);
      else localStorage.setItem('mm.muted', v ? '1' : '0');
    }catch(e){}
  }

  function ac(){
    if(ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if(!AC) return null;
    try{ ctx = new AC(); }catch(e){ ctx = null; }
    return ctx;
  }

  /* Mobil tarayıcılar AudioContext'i "suspended" başlatır; ilk dokunuşta aç. */
  function unlock(){
    var c = ac();
    if(c && c.state === 'suspended'){ c.resume().catch(function(){}); }
  }
  ['pointerdown','touchstart','keydown'].forEach(function(ev){
    global.addEventListener(ev, unlock, {passive:true});
  });

  /* --- tek nota --- */
  function note(freq, start, dur, type, vol){
    var c = ac();
    if(!c || muted) return;
    var t0 = c.currentTime + (start || 0);
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    var peak = (vol == null ? 0.22 : vol);
    /* kısa attack + üstel decay: "tık" sesi (click artifact) olmaz */
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  /* --- frekans süpürmesi (balon patlaması, "yanlış" sesi) --- */
  function sweep(f1, f2, dur, type, vol){
    var c = ac();
    if(!c || muted) return;
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.25 : vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  /* --- kısa gürültü patlaması (pop'un "hışş" kısmı) --- */
  function noise(dur, vol){
    var c = ac();
    if(!c || muted) return;
    var n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<n;i++){ d[i] = (Math.random()*2 - 1) * (1 - i/n); }
    var src = c.createBufferSource(); src.buffer = buf;
    var g = c.createGain(); g.gain.value = vol == null ? 0.18 : vol;
    var hp = c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=800;
    src.connect(hp); hp.connect(g); g.connect(c.destination);
    src.start();
  }

  /* --- nota adı ("C4", "F#5") -> frekans --- */
  var STEP = {C:0, D:2, E:4, F:5, G:7, A:9, B:11};
  function freqOf(name){
    if(typeof name === 'number') return name;
    var m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(String(name).trim());
    if(!m) return 440;
    var semi = STEP[m[1].toUpperCase()] + (m[2]==='#' ? 1 : m[2]==='b' ? -1 : 0);
    var oct  = parseInt(m[3], 10);
    /* A4 = 440 Hz; MIDI numarası üzerinden hesapla */
    var midi = (oct + 1) * 12 + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  var Sfx = {
    /* tek nota — nota adı veya Hz ile ("C4", 523.25) */
    tone: function(name, dur, type, vol){ note(freqOf(name), 0, dur || 0.16, type || 'triangle', vol); },

    /* doğru cevap — yükselen üçlü */
    good: function(){ note(523.25,0,.12); note(659.25,.09,.12); note(783.99,.18,.20); },
    /* yanlış cevap — yumuşak iniş, cezalandırıcı değil */
    bad:  function(){ sweep(320, 160, .28, 'sine', .18); },
    /* balon patlama */
    pop:  function(){ noise(.09,.16); sweep(900, 220, .12, 'triangle', .20); },
    /* yıldız kazanma */
    star: function(){ note(1046.5,0,.10,'sine',.18); note(1318.5,.07,.14,'sine',.18); },
    /* bölüm/oyun bitişi — küçük fanfar */
    win:  function(){
      var m=[523.25,659.25,783.99,1046.5];
      m.forEach(function(f,i){ note(f, i*0.11, .28, 'triangle', .22); });
      note(1318.5, .48, .45, 'sine', .16);
    },
    /* buton tıklaması */
    click:function(){ note(440,0,.05,'square',.10); },
    /* zıplama (Zıp Zıp Karnavalı) */
    hop:  function(){ sweep(300, 620, .13, 'triangle', .16); },

    isMuted: function(){ return muted; },
    setMuted: function(v){ muted = !!v; saveMuted(muted); if(muted) Speech.cancel(); return muted; },
    toggleMute: function(){ return Sfx.setMuted(!muted); },
    unlock: unlock
  };

  /* ============================================================
     Speech — Türkçe sesli okuma (Web Speech API)
     ============================================================ */
  var Speech = {
    supported: ('speechSynthesis' in global),
    voice: null,

    pickVoice: function(){
      if(!Speech.supported) return null;
      try{
        var vs = global.speechSynthesis.getVoices() || [];
        for(var i=0;i<vs.length;i++){ if(/^tr/i.test(vs[i].lang)){ Speech.voice = vs[i]; return Speech.voice; } }
      }catch(e){}
      return null;
    },

    speak: function(text){
      if(!Speech.supported || muted || !text) return;
      try{
        global.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'tr-TR'; u.rate = 0.9; u.pitch = 1.05;
        if(!Speech.voice) Speech.pickVoice();
        if(Speech.voice) u.voice = Speech.voice;
        global.speechSynthesis.speak(u);
      }catch(e){}
    },

    cancel: function(){
      if(!Speech.supported) return;
      try{ global.speechSynthesis.cancel(); }catch(e){}
    }
  };

  /* sesler asenkron yüklenir — hazır olunca Türkçe sesi seç */
  if(Speech.supported){
    Speech.pickVoice();
    try{ global.speechSynthesis.onvoiceschanged = Speech.pickVoice; }catch(e){}
  }
  /* sayfadan ayrılırken konuşmayı kes (Safari aksi halde okumaya devam eder) */
  global.addEventListener('pagehide', function(){ Speech.cancel(); });

  muted = loadMuted();
  global.Sfx = Sfx;
  global.Speech = Speech;
})(window);
