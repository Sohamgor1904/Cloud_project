/**
 * frontend/js/login.js
 * Login form — validation, API call, session save, redirect.
 * Depends on: auth.js (getSession, setSession, API constant)
 */

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn(); // from auth.js — skip if already logged in

  const form  = document.getElementById('login-form');
  const btn   = document.getElementById('login-btn');
  const errBanner = document.getElementById('login-err-banner');

  // Password toggle
  document.getElementById('pass-toggle')?.addEventListener('click', function () {
    const inp = document.getElementById('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    this.textContent = inp.type === 'password' ? '👁' : '🙈';
  });

  // Demo quick login
  document.getElementById('demo-btn')?.addEventListener('click', () => {
    document.getElementById('login-email').value    = 'demo@smartwaste.in';
    document.getElementById('login-password').value = 'demo123';
    form.dispatchEvent(new Event('submit'));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;

    clearErrors();
    let ok = true;
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showFieldErr('login-email', 'Enter a valid email.'); ok = false; }
    if (!pass) { showFieldErr('login-password', 'Password is required.'); ok = false; }
    if (!ok) return;

    setBtnLoading(btn, true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { showBanner(errBanner, data.error || 'Login failed.', 'err'); return; }
      setSession(data.user);
      window.location.href = '/pages/dashboard.html';
    } catch {
      showBanner(errBanner, '⚠ Cannot reach server. Make sure the backend is running on port 3000.', 'err');
    } finally {
      setBtnLoading(btn, false);
    }
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────
function showFieldErr(id, msg) {
  document.getElementById(id)?.classList.add('err');
  const e = document.getElementById(`${id}-err`);
  if (e) { e.textContent = msg; e.classList.add('show'); }
}
function clearErrors() {
  document.querySelectorAll('.form-input.err').forEach(el => el.classList.remove('err'));
  document.querySelectorAll('.form-err.show').forEach(el => el.classList.remove('show'));
}
function showBanner(el, msg, type) {
  el.textContent = msg;
  el.className = `banner banner-${type} show`;
  setTimeout(() => el.classList.remove('show'), 5000);
}
function setBtnLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-spin').style.display = loading ? 'block' : 'none';
  btn.querySelector('.btn-txt').style.display  = loading ? 'none'  : 'block';
}
