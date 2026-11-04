// Konfigurasi publik bersama aplikasi dan situs (celvre-publik.json, #251/#252).
// Teks Indonesia di HTML adalah cadangan tanpa JavaScript; tes memastikan
// cadangan itu sama dengan JSON. Saat dimuat, JSON menjadi sumber teksnya.

export const PUBLIC_CONFIG_URL = 'celvre-publik.json';

/** Daftar baris Printer Teruji (boleh kosong) untuk ditampilkan di situs. */
export function printerLines(cfg) {
  const list = Array.isArray(cfg?.printerTeruji) ? cfg.printerTeruji : [];
  return list
    .map((p) => {
      const name = `${p?.merek ?? ''} ${p?.tipe ?? ''}`.trim();
      if (!name) return null;
      return `${name} · ${p?.koneksi ?? 'Bluetooth'} ${p?.lebarMm ?? 58} mm`;
    })
    .filter(Boolean);
}

/** Pasang teks dari konfigurasi ke elemen [data-celvre] dan daftar printer. */
export function applyPublicConfig(doc, cfg, lang) {
  for (const el of doc.querySelectorAll('[data-celvre]')) {
    const v = cfg?.[el.dataset.celvre];
    if (typeof v !== 'string' || !v.trim()) continue;
    el.dataset.i18nId = v; // teks Indonesia yang dipakai i18n saat ganti bahasa
    if (lang !== 'en') el.textContent = v;
  }
  const ul = doc.querySelector('[data-celvre-printers]');
  if (!ul) return;
  const lines = printerLines(cfg);
  ul.replaceChildren(
    ...lines.map((t) => Object.assign(doc.createElement('li'), { textContent: t })),
  );
  if (lines.length && cfg?.catatanPrinterLain) {
    const li = doc.createElement('li');
    li.className = 'printer-list__note';
    li.textContent = cfg.catatanPrinterLain;
    ul.append(li);
  }
  ul.hidden = lines.length === 0;
}

export async function loadPublicConfig(fetchImpl = fetch) {
  const r = await fetchImpl(PUBLIC_CONFIG_URL, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
