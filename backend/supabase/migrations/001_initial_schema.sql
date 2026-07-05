-- ===========================================================================
-- Migration 001: Initial Schema untuk proyek Kirim
-- Jalankan file ini di SQL Editor Supabase Dashboard
-- (Database → SQL Editor → New Query → paste → Run)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tabel: stellar_wallets
-- Menyimpan mapping antara user Supabase Auth <-> akun Stellar mereka.
-- Secret key di-enkripsi di level aplikasi sebelum disimpan, BUKAN plain text.
-- ---------------------------------------------------------------------------
create table if not exists public.stellar_wallets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  stellar_public_key  text not null unique,
  encrypted_secret_key text not null,
  created_at          timestamptz default now() not null
);

comment on table public.stellar_wallets is 'Menyimpan akun Stellar yang diprovision untuk setiap user. Secret key tersimpan dalam bentuk terenkripsi.';

-- Row Level Security: user hanya bisa melihat dompet miliknya sendiri
alter table public.stellar_wallets enable row level security;

create policy "Users can only see their own wallet"
  on public.stellar_wallets for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tabel: transactions
-- Setiap baris mewakili 1 pengiriman uang (disbursement) yang dilakukan sender.
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id              uuid primary key default gen_random_uuid(),
  sender_id       uuid references auth.users(id) not null,
  stellar_tx_hash text,                         -- hash transaksi Stellar, diisi setelah submit
  total_amount    numeric(20, 7) not null,       -- jumlah TESTUSD yang dikirim
  status          text not null default 'pending', -- pending | submitted | completed | failed
  failure_reason  text,
  created_at      timestamptz default now() not null,
  completed_at    timestamptz
);

comment on table public.transactions is 'Riwayat transaksi pengiriman uang. Setiap baris adalah 1 disbursement.';
comment on column public.transactions.status is 'pending=belum disubmit, submitted=sudah kirim ke Stellar, completed=dikonfirmasi on-chain, failed=gagal';

-- Indeks untuk query riwayat transaksi per user (dipakai di dashboard)
create index if not exists transactions_sender_id_idx on public.transactions(sender_id);
create index if not exists transactions_status_idx on public.transactions(status);

-- RLS: user hanya bisa lihat transaksi yang mereka kirim
alter table public.transactions enable row level security;

create policy "Users can only see their own transactions"
  on public.transactions for select
  using (auth.uid() = sender_id);

-- ---------------------------------------------------------------------------
-- Tabel: transaction_recipients
-- Detail penerima untuk setiap transaksi (relasi 1-to-many dengan transactions).
-- ---------------------------------------------------------------------------
create table if not exists public.transaction_recipients (
  id                      uuid primary key default gen_random_uuid(),
  transaction_id          uuid references public.transactions(id) on delete cascade not null,
  receiver_stellar_address text not null,  -- Stellar public key penerima (G...)
  percentage_bps          int not null,    -- basis points: 6000 = 60.00%
  amount                  numeric(20, 7) not null -- jumlah TESTUSD yang diterima
);

comment on table public.transaction_recipients is 'Detail penerima untuk setiap transaksi. 1 transaksi bisa punya 1-5 penerima.';

create index if not exists tx_recipients_transaction_id_idx on public.transaction_recipients(transaction_id);

-- RLS: ikuti akses dari tabel parent (transactions)
alter table public.transaction_recipients enable row level security;

create policy "Users can see recipients of their own transactions"
  on public.transaction_recipients for select
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.sender_id = auth.uid()
    )
  );
