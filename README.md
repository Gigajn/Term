# Situs pemasaran Snouvier

Situs statis (tanpa build) sistem desain v2, D.10: beranda (`index.html`),
harga (`pricing.html`), daftar (`signup.html`), hapus akun
(`delete-account.html`), status, privasi, dan ketentuan. Bahasa bawaan Inggris
(teks di HTML); tombol **ID** mengganti ke Indonesia (kamus `ID` di
`js/i18n.js`). Privasi dan ketentuan tetap berbahasa Indonesia. Dipakai juga sebagai homepage, privacy policy, dan terms untuk Google
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
Semua tombol menuju `signup.html`, yang mengalihkan ke `{appUrl}/?daftar=1`.
Halaman login aplikasi membuka wizard Pendaftaran Mandiri Merchant satu kali
(`lib/features/auth/domain/signup_link.dart`).

## Pasang
Situs terbit di `https://snouvier-web.celvre.tech` dari repo terpisah
`Gigajn/snouvier-web`, karena satu repo hanya bisa tersambung ke satu proyek
Cloudflare Pages (repo ini sudah dipakai proyek aplikasi `cashier-pos`).

Folder `site/` tetap di repo ini, karena aplikasi ikut memakainya
(`celvre-publik.json`, `legal/dokumen-hukum.json`, dan aset halaman hukum).
Jangan jadikan git terpisah di dalam folder ini.

1. Di `js/config.js` isi `supabaseAnonKey` (kunci publishable atau anon, bukan
   kunci rahasia) dan `appUrl`.
2. Kirim isi `site/` ke repo situs: `scripts/terbitkan-situs-web.sh`. Ulangi
   setiap kali `site/` berubah dan sudah masuk ke `main`.
3. Cloudflare Pages proyek `snouvier-situs` (sekali): Connect to Git ›
   `Gigajn/snouvier-web`, branch `main`, framework preset
   None, build command
   `mkdir -p dist && cp -r *.html *.css *.json _headers _redirects fonts img js legal dist/`,
   output directory `dist`, custom domain
   `snouvier-web.celvre.tech`. Header keamanan ada di `_headers`; pengalihan alamat lama (`harga.html`, `daftar.html`, `hapus-akun.html`) ada di `_redirects`.
4. Google Auth Platform › **Branding**: home page `…/`, privacy `…/privacy.html`,
   terms `…/terms.html`, lalu **Publish app**.

## Tes
`node --test site/tests/*.test.mjs`; tes database: `supabase/tests/contract/public_pricing_contract_test.sql`.
