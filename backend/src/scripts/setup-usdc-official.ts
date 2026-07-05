/**
 * OPSI A — USDC Testnet Resmi (issuer Circle)
 * ============================================
 * Beda dari Opsi B: di sini kita GAK bikin issuer sendiri. Kita cukup
 * bikin akun demo, kasih trustline ke USDC resmi, lalu tukar sedikit XLM
 * jadi USDC lewat Path Payment (Stellar punya built-in DEX, jadi ini
 * gak butuh exchange eksternal).
 *
 * Issuer address di bawah ini diverifikasi dari dokumentasi resmi
 * Circle & Stellar per awal 2026. Kalau suatu saat gagal/berubah, cek ulang
 * di https://developers.circle.com/stablecoins/docs/usdc-on-testing-networks
 *
 * Catatan: jalur "tukar XLM ke USDC via DEX" ini kadang tidak selalu ada
 * likuiditas cukup di testnet. Kalau path payment gagal karena no path
 * ditemukan, alternatif: minta USDC testnet langsung dari Circle Faucet
 * (perlu akun Circle Developer) atau dari sesama developer yang sudah
 * punya saldo.
 *
 * Jalankan: npm run setup:usdc
 */

import {
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { server, fundWithFriendbot, NETWORK_PASSPHRASE, sleep } from "./config.js";

// Issuer resmi USDC di Stellar Testnet (Circle) — JANGAN diubah kecuali
// dokumentasi resmi Circle bilang alamatnya pindah.
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC_CODE = "USDC";

// Jumlah XLM yang mau ditukar jadi USDC lewat path payment (percobaan awal)
const XLM_TO_SWAP = "50";
const MIN_USDC_EXPECTED = "1"; // minimum USDC yang diterima, testnet jadi longgar aja

async function main() {
  console.log("=== Setup Akun Demo untuk USDC Testnet Resmi (Opsi A) ===\n");

  const demoAccount = Keypair.random();
  console.log("Step 1: Generate keypair akun demo");
  console.log(`  Public key: ${demoAccount.publicKey()}\n`);

  console.log("Step 2: Fund akun via Friendbot (10,000 XLM)");
  await fundWithFriendbot(demoAccount.publicKey());
  await sleep(1000);
  console.log();

  const usdc = new Asset(USDC_CODE, USDC_ISSUER);

  console.log("Step 3: Buat trustline ke USDC resmi");
  const account = await server.loadAccount(demoAccount.publicKey());
  const trustlineTx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: usdc,
      }),
    )
    .setTimeout(30)
    .build();
  trustlineTx.sign(demoAccount);
  await server.submitTransaction(trustlineTx);
  console.log("  Trustline ke USDC berhasil dibuat\n");

  console.log(`Step 4: Coba tukar ${XLM_TO_SWAP} XLM -> USDC lewat Path Payment`);
  try {
    const refreshedAccount = await server.loadAccount(demoAccount.publicKey());
    const swapTx = new TransactionBuilder(refreshedAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: Asset.native(),
          sendAmount: XLM_TO_SWAP,
          destination: demoAccount.publicKey(),
          destAsset: usdc,
          destMin: MIN_USDC_EXPECTED,
          path: [],
        }),
      )
      .setTimeout(30)
      .build();
    swapTx.sign(demoAccount);
    await server.submitTransaction(swapTx);
    console.log("  Berhasil dapat USDC lewat swap on-chain\n");
  } catch (err) {
    console.warn(
      "  Swap gagal (kemungkinan likuiditas testnet kosong). Ini NORMAL,",
    );
    console.warn(
      "  lanjutkan dengan minta USDC testnet manual dari Circle Faucet:",
    );
    console.warn(
      "  https://developers.circle.com/stablecoins/docs/usdc-on-testing-networks\n",
    );
  }

  console.log("=== SELESAI — simpan info berikut ke .env ===\n");
  console.log(`USDC_DEMO_ACCOUNT_PUBLIC_KEY=${demoAccount.publicKey()}`);
  console.log(`USDC_DEMO_ACCOUNT_SECRET_KEY=${demoAccount.secret()}`);
  console.log(`\n>> Alamat issuer resmi (share ke tim smart contract): ${USDC_ISSUER}`);
  console.log(">> JANGAN share secret key ke siapapun / commit ke git.");
}

main().catch((err) => {
  console.error("Gagal setup akun demo USDC:", err);
  process.exit(1);
});
