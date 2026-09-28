// Daybook marketing site — no dependencies.

// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.mobile-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  // Close after choosing a link
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

// FAQ accordion (one open at a time)
document.querySelectorAll('.faq-q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((o) => {
      o.classList.remove('open');
      o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// Scroll entrance — IntersectionObserver only, respects reduced motion via CSS
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

// Signup source — how a visitor found Daybook, carried to the signup page.
//
// Nothing leaves the browser from here: no network call, no cookie. The campaign
// tags this visit arrived with (utm_*) and the NAME of the site that sent it —
// never that page's address — are remembered in this tab only, and added to every
// "Start free trial" link. The app stores them only if the visitor creates an
// account. See /privacy/ sections 2 and 12.
//
// The forwarding is the whole point: once a visitor clicks through, the signup
// page's own referrer is usedaybook.com, so the Facebook post that sent them here
// is invisible to the app unless this page passes it on as `ref`.
//
// These parameter names are a contract with the app — Contractor-OS
// apps/web/src/lib/signup-attribution.ts reads exactly utm_* and ref.
(() => {
  const KEY = 'daybook.signup-source';
  const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const SIGNUP = 'https://app.usedaybook.com/register';

  const params = new URLSearchParams(location.search);
  const fresh = {};
  TAGS.forEach((name) => {
    const value = (params.get(name) || '').trim();
    if (value) fresh[name] = value.slice(0, 200);
  });

  let host = '';
  try {
    host = document.referrer ? new URL(document.referrer).hostname : '';
  } catch (e) {
    host = '';
  }
  // A page on this site (or the app) is moving around, not a source.
  const ours = host === 'usedaybook.com' || host.endsWith('.usedaybook.com') || host === location.hostname;
  if (host && !ours) fresh.ref = host;

  let source = null;
  if (Object.keys(fresh).length > 0) {
    source = fresh; // A new arrival replaces an earlier one in this tab.
    try { sessionStorage.setItem(KEY, JSON.stringify(fresh)); } catch (e) { /* storage blocked — this page still forwards */ }
  } else {
    try { source = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { source = null; }
  }
  if (!source || typeof source !== 'object') return;

  document.querySelectorAll(`a[href^="${SIGNUP}"]`).forEach((link) => {
    const url = new URL(link.href);
    Object.keys(source).forEach((name) => {
      if ((TAGS.includes(name) || name === 'ref') && typeof source[name] === 'string' && source[name]) {
        url.searchParams.set(name, source[name]);
      }
    });
    link.href = url.toString();
  });
})();
