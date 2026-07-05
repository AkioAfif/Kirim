/**
 * OPSI B — Self-issued asset "TESTUSD"
 * ======================================
 * Script ini bikin 2 akun testnet:
 *   1. ISSUER account   -> akun yang "menerbitkan" asset TESTUSD
 *   2. DISTRIBUTOR account -> akun operasional yang pegang stok TESTUSD
 *      buat dikirim ke user sender/receiver saat testing/demo
 *
 * Kenapa dipisah issuer vs distributor (best practice Stellar, bukan wajib
 * tapi disarankan): supaya secret key issuer gak perlu sering dipakai
 * sehari-hari. Issuer cuma dipakai sekali di awal buat "mint" supply awal
 * ke distributor, setelah itu backend cukup pakai secret key distributor
 * buat kirim TESTUSD ke user-user selama development.
 *
 * Setelah script ini selesai, share TESTUSD_ISSUER_PUBLIC_KEY ke tim
 * smart contract — itu yang jadi parameter `asset: Address` di kontrak.
 *
 * Jalankan: npm run setup:testusd
 */

import { Keypair, Asset, TransactionBuilder, Operation, BASE_FEE } from "@stellar/stellar-sdk";
import { server, fundWithFriendbot, NETWORK_PASSPHRASE, sleep } from "./config.js";

const TESTUSD_CODE = "TESTUSD";
// Total supply awal yang di-mint ke distributor. Sesuaikan kalau perlu.
const INITIAL_SUPPLY = "1000000"; // 1 juta TESTUSD, cukup buat testing lama

async function main() {
  console.log("=== Setup Asset TESTUSD (Opsi B: Self-issued) ===\n");

  // 1. Generate keypair buat issuer & distributor
  const issuer = Keypair.random();
  const distributor = Keypair.random();

  console.log("Step 1: Generate keypair");
  console.log(`  Issuer public key     : ${issuer.publicKey()}`);
  console.log(`  Distributor public key: ${distributor.publicKey()}\n`);

  // 2. Fund kedua akun via Friendbot (butuh XLM buat bisa "aktif" di ledger)
  console.log("Step 2: Fund akun via Friendbot");
  await fundWithFriendbot(issuer.publicKey());
  await sleep(1000); // jeda kecil biar gak kena rate limit
  await fundWithFriendbot(distributor.publicKey());
  await sleep(1000);
  console.log();

  // 3. Definisikan asset TESTUSD (asset = kode + issuer public key)
  const testUSD = new Asset(TESTUSD_CODE, issuer.publicKey());

  // 4. Distributor bikin trustline ke TESTUSD dulu.
  //    Ini WAJIB: akun gak bisa nerima asset non-native tanpa trustline.
  console.log("Step 3: Buat trustline dari distributor ke TESTUSD");
  const distributorAccount = await server.loadAccount(distributor.publicKey());
  const trustlineTx = new TransactionBuilder(distributorAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset: testUSD,
        limit: "100000000", // batas maksimum TESTUSD yang boleh dipegang akun ini
      }),
    )
    .setTimeout(30)
    .build();
  trustlineTx.sign(distributor);
  await server.submitTransaction(trustlineTx);
  console.log("  Trustline berhasil dibuat\n");

  // 5. Issuer mint & kirim initial supply ke distributor.
  //    "Minting" di Stellar = issuer mengirim payment dari akunnya sendiri;
  //    karena asset ini "berasal" dari issuer, ini otomatis dianggap
  //    penerbitan token baru (bukan transfer supply yang sudah ada).
  console.log(`Step 4: Mint ${INITIAL_SUPPLY} TESTUSD ke distributor`);
  const issuerAccount = await server.loadAccount(issuer.publicKey());
  const mintTx = new TransactionBuilder(issuerAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: distributor.publicKey(),
        asset: testUSD,
        amount: INITIAL_SUPPLY,
      }),
    )
    .setTimeout(30)
    .build();
  mintTx.sign(issuer);
  await server.submitTransaction(mintTx);
  console.log("  Minting berhasil\n");

  // 6. Ringkasan — SIMPAN INI, terutama secret key-nya
  console.log("=== SELESAI — simpan info berikut ke .env ===\n");
  console.log(`TESTUSD_ISSUER_PUBLIC_KEY=${issuer.publicKey()}`);
  console.log(`TESTUSD_ISSUER_SECRET_KEY=${issuer.secret()}`);
  console.log(`TESTUSD_DISTRIBUTOR_PUBLIC_KEY=${distributor.publicKey()}`);
  console.log(`TESTUSD_DISTRIBUTOR_SECRET_KEY=${distributor.secret()}`);
  console.log(
    `\n>> Share TESTUSD_ISSUER_PUBLIC_KEY (${issuer.publicKey()}) ke tim smart contract.`,
  );
  console.log(
    ">> JANGAN share secret key ke siapapun / commit ke git. Simpan di .env atau secret manager.",
  );
}

main().catch((err) => {
  console.error("Gagal setup TESTUSD:", err);
  process.exit(1);
});
