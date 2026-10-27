// Tiket #42: halaman situs pemasaran (struktur, tautan, token, bahasa).
// Jalankan: node --test site/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN } from '../js/i18n.js';
import { SITE_CONFIG, signupUrl, hasPricingSource } from '../js/config.js';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(SITE, f), 'utf8');
const PAGES = ['index.html', 'harga.html', 'daftar.html', 'privacy.html', 'terms.html'];
const MARKETING = ['index.html', 'harga.html'];

test('semua halaman ada, berbahasa Indonesia, dan responsif', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.match(html, /<html lang="id">/, p);
    assert.match(html, /<meta name="viewport" content="width=device-width,\s*initial-scale=1">/, p);
    assert.match(html, /<title[^>]*>[^<]+<\/title>/, p);
    assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/, `${p}: zoom tidak boleh dimatikan`);
  }
});

test('memakai token --gf-* dan font self-host, tanpa font dari CDN', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.match(html, /href="gf-tokens\.css"/, p);
    assert.match(html, /href="site\.css"/, p);
    assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|<style/, `${p}: gaya hanya dari site.css`);
  }
  assert.match(read('gf-tokens.css'), /url\('fonts\/plus-jakarta-sans-latin-wght\.woff2'\)/);
});

test('site.css tidak memakai warna mentah, hanya token', () => {
  const css = read('site.css');
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'warna hex harus lewat var(--gf-*)');
  assert.doesNotMatch(css, /\brgba?\(|\bhsla?\(/, 'warna rgb/hsl harus lewat var(--gf-*)');
  assert.match(css, /font-family:\s*var\(--gf-font-sans\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test('privasi dan ketentuan tetap bisa diakses dari setiap halaman', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.match(html, /href="privacy\.html"/, p);
    assert.match(html, /href="terms\.html"/, p);
  }
});

test('email kontak tidak rusak', () => {
  const email = SITE_CONFIG.contactEmail;
  assert.match(email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/);
  for (const p of PAGES) {
    const html = read(p);
    assert.doesNotMatch(html, /@[\w.-]+@/, `${p}: email ganda`);
    for (const m of html.matchAll(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g)) assert.equal(m[0], email, p);
  }
});

test('tombol daftar mengarah ke alur Pendaftaran Mandiri Merchant', () => {
  for (const p of MARKETING) {
    const ctas = [...read(p).matchAll(/<a [^>]*data-cta="daftar"[^>]*>/g)].map((m) => m[0]);
    assert.ok(ctas.length >= 2, `${p}: minimal CTA di hero/nav dan akhir halaman`);
    for (const a of ctas) assert.match(a, /href="daftar\.html"/, p);
  }
  const daftar = read('daftar.html');
  assert.match(daftar, /js\/daftar\.js/);
  assert.match(read('js/daftar.js'), /signupUrl\(/);
  const url = new URL(signupUrl('https://app.contoh.id'));
  assert.equal(url.origin, 'https://app.contoh.id');
  assert.equal(url.searchParams.get('daftar'), '1');
});

test('harga tidak ditulis di situs: satu sumber di data Paket Langganan', () => {
  const files = [...PAGES, 'site.css',
    ...readdirSync(join(SITE, 'js')).map((f) => `js/${f}`)];
  for (const f of files) {
    assert.doesNotMatch(read(f), /Rp\s?\d|\b49[.,]?999\b/, `${f}: harga harus dari data`);
  }
  assert.match(read('harga.html'), /id="plans"/);
  assert.match(read('index.html'), /id="plans"/);
});

test('konfigurasi tidak memuat kunci service_role', () => {
  const cfg = read('js/config.js');
  assert.doesNotMatch(cfg, /service_role['"]?\s*[:=]|sb_secret_/);
  assert.equal(hasPricingSource({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'REPLACE_WITH_YOUR_ANON_KEY' }), false);
  assert.equal(hasPricingSource({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'abc' }), true);
});

test('setiap teks data-i18n punya terjemahan Inggris, tanpa kunci yatim', () => {
  const used = new Set();
  for (const p of MARKETING) {
    for (const m of read(p).matchAll(/data-i18n(?:-attr-[a-z-]+)?="([^"]+)"/g)) used.add(m[1]);
  }
  for (const k of used) assert.ok(EN[k], `kunci tanpa terjemahan: ${k}`);
  for (const k of Object.keys(EN)) assert.ok(used.has(k), `kunci tidak dipakai: ${k}`);
  for (const p of MARKETING) assert.match(read(p), /data-lang-toggle/, `${p}: pilihan bahasa`);
});

test('judul berurutan: satu h1 per halaman', () => {
  for (const p of PAGES) {
    assert.equal((read(p).match(/<h1[\s>]/g) || []).length, 1, p);
  }
});

test('tanpa emoji sebagai ikon; ikon SVG dekoratif disembunyikan', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.doesNotMatch(html, /\p{Extended_Pictographic}/u, p);
    for (const m of html.matchAll(/<svg\b[^>]*>/g)) {
      assert.match(m[0], /aria-hidden="true"|role="img"/, `${p}: ${m[0]}`);
    }
  }
});

// Sama dengan test/core/glossary_terms_test.dart (GLOSSARY.md, baris _Avoid_).
const FORBIDDEN_ID = [/\bkios\w*/i, /\btenant\w*/i, /\btier\w*/i, /\blisensi\w*/i,
  /\bsuper[ _-]?admin\b/i, /\bpemilik platform\b/i, /\bhutang\w*/i, /\butang\w*/i, /\bkasbon\w*/i];
const FORBIDDEN_EN = [/\bkiosk\w*/i, /\btenant\w*/i, /\btier\w*/i, /\blicen[cs]\w*/i,
  /\bsuper[ _-]?admin\b/i, /\bplatform operator\b/i];

test('istilah mengikuti GLOSSARY', () => {
  for (const p of MARKETING) {
    const text = read(p).replace(/<[^>]+>/g, ' ');
    for (const re of FORBIDDEN_ID) assert.doesNotMatch(text, re, p);
  }
  const en = Object.values(EN).join(' ');
  for (const re of FORBIDDEN_EN) assert.doesNotMatch(en, re, 'EN');
});
