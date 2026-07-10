// Supabase client — digunakan untuk sign up & login
// Auth token (JWT) dari Supabase kemudian dikirim ke backend kita sebagai Bearer token

import { createClient } from '@supabase/supabase-js'

// Gunakan string kosong sebagai fallback — Supabase akan gagal saat API call pertama
// dengan error yang jelas, bukan crash saat import (yang menyebabkan blank page)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) ?? ''
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? ''

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
)
