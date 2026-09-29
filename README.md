# womencareer.cn

## Notion Sync

This project supports local sync from a Notion database into `data/resources.ts`.

### 1. Create `.env.local`

Use the following variables:

```bash
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=your_notion_database_id
```

### 2. Required Notion columns

Create these properties in your Notion database:

- `Name` (title)
- `ID` (rich text)
- `Slug` (rich text)
- `Short Description` (rich text)
- `Category` (select)
- `Tags` (multi-select)
- `Region` (select)
- `Type` (rich text)
- `Language` (multi-select)
- `Cost` (select)
- `Status` (select)
- `Official URL` (url)
- `Featured` (checkbox)
- `Published` (checkbox)

### 3. Sync

```bash
npm run sync:notion
```

This will overwrite `data/resources.ts` using rows where `Published` is checked.

## Semantic Search (Cloudflare AI Search)

The home page search runs two passes: the existing in-browser literal match shows
results immediately, then `/api/search` (a Pages Function in `functions/api/search.ts`)
returns semantically related resource ids from the Cloudflare AI Search instance
`womencareercn`, which are appended to the list (`lib/resource-search.ts`,
`mergeSearchResults`).

### Pages project variables (production and preview)

Settings → Variables and Secrets:

- `CF_ACCOUNT_ID` — Cloudflare account that owns the AI Search instance
- `CF_AI_SEARCH_INSTANCE` — `womencareercn`
- `CF_AI_SEARCH_TOKEN` — API token with AI Search read access (mark as encrypted)

Functions are deployed with git integration or `wrangler pages deploy`; direct upload
from the dashboard does not include Functions.

### Keeping the index in sync

Add to `.env.local` (never committed):

```bash
CF_ACCOUNT_ID=...
CF_AI_SEARCH_INSTANCE=womencareercn
CF_API_TOKEN=...   # AI Search edit access
```

After every `npm run sync:notion`:

```bash
npm run sync:search    # upload changed resources, delete removed ones, wait for indexing
npm run check:search   # report drift only; exit code 1 when the index differs from data/resources.ts
```

### Evaluating and testing search

```bash
npm run eval:search                              # offline metrics against search-eval/queries.json
npx tsx scripts/search-stability.ts --query 实习  # same query repeated, checks result stability
npx tsx scripts/ai-search-instance.ts show       # instance config / items / reindex
npm run dev:pages                                # next build + wrangler pages dev out (reads .dev.vars)
npx tsx scripts/search-e2e.ts                    # browser test against the local Pages server
```
