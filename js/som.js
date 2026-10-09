// Som 100% sintetizado: efeitos, voz de bipes e trilha por cômodo.
(function (CH) {
  const U = CH.U;
  let ac = null;
  let mestre, gMus, gSfx, ruidoBuf;
  const cfg = { som: true, musica: true };

  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NOTAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nm(s) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(s);
    if (!m) return 0;
    return 12 * (parseInt(m[3], 10) + 1) + NOTAS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }

  // 0,25 s de silêncio em WAV. Tocar isso num <audio> faz o iPhone tratar a página
  // como "tocando mídia", e aí o som sai mesmo com a chave lateral no silencioso.
  const SILENCIO = 'data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
  let somHtml = null;

  function criar() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ac = new Ctx();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    mestre = ac.createGain(); mestre.gain.value = 0.9;
    gMus = ac.createGain(); gMus.gain.value = cfg.musica ? 0.55 : 0;
    gSfx = ac.createGain(); gSfx.gain.value = cfg.som ? 0.8 : 0;
    gMus.connect(mestre); gSfx.connect(mestre); mestre.connect(comp); comp.connect(ac.destination);
    ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    const r = U.mulberry32(42);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    if (musicaAtual) tocar(musicaAtual, true);
  }

  function iniciar() {
    if (!ac) criar();
    if (!ac) return;
    if (ac.state !== 'running') ac.resume().catch(() => {});
  }

  function pronto() {
    if (!ac || ac.state !== 'running') return false;
    return !!navigator.audioSession || (somHtml && !somHtml.paused);
  }

  // Roda a cada toque até o áudio estar liberado de verdade. O iPhone só libera som
  // dentro de um gesto (tocar e soltar), e volta a travar depois que o app vai pro fundo.
  function desbloquear() {
    if (document.hidden || pronto()) return;
    try {
      if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback';
    } catch (e) { /* navegador sem sessão de áudio */ }
    iniciar();
    if (!ac) return;
    try {
      const b = ac.createBuffer(1, 1, 22050);
      const src = ac.createBufferSource();
      src.buffer = b; src.connect(ac.destination); src.start(0);
    } catch (e) { /* ok */ }
    if (!navigator.audioSession) {
      if (!somHtml) {
        somHtml = document.createElement('audio');
        somHtml.src = SILENCIO;
        somHtml.loop = true;
        somHtml.preload = 'auto';
        somHtml.setAttribute('playsinline', '');
        somHtml.setAttribute('x-webkit-airplay', 'deny');
      }
      if (somHtml.paused) somHtml.play().catch(() => {});
    }
  }
  ['pointerup', 'touchend', 'click', 'keydown'].forEach((tipo) => document.addEventListener(tipo, desbloquear, true));

  // Pausa o áudio com o app no fundo (economiza bateria e some do controle de mídia).
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) {
      if (somHtml) somHtml.pause();
      if (ac.state === 'running') ac.suspend().catch(() => {});
    } else if (ac.state !== 'running') {
      ac.resume().catch(() => {});
    }
  });

  function configurar(c) {
    Object.assign(cfg, c);
    if (!ac) return;
    gMus.gain.setTargetAtTime(cfg.musica ? 0.55 : 0, ac.currentTime, 0.05);
    gSfx.gain.setTargetAtTime(cfg.som ? 0.8 : 0, ac.currentTime, 0.05);
  }

  // Uma nota com envelope simples.
  function nota(freq, t0, dur, o = {}) {
    if (!ac) return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = o.tipo || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.ate) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.ate), t0 + (o.rampa || dur));
    if (o.vibrato) {
      const lfo = ac.createOscillator(); const lg = ac.createGain();
      lfo.frequency.value = o.vibrato; lg.gain.value = freq * 0.03;
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.1);
    }
    const vol = o.vol != null ? o.vol : 0.2;
    const at = o.ataque || 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + at);
    g.gain.setValueAtTime(vol, t0 + Math.max(at, dur - (o.solta || 0.05)));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + (o.cauda || 0.02));
    let no = osc;
    if (o.filtro) {
      const f = ac.createBiquadFilter();
      f.type = o.filtro.tipo || 'lowpass';
      f.frequency.value = o.filtro.f;
      if (o.filtro.q) f.Q.value = o.filtro.q;
      osc.connect(f); no = f;
    }
    no.connect(g);
    g.connect(o.destino || gSfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.1);
  }

  function ruido(t0, dur, o = {}) {
    if (!ac) return null;
    const src = ac.createBufferSource();
    src.buffer = ruidoBuf;
    src.loop = true;
    const f = ac.createBiquadFilter();
    f.type = o.tipo || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1500, t0);
    if (o.ate) f.frequency.exponentialRampToValueAtTime(o.ate, t0 + dur);
    f.Q.value = o.q || 1;
    const g = ac.createGain();
    const vol = o.vol != null ? o.vol : 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + (o.ataque || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.destino || gSfx);
    src.start(t0, U.rnd(0, 0.5));
    src.stop(t0 + dur + 0.05);
    return { src, g, f };
  }

  const agora = () => (ac ? ac.currentTime + 0.005 : 0);

  // ---------- efeitos ----------

  const sfx = {
    toque() { const t = agora(); nota(660, t, 0.06, { tipo: 'square', vol: 0.08, ate: 880 }); },
    botao() { const t = agora(); nota(520, t, 0.05, { tipo: 'triangle', vol: 0.18, ate: 780 }); },
    abrir() { const t = agora(); nota(300, t, 0.09, { tipo: 'sine', vol: 0.25, ate: 900 }); },
    fechar() { const t = agora(); nota(800, t, 0.08, { tipo: 'sine', vol: 0.2, ate: 300 }); },
    boing() {
      const t = agora();
      nota(220, t, 0.22, { tipo: 'sine', vol: 0.3, ate: 520, rampa: 0.1, vibrato: 18 });
    },
    mordida() {
      const t = agora();
      ruido(t, 0.09, { f: 1800, q: 0.8, vol: 0.35 });
      nota(170, t, 0.08, { tipo: 'square', vol: 0.12, ate: 90, filtro: { f: 900 } });
    },
    engolir() { const t = agora(); nota(420, t, 0.16, { tipo: 'sine', vol: 0.25, ate: 160 }); },
    bolha() { const t = agora(); nota(U.rnd(380, 520), t, 0.07, { tipo: 'sine', vol: 0.16, ate: U.rnd(900, 1300) }); },
    esfregar() { const t = agora(); nota(U.rnd(1100, 1500), t, 0.06, { tipo: 'sine', vol: 0.06, ate: 1800, vibrato: 30 }); },
    descarga() {
      const t = agora();
      ruido(t, 1.4, { f: 2600, ate: 260, q: 0.7, vol: 0.4, tipo: 'lowpass' });
      for (let i = 0; i < 6; i++) nota(U.rnd(200, 400), t + 0.5 + i * 0.12, 0.08, { tipo: 'sine', vol: 0.12, ate: U.rnd(600, 900) });
    },
    moeda() {
      const t = agora();
      nota(988, t, 0.07, { tipo: 'square', vol: 0.12 });
      nota(1319, t + 0.07, 0.18, { tipo: 'square', vol: 0.12 });
    },
    compra() {
      const t = agora();
      [0, 4, 7, 12].forEach((s, i) => nota(midi(72 + s), t + i * 0.06, 0.1, { tipo: 'square', vol: 0.1 }));
    },
    pulo() { const t = agora(); nota(280, t, 0.16, { tipo: 'square', vol: 0.12, ate: 720, filtro: { f: 2400 } }); },
    pouso() { const t = agora(); nota(140, t, 0.08, { tipo: 'sine', vol: 0.3, ate: 70 }); },
    batida() {
      const t = agora();
      ruido(t, 0.25, { f: 600, q: 0.6, vol: 0.45, tipo: 'lowpass' });
      nota(110, t, 0.25, { tipo: 'sine', vol: 0.4, ate: 45 });
    },
    splash() { const t = agora(); ruido(t, 0.4, { f: 3000, ate: 900, q: 0.8, vol: 0.3 }); },
    nivel() {
      const t = agora();
      [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => nota(midi(m), t + i * 0.07, 0.16, { tipo: 'square', vol: 0.1, filtro: { f: 3500 } }));
      nota(midi(84), t + 0.5, 0.5, { tipo: 'triangle', vol: 0.2 });
    },
    erro() {
      const t = agora();
      nota(330, t, 0.16, { tipo: 'square', vol: 0.1, filtro: { f: 1400 } });
      nota(220, t + 0.17, 0.32, { tipo: 'square', vol: 0.1, ate: 160, filtro: { f: 1200 } });
    },
    acerto() {
      const t = agora();
      nota(midi(76), t, 0.08, { tipo: 'square', vol: 0.1 });
      nota(midi(83), t + 0.08, 0.14, { tipo: 'square', vol: 0.1 });
    },
    interruptor() { const t = agora(); ruido(t, 0.03, { f: 4000, q: 2, vol: 0.4 }); nota(1800, t, 0.02, { tipo: 'square', vol: 0.05 }); },
    puf() { const t = agora(); ruido(t, 0.3, { f: 900, ate: 3000, q: 0.5, vol: 0.3 }); },
    cozinhar() { const t = agora(); ruido(t, 1.2, { f: 5000, q: 0.4, vol: 0.12, tipo: 'highpass', ataque: 0.2 }); },
    pronto() {
      const t = agora();
      [72, 76, 79].forEach((m, i) => nota(midi(m), t + i * 0.09, 0.2, { tipo: 'triangle', vol: 0.22 }));
    },
    tique() { const t = agora(); nota(1600, t, 0.02, { tipo: 'square', vol: 0.04 }); },
    // Tetris
    mover() { const t = agora(); nota(880, t, 0.025, { tipo: 'square', vol: 0.035, filtro: { f: 2500 } }); },
    girar() { const t = agora(); nota(560, t, 0.06, { tipo: 'square', vol: 0.06, ate: 840, filtro: { f: 2600 } }); },
    travar() {
      const t = agora();
      nota(170, t, 0.08, { tipo: 'sine', vol: 0.28, ate: 85 });
      ruido(t, 0.03, { f: 2600, q: 1.2, vol: 0.12 });
    },
    queda() {
      const t = agora();
      ruido(t, 0.12, { f: 600, ate: 2600, q: 0.7, vol: 0.18 });
      nota(140, t + 0.08, 0.12, { tipo: 'sine', vol: 0.4, ate: 55 });
    },
    linha(n) {
      const t = agora();
      const base = [72, 76, 79, 84];
      for (let i = 0; i < Math.min(4, n) + 1; i++) nota(midi(base[i % 4] + (i >= 4 ? 12 : 0)), t + i * 0.06, 0.12, { tipo: 'square', vol: 0.09, filtro: { f: 3600 } });
      ruido(t, 0.25, { f: 5000, q: 0.6, vol: 0.08, tipo: 'highpass' });
    },
    chorumaca() {
      const t = agora();
      [60, 64, 67].forEach((m) => nota(midi(m), t, 0.3, { tipo: 'square', vol: 0.07, filtro: { f: 3000 } }));
      [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => nota(midi(m), t + 0.12 + i * 0.055, 0.14, { tipo: 'square', vol: 0.08, filtro: { f: 4200 } }));
      nota(midi(96), t + 0.55, 0.6, { tipo: 'triangle', vol: 0.2 });
    },
    pad(i) {
      const t = agora();
      const m = [67, 71, 74, 79][i % 4];
      nota(midi(m), t, 0.32, { tipo: 'square', vol: 0.12, filtro: { f: 2200 } });
      nota(midi(m + 12), t, 0.32, { tipo: 'sine', vol: 0.1 });
    },
  };

  // Chuveiro em loop enquanto o botão está pressionado.
  let agua = null;
  function chuveiro(ligar) {
    if (!ac) return;
    if (ligar && !agua) {
      const src = ac.createBufferSource();
      src.buffer = ruidoBuf; src.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.5;
      const g = ac.createGain(); g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.15);
      src.connect(f); f.connect(g); g.connect(gSfx);
      src.start();
      agua = { src, g };
    } else if (!ligar && agua) {
      const a = agua; agua = null;
      a.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.06);
      a.src.stop(ac.currentTime + 0.4);
    }
  }

  // Voz de bipes: cada sílaba vira um bipe com tom conforme a vogal.
  const VOGAL = { a: 0, e: 3, i: 7, o: -2, u: -4, 'á': 0, 'ã': -1, 'é': 3, 'ê': 2, 'í': 7, 'ó': -2, 'ô': -3, 'ú': -4 };
  function falar(texto, base = 74) {
    if (!ac || !cfg.som) return 0;
    const t0 = agora();
    let t = t0;
    const sil = (texto.toLowerCase().match(/[^aeiouáãéêíóôú\s]*[aeiouáãéêíóôú]+/g) || []).slice(0, 22);
    const grito = texto === texto.toUpperCase() && /[A-Z]/.test(texto);
    sil.forEach((s, i) => {
      const v = s[s.length - 1];
      const semi = (VOGAL[v] || 0) + ((s.charCodeAt(0) * 7) % 5) - 2;
      const f = midi(base + semi + (grito ? 4 : 0));
      const dur = grito && s.length > 3 ? 0.5 : 0.075;
      nota(f, t, dur, {
        tipo: 'square', vol: grito ? 0.11 : 0.08,
        ate: grito && s.length > 3 ? f * 0.6 : f * (i === sil.length - 1 ? 0.85 : 1.04),
        filtro: { tipo: 'bandpass', f: 900 + (VOGAL[v] || 0) * 140, q: 1.2 },
      });
      t += dur + 0.028;
    });
    return t - t0;
  }

  // ---------- trilha ----------

  // Converte "E5 . G5 ~ A5" em eventos: "." é pausa e "~" segura a nota anterior.
  function trilha(str) {
    const tok = str.trim().split(/\s+/);
    const ev = [];
    tok.forEach((k, i) => {
      if (k === '.') return;
      if (k === '~') { if (ev.length) ev[ev.length - 1].dur++; return; }
      ev.push({ passo: i, m: nm(k), dur: 1 });
    });
    return { ev, passos: tok.length };
  }

  const ACORDES = {
    C: ['C3', 'E4', 'G4', 'C5'], Am: ['A2', 'C4', 'E4', 'A4'], F: ['F2', 'A3', 'C4', 'F4'], G: ['G2', 'B3', 'D4', 'G4'],
    Dm: ['D3', 'F4', 'A4', 'D5'], Em: ['E3', 'G4', 'B4', 'E5'], E: ['E2', 'G#3', 'B3', 'E4'],
  };

  function baixo(progressao, padrao) {
    // padrao: 16 posições com 'r' (fundamental), 'o' (oitava), '5' (quinta) ou '.'
    const out = [];
    progressao.forEach((a) => {
      const r = nm(ACORDES[a][0]);
      padrao.split('').forEach((c) => {
        out.push(c === 'r' ? r : c === 'o' ? r + 12 : c === '5' ? r + 7 : 0);
      });
    });
    return out;
  }

  const MUSICAS = {
    cozinha: {
      bpm: 112,
      prog: ['C', 'Am', 'F', 'G'],
      baixo: 'r...o.r...r.o...',
      acorde: '..x...x...x...x.',
      lead: 'E5 . G5 . A5 G5 E5 . C5 . D5 E5 ~ ~ . . ' +
            'C5 . E5 . A4 . C5 . B4 . A4 ~ ~ ~ . . ' +
            'F5 . A5 . G5 F5 E5 . D5 . C5 D5 ~ ~ . . ' +
            'D5 . E5 . F5 . G5 ~ ~ . D5 . G4 ~ . .',
      leadTipo: 'square', leadVol: 0.05,
      bateria: { bumbo: 'x.......x.......', caixa: '....x.......x...', chimbal: 'x.x.x.x.x.x.x.x.' },
    },
    banheiro: {
      bpm: 100,
      prog: ['F', 'C', 'Am', 'G'],
      baixo: 'r.....5.r.....5.',
      acorde: '....x.......x...',
      lead: 'C6 . A5 . F5 . A5 . C6 . . . . . . . ' +
            'G5 . E5 . C5 . E5 . G5 . . . . . . . ' +
            'A5 . C6 . E6 . C6 . A5 . . . . . . . ' +
            'B5 . G5 . D5 . G5 . B5 . . . D6 . . .',
      leadTipo: 'sine', leadVol: 0.09,
      bateria: { bumbo: 'x.......x.......', caixa: '', chimbal: '..x...x...x...x.' },
    },
    quarto: {
      bpm: 76,
      prog: ['C', 'Em', 'F', 'G'],
      baixo: 'r.......5.......',
      acorde: 'x.......x.......',
      lead: 'G5 ~ ~ E5 ~ ~ C5 ~ D5 ~ E5 ~ ~ ~ . . ' +
            'G5 ~ ~ B4 ~ ~ E5 ~ D5 ~ ~ ~ . . . . ' +
            'A5 ~ ~ F5 ~ ~ C5 ~ D5 ~ E5 ~ F5 ~ . . ' +
            'G5 ~ ~ ~ F5 ~ E5 ~ D5 ~ ~ ~ . . . .',
      leadTipo: 'triangle', leadVol: 0.1,
      bateria: { bumbo: '', caixa: '', chimbal: '' },
    },
    sala: {
      bpm: 128,
      prog: ['Am', 'F', 'C', 'G'],
      baixo: 'r.o.r.o.r.o.r.o.',
      acorde: '..x...x...x...x.',
      lead: 'A5 . A5 . C6 . A5 . G5 . E5 . G5 ~ . . ' +
            'F5 . F5 . A5 . F5 . E5 . C5 . D5 ~ . . ' +
            'E5 . G5 . C6 . G5 . E5 . G5 . C6 ~ . . ' +
            'D6 . B5 . G5 . B5 . D6 . . . G5 . . .',
      leadTipo: 'square', leadVol: 0.05,
      bateria: { bumbo: 'x...x...x...x...', caixa: '....x.......x..x', chimbal: 'xxxxxxxxxxxxxxxx' },
    },
    quintal: {
      bpm: 104,
      prog: ['C', 'F', 'G', 'C'],
      baixo: 'r..r..o.r..r..5.',
      acorde: 'x..x..x...x..x..',
      lead: 'G5 . E5 G5 . E5 C5 . D5 . E5 . C5 ~ . . ' +
            'A5 . F5 A5 . F5 C5 . D5 . F5 . A5 ~ . . ' +
            'B5 . G5 B5 . G5 D5 . E5 . F5 . D5 ~ . . ' +
            'C6 . G5 E5 . C5 E5 . G5 . . . C6 ~ . .',
      leadTipo: 'square', leadVol: 0.045,
      bateria: { bumbo: '....x.......x...', caixa: 'x.xx.x.xx.x.xx.x', chimbal: 'x.x.x.x.x.x.x.x.' },
    },
    // Korobeiniki, canção popular russa do século 19 (domínio público), em arranjo próprio.
    empilha: {
      bpm: 140,
      prog: ['E', 'Am', 'E', 'Am', 'Dm', 'Am', 'E', 'Am'],
      baixo: 'r.o.r.o.r.o.r.o.',
      acorde: '..x...x...x...x.',
      lead: 'E5 ~ ~ ~ B4 ~ C5 ~ D5 ~ ~ ~ C5 ~ B4 ~ ' +
            'A4 ~ ~ ~ A4 ~ C5 ~ E5 ~ ~ ~ D5 ~ C5 ~ ' +
            'B4 ~ ~ ~ ~ ~ C5 ~ D5 ~ ~ ~ E5 ~ ~ ~ ' +
            'C5 ~ ~ ~ A4 ~ ~ ~ A4 ~ ~ ~ ~ ~ . . ' +
            '. . D5 ~ ~ ~ F5 ~ A5 ~ ~ ~ G5 ~ F5 ~ ' +
            'E5 ~ ~ ~ ~ ~ C5 ~ E5 ~ ~ ~ D5 ~ C5 ~ ' +
            'B4 ~ ~ ~ B4 ~ C5 ~ D5 ~ ~ ~ E5 ~ ~ ~ ' +
            'C5 ~ ~ ~ A4 ~ ~ ~ A4 ~ ~ ~ . . . .',
      leadTipo: 'square', leadVol: 0.055,
      bateria: { bumbo: 'x.......x.......', caixa: '....x.......x...', chimbal: 'x.x.x.x.x.x.x.x.' },
    },
    jogo: {
      bpm: 144,
      prog: ['C', 'G', 'Am', 'F'],
      baixo: 'r.o.r.o.r.o.r.o.',
      acorde: '..x...x...x...x.',
      lead: 'C6 . G5 . E5 . G5 . C6 . D6 . E6 ~ . . ' +
            'D6 . B5 . G5 . B5 . D6 . E6 . D6 ~ . . ' +
            'C6 . A5 . E5 . A5 . C6 . B5 . A5 ~ . . ' +
            'A5 . C6 . F5 . A5 . G5 . . . G5 . A5 B5',
      leadTipo: 'square', leadVol: 0.05,
      bateria: { bumbo: 'x...x...x...x...', caixa: '....x.......x...', chimbal: 'x.xxx.xxx.xxx.xx' },
    },
  };
  Object.keys(MUSICAS).forEach((k) => {
    const m = MUSICAS[k];
    m._lead = trilha(m.lead);
    m._baixo = baixo(m.prog, m.baixo);
  });

  let musicaAtual = null;
  let seq = null;
  let fatorAndamento = 1;

  // Acelera ou volta a trilha ao normal (1 = normal), sem reiniciar a música.
  function andamento(fator) {
    fatorAndamento = fator;
    if (seq) seq.passoDur = 60 / seq.m.bpm / 4 / fator;
  }

  function tocar(nome, forcar) {
    if (nome === musicaAtual && !forcar && seq) return;
    musicaAtual = nome;
    if (!ac) return;
    parar();
    const m = MUSICAS[nome];
    if (!m) return;
    const passoDur = 60 / m.bpm / 4 / fatorAndamento;
    const estado = { m, passo: 0, proximo: ac.currentTime + 0.12, passoDur, total: m._lead.passos };
    seq = estado;
    estado.timer = setInterval(() => agendar(estado), 25);
  }

  function parar() {
    if (seq) { clearInterval(seq.timer); seq = null; }
  }

  function agendar(st) {
    if (st !== seq) return;
    while (st.proximo < ac.currentTime + 0.12) {
      tocarPasso(st, st.passo, st.proximo);
      st.proximo += st.passoDur;
      st.passo = (st.passo + 1) % st.total;
    }
  }

  function tocarPasso(st, p, t) {
    const m = st.m, d = st.passoDur;
    const naBarra = p % 16;
    const acorde = ACORDES[m.prog[Math.floor(p / 16) % m.prog.length]];
    // baixo
    const b = m._baixo[p];
    if (b) nota(midi(b), t, d * 1.6, { tipo: 'triangle', vol: 0.22, destino: gMus });
    // acordes curtinhos
    if (m.acorde[naBarra] === 'x') {
      acorde.slice(1).forEach((n) => nota(midi(nm(n)), t, d * 0.9, { tipo: 'square', vol: 0.025, destino: gMus, filtro: { f: 1600 } }));
    }
    // melodia
    m._lead.ev.forEach((e) => {
      if (e.passo === p) nota(midi(e.m), t, d * e.dur * 0.95, { tipo: m.leadTipo, vol: m.leadVol, destino: gMus, solta: 0.03, filtro: m.leadTipo === 'square' ? { f: 3000 } : null });
    });
    // bateria
    const bt = m.bateria;
    if (bt.bumbo[naBarra] === 'x') nota(150, t, 0.12, { tipo: 'sine', vol: 0.35, ate: 45, destino: gMus });
    if (bt.caixa[naBarra] === 'x') ruido(t, 0.09, { f: 1800, q: 0.7, vol: 0.1, destino: gMus });
    if (bt.chimbal[naBarra] === 'x') ruido(t, 0.03, { f: 8000, q: 1.5, vol: 0.05, tipo: 'highpass', destino: gMus });
  }

  // Abaixa a trilha (por exemplo, com a luz apagada).
  function volumeTrilha(v) {
    if (!ac) return;
    gMus.gain.setTargetAtTime(cfg.musica ? 0.55 * v : 0, ac.currentTime, 0.3);
  }

  CH.som = {
    iniciar, desbloquear, configurar, tocar, parar, chuveiro, falar, volumeTrilha, andamento,
    get pronto() { return !!ac; },
    get estado() { return ac ? ac.state : 'sem áudio'; },
    ...sfx,
  };
})(window.CH);
