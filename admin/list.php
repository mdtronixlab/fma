<?php
/**
 * Admin-only listing of gallery + team photos, including the raw filename
 * (needed by the dashboard to offer delete). Mirrors the parsing logic in
 * assets/gallery-list.php and assets/team-list.php — keep them in sync if
 * the naming convention ever changes.
 */

require __DIR__ . '/auth.php';
require_login();

header('Content-Type: application/json');

$categories = ['training', 'transformation', 'lifestyle'];
$allowedExt = ['jpg', 'jpeg', 'png', 'webp'];

function list_gallery(string $dir, string $publicPath, array $categories, array $allowedExt): array {
    $items = [];
    if (!is_dir($dir)) return $items;

    $files = scandir($dir);
    natsort($files);

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
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

        $items[] = [
            'filename' => $file,
            'image'    => $publicPath . rawurlencode($file),
            'title'    => $title,
            'category' => $category,
            'size'     => filesize($path),
            'mtime'    => filemtime($path),
        ];
    }
    // Newest first for the admin view.
    usort($items, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
    return $items;
}

function list_team(string $dir, string $publicPath, array $allowedExt): array {
    $items = [];
    if (!is_dir($dir)) return $items;

    $files = scandir($dir);
    natsort($files);

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
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
            'image'       => $publicPath . rawurlencode($file),
            'name'        => $name !== '' ? ucwords($name) : 'Team Member',
            'designation' => $title !== '' ? ucwords($title) : 'Trainer',
            'size'        => filesize($path),
            'mtime'       => filemtime($path),
        ];
    }
    usort($items, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
    return $items;
}

echo json_encode([
    'gallery' => list_gallery(__DIR__ . '/../assets/images/gallery', './assets/images/gallery/', $categories, $allowedExt),
    'team'    => list_team(__DIR__ . '/../assets/images/team', './assets/images/team/', $allowedExt),
]);
