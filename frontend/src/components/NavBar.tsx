import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useSearchResults } from '../search/SearchResultsContext'
import { PRODUCT_CATEGORIES, AFFILIATION_CATEGORIES } from '../categories'
import BulldogMascot from './BulldogMascot'
import './NavBar.css'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { clearActiveSearch } = useSearchResults()
  const navigate = useNavigate()
  const [productsOpen, setProductsOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  function goToProducts(category?: string) {
    setProductsOpen(false)
    clearActiveSearch()
    navigate(category ? `/products?category=${category}` : '/products')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" end>
          <BulldogMascot className="navbar__brand-icon" />
          Campus&nbsp;Customs
        </NavLink>
        <nav className="navbar__links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            Home
          </NavLink>

          <div
            className="navbar__dropdown"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              type="button"
              className="navbar__link navbar__link--button navbar__dropdown-trigger"
              onClick={() => goToProducts()}
              aria-expanded={productsOpen}
            >
              Products <span className="navbar__caret">▾</span>
            </button>
            {productsOpen && (
              <div className="navbar__dropdown-menu">
                <button type="button" onClick={() => goToProducts()}>
                  All Products
                </button>
                {PRODUCT_CATEGORIES.filter((c) => c.key !== 'other').map((c) => (
                  <button key={c.key} type="button" onClick={() => goToProducts(c.key)}>
                    {c.label}
                  </button>
                ))}
                <div className="navbar__dropdown-divider" role="separator">
                  Shop by Affiliation
                </div>
                {AFFILIATION_CATEGORIES.map((c) => (
                  <button key={c.key} type="button" onClick={() => goToProducts(c.key)}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            About Us
          </NavLink>

          {user && (
            <>
              <span className="navbar__greeting">Hi, {user.first_name}</span>
              <button className="navbar__link navbar__link--button" onClick={handleLogout}>
                Log Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
