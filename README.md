# Daybook marketing website — usedaybook.com

Static site. No build step, no framework, no dependencies — five HTML pages,
one stylesheet, one small JS file. Matches the Daybook app's design tokens
(matte navy, orange primary `hsl(25 95% 55%)`, Inter, 24/16/18px radii).

## Pages
- `/` — home (hero, features, trades, how it works, trust, pricing, FAQ)
- `/pricing/` — plan card, what's included, pricing FAQ
- `/privacy/`, `/terms/` — legal drafts (watermarked "pending legal review")
- `404.html`

## Placeholders to fill before launch
1. **Price** — both pricing cards show `$X /month`; search for `$X` in
   `index.html` and `pricing/index.html`.
2. **Legal** — `[DATE]`, `[LEGAL ENTITY NAME...]` in privacy/terms; have an
   attorney review, then remove the `draft-banner` div.
3. **Mockup → screenshots** — the CSS product mockups (`.mock` blocks) can be
   swapped for real app screenshots whenever you want.

## Local preview
```
npx serve .
```

## Free hosting (pick one)

### GitHub Pages (simplest)
1. Push this folder to a GitHub repo (e.g. `daybook-website`).
2. Repo Settings → Pages → Source: `main` branch, `/ (root)`.
3. Settings → Pages → Custom domain: `usedaybook.com`; add the DNS records
   GitHub shows you at your registrar (A records for apex + CNAME for www).
4. Enforce HTTPS once the cert issues (automatic).
404.html is picked up automatically.

### Cloudflare Pages (fastest CDN, also free)
1. Push to GitHub, connect the repo in Cloudflare Pages, framework "None",
   no build command, output dir `/`.
2. Add `usedaybook.com` as a custom domain (instant if DNS is on Cloudflare).

## Notes
- `Log in` / `Start free trial` buttons point at `https://app.usedaybook.com`
  — they will work once the app is deployed there (Railway + DNS).
- Contact email `support@usedaybook.com` needs mail receiving set up on the
  domain (registrar email forwarding is fine).
- No analytics, no cookies, no trackers are included by design.
