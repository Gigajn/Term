// Tiket #42: harga situs pemasaran berasal dari data Paket Langganan.
// Jalankan: node --test site/tests
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah, toPlanCards, renderPlanCards, fetchPlans, PLANS_ENDPOINT,
} from '../js/pricing.js';

const rows = [
  { code: 'pro', name: 'Pro', modules: ['pos_checkout', 'kds'], includes_all_modules: false,
    max_outlets: 3, max_cashiers: 10, max_warehouses: 2, price_monthly: null, price_yearly: null, sort_order: 20 },
  { code: 'basic', name: 'Basic', modules: ['pos_checkout', 'catalog'], includes_all_modules: false,
    max_outlets: 1, max_cashiers: 2, max_warehouses: 1, price_monthly: '49999.00', price_yearly: null, sort_order: 10 },
  { code: 'founder', name: 'Pendiri', modules: [], includes_all_modules: true,
    max_outlets: null, max_cashiers: null, price_monthly: null, price_yearly: null, sort_order: 90 },
];

test('format Rupiah tanpa desimal dengan pemisah titik', () => {
  assert.equal(formatRupiah(49999), 'Rp49.999');
  assert.equal(formatRupiah('1250000.00'), 'Rp1.250.000');
  assert.equal(formatRupiah(0), 'Rp0');
});

test('kartu mengikuti data: urut sort_order, tanpa Pendiri', () => {
  const cards = toPlanCards(rows);
  assert.deepEqual(cards.map((c) => c.code), ['basic', 'pro']);
  assert.equal(cards[0].price, 'Rp49.999');
  assert.equal(cards[0].period, '/bulan');
});

test('Paket Gratis selamanya tidak dijual (ADR-0027)', () => {
  const free = { code: 'free', name: 'Gratis', modules: ['pos_checkout'], includes_all_modules: false,
    max_outlets: 1, max_cashiers: 1, price_monthly: '0', price_yearly: '0', sort_order: 5 };
  assert.deepEqual(toPlanCards([free, ...rows]).map((c) => c.code), ['basic', 'pro']);
});

test('paket tanpa harga tampil Segera hadir, bukan Rp0', () => {
  const pro = toPlanCards(rows).find((c) => c.code === 'pro');
  assert.equal(pro.price, null);
  assert.equal(pro.soon, true);
  assert.match(renderPlanCards([pro], { signupHref: 'daftar.html' }), /Segera hadir/);
});

test('harga berubah di data langsung berubah di kartu', () => {
  const changed = rows.map((r) => (r.code === 'basic' ? { ...r, price_monthly: 59000 } : r));
  assert.equal(toPlanCards(changed)[0].price, 'Rp59.000');
});

test('batas outlet dan Kasir dari data, NULL = tanpa batas', () => {
  const cards = toPlanCards([{ ...rows[0], max_outlets: null }]);
  assert.ok(cards[0].features.includes('Outlet tanpa batas'));
  assert.ok(cards[0].features.includes('Sampai 10 Kasir'));
});

test('batas gudang dari data, NULL = tanpa batas, kolom absen = tidak tampil', () => {
  const [basic, pro] = toPlanCards(rows);
  assert.ok(basic.features.includes('Sampai 1 gudang'));
  assert.ok(pro.features.includes('Sampai 2 gudang'));
  const unlimited = toPlanCards([{ ...rows[0], max_warehouses: null }]);
  assert.ok(unlimited[0].features.includes('Gudang tanpa batas'));
  const { max_warehouses, ...legacy } = rows[0];
  assert.ok(!toPlanCards([legacy])[0].features.some((f) => /gudang/i.test(f)));
  assert.match(PLANS_ENDPOINT, /max_warehouses/);
});

test('versi Inggris', () => {
  const [basic] = toPlanCards(rows, 'en');
  assert.equal(basic.period, '/month');
  assert.ok(basic.features.includes('Up to 1 outlet'));
  assert.match(renderPlanCards(toPlanCards(rows, 'en'), { signupHref: 'daftar.html', lang: 'en' }),
    /Coming soon/);
});

test('teks dari data di-escape', () => {
  const html = renderPlanCards(toPlanCards([{ ...rows[1], name: '<img src=x onerror=alert(1)>' }]),
    { signupHref: 'daftar.html' });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
});

test('tombol paket mengarah ke alur pendaftaran', () => {
  const html = renderPlanCards(toPlanCards(rows), { signupHref: 'daftar.html' });
  assert.equal((html.match(/href="daftar\.html"/g) || []).length, 2);
});

test('fetchPlans membaca view publik dengan kunci anon saja', async () => {
  let seen;
  const fake = async (url, opts) => {
    seen = { url, opts };
    return { ok: true, json: async () => rows };
  };
  const out = await fetchPlans({ supabaseUrl: 'https://x.supabase.co/', supabaseAnonKey: 'anon-k' }, fake);
  assert.equal(out.length, 3);
  assert.equal(seen.url, 'https://x.supabase.co' + PLANS_ENDPOINT);
  assert.match(seen.url, /\/rest\/v1\/public_subscription_plans\?/);
  assert.equal(seen.opts.headers.apikey, 'anon-k');
});

test('fetchPlans melempar galat saat HTTP gagal', async () => {
  const fake = async () => ({ ok: false, status: 401, json: async () => ({}) });
  await assert.rejects(fetchPlans({ supabaseUrl: 'https://x', supabaseAnonKey: 'k' }, fake), /401/);
});

// Tiket #253 (ADR-0025): setiap kode modul server punya label di situs dan di
// aplikasi, jadi daftar isi paket di situs sama dengan di aplikasi.
test('label modul situs dan aplikasi mencakup semua kode modul server', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const root = new URL('../../', import.meta.url);
  const migs = readdirSync(new URL('supabase/migrations/', root))
    .filter((f) => /^20\d{6}_\d+_.*\.sql$/.test(f)).sort();
  let codes = null;
  for (const f of migs) {
    const sql = readFileSync(new URL(`supabase/migrations/${f}`, root), 'utf8');
    const m = sql.match(/FUNCTION iam\.subscription_module_codes\(\)[\s\S]*?ARRAY\[([\s\S]*?)\]::text\[\]/);
    if (m) codes = [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  }
  assert.ok(codes && codes.includes('whatsapp_assistant') && codes.includes('vouchers'), 'kosakata modul terbaru terbaca');
  const dart = readFileSync(new URL('lib/features/subscription/presentation/widgets/module_lock.dart', root), 'utf8');
  const cards = toPlanCards([{ code: 'x', name: 'X', modules: codes, includes_all_modules: false,
    max_outlets: 1, max_cashiers: 1, price_monthly: 1, sort_order: 1 }], 'id');
  for (const c of codes) {
    assert.ok(dart.includes(`'${c}' =>`), `label aplikasi untuk ${c}`);
  }
  const shown = JSON.stringify(cards);
  for (const label of ['Stok opname', 'Pelanggan dan poin', 'Voucher', 'Laporan email', 'Asisten AI', 'Asisten WhatsApp']) {
    assert.ok(shown.includes(label), `situs menampilkan ${label}`);
  }
});
