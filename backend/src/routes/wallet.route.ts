import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { provisionStellarAccount, getWalletByUserId } from "../services/wallet.service.js";

const router = Router();

/**
 * POST /api/wallets/provision
 * Buat akun Stellar baru untuk user yang sedang login.
 * Idempotent: aman dipanggil berkali-kali — jika sudah ada, return wallet yang sudah ada.
 */
router.post("/provision", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const stellarPublicKey = await provisionStellarAccount(userId);

    res.status(201).json({
      message: "Stellar wallet berhasil diprovisikan.",
      stellar_public_key: stellarPublicKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.";
    console.error("[POST /wallets/provision]", message);
    res.status(500).json({ error: "Internal Server Error", message });
  }
});

/**
 * GET /api/wallets/me
 * Return public key Stellar milik user yang sedang login.
 * TIDAK pernah return secret key.
 */
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const wallet = await getWalletByUserId(userId);

    if (!wallet) {
      res.status(404).json({
        error: "Not Found",
        message: "Wallet belum ditemukan. Panggil POST /api/wallets/provision dulu.",
      });
      return;
    }

    res.json({ stellar_public_key: wallet.stellar_public_key });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.";
    console.error("[GET /wallets/me]", message);
    res.status(500).json({ error: "Internal Server Error", message });
  }
});

export default router;
