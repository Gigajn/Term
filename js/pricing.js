// Harga Paket Langganan untuk situs pemasaran (tiket #42).
//
// Sumber tunggal harga: view public.public_subscription_plans (migrasi 370),
// dibaca dengan kunci anon. Modul ini tidak menyimpan angka harga apa pun;
// paket tanpa harga tampil "Segera hadir".

export const PLANS_ENDPOINT = '/rest/v1/public_subscription_plans' +
  '?select=code,name,modules,includes_all_modules,max_outlets,max_cashiers,max_warehouses,' +
  'price_monthly,price_yearly,sort_order&order=sort_order.asc';

const MODULE_LABELS = {
  id: {
    pos_checkout: 'Kasir Outlet: tunai, QRIS, dan Bon',
    catalog: 'Katalog menu dan resep',
    standard_reports: 'Laporan harian, mingguan, bulanan',
    dynamic_qris: 'QRIS dinamis',
    kds: 'Layar Dapur',
    multi_warehouse: 'Banyak gudang',
    warehouse_transfer: 'Kirim stok gudang ke outlet',
    bonds: 'Bon pelanggan dan Batas Bon',
    cogs_reports: 'Laporan HPP',
    self_order: 'Self-Order pelanggan',
    multi_brand: 'Banyak brand',
    white_label: 'Tampilan bermerek sendiri',
    webhooks: 'Webhook integrasi',
  },
  en: {
    pos_checkout: 'Staffed checkout: cash, QRIS, and Bon',
    catalog: 'Menu and recipe catalog',
    standard_reports: 'Daily, weekly, monthly reports',
    dynamic_qris: 'Dynamic QRIS',
    kds: 'Kitchen display (KDS)',
    multi_warehouse: 'Multiple warehouses',
    warehouse_transfer: 'Warehouse to outlet transfers',
    bonds: 'Customer Bon and credit limits',
    cogs_reports: 'Cost of goods reports',
    self_order: 'Customer Self-Order',
    multi_brand: 'Multiple brands',
    white_label: 'Your own branding',
    webhooks: 'Integration webhooks',
  },
};

const TEXT = {
  id: {
    perMonth: '/bulan',
    perYear: (p) => `atau ${p} per tahun`,
    soon: 'Segera hadir',
    soonNote: 'Harga diumumkan segera.',
    outlets: (n) => (n == null ? 'Outlet tanpa batas' : `Sampai ${n} outlet`),
    cashiers: (n) => (n == null ? 'Kasir tanpa batas' : `Sampai ${n} Kasir`),
    warehouses: (n) => (n == null ? 'Gudang tanpa batas' : `Sampai ${n} gudang`),
    allModules: 'Semua modul',
    choose: (name) => `Pilih ${name}`,
    popular: 'Paling laris',
  },
  en: {
    perMonth: '/month',
    perYear: (p) => `or ${p} per year`,
    soon: 'Coming soon',
    soonNote: 'Pricing will be announced soon.',
    outlets: (n) => (n == null ? 'Unlimited outlets' : `Up to ${n} outlet${n === 1 ? '' : 's'}`),
    cashiers: (n) => (n == null ? 'Unlimited cashiers' : `Up to ${n} cashier${n === 1 ? '' : 's'}`),
    warehouses: (n) => (n == null ? 'Unlimited warehouses' : `Up to ${n} warehouse${n === 1 ? '' : 's'}`),
    allModules: 'All modules',
    choose: (name) => `Choose ${name}`,
    popular: 'Most popular',
  },
};

/** Format Rupiah: awalan Rp, angka bulat, pemisah ribuan titik, tanpa desimal. */
export function formatRupiah(value) {
  const n = Math.round(Number(value));
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}Rp${digits}`;
}

function priceOf(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Baris view → data kartu yang siap ditampilkan. */
export function toPlanCards(rows, lang = 'id') {
  const t = TEXT[lang] || TEXT.id;
  const labels = MODULE_LABELS[lang] || MODULE_LABELS.id;
  const plans = [...(rows || [])]
    .filter((r) => r && r.code && r.code !== 'founder')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  // Sorotan "Paling laris" untuk paket tengah bila ada tiga paket atau lebih.
  const popular = plans.length >= 3 ? plans[Math.floor(plans.length / 2)].code : null;
  return plans.map((r) => {
    const monthly = priceOf(r.price_monthly);
    const yearly = priceOf(r.price_yearly);
    const features = [t.outlets(r.max_outlets ?? null), t.cashiers(r.max_cashiers ?? null)];
    // Kolom batas gudang belum ada di data lama: jangan menampilkan "tanpa batas" palsu.
    if ('max_warehouses' in r) features.push(t.warehouses(r.max_warehouses ?? null));
    if (r.includes_all_modules) features.push(t.allModules);
    else for (const m of r.modules || []) if (labels[m]) features.push(labels[m]);
    return {
      code: r.code,
      name: r.name,
      price: monthly == null ? null : formatRupiah(monthly),
      period: monthly == null ? '' : t.perMonth,
      yearly: monthly != null && yearly != null ? t.perYear(formatRupiah(yearly)) : '',
      note: monthly == null ? t.soonNote : '',
      soon: monthly == null,
      popular: r.code === popular,
      features,
      cta: t.choose(r.name),
    };
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const CHECK = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
  '<path d="M9.55 17.65 4.4 12.5l1.4-1.4 3.75 3.75 8.65-8.65 1.4 1.4z"/></svg>';

/** HTML kartu paket. Semua teks di-escape. */
export function renderPlanCards(cards, { signupHref, lang = 'id' } = {}) {
  const t = TEXT[lang] || TEXT.id;
  return cards.map((c) => `
<article class="plan${c.popular ? ' plan--popular' : ''}" aria-labelledby="plan-${esc(c.code)}">
  ${c.popular ? `<p class="plan__badge">${esc(t.popular)}</p>` : ''}
  <h3 class="plan__name" id="plan-${esc(c.code)}">${esc(c.name)}</h3>
  <p class="plan__price">${c.soon
    ? `<span class="plan__amount plan__amount--soon">${esc(t.soon)}</span>`
    : `<span class="plan__amount gf-num">${esc(c.price)}</span><span class="plan__period">${esc(c.period)}</span>`}</p>
  <p class="plan__sub gf-num">${esc(c.yearly || c.note)}</p>
  <ul class="plan__features">${c.features.map((f) => `<li>${CHECK}<span>${esc(f)}</span></li>`).join('')}</ul>
  <a class="btn ${c.popular ? 'btn--primary' : 'btn--secondary'} plan__cta" href="${esc(signupHref)}">${esc(c.cta)}</a>
</article>`).join('');
}

/** Ambil baris paket dari Data API. Melempar galat bila gagal. */
export async function fetchPlans(config, fetchImpl = globalThis.fetch) {
  const res = await fetchImpl(config.supabaseUrl.replace(/\/$/, '') + PLANS_ENDPOINT, {
    headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('format tidak dikenal');
  return rows;
}
