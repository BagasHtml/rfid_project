const STUDENT_PER_PAGE = 10;
let currentPage = 1;
let totalRows = 0;
let currentRows = [];
let searchTimeout;

const nisInput = document.getElementById('student-nis');
const nameInput = document.getElementById('student-name');
const classInput = document.getElementById('student-class');
const registerBtn = document.getElementById('student-register-btn');
const toggleFormBtn = document.getElementById('student-toggle-form');
const registerForm = document.getElementById('student-register-form');
const studentBody = document.getElementById('student-body');
const searchInput = document.getElementById('student-search');

const editModal = document.getElementById('edit-modal');
const editId = document.getElementById('edit-id');
const editNis = document.getElementById('edit-nis');
const editName = document.getElementById('edit-name');
const editClass = document.getElementById('edit-class');
const editCloseBtn = document.getElementById('edit-close-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const editSaveBtn = document.getElementById('edit-save-btn');

document.addEventListener('DOMContentLoaded', () => {
  setCurrentDate();
  loadStudents(1);
});

toggleFormBtn.addEventListener('click', () => {
  const isHidden = registerForm.classList.toggle('hidden');
  toggleFormBtn.textContent = isHidden ? '+ Daftarkan Siswa' : 'Tutup Form';
  if (!isHidden) nisInput.focus();
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

function statusMessage(status, data) {
  if (data && data.message) return data.message;
  if (status === 409) return 'Data sudah terdaftar atau tidak dapat diubah.';
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.';
  if (status === 400) return 'Data yang dikirim tidak valid.';
  if (status === 404) return 'Data tidak ditemukan.';
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi dalam beberapa saat.';
  return 'Terjadi kesalahan.';
}

async function loadStudents(page = 1) {
  try {
    const offset = (page - 1) * STUDENT_PER_PAGE;
    const params = new URLSearchParams({ limit: STUDENT_PER_PAGE, offset: String(offset) });
    const q = searchInput.value.trim();
    if (q) params.set('q', q);

    const res = await apiFetch(`/api/students?${params}`);
    const data = await res.json();

    if (!data.success) throw new Error('Gagal memuat data siswa');

    currentPage = page;
    totalRows = data.total;
    currentRows = data.data;
    document.getElementById('student-count').textContent = `${totalRows} siswa`;
    renderStudents(data.data);
    renderPagination();
  } catch (err) {
    const message = err.message === 'TimeoutError'
      ? 'Koneksi lambat. Muat ulang halaman.'
      : 'Gagal memuat daftar siswa. Periksa koneksi, lalu muat ulang.';
    studentBody.innerHTML = `<tr class="empty-row"><td colspan="6">${message}</td></tr>`;
  }
}

function renderStudents(rows) {
  if (rows.length === 0) {
    const message = searchInput.value.trim() ? 'Tidak ada siswa yang cocok' : 'Belum ada siswa terdaftar';
    studentBody.innerHTML = `<tr class="empty-row"><td colspan="6">${message}</td></tr>`;
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
      <td class="actions-cell">
        <button type="button" class="btn-action btn-edit" data-action="edit" data-id="${r.id}">Edit</button>
        <button type="button" class="btn-action btn-delete" data-action="delete" data-id="${r.id}">Hapus</button>
      </td>
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

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadStudents(1), 300);
});

studentBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  if (btn.dataset.action === 'edit') {
    openEditModal(id);
  } else if (btn.dataset.action === 'delete') {
    deleteStudent(id);
  }
});

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
    const res = await apiFetch('/api/students', {
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
      showToast('error', 'Gagal mendaftar', statusMessage(res.status, data));
    }
  } catch (err) {
    showToast('error', 'Gagal terhubung', err.message === 'TimeoutError' ? 'Koneksi lambat. Coba lagi.' : 'Server tidak merespons. Pastikan server menyala dan jaringan terhubung.');
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

function openEditModal(id) {
  const student = currentRows.find(r => r.id === id);
  if (!student) return;

  editId.value = student.id;
  editNis.value = student.nis;
  editName.value = student.name;
  editClass.value = student.class;
  editModal.classList.remove('hidden');
  editNis.focus();
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

editCloseBtn.addEventListener('click', closeEditModal);
editCancelBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editModal.classList.contains('hidden')) closeEditModal();
});

editSaveBtn.addEventListener('click', async () => {
  const id = Number(editId.value);
  const nis = editNis.value.trim();
  const name = editName.value.trim();
  const className = editClass.value.trim();

  if (!Number.isInteger(id) || id <= 0) {
    showToast('error', 'Data siswa tidak valid', 'Muat ulang halaman, lalu coba lagi.');
    closeEditModal();
    return;
  }

  if (!nis || !name || !className) {
    showToast('error', 'Form belum lengkap', 'Isi NIS, nama lengkap, dan kelas siswa terlebih dahulu.');
    return;
  }

  editSaveBtn.disabled = true;

  try {
    const res = await apiFetch(`/api/students/${id}`, {
      method: 'PUT',
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
      closeEditModal();
      showToast('success', 'Siswa diperbarui', `${name} (${className})`);
      loadStudents(currentPage);
    } else {
      showToast('error', 'Gagal memperbarui', statusMessage(res.status, data));
    }
  } catch (err) {
    showToast('error', 'Gagal terhubung', err.message === 'TimeoutError' ? 'Koneksi lambat. Coba lagi.' : 'Server tidak merespons. Pastikan server menyala dan jaringan terhubung.');
  } finally {
    editSaveBtn.disabled = false;
  }
});

async function deleteStudent(id) {
  const student = currentRows.find(r => r.id === id);
  if (!student) return;

  if (!confirm(`Hapus siswa "${student.name}"?`)) return;

  try {
    const res = await apiFetch(`/api/students/${id}`, { method: 'DELETE' });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (data.success) {
      showToast('success', 'Siswa dihapus', student.name);
      if (currentRows.length === 1 && currentPage > 1) {
        loadStudents(currentPage - 1);
      } else {
        loadStudents(currentPage);
      }
    } else {
      showToast('error', 'Gagal menghapus', statusMessage(res.status, data));
    }
  } catch (err) {
    showToast('error', 'Gagal terhubung', err.message === 'TimeoutError' ? 'Koneksi lambat. Coba lagi.' : 'Server tidak merespons. Pastikan server menyala dan jaringan terhubung.');
  }
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
