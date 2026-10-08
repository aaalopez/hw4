import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct, type Product } from '../api/client'
import './ProductDetail.css'

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    setStatus('loading')
    fetchProduct(productId)
      .then((data) => {
        if (!cancelled) {
          setProduct(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  if (status === 'loading') {
    return <p className="product-detail__status">Loading product…</p>
  }

  if (status === 'error' || !product) {
    return (
      <div className="product-detail__status">
        <p>Couldn't find that product.</p>
        <Link to="/products">Back to Products</Link>
      </div>
    )
  }

  return (
    <div className="product-detail">
      <Link to="/products" className="product-detail__back">
        ← Back to Products
      </Link>
      <div className="product-detail__layout">
        <img src={product.image_url} alt={product.name} className="product-detail__image" />
        <div className="product-detail__info">
          <h1>{product.name}</h1>
          <p className="product-detail__price">${product.price.toFixed(2)}</p>
          <p className="product-detail__description">{product.description}</p>

          <div className="product-detail__block">
            <h3>Colors</h3>
            <p>{product.colors.join(', ')}</p>
          </div>

          <div className="product-detail__block">
            <h3>Sizes &amp; Stock</h3>
            {product.inventory.length === 0 ? (
              <p>No size information available yet.</p>
            ) : (
              <ul className="product-detail__sizes">
                {product.inventory.map((line) => (
                  <li key={line.size} className={line.quantity === 0 ? 'is-out' : ''}>
                    <span>{line.size}</span>
                    <span>{line.quantity === 0 ? 'Out of stock' : `${line.quantity} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="product-detail__add" disabled={!product.in_stock}>
            {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
