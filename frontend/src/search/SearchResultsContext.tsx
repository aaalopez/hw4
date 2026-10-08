import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ProductSummary } from '../api/client'

/**
 * The frontend half of the Problem 7 API contract: when the chat agent
 * returns structured product matches (ChatReply.products), ChatWidget
 * stores them here instead of just printing them in the chat bubble. The
 * Products page reads this same state and renders those matches as real
 * product cards on the site, replacing the full catalogue view until the
 * shopper clears the search or starts browsing normally again.
 */
export interface ActiveSearch {
  query: string
  products: ProductSummary[]
}

interface SearchResultsContextValue {
  activeSearch: ActiveSearch | null
  setActiveSearch: (search: ActiveSearch) => void
  clearActiveSearch: () => void
}

const SearchResultsContext = createContext<SearchResultsContextValue | undefined>(undefined)

export function SearchResultsProvider({ children }: { children: ReactNode }) {
  const [activeSearch, setActiveSearchState] = useState<ActiveSearch | null>(null)

  function setActiveSearch(search: ActiveSearch) {
    setActiveSearchState(search)
  }

  function clearActiveSearch() {
    setActiveSearchState(null)
  }

  return (
    <SearchResultsContext.Provider value={{ activeSearch, setActiveSearch, clearActiveSearch }}>
      {children}
    </SearchResultsContext.Provider>
  )
}

export function useSearchResults() {
  const ctx = useContext(SearchResultsContext)
  if (!ctx) {
    throw new Error('useSearchResults must be used inside a SearchResultsProvider')
  }
  return ctx
}
