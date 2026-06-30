# NutritionSupplement

네이버 쇼핑인사이트의 `식품 > 건강식품` 인기검색어를 선택 기간별로 수집하고, 검색어 통계 클릭량 점수를 비교해 리포트로 보여주는 Vercel 앱입니다.

사용자는 쇼핑 카테고리 코드를 알 필요가 없습니다. 시스템 내부에서 `식품 > 건강식품` 카테고리를 고정으로 사용합니다.

## 동작 흐름

1. 화면에서 시작일과 종료일을 선택합니다. 기본값은 직전월 1일~말일입니다.
2. 쇼핑인사이트 분야 통계의 `건강식품 인기검색어 Top 500`을 선택 기간 기준으로 자동으로 읽습니다.
3. Top 1-5 검색어 중 해당 기간 일일 점수 최고값이 가장 큰 검색어를 기준 키워드로 선택합니다.
4. 검색어 통계 API에서 `기준 키워드 + 비교 키워드 4개`씩 조회합니다.
5. 각 키워드의 기간 내 일일 클릭량 점수 산술평균을 계산합니다.
6. 기간별 JSON/CSV 리포트를 저장하고 Vercel 페이지에서 저장된 기간을 누르면 바로 표시합니다.

## 로컬 실행

```powershell
& "C:\Users\charmacist\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" src/server.js
```

브라우저에서 `http://localhost:3010`을 엽니다.

## 환경변수

- `NAVER_CLIENT_ID`: 네이버 개발자센터 Client ID
- `NAVER_CLIENT_SECRET`: 네이버 개발자센터 Client Secret
- `NAVER_CLIENT_ID_1`, `NAVER_CLIENT_SECRET_1`: 여러 네이버 Open API 키를 쓸 때 1번 키
- `NAVER_CLIENT_ID_2`, `NAVER_CLIENT_SECRET_2`: 여러 네이버 Open API 키를 쓸 때 2번 키. 같은 방식으로 `_20`까지 등록 가능
- `NAVER_CLIENTS_JSON`: 여러 키를 JSON 한 줄로 넣고 싶을 때 사용. 예: `[{"clientId":"...","clientSecret":"..."},{"clientId":"...","clientSecret":"..."}]`
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 연결 시 자동 생성되는 저장소 토큰
- `CRON_SECRET`: 수동 수집 API 보호용 선택값
- `CHROME_EXECUTABLE_PATH`: 로컬에서 브라우저 수집기를 직접 돌릴 때만 필요

네이버 API 키는 `NAVER_CLIENTS_JSON`, 번호형 변수, 기존 단일 변수 순서로 읽고 중복은 제거합니다. 한 키가 `Query limit exceeded`를 반환하면 같은 요청을 다음 키로 이어서 시도합니다.

## Vercel

`vercel.json`이 `/api/collect-monthly`를 매월 1일 00:00 UTC, 한국시간 09:00에 실행하도록 설정합니다. 화면에서는 원하는 시작일/종료일을 직접 선택해 기간별로 수집할 수도 있습니다.

Vercel에는 Blob 저장소를 연결해야 기간별 리포트가 배포 환경에 지속 저장됩니다.

## 주요 API

- `GET /api/monthly-reports`: 저장된 기간 목록
- `GET /api/monthly-report?month=YYYY-MM 또는 YYYY-MM-DD_YYYY-MM-DD`: 특정 기간 리포트
- `GET /api/health`: 배포 설정 상태
- `POST /api/collect-monthly`: 선택 기간 리포트 수집 및 저장
