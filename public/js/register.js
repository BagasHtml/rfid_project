let uidBuffer = '';
let scannedUid = '';

const RECENT_PER_PAGE = 10;
let recentPage = 1;
let recentTotal = 0;

const rfidInput = document.getElementById('rfid-input');
const scanCard = document.getElementById('scan-card');
const scanResult = document.getElementById('scan-result');
const uidDisplay = document.getElementById('uid-display');
const studentSelect = document.getElementById('student-select');
const registerBtn = document.getElementById('register-btn');

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
    if (uidBuffer.length >= 8) {
      scannedUid = uidBuffer;
      uidDisplay.textContent = scannedUid;
      uidDisplay.classList.remove('placeholder');
      showResult('info', `Kartu terbaca: ${scannedUid}`);
      setRegisterEnabled();
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

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  focusRfidInput();
  loadStudents();
  loadRecent();
});

function setCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const el = document.getElementById('current-date');
  if (el) el.textContent = now.toLocaleDateString('id-ID', options);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadRecent(page = 1) {
  try {
    const offset = (page - 1) * RECENT_PER_PAGE;
    const res = await apiFetch(`/api/cards?limit=${RECENT_PER_PAGE}&offset=${offset}`);
    const data = await res.json();

    if (!data.success) throw new Error('Gagal memuat kartu terdaftar');

    recentPage = page;
    recentTotal = data.total;
    renderRecent(data.data);
    renderRecentPagination();
  } catch (err) {
    const tbody = document.getElementById('recent-body');
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">${err.message === 'TimeoutError' ? 'Koneksi lambat. Muat ulang halaman.' : 'Gagal memuat daftar kartu. Periksa koneksi, lalu muat ulang.'}</td></tr>`;
  }
}

function renderRecent(rows) {
  const tbody = document.getElementById('recent-body');
  document.getElementById('recent-count').textContent = `${recentTotal} kartu`;

  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Belum ada kartu terdaftar</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="uid-cell">${escapeHtml(r.uid)}</td>
      <td>${escapeHtml(r.student_nis)}</td>
      <td>${escapeHtml(r.student_name)}</td>
      <td>${escapeHtml(r.student_class)}</td>
      <td>${escapeHtml(r.created_at || '')}</td>
    </tr>
  `).join('');
}

function renderRecentPagination() {
  const el = document.getElementById('recent-pagination');
  const totalPages = Math.ceil(recentTotal / RECENT_PER_PAGE);

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  const start = (recentPage - 1) * RECENT_PER_PAGE + 1;
  const end = Math.min(recentPage * RECENT_PER_PAGE, recentTotal);

  let pagesHTML = '';
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7) {
      if (p === 1 || p === totalPages || (p >= recentPage - 1 && p <= recentPage + 1)) {
        pagesHTML += `<button class="pagination-btn ${p === recentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (p === recentPage - 2 || p === recentPage + 2) {
        pagesHTML += '<span class="pagination-ellipsis">...</span>';
      }
    } else {
      pagesHTML += `<button class="pagination-btn ${p === recentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  }

  el.innerHTML = `
    <span class="pagination-info">${start}–${end} dari ${recentTotal}</span>
    <div class="pagination-controls">
      <button class="pagination-btn" data-page="${recentPage - 1}" ${recentPage <= 1 ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
      </button>
      ${pagesHTML}
      <button class="pagination-btn" data-page="${recentPage + 1}" ${recentPage >= totalPages ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
      </button>
    </div>
  `;
}

document.getElementById('recent-pagination').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-page]');
  if (!btn || btn.disabled) return;
  loadRecent(Number(btn.dataset.page));
});

async function loadStudents() {
  try {
    const res = await apiFetch('/api/students/active');
    const data = await res.json();

    if (!data.success) throw new Error('Gagal memuat data siswa');

    studentSelect.innerHTML = '<option value="">Pilih siswa...</option>';

    data.data.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.class}) - NIS ${s.nis}`;
      studentSelect.appendChild(opt);
    });

    setRegisterEnabled();
  } catch (err) {
    showToast('error', 'Gagal memuat data siswa', err.message === 'TimeoutError' ? 'Koneksi lambat. Muat ulang halaman.' : 'Periksa koneksi, lalu muat ulang halaman.');
  }
}

function setRegisterEnabled() {
  registerBtn.disabled = !(scannedUid && studentSelect.value);
}

studentSelect.addEventListener('change', setRegisterEnabled);

function friendlyError(status, data) {
  if (status === 409) return 'Kartu ini sudah terdaftar. Pindai kartu lain untuk mendaftar.';
  if (status === 404) return 'Siswa tidak ditemukan. Muat ulang halaman, lalu coba lagi.';
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.';
  if (status === 400) return data.message || 'Data yang dikirim tidak valid.';
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi dalam beberapa saat.';
  return data.message || 'Gagal mendaftarkan kartu.';
}

registerBtn.addEventListener('click', async () => {
  if (!scannedUid || !studentSelect.value) return;

  registerBtn.disabled = true;

  try {
    const res = await apiFetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: scannedUid, student_id: Number(studentSelect.value) }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (data.success) {
      const studentName = data.student?.name || '';
      showResult('success', `${data.message}: ${studentName}`);
      showToast('success', 'Kartu terdaftar', `${scannedUid} -> ${studentName}`);
      scannedUid = '';
      uidDisplay.textContent = 'Belum ada kartu dipindai';
      uidDisplay.classList.add('placeholder');
      loadRecent(1);
    } else {
      const message = friendlyError(res.status, data);
      const type = res.status === 409 ? 'duplicate' : 'error';
      showResult(type, message);
      showToast(type, 'Gagal mendaftar', message);
    }
  } catch (err) {
    const message = err.message === 'TimeoutError' ? 'Koneksi lambat. Coba lagi.' : 'Gagal terhubung ke server. Periksa koneksi jaringan.';
    showResult('error', message);
    showToast('error', 'Gagal terhubung', message);
  } finally {
    setRegisterEnabled();
    setTimeout(focusRfidInput, 50);
  }
});

function showResult(type, text) {
  scanCard.className = 'scan-card';
  scanResult.className = 'scan-result hidden';
  void scanCard.offsetWidth;

  scanCard.classList.add(type);
  scanResult.className = `scan-result ${type}`;
  scanResult.textContent = text;

  setTimeout(() => {
    scanCard.className = 'scan-card';
    scanResult.className = 'scan-result hidden';
  }, 3000);
}

function showToast(type, name, detail) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-name"></div>
    <div class="toast-detail"></div>
  `;

  toast.querySelector('.toast-name').textContent = name;
  toast.querySelector('.toast-detail').textContent = detail;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}
