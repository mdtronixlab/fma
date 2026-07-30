# FMA (thefma.in)

Static HTML/CSS/JS website for FMA, served from cPanel shared hosting with DNS on Cloudflare.

## Structure

- `index.html`, `gallery.html` — pages
- `assets/` — images, CSS, JS
- `assets/gallery-list.php` — auto-lists gallery photos (see "Gallery photos" below)
- `deploy.sh` — pushes `dev` to GitHub, then SSHes into the server to pull
- `.htaccess` — clean URLs (e.g. `/gallery` serves `gallery.html`)
- `.cpanel.yml` — cPanel Git Version Control deployment hook (unused by the current deploy flow, kept for reference)

## Hosting

- Provider: cPanel shared hosting
- Server IP: `118.139.179.181`
- cPanel user: `cb4jf27barw2`
- Document root: `/home/cb4jf27barw2/public_html`
- Primary domain (cPanel): `thefma.in`
- PHP 8.3 is available on the server.

## Git remotes

- `origin` and `deploy` → both point to `https://github.com/mdtronixlab/fma.git` (same repo; `deploy` is just the name `deploy.sh` expects)
- Branch used for deploys: `dev`
- The same repo is cloned on the server at `~/public_html/.git`

## Deploying

```bash
./deploy.sh
```

This does two things:
1. `git push deploy dev` — pushes local commits to GitHub.
2. SSHes into `cb4jf27barw2@118.139.179.181` and runs `git pull origin dev` inside `~/public_html`.

### SSH key

- Key: `D:/Downloads/id_rsa` (referenced by `deploy.sh`)
- The key is **passphrase-protected**, so `deploy.sh` will prompt for it when run interactively. For non-interactive runs, load it into `ssh-agent` first, or decrypt a temporary copy with `ssh-keygen -p`.

## DNS (Cloudflare)

`thefma.in`'s DNS is managed in Cloudflare, not the hosting provider. Records needed:

| Type | Name | Target             | Proxy    |
|------|------|---------------------|----------|
| A    | @    | 118.139.179.181      | Proxied  |
| A    | www  | 118.139.179.181      | Proxied  |

SSL/TLS mode: Cloudflare → SSL/TLS → Overview → **Full** (cPanel currently only has a self-signed cert, so **Full (strict)** will fail until a real cert — e.g. AutoSSL/Let's Encrypt — is issued in cPanel).

## Clean URLs

`.htaccess` rewrites extensionless paths to their `.html` file (e.g. `/gallery` → `gallery.html`). Internal links use the extensionless form. When adding a new page, just link to it without `.html` — no `.htaccess` changes needed unless the filename differs from the URL you want.

## Gallery photos

Photos in `assets/images/gallery/` show up on the gallery page **automatically** — no code changes needed. `assets/gallery-list.php` scans that folder on each page load and `assets/js/gallery.js` fetches it and renders the results.

To add a photo: just drop a `.jpg`/`.jpeg`/`.png`/`.webp` file into `assets/images/gallery/` (e.g. via cPanel File Manager, or `git push` + deploy) and reload the page.

- **Category** (training/classes/lifestyle filter): give the filename a prefix, e.g. `classes-yoga-session.jpg`. No recognized prefix defaults to `training`.
- **Title**: derived from the rest of the filename — dashes/underscores become spaces, title-cased (e.g. `training-leg-day-setup.jpg` → "Leg Day Setup").
- **Portrait vs. landscape** grid card: detected automatically from the image's actual dimensions.
- **Size**: resize/compress large photos before uploading (camera originals are often 10+ MB) — aim for under ~500KB, e.g. max 1600px on the long edge, JPEG quality ~75-80.

`assets/js/gallery-data.js` is currently empty (`GALLERY_ITEMS = []`) — the gallery page shows only real photos from `assets/images/gallery/`. It still exists as an optional way to hand-pin specific images (e.g. from elsewhere in `assets/images/`) ahead of the auto-discovered ones, if ever needed; anything added there renders first.

## Known gotcha: 403 Forbidden after DNS goes live

`public_html` must be world-executable/readable (`755`) or Apache can't traverse into it to serve `index.html`, even though the files inside are readable. If the site 403s after DNS points correctly at the server:

```bash
chmod 755 ~/public_html
```

## Troubleshooting checklist

- Site shows cPanel's "Coming Soon" page → DNS isn't pointing at the server yet, or Cloudflare A record is missing/wrong.
- `403 Forbidden` (Apache's default error page) → check `public_html` permissions (see above).
- `git push` fails with a 403/permission error in VS Code → check which GitHub account is signed in (Source Control panel / account switcher), and that the local credential (Windows Credential Manager / Git Credential Manager) matches an account with write access to `mdtronixlab/fma`.
- New gallery photo not showing up → confirm it landed in `assets/images/gallery/` (not a different folder), has an allowed extension, and that `assets/gallery-list.php` is reachable (visit it directly in a browser — it should return a JSON array, not a PHP error or source code).
