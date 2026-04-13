/**
 * frontend/js/signup.js
 * Signup form — validation, password strength, API call, redirect.
 * Depends on: auth.js
 */

document.addEventListener('DOMContentLoaded', () => {
  redirectIfLoggedIn();

  const form      = document.getElementById('signup-form');
  const btn       = document.getElementById('signup-btn');
  const errBanner = document.getElementById('signup-err-banner');
  const okBanner  = document.getElementById('signup-ok-banner');

  // Password strength indicator
  document.getElementById('su-password')?.addEventListener('input', function () {
    updateStrength(this.value);
  });

  // Password toggle
  document.getElementById('pass-toggle-su')?.addEventListener('click', function () {
    const inp = document.getElementById('su-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    this.textContent = inp.type === 'password' ? '👁' : '🙈';
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fname = document.getElementById('su-fname').value.trim();
    const lname = document.getElementById('su-lname').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const pass  = document.getElementById('su-password').value;

    clearErrors();
    let ok = true;
    if (!fname) { showFieldErr('su-fname', 'First name is required.'); ok = false; }
    if (!lname) { showFieldErr('su-lname', 'Last name is required.'); ok = false; }
    if (!email || !/\S+@\S+\.\S+/.test(email)) { showFieldErr('su-email', 'Enter a valid email.'); ok = false; }
    if (!pass || pass.length < 6) { showFieldErr('su-password', 'Minimum 6 characters.'); ok = false; }
    if (!ok) return;

    setBtnLoading(btn, true);
    try {
      const res  = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${fname} ${lname}`, email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { showBanner(errBanner, data.error || 'Signup failed.', 'err'); return; }
      setSession(data.user);
      showBanner(okBanner, `✅ Account created! Welcome, ${fname}! Redirecting…`, 'ok');
      setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 1400);
    } catch {
      showBanner(errBanner, '⚠ Cannot reach server. Make sure the backend is running.', 'err');
    } finally {
      setBtnLoading(btn, false);
    }
  });
});

function updateStrength(val) {
  let score = 0;
  if (val.length >= 6)  score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const levels = [
    { w:'0%', c:'', lbl:'Enter a password' },
    { w:'25%', c:'#ef4444', lbl:'Weak' },
    { w:'50%', c:'#f59e0b', lbl:'Fair' },
    { w:'75%', c:'#06b6d4', lbl:'Good' },
    { w:'100%', c:'#10b981', lbl:'Strong ✓' },
  ];
  const l = levels[Math.min(score, 4)];
  const fill  = document.getElementById('pwd-fill');
  const label = document.getElementById('pwd-hint');
  if (fill)  { fill.style.width = l.w; fill.style.background = l.c; }
  if (label) { label.textContent = l.lbl; label.style.color = l.c || '#475569'; }
}

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
  setTimeout(() => el.classList.remove('show'), 6000);
}
function setBtnLoading(btn, loading) {
  btn.disabled = loading;
  btn.querySelector('.btn-spin').style.display = loading ? 'block' : 'none';
  btn.querySelector('.btn-txt').style.display  = loading ? 'none'  : 'block';
}
