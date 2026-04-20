# Phase 1 Report — ORRERY Data Foundation

**Status:** Complete. All deliverables pushed to `claude/build-orrery-npKqr`.
**Verified:** Fixture loads in browser, every graph query returns sensible results (screenshots from Ashley confirm full-sibling and first-cousin classifications render correctly, common-ancestor pairs resolve through the Walsh spouse line).

---

## Files produced

| Path | Lines | Ceiling | Purpose |
|---|---|---|---|
| `orrery/shared/db.js` | 497 | 700 | Dexie 4 schema, CRUD, `bulkPut`, Truth Stamper write-guard |
| `orrery/shared/events.js` | 519 | 600 | Validators, type enums, GEDCOM-compatible date envelope |
| `orrery/shared/relationships.js` | 453 | 500 | All 10 graph queries |
| `orrery/shared/fixture-data.js` | 650 | — | 8 places, 14 sources, 50 persons, 48 relationships, 13 events |
| `orrery/test-fixture.html` | 95 | — | Shell page (loads `test-fixture.mjs`) |
| `orrery/test-fixture.mjs` | 351 | — | Harness: loads fixture, runs every query, exposes `window.orrery` |
| `orrery/test-fixture-standalone.html` | 2565 | — | Single-file version for `file://` opening |
| `orrery/build-standalone.py` | — | — | Regenerates standalone from modular sources |
| `orrery/docs/ORRERY_BUILD_PLAN.md`, `PHASE_1_KICKOFF.md` | — | — | Spec copies |

All JS passes `node --check`. Standalone bundle is regenerated via `python3 orrery/build-standalone.py` after any change to a shared module.

---

## The seven entities

All seven from the build plan are indexed and validated:
- **Person** — id, name, aka[], sex, gender, notes, vitals{birth,death,baptism,burial}, research_status, privacy
- **Event** — id, person_ids[], type, date{exact|approximate|before|after|between|unknown}, place_id, source_ids[], notes
- **Source** — id, type, citation, url/file_id, confidence, truth_stamp
- **Media** — id, type, file_id, linked_person_ids[], linked_event_ids[], date_taken, description, transcription
- **Relationship** — id, person_a_id, person_b_id, type, start_date, end_date, source_ids[], biological, adoptive, half, notes
- **Place** — id, name, modern_name, lat, lon, historical_jurisdictions[]
- **Heirloom** — id, name, description, type, provenance_chain[], current_custodian_id, media_ids[]

---

## Graph queries implemented

All 10 from the spec: `getAncestors`, `getDescendants`, `getParents`, `getChildren`, `getSiblings` (with `includeHalf` flag), `getSpouses`, `findCommonAncestors`, `calculateRelationship`, `getContemporaries`, `getGenerationDepth`. Plus `bindQueries(db)` for convenience binding.

`calculateRelationship` returns discriminated results: `self | spouse | ancestor | descendant | sibling | cousin | step-or-adoptive-relation | unrelated`. Cousin math uses `degree = min(distA, distB) - 1`, `removed = |distA - distB|`.

---

## Truth Stamper

- `source_ids[]` on every fact-bearing entity.
- `putSource` refuses to mark a source `verified` without a citation string.
- `eventHasSource()` + `summarizeProvenance()` helpers for UI.
- **One intentionally UNVERIFIED fact in the fixture:** Helen Walsh (g3b) birth date has empty `source_ids[]` and the harness renders it with a red UNVERIFIED tag distinct from the verified facts.

---

## Design calls (not in the original spec)

1. **Directional parent edges.** `person_a_id = parent`, `person_b_id = child`. Queries accept the reverse-direction form (`'child'` type with a/b swapped) so GEDCOM imports that come through that way still resolve.
2. **`biological` / `adoptive` / `half` booleans on Relationship.** Optional flags that disambiguate an unflagged `'parent'` edge from an explicit adoption. Bare `'parent'` defaults to biological when no flag is set. This is how we keep the canonical genealogy convention (biology by default) without losing the chosen-family/adoption signal.
3. **`Heirloom.provenance_person_ids`** — flat multi-entry index derived from `provenance_chain[]`, so "which heirlooms did person X ever hold" is an O(log n) query. Canonical chain-with-dates lives unchanged in `provenance_chain`.
4. **`getContemporaries`** excludes people with unknown birth year. Chronosphere (Phase 4) will need a separate "undated" bucket — flag for Phase 4 planner.
5. **`'self'` sentinel.** Phase 1 has no logged-in user concept. `getGenerationDepth(id, 'self')` returns 0 reflexively. Phase 7 onboarding binds `'self'` to a real person id.

---

## Hand-off notes for Phase 2 (GEDCOM I/O)

Read `ORRERY_BUILD_PLAN.md` fully before starting. Then:

1. **GEDCOM 5.5.1 AND 7.0.** The spec is explicit — both. Work from the actual published specs (FamilySearch hosts 7.0; 5.5.1 is the legacy Ancestry format). Do not trust Gemini-produced GEDCOM parsers; they hallucinate tag structures.

2. **Round-trip fidelity is the acceptance test.** Import a `.ged` → export → re-import → compare. No data loss, no silent merges, no key collisions. Use the fixture's 50 people as the round-trip target: export the current DB as GEDCOM, wipe, re-import, run `counts()` — must match.

3. **Conflicting data = "temporal splits".** Both values preserved with their citations. The schema already supports this — an Event can have multiple source_ids and the Truth Stamper summary surfaces the `confidenceMix`. You'll want to extend Person.vitals to accept arrays when conflicts exist, or (cleaner) shift authoritative facts into the Events table and treat Person.vitals as a cached "best-of" view.

4. **Name mapping reminders:**
   - GEDCOM uses `INDI` / `FAM` / `SOUR` / `NOTE` / `OBJE` / `REPO` → Person / (family-bundle) / Source / notes-on-entity / Media / (archive — not modeled in Phase 1).
   - GEDCOM FAM groups parents + children under one record. ORRERY stores these as Person-to-Person parent edges. Plan an `importFAM()` that emits N parent edges and one spouse edge.
   - GEDCOM dates use `EXACT | ABT | BEF | AFT | BET ... AND ... | EST | CAL`. The `events.js` date envelope covers the first five cleanly. `EST` / `CAL` can map to `approximate` with a `raw` tag (we already have that field).
   - GEDCOM 7.0 introduces `ASSO` with `ROLE` — this is how non-traditional relationships (godparent, witness, enslaver/enslaved) come in. Map these to our `Relationship.type` enum; the enum already covers those roles.

5. **OPFS binary handling is out of scope for Phase 2.** GEDCOM 7.0 can reference external media files; record the path/url in `Media.file_id` but don't try to actually read binary blobs until the Vault view in Phase 7.

6. **`shared/export.js`** is the counterpart — `.ged` + `.orrery` bundle writers. `.orrery` = zip of (GEDCOM + media blobs + sources JSON + theme config), optionally AES-256 encrypted with user passphrase. Phase 2 only requires the unencrypted path; encryption can ship in 1.1.

7. **Heirlooms don't exist in GEDCOM.** They're an ORRERY-native concept. Export them as custom `_HEIR` tags (GEDCOM allows underscore-prefixed extension tags); ignore them on round-trip into tools that don't understand the tag. Document this in the export dialog.

---

## Known open questions (flag to Ashley before Phase 2)

- **Multi-value Person.vitals.** Current schema has a single `birth`, `death`, etc. If two sources conflict (different birth years), Phase 2 needs to decide: store the winner on Person and both as separate Events, or allow `Person.vitals.birth` to be an array? Cleaner path is the first (Events table is the source of truth, vitals are a cache). Confirm before Phase 2 commits to a direction.
- **Source `repository` model.** GEDCOM has a separate REPO entity (archive that holds the source). ORRERY currently folds that into the citation string. For round-trip, we may need a `Repository` entity — but that's an 8th entity and would need sign-off.
- **`Place.historical_jurisdictions`** entries use `{ name, from, to }` with `to: null` meaning "present". GEDCOM places are flat strings; we'll lose jurisdiction history on export to 5.5.1. 7.0 has richer place structures — worth preserving there.

---

## How to run

**Modular (recommended for development):**
```
cd orrery
python -m http.server 8000
# open http://localhost:8000/test-fixture.html
```

**Standalone (for spot-checking on `file://`):**
Open `orrery/test-fixture-standalone.html` directly in a browser.

Console exploration:
```js
await orrery.queries.findCommonAncestors('g5c', 'g5f')
await orrery.queries.calculateRelationship('g5a', 'g5b')
await orrery.queries.getContemporaries(1900)
orrery.db                // Dexie instance
orrery.fixture.PERSONS   // the 50 raw records
```

---

*Phase 1 complete. Phase 2 greenlit by Ashley.*
