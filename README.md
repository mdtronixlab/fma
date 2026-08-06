# FMA (thefma.in)

Static HTML/CSS/JS website for FMA, served from cPanel shared hosting with DNS on Cloudflare.

## Structure

- `index.html`, `gallery.html` — pages
- `assets/css/` — stylesheets
- `assets/js/` — `script.js` (site-wide behavior; also fetches transformation photos, see "Gallery photos" below), `components.js` (the `<class-card>` custom element), `gallery.js` (gallery page)
- `assets/images/` — all images, including:
  - `assets/images/gallery/` — gallery page photos (auto-discovered, see "Gallery photos" below)
  - `assets/images/interior/` — homepage "Explore Our Gym" carousel photos
- `assets/videos/` — homepage hero videos
- `assets/gallery-list.php` — auto-lists gallery photos (see "Gallery photos" below)
- `assets/_raw-originals/` — uncompressed camera originals kept locally for re-editing; **gitignored**, never deployed
- `admin/` — password-protected client admin panel for uploading/deleting gallery & team photos without cPanel (see "Client admin panel" below)
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

Photos in `assets/images/gallery/` show up on the gallery page **automatically** — no code changes needed. `assets/gallery-list.php` scans that folder on each page load; `assets/js/gallery.js` fetches it for the gallery page, and `assets/js/script.js` fetches it for the homepage "Transformation" section.

To add a photo: just drop a `.jpg`/`.jpeg`/`.png`/`.webp` file into `assets/images/gallery/` (e.g. via cPanel File Manager, or `git push` + deploy) and reload the page.

- **Category** (training/transformation/lifestyle filter): give the filename a prefix, e.g. `transformation-john-doe.jpg`. No recognized prefix defaults to `training`. Photos tagged `transformation-*` also appear in the homepage "Transformation" section automatically.
- **Title**: derived from the rest of the filename — dashes/underscores become spaces, title-cased (e.g. `training-leg-day-setup.jpg` → "Leg Day Setup").
- **Portrait vs. landscape** grid card: detected automatically from the image's actual dimensions.
- **Size**: resize/compress large photos before uploading (camera originals are often 10+ MB) — aim for under ~500KB, e.g. max 1600px on the long edge, JPEG quality ~75-80.

The gallery page shows **only** what's in `assets/images/gallery/` — no hardcoded list to keep in sync.

### Photo storage on the server

Full-size gallery and interior photos are kept in `/home/cb4jf27barw2/images/gallery` and `/home/cb4jf27barw2/images/interior` — outside `public_html`, so they aren't tracked by this repo's deploy flow. `public_html/assets/images/gallery` and `public_html/assets/images/interior` are symlinks into that folder, so the site serves them at the normal `./assets/images/gallery/...` / `./assets/images/interior/...` URLs without any code changes.

Locally, the equivalent staging folders are `D:\DEV\Web\FMA\images\gallery` and `D:\DEV\Web\FMA\images\interior` — copy from there into this repo's `assets/images/gallery/` / `assets/images/interior/` for local testing (there's no symlink locally, just plain copies).

| Local (dev machine)                    | Server                                          |
|-----------------------------------------|--------------------------------------------------|
| `D:\DEV\Web\FMA\images\gallery`         | `/home/cb4jf27barw2/images/gallery` (symlinked from `public_html/assets/images/gallery`) |
| `D:\DEV\Web\FMA\images\interior`        | `/home/cb4jf27barw2/images/interior` (symlinked from `public_html/assets/images/interior`) |

## Client admin panel

`admin/` is a small self-contained PHP app (session login + AJAX upload/delete)
that lets the client add/remove gallery and team photos from a browser at
`thefma.in/admin`, without touching cPanel. It's documented for the client
in `guide.md` (Part 0). Implementation notes for developers:

- **Auth**: single shared password, checked against a bcrypt hash in
  `admin/config.php` (gitignored — never committed). Sessions are
  cookie-based (`HttpOnly`, `SameSite=Lax`), scoped to `/admin/`.
- **First-time setup on a new environment** (the hash isn't in git, so this
  is needed once per server/checkout):
  1. Copy `admin/config.sample.php` to `admin/config.php`.
  2. Generate a hash: `php -r "echo password_hash('YOUR-PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"`
  3. Paste the output into `config.php`'s `password_hash` value.
  - On the live server this can be done over SSH directly in
    `~/public_html/admin/`, since `config.php` isn't deployed by git.
- **Upload flow**: the browser resizes/re-encodes photos client-side (canvas,
  max 1600px, JPEG q≈0.82) before sending, so the client never has to think
  about file size. `admin/upload.php` re-validates the file server-side
  (real image sniffing via `getimagesize`, 8MB hard cap, extension
  whitelist) and writes it into `assets/images/gallery/` or
  `assets/images/team/` using the **same filename convention** as the manual
  cPanel method (see `guide.md`), so both paths stay interchangeable.
- **Delete flow**: `admin/delete.php` only unlinks files by exact basename
  inside the two known image folders (path-traversal guarded via
  `realpath()` containment check).
- **CSRF**: a per-session token is required on every upload/delete request
  (`admin/auth.php`'s `csrf_token()` / `require_csrf()`).
- `admin/.htaccess` blocks direct requests to `config.php`/`config.sample.php`/`auth.php`.
  (These are just as safe without it, since PHP executes rather than serves
  them as source — this is defense in depth, not the only protection.)
- Not implemented on purpose (kept simple for a single-client site): multiple
  admin accounts, password reset UI, activity log. Ask the client to go
  through the developer if the password needs rotating.

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
