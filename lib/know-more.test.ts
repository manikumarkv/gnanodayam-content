import { readdir, readFile } from 'node:fs/promises'
import { createReader } from '@keystatic/core/reader'
import { describe, expect, it } from 'vitest'
import keystaticConfig from '../keystatic.config'
import { contentDocSchema } from './content.schema'
import { listPublishedKeys, readPublishedDoc } from './know-more'
import { clean, toContentDoc } from './to-content-doc'

// The trust gate for content PRs: every doc in the repo, draft or published, must convert into
// a doc the app accepts. CI runs this on every pull request.
const reader = createReader(process.cwd(), keystaticConfig)

describe('every "Know more" doc', async () => {
  const entries = await reader.collections.knowMore.all()

  it('there is at least one doc', () => {
    expect(entries.length).toBeGreaterThan(0)
  })

  for (const { slug, entry } of entries) {
    it(`${slug} passes the app's content schema`, () => {
      const result = contentDocSchema.safeParse(clean(toContentDoc(entry)))
      expect(result.success ? 'ok' : result.error.message).toBe('ok')
    })

    it(`${slug}: every figure with a source also has a date`, () => {
      const doc = clean(toContentDoc(entry))
      for (const b of doc.blocks) {
        const figures = b.type === 'facts' ? b.items : b.type === 'chart' ? [b] : []
        for (const f of figures) if (f.source) expect(f.date, `${slug}: ${f.source}`).toBeTruthy()
      }
    })
  }
})

describe('the published API', () => {
  it('lists published docs only', async () => {
    const files = (await readdir('content/know-more')).filter((f) => f.endsWith('.json'))
    const published: string[] = []
    for (const f of files) {
      const raw = JSON.parse(await readFile(`content/know-more/${f}`, 'utf8'))
      if (raw.status === 'published') published.push(f.replace(/\.json$/, ''))
    }
    expect(await listPublishedKeys()).toEqual(published.sort())
  })

  it('returns null for an unknown key', async () => {
    expect(await readPublishedDoc('no-such-doc')).toBeNull()
  })
})

describe('field metrics block', () => {
  const trust = {
    source: 'AISHE 2023-24',
    date: '2023-24',
    verified: false,
    note: '',
  }
  const empty = { ...trust, source: '', date: '' }
  const entry = (value: unknown) =>
    ({
      title: 'Role',
      kicker: '',
      status: 'published',
      blocks: [{ discriminant: 'fieldMetrics', value }],
      lastReviewed: '',
      createdBy: { kind: 'ai', name: 'Claude', at: '2026-10' },
      verifiedBy: { name: '', at: '' },
    }) as unknown as Parameters<typeof toContentDoc>[0]

  it('keeps filled parts and drops empty ones', () => {
    const doc = clean(
      toContentDoc(
        entry({
          openings: { unit: '', points: [], ...empty },
          competition: {
            value: '~4 lakh',
            entryDegrees: 'B.Tech CSE',
            ...trust,
          },
          whoHires: { slices: [], ...empty },
          cities: { items: [{ city: 'Bengaluru', share: 30 }], ...trust },
          women: { share: 34, ...trust },
        }),
      ),
    )
    expect(contentDocSchema.safeParse(doc).success).toBe(true)
    const block = doc.blocks[0]
    expect(block.type === 'fieldMetrics' && Object.keys(block).sort()).toEqual([
      'cities',
      'competition',
      'type',
      'women',
    ])
  })

  it('a filled part without a source fails the app schema', () => {
    const doc = clean(
      toContentDoc(
        entry({
          openings: { unit: '', points: [], ...empty },
          competition: { value: '', entryDegrees: '', ...empty },
          whoHires: { slices: [], ...empty },
          cities: { items: [], ...empty },
          women: { share: 34, ...empty },
        }),
      ),
    )
    expect(contentDocSchema.safeParse(doc).success).toBe(false)
  })
})
