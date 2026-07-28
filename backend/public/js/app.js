const API_BASE = '';
let eventSource = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

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

async function loadAttendance() {
  try {
    const res = await fetch(`${API_BASE}/api/attendance/today`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      renderTable(data.data);
      updateTotal(data.total);
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
  tbody.innerHTML = rows.map((row, i) => `<tr>${buildRowHTML(row, i + 1)}</tr>`).join('');
}

function updateTotal(total) {
  document.getElementById('total-count').textContent = `${total} hadir`;
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
  const tbody = document.getElementById('attendance-body');
  tbody.querySelector('.empty-row')?.remove();

  const newRow = document.createElement('tr');
  newRow.classList.add('new-entry');
  newRow.innerHTML = buildRowHTML(data, tbody.querySelectorAll('tr').length + 1);

  tbody.insertBefore(newRow, tbody.firstChild);

  const totalEl = document.getElementById('total-count');
  totalEl.textContent = `${(parseInt(totalEl.textContent) || 0) + 1} hadir`;

  showFlash('success', `${data.name} - ${data.status}`);
  showToast('success', data.name, `${data.class} | ${data.time} | ${data.status}`);
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
