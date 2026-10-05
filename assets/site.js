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

// Visit statistics — Daybook's own, no third party.
//
// For each page: one small "viewed" report, then how long the page was actually
// VISIBLE (a background tab doesn't count), sent to Daybook's own API with
// navigator.sendBeacon. What is sent: a random visit id, the page path (never its
// query string), the NAME of the site that linked here (never that page's
// address), and any campaign tags on the link. No cookie, no fingerprint, nothing
// about the device. The visit id lives in this tab's sessionStorage and is gone
// when the tab closes. See /privacy/ section 12.
//
// The visit id also rides on the "Start free trial" link as `vid`, so a signup can
// be matched to the visit that led to it. That parameter name is a contract with
// the app: Contractor-OS apps/web/src/lib/signup-attribution.ts reads it, and
// apps/api/src/routes/site.ts receives the reports.
//
// Off when the browser asks not to be tracked (Global Privacy Control or Do Not
// Track), for automated browsers, and anywhere but usedaybook.com itself, so a
// local preview never pollutes the numbers.
(() => {
  const ENDPOINT = 'https://api.usedaybook.com/api/v1/site/events';
  const VISIT_KEY = 'daybook.visit-id';
  const SIGNUP = 'https://app.usedaybook.com/register';
  const TAGS = [
    ['utm_source', 'utmSource'],
    ['utm_medium', 'utmMedium'],
    ['utm_campaign', 'utmCampaign'],
    ['utm_content', 'utmContent'],
    ['utm_term', 'utmTerm'],
  ];

  const live = location.hostname === 'usedaybook.com' || location.hostname === 'www.usedaybook.com';
  const optedOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (!live || optedOut || navigator.webdriver) return;

  const uuid = () => {
    if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  let visitId = null;
  try { visitId = sessionStorage.getItem(VISIT_KEY); } catch (e) { /* storage blocked */ }
  if (!visitId || !/^[0-9a-f-]{36}$/i.test(visitId)) {
    visitId = uuid();
    try { sessionStorage.setItem(VISIT_KEY, visitId); } catch (e) { /* one-page visit, then */ }
  }
  const pageViewId = uuid();

  const send = (event) => {
    const body = JSON.stringify(event);
    // A string body goes as text/plain: a "simple" request, so no CORS preflight.
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
    } catch (e) { /* fall through */ }
    try {
      fetch(ENDPOINT, { method: 'POST', body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } });
    } catch (e) { /* statistics are never worth an error */ }
  };

  const view = { type: 'view', id: pageViewId, visitId, path: location.pathname };
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : '';
    if (host && host !== location.hostname && !host.endsWith('.usedaybook.com') && host !== 'usedaybook.com') view.referrer = host;
  } catch (e) { /* no usable referrer */ }
  const params = new URLSearchParams(location.search);
  TAGS.forEach(([param, field]) => {
    const value = (params.get(param) || '').trim();
    if (value) view[field] = value.slice(0, 200);
  });
  send(view);

  // Visible time: count only while the page is on screen, and report the running
  // total each time it is hidden (switching tabs, locking the phone, leaving). The
  // API keeps the largest total it has seen, so repeats and late arrivals are safe.
  let visibleMs = 0;
  let shownAt = document.visibilityState === 'visible' ? performance.now() : null;
  let reported = 0;
  const report = () => {
    if (shownAt !== null) {
      visibleMs += performance.now() - shownAt;
      shownAt = null;
    }
    const seconds = Math.floor(visibleMs / 1000);
    if (seconds > reported) {
      reported = seconds;
      send({ type: 'time', id: pageViewId, seconds });
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
    else if (shownAt === null) shownAt = performance.now();
  });
  window.addEventListener('pagehide', report);
  // Back/forward cache: a restored page is the same page view, visible again.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && shownAt === null && document.visibilityState === 'visible') shownAt = performance.now();
  });

  // Carry the visit to the signup page.
  document.querySelectorAll(`a[href^="${SIGNUP}"]`).forEach((link) => {
    const url = new URL(link.href);
    url.searchParams.set('vid', visitId);
    link.href = url.toString();
  });
})();

// ── Pricing: monthly / annual toggle ───────────────────────────────────
//
// Prices live on each band as data-price-monthly / data-price-annual (whole
// dollars); this block only formats them. Without JavaScript the markup already
// shows monthly prices with the yearly price as a sub-line, and the toggle stays
// hidden (CSS shows it only under html.js). The choice lasts for this page view.
(() => {
  const toggles = document.querySelectorAll('.billing-toggle');
  if (!toggles.length) return;

  const money = (n, cents) =>
    '$' + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

  toggles.forEach((group) => {
    const scope = group.closest('.container') || document;
    const bands = [...scope.querySelectorAll('.band[data-price-monthly][data-price-annual]')];
    const buttons = [...group.querySelectorAll('.billing-opt[data-billing]')];
    // Remember the markup's own monthly sub-line so Monthly restores it exactly.
    bands.forEach((band) => {
      const sub = band.querySelector('.band-annual');
      if (sub) band.dataset.subMonthly = sub.textContent;
    });

    const show = (period) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.billing === period)));
      bands.forEach((band) => {
        const monthly = Number(band.dataset.priceMonthly);
        const annual = Number(band.dataset.priceAnnual);
        const amt = band.querySelector('.band-amt');
        const per = band.querySelector('.band-price .per');
        const sub = band.querySelector('.band-annual');
        if (period === 'annual') {
          if (amt) amt.textContent = money(annual, false);
          if (per) per.textContent = ' /yr';
          if (sub) sub.textContent = money(Math.round((annual / 12) * 100) / 100, true) + '/mo · two months free';
        } else {
          if (amt) amt.textContent = money(monthly, false);
          if (per) per.textContent = ' /mo';
          if (sub) sub.textContent = band.dataset.subMonthly || '';
        }
      });
    };

    buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.billing)));
  });
})();
