<?php
/**
 * Auto-lists images in assets/images/gallery/ so they show up on the
 * gallery page without any code changes. Just drop a photo in that
 * folder (e.g. via cPanel File Manager) and reload the page.
 *
 * Optional filename prefix sets the filter category:
 *   training-*.jpg | transformation-*.jpg | lifestyle-*.jpg
 * No recognized prefix defaults to "training". The rest of the filename
 * becomes the display title (dashes/underscores -> spaces, title-cased).
 * Portrait vs. landscape is detected from the actual image dimensions.
 */

header('Content-Type: application/json');

$dir = __DIR__ . '/images/gallery';
$publicPath = './assets/images/gallery/';
$categories = ['training', 'transformation', 'lifestyle'];
$allowedExt = ['jpg', 'jpeg', 'png', 'webp'];

$items = [];

if (is_dir($dir)) {
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

        $portrait = false;
        $size = @getimagesize($path);
        if ($size && $size[1] > $size[0]) {
            $portrait = true;
        }

        $items[] = [
            'image'    => $publicPath . rawurlencode($file),
            'title'    => $title,
            'category' => $category,
            'alt'      => $title,
            'portrait' => $portrait,
        ];
    }
}

echo json_encode(array_values($items));
