// Halaman Kalkulator HPP: bahasa, baris bahan, hasil, tautan berbagi, cetak.
// Logika hitung ada di food-cost.js; berkas ini hanya mengurus DOM.
import { initLang } from './i18n.js';
import {
  CURRENCIES, UNITS, compatible, decodeRecipe, defaultCurrency, emptyRow,
  encodeRecipe, ingredientCost, sampleRecipe, summarize,
} from './food-cost.js';

export const TEXT = {
  en: {
    ingredient: 'Ingredient',
    namePh: 'e.g. Fresh milk',
    price: 'Purchase price',
    packSize: 'Package size',
    packUnit: 'Package unit',
    usage: 'Amount per serving',
    useUnit: 'Serving unit',
    cost: 'Cost per serving',
    remove: 'Remove ingredient',
    removeNamed: 'Remove {0}',
    incomplete: '{0} ingredient(s) are incomplete and not yet counted.',
    unitMismatch: 'Choose a unit of the same kind as the package.',
    none: 'Enter at least one ingredient to see the result.',
    copied: 'Link copied. Anyone with the link can open this recipe.',
    copyFailed: 'Copy this link to share the recipe:',
    resetConfirm: 'Start a new, empty recipe?',
  },
  id: {
    ingredient: 'Bahan',
    namePh: 'mis. Susu segar',
    price: 'Harga beli',
    packSize: 'Isi kemasan',
    packUnit: 'Satuan kemasan',
    usage: 'Takaran per porsi',
    useUnit: 'Satuan takaran',
    cost: 'Biaya per porsi',
    remove: 'Hapus bahan',
    removeNamed: 'Hapus {0}',
    incomplete: '{0} bahan belum lengkap dan belum dihitung.',
    unitMismatch: 'Pilih satuan yang sejenis dengan satuan kemasan.',
    none: 'Isi minimal satu bahan untuk melihat hasilnya.',
    copied: 'Tautan tersalin. Siapa pun yang memiliki tautan ini dapat membuka resep ini.',
    copyFailed: 'Salin tautan ini untuk membagikan resep:',
    resetConfirm: 'Mulai resep baru yang kosong?',
  },
};

const UNIT_LABEL = { g: 'g', kg: 'kg', ml: 'ml', l: 'L', pcs: 'pcs' };

const $ = (id) => document.getElementById(id);
let lang = 'en';
let state = null;
const t = (k, ...a) => TEXT[lang][k].replace(/\{(\d)\}/g, (_, i) => a[i] ?? '');

function money(v) {
  if (v === null || !Number.isFinite(v)) return '–';
  const big = Math.abs(v) >= 100;
  return new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: state.currency,
    maximumFractionDigits: big ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(v);
}

const pct = (v) => (v === null || !Number.isFinite(v) ? '–'
  : `${new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { maximumFractionDigits: 1 }).format(v)}%`);

function field(label, input) {
  const wrap = document.createElement('label');
  wrap.className = 'calc__field';
  const span = document.createElement('span');
  span.textContent = label;
  wrap.append(span, input);
  return wrap;
}

function textInput(value, { numeric = false, placeholder = '' } = {}) {
  const i = document.createElement('input');
  i.type = 'text';
  i.value = value;
  if (numeric) { i.inputMode = 'decimal'; i.autocomplete = 'off'; }
  if (placeholder) i.placeholder = placeholder;
  return i;
}

function unitSelect(value, allowed) {
  const s = document.createElement('select');
  for (const u of allowed) {
    const o = document.createElement('option');
    o.value = u;
    o.textContent = UNIT_LABEL[u];
    o.selected = u === value;
    s.append(o);
  }
  return s;
}

const sameDim = (u) => Object.keys(UNITS).filter((k) => UNITS[k].dim === UNITS[u].dim);

function renderRows() {
  const list = $('calc-rows');
  list.replaceChildren();
  state.rows.forEach((row, idx) => {
    const li = document.createElement('li');
    li.className = 'calc__row';

    const name = textInput(row.name, { placeholder: t('namePh') });
    const price = textInput(row.price, { numeric: true });
    const pack = textInput(row.packSize, { numeric: true });
    const packUnit = unitSelect(row.packUnit, Object.keys(UNITS));
    const usage = textInput(row.usage, { numeric: true });
    const useUnit = unitSelect(row.useUnit, sameDim(row.packUnit));
    const cost = document.createElement('output');
    cost.className = 'calc__cost';
    const hint = document.createElement('p');
    hint.className = 'calc__hint';
    hint.hidden = true;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn--secondary btn--sm calc__del';
    del.textContent = '×';
    del.setAttribute('aria-label', row.name ? t('removeNamed', row.name) : t('remove'));
    del.addEventListener('click', () => {
      state.rows.splice(idx, 1);
      if (!state.rows.length) state.rows.push(emptyRow());
      renderRows();
      update();
    });

    const paint = () => {
      const c = ingredientCost(row);
      cost.textContent = c === null ? '–' : money(c);
      const mismatch = !compatible(row.packUnit, row.useUnit);
      hint.hidden = !mismatch;
      hint.textContent = mismatch ? t('unitMismatch') : '';
    };
    const bind = (el, key, ev = 'input') => el.addEventListener(ev, () => {
      row[key] = el.value;
      if (key === 'name') del.setAttribute('aria-label', row.name ? t('removeNamed', row.name) : t('remove'));
      if (key === 'packUnit' && !compatible(row.packUnit, row.useUnit)) {
        row.useUnit = row.packUnit;
        renderRows();
      }
      paint();
      update();
    });
    bind(name, 'name');
    bind(price, 'price');
    bind(pack, 'packSize');
    bind(packUnit, 'packUnit', 'change');
    bind(usage, 'usage');
    bind(useUnit, 'useUnit', 'change');

    li.append(
      field(t('ingredient'), name),
      field(t('price'), price),
      field(t('packSize'), pack),
      field(t('packUnit'), packUnit),
      field(t('usage'), usage),
      field(t('useUnit'), useUnit),
      field(t('cost'), cost),
      del,
      hint,
    );
    paint();
    list.append(li);
  });
}

function update() {
  const s = summarize(state);
  $('res-cost').textContent = money(s.cost);
  $('res-suggested').textContent = money(s.suggestedPrice);
  $('res-suggested-pct').textContent = pct(s.suggestedFoodCostPct);
  $('res-pct').textContent = pct(s.foodCostPct);
  $('res-profit').textContent = money(s.profit);
  const note = $('res-note');
  note.textContent = !s.counted ? t('none') : s.incomplete ? t('incomplete', s.incomplete) : '';
  note.hidden = note.textContent === '';
  $('print-title').textContent = state.title;
  const url = new URL(window.location.href);
  url.hash = `r=${encodeRecipe(state)}`;
  window.history.replaceState(null, '', url);
}

function fillHeader() {
  $('calc-title').value = state.title;
  $('calc-currency').value = state.currency;
  $('calc-price').value = state.price;
  $('calc-margin').value = state.margin;
}

function fromHash() {
  const m = window.location.hash.match(/^#r=([\w-]+)$/);
  return m ? decodeRecipe(m[1]) : null;
}

async function share() {
  const link = window.location.href;
  const msg = $('share-msg');
  try {
    await navigator.clipboard.writeText(link);
    msg.textContent = t('copied');
  } catch {
    msg.textContent = `${t('copyFailed')} ${link}`;
  }
  msg.hidden = false;
}

function init() {
  const sel = $('calc-currency');
  for (const code of Object.keys(CURRENCIES)) {
    const o = document.createElement('option');
    o.value = code;
    o.textContent = code;
    sel.append(o);
  }
  lang = initLang(document, (next) => {
    lang = next;
    renderRows();
    update();
  });
  state = fromHash() ?? sampleRecipe(lang);
  if (!state.rows.length) state.rows.push(emptyRow());
  fillHeader();

  // Enter di isian tidak memuat ulang halaman.
  document.querySelector('.calc__form').addEventListener('submit', (e) => e.preventDefault());
  $('calc-title').addEventListener('input', (e) => { state.title = e.target.value; update(); });
  sel.addEventListener('change', (e) => { state.currency = e.target.value; renderRows(); update(); });
  $('calc-price').addEventListener('input', (e) => { state.price = e.target.value; update(); });
  $('calc-margin').addEventListener('input', (e) => { state.margin = e.target.value; update(); });
  $('calc-add').addEventListener('click', () => {
    state.rows.push(emptyRow());
    renderRows();
    update();
    const inputs = $('calc-rows').querySelectorAll('.calc__row:last-child input');
    inputs[0]?.focus();
  });
  $('calc-share').addEventListener('click', share);
  $('calc-print').addEventListener('click', () => window.print());
  $('calc-reset').addEventListener('click', () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('resetConfirm'))) return;
    state = { title: '', currency: state.currency || defaultCurrency(lang), margin: state.margin, price: '', rows: [emptyRow()] };
    fillHeader();
    renderRows();
    update();
  });

  $('calc-app').hidden = false;
  renderRows();
  update();
}

if (typeof document !== 'undefined' && document.getElementById('calc-app')) init();
