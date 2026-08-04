# FMA Website — Gallery Photo & Video Guide

This guide explains how to add new photos to your Gallery page yourself,
without needing a developer. It also explains how the homepage videos work
and what your options are if you want to update them.

---

## Part 1: Adding Photos to the Gallery

The Gallery page (`thefma.in/gallery`) is set up to update **automatically**.
Whatever photo you upload into the gallery folder appears on the site the
next time someone loads the page — no code changes needed.

### Step 1 — Prepare the photo

- **File type:** JPG, JPEG, PNG, or WEBP
- **File size:** Keep it under ~500 KB. Camera photos are often 10+ MB, which
  slows the site down — resize/compress first (aim for max **1600px** on the
  longest side, JPEG quality **75–80%**). Any free tool works for this
  (e.g. Squoosh.app, TinyPNG, or your phone's built-in editor).

### Step 2 — Name the file correctly

The filename controls **where it shows up** and **what title it gets** — so
naming it right matters.

**a) Category prefix** (controls which filter tab it appears under):

| Prefix            | Shows under        |
|--------------------|--------------------|
| `training-...`     | Training            |
| `transformation-...` | Transformation (also appears on the homepage "Transformation" section automatically) |
| `lifestyle-...`     | Lifestyle            |

If you don't use one of these prefixes, the photo defaults to **Training**.

**b) The rest of the filename becomes the title.** Dashes/underscores become
spaces, and it's automatically title-cased.

**Examples:**

| Filename                              | Category        | Title on site        |
|----------------------------------------|------------------|------------------------|
| `training-leg-day-setup.jpg`           | Training          | Leg Day Setup           |
| `transformation-john-doe.jpg`          | Transformation    | John Doe                 |
| `lifestyle-team-lunch.png`             | Lifestyle         | Team Lunch                |
| `new-year-party.jpg` (no prefix)       | Training          | New Year Party            |

> Portrait vs. landscape layout on the grid is detected automatically from
> the photo itself — you don't need to do anything for that.

### Step 3 — Upload it

Log in to **cPanel → File Manager**, and go to:

```
public_html/assets/images/gallery
```

Upload your prepared, correctly-named photo into that folder. That's it —
reload the gallery page in your browser and it will appear.

> **Note on the folder path:** `public_html/assets/images/gallery` is a
> shortcut (symlink) that points to the real storage location,
> `/home/cb4jf27barw2/images/gallery`, which sits outside `public_html`.
> Uploading into the `public_html/assets/images/gallery` shortcut works
> normally in most cases. If cPanel File Manager ever shows that folder as
> empty or won't let you upload into it (some File Managers don't follow
> shortcuts well), navigate directly to `/home/cb4jf27barw2/images/gallery`
> instead — either path leads to the same place.

### Removing or replacing a photo

- **Remove:** delete the file from that same folder.
- **Replace:** delete the old file and upload the new one (or just upload a
  new file with a different name and delete the old one).

### Quick troubleshooting

- **Photo isn't showing up?** Double check it's actually in
  `assets/images/gallery` (not a different folder), and that the file
  extension is one of `.jpg .jpeg .png .webp`.
- **Wrong category or ugly title?** Re-check the filename against the table
  above — this is almost always a filename issue.

---

## Part 2: Videos

Video support works differently from photos, and it's **not** the same
auto-upload system.

### What exists today

The homepage has a small "Videos" section with **two fixed video clips**
(`assets/videos/hero-video-1.mp4` and `hero-video-2.mp4`). These are not
auto-discovered like gallery photos — the page is built to show exactly
those two files.

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
the photo gallery, with auto-discovery, thumbnails, and playback controls).
This isn't self-serve today — let your developer know and it can be added
as a feature.

---

## Need help?

If anything doesn't behave as described here (photo not appearing, video not
playing, etc.), send a screenshot along with the exact filename you used to
your developer, and it'll be quick to sort out.
