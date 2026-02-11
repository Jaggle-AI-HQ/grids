import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, isAuthenticated } from '../lib/api'
import { Grid3X3 } from 'lucide-react'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated()) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, name)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Grid3X3 size={32} strokeWidth={2.5} />
          </div>
          <h1 className={styles.title}>Jaggle Grids</h1>
          <p className={styles.subtitle}>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className={styles.input}
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={styles.input}
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className={styles.hint}>
            This is a mocked authentication flow. Enter any name and email to continue.
            Jaggle OAuth will be integrated at a later point.
          </p>
        </form>
      </div>

      <footer className={styles.footer}>
        Part of the Jaggle suite of productivity tools
      </footer>
    </div>
  )
}
