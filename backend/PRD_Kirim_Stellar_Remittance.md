# PRD: Kirim — Cross-Border Remittance Infrastructure untuk PMI
**APAC Stellar Hackathon 2026 — Track: Payment Consumer Applications**

Status: Draft v1 | Durasi build: 1-2 minggu | Tim: 2-3 orang (baru belajar Stellar/Soroban)

---

## 1. Problem Statement

Pekerja Migran Indonesia (PMI) mengirim remitansi senilai **Rp288 triliun di 2025** (naik dari Rp253T di 2024, tumbuh 14%/tahun), tapi masih terbebani biaya tinggi dan proses lambat:

- Biaya rata-rata corridor Malaysia → Indonesia untuk transfer kecil (~USD 65): **4.80%**, dengan beberapa provider tradisional mengenakan biaya hingga 12%+
- Settlement tradisional: 1-3 hari kerja
- 3,9 juta pekerja migran Indonesia mengirim rata-rata Rp64 juta/tahun; 48% untuk kebutuhan harian, **21% investasi, 7% tabungan** — perilaku menabung/investasi sudah ada, tapi belum ada instrumen on-chain yang transparan untuk mendukungnya
- Remitansi Indonesia baru menyumbang **1,2% PDB**, jauh di bawah Filipina (30% PDB) — menunjukkan ruang pertumbuhan besar yang belum tergarap, terutama secara digital/on-chain

**Constraint regulasi penting**: Di Indonesia, kripto legal diperdagangkan sebagai aset tapi **ilegal digunakan sebagai alat pembayaran** (UU Mata Uang, ditegakkan oleh Bank Indonesia). Karena itu produk ini didesain sebagai **infrastruktur settlement**, bukan aplikasi pembayaran crypto — stablecoin hanya dipakai di leg internasional (backend), penerima di Indonesia selalu menerima dan memegang rupiah asli lewat kanal berlisensi.

---

## 2. Goals & Non-Goals

### Goals (untuk hackathon)
- Buktikan settlement lintas negara yang jauh lebih cepat & murah dari sistem tradisional, berjalan nyata di testnet Stellar
- Tunjukkan fitur diferensiasi: **split disbursement** (1 pengirim → banyak penerima dalam 1 transaksi) dan **opsi yield saat dana tidak langsung dicairkan**
- Desain yang jelas soal compliance boundary (di mana crypto berhenti, di mana fiat mulai)
- Demo end-to-end yang benar-benar jalan (bukan mockup statis)

### Non-Goals (bukan scope hackathon ini)
- Lisensi PJP/money transmitter asli — cukup disimulasikan
- Onboarding KYC penuh sesuai regulasi produksi
- Dukungan multi-corridor (fokus 1 corridor dulu: Malaysia → Indonesia)
- Native mobile app — web app cukup untuk demo

---

## 3. Target Users

**Primary: Pengirim (PMI di Malaysia)**
- Bekerja di sektor manufaktur/domestik/perkebunan
- Mengirim uang mingguan/bulanan ke lebih dari 1 anggota keluarga
- Sensitif terhadap biaya karena nominal kiriman kecil-menengah

**Primary: Penerima (keluarga di Indonesia)**
- Bisa jadi unbanked/underbanked di daerah asal
- Butuh dana cair cepat untuk kebutuhan harian, tapi kadang ingin menyisihkan sebagian untuk pendidikan anak/dana darurat

---

## 4. User Flow

### 4.1 Sender Flow (Malaysia)
1. Login (passkey/biometric — tanpa perlu paham konsep "wallet")
2. Input nominal dalam MYR
3. Pilih penerima — bisa lebih dari satu, atur porsi masing-masing (contoh: istri 60%, orang tua 30%, tabungan anak 10%)
4. Konfirmasi & bayar (simulasi: input manual/testnet faucet menggantikan bank transfer MYR asli)
5. [ON-RAMP — disimulasikan] MYR dikonversi ke USDC
6. Transaksi Stellar (multi-operation payment) dikirim — settle dalam hitungan detik
7. Notifikasi konfirmasi + breakdown biaya (dibandingkan estimasi biaya bank tradisional)

### 4.2 Receiver Flow (Indonesia)
1. Notifikasi dana masuk (dalam representasi USDC di internal ledger)
2. Pilihan:
   - **Cairkan sekarang** → [OFF-RAMP/ANCHOR SEP-24 — disimulasikan] → dana keluar sebagai IDR ke rekening/e-wallet
   - **Simpan sebagian/semua** → dana di-deposit ke pool yield (Blend testnet) → bisa ditarik kapan saja
3. Dashboard riwayat: kurs, biaya, dan akumulasi yield (jika memilih simpan) — transparan dan dapat diverifikasi on-chain

---

## 5. Fitur & Prioritas (P0/P1/P2)

### P0 — Wajib jalan, ini yang dinilai di kriteria teknis (25%)
| Fitur | Deskripsi |
|---|---|
| Stellar account provisioning | Setiap user (sender & receiver) otomatis dapat Stellar testnet account saat registrasi, key dikelola di backend (custodial-lite) |
| Kirim USDC testnet | Transaksi dasar antar-account, pakai Stellar SDK |
| Multi-operation split payment | 1 transaksi berisi banyak `payment` operation ke beberapa receiver sekaligus, atomik (semua sukses/semua gagal) |
| Simulasi SEP-24 anchor (deposit/withdraw) | Interactive flow sesuai spec SEP-24 untuk withdraw ke "rupiah" (mock bank API di backend) |
| Dashboard riwayat transaksi | Nampilin kurs, biaya, dan status settlement |

### P1 — Diferensiasi kuat, kerjakan jika P0 selesai
| Fitur | Deskripsi |
|---|---|
| Integrasi Blend testnet | Opsi "simpan" men-deposit USDC ke lending pool Blend, dengan estimasi APY ditampilkan real-time |
| Kalkulator perbandingan biaya | Bandingkan biaya "Kirim" vs rata-rata bank tradisional (pakai data World Bank Remittance Prices sebagai referensi) |
| Multi-recipient UI yang intuitif | Slider/persentase visual untuk split penerima |

### P2 — Nice-to-have jika waktu sisa
| Fitur | Deskripsi |
|---|---|
| Soroban smart contract custom | Migrasi split disbursement dari multi-op transaction ke smart contract Soroban (stretch goal, tidak wajib) |
| Notifikasi real-time | WebSocket/push notification saat dana masuk |
| Riwayat yield historis | Grafik akumulasi yield dari waktu ke waktu |

---

## 6. Arsitektur Teknis

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Sender App  │      │  Backend/API      │      │  Stellar Network  │
│  (Malaysia)  │─────▶│  (Node/Python)    │─────▶│  Testnet          │
└─────────────┘      │  - Auth (passkey) │      │  - Multi-op tx    │
                      │  - Key management │      │  - USDC asset     │
                      │  - SEP-24 mock     │      │  - Blend pool     │
                      └──────────────────┘      └─────────────────┘
                              │                          │
                              ▼                          ▼
                      ┌──────────────────┐      ┌─────────────────┐
                      │ Mock On/Off-ramp  │      │  Receiver App    │
                      │ (simulasi PJP)    │      │  (Indonesia)     │
                      └──────────────────┘      └─────────────────┘
```

**Stack yang disarankan** (sesuaikan dengan kemampuan tim):
- Frontend: React/Next.js
- Backend: Node.js dengan `js-stellar-sdk`
- Wallet: Freighter API untuk testing manual, custodial key management untuk demo UX
- Database: sederhana (PostgreSQL/SQLite) untuk simpan mapping user ↔ Stellar account, riwayat transaksi

**Asset yang dipakai**:
- USDC testnet (issuer resmi Circle di testnet, atau issued asset sendiri untuk simulasi jika USDC testnet sulit diakses)
- Token IDR simulasi (self-issued asset, merepresentasikan hasil kerja sama dengan anchor/PJP di masa depan)

---

## 7. Compliance Positioning (wajib ada di pitch & PRD ini sebagai acuan tim)

> "Kirim adalah lapisan teknologi settlement lintas negara, bukan penerbit alat pembayaran crypto. Stablecoin (USDC) hanya digunakan di infrastruktur backend untuk leg internasional. Penerima di Indonesia selalu menerima dan memegang Rupiah asli melalui kanal berlisensi (anchor/PJP). Model kerja sama pasca-hackathon: partnership dengan penyelenggara sistem pembayaran berlisensi (contoh kategori: PJP yang sudah punya jaringan luas ke bank dan outlet remitansi PMI)."

Statement ini harus konsisten dipakai di semua materi (pitch deck, demo narration, README).

---

## 8. Success Metrics (untuk demo/pitch)

- Waktu settlement: testnet Stellar (<5 detik) vs estimasi bank tradisional (1-3 hari)
- Biaya: network fee mendekati nol vs rata-rata 4.80% (data World Bank corridor MY→ID)
- Fitur split disbursement: berhasil kirim ke 3 penerima berbeda dalam 1 transaksi, verifiable di Stellar testnet explorer
- Yield demo: tunjukkan APY yang didapat dari deposit ke Blend testnet dalam periode simulasi

---

## 9. Timeline (1-2 Minggu)

| Periode | Fokus |
|---|---|
| Hari 1-3 | Belajar dasar: Stellar SDK, testnet, Stellar Laboratory (eksperimen manual), setup Freighter, riset ulang partner off-ramp untuk referensi pitch |
| Hari 4-7 | Core flow: kirim USDC, multi-operation split payment, UI dasar sender & receiver |
| Hari 8-10 | Simulasi SEP-24 anchor (deposit/withdraw), integrasi Blend testnet |
| Hari 11-13 | Polish UX, susun pitch deck, isi narasi dengan data riset (lihat Appendix), rekam demo video cadangan |
| Hari 14 | Buffer & submission |

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Tim baru di Soroban, waktu mepet | Gunakan Stellar native multi-operation transaction untuk split disbursement (bukan custom smart contract) sebagai P0; Soroban jadi stretch goal P2 |
| Blend testnet sulit diintegrasikan | Siapkan fallback: tampilkan simulasi yield dengan APY statis + disclosure jelas "integrasi penuh direncanakan pasca-hackathon" |
| USDC testnet issuer bermasalah | Issue asset sendiri (mis. "TESTUSD") sebagai representasi stablecoin untuk demo |
| Demo live gagal saat presentasi | Rekam video demo cadangan sebagai backup |

---

## 11. Mapping ke Kriteria Penilaian

| Kriteria | Bobot | Bagaimana PRD ini menjawab |
|---|---|---|
| Technical implementation & Stellar usage | 25% | Multi-op atomic payment, SEP-24 flow, Blend integration — bukan sekadar transfer 1-1 |
| Real-world fit & use case | 25% | Berbasis data riil (Rp288T remitansi, biaya 4.80%, perilaku menabung 7-21%), user jelas (PMI Malaysia-Indonesia) |
| Innovation/differentiation | 20% | Split disbursement + yield-linked savings — belum ditemukan kompetitor dengan kombinasi ini khusus corridor Indonesia |
| Viability & go-to-market | 10% | Positioning compliance jelas, model kerja sama dengan PJP berlisensi disebutkan eksplisit |
| UX & accessibility | 5% | Custodial-lite, passkey login, tanpa istilah crypto yang membingungkan |
| Team & ability to continue | 5% | Timeline & role jelas, rencana lanjutan pasca-hackathon disebutkan |

---

## Appendix: Data Riset Pendukung

- Remitansi PMI 2025: Rp288 triliun (naik 14% dari 2024's Rp253T), sumber: Bank Indonesia via Kementerian P2MI
- Biaya rata-rata Malaysia→Indonesia (nominal kecil ~USD65): 4.80% (World Bank Remittance Prices Worldwide)
- Alokasi dana remitansi (survei BI 2019 & OJK): 48% kebutuhan harian, 21% investasi, 7% tabungan, 5% bisnis, 9% lainnya
- Kontribusi remitansi ke PDB: Indonesia 1,2% vs Filipina 30% (2024)
- Preseden global: Coins.ph (Filipina, 16 juta pengguna, remitansi via Stellar), Tempo (Prancis, anchor Euro-stablecoin), MoneyGram + Circle/USDC di Stellar
- Status regulasi: kripto legal diperdagangkan tapi ilegal sebagai alat pembayaran di Indonesia (OJK Reg. 27/2024, UU Mata Uang ditegakkan BI)
