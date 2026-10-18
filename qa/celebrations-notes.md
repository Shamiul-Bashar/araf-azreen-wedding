# Celebrations polish

Only the Celebrations presentation and its event data were changed. The supplied asset is `assets/celebrations-bg.png`; its image bytes, colors and proportions were preserved. The previous working source is in `backup/pre-celebrations-polish.zip`.

Dates come from `js/wedding-config.js`; weekdays are derived from those dates without timezone drift. Mehendi: Tuesday 15 December 2026. Holud: Wednesday 16 December 2026. Reception: Friday 18 December 2026. Wedding date remains 16 December; event times and venue assignments remain null.

Desktop uses the original illustration behind a compact two-column composition. Below 1200px the same artwork supplies disjoint top/bottom framing, at its original aspect ratio, around a single readable content column. This prevents portrait cover-cropping from removing the women or placing Reception over them. No extra floral artwork, grayscale filter, blur or cards were added. A dedicated `assets/celebrations-bg-mobile.jpeg` could improve portrait edge decoration later; it has not been created or requested by the page.

Existing motion handles the scene reveal, masked heading/event titles, staggered dates and copy, and drawing dividers. No new listeners or animation libraries were added.

Verified in headless Chrome at 320, 360, 390, 430, 768 and 1366px: confirmed dates/weekdays, unchanged wedding date, null event times/venues, active motion, reduced motion and no document overflow or runtime errors. Desktop, tablet and mobile screenshots were inspected. Existing Node regression tests passed. HTML outside the Events section matches the backup. Physical-device testing remains outside this check.

Changed app files: `index.html`, `css/styles.css`, `js/main.js`, `js/wedding-config.js`. Added `scripts/events-check.cjs`; adjusted the venue regression check to allow independently confirmed event dates.
