// Tiket #340 (S5): Kalkulator HPP gratis di situs.
// Jalankan: node --test site/tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ingredientCost, summarize, roundUp, encodeRecipe, decodeRecipe,
  sampleRecipe, compatible, defaultCurrency,
} from '../js/food-cost.js';
import { TEXT } from '../js/food-cost-page.js';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(SITE, f), 'utf8');

const row = (o) => ({ name: 'x', price: '', packSize: '', packUnit: 'g', usage: '', useUnit: 'g', ...o });

test('biaya bahan mengonversi kg ke g dan L ke ml', () => {
  // 180.000 per kg, 18 g per porsi = 3.240.
  assert.equal(ingredientCost(row({ price: '180000', packSize: '1', packUnit: 'kg', usage: '18', useUnit: 'g' })), 3240);
  // 22.000 per 1 L, 150 ml = 3.300.
  assert.equal(ingredientCost(row({ price: '22000', packSize: '1', packUnit: 'l', usage: '150', useUnit: 'ml' })), 3300);
  // 85.000 per 50 pcs, 1 pcs = 1.700.
  assert.equal(ingredientCost(row({ price: '85000', packSize: '50', packUnit: 'pcs', usage: '1', useUnit: 'pcs' })), 1700);
  // Koma desimal ala Indonesia.
  assert.equal(ingredientCost(row({ price: '4,5', packSize: '1', packUnit: 'kg', usage: '500', useUnit: 'g' })), 2.25);
});

test('isian tidak masuk akal tidak dihitung', () => {
  assert.equal(ingredientCost(row({ price: '1000', packSize: '0', usage: '1' })), null, 'isi kemasan 0');
  assert.equal(ingredientCost(row({ price: '-1', packSize: '1', usage: '1' })), null, 'harga negatif');
  assert.equal(ingredientCost(row({ price: 'abc', packSize: '1', usage: '1' })), null, 'bukan angka');
  assert.equal(ingredientCost(row({ price: '1000', packSize: '1', packUnit: 'kg', usage: '1', useUnit: 'ml' })), null, 'massa vs volume');
  assert.equal(compatible('kg', 'g'), true);
  assert.equal(compatible('pcs', 'g'), false);
});

test('ringkasan: HPP, persen HPP, laba, dan saran harga untuk target margin', () => {
  const s = summarize(sampleRecipe('id'));
  // 3.240 + 3.300 + 900 + 1.700 = 9.140.
  assert.equal(s.cost, 9140);
  assert.equal(s.counted, 4);
  assert.equal(s.incomplete, 0);
  // Margin 70%: 9.140 / 0,3 = 30.466,67 dibulatkan ke atas ke 500 = 30.500.
  assert.equal(s.suggestedPrice, 30500);
  assert.ok(Math.abs(s.suggestedFoodCostPct - 29.967) < 0.01);
  // Harga jual 22.000: HPP 41,5%, laba 12.860.
  assert.ok(Math.abs(s.foodCostPct - 41.545) < 0.01);
  assert.equal(s.profit, 12860);
});

test('baris kosong diabaikan, baris setengah diisi dihitung sebagai belum lengkap', () => {
  const s = summarize({
    currency: 'USD', margin: '60', price: '',
    rows: [row({ price: '10', packSize: '1', packUnit: 'kg', usage: '100', useUnit: 'g' }),
      row({ name: '', price: '', packSize: '', usage: '' }), row({ price: '5' })],
  });
  assert.equal(s.cost, 1);
  assert.equal(s.incomplete, 1);
  assert.equal(s.suggestedPrice, 2.5);
  assert.equal(s.foodCostPct, null);
  assert.equal(s.profit, null);
});

test('target margin 100% atau lebih tidak menghasilkan saran harga', () => {
  const base = sampleRecipe('en');
  assert.equal(summarize({ ...base, margin: '100' }).suggestedPrice, null);
  assert.equal(summarize({ ...base, margin: '' }).marginOk, false);
});

test('pembulatan ke atas tanpa galat pecahan', () => {
  assert.equal(roundUp(30466.67, 500), 30500);
  assert.equal(roundUp(30000, 500), 30000);
  assert.ok(Math.abs(roundUp(2.5, 0.05) - 2.5) < 1e-9);
  assert.ok(Math.abs(roundUp(2.51, 0.05) - 2.55) < 1e-9);
});

test('tautan berbagi memuat seluruh resep dan tahan isian rusak', () => {
  const r = sampleRecipe('en');
  const code = encodeRecipe(r);
  assert.match(code, /^[\w-]+$/, 'aman untuk URL');
  assert.deepEqual(decodeRecipe(code), r);
  assert.equal(decodeRecipe('bukan-json'), null);
  assert.equal(decodeRecipe(''), null);
  const odd = decodeRecipe(encodeRecipe({ ...r, currency: 'XXX', rows: [{ ...r.rows[0], packUnit: 'ton' }] }));
  assert.equal(odd.currency, 'IDR');
  assert.equal(odd.rows[0].packUnit, 'g');
  // Teks Unicode tetap utuh.
  assert.equal(decodeRecipe(encodeRecipe({ ...r, title: 'Kopi susu ☕' })).title, 'Kopi susu ☕');
});

test('mata uang bawaan mengikuti bahasa, contoh resep dua bahasa', () => {
  assert.equal(defaultCurrency('id'), 'IDR');
  assert.equal(defaultCurrency('en'), 'USD');
  assert.equal(sampleRecipe('id').title, 'Es kopi susu');
  assert.equal(sampleRecipe('en').title, 'Iced latte');
});

test('teks dinamis kalkulator lengkap dalam Inggris dan Indonesia', () => {
  assert.deepEqual(Object.keys(TEXT.id).sort(), Object.keys(TEXT.en).sort());
  for (const k of Object.keys(TEXT.en)) assert.ok(TEXT.en[k] && TEXT.id[k], k);
});

test('halaman kalkulator: tanpa daftar, bisa dicetak dan dibagikan, ajakan menuju pendaftaran', () => {
  const html = read('food-cost-calculator.html');
  assert.match(html, /src="js\/food-cost-page\.js"/);
  assert.match(html, /id="calc-share"/);
  assert.match(html, /id="calc-print"/);
  assert.match(html, /data-i18n="calc.ctaTitle">Save this recipe in Snouvier/);
  assert.doesNotMatch(html, /\son[a-z]+="/, 'tanpa handler inline (CSP script-src self)');
  assert.match(read('site.css'), /@media print/);
  for (const p of ['index.html', 'pricing.html']) assert.match(read(p), /href="food-cost-calculator\.html"/, p);
  assert.doesNotMatch(read('js/food-cost-page.js'), /fetch\(/, 'tidak ada data yang dikirim');
});
