// Membuat isi <article> halaman hukum dari JSON (sumber yang sama dengan layar
// persetujuan di aplikasi), dua edisi (#344):
//   English   : legal/legal-documents.en.json → terms.html, privacy.html
//   Indonesia : legal/dokumen-hukum.json      → terms-id.html, privacy-id.html
// Jalankan setelah mengubah JSON:
//   node site/tools/build-legal.mjs
// Tes site/tests/legal.test.mjs gagal bila HTML tertinggal dari JSON.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const EDITIONS = {
  en: { json: 'legal/legal-documents.en.json', files: { terms: 'terms.html', privacy: 'privacy.html' },
        other: 'id', otherLabel: 'Baca dalam Bahasa Indonesia' },
  id: { json: 'legal/dokumen-hukum.json', files: { terms: 'terms-id.html', privacy: 'privacy-id.html' },
        other: 'en', otherLabel: 'Read in English' },
};
export const FILES = EDITIONS.en.files;
const WORDS = {
  en: { version: 'version', since: 'effective', contact: 'Contact', also: 'See also', and: 'and',
        del: 'how to delete your account' },
  id: { version: 'versi', since: 'berlaku sejak', contact: 'Kontak', also: 'Baca juga', and: 'dan',
        del: 'cara menghapus akun' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// "snouvier-web.celvre.tech/pricing.html" → tautan relatif; tautan luar → https.
const linkify = (s) => esc(s)
  .replace(/snouvier-web\.celvre\.tech\/([a-z-]+\.html)/g, '<a href="$1">snouvier-web.celvre.tech/$1</a>')
  .replace(/myaccount\.google\.com\/permissions/g,
    '<a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>');

export function loadLegal(lang = 'id') {
  return JSON.parse(readFileSync(join(SITE, EDITIONS[lang].json), 'utf8'));
}

export function renderArticle(legal, id, lang = 'id') {
  const ed = EDITIONS[lang];
  const w = WORDS[lang];
  const doc = legal.dokumen.find((d) => d.id === id);
  const other = legal.dokumen.find((d) => d.id !== id);
  const out = [
    '    <article class="prose">',
    `      <h1>${esc(doc.judul)}</h1>`,
    `      <p class="mut">Snouvier · ${w.version} ${legal.versi} · ${w.since} ${esc(legal.berlaku)}</p>`,
    `      <p class="mut"><a href="${EDITIONS[ed.other].files[id]}" hreflang="${ed.other}">${ed.otherLabel}</a></p>`,
    `      <p>${linkify(doc.pembuka)}</p>`,
  ];
  for (const b of doc.bagian) {
    out.push(`      <h2>${esc(b.judul)}</h2>`);
    const paras = b.paragraf ?? [];
    // Paragraf pengantar daftar tampil sebelum poin; sisanya sesudahnya.
    const before = b.poin && paras.length && /:$/.test(paras[0]) ? [paras[0]] : [];
    const after = paras.slice(before.length);
    for (const p of (b.poin ? before : paras)) out.push(`      <p>${linkify(p)}</p>`);
    if (b.poin) {
      out.push('      <ul>');
      for (const p of b.poin) out.push(`          <li>${linkify(p)}</li>`);
      out.push('      </ul>');
      for (const p of after) out.push(`      <p>${linkify(p)}</p>`);
    }
  }
  out.push(`      <h2>${w.contact}</h2>`);
  const kontak = id === 'privacy' ? (legal.kontakPrivasi ?? legal.kontak) : legal.kontak;
  out.push(`      <p><a href="mailto:${kontak}">${kontak}</a></p>`);
  out.push(`      <p>${w.also} <a href="${ed.files[other.id]}">${esc(other.judul)}</a> ${w.and} ` +
    `<a href="delete-account.html">${w.del}</a>.</p>`);
  out.push('    </article>');
  return out.join('\n');
}

export function renderPage(html, legal, id, lang = 'id') {
  const start = html.indexOf('    <article class="prose">');
  const endTag = '    </article>';
  const end = html.indexOf(endTag);
  if (start < 0 || end < 0) throw new Error(`article tidak ditemukan di ${EDITIONS[lang].files[id]}`);
  return html.slice(0, start) + renderArticle(legal, id, lang) + html.slice(end + endTag.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const lang of Object.keys(EDITIONS)) {
    const legal = loadLegal(lang);
    for (const [id, file] of Object.entries(EDITIONS[lang].files)) {
      const p = join(SITE, file);
      writeFileSync(p, renderPage(readFileSync(p, 'utf8'), legal, id, lang));
      console.log(`✓ ${file}`);
    }
  }
}
