// Pawpath — встроенный кликер и свисток на Web Audio API.
// Никаких внешних аудио-файлов: 5 разных кликов и регулируемая частота свистка.

const AudioEngine = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // 5 пресетов кликов: классический, мягкий, высокий, двойной, голосовой «да»
  const CLICK_PRESETS = {
    classic:  { type: "square",   freq: 1100, attack: 0.001, decay: 0.025, gain: 0.35, double: false, sweep: 0 },
    soft:     { type: "sine",     freq: 850,  attack: 0.005, decay: 0.06,  gain: 0.30, double: false, sweep: 0 },
    high:     { type: "triangle", freq: 2400, attack: 0.001, decay: 0.018, gain: 0.30, double: false, sweep: 0 },
    double:   { type: "square",   freq: 1100, attack: 0.001, decay: 0.018, gain: 0.30, double: true,  sweep: 0 },
    sweep:    { type: "sine",     freq: 600,  attack: 0.001, decay: 0.08,  gain: 0.30, double: false, sweep: 1800 },
  };

  function click(preset = "classic") {
    const c = getCtx();
    const p = CLICK_PRESETS[preset] || CLICK_PRESETS.classic;
    const fire = (offset = 0) => {
      const t = c.currentTime + offset;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.freq, t);
      if (p.sweep) osc.frequency.exponentialRampToValueAtTime(p.freq + p.sweep, t + p.decay);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(p.gain, t + p.attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + p.attack + p.decay);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + p.attack + p.decay + 0.05);
    };
    fire(0);
    if (p.double) fire(0.06);
    if (navigator.vibrate) navigator.vibrate(15);
  }

  // Свисток: устойчивый тон. Galton — обычно 5500–12000 Гц.
  let whistleNode = null;
  function whistleStart(freq = 8000) {
    whistleStop();
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.25, c.currentTime + 0.04);
    osc.connect(gain).connect(c.destination);
    osc.start();
    whistleNode = { osc, gain };
  }
  function whistleSetFreq(freq) {
    if (whistleNode) whistleNode.osc.frequency.value = freq;
  }
  function whistleStop() {
    if (!whistleNode) return;
    const c = getCtx();
    whistleNode.gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.04);
    const node = whistleNode;
    setTimeout(() => { try { node.osc.stop(); } catch(e){} }, 80);
    whistleNode = null;
  }

  // Короткий «бип» для таймера (старт/стоп/окончание)
  function beep(freq = 880, duration = 0.18, gainVal = 0.3) {
    const c = getCtx();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // ===== Звуки десенсибилизации (гроза, дождь, фейерверк, звонок, пылесос) =====
  // Всё синтезируется на лету — без аудиофайлов, работает офлайн.
  let desens = null;

  function makeNoiseBuffer(c, kind) {
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (kind === "brown") { last = (last + 0.02 * white) / 1.02; d[i] = last * 3.5; }
      else d[i] = white;
    }
    return buf;
  }

  const DESENS = {
    rain:      { noise: "white", filter: "highpass", cutoff: 600,  base: 0.18, swell: 0 },
    thunder:   { noise: "brown", filter: "lowpass",  cutoff: 350,  base: 0.10, swell: 0.9 },
    fireworks: { noise: "brown", filter: "lowpass",  cutoff: 800,  base: 0.04, burst: 0.55 },
    vacuum:    { noise: "brown", filter: "lowpass",  cutoff: 700,  base: 0.20, hum: 120 },
    traffic:   { noise: "brown", filter: "lowpass",  cutoff: 500,  base: 0.16, swell: 0.3 },
  };

  function desensStart(kind = "rain", level = 0.4) {
    desensStop();
    const c = getCtx();
    const cfg = DESENS[kind] || DESENS.rain;
    const src = c.createBufferSource();
    src.buffer = makeNoiseBuffer(c, cfg.noise);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = cfg.filter;
    filter.frequency.value = cfg.cutoff;
    const master = c.createGain();
    master.gain.value = cfg.base * level;
    src.connect(filter).connect(master).connect(c.destination);
    src.start();

    let humNode = null;
    if (cfg.hum) {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = "sawtooth"; osc.frequency.value = cfg.hum;
      g.gain.value = 0.04 * level;
      osc.connect(g).connect(c.destination); osc.start();
      humNode = { osc, g };
    }

    // Раскаты грома / залпы фейерверка / накат шума
    let timer = null;
    if (cfg.swell || cfg.burst) {
      const tick = () => {
        const t = c.currentTime;
        const peak = (cfg.burst || cfg.swell) * level;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(peak, t + (cfg.burst ? 0.05 : 0.6));
        master.gain.exponentialRampToValueAtTime(Math.max(0.001, cfg.base * level), t + (cfg.burst ? 1.2 : 2.2));
      };
      const loop = () => { tick(); timer = setTimeout(loop, 2500 + Math.random() * 4000); };
      timer = setTimeout(loop, 1500);
    }

    desens = { src, master, humNode, timer, cfg };
  }

  function desensSetLevel(level) {
    if (!desens) return;
    const c = getCtx();
    desens.master.gain.setTargetAtTime(desens.cfg.base * level, c.currentTime, 0.1);
    if (desens.humNode) desens.humNode.g.gain.setTargetAtTime(0.04 * level, c.currentTime, 0.1);
  }

  function desensStop() {
    if (!desens) return;
    const d = desens; desens = null;
    if (d.timer) clearTimeout(d.timer);
    try { d.src.stop(); } catch (e) {}
    if (d.humNode) { try { d.humNode.osc.stop(); } catch (e) {} }
  }

  // Дверной звонок «динь-дон»
  function doorbell() {
    beep(660, 0.5, 0.25);
    setTimeout(() => beep(520, 0.7, 0.25), 380);
  }

  return {
    click, whistleStart, whistleSetFreq, whistleStop, beep, CLICK_PRESETS,
    desensStart, desensSetLevel, desensStop, doorbell, DESENS,
  };
})();
