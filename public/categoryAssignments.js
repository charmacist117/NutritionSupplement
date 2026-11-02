export const MAX_CATEGORY_ASSIGNMENTS = 5;

export function normalizeAssignedCategories(categories = []) {
  const result = [];
  const key = (value) => value.toLowerCase().replace(/\s+/g, "");
  for (const value of categories) {
    const category = String(value || "").trim();
    if (!category || result.some((item) => key(item) === key(category))) continue;
    result.push(category);
    if (result.length === MAX_CATEGORY_ASSIGNMENTS) break;
  }
  return result;
}

export function categoryMappingRecord(keyword, categories) {
  const normalized = normalizeAssignedCategories(categories);
  return {
    keyword,
    category: normalized[0] || "",
    ...(normalized[1] ? { secondaryCategory: normalized[1] } : {}),
    categories: normalized
  };
}
