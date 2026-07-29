document.getElementById('total-count').textContent = '0 hadir';

const API_BASE = '';
let eventSource = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

const PER_PAGE = 10;
let currentPage = 1; 
let totalRows = 0;

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  loadAttendance();
  connectSSE();
});

function setCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', options);
}

async function loadAttendance(page = 1) {
  try {
    const offset = (page - 1) * PER_PAGE;
    const res = await fetch(`${API_BASE}/api/attendance/today?limit=${PER_PAGE}&offset=${offset}`);
    const data = await res.json();

    if (data.success) {
      currentPage = page;
      totalRows = data.total;
      document.getElementById('total-count').textContent = `${totalRows} hadir`;
      renderTable(data.data);
      renderPagination();
    }
  } catch (err) {
    console.error('Gagal memuat data:', err);
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
  tbody.innerHTML = rows.map((row, i) => `<tr>${buildRowHTML(row, startIndex + i + 1)}</tr>`).join('');
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
        pagesHTML += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" onclick="loadAttendance(${p})">${p}</button>`;
      } else if (p === currentPage - 2 || p === currentPage + 2) {
        pagesHTML += '<span class="pagination-ellipsis">...</span>';
      }
    } else {
      pagesHTML += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" onclick="loadAttendance(${p})">${p}</button>`;
    }
  }

  el.innerHTML = `
    <span class="pagination-info">${start}–${end} dari ${totalRows}</span>
    <div class="pagination-controls">
      <button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="loadAttendance(${currentPage - 1})">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
      </button>
      ${pagesHTML}
      <button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="loadAttendance(${currentPage + 1})">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
      </button>
    </div>
  `;
}

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
    handleNewAttendance(JSON.parse(event.data));
  });

  eventSource.addEventListener('attendance:duplicate', (event) => {
    handleDuplicateAttendance(JSON.parse(event.data));
  });

  eventSource.onerror = () => {
    updateConnectionStatus('disconnected');
    eventSource.close();

    if (reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connectSSE, delay);
    }
  };
}

function handleNewAttendance(data) {
  showFlash('success', `${data.name} - ${data.status}`);
  showToast('success', data.name, `${data.class} | ${data.time} | ${data.status}`);
  loadAttendance(1);
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
