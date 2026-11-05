import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILES, loadLegal, renderPage } from '../tools/build-legal.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..');

test('terms.html dan privacy.html sama dengan legal/dokumen-hukum.json', () => {
  const legal = loadLegal();
  for (const id of Object.keys(FILES)) {
    const html = readFileSync(join(SITE, FILES[id]), 'utf8');
    assert.equal(html, renderPage(html, legal, id),
      `${FILES[id]} tertinggal: jalankan node site/tools/build-legal.mjs`);
  }
});

test('dokumen hukum tidak lagi menyebut aplikasi internal', () => {
  const raw = readFileSync(join(SITE, 'legal/dokumen-hukum.json'), 'utf8');
  assert.doesNotMatch(raw, /internal|ESTD Suwastio/);
  const legal = loadLegal();
  assert.deepEqual(legal.dokumen.map((d) => d.id), ['terms', 'privacy']);
  for (const d of legal.dokumen) assert.ok(d.bagian.length >= 5, d.id);
});
