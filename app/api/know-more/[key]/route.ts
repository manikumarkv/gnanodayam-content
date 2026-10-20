import { listPublishedKeys, readPublishedDoc } from '@/lib/know-more'

/**
 * GET /api/know-more/<key> → the doc as JSON in the app's content-doc shape (ADR 0008).
 * Built as static files at deploy time (every Keystatic save is a commit, which redeploys), so
 * reads are CDN-fast. Unknown keys and drafts are 404. CORS and cache headers: next.config.ts.
 */
export const dynamic = 'force-static'
export const dynamicParams = false

export async function generateStaticParams() {
  return (await listPublishedKeys()).map((key) => ({ key }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const doc = await readPublishedDoc(key)
  if (!doc) return Response.json({ error: 'not found' }, { status: 404 })
  return Response.json(doc)
}
