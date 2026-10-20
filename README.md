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

건강기능식품의 **제품명** 검색은 검색 버튼을 누를 때 식품안전나라 최신 목록을 조회합니다. 한글 조건으로 후보를 좁힌 뒤 공백을 무시한 AND/OR/NOT 검색식을 적용합니다. 별도의 **업체명** 입력창은 부분 일치 조건이며 검색식과 함께 적용됩니다.

**품목 총 유형**, **제품명 + 품목 총 유형** 검색은 식품안전나라 **I0030(건강기능식품 품목제조 신고사항 현황)** 공식 API의 전체 신고자료를 사용합니다. 대표 유형은 `PRDLST_CDNM`, 전체 유형은 `RAWMTRL_NM`(품목유형·기능지표성분)으로 구분합니다. 실제 더파르마 마그네슘락테이트 플러스디정(200700170352158)의 공식 공개 샘플에서도 각각 마그네슘 / 마그네슘, 비타민 D로 확인했습니다. API 자료의 범위·반영 시점은 웹 검색 목록과 다를 수 있으며, 생산종료로 제공된 제품은 별도로 표시합니다. API에서 제공하지 않는 내수/수출 값은 추측하지 않습니다.

전체 유형 검색 결과에는 자료 갱신 시각과 저장된 전체 유형을 바로 표시합니다. **상세** 버튼은 품목보고번호로 공식 API를 실시간 조회해 기능성 원재료·기준규격 등의 정보를 보여줍니다. 제품명 실시간 검색에서 나온 제품은 기존 웹 상세 조회를 사용합니다. 웹 접근 제한이 감지되면 조회를 중단합니다. 반복 웹 상세 조회로 전수 자료를 구축하던 방식은 제거했습니다.

공식 API 인증키 준비:

1. [I0030 서비스](https://www.foodsafetykorea.go.kr/api/openApiInfo.do?svc_no=I0030)에서 인증키 발급 및 해당 서비스 이용신청을 완료합니다.
2. [GitHub Actions 비밀값](https://github.com/charmacist117/NutritionSupplement/settings/secrets/actions)에 `FOODSAFETY_API_KEY`를 등록합니다. 전수 수집에 사용하며 공개 sample 키로 대량 수집하지 않습니다.
3. Vercel의 같은 이름 환경변수를 Production에 등록하고 재배포합니다. 실시간 공식 API 상세 조회에 사용합니다. 키를 브라우저 코드나 Git에 넣지 않습니다.
4. GitHub Actions의 **건강기능식품 전체 유형 갱신** 작업을 실행합니다. 이후 매일 한국시간 04:17에 갱신합니다.

자동 수집은 공식 API에서 한 번에 최대 1,000개를 순차 조회하고 요청 사이에 1초 간격을 둡니다. 전체 건수·페이지 누락·ID 중복·전체 유형 필드 검증을 통과한 완성본만 GitHub Release의 `product-type-catalog`에 게시합니다. 실패 시 이전 완성본을 유지합니다. 인증키가 없으면 원본 호출 전에 중단하며, 초기 완성본이 없으면 검색 API는 503으로 준비되지 않았음을 알립니다. 미수집 제품을 0건 검색으로 표시하지 않습니다. 검색 서버는 완성본을 10분간 캐시합니다.

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
- `GET /api/health-products?q=검색식&company=업체명&target=name|types|all&page=1&includeExport=true`: 제품 검색 (`types`는 상세표 전체 유형, 기존 `ingredients`도 같은 검색으로 호환)
- `GET /api/health-products?id=제품ID`: 웹 검색 결과의 상세 원료 실시간 조회
- `GET /api/health-products?report=품목보고번호`: 공식 API 상세 실시간 조회
- `GET /api/health-products?ids=제품ID1,제품ID2`: 현재 페이지 최대 20개 제품의 상세표 유형 전체 조회
