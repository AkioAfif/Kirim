import {
  Keypair,
  TransactionBuilder,
  Operation,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { supabase } from "../config/supabase.js";
import {
  server,
  NETWORK_PASSPHRASE,
  TESTUSD_ASSET,
  decryptSecretKey,
} from "../config/stellar.js";
import { getEncryptedSecretKey, getWalletByUserId } from "./wallet.service.js";

export interface RecipientInput {
  stellarAddress: string; // Stellar public key penerima (G...)
  percentageBps: number;  // Basis points: 6000 = 60.00%
}

export interface SendPaymentResult {
  transactionId: string;
  stellarTxHash: string;
  status: string;
}

/**
 * Kirim TESTUSD dari sender ke beberapa penerima sekaligus
 * menggunakan Stellar native multi-operation transaction.
 *
 * Ini adalah implementasi Opsi A (tanpa Smart Contract Soroban) —
 * bisa diganti ke Opsi B (panggil Soroban) tanpa mengubah interface fungsi ini.
 *
 * @param senderId - UUID user pengirim (dari Supabase Auth)
 * @param recipients - Array penerima dan persentase masing-masing
 * @param totalAmountTestusd - Total TESTUSD yang dikirim (contoh: "100")
 */
export async function sendSplitPayment(
  senderId: string,
  recipients: RecipientInput[],
  totalAmountTestusd: string
): Promise<SendPaymentResult> {
  // --- Validasi input ---
  if (recipients.length < 1 || recipients.length > 5) {
    throw new Error("Jumlah penerima harus antara 1 sampai 5.");
  }

  const totalBps = recipients.reduce((sum, r) => sum + r.percentageBps, 0);
  if (totalBps !== 10000) {
    throw new Error(
      `Total persentase harus tepat 10000 basis points (100%). Saat ini: ${totalBps} bps.`
    );
  }

  const totalAmount = parseFloat(totalAmountTestusd);
  if (isNaN(totalAmount) || totalAmount <= 0) {
    throw new Error("totalAmountTestusd harus angka positif.");
  }

  // --- Ambil wallet sender ---
  const senderWallet = await getWalletByUserId(senderId);
  if (!senderWallet) {
    throw new Error(`User ${senderId} belum punya Stellar wallet. Jalankan /api/wallets/provision dulu.`);
  }

  // --- Hitung amount per penerima ---
  const recipientAmounts = recipients.map((r) => ({
    address: r.stellarAddress,
    amount: ((totalAmount * r.percentageBps) / 10000).toFixed(7),
  }));

  // --- Buat record transaksi awal di database (status: pending) ---
  const { data: txRecord, error: txInsertError } = await supabase
    .from("transactions")
    .insert({
      sender_id: senderId,
      total_amount: totalAmount,
      status: "pending",
    })
    .select("id")
    .single();

  if (txInsertError || !txRecord) {
    throw new Error(`Gagal membuat record transaksi: ${txInsertError?.message}`);
  }

  const transactionId = txRecord.id;

  // Simpan detail penerima
  await supabase.from("transaction_recipients").insert(
    recipientAmounts.map((r, i) => ({
      transaction_id: transactionId,
      receiver_stellar_address: r.address,
      percentage_bps: recipients[i].percentageBps,
      amount: parseFloat(r.amount),
    }))
  );

  // --- Build transaksi Stellar ---
  // Decrypt secret key hanya di memory (JANGAN pernah log nilai ini)
  const encryptedSecret = await getEncryptedSecretKey(senderId);
  const senderSecretKey = await decryptSecretKey(encryptedSecret);
  const senderKeypair = Keypair.fromSecret(senderSecretKey);

  // Load akun sender untuk mendapatkan sequence number terbaru
  const senderAccount = await server.loadAccount(senderWallet.stellar_public_key);

  // Build transaction dengan multiple payment operations (1 per penerima)
  const txBuilder = new TransactionBuilder(senderAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  for (const recipient of recipientAmounts) {
    txBuilder.addOperation(
      Operation.payment({
        destination: recipient.address,
        asset: TESTUSD_ASSET,
        amount: recipient.amount,
      })
    );
  }

  const transaction = txBuilder
    .setTimeout(30) // transaksi kedaluwarsa dalam 30 detik
    .build();

  // Sign transaksi
  transaction.sign(senderKeypair);

  // Hapus secret key dari memory secepat mungkin
  // (JS tidak bisa truly zero-out memory, tapi ini best practice)
  senderSecretKey.replace(/./, "x");

  // Update status ke 'submitted' sebelum submit ke jaringan
  await supabase
    .from("transactions")
    .update({ status: "submitted" })
    .eq("id", transactionId);

  // --- Submit ke Stellar Horizon ---
  let txHash: string;
  try {
    const result = await server.submitTransaction(transaction);
    txHash = result.hash;
    console.log(`[payment] Transaksi sukses: ${txHash}`);
  } catch (err: unknown) {
    // Jika submit gagal, update status ke 'failed' dan lempar error
    const reason = err instanceof Error ? err.message : String(err);
    await supabase
      .from("transactions")
      .update({ status: "failed", failure_reason: reason })
      .eq("id", transactionId);
    throw new Error(`Submit transaksi Stellar gagal: ${reason}`);
  }

  // Update transaksi dengan hash dan status completed
  await supabase
    .from("transactions")
    .update({
      stellar_tx_hash: txHash,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  return {
    transactionId,
    stellarTxHash: txHash,
    status: "completed",
  };
}

/**
 * Ambil status transaksi dari database.
 */
export async function getTransactionStatus(transactionId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      status,
      stellar_tx_hash,
      total_amount,
      failure_reason,
      created_at,
      completed_at,
      transaction_recipients (
        receiver_stellar_address,
        percentage_bps,
        amount
      )
    `)
    .eq("id", transactionId)
    .single();

  if (error || !data) {
    throw new Error(`Transaksi ${transactionId} tidak ditemukan.`);
  }

  return data;
}
