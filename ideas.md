# Ideas for future sessions

Organised from a rough list into groups, with a note on what each would touch
in the current codebase. This is a plan to pick up from, not a full
changelog — see "Done" below for a short record of what's already shipped.

## Done (2026-08-17 – 2026-08-18)

- **Featured documentary** — a general-interest documentary with no single
  place to plot ("Introduction to Colombian Music") is now suggested (cued,
  not autoplaying) in the player on first load, with a "Documentary" card in
  the detail panel, until the visitor picks a real track — after that it
  never comes back uninvited (a filter clearing the selection goes to the
  plain empty state, not back to the documentary, so it can't interrupt
  something the visitor is actively watching). Lives as a small `FEATURED_VIDEO`
  constant in `js/app.js`, not in `tracks.csv` — no lat/lon/region/
  classification to force in for one item. `js/player.js`'s `play()` gained
  an `{ autoplay }` option and a `suggest()` wrapper for this. This resolves
  the "separate section vs. `type` column" question in "Documentary & dance
  videos" below, but only for content with no location — see that item for
  what's left (dance videos, and other documentaries that DO have a fairly
  precise place, e.g. alabaos del Pacífico/Bojayá, Carnaval de Blancos y
  Negros de Pasto).
- **Cluster count badge** — map dots that shared a spot used to always fan
  out with connector spokes, all visible at once (worst case: Bogotá, 6-8
  tracks depending on viewport). Groups of 3+ now collapse into a single
  numbered badge, expanding to the fanned dots on hover or click/tap, and
  collapsing on click-away — pairs are unaffected (still always fanned, too
  small to bother collapsing). Selecting a track inside a collapsed cluster
  (e.g. from the chip list) force-expands it, since the connector line to
  the player needs a real dot to point at. Entirely contained in
  `js/map.js` (`clusterDots`, plus a new `clusterLayer`) — no changes to
  `app.js`, CSS, or data.
- **Locator inset** — a small fixed-corner graphic in the map card showing
  Colombia (accent colour) against a muted silhouette of the Americas
  (Mexico down to Argentina/Chile; Canada omitted to keep the shape tight),
  for readers unfamiliar with where Colombia sits. Built as a static SVG
  (`assets/locator-americas.svg`) baked once from `world-atlas`'s 110m
  country topology (decoded and reprojected offline, not at runtime — no
  new runtime dependency), independent of the main map's projection so it
  doesn't move or resize with it. Known island outliers (Alaska, Hawaii,
  Galápagos, Easter Island, Juan Fernández) excluded by hand for a cleaner
  silhouette; San Andrés/Providencia kept since they're Colombia's own.
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
- **Alabaos del Pacífico (t38–t40)** — added as three ordinary rows in
  `tracks.csv`, no schema change. Settled the "documentary with a place"
  question in the simplest way available: no new `type` column, no fourth
  dot shape — a documentary segment with a real location and genre
  (`t38`, the Pogue cantadoras of Bojayá) just gets a normal classification
  (`Traditional`) and renders as an ordinary circle, same as a song; the
  documentary nature is only noted in the `note` field. Paired with two
  performance videos from Timbiquí, Cauca (Elena Hinestroza — traditional;
  Nidia Góngora's "En los Manglares" — a contemporary alabao
  reinterpretation, fusion), which share exact coordinates and fan as a
  pair like any other co-located pair. This resolves the "type column vs.
  separate section" architecture question for any future addition that
  (like this one) has both a real place and a classifiable genre — only a
  documentary with *no* place (already handled by `FEATURED_VIDEO`) or one
  that resists classification entirely would still need separate handling.

## A. Track data & classification

1. **Documentary & dance videos with an actual place** — the general
   documentary with no location is handled (see Done above), and the
   alabaos del Pacífico documentary segment is done too (see Done above) —
   it turned out not to need special handling at all. Still open:
   - one on the Carnaval de Blancos y Negros de Pasto,
   - one on Petronio Álvarez (name as given — worth double-checking the
     exact title/festival when building this),
   - dance videos alongside the music generally.
   Same approach as the alabaos entries should work: plain rows in
   `tracks.csv`, classified normally, no schema change — unless one of
   these turns out to have no clean single location or resists
   traditional/fusion/non-traditional classification, in which case revisit
   the `type`-column idea then. None of these are confirmed/ready yet —
   titles and YouTube links needed before building.

## Open questions for next session

- Track data for A1: get titles + YouTube links for the Carnaval de Pasto /
  Petronio Álvarez / dance videos.
