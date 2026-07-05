/**
 * Utility kecil buat cek saldo akun testnet mana pun (issuer, distributor,
 * demo, atau akun user hasil testing). Berguna buat kedua opsi (A & B).
 *
 * Jalankan: PUBLIC_KEY=G... npm run check:balance
 */

import { server } from "./config.js";

async function main() {
  const publicKey = process.env.PUBLIC_KEY;
  if (!publicKey) {
    console.error("Set env var PUBLIC_KEY dulu, contoh:");
    console.error("  PUBLIC_KEY=GABC... npm run check:balance");
    process.exit(1);
  }

  const account = await server.loadAccount(publicKey);
  console.log(`Saldo untuk akun ${publicKey}:\n`);
  for (const balance of account.balances) {
    if (balance.asset_type === "native") {
      console.log(`  XLM: ${balance.balance}`);
    } else if (
      balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12"
    ) {
      console.log(
        `  ${balance.asset_code} (issuer ${balance.asset_issuer.slice(0, 8)}...): ${balance.balance}`,
      );
    }
  }
}

main().catch((err) => {
  console.error("Gagal cek saldo:", err);
  process.exit(1);
});
