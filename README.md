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

This will overwrite `data/resources.ts` using rows where `Published` is checked, write
`RESOURCE_DATA_VERSION` at the end of the file, then sync the AI Search index and check it
(see below). The command exits with a non-zero code when the index differs from the data.

Every published row needs an `ID` matching `^[A-Za-z0-9-]{1,64}$`; an empty or invalid ID
stops the sync and leaves `data/resources.ts` unchanged. Fill in `ID` once when a resource
is created and never change it afterwards; never reuse the ID of a deleted resource.

`npm run build` runs `scripts/check-data-version.ts` first and fails when
`RESOURCE_DATA_VERSION` does not match the ids in `data/resources.ts`.

## Semantic Search (Cloudflare AI Search)

The home page search runs two passes: the existing in-browser literal match shows
results immediately, then `/api/search` (a Pages Function in `functions/api/search.ts`)
returns semantically related resource ids from the Cloudflare AI Search instance
`womencareercn`, which are appended to the list (`lib/resource-search.ts`,
`mergeSearchResults`).

If `/api/search` fails, the page keeps showing the literal results.

### Search logs

Each submitted search and each click on a result's website link is sent with
`navigator.sendBeacon` to `/api/log` (`functions/api/log.ts`), which writes to a D1 database
(tables in `migrations/0001_search_logs.sql`, rows kept for 90 days). The database lives in the
same Cloudflare account as the AI Search instance and is written through the Cloudflare API
(`lib/d1-http.ts`), so search and logs share one account id and one token. To create the
database and tables in that account (safe to re-run):

```bash
npx tsx scripts/setup-search-logs.ts   # prints CF_D1_DATABASE_ID
```

### Pages project variables (production and preview)

Settings → Variables and Secrets:

- `CF_ACCOUNT_ID` — Cloudflare account that owns the AI Search instance and the log database
- `CF_AI_SEARCH_INSTANCE` — `womencareercn`
- `CF_D1_DATABASE_ID` — id printed by `scripts/setup-search-logs.ts`
- `CF_API_TOKEN` — API token with AI Search read and D1 edit access (mark as encrypted)

Moving search to another Cloudflare account: create the AI Search instance there, run
`npm run sync:search` and `scripts/setup-search-logs.ts` with that account's credentials,
then update these four variables. Old log rows can be copied with `wrangler d1 export` /
`wrangler d1 execute --file`.

Functions are deployed with git integration or `wrangler pages deploy`; direct upload
from the dashboard does not include Functions.

### Keeping the index in sync

Add to `.env.local` (never committed):

```bash
CF_ACCOUNT_ID=...
CF_AI_SEARCH_INSTANCE=womencareercn
CF_API_TOKEN=...   # AI Search edit access; D1 edit access for scripts/setup-search-logs.ts
```

`npm run sync:notion` runs both of these after writing `data/resources.ts`:

```bash
npm run sync:search    # upload changed resources, delete removed ones, wait for indexing
npm run check:search   # report drift only; exit code 1 when the index differs from data/resources.ts
```

### Evaluating and testing search

```bash
npm run eval:search                              # offline metrics against search-eval/queries.json
npm run eval:search -- --judgments <file>        # graded labels (0/1/2), rules in search-eval/labeling-guide.md
npx tsx scripts/search-stability.ts --query 实习  # same query repeated, checks result stability
npx tsx scripts/ai-search-instance.ts show       # instance config / items / reindex
npm run dev:pages                                # npm run build + wrangler pages dev out (reads .dev.vars)
npx tsx scripts/search-e2e.ts                    # browser test against the local Pages server
npx tsx scripts/merge-check.ts                   # unknown semantic ids do not raise the merge cutoff
node scripts/notion-id-check.mjs                 # normalizePage rejects empty or invalid IDs
```
