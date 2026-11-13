// P10.3: halaman status.celvre.tech. Jalankan: node --test site/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cek, periksaSemua, ringkas, LAYANAN } from '../js/status.js';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = { supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'anon', appUrl: 'https://app.contoh' };

test('semua layanan normal', () => {
  assert.equal(ringkas({ app: true, auth: true, data: true }).tingkat, 'normal');
});

test('gangguan sebagian menyebut layanan yang turun', () => {
  const r = ringkas({ app: true, auth: false, data: true });
  assert.equal(r.tingkat, 'sebagian');
  assert.match(r.teks, /Sign-in/);
});

test('semua turun berarti tidak terjangkau dari perangkat ini', () => {
  assert.equal(ringkas({ app: false, auth: false, data: false }).tingkat, 'gangguan');
});

test('cek: galat jaringan atau status bukan 2xx berarti turun', async () => {
  assert.equal(await cek('https://a', { fetchImpl: async () => ({ ok: false }) }), false);
  assert.equal(await cek('https://a', { fetchImpl: async () => { throw new Error('x'); } }), false);
  assert.equal(await cek('https://a', { fetchImpl: async () => ({ ok: true }) }), true);
});

test('periksaSemua memakai kunci publik dan alamat kesehatan Supabase', async () => {
  const seen = [];
  const hasil = await periksaSemua(CONFIG, async (url, init) => {
    seen.push([url, init.headers?.apikey ?? null]);
    return { ok: true };
  });
  assert.deepEqual(hasil, { app: true, auth: true, data: true });
  assert.ok(seen.some(([u, k]) => u === 'https://x.supabase.co/auth/v1/health' && k === 'anon'));
  assert.equal(LAYANAN.length, 3);
});

test('Asisten WhatsApp tampil di luar Target Ketersediaan (P10.4)', () => {
  const html = readFileSync(join(SITE, 'status.html'), 'utf8');
  assert.match(html, /WhatsApp assistant/);
  assert.match(html, /Not covered by target/);
  assert.match(html, /99\.5%/);
  const insiden = JSON.parse(readFileSync(join(SITE, 'status-insiden.json'), 'utf8'));
  assert.ok(Array.isArray(insiden.insiden));
});
