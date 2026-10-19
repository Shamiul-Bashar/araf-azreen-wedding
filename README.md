# ARAF & AZREEN — cinematic wedding invitation

A buildless HTML, CSS and vanilla JavaScript invitation. No installation, bundler or self-hosted backend required. RSVP uses Google Forms, and Wedding Wishes uses Formspree.

## Run

Open `index.html` with VS Code **Live Server**. Alternatively, run `python -m http.server 5500` from this folder and visit `http://localhost:5500`.

## What is included

Nine continuous sections: original hero, Our Story, Save the Date, Mehendi/Holud/Reception, Moments & Memories gallery, venue, RSVP, wedding wishes, and cinematic closing. The landscape hero fills the viewport width. The remaining sections use editorial desktop layouts and responsive mobile compositions. They include scroll reveals, reduced-motion handling, safe map links, downloadable calendar files, and a developer portfolio footer.

The introduction types the couple names over a charcoal background with subtle gold particles, then fades out at approximately 3.45 seconds. A separate 4.2-second watchdog releases the page if the intro module fails. Skip Intro, reduced motion and JavaScript-disabled fallbacks are supported. Hero animation starts after the introduction finishes.

## Edit details

Edit `js/wedding-config.js`:

- `couple`: names used in the new sections. The original hero text remains deliberately untouched; change that manually in `index.html` only when intended.
- `story`: edit the current story copy.
- `wedding.date`: ISO date (`2026-12-16`). `time`: 24-hour `HH:mm` or null. Timezone defaults to `Asia/Dhaka`.
- `events`: reorder this array to change the presentation order. Add confirmed date, time, venue, address, description and mapsUrl independently. No event inherits the wedding date.
- `venue`: add name, address, city, time and an actual HTTP(S) mapsUrl. No directions link is shown without a valid URL.
- `rsvp.isOpen`: null means automatic; true explicitly reopens; false closes. `closeAfterWedding` closes automatically after the wedding date ends in the configured timezone.
- `rsvp.googleForms`: Google Forms public responder and POST URLs, the three `entry.*` field IDs, and exact attendance-choice text. These are public identifiers, not secrets. Check the published form if any question or choice is edited.
- `wedding.endTime` or an event's `endTime`: add together with date and start time to enable an accurate .ics download. End must be later on the same day. Overnight calendar events are not supported in this version. Calendar dates are exported in UTC.

The site uses the visitor's actual clock. The supplied brief described December 18 as the current date, while this project's session date was October 18, 2026. No clock is hardcoded. Before the date it counts to the specified time, or midnight in Dhaka if time is unknown (explicitly described as a countdown to the date). On the date it shows a wedding-day state; afterward it says “Celebrated on 16 December 2026.” No negative countdown is displayed.

## Photographs

Place real files in `assets/`:

- `story-bg.png` — Our Story
- `save-date.png` — optional date background
- `closing-bg.png` — closing photograph
- `gallery-1.jpeg` through `gallery-4.jpeg` — gallery
- `music.mp3` — your supplied/licensed soundtrack

The existing `bride.jpeg` remains the hero photograph. Missing optional photographs use warm editorial backgrounds; the gallery skips missing entries. No fake images or audio files are generated.

After adding or removing assets, run:

```powershell
python scripts/update-assets.py
```

This refreshes `availableAssets` inside the configuration, preventing requests to missing files. Alternatively edit that array manually. If filenames differ, also update `photos` / `music.src`. Gallery entries may be strings or `{ src: 'assets/photo.jpeg', alt: 'Your meaningful description' }` objects. Hero, story, date and gallery retain their monochrome treatment; the closing photograph retains its color. The gallery supports native dialog focus containment, focus restoration, animated Escape closing, arrow keys, swipe and touch-sized buttons.

The old music footer has been replaced by developer attribution and a real portfolio link. The retained music module exits without creating audio when its controls are absent.

## RSVP — Google Forms integration (pending real submission verification)

The RSVP form now sends three public fields (**name**, **attendance**, and **optional note**) to the configured Google Form via an ordinary cross-origin POST request. Guest count has been removed from the website and is not submitted. The original invitation layout is preserved. A fallback link opens the Google Form directly.

**Important:** Google Forms does not expose a CORS-readable delivery receipt for this approach. A fulfilled `no-cors` request can still correspond to a rejected form response (for example, when an attendance answer is misspelled or Google requires sign-in). The UI keeps this limitation unobtrusive: no permanent technical notice beneath the RSVP form; after sending, a brief line says the request **was sent**, not that Google has **received** it. On network failure, a direct Google Form fallback link appears. Do not display a guaranteed delivery-success message without a readable server receipt. If verified acknowledgements are required, replace the direct POST with a properly deployed Google Apps Script or other same-origin backend.

Before using this for real guests:
1. Publish the Google Form with anonymous responder access, and keep its three original question IDs.
2. Check **both exact attendance choice values** in `js/wedding-config.js`. The owner corrected the "yes" choice to `Yes, I'll be there`; the "no" choice is also corrected to `Sorry, I won't be able to attend` as confirmed by the form owner. Both choices still require a real end-to-end test.
3. Manually send an actual RSVP from the website using a unique test name and optional note, then open Google Forms → Responses in the owning account. Verify that all three answers are present under the correct questions. Repeat for the other attendance choice and remove the two test responses.
4. Test from a private/incognito browser and mobile browser without signing in to Google. If responses do not arrive, do not treat the request as successfully delivered.
5. Run the regression scripts; these stub network requests and intentionally do **not** send data to the real Google Form.

**Wedding Wishes** now submits guest **name** and **message** directly to the supplied public Formspree endpoint: `https://formspree.io/f/mgaoqqbp`. The editable form action lives in `index.html` and provides a native HTML submit fallback without JavaScript; `js/rsvp.js` enhances it with an asynchronous `fetch` that requires an actual `response.ok` before confirming submission. Failed requests preserve the guest's message. There is no browser-local wish storage, public wishes gallery, or permanent technical disclaimer in this section.

To receive email notifications, verify the form-owner email address and enable/configure email notifications in the Formspree dashboard for the correct Gmail. Submit **one uniquely named real test wish from the website**, check Formspree's Submissions dashboard, Gmail Inbox **and Spam**, then remove the test submission if possible. A successful Formspree response means the provider accepted the submission; it does not guarantee immediate Gmail delivery. Depending on the Formspree plan, monthly submission limits and anti-spam protections may apply. No API key or password belongs in frontend JavaScript. Review protection against automated spam before distributing the invitation.

## Files and checks

- `index.html`: preserved hero plus all section markup.
- `css/styles.css`, `css/animations.css`: section styling and motion.
- `css/intro.css`, `js/intro.js`: isolated cinematic introduction.
- `js/wedding-config.js`: wedding data and asset inventory.
- `js/main.js`: date/time logic, events, venue, calendar and photo setup.
- `js/motion.js`: single site-wide motion controller, typed titles, viewport reveals and progress.
- `scripts/browser-check.cjs`, `scripts/motion-check.cjs`: optional Chrome integration checks.
- `js/gallery.js`, `js/music.js`, `js/rsvp.js`: independent interactions.
- `scripts/update-assets.py`: optional asset inventory helper.
- `scripts/check.cjs`: dependency-free Node checks.

Run `node scripts/check.cjs`. The checks cover Dhaka date boundaries, past/future states, RSVP overrides and mocked Google Forms payloads, mocked Formspree Wishes payloads, safe URLs, gallery navigation and calendar prerequisites. Interaction checks use a simulated DOM; they are not browser tests.

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
node scripts/date-check.cjs
node scripts/events-check.cjs
node scripts/venue-check.cjs
node scripts/wishes-check.cjs
node scripts/rsvp-check.cjs
node scripts/intro-check.cjs
```

These use isolated browser contexts and mocked external form submissions, never real RSVP responses, Formspree emails, or production asset changes. Stop the test server and isolated Chrome instance afterward. Physical iOS/Android touch behavior and Safari/Firefox still need device testing.

## Current completion audit

Confirmed event details and the individually polished sections are retained. Gallery photos 1 and 2 are now registered; missing photos 3 and 4 are skipped. The Venue uses overlapping reveals finishing in 630ms, with no continuous photo zoom. Reception details are read from the event configuration. The closing photo is supplied as `assets/closing-bg.png`. The developer footer links to https://shamiul-dev.vercel.app/. RSVP sends requests to Google Forms; the owner has confirmed a real Yes response arrived, but the No case still needs checking. Wishes now submits to Formspree and requires a real Formspree dashboard + Gmail notification test.
