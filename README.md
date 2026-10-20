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
- `NAVER_CLIENT_PROFILE_1`: 키가 속한 프로필 코드. 예: `personal`, `corporate`
- `NAVER_CLIENT_PROVIDER_1`: 기존 개발자센터 키는 `developers`, NAVER API HUB 키는 `api-hub`
- `NAVER_CLIENT_PROFILE_LABEL_1`: 설정 화면에 표시할 프로필 이름. 예: `개인 계정`
- `NAVER_CLIENT_NAME_1`: 설정 화면에 표시할 키 이름. 예: `개인 키 1`
- `NAVER_ACTIVE_PROFILE`: Blob에 저장된 선택값이 없을 때 사용할 기본 프로필 코드
- `NAVER_CLIENTS_JSON`: 여러 키를 JSON 한 줄로 넣고 싶을 때 사용. 예: `[{"clientId":"...","clientSecret":"..."},{"clientId":"...","clientSecret":"..."}]`
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 연결 시 자동 생성되는 저장소 토큰
- `CRON_SECRET`: 수동 관리 API 보호용 선택값
- `CHROME_EXECUTABLE_PATH`: 로컬에서 브라우저 수집기를 직접 돌릴 때만 필요

건강기능식품 검색은 **검색 버튼을 눌렀을 때** 식품안전나라에 접속합니다. 제품명 검색식에서 반드시 포함되어야 하는 한글 조건이나 업체명 조건으로 원본 후보를 먼저 좁히고, 후보에 전체 검색식을 적용합니다. ‘더파르마’ 검색에 ‘더 파르마’도 포함되도록 공백 무시 검색과 AND/OR/NOT의 결과 범위를 유지합니다. 안전하게 좁힐 조건이 없으면 공백 포함·미포함 목록을 조회합니다. 원본 요청은 2,000건 단위로 나누고 건수·ID 중복을 검증하므로, 한 번에 4만여 건을 받다가 시간 초과되는 요청을 피합니다. 사전 수집이나 Blob 저장소가 필요하지 않습니다. 목록 표시 후 현재 페이지의 모든 제품 상세표를 조회해 **품목유형** 옆의 **품목 총 유형**에 ‘유형’ 전체를 표시합니다. 제품의 **상세** 버튼을 누를 때도 원본 상세 페이지를 새로 조회합니다. 원본 사이트의 응답 시간에 따라 검색에 시간이 걸릴 수 있습니다. 상세 유형 조회 실패는 `조회 실패`, 원본에 유형이 없는 경우는 `원문 미기재`로 구분하며 대표 품목유형으로 대체하지 않습니다.

검색 대상은 **제품명**, **품목유형**, **제품명 + 품목유형**입니다. AND/OR/NOT 검색식과 수출용 포함 여부를 지원합니다. 별도의 **업체명** 입력창은 부분 일치 검색이며, 검색식과 업체명을 함께 입력하면 두 조건을 모두 적용합니다. 업체명만으로도 검색할 수 있습니다. 품목유형 검색은 원본 목록의 대표 분류 기준이며, 품목 총 유형 전체를 대상으로 한 검색은 아닙니다. 전체 원료 표는 상세 화면에서 확인합니다. 이전에 저장된 자료는 보존하지만 실시간 검색에는 사용하지 않습니다. 제품 목록의 일일 자동 갱신은 제거했습니다.

네이버 API 키는 `NAVER_CLIENTS_JSON`, 번호형 변수, 기존 단일 변수 순서로 읽고 중복은 제거합니다. 한 키가 `Query limit exceeded`를 반환하면 같은 요청을 다음 키로 이어서 시도합니다.
같은 프로필 코드를 가진 키는 하나의 계정 묶음으로 표시됩니다. 환경설정 탭에서 활성 프로필을 저장하면 다음 수집부터 해당 프로필의 키만 사용하며, Client Secret은 브라우저나 Blob에 저장하지 않습니다.
`api-hub` 키는 NAVER API HUB의 쇼핑인사이트 키워드 조회 주소와 `X-NCP-APIGW-API-KEY-ID`/`X-NCP-APIGW-API-KEY` 헤더로 자동 호출됩니다.

## Vercel

`vercel.json`이 `/api/collect-monthly`를 매월 1일 00:00 UTC, 한국시간 09:00에 실행하도록 설정합니다. 화면에서는 원하는 시작일/종료일을 직접 선택해 기간별로 수집할 수도 있습니다.

Vercel에는 Blob 저장소를 연결해야 기간별 리포트가 배포 환경에 지속 저장됩니다.

## 경영진 PDF 보고서

`기간별 비교` 탭에서 첫 번째 기준 구간과 두 번째 비교 구간을 각각 선택해 경영진용 PDF를 생성할 수 있습니다. 기본값은 최신 저장 자료와 바로 이전 저장 자료입니다.

- 여러 월을 한 구간으로 선택하면 월별 검색 순위를 평균하고, 미등장 월은 501위로 반영한 뒤 구간별 TOP 500을 다시 산정합니다.
- 핵심 요약, TOP 20, 카테고리별 TOP 100·TOP 500 변화, 급등락, 신규 TOP 100, 전략적 검토 사항을 7쪽 A4 보고서로 구성합니다.
- 기간 간 상대 클릭 점수는 비교에 사용하지 않습니다.

## 주요 API

- `GET /api/monthly-reports`: 저장된 기간 목록
- `GET /api/monthly-report?month=YYYY-MM 또는 YYYY-MM-DD_YYYY-MM-DD`: 특정 기간 리포트
- `GET /api/health`: 배포 설정 상태
- `POST /api/collect-monthly`: 선택 기간 리포트 수집 및 저장
- `POST /api/executive-report`: 선택한 두 구간의 순위 기반 경영진 PDF 생성
- `GET /api/health-products?q=검색식&company=업체명&target=name|ingredients|all&page=1&includeExport=true`: 최신 제품 목록 검색 (`ingredients`는 대표 품목유형)
- `GET /api/health-products?id=제품ID`: 제품 상세 원료 실시간 조회
- `GET /api/health-products?ids=제품ID1,제품ID2`: 현재 페이지 최대 20개 제품의 상세표 유형 전체 조회
