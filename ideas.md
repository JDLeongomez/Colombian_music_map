# Ideas for future sessions

Organised from a rough list into groups, with a note on what each would touch
in the current codebase. Nothing here is implemented yet — this is a plan to
pick up from, not a changelog.

## A. Intro / framing content

The page currently opens straight into the region blurbs with no framing
text. Add an author's-note section (in `index.html`, near the `<header>`)
covering:

- This is one person's superficial, personal selection, not an expert or
  musicological survey — background in music, but not a Colombian-music
  specialist.
- A preference for videos of live performances.
- A bias towards older/traditional over very modern music, and specifically:
  no mainstream modern acts (Shakira, Karol G, etc.) and no reggaetón, despite
  it dominating popular Colombian music today.
- The info can be wrong or incomplete — link out to the GitHub repo (once
  this is on GitHub Pages) so people can correct or extend it.
- The goal is just to highlight the diversity of Colombian music, not to be
  comprehensive.
- A recognised extra emphasis on Afro-Colombian influence specifically,
  alongside the broader indigenous/African/European mix.
- The "Land of a Thousand Rhythms" framing (1,025+ folkloric rhythms) and the
  geography → isolation → regional diversity connection (mountains,
  rainforest, plains largely cut off from each other).

This is copy-only work (plus maybe a small collapsible/`<details>` component
if it runs long) — no data model changes.

## B. Map enhancements (`js/map.js`, `assets/`)

1. **Locator inset** — a small corner graphic showing where Colombia sits in
   the Americas, for readers unfamiliar with its location. Simplest version:
   a tiny static SVG/PNG in a fixed corner of the map card, independent of
   the main projection.
2. **San Andrés & Providencia inset** — at the main map's scale these two
   islands are just dots; their shapes aren't visible. Add a zoomed-in inset
   box (similar in spirit to the reference map's callout circles) so their
   actual outlines show. Ties into the `Insular` region polygon already in
   `assets/colombia-regions.geojson`.
3. **Department capitals / major cities** — plot city labels (at least
   department capitals) as a reference layer, styled clearly subordinate to
   the track dots (smaller, dimmer) so they don't compete for attention.
   Needs a small hardcoded lat/lon list (33 capitals) — no external data
   dependency needed.

## C. Track data & classification

4. **Traditional / modern / in-between per track** — add an `era` (or
   similar) column to `data/tracks.csv` (e.g. `traditional` /
   `in-between` / `modern`), show it in the detail panel, and consider
   encoding it visually on the map dots (e.g. fill vs. outline, or a shape
   difference) rather than introducing a second colour dimension that would
   compete with the region colours already carried by dot position/fill.
5. **Documentary & dance videos** — a way to include non-"one region, one
   song" content, e.g. the 9-minute documentary on Colombian traditional
   music, and videos showing dance alongside the music. These don't fit the
   current one-dot-per-track-per-place model cleanly. Worth deciding:
   - a separate small "further watching" section outside the map (simplest),
     vs.
   - a new `type` column (`song` / `documentary` / `dance`) so they can still
     appear as map dots (a documentary might not have one place, though —
     may need a "national" placement or its own non-map list).

## D. Discovery / UX

6. **Search / filter** by region, genre, artist, and (once added) era. Given
   the current chip list (`#chip-list` in `js/app.js`) already renders every
   track, this is mainly: filter state + filtering the chip/dot render, plus
   simple filter controls in the UI (buttons or a small form). No new data
   needed beyond what's already in the CSV (plus `era` from item 4 if that
   lands first).

## E. Layout / responsive

7. **Map panel is too wide on wide screens** — the `.cx-main-grid` split
   (`styles.css`, currently `1.6fr 1fr`) gives the map card a fixed width
   that, on wide viewports, is much wider than Colombia's own aspect ratio
   needs — `computeProjection` in `js/map.js` fits to Colombia's real bounds,
   so the map content ends up centred in a mostly-empty card with large dead
   space on both sides (see screenshot from 2026-08-17). At the same time the
   player column is comparatively small. On wide screens, narrow the map
   column (cap its width, or size it from the map's actual aspect ratio
   instead of a fixed `fr` share) and give the freed-up width to the
   player/detail column so the video renders larger. Should stay a two-column
   layout only above the existing `900px` breakpoint; narrow screens already
   stack to one column and aren't affected.
8. **Connector line shifts on scroll and loses alignment with the map and player** 
   The dotted line linking the example track on the map to the player moves as the page scrolls, causing it to miss both endpoints. This is especially problematic on narrow screens, where the player appears below the map. As you scroll vertically, the line moves with the page instead of continuing to connect the elements it is meant to link..

## Suggested order

Roughly cheapest/most independent first:

1. Intro/framing copy (A) — no code dependencies, pure content.
2. Wide-screen map/player proportions (E7) — CSS-only, fixes a real visual
   waste of space visible today.
3. Department capitals (B3) — additive, low risk.
4. Era classification (C4) — needed before filtering by era (D6) makes sense.
5. Search/filter (D6).
6. Locator inset + San Andrés/Providencia inset (B1, B2) — more fiddly SVG/
   layout work.
7. Documentary/dance content (C5) — needs a product decision first (see
   below) before it's a coding task.

## Open questions for next session

- Documentary/dance videos (C5): confirm placement — map dot vs. separate
  section — before building it.
- Era classification (C4): confirm the exact category set (traditional /
  modern / in-between, or something finer) and how it should read visually
  on the map dots.
- Locator inset (B1): confirm whether a simple static image is enough, or if
  it should be a live-rendered mini-map matching the main map's style.
