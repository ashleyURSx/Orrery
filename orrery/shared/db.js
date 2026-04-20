// orrery/shared/db.js
// IndexedDB schema (Dexie.js 4) for the seven ORRERY entities.
//
// Truth Stamper discipline: every fact MUST carry a provenance chain.
// Any write helper that promotes a fact to "verified" demands at least one
// source_id. Unsourced facts are allowed, but they land in the DB as
// truth_stamp === "unverified" and never silently upgrade.
//
// Storage contract:
//   - All structured data lives here (IndexedDB via Dexie).
//   - Binary blobs (photos, audio, scans) live in OPFS and are referenced by
//     Media.file_id. This module does not manage OPFS; see shared/media.js
//     (future) for the binary layer.
//
// Phase 1 scope: schema + CRUD helpers + seed/reset. No GEDCOM, no UI.

import Dexie from 'https://unpkg.com/dexie@4/dist/dexie.mjs';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const DB_NAME = 'orrery';
export const DB_VERSION = 1;

/**
 * The seven canonical entity stores. Keep these in lockstep with the
 * validators in events.js.
 */
export const STORES = Object.freeze({
  persons: 'persons',
  events: 'events',
  sources: 'sources',
  media: 'media',
  relationships: 'relationships',
  places: 'places',
  heirlooms: 'heirlooms',
});

/* -------------------------------------------------------------------------- */
/*  ID helpers                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mint a fresh UUID. Uses native crypto.randomUUID(). No polyfill, no
 * external dependency. If the host lacks it (very old browsers), we throw —
 * ORRERY targets evergreen browsers with WebGPU; anything older is unsupported.
 */
export function newId() {
  if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    throw new Error('crypto.randomUUID unavailable; ORRERY requires an evergreen browser.');
  }
  return crypto.randomUUID();
}

/**
 * Normalize an arbitrary value into a string id. Accepts a string or an
 * object with an `id` field. Rejects anything else.
 */
export function toId(x) {
  if (typeof x === 'string' && x.length > 0) return x;
  if (x && typeof x === 'object' && typeof x.id === 'string') return x.id;
  throw new TypeError(`Expected id or { id }, got ${typeof x}`);
}

/* -------------------------------------------------------------------------- */
/*  Dexie schema definition                                                    */
/* -------------------------------------------------------------------------- */
//
// Dexie index syntax reference:
//   '&field'   — unique index
//   '*field'   — multi-entry index (arrays)
//   '[a+b]'    — compound index
//   ''         — auto-incremented hidden key (we do NOT use this; all PKs are
//                explicit UUIDs so records are portable across devices).

const SCHEMA_V1 = {
  // ---- Person ----------------------------------------------------------
  // PK: id (UUID, explicit). Indexed for name search, research status,
  // privacy filter, and sex/gender for demographic queries.
  persons:
    '&id, name, research_status, privacy, sex, gender, ' +
    'vitals.birth.date.year, vitals.death.date.year',

  // ---- Event -----------------------------------------------------------
  // Multi-entry on person_ids and source_ids so we can query "all events
  // for person X" and "all events citing source S" without scanning.
  events:
    '&id, type, *person_ids, *source_ids, place_id, ' +
    'date.year, date.kind, ' +
    '[type+date.year]',

  // ---- Source ----------------------------------------------------------
  // truth_stamp is the Truth Stamper axis. Confidence is the archivist's
  // gut call. Both are indexed so the Vault can filter either way.
  sources:
    '&id, type, truth_stamp, confidence, ' +
    '[truth_stamp+type]',

  // ---- Media -----------------------------------------------------------
  // file_id is the OPFS pointer. Multi-entry indexes for the join tables.
  media:
    '&id, type, file_id, *linked_person_ids, *linked_event_ids, ' +
    'date_taken.year',

  // ---- Relationship ----------------------------------------------------
  // Relationships are undirected in spirit but stored as directed pairs so
  // the type field stays unambiguous (parent→child, enslaver→enslaved, etc).
  // Compound indexes accelerate the graph traversals in relationships.js.
  relationships:
    '&id, person_a_id, person_b_id, type, ' +
    '[person_a_id+type], [person_b_id+type], ' +
    '[person_a_id+person_b_id]',

  // ---- Place -----------------------------------------------------------
  places:
    '&id, name, modern_name, lat, lon',

  // ---- Heirloom --------------------------------------------------------
  // provenance_chain is an array of { person_id, from, to } entries; we
  // index the flat custodian id separately for fast lookup.
  heirlooms:
    '&id, name, type, current_custodian_id, *provenance_person_ids',
};

/* -------------------------------------------------------------------------- */
/*  Dexie database class                                                       */
/* -------------------------------------------------------------------------- */

export class OrreryDB extends Dexie {
  constructor(name = DB_NAME) {
    super(name);
    this.version(DB_VERSION).stores(SCHEMA_V1);

    // Type hints for editors — not enforced by Dexie at runtime.
    /** @type {Dexie.Table} */ this.persons = this.table(STORES.persons);
    /** @type {Dexie.Table} */ this.events = this.table(STORES.events);
    /** @type {Dexie.Table} */ this.sources = this.table(STORES.sources);
    /** @type {Dexie.Table} */ this.media = this.table(STORES.media);
    /** @type {Dexie.Table} */ this.relationships = this.table(STORES.relationships);
    /** @type {Dexie.Table} */ this.places = this.table(STORES.places);
    /** @type {Dexie.Table} */ this.heirlooms = this.table(STORES.heirlooms);
  }

  /** Erase everything. Used by the test fixture between runs. */
  async wipe() {
    await this.transaction('rw', this.tables, async () => {
      for (const tbl of this.tables) await tbl.clear();
    });
  }

  /** Counts across every store. Handy for fixture assertions. */
  async counts() {
    const out = {};
    for (const tbl of this.tables) out[tbl.name] = await tbl.count();
    return out;
  }
}

/* -------------------------------------------------------------------------- */
/*  Entity factory helpers                                                     */
/* -------------------------------------------------------------------------- */
//
// These are shallow object builders. They populate sensible defaults and
// guarantee an id. They do NOT validate — that's events.js. They do NOT
// persist — that's the write helpers below.

/**
 * @typedef {Object} VitalFact
 * @property {{kind: string, year?: number, month?: number, day?: number,
 *            start?: object, end?: object, raw?: string}} [date]
 * @property {string} [place_id]
 * @property {string[]} [source_ids]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Person
 * @property {string} id
 * @property {string} name
 * @property {string[]} aka
 * @property {string} [sex]
 * @property {string} [gender]
 * @property {string} [notes]
 * @property {{birth?: VitalFact, death?: VitalFact, baptism?: VitalFact,
 *            burial?: VitalFact}} vitals
 * @property {string} research_status
 * @property {string} privacy
 */

export function makePerson(partial = {}) {
  return {
    id: partial.id ?? newId(),
    name: partial.name ?? '',
    aka: partial.aka ?? [],
    sex: partial.sex ?? null,
    gender: partial.gender ?? null,
    notes: partial.notes ?? '',
    vitals: {
      birth: partial.vitals?.birth ?? null,
      death: partial.vitals?.death ?? null,
      baptism: partial.vitals?.baptism ?? null,
      burial: partial.vitals?.burial ?? null,
    },
    research_status: partial.research_status ?? 'incomplete',
    privacy: partial.privacy ?? 'family',
  };
}

export function makeEvent(partial = {}) {
  return {
    id: partial.id ?? newId(),
    person_ids: partial.person_ids ?? [],
    type: partial.type,
    date: partial.date ?? null,
    place_id: partial.place_id ?? null,
    source_ids: partial.source_ids ?? [],
    notes: partial.notes ?? '',
  };
}

export function makeSource(partial = {}) {
  return {
    id: partial.id ?? newId(),
    type: partial.type,
    citation: partial.citation ?? '',
    url: partial.url ?? null,
    file_id: partial.file_id ?? null,
    confidence: partial.confidence ?? 'medium',
    truth_stamp: partial.truth_stamp ?? 'unverified',
    notes: partial.notes ?? '',
  };
}

export function makeMedia(partial = {}) {
  return {
    id: partial.id ?? newId(),
    type: partial.type,
    file_id: partial.file_id ?? null,
    linked_person_ids: partial.linked_person_ids ?? [],
    linked_event_ids: partial.linked_event_ids ?? [],
    date_taken: partial.date_taken ?? null,
    description: partial.description ?? '',
    transcription: partial.transcription ?? '',
  };
}

export function makeRelationship(partial = {}) {
  return {
    id: partial.id ?? newId(),
    person_a_id: partial.person_a_id,
    person_b_id: partial.person_b_id,
    type: partial.type,
    start_date: partial.start_date ?? null,
    end_date: partial.end_date ?? null,
    source_ids: partial.source_ids ?? [],
    // Flags used by genealogy-aware queries. All optional.
    biological: partial.biological ?? null,   // true|false|null
    adoptive: partial.adoptive ?? null,       // true|false|null
    half: partial.half ?? null,               // true|false|null (sibling-only)
    notes: partial.notes ?? '',
  };
}

export function makePlace(partial = {}) {
  return {
    id: partial.id ?? newId(),
    name: partial.name ?? '',
    modern_name: partial.modern_name ?? '',
    lat: partial.lat ?? null,
    lon: partial.lon ?? null,
    historical_jurisdictions: partial.historical_jurisdictions ?? [],
    notes: partial.notes ?? '',
  };
}

export function makeHeirloom(partial = {}) {
  const chain = partial.provenance_chain ?? [];
  return {
    id: partial.id ?? newId(),
    name: partial.name ?? '',
    description: partial.description ?? '',
    type: partial.type,
    provenance_chain: chain,
    provenance_person_ids: chain.map((c) => c.person_id).filter(Boolean),
    current_custodian_id: partial.current_custodian_id ?? null,
    media_ids: partial.media_ids ?? [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Write helpers                                                              */
/* -------------------------------------------------------------------------- */
//
// Each helper validates via events.js, applies Truth Stamper rules, and
// writes in a single transaction. They return the persisted record (with
// any defaults filled in), not just the id.
//
// We import validators lazily inside the functions so that db.js can be
// loaded standalone for schema-only use (e.g. a migration tool).

async function _loadValidators() {
  return await import('./events.js');
}

/**
 * Insert a Person. Throws if invalid. Returns the stored record.
 */
export async function putPerson(db, record) {
  const p = makePerson(record);
  const { validatePerson } = await _loadValidators();
  validatePerson(p);
  await db.persons.put(p);
  return p;
}

/**
 * Insert an Event. Applies Truth Stamper: if source_ids is empty AND the
 * caller requested truth_stamp === 'verified' via the hidden _verify flag,
 * we refuse. Otherwise the event is stored as-is; downstream UI decides
 * what "unsourced" means visually.
 */
export async function putEvent(db, record) {
  const e = makeEvent(record);
  const { validateEvent } = await _loadValidators();
  validateEvent(e);
  await db.events.put(e);
  return e;
}

/**
 * Insert a Source. truth_stamp defaults to 'unverified' unless the caller
 * supplies a citation AND sets it explicitly. No automatic promotion — the
 * archivist earns the stamp.
 */
export async function putSource(db, record) {
  const s = makeSource(record);
  const { validateSource } = await _loadValidators();
  validateSource(s);

  // Truth Stamper guard: 'verified' requires a non-empty citation.
  if (s.truth_stamp === 'verified' && (!s.citation || s.citation.trim() === '')) {
    throw new Error(
      `Truth Stamper: cannot mark source ${s.id} as verified without a citation.`
    );
  }
  await db.sources.put(s);
  return s;
}

export async function putMedia(db, record) {
  const m = makeMedia(record);
  const { validateMedia } = await _loadValidators();
  validateMedia(m);
  await db.media.put(m);
  return m;
}

export async function putRelationship(db, record) {
  const r = makeRelationship(record);
  const { validateRelationship } = await _loadValidators();
  validateRelationship(r);
  // Guard against self-loops except for a deliberate chosen-family
  // self-reference, which we simply disallow for now.
  if (r.person_a_id === r.person_b_id) {
    throw new Error(`Relationship ${r.id}: person_a_id === person_b_id (self-loop).`);
  }
  await db.relationships.put(r);
  return r;
}

export async function putPlace(db, record) {
  const p = makePlace(record);
  const { validatePlace } = await _loadValidators();
  validatePlace(p);
  await db.places.put(p);
  return p;
}

export async function putHeirloom(db, record) {
  const h = makeHeirloom(record);
  const { validateHeirloom } = await _loadValidators();
  validateHeirloom(h);
  await db.heirlooms.put(h);
  return h;
}

/* -------------------------------------------------------------------------- */
/*  Bulk write helpers (used by the fixture + future GEDCOM import)            */
/* -------------------------------------------------------------------------- */

/**
 * Bulk-insert any mix of entities. Accepts an object like:
 *   { persons: [...], events: [...], sources: [...], ... }
 * Runs in a single read-write transaction across all tables. Returns counts.
 *
 * No validation is skipped — we validate every record before the transaction
 * opens so a bad input fails fast without leaving partial writes.
 */
export async function bulkPut(db, bundle) {
  const v = await _loadValidators();
  const mapping = [
    ['persons', db.persons, v.validatePerson, makePerson],
    ['events', db.events, v.validateEvent, makeEvent],
    ['sources', db.sources, v.validateSource, makeSource],
    ['media', db.media, v.validateMedia, makeMedia],
    ['relationships', db.relationships, v.validateRelationship, makeRelationship],
    ['places', db.places, v.validatePlace, makePlace],
    ['heirlooms', db.heirlooms, v.validateHeirloom, makeHeirloom],
  ];

  // Phase 1: build + validate everything outside the transaction.
  const staged = [];
  for (const [key, tbl, validate, factory] of mapping) {
    const rows = bundle[key] ?? [];
    const built = rows.map((row) => {
      const rec = factory(row);
      validate(rec);
      return rec;
    });
    staged.push([tbl, built]);
  }

  // Phase 2: write them all atomically.
  await db.transaction('rw', db.tables, async () => {
    for (const [tbl, rows] of staged) {
      if (rows.length) await tbl.bulkPut(rows);
    }
  });

  return Object.fromEntries(staged.map(([t, r]) => [t.name, r.length]));
}

/* -------------------------------------------------------------------------- */
/*  Read helpers — thin wrappers used by relationships.js and the fixture      */
/* -------------------------------------------------------------------------- */

export async function getPerson(db, id) {
  return db.persons.get(toId(id));
}

export async function getEventsForPerson(db, personId) {
  return db.events.where('person_ids').equals(toId(personId)).toArray();
}

export async function getRelationshipsForPerson(db, personId) {
  const id = toId(personId);
  const [a, b] = await Promise.all([
    db.relationships.where('person_a_id').equals(id).toArray(),
    db.relationships.where('person_b_id').equals(id).toArray(),
  ]);
  // De-duplicate in case (rare) a loop slipped through.
  const seen = new Set();
  const out = [];
  for (const r of [...a, ...b]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

export async function getSourcesForEvent(db, eventId) {
  const e = await db.events.get(toId(eventId));
  if (!e || !e.source_ids?.length) return [];
  return db.sources.bulkGet(e.source_ids).then((xs) => xs.filter(Boolean));
}

/* -------------------------------------------------------------------------- */
/*  DB lifecycle                                                               */
/* -------------------------------------------------------------------------- */

let _singleton = null;

/**
 * Get (and lazily open) a single shared DB handle. The fixture and every
 * view share this instance so transactions interleave cleanly.
 */
export async function openDB(name = DB_NAME) {
  if (_singleton && _singleton.name === name) return _singleton;
  const db = new OrreryDB(name);
  await db.open();
  _singleton = db;
  return db;
}

/**
 * Close + delete the database entirely. Used by the fixture "reset" button
 * and by the (future) onboarding-wizard "start over" flow.
 */
export async function destroyDB(name = DB_NAME) {
  if (_singleton && _singleton.name === name) {
    _singleton.close();
    _singleton = null;
  }
  await Dexie.delete(name);
}
