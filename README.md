# Bali Diagnostics — Website

Plain static site. Four files, with no build step or server required:

- `index.html` — the responsive multilingual patient website (health packages, test catalog and booking flow)
- `styles.css` — styling / theme
- `app.js` — behaviour (booking, language switch, dark mode)
- `favicon.svg` — browser icon

`index.html` is the entry point, so any static host will serve it automatically.

---

## Option A — Cloudflare Pages via GitHub  (recommended, since you already use Cloudflare)

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Select the existing `gauravsharma11/bali-clinical-lab` repository.
3. Build settings:
   - Framework preset: **None**
   - Build command: **(leave empty)**
   - Build output directory: **/**  (root)
4. Deploy. You get a `*.pages.dev` URL, and you can attach a custom domain under **Custom domains** (same as your portfolio).

Any future change you push to the repo auto-redeploys.

## Option B — GitHub Pages (no Cloudflare needed)

1. In this repository, go to **Settings → Pages → Source: Deploy from a branch**.
2. Select branch `main`, folder `/ (root)`, then save.
3. After deployment, the site is available at `https://<your-username>.github.io/<repo-name>/`.

---

## Before going live — replace placeholders
The prices, test lists, statistics and testimonials are illustrative and must be verified or replaced before launch.

No payments or patient data are processed by this prototype.
