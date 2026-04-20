// orrery/test-fixture.mjs
// Test harness for Phase 1. Loads the 50-person fixture, exposes
// window.orrery.{db, queries}, and renders every graph query to the page.

import {
  openDB, destroyDB, bulkPut, DB_NAME,
} from './shared/db.js';
import { bindQueries } from './shared/relationships.js';
import { summarizeProvenance, yearOf } from './shared/events.js';
import { PLACES, SOURCES, PERSONS, RELATIONSHIPS, EVENTS } from './shared/fixture-data.js';

/* -------------------------------------------------------------------------- */
/*  Rendering helpers                                                          */
/* -------------------------------------------------------------------------- */

const $ = (sel) => document.querySelector(sel);
const fmt = (obj) => JSON.stringify(obj, (k, v) => v === undefined ? null : v, 2);

function el(tag, opts = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(opts)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const kid of kids) {
    if (kid == null) continue;
    node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
  }
  return node;
}

function renderCounts(counts) {
  const body = $('#counts-body');
  body.innerHTML = '';
  for (const [key, n] of Object.entries(counts)) {
    body.appendChild(el('div', { class: 'stat' },
      el('div', { class: 'label' }, key),
      el('div', { class: 'value' }, String(n))
    ));
  }
}

/** Render a single query card: title, optional description, body (string or element). */
function renderQuery(title, desc, body) {
  const card = el('div', { class: 'card' });
  card.appendChild(el('h3', {}, title));
  if (desc) card.appendChild(el('p', { class: 'muted' }, desc));
  if (typeof body === 'string') {
    card.appendChild(el('pre', {}, body));
  } else if (body instanceof Node) {
    card.appendChild(body);
  }
  $('#queries-body').appendChild(card);
}

function nameOf(db, id) {
  // Synchronous name lookup via a cached map (built per-run).
  return db._nameCache?.get(id) ?? id;
}

async function buildNameCache(db) {
  const all = await db.persons.toArray();
  db._nameCache = new Map(all.map((p) => [p.id, p.name]));
}

function peopleLabel(db, rows, keyExtractor) {
  // rows is an array of { person, ... } or { person_id, ... }
  if (!rows.length) return '(none)';
  return rows
    .map((r) => {
      const id = keyExtractor ? keyExtractor(r) : (r.person?.id ?? r.person_id ?? r.id);
      const name = r.person?.name ?? nameOf(db, id) ?? id;
      const extra = [];
      if (r.generation != null) extra.push(`gen+${r.generation}`);
      if (r.half === true) extra.push('half');
      if (r.half === false) extra.push('full');
      if (r.current === true) extra.push('current');
      if (r.current === false) extra.push('former');
      if (r.relation?.adoptive) extra.push('adoptive');
      if (r.relation?.step) extra.push('step');
      if (r.relation?.foster) extra.push('foster');
      if (r.relation?.godparent) extra.push('godparent');
      if (r.relation?.biological) extra.push('bio');
      const tag = extra.length ? ` [${extra.join(', ')}]` : '';
      return `  • ${name}  (${id})${tag}`;
    })
    .join('\n');
}

function relationshipDescription(res) {
  if (!res) return '(no result)';
  switch (res.type) {
    case 'self': return 'same person';
    case 'spouse': return `spouse (${res.current ? 'current' : 'former'})`;
    case 'ancestor': return `ancestor → ${res.label} (${res.generations} gen up)`;
    case 'descendant': return `descendant → ${res.label} (${res.generations} gen down)`;
    case 'sibling': return res.half ? 'half-sibling' : 'full sibling';
    case 'cousin':
      return `${ordinal(res.degree)} cousin${res.removed ? `, ${res.removed}× removed` : ''}` +
             ` (common ancestor: ${res.commonAncestor?.name ?? '?'})`;
    case 'step-or-adoptive-relation':
      return `non-biological relation via ${res.details?.commonAncestor?.name ?? '?'}`;
    case 'unrelated': return 'unrelated';
    default: return JSON.stringify(res);
  }
}

function ordinal(n) {
  if (n <= 0) return 'zeroth';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/* -------------------------------------------------------------------------- */
/*  Truth Stamper diagnostic                                                   */
/* -------------------------------------------------------------------------- */

async function renderTruthStamper(db) {
  const body = $('#truth-body');
  body.innerHTML = '';

  // Find any person vital that has an empty source_ids array.
  const people = await db.persons.toArray();
  const unverified = [];
  for (const p of people) {
    for (const facet of ['birth', 'death', 'baptism', 'burial']) {
      const v = p.vitals?.[facet];
      if (!v || v.date == null) continue;
      if (!v.source_ids || v.source_ids.length === 0) {
        unverified.push({ person: p, facet, date: v.date });
      }
    }
  }

  const summary = el('div', {},
    el('p', {}, `Detected ${unverified.length} unverified fact(s) — these should render distinct from sourced facts in the UI.`)
  );
  body.appendChild(summary);

  for (const row of unverified) {
    const tag = el('span', { class: 'tag unverified' }, 'UNVERIFIED');
    body.appendChild(el('div', { class: 'card' },
      el('div', {},
        el('strong', {}, row.person.name),
        ' — ', row.facet, ' ',
        tag,
      ),
      el('pre', {}, fmt({ id: row.person.id, facet: row.facet, date: row.date, source_ids: [] })),
    ));
  }

  // Also show one verified fact for comparison.
  for (const p of people) {
    const v = p.vitals?.birth;
    if (v?.source_ids?.length) {
      const tag = el('span', { class: 'tag verified' }, 'VERIFIED');
      body.appendChild(el('div', { class: 'card' },
        el('div', {},
          el('strong', {}, p.name),
          ' — birth ', tag,
        ),
        el('pre', {}, fmt({ id: p.id, date: v.date, source_ids: v.source_ids })),
      ));
      break;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Query runner                                                               */
/* -------------------------------------------------------------------------- */

async function runQueries(db, q) {
  $('#queries-body').innerHTML = '';

  // --- getParents / getChildren / getSiblings / getSpouses on g3a (P.J.) ---
  const pjParents = await q.getParents('g3a');
  renderQuery(
    "q.getParents('g3a')",
    "Patrick James O'Sullivan's parents (James O'Sullivan × Anne MacCarthy).",
    peopleLabel(db, pjParents)
  );

  const pjChildren = await q.getChildren('g3a');
  renderQuery(
    "q.getChildren('g3a')",
    "P.J.'s five children (one from first marriage, four from second).",
    peopleLabel(db, pjChildren)
  );

  const pjSpouses = await q.getSpouses('g3a');
  renderQuery(
    "q.getSpouses('g3a')",
    'Both marriages — Helen Walsh (former, deceased 1910) and Margarethe Kessler (current).',
    peopleLabel(db, pjSpouses)
  );

  const g4aSiblings = await q.getSiblings('g4a', { includeHalf: true });
  renderQuery(
    "q.getSiblings('g4a', {includeHalf: true})",
    "Thomas (g4a) should show four HALF-siblings (g4b-e) since they share only g3a.",
    peopleLabel(db, g4aSiblings)
  );

  const g4aSiblingsFull = await q.getSiblings('g4a', { includeHalf: false });
  renderQuery(
    "q.getSiblings('g4a', {includeHalf: false})",
    'Full siblings only — expected empty for Thomas (all G4 siblings are half).',
    peopleLabel(db, g4aSiblingsFull)
  );

  // --- getAncestors / getDescendants ---
  const g5cAncestors = await q.getAncestors('g5c');
  renderQuery(
    "q.getAncestors('g5c')",
    "Patrick John O'Sullivan's ancestors (BFS, biological + non-bio edges by default).",
    peopleLabel(db, g5cAncestors.map((a) => ({ ...a, person: { id: a.person_id, name: nameOf(db, a.person_id) } })))
  );

  const g1aDescendants = await q.getDescendants('g1a', 3);
  renderQuery(
    "q.getDescendants('g1a', 3)",
    "Patrick O'Sullivan (immigrant)'s descendants, depth-limited to 3 generations.",
    peopleLabel(db, g1aDescendants.map((d) => ({ ...d, person: { id: d.person_id, name: nameOf(db, d.person_id) } })))
  );

  // --- findCommonAncestors ---
  const ca1 = await q.findCommonAncestors('g5a', 'g5c');
  renderQuery(
    "q.findCommonAncestors('g5a', 'g5c')",
    'g5a (Tommy Jr., child of half-sibling g4a) vs g5c (Pat Jr., child of g4b). Closest common ancestor should be g3a.',
    ca1.map((r) => `  • ${r.person.name}  (distA=${r.distA}, distB=${r.distB}, total=${r.total})`).join('\n') || '(none)'
  );

  const ca2 = await q.findCommonAncestors('g5c', 'g5f');
  renderQuery(
    "q.findCommonAncestors('g5c', 'g5f')",
    'First cousins through g3a+g3f. Should find both as common ancestors at distance 2,2.',
    ca2.map((r) => `  • ${r.person.name}  (distA=${r.distA}, distB=${r.distB}, total=${r.total})`).join('\n') || '(none)'
  );

  const ca3 = await q.findCommonAncestors('g5c', 'g5j');
  renderQuery(
    "q.findCommonAncestors('g5c', 'g5j')",
    'First cousins through Walsh line (g3k+g3l). g5c\'s mother g4g is sister to g5j\'s father g4i.',
    ca3.map((r) => `  • ${r.person.name}  (distA=${r.distA}, distB=${r.distB}, total=${r.total})`).join('\n') || '(none)'
  );

  // --- calculateRelationship ---
  const pairs = [
    ['g5a', 'g5b', 'full siblings'],
    ['g5a', 'g5c', 'half first cousins via g3a'],
    ['g5c', 'g5f', 'first cousins via g3a+g3f'],
    ['g5c', 'g5j', 'first cousins via g3k+g3l (Walsh line)'],
    ['g5c', 'g2a', 'great-grandchild / great-grandparent'],
    ['g5c', 'g1a', 'great-great-great-grandchild / ancestor'],
    ['g2a', 'g2c', 'spouses (James × Anne)'],
    ['g3a', 'g3f', 'spouses (PJ × Margarethe, current)'],
    ['g3a', 'g3b', 'spouses (PJ × Helen, former/deceased)'],
    ['g5i', 'g4e', 'adoptive mother/daughter (non-biological)'],
    ['g5i', 'g5c', 'unrelated biologically (Ruth is adopted)'],
    ['g1a', 'g1e', 'unrelated (Irish vs German immigrant)'],
  ];
  for (const [a, b, note] of pairs) {
    const res = await q.calculateRelationship(a, b);
    renderQuery(
      `q.calculateRelationship('${a}', '${b}')`,
      `${nameOf(db, a)} vs ${nameOf(db, b)} — expected: ${note}`,
      relationshipDescription(res) + '\n\n' + fmt(res)
    );
  }

  // --- getContemporaries ---
  for (const year of [1850, 1900, 1950, 2000]) {
    const alive = await q.getContemporaries(year);
    renderQuery(
      `q.getContemporaries(${year})`,
      `${alive.length} person(s) alive in ${year}.`,
      alive.map((p) => `  • ${p.name}  (${p.id}, b.${yearOf(p.vitals?.birth?.date) ?? '?'}` +
        `${p.vitals?.death?.date ? `, d.${yearOf(p.vitals.death.date)}` : ', living'})`).join('\n') || '(none)'
    );
  }

  // --- getGenerationDepth ---
  const depthTests = [
    ['g5c', 'g1a'],  // great-great-great-grandchild of Patrick O'Sullivan
    ['g1a', 'g5c'],  // reverse
    ['g5c', 'g3a'],  // grandchild
    ['g3a', 'g3f'],  // spouses — should be null (no direct line)
    ['g5i', 'g4e'],  // adopted; biological path: null
  ];
  for (const [a, b] of depthTests) {
    const d = await q.getGenerationDepth(a, b);
    renderQuery(
      `q.getGenerationDepth('${a}', '${b}')`,
      `${nameOf(db, a)} relative to ${nameOf(db, b)}.`,
      `→ ${d === null ? 'null (no direct biological line)' : d + ' generations'}`
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

async function loadFixture(db) {
  const bundle = {
    places: PLACES,
    sources: SOURCES,
    persons: PERSONS,
    relationships: RELATIONSHIPS,
    events: EVENTS,
  };
  return await bulkPut(db, bundle);
}

async function runAll({ wipeFirst }) {
  $('#errors').hidden = true;
  $('#errors-body').textContent = '';
  try {
    if (wipeFirst) {
      await destroyDB(DB_NAME);
    }
    const db = await openDB();
    if (wipeFirst || (await db.persons.count()) === 0) {
      await db.wipe();
      await loadFixture(db);
    }
    await buildNameCache(db);
    const q = bindQueries(db);

    // Expose for console exploration.
    window.orrery = { db, queries: q, fixture: { PLACES, SOURCES, PERSONS, RELATIONSHIPS, EVENTS } };

    renderCounts(await db.counts());
    await renderTruthStamper(db);
    await runQueries(db, q);
  } catch (err) {
    console.error(err);
    $('#errors').hidden = false;
    $('#errors-body').textContent = (err && err.stack) ? err.stack : String(err);
  }
}

$('#btn-reload').addEventListener('click', () => runAll({ wipeFirst: false }));
$('#btn-wipe').addEventListener('click', () => runAll({ wipeFirst: true }));

runAll({ wipeFirst: true });
