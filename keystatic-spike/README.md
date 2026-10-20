# Keystatic spike (#106)

Throwaway test that Keystatic works for "Know more" docs. Not deployed.
The real site is built in manikumarkv/gnanodayam#112.

```bash
cd keystatic-spike
pnpm install
pnpm build && pnpm start      # http://localhost:3100
```

- Editor: http://localhost:3100/keystatic (local mode, saves to `content/know-more/`)
- JSON: http://localhost:3100/api/know-more/btech
- GitHub mode: set `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` (needs a GitHub App, not tested yet)

Files:

- `keystatic.config.ts`: the `knowMore` collection with all 7 block types
- `lib/to-content-doc.ts`: converts Keystatic's shape to the app's content-doc shape
- `app/api/know-more/[key]/route.ts`: the JSON endpoint (404 for drafts, CORS, cache headers)
- `lib/content.schema.ts`: copy of the app's zod schema, used to check the output
