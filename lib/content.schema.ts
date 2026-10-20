// COPY of gnanodayam src/core/content/content.schema.ts — keep in sync. The endpoint's output must
// pass this schema; the app validates every doc with the original.
import { z } from 'zod'

/**
 * Generic, block-based content document (#77) — the reusable format behind Path Explorer
 * "Know more" panels and (later) role pages, FAQs, articles. Validated at the fetch boundary.
 * Portable: zod only, no framework.
 */

export const factSchema = z.object({
  label: z.string(),
  value: z.string(),
  note: z.string().optional(),
  source: z.string().optional(), // present → an estimate → render SourceBadge
  date: z.string().optional(),
  verified: z.boolean().optional(), // true → checked (no approx badge); else estimate
})

const linkSchema = z.object({
  label: z.string(),
  href: z.string().startsWith('/'), // internal only — no external/live links
})

const seriesSchema = z.object({ label: z.string(), values: z.array(z.number()) })
const sliceSchema = z.object({ label: z.string(), value: z.number() })

export const CHART_TYPES = ['line', 'bar', 'area', 'pie', 'donut'] as const
export const CALLOUT_TONES = ['info', 'warn', 'note'] as const

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), body: z.string() }),
  z.object({ type: z.literal('facts'), title: z.string().optional(), items: z.array(factSchema) }),
  z.object({
    type: z.literal('callout'),
    tone: z.enum(CALLOUT_TONES).default('info'),
    title: z.string().optional(),
    body: z.string(),
  }),
  z.object({ type: z.literal('list'), title: z.string().optional(), items: z.array(z.string()) }),
  z.object({ type: z.literal('links'), title: z.string().optional(), items: z.array(linkSchema) }),
  z.object({
    type: z.literal('image'),
    src: z
      .string()
      .refine((s) => !/^https?:\/\//i.test(s), 'content-relative path, not an external URL'),
    alt: z.string(),
    caption: z.string().optional(),
    credit: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  z.object({
    type: z.literal('chart'),
    chartType: z.enum(CHART_TYPES),
    title: z.string().optional(),
    unit: z.string().optional(),
    categories: z.array(z.string()).optional(), // line/bar/area
    series: z.array(seriesSchema).optional(), // line/bar/area
    slices: z.array(sliceSchema).optional(), // pie/donut
    source: z.string().optional(),
    date: z.string().optional(),
    verified: z.boolean().optional(),
    note: z.string().optional(),
  }),
])

const createdBySchema = z.object({
  kind: z.enum(['ai', 'human']),
  name: z.string().optional(),
  at: z.string().optional(),
})
const verifiedBySchema = z.object({ name: z.string(), at: z.string().optional() })

export const contentDocSchema = z
  .object({
    schemaVersion: z.number().default(1),
    title: z.string(),
    kicker: z.string().optional(),
    blocks: z.array(blockSchema),
    meta: z
      .object({
        lastReviewed: z.string().optional(),
        createdBy: createdBySchema.optional(),
        verifiedBy: verifiedBySchema.optional(), // absent → "not yet human-reviewed"
      })
      .optional(),
  })
  // Per-chartType shape (member-level .refine isn't allowed on a discriminated union in zod 4):
  // categorical charts need categories + series; proportional charts need slices.
  .superRefine((doc, ctx) => {
    doc.blocks.forEach((b, i) => {
      if (b.type !== 'chart') return
      const categorical = b.chartType === 'line' || b.chartType === 'bar' || b.chartType === 'area'
      if (categorical && (!b.categories?.length || !b.series?.length)) {
        ctx.addIssue({
          code: 'custom',
          path: ['blocks', i],
          message: `${b.chartType} chart needs categories + series`,
        })
      }
      if ((b.chartType === 'pie' || b.chartType === 'donut') && !b.slices?.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['blocks', i],
          message: `${b.chartType} chart needs slices`,
        })
      }
    })
  })

export const contentIndexSchema = z.array(z.string())

export type Fact = z.infer<typeof factSchema>
export type Block = z.infer<typeof blockSchema>
export type ChartType = (typeof CHART_TYPES)[number]
export type ContentDoc = z.infer<typeof contentDocSchema>
