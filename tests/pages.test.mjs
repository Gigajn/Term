// Tiket #42: halaman situs pemasaran (struktur, tautan, token, bahasa).
// Jalankan: node --test site/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN, ID } from '../js/i18n.js';
import { SITE_CONFIG, signupUrl, hasPricingSource } from '../js/config.js';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(SITE, f), 'utf8');
const PAGES = ['index.html', 'pricing.html', 'food-cost-calculator.html', 'signup.html', 'privacy.html', 'terms.html',
  'privacy-id.html', 'terms-id.html', 'delete-account.html', 'status.html'];
const MARKETING = ['index.html', 'pricing.html', 'food-cost-calculator.html'];
// Dokumen hukum: edisi English di terms/privacy.html, edisi Indonesia di *-id.html (#344).
const LEGAL = ['privacy-id.html', 'terms-id.html'];

test('semua halaman ada, bawaan Inggris (edisi hukum Indonesia di *-id), dan responsif', () => {
  for (const p of PAGES) {
    const html = read(p);
    assert.match(html, LEGAL.includes(p) ? /<html lang="id">/ : /<html lang="en">/, p);
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
  assert.match(read('gf-tokens.css'), /url\('fonts\/figtree-latin-wght\.woff2'\)/);
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
  const allowed = [SITE_CONFIG.contactEmail, SITE_CONFIG.privacyEmail];
  for (const e of allowed) assert.match(e, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/);
  for (const p of PAGES) {
    const html = read(p);
    assert.doesNotMatch(html, /@[\w.-]+@/, `${p}: email ganda`);
    for (const m of html.matchAll(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g)) assert.ok(allowed.includes(m[0]), `${p}: ${m[0]}`);
  }
});

test('tombol daftar mengarah ke alur Pendaftaran Mandiri Merchant', () => {
  for (const p of MARKETING) {
    const ctas = [...read(p).matchAll(/<a [^>]*data-cta="signup"[^>]*>/g)].map((m) => m[0]);
    assert.ok(ctas.length >= 2, `${p}: minimal CTA di hero/nav dan akhir halaman`);
    for (const a of ctas) assert.match(a, /href="signup\.html"/, p);
  }
  assert.match(read('signup.html'), /js\/signup\.js/);
  assert.match(read('js/signup.js'), /signupUrl\(/);
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
  assert.match(read('pricing.html'), /id="plans"/);
  assert.match(read('index.html'), /id="plans"/);
});

test('konfigurasi tidak memuat kunci service_role', () => {
  const cfg = read('js/config.js');
  assert.doesNotMatch(cfg, /service_role['"]?\s*[:=]|sb_secret_/);
  assert.equal(hasPricingSource({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'REPLACE_WITH_YOUR_ANON_KEY' }), false);
  assert.equal(hasPricingSource({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'abc' }), true);
});

test('teks HTML = EN, setiap kunci punya terjemahan Indonesia, tanpa kunci yatim', () => {
  const used = new Set();
  for (const p of MARKETING) {
    const html = read(p);
    for (const m of html.matchAll(/data-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/(?:title|p|h1|h2|h3|span|a|summary|button|dt)>/g)) {
      assert.equal(m[2], EN[m[1]], `${p}: teks ${m[1]} harus sama dengan EN`);
    }
    for (const m of html.matchAll(/data-i18n(?:-attr-[a-z-]+)?="([^"]+)"/g)) used.add(m[1]);
  }
  for (const k of used) assert.ok(EN[k] && ID[k], `kunci tanpa teks EN/ID: ${k}`);
  for (const k of Object.keys(EN)) assert.ok(used.has(k), `kunci tidak dipakai: ${k}`);
  assert.deepEqual(Object.keys(ID).sort(), Object.keys(EN).sort(), 'kunci EN dan ID sama');
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
  /\bsuper[ _-]?admin\b/i, /\bpemilik platform\b/i, /\bhutang\w*/i, /\butang\w*/i];
const FORBIDDEN_EN = [/\bkiosk\w*/i, /\btenant\w*/i, /\btier\w*/i, /\blicen[cs]\w*/i,
  /\bsuper[ _-]?admin\b/i, /\bplatform operator\b/i];

test('istilah mengikuti GLOSSARY', () => {
  for (const p of MARKETING) {
    const text = read(p).replace(/<[^>]+>/g, ' ');
    for (const re of FORBIDDEN_ID) assert.doesNotMatch(text, re, p);
  }
  for (const re of FORBIDDEN_ID) assert.doesNotMatch(Object.values(ID).join(' '), re, 'ID');
  const en = Object.values(EN).join(' ');
  for (const re of FORBIDDEN_EN) assert.doesNotMatch(en, re, 'EN');
});

// Tiket #250: merek lama tidak boleh terlihat di situs (HTML dan teks English).
test('situs memakai merek Snouvier, tanpa GIGFLOW', () => {
  for (const p of PAGES) assert.doesNotMatch(read(p), /gig\s?flow/i, p);
  for (const [k, v] of Object.entries(EN)) assert.doesNotMatch(v, /gig\s?flow/i, k);
  assert.match(read('index.html'), /Snouvier/);
});

// Tiket #252: printer dan batas mode luring dari satu konfigurasi bersama.
test('situs memakai teks printer dan luring dari celvre-publik.json', async () => {
  const cfg = JSON.parse(read('celvre-publik.json'));
  const html = read('index.html');
  assert.equal(cfg.teksLuring, 'Tanpa internet, Snouvier tetap bisa menerima tunai; QRIS dan laporan menunggu online');
  assert.equal(ID['device.offline.body'], cfg.teksLuring, 'teks luring Indonesia = JSON');
  assert.equal(ID['device.printer.body'], cfg.printerDidukung, 'teks printer Indonesia = JSON');
  assert.match(html, /data-i18n="device.offline.body" data-celvre="teksLuring">/);
  assert.match(html, /data-celvre-printers hidden/);
  const { printerLines } = await import('../js/public-config.js');
  assert.deepEqual(printerLines(cfg), cfg.printerTeruji.map((p) => `${p.merek} ${p.tipe} · ${p.koneksi ?? 'Bluetooth'} ${p.lebarMm ?? 58} mm`));
  assert.deepEqual(printerLines({ printerTeruji: [{ merek: 'Contoh', tipe: 'P58' }, {}] }), ['Contoh P58 · Bluetooth 58 mm']);
  assert.match(cfg.catatanPrinterLain, /tanpa jaminan/);
});
