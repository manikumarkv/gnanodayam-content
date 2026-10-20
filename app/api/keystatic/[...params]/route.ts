import { makeRouteHandler } from '@keystatic/next/route-handler'
import config from '../../../../keystatic.config'

// Built lazily: in GitHub mode Keystatic requires its GitHub App secrets, and those only exist in
// the deployed environment — not in CI builds.
let handler: ReturnType<typeof makeRouteHandler> | undefined
const keystatic = () => (handler ??= makeRouteHandler({ config }))

export const dynamic = 'force-dynamic'
export const GET = (req: Request) => keystatic().GET(req)
export const POST = (req: Request) => keystatic().POST(req)
