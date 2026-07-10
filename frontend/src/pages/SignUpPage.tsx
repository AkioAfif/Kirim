import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './AuthPage.css'

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Password tidak cocok.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pendaftaran gagal.')
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
            <h1 className="heading-sm">Buat Akun</h1>
            <p className="auth-sub">
              Daftarkan email kamu — akun Stellar dibuat otomatis, tanpa perlu paham crypto.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="signup-email" className="form-label">Alamat Email</label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="form-label">Password</label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm" className="form-label">Konfirmasi Password</label>
              <input
                id="signup-confirm"
                type="password"
                className={`form-input ${error.includes('cocok') ? 'error' : ''}`}
                placeholder="Ulangi password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              id="signup-submit"
              type="submit"
              className="btn-primary auth-cta"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Membuat akun...</> : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="auth-switch">
            Sudah punya akun?{' '}
            <Link to="/login" className="auth-link">Masuk</Link>
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
