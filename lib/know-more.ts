import { createReader } from '@keystatic/core/reader'
import keystaticConfig from '../keystatic.config'
import { contentDocSchema, type ContentDoc } from './content.schema'
import { clean, toContentDoc } from './to-content-doc'

/** Reads "Know more" docs from the repo's files (bundled into each deploy). */
const reader = createReader(process.cwd(), keystaticConfig)

/** Keys of every published doc, sorted. */
export async function listPublishedKeys(): Promise<string[]> {
  const all = await reader.collections.knowMore.all()
  return all
    .filter((e) => e.entry.status === 'published')
    .map((e) => e.slug)
    .sort()
}

/**
 * A published doc in the app's shape, checked against the app's schema. null for unknown keys and
 * drafts. Throws if a doc doesn't pass the schema (so a bad doc fails the build, not the student).
 */
export async function readPublishedDoc(key: string): Promise<ContentDoc | null> {
  const entry = await reader.collections.knowMore.read(key)
  if (!entry || entry.status !== 'published') return null
  const doc = clean(toContentDoc(entry))
  const checked = contentDocSchema.safeParse(doc)
  if (!checked.success) {
    throw new Error(`know-more/${key} fails the content schema: ${checked.error.message}`)
  }
  return doc
}
