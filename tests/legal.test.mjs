import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITIONS, loadLegal, renderPage } from '../tools/build-legal.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');

test('halaman hukum English dan Indonesia sama dengan JSON-nya', () => {
  for (const lang of Object.keys(EDITIONS)) {
    const legal = loadLegal(lang);
    for (const [id, file] of Object.entries(EDITIONS[lang].files)) {
      const html = readFileSync(join(SITE, file), 'utf8');
      assert.equal(html, renderPage(html, legal, id, lang),
        `${file} tertinggal: jalankan node site/tools/build-legal.mjs`);
      assert.match(html, new RegExp(`<html lang="${lang}">`), file);
    }
  }
});

test('edisi English sejajar dengan edisi Indonesia (#344)', () => {
  const id = loadLegal('id'), en = loadLegal('en');
  assert.equal(en.versi, id.versi);
  assert.deepEqual(en.dokumen.map((d) => d.id), id.dokumen.map((d) => d.id));
  for (let i = 0; i < id.dokumen.length; i++) {
    const a = id.dokumen[i].bagian, b = en.dokumen[i].bagian;
    assert.equal(b.length, a.length, id.dokumen[i].id);
    a.forEach((s, k) => {
      assert.equal((b[k].poin ?? []).length, (s.poin ?? []).length, `${id.dokumen[i].id} ${s.judul} poin`);
      assert.equal((b[k].paragraf ?? []).length, (s.paragraf ?? []).length, `${id.dokumen[i].id} ${s.judul} paragraf`);
    });
  }
  assert.doesNotMatch(JSON.stringify(en.dokumen), /\b(dan|yang|untuk|dengan)\b/);
});

test('dokumen hukum tidak lagi menyebut aplikasi internal', () => {
  const raw = readFileSync(join(SITE, 'legal/dokumen-hukum.json'), 'utf8');
  assert.doesNotMatch(raw, /internal|ESTD Suwastio/);
  const legal = loadLegal();
  assert.deepEqual(legal.dokumen.map((d) => d.id), ['terms', 'privacy']);
  for (const d of legal.dokumen) assert.ok(d.bagian.length >= 5, d.id);
});
