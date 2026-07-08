#!/usr/bin/env bash
# =============================================================================
# Deploy Stellar Asset Contract (SAC) — langkah yang HARUS dijalankan
# setelah asset (TESTUSD atau USDC) sudah punya issuer/trustline.
#
# KENAPA LANGKAH INI PERLU:
# Smart contract Soroban (bahasa Rust) berinteraksi dengan asset lewat
# interface token Soroban (fungsi transfer, balance, dst), BUKAN lewat
# model classic Stellar (trustline + payment operation).
#
# SAC adalah "jembatan" otomatis yang dibuat Stellar network supaya asset
# classic (kayak TESTUSD atau USDC yang kita setup sebelumnya) juga bisa
# dipanggil lewat interface Soroban. Setiap asset classic punya SATU alamat
# SAC yang unik & deterministik (format `C...`, beda dari public key `G...`).
#
# Alamat `C...` inilah yang jadi parameter `asset: Address` di
# SMART_CONTRACT_SPEC.md — BUKAN public key issuer `G...`.
#
# PRASYARAT sebelum jalankan script ini:
#   1. Sudah install Stellar CLI: https://developers.stellar.org/docs/tools/cli/install-cli
#      (cara cepat: `cargo install --locked stellar-cli` atau lewat Homebrew/binary release)
#   2. Sudah punya identity/keypair yang di-fund di testnet (lihat step 1 di bawah)
#   3. Asset classic-nya (TESTUSD atau USDC) sudah exist (sudah dijalankan
#      setup-issuer-testusd.ts atau setup-usdc-official.ts sebelumnya)
# =============================================================================

set -e

echo "=== Step 0: Cek Stellar CLI terinstall ==="
if ! command -v stellar &> /dev/null; then
  echo "Stellar CLI belum terinstall. Install dulu:"
  echo "  cargo install --locked stellar-cli"
  echo "  (atau lihat opsi lain di https://developers.stellar.org/docs/tools/cli/install-cli)"
  exit 1
fi
stellar --version
echo ""

echo "=== Step 1: Pastikan network testnet sudah dikonfigurasi ==="
stellar network use testnet 2>/dev/null || stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
echo "Network testnet siap."
echo ""

# =============================================================================
# GANTI DUA VARIABEL INI SESUAI ASSET YANG DIPAKAI TIM
# =============================================================================
ASSET_CODE="TESTUSD"                                   # atau "USDC"
ASSET_ISSUER="GAHYDMUL5XIAUDEAPVL2OZTPYYE3PDSVRR4HGJ2S42VVR3KBXTNBIYJR"            # dari hasil setup-issuer-testusd.ts, atau
                                                          # GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 untuk USDC resmi
SOURCE_IDENTITY="deployer"                               # nama identity lokal, lihat step 2

echo "=== Step 2: Buat identity buat sign transaksi deploy (kalau belum ada) ==="
if ! stellar keys address "$SOURCE_IDENTITY" &> /dev/null; then
  stellar keys generate --fund "$SOURCE_IDENTITY" --network testnet
  echo "Identity '$SOURCE_IDENTITY' dibuat & di-fund otomatis via Friendbot."
else
  echo "Identity '$SOURCE_IDENTITY' sudah ada, lanjut."
fi
echo ""

echo "=== Step 3: Hitung dulu alamat SAC (tanpa deploy, cuma cek) ==="
echo "Berguna buat cek dulu apakah SAC-nya sudah pernah di-deploy orang lain."
stellar contract asset id \
  --asset "${ASSET_CODE}:${ASSET_ISSUER}" \
  --network testnet
echo ""

echo "=== Step 4: Deploy SAC (idempotent — aman dijalankan walau sudah pernah) ==="
echo "Catatan: deploy SAC ini PUBLIC ACTION, siapa aja boleh melakukannya,"
echo "gak perlu otorisasi khusus dari issuer."
stellar contract asset deploy \
  --asset "${ASSET_CODE}:${ASSET_ISSUER}" \
  --source "$SOURCE_IDENTITY" \
  --network testnet \
  --alias "${ASSET_CODE,,}_sac"
echo ""

echo "=== SELESAI ==="
echo "Alamat SAC di atas (format C...) adalah yang harus di-share ke tim"
echo "smart contract sebagai parameter 'asset: Address' — GANTIKAN public key"
echo "issuer (G...) yang sebelumnya jadi placeholder sementara."
