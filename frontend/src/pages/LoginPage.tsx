import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './AuthPage.css'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa email dan password kamu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      {/* Kiri: Form */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-brand">
            <span className="auth-logo">KIRIM</span>
            <span className="tag">TESTNET</span>
          </div>

          <div className="auth-header">
            <h1 className="heading-sm">Masuk</h1>
            <p className="auth-sub">
              Selamat datang kembali. Masuk untuk lihat saldo dan kirim uang.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Alamat Email</label>
              <input
                id="login-email"
                type="email"
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="kamu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="Password kamu"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              className="btn-primary auth-cta"
              disabled={loading}
            >
              {loading ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Masuk...</> : 'Masuk ke Akun'}
            </button>
          </form>

          <p className="auth-switch">
            Belum punya akun?{' '}
            <Link to="/signup" className="auth-link">Daftar gratis</Link>
          </p>
        </div>
      </div>

      {/* Kanan: Inverted panel */}
      <div className="auth-hero-panel">
        <div className="auth-hero-inner">
          <div className="auth-hero-tag tag">Kirim untuk PMI</div>
          <h2 className="auth-hero-heading display">
            Kirim<br />Uang.<br />Detik<br />Ini.
          </h2>
          <p className="auth-hero-sub">
            Satu akun. Kirim ke banyak orang sekaligus. Biaya mendekati nol.
          </p>
          <div className="auth-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">{'< 10s'}</span>
              <span className="auth-stat-label">Waktu kirim</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">~0%</span>
              <span className="auth-stat-label">Biaya vs 4.8% bank</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
