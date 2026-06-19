/**
 * Compile the per-path source files (`paths/<code>.json`) into the served `paths/index.json`
 * (gnanodayam app, ADR 0006). The app fetches ONLY this index — a flat, published-only list of
 * nodes — and builds the tree in memory. Authors edit one file per path; this keeps the index in
 * sync, mirroring how build-index.yml keeps details/index.json in sync.
 *
 * Rules:
 *   - Validate: filename must equal `code`; every `parent` must resolve to a real code; no cycles.
 *   - Firewall: exclude any node whose `status` is "draft" OR that has a draft ancestor (cascade) —
 *     so drafts never reach the public CDN.
 *   - Emit: { code, parent, label, type, description?, roleSlug? } per served node, sorted by code
 *     for stable diffs. (`children`/`status` are source-only; the app derives the tree from parents.)
 *
 *   node scripts/compile-paths.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PATHS = join(dirname(fileURLToPath(import.meta.url)), '..', 'paths')
const fail = (msg) => {
  console.error(`compile-paths: ${msg}`)
  process.exit(1)
}

// Exclude the two compiled outputs — they're generated here, not source files.
const COMPILED = new Set(['index.json', 'all.json'])
const files = (await readdir(PATHS)).filter((f) => f.endsWith('.json') && !COMPILED.has(f))
const nodes = []
for (const f of files) {
  const node = JSON.parse(await readFile(join(PATHS, f), 'utf8'))
  if (node.code !== basename(f, '.json')) fail(`${f}: filename must equal code "${node.code}"`)
  nodes.push(node)
}

const byCode = new Map(nodes.map((n) => [n.code, n]))

// Validate parent references + absence of cycles (walk to a root; guard against loops).
for (const n of nodes) {
  const seen = new Set()
  for (let cur = n; cur && cur.parent !== null; cur = byCode.get(cur.parent)) {
    if (!byCode.has(cur.parent)) fail(`${n.code}: parent "${cur.parent}" not found`)
    if (seen.has(cur.code)) fail(`${n.code}: cycle detected via "${cur.code}"`)
    seen.add(cur.code)
  }
}

// Published-only: a node is served iff neither it nor any ancestor is a draft.
const served = (n) => {
  for (let cur = n; cur; cur = cur.parent !== null ? byCode.get(cur.parent) : null) {
    if (cur.status === 'draft') return false
  }
  return true
}

const byCodeAsc = (a, b) => a.code.localeCompare(b.code)
// Public index entry: structure only, no status (the served index is published-only already).
const entry = ({ code, parent, label, type, description, roleSlug }) => ({
  code,
  parent,
  label,
  type,
  ...(description ? { description } : {}),
  ...(roleSlug ? { roleSlug } : {}),
})

// index.json — published-only, fetched by the public app.
const index = nodes.filter(served).sort(byCodeAsc).map(entry)
await writeFile(join(PATHS, 'index.json'), JSON.stringify(index, null, 2) + '\n')

// all.json — the FULL per-file records incl. drafts (status, children order, everything), read ONLY
// by the curator editor (ADR 0007) as its complete working copy. The public app never reads this.
const all = [...nodes].sort(byCodeAsc)
await writeFile(join(PATHS, 'all.json'), JSON.stringify(all, null, 2) + '\n')

const drafts = nodes.length - index.length
console.log(
  `compile-paths: ${nodes.length} source files → ${index.length} published in index.json` +
    ` (${drafts} draft) · ${all.length} in all.json`,
)
