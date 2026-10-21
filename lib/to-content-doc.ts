import type { Entry } from '@keystatic/core/reader'
import type keystaticConfig from '../keystatic.config'
import type { ContentDoc } from './content.schema'

export type KnowMoreEntry = Entry<(typeof keystaticConfig)['collections']['knowMore']>

/**
 * Keystatic entry → the app's content-doc shape (gnanodayam `src/core/content/content.schema.ts`).
 * Keystatic stores blocks as `{ discriminant, value }`, a chart's data as a conditional field, and
 * empty optional text as ''. The app wants `{ type, … }` blocks with optional fields left out.
 */
const opt = (s: string | null | undefined) => (s ? s : undefined)

/** Source/date/verified: only an estimate (has a source) carries `verified`. */
function trust(f: { source: string; date: string; verified: boolean }) {
  return f.source
    ? { source: f.source, date: opt(f.date), verified: f.verified }
    : { date: opt(f.date) }
}

type Block = KnowMoreEntry['blocks'][number]
type MetricsValue = Extract<Block, { discriminant: 'fieldMetrics' }>['value']
type MetricsBlock = Extract<ContentDoc['blocks'][number], { type: 'fieldMetrics' }>

/** A field-metric part's trust fields; empty optional text is left out. */
function metricTrust(p: { source: string; date: string; verified: boolean; note: string }) {
  return { source: p.source, date: p.date, verified: p.verified, note: opt(p.note) }
}

/** Keystatic always stores every part; an empty part (no data) is left out of the doc. */
function toFieldMetrics(v: MetricsValue): MetricsBlock {
  const { openings, competition, whoHires, cities, women } = v
  return {
    type: 'fieldMetrics',
    openings: openings.points.length
      ? {
          unit: opt(openings.unit),
          points: openings.points.map((p) => ({ year: p.year, value: p.value ?? 0 })),
          ...metricTrust(openings),
        }
      : undefined,
    competition: competition.value
      ? {
          value: competition.value,
          entryDegrees: opt(competition.entryDegrees),
          ...metricTrust(competition),
        }
      : undefined,
    whoHires: whoHires.slices.length
      ? {
          slices: whoHires.slices.map((s) => ({ label: s.label, share: s.share ?? 0 })),
          ...metricTrust(whoHires),
        }
      : undefined,
    cities: cities.items.length
      ? {
          items: cities.items.map((c) => ({ city: c.city, share: c.share ?? 0 })),
          ...metricTrust(cities),
        }
      : undefined,
    women: women.share != null ? { share: women.share, ...metricTrust(women) } : undefined,
  }
}

function toBlock(b: Block): ContentDoc['blocks'][number] {
  switch (b.discriminant) {
    case 'text':
      return { type: 'text', body: b.value.body }
    case 'facts':
      return {
        type: 'facts',
        title: opt(b.value.title),
        items: b.value.items.map((i) => ({
          label: i.label,
          value: i.value,
          note: opt(i.note),
          ...trust(i),
        })),
      }
    case 'callout':
      return { type: 'callout', tone: b.value.tone, title: opt(b.value.title), body: b.value.body }
    case 'list':
      return { type: 'list', title: opt(b.value.title), items: [...b.value.items] }
    case 'links':
      return {
        type: 'links',
        title: opt(b.value.title),
        items: b.value.items.map((i) => ({ label: i.label, href: i.href })),
      }
    case 'image':
      return {
        type: 'image',
        // Relative to the content site; the app resolves it against KNOW_MORE_BASE.
        src: (b.value.src ?? '').replace(/^\//, ''),
        alt: b.value.alt,
        caption: opt(b.value.caption),
        credit: opt(b.value.credit),
      }
    case 'chart': {
      const { data, title, unit, note } = b.value
      const shape =
        data.discriminant === 'pie' || data.discriminant === 'donut'
          ? { slices: data.value.slices.map((s) => ({ label: s.label, value: s.value ?? 0 })) }
          : {
              categories: [...data.value.categories],
              series: data.value.series.map((s) => ({
                label: s.label,
                values: s.values.map((v) => v ?? 0),
              })),
            }
      return {
        type: 'chart',
        chartType: data.discriminant,
        title: opt(title),
        unit: opt(unit),
        ...shape,
        note: opt(note),
        ...trust(b.value),
      }
    }
    case 'fieldMetrics':
      return toFieldMetrics(b.value)
  }
}

export function toContentDoc(entry: KnowMoreEntry): ContentDoc {
  const { createdBy, verifiedBy } = entry
  return {
    schemaVersion: 1,
    title: entry.title,
    kicker: opt(entry.kicker),
    blocks: entry.blocks.map(toBlock),
    meta: {
      lastReviewed: opt(entry.lastReviewed),
      createdBy: { kind: createdBy.kind, name: opt(createdBy.name), at: opt(createdBy.at) },
      verifiedBy: verifiedBy.name ? { name: verifiedBy.name, at: opt(verifiedBy.at) } : undefined,
    },
  }
}

/** Drop `undefined` keys so the JSON matches what a hand-written doc would contain. */
export function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
