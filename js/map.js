// Renders Colombia's natural regions, department borders, elevation relief,
// neighbouring countries and track dots into an SVG. Vanilla JS +
// d3-geo/topojson-client (loaded as pinned CDN globals in index.html) — no
// React, no build step.
import { REGION_COLORS } from '../data/regions.js';

// Precomputed (offline, from the real region/country geometry) so each
// label sits inside its shape even for narrow or concave regions.
const REGION_LABEL_POINTS = [
  { name: 'CARIBBEAN', lon: -74.47, lat: 10.1 },
  { name: 'PACIFIC', lon: -77.11, lat: 4.86 },
  { name: 'ANDEAN', lon: -74.91, lat: 5.2 },
  { name: 'ORINOQUÍA', lon: -70.53, lat: 4.83 },
  { name: 'AMAZONIA', lon: -72.54, lat: -0.15 },
  { name: 'INSULAR', lon: -81.72, lat: 13.6 }
];

const NEIGHBOUR_LABELS = [
  { name: 'PANAMA', lon: -81.3, lat: 8.4 },
  { name: 'VENEZUELA', lon: -67.6, lat: 6.7 },
  { name: 'ECUADOR', lon: -78.1, lat: -1.6 },
  { name: 'PERU', lon: -73.6, lat: -2.8 },
  { name: 'BRAZIL', lon: -67.3, lat: -2.7 }
];

const WATER_LABELS = [
  { name: 'CARIBBEAN SEA', lon: -75.5, lat: 13.3 },
  { name: 'PACIFIC OCEAN', lon: -80.4, lat: 2.6 }
];

// Matches the margin baked into the neighbour/water label points above —
// keep in sync if either changes.
const MARGIN_LON = 1.6;
const MARGIN_LAT = 1.3;

// San Andrés and Providencia's real geometry is only a couple of pixels
// across at this map's scale, so its region fill is effectively invisible —
// drawn instead as a fixed-radius circle (screen px, not projected) roughly
// centred between the two islands, so Insular reads as a region and not
// just stray dots in open sea.
const INSULAR_CENTER = [-81.54, 12.965];
const INSULAR_HALO_RADIUS = 30;

// Classification reads through dot shape, not colour: circle = traditional
// (also the fallback for unclassified tracks), triangle = fusion,
// square = non-traditional — three silhouettes chosen to stay distinct
// from one another even at the map's small dot size.
export const CLASSIFICATION_SHAPES = {
  Traditional: d3.symbolCircle,
  Fusion: d3.symbolTriangle,
  'Non-traditional': d3.symbolSquare
};

// Department capitals, purely for orientation — styled well below the track
// dots so they read as background reference, not content. Cundinamarca's
// capital is Bogotá too, so it shares Bogotá D.C.'s point rather than
// duplicating it.
const CAPITALS = [
  { name: 'Leticia', lon: -69.940, lat: -4.215 },
  { name: 'Medellín', lon: -75.581, lat: 6.244 },
  { name: 'Arauca', lon: -70.763, lat: 7.089 },
  { name: 'Barranquilla', lon: -74.781, lat: 10.968 },
  { name: 'Cartagena', lon: -75.479, lat: 10.391 },
  { name: 'Tunja', lon: -73.367, lat: 5.535 },
  { name: 'Manizales', lon: -75.518, lat: 5.068 },
  { name: 'Florencia', lon: -75.606, lat: 1.615 },
  { name: 'Yopal', lon: -72.396, lat: 5.338 },
  { name: 'Popayán', lon: -76.614, lat: 2.444 },
  { name: 'Valledupar', lon: -73.253, lat: 10.463 },
  { name: 'Quibdó', lon: -76.658, lat: 5.694 },
  { name: 'Montería', lon: -75.878, lat: 8.748 },
  { name: 'Bogotá', lon: -74.072, lat: 4.711 },
  { name: 'Inírida', lon: -67.923, lat: 3.865 },
  { name: 'San José del Guaviare', lon: -72.640, lat: 2.570 },
  { name: 'Neiva', lon: -75.281, lat: 2.927 },
  { name: 'Riohacha', lon: -72.907, lat: 11.544 },
  { name: 'Santa Marta', lon: -74.199, lat: 11.240 },
  { name: 'Villavicencio', lon: -73.626, lat: 4.142 },
  { name: 'Pasto', lon: -77.281, lat: 1.209 },
  { name: 'Cúcuta', lon: -72.507, lat: 7.894 },
  { name: 'Mocoa', lon: -76.648, lat: 1.147 },
  { name: 'Armenia', lon: -75.681, lat: 4.535 },
  { name: 'Pereira', lon: -75.694, lat: 4.814 },
  { name: 'San Andrés', lon: -81.700, lat: 12.584 },
  { name: 'Bucaramanga', lon: -73.122, lat: 7.119 },
  { name: 'Sincelejo', lon: -75.397, lat: 9.303 },
  { name: 'Ibagué', lon: -75.232, lat: 4.438 },
  { name: 'Cali', lon: -76.532, lat: 3.452 },
  { name: 'Mitú', lon: -70.233, lat: 1.198 },
  { name: 'Puerto Carreño', lon: -67.486, lat: 6.189 }
];

// Tracks from the same city/region often share (near-)identical coordinates
// — plain projection would stack their dots exactly on top of one another,
// hiding all but the last-drawn one. Group dots that would render within
// OVERLAP_PX of each other and fan them out on a small circle around their
// shared point, connected back to it with a thin spoke line.
const OVERLAP_PX = 15;

function clusterDots(points) {
  const n = points.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(a) { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) < OVERLAP_PX) {
        const ra = find(i), rb = find(j);
        if (ra !== rb) parent[ra] = rb;
      }
    }
  }
  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(points[i]);
  }
  for (const group of groups.values()) {
    if (group.length === 1) {
      const p = group[0];
      p.fx = p.x; p.fy = p.y; p.spoke = null;
      continue;
    }
    group.sort((a, b) => a.track.id.localeCompare(b.track.id));
    const cx = group.reduce((s, p) => s + p.x, 0) / group.length;
    const cy = group.reduce((s, p) => s + p.y, 0) / group.length;
    const radius = Math.min(10 + 2.5 * (group.length - 1), 26);
    group.forEach((p, i) => {
      const angle = (2 * Math.PI * i / group.length) - Math.PI / 2;
      p.fx = cx + radius * Math.cos(angle);
      p.fy = cy + radius * Math.sin(angle);
      p.spoke = { cx, cy };
    });
  }
  return points;
}

export async function createMap(container) {
  const [deptGeoJSON, outlineFeature, regionsGeoJSON, neighboursGeoJSON, reliefBounds] = await Promise.all([
    fetch('assets/colombia-departments.geojson').then(r => r.json()),
    fetch('assets/colombia-outline.geojson').then(r => r.json()),
    fetch('assets/colombia-regions.geojson').then(r => r.json()),
    fetch('assets/neighbouring-countries.geojson').then(r => r.json()),
    fetch('assets/colombia-relief-bounds.json').then(r => r.json())
  ]);

  const deptFeatures = deptGeoJSON.features;
  const countryOutline = outlineFeature.geometry;
  const regionFeatures = regionsGeoJSON.features;
  const neighbourFeatures = neighboursGeoJSON.features;

  const svg = d3.select(container).append('svg')
    .attr('width', '100%').attr('height', '100%');
  const defs = svg.append('defs');
  const clip = defs.append('clipPath').attr('id', 'cx-country-clip');
  const clipPath = clip.append('path');
  const neighbourLayer = svg.append('g');
  const relief = svg.append('image').attr('clip-path', 'url(#cx-country-clip)').attr('preserveAspectRatio', 'none');
  const regionLayer = svg.append('g');
  const deptLayer = svg.append('g');
  const regionBorderLayer = svg.append('g');
  const countryBorder = svg.append('path').attr('fill', 'none');
  const capitalLayer = svg.append('g');
  const neighbourLabelLayer = svg.append('g');
  const waterLabelLayer = svg.append('g');
  const labelLayer = svg.append('g');
  const spokeHaloLayer = svg.append('g');
  const spokeLayer = svg.append('g');
  const dotLayer = svg.append('g');

  const circleEls = {};
  let projection = null;
  let pathGen = null;
  let size = { w: container.clientWidth || 800, h: container.clientHeight || 900 };
  let current = { tracks: [], selectedId: null, hovered: null, onSelect: null };

  function computeProjection(tracks) {
    const points = tracks.filter(t => t.lat != null && t.lon != null).map(t => [t.lon, t.lat]);
    const [[lonMin, latMin], [lonMax, latMax]] = d3.geoBounds(countryOutline);
    // Ring wound clockwise (in standard lon/lat-as-x/y view) — d3-geo's
    // spherical winding convention, opposite the flat-earth intuition. A
    // counter-clockwise ring here reads as "everything except this box",
    // which silently blows fitExtent's bounds out to the whole globe.
    const marginBox = {
      type: 'Polygon',
      coordinates: [[
        [lonMin - MARGIN_LON, latMin - MARGIN_LAT], [lonMin - MARGIN_LON, latMax + MARGIN_LAT],
        [lonMax + MARGIN_LON, latMax + MARGIN_LAT], [lonMax + MARGIN_LON, latMin - MARGIN_LAT],
        [lonMin - MARGIN_LON, latMin - MARGIN_LAT]
      ]]
    };
    const extentFC = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: marginBox },
        { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: points } }
      ]
    };
    projection = d3.geoMercator().fitExtent([[26, 22], [size.w - 26, size.h - 22]], extentFC);
    pathGen = d3.geoPath(projection);
  }

  function draw() {
    const { tracks, selectedId, hovered, onSelect } = current;
    computeProjection(tracks);

    clipPath.attr('d', pathGen(countryOutline));
    countryBorder.attr('d', pathGen(countryOutline))
      .style('stroke', 'var(--color-accent-700)').style('stroke-width', 1);

    const [rx0, ry0] = projection([reliefBounds.lonMin, reliefBounds.latMax]);
    const [rx1, ry1] = projection([reliefBounds.lonMax, reliefBounds.latMin]);
    relief.attr('href', 'assets/colombia-relief.png')
      .attr('x', rx0).attr('y', ry0)
      .attr('width', Math.max(1, rx1 - rx0)).attr('height', Math.max(1, ry1 - ry0));

    const neighbourSel = neighbourLayer.selectAll('path').data(neighbourFeatures, d => d.properties.name);
    neighbourSel.join('path')
      .attr('d', pathGen)
      .style('fill', 'var(--color-neutral-800)')
      .style('fill-opacity', 0.5)
      .style('stroke', 'var(--color-neutral-600)')
      .style('stroke-width', 0.75)
      .style('stroke-opacity', 0.6);

    const mainlandRegionFeatures = regionFeatures.filter(f => f.properties.region !== 'Insular');

    const regionSel = regionLayer.selectAll('path').data(mainlandRegionFeatures, d => d.properties.region);
    regionSel.join('path')
      .attr('d', pathGen)
      .style('fill', d => REGION_COLORS[d.properties.region] || 'var(--color-neutral-700)')
      .style('fill-opacity', 0.4)
      .style('stroke', 'none');

    const [insularX, insularY] = projection(INSULAR_CENTER);
    regionLayer.selectAll('circle.cx-insular-fill').data([null]).join('circle').attr('class', 'cx-insular-fill')
      .attr('cx', insularX).attr('cy', insularY).attr('r', INSULAR_HALO_RADIUS)
      .style('fill', REGION_COLORS.Insular).style('fill-opacity', 0.4).style('stroke', 'none');

    const deptSel = deptLayer.selectAll('path').data(deptFeatures, d => d.properties.code);
    deptSel.join('path')
      .attr('d', pathGen)
      .style('fill', 'none')
      .style('stroke', 'var(--color-bg)')
      .style('stroke-width', 0.5)
      .style('stroke-opacity', 0.45);

    const regionBorderSel = regionBorderLayer.selectAll('path').data(mainlandRegionFeatures, d => d.properties.region);
    regionBorderSel.join('path')
      .attr('d', pathGen)
      .style('fill', 'none')
      .style('stroke', d => REGION_COLORS[d.properties.region])
      .style('stroke-width', 1.1)
      .style('stroke-opacity', 0.6);

    regionBorderLayer.selectAll('circle.cx-insular-border').data([null]).join('circle').attr('class', 'cx-insular-border')
      .attr('cx', insularX).attr('cy', insularY).attr('r', INSULAR_HALO_RADIUS)
      .style('fill', 'none').style('stroke', REGION_COLORS.Insular).style('stroke-width', 1.1).style('stroke-opacity', 0.6);

    const capitalSel = capitalLayer.selectAll('g').data(CAPITALS, d => d.name);
    const capitalEnter = capitalSel.enter().append('g');
    capitalEnter.append('circle');
    capitalEnter.append('text');
    const capitalMerged = capitalEnter.merge(capitalSel);
    capitalMerged.each(function (d) {
      const g = d3.select(this);
      const [x, y] = projection([d.lon, d.lat]);
      g.select('circle')
        .attr('cx', x).attr('cy', y).attr('r', 1.6)
        .style('fill', 'var(--color-neutral-500)')
        .style('opacity', 0.7);
      g.select('text')
        .attr('x', x + 5).attr('y', y + 3)
        .style('font', '400 7.5px var(--font-body)')
        .style('fill', 'var(--color-neutral-500)')
        .style('paint-order', 'stroke')
        .style('stroke', 'var(--color-bg)')
        .style('stroke-width', '2.5px')
        .style('pointer-events', 'none')
        .text(d.name);
    });

    const neighbourLabelSel = neighbourLabelLayer.selectAll('text').data(NEIGHBOUR_LABELS, d => d.name);
    neighbourLabelSel.join('text')
      .attr('x', d => projection([d.lon, d.lat])[0])
      .attr('y', d => projection([d.lon, d.lat])[1])
      .style('font', '500 8.5px var(--font-body)')
      .style('letter-spacing', '0.06em')
      .style('fill', 'var(--color-neutral-500)')
      .style('pointer-events', 'none')
      .style('text-anchor', 'middle')
      .text(d => d.name);

    const waterLabelSel = waterLabelLayer.selectAll('text').data(WATER_LABELS, d => d.name);
    waterLabelSel.join('text')
      .attr('x', d => projection([d.lon, d.lat])[0])
      .attr('y', d => projection([d.lon, d.lat])[1])
      .style('font', 'italic 500 9px var(--font-body)')
      .style('letter-spacing', '0.06em')
      .style('fill', 'var(--color-neutral-600)')
      .style('pointer-events', 'none')
      .style('text-anchor', 'middle')
      .text(d => d.name);

    const labelSel = labelLayer.selectAll('text').data(REGION_LABEL_POINTS, d => d.name);
    labelSel.join('text')
      .attr('x', d => projection([d.lon, d.lat])[0])
      .attr('y', d => projection([d.lon, d.lat])[1])
      .style('font', '600 9.5px var(--font-body)')
      .style('letter-spacing', '0.08em')
      .style('fill', 'var(--color-neutral-200)')
      .style('paint-order', 'stroke')
      .style('stroke', 'var(--color-bg)')
      .style('stroke-width', '3px')
      .style('pointer-events', 'none')
      .style('text-anchor', 'middle')
      .text(d => d.name);

    const plottable = tracks.filter(t => t.lat != null && t.lon != null);
    const positioned = clusterDots(plottable.map(t => {
      const [x, y] = projection([t.lon, t.lat]);
      return { track: t, x, y };
    }));

    // Drawn as a dark halo plus a light line on top, rather than one
    // mid-tone stroke, so it stays legible over both the pale region fills
    // and the dark ocean/neighbour ground.
    const spokeData = positioned.filter(p => p.spoke);
    const spokeHaloSel = spokeHaloLayer.selectAll('line').data(spokeData, p => p.track.id);
    spokeHaloSel.join('line')
      .attr('x1', p => p.spoke.cx).attr('y1', p => p.spoke.cy)
      .attr('x2', p => p.fx).attr('y2', p => p.fy)
      .style('stroke', 'var(--color-bg)')
      .style('stroke-width', 2.25)
      .style('opacity', 0.65);

    const spokeSel = spokeLayer.selectAll('line').data(spokeData, p => p.track.id);
    spokeSel.join('line')
      .attr('x1', p => p.spoke.cx).attr('y1', p => p.spoke.cy)
      .attr('x2', p => p.fx).attr('y2', p => p.fy)
      .style('stroke', 'var(--color-neutral-100)')
      .style('stroke-width', 0.9)
      .style('opacity', 0.85);

    const dotSel = dotLayer.selectAll('g').data(positioned, p => p.track.id);
    dotSel.exit().each(p => { delete circleEls[p.track.id]; }).remove();
    const entered = dotSel.enter().append('g');
    entered.append('circle').attr('class', 'cx-ring');
    entered.append('path').attr('class', 'cx-dot');
    entered.append('text').attr('class', 'cx-dot-label');

    const merged = entered.merge(dotSel);
    merged.each(function (p) {
      const d = p.track;
      const g = d3.select(this);
      const x = p.fx, y = p.fy;
      const isActive = d.id === selectedId;
      const isHover = d.id === hovered;
      const r = isActive ? 7 : isHover ? 6 : 4.5;

      g.select('.cx-ring')
        .attr('cx', x).attr('cy', y).attr('r', 13)
        .style('display', isActive ? null : 'none')
        .style('fill', 'none').style('stroke', 'var(--color-accent)')
        .style('stroke-width', 1).style('opacity', 0.5);

      // Classification (traditional/fusion/non-traditional) reads through
      // the dot's shape rather than a second colour, so it doesn't compete
      // with the region colours already carried by dot position/fill.
      //
      // Unselected dots are neutral (not the accent colour) since the
      // accent happens to equal the Insular region's fill — a purple dot
      // over the Andean region would otherwise read as "this belongs to
      // Insular". The accent is reserved for the one currently-selected dot.
      const accentColor = isActive ? 'var(--color-accent-100)' : 'var(--color-neutral-100)';
      const shapeType = CLASSIFICATION_SHAPES[d.classification] || d3.symbolCircle;

      const dot = g.select('.cx-dot')
        .attr('d', d3.symbol().type(shapeType).size(Math.PI * r * r)())
        .attr('transform', `translate(${x},${y})`)
        .style('fill', accentColor)
        .style('stroke', 'var(--color-bg)')
        .style('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .style('filter', isActive ? 'drop-shadow(0 0 6px var(--color-accent))' : 'none');
      circleEls[d.id] = dot.node();

      dot.on('mouseenter', () => update({ hovered: d.id }))
        .on('mouseleave', () => update({ hovered: null }))
        .on('click', () => onSelect && onSelect(d.id));

      g.select('.cx-dot-label')
        .attr('x', x + 10).attr('y', y - 10)
        .style('display', isHover || isActive ? null : 'none')
        .style('font', '500 11px var(--font-body)')
        .style('fill', 'var(--color-text)')
        .style('paint-order', 'stroke')
        .style('stroke', 'var(--color-bg)')
        .style('stroke-width', '3px')
        .style('pointer-events', 'none')
        .text(d.title);
    });

    current.onAfterDraw && current.onAfterDraw();
  }

  function update(patch) {
    current = { ...current, ...patch };
    draw();
  }

  const ro = new ResizeObserver(entries => {
    const cr = entries[0].contentRect;
    if (cr.width && cr.height) {
      size = { w: cr.width, h: cr.height };
      svg.attr('viewBox', `0 0 ${size.w} ${size.h}`);
      draw();
    }
  });
  ro.observe(container);
  svg.attr('viewBox', `0 0 ${size.w} ${size.h}`);

  return {
    update,
    getDotCenter(id) {
      const el = circleEls[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    destroy() { ro.disconnect(); svg.remove(); }
  };
}
