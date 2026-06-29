# NutritionSupplement

Nutrition supplement research system with a Naver DataLab Shopping Insight integration.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in `NAVER_CLIENT_ID` and `NAVER_CLIENT_SECRET` from Naver Developers.
3. Start the server.

```powershell
& "C:\Users\charmacist\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" src/server.js
```

Open `http://localhost:3010`.

## Monthly Collection

The monthly job runs on the first day of each month and collects the previous month.

```powershell
& "C:\Users\charmacist\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts/collectMonthly.js
```

Pipeline:

1. Fetch Food > Health Food popular keywords Top 500.
2. Pick the anchor keyword from Top 1-5 by the highest daily ratio during the month.
3. Query the anchor plus four comparison keywords at a time.
4. Store each keyword's arithmetic average of daily ratio values.

Set `NAVER_HEALTH_FOOD_CATEGORY_ID` to the exact Naver Shopping category ID for `식품 > 건강식품`.

On Vercel, configure these environment variables:

- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `NAVER_HEALTH_FOOD_CATEGORY_ID`
- `CRON_SECRET`

`vercel.json` schedules `/api/collect-monthly` monthly. Vercel functions do not provide persistent file storage, so production monthly history should be written to a database or Vercel Blob in the next step.

## API

### `POST /api/shopping/keywords`

Fetches relative shopping search-click trend ratios from Naver Shopping Insight.

```json
{
  "startDate": "2026-05-01",
  "endDate": "2026-06-01",
  "timeUnit": "week",
  "category": "50000023",
  "keywords": ["마그네슘", "오메가3"],
  "device": "",
  "gender": "",
  "ages": []
}
```

Naver returns relative `ratio` values, not absolute search volume.
