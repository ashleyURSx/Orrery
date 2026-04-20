# ORRERY — Build Plan & Architecture

**Tagline:** *An orrery of your people.*

**Product class:** Sovereign, offline-first, local-first heritage workspace.
**URSx tier:** Legacy pillar (alongside NeurOS, GRACE, Aruru, TraceLine, VowCraft).
**Distribution:** PWA → Bubblewrap TWA → Google Play, Apple App Store, Gumroad, Etsy.
**Price target:** $39–69 one-time purchase. No subscription. No server.

---

## Positioning

Every existing heritage app — Ancestry, MyHeritage, FamilySearch, Geni, MyHeritage — renders your family as a pedigree chart: a static 2D org-chart diagram that treats your lineage as a database schema. They lock your data behind recurring subscriptions, sell aggregate DNA data, and have been subpoenaed by law enforcement. Pay-to-view ancestors. Your bloodline as someone else's asset class.

ORRERY is the first sovereign, offline-first, cinematically-rendered family heritage workspace. The product metaphor is not a tree diagram — it's an **orrery**, the mechanical model of celestial bodies in motion. Your lineage is rendered as a living constellation of people across time, with every ancestor placed in their era, on their land, among their possessions. The app grows in real time as you do research. Your data lives on your device and nowhere else. Your lineage survives the heat death of Ancestry.com.

---

## Core philosophy (URSx-aligned)

1. **Data sovereignty as product posture.** The user's data lives in IndexedDB + OPFS on their own device. Zero server dependency post-install. No cloud backup unless the user initiates an encrypted export. The `.orrery` bundle is the user's sovereign artifact.
2. **Offline-first, always.** Works in a bunker, on a plane, in a post-internet world. Internet is for optional enrichment (FamilySearch record search), never for core function.
3. **Local-first AI.** Web-LLM (Phi-3.5 mini or Llama 3.2 3B via WebGPU) for transcription, narrative generation, record extraction. Cloudflare Worker proxy only for heavier tasks with explicit per-call consent and zero retention (same pattern as NeurOS Social Rehearsal).
4. **Truth Stamper discipline.** Every genealogical claim has a provenance chain. A fact without a source is marked `UNVERIFIED` and cannot be exported as authoritative. Ported from AMICUS.
5. **Portable. Sovereign. Eternal.** GEDCOM import/export is the trojan horse — users can leave Ancestry with their data intact. The `.orrery` bundle survives USB stick transfer across generations.
6. **Non-traditional families are first-class.** Step-, adoptive-, godparent-, chosen-family, enslaver/enslaved (critical for African American genealogy, which pedigree charts erase), witnesses, business partners — all modeled as edges in the relationship graph, not erased by tree topology.

---

## Visual identity

**Name:** ORRERY
**Wordmark style:** mono uppercase letterspaced, or serif italic for longform
**Palette system:** Three user-selectable themes, all shipping at launch:

### Cosmic Night (default — the drama)
- Background: radial `#2a1a52 → #14091e → #05020a`
- Text: `#f4e4b8` (vellum cream)
- Gold: `#d4a84a` (burnished)
- Accent: `#8b6fff` (deep violet)
- **Feel:** looking up at the Milky Way from a dark plains field at 2am.

### Indigo + Vellum (the heirloom)
- Background: radial `#3a4478 → #1e2548 → #0c1024`
- Text: `#fff2d1` (cream)
- Gold: `#e8c67a` (warm)
- Accent: `#ffb347` (amber)
- **Feel:** illuminated manuscript under candlelight.

### Teal + Stone (the archive)
- Background: radial `#0d4650 → #082830 → #021418`
- Text: `#e8e4d3` (stone)
- Gold: `#c9a961` (aged brass)
- Accent: `#5bbfa3` (oxidized teal)
- **Feel:** museum hall at closing time.

**Typography:**
- Serif: for person names, narrative prose, epigraphs (system: Cormorant Garamond or similar — to be locked)
- Mono: for dates, IDs, technical overlays, HUD elements
- Sans: for UI controls, buttons, dialog text

**Iconography:**
- Nodes are stars/souls, not pedigree boxes
- Branches are curved Bézier paths, not right-angle lines
- Generation depth encoded in vertical position (roots down, descendants up)
- Lost/unknown ancestors rendered as dim stubs, not missing cells

---

## Data architecture

### Entities

**Person**
- `id` (UUID), `name`, `aka` (array of former/alternate names), `sex`, `gender`, `notes`
- `vitals`: birth, death, baptism, burial (each with date, place, source IDs)
- `research_status`: complete / incomplete / conflicting / unknown
- `privacy`: public / family / private / encrypted

**Event**
- `id`, `person_ids` (array), `type` (birth, death, marriage, immigration, residence, occupation, education, military, religious, adoption, naturalization, imprisonment, emancipation, enslavement, chosen-family)
- `date` (exact / approximate / before / after / between), `place` (lat/lon + address string + historical jurisdiction)
- `source_ids` (array), `notes`

**Source**
- `id`, `type` (census, vital record, newspaper, oral history, DNA, photograph, letter, government record, ship manifest, military record, church record, deed, will, probate, tombstone)
- `citation` (formal citation string), `url` / `file_id`
- `confidence`: high / medium / low / disputed
- `truth_stamp`: verified / unverified / contested

**Media**
- `id`, `type` (photo, audio, video, document, scan), `file_id` (OPFS reference)
- `linked_person_ids`, `linked_event_ids`, `date_taken`, `description`, `transcription` (for audio)

**Relationship**
- `id`, `person_a_id`, `person_b_id`
- `type` (parent, child, spouse, partner, sibling, half-sibling, step-parent, step-child, adoptive-parent, adopted-child, foster, godparent, godchild, enslaver, enslaved-by, witness, business-partner, chosen-family)
- `start_date`, `end_date`, `source_ids`

**Place**
- `id`, `name` (as known at the time), `modern_name`, `lat`, `lon`
- `historical_jurisdictions` (array with date ranges — e.g. "Prussia 1815–1871, German Empire 1871–1918, Weimar 1918–1933, Poland 1945–present")

**Heirloom**
- `id`, `name`, `description`, `type` (document, jewelry, furniture, textile, tool, photograph, land, recipe, song, ritual)
- `provenance_chain` (array of person_ids with dates of custody), `current_custodian_id`
- `media_ids`

### Storage

- **IndexedDB via Dexie.js** — all entities, queryable, indexed on relationships
- **OPFS (Origin Private File System)** — binary media (photos, audio, scanned docs)
- **Export formats:**
  - `.ged` — GEDCOM 5.5.1 and 7.0, universal interchange
  - `.orrery` — native format: zip containing GEDCOM + media + sources + theme config + citations, optionally AES-256 encrypted with user-chosen passphrase

---

## Views (the six lenses)

Each view reads from the same underlying graph. No view owns the data.

### 1. Living Tree (hero view)
Real-time organic tree growth, Three.js + D3 force simulation hybrid.
- **Tree Mode** (default): labels hidden, hover reveals, cinematic
- **Edit Mode** (keystroke `E`): all labels visible, generation rings, event markers on nodes, drag-to-reposition, quick-add on hover
- Real-time bloom animation on node addition
- GEDCOM-driven accelerated time-lapse construction on import
- Camera choreography: dolly to new branches, plunge into roots for newly-discovered deep ancestors
- Generation layers, trunk-thickness-from-descendant-count, leaf-color-from-research-completeness

### 2. Chronosphere (time-scrub)
Horizontal timeline ~1500–present. Every person is a horizontal lifespan band. Drag the scrubber and a vertical "now line" sweeps through history — every ancestor alive at that moment lights up simultaneously. World-historical events overlay as faint bands.

### 3. Atlas (geographic migration)
MapLibre GL with offline vector tiles. Every event geolocated. Play the timeline and watch your lineage move across continents — County Cork to Ellis Island to Ohio, or wherever your specific story runs.

### 4. Constellation (relational graph)
Force-directed graph where non-traditional relationships get their due. Step/adoptive/chosen family, witnesses, godparents, enslavers/enslaved. The tree is a special case; the constellation is the truth.

### 5. Vault (artifact-centric)
Every photo, letter, document, recipe, voice recording as a first-class entity. Scrollable gallery with portal behavior — tap an artifact and the tree re-centers on who it documents.

### 6. Chorus (narrative)
Local LLM generates prose biographies bounded strictly to structured data. Every sentence hoverable back to source. Exportable as markdown or docx memoir chapter.

---

## File architecture (multi-HTML stacked PWA)

```
/orrery
├── index.html                    # shell + navigation (~400 lines)
├── manifest.json
├── service-worker.js
├── assetlinks.json               # Play Store fingerprint
│
├── views/
│   ├── living-tree.html          # hero view (~3500 lines)
│   ├── chronosphere.html         # time-scrub (~2800 lines)
│   ├── atlas.html                # migration map (~2500 lines)
│   ├── constellation.html        # relational graph (~2200 lines)
│   ├── vault.html                # artifacts (~2000 lines)
│   └── chorus.html               # narrative LLM (~1800 lines)
│
├── shared/
│   ├── db.js                     # IndexedDB + Dexie schema (~600 lines)
│   ├── gedcom.js                 # import/export (~1200 lines)
│   ├── truth-stamper.js          # source citation discipline (~400 lines)
│   ├── events.js                 # data model + validators (~500 lines)
│   ├── themes.js                 # three palettes + theme switcher (~400 lines)
│   ├── voice.js                  # audio record/transcribe (~300 lines)
│   ├── export.js                 # .ged + .orrery bundle writers (~500 lines)
│   └── relationships.js          # path-finding, cousin calculation (~400 lines)
│
├── themes/
│   ├── cosmic-night.css
│   ├── indigo-vellum.css
│   └── teal-stone.css
│
├── assets/
│   ├── sigils/                   # Gemini-produced SVG library
│   ├── cultural-packs/           # Gemini-produced theme packs
│   └── historical-events.json    # Gemini-produced context layer
│
└── docs/
    └── ORRERY_BUILD_PLAN.md      # this doc
```

Every HTML file stays under 4k lines. Every shared module under 1.5k. Each file is Claude-editable without needing the whole app in context.

---

## Build phases

### Phase 0 — Identity lock ✅
- Name: ORRERY
- Tagline: "an orrery of your people"
- Three palettes locked
- Tree Mode / Edit Mode dual-affordance locked
- Multi-HTML PWA architecture locked
- IndexedDB + OPFS storage locked

### Phase 1 — Data foundation *(Claude writes directly, no Gemini)*
**Deliverable:** working IndexedDB schema + 50-person test fixture browsable in console.
**Files:** `shared/db.js`, `shared/events.js`, `shared/relationships.js`
**Blockers:** none. This is the bones — get this right or everything bends.

### Phase 2 — GEDCOM I/O *(Claude writes directly)*
**Deliverable:** drag a `.ged` file from Ancestry into the app, see all people in DB. Round-trip fidelity (import → export → re-import produces identical data). Handle conflicting data as "temporal splits" — both values preserved with citations, no data lost.
**Files:** `shared/gedcom.js`, `shared/export.js`
**Critical:** GEDCOM 5.5.1 AND 7.0. Gemini will hallucinate the spec — Claude writes this from the actual standard.

### Phase 3 — Living Tree hero *(Claude builds)*
**Deliverable:** `views/living-tree.html` running. Tree Mode + Edit Mode both functional. Bloom animation. Accelerated time-lapse construction on import. This is the cry-worthy moment.
**Files:** `views/living-tree.html`, `shared/themes.js`, three theme CSS files
**Dependencies:** Phases 1–2 complete.

### Phase 4 — Chronosphere *(Claude builds)*
**Deliverable:** `views/chronosphere.html` running. Time scrubber + simultaneous-ancestor highlighting + world-historical overlay bands.
**Files:** `views/chronosphere.html`
**Data dependency:** `assets/historical-events.json` (Gemini Task C).

### Phase 5 — Atlas *(Claude builds)*
**Deliverable:** `views/atlas.html` running. MapLibre GL + animated migration geodesics + place historical-jurisdiction resolution.
**Files:** `views/atlas.html`
**Dependencies:** MapLibre GL, offline vector tile bundle strategy TBD.

### Phase 6 — Content production *(Gemini tasks, parallel to Phases 3–5)*
Three precision prompts Claude writes for Ashley to send to Gemini:
- **Task A:** Cultural theme pack library — 20 regional/cultural aesthetic themes with palettes, motifs, fonts, event-label translations
- **Task B:** SVG sigil library — 400+ vector sigils tagged by category
- **Task C:** Historical context layer data — JSON of world-historical events 1500–present, regional
Claude audits Gemini output and integrates. Ashley handles Gemini extraction.

### Phase 7 — Vault, Voice Archive, Chorus *(Claude builds)*
**Deliverable:** `views/vault.html` + `views/chorus.html` + `shared/voice.js`.
Artifact-centric browsing, voice recording with local Whisper transcription via Web-LLM, narrative biography generation bounded by Truth Stamper.

### Phase 8 — Distribution *(Ashley's standard URSx pipeline)*
- Netlify deploy
- Bubblewrap TWA init/build
- Google Play Console submission
- SHA-256 fingerprint retrieval
- `assetlinks.json` deploy
- Apple App Store via PWABuilder
- Gumroad / Etsy direct sales pages
- NeurOS marketing rules apply: no diagnostic labels in marketing copy, respect cultural language, never promise DNA-science claims beyond what the app actually does

---

## Gemini extraction protocol notes

Ashley runs Gemini in parallel for concept-heavy, high-volume content work. Gemini produces trash logic but good concepts and he will produce hardcode *if asked the right way*. Claude writes precision prompts for Ashley to paste.

**Gemini does well:** aesthetic manifestos, SVG sigil libraries, theme-pack palettes, narrative templates, historical factual corpora at schema, product copy (with style guardrails: no "Imperial", no "Mandate of Heaven", no em-dashes, no "puss is popped").

**Gemini does badly:** actual working JS/CSS logic (URLs wrong, APIs hallucinated, race conditions, no error handling), security-sensitive code, data migration logic, anything that requires reading a real spec.

**Audit rule:** Every Gemini output goes through Claude before integration. No exceptions. Claude validates schema, checks URLs, strips purple-prose framing, flags any hallucinated APIs.

---

## Non-goals (what ORRERY will not be)

- **Not a DNA analysis service.** Local DNA file parsing for visualization only. No chromosome painting claims we can't back with real phased data. No "ethnicity estimate" theater.
- **Not a cloud sync service.** Sovereignty means local. If users want to share across devices, they export a `.orrery` bundle and import on the other device. Cloud sync is a different product.
- **Not a crypto wallet / password manager / estate planner.** The "digital will" feature is time-released encrypted long-form notes for descendants, scoped to emotional/historical content only. No financial custody. No legal document storage marketed as authoritative.
- **Not a heraldry authority.** Crest Builder is a decorative family sigil tool. No claims of College-of-Arms validity. No algorithmic surname → coat-of-arms generation (that's the Irish-pub-name scam).
- **Not an all-things-to-all-cultures default.** Cultural theme packs are opt-in modules respecting each tradition on its own terms. Default UI is culturally neutral. Zupǔ mode exists for users whose lineage uses generational characters, not as a global aesthetic.

---

## Launch scope decisions (locked)

1. **Collaborative editing (cousin bundle merge):** v2 feature. Launch ships with export-only plus read-only import of someone else's bundle as a separate reference tree. Full diff-and-merge UI ships in 1.1. Rationale: merge conflict resolution UX is genuinely tricky and shipping it broken is worse than shipping it later.
2. **Chorus (local LLM narrative):** ships at launch as **opt-in download**. The Chorus module is present in the UI from day one, but the ~2GB model download is triggered only when the user first opens the view. Web-LLM via WebGPU runs fully offline after download — zero internet, zero server, zero tokens sent anywhere. Ancestry and MyHeritage process narrative generation on their own servers; ORRERY's full-local LLM is a legitimate differentiator worth the 2GB pain.
3. **Pricing:** **$49 USD, one SKU, one-time purchase.** No tiers, no DLC, no subscription. Cultural theme packs and expanded sigil libraries added in free updates, funded by new app sales. Matches URSx pricing pattern.
4. **Default starting tree:** opinionated "add yourself first" onboarding wizard — UX details deferred to Phase 7/8.

---

## Handoff note for future chats / Claude Code instances

If you're reading this in a new chat or Claude Code session: this is the ORRERY project, a sovereign offline-first heritage workspace in the URSx suite. Ashley Brooke Osborne is the architect. Read this document completely before writing code. The PATCH-ONLY rule does not apply — ORRERY can be fully rebuilt. Follow the multi-HTML architecture above. Never put more than ~4k lines in any view file or ~1.5k in any shared module. All three palettes must be maintained. Truth Stamper discipline is non-negotiable. If asked to add features that violate the non-goals list above, flag it instead of building.

---

*Document version: 0.2 — Phase 0 complete + launch scope locked. Phase 1 greenlit.*
*Last updated: April 18, 2026.*
