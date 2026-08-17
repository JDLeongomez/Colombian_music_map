// The 6 natural regions shown in the intro and used as track metadata.
// The map's region shapes themselves live in assets/colombia-regions.geojson
// (hand-fitted to the regions' real physiographic boundaries, not department
// lines — several departments straddle two regions in reality).
export const REGIONS = [
  { id: 'Caribbean', name: 'Caribbean', blurb: 'Coastal rhythms — cumbia, vallenato, champeta and bullerengue — shaped by African, Indigenous and Spanish heritage.' },
  { id: 'Pacific', name: 'Pacific', blurb: 'Afro-Colombian currulao and marimba music from the rainforested coast.' },
  { id: 'Andean', name: 'Andean', blurb: 'Bambuco, pasillo and carranga from the highland heartland around Bogotá and the coffee region.' },
  { id: 'Orinoquia', name: 'Orinoquía', blurb: 'Joropo — harp, cuatro and vocals — from the eastern plains and cattle country.' },
  { id: 'Amazonia', name: 'Amazonia', blurb: "Colombia's least commercially documented tradition, rooted in Indigenous communities along the river." },
  { id: 'Insular', name: 'Insular', blurb: 'Calypso, reggae and mento from the archipelago of San Andrés, Providencia and Santa Catalina.' }
];
