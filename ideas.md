# Ideas for future sessions

Organised from a rough list into groups, with a note on what each would touch
in the current codebase. This is a plan to pick up from, not a full
changelog — see "Done" below for a short record of what's already shipped.

## Done (2026-08-17 – 2026-08-18)

- **Connector line on scroll** — fixed; recomputes on scroll, not just resize.
  Also recoloured to neutral white (was the accent colour, which got
  confusing once dots stopped using it too — see below).
- **Intro/framing copy** — added as a collapsed "A note on this selection"
  section, now styled as a subtle bordered/tinted box.
- **Region colours in the UI** — `REGION_COLORS` moved to `data/regions.js`;
  now used in the intro dots, chip meta text and the detail panel's region
  kicker (colours by the first-named region for multi-region tracks).
- **Wide-screen map/player proportions** — map column capped at 620px; the
  whole page content is now capped at `1360px` and centred, which also
  stopped the player's fixed-aspect-ratio box from ballooning in height on
  very wide screens and pushing the detail panel out of view.
- **Department capitals** — all 32 plotted as small, dim reference labels,
  clearly subordinate to the track dots.
- **Region description layout** — switched from flex-wrap (5 columns + 1
  orphan) to a proper 3-column grid, collapsing to 1 column under 640px.
- **Classification (traditional / fusion / non-traditional)** — added as a
  `classification` column in `data/tracks.csv` (classified by hand), shown
  in the detail panel (with a hover tooltip explaining the category), and
  encoded on map dots by **shape** — circle = traditional, triangle =
  fusion, square = non-traditional (`CLASSIFICATION_SHAPES` in `js/map.js`,
  using `d3.symbol()`) — rather than a second colour, so it doesn't compete
  with the region colours. The same shapes render as small icons on the
  classification filter chips (`js/app.js`). Went through two earlier
  versions: "modern" was dropped for "non-traditional" (implied a
  chronological claim the category wasn't making), and fill/dash/outline
  was dropped for shapes (clearer, especially once dots went neutral —
  see below). A definition list in "A note on this selection" and a
  one-line legend under the filter bar both explain the encoding.
- **Search / filter** — a search box (matches title/artist/genre) plus
  colour-coded region toggle chips and classification toggle chips (with
  shape icons), all combinable. Map dots and the chip list both respect the
  active filters; the "All examples" heading becomes "N of 33 examples"
  when filtered; clears the current selection if it's filtered out; empty
  state when a search matches nothing.
- **Insular region visibility** — San Andrés/Providencia's real geometry is
  only a couple of pixels across at this map's scale, so its region fill
  was effectively invisible (just stray dots in open sea). Replaced with a
  fixed-radius circle (screen px, not projected) in the Insular colour,
  centred between the two islands — reads as a region now, no separate
  zoomed inset panel needed.
- **Dots no longer share the Insular region's colour** — track dots used to
  render in the site's accent colour, which is also the Insular region's
  fill; once Insular became clearly visible (above), every dot on the map
  looked like it belonged to Insular. Unselected dots are now neutral white;
  the accent colour is reserved for the one currently-selected dot.

## A. Map enhancements

1. **Locator inset** — a small corner graphic showing where Colombia sits in
   the Americas, for readers unfamiliar with its location. Simplest version:
   a tiny static SVG/PNG in a fixed corner of the map card, independent of
   the main projection. (The separate San Andrés/Providencia inset this used
   to sit alongside is no longer needed — see "Insular region visibility"
   in Done.)

## B. Track data & classification

2. **Documentary & dance videos** — a way to include non-"one region, one
   song" content, e.g. the 9-minute documentary on Colombian traditional
   music, and videos showing dance alongside the music. These don't fit the
   current one-dot-per-track-per-place model cleanly. Worth deciding:
   - a separate small "further watching" section outside the map (simplest),
     vs.
   - a new `type` column (`song` / `documentary` / `dance`) so they can still
     appear as map dots (a documentary might not have one place, though —
     may need a "national" placement or its own non-map list).

## Open questions for next session

- Documentary/dance videos (B2): confirm placement — map dot vs. separate
  section — before building it.
- Locator inset (A1): confirm whether a simple static image is enough, or if
  it should be a live-rendered mini-map matching the main map's style.
