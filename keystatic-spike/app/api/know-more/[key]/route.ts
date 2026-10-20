import { createReader } from '@keystatic/core/reader'
import config from '../../../../keystatic.config'
import { toContentDoc } from '../../../../lib/to-content-doc'

const reader = createReader(process.cwd(), config)
const ALLOWED = [/^https:\/\/(www\.)?gnanodayam\.com$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost:\d+$/]

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  return ALLOWED.some((r) => r.test(origin)) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}
}

export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const entry = await reader.collections.knowMore.read(key, { resolveLinkedFiles: true })
  if (!entry || entry.status !== 'published') {
    return Response.json({ error: 'not found' }, { status: 404, headers: cors(req) })
  }
  return Response.json(toContentDoc(entry), {
    headers: { ...cors(req), 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' },
  })
}
