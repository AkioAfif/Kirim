# =============================================================================
# Deploy Stellar Asset Contract (SAC) - PowerShell Version
# =============================================================================

Write-Host "=== Step 0: Cek Stellar CLI terinstall ==="
if (-not (Get-Command ".\stellar.exe" -ErrorAction SilentlyContinue) -and -not (Get-Command "stellar" -ErrorAction SilentlyContinue)) {
    Write-Host "Stellar CLI belum terinstall atau tidak ditemukan di path saat ini."
    exit 1
}

$StellarCmd = if (Get-Command ".\stellar.exe" -ErrorAction SilentlyContinue) { ".\stellar.exe" } else { "stellar" }
& $StellarCmd --version
Write-Host ""

Write-Host "=== Step 1: Pastikan network testnet sudah dikonfigurasi ==="
& $StellarCmd network use testnet 2>$null
if ($LASTEXITCODE -ne 0) {
    & $StellarCmd network add testnet --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015"
}
Write-Host "Network testnet siap.`n"

# =============================================================================
# GANTI DUA VARIABEL INI SESUAI ASSET YANG DIPAKAI TIM
# =============================================================================
$ASSET_CODE = "TESTUSD"
$ASSET_ISSUER = "GAHYDMUL5XIAUDEAPVL2OZTPYYE3PDSVRR4HGJ2S42VVR3KBXTNBIYJR"
$SOURCE_IDENTITY = "deployer"

Write-Host "=== Step 2: Buat identity buat sign transaksi deploy (kalau belum ada) ==="
& $StellarCmd keys address $SOURCE_IDENTITY 2>$null
if ($LASTEXITCODE -ne 0) {
    & $StellarCmd keys generate --fund $SOURCE_IDENTITY --network testnet
    Write-Host "Identity '$SOURCE_IDENTITY' dibuat & di-fund otomatis via Friendbot."
} else {
    Write-Host "Identity '$SOURCE_IDENTITY' sudah ada, lanjut."
}
Write-Host ""

Write-Host "=== Step 3: Hitung dulu alamat SAC (tanpa deploy, cuma cek) ==="
& $StellarCmd contract asset id --asset "$($ASSET_CODE):$($ASSET_ISSUER)" --network testnet
Write-Host ""

Write-Host "=== Step 4: Deploy SAC (idempotent - aman dijalankan walau sudah pernah) ==="
$ALIAS = "$($ASSET_CODE.ToLower())_sac"
& $StellarCmd contract asset deploy --asset "$($ASSET_CODE):$($ASSET_ISSUER)" --source $SOURCE_IDENTITY --network testnet --alias $ALIAS
Write-Host ""

Write-Host "=== SELESAI ==="
Write-Host "Alamat SAC di atas (format C...) adalah yang harus di-share ke tim"
Write-Host "smart contract sebagai parameter 'asset: Address'"
