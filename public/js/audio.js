// Music and sound.
//
// The theme is a real track, decoded once and looped with a crossfade rather
// than with loop=true. The file is cut just before the track's own fade-out so
// the seam joins two passages at full level, and the two-second overlap covers
// both that join and the gentle ramp the track opens with.
//
// Safari will not let an AudioContext exist outside a user gesture, so the
// context is created on the first key press or tap and resumed there too.

const Music = (function () {
  const THEME_URL = 'audio/theme.mp3';
  const OVERLAP = 2.0;      // seconds of crossfade at the seam
  const VOLUME = 0.55;
  const SCHEDULE_AHEAD = 4; // seconds

  let ctx = null;
  let master = null;
  let buffer = null;
  let loading = null;
  let loadFailed = false;

  let enabled = false;
  let nextStart = 0;
  let timer = null;
  let live = [];
  let listener = null;

  // Anything that can change what the music is doing says so, so the on/off
  // control never claims something that is not true.
  function announce() {
    if (listener) listener();
  }

  function ensureContext() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return true;
  }

  // Older Safari only has the callback form of decodeAudioData.
  function decode(data) {
    return new Promise(function (resolve, reject) {
      const maybe = ctx.decodeAudioData(data, resolve, reject);
      if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject);
    });
  }

  function load() {
    if (buffer || loadFailed) return Promise.resolve(buffer);
    if (loading) return loading;
    loading = fetch(THEME_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('theme ' + res.status);
        return res.arrayBuffer();
      })
      .then(decode)
      .then(function (decoded) {
        buffer = decoded;
        announce();
        return buffer;
      })
      .catch(function () {
        // A missing or undecodable track must not take the game down with it.
        loadFailed = true;
        announce();
        return null;
      });
    return loading;
  }

  function scheduleLap(at) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;

    const end = at + buffer.duration;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(1, at + OVERLAP);
    gain.gain.setValueAtTime(1, end - OVERLAP);
    gain.gain.linearRampToValueAtTime(0.0001, end);

    source.connect(gain);
    gain.connect(master);
    source.start(at);
    source.stop(end + 0.05);

    live.push(source);
    source.onended = function () {
      const i = live.indexOf(source);
      if (i !== -1) live.splice(i, 1);
    };

    // The next lap starts before this one ends; that overlap is the crossfade.
    nextStart = end - OVERLAP;
  }

  function pump() {
    if (!enabled || !buffer || !ctx) return;
    while (nextStart < ctx.currentTime + SCHEDULE_AHEAD) scheduleLap(nextStart);
  }

  function stopAllSources() {
    live.forEach(function (s) { try { s.stop(); } catch (e) { /* already stopped */ } });
    live = [];
  }

  function voice(freq, at, dur, type, vol, cutoff) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    let tail = gain;
    if (cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = cutoff;
      gain.connect(filter);
      tail = filter;
    }

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    osc.connect(gain);
    tail.connect(ctx.destination); // effects bypass the music fader
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  return {
    isOn: function () { return enabled; },
    isReady: function () { return !!buffer; },
    failed: function () { return loadFailed; },
    // Wanted, but the track has not arrived yet.
    isLoading: function () { return enabled && !buffer && !loadFailed; },
    onChange: function (fn) { listener = fn; },

    // Safe to call early; it only warms the cache.
    preload: function () {
      if (ensureContext()) load();
    },

    // Must be called from inside a user gesture the first time.
    start: function () {
      if (!ensureContext()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      enabled = true;

      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(VOLUME, ctx.currentTime + 0.6);

      load().then(function (ok) {
        if (!ok || !enabled) return;
        if (!timer) {
          nextStart = ctx.currentTime + 0.05;
          pump();
          timer = setInterval(pump, 1000);
        }
      });
      announce();
      return true;
    },

    stop: function () {
      if (!ctx) return;
      enabled = false;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      clearInterval(timer);
      timer = null;
      // Let the fade finish before tearing the sources down.
      setTimeout(function () { if (!enabled) stopAllSources(); }, 500);
      announce();
    },

    toggle: function () {
      if (enabled) { this.stop(); return false; }
      return this.start();
    },

    blip: function (up) {
      if (!ensureContext()) return;
      if (ctx.state === 'suspended') ctx.resume();
      voice(up ? 880 : 520, ctx.currentTime + 0.001, 0.07, 'square', 0.22, 3000);
    },

    // The boot chime: two notes, the second ringing on underneath.
    chime: function () {
      if (!ensureContext()) return;
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime + 0.02;
      voice(523.25, t, 0.16, 'triangle', 0.30, 4000);
      voice(1046.5, t + 0.13, 1.25, 'triangle', 0.26, 5000);
      voice(1568.0, t + 0.13, 1.10, 'sine', 0.11, 6000);
    },
  };
})();
