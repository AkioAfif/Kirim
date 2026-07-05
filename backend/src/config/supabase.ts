import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diisi di file .env"
  );
}

// Klien Supabase menggunakan Service Role Key.
// - Ini HANYA dipakai di backend (server-side), JANGAN pernah kirim key ini ke frontend.
// - Service Role key membypass RLS — artinya bisa baca/tulis semua data.
// - Untuk operasi yang butuh konteks user (seperti validasi JWT), gunakan helper auth.getUser()
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
