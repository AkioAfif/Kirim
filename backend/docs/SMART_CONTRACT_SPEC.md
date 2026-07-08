# Technical Spec: Split Disbursement Smart Contract (Soroban)
Dokumen ini adalah konteks teknis untuk AI coding agent. Baca bersamaan dengan PRD_Kirim_Stellar_Remittance.md untuk konteks produk secara umum.

---

## Tujuan Kontrak

Kontrak Soroban ini menangani 1 kebutuhan spesifik: menerima 1 deposit dari sender, lalu mendistribusikan ke N penerima sesuai persentase yang ditentukan, dalam 1 transaksi atomik (semua berhasil atau semua gagal/revert).

**Catatan penting untuk agent**: Sebelum menulis kode apapun, cek dokumentasi resmi terbaru di https://developers.stellar.org/docs/build/smart-contracts untuk syntax Soroban SDK versi terkini — jangan asumsikan API dari memori training karena Soroban berkembang cepat dan breaking changes cukup sering terjadi antar versi.

---

## Environment

- Network: Stellar Testnet
- Network Passphrase: `Test SDF Network ; September 2015`
- RPC endpoint: `https://soroban-testnet.stellar.org`
- Asset yang dipakai: CAOP7G6SU66NSJQ6PLDGASAR6WT6QQLHBRQBBF53U6EVW4KEKGRZXNZS
- Bahasa: Rust + Soroban SDK (cek versi terbaru yang kompatibel dengan CLI yang terinstall)

---

## Struktur Data (Storage)

```rust
// Representasi tiap "kiriman" yang sedang diproses
struct Disbursement {
    id: u64,
    sender: Address,
    total_amount: i128,
    asset: Address,        // contract address dari asset yang dikirim
    recipients: Vec<RecipientShare>,
    status: DisbursementStatus,
    created_at: u64,        // ledger timestamp
}

struct RecipientShare {
    recipient: Address,
    percentage: u32,        // basis points, contoh: 6000 = 60.00%
    amount: i128,           // dihitung dari total_amount * percentage
}

enum DisbursementStatus {
    Pending,
    Completed,
    Failed,
}
```

**Constraint yang harus divalidasi kontrak**:
- Total persentase seluruh `RecipientShare` HARUS tepat 10000 basis points (100.00%) — tolak transaksi kalau tidak
- Minimal 1 recipient, maksimal 5 recipients
- `total_amount` harus lebih besar dari 0

---

## Fungsi yang Harus Diimplementasikan

### 1. `initialize`
Setup awal kontrak (admin address, asset yang diizinkan, dll). Dipanggil sekali saat deploy.

### 2. `create_disbursement`
```
Input: sender: Address, total_amount: i128, asset: Address, recipients: Vec<RecipientShare>
Output: disbursement_id: u64
```
- Validasi total persentase = 10000 bps
- Hitung `amount` tiap recipient dari `total_amount * percentage / 10000`
- Transfer `total_amount` dari sender ke kontrak (escrow sementara) — perlu `sender.require_auth()`
- Simpan state sebagai `Pending`
- Emit event `DisbursementCreated`

### 3. `execute_disbursement`
```
Input: disbursement_id: u64
```
- Ambil data disbursement dari storage
- Loop semua `RecipientShare`, transfer `amount` masing-masing dari escrow kontrak ke `recipient`
- Kalau SEMUA transfer sukses → update status `Completed`, emit event `DisbursementCompleted`
- Kalau ADA yang gagal → revert seluruh transaksi (Soroban otomatis rollback on panic/error), status tetap `Pending` atau ubah ke `Failed` tergantung jenis error

### 4. `get_disbursement`
```
Input: disbursement_id: u64
Output: Disbursement (read-only, untuk ditampilkan di frontend)
```

### 5. `get_disbursements_by_sender` / `get_disbursements_by_recipient`
Read-only, buat dashboard riwayat transaksi.

---

## Events yang Harus Di-emit

Frontend/backend butuh listen ke event ini buat update UI real-time:
- `DisbursementCreated(disbursement_id, sender, total_amount)`
- `DisbursementCompleted(disbursement_id)`
- `DisbursementFailed(disbursement_id, reason)`

---

## Error Handling

Definisikan error enum eksplisit, jangan pakai generic panic string:
```rust
enum ContractError {
    InvalidPercentageTotal = 1,
    TooManyRecipients = 2,
    ZeroAmount = 3,
    DisbursementNotFound = 4,
    Unauthorized = 5,
    TransferFailed = 6,
}
```
Kenapa ini penting: frontend perlu bisa nampilin pesan error yang jelas ke user, bukan generic "transaction failed".

---

## Test Cases yang Harus Ditulis (unit test Soroban)

1. Create disbursement dengan 3 recipients (60/30/10) → berhasil, funds ter-escrow
2. Create disbursement dengan total persentase != 100% → harus reject
3. Execute disbursement normal → semua recipient terima amount yang benar
4. Execute disbursement dengan 0 recipients → harus reject
5. Create disbursement dengan amount 0 → harus reject
6. Sender tanpa cukup balance → harus reject saat create (bukan saat execute)

---

## Interface untuk Tim Lain (Backend/Frontend)

Bagian ini WAJIB dikoordinasikan dengan tim backend sebelum implementasi final — kalau ada perubahan struct/fungsi, update dokumen ini juga:

- Backend akan panggil `create_disbursement` lalu `execute_disbursement` secara berurutan dalam 1 flow (atau digabung jadi 1 fungsi `create_and_execute` kalau mau lebih simpel — diskusikan dengan tim)
- Frontend butuh `get_disbursement` buat polling status sebelum nampilin "sukses" ke user
- Format `Address` di Soroban itu Stellar public key yang di-encode — pastikan backend tau cara convert dari user ID internal ke Stellar Address

---

## Catatan untuk Agent: Alternatif Jika Waktu Tidak Cukup

Kalau smart contract ini ternyata makan waktu terlalu lama untuk tim yang baru belajar Soroban, PRD utama sudah menyediakan fallback: gunakan Stellar **native multi-operation transaction** (beberapa `payment` operation dalam 1 transaction envelope) sebagai pengganti smart contract untuk fitur split disbursement. Ini tidak butuh Rust/Soroban sama sekali, cukup pakai Stellar SDK biasa (JS/Python) di backend. Diskusikan dengan tim mana yang mau dipakai sebelum lanjut development lebih jauh — jangan kerjakan dua-duanya sekaligus karena buang waktu.
