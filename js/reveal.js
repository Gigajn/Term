// Kartu fitur, langkah, dan harga muncul halus saat terlihat di layar.
// Peningkatan bertahap: tanpa JS atau tanpa IntersectionObserver semuanya
// langsung tampil; gerak mati lewat token --gf-motion-* (reduced motion).
export function initReveal(root = document) {
  if (typeof IntersectionObserver === 'undefined') return;
  const items = root.querySelectorAll('.feature, .step, .plan, .cta-band');
  if (!items.length) return;
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el, i) => {
    el.style.setProperty('--reveal-i', String(i % 3));
    el.classList.add('reveal');
    io.observe(el);
  });
}
