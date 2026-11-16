// Kalkulator HPP (food cost): logika murni tanpa DOM, supaya bisa dites
// dengan node --test. Halaman: food-cost-calculator.html, UI: food-cost-page.js.
//
// Satu resep = beberapa bahan. Tiap bahan: harga beli satu kemasan, isi
// kemasan, dan takaran per porsi. Satuan massa (g, kg) dan volume (ml, L)
// dikonversi; "pcs" berdiri sendiri.

export const UNITS = {
  g: { dim: 'mass', factor: 1 },
  kg: { dim: 'mass', factor: 1000 },
  ml: { dim: 'volume', factor: 1 },
  l: { dim: 'volume', factor: 1000 },
  pcs: { dim: 'count', factor: 1 },
};

/** Mata uang yang ditawarkan; langkah pembulatan harga jual yang wajar. */
export const CURRENCIES = {
  IDR: { step: 500 },
  USD: { step: 0.05 },
  EUR: { step: 0.05 },
  GBP: { step: 0.05 },
  SGD: { step: 0.05 },
  MYR: { step: 0.1 },
  AUD: { step: 0.05 },
  PHP: { step: 1 },
  THB: { step: 1 },
  JPY: { step: 10 },
};

export const DEFAULT_MARGIN = 70;

const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v !== 'string') return NaN;
  const t = v.trim().replace(/\s/g, '').replace(',', '.');
  return t === '' ? NaN : Number(t);
};

/** Satuan takaran harus satu dimensi dengan satuan kemasan. */
export function compatible(packUnit, useUnit) {
  const a = UNITS[packUnit];
  const b = UNITS[useUnit];
  return Boolean(a && b && a.dim === b.dim);
}

/**
 * Biaya satu bahan per porsi. `null` bila isian belum lengkap atau tidak
 * masuk akal (isi kemasan 0, satuan berbeda dimensi, angka negatif).
 */
export function ingredientCost(row) {
  const price = num(row.price);
  const pack = num(row.packSize);
  const use = num(row.usage);
  if (![price, pack, use].every(Number.isFinite)) return null;
  if (price < 0 || pack <= 0 || use < 0) return null;
  if (!compatible(row.packUnit, row.useUnit)) return null;
  const packBase = pack * UNITS[row.packUnit].factor;
  const useBase = use * UNITS[row.useUnit].factor;
  return (price / packBase) * useBase;
}

/** Bulatkan ke atas ke kelipatan `step` (harga jual tidak pernah turun). */
export function roundUp(value, step) {
  if (!(step > 0)) return value;
  // Toleransi pecahan float, mis. 3.0000000004 tetap 3.
  return Math.ceil(value / step - 1e-9) * step;
}

/**
 * Ringkasan resep.
 * - cost: HPP per porsi
 * - foodCostPct: persen HPP terhadap harga jual saat ini (bila diisi)
 * - suggestedPrice: harga jual agar margin kotor = target margin, dibulatkan
 * - incomplete: jumlah baris bahan yang belum bisa dihitung
 */
export function summarize(state) {
  const rows = state.rows ?? [];
  let cost = 0;
  let counted = 0;
  let incomplete = 0;
  for (const r of rows) {
    const blank = [r.name, r.price, r.packSize, r.usage].every((v) => String(v ?? '').trim() === '');
    if (blank) continue;
    const c = ingredientCost(r);
    if (c === null) incomplete++;
    else { cost += c; counted++; }
  }
  const step = CURRENCIES[state.currency]?.step ?? 0.01;
  const margin = num(state.margin);
  const marginOk = Number.isFinite(margin) && margin >= 0 && margin < 100;
  const suggestedRaw = counted && marginOk ? cost / (1 - margin / 100) : null;
  const suggestedPrice = suggestedRaw === null ? null : roundUp(suggestedRaw, step);
  const price = num(state.price);
  const priceOk = Number.isFinite(price) && price > 0;
  return {
    cost: counted ? cost : null,
    counted,
    incomplete,
    marginOk,
    suggestedPrice,
    suggestedFoodCostPct: suggestedPrice ? (cost / suggestedPrice) * 100 : null,
    foodCostPct: counted && priceOk ? (cost / price) * 100 : null,
    profit: counted && priceOk ? price - cost : null,
  };
}

// ── Tautan berbagi: resep disimpan di #r=<base64url JSON> ─────────────
// Tidak ada data yang dikirim ke server; tautan memuat seluruh resep.

const KEYS = ['name', 'price', 'packSize', 'packUnit', 'usage', 'useUnit'];
const MAX_ROWS = 40;
const MAX_TEXT = 80;

function toB64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

const clip = (v) => String(v ?? '').slice(0, MAX_TEXT);

export function encodeRecipe(state) {
  const compact = {
    t: clip(state.title),
    c: state.currency,
    m: clip(state.margin),
    p: clip(state.price),
    r: (state.rows ?? []).slice(0, MAX_ROWS).map((r) => KEYS.map((k) => clip(r[k]))),
  };
  return toB64Url(JSON.stringify(compact));
}

/** Membaca tautan berbagi. Isian rusak atau asing menghasilkan `null`. */
export function decodeRecipe(s) {
  try {
    const o = JSON.parse(fromB64Url(String(s)));
    if (!o || typeof o !== 'object' || !Array.isArray(o.r)) return null;
    const rows = o.r.slice(0, MAX_ROWS).filter(Array.isArray).map((a) => {
      const row = Object.fromEntries(KEYS.map((k, i) => [k, clip(a[i])]));
      if (!UNITS[row.packUnit]) row.packUnit = 'g';
      if (!UNITS[row.useUnit]) row.useUnit = row.packUnit;
      return row;
    });
    return {
      title: clip(o.t),
      currency: CURRENCIES[o.c] ? o.c : 'IDR',
      margin: clip(o.m) || String(DEFAULT_MARGIN),
      price: clip(o.p),
      rows,
    };
  } catch {
    return null;
  }
}

/** Mata uang bawaan: dari bahasa halaman (id → IDR), selain itu USD. */
export function defaultCurrency(lang) {
  return lang === 'id' ? 'IDR' : 'USD';
}

export function emptyRow(unit = 'g') {
  return { name: '', price: '', packSize: '', packUnit: unit, usage: '', useUnit: unit };
}

/** Contoh resep untuk tampilan pertama: es kopi susu 1 gelas. */
export function sampleRecipe(lang) {
  const id = lang === 'id';
  const idr = defaultCurrency(lang) === 'IDR';
  return {
    title: id ? 'Es kopi susu' : 'Iced latte',
    currency: defaultCurrency(lang),
    margin: String(DEFAULT_MARGIN),
    price: idr ? '22000' : '4.50',
    rows: [
      { name: id ? 'Biji kopi' : 'Coffee beans', price: idr ? '180000' : '18', packSize: '1', packUnit: 'kg', usage: '18', useUnit: 'g' },
      { name: id ? 'Susu segar' : 'Fresh milk', price: idr ? '22000' : '1.60', packSize: '1', packUnit: 'l', usage: '150', useUnit: 'ml' },
      { name: id ? 'Gula aren cair' : 'Palm sugar syrup', price: idr ? '45000' : '6', packSize: '1', packUnit: 'l', usage: '20', useUnit: 'ml' },
      { name: id ? 'Gelas dan tutup' : 'Cup and lid', price: idr ? '85000' : '9', packSize: '50', packUnit: 'pcs', usage: '1', useUnit: 'pcs' },
    ],
  };
}
