# FMA (thefma.in)

Static HTML/CSS/JS website for FMA, served from cPanel shared hosting with DNS on Cloudflare.

## Structure

- `index.html`, `gallery.html` — pages
- `assets/css/` — stylesheets
- `assets/js/` — `script.js` (site-wide behavior; also fetches transformation photos, see "Gallery photos" below), `components.js` (the `<class-card>` custom element), `gallery.js` (gallery page)
- `assets/images/` — all images, including:
  - `assets/images/gallery/` — gallery page photos, managed via `/admin` (see "Gallery photos" below)
  - `assets/images/team/` — team member photos, managed via `/admin`
  - `assets/images/interior/` — homepage "Explore Our Gym" carousel photos (static, not admin-managed)
- `assets/videos/` — homepage hero videos
- `assets/_raw-originals/` — uncompressed camera originals kept locally for re-editing; **gitignored**, never deployed
- `admin/` — password-protected client admin panel; the **only** way gallery/team photos get added, edited, or removed (see "Client admin panel" below)
- `scripts/migrate-manifest.php` — one-time CLI script to seed `manifest.json` from photos already on disk (see "Gallery photos" below)
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

Gallery and team photos are **only** added, edited, or removed through `/admin`
(`admin/upload.php` / `admin/delete.php`) — there is no filesystem
auto-discovery anymore. A file dropped straight into `assets/images/gallery/`
by any other means (cPanel File Manager, `git push` + deploy, etc.) will
**not** appear on the site; only `/admin` writes the manifest that the public
pages read.

Each folder has a `manifest.json` (gitignored — content differs per
environment, so it's never committed) that `admin/upload.php` and
`admin/delete.php` keep in sync with the files on disk:

- `assets/images/gallery/manifest.json`
- `assets/images/team/manifest.json`

These are plain static JSON files, not PHP endpoints — `assets/js/gallery.js`
fetches `assets/images/gallery/manifest.json` directly for the gallery page,
and `assets/js/script.js` fetches the same file (filtered to
`category: "transformation"`) for the homepage "Transformation" section, and
`assets/images/team/manifest.json` for the "Expert Trainers" section.
`admin/list.php` reads the same two files for the admin dashboard, so what
the client sees in `/admin` always matches what's live.

Category, title, portrait/landscape detection, name, and designation are all
decided **at upload time** by `admin/upload.php` and stored in the manifest —
not parsed from the filename on every page load the way the old
`gallery-list.php`/`team-list.php` scan used to work.

### First-time setup / new environment

A fresh checkout (or a folder of photos that predates this system) has no
`manifest.json` yet. Seed one from whatever's already on disk:

```bash
php scripts/migrate-manifest.php
```

Safe to re-run — it skips a folder that already has a `manifest.json` rather
than overwriting admin-managed data. Run this once per environment (local,
and again on the live server over SSH) right after this system is deployed
there for the first time; after that, `/admin` owns the manifests going
forward and this script never needs to run again.

### Photo storage on the server

Full-size gallery and interior photos are kept in `/home/cb4jf27barw2/images/gallery` and `/home/cb4jf27barw2/images/interior` — outside `public_html`, so they aren't tracked by this repo's deploy flow. `public_html/assets/images/gallery` and `public_html/assets/images/interior` are symlinks into that folder, so the site serves them at the normal `./assets/images/gallery/...` / `./assets/images/interior/...` URLs without any code changes.

Locally, the equivalent staging folders are `D:\DEV\Web\FMA\images\gallery` and `D:\DEV\Web\FMA\images\interior` — copy from there into this repo's `assets/images/gallery/` / `assets/images/interior/` for local testing (there's no symlink locally, just plain copies).

| Local (dev machine)                    | Server                                          |
|-----------------------------------------|--------------------------------------------------|
| `D:\DEV\Web\FMA\images\gallery`         | `/home/cb4jf27barw2/images/gallery` (symlinked from `public_html/assets/images/gallery`) |
| `D:\DEV\Web\FMA\images\interior`        | `/home/cb4jf27barw2/images/interior` (symlinked from `public_html/assets/images/interior`) |

`manifest.json` deliberately lives inside those same symlinked folders
(`assets/images/gallery/manifest.json`, `assets/images/team/manifest.json`)
rather than some other git-tracked path — same reasoning as the images
themselves: it changes constantly at runtime via `/admin`, so it must stay
outside the git-based deploy flow to avoid `git pull` ever conflicting with
it.

## Client admin panel

`admin/` is a small self-contained PHP app (session login + AJAX upload/delete)
that lets the client add/remove gallery and team photos from a browser at
`thefma.in/admin`, without touching cPanel — it's now the **only** way
photos get added, so there's no separate manual/cPanel workflow to keep in
sync with it. It's documented for the client in `guide.md`. Implementation
notes for developers:

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
  - Also run `php scripts/migrate-manifest.php` once (see "Gallery photos"
    above) so any photos already on disk get an initial `manifest.json`.
- **Upload flow**: the browser resizes/re-encodes photos client-side (canvas,
  max 1600px, JPEG q≈0.82) before sending, so the client never has to think
  about file size. `admin/upload.php` re-validates the file server-side
  (real image sniffing via `getimagesize`, 8MB hard cap, extension
  whitelist), writes it into `assets/images/gallery/` or
  `assets/images/team/`, and records it in that folder's `manifest.json`
  (`admin/manifest.php`, `update_manifest()` — read-modify-write under an
  exclusive `flock`). If the manifest write fails, the uploaded file is
  removed rather than left orphaned on disk but invisible everywhere.
- **Delete flow**: `admin/delete.php` unlinks the file by exact basename
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
- New gallery/team photo not showing up → confirm it was added via `/admin` (not dropped directly into the folder — that's no longer auto-discovered), and that `assets/images/gallery/manifest.json` / `assets/images/team/manifest.json` is reachable directly in a browser and returns a JSON array, not a 404 or PHP error.
- `/admin` shows no photos (or fewer than expected) right after this admin-only system was first deployed to an environment → `manifest.json` hasn't been seeded yet; run `php scripts/migrate-manifest.php` once (see "Gallery photos" above).
