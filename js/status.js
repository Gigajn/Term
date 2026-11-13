// Halaman Status Snouvier (P10.3). Diperiksa dari peramban pengunjung:
// - Aplikasi web: alamat appUrl terjangkau.
// - Login dan data: endpoint kesehatan Supabase Auth dan REST.
// Asisten WhatsApp sengaja tidak ikut Target Ketersediaan 99,5% (P10.4),
// jadi tampil dengan keterangan, bukan diperiksa.
import { SITE_CONFIG } from './config.js';

export const TARGET = '99.5%';

export const LAYANAN = [
  { id: 'app', nama: 'Snouvier app (web and mobile)' },
  { id: 'auth', nama: 'Sign-in' },
  { id: 'data', nama: 'Sales, inventory and reporting data' },
];

/** Periksa satu alamat; true bila terjangkau dalam batas waktu. */
export async function cek(url, { fetchImpl = fetch, headers, noCors = false, timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, {
      method: 'GET', headers, signal: ctrl.signal, cache: 'no-store',
      mode: noCors ? 'no-cors' : 'cors',
    });
    // no-cors memberi respons opaque (status 0): cukup sebagai tanda terjangkau.
    return noCors ? true : r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function periksaSemua(config = SITE_CONFIG, fetchImpl = fetch) {
  const key = { apikey: config.supabaseAnonKey };
  const [app, auth, data] = await Promise.all([
    cek(config.appUrl, { fetchImpl, noCors: true }),
    cek(`${config.supabaseUrl}/auth/v1/health`, { fetchImpl, headers: key }),
    cek(`${config.supabaseUrl}/rest/v1/public_subscription_plans?select=code&limit=1`,
        { fetchImpl, headers: key }),
  ]);
  return { app, auth, data };
}

/** Ringkasan satu kalimat dari hasil pemeriksaan. */
export function ringkas(hasil) {
  const turun = LAYANAN.filter((l) => hasil[l.id] === false);
  if (turun.length === 0) return { tingkat: 'normal', teks: 'All systems operational' };
  if (turun.length === LAYANAN.length) {
    return { tingkat: 'gangguan', teks: 'Snouvier cannot be reached from this device right now' };
  }
  return { tingkat: 'sebagian', teks: `Partial outage: ${turun.map((l) => l.nama).join(', ')}` };
}

function tulis(el, teks) {
  el.textContent = teks;
}

async function mulai() {
  const daftar = document.getElementById('layanan');
  const ringkasan = document.getElementById('ringkasan');
  const waktu = document.getElementById('diperiksa');
  if (!daftar || !ringkasan) return;
  const hasil = await periksaSemua();
  for (const l of LAYANAN) {
    const baris = daftar.querySelector(`[data-layanan="${l.id}"] .status__nilai`);
    if (baris) {
      baris.dataset.tingkat = hasil[l.id] ? 'normal' : 'gangguan';
      tulis(baris, hasil[l.id] ? 'Operational' : 'Outage');
    }
  }
  const r = ringkas(hasil);
  ringkasan.dataset.tingkat = r.tingkat;
  tulis(ringkasan, r.teks);
  if (waktu) tulis(waktu, `Last checked ${new Date().toLocaleString('en-GB')}`);

  try {
    const res = await fetch('status-insiden.json', { cache: 'no-store' });
    const { insiden = [] } = await res.json();
    const box = document.getElementById('insiden');
    if (box && insiden.length) {
      box.replaceChildren(...insiden.slice(0, 10).map((i) => {
        const li = document.createElement('li');
        li.textContent = `${i.tanggal}: ${i.judul}${i.selesai ? ' (resolved)' : ''}`;
        return li;
      }));
    }
  } catch {
    // Riwayat tidak wajib; halaman tetap berguna tanpa itu.
  }
}

if (typeof document !== 'undefined') mulai();
