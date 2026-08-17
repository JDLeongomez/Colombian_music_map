// Seed data for the Colombian Music explorer.
// Structured to mirror a spreadsheet: one row per example. To add a new
// example, append an object with these exact fields (lat/lon place the dot
// on the map; youtubeId is the part after "v=" in a YouTube URL).
export const TRACKS = [
  { id: 't1', title: 'La Gota Fría', artist: 'Carlos Vives', year: 1993, genre: 'Vallenato', region: 'Caribbean', location: 'Valledupar, Cesar', lat: 10.46, lon: -73.25, youtubeId: 'cMn3ortVBeE' },
  { id: 't2', title: 'Representative bullerengue recording', artist: 'Petrona Martínez', year: 2000, genre: 'Bullerengue', region: 'Caribbean', location: 'San Cayetano, Bolívar', lat: 9.95, lon: -75.08, youtubeId: 'KvkfwJNbbR4' },
  { id: 't3', title: 'De Donde Vengo Yo', artist: 'ChocQuibTown', year: 2009, genre: 'Afro-Colombian hip hop', region: 'Pacific', location: 'Condoto / Quibdó, Chocó', lat: 5.10, lon: -76.65, youtubeId: 'yMS4J6Gp6e4' },
  { id: 't4', title: 'Te Invito', artist: 'Herencia de Timbiquí', year: 2013, genre: 'Currulao / Pacific fusion', region: 'Pacific', location: 'Timbiquí, Cauca', lat: 2.77, lon: -77.67, youtubeId: 'eaKG17XoQ48' },
  { id: 't5', title: 'La Cucharita', artist: 'Jorge Velosa y Los Carrangueros de Ráquira', year: 1976, genre: 'Carranga', region: 'Andean', location: 'Ráquira, Boyacá', lat: 5.54, lon: -73.63, youtubeId: '' },
  { id: 't6', title: 'Bolero Falaz', artist: 'Aterciopelados', year: 1995, genre: 'Andean rock', region: 'Andean', location: 'Bogotá', lat: 4.71, lon: -74.07, youtubeId: '' },
  { id: 't7', title: 'Auténtica Llanera', artist: 'Cimarrón', year: 2019, genre: 'Joropo', region: 'Orinoquia', location: 'Arauca, Arauca', lat: 7.09, lon: -70.76, youtubeId: '-5Ysgt8NziE' },
  { id: 't8', title: 'Carmentea', artist: 'Luis Ariel Rey', year: 1975, genre: 'Joropo', region: 'Orinoquia', location: 'Tame, Arauca', lat: 6.46, lon: -71.73, youtubeId: 'mtu0CDGgnZs' },
  { id: 't9', title: 'Amazonian popular song', artist: 'Pedro Bernal', year: 2010, genre: 'Música popular amazonense', region: 'Amazonia', location: 'Leticia, Amazonas', lat: -4.22, lon: -69.94, youtubeId: '' },
  { id: 't10', title: 'Traditional Tikuna song', artist: 'Tikuna community musicians', year: null, genre: 'Indigenous ceremonial music', region: 'Amazonia', location: 'Puerto Nariño, Amazonas', lat: -3.77, lon: -70.30, youtubeId: '' },
  { id: 't11', title: 'Sun a Shine', artist: 'Elkin Robinson', year: 2017, genre: 'Reggae / Calypso', region: 'Insular', location: 'Providencia', lat: 13.35, lon: -81.37, youtubeId: 'I2X2U5YqfyY' },
  { id: 't12', title: "Come 'Round", artist: 'Elkin Robinson', year: 2014, genre: 'Reggae / Calypso', region: 'Insular', location: 'San Andrés', lat: 12.58, lon: -81.70, youtubeId: 'PBaYp8U_z7I' }
];

export const REGIONS = [
  { name: 'Caribbean', blurb: 'Coastal rhythms — cumbia, vallenato, champeta and bullerengue — shaped by African, Indigenous and Spanish heritage.' },
  { name: 'Pacific', blurb: 'Afro-Colombian currulao and marimba music from the rainforested coast.' },
  { name: 'Andean', blurb: 'Bambuco, pasillo and carranga from the highland heartland around Bogotá and the coffee region.' },
  { name: 'Orinoquia', blurb: 'Joropo — harp, cuatro and vocals — from the eastern plains and cattle country.' },
  { name: 'Amazonia', blurb: "Colombia's least commercially documented tradition, rooted in Indigenous communities along the river." },
  { name: 'Insular', blurb: 'Calypso, reggae and mento from the archipelago of San Andrés, Providencia and Santa Catalina.' }
];
