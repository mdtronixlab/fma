'use strict';

(function () {
  const csrfToken = document.body.dataset.csrf;
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  // All admin endpoints and asset links are root-relative on purpose: this
  // page can be reached as both "/admin" and "/admin/" (no trailing slash
  // included), and a plain relative path like "admin.css" or "list.php"
  // resolves differently depending on which of those the browser thinks
  // it's at. Root-relative paths sidestep that entirely.
  const ADMIN_BASE = '/admin/';

  function assetUrl(relativeImagePath) {
    return '/' + relativeImagePath.replace(/^\.\//, '');
  }

  // ---------- small utilities ----------

  function toast(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  function titleCaseFromFilename(filename) {
    const base = filename.replace(/\.[^.]+$/, '');
    const words = base.replace(/[-_]+/g, ' ').trim();
    return words.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }

  /** Resize + re-encode an image file client-side so clients never have to
   *  think about file size. Falls back to the original file if the browser
   *  can't do canvas/bitmap work for some reason. */
  async function compressImage(file) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
      );
      if (!blob) return file;
      // Only use the compressed version if it's actually smaller.
      return blob.size < file.size ? blob : file;
    } catch {
      return file;
    }
  }

  async function api(url, { method = 'GET', body = null, isJson = false } = {}) {
    const headers = { 'X-Requested-With': 'fetch' };
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
    if (isJson) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, { method, headers, body, credentials: 'same-origin' });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server error (${res.status})`);
    }
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  // ---------- tabs ----------

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // ---------- existing photo grids ----------

  const galleryGrid = document.getElementById('gallery-grid');
  const teamGrid = document.getElementById('team-grid');
  let currentGalleryFilter = 'all';
  let galleryItems = [];
  let teamItems = [];

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function renderGalleryGrid() {
    const items = currentGalleryFilter === 'all'
      ? galleryItems
      : galleryItems.filter((i) => i.category === currentGalleryFilter);

    if (items.length === 0) {
      galleryGrid.innerHTML = '<p class="empty-state">No photos in this category yet.</p>';
      return;
    }

    galleryGrid.innerHTML = items.map((item) => `
      <div class="photo-card">
        <img src="${assetUrl(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
        <div class="photo-card-body">
          <p class="photo-card-title">${escapeHtml(item.title)}</p>
          <p class="photo-card-meta">${escapeHtml(item.category)}</p>
          <button class="btn btn-danger" data-delete-gallery="${escapeHtml(item.filename)}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderTeamGrid() {
    if (teamItems.length === 0) {
      teamGrid.innerHTML = '<p class="empty-state">No team members added yet.</p>';
      return;
    }
    teamGrid.innerHTML = teamItems.map((item) => `
      <div class="photo-card">
        <img src="${assetUrl(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />
        <div class="photo-card-body">
          <p class="photo-card-title">${escapeHtml(item.name)}</p>
          <p class="photo-card-meta">${escapeHtml(item.designation)}</p>
          <button class="btn btn-danger" data-delete-team="${escapeHtml(item.filename)}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  async function refreshLists() {
    try {
      const data = await api(ADMIN_BASE + 'list.php');
      galleryItems = data.gallery || [];
      teamItems = data.team || [];
      renderGalleryGrid();
      renderTeamGrid();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  document.getElementById('gallery-filter').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    currentGalleryFilter = btn.dataset.filter;
    document.querySelectorAll('#gallery-filter button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderGalleryGrid();
  });

  galleryGrid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-delete-gallery]');
    if (!btn) return;
    const filename = btn.dataset.deleteGallery;
    if (!confirm(`Delete this photo?\n${filename}`)) return;
    try {
      await api(ADMIN_BASE + 'delete.php', {
        method: 'POST',
        isJson: true,
        body: JSON.stringify({ type: 'gallery', filename }),
      });
      toast('Photo deleted.');
      refreshLists();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  teamGrid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-delete-team]');
    if (!btn) return;
    const filename = btn.dataset.deleteTeam;
    if (!confirm(`Remove this team member?\n${filename}`)) return;
    try {
      await api(ADMIN_BASE + 'delete.php', {
        method: 'POST',
        isJson: true,
        body: JSON.stringify({ type: 'team', filename }),
      });
      toast('Team member removed.');
      refreshLists();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  // ---------- gallery upload queue ----------

  const galleryDropzone = document.getElementById('gallery-dropzone');
  const galleryFileInput = document.getElementById('gallery-file-input');
  const galleryQueueEl = document.getElementById('gallery-queue');
  const galleryUploadBtn = document.getElementById('gallery-upload-btn');
  const galleryClearBtn = document.getElementById('gallery-clear-btn');
  const galleryCategorySelect = document.getElementById('gallery-category');

  let galleryQueue = []; // { id, previewUrl, blobPromise, titleInput, status }
  let queueIdCounter = 0;

  function setupDropzone(zone, input, onFiles) {
    zone.addEventListener('click', (e) => {
      if (e.target !== input) input.click();
    });
    input.addEventListener('change', () => {
      onFiles(Array.from(input.files));
      input.value = '';
    });
    ['dragenter', 'dragover'].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      })
    );
    ['dragleave', 'drop'].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
      })
    );
    zone.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length) onFiles(files);
    });
  }

  function renderGalleryQueue() {
    galleryQueueEl.innerHTML = '';
    galleryQueue.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'queue-item';
      div.innerHTML = `
        <img src="${item.previewUrl}" alt="" />
        <div class="queue-item-body">
          <input type="text" value="${escapeHtml(item.title)}" data-role="title" />
          <div class="queue-item-status">
            <span data-role="status">Ready</span>
            <button class="queue-item-remove" data-role="remove">Remove</button>
          </div>
        </div>
      `;
      div.querySelector('[data-role="title"]').addEventListener('input', (e) => {
        item.title = e.target.value;
      });
      div.querySelector('[data-role="remove"]').addEventListener('click', () => {
        URL.revokeObjectURL(item.previewUrl);
        galleryQueue = galleryQueue.filter((q) => q.id !== item.id);
        renderGalleryQueue();
        updateGalleryButtons();
      });
      item.statusEl = div.querySelector('[data-role="status"]');
      galleryQueueEl.appendChild(div);
    });
  }

  function updateGalleryButtons() {
    const hasPending = galleryQueue.some((i) => i.status !== 'done');
    galleryUploadBtn.disabled = !hasPending;
    galleryClearBtn.disabled = galleryQueue.length === 0;
  }

  setupDropzone(galleryDropzone, galleryFileInput, (files) => {
    files.forEach((file) => {
      const id = ++queueIdCounter;
      const previewUrl = URL.createObjectURL(file);
      galleryQueue.push({
        id,
        file,
        previewUrl,
        title: titleCaseFromFilename(file.name),
        status: 'pending',
      });
    });
    renderGalleryQueue();
    updateGalleryButtons();
  });

  galleryClearBtn.addEventListener('click', () => {
    galleryQueue.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    galleryQueue = [];
    renderGalleryQueue();
    updateGalleryButtons();
  });

  galleryUploadBtn.addEventListener('click', async () => {
    galleryUploadBtn.disabled = true;
    const category = galleryCategorySelect.value;

    for (const item of galleryQueue) {
      if (item.status === 'done') continue;
      item.status = 'uploading';
      if (item.statusEl) item.statusEl.textContent = 'Uploading…';

      try {
        const blob = await compressImage(item.file);
        const form = new FormData();
        form.append('type', 'gallery');
        form.append('category', category);
        form.append('title', item.title || titleCaseFromFilename(item.file.name));
        form.append('photo', blob, 'photo.jpg');

        await api(ADMIN_BASE + 'upload.php', { method: 'POST', body: form });
        item.status = 'done';
        if (item.statusEl) {
          item.statusEl.textContent = 'Uploaded ✓';
          item.statusEl.parentElement.classList.add('status-done');
        }
      } catch (err) {
        item.status = 'error';
        if (item.statusEl) {
          item.statusEl.textContent = err.message;
          item.statusEl.parentElement.classList.add('status-error');
        }
      }
    }

    updateGalleryButtons();
    refreshLists();

    // Drop the successfully-uploaded items after a moment so the queue is
    // ready for the next batch; keep failures visible so they can retry.
    setTimeout(() => {
      galleryQueue.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.previewUrl));
      galleryQueue = galleryQueue.filter((i) => i.status !== 'done');
      renderGalleryQueue();
      updateGalleryButtons();
    }, 1200);
  });

  // ---------- team upload ----------

  const teamDropzone = document.getElementById('team-dropzone');
  const teamFileInput = document.getElementById('team-file-input');
  const teamDropzoneLabel = document.getElementById('team-dropzone-label');
  const teamNameInput = document.getElementById('team-name');
  const teamDesignationInput = document.getElementById('team-designation');
  const teamUploadBtn = document.getElementById('team-upload-btn');

  let teamPendingFile = null;

  function updateTeamButton() {
    teamUploadBtn.disabled = !(teamPendingFile && teamNameInput.value.trim());
  }

  setupDropzone(teamDropzone, teamFileInput, (files) => {
    const file = files[0];
    if (!file) return;
    teamPendingFile = file;
    teamDropzoneLabel.textContent = `Selected: ${file.name}`;
    updateTeamButton();
  });

  teamNameInput.addEventListener('input', updateTeamButton);

  teamUploadBtn.addEventListener('click', async () => {
    if (!teamPendingFile) return;
    teamUploadBtn.disabled = true;
    try {
      const blob = await compressImage(teamPendingFile);
      const form = new FormData();
      form.append('type', 'team');
      form.append('name', teamNameInput.value.trim());
      form.append('designation', teamDesignationInput.value.trim() || 'Trainer');
      form.append('photo', blob, 'photo.jpg');

      await api(ADMIN_BASE + 'upload.php', { method: 'POST', body: form });
      toast('Team member added.');

      teamPendingFile = null;
      teamDropzoneLabel.textContent = 'Drag a photo here, or click to choose one';
      teamNameInput.value = '';
      teamDesignationInput.value = '';
      refreshLists();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      updateTeamButton();
    }
  });

  // ---------- init ----------

  refreshLists();
})();
