# Colombian music — interactive map

A single-page site that introduces Colombia's six musical regions, plots
recorded examples on a relief map, and plays them via YouTube.

Plain HTML/CSS/JS — no build step, no framework. `js/app.js` is loaded as a
native ES module.

## Adding a new example

Open `data/tracks.csv` in Excel, Google Sheets, Numbers, or a text editor and
add a row:

| column | meaning |
| --- | --- |
| `id` | any unique short id, e.g. `t13` |
| `title` | track title |
| `artist` | performer |
| `year` | release year (leave blank for traditional/undated pieces) — free text, so things like `Mid 1940's` work too |
| `genre` | e.g. `Vallenato`, `Currulao` |
| `classification` | `Traditional`, `Fusion` or `Non-traditional` — shown in the detail panel and drives the map dot's shape (circle / triangle / square); leave blank to fall back to a circle |
| `note` | optional short free-text aside shown under the details, e.g. `Live performance by Alejo Durán – 1990's` — leave blank if there's nothing to add |
| `region` | one of `Caribbean`, `Pacific`, `Andean`, `Orinoquía`, `Amazonia`, `Insular` — display text only (it doesn't drive the map's colouring), so a track that genuinely straddles two can use e.g. `Andean / Amazonia` |
| `department` | the Colombian department name, matching `assets/colombia-departments.geojson` |
| `location` | free-text place description shown in the detail panel |
| `lat`, `lon` | decimal coordinates for the map dot |
| `youtubeId` | the part of the YouTube URL after `v=` (leave blank if there's no video yet) |

Wrap any field containing a comma in double quotes. No other file needs to
change — the map, chip list and player all read from this CSV at load time.

## Running locally

YouTube's embedded player rejects requests with no HTTP referrer, which is
exactly what happens if you open `index.html` straight from disk
(`file://`). Always serve it over HTTP:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`.

## Deploying

This is a static site — any static host works (GitHub Pages, Netlify,
Vercel, S3, etc.). Just publish the repository root; no build step is
required.

## Project layout

- `index.html`, `styles.css` — page structure and the Nocturne-derived design tokens.
- `js/app.js` — state, selection handling, the dot-to-player connector line.
- `js/map.js` — d3-based map rendering (relief, departments, regions, dots).
- `js/player.js` — YouTube IFrame Player API wrapper with an embed-disabled fallback.
- `js/csv.js` — small CSV parser.
- `data/tracks.csv` — the example spreadsheet.
- `data/regions.js` — the region blurbs shown in the intro.
- `assets/colombia-departments.geojson` — simplified department boundaries, shown as thin reference lines on the map (source: [caticoa3/colombia_mapa](https://github.com/caticoa3/colombia_mapa)).
- `assets/colombia-outline.geojson` — the pre-computed union of all departments (national outline), used to clip the relief image and draw the country border.
- `assets/colombia-regions.geojson` — the 6 natural regions' actual physiographic shapes (hand-fitted to their real boundaries, not department lines, since several departments straddle two regions in reality). This is what the map colours.
- `assets/neighbouring-countries.geojson` — rough outlines of Panama, Venezuela, Ecuador, Peru and Brazil, cropped to a margin around Colombia's own border (not the full countries) for context at the map's edges (source: [world-atlas](https://github.com/topojson/world-atlas) 110m).
- `assets/colombia-relief.png` (+ `-bounds.json`) — pre-processed elevation relief, cropped and tinted from Natural Earth's public-domain "Cross-blended Hypso with Shaded Relief" raster.
- `design-source/` — the original Claude Design prototype, kept for visual reference.
