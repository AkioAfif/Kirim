# Setup Asset Stellar — Proyek Kirim

Script buat nyiapin asset yang bakal dipakai smart contract split disbursement.
Ada 2 opsi, jalankan salah satu (atau dua-duanya buat dibandingkan):

## Instalasi

```bash
npm install
cp .env.example .env
```

## Opsi B — Self-issued TESTUSD (rekomendasi)

```bash
npm run setup:testusd
```

Ini bakal:
1. Generate akun issuer & distributor
2. Fund keduanya pakai Friendbot (XLM gratis testnet)
3. Bikin trustline distributor ke asset TESTUSD
4. Mint 1,000,000 TESTUSD dari issuer ke distributor

Output di terminal berupa 4 baris `KEY=value` — copy-paste itu ke file `.env` lu.

**Yang perlu di-share ke tim smart contract:** `TESTUSD_ISSUER_PUBLIC_KEY`
(ini yang jadi parameter `asset: Address` di kontrak Soroban).

## Opsi A — USDC Testnet Resmi (Circle)

```bash
npm run setup:usdc
```

Ini bakal:
1. Generate 1 akun demo
2. Fund pakai Friendbot
3. Bikin trustline ke USDC resmi (issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`)
4. Coba tukar sedikit XLM ke USDC lewat Path Payment on-chain

Kalau step 4 gagal (biasa terjadi kalau likuiditas DEX testnet lagi kosong),
script tetap lanjut — lu tinggal minta USDC testnet manual dari Circle Faucet:
https://developers.circle.com/stablecoins/docs/usdc-on-testing-networks

**Yang perlu di-share ke tim smart contract:** alamat issuer resmi di atas
(sudah fixed, gak perlu digenerate).

## Step Tambahan (WAJIB) — Deploy Stellar Asset Contract (SAC)

Setelah asset classic-nya jadi (dari salah satu opsi di atas), **masih ada 1
langkah lagi sebelum alamatnya bisa dipakai smart contract**: deploy Stellar
Asset Contract (SAC).

**Kenapa perlu:** smart contract Soroban (Rust) manggil asset lewat interface
token Soroban, bukan lewat model classic Stellar (trustline). SAC adalah
jembatan otomatis antara keduanya, dan punya alamat sendiri berformat `C...`
(beda dari public key issuer yang formatnya `G...`).

**Yang harus di-share ke tim smart contract adalah alamat `C...` ini, BUKAN
public key issuer `G...`.**

Prasyarat: install Stellar CLI dulu — https://developers.stellar.org/docs/tools/cli/install-cli
(paling gampang: `cargo install --locked stellar-cli`)

```bash
chmod +x scripts/deploy-sac.sh
```

Buka `scripts/deploy-sac.sh`, isi 2 variabel di bagian atas:
- `ASSET_CODE` → `"TESTUSD"` atau `"USDC"`
- `ASSET_ISSUER` → public key issuer dari hasil setup sebelumnya (atau
  `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` kalau pakai USDC resmi)

Lalu jalankan:

```bash
./scripts/deploy-sac.sh
```

Output akhirnya adalah alamat SAC (`C...`) — itu yang di-paste ke
`SMART_CONTRACT_SPEC.md` menggantikan placeholder `[ISI: ...]`.

Deploy SAC ini aman dijalankan berkali-kali (idempotent) — kalau sudah pernah
di-deploy siapa pun, CLI cukup mengembalikan alamat yang sama tanpa error.

## Cek Saldo

```bash
PUBLIC_KEY=G... npm run check:balance
```

## Kalau Ganti Pikiran / Mau Reset

Testnet Stellar kadang di-reset berkala oleh SDF (Stellar Development
Foundation). Kalau tiba-tiba akun lu "hilang" atau saldo balik ke 0, itu bukan
bug — tinggal jalanin ulang script setup-nya.

## Keamanan

- **Jangan pernah commit file `.env`** — sudah gue siapkan pola di `.gitignore`
  kalau lu belum ada, tambahin `.env` ke situ.
- Secret key issuer/distributor itu setara password ke akun yang bisa mint
  asset — kalau bocor, siapa aja bisa mint TESTUSD tak terbatas atas nama
  proyek lu. Untuk testnet gak fatal (gak ada nilai riil), tapi tetap biasakan
  praktik aman dari sekarang.
