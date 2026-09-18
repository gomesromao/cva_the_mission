// THE MISSION - engine.
//
// Everything renders into a 160x144 pixel buffer (the handheld's real
// resolution) which is then scaled up by whole numbers, so the art stays crisp
// and identical on every browser instead of relying on canvas smoothing.

(function () {
  'use strict';

  const W = 160;
  const H = 144;
  const MOVE_FRAMES = 9; // frames to cross one tile
  const TEXT_LEFT = 8;
  const TEXT_COLS = 24;
  const LINE_H = 10;
  const BOX_TOP = 96;

  // ------------------------------------------------------------------ canvas

  const canvas = document.getElementById('screen');
  const ctx2d = canvas.getContext('2d', { alpha: false });
  ctx2d.imageSmoothingEnabled = false;

  const image = ctx2d.createImageData(W, H);
  const pixels = new Uint32Array(image.data.buffer);

  let paletteName = 'coconut';
  let palette = new Uint32Array(4);

  function applyPalette(name) {
    paletteName = name;
    const hexes = PALETTES[name];
    for (let i = 0; i < 4; i++) {
      const hex = hexes[i];
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      // Uint32 view is little-endian on every browser we target: 0xAABBGGRR.
      palette[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    document.body.style.background = hexes[3];
  }

  function clear(colorIndex) {
    pixels.fill(palette[colorIndex]);
  }

  function fillRect(x, y, w, h, colorIndex) {
    const c = palette[colorIndex];
    const x0 = Math.max(0, x), x1 = Math.min(W, x + w);
    const y0 = Math.max(0, y), y1 = Math.min(H, y + h);
    for (let py = y0; py < y1; py++) {
      const row = py * W;
      for (let px = x0; px < x1; px++) pixels[row + px] = c;
    }
  }

  // Draws a pixel-map (array of strings). '.' is transparent.
  function drawGrid(rows, dx, dy) {
    for (let ry = 0; ry < rows.length; ry++) {
      const py = dy + ry;
      if (py < 0 || py >= H) continue;
      const row = rows[ry];
      const base = py * W;
      for (let rx = 0; rx < row.length; rx++) {
        const ch = row[rx];
        if (ch === '.') continue;
        const px = dx + rx;
        if (px < 0 || px >= W) continue;
        pixels[base + px] = palette[ch.charCodeAt(0) - 48];
      }
    }
  }

  function drawChar(ch, x, y, colorIndex) {
    const rows = glyphFor(ch);
    const c = palette[colorIndex];
    for (let ry = 0; ry < 8; ry++) {
      const py = y + ry;
      if (py < 0 || py >= H) continue;
      const bits = rows[ry];
      if (!bits) continue;
      const base = py * W;
      for (let bx = 0; bx < 8; bx++) {
        if (!(bits & (0x80 >> bx))) continue;
        const px = x + bx;
        if (px < 0 || px >= W) continue;
        pixels[base + px] = c;
      }
    }
  }

  function drawText(text, x, y, colorIndex) {
    for (let i = 0; i < text.length; i++) {
      drawChar(text[i], x + i * GLYPH_ADVANCE, y, colorIndex === undefined ? 3 : colorIndex);
    }
  }

  function textWidth(text) {
    return text.length * GLYPH_ADVANCE;
  }

  function drawTextCentered(text, y, colorIndex) {
    drawText(text, Math.round((W - textWidth(text)) / 2), y, colorIndex);
  }

  // Same font, drawn as blocks of scale x scale pixels, for the boot wordmark.
  function drawTextScaled(text, x, y, colorIndex, scale) {
    for (let i = 0; i < text.length; i++) {
      const rows = glyphFor(text[i]);
      for (let ry = 0; ry < 8; ry++) {
        const bits = rows[ry];
        if (!bits) continue;
        for (let bx = 0; bx < 8; bx++) {
          if (!(bits & (0x80 >> bx))) continue;
          fillRect(x + (i * GLYPH_ADVANCE + bx) * scale, y + ry * scale, scale, scale, colorIndex);
        }
      }
    }
  }

  function drawTextScaledCentered(text, y, colorIndex, scale) {
    const w = text.length * GLYPH_ADVANCE * scale;
    drawTextScaled(text, Math.round((W - w) / 2), y, colorIndex, scale);
  }

  // Classic ordered dither, used for screen transitions.
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  function ditherOver(level, colorIndex) {
    if (level <= 0) return;
    const c = palette[colorIndex];
    const threshold = level * 16 / 5;
    for (let y = 0; y < H; y++) {
      const base = y * W;
      const brow = BAYER[y & 3];
      for (let x = 0; x < W; x++) {
        if (brow[x & 3] < threshold) pixels[base + x] = c;
      }
    }
  }

  function present() {
    ctx2d.putImageData(image, 0, 0);
  }

  // ------------------------------------------------------------------- input

  const keys = Object.create(null);
  const pressed = Object.create(null);

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right',
    Enter: 'a', ' ': 'a', z: 'a', Z: 'a', e: 'a', E: 'a',
    Escape: 'b', x: 'b', X: 'b', Backspace: 'b',
    m: 'music', M: 'music',
    p: 'palette', P: 'palette',
  };

  function setKey(name, down) {
    if (!name) return;
    if (down && !keys[name]) pressed[name] = true;
    keys[name] = down;
  }

  window.addEventListener('keydown', function (e) {
    const name = KEYMAP[e.key];
    if (!name) return;
    // Arrows and space scroll the page otherwise.
    e.preventDefault();
    firstGesture();
    setKey(name, true);
  });

  window.addEventListener('keyup', function (e) {
    const name = KEYMAP[e.key];
    if (!name) return;
    e.preventDefault();
    setKey(name, false);
  });

  function consume(name) {
    if (pressed[name]) { pressed[name] = false; return true; }
    return false;
  }

  function clearPressed() {
    for (const k in pressed) pressed[k] = false;
  }

  // On-screen controls for touch devices.
  function bindTouchControls() {
    const buttons = document.querySelectorAll('[data-key]');
    buttons.forEach(function (el) {
      const name = el.getAttribute('data-key');
      const down = function (e) { e.preventDefault(); firstGesture(); setKey(name, true); el.classList.add('held'); };
      const up = function (e) { e.preventDefault(); setKey(name, false); el.classList.remove('held'); };
      el.addEventListener('touchstart', down, { passive: false });
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: false });
      el.addEventListener('mousedown', down);
      el.addEventListener('mouseup', up);
      el.addEventListener('mouseleave', up);
    });
  }

  let gestureSeen = false;
  function firstGesture() {
    if (gestureSeen) return;
    gestureSeen = true;
    // Safari only allows the audio context to exist after a real interaction.
    // Open it now and fetch the theme, but stay silent until the boot chime.
    Music.preload();
  }

  let musicWanted = true;

  // -------------------------------------------------------------- game state

  const flags = { hasMessage: false, seen: Object.create(null) };

  // power | boot | title | play | dialogue | choice | fadeout | ending
  let mode = 'power';

  // Boot sequence timing, in frames. The handheld took about two seconds to
  // slide its logo down and ring, and it is the wait that makes it feel right.
  const BOOT_SCROLL = 78;
  const BOOT_SETTLE = 22;
  const BOOT_AFTER_CHIME = 100;
  const LOGO_REST_Y = 30;
  // Far enough up that the wordmark underneath the mark is off-screen too, so
  // the whole block slides in as one piece.
  const LOGO_START_Y = -72;

  let bootT = 0;
  let chimeRung = false;
  let userPalette = 'coconut';
  let currentMapId = 'office';
  let map = null;

  const player = { x: 0, y: 0, px: 0, py: 0, dir: 'down', moving: false, t: 0, fromX: 0, fromY: 0, stepFrame: 0 };

  let camX = 0, camY = 0;
  let frame = 0;
  let fadeLevel = 0;
  let fadeDir = 0;
  let afterFade = null;

  // dialogue
  let pages = [];
  let pageIndex = 0;
  let revealed = 0;
  let afterDialogue = null;

  // choice
  let choiceYes = true;
  let choiceText = '';
  let onChoice = null;

  function loadMap(id, spawn) {
    currentMapId = id;
    map = MAPS[id];
    const s = spawn || map.spawn;
    player.x = s.x; player.y = s.y; player.dir = s.dir;
    player.px = s.x * TILE; player.py = s.y * TILE;
    player.moving = false; player.t = 0;
    updateCamera();
  }

  function updateCamera() {
    const maxX = Math.max(0, map.width * TILE - W);
    const maxY = Math.max(0, map.height * TILE - H);
    camX = Math.min(maxX, Math.max(0, Math.round(player.px + TILE / 2 - W / 2)));
    camY = Math.min(maxY, Math.max(0, Math.round(player.py + TILE / 2 - H / 2)));
  }

  function isBlocked(x, y) {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
    return map.blocked.has(x + ',' + y);
  }

  const DELTA = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  // ---------------------------------------------------------------- dialogue

  function say(paragraphs, done) {
    const lines = [];
    const list = Array.isArray(paragraphs) ? paragraphs : [paragraphs];
    list.forEach(function (p, i) {
      wrapText(p, TEXT_COLS).forEach(function (l) { lines.push(l); });
      if (i < list.length - 1) lines.push('');
    });
    pages = [];
    for (let i = 0; i < lines.length; i += 3) {
      const page = lines.slice(i, i + 3);
      // Never start a page with a blank separator line.
      while (page.length && page[0] === '') page.shift();
      if (page.length) pages.push(page);
    }
    if (!pages.length) pages = [['...']];
    pageIndex = 0;
    revealed = 0;
    afterDialogue = done || null;
    mode = 'dialogue';
  }

  function ask(question, onAnswer) {
    choiceText = question;
    choiceYes = true;
    onChoice = onAnswer;
    mode = 'choice';
  }

  function startFade(direction, then) {
    fadeDir = direction;
    afterFade = then || null;
    mode = 'fadeout';
  }

  // ------------------------------------------------------------- interaction

  const ACTIONS = {
    laptop: function () {
      if (!flags.hasMessage) {
        flags.hasMessage = true;
        say(SCRIPT.laptop);
      } else {
        say(SCRIPT.laptopAgain);
      }
    },
    stairs: function () {
      if (!flags.hasMessage) { say(SCRIPT.stairsLocked); return; }
      startFade(1, function () {
        loadMap('house');
        startFade(-1, null);
      });
    },
    gramophone: function () {
      const on = Music.toggle();
      musicWanted = on;
      say(on ? SCRIPT.gramophoneOn : SCRIPT.gramophoneOff);
    },
    door: function () {
      say(SCRIPT.doorPrompt, function () {
        ask(SCRIPT.doorQuestion, function (yes) {
          if (!yes) { say(SCRIPT.doorRefuse); return; }
          startFade(1, function () {
            say(SCRIPT.ending, function () {
              showEnding();
            });
          });
        });
      });
    },
  };

  function interact() {
    const d = DELTA[player.dir];
    const tx = player.x + d[0];
    const ty = player.y + d[1];
    const entry = map.interact && map.interact[tx + ',' + ty];
    if (!entry) return;
    flags.seen[currentMapId + ':' + tx + ',' + ty] = true;
    if (typeof entry === 'string') {
      say(SCRIPT[entry] || ['...']);
    } else if (entry.action && ACTIONS[entry.action]) {
      ACTIONS[entry.action]();
    }
  }

  // ------------------------------------------------------------------ update

  function updatePlay() {
    if (consume('a')) { interact(); return; }
    if (consume('music')) { musicWanted = Music.toggle(); }
    if (consume('palette')) {
      const i = PALETTE_ORDER.indexOf(paletteName);
      userPalette = PALETTE_ORDER[(i + 1) % PALETTE_ORDER.length];
      applyPalette(userPalette);
    }

    if (player.moving) {
      player.t++;
      const k = player.t / MOVE_FRAMES;
      player.px = Math.round((player.fromX + (player.x - player.fromX) * k) * TILE);
      player.py = Math.round((player.fromY + (player.y - player.fromY) * k) * TILE);
      if (player.t >= MOVE_FRAMES) {
        player.moving = false;
        player.px = player.x * TILE;
        player.py = player.y * TILE;
        player.stepFrame ^= 1;
        const warp = map.warps && map.warps[player.x + ',' + player.y];
        if (warp) {
          startFade(1, function () {
            loadMap(warp.to, warp);
            startFade(-1, null);
          });
          updateCamera();
          return;
        }
      }
      updateCamera();
      return;
    }

    // Held OR tapped: a quick press shorter than one frame must still count,
    // otherwise light taps silently do nothing.
    let dir = null;
    if (keys.up || pressed.up) dir = 'up';
    else if (keys.down || pressed.down) dir = 'down';
    else if (keys.left || pressed.left) dir = 'left';
    else if (keys.right || pressed.right) dir = 'right';
    if (!dir) return;
    pressed[dir] = false;

    player.dir = dir;
    const d = DELTA[dir];
    const nx = player.x + d[0];
    const ny = player.y + d[1];
    if (isBlocked(nx, ny)) return;

    player.fromX = player.x;
    player.fromY = player.y;
    player.x = nx;
    player.y = ny;
    player.moving = true;
    player.t = 0;
  }

  function updateDialogue() {
    const page = pages[pageIndex];
    const total = page.join('\n').length;
    if (revealed < total) {
      // A snaps the rest of the page in rather than advancing it.
      if (consume('a')) { revealed = total; return; }
      revealed += 2;
      if (revealed > total) revealed = total;
      return;
    }
    if (consume('a')) {
      pageIndex++;
      revealed = 0;
      if (pageIndex >= pages.length) {
        const then = afterDialogue;
        afterDialogue = null;
        mode = 'play';
        if (then) then();
      }
    }
  }

  function updateChoice() {
    if (consume('up') || consume('down') || consume('left') || consume('right')) {
      choiceYes = !choiceYes;
      Music.blip(choiceYes);
    }
    if (consume('a')) {
      const cb = onChoice;
      onChoice = null;
      mode = 'play';
      if (cb) cb(choiceYes);
    }
  }

  function updateFade() {
    fadeLevel += fadeDir * 0.34;

    if (fadeDir > 0 && fadeLevel >= 5) {
      fadeLevel = 5;
      const then = afterFade;
      afterFade = null;
      mode = 'play';
      if (then) then();
      // If the callback did not take over (dialogue, another fade), come back in.
      if (mode === 'play') { fadeDir = -1; mode = 'fadeout'; }
      return;
    }

    if (fadeDir < 0 && fadeLevel <= 0) {
      fadeLevel = 0;
      fadeDir = 0;
      const then = afterFade;
      afterFade = null;
      mode = 'play';
      if (then) then();
    }
  }

  // ------------------------------------------------------------------ render

  function renderMap() {
    clear(0);

    const startX = Math.floor(camX / TILE);
    const startY = Math.floor(camY / TILE);
    const endX = Math.min(map.width - 1, Math.floor((camX + W - 1) / TILE));
    const endY = Math.min(map.height - 1, Math.floor((camY + H - 1) / TILE));

    for (let y = startY; y <= endY; y++) {
      const row = map.ground[y];
      for (let x = startX; x <= endX; x++) {
        const kind = GROUND_LEGEND[row[x]];
        drawGrid(GROUND[kind], x * TILE - camX, y * TILE - camY);
      }
    }

    (map.decals || []).forEach(function (dec) {
      drawGrid(DECALS[dec.t], dec.x * TILE - camX, dec.y * TILE + (dec.dy || 0) - camY);
    });

    (map.objects || []).forEach(function (o) {
      drawGrid(OBJECTS[o.t], o.x * TILE - camX, o.y * TILE + (o.dy || 0) - camY);
    });

    const frames = PLAYER[player.dir === 'left' ? 'right' : player.dir];
    const which = player.moving ? (Math.floor(player.t / 5) % 2 ? 1 : 0) : 0;
    const art = frames[which];
    if (player.dir === 'left') {
      drawGrid(art.map(function (r) { return r.split('').reverse().join(''); }),
        player.px - camX, player.py - camY);
    } else {
      drawGrid(art, player.px - camX, player.py - camY);
    }
  }

  // Twinkling corner marks on anything worth pressing ENTER at. They go quiet
  // once you have read that thing, so the marks double as a record of what you
  // have not found yet.
  function drawSparkle(x, y) {
    const arm = 3;
    const c = 2;
    const right = x + TILE - 1;
    const bottom = y + TILE - 1;

    if (((frame >> 4) & 1) === 0) {
      fillRect(x, y, arm, 1, c);
      fillRect(x, y, 1, arm, c);
      fillRect(right - arm + 1, bottom, arm, 1, c);
      fillRect(right, bottom - arm + 1, 1, arm, c);
    } else {
      fillRect(right - arm + 1, y, arm, 1, c);
      fillRect(right, y, 1, arm, c);
      fillRect(x, bottom, arm, 1, c);
      fillRect(x, bottom - arm + 1, 1, arm, c);
    }
  }

  function drawPrompt(x, y) {
    const label = isTouch ? 'A' : 'ENTER';
    const w = textWidth(label) + 7;
    let px = Math.round(x + TILE / 2 - w / 2);
    let py = y - 12;
    px = Math.max(1, Math.min(W - w - 1, px));
    // If there is no room above the object, hang the tag underneath instead.
    if (py < 1) py = y + TILE + 2;

    fillRect(px, py, w, 11, 3);
    fillRect(px + 1, py + 1, w - 2, 9, 0);
    drawText(label, px + 4, py + 2, 3);
  }

  function renderInteractHints() {
    const facing = DELTA[player.dir];
    const facingKey = (player.x + facing[0]) + ',' + (player.y + facing[1]);

    for (const key in map.interact) {
      if (flags.seen[currentMapId + ':' + key]) continue;
      const parts = key.split(',');
      const sx = (+parts[0]) * TILE - camX;
      const sy = (+parts[1]) * TILE - camY + (map.hintDy[key] || 0);
      if (sx <= -TILE || sx >= W || sy <= -TILE || sy >= H) continue;
      drawSparkle(sx, sy);
    }

    if (map.interact[facingKey]) {
      const parts = facingKey.split(',');
      drawPrompt(
        (+parts[0]) * TILE - camX,
        (+parts[1]) * TILE - camY + (map.hintDy[facingKey] || 0)
      );
    }
  }

  function renderBox(top, height) {
    fillRect(0, top, W, height, 3);
    fillRect(2, top + 2, W - 4, height - 4, 0);
    fillRect(4, top + 4, W - 8, height - 8, 0);
    // inner hairline
    fillRect(3, top + 3, W - 6, 1, 2);
    fillRect(3, top + height - 4, W - 6, 1, 2);
    fillRect(3, top + 3, 1, height - 6, 2);
    fillRect(W - 4, top + 3, 1, height - 6, 2);
  }

  function renderDialogue() {
    renderBox(BOX_TOP, H - BOX_TOP);
    const page = pages[pageIndex];
    let budget = revealed;
    for (let i = 0; i < page.length; i++) {
      const line = page[i];
      const shown = line.substring(0, Math.max(0, Math.min(line.length, budget)));
      budget -= line.length + 1;
      drawText(shown, TEXT_LEFT, BOX_TOP + 10 + i * LINE_H, 3);
      if (budget <= 0) break;
    }
    const total = page.join('\n').length;
    if (revealed >= total && (frame >> 4) & 1) {
      drawChar('\x01', W - 14, H - 14, 3);
    }
  }

  function renderChoice() {
    renderBox(BOX_TOP, H - BOX_TOP);
    drawText(choiceText, TEXT_LEFT, BOX_TOP + 10, 3);
    drawText('YES', TEXT_LEFT + 18, BOX_TOP + 26, 3);
    drawText('NO', TEXT_LEFT + 78, BOX_TOP + 26, 3);
    const cx = choiceYes ? TEXT_LEFT + 8 : TEXT_LEFT + 68;
    drawChar('*', cx, BOX_TOP + 26, 3);
  }

  // The console is off. Browsers will not make a sound until someone touches
  // the page, so the chime needs this one press to exist at all.
  function renderPower() {
    clear(3);
    // Steady text, blinking marker: a dark screen that is blank half the time
    // reads as broken rather than as waiting.
    const label = isTouch ? 'TAP TO POWER ON' : 'PRESS ENTER TO POWER ON';
    drawTextCentered(label, 68, 1);
    if ((frame >> 4) & 1) {
      const x = Math.round((W - textWidth(label)) / 2) - 10;
      drawChar('*', x, 68, 2);
    }
  }

  function updateBoot() {
    bootT++;

    if (bootT === BOOT_SCROLL + BOOT_SETTLE && !chimeRung) {
      chimeRung = true;
      Music.chime();
    }

    const done = BOOT_SCROLL + BOOT_SETTLE + BOOT_AFTER_CHIME;
    // Let people who have seen it once get past it.
    if (bootT >= done || (bootT > BOOT_SCROLL + BOOT_SETTLE + 20 && consume('a'))) {
      applyPalette(userPalette);
      mode = 'title';
      clearPressed();
      if (musicWanted) Music.start();
    }
  }

  function renderBoot() {
    clear(0);

    const k = Math.min(1, bootT / BOOT_SCROLL);
    const logoY = Math.round(LOGO_START_Y + (LOGO_REST_Y - LOGO_START_Y) * k);

    drawGrid(DECALS.coconut40, 60, logoY);
    drawTextScaledCentered('COCONUT', logoY + 46, 3, 2);

    if (chimeRung) {
      drawTextCentered('Licensed by Coconut', 116, 2);
    }
  }

  function renderTitle() {
    clear(0);
    drawGrid(DECALS.palm, 64, 18);
    drawTextCentered('THE MISSION', 60, 3);
    drawTextCentered('a coconut story', 74, 2);
    if ((frame >> 5) & 1) {
      drawTextCentered(isTouch ? 'TAP TO START' : 'PRESS ENTER', 108, 3);
    }
    drawTextCentered('arrows move   enter talks', 126, 2);
  }

  let endingShown = false;
  function showEnding() {
    mode = 'ending';
    endingShown = true;
    const overlay = document.getElementById('ending');
    overlay.classList.add('visible');
    document.getElementById('cta').setAttribute('href', BOOK_A_CALL_URL);
    // The button just claimed vertical space; give the canvas its share back.
    fitScreen();
  }

  function renderEnding() {
    clear(0);
    drawGrid(DECALS.palm, 64, 2);
    drawTextCentered(ENDING_CARD.title, 40, 3);
    ENDING_CARD.lines.forEach(function (l, i) {
      drawTextCentered(l, 56 + i * LINE_H, 2);
    });
    fillRect(40, 94, W - 80, 1, 2);
    ENDING_CARD.wins.forEach(function (l, i) {
      drawTextCentered(l, 104 + i * LINE_H, 3);
    });
  }

  // -------------------------------------------------------------------- loop

  let isTouch = false;

  function tick() {
    frame++;

    if (mode === 'power') {
      if (consume('a')) {
        clearPressed();
        // The boot wears the brand's own mint, which is already the green a
        // handheld boot screen wants to be.
        applyPalette(userPalette);
        bootT = 0;
        chimeRung = false;
        mode = 'boot';
      }
      renderPower();
    } else if (mode === 'boot') {
      updateBoot();
      renderBoot();
    } else if (mode === 'title') {
      if (consume('a')) {
        clearPressed();
        mode = 'play';
        say(SCRIPT.intro);
      }
      renderTitle();
    } else if (mode === 'ending') {
      renderEnding();
    } else {
      if (mode === 'play') updatePlay();
      else if (mode === 'dialogue') updateDialogue();
      else if (mode === 'choice') updateChoice();
      else if (mode === 'fadeout') updateFade();

      renderMap();
      if (mode === 'play' && fadeLevel === 0) renderInteractHints();
      // The fade hides the world, but never the words on top of it.
      if (fadeLevel > 0) ditherOver(fadeLevel, 0);
      if (mode === 'dialogue') renderDialogue();
      if (mode === 'choice') renderChoice();
    }

    clearPressed();
    present();
    requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------------- setup

  // Measures what the pad, the bar and the ending button actually take up
  // rather than guessing a fraction of the viewport, so the controls can never
  // be pushed off the bottom of a phone.
  function fitScreen() {
    canvas.style.width = '0px';
    canvas.style.height = '0px';

    let used = 32; // body padding plus the gaps between rows
    ['controls', 'bar', 'ending'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) used += el.offsetHeight;
    });

    const availW = window.innerWidth - 16;
    const availH = window.innerHeight - used;

    let scale = Math.min(availW / W, availH / H);
    // Whole-number scaling keeps the pixels square; only go fractional when
    // there is not even room for 1:1.
    if (scale >= 1) scale = Math.floor(scale);
    if (scale <= 0) scale = Math.max(0.5, Math.min(availW / W, availH / H));

    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
  }

  function boot() {
    const artProblems = validateArt();
    const mapProblems = validateMaps();
    const problems = artProblems.concat(mapProblems);
    if (problems.length) {
      document.getElementById('boot-error').textContent =
        'Art/map problems:\n' + problems.join('\n');
      document.getElementById('boot-error').style.display = 'block';
      return;
    }

    // pointer:coarse is the honest test for a phone. A touchscreen laptop still
    // has a keyboard, and should keep the keyboard hint instead of a d-pad.
    isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (!window.matchMedia && 'ontouchstart' in window);
    if (isTouch) document.body.classList.add('touch');

    userPalette = 'coconut';
    applyPalette(userPalette);
    loadMap('office');
    bindTouchControls();
    fitScreen();
    window.addEventListener('resize', fitScreen);
    window.addEventListener('orientationchange', function () { setTimeout(fitScreen, 120); });

    canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      firstGesture();
      setKey('a', true);
    }, { passive: false });
    canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      setKey('a', false);
    }, { passive: false });
    canvas.addEventListener('mousedown', function () { firstGesture(); setKey('a', true); });
    canvas.addEventListener('mouseup', function () { setKey('a', false); });

    document.getElementById('music-toggle').addEventListener('click', function () {
      firstGesture();
      musicWanted = Music.toggle();
      this.textContent = musicWanted ? 'MUSIC ON' : 'MUSIC OFF';
    });

    // Opt-in inspection hook, used while building and testing the maps.
    if (/(^|[?&])debug=1/.test(location.search)) {
      window.MISSION = {
        state: function () {
          return {
            mode: mode, map: currentMapId, x: player.x, y: player.y, dir: player.dir,
            flags: flags, pageIndex: pageIndex, pageCount: pages.length,
            revealed: revealed, fadeLevel: fadeLevel, keys: JSON.stringify(keys),
          };
        },
        goto: function (id, x, y, dir) {
          flags.hasMessage = true;
          loadMap(id, { x: x, y: y, dir: dir || 'down' });
          mode = 'play';
          fadeLevel = 0;
          fadeDir = 0;
        },
        face: function (d) { player.dir = d; },
        boot: function (t) {
          applyPalette(userPalette);
          mode = 'boot';
          bootT = t === undefined ? 0 : t;
          chimeRung = bootT >= BOOT_SCROLL + BOOT_SETTLE;
        },
        act: function () { mode = 'play'; interact(); },
        skip: function () { mode = 'play'; pages = []; afterDialogue = null; },
      };
    }

    requestAnimationFrame(tick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
