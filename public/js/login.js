const form = document.getElementById('login-form');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-btn');
const errorBox = document.getElementById('login-error');

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function hideError() {
  errorBox.classList.add('hidden');
}

const params = new URLSearchParams(window.location.search);
if (params.get('msg') === 'sesi') {
  showError('Sesi berakhir. Silakan masuk kembali.');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    showError('Username dan password wajib diisi.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (data.success && data.user) {
      const target = data.user.role === 'admin' ? '/' : `/kelas/${encodeURIComponent(data.user.class || '')}`;
      window.location.href = target;
      return;
    }

    if (res.status === 429) {
      showError('Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.');
    } else {
      showError(data.message || 'Username atau password salah.');
    }
  } catch (err) {
    if (err && err.name === 'AbortError') {
      showError('Koneksi lambat atau server tidak merespons. Coba lagi.');
    } else {
      showError('Gagal terhubung ke server. Pastikan server menyala.');
    }
  } finally {
    clearTimeout(timer);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Masuk';
  }
});
