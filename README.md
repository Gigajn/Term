# Situs pemasaran GIGFLOW

Situs statis (tanpa build) sistem desain v2, D.10: beranda, harga, daftar,
privasi, dan ketentuan. Bahasa utama Indonesia; tombol **EN** mengganti ke
Inggris. Dipakai juga sebagai homepage, privacy policy, dan terms untuk Google
OAuth.

## Berkas
- `gf-tokens.css`: token `--gf-*` dan font self-host. Dihasilkan dari `GfTokens`,
  jangan diedit tangan: `UPDATE_GF_CSS=1 flutter test test/core/theme/gf_css_tokens_test.dart`.
- `site.css`: semua gaya; hanya memakai token (tes menolak warna mentah).
- `js/config.js`: **satu-satunya pengaturan**: URL dan kunci anon Supabase, alamat
  aplikasi, email kontak.
- `js/pricing.js`: kartu harga dari data. `js/i18n.js`: terjemahan Inggris.

## Harga: satu sumber
Angka harga tidak ada di situs. Situs membaca view `public.public_subscription_plans`
(migrasi 370) dengan kunci anon; isinya Paket Langganan yang `is_public`. Ubah harga
di Pusat Komando (tabel `iam.subscription_plans`), situs ikut berubah tanpa deploy.
Harga awal: Basic Rp49.999 per bulan; Pro dan Business tampil "Segera hadir" sampai
harganya diisi.

## Tombol daftar
Semua tombol menuju `daftar.html`, yang mengalihkan ke `{appUrl}/?daftar=1`.
Halaman login aplikasi membuka wizard Pendaftaran Mandiri Merchant satu kali
(`lib/features/auth/domain/signup_link.dart`).

## Pasang
1. Di `js/config.js` isi `supabaseAnonKey` (kunci **anon**, bukan service_role) dan `appUrl`.
2. Unggah seluruh isi folder `site/` (kecuali `tests/`) ke hosting statis, mis. repo
   `Gigajn.github.io`.
3. Google Auth Platform › **Branding**: home page `…/`, privacy `…/privacy.html`,
   terms `…/terms.html`, lalu **Publish app**.

## Tes
`node --test site/tests/*.test.mjs`; tes database: `supabase/tests/contract/public_pricing_contract_test.sql`.
