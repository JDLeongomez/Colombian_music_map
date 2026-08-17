import { parseCSV } from './csv.js';
import { REGIONS } from '../data/regions.js';
import { createMap } from './map.js';
import { createPlayer } from './player.js';

const els = {
  regionList: document.getElementById('region-list'),
  mapContainer: document.getElementById('map-container'),
  playerCard: document.getElementById('player-card'),
  playerMount: document.getElementById('player-mount'),
  detailPanel: document.getElementById('detail-panel'),
  chipList: document.getElementById('chip-list'),
  connectorSvg: document.getElementById('connector-svg'),
  connectorPath: document.getElementById('connector-path')
};

let tracks = [];
let selectedId = null;
let map = null;
let player = null;

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderRegions() {
  els.regionList.innerHTML = REGIONS.map(r => `
    <div class="cx-region-item">
      <span class="cx-region-dot"></span>
      <div>
        <div class="cx-region-name">${escapeHtml(r.name)}</div>
        <div class="cx-region-blurb">${escapeHtml(r.blurb)}</div>
      </div>
    </div>
  `).join('');
}

function renderChips() {
  els.chipList.innerHTML = tracks.map(t => `
    <button class="cx-chip${t.id === selectedId ? ' is-active' : ''}" data-id="${t.id}">
      <span class="cx-chip-title">${escapeHtml(t.title)}</span>
      <span class="cx-chip-meta">${escapeHtml(t.artist)} · ${escapeHtml(t.region)}</span>
    </button>
  `).join('');
  els.chipList.querySelectorAll('.cx-chip').forEach(btn => {
    btn.addEventListener('click', () => selectTrack(btn.dataset.id));
  });
}

function renderDetail() {
  const active = tracks.find(t => t.id === selectedId);
  if (!active) {
    els.detailPanel.innerHTML = '<p class="cx-detail-empty">Select an example on the map or from the list below to see its details.</p>';
    return;
  }
  els.detailPanel.innerHTML = `
    <div class="card-kicker">${escapeHtml(active.region)}</div>
    <div class="card-title">${escapeHtml(active.title)}</div>
    <div class="hr" style="margin: var(--space-2) 0;"></div>
    <div class="cx-detail-rows">
      <div class="cx-detail-row"><span>Artist</span><span>${escapeHtml(active.artist)}</span></div>
      <div class="cx-detail-row"><span>Year</span><span>${active.year || 'Traditional'}</span></div>
      <div class="cx-detail-row"><span>Genre</span><span>${escapeHtml(active.genre)}</span></div>
      <div class="cx-detail-row"><span>Location</span><span>${escapeHtml(active.location)}</span></div>
    </div>
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
  const active = tracks.find(t => t.id === id);
  renderChips();
  renderDetail();
  map.update({ selectedId });
  if (active) player.play(active); else player.showEmpty();
}

async function init() {
  renderRegions();

  const csvText = await fetch('data/tracks.csv').then(r => r.text());
  tracks = parseCSV(csvText).map(row => ({
    ...row,
    year: row.year ? Number(row.year) : null,
    lat: row.lat !== '' ? Number(row.lat) : null,
    lon: row.lon !== '' ? Number(row.lon) : null
  }));

  renderChips();
  renderDetail();

  player = createPlayer(els.playerMount);
  map = await createMap(els.mapContainer);
  map.update({ tracks, selectedId, onSelect: selectTrack, onAfterDraw: updateConnector });

  window.addEventListener('resize', updateConnector);
}

init();
