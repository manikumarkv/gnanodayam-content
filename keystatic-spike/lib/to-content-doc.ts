import type { Entry } from '@keystatic/core/reader'
import type config from '../keystatic.config'

type KnowMore = Entry<(typeof config)['collections']['knowMore']>

// Keystatic stores optional text as '' and blocks as { discriminant, value }.
// Convert to the app's content-doc shape (gnanodayam src/core/content/content.schema.ts).
const opt = (s: string | null | undefined) => (s ? s : undefined)
const fig = (f: { source: string; date: string; verified: boolean }) => ({
  source: opt(f.source),
  date: opt(f.date),
  verified: f.source ? f.verified : undefined,
})

export function toContentDoc(e: KnowMore) {
  const blocks = e.blocks.map((b) => {
    switch (b.discriminant) {
      case 'text':
        return { type: 'text', body: b.value.body }
      case 'facts':
        return {
          type: 'facts',
          title: opt(b.value.title),
          items: b.value.items.map((i) => ({ label: i.label, value: i.value, note: opt(i.note), ...fig(i) })),
        }
      case 'callout':
        return { type: 'callout', tone: b.value.tone, title: opt(b.value.title), body: b.value.body }
      case 'list':
        return { type: 'list', title: opt(b.value.title), items: b.value.items }
      case 'links':
        return { type: 'links', title: opt(b.value.title), items: b.value.items }
      case 'image':
        return {
          type: 'image',
          // content-relative path; the app resolves it against KNOW_MORE_BASE
          src: (b.value.src ?? '').replace(/^\//, ''),
          alt: b.value.alt,
          caption: opt(b.value.caption),
          credit: opt(b.value.credit),
        }
      case 'chart': {
        const v = b.value
        const pie = v.chartType === 'pie' || v.chartType === 'donut'
        return {
          type: 'chart',
          chartType: v.chartType,
          title: opt(v.title),
          unit: opt(v.unit),
          ...(pie
            ? { slices: v.slices.map((s) => ({ label: s.label, value: s.value ?? 0 })) }
            : {
                categories: v.categories,
                series: v.series.map((s) => ({ label: s.label, values: s.values.map((n) => n ?? 0) })),
              }),
          note: opt(v.note),
          ...fig(v),
        }
      }
    }
  })
  return {
    schemaVersion: 1,
    title: e.title,
    kicker: opt(e.kicker),
    blocks,
    meta: {
      lastReviewed: opt(e.lastReviewed),
      createdBy: { kind: e.createdBy.kind, name: opt(e.createdBy.name), at: opt(e.createdBy.at) },
      verifiedBy: e.verifiedBy.name ? { name: e.verifiedBy.name, at: opt(e.verifiedBy.at) } : undefined,
    },
  }
}
