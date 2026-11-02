export function baseAutoProductCategoriesFor(keyword) {
  const normalizeText = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const kw = normalizeText(keyword);
  const candidates = [];
  const has = (term) => kw.includes(normalizeText(term));
  const any = (terms) => terms.some(has);

  if (has("오메가")) candidates.push("오메가3");
  if (has("마그네슘")) candidates.push("마그네슘");
  if (!any(["엘레나", "펨", "질", "구강"]) && any(["유산균", "락토핏", "프로바이오틱스", "드시모네", "자로우"])) candidates.push("유산균");
  if (any(["프리바이오틱스", "푸룬", "낙산균"])) candidates.push("장 건강");
  if (any(["비타민c", "압타민c"])) candidates.push("비타민c");
  if (any(["비타민d", "비타민k"])) candidates.push("비타민dk");
  if (any(["비타민", "비타", "오쏘몰", "센트룸"]) && !any(["비타민c", "압타민c", "비타민d", "비타민k"])) candidates.push("비타민 류");
  if (any(["이뮨", "아연", "베타글루칸"])) candidates.push("면역 건강");
  if (any(["콘드로이친", "msm", "난각막", "nem", "관절", "보스", "호관원", "옵티머스트", "우슬", "무브프리", "글루코사민"])) candidates.push("관절 건강");
  if (any(["멜라토닌", "수면"])) candidates.push("수면 건강");
  if (any(["루테인", "블루베리", "빌베리", "눈", "아스타잔틴"])) candidates.push("눈 건강");
  if (has("글루타치온")) candidates.push("미백");
  if (any(["nmn", "엔엠엔", "mnm"])) candidates.push("항노화");
  if (any(["프로폴리스", "커큐민", "퀘르세틴", "브로멜라인", "강황", "테라큐민", "울금"])) candidates.push("항염증");
  if (has("철분")) candidates.push("철분제");
  if (any(["비오틴", "케라넷", "맥주"])) candidates.push("모발 건강");
  if (has("효소")) candidates.push("효소식품");
  if (any(["코엔자임", "코큐텐"])) candidates.push("코엔자임Q10");
  if (any(["셀렌", "셀레늄"])) candidates.push("항산화");
  if (any(["정관장", "홍삼", "에브리타임", "산삼", "장뇌삼", "홍이장군", "인삼"])) candidates.push("삼(蔘) 류");
  if (any(["바나바", "뉴케어", "애사비"])) candidates.push("혈당");
  if (any(["알부민", "펩티드"])) candidates.push("단백질");
  if (any(["아르기닌", "마카", "쏘팔", "옥타", "전립", "장어", "카리토", "야관문"])) candidates.push("남성 건강");
  if (any(["밀크씨슬", "밀크시슬", "간"])) candidates.push("간 건강");
  if (any(["이노시톨", "엽산", "엘레나", "펨", "질"])) candidates.push("여성 건강");
  if (any(["노인", "노년", "시니어", "실버", "어르신"])) candidates.push("노인 건강");
  if (any(["도라지", "맥문동"])) candidates.push("호흡기 건강");
  if (has("홍국")) candidates.push("콜레스테롤");
  if (any(["폴리코사놀", "리놀렌산", "대마종자", "솔잎증류", "송침", "보라지", "콜레스테롤", "순환", "은행잎"])) candidates.push("혈행 건강");
  if (has("갱년기")) candidates.push("갱년기 건강");
  if (any(["매스틱", "감초"])) candidates.push("위 건강");
  if (any(["포스파티딜", "테아닌", "홍경천", "뇌"])) candidates.push("뇌 건강");
  if (has("꿀")) candidates.push("꿀");
  if (has("흑염소")) candidates.push("수족냉증");
  if (any(["베르베린", "bnr", "비에날", "비엔알", "알파cd"])) candidates.push("다이어트");
  if (any(["숙취", "벌나무"])) candidates.push("숙취해소");
  if (any(["칼마디", "mbp", "칼슘"])) candidates.push("뼈 건강");
  if (any(["침향환", "경옥고", "공진단", "공진당"])) candidates.push("피로회복");
  if (any(["삼백초", "노즈"])) candidates.push("코 건강");
  if (any(["구강", "덴티"])) candidates.push("구강 건강");
  return candidates.length ? [...new Set(candidates)] : ["기타"];
}

export function baseAutoProductCategoryFor(keyword) { return baseAutoProductCategoriesFor(keyword)[0]; }

export function mappingReview(manualCategories, suggestions) {
  if (manualCategories.length) return { priority: 3, label: "분류 완료", reason: "직접 지정한 카테고리가 있습니다.", needsReview: false };
  const candidates = [...new Set(suggestions.filter((category) => !["기타", "미지정"].includes(category)))];
  if (!candidates.length) return { priority: 0, label: "분류 필요", reason: "자동 규칙으로 제품군을 특정하지 못했습니다.", needsReview: true };
  if (candidates.length > 1) return { priority: 1, label: "복수 후보", reason: `자동 규칙에서 ${candidates.length}개 후보가 나옵니다. 적용할 카테고리를 확인해주세요.`, needsReview: true };
  return { priority: 2, label: "추천 확인", reason: "단일 자동 추천이 있으며 아직 직접 지정하지 않았습니다.", needsReview: false };
}

export function compareMappingPriority(a, b) {
  return a.review.priority - b.review.priority
    || String(b.latestEndDate || "").localeCompare(String(a.latestEndDate || ""))
    || Number(Boolean(b.appearanceType)) - Number(Boolean(a.appearanceType))
    || Number(a.latestRank || 9999) - Number(b.latestRank || 9999)
    || a.keyword.localeCompare(b.keyword, "ko");
}
