// Beranda dan halaman harga: bahasa, lalu kartu Paket Langganan dari data.
import { SITE_CONFIG, hasPricingSource } from './config.js';
import { initLang } from './i18n.js';
import { fetchPlans, toPlanCards, renderPlanCards } from './pricing.js';
import { initReveal } from './reveal.js';
import { loadPublicConfig, applyPublicConfig } from './public-config.js';

const STATUS = {
  id: {
    unavailable: 'Harga belum dapat dimuat saat ini. Silakan coba lagi sebentar atau hubungi kami untuk penawaran.',
    retry: 'Coba lagi',
    empty: 'Paket sedang kami siapkan. Silakan hubungi kami untuk penawaran.',
  },
  en: {
    unavailable: 'We are unable to load pricing at the moment. Please try again shortly or contact us for a quote.',
    retry: 'Try again',
    empty: 'Our plans are being finalized. Please contact us for a quote.',
  },
};

const box = document.getElementById('plans');
let rows = null;
let lang = 'en';

function showStatus(kind) {
  const t = STATUS[lang];
  const p = document.createElement('div');
  p.className = 'plans__status';
  const msg = document.createElement('p');
  msg.textContent = t[kind];
  const mail = document.createElement('p');
  const a = document.createElement('a');
  a.href = `mailto:${SITE_CONFIG.contactEmail}`;
  a.textContent = SITE_CONFIG.contactEmail;
  mail.append(a);
  p.append(msg, mail);
  if (kind === 'unavailable') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--secondary';
    b.textContent = t.retry;
    b.addEventListener('click', load);
    p.append(b);
  }
  box.replaceChildren(p);
  box.setAttribute('aria-busy', 'false');
}

function render() {
  if (!box || !rows) return;
  const cards = toPlanCards(rows, lang);
  if (!cards.length) return showStatus('empty');
  box.innerHTML = renderPlanCards(cards, { signupHref: 'signup.html', lang });
  box.setAttribute('aria-busy', 'false');
}

async function load() {
  if (!box) return;
  if (!hasPricingSource(SITE_CONFIG)) return showStatus('unavailable');
  box.setAttribute('aria-busy', 'true');
  try {
    rows = await fetchPlans(SITE_CONFIG);
    render();
  } catch (e) {
    // Penyebab tampil di konsol peramban (mis. HTTP 401 kunci, 404 view, 400 kolom).
    console.warn('[Snouvier] Gagal memuat Paket Langganan:', e?.message ?? e);
    showStatus('unavailable');
  }
}

lang = initLang(document, (next) => {
  lang = next;
  if (rows) render();
  else if (box && box.querySelector('.plans__status')) showStatus('unavailable');
});
load();

loadPublicConfig()
  .then((cfg) => applyPublicConfig(document, cfg, lang))
  .catch(() => {}); // cadangan teks di HTML tetap tampil

initReveal();
