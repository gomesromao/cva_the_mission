// A tiny two-voice chiptune loop built with oscillators, so there is no audio
// file to download and nothing to license.
//
// Safari will not let an AudioContext start outside a user gesture, so the
// context is created lazily on the first key press or tap and resumed there too.

const Music = (function () {
  const BPM = 92;
  const STEP = 60 / BPM / 2; // one eighth note
  const LOOKAHEAD = 0.25;

  // Semitone offsets from A4 = 440.
  const NOTES = {
    'C3': -21, 'D3': -19, 'E3': -17, 'F3': -16, 'G3': -14, 'A3': -12, 'B3': -10,
    'C4': -9, 'D4': -7, 'E4': -5, 'F4': -4, 'G4': -2, 'A4': 0, 'B4': 2,
    'C5': 3, 'D5': 5, 'E5': 7, 'F5': 8, 'G5': 10,
    'F2': -28, 'G2': -26, 'A2': -24, 'C2': -33,
  };

  const LEAD = [
    'E4', 'G4', 'C5', null, 'B4', null, 'A4', null,
    'G4', 'E4', 'G4', null, 'C5', null, null, null,
    'D5', 'C5', 'B4', null, 'A4', null, 'G4', null,
    'E4', 'D4', 'E4', null, 'C4', null, null, null,
  ];

  const BASS = [
    'C3', null, null, null, 'G2', null, null, null,
    'A2', null, null, null, 'F2', null, null, null,
    'C3', null, null, null, 'G2', null, null, null,
    'F2', null, null, null, 'G2', null, null, null,
  ];

  let ctx = null;
  let master = null;
  let timer = null;
  let step = 0;
  let nextTime = 0;
  let enabled = false;

  function freq(name) {
    return 440 * Math.pow(2, NOTES[name] / 12);
  }

  function ensureContext() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    return true;
  }

  function voice(f, at, dur, type, vol, cutoff) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = f;

    let tail = gain;
    if (cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      gain.connect(filter);
      tail = filter;
    }

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    osc.connect(gain);
    tail.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function scheduleStep(i, at) {
    const lead = LEAD[i % LEAD.length];
    if (lead) voice(freq(lead), at, STEP * 1.6, 'square', 0.5, 2200);
    const bass = BASS[i % BASS.length];
    if (bass) voice(freq(bass), at, STEP * 3.2, 'triangle', 0.9, 700);
  }

  function tick() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      scheduleStep(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % LEAD.length;
    }
  }

  return {
    isOn: function () { return enabled; },

    // Must be called from inside a user gesture the first time.
    start: function () {
      if (!ensureContext()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      if (enabled) return true;
      enabled = true;
      step = 0;
      nextTime = ctx.currentTime + 0.08;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.4);
      timer = setInterval(tick, 60);
      tick();
      return true;
    },

    stop: function () {
      if (!enabled || !ctx) return;
      enabled = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      clearInterval(timer);
      timer = null;
    },

    toggle: function () {
      if (enabled) { this.stop(); return false; }
      return this.start();
    },

    // Short blip for menu confirmations.
    blip: function (up) {
      if (!ensureContext()) return;
      if (ctx.state === 'suspended') ctx.resume();
      const at = ctx.currentTime + 0.001;
      voice(up ? 880 : 520, at, 0.07, 'square', 0.35, 3000);
    },
  };
})();
