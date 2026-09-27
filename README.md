# Halaman publik untuk Google OAuth

Google mewajibkan **homepage** dan **privacy policy** agar aplikasi OAuth bisa
di-*Publish* (In production). Tiga halaman di folder ini cukup untuk itu.

1. Ganti `EMAIL-KONTAK@gmail.com` di ketiga file dengan email kontak toko.
2. Buat repo GitHub **publik** baru bernama `Gigajn.github.io`
   (github.com/new → Public → centang "Add a README").
3. *Add file › Upload files* → unggah `index.html`, `privacy.html`, `terms.html` → Commit.
4. Tunggu ±1 menit, cek https://gigajn.github.io/privacy.html terbuka.
5. Google Auth Platform › **Branding**:
   - Application home page: `https://gigajn.github.io/`
   - Privacy policy: `https://gigajn.github.io/privacy.html`
   - Terms of Service: `https://gigajn.github.io/terms.html`
   - Authorised domains: `gigajn.github.io` **dan** `<PROJECT-REF>.supabase.co`
   - Save → **Audience** › **Publish app**.
