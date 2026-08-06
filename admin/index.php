<?php
require __DIR__ . '/auth.php';

$loginError = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    require_csrf();

    $hash = admin_password_hash();
    if ($hash === null || str_contains($hash, 'REPLACE')) {
        $loginError = 'Admin password is not configured yet — see admin/config.sample.php.';
    } elseif (($_SESSION['failed_logins'] ?? 0) > 20) {
        $loginError = 'Too many failed attempts. Try again later.';
    } elseif (password_verify($_POST['password'], $hash)) {
        clear_failed_logins();
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        header('Location: index.php');
        exit;
    } else {
        register_failed_login();
        $loginError = 'Incorrect password.';
    }
}

if (!is_logged_in()) {
    ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>FMA Admin — Login</title>
  <link rel="stylesheet" href="/admin/admin.css" />
</head>
<body>
  <div class="login-shell">
    <div class="login-card">
      <h1>FMA Admin</h1>
      <p class="subtitle">Sign in to manage gallery &amp; team photos.</p>
      <?php if ($loginError): ?>
        <div class="error-banner"><?= htmlspecialchars($loginError) ?></div>
      <?php endif; ?>
      <form method="post" action="/admin/index.php" autocomplete="off">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars(csrf_token()) ?>" />
        <div class="field">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" autofocus required />
        </div>
        <button type="submit" class="btn btn-accent" style="width:100%; justify-content:center;">Sign in</button>
      </form>
    </div>
  </div>
</body>
</html>
    <?php
    exit;
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>FMA Admin — Photos</title>
  <link rel="stylesheet" href="/admin/admin.css" />
</head>
<body data-csrf="<?= htmlspecialchars(csrf_token()) ?>">
  <header class="topbar">
    <h1>FMA <span>Admin</span></h1>
    <a href="/admin/logout.php" class="btn btn-ghost">Log out</a>
  </header>

  <main class="container">
    <div class="tabs">
      <button class="tab-btn active" data-tab="gallery">Gallery Photos</button>
      <button class="tab-btn" data-tab="team">Team Members</button>
    </div>

    <!-- ===================== GALLERY TAB ===================== -->
    <section class="tab-panel active" id="tab-gallery">
      <div class="panel">
        <h2>Add gallery photos</h2>
        <p class="panel-hint">Pick a category, then drag in one or more photos. They're resized automatically — no need to compress first. Edit the title under each thumbnail if you want.</p>

        <div class="form-row">
          <div class="field">
            <label for="gallery-category">Category</label>
            <select id="gallery-category">
              <option value="training">Training</option>
              <option value="transformation">Transformation</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </div>
        </div>

        <label class="dropzone" id="gallery-dropzone">
          <input type="file" id="gallery-file-input" accept="image/jpeg,image/png,image/webp" multiple />
          <div>Drag photos here, or click to choose files</div>
        </label>

        <div class="queue" id="gallery-queue"></div>

        <div style="margin-top:16px; display:flex; gap:10px;">
          <button class="btn btn-accent" id="gallery-upload-btn" disabled>Upload all</button>
          <button class="btn btn-ghost" id="gallery-clear-btn" disabled>Clear</button>
        </div>
      </div>

      <div class="panel">
        <h2>Current gallery photos</h2>
        <div class="grid-filter" id="gallery-filter">
          <button class="active" data-filter="all">All</button>
          <button data-filter="training">Training</button>
          <button data-filter="transformation">Transformation</button>
          <button data-filter="lifestyle">Lifestyle</button>
        </div>
        <div class="photo-grid" id="gallery-grid"></div>
      </div>
    </section>

    <!-- ===================== TEAM TAB ===================== -->
    <section class="tab-panel" id="tab-team">
      <div class="panel">
        <h2>Add a team member</h2>
        <p class="panel-hint">Enter their name and title, then choose a photo. It's resized automatically.</p>

        <div class="form-row">
          <div class="field">
            <label for="team-name">Name</label>
            <input type="text" id="team-name" placeholder="e.g. Rahul Verma" />
          </div>
          <div class="field">
            <label for="team-designation">Title</label>
            <input type="text" id="team-designation" placeholder="e.g. Head Trainer" />
          </div>
        </div>

        <label class="dropzone" id="team-dropzone">
          <input type="file" id="team-file-input" accept="image/jpeg,image/png,image/webp" />
          <div id="team-dropzone-label">Drag a photo here, or click to choose one</div>
        </label>

        <div style="margin-top:16px;">
          <button class="btn btn-accent" id="team-upload-btn" disabled>Add team member</button>
        </div>
      </div>

      <div class="panel">
        <h2>Current team members</h2>
        <div class="photo-grid" id="team-grid"></div>
      </div>
    </section>
  </main>

  <script src="/admin/admin.js"></script>
</body>
</html>
