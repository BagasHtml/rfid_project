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
      ? summaryKeys.map(key => {
          const chipClass = key === 'Terlambat' ? 'history-chip-late'
            : key === 'Alpha' ? 'history-chip-alpha'
              : key === 'Izin' ? 'history-chip-izin'
                : key === 'Sakit' ? 'history-chip-sakit'
                  : key === 'Dispen' ? 'history-chip-dispen' : 'history-chip-ontime';
          return `<span class="history-chip ${chipClass}">${summary[key]} ${escapeHtml(key)}</span>`;
        }).join('')
      : '<span class="history-chip">Belum ada catatan</span>';

    if (history.length === 0) {
      listEl.innerHTML = '<tr class="empty-row"><td colspan="3">Belum ada riwayat absensi</td></tr>';
      return;
    }

    listEl.innerHTML = history.map(item => {
      const statusClass = item.status === 'Terlambat' ? 'terlambat'
        : item.status === 'Alpha' ? 'alpha'
          : item.status === 'Izin' ? 'izin'
            : item.status === 'Sakit' ? 'sakit'
              : item.status === 'Dispen' ? 'dispen' : 'tepat-waktu';
      return `
        <tr>
          <td>${escapeHtml(item.date)}</td>
          <td>${escapeHtml(item.time)}</td>
          <td><span class="status-badge ${statusClass}">${escapeHtml(item.status)}</span></td>
        </tr>
      `;
    }).join('');
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
    monitorBody.innerHTML = '<tr class="empty-row"><td colspan="7">Tidak ada siswa ditemukan</td></tr>';
    return;
  }

  const startIndex = (monitorPage - 1) * MONITOR_PER_PAGE;
  const statusOptions = ['Tepat Waktu', 'Terlambat', 'Alpha', 'Izin', 'Sakit', 'Dispen'];
  const hasAttendance = (row) => row.time !== null;

  monitorBody.innerHTML = rows.map((row, i) => {
    const statusClass = row.status === 'Belum Absen'
      ? 'belum-absen'
      : (row.status === 'Terlambat' ? 'terlambat'
        : row.status === 'Alpha' ? 'alpha'
          : row.status === 'Izin' ? 'izin'
            : row.status === 'Sakit' ? 'sakit'
              : row.status === 'Dispen' ? 'dispen' : 'tepat-waktu');

    const actionsHtml = hasAttendance(row)
      ? `<div class="status-actions">
          <select class="status-select" data-id="${row.attendanceId || ''}" data-student-id="${row.id}">
            ${statusOptions.map(s => `<option value="${s}" ${s === row.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <input type="text" class="keterangan-input" data-id="${row.attendanceId || ''}" data-student-id="${row.id}" placeholder="Keterangan..." value="${escapeAttr(row.keterangan || '')}" maxlength="255">
          <button type="button" class="btn-action btn-edit btn-save-status" data-student-id="${row.id}" data-attendance-id="${row.attendanceId || ''}">Simpan</button>
        </div>`
      : `<div class="status-actions">
          <select class="status-select" data-student-id="${row.id}">
            <option value="" disabled selected>Atur Status</option>
            ${statusOptions.filter(s => s === 'Tepat Waktu' || s === 'Terlambat').map(s => `<option value="${s}">${s}</option>`).join('')}
            <option value="Alpha">Alpha</option>
            <option value="Izin">Izin</option>
            <option value="Sakit">Sakit</option>
            <option value="Dispen">Dispen</option>
          </select>
          <input type="text" class="keterangan-input" data-student-id="${row.id}" placeholder="Keterangan..." maxlength="255">
          <button type="button" class="btn-action btn-edit btn-save-status" data-student-id="${row.id}">Simpan</button>
        </div>`;

    return `
      <tr data-student-id="${row.id}" data-student-name="${escapeAttr(row.name)}" data-student-nis="${escapeAttr(row.nis)}" data-student-class="${escapeAttr(row.class)}">
        <td>${startIndex + i + 1}</td>
        <td>${escapeHtml(row.nis)}</td>
        <td><strong>${escapeHtml(row.name)}</strong></td>
        <td>${escapeHtml(row.class)}</td>
        <td>${row.time ? escapeHtml(row.time) : '—'}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(row.status)}</span></td>
        <td class="actions-cell">${actionsHtml}</td>
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

async function saveStatus(btn) {
  const studentId = Number(btn.dataset.studentId);
  const attendanceId = btn.dataset.attendanceId ? Number(btn.dataset.attendanceId) : null;
  const row = btn.closest('tr');
  const select = row.querySelector('.status-select');
  const keteranganInput = row.querySelector('.keterangan-input');
  const status = select.value;
  const keterangan = (keteranganInput.value || '').trim() || undefined;

  if (!status || status === 'Atur Status') {
    adminToast('error', 'Gagal', 'Pilih status terlebih dahulu');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    let res;
    if (attendanceId) {
      res = await apiFetch(`/api/attendance/${attendanceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, keterangan }),
      });
    } else {
      res = await apiFetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, status, keterangan }),
      });
    }

    const data = await res.json();
    if (data.success) {
      adminToast('success', 'Berhasil', data.message || 'Status diperbarui');
      loadMonitor(monitorPage);
    } else {
      adminToast('error', 'Gagal', data.message || 'Terjadi kesalahan');
    }
  } catch (err) {
    adminToast('error', 'Gagal', err.message || 'Koneksi bermasalah');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
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
    const saveBtn = e.target.closest('.btn-save-status');
    if (saveBtn) {
      e.stopPropagation();
      saveStatus(saveBtn);
      return;
    }

    const tr = e.target.closest('tr[data-student-id]');
    if (tr && tr.dataset.studentId && !e.target.closest('.status-actions')) {
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
