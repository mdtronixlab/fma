<?php
/**
 * Shared session/auth helper for the admin panel. Include this at the top
 * of every admin/*.php file (except login itself, which includes it too but
 * doesn't call require_login()).
 *
 * Password is set via admin/config.php (gitignored — copy from
 * config.sample.php and set your own hash). See guide.md for setup.
 */

session_set_cookie_params([
    'lifetime' => 0,
    // Deliberately '/', not '/admin/': per RFC 6265 path-matching, a cookie
    // scoped to '/admin/' (trailing slash) does NOT match a bare "/admin"
    // request (no trailing slash) — only "/admin/" and below. Apache will
    // normally 301-redirect "/admin" -> "/admin/" before PHP ever runs, so
    // this wouldn't usually bite, but it's not worth depending on that.
    'path'     => '/',
    'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

// Session hardening: regenerate ID periodically, avoid fixation.
if (empty($_SESSION['admin_started'])) {
    session_regenerate_id(true);
    $_SESSION['admin_started'] = time();
}

$configPath = __DIR__ . '/config.php';
$config = is_file($configPath) ? require $configPath : null;

function admin_password_hash(): ?string {
    global $config;
    return $config['password_hash'] ?? null;
}

function is_logged_in(): bool {
    return !empty($_SESSION['admin_logged_in']);
}

function require_login(): void {
    if (!is_logged_in()) {
        // API endpoints get a JSON 401; pages get redirected to the login form.
        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) || str_ends_with($_SERVER['SCRIPT_NAME'], 'upload.php') || str_ends_with($_SERVER['SCRIPT_NAME'], 'delete.php') || str_ends_with($_SERVER['SCRIPT_NAME'], 'list.php')) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Not authenticated']);
            exit;
        }
        header('Location: index.php');
        exit;
    }
}

/** Small brute-force deterrent: growing delay after repeated failed logins. */
function register_failed_login(): void {
    $_SESSION['failed_logins'] = ($_SESSION['failed_logins'] ?? 0) + 1;
    usleep(min(3_000_000, 300_000 * $_SESSION['failed_logins']));
}

function clear_failed_logins(): void {
    unset($_SESSION['failed_logins']);
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function require_csrf(): void {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $sent)) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Bad CSRF token, please reload the page and try again.']);
        exit;
    }
}
