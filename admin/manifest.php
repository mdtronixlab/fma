<?php
/**
 * Shared manifest read/write helpers.
 *
 * Gallery and team photos are no longer auto-discovered by scanning the
 * images folder (that let anyone with cPanel access add/rename photos
 * outside the admin panel, bypassing it entirely). Instead, each folder
 * has a manifest.json that the admin panel is the only thing that ever
 * writes to — the public site's gallery.js / script.js fetch it directly
 * as a static JSON file, and admin/list.php reads the same file. A photo
 * only appears on the site if it went through /admin/upload.php.
 *
 * manifest.json intentionally lives *inside* assets/images/gallery|team/,
 * not in a git-tracked folder — those folders are symlinked to storage
 * outside public_html on the server specifically so uploaded content never
 * collides with the git-based deploy flow. See README.md.
 *
 * New entries are prepended, so the manifest (and therefore the public
 * gallery/team sections) is always newest-first.
 */

function manifest_path(string $dir): string {
    return $dir . '/manifest.json';
}

function read_manifest(string $dir): array {
    $path = manifest_path($dir);
    if (!is_file($path)) return [];

    $fh = @fopen($path, 'r');
    if (!$fh) return [];
    flock($fh, LOCK_SH);
    $raw = stream_get_contents($fh);
    flock($fh, LOCK_UN);
    fclose($fh);

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Read-modify-write under an exclusive lock so concurrent admin requests
 *  (two uploads at once, an upload racing a delete) can't clobber each
 *  other. $mutator receives the current items array and returns the new one. */
function update_manifest(string $dir, callable $mutator): array {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $path = manifest_path($dir);

    $fh = fopen($path, 'c+');
    if (!$fh) {
        throw new RuntimeException('Could not open manifest for writing.');
    }
    flock($fh, LOCK_EX);

    $raw = stream_get_contents($fh);
    $items = json_decode($raw, true);
    if (!is_array($items)) $items = [];

    $items = $mutator($items);

    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode(array_values($items), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    @chmod($path, 0644);

    return $items;
}
