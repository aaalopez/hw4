import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchProducts, type Product, type ProductSummary } from '../api/client'
import { useSearchResults } from '../search/SearchResultsContext'
import {
  PRODUCT_CATEGORIES,
  categoryFor,
  categoryLabel,
  isAffiliationKey,
  affiliationLabel,
  productAffiliationKeys,
} from '../categories'
import './Products.css'

// Problem 7: this page has two modes.
//   - Normal browse: fetches the full catalogue from GET /api/products.
//   - Chat search: when the shop assistant returns product matches for a
//     category/browse question ("what hoodies do you have?"), ChatWidget
//     stores them in SearchResultsContext and navigates here. This page
//     then renders *those* matches instead of the full catalogue, until
//     the shopper clears the search or a new chat search replaces it.
// Either way, every card is the same shape (ProductSummary) and the same
// <Link to={`/products/${id}`}>, so the single-item detail page from
// Problem 3 works identically no matter where the card came from.
//
// Problem 10 adds a third dimension on top of that: normal browse is now
// grouped into category sections (see ../categories.ts) instead of one
// long flat grid, and the nav bar's Products dropdown can jump straight to
// one category via a `?category=` param — which, like a chat search,
// narrows the page down to a single flat grid of just that category.
type SortOrder = 'default' | 'price-asc' | 'price-desc'

function ProductGrid({ items }: { items: ProductSummary[] }) {
  return (
    <div className="products__grid">
      {items.map((p) => (
        <Link key={p.product_id} to={`/products/${p.product_id}`} className="product-card">
          <div className="product-card__image-wrap">
            <img src={p.image_url} alt={p.name} className="product-card__image" />
            {!p.in_stock && <span className="product-card__sold-out-stamp">Sold Out</span>}
          </div>
          <div className="product-card__body">
            <h3>{p.name}</h3>
            <p className="product-card__description">{p.garment_type}</p>
            <div className="product-card__footer">
              <span className="product-card__price">${p.price.toFixed(2)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function Products() {
  const { activeSearch, clearActiveSearch } = useSearchResults()
  const [searchParams, setSearchParams] = useSearchParams()
  // Full Product[] (not the lighter ProductSummary) so affiliation
  // filtering below can read search_tags, which chat-search results
  // (ProductSummary/ProductCard) don't carry.
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  // Usability improvement (Problem 9, front-end #2): a sort control. With
  // 102 products in the catalogue, browsing the full grid (or even a chat
  // search with a dozen results) was previously unsorted — a shopper
  // comparing prices had no way to do that without scanning every card.
  // Sold-out items stay in the grid rather than being filtered out (see
  // ProductGrid's "Sold Out" image stamp) — a shopper can still see and
  // click into something that's out of stock right now.
  const [sortOrder, setSortOrder] = useState<SortOrder>('default')

  useEffect(() => {
    let cancelled = false
    fetchProducts()
      .then((data) => {
        if (!cancelled) {
          setAllProducts(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isSearchMode = activeSearch !== null
  const categoryKey = !isSearchMode ? searchParams.get('category') : null
  const baseItems = isSearchMode ? activeSearch.products : allProducts

  const items = baseItems.slice().sort((a, b) => {
    if (sortOrder === 'price-asc') return a.price - b.price
    if (sortOrder === 'price-desc') return b.price - a.price
    return 0
  })

  if (!isSearchMode && status === 'loading') {
    return <p className="products__status">Loading products…</p>
  }

  if (!isSearchMode && status === 'error') {
    return (
      <p className="products__status products__status--error">
        Couldn't load products. Is the backend running? (uvicorn main:app --reload --port
        8000, from inside backend/)
      </p>
    )
  }

  const sortFilterControls = (
    <div className="products__controls">
      <label className="products__control">
        Sort by{' '}
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
          <option value="default">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
    </div>
  )

  // Chat search mode (Problem 7) — flat grid of whatever the agent matched.
  if (isSearchMode) {
    return (
      <div className="products">
        <div className="products__header">
          <h1>Chat Search Results</h1>
          <div className="products__search-banner">
            <span>
              Showing {activeSearch.products.length} result
              {activeSearch.products.length === 1 ? '' : 's'} for "{activeSearch.query}"
            </span>
            <button onClick={clearActiveSearch} className="products__clear-search">
              Clear search
            </button>
          </div>
        </div>
        {sortFilterControls}
        {baseItems.length === 0 ? (
          <p className="products__status">No matches — try asking the chat assistant something else.</p>
        ) : (
          <ProductGrid items={items} />
        )}
      </div>
    )
  }

  // One category selected from the nav dropdown — flat grid, same as a
  // chat search, just sourced from a click instead of a chat message.
  // Reads straight from `allProducts` (always the full Product[], with
  // search_tags) rather than the shared `items`, because this is the one
  // branch that also has to handle affiliation categories (family,
  // sports, professional schools, residential colleges), which match
  // against name/tags rather than garment_type.
  if (categoryKey) {
    const matches = isAffiliationKey(categoryKey)
      ? allProducts.filter((p) => productAffiliationKeys(p).includes(categoryKey))
      : allProducts.filter((p) => categoryFor(p.garment_type).key === categoryKey)
    const filtered = matches.slice().sort((a, b) => {
      if (sortOrder === 'price-asc') return a.price - b.price
      if (sortOrder === 'price-desc') return b.price - a.price
      return 0
    })
    const label = categoryLabel(categoryKey) ?? affiliationLabel(categoryKey) ?? 'Products'
    return (
      <div className="products">
        <div className="products__header">
          <h1>{label}</h1>
          <div className="products__search-banner">
            <span>Browsing {label}</span>
            <button onClick={() => setSearchParams({})} className="products__clear-search">
              View all categories
            </button>
          </div>
        </div>
        {sortFilterControls}
        {filtered.length === 0 ? (
          <p className="products__status">No products found in this category.</p>
        ) : (
          <ProductGrid items={filtered} />
        )}
      </div>
    )
  }

  // Default browse — grouped into category sections instead of one long
  // flat grid (Problem 10: "organize products by category").
  return (
    <div className="products">
      <div className="products__header">
        <h1>Shop All Products</h1>
      </div>
      {sortFilterControls}
      {items.length === 0 ? (
        <p className="products__status">No products found.</p>
      ) : (
        PRODUCT_CATEGORIES.map((cat) => {
          const group = items.filter((p) => categoryFor(p.garment_type).key === cat.key)
          if (group.length === 0) return null
          return (
            <section key={cat.key} className="products__category-section">
              <h2 className="products__category-heading">{cat.label}</h2>
              <ProductGrid items={group} />
            </section>
          )
        })
      )}
    </div>
  )
}
