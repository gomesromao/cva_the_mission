# THE MISSION

A short handheld-style browser game. You are a founder who cannot find time,
until a message from Coconut suggests the time was never missing in the first
place. It runs about two and a half minutes straight through, with more to find
if you wander.

Everything renders into a 160x144 pixel buffer, the real Game Boy resolution,
scaled up by whole numbers. No engine and no build step. The tiles, the
character, the font and the boot chime are authored in this repo as data; the
only binary asset is the theme.

It opens the way the handheld did: press to power on, the Coconut mark slides
down the screen, it rings, and then the title. The mark is converted straight
from the brand PNG rather than redrawn by eye.

**Music:** `public/audio/theme.mp3` is *Midnight Pixel Path* by gomesromao, the
first 63 seconds of the original, before the vocal comes in. It is looped with a
crossfade rather than with `loop=true`, because its tail sits about 12dB below
its head and butting the two together puts an audible jump every lap.

## Running it locally

No install, no build.

```bash
cd public
python -m http.server 8777
# then open http://127.0.0.1:8777/
```

Add `?debug=1` to the URL to get a `window.MISSION` helper for jumping around
the maps while working on them.

Note that the password gate does **not** run locally, only on Vercel. Locally
you go straight into the game.

## The password gate

The game is private. `middleware.js` redirects every request to `/login.html`
until the visitor has a valid cookie, and `api/login.js` issues that cookie only
for the correct password.

**The password is never in this repo.** It lives in a single Vercel environment
variable, and both halves of the gate derive the same cookie value from it
independently. That is what lets this repository stay public.

To set it up:

1. Vercel project > Settings > Environment Variables
2. Add `GAME_PASSWORD`, set the value, tick Production, Preview and Development
3. Redeploy

Until that variable exists the site answers `503` with an explanation rather
than serving the game unprotected. To change the password later, edit the
variable and redeploy; everyone's saved cookie stops working immediately.

## Controls

| | |
|---|---|
| Arrow keys or WASD | walk |
| Enter, Space or Z | talk, read, confirm |
| M | music on/off |
| P | cycle palette (Coconut / classic green / warm) |

On phones and tablets an on-screen pad appears instead, and the prompt reads A
rather than ENTER. The gramophone in the living room toggles the music too.

Whatever you need to do next carries comic-style emphasis marks the whole time,
so there is always somewhere to head for. Everything else takes a turn: one
unread object at a time is marked, more faintly, for five to ten seconds before
the marks move on. Walk up to anything marked and an ENTER tag appears above it.
Once you have read something it stops being picked, so the marks quietly track
what you have not found.

## Layout

```
public/
  index.html        game shell
  login.html        password page (the only ungated page)
  style.css         page chrome and the touch controls
  audio/theme.mp3   the looping theme
  js/font.js        8x8 bitmap font, authored as hex
  js/sprites.js     tiles, the walking character, the big decals, palettes
  js/maps.js        the two rooms: layout, collision, what is interactive
  js/script.js      every line of text, plus the booking link
  js/audio.js       two-voice chiptune loop built from oscillators
  js/game.js        engine: rendering, movement, dialogue, fades
api/login.js        password check, issues the cookie
middleware.js       the gate
```

## Editing the writing

All of it is in `public/js/script.js`. Each entry is a list of paragraphs; the
dialogue box wraps and paginates them, so write plain sentences and ignore line
lengths. `BOOK_A_CALL_URL` at the top of that file is where the ending button
points.

## Editing the art

`public/js/sprites.js`. Every tile is 16 rows of 16 characters, where `.` is
transparent and `0` to `3` are the four palette tones, lightest to darkest. A
mistyped row is caught at boot and reported on screen instead of quietly
corrupting the display.
