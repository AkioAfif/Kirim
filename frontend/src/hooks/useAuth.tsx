import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { setToken, clearToken, kirimApi, connectSocket, disconnectSocket } from '../lib/api'

interface User {
  id: string
  email?: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session dari Supabase saat app load
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session
      if (session) {
        setToken(session.access_token)
        setUser({ id: session.user.id, email: session.user.email })
        connectSocket(session.access_token)
      }
    }).catch((err) => {
      console.warn('[auth] getSession gagal:', err)
    }).finally(() => {
      setLoading(false)
    })

    // Listen ke perubahan auth state (token refresh, logout dari tab lain, dll)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token)
        setUser({ id: session.user.id, email: session.user.email })
        connectSocket(session.access_token)
      } else {
        clearToken()
        setUser(null)
        disconnectSocket()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Cek email kamu untuk konfirmasi akun.')

    const session = data.session
    setToken(session.access_token)
    setUser({ id: session.user.id, email: session.user.email })
    connectSocket(session.access_token)

    // Provision akun Stellar secara otomatis setelah register
    try {
      await kirimApi.provisionWallet()
    } catch {
      // Non-fatal — wallet bisa di-provision ulang saat dashboard load
      console.warn('[auth] Wallet provision gagal, akan dicoba ulang saat dashboard load')
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Login gagal, coba lagi.')

    const session = data.session
    setToken(session.access_token)
    setUser({ id: session.user.id, email: session.user.email })
    connectSocket(session.access_token)

    // Ensure wallet ada setelah login
    try {
      await kirimApi.provisionWallet()
    } catch {
      console.warn('[auth] Wallet provision gagal (mungkin sudah ada)')
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearToken()
    setUser(null)
    disconnectSocket()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
