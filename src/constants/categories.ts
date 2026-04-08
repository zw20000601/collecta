export const DEFAULT_CATEGORY_NAME = '全部资源'

const LEGACY_DEFAULT_CATEGORY_NAMES = new Set([
  '',
  'all',
  'uncategorized',
  '未分类',
  DEFAULT_CATEGORY_NAME,
])

function normalizeCategoryName(name?: string | null) {
  return String(name || '').trim().toLowerCase()
}

export function isDefaultCategoryName(name?: string | null) {
  return LEGACY_DEFAULT_CATEGORY_NAMES.has(normalizeCategoryName(name))
}

export function displayCategoryName(name?: string | null) {
  if (isDefaultCategoryName(name)) return DEFAULT_CATEGORY_NAME
  return String(name || '').trim()
}

