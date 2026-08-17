// Renders Colombia's natural regions, department borders, elevation relief,
// neighbouring countries and track dots into an SVG. Vanilla JS +
// d3-geo/topojson-client (loaded as pinned CDN globals in index.html) — no
// React, no build step.
const REGION_COLORS = {
  Caribbean: '#5B8DB8',
  Pacific: '#3FA0A0',
  Andean: '#A9744E',
  Orinoquia: '#D4B44A',
  Amazonia: '#3F9152',
  Insular: '#9184D9'
};

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
  const neighbourLabelLayer = svg.append('g');
  const waterLabelLayer = svg.append('g');
  const labelLayer = svg.append('g');
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

    const regionSel = regionLayer.selectAll('path').data(regionFeatures, d => d.properties.region);
    regionSel.join('path')
      .attr('d', pathGen)
      .style('fill', d => REGION_COLORS[d.properties.region] || 'var(--color-neutral-700)')
      .style('fill-opacity', 0.4)
      .style('stroke', 'none');

    const deptSel = deptLayer.selectAll('path').data(deptFeatures, d => d.properties.code);
    deptSel.join('path')
      .attr('d', pathGen)
      .style('fill', 'none')
      .style('stroke', 'var(--color-bg)')
      .style('stroke-width', 0.5)
      .style('stroke-opacity', 0.45);

    const regionBorderSel = regionBorderLayer.selectAll('path').data(regionFeatures, d => d.properties.region);
    regionBorderSel.join('path')
      .attr('d', pathGen)
      .style('fill', 'none')
      .style('stroke', d => REGION_COLORS[d.properties.region])
      .style('stroke-width', 1.1)
      .style('stroke-opacity', 0.6);

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
    const dotSel = dotLayer.selectAll('g').data(plottable, d => d.id);
    dotSel.exit().each(d => { delete circleEls[d.id]; }).remove();
    const entered = dotSel.enter().append('g');
    entered.append('circle').attr('class', 'cx-ring');
    entered.append('circle').attr('class', 'cx-dot');
    entered.append('text').attr('class', 'cx-dot-label');

    const merged = entered.merge(dotSel);
    merged.each(function (d) {
      const g = d3.select(this);
      const [x, y] = projection([d.lon, d.lat]);
      const isActive = d.id === selectedId;
      const isHover = d.id === hovered;
      const r = isActive ? 7 : isHover ? 6 : 4.5;

      g.select('.cx-ring')
        .attr('cx', x).attr('cy', y).attr('r', 13)
        .style('display', isActive ? null : 'none')
        .style('fill', 'none').style('stroke', 'var(--color-accent)')
        .style('stroke-width', 1).style('opacity', 0.5);

      const dot = g.select('.cx-dot')
        .attr('cx', x).attr('cy', y).attr('r', r)
        .style('fill', isActive ? 'var(--color-accent-100)' : 'var(--color-accent)')
        .style('stroke', 'var(--color-bg)').style('stroke-width', 1.5)
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
