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
