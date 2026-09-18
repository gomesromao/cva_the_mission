// 8x8 bitmap font: 5px glyph body, 6px advance.
// Each glyph is 8 rows packed as 16 hex chars; bit 7 is the leftmost pixel.
// Hand-authored so every screen looks identical in Safari, Chrome and Firefox
// instead of depending on the host's font stack.

const FONT_GLYPHS = {
  ' ': '0000000000000000',
  'A': '708888F888888800',
  'B': 'F08888F08888F000',
  'C': '7088808080887000',
  'D': 'E09088888890E000',
  'E': 'F88080F08080F800',
  'F': 'F88080F080808000',
  'G': '7088809888887000',
  'H': '888888F888888800',
  'I': '7020202020207000',
  'J': '3810101010906000',
  'K': '8890A0C0A0908800',
  'L': '808080808080F800',
  'M': '88D8A88888888800',
  'N': '88C8A89888888800',
  'O': '7088888888887000',
  'P': 'F08888F080808000',
  'Q': '70888888A8906800',
  'R': 'F08888F0A0908800',
  'S': '7088807008887000',
  'T': 'F820202020202000',
  'U': '8888888888887000',
  'V': '8888888888502000',
  'W': '888888A8A8D88800',
  'X': '8888502050888800',
  'Y': '8888502020202000',
  'Z': 'F80810204080F800',
  'a': '0000700878887800',
  'b': '8080F0888888F000',
  'c': '0000708880887000',
  'd': '0808788888887800',
  'e': '00007088F8807000',
  'f': '3040F04040404000',
  'g': '0000788878087000',
  'h': '8080F08888888800',
  'i': '2000602020207000',
  'j': '1000101010906000',
  'k': '808090A0C0A09000',
  'l': '6020202020207000',
  'm': '0000D8A8A8A8A800',
  'n': '0000F08888888800',
  'o': '0000708888887000',
  'p': '0000F08888F08080',
  'q': '0000788888780808',
  'r': '0000B0C080808000',
  's': '000078807008F000',
  't': '4040F04040483000',
  'u': '0000888888887800',
  'v': '0000888888502000',
  'w': '00008888A8A85000',
  'x': '0000885020508800',
  'y': '0000888878087000',
  'z': '0000F8102040F800',
  '0': '708898A8C8887000',
  '1': '2060202020207000',
  '2': '708808102040F800',
  '3': 'F810201008887000',
  '4': '10305090F8101000',
  '5': 'F880F00808887000',
  '6': '384080F088887000',
  '7': 'F808102040404000',
  '8': '7088887088887000',
  '9': '708888780810E000',
  '.': '0000000000606000',
  ',': '0000000000303060',
  "'": '2020000000000000',
  '!': '2020202020002000',
  '?': '7088081020002000',
  ':': '0060600060600000',
  ';': '006060006060C000',
  '"': '5050000000000000',
  '(': '1020404040201000',
  ')': '4020101010204000',
  '/': '0810102040408000',
  '-': '000000F800000000',
  '+': '002020F820200000',
  '%': '8810204088000000',
  '&': '60909060A8906800',
  '=': '0000F800F8000000',
  '$': '2078A07028F02000',
  '#': '50F850F850000000',
  '*': '00A870F870A80000',
  // \x01 is the blinking "press A for more" triangle in the dialogue box.
  '\x01': '0000F87020000000',
};

const GLYPH_ADVANCE = 6;
const GLYPH_HEIGHT = 8;

// Unpacked once so the render loop never parses strings.
const FONT = (function buildFont() {
  const table = Object.create(null);
  for (const ch in FONT_GLYPHS) {
    const hex = FONT_GLYPHS[ch];
    const rows = new Uint8Array(8);
    for (let r = 0; r < 8; r++) rows[r] = parseInt(hex.substr(r * 2, 2), 16);
    table[ch] = rows;
  }
  return table;
})();

function glyphFor(ch) {
  return FONT[ch] || FONT['?'];
}

// Greedy wrap on spaces. maxChars is how many glyphs fit on one dialogue line.
function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!line.length) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ' ' + word;
    else { lines.push(line); line = word; }
  }
  if (line.length) lines.push(line);
  return lines;
}
