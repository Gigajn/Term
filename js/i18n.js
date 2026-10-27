// Bahasa situs pemasaran. Teks Indonesia (bahasa utama) ada langsung di HTML,
// jadi halaman tetap terbaca tanpa JavaScript. EN berisi padanan Inggris per
// kunci data-i18n / data-i18n-attr-<atribut>. Tes site/tests/pages.test.mjs
// memastikan setiap kunci di HTML punya terjemahan dan tidak ada kunci yatim.
export const EN = {
  'meta.title': 'GIGFLOW: point of sale, stock, and reports for F&amp;B businesses',
  'meta.description': 'Point of sale for coffee shops, cafes, and F&B businesses: staffed checkout with cash, QRIS, and Bon, ingredient stock per outlet and warehouse, and automatic email reports.',
  'pmeta.title': 'Subscription plan pricing · GIGFLOW',
  'pmeta.description': 'GIGFLOW subscription plan prices per month, outlet and cashier limits, and the modules included in each plan.',

  'nav.skip': 'Skip to content',
  'nav.homeLabel': 'GIGFLOW, home',
  'nav.main': 'Main',
  'nav.features': 'Features',
  'nav.how': 'How it works',
  'nav.pricing': 'Pricing',
  'cta.try': 'Try free',
  'cta.signup': 'Sign up now',

  'hero.eyebrow': 'Point of sale for F&amp;B businesses',
  'hero.title': 'Checkout, stock, and reports in <em>one app</em>.',
  'hero.lead': 'GIGFLOW helps coffee shops, cafes, and drink stalls serve customers faster, keep ingredient stock accurate, and send daily reports to your email without manual tallying.',
  'hero.ctaPrimary': 'Try free for 14 days',
  'hero.ctaSecondary': 'See pricing',
  'hero.note1': 'Android and web',
  'hero.note2': 'Keeps working when the internet drops',
  'hero.note3': 'Your data is never deleted automatically',

  'preview.label': 'Sample staffed checkout screen: two menu items in the cart and Cash, QRIS, and Bon payment buttons',
  'preview.title': 'Order',
  'preview.meta': 'Main outlet · Cashier 1',
  'preview.item1': 'Jumbo Iced Tea',
  'preview.item1sub': 'Normal sugar · Extra ice',
  'preview.item2': 'Palm Sugar Iced Latte',
  'preview.item2sub': 'Less sweet',
  'preview.total': 'Amount due',
  'preview.cash': 'Cash',

  'features.eyebrow': 'Features',
  'features.title': 'Everything your outlet needs every day',
  'features.lead': 'Designed with drink stalls that serve long queues, so buttons are big, flows are short, and reports are ready to read.',
  'features.f1.title': 'Fast staffed checkout',
  'features.f1.body': 'Accept cash, QRIS, and customer Bon, then print a receipt or send a digital one. Orders can be held and resumed.',
  'features.f2.title': 'Accurate ingredient stock',
  'features.f2.body': 'Recipes deduct ingredient stock automatically with every sale. Track stock per outlet and warehouse, ship goods, and run stock counts.',
  'features.f3.title': 'Automatic email reports',
  'features.f3.body': 'Daily, weekly, and monthly reports go to each person by role. No more manual tallying at closing time.',
  'features.f4.title': 'Many outlets, clear roles',
  'features.f4.body': 'The Merchant Owner sees every outlet. Outlet Admins and Cashiers see only their own outlet, and sensitive actions need approval.',
  'features.f5.title': 'Keep selling offline',
  'features.f5.body': 'Orders are saved on the device when the internet drops and sync on their own once you are back online. Older laptops can use Light Cashier.',
  'features.f6.title': 'Catalog from Excel',
  'features.f6.body': 'Start with a clean catalog, then import menus, prices, and recipes from an Excel file in minutes.',

  'how.eyebrow': 'How it works',
  'how.title': 'Ready to sell in three steps',
  'how.s1.title': 'Register your business',
  'how.s1.body': 'Enter your business, first outlet, and main warehouse, then choose a plan. All in one wizard.',
  'how.s2.title': 'Add menu and staff',
  'how.s2.body': 'Import menus and recipes from Excel, then add Outlet Admins and Cashiers for each outlet.',
  'how.s3.title': 'Start selling',
  'how.s3.body': 'Open staffed checkout on a phone, tablet, or browser. Stock and reports run on their own.',

  'pricing.eyebrow': 'Pricing',
  'pricing.title': 'Subscription plans that grow with your business',
  'pricing.lead': 'Start with a free 14-day trial. Move to a bigger plan as your outlets grow.',
  'pricing.more': 'Compare plans and read the FAQ',
  'ppage.title': 'Subscription plan pricing',
  'ppage.lead': 'Every plan starts with a free 14-day trial. Prices are per merchant and include every outlet and cashier within the plan limits.',

  'faq.title': 'Frequently asked questions',
  'faq.q1': 'How does the free trial work?',
  'faq.a1': 'Once you sign up, your merchant is active for 14 days at no cost. After that the subscription continues on the plan you chose.',
  'faq.q2': 'What happens if a payment is late?',
  'faq.a2': 'There is a 7-day grace period. If it is still unpaid after that, new transactions are paused, but the Merchant Owner can still read and export all data.',
  'faq.q3': 'Can I lose my data?',
  'faq.a3': 'No. Data is never deleted automatically, and each merchant’s data is kept separate from other merchants.',
  'faq.q4': 'Can I change plans?',
  'faq.a4': 'Yes. When your outlets or cashiers grow past the plan limits, contact us to move to a bigger plan.',

  'final.title': 'Try GIGFLOW at your outlet',
  'final.body': 'Free for 14 days. Your data stays yours and can be exported at any time.',

  'foot.tagline': 'Point of sale, stock, and reports for F&amp;B businesses.',
  'foot.contact': 'Contact:',
  'foot.nav': 'Footer links',
  'foot.home': 'Home',
  'foot.privacy': 'Privacy Policy',
  'foot.terms': 'Terms of Service',
};

const STORE_KEY = 'gf-site-lang';

/** Bahasa aktif: ?lang= menang, lalu pilihan tersimpan, lalu Indonesia. */
export function pickLang(search = '', stored = null) {
  const q = new URLSearchParams(search).get('lang');
  if (q === 'en' || q === 'id') return q;
  return stored === 'en' ? 'en' : 'id';
}

function readStored() {
  try { return window.localStorage.getItem(STORE_KEY); } catch { return null; }
}
function store(lang) {
  try { window.localStorage.setItem(STORE_KEY, lang); } catch { /* mode privat */ }
}

/** Terapkan bahasa ke dokumen. Teks Indonesia asli disimpan untuk kembali. */
export function applyLang(doc, lang) {
  doc.documentElement.lang = lang;
  for (const el of doc.querySelectorAll('[data-i18n]')) {
    if (el.dataset.i18nId === undefined) el.dataset.i18nId = el.innerHTML;
    const en = EN[el.dataset.i18n];
    el.innerHTML = lang === 'en' && en ? en : el.dataset.i18nId;
  }
  for (const el of doc.querySelectorAll('*')) {
    for (const a of [...el.attributes]) {
      if (!a.name.startsWith('data-i18n-attr-')) continue;
      const attr = a.name.slice('data-i18n-attr-'.length);
      const keep = `data-i18n-orig-${attr}`;
      if (!el.hasAttribute(keep)) el.setAttribute(keep, el.getAttribute(attr) || '');
      const en = EN[a.value];
      el.setAttribute(attr, lang === 'en' && en ? en.replace(/&amp;/g, '&') : el.getAttribute(keep));
    }
  }
  for (const t of doc.querySelectorAll('[data-lang-toggle]')) {
    const other = lang === 'en' ? 'id' : 'en';
    t.textContent = other.toUpperCase();
    t.setAttribute('href', `?lang=${other}`);
    t.setAttribute('hreflang', other);
    t.setAttribute('lang', other);
    t.setAttribute('aria-label', other === 'en' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia');
  }
}

export function initLang(doc, onChange) {
  let lang = pickLang(window.location.search, readStored());
  applyLang(doc, lang);
  for (const t of doc.querySelectorAll('[data-lang-toggle]')) {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      lang = lang === 'en' ? 'id' : 'en';
      store(lang);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url);
      applyLang(doc, lang);
      onChange?.(lang);
    });
  }
  return lang;
}
