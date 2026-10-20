# gnanodayam-content

The content site for [Gnanodayam](https://gnanodayam.com), live at
**https://contents.gnanodayam.com** (ADR 0008 in the app repo).

- **Editor:** `/keystatic` — forms for every "Know more" block (text, facts, callout, list, links,
  image, chart). Saves are git commits to this repo.
- **API:** `GET /api/know-more/<key>` — a published doc as JSON in the app's content-doc shape. The
  app fetches it when a student clicks "Know more". Drafts and unknown keys return 404.

```
content/know-more/<key>.json   ← one doc per key (written by Keystatic)
public/know-more/              ← uploaded images
keystatic.config.ts            ← the editor's fields
lib/to-content-doc.ts          ← Keystatic shape → the app's shape
lib/content.schema.ts          ← COPY of the app's schema — keep in sync
```

## Linking a doc to the app

A doc's **key** is its file name (e.g. `btech`). In the app's `/admin`, set the path node's (or
role's) **"Know more" key** to the same value. Don't rename a key once it's in use.

## Trust rules

Checked by `pnpm test` on every pull request:

- Every doc must pass the app's content schema.
- Every estimated figure has a **source** and an **as-of date**.
- Leave **"Checked by a person"** off for AI-drafted or unchecked figures — the app shows them as
  "approximate".
- Links are internal only (start with `/`).
- Fill **Reviewed by** when a person has checked the whole doc.

## Editing as an intern

1. Open https://contents.gnanodayam.com/keystatic and sign in with GitHub.
2. Create a branch from the branch picker (it starts with `content/`). Never edit on `main`.
3. Make your changes and **Save**. Each save is a commit on your branch.
4. Open a pull request into `main` (Keystatic has a "Create pull request" link). CI checks it.
5. Mani reviews and merges. Only `main` is live — the site redeploys in about a minute.

## Local development

```bash
nvm use            # Node 24
pnpm install
pnpm dev           # http://localhost:3000/keystatic — saves to local files in dev
pnpm test          # content checks
pnpm build
```

## One-time setup (owner)

1. **Vercel:** import this repo as a new project (framework: Next.js, root: `/`). Add the domain
   `contents.gnanodayam.com` and point a `CNAME` for `contents` at Vercel.
2. **Keystatic GitHub App:** open `/keystatic` on the deployed site and follow its setup to create the
   GitHub App. Copy `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`
   and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` into the Vercel project's environment variables and
   redeploy. Install the app on this repo only.
3. **Protect `main`** (GitHub → Settings → Branches): require a pull request and the `CI` check before
   merging. Leave "Allow administrators to bypass" on so your own Keystatic saves can go to `main`.
4. **Interns:** add them as collaborators with **Write** access (needed to create branches).

## Legacy folders (being removed)

`details/` and `paths/` are the old git-JSON content. The app stops reading them once it switches to
this site (gnanodayam #117), and they are deleted in gnanodayam #119.
