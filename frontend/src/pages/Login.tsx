import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import BulldogMascot from '../components/BulldogMascot'
import './AuthForm.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const user = await login({ email, password })
      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__brand">
          <BulldogMascot className="auth-form__brand-icon" />
          <span>Campus Customs</span>
        </div>
        <h1>Welcome Back</h1>
        <p className="auth-form__subtitle">Log in to pick up where you left off.</p>

        {error && <p className="auth-form__error">{error}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </div>
  )
}
