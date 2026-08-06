# FMA Website — Gallery Photo & Video Guide

This guide explains how to add new photos to your Gallery page yourself,
without needing a developer. It also explains how the homepage videos work
and what your options are if you want to update them.

---

## Part 1: Adding Gallery Photos & Team Members

All gallery and team photos are managed through one place: the admin panel
at **`thefma.in/admin`**. This is the **only** way to add, replace, or
remove them — dropping a file directly into the images folder via cPanel
File Manager will **not** make it appear on the site anymore.

### Step 1 — Sign in

Go to **`thefma.in/admin`** and sign in with the password your developer
gave you.

### Step 2 — Add a photo

Pick the **Gallery Photos** or **Team Members** tab.

- **Gallery photo:** choose a category (Training / Transformation /
  Lifestyle — Transformation photos also show up on the homepage
  "Transformation" section automatically), then drag in one or more photos.
  Each gets an editable title, which you can adjust before uploading.
- **Team member:** enter their name and title, then choose one photo.

Click **Upload** / **Add team member**. That's it — no filename rules to
remember, and no need to resize or compress the photo first; it's done
automatically (max 1600px, compressed) before it's sent.

### Step 3 — Remove or replace a photo

The same screen lists every photo currently on the site with a **Delete**
button next to it. To replace one, delete the old one and upload the new
one.

> **Forgot the password, or need it changed?** Ask your developer — it's
> not recoverable from the site itself by design.

---

## Part 2: Videos

Video support works differently from photos, and it's **not** part of the
admin panel above.

### What exists today

The homepage has a small "Videos" section with **two fixed video clips**
(`assets/videos/hero-video-1.mp4` and `hero-video-2.mp4`). These aren't
managed through the admin panel — the page is built to show exactly those
two files.

> The **Gallery page itself does not currently display videos** — it's
> photos only, at the moment.

### Updating one of the two homepage videos

If you want to swap out one of the existing homepage clips for a new one:

1. Prepare your video as an **MP4** (H.264), ideally **under ~15–20 MB** and
   no longer than 15–20 seconds — large videos will slow the homepage down.
2. In cPanel File Manager, go to `public_html/assets/videos`.
3. Upload your new file using the **exact same filename** as the one you're
   replacing (`hero-video-1.mp4` or `hero-video-2.mp4`) and overwrite it.
4. Reload the homepage to confirm it plays correctly.

### If you want more than two videos, or a video gallery

That requires a small code change (adding a proper video gallery, similar to
the photo gallery, with thumbnails and playback controls). This isn't
self-serve today — let your developer know and it can be added as a
feature.

---

## Need help?

If anything doesn't behave as described here (photo not appearing, video not
playing, etc.), send a screenshot along with what you did to your developer,
and it'll be quick to sort out.
