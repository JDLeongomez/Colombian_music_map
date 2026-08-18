import { parseCSV } from './csv.js';
import { REGIONS, colorForRegionText } from '../data/regions.js';
import { createMap, CLASSIFICATION_SHAPES } from './map.js';
import { createPlayer } from './player.js';

const els = {
  regionList: document.getElementById('region-list'),
  searchInput: document.getElementById('search-input'),
  regionFilter: document.getElementById('region-filter'),
  classificationFilter: document.getElementById('classification-filter'),
  clearFilters: document.getElementById('clear-filters'),
  mapContainer: document.getElementById('map-container'),
  playerCard: document.getElementById('player-card'),
  playerMount: document.getElementById('player-mount'),
  detailPanel: document.getElementById('detail-panel'),
  chipsHeading: document.getElementById('chips-heading'),
  chipList: document.getElementById('chip-list'),
  connectorSvg: document.getElementById('connector-svg'),
  connectorPath: document.getElementById('connector-path')
};

let allTracks = [];
let visibleTracks = [];
let selectedId = null;
let hasEverSelected = false;
let map = null;
let player = null;
const filters = { query: '', regions: new Set(), classifications: new Set() };
const CLASSIFICATION_ORDER = ['Traditional', 'Fusion', 'Non-traditional'];
const CLASSIFICATION_HINTS = {
  Traditional: 'Genre and performance style stay close to the folk or ceremonial roots, with little to no modern fusion.',
  Fusion: 'A traditional genre or instrumentation deliberately blended with modern genres or production — jazz, pop, electronic, and so on.',
  'Non-traditional': 'A contemporary genre — rock, hip hop, electronic, synthpop — with little direct grounding in a traditional genre, even where the theme or culture is unmistakably Colombian.'
};

// A general-interest documentary with no single place to plot on the map —
// suggested (cued, not autoplaying) before the visitor has picked anything
// of their own; see renderDetail()/init() below.
const FEATURED_VIDEO = {
  title: 'Introduction to Colombian Music',
  youtubeId: 'oRL44KZXuvE',
  blurb: 'A short introduction to the regions, instruments and rhythms behind Colombian music — a good starting point before exploring the map.'
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderRegions() {
  els.regionList.innerHTML = REGIONS.map(r => `
    <div class="cx-region-item">
      <span class="cx-region-dot" style="background:${r.color}"></span>
      <div>
        <div class="cx-region-name">${escapeHtml(r.name)}</div>
        <div class="cx-region-blurb">${escapeHtml(r.blurb)}</div>
      </div>
    </div>
  `).join('');
}

function renderRegionFilter() {
  els.regionFilter.innerHTML = REGIONS.map(r => `
    <button type="button" class="cx-region-toggle${filters.regions.has(r.id) ? ' is-active' : ''}" data-id="${r.id}" style="--region-color:${r.color}">${escapeHtml(r.name)}</button>
  `).join('');
  els.regionFilter.querySelectorAll('.cx-region-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (filters.regions.has(id)) filters.regions.delete(id); else filters.regions.add(id);
      applyFilters();
    });
  });
}

function classificationIcon(v) {
  const shapeType = CLASSIFICATION_SHAPES[v] || d3.symbolCircle;
  const path = d3.symbol().type(shapeType).size(60)();
  return `<svg width="10" height="10" viewBox="-7 -7 14 14" aria-hidden="true"><path d="${path}" fill="currentColor"/></svg>`;
}

function renderClassificationFilter() {
  const values = [...new Set(allTracks.map(t => t.classification).filter(Boolean))]
    .sort((a, b) => {
      const ia = CLASSIFICATION_ORDER.indexOf(a), ib = CLASSIFICATION_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  els.classificationFilter.innerHTML = values.map(v => `
    <button type="button" class="cx-classification-toggle${filters.classifications.has(v) ? ' is-active' : ''}" data-value="${escapeHtml(v)}" title="${escapeHtml(CLASSIFICATION_HINTS[v] || '')}">${classificationIcon(v)}${escapeHtml(v)}</button>
  `).join('');
  els.classificationFilter.querySelectorAll('.cx-classification-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.value;
      if (filters.classifications.has(v)) filters.classifications.delete(v); else filters.classifications.add(v);
      applyFilters();
    });
  });
}

// A track's `region` field is free text and can name more than one region
// (e.g. "Andean / Amazonia") — it matches a region filter if any named
// region is selected.
function trackMatchesFilters(t) {
  if (filters.regions.size > 0) {
    const parts = (t.region || '').split('/').map(s => s.trim());
    const inSelectedRegion = parts.some(p => {
      const match = REGIONS.find(r => r.name === p || r.id === p);
      return match && filters.regions.has(match.id);
    });
    if (!inSelectedRegion) return false;
  }
  if (filters.classifications.size > 0 && !filters.classifications.has(t.classification)) return false;
  if (filters.query) {
    const haystack = `${t.title} ${t.artist} ${t.genre}`.toLowerCase();
    if (!haystack.includes(filters.query)) return false;
  }
  return true;
}

function applyFilters() {
  visibleTracks = allTracks.filter(trackMatchesFilters);
  if (selectedId && !visibleTracks.some(t => t.id === selectedId)) {
    selectedId = null;
    player.showEmpty();
  }
  const active = !!filters.query || filters.regions.size > 0 || filters.classifications.size > 0;
  els.clearFilters.hidden = !active;
  els.chipsHeading.textContent = active ? `${visibleTracks.length} of ${allTracks.length} examples` : 'All examples';

  renderRegionFilter();
  renderClassificationFilter();
  renderChips();
  renderDetail();
  map.update({ tracks: visibleTracks, selectedId });
}

function renderChips() {
  if (!visibleTracks.length) {
    els.chipList.innerHTML = '<p class="cx-chip-empty">No examples match your filters.</p>';
    return;
  }
  els.chipList.innerHTML = visibleTracks.map(t => {
    const color = colorForRegionText(t.region);
    return `
    <button class="cx-chip${t.id === selectedId ? ' is-active' : ''}" data-id="${t.id}">
      <span class="cx-chip-title">${escapeHtml(t.title)}</span>
      <span class="cx-chip-meta">${escapeHtml(t.artist)} · <span style="color:${color || 'inherit'}">${escapeHtml(t.region)}</span></span>
    </button>
  `;
  }).join('');
  els.chipList.querySelectorAll('.cx-chip').forEach(btn => {
    btn.addEventListener('click', () => selectTrack(btn.dataset.id));
  });
}

function renderDetail() {
  const active = allTracks.find(t => t.id === selectedId);
  if (!active) {
    if (!hasEverSelected) {
      els.detailPanel.innerHTML = `
        <div class="card-kicker">Documentary</div>
        <div class="card-title">${escapeHtml(FEATURED_VIDEO.title)}</div>
        <div class="hr" style="margin: var(--space-2) 0;"></div>
        <p class="cx-detail-note">${escapeHtml(FEATURED_VIDEO.blurb)}</p>
        <a class="btn btn-ghost cx-detail-link" href="https://www.youtube.com/watch?v=${FEATURED_VIDEO.youtubeId}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
      `;
    } else {
      els.detailPanel.innerHTML = '<p class="cx-detail-empty">Select an example on the map or from the list below to see its details.</p>';
    }
    return;
  }
  const kickerColor = colorForRegionText(active.region);
  els.detailPanel.innerHTML = `
    <div class="card-kicker" style="${kickerColor ? `color:${kickerColor}` : ''}">${escapeHtml(active.region)}</div>
    <div class="card-title">${escapeHtml(active.title)}</div>
    <div class="hr" style="margin: var(--space-2) 0;"></div>
    <div class="cx-detail-rows">
      <div class="cx-detail-row"><span>Artist</span><span>${escapeHtml(active.artist)}</span></div>
      <div class="cx-detail-row"><span>Year</span><span>${escapeHtml(active.year || 'Traditional')}</span></div>
      <div class="cx-detail-row"><span>Genre</span><span>${escapeHtml(active.genre)}</span></div>
      ${active.classification ? `<div class="cx-detail-row"><span>Classification</span><span title="${escapeHtml(CLASSIFICATION_HINTS[active.classification] || '')}">${escapeHtml(active.classification)}</span></div>` : ''}
      <div class="cx-detail-row"><span>Location</span><span>${escapeHtml(active.location)}</span></div>
    </div>
    ${active.note ? `<p class="cx-detail-note">${escapeHtml(active.note)}</p>` : ''}
    ${active.youtubeId ? `<a class="btn btn-ghost cx-detail-link" href="https://www.youtube.com/watch?v=${active.youtubeId}" target="_blank" rel="noopener">Watch on YouTube ↗</a>` : ''}
  `;
}

function updateConnector() {
  const dotPos = selectedId && map && map.getDotCenter(selectedId);
  if (!dotPos) { els.connectorSvg.style.display = 'none'; return; }
  const r = els.playerCard.getBoundingClientRect();
  const x2 = r.left + 18, y2 = r.top + 18;
  const midX = (dotPos.x + x2) / 2;
  els.connectorPath.setAttribute('d', `M${dotPos.x} ${dotPos.y} C ${midX} ${dotPos.y}, ${midX} ${y2}, ${x2} ${y2}`);
  els.connectorSvg.style.display = 'block';
}

function selectTrack(id) {
  selectedId = id;
  const active = allTracks.find(t => t.id === id);
  renderChips();
  renderDetail();
  map.update({ selectedId });
  if (active) { hasEverSelected = true; player.play(active); } else { player.showEmpty(); }
}

async function init() {
  renderRegions();
  renderRegionFilter();

  const csvText = await fetch('data/tracks.csv').then(r => r.text());
  allTracks = parseCSV(csvText).map(row => ({
    ...row,
    // year is free text (e.g. "1976", "Mid 1940's") — kept as-is, not parsed as a number
    lat: row.lat !== '' ? Number(row.lat) : null,
    lon: row.lon !== '' ? Number(row.lon) : null
  }));
  visibleTracks = allTracks;
  renderClassificationFilter();

  renderChips();
  renderDetail();

  player = createPlayer(els.playerMount);
  player.suggest(FEATURED_VIDEO);
  map = await createMap(els.mapContainer);
  map.update({ tracks: visibleTracks, selectedId, onSelect: selectTrack, onAfterDraw: updateConnector });

  els.searchInput.addEventListener('input', () => {
    filters.query = els.searchInput.value.trim().toLowerCase();
    applyFilters();
  });
  els.clearFilters.addEventListener('click', () => {
    filters.query = '';
    filters.regions.clear();
    filters.classifications.clear();
    els.searchInput.value = '';
    applyFilters();
  });

  window.addEventListener('resize', updateConnector);
  window.addEventListener('scroll', updateConnector, { passive: true });
}

init();
