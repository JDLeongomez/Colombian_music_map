// Plain React component (not a Design Component): draws Colombia from real
// TopoJSON geometry with d3-geo, overlays illustrative region labels and
// elevation shading, and plots track dots. Mounted via <x-import
// component-from-global-scope="ColombiaMap">. Requires window.d3 and
// window.topojson (load the pinned scripts in the host's <helmet>).
(function () {
  const { useState, useEffect, useRef, useCallback } = React;

  const REGION_LABELS = [
    { name: 'CARIBBEAN', lat: 10.9, lon: -74.4 },
    { name: 'INSULAR', lat: 13.0, lon: -80.6 },
    { name: 'PACIFIC', lat: 3.6, lon: -78.3 },
    { name: 'ANDEAN', lat: 5.6, lon: -74.9 },
    { name: 'ORINOQUÍA', lat: 5.2, lon: -70.0 },
    { name: 'AMAZONIA', lat: -1.6, lon: -71.8 }
  ];

  function ColombiaMap(props) {
    const { tracks = [], selectedId, onSelect, onActivePosition } = props;
    const [geo, setGeo] = useState(null);
    const [error, setError] = useState(false);
    const [hovered, setHovered] = useState(null);
    const [size, setSize] = useState({ w: 800, h: 900 });
    const containerRef = useRef(null);
    const svgRef = useRef(null);
    const circleRefs = useRef({});

    useEffect(() => {
      fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
        .then(r => r.json())
        .then(topology => {
          const fc = window.topojson.feature(topology, topology.objects.countries);
          const colombia = fc.features.find(f => f.id === '170' || f.id === 170);
          setGeo(colombia || null);
          if (!colombia) setError(true);
        })
        .catch(() => setError(true));
    }, []);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(entries => {
        const cr = entries[0].contentRect;
        setSize({ w: cr.width, h: cr.height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const extentPoints = geo ? {
      type: 'FeatureCollection',
      features: [geo, {
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: REGION_LABELS.map(rl => [rl.lon, rl.lat])
            .concat(tracks.filter(t => t.lat != null && t.lon != null).map(t => [t.lon, t.lat]))
        }
      }]
    } : null;
    const projection = geo ? window.d3.geoMercator().fitExtent(
      [[28, 24], [size.w - 28, size.h - 24]], extentPoints
    ) : null;
    const pathGen = projection ? window.d3.geoPath(projection) : null;

    const reportPosition = useCallback(() => {
      if (!selectedId || !onActivePosition) return;
      const ref = circleRefs.current[selectedId];
      if (!ref) return;
      const r = ref.getBoundingClientRect();
      onActivePosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }, [selectedId, onActivePosition]);

    useEffect(() => {
      reportPosition();
      window.addEventListener('resize', reportPosition);
      return () => window.removeEventListener('resize', reportPosition);
    }, [reportPosition, size]);

    if (error) {
      return React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-neutral-400)', fontSize: 13 }
      }, 'Map data unavailable — check your connection.');
    }
    if (!geo || !projection) {
      return React.createElement('div', {
        ref: containerRef,
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-neutral-500)', fontSize: 13 }
      }, 'Loading map…');
    }

    const d = pathGen(geo);
    const andesCenter = projection([-75.4, 5.2]);
    const andesR = Math.max(size.w, size.h) * 0.42;

    const dots = tracks.filter(t => t.lat != null && t.lon != null).map(t => {
      const [x, y] = projection([t.lon, t.lat]);
      const isActive = t.id === selectedId;
      const isHover = t.id === hovered;
      const r = isActive ? 7 : isHover ? 6 : 4.5;
      return React.createElement('g', { key: t.id },
        isActive && React.createElement('circle', {
          cx: x, cy: y, r: 13, style: { fill: 'none', stroke: 'var(--color-accent)', strokeWidth: 1, opacity: 0.5 }
        }),
        React.createElement('circle', {
          ref: el => { circleRefs.current[t.id] = el; },
          cx: x, cy: y, r,
          style: {
            fill: isActive ? 'var(--color-accent-100)' : 'var(--color-accent)',
            stroke: 'var(--color-bg)', strokeWidth: 1.5, cursor: 'pointer',
            filter: isActive ? 'drop-shadow(0 0 6px var(--color-accent))' : 'none',
            transition: 'r 120ms ease'
          },
          onMouseEnter: () => setHovered(t.id),
          onMouseLeave: () => setHovered(null),
          onClick: () => onSelect && onSelect(t.id)
        }),
        (isHover || isActive) && React.createElement('text', {
          x: x + 10, y: y - 10,
          style: { font: '500 11px var(--font-body)', fill: 'var(--color-text)', pointerEvents: 'none' }
        }, t.title)
      );
    });

    const labels = REGION_LABELS.map(rl => {
      const [x, y] = projection([rl.lon, rl.lat]);
      return React.createElement('text', {
        key: rl.name, x, y,
        style: {
          font: '600 9.5px var(--font-body)', letterSpacing: '0.08em',
          fill: 'var(--color-neutral-400)', pointerEvents: 'none', textAnchor: 'middle'
        }
      }, rl.name);
    });

    return React.createElement('div', { ref: containerRef, style: { width: '100%', height: '100%' } },
      React.createElement('svg', { ref: svgRef, width: '100%', height: '100%', viewBox: `0 0 ${size.w} ${size.h}` },
        React.createElement('defs', null,
          React.createElement('clipPath', { id: 'cx-clip' }, React.createElement('path', { d })),
          React.createElement('radialGradient', { id: 'cx-terrain', cx: '50%', cy: '50%', r: '50%' },
            React.createElement('stop', { offset: '0%', style: { stopColor: 'var(--color-neutral-500)', stopOpacity: 0.55 } }),
            React.createElement('stop', { offset: '100%', style: { stopColor: 'var(--color-neutral-500)', stopOpacity: 0 } })
          )
        ),
        React.createElement('path', { d, style: { fill: 'var(--color-neutral-800)', stroke: 'var(--color-accent-700)', strokeWidth: 1 } }),
        React.createElement('g', { clipPath: 'url(#cx-clip)' },
          React.createElement('circle', { cx: andesCenter[0], cy: andesCenter[1], r: andesR, style: { fill: 'url(#cx-terrain)' } })
        ),
        labels,
        dots
      )
    );
  }

  window.ColombiaMap = ColombiaMap;
})();
