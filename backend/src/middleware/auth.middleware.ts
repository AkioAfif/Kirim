import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase.js";

// Extend Express Request agar bisa menyimpan data user setelah autentikasi
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware autentikasi: validasi JWT token dari Supabase Auth.
 *
 * Frontend harus mengirim token di header:
 *   Authorization: Bearer <supabase_access_token>
 *
 * Token didapat setelah user login lewat Supabase Auth (passkey/email).
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Token autentikasi tidak ditemukan. Kirim di header: Authorization: Bearer <token>",
    });
    return;
  }

  const token = authHeader.substring(7); // Hapus prefix "Bearer "

  // Verifikasi token ke Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.",
    });
    return;
  }

  // Simpan userId di request object agar bisa diakses di route handler
  req.userId = data.user.id;
  next();
}
