// orrery/shared/relationships.js
// Graph traversal queries for ORRERY. Read-only. Pure functions taking an
// open OrreryDB handle (from db.js).
//
// Performance: BFS is O(V+E) per call and fine for 50-person fixtures.
// A memoized adjacency cache will land when we cross ~100k people.

import { yearOf, yearMatches } from './events.js';
import { toId } from './db.js';

/* -------------------------------------------------------------------------- */
/*  Edge-type groupings                                                        */
/* -------------------------------------------------------------------------- */

const PARENT_TYPES_A_IS_PARENT = new Set([
  'parent', 'adoptive-parent', 'step-parent', 'foster', 'godparent',
]);
const CHILD_TYPES_A_IS_CHILD = new Set([
  'child', 'adopted-child', 'step-child', 'godchild',
]);
const SIBLING_TYPES = new Set(['sibling', 'half-sibling']);
const SPOUSE_TYPES = new Set(['spouse', 'partner']);

function classifyParentEdge(edge) {
  const flags = {
    biological: edge.biological === true,
    adoptive: edge.adoptive === true ||
      edge.type === 'adoptive-parent' || edge.type === 'adopted-child',
    step: edge.type === 'step-parent' || edge.type === 'step-child',
    foster: edge.type === 'foster',
    godparent: edge.type === 'godparent' || edge.type === 'godchild',
  };
  // Bare 'parent'/'child' without explicit flags defaults to biological.
  if (!flags.adoptive && !flags.step && !flags.foster && !flags.godparent &&
      (edge.type === 'parent' || edge.type === 'child')) {
    flags.biological = true;
  }
  return flags;
}

/* -------------------------------------------------------------------------- */
/*  Direct neighbors                                                           */
/* -------------------------------------------------------------------------- */

export async function getParents(db, personId) {
  const id = toId(personId);
  const inbound = await db.relationships.where('person_b_id').equals(id).toArray();
  const outbound = await db.relationships.where('person_a_id').equals(id).toArray();

  const hits = [];
  for (const e of inbound) {
    if (PARENT_TYPES_A_IS_PARENT.has(e.type)) hits.push({ parent_id: e.person_a_id, edge: e });
  }
  for (const e of outbound) {
    if (CHILD_TYPES_A_IS_CHILD.has(e.type)) hits.push({ parent_id: e.person_b_id, edge: e });
  }

  const seen = new Map();
  for (const h of hits) if (!seen.has(h.parent_id)) seen.set(h.parent_id, h);
  const rows = [...seen.values()];
  const people = await db.persons.bulkGet(rows.map((r) => r.parent_id));
  return rows.map((r, i) => ({
    person: people[i] ?? null,
    edge: r.edge,
    relation: classifyParentEdge(r.edge),
  }));
}

export async function getChildren(db, personId) {
  const id = toId(personId);
  const outbound = await db.relationships.where('person_a_id').equals(id).toArray();
  const inbound = await db.relationships.where('person_b_id').equals(id).toArray();

  const hits = [];
  for (const e of outbound) {
    if (PARENT_TYPES_A_IS_PARENT.has(e.type)) hits.push({ child_id: e.person_b_id, edge: e });
  }
  for (const e of inbound) {
    if (CHILD_TYPES_A_IS_CHILD.has(e.type)) hits.push({ child_id: e.person_a_id, edge: e });
  }

  const seen = new Map();
  for (const h of hits) if (!seen.has(h.child_id)) seen.set(h.child_id, h);
  const rows = [...seen.values()];
  const people = await db.persons.bulkGet(rows.map((r) => r.child_id));
  return rows.map((r, i) => ({
    person: people[i] ?? null,
    edge: r.edge,
    relation: classifyParentEdge(r.edge),
  }));
}

/**
 * Siblings: explicit sibling edges PLUS anyone who shares a biological parent.
 * `includeHalf=false` restricts to full siblings (two shared bio parents).
 */
export async function getSiblings(db, personId, { includeHalf = true } = {}) {
  const id = toId(personId);

  const a = await db.relationships.where('person_a_id').equals(id).toArray();
  const b = await db.relationships.where('person_b_id').equals(id).toArray();
  const explicit = [];
  for (const e of [...a, ...b]) {
    if (!SIBLING_TYPES.has(e.type)) continue;
    const otherId = e.person_a_id === id ? e.person_b_id : e.person_a_id;
    explicit.push({ id: otherId, half: e.type === 'half-sibling', edge: e });
  }

  const myParents = (await getParents(db, id)).filter((p) => p.relation.biological);
  const parentIds = myParents.map((p) => p.person?.id).filter(Boolean);
  const kidsByParent = await Promise.all(parentIds.map((pid) => getChildren(db, pid)));

  const countByChild = new Map();
  for (const kids of kidsByParent) {
    for (const k of kids) {
      if (!k.relation.biological) continue;
      const kid = k.person?.id;
      if (!kid || kid === id) continue;
      countByChild.set(kid, (countByChild.get(kid) ?? 0) + 1);
    }
  }

  const implicit = [];
  for (const [kid, n] of countByChild) {
    const full = parentIds.length >= 2 && n >= 2;
    if (!includeHalf && !full) continue;
    implicit.push({ id: kid, half: !full, edge: null });
  }

  const merged = new Map();
  for (const s of [...explicit, ...implicit]) {
    const prev = merged.get(s.id);
    if (!prev) merged.set(s.id, s);
    else if (prev.half && !s.half) merged.set(s.id, s); // upgrade half -> full
  }
  if (!includeHalf) for (const [k, v] of merged) if (v.half) merged.delete(k);

  const ids = [...merged.keys()];
  const people = await db.persons.bulkGet(ids);
  return ids.map((i, idx) => ({
    person: people[idx] ?? null,
    half: merged.get(i).half,
    edge: merged.get(i).edge,
  }));
}

export async function getSpouses(db, personId) {
  const id = toId(personId);
  const a = await db.relationships.where('person_a_id').equals(id).toArray();
  const b = await db.relationships.where('person_b_id').equals(id).toArray();

  const rows = [];
  for (const e of [...a, ...b]) {
    if (!SPOUSE_TYPES.has(e.type)) continue;
    const otherId = e.person_a_id === id ? e.person_b_id : e.person_a_id;
    rows.push({ other_id: otherId, edge: e, current: e.end_date == null });
  }
  const people = await db.persons.bulkGet(rows.map((r) => r.other_id));
  return rows.map((r, i) => ({
    person: people[i] ?? null,
    current: r.current,
    edge: r.edge,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Batch adjacency (for BFS)                                                  */
/* -------------------------------------------------------------------------- */

async function _adjParents(db, ids) {
  const out = new Map();
  if (!ids.length) return out;
  const asChild = await db.relationships.where('person_b_id').anyOf(ids).toArray();
  const asParent = await db.relationships.where('person_a_id').anyOf(ids).toArray();
  for (const e of asChild) {
    if (!PARENT_TYPES_A_IS_PARENT.has(e.type)) continue;
    const list = out.get(e.person_b_id) ?? [];
    list.push({ parentId: e.person_a_id, edge: e, relation: classifyParentEdge(e) });
    out.set(e.person_b_id, list);
  }
  for (const e of asParent) {
    if (!CHILD_TYPES_A_IS_CHILD.has(e.type)) continue;
    const list = out.get(e.person_a_id) ?? [];
    list.push({ parentId: e.person_b_id, edge: e, relation: classifyParentEdge(e) });
    out.set(e.person_a_id, list);
  }
  return out;
}

async function _adjChildren(db, ids) {
  const out = new Map();
  if (!ids.length) return out;
  const asParent = await db.relationships.where('person_a_id').anyOf(ids).toArray();
  const asChild = await db.relationships.where('person_b_id').anyOf(ids).toArray();
  for (const e of asParent) {
    if (!PARENT_TYPES_A_IS_PARENT.has(e.type)) continue;
    const list = out.get(e.person_a_id) ?? [];
    list.push({ childId: e.person_b_id, edge: e, relation: classifyParentEdge(e) });
    out.set(e.person_a_id, list);
  }
  for (const e of asChild) {
    if (!CHILD_TYPES_A_IS_CHILD.has(e.type)) continue;
    const list = out.get(e.person_b_id) ?? [];
    list.push({ childId: e.person_a_id, edge: e, relation: classifyParentEdge(e) });
    out.set(e.person_b_id, list);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  BFS traversals                                                             */
/* -------------------------------------------------------------------------- */

export async function getAncestors(db, personId, maxGenerations = null, { biologicalOnly = false } = {}) {
  const start = toId(personId);
  const results = [];
  const seen = new Set([start]);
  let frontier = [start];
  let depth = 0;

  while (frontier.length && (maxGenerations == null || depth < maxGenerations)) {
    const adj = await _adjParents(db, frontier);
    const next = [];
    for (const childId of frontier) {
      for (const p of adj.get(childId) ?? []) {
        if (biologicalOnly && !p.relation.biological) continue;
        if (seen.has(p.parentId)) continue;
        seen.add(p.parentId);
        next.push(p.parentId);
        results.push({
          person_id: p.parentId,
          generation: depth + 1,
          via: childId,
          edge: p.edge,
          relation: p.relation,
        });
      }
    }
    frontier = next;
    depth++;
  }
  return results;
}

export async function getDescendants(db, personId, maxGenerations = null, { biologicalOnly = false } = {}) {
  const start = toId(personId);
  const results = [];
  const seen = new Set([start]);
  let frontier = [start];
  let depth = 0;

  while (frontier.length && (maxGenerations == null || depth < maxGenerations)) {
    const adj = await _adjChildren(db, frontier);
    const next = [];
    for (const parentId of frontier) {
      for (const k of adj.get(parentId) ?? []) {
        if (biologicalOnly && !k.relation.biological) continue;
        if (seen.has(k.childId)) continue;
        seen.add(k.childId);
        next.push(k.childId);
        results.push({
          person_id: k.childId,
          generation: depth + 1,
          via: parentId,
          edge: k.edge,
          relation: k.relation,
        });
      }
    }
    frontier = next;
    depth++;
  }
  return results;
}

/* -------------------------------------------------------------------------- */
/*  Common ancestors & relationship calculation                                */
/* -------------------------------------------------------------------------- */

async function _ancestorDistances(db, personId, { biologicalOnly = true } = {}) {
  const distances = new Map();
  distances.set(toId(personId), 0);
  const ancestors = await getAncestors(db, personId, null, { biologicalOnly });
  for (const a of ancestors) {
    if (!distances.has(a.person_id)) distances.set(a.person_id, a.generation);
  }
  return distances;
}

/**
 * Common ancestors sorted by closeness (total path length, then min distance).
 * Biological edges only by default — genealogy's standard convention.
 */
export async function findCommonAncestors(db, personA_id, personB_id, { biologicalOnly = true } = {}) {
  const [distA, distB] = await Promise.all([
    _ancestorDistances(db, personA_id, { biologicalOnly }),
    _ancestorDistances(db, personB_id, { biologicalOnly }),
  ]);

  const commonIds = [];
  for (const k of distA.keys()) if (distB.has(k)) commonIds.push(k);
  if (!commonIds.length) return [];

  const people = await db.persons.bulkGet(commonIds);
  const rows = commonIds.map((id, i) => ({
    person: people[i] ?? null,
    distA: distA.get(id),
    distB: distB.get(id),
    total: distA.get(id) + distB.get(id),
  }));
  rows.sort((x, y) => x.total - y.total || Math.min(x.distA, x.distB) - Math.min(y.distA, y.distB));
  return rows;
}

function _directLineLabel(delta, direction) {
  if (delta === 0) return 'self';
  const role = direction === 'up' ? 'parent' : 'child';
  if (delta === 1) return role;
  if (delta === 2) return `grand${role}`;
  return `${'great-'.repeat(delta - 2)}grand${role}`;
}

/**
 * Classify the relationship between two people. One of:
 *   { type: 'self' }
 *   { type: 'ancestor' | 'descendant', label, generations, commonAncestor }
 *   { type: 'sibling', half }
 *   { type: 'cousin', degree, removed, commonAncestor, distA, distB }
 *   { type: 'spouse', current }
 *   { type: 'step-or-adoptive-relation', details }
 *   { type: 'unrelated' }
 */
export async function calculateRelationship(db, personA_id, personB_id) {
  const a = toId(personA_id);
  const b = toId(personB_id);
  if (a === b) return { type: 'self' };

  const spouses = await getSpouses(db, a);
  const sp = spouses.find((s) => s.person?.id === b);
  if (sp) return { type: 'spouse', current: sp.current };

  const commons = await findCommonAncestors(db, a, b, { biologicalOnly: true });
  if (commons.length > 0) {
    const top = commons[0];
    if (top.person?.id === a) {
      return {
        type: 'descendant',
        label: _directLineLabel(top.distB, 'down'),
        generations: top.distB,
        commonAncestor: top.person,
      };
    }
    if (top.person?.id === b) {
      return {
        type: 'ancestor',
        label: _directLineLabel(top.distA, 'up'),
        generations: top.distA,
        commonAncestor: top.person,
      };
    }
    if (top.distA === 1 && top.distB === 1) {
      // Full siblings share two parents at distance 1; half-siblings share one.
      const shared = commons.filter((c) => c.distA === 1 && c.distB === 1);
      return { type: 'sibling', half: shared.length < 2, commonAncestor: top.person };
    }
    const degree = Math.min(top.distA, top.distB) - 1;
    const removed = Math.abs(top.distA - top.distB);
    return {
      type: 'cousin',
      degree, removed,
      commonAncestor: top.person,
      distA: top.distA, distB: top.distB,
    };
  }

  const softCommons = await findCommonAncestors(db, a, b, { biologicalOnly: false });
  if (softCommons.length > 0) {
    const top = softCommons[0];
    return {
      type: 'step-or-adoptive-relation',
      details: { commonAncestor: top.person, distA: top.distA, distB: top.distB },
    };
  }
  return { type: 'unrelated' };
}

/* -------------------------------------------------------------------------- */
/*  Year-scoped queries                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Everyone alive in `year`: birthYear <= year AND (no death OR deathYear >= year).
 * People with unknown birth are excluded (Chronosphere surfaces those separately).
 */
export async function getContemporaries(db, year) {
  const all = await db.persons.toArray();
  const alive = [];
  for (const p of all) {
    const birth = p.vitals?.birth?.date;
    const death = p.vitals?.death?.date;
    const birthYear = yearOf(birth);
    if (birthYear == null) continue;

    const bornByYear =
      birthYear <= year ||
      (birth?.kind === 'before' && year >= 1) ||
      (birth?.kind === 'approximate' && birthYear - 5 <= year);
    if (!bornByYear) continue;

    if (!death) { alive.push(p); continue; }
    const deathYear = yearOf(death);
    if (deathYear == null) { alive.push(p); continue; }
    if (deathYear >= year || yearMatches(death, year)) alive.push(p);
  }
  alive.sort((x, y) => (yearOf(x.vitals?.birth?.date) ?? 0) - (yearOf(y.vitals?.birth?.date) ?? 0));
  return alive;
}

/**
 * Generation offset between `personId` and `relativeTo`:
 *   0 if same person or 'self'; +N if relativeTo is an ancestor N up;
 *   -N if a descendant N down; null if no direct line.
 */
export async function getGenerationDepth(db, personId, relativeTo = 'self') {
  if (relativeTo === 'self' || relativeTo === toId(personId)) return 0;
  const refId = toId(relativeTo);
  const ancestors = await getAncestors(db, personId, null, { biologicalOnly: true });
  const hitA = ancestors.find((a) => a.person_id === refId);
  if (hitA) return hitA.generation;
  const descendants = await getDescendants(db, personId, null, { biologicalOnly: true });
  const hitD = descendants.find((d) => d.person_id === refId);
  if (hitD) return -hitD.generation;
  return null;
}

/**
 * Bind every public query to a db handle. Convenient for the test fixture
 * and view modules that carry a single db reference.
 */
export function bindQueries(db) {
  return {
    getParents: (id) => getParents(db, id),
    getChildren: (id) => getChildren(db, id),
    getSiblings: (id, opts) => getSiblings(db, id, opts),
    getSpouses: (id) => getSpouses(db, id),
    getAncestors: (id, max, opts) => getAncestors(db, id, max, opts),
    getDescendants: (id, max, opts) => getDescendants(db, id, max, opts),
    findCommonAncestors: (a, b, opts) => findCommonAncestors(db, a, b, opts),
    calculateRelationship: (a, b) => calculateRelationship(db, a, b),
    getContemporaries: (year) => getContemporaries(db, year),
    getGenerationDepth: (id, rel) => getGenerationDepth(db, id, rel),
  };
}
