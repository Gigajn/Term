// signup.html: satu pintu tombol "Start Free Trial" ke Pendaftaran Mandiri
// Merchant di aplikasi web (SITE_CONFIG.appUrl + ?daftar=1).
import { SITE_CONFIG, signupUrl } from './config.js';

const target = signupUrl(SITE_CONFIG.appUrl);
const link = document.getElementById('continue');
if (link) link.href = target;
// Redirect langsung; tombol di atas tetap ada bila browser menahannya.
window.location.replace(target);
