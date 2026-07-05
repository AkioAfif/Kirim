import "dotenv/config";
import { Horizon } from "@stellar/stellar-sdk";

export const HORIZON_URL =
  process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL =
  process.env.FRIENDBOT_URL ?? "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE =
  process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const server = new Horizon.Server(HORIZON_URL);

/**
 * Fund akun baru pakai Friendbot (testnet only).
 * Dipakai buat kasih saldo awal 10,000 XLM ke akun yang baru dibuat,
 * karena Stellar butuh minimum reserve XLM biar akun "aktif" di ledger.
 */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Friendbot funding gagal untuk ${publicKey}: ${response.status} ${body}`,
    );
  }
  console.log(`  Akun ${publicKey.slice(0, 8)}... berhasil di-fund dengan 10,000 XLM`);
}

/** Kasih jeda kecil antar request biar gak kena rate limit Friendbot/Horizon. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
