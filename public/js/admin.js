function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

function adminToast(type, title, detail) {
  if (typeof showToast === 'function') {
    showToast(type, title, detail);
  }
}

async function loadAdminClasses() {
  const tbody = document.getElementById('admin-class-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Memuat data kelas...</td></tr>';

  try {
    const res = await apiFetch('/api/admin/classes');
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(data.message || 'Gagal memuat data kelas');
    }

    const countEl = document.getElementById('admin-class-count');
    if (countEl) countEl.textContent = `${data.data.length} kelas`;

    if (data.data.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Belum ada kelas. Tambah kelas untuk membuat akun wali.</td></tr>';
      return;
    }

    tbody.innerHTML = data.data.map(row => `
      <tr>
        <td><strong>${escapeHtml(row.class)}</strong></td>
        <td>${row.student_count}</td>
        <td>${row.account
          ? `<span class="user-chip">${escapeHtml(row.account.username)}</span>`
          : '<span class="muted-text">Belum ada akun</span>'}</td>
        <td>
          <div class="actions-cell">
            ${row.account
              ? `<button type="button" class="btn-action btn-edit" data-action="reset" data-class="${escapeAttr(row.class)}">Reset Password</button>
                 <button type="button" class="btn-action btn-delete" data-action="remove" data-class="${escapeAttr(row.class)}">Hapus Akun</button>`
              : `<button type="button" class="btn-action btn-edit" data-action="create" data-class="${escapeAttr(row.class)}">Buat Akun</button>`}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function handleClassAction(btn) {
  const className = btn.dataset.class;
  const action = btn.dataset.action;
  if (!className) return;

  btn.disabled = true;
  try {
    const path = action === 'reset'
      ? '/api/admin/classes/reset-password'
      : action === 'remove'
        ? '/api/admin/classes/remove-account'
        : '/api/admin/classes';
    const payload = JSON.stringify({ class: className });
    const res = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const data = await res.json();
    if (data.success) {
      const detail = data.default_password ? `${data.message} (password: ${data.default_password})` : data.message;
      adminToast('success', action === 'remove' ? 'Akun dihapus' : 'Kelas', detail);
    } else {
      adminToast('error', 'Gagal', data.message || 'Terjadi kesalahan');
    }
  } catch (err) {
    adminToast('error', 'Gagal', err.message || 'Koneksi bermasalah');
  } finally {
    btn.disabled = false;
    loadAdminClasses();
  }
}

async function addClass() {
  const input = document.getElementById('admin-class-input');
  const btn = document.getElementById('admin-class-add-btn');
  const className = (input.value || '').trim();
  if (!className) {
    input.focus();
    return;
  }

  btn.disabled = true;
  try {
    const res = await apiFetch('/api/admin/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class: className }),
    });
    const data = await res.json();
    if (data.success) {
      adminToast('success', 'Kelas dibuat', `${data.message} (password: ${data.default_password})`);
      input.value = '';
    } else {
      adminToast('error', 'Gagal', data.message || 'Terjadi kesalahan');
    }
  } catch (err) {
    adminToast('error', 'Gagal', err.message || 'Koneksi bermasalah');
  } finally {
    btn.disabled = false;
    loadAdminClasses();
  }
}

async function importStudents() {
  const textarea = document.getElementById('import-lines');
  const btn = document.getElementById('import-btn');
  const resultEl = document.getElementById('import-result');
  const lines = (textarea.value || '').trim();

  if (!lines) {
    if (resultEl) { resultEl.className = 'import-result error'; resultEl.textContent = 'Isi data terlebih dahulu.'; }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Mengimpor...';
  try {
    const res = await apiFetch('/api/students/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Import gagal');

    const errors = Array.isArray(data.errors) ? data.errors : [];
    if (resultEl) {
      resultEl.className = errors.length ? 'import-result error' : 'import-result success';
      resultEl.textContent = `${data.added} siswa ditambahkan, ${data.skipped} dilewati (sudah ada).${errors.length ? ` ${errors.length} baris bermasalah.` : ''}`;
    }
    if (errors.length) {
      resultEl.textContent += ` ${errors.join(' | ')}`;
    }
    textarea.value = '';

    loadAdminClasses();
    loadAttendance(1);
  } catch (err) {
    if (resultEl) { resultEl.className = 'import-result error'; resultEl.textContent = err.message || 'Import gagal'; }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Import Sekarang';
  }
}

async function openHistory(student) {
  const modal = document.getElementById('history-modal');
  const nameEl = document.getElementById('history-name');
  const metaEl = document.getElementById('history-meta');
  const summaryEl = document.getElementById('history-summary');
  const listEl = document.getElementById('history-list');

  nameEl.textContent = student.name || 'Riwayat Siswa';
  metaEl.textContent = `${student.nis || ''} · ${student.class || ''}`.replace(/^·\s*/, '').replace(/\s*·\s*$/, '');
  summaryEl.innerHTML = '';
  listEl.innerHTML = '<tr class="empty-row"><td colspan="3">Memuat riwayat...</td></tr>';
  modal.classList.remove('hidden');

  try {
    const res = await apiFetch(`/api/students/${student.id}/attendance?days=30`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Gagal memuat riwayat');

    const history = data.history || [];
    const summary = {};
    history.forEach(item => { summary[item.status] = (summary[item.status] || 0) + 1; });

    const summaryKeys = Object.keys(summary);
    summaryEl.innerHTML = summaryKeys.length
      ? summaryKeys.map(key => `<span class="history-chip ${key === 'Terlambat' ? 'history-chip-late' : 'history-chip-ontime'}">${summary[key]} ${escapeHtml(key)}</span>`).join('')
      : '<span class="history-chip">Belum ada catatan</span>';

    if (history.length === 0) {
      listEl.innerHTML = '<tr class="empty-row"><td colspan="3">Belum ada riwayat absensi</td></tr>';
      return;
    }

    listEl.innerHTML = history.map(item => `
      <tr>
        <td>${escapeHtml(item.date)}</td>
        <td>${escapeHtml(item.time)}</td>
        <td><span class="status-badge ${item.status === 'Tepat Waktu' ? 'tepat-waktu' : 'terlambat'}">${escapeHtml(item.status)}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<tr class="empty-row"><td colspan="3">${escapeHtml(err.message)}</td></tr>`;
  }
}

function closeHistory() {
  const modal = document.getElementById('history-modal');
  if (modal) modal.classList.add('hidden');
}

// Pemantauan kehadiran seluruh siswa
const MONITOR_PER_PAGE = 20;
let monitorPage = 1;
let monitorTotal = 0;
let monitorSearch = '';

const monitorBody = document.getElementById('monitor-body');
const monitorSearchInput = document.getElementById('monitor-search');
const monitorPaginationEl = document.getElementById('monitor-pagination');
let monitorRefreshTimer = null;

async function loadMonitor(page = 1) {
  if (!monitorBody) return;

  const cls = selectedClass();
  const params = new URLSearchParams({
    limit: String(MONITOR_PER_PAGE),
    offset: String((page - 1) * MONITOR_PER_PAGE),
  });
  if (cls) params.set('class', cls);
  if (monitorSearch) params.set('q', monitorSearch);

  try {
    const res = await apiFetch(`/api/attendance/status?${params}`);
    const data = await res.json();
    if (!data.success) return;

    monitorPage = page;
    monitorTotal = data.total;
    renderMonitorTable(data.data);
    renderMonitorPagination();
  } catch (err) {
    monitorBody.innerHTML = `<tr class="empty-row"><td colspan="6">${escapeHtml(err.message || 'Gagal memuat data')}</td></tr>`;
  }
}

function renderMonitorTable(rows) {
  if (rows.length === 0) {
    monitorBody.innerHTML = '<tr class="empty-row"><td colspan="6">Tidak ada siswa ditemukan</td></tr>';
    return;
  }

  const startIndex = (monitorPage - 1) * MONITOR_PER_PAGE;
  monitorBody.innerHTML = rows.map((row, i) => {
    const statusClass = row.status === 'Belum Absen'
      ? 'belum-absen'
      : (row.status === 'Terlambat' ? 'terlambat' : 'tepat-waktu');
    return `
      <tr data-student-id="${row.id}" data-student-name="${escapeAttr(row.name)}" data-student-nis="${escapeAttr(row.nis)}" data-student-class="${escapeAttr(row.class)}">
        <td>${startIndex + i + 1}</td>
        <td>${escapeHtml(row.nis)}</td>
        <td><strong>${escapeHtml(row.name)}</strong></td>
        <td>${escapeHtml(row.class)}</td>
        <td>${row.time ? escapeHtml(row.time) : '—'}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(row.status)}</span></td>
      </tr>
    `;
  }).join('');
}

function renderMonitorPagination() {
  if (!monitorPaginationEl) return;

  const totalPages = Math.ceil(monitorTotal / MONITOR_PER_PAGE);
  if (totalPages <= 1) {
    monitorPaginationEl.innerHTML = '';
    return;
  }

  const start = (monitorPage - 1) * MONITOR_PER_PAGE + 1;
  const end = Math.min(monitorPage * MONITOR_PER_PAGE, monitorTotal);

  let pagesHTML = '';
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7) {
      if (p === 1 || p === totalPages || (p >= monitorPage - 1 && p <= monitorPage + 1)) {
        pagesHTML += `<button class="pagination-btn ${p === monitorPage ? 'active' : ''}" data-monitor-page="${p}">${p}</button>`;
      } else if (p === monitorPage - 2 || p === monitorPage + 2) {
        pagesHTML += '<span class="pagination-ellipsis">...</span>';
      }
    } else {
      pagesHTML += `<button class="pagination-btn ${p === monitorPage ? 'active' : ''}" data-monitor-page="${p}">${p}</button>`;
    }
  }

  monitorPaginationEl.innerHTML = `
    <span class="pagination-info">${start}–${end} dari ${monitorTotal} siswa</span>
    <div class="pagination-controls">
      <button class="pagination-btn" data-monitor-page="${monitorPage - 1}" ${monitorPage <= 1 ? 'disabled' : ''}>‹</button>
      ${pagesHTML}
      <button class="pagination-btn" data-monitor-page="${monitorPage + 1}" ${monitorPage >= totalPages ? 'disabled' : ''}>›</button>
    </div>
  `;
}

function refreshMonitor() {
  clearTimeout(monitorRefreshTimer);
  monitorRefreshTimer = setTimeout(() => loadMonitor(monitorPage), 300);
}

onNewAttendanceHook = function() { refreshMonitor(); };
onClassChangeHook = function() { loadMonitor(1); };

function initAdmin() {
  if (!document.body.dataset.role || document.body.dataset.role !== 'admin') return;

  loadAdminClasses();
  loadMonitor(1);

  const addBtn = document.getElementById('admin-class-add-btn');
  if (addBtn) addBtn.addEventListener('click', addClass);

  const classInput = document.getElementById('admin-class-input');
  if (classInput) {
    classInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addClass();
    });
  }

  const classBody = document.getElementById('admin-class-body');
  if (classBody) {
    classBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (btn) handleClassAction(btn);
    });
  }

  const importBtn = document.getElementById('import-btn');
  if (importBtn) importBtn.addEventListener('click', importStudents);

  if (monitorSearchInput) {
    monitorSearchInput.addEventListener('input', () => {
      clearTimeout(monitorRefreshTimer);
      monitorRefreshTimer = setTimeout(() => {
        monitorSearch = monitorSearchInput.value.trim();
        loadMonitor(1);
      }, 300);
    });
  }

  if (monitorPaginationEl) {
    monitorPaginationEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-monitor-page]');
      if (!btn || btn.disabled) return;
      loadMonitor(Number(btn.dataset.monitorPage));
    });
  }

  document.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-student-id]');
    if (tr && tr.dataset.studentId) {
      openHistory({
        id: tr.dataset.studentId,
        name: tr.dataset.studentName,
        nis: tr.dataset.studentNis,
        class: tr.dataset.studentClass,
      });
    }
  });

  const closeBtn = document.getElementById('history-close-btn');
  const cancelBtn = document.getElementById('history-cancel-btn');
  const modal = document.getElementById('history-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeHistory);
  if (cancelBtn) cancelBtn.addEventListener('click', closeHistory);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'history-modal') closeHistory();
    });
  }
}

document.addEventListener('DOMContentLoaded', initAdmin);
