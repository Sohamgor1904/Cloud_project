/**
 * frontend/js/home.js
 * Landing page interactions:
 *  - Animated stat counters
 *  - Nav scroll shadow
 *  - Smooth anchor scroll
 */

// ── NAV scroll shadow ──────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.querySelector('.nav')?.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── Counter animation ──────────────────────────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.ss-num[data-target]').forEach(el =>
        animateCounter(el, parseInt(el.dataset.target))
      );
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
document.querySelector('.stats-strip') && io.observe(document.querySelector('.stats-strip'));

// ── Smooth scroll for anchor links ────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
  });
});
