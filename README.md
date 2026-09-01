# Bali Diagnostics — Website

Plain static site. Three files, no build step, no server needed:

- `index.html` — the patient website (home, packages, tests and booking)
- `styles.css` — styling / theme
- `app.js` — behaviour (booking, language switch, dark mode)

`index.html` is the entry point, so any static host will serve it automatically.

---

## Option A — Cloudflare Pages via GitHub  (recommended, since you already use Cloudflare)

1. Go to https://github.com/new and create a repository, e.g. `bali-clinical-lab` (Public or Private both work).
2. On the new repo page click **"uploading an existing file"**, then drag in `index.html`, `styles.css`, `app.js`. Commit.
3. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git → pick this repo.**
4. Build settings:
   - Framework preset: **None**
   - Build command: **(leave empty)**
   - Build output directory: **/**  (root)
5. Deploy. You get a `*.pages.dev` URL, and you can attach a custom domain under **Custom domains** (same as your portfolio).

Any future change you push to the repo auto-redeploys.

## Option B — GitHub Pages (no Cloudflare needed)

1. Create the repo and upload the 3 files (steps 1–2 above).
2. Repo **Settings → Pages → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.**
3. After ~1 minute your site is live at `https://<your-username>.github.io/<repo-name>/`.

---

## Before going live — replace placeholders
Search the files for these and swap in real values:
- Phone number: `+91 98XXX-XXXXX`
- WhatsApp number: `91XXXXXXXXXX`
- Email: `contact@baliclinicallab.example`
- Prices / test list / stats / testimonials (all illustrative)

No payments or patient data are processed by this prototype.
