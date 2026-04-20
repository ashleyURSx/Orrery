# ORRERY — Phase 1 Kickoff Prompt for Claude Code

**Paste this into Claude Code after uploading `ORRERY_BUILD_PLAN.md`.**

---

## Your role

You are executing Phase 1 of the ORRERY build. ORRERY is a sovereign, offline-first, cinematically-rendered family heritage workspace in the URSx suite. The full architecture and decisions are in `ORRERY_BUILD_PLAN.md` — read that completely before writing any code.

Ashley is the architect. You are building the data foundation. This phase is pure engineering — no visual work yet. That comes in Phase 3.

## Phase 1 scope (strict — do not expand without asking)

Build three interlocking shared modules plus a test harness:

1. **`shared/db.js`** — Dexie.js IndexedDB schema for all seven entities
2. **`shared/events.js`** — entity validators, type enums, schema helpers
3. **`shared/relationships.js`** — graph traversal queries (ancestors, descendants, common ancestor, cousin degree, contemporaries in a given year)
4. **`test-fixture.html`** — a single-file test harness that loads a 50-person test tree (Cork/Kessler/O'Sullivan lineage from the spec), exposes the DB to `window.orrery` so Ashley can open the console and query against working data, and prints the test results of every graph query to the page

## Hard constraints

- **No UI work.** The test harness is a utility page for verifying the schema. Plain HTML, minimal CSS, no theming. Phase 3 is where the beautiful stuff happens.
- **No framework.** Vanilla JS + Dexie.js from CDN. No React, no Vue, no build step.
- **File size ceilings:** `db.js` ≤ 700 lines, `events.js` ≤ 600 lines, `relationships.js` ≤ 500 lines. If you're approaching these, ask before exceeding.
- **Dexie.js via CDN** — `https://unpkg.com/dexie@4/dist/dexie.mjs` (ES module import).
- **No external dependencies** other than Dexie. No lodash, no date-fns, no UUID libraries (use `crypto.randomUUID()` which is native).
- **No cloud code, no fetch calls, no telemetry.** Everything runs offline.
- **Truth Stamper discipline from day one:** every fact references a source via `source_ids[]`. No schema path that allows an unsourced fact to be marked authoritative.

## The seven entities (recap from build plan — verify before implementing)

**Person** — id, name, aka[], sex, gender, notes, vitals{}, research_status, privacy
**Event** — id, person_ids[], type, date{exact|approximate|before|after|between}, place_id, source_ids[], notes
**Source** — id, type, citation, url|file_id, confidence, truth_stamp
**Media** — id, type, file_id, linked_person_ids[], linked_event_ids[], date_taken, description, transcription
**Relationship** — id, person_a_id, person_b_id, type, start_date, end_date, source_ids[]
**Place** — id, name, modern_name, lat, lon, historical_jurisdictions[]
**Heirloom** — id, name, description, type, provenance_chain[], current_custodian_id, media_ids[]

Re-read the full entity definitions in `ORRERY_BUILD_PLAN.md` before writing the schema.

## Graph queries to implement in `relationships.js`

These are the genealogy-specific graph operations. Name them clearly.

- `getAncestors(personId, maxGenerations=null)` — all ancestors, BFS, optionally depth-limited
- `getDescendants(personId, maxGenerations=null)` — all descendants
- `getParents(personId)` — direct parents (biological + adoptive, flagged separately)
- `getChildren(personId)` — direct children
- `getSiblings(personId, includeHalf=true)` — siblings, with half-sibling flag
- `getSpouses(personId)` — current + former
- `findCommonAncestors(personA_id, personB_id)` — returns array of common ancestors sorted by closeness
- `calculateRelationship(personA_id, personB_id)` — returns e.g. `{type: 'cousin', degree: 3, removed: 1}` or `{type: 'great-great-grandparent'}` or `{type: 'unrelated'}`
- `getContemporaries(year)` — everyone alive in that year
- `getGenerationDepth(personId, relativeTo='self')` — how many generations back from the user

## Test fixture requirements

Produce a `test-fixture.html` that:

1. Loads Dexie from CDN
2. Imports the three shared modules
3. Initializes the DB with a 50-person fixture representing the Cork/Kessler/O'Sullivan lineage sketched in the ORRERY mockup — 5 generations, with births, marriages, deaths, immigrations, and source citations for some (not all) facts
4. Runs every graph query against the fixture and prints results to the page
5. Exposes `window.orrery.db`, `window.orrery.queries` for console exploration
6. Includes one intentionally UNVERIFIED fact (a birth date with no source) so Ashley can see the Truth Stamper distinction working

## Process

1. Read `ORRERY_BUILD_PLAN.md` fully
2. Create the `/orrery/shared/` directory
3. Write `db.js` first — this is the skeleton everything else hangs on
4. Write `events.js` — validators and type enums
5. Write `relationships.js` — graph queries
6. Write `test-fixture.html`
7. Run it, verify every query works, fix until green
8. Report back to Ashley with: file paths, line counts, test results, any deviations from the plan, any questions for Phase 2

## What to flag for Ashley (don't fix silently)

- Any ambiguity in the entity definitions
- Any place where you had to make a design call not covered in the build plan
- Any graph query that's computationally expensive on the 50-person fixture (genealogy trees can hit a million people — perf matters)
- Any place where GEDCOM 5.5.1 / 7.0 compatibility concerns leak back into the schema design (Phase 2 is GEDCOM but the schema has to accommodate it now)

## What NOT to do

- Do not start Phase 2 (GEDCOM) or Phase 3 (Living Tree) in this session. Those are separate phases for good reasons.
- Do not add features from Gemini's heritage doc that aren't in the build plan (no Crest Forge, no Zupǔ mode, no DNA painting, no VR Manor — all of those are later phases or dropped entirely).
- Do not add cloud sync, telemetry, account systems, or anything that phones home. Ever. The non-goals list in the build plan is binding.
- Do not use `localStorage` or `sessionStorage`. IndexedDB only.
- Do not hardcode the test fixture's people into production code. The fixture is test-only.

## When Phase 1 is done

You'll know you're done when Ashley can:
- Open `test-fixture.html` in a browser
- See 50 people loaded
- See every graph query return sensible results printed to the page
- Open the console and run `await orrery.queries.findCommonAncestors('g5a', 'g5b')` and get a real answer
- See one fact flagged as UNVERIFIED, visibly distinct from verified facts

Report back with the working files + summary. Ashley will review and greenlight Phase 2.

---

*End of Phase 1 kickoff. Good luck. Build it right.*
