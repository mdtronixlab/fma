<?php
/**
 * Admin dashboard listing — reads the exact same manifest.json files the
 * public site reads (assets/images/gallery/manifest.json and
 * assets/images/team/manifest.json), so what the client sees here always
 * matches what's live.
 */

require __DIR__ . '/auth.php';
require __DIR__ . '/manifest.php';
require_login();

header('Content-Type: application/json');

echo json_encode([
    'gallery' => read_manifest(__DIR__ . '/../assets/images/gallery'),
    'team'    => read_manifest(__DIR__ . '/../assets/images/team'),
]);
