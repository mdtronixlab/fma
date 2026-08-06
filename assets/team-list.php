<?php
/**
 * Auto-lists team members from assets/images/team/ so they show up in the
 * "Expert Trainers" section without any code changes. Just drop a photo in
 * that folder (e.g. via cPanel File Manager) and reload the page.
 *
 * Filename format: Name-Designation.jpg
 *   e.g. "Rahul Verma-Head Trainer.jpg" or "Priya_Sharma-Yoga_Instructor.png"
 * Everything before the FIRST hyphen is the name, everything after it is
 * the designation. Underscores are treated as spaces in either part, and
 * both are automatically title-cased.
 * No hyphen in the filename? The whole filename is used as the name and
 * the designation defaults to "Trainer".
 */

header('Content-Type: application/json');

$dir = __DIR__ . '/images/team';
$publicPath = './assets/images/team/';
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
            'image' => $publicPath . rawurlencode($file),
            'name'  => $name !== '' ? ucwords($name) : 'Team Member',
            'title' => $title !== '' ? ucwords($title) : 'Trainer',
        ];
    }
}

echo json_encode(array_values($items));
