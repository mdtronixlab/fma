<?php
/**
 * Deletes a single gallery or team photo. Only ever touches files inside
 * the two known image folders, and only by exact basename (no path
 * traversal, no wildcards).
 */

require __DIR__ . '/auth.php';
require_login();

header('Content-Type: application/json');

function fail(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

require_csrf();

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$type = $input['type'] ?? '';
$filename = $input['filename'] ?? '';

if (!in_array($type, ['gallery', 'team'], true)) {
    fail('Unknown type.');
}
if ($filename === '' || $filename !== basename($filename)) {
    fail('Invalid filename.');
}

$dir = $type === 'gallery'
    ? __DIR__ . '/../assets/images/gallery'
    : __DIR__ . '/../assets/images/team';

$path = $dir . '/' . $filename;
$realDir = realpath($dir);
$realPath = realpath($path);

if ($realPath === false || $realDir === false || !str_starts_with($realPath, $realDir)) {
    fail('File not found.', 404);
}
if (!is_file($realPath)) {
    fail('File not found.', 404);
}

if (!unlink($realPath)) {
    fail('Could not delete the file — check folder permissions.', 500);
}

echo json_encode(['ok' => true]);
