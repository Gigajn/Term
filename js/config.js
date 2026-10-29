// Satu-satunya tempat pengaturan situs pemasaran. Harga TIDAK diatur di sini:
// harga dibaca dari data Paket Langganan (Pusat Komando) lewat view
// public.public_subscription_plans (migrasi 240).
//
// supabaseAnonKey adalah kunci publik "anon" (Supabase › Project Settings ›
// API). Kunci service_role JANGAN PERNAH ditaruh di sini.
export const SITE_CONFIG = {
  supabaseUrl: 'https://xcctffmmpstdnnooevmc.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY3RmZm1tcHN0ZG5ub29ldm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0Nzg2NTQsImV4cCI6MjEwMzA1NDY1NH0.eiOF1u3P7U6I3JzANQbt7ioE43Ph8fe_aSAXWTeNLi0',
  // Alamat aplikasi web GIGFLOW (Vercel), tempat Pendaftaran Mandiri Merchant.
  appUrl: 'https://cashierpos-five.vercel.app',
  contactEmail: 'estdsuwastio@gmail.com',
};

// Parameter yang sama dibaca SignupLink di aplikasi
// (lib/features/auth/domain/signup_link.dart).
export const SIGNUP_PARAM = 'daftar';

export function signupUrl(appUrl = SITE_CONFIG.appUrl) {
  const url = new URL('/', appUrl);
  url.searchParams.set(SIGNUP_PARAM, '1');
  return url.href;
}

export function hasPricingSource(config = SITE_CONFIG) {
  return /^https:\/\//.test(config.supabaseUrl || '') &&
    !!config.supabaseAnonKey && !/^REPLACE_/.test(config.supabaseAnonKey);
}
