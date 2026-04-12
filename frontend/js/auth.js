/**
 * frontend/js/auth.js
 * Shared auth utilities — session management, guard, logout.
 * Imported by login.js, signup.js, and dashboard.js
 */

const API = 'http://localhost:3000/api';
const SESSION_KEY = 'sw_session';

/** Get current session object or null */
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

/** Save session after login/signup */
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, loginAt: new Date().toISOString() }));
}

/** Clear session and go to login */
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/pages/login.html';
}

/**
 * Auth guard — call at top of any protected page.
 * Redirects to login if no session found.
 * @returns {object} session user object
 */
function requireAuth() {
  const s = getSession();
  if (!s) { window.location.replace('/pages/login.html'); return null; }
  return s;
}

/** Redirect logged-in users away from auth pages */
function redirectIfLoggedIn() {
  if (getSession()) window.location.replace('/pages/dashboard.html');
}
