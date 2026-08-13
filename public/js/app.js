const API_BASE = '';
let eventSource = null;
let reconnectAttempts = 0;

const PER_PAGE = 10;
let currentPage = 1;
let totalRows = 0;
let totalStudents = 0;

const role = document.body.dataset.role || 'admin';
const PAGE_CLASS = document.body.dataset.className || null;

const classSelect = document.getElementById('class-select');

const metricEls = {
  total: document.getElementById('metric-total'),
  hadir: document.getElementById('metric-hadir'),
  late: document.getElementById('metric-late'),
  absent: document.getElementById('metric-absent'),
};
const metricTotalLabel = document.getElementById('metric-total-label');

function selectedClass() {
  if (PAGE_CLASS) return PAGE_CLASS;
  if (role === 'admin' && classSelect) return classSelect.value || null;
  return null;
}

function updateMetricLabel() {
  if (!metricTotalLabel) return;
  const cls = selectedClass();
  metricTotalLabel.textContent = cls ? `Total Siswa (${cls})` : 'Total Siswa';
}

function updateMetrics(stats) {
  if (!stats) return;
  totalStudents = stats.total_students;
  if (metricEls.total) metricEls.total.textContent = stats.total_students;
  if (metricEls.hadir) metricEls.hadir.textContent = stats.present;
  if (metricEls.late) metricEls.late.textContent = stats.late;
  if (metricEls.absent) metricEls.absent.textContent = stats.absent;
}

async function loadClasses() {
  if (!classSelect || role !== 'admin') return;

  try {
    const res = await apiFetch('/api/students/classes');
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      classSelect.innerHTML = '<option value="">Semua Kelas</option>' +
        data.data.map(cls => `<option value="${escapeHtml(cls)}">${escapeHtml(cls)}</option>`).join('');
    }
  } catch (err) {
    /* dropdown kelas gagal dimuat; biarkan mode "Semua Kelas" */
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  updateMetricLabel();
  loadClasses();
  loadAttendance(1);
  connectSSE();
});

if (classSelect) {
  classSelect.addEventListener('change', () => {
    updateMetricLabel();
    loadAttendance(1);
    if (typeof onClassChangeHook === 'function') onClassChangeHook();
  });
}

function setCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', options);
}

async function loadAttendance(page = 1) {
  try {
    const cls = selectedClass();
    const params = new URLSearchParams({
      limit: String(PER_PAGE),
      offset: String((page - 1) * PER_PAGE),
    });
    if (cls) params.set('class', cls);

    const res = await apiFetch(`${API_BASE}/api/attendance/today?${params}`);
    const data = await res.json();

    if (data.success) {
      currentPage = page;
      totalRows = data.total;
      document.getElementById('total-count').textContent = `${totalRows} hadir`;
      updateMetrics(data.stats);
      renderTable(data.data);
      renderPagination();
    } else {
      showFlash('error', data.message || 'Gagal memuat data');
    }
  } catch (err) {
    showFlash('error', err.message === 'TimeoutError' ? 'Koneksi lambat, muat ulang halaman' : 'Gagal memuat data');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function buildRowHTML(row, index) {
  const statusClass = row.status === 'Tepat Waktu' ? 'tepat-waktu' : 'terlambat';
  return `
    <td>${index}</td>
    <td>${escapeHtml(row.student_nis)}</td>
    <td>${escapeHtml(row.student_name)}</td>
    <td>${escapeHtml(row.student_class)}</td>
    <td>${row.time}</td>
    <td><span class="status-badge ${statusClass}">${escapeHtml(row.status)}</span></td>
  `;
}

function renderTable(rows) {
  const tbody = document.getElementById('attendance-body');
  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Belum ada data absensi hari ini</td></tr>';
    return;
  }
  const startIndex = (currentPage - 1) * PER_PAGE;
  tbody.innerHTML = rows.map((row, i) =>
    `<tr data-student-id="${row.student_id}" data-student-name="${escapeHtml(row.student_name)}" data-student-nis="${escapeHtml(row.student_nis)}" data-student-class="${escapeHtml(row.student_class)}">${buildRowHTML(row, startIndex + i + 1)}</tr>`
  ).join('');
}

function renderPagination() {
  const el = document.getElementById('pagination');
  const totalPages = Math.ceil(totalRows / PER_PAGE);

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalRows);

  let pagesHTML = '';
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7) {
      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
        pagesHTML += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (p === currentPage - 2 || p === currentPage + 2) {
        pagesHTML += '<span class="pagination-ellipsis">...</span>';
      }
    } else {
      pagesHTML += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  }

  el.innerHTML = `
    <span class="pagination-info">${start}–${end} dari ${totalRows}</span>
    <div class="pagination-controls">
      <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
      </button>
      ${pagesHTML}
      <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
      </button>
    </div>
  `;
}

document.getElementById('pagination').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-page]');
  if (!btn || btn.disabled) return;
  loadAttendance(Number(btn.dataset.page));
});

function connectSSE() {
  if (eventSource) {
    eventSource.close();
  }

  updateConnectionStatus('connecting');

  eventSource = new EventSource(`${API_BASE}/api/attendance/stream`);

  eventSource.onopen = () => {
    reconnectAttempts = 0;
    updateConnectionStatus('connected');
  };

  eventSource.addEventListener('attendance:new', (event) => {
    const data = JSON.parse(event.data);
    handleNewAttendance(data);
  });

  eventSource.addEventListener('attendance:duplicate', (event) => {
    const data = JSON.parse(event.data);
    handleDuplicateAttendance(data);
  });

  eventSource.onerror = () => {
    updateConnectionStatus('disconnected');
    eventSource.close();
    eventSource = null;

    reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    setTimeout(connectSSE, delay);
  };
}

function handleNewAttendance(data) {
  showFlash('success', `${data.name} - ${data.status}`);
  showToast('success', data.name, `${data.class} | ${data.time} | ${data.status}`);
  prependAttendance(data);
  if (typeof onNewAttendanceHook === 'function') onNewAttendanceHook(data);
}

let refreshTimer = null;
function refreshAttendance() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => loadAttendance(currentPage), 300);
}

function prependAttendance(data) {
  const cls = selectedClass();
  if (cls && data.class && data.class !== cls) return;

  totalRows += 1;
  document.getElementById('total-count').textContent = `${totalRows} hadir`;
  if (metricEls.hadir) metricEls.hadir.textContent = totalRows;
  if (data.status === 'Terlambat' && metricEls.late) {
    metricEls.late.textContent = Number(metricEls.late.textContent || 0) + 1;
  }
  if (metricEls.absent) metricEls.absent.textContent = Math.max(totalStudents - totalRows, 0);

  if (currentPage !== 1) {
    renderPagination();
    return;
  }

  const tbody = document.getElementById('attendance-body');
  const emptyRow = tbody.querySelector('.empty-row');
  if (emptyRow) tbody.innerHTML = '';

  const tr = document.createElement('tr');
  tr.dataset.studentId = data.student_id || '';
  tr.dataset.studentName = data.name || '';
  tr.dataset.studentNis = data.nis || '';
  tr.dataset.studentClass = data.class || '';
  tr.innerHTML = buildRowHTML({
    student_nis: data.nis,
    student_name: data.name,
    student_class: data.class,
    time: data.time,
    status: data.status,
  }, 1);
  tbody.prepend(tr);

  while (tbody.children.length > PER_PAGE) {
    tbody.lastChild.remove();
  }

  renderPagination();
}

function handleDuplicateAttendance(data) {
  showFlash('duplicate', `${data.name} sudah absen pada ${data.time}`);
  showToast('duplicate', data.name, `Sudah absen pada ${data.time} | ${data.status}`);
}

function showFlash(type, text) {
  const card = document.querySelector('.scan-card');
  const result = document.getElementById('scan-result');

  card.className = 'scan-card';
  result.className = 'scan-result hidden';
  void card.offsetWidth;

  card.classList.add(type);
  result.className = `scan-result ${type}`;
  result.textContent = text;

  setTimeout(() => {
    card.className = 'scan-card';
    result.className = 'scan-result hidden';
  }, 3000);
}

function showToast(type, name, detail) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-name">${escapeHtml(name)}</div>
    <div class="toast-detail">${escapeHtml(detail)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function updateConnectionStatus(status) {
  const el = document.getElementById('connection-status');
  el.querySelector('.status-dot').className = `status-dot ${status}`;
  el.querySelector('.status-text').textContent = {
    connected: 'Terhubung',
    disconnected: 'Terputus',
    connecting: 'Menyambung...',
  }[status] || status;
}

let uidBuffer = '';
let uidEntered = false;

const rfidInput = document.getElementById('rfid-input');

const FORM_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A']);

function focusRfidInput() {
  const active = document.activeElement;
  if (rfidInput && active !== rfidInput && !(active && FORM_TAGS.has(active.tagName))) {
    rfidInput.focus();
  }
}

rfidInput.addEventListener('blur', () => {
  setTimeout(focusRfidInput, 10);
});

rfidInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (uidBuffer.length >= 8 && !uidEntered) {
      submitUID(uidBuffer);
    }
    uidBuffer = '';
    return;
  }

  if (/^[0-9A-Fa-f]$/.test(e.key)) {
    uidBuffer += e.key.toUpperCase();
  } else {
    uidBuffer = '';
  }
});

document.addEventListener('DOMContentLoaded', focusRfidInput);

async function submitUID(uid) {
  uidEntered = true;
  try {
    const res = await apiFetch(`${API_BASE}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    const data = await res.json();

    if (data.is_duplicate) {
      showFlash('duplicate', `${data.student?.name || ''} sudah absen pada ${data.time}`);
      showToast('duplicate', data.student?.name || '', `Sudah absen pada ${data.time} | ${data.status}`);
    } else if (data.success && data.student) {
      showFlash('success', `${data.student.name} - ${data.status}`);
      showToast('success', data.student.name, `${data.student.class} | ${data.time} | ${data.status}`);
      refreshAttendance();
    } else {
      showFlash('error', data.message || 'Gagal');
      if (res.status === 403) {
        showToast('error', 'Akses ditolak', data.message || 'Kartu bukan milik kelas ini');
      }
    }
  } catch (err) {
    showFlash('error', err.message === 'TimeoutError' ? 'Koneksi lambat, coba lagi' : 'Gagal terhubung ke server');
  } finally {
    uidEntered = false;
    setTimeout(focusRfidInput, 50);
  }
}

const origHandleNew = handleNewAttendance;
const origHandleDup = handleDuplicateAttendance;
handleNewAttendance = function(data) {
  if (uidEntered) {
    refreshAttendance();
    if (typeof onNewAttendanceHook === 'function') onNewAttendanceHook(data);
    return;
  }
  origHandleNew(data);
};
handleDuplicateAttendance = function(data) {
  if (uidEntered) return;
  origHandleDup(data);
};
