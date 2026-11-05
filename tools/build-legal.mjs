// Membuat isi <article> di site/terms.html dan site/privacy.html dari
// site/legal/dokumen-hukum.json (sumber yang sama dengan layar persetujuan di
// aplikasi). Jalankan setelah mengubah JSON:
//   node site/tools/build-legal.mjs
// Tes site/tests/legal.test.mjs gagal bila HTML tertinggal dari JSON.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FILES = { terms: 'terms.html', privacy: 'privacy.html' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// "celvre.tech/harga.html" → tautan relatif; tautan luar → https.
const linkify = (s) => esc(s)
  .replace(/celvre\.tech\/([a-z-]+\.html)/g, '<a href="$1">celvre.tech/$1</a>')
  .replace(/myaccount\.google\.com\/permissions/g,
    '<a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>');

export function loadLegal() {
  return JSON.parse(readFileSync(join(SITE, 'legal/dokumen-hukum.json'), 'utf8'));
}

export function renderArticle(legal, id) {
  const doc = legal.dokumen.find((d) => d.id === id);
  const other = legal.dokumen.find((d) => d.id !== id);
  const out = [
    '    <article class="prose">',
    `      <h1>${esc(doc.judul)}</h1>`,
    `      <p class="mut">Snouvier · versi ${legal.versi} · berlaku sejak ${esc(legal.berlaku)}</p>`,
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
  out.push('      <h2>Kontak</h2>');
  const kontak = id === 'privacy' ? (legal.kontakPrivasi ?? legal.kontak) : legal.kontak;
  out.push(`      <p><a href="mailto:${kontak}">${kontak}</a></p>`);
  out.push(`      <p>Baca juga <a href="${FILES[other.id]}">${esc(other.judul)}</a> dan ` +
    '<a href="hapus-akun.html">cara menghapus akun</a>.</p>');
  out.push('    </article>');
  return out.join('\n');
}

export function renderPage(html, legal, id) {
  const start = html.indexOf('    <article class="prose">');
  const endTag = '    </article>';
  const end = html.indexOf(endTag);
  if (start < 0 || end < 0) throw new Error(`article tidak ditemukan di ${FILES[id]}`);
  return html.slice(0, start) + renderArticle(legal, id) + html.slice(end + endTag.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const legal = loadLegal();
  for (const id of Object.keys(FILES)) {
    const p = join(SITE, FILES[id]);
    writeFileSync(p, renderPage(readFileSync(p, 'utf8'), legal, id));
    console.log(`✓ ${FILES[id]}`);
  }
}
