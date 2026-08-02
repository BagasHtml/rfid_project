let uidBuffer = '';
let scannedUid = '';

const rfidInput = document.getElementById('rfid-input');
const scanCard = document.getElementById('scan-card');
const scanResult = document.getElementById('scan-result');
const uidDisplay = document.getElementById('uid-display');
const studentSelect = document.getElementById('student-select');
const registerBtn = document.getElementById('register-btn');

function focusRfidInput() {
  if (rfidInput && document.activeElement !== rfidInput) {
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
  focusRfidInput();
  loadStudents();
  loadRecent();
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadRecent() {
  try {
    const res = await fetch('/api/cards?limit=20');
    const data = await res.json();

    if (!data.success) throw new Error('Gagal memuat kartu terdaftar');

    renderRecent(data.data);
  } catch (err) {
    const tbody = document.getElementById('recent-body');
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Gagal memuat data</td></tr>';
  }
}

function renderRecent(rows) {
  const tbody = document.getElementById('recent-body');
  document.getElementById('recent-count').textContent = `${rows.length} kartu`;

  if (rows.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Belum ada kartu terdaftar</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="uid-cell">${escapeHtml(r.uid)}</td>
      <td>${escapeHtml(r.student_nis)}</td>
      <td>${escapeHtml(r.student_name)}</td>
      <td>${escapeHtml(r.student_class)}</td>
    </tr>
  `).join('');
}

async function loadStudents() {
  try {
    const res = await fetch('/api/students');
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
    showToast('error', 'Gagal memuat data siswa', 'Periksa koneksi ke server');
  }
}

function setRegisterEnabled() {
  registerBtn.disabled = !(scannedUid && studentSelect.value);
}

studentSelect.addEventListener('change', setRegisterEnabled);

registerBtn.addEventListener('click', async () => {
  if (!scannedUid || !studentSelect.value) return;

  registerBtn.disabled = true;

  try {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: scannedUid, student_id: Number(studentSelect.value) }),
    });
    const data = await res.json();

    if (data.success) {
      const studentName = data.student?.name || '';
      showResult('success', `${data.message}: ${studentName}`);
      showToast('success', 'Kartu terdaftar', `${scannedUid} -> ${studentName}`);
      scannedUid = '';
      uidDisplay.textContent = 'Belum ada kartu dipindai';
      uidDisplay.classList.add('placeholder');
      loadRecent();
    } else {
      showResult('error', data.message || 'Gagal');
      showToast('error', 'Gagal', data.message || 'Terjadi kesalahan');
    }
  } catch (err) {
    showResult('error', 'Gagal terhubung ke server');
    showToast('error', 'Gagal', 'Gagal terhubung ke server');
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
