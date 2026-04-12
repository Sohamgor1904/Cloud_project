/**
 * backend/controllers/authController.js
 * Handles login and signup.
 * Data store: data/users.json (dev) / PostgreSQL (prod)
 */
const fs   = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST /api/auth/login
function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const users = readUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user)
    return res.status(401).json({ error: 'Invalid email or password.' });

  // Return user without password
  const { password: _, ...safeUser } = user;
  res.json({ message: 'Login successful', user: safeUser });
}

// POST /api/auth/signup
function signup(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const users = readUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'An account with this email already exists.' });

  const newUser = {
    id:        Date.now(),
    name,
    email,
    password,
    role:      'operator',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ message: 'Account created', user: safeUser });
}

module.exports = { login, signup };
