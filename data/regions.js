// The 6 natural regions shown in the intro and used as track metadata.
// The map's region shapes themselves live in assets/colombia-regions.geojson
// (hand-fitted to the regions' real physiographic boundaries, not department
// lines — several departments straddle two regions in reality). `color`
// matches the fill used for that region's shape on the map, so the same
// colour carries through the intro dots, chips and detail panel.
export const REGIONS = [
  { id: 'Caribbean', name: 'Caribbean', color: '#5B8DB8', blurb: 'Coastal rhythms — cumbia, vallenato, champeta and bullerengue — shaped by African, Indigenous and Spanish heritage.' },
  { id: 'Pacific', name: 'Pacific', color: '#3FA0A0', blurb: 'Afro-Colombian currulao and marimba music from the rainforested coast.' },
  { id: 'Andean', name: 'Andean', color: '#A9744E', blurb: 'Bambuco, pasillo and carranga from the highland heartland around Bogotá and the coffee region.' },
  { id: 'Orinoquia', name: 'Orinoquía', color: '#D4B44A', blurb: 'Joropo — harp, cuatro and vocals — from the eastern plains and cattle country.' },
  { id: 'Amazonia', name: 'Amazonia', color: '#3F9152', blurb: "Colombia's least commercially documented tradition, rooted in Indigenous communities along the river." },
  { id: 'Insular', name: 'Insular', color: '#9184D9', blurb: 'Calypso, reggae and mento from the archipelago of San Andrés, Providencia and Santa Catalina.' }
];

export const REGION_COLORS = Object.fromEntries(REGIONS.map(r => [r.id, r.color]));

// A track's `region` field is free text and can name more than one region
// (e.g. "Andean / Amazonia") — colour by whichever is named first.
export function colorForRegionText(text) {
  if (!text) return null;
  const first = text.split('/')[0].trim();
  const match = REGIONS.find(r => r.name === first || r.id === first);
  return match ? match.color : null;
}
