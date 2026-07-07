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
