// Shared category buckets for Problem 10 ("organize products by category").
// The database's garment_type field is free text with a lot of near-duplicate
// variants (e.g. "short-sleeve t-shirt" vs "short-sleeve T-shirt" vs
// "heavyweight short-sleeve t-shirt") — grouping directly by garment_type
// would produce a dozen one-item sections instead of a few meaningful ones.
// These keyword buckets collapse that into a handful of categories a shopper
// actually thinks in, used by both the Products nav dropdown and the
// Products page's section headers so the two stay in sync.

export interface ProductCategory {
  key: string
  label: string
  test: (garmentTypeLower: string) => boolean
}

// Order matters: first matching bucket wins (e.g. a "full-zip hooded
// sweatshirt" is a Hoodie, not a Sweatshirt, so Hoodies is checked first).
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    key: 'hoodies',
    label: 'Hoodies',
    test: (g) => g.includes('hoodie') || g.includes('hooded'),
  },
  {
    key: 'jackets',
    label: 'Jackets & Fleece',
    test: (g) => g.includes('jacket') || g.includes('fleece'),
  },
  {
    key: 'tshirts',
    label: 'T-Shirts',
    test: (g) => g.includes('t-shirt') || g.includes('tee'),
  },
  {
    key: 'sweatshirts',
    label: 'Crewnecks & Sweatshirts',
    test: (g) => g.includes('sweatshirt') || g.includes('crewneck') || g.includes('pullover'),
  },
  {
    key: 'other',
    label: 'More Favorites',
    test: () => true,
  },
]

export function categoryFor(garmentType: string): ProductCategory {
  const g = garmentType.toLowerCase()
  return PRODUCT_CATEGORIES.find((c) => c.test(g)) ?? PRODUCT_CATEGORIES[PRODUCT_CATEGORIES.length - 1]
}

export function categoryLabel(key: string): string | undefined {
  return PRODUCT_CATEGORIES.find((c) => c.key === key)?.label
}

// A second, independent way to slice the catalogue: who/what a product is
// *for*, rather than what it physically is. Unlike the garment-type
// buckets above, a product is matched against every affiliation (so a
// "Yale Dad Hoodie" is both a Hoodie and a Family item) — there's no
// "first match wins" ordering here, since these aren't mutually exclusive
// in the way garment types are. Keywords are matched against the
// product's name + search_tags (not garment_type, which doesn't carry
// this information at all).
export interface AffiliationCategory {
  key: string
  label: string
  keywords: string[]
}

export const AFFILIATION_CATEGORIES: AffiliationCategory[] = [
  {
    key: 'family',
    label: 'Family',
    keywords: ['mom', 'dad', 'grandma', 'grandpa', 'aunt', 'uncle', 'brother', 'cousin', 'father', 'parent apparel'],
  },
  {
    key: 'sports',
    label: 'Sports',
    keywords: [
      'baseball', 'basketball', 'football', 'hockey', 'soccer', 'lacrosse', 'volleyball',
      'swimming', 'diving', 'golf', 'tennis', 'squash', 'fencing', 'sailing', 'track',
      'sports',
    ],
  },
  {
    key: 'professional-schools',
    label: 'Professional Schools',
    keywords: [
      'law school', 'school of management', 'school of medicine', 'medical school',
      'divinity school', 'school of architecture', 'school of art', 'school of engineering',
      'school of music', 'school of nursing', 'school of public health',
    ],
  },
  {
    key: 'residential-colleges',
    label: 'Residential Colleges',
    keywords: [
      'benjamin franklin', 'berkeley', 'branford', 'davenport', 'ezra stiles', 'grace hopper',
      'jonathan edwards', 'morse', 'pauli murray', 'pierson', 'saybrook', 'silliman',
      'timothy dwight', 'trumbull',
    ],
  },
]

// Plain substring matching produced a real false positive here: the
// keyword "brother" (for Family) matched inside "Brooks Brothers" (a
// brand name in several product names/tags), which has nothing to do
// with family gifting. Single-word keywords are matched on word
// boundaries instead so "brother" can't match inside "brothers"; a
// multi-word phrase like "school of management" is specific enough that
// plain substring matching is safe.
function keywordMatches(blob: string, keyword: string): boolean {
  if (keyword.includes(' ')) return blob.includes(keyword)
  return new RegExp(`\\b${keyword}\\b`).test(blob)
}

export function productAffiliationKeys(product: { name: string; search_tags?: string[] }): string[] {
  const blob = [product.name, ...(product.search_tags ?? [])].join(' ').toLowerCase()
  return AFFILIATION_CATEGORIES.filter((c) => c.keywords.some((k) => keywordMatches(blob, k))).map((c) => c.key)
}

export function affiliationLabel(key: string): string | undefined {
  return AFFILIATION_CATEGORIES.find((c) => c.key === key)?.label
}

export function isAffiliationKey(key: string): boolean {
  return AFFILIATION_CATEGORIES.some((c) => c.key === key)
}
