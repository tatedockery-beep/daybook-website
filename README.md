# Daybook marketing website — usedaybook.com

Static site. No build step, no framework, no dependencies — five HTML pages,
one stylesheet, one small JS file. Matches the Daybook app's design tokens
(matte navy, orange primary `hsl(25 95% 55%)`, Inter, 24/16/18px radii).

## Pages
- `/` — home (hero, features, trades, how it works, trust, pricing, FAQ)
- `/pricing/` — plan card, what's included, pricing FAQ
- `/privacy/`, `/terms/` — legal drafts (watermarked "pending legal review")
- `404.html`

## Keep in sync
- **Prices** appear in three places: the home page pricing bands, `/pricing/`,
  and the price table in `/terms/` (which defers to `/pricing/`). Change all three together.
- **Mockups** — the remaining CSS product mockups (`.mock` blocks) can be
  swapped for real app screenshots whenever you want.
- **Store badges** — the App Store / Google Play badges are hand-built
  approximations (inline SVG glyphs). Apple and Google ask for their official
  badge artwork; swap it into the `.btn-store-apple` / `.btn-store-google` links
  in `index.html` (keep each link's `aria-label`).
- **Share image** — `assets/og-image.jpg` shows the dashboard photo's sample
  data. Re-render it if that photo changes.
- **Scroll reveal** — `.reveal` only hides content when `<html>` has the `js`
  class, set by an inline script in each page's `<head>`. A new page that uses
  `.reveal` needs that one-line script too.

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
