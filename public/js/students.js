const STUDENT_PER_PAGE = 10;
let currentPage = 1;
let totalRows = 0;

const nisInput = document.getElementById('student-nis');
const nameInput = document.getElementById('student-name');
const classInput = document.getElementById('student-class');
const registerBtn = document.getElementById('student-register-btn');
const studentBody = document.getElementById('student-body');

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  loadStudents(1);
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

async function loadStudents(page = 1) {
  try {
    const offset = (page - 1) * STUDENT_PER_PAGE;
    const res = await fetch(`/api/students?limit=${STUDENT_PER_PAGE}&offset=${offset}`);
    const data = await res.json();

    if (!data.success) throw new Error('Gagal memuat data siswa');

    currentPage = page;
    totalRows = data.total;
    document.getElementById('student-count').textContent = `${totalRows} siswa`;
    renderStudents(data.data);
    renderPagination();
  } catch (err) {
    studentBody.innerHTML = '<tr class="empty-row"><td colspan="5">Gagal memuat daftar siswa. Periksa koneksi, lalu muat ulang.</td></tr>';
  }
}

function renderStudents(rows) {
  if (rows.length === 0) {
    studentBody.innerHTML = '<tr class="empty-row"><td colspan="5">Belum ada siswa terdaftar</td></tr>';
    return;
  }

  const startIndex = (currentPage - 1) * STUDENT_PER_PAGE;
  studentBody.innerHTML = rows.map((r, i) => `
    <tr>
      <td>${startIndex + i + 1}</td>
      <td>${escapeHtml(r.nis)}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.class)}</td>
      <td>${escapeHtml(r.created_at || '')}</td>
    </tr>
  `).join('');
}

function renderPagination() {
  const el = document.getElementById('student-pagination');
  const totalPages = Math.ceil(totalRows / STUDENT_PER_PAGE);

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  const start = (currentPage - 1) * STUDENT_PER_PAGE + 1;
  const end = Math.min(currentPage * STUDENT_PER_PAGE, totalRows);

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

document.getElementById('student-pagination').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-page]');
  if (!btn || btn.disabled) return;
  loadStudents(Number(btn.dataset.page));
});

function friendlyError(status, data) {
  if (status === 409) return 'NIS sudah terdaftar. Gunakan NIS yang berbeda.';
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.';
  if (status === 400) return data.message || 'Data yang dikirim tidak valid.';
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi dalam beberapa saat.';
  return data.message || 'Gagal mendaftarkan siswa.';
}

registerBtn.addEventListener('click', async () => {
  const nis = nisInput.value.trim();
  const name = nameInput.value.trim();
  const className = classInput.value.trim();

  if (!nis || !name || !className) {
    showToast('error', 'Form belum lengkap', 'Isi NIS, nama lengkap, dan kelas siswa terlebih dahulu.');
    return;
  }

  registerBtn.disabled = true;

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nis, name, class: className }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (data.success) {
      showToast('success', 'Siswa terdaftar', `${name} (${className}) - NIS ${nis}`);
      nisInput.value = '';
      nameInput.value = '';
      classInput.value = '';
      nisInput.focus();
      loadStudents(1);
    } else {
      showToast('error', 'Gagal mendaftar', friendlyError(res.status, data));
    }
  } catch (err) {
    showToast('error', 'Gagal terhubung', 'Server tidak merespons. Pastikan server menyala dan jaringan terhubung.');
  } finally {
    registerBtn.disabled = false;
  }
});

[nisInput, nameInput, classInput].forEach(el => {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      registerBtn.click();
    }
  });
});

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
