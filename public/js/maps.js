// Map definitions.
//
// ground legend:  # wall   _ wall with baseboard   . floor   r rug   p planks
// Objects carry an optional dy so wall decorations can hang above the tile the
// player actually interacts with (you stand on the floor and face the baseboard,
// but the picture reads as being up on the wall).

const GROUND_LEGEND = {
  '#': 'wall',
  '_': 'wallbase',
  '.': 'floor',
  'r': 'rug',
  'p': 'planks',
};

const MAPS = {
  office: {
    name: 'THE OFFICE',
    // Two rows taller than the screen so the camera can keep the player
    // centred, clear of the dialogue box that covers the bottom third.
    ground: [
      '##########',
      '##########',
      '__________',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ],
    objects: [
      { x: 1, y: 2, t: 'windowNight', dy: -16 },
      { x: 4, y: 2, t: 'clock', dy: -16 },
      { x: 6, y: 2, t: 'calendar', dy: -16 },
      { x: 8, y: 2, t: 'notes', dy: -16 },
      { x: 3, y: 3, t: 'desk' },
      { x: 4, y: 3, t: 'desk' },
      { x: 5, y: 3, t: 'desk' },
      { x: 6, y: 3, t: 'desk' },
      { x: 3, y: 3, t: 'mug', dy: -12 },
      { x: 4, y: 3, t: 'monitor', dy: -12 },
      { x: 6, y: 3, t: 'laptop', dy: -12 },
      { x: 5, y: 4, t: 'chair' },
      { x: 1, y: 6, t: 'plant' },
      { x: 8, y: 7, t: 'stairs' },
    ],
    solid: ['3,3', '4,3', '5,3', '6,3', '5,4', '1,6', '8,7'],
    interact: {
      '1,2': 'window',
      '4,2': 'clock',
      '6,2': 'calendar',
      '8,2': 'notes',
      '3,3': 'mug',
      '4,3': 'monitor',
      '5,3': 'desk',
      '6,3': { action: 'laptop' },
      '5,4': 'chair',
      '1,6': 'plant',
      '8,7': { action: 'stairs' },
    },
    spawn: { x: 4, y: 5, dir: 'up' },
  },

  house: {
    name: 'DOWNSTAIRS',
    ground: [
      '################',
      '################',
      '________________',
      '................',
      '................',
      '................',
      '.....rrrrrr.....',
      '.....rrrrrr.....',
      '.....rrrrrr.....',
      '................',
      '################',
    ],
    objects: [
      { x: 1, y: 3, t: 'stairs' },
      { x: 1, y: 2, t: 'windowNight', dy: -16 },
      { x: 2, y: 3, t: 'bookshelf' },
      { x: 6, y: 4, t: 'table' },
      { x: 6, y: 4, t: 'mug', dy: -7 },
      { x: 10, y: 2, t: 'frame', dy: -16 },
      { x: 13, y: 2, t: 'clock', dy: -16 },
      { x: 3, y: 2, t: 'frame', dy: -16 },
      // No dy: a hearth has to meet the floor, unlike the framed pictures.
      { x: 4, y: 2, t: 'fireplace' },
      { x: 12, y: 2, t: 'frame', dy: -16 },
      { x: 13, y: 3, t: 'bookshelf' },
      { x: 14, y: 3, t: 'bookshelf' },
      { x: 4, y: 4, t: 'armchair' },
      { x: 2, y: 5, t: 'gramophone' },
      { x: 10, y: 5, t: 'table' },
      { x: 10, y: 5, t: 'binder', dy: -7 },
      { x: 14, y: 8, t: 'plant' },
      { x: 1, y: 9, t: 'coconut' },
      { x: 7, y: 10, t: 'door' },
    ],
    // The world map is a 32x32 decal rather than four tiles, so it can sit
    // high on the wall while staying reachable from the floor below.
    decals: [{ x: 7, y: 2, dy: -24, t: 'worldmap' }],
    solid: ['13,3', '14,3', '4,4', '2,5', '10,5', '14,8', '1,9', '2,3', '6,4'],
    interact: {
      '1,2': 'windowHouse',
      '2,3': 'shelfRoles',
      '6,4': 'warmCoffee',
      '10,2': 'trialCard',
      '13,2': 'clockHouse',
      '3,2': 'sampler',
      '4,2': 'fireplace',
      '7,2': 'southAmerica',
      '8,2': 'philippines',
      '6,2': 'worldmapEdge',
      '9,2': 'worldmapEdge',
      '12,2': 'photo',
      '13,3': 'shelfEarly',
      '14,3': 'shelfNow',
      '4,4': 'armchair',
      '2,5': { action: 'gramophone' },
      '10,5': 'binder',
      '14,8': 'plant',
      '1,9': 'coconut',
      '7,10': { action: 'door' },
    },
    warps: {
      '1,3': { to: 'office', x: 8, y: 6, dir: 'down' },
    },
    spawn: { x: 1, y: 4, dir: 'down' },
  },
};

// Tiles the player can never stand on, derived once at load.
function buildCollision(map) {
  const blocked = new Set(map.solid || []);
  for (let y = 0; y < map.ground.length; y++) {
    const row = map.ground[y];
    for (let x = 0; x < row.length; x++) {
      const kind = GROUND_LEGEND[row[x]];
      if (kind === 'wall' || kind === 'wallbase') blocked.add(x + ',' + y);
    }
  }
  // Warp tiles are walked onto, never blocked.
  for (const key in (map.warps || {})) blocked.delete(key);
  return blocked;
}

function validateMaps() {
  const problems = [];
  for (const id in MAPS) {
    const map = MAPS[id];
    const w = map.ground[0].length;
    map.ground.forEach((row, y) => {
      if (row.length !== w) problems.push(id + ' ground row ' + y + ': width ' + row.length + ', expected ' + w);
      for (const ch of row) {
        if (!GROUND_LEGEND[ch]) problems.push(id + ' ground row ' + y + ': unknown tile "' + ch + '"');
      }
    });
    (map.objects || []).forEach((o) => {
      if (!OBJECTS[o.t]) problems.push(id + ': unknown object "' + o.t + '"');
    });
    (map.decals || []).forEach((d) => {
      if (!DECALS[d.t]) problems.push(id + ': unknown decal "' + d.t + '"');
    });
    map.width = w;
    map.height = map.ground.length;
    map.blocked = buildCollision(map);
  }
  return problems;
}
