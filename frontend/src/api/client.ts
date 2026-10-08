// Small wrapper around the backend API (backend/main.py).
// In dev, Vite proxies /api and /media to the FastAPI server (see vite.config.ts).

export interface InventoryLine {
  size: string
  quantity: number
}

// The shared "product card" shape — mirrors backend ProductCard in
// models.py. This is the API contract for Problem 7: whether a card comes
// from GET /api/products or from a chat search result, it has exactly
// these fields, so one card component can render either source the same
// way (image, name, garment_type as "short info", price, in_stock).
export interface ProductSummary {
  product_id: string
  name: string
  garment_type: string
  price: number
  image_url: string
  in_stock: boolean
}

export interface Product extends ProductSummary {
  description: string
  colors: string[]
  search_tags: string[]
  inventory: InventoryLine[]
  total_stock: number
}

const BASE_URL = '' // same-origin; Vite dev proxy forwards to FastAPI

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function fetchProducts(): Promise<Product[]> {
  return getJSON<Product[]>('/api/products')
}

export function fetchProduct(productId: string): Promise<Product> {
  return getJSON<Product>(`/api/products/${encodeURIComponent(productId)}`)
}

export interface ChatReply {
  role: 'assistant'
  content: string
  products: ProductSummary[]
}

// What page the shopper is on, sent with every chat message (Problem 8) so
// the agent can resolve "this"/"it" on a product page without the shopper
// repeating the product's name. Mirrors backend PageContext.
export interface PageContext {
  page: 'home' | 'products' | 'product_detail' | 'about' | 'login' | 'create_account' | 'other'
  product_id?: string | null
}

export async function sendChatMessage(
  message: string,
  userId?: number,
  pageContext?: PageContext,
): Promise<ChatReply> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      user_id: userId ?? null,
      page_context: pageContext ?? null,
    }),
  })
  if (!res.ok) {
    throw new Error(`Chat request failed with status ${res.status}`)
  }
  return res.json() as Promise<ChatReply>
}

// A stored turn from a logged-in shopper's past conversation, reloaded
// when they return (Problem 8). Mirrors backend ChatHistoryEntry.
export interface ChatHistoryEntry {
  role: 'user' | 'assistant'
  content: string
  products: ProductSummary[]
  created_at: string
}

export async function fetchChatHistory(userId: number): Promise<ChatHistoryEntry[]> {
  return getJSON<ChatHistoryEntry[]>(`/api/chat/history?user_id=${encodeURIComponent(String(userId))}`)
}

/** Turn the current route (from react-router's useLocation().pathname) into a PageContext. */
export function pageContextFromPath(pathname: string): PageContext {
  const productMatch = pathname.match(/^\/products\/([^/]+)$/)
  if (productMatch) {
    return { page: 'product_detail', product_id: productMatch[1] }
  }
  switch (pathname) {
    case '/':
      return { page: 'home' }
    case '/products':
      return { page: 'products' }
    case '/about':
      return { page: 'about' }
    case '/login':
      return { page: 'login' }
    case '/create-account':
      return { page: 'create_account' }
    default:
      return { page: 'other' }
  }
}

// --- Auth ---

export interface AuthUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = `Request to ${path} failed with status ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) {
        detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
      }
    } catch {
      // ignore — use default message
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export interface SignupPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

export function signup(payload: SignupPayload): Promise<AuthUser> {
  return postJSON<AuthUser>('/api/auth/signup', payload)
}

export interface LoginPayload {
  email: string
  password: string
}

export function login(payload: LoginPayload): Promise<AuthUser> {
  return postJSON<AuthUser>('/api/auth/login', payload)
}
