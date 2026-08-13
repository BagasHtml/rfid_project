const REQUEST_TIMEOUT = 10000;

async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });

    if (res.status === 401) {
      window.location.href = '/login?msg=sesi';
      throw new Error('Sesi berakhir');
    }

    return res;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      const timeoutError = new Error('Koneksi lambat atau server tidak merespons');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function handleLogoutButtons() {
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        /* lanjutkan redirect meski gagal */
      }
      window.location.href = '/login';
    });
  });
}

document.addEventListener('DOMContentLoaded', handleLogoutButtons);
