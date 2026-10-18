# ARAF & AZREEN — cinematic wedding invitation

A buildless HTML, CSS and vanilla JavaScript invitation. No installation, bundler or backend required.

## Run

Open `index.html` with VS Code **Live Server**. Alternatively, run `python -m http.server 5500` from this folder and visit `http://localhost:5500`.

## What is included

Nine continuous sections: original hero, Our Story, Save the Date, Mehendi/Holud/Reception, Moments & Memories gallery, venue, RSVP, wedding wishes, and cinematic closing. The hero preserves its 450px desktop width. Sections 02?09 now expand into deliberate editorial desktop layouts and stack naturally on mobile. They include scroll reveals, reduced-motion handling, safe map links, downloadable calendar files, and optional user-started music.

`backup/index.original.html` is an exact copy of the original file. The hero's styles, interior markup, Arabic, translation, image, typewriter and Replay Motion script are retained. Its former main element is now a section within the page's main landmark. Additional styles are scoped to `.chapters`; the hero itself retains its original width, centered in the wider page.

## Edit details

Edit `js/wedding-config.js`:

- `couple`: names used in the new sections. The original hero text remains deliberately untouched; change that manually in `index.html` only when intended.
- `story`: edit the current story copy.
- `wedding.date`: ISO date (`2026-12-16`). `time`: 24-hour `HH:mm` or null. Timezone defaults to `Asia/Dhaka`.
- `events`: reorder this array to change the presentation order. Add confirmed date, time, venue, address, description and mapsUrl independently. No event inherits the wedding date.
- `venue`: add name, address, city, time and an actual HTTP(S) mapsUrl. No directions link is shown without a valid URL.
- `rsvp.isOpen`: null means automatic; true explicitly reopens; false closes. `closeAfterWedding` closes automatically after the wedding date ends in the configured timezone.
- `wedding.endTime` or an event's `endTime`: add together with date and start time to enable an accurate .ics download. End must be later on the same day. Overnight calendar events are not supported in this version. Calendar dates are exported in UTC.

The site uses the visitor's actual clock. The supplied brief described December 18 as the current date, while this project's session date was October 18, 2026. No clock is hardcoded. Before the date it counts to the specified time, or midnight in Dhaka if time is unknown (explicitly described as a countdown to the date). On the date it shows a wedding-day state; afterward it says “Celebrated on 16 December 2026.” No negative countdown is displayed.

## Add photographs and music

Place real files in `assets/`:

- `story-bg.png` — Our Story
- `save-date.png` — optional date background
- `closing.jpeg` — closing photograph
- `gallery-1.jpeg` through `gallery-4.jpeg` — gallery
- `music.mp3` — your supplied/licensed soundtrack

The existing `bride.jpeg` remains the hero photograph. Missing optional photographs use warm editorial backgrounds; the gallery displays a coming-soon message. No fake images or audio files are generated.

After adding or removing assets, run:

```powershell
python scripts/update-assets.py
```

This refreshes `availableAssets` inside the configuration, preventing requests to missing files. Alternatively edit that array manually. If filenames differ, also update `photos` / `music.src`. Gallery entries may be strings or `{ src: 'assets/photo.jpeg', alt: 'Your meaningful description' }` objects. All photography is displayed in grayscale. The gallery supports native dialog focus containment, focus restoration, animated Escape closing, arrow keys, swipe and touch-sized buttons.

Music stays unavailable until registered in the asset inventory. It never autoplays, starts only on a button press, and continues across scrolling. Set `music.volume` between 0 and 1. Pause/resume uses the same audio instance.

## Demo storage and production

RSVP and wishes are **browser-local demos**. They do not reach the couple, synchronize between devices, or appear publicly. Storage keys are `aa-wedding:rsvps` and `aa-wedding:wishes`; data remains on that browser and origin until site data is cleared. Changing Live Server ports creates a different storage origin. Forms handle blocked/full storage without falsely reporting success. Guest content is inserted as plain text.

The local adapter in `js/rsvp.js` is the replacement point for a real service. Before production, connect and test a backend, validation, moderation and appropriate access controls. Setting `demoMode: false` disables submissions; it does not invent a backend. Never put service credentials in frontend JavaScript.

Before launch: supply final photographs/licensed music, connect the real forms, and review the website on actual phones and browsers.

## Files and checks

- `index.html`: preserved hero plus all section markup.
- `css/styles.css`, `css/animations.css`: isolated styling and motion.
- `js/wedding-config.js`: wedding data and asset inventory.
- `js/main.js`: date/time logic, events, venue, calendar and photo setup.
- `js/motion.js`: single site-wide motion controller, typed titles, viewport reveals and progress.
- `scripts/browser-check.cjs`, `scripts/motion-check.cjs`: optional Chrome integration checks.
- `js/gallery.js`, `js/music.js`, `js/rsvp.js`: independent interactions.
- `scripts/update-assets.py`: optional asset inventory helper.
- `scripts/check.cjs`: dependency-free Node checks.

Run `node scripts/check.cjs`. The checks cover original hero source preservation, Dhaka date boundaries, past/future states, RSVP overrides, storage and failure handling, declined guest count, guestbook rendering, safe URLs, gallery navigation and calendar prerequisites. Interaction checks use a simulated DOM; they are not browser tests.

The redesign was verified in local headless Chrome. See `REDESIGN-NOTES.md` for the audit, motion by section, test results and limitations. Screenshots are in `qa/`, and machine-readable layout/motion results are in `qa/browser-results.json`. The website has no new runtime dependencies; Playwright Core was installed only in the system temporary directory for QA.

## Motion customization

`js/motion.js` initializes once after the data and interaction scripts. Add `data-reveal` to a new element for an entrance, or choose `data-reveal="mask"`, `"line"`, `"image"`, `"left"` or `"right"`. `data-delay="160"` adds a stagger in milliseconds. `data-type` performs real sequential text insertion and reserves the full text's layout. Use typing only on simple text headings; do not apply it to text that another script updates, such as the countdown.

Reveals run once as each element enters view. Scrolling backward leaves the final text visible. Photos breathe only while their scene is visible; subtle camera offset uses one scroll animation frame. Reduced-motion settings stop active animation and complete typing immediately. Content remains readable without IntersectionObserver or the animation module.

The pre-redesign working snapshot is `backup/pre-redesign-20261018-154254.zip`; extract to a separate directory to restore or compare the complete previous working version. `backup/index.original.html` remains the untouched original hero source.

## Optional browser regression checks

Live Server is enough to run the site. Browser QA helpers additionally require Node, installed Chrome and Playwright Core outside the project. In PowerShell:

```powershell
npm install --prefix "$env:TEMP/araf-azreen-browser-qa" --no-save --no-audit --no-fund playwright-core
python -m http.server 5500 --bind 127.0.0.1
```

In a second terminal, launch an isolated headless Chrome instance:

```powershell
$qaProfile = Join-Path $env:TEMP 'araf-azreen-chrome-qa'
Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -WindowStyle Hidden -ArgumentList @('--headless=new', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9223', ('--user-data-dir="' + $qaProfile + '"'), '--no-first-run', '--no-default-browser-check', 'about:blank')
node scripts/browser-check.cjs
node scripts/motion-check.cjs
```

These use isolated browser contexts and in-memory optional-asset fixtures, never real RSVP submissions or production asset changes. Stop the test server and isolated Chrome instance afterward. Physical iOS/Android touch behavior and Safari/Firefox still need device testing.

## Current completion audit

Confirmed event details and the individually polished sections are retained. Gallery photos 1 and 2 are now registered; missing photos 3 and 4 are skipped. The Venue uses overlapping reveals finishing in 630ms, with no continuous photo zoom. Reception details are read from the event configuration. Music and the closing photo remain optional missing assets. RSVP and wishes remain local demos.
