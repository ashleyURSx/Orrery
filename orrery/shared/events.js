// orrery/shared/events.js
// Entity validators, type enums, and date helpers for ORRERY.
//
// The seven entities from db.js flow through this module. Every write goes
// through a validate* function, which throws on structural violations.
// We do NOT try to repair bad data here — repair is a migration concern.
//
// Date model: GEDCOM-compatible envelope. A `date` value is either null or
// an object with a `kind` discriminator:
//   { kind: 'exact',       year, month?, day? }
//   { kind: 'approximate', year, month?, day?, raw? }     // "ABT 1842"
//   { kind: 'before',      year, month?, day? }           // "BEF 1850"
//   { kind: 'after',       year, month?, day? }           // "AFT 1850"
//   { kind: 'between',     start: {year, month?, day?}, end: {year, month?, day?} }
//   { kind: 'unknown',     raw? }
//
// Phase 2 (GEDCOM) will round-trip through these shapes unchanged.

/* -------------------------------------------------------------------------- */
/*  Type enums                                                                 */
/* -------------------------------------------------------------------------- */

export const SEX = Object.freeze(['M', 'F', 'X', 'U']); // male, female, intersex/nonbinary, unknown

export const RESEARCH_STATUS = Object.freeze([
  'complete',
  'incomplete',
  'conflicting',
  'unknown',
]);

export const PRIVACY = Object.freeze([
  'public',
  'family',
  'private',
  'encrypted',
]);

export const EVENT_TYPES = Object.freeze([
  'birth',
  'death',
  'marriage',
  'divorce',
  'immigration',
  'emigration',
  'residence',
  'occupation',
  'education',
  'military',
  'religious',
  'baptism',
  'burial',
  'adoption',
  'naturalization',
  'imprisonment',
  'emancipation',
  'enslavement',
  'chosen-family',
]);

export const SOURCE_TYPES = Object.freeze([
  'census',
  'vital-record',
  'newspaper',
  'oral-history',
  'dna',
  'photograph',
  'letter',
  'government-record',
  'ship-manifest',
  'military-record',
  'church-record',
  'deed',
  'will',
  'probate',
  'tombstone',
  'other',
]);

export const CONFIDENCE = Object.freeze(['high', 'medium', 'low', 'disputed']);

export const TRUTH_STAMP = Object.freeze(['verified', 'unverified', 'contested']);

export const MEDIA_TYPES = Object.freeze([
  'photo',
  'audio',
  'video',
  'document',
  'scan',
]);

export const RELATIONSHIP_TYPES = Object.freeze([
  'parent',
  'child',
  'spouse',
  'partner',
  'sibling',
  'half-sibling',
  'step-parent',
  'step-child',
  'adoptive-parent',
  'adopted-child',
  'foster',
  'godparent',
  'godchild',
  'enslaver',
  'enslaved-by',
  'witness',
  'business-partner',
  'chosen-family',
]);

/**
 * Parent-like edges pointing from parent to child. Used by relationships.js
 * to build ancestor/descendant queries. The second element in each pair is
 * the flag we set on the resulting edge.
 */
export const PARENT_EDGE_TYPES = Object.freeze([
  'parent',
  'adoptive-parent',
  'step-parent',
  'foster',
  'godparent',
]);

/** Edges whose `type` implies a biological parent link. */
export const BIOLOGICAL_PARENT_TYPES = Object.freeze(['parent']);

export const HEIRLOOM_TYPES = Object.freeze([
  'document',
  'jewelry',
  'furniture',
  'textile',
  'tool',
  'photograph',
  'land',
  'recipe',
  'song',
  'ritual',
  'other',
]);

export const DATE_KINDS = Object.freeze([
  'exact',
  'approximate',
  'before',
  'after',
  'between',
  'unknown',
]);

/* -------------------------------------------------------------------------- */
/*  Internal guards                                                            */
/* -------------------------------------------------------------------------- */

function _isString(x) {
  return typeof x === 'string';
}

function _isNonEmptyString(x) {
  return typeof x === 'string' && x.trim().length > 0;
}

function _isArrayOfStrings(x) {
  return Array.isArray(x) && x.every(_isString);
}

function _enumCheck(name, value, allowed, { nullable = false } = {}) {
  if (value == null) {
    if (nullable) return;
    throw new TypeError(`${name}: missing value (expected one of ${allowed.join(', ')})`);
  }
  if (!allowed.includes(value)) {
    throw new TypeError(
      `${name}: "${value}" not in allowed set [${allowed.join(', ')}]`
    );
  }
}

function _require(obj, key, pred, msg) {
  if (!pred(obj[key])) {
    throw new TypeError(`${msg} (got ${JSON.stringify(obj[key])})`);
  }
}

/* -------------------------------------------------------------------------- */
/*  Date helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Construct an exact date. All components optional except year.
 */
export function exactDate(year, month = null, day = null) {
  return { kind: 'exact', year, month, day };
}

export function approxDate(year, month = null, day = null, raw = null) {
  return { kind: 'approximate', year, month, day, raw };
}

export function beforeDate(year, month = null, day = null) {
  return { kind: 'before', year, month, day };
}

export function afterDate(year, month = null, day = null) {
  return { kind: 'after', year, month, day };
}

export function betweenDates(start, end) {
  return { kind: 'between', start, end };
}

export function unknownDate(raw = null) {
  return { kind: 'unknown', raw };
}

/**
 * Validate a date envelope. Returns normalized date or throws.
 */
export function validateDate(d, { field = 'date' } = {}) {
  if (d == null) return null;
  if (typeof d !== 'object') {
    throw new TypeError(`${field}: expected object or null, got ${typeof d}`);
  }
  _enumCheck(`${field}.kind`, d.kind, DATE_KINDS);

  switch (d.kind) {
    case 'exact':
    case 'approximate':
    case 'before':
    case 'after': {
      if (typeof d.year !== 'number' || !Number.isFinite(d.year)) {
        throw new TypeError(`${field}.year: expected finite number, got ${d.year}`);
      }
      if (d.month != null && (d.month < 1 || d.month > 12)) {
        throw new RangeError(`${field}.month: out of range (${d.month})`);
      }
      if (d.day != null && (d.day < 1 || d.day > 31)) {
        throw new RangeError(`${field}.day: out of range (${d.day})`);
      }
      return d;
    }
    case 'between': {
      if (!d.start || !d.end) {
        throw new TypeError(`${field}: between requires both start and end`);
      }
      if (typeof d.start.year !== 'number' || typeof d.end.year !== 'number') {
        throw new TypeError(`${field}: between endpoints need numeric years`);
      }
      return d;
    }
    case 'unknown':
      return d;
    default:
      throw new TypeError(`${field}.kind: unreachable`);
  }
}

/**
 * Extract the best-guess year from any date envelope. Used for timeline
 * indexing and contemporary queries where we need a single number.
 * Returns null if no year can be inferred.
 */
export function yearOf(d) {
  if (!d) return null;
  switch (d.kind) {
    case 'exact':
    case 'approximate':
    case 'before':
    case 'after':
      return typeof d.year === 'number' ? d.year : null;
    case 'between':
      // Midpoint is the safest single-year representation.
      if (d.start?.year != null && d.end?.year != null) {
        return Math.round((d.start.year + d.end.year) / 2);
      }
      return d.start?.year ?? d.end?.year ?? null;
    case 'unknown':
    default:
      return null;
  }
}

/**
 * Does `year` fall inside the range represented by `d`? "before X" includes
 * every year strictly less than X; "after X" every year strictly greater;
 * "between" is inclusive; "unknown" always returns false.
 */
export function yearMatches(d, year) {
  if (d == null || typeof year !== 'number') return false;
  switch (d.kind) {
    case 'exact':
    case 'approximate':
      return d.year === year;
    case 'before':
      return year < d.year;
    case 'after':
      return year > d.year;
    case 'between':
      return year >= (d.start?.year ?? -Infinity) && year <= (d.end?.year ?? Infinity);
    case 'unknown':
    default:
      return false;
  }
}

/* -------------------------------------------------------------------------- */
/*  Vital fact validator                                                       */
/* -------------------------------------------------------------------------- */

function validateVitalFact(v, field) {
  if (v == null) return;
  if (typeof v !== 'object') {
    throw new TypeError(`${field}: expected object or null`);
  }
  if (v.date !== undefined) validateDate(v.date, { field: `${field}.date` });
  if (v.place_id != null && !_isString(v.place_id)) {
    throw new TypeError(`${field}.place_id: expected string`);
  }
  if (v.source_ids != null && !_isArrayOfStrings(v.source_ids)) {
    throw new TypeError(`${field}.source_ids: expected string[]`);
  }
}

/* -------------------------------------------------------------------------- */
/*  Entity validators                                                          */
/* -------------------------------------------------------------------------- */

export function validatePerson(p) {
  if (!p || typeof p !== 'object') throw new TypeError('Person: not an object');
  _require(p, 'id', _isNonEmptyString, 'Person.id: expected non-empty string');
  _require(p, 'name', _isString, 'Person.name: expected string');
  if (!Array.isArray(p.aka)) throw new TypeError('Person.aka: expected array');
  if (!p.aka.every(_isString)) throw new TypeError('Person.aka: expected string[]');

  _enumCheck('Person.sex', p.sex, SEX, { nullable: true });
  // gender is free-text — we don't enum-lock it.
  if (p.gender != null && !_isString(p.gender)) {
    throw new TypeError('Person.gender: expected string or null');
  }

  _enumCheck('Person.research_status', p.research_status, RESEARCH_STATUS);
  _enumCheck('Person.privacy', p.privacy, PRIVACY);

  if (!p.vitals || typeof p.vitals !== 'object') {
    throw new TypeError('Person.vitals: expected object');
  }
  validateVitalFact(p.vitals.birth, 'Person.vitals.birth');
  validateVitalFact(p.vitals.death, 'Person.vitals.death');
  validateVitalFact(p.vitals.baptism, 'Person.vitals.baptism');
  validateVitalFact(p.vitals.burial, 'Person.vitals.burial');

  return p;
}

export function validateEvent(e) {
  if (!e || typeof e !== 'object') throw new TypeError('Event: not an object');
  _require(e, 'id', _isNonEmptyString, 'Event.id: expected non-empty string');
  _enumCheck('Event.type', e.type, EVENT_TYPES);

  if (!_isArrayOfStrings(e.person_ids)) {
    throw new TypeError('Event.person_ids: expected string[]');
  }
  if (e.person_ids.length === 0) {
    throw new TypeError(`Event ${e.id}: at least one person_id required`);
  }

  if (e.date !== undefined) validateDate(e.date, { field: 'Event.date' });

  if (e.place_id != null && !_isString(e.place_id)) {
    throw new TypeError('Event.place_id: expected string or null');
  }

  if (!_isArrayOfStrings(e.source_ids)) {
    throw new TypeError('Event.source_ids: expected string[]');
  }

  return e;
}

export function validateSource(s) {
  if (!s || typeof s !== 'object') throw new TypeError('Source: not an object');
  _require(s, 'id', _isNonEmptyString, 'Source.id: expected non-empty string');
  _enumCheck('Source.type', s.type, SOURCE_TYPES);
  if (!_isString(s.citation)) throw new TypeError('Source.citation: expected string');
  _enumCheck('Source.confidence', s.confidence, CONFIDENCE);
  _enumCheck('Source.truth_stamp', s.truth_stamp, TRUTH_STAMP);

  if (s.url != null && !_isString(s.url)) {
    throw new TypeError('Source.url: expected string or null');
  }
  if (s.file_id != null && !_isString(s.file_id)) {
    throw new TypeError('Source.file_id: expected string or null');
  }
  return s;
}

export function validateMedia(m) {
  if (!m || typeof m !== 'object') throw new TypeError('Media: not an object');
  _require(m, 'id', _isNonEmptyString, 'Media.id: expected non-empty string');
  _enumCheck('Media.type', m.type, MEDIA_TYPES);

  if (m.file_id != null && !_isString(m.file_id)) {
    throw new TypeError('Media.file_id: expected string or null');
  }

  if (!_isArrayOfStrings(m.linked_person_ids)) {
    throw new TypeError('Media.linked_person_ids: expected string[]');
  }
  if (!_isArrayOfStrings(m.linked_event_ids)) {
    throw new TypeError('Media.linked_event_ids: expected string[]');
  }
  if (m.date_taken !== undefined) validateDate(m.date_taken, { field: 'Media.date_taken' });
  return m;
}

export function validateRelationship(r) {
  if (!r || typeof r !== 'object') throw new TypeError('Relationship: not an object');
  _require(r, 'id', _isNonEmptyString, 'Relationship.id: expected non-empty string');
  _require(r, 'person_a_id', _isNonEmptyString, 'Relationship.person_a_id: required');
  _require(r, 'person_b_id', _isNonEmptyString, 'Relationship.person_b_id: required');
  _enumCheck('Relationship.type', r.type, RELATIONSHIP_TYPES);

  if (r.start_date !== undefined)
    validateDate(r.start_date, { field: 'Relationship.start_date' });
  if (r.end_date !== undefined)
    validateDate(r.end_date, { field: 'Relationship.end_date' });

  if (!_isArrayOfStrings(r.source_ids)) {
    throw new TypeError('Relationship.source_ids: expected string[]');
  }
  return r;
}

export function validatePlace(p) {
  if (!p || typeof p !== 'object') throw new TypeError('Place: not an object');
  _require(p, 'id', _isNonEmptyString, 'Place.id: expected non-empty string');
  _require(p, 'name', _isString, 'Place.name: expected string');
  if (p.modern_name != null && !_isString(p.modern_name)) {
    throw new TypeError('Place.modern_name: expected string or null');
  }
  if (p.lat != null && (typeof p.lat !== 'number' || Math.abs(p.lat) > 90)) {
    throw new RangeError(`Place.lat: out of range (${p.lat})`);
  }
  if (p.lon != null && (typeof p.lon !== 'number' || Math.abs(p.lon) > 180)) {
    throw new RangeError(`Place.lon: out of range (${p.lon})`);
  }
  if (!Array.isArray(p.historical_jurisdictions)) {
    throw new TypeError('Place.historical_jurisdictions: expected array');
  }
  return p;
}

export function validateHeirloom(h) {
  if (!h || typeof h !== 'object') throw new TypeError('Heirloom: not an object');
  _require(h, 'id', _isNonEmptyString, 'Heirloom.id: expected non-empty string');
  _require(h, 'name', _isString, 'Heirloom.name: expected string');
  _enumCheck('Heirloom.type', h.type, HEIRLOOM_TYPES);

  if (!Array.isArray(h.provenance_chain)) {
    throw new TypeError('Heirloom.provenance_chain: expected array');
  }
  for (const link of h.provenance_chain) {
    if (!link || typeof link !== 'object') {
      throw new TypeError('Heirloom.provenance_chain[]: expected objects');
    }
    if (!_isNonEmptyString(link.person_id)) {
      throw new TypeError('Heirloom.provenance_chain[].person_id: required');
    }
    if (link.from !== undefined && link.from != null)
      validateDate(link.from, { field: 'Heirloom.provenance_chain[].from' });
    if (link.to !== undefined && link.to != null)
      validateDate(link.to, { field: 'Heirloom.provenance_chain[].to' });
  }
  if (h.current_custodian_id != null && !_isString(h.current_custodian_id)) {
    throw new TypeError('Heirloom.current_custodian_id: expected string or null');
  }
  if (!_isArrayOfStrings(h.media_ids)) {
    throw new TypeError('Heirloom.media_ids: expected string[]');
  }
  return h;
}

/* -------------------------------------------------------------------------- */
/*  Truth Stamper helpers                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Given an Event, return true if it carries at least one source. No
 * distinction between confidence levels — this is the hard floor.
 */
export function eventHasSource(event) {
  return Array.isArray(event?.source_ids) && event.source_ids.length > 0;
}

/**
 * Summarize a fact's provenance. Returns an object the UI can render:
 *   { stamp: 'verified'|'unverified', sourceCount: N, confidenceMix: {...} }
 *
 * Requires that the caller has already resolved source records (via
 * db.sources.bulkGet(event.source_ids)).
 */
export function summarizeProvenance(sources) {
  const mix = { high: 0, medium: 0, low: 0, disputed: 0 };
  let anyVerified = false;
  let anyContested = false;
  for (const s of sources ?? []) {
    if (!s) continue;
    if (mix[s.confidence] != null) mix[s.confidence]++;
    if (s.truth_stamp === 'verified') anyVerified = true;
    if (s.truth_stamp === 'contested') anyContested = true;
  }
  const stamp = anyContested
    ? 'contested'
    : anyVerified
      ? 'verified'
      : 'unverified';
  return { stamp, sourceCount: sources?.length ?? 0, confidenceMix: mix };
}
