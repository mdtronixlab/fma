<?php
/**
 * ONE-TIME migration: seeds assets/images/gallery/manifest.json and
 * assets/images/team/manifest.json from whatever photos are already
 * sitting in those folders, using the filename-based parsing that used to
 * live in assets/gallery-list.php / assets/team-list.php.
 *
 * Run this once per environment (local, and again on the live server via
 * SSH) right after deploying the admin-panel-only workflow, so existing
 * photos don't disappear from the site. After this, admin/upload.php and
 * admin/delete.php own the manifests — this script never needs to run
 * again for photos added afterward.
 *
 * Usage (from repo root):
 *   php scripts/migrate-manifest.php
 *
 * Safe to re-run: it skips a folder if that folder already has a
 * manifest.json, rather than overwriting admin-managed data. Delete the
 * manifest.json first if you deliberately want to regenerate it from disk.
 */

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit("This script is CLI-only.\n");
}

require __DIR__ . '/../admin/manifest.php';

function migrate_gallery(string $dir): void {
    if (is_file(manifest_path($dir))) {
        echo "  Skipping gallery — manifest.json already exists.\n";
        return;
    }
    if (!is_dir($dir)) {
        echo "  Skipping gallery — folder doesn't exist ($dir).\n";
        return;
    }

    $categories = ['training', 'transformation', 'lifestyle'];
    $allowedExt = ['jpg', 'jpeg', 'png', 'webp'];
    $items = [];

    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..' || $file === 'manifest.json') continue;
        $path = $dir . '/' . $file;
        if (!is_file($path)) continue;

        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExt, true)) continue;

        $name = pathinfo($file, PATHINFO_FILENAME);
        $category = 'training';
        foreach ($categories as $cat) {
            if (stripos($name, $cat . '-') === 0) {
                $category = $cat;
                $name = substr($name, strlen($cat) + 1);
                break;
            }
        }

        $title = trim(preg_replace('/[-_]+/', ' ', $name));
        $title = $title === '' ? 'Gallery Photo' : ucwords($title);

        $portrait = false;
        $size = @getimagesize($path);
        if ($size && $size[1] > $size[0]) $portrait = true;

        $items[] = [
            'filename' => $file,
            'image'    => './assets/images/gallery/' . rawurlencode($file),
            'title'    => $title,
            'category' => $category,
            'alt'      => $title,
            'portrait' => $portrait,
            '_mtime'   => filemtime($path), // sort key only, stripped below
        ];
    }

    usort($items, fn($a, $b) => $b['_mtime'] <=> $a['_mtime']); // newest first
    foreach ($items as &$item) unset($item['_mtime']);

    update_manifest($dir, fn() => $items);
    echo '  Wrote ' . count($items) . " gallery photo(s) to manifest.json\n";
}

function migrate_team(string $dir): void {
    if (is_file(manifest_path($dir))) {
        echo "  Skipping team — manifest.json already exists.\n";
        return;
    }
    if (!is_dir($dir)) {
        echo "  Skipping team — folder doesn't exist ($dir).\n";
        return;
    }

    $allowedExt = ['jpg', 'jpeg', 'png', 'webp'];
    $items = [];

    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..' || $file === 'manifest.json') continue;
        $path = $dir . '/' . $file;
        if (!is_file($path)) continue;

        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExt, true)) continue;

        $base = pathinfo($file, PATHINFO_FILENAME);
        $sepPos = strpos($base, '-');

        if ($sepPos !== false) {
            $name  = substr($base, 0, $sepPos);
            $title = substr($base, $sepPos + 1);
        } else {
            $name  = $base;
            $title = 'Trainer';
        }

        $name  = trim(str_replace('_', ' ', $name));
        $title = trim(str_replace('_', ' ', $title));

        $items[] = [
            'filename'    => $file,
            'image'       => './assets/images/team/' . rawurlencode($file),
            'name'        => $name !== '' ? ucwords($name) : 'Team Member',
            'designation' => $title !== '' ? ucwords($title) : 'Trainer',
            '_mtime'      => filemtime($path),
        ];
    }

    usort($items, fn($a, $b) => $b['_mtime'] <=> $a['_mtime']);
    foreach ($items as &$item) unset($item['_mtime']);

    update_manifest($dir, fn() => $items);
    echo '  Wrote ' . count($items) . " team member(s) to manifest.json\n";
}

echo "Migrating gallery photos...\n";
migrate_gallery(__DIR__ . '/../assets/images/gallery');

echo "Migrating team photos...\n";
migrate_team(__DIR__ . '/../assets/images/team');

echo "Done.\n";
