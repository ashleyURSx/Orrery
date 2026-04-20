// orrery/shared/fixture-data.js
// 50-person Cork/Kessler/O'Sullivan test lineage. Phase 1 only.
// Short mnemonic ids (g1a..g5j) make console queries readable.

import {
  exactDate, approxDate, beforeDate, afterDate, betweenDates,
} from './events.js';

/* -------------------------------------------------------------------------- */
/*  Places                                                                     */
/* -------------------------------------------------------------------------- */

export const PLACES = [
  {
    id: 'place-cork', name: 'County Cork, Ireland', modern_name: 'County Cork, Ireland',
    lat: 51.8985, lon: -8.4756,
    historical_jurisdictions: [
      { name: 'United Kingdom of Great Britain and Ireland', from: 1801, to: 1922 },
      { name: 'Irish Free State', from: 1922, to: 1937 },
      { name: 'Republic of Ireland', from: 1937, to: null },
    ],
  },
  {
    id: 'place-hanover', name: 'Hanover, Kingdom of Hanover', modern_name: 'Hanover, Germany',
    lat: 52.3759, lon: 9.7320,
    historical_jurisdictions: [
      { name: 'Kingdom of Hanover', from: 1814, to: 1866 },
      { name: 'Province of Hanover, Prussia', from: 1866, to: 1918 },
      { name: 'Lower Saxony, Germany', from: 1946, to: null },
    ],
  },
  {
    id: 'place-prussia', name: 'Königsberg, Prussia', modern_name: 'Kaliningrad, Russia',
    lat: 54.7104, lon: 20.4522,
    historical_jurisdictions: [
      { name: 'Kingdom of Prussia', from: 1701, to: 1871 },
      { name: 'German Empire', from: 1871, to: 1918 },
      { name: 'Weimar Republic', from: 1918, to: 1933 },
      { name: 'Soviet Union (Kaliningrad)', from: 1945, to: 1991 },
      { name: 'Russia', from: 1991, to: null },
    ],
  },
  { id: 'place-boston', name: 'Boston, Massachusetts', modern_name: 'Boston, MA, USA', lat: 42.3601, lon: -71.0589, historical_jurisdictions: [] },
  { id: 'place-nyc', name: 'New York, New York', modern_name: 'New York, NY, USA', lat: 40.7128, lon: -74.0060, historical_jurisdictions: [] },
  { id: 'place-ellis', name: 'Ellis Island', modern_name: 'Ellis Island, NY/NJ, USA', lat: 40.6993, lon: -74.0396, historical_jurisdictions: [] },
  { id: 'place-cleveland', name: 'Cleveland, Ohio', modern_name: 'Cleveland, OH, USA', lat: 41.4993, lon: -81.6944, historical_jurisdictions: [] },
  { id: 'place-cincinnati', name: 'Cincinnati, Ohio', modern_name: 'Cincinnati, OH, USA', lat: 39.1031, lon: -84.5120, historical_jurisdictions: [] },
];

/* -------------------------------------------------------------------------- */
/*  Sources                                                                    */
/* -------------------------------------------------------------------------- */

export const SOURCES = [
  { id: 'src-cork-baptism-1822', type: 'church-record',
    citation: 'Cork Parish Register, St. Finbarr Cathedral, baptism of Patrick O\'Sullivan, 14 Jun 1822.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-ship-manifest-1850', type: 'ship-manifest',
    citation: 'Passenger List of the SS Jeanie Johnston, Cork → Boston, arrived 3 Sep 1850.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-ellis-1853', type: 'ship-manifest',
    citation: 'Ellis Island arrival manifest, Wilhelm Kessler, SS Bremen, 12 Apr 1853.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-us-census-1860', type: 'census',
    citation: '1860 U.S. Federal Census, Suffolk County, MA, Boston Ward 6, p. 412.',
    confidence: 'medium', truth_stamp: 'verified' },
  { id: 'src-us-census-1880', type: 'census',
    citation: '1880 U.S. Federal Census, Cuyahoga County, OH, Cleveland, p. 89.',
    confidence: 'medium', truth_stamp: 'verified' },
  { id: 'src-us-census-1900', type: 'census',
    citation: '1900 U.S. Federal Census, Cuyahoga County, OH, Cleveland, ED 312, p. 14.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-us-census-1920', type: 'census',
    citation: '1920 U.S. Federal Census, Hamilton County, OH, Cincinnati, ED 78, p. 23.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-marriage-boston-1880', type: 'vital-record',
    citation: 'Massachusetts Marriage Records, 1880, James O\'Sullivan & Anne MacCarthy, Boston.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-marriage-cleveland-1911', type: 'vital-record',
    citation: 'Ohio Marriage Records, Cuyahoga Co, 1911, Patrick J. O\'Sullivan & Margarethe Kessler.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-death-cert-1910', type: 'vital-record',
    citation: 'Ohio Death Certificate, Helen (Walsh) O\'Sullivan, 18 Nov 1910, Cleveland.',
    confidence: 'high', truth_stamp: 'verified' },
  { id: 'src-tombstone-mtcarmel', type: 'tombstone',
    citation: 'Mount Carmel Cemetery, Cleveland, OH, section 14, headstone photographs 2019.',
    confidence: 'medium', truth_stamp: 'verified' },
  { id: 'src-family-bible-osullivan', type: 'letter',
    citation: 'O\'Sullivan Family Bible, inscriptions 1852–1945, currently held by P. J. O\'Sullivan III.',
    confidence: 'medium', truth_stamp: 'verified' },
  { id: 'src-oral-aunt-bridget', type: 'oral-history',
    citation: 'Oral history interview with Bridget O\'Sullivan, recorded by A. Osborne, 1962.',
    confidence: 'low', truth_stamp: 'unverified' },
  { id: 'src-adoption-1955', type: 'government-record',
    citation: 'Cuyahoga County Probate Court, adoption decree, Ruth Chen, 1955.',
    confidence: 'high', truth_stamp: 'verified' },
];

/* -------------------------------------------------------------------------- */
/*  Persons — Generation 1 (immigrant generation, born 1820–1835)              */
/* -------------------------------------------------------------------------- */

const g1 = [
  { id: 'g1a', name: "Patrick O'Sullivan", sex: 'M', aka: ['Paddy'],
    vitals: {
      birth: { date: exactDate(1822, 6, 14), place_id: 'place-cork', source_ids: ['src-cork-baptism-1822'] },
      death: { date: exactDate(1891, 11, 2), place_id: 'place-boston', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Emigrated from Cork during the Great Famine, 1850.' },
  { id: 'g1b', name: 'Mary Donnelly', sex: 'F', aka: ['Mary Donnelly O\'Sullivan'],
    vitals: {
      birth: { date: approxDate(1824, null, null, 'ABT 1824'), place_id: 'place-cork', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1893, 4, 18), place_id: 'place-boston', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g1c', name: 'Sean MacCarthy', sex: 'M', aka: [],
    vitals: {
      birth: { date: approxDate(1820), place_id: 'place-cork', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1885, 9, 12), place_id: 'place-boston', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g1d', name: 'Bridget Ryan', sex: 'F', aka: ['Bridget Ryan MacCarthy'],
    vitals: {
      birth: { date: approxDate(1825), place_id: 'place-cork', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1890, 7, 3), place_id: 'place-boston', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g1e', name: 'Wilhelm Kessler', sex: 'M', aka: ['William Kessler'],
    vitals: {
      birth: { date: exactDate(1830, 3, 22), place_id: 'place-hanover', source_ids: ['src-ellis-1853'] },
      death: { date: exactDate(1902, 1, 14), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Arrived Ellis Island 1853 on SS Bremen.' },
  { id: 'g1f', name: 'Elisabeth Müller', sex: 'F', aka: ['Elisabeth Mueller Kessler'],
    vitals: {
      birth: { date: approxDate(1835), place_id: 'place-hanover', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1910, 6, 8), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g1g', name: 'Hans Schmidt', sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1828, 5, 9), place_id: 'place-prussia', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1898, 12, 21), place_id: 'place-nyc', source_ids: ['src-us-census-1900'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g1h', name: 'Katharina Becker', sex: 'F', aka: ['Katharina Becker Schmidt'],
    vitals: {
      birth: { date: approxDate(1832), place_id: 'place-prussia', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1905, 2, 16), place_id: 'place-nyc', source_ids: ['src-us-census-1900'] },
    },
    research_status: 'complete', privacy: 'family' },
];

/* -------------------------------------------------------------------------- */
/*  Persons — Generation 2 (first US-born, 1852–1865)                          */
/* -------------------------------------------------------------------------- */

const g2 = [
  { id: 'g2a', name: "James O'Sullivan", sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1852, 2, 10), place_id: 'place-boston', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1920, 8, 5), place_id: 'place-cleveland', source_ids: ['src-us-census-1920'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2b', name: "Margaret O'Sullivan", sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1854, 7, 22), place_id: 'place-boston', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1925, 3, 14), place_id: 'place-boston', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2c', name: 'Anne MacCarthy', sex: 'F', aka: ["Anne MacCarthy O'Sullivan"],
    vitals: {
      birth: { date: exactDate(1855, 4, 3), place_id: 'place-boston', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1922, 10, 19), place_id: 'place-cleveland', source_ids: ['src-us-census-1920'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2d', name: 'Thomas MacCarthy', sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1858, 11, 8), place_id: 'place-boston', source_ids: ['src-us-census-1860'] },
      death: { date: exactDate(1915, 1, 27), place_id: 'place-boston', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2e', name: 'Friedrich Kessler', sex: 'M', aka: ['Fred Kessler'],
    vitals: {
      birth: { date: exactDate(1858, 9, 15), place_id: 'place-nyc', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1930, 4, 2), place_id: 'place-cleveland', source_ids: ['src-us-census-1920'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2f', name: 'Heinrich Kessler Sr.', sex: 'M', aka: ['Henry Kessler'],
    vitals: {
      birth: { date: exactDate(1862, 6, 30), place_id: 'place-nyc', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1935, 11, 8), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2g', name: 'Greta Schmidt', sex: 'F', aka: ['Greta Schmidt Kessler'],
    vitals: {
      birth: { date: exactDate(1860, 10, 5), place_id: 'place-nyc', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1928, 7, 11), place_id: 'place-cleveland', source_ids: ['src-us-census-1920'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g2h', name: 'Elsa Schmidt', sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1865, 3, 17), place_id: 'place-nyc', source_ids: ['src-us-census-1880'] },
      death: { date: exactDate(1940, 5, 23), place_id: 'place-nyc', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
];

/* -------------------------------------------------------------------------- */
/*  Persons — Generation 3 (born 1880–1895, the cross-lineage marriage)        */
/* -------------------------------------------------------------------------- */
//
// g3a (Patrick James O'Sullivan) bridges Irish and German lines — marries
// Helen Walsh first (dies 1910), then Margarethe Kessler in 1911.
//
// g3b (Helen Walsh) carries the UNVERIFIED birth — no source_ids on her
// birth vital. This is the Truth Stamper distinction Ashley asked to see.

const g3 = [
  { id: 'g3a', name: "Patrick James O'Sullivan", sex: 'M', aka: ['P.J. O\'Sullivan'],
    vitals: {
      birth: { date: exactDate(1885, 5, 1), place_id: 'place-boston', source_ids: ['src-family-bible-osullivan', 'src-us-census-1900'] },
      death: { date: exactDate(1955, 9, 14), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Widowed 1910, remarried 1911. The hinge of the Irish-German merger.' },
  // --- INTENTIONALLY UNVERIFIED: Helen Walsh's birth has no source_ids. ---
  { id: 'g3b', name: 'Helen Walsh', sex: 'F', aka: ["Helen Walsh O'Sullivan"],
    vitals: {
      birth: { date: approxDate(1886, null, null, 'ABT 1886'), place_id: 'place-boston', source_ids: [] },
      death: { date: exactDate(1910, 11, 18), place_id: 'place-cleveland', source_ids: ['src-death-cert-1910'] },
    },
    research_status: 'incomplete', privacy: 'family',
    notes: 'First wife of g3a. Birth date is family-oral-history only — UNVERIFIED.' },
  { id: 'g3c', name: "Michael O'Sullivan", sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1887, 9, 12), place_id: 'place-boston', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1940, 2, 4), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3d', name: "Bridget O'Sullivan", sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1890, 2, 19), place_id: 'place-boston', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1965, 6, 21), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3e', name: "Maeve O'Sullivan", sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1893, 11, 30), place_id: 'place-cleveland', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1975, 8, 2), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3f', name: 'Margarethe Kessler', sex: 'F', aka: ['Margarethe Kessler O\'Sullivan', 'Marguerite'],
    vitals: {
      birth: { date: exactDate(1892, 4, 6), place_id: 'place-cleveland', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1970, 12, 11), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3g', name: 'Wilhelm Kessler II', sex: 'M', aka: ['William Kessler Jr.'],
    vitals: {
      birth: { date: exactDate(1885, 7, 9), place_id: 'place-cleveland', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1950, 3, 28), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3h', name: 'Heinrich Kessler Jr.', sex: 'M', aka: ['Henry Kessler Jr.'],
    vitals: {
      birth: { date: exactDate(1888, 12, 5), place_id: 'place-cleveland', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1960, 5, 17), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3i', name: 'Otto Kessler', sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1895, 1, 23), place_id: 'place-cleveland', source_ids: ['src-us-census-1900'] },
      death: { date: exactDate(1970, 10, 4), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3j', name: 'Father Michael Kelly', sex: 'M', aka: ['Fr. Kelly'],
    vitals: {
      birth: { date: approxDate(1880), place_id: 'place-cork', source_ids: ['src-oral-aunt-bridget'] },
      death: { date: exactDate(1960, 8, 9), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'incomplete', privacy: 'family',
    notes: 'Parish priest, godparent to several of g3a\'s children. Chosen-family edge.' },
  // --- Spouse-family line: Walsh (g3k, g3l) + Brenner (g3m, g3n) ---
  { id: 'g3k', name: 'John Walsh Sr.', sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1885, 3, 15), place_id: 'place-cork', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1960, 11, 2), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3l', name: 'Bridget Connolly', sex: 'F', aka: ['Bridget Connolly Walsh'],
    vitals: {
      birth: { date: exactDate(1888, 6, 12), place_id: 'place-cork', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1965, 4, 8), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3m', name: 'Heinrich Brenner', sex: 'M', aka: ['Henry Brenner'],
    vitals: {
      birth: { date: exactDate(1882, 8, 20), place_id: 'place-hanover', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1955, 1, 15), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g3n', name: 'Anna Weber', sex: 'F', aka: ['Anna Weber Brenner'],
    vitals: {
      birth: { date: exactDate(1885, 10, 3), place_id: 'place-hanover', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1960, 9, 19), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
];

/* -------------------------------------------------------------------------- */
/*  Persons — Generation 4 (born 1908–1925, merged Irish-German-Walsh line)    */
/* -------------------------------------------------------------------------- */
//
// g4a (Thomas) is child of g3a+g3b (Helen, d. 1910) — half-sibling to g4b-e.
// g4b-e are children of g3a+g3f (Margarethe, m. 1911).

const g4 = [
  { id: 'g4a', name: "Thomas Sullivan O'Sullivan", sex: 'M', aka: ['Tommy Sr.'],
    vitals: {
      birth: { date: exactDate(1908, 7, 14), place_id: 'place-cleveland', source_ids: ['src-us-census-1920', 'src-family-bible-osullivan'] },
      death: { date: exactDate(1980, 3, 19), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Only child of g3a\'s first marriage (to Helen Walsh). Half-sibling to g4b-e.' },
  { id: 'g4b', name: "John Francis O'Sullivan", sex: 'M', aka: ['Jack O\'Sullivan'],
    vitals: {
      birth: { date: exactDate(1912, 4, 8), place_id: 'place-cleveland', source_ids: ['src-us-census-1920', 'src-family-bible-osullivan'] },
      death: { date: exactDate(1985, 10, 17), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g4c', name: "Mary O'Sullivan", sex: 'F', aka: ['Mary O\'Sullivan Brenner'],
    vitals: {
      birth: { date: exactDate(1915, 9, 22), place_id: 'place-cleveland', source_ids: ['src-family-bible-osullivan'] },
      death: { date: exactDate(2000, 2, 3), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g4d', name: "Robert O'Sullivan", sex: 'M', aka: ['Bob O\'Sullivan'],
    vitals: {
      birth: { date: exactDate(1918, 1, 11), place_id: 'place-cleveland', source_ids: ['src-family-bible-osullivan'] },
      death: { date: exactDate(1982, 6, 30), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g4e', name: "Anne O'Sullivan", sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1921, 5, 27), place_id: 'place-cleveland', source_ids: ['src-family-bible-osullivan'] },
      death: { date: exactDate(2010, 11, 8), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Unmarried; adoptive mother of g5i (Ruth Chen O\'Sullivan).' },
  { id: 'g4f', name: 'Sarah Fitzgerald', sex: 'F', aka: ['Sarah Fitzgerald O\'Sullivan'],
    vitals: {
      birth: { date: exactDate(1910, 8, 3), place_id: 'place-boston', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1990, 12, 22), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g4g', name: 'Eleanor Walsh', sex: 'F', aka: ['Eleanor Walsh O\'Sullivan'],
    vitals: {
      birth: { date: exactDate(1915, 2, 14), place_id: 'place-cleveland', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1990, 7, 4), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g4h', name: 'Carl Brenner', sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1914, 11, 29), place_id: 'place-cincinnati', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1990, 5, 12), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g4i', name: 'Patrick Walsh Jr.', sex: 'M', aka: ['Pat Walsh'],
    vitals: {
      birth: { date: exactDate(1920, 6, 6), place_id: 'place-cleveland', source_ids: ['src-us-census-1920'] },
      death: { date: exactDate(1985, 9, 30), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Brother of Eleanor Walsh (g4g). Provides a cousin branch via the Walsh line.' },
  { id: 'g4j', name: 'Patricia Murphy', sex: 'F', aka: ['Patricia Murphy Walsh'],
    vitals: {
      birth: { date: exactDate(1922, 10, 18), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
      death: { date: exactDate(2005, 8, 14), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
];

/* -------------------------------------------------------------------------- */
/*  Persons — Generation 5 (born 1935–1955, living generation for most)        */
/* -------------------------------------------------------------------------- */
//
// g5i (Ruth) is adopted by g4e (Anne O'Sullivan) — a single adoptive mother.

const g5 = [
  { id: 'g5a', name: "Thomas O'Sullivan Jr.", sex: 'M', aka: ['Tom Jr.'],
    vitals: {
      birth: { date: exactDate(1935, 3, 7), place_id: 'place-cleveland', source_ids: ['src-family-bible-osullivan'] },
      death: { date: exactDate(2010, 9, 2), place_id: 'place-cleveland', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5b', name: "Elizabeth O'Sullivan", sex: 'F', aka: ['Liz'],
    vitals: {
      birth: { date: exactDate(1938, 6, 15), place_id: 'place-cleveland', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5c', name: "Patrick John O'Sullivan", sex: 'M', aka: ['Pat Jr.'],
    vitals: {
      birth: { date: exactDate(1945, 2, 20), place_id: 'place-cincinnati', source_ids: ['src-family-bible-osullivan'] },
      death: { date: exactDate(2020, 5, 11), place_id: 'place-cincinnati', source_ids: ['src-tombstone-mtcarmel'] },
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5d', name: "Mary Elizabeth O'Sullivan", sex: 'F', aka: ['Beth'],
    vitals: {
      birth: { date: exactDate(1948, 11, 4), place_id: 'place-cincinnati', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5e', name: "James Walsh O'Sullivan", sex: 'M', aka: ['Jamie'],
    vitals: {
      birth: { date: exactDate(1952, 8, 13), place_id: 'place-cincinnati', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5f', name: 'Carl Brenner Jr.', sex: 'M', aka: [],
    vitals: {
      birth: { date: exactDate(1940, 4, 2), place_id: 'place-cincinnati', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5g', name: 'Anna Brenner', sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1943, 7, 28), place_id: 'place-cincinnati', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5h', name: 'William Brenner', sex: 'M', aka: ['Bill'],
    vitals: {
      birth: { date: exactDate(1946, 12, 10), place_id: 'place-cincinnati', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
  { id: 'g5i', name: "Ruth Chen O'Sullivan", sex: 'F', aka: ['Ruth Chen'],
    vitals: {
      birth: { date: exactDate(1955, 5, 9), place_id: 'place-cleveland', source_ids: ['src-adoption-1955'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family',
    notes: 'Adopted by g4e (Anne O\'Sullivan) in 1955. Non-biological line.' },
  { id: 'g5j', name: 'Linda Walsh', sex: 'F', aka: [],
    vitals: {
      birth: { date: exactDate(1948, 9, 16), place_id: 'place-cleveland', source_ids: ['src-family-bible-osullivan'] },
      death: null,
    },
    research_status: 'complete', privacy: 'family' },
];

/* -------------------------------------------------------------------------- */
/*  Combined person array                                                      */
/* -------------------------------------------------------------------------- */

export const PERSONS = [...g1, ...g2, ...g3, ...g4, ...g5];
// Sanity check: 8 + 8 + 14 + 10 + 10 = 50.

/* -------------------------------------------------------------------------- */
/*  Relationship helpers                                                       */
/* -------------------------------------------------------------------------- */

let _relId = 0;
const rel = (a, b, type, extra = {}) => ({
  id: `rel-${String(++_relId).padStart(3, '0')}`,
  person_a_id: a, person_b_id: b, type,
  start_date: null, end_date: null, source_ids: [],
  ...extra,
});

// parent-of edge: a=parent, b=child, biological=true by default
const parent = (a, b, extra = {}) => rel(a, b, 'parent', { biological: true, ...extra });
const spouse = (a, b, extra = {}) => rel(a, b, 'spouse', extra);

export const RELATIONSHIPS = [
  /* --- G1 marriages --- */
  spouse('g1a', 'g1b', { start_date: exactDate(1848, 4, 12), source_ids: ['src-ship-manifest-1850'] }),
  spouse('g1c', 'g1d', { start_date: exactDate(1850, 6, 3) }),
  spouse('g1e', 'g1f', { start_date: exactDate(1854, 5, 7), source_ids: ['src-ellis-1853'] }),
  spouse('g1g', 'g1h', { start_date: exactDate(1856, 9, 1) }),

  /* --- G1 → G2 (biological parent edges) --- */
  parent('g1a', 'g2a'), parent('g1b', 'g2a'),
  parent('g1a', 'g2b'), parent('g1b', 'g2b'),
  parent('g1c', 'g2c'), parent('g1d', 'g2c'),
  parent('g1c', 'g2d'), parent('g1d', 'g2d'),
  parent('g1e', 'g2e'), parent('g1f', 'g2e'),
  parent('g1e', 'g2f'), parent('g1f', 'g2f'),
  parent('g1g', 'g2g'), parent('g1h', 'g2g'),
  parent('g1g', 'g2h'), parent('g1h', 'g2h'),

  /* --- G2 marriages (the Irish side + German side stay within their lines) --- */
  spouse('g2a', 'g2c', { start_date: exactDate(1880, 6, 14), source_ids: ['src-marriage-boston-1880'] }),
  spouse('g2e', 'g2g', { start_date: exactDate(1884, 9, 20) }),

  /* --- G2 → G3 --- */
  parent('g2a', 'g3a'), parent('g2c', 'g3a'),
  parent('g2a', 'g3c'), parent('g2c', 'g3c'),
  parent('g2a', 'g3d'), parent('g2c', 'g3d'),
  parent('g2a', 'g3e'), parent('g2c', 'g3e'),
  parent('g2e', 'g3f'), parent('g2g', 'g3f'),
  parent('g2e', 'g3g'), parent('g2g', 'g3g'),
  parent('g2e', 'g3h'), parent('g2g', 'g3h'),
  parent('g2e', 'g3i'), parent('g2g', 'g3i'),

  /* --- G3 marriages (the cross-lineage hinge) --- */
  // First marriage: g3a × g3b. Ended by Helen's death 1910.
  spouse('g3a', 'g3b', {
    start_date: exactDate(1907, 10, 12),
    end_date: exactDate(1910, 11, 18),
    source_ids: ['src-death-cert-1910'],
  }),
  // Second marriage: g3a × g3f. The Irish-German merger.
  spouse('g3a', 'g3f', {
    start_date: exactDate(1911, 6, 17),
    source_ids: ['src-marriage-cleveland-1911'],
  }),
  // Walsh + Brenner spouse-line marriages (parents of g4g, g4h)
  spouse('g3k', 'g3l', { start_date: exactDate(1912, 4, 30) }),
  spouse('g3m', 'g3n', { start_date: exactDate(1910, 7, 22) }),

  /* --- G3 → G4 --- */
  // g4a is the only child of g3a's first marriage (half-sibling to g4b-e).
  parent('g3a', 'g4a'), parent('g3b', 'g4a'),
  parent('g3a', 'g4b'), parent('g3f', 'g4b'),
  parent('g3a', 'g4c'), parent('g3f', 'g4c'),
  parent('g3a', 'g4d'), parent('g3f', 'g4d'),
  parent('g3a', 'g4e'), parent('g3f', 'g4e'),
  parent('g3k', 'g4g'), parent('g3l', 'g4g'),
  parent('g3k', 'g4i'), parent('g3l', 'g4i'),
  parent('g3m', 'g4h'), parent('g3n', 'g4h'),

  /* --- G3 godparent edges (chosen family / non-traditional) --- */
  rel('g3j', 'g4a', 'godparent'),
  rel('g3j', 'g4b', 'godparent'),
  rel('g3j', 'g4c', 'godparent'),

  /* --- G4 marriages --- */
  spouse('g4a', 'g4f', { start_date: exactDate(1934, 5, 19) }),
  spouse('g4b', 'g4g', { start_date: exactDate(1940, 8, 3) }),
  spouse('g4c', 'g4h', { start_date: exactDate(1938, 10, 22) }),
  spouse('g4i', 'g4j', { start_date: exactDate(1946, 4, 6) }),

  /* --- G4 → G5 --- */
  parent('g4a', 'g5a'), parent('g4f', 'g5a'),
  parent('g4a', 'g5b'), parent('g4f', 'g5b'),
  parent('g4b', 'g5c'), parent('g4g', 'g5c'),
  parent('g4b', 'g5d'), parent('g4g', 'g5d'),
  parent('g4b', 'g5e'), parent('g4g', 'g5e'),
  parent('g4c', 'g5f'), parent('g4h', 'g5f'),
  parent('g4c', 'g5g'), parent('g4h', 'g5g'),
  parent('g4c', 'g5h'), parent('g4h', 'g5h'),
  parent('g4i', 'g5j'), parent('g4j', 'g5j'),

  /* --- Adoption: g4e (Anne, single) adopts g5i (Ruth Chen) --- */
  rel('g4e', 'g5i', 'adoptive-parent', {
    biological: false, adoptive: true,
    start_date: exactDate(1955, 5, 9),
    source_ids: ['src-adoption-1955'],
  }),
];
