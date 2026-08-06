<?php
/**
 * Handles a single photo upload from the admin dashboard for either the
 * gallery or the team section. This is the ONLY way a photo gets added to
 * either section — it saves the file and records it in that folder's
 * manifest.json, which is what the public site and the admin dashboard
 * both read from. A file dropped into the folder by any other means (e.g.
 * cPanel File Manager) will NOT appear on the site, by design — see
 * admin/manifest.php.
 */

require __DIR__ . '/auth.php';
require __DIR__ . '/manifest.php';
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

$type = $_POST['type'] ?? '';
if (!in_array($type, ['gallery', 'team'], true)) {
    fail('Unknown upload type.');
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] === UPLOAD_ERR_NO_FILE) {
    fail('No photo was received.');
}

$file = $_FILES['photo'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'The photo is larger than this server allows.',
        UPLOAD_ERR_FORM_SIZE  => 'The photo is larger than this server allows.',
        UPLOAD_ERR_PARTIAL    => 'The photo was only partially uploaded — try again.',
        UPLOAD_ERR_NO_TMP_DIR => 'Server is missing a temp folder — contact your developer.',
        UPLOAD_ERR_CANT_WRITE => 'Server could not write the file — contact your developer.',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by a server extension.',
    ];
    fail($uploadErrors[$file['error']] ?? 'Upload failed.');
}

// Hard cap as a safety net — the browser already resizes photos before
// sending them, so a legitimate upload should never get close to this.
$maxBytes = 8 * 1024 * 1024;
if ($file['size'] > $maxBytes) {
    fail('Photo is too large (max 8 MB).');
}

// Sniff the real file type — never trust the client-supplied extension/MIME.
$imageInfo = @getimagesize($file['tmp_name']);
if ($imageInfo === false) {
    fail('That file does not look like a valid image.');
}

$mimeToExt = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];
$mime = $imageInfo['mime'];
if (!isset($mimeToExt[$mime])) {
    fail('Only JPG, PNG, and WEBP photos are supported.');
}
$ext = $mimeToExt[$mime];

/** Turn arbitrary text into a filename-safe, title-case-friendly slug. */
function slugify(string $text, string $separator = '-'): string {
    $text = str_replace(['_', '/'], ' ', $text);
    $text = preg_replace('/[^\p{L}\p{N}\s' . preg_quote($separator, '/') . ']/u', '', $text) ?? '';
    $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
    return str_replace(' ', $separator, $text);
}

/** Avoid clobbering an existing file by appending -2, -3, ... before the extension. */
function uniqueFilename(string $dir, string $base, string $ext): string {
    $candidate = "$base.$ext";
    $i = 2;
    while (is_file($dir . '/' . $candidate)) {
        $candidate = "$base-$i.$ext";
        $i++;
    }
    return $candidate;
}

if ($type === 'gallery') {
    $categories = ['training', 'transformation', 'lifestyle'];
    $category = $_POST['category'] ?? 'training';
    if (!in_array($category, $categories, true)) {
        $category = 'training';
    }

    $title = trim($_POST['title'] ?? '');
    if ($title === '') {
        fail('Please give the photo a title.');
    }
    $titleSlug = strtolower(slugify($title));
    if ($titleSlug === '') {
        fail('That title has no usable characters — try a different one.');
    }

    $dir = __DIR__ . '/../assets/images/gallery';
    $publicPath = './assets/images/gallery/';
    $base = "$category-$titleSlug";
} else {
    $name = trim($_POST['name'] ?? '');
    $designation = trim($_POST['designation'] ?? '') ?: 'Trainer';
    if ($name === '') {
        fail('Please enter the team member\'s name.');
    }

    $nameSlug = slugify($name, '_');
    $designationSlug = slugify($designation, '_');
    if ($nameSlug === '') {
        fail('That name has no usable characters — try a different one.');
    }

    $dir = __DIR__ . '/../assets/images/team';
    $publicPath = './assets/images/team/';
    $base = "$nameSlug-$designationSlug";
}

if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
    fail('Server could not create the target folder — contact your developer.', 500);
}
if (!is_writable($dir)) {
    fail('Target folder is not writable — contact your developer.', 500);
}

$filename = uniqueFilename($dir, $base, $ext);
$destination = $dir . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    fail('Could not save the uploaded photo.', 500);
}
chmod($destination, 0644);

$image = $publicPath . rawurlencode($filename);

if ($type === 'gallery') {
    $portrait = $imageInfo[1] > $imageInfo[0];
    $entry = [
        'filename' => $filename,
        'image'    => $image,
        'title'    => $title,
        'category' => $category,
        'alt'      => $title,
        'portrait' => $portrait,
    ];
} else {
    $entry = [
        'filename'    => $filename,
        'image'       => $image,
        'name'        => ucwords(str_replace(['_', '-'], ' ', $name)),
        'designation' => ucwords(str_replace(['_', '-'], ' ', $designation)),
    ];
}

try {
    update_manifest($dir, function (array $items) use ($entry) {
        array_unshift($items, $entry);
        return $items;
    });
} catch (Throwable $e) {
    // The file made it to disk but the manifest write failed — remove the
    // orphaned file rather than leave a photo that's on disk but invisible
    // everywhere (including the admin dashboard, since it also reads the
    // manifest), which would be a confusing state to debug later.
    @unlink($destination);
    fail('Photo saved but could not be listed — try again.', 500);
}

echo json_encode(['ok' => true] + $entry);
