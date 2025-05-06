// server.js
const express        = require('express');
const bodyParser     = require('body-parser');
const bcrypt         = require('bcrypt');
const sqlite3        = require('sqlite3').verbose();
const session        = require('express-session');
const path           = require('path');

const app = express();

// --- Database setup ---
const dbPath = path.join(__dirname, 'data', 'users.db');
const db     = new sqlite3.Database(dbPath);
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    UNIQUE NOT NULL,
    email    TEXT    UNIQUE NOT NULL,
    password TEXT    NOT NULL,
    created  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// --- Create user_builds table ---
db.run(`
  CREATE TABLE IF NOT EXISTS user_builds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    buildJSON TEXT NOT NULL,
    savedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )
`);

// --- Middleware ---
app.use(bodyParser.json());
app.use(session({
  secret: 'replace-this-with-a-strong-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
app.use(express.static(path.join(__dirname))); // serve HTML/CSS/JS

// --- Sign-Up Endpoint ---
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
      [username, email, hash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Username or email already exists.' });
          }
          return res.status(500).json({ message: 'Database error.' });
        }
        res.status(201).json({ message: 'Account created successfully!' });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error.' });
  }
});

// --- Log-In Endpoint ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!user) return res.status(401).json({ message: 'No such user.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Wrong password.' });

    // Save user ID in session
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ message: 'Logged in successfully!' });
  });
});

// --- Log-Out Endpoint ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully!' });
  });
});

// --- Simple “who am I” endpoint (optional) ---
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in.' });
  res.json({ id: req.session.userId, username: req.session.username });
});

// --- Save Build Endpoint ---
app.post('/api/builds', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in.' });
  const build = req.body.build;
  if (!build) return res.status(400).json({ message: 'No build data provided.' });
  db.run(
    `INSERT INTO user_builds (userId, buildJSON) VALUES (?, ?)`,
    [req.session.userId, JSON.stringify(build)],
    function(err) {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.status(201).json({ message: 'Build saved!', id: this.lastID });
    }
  );
});

// --- Get User Builds Endpoint ---
app.get('/api/builds', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in.' });
  db.all(
    `SELECT id, buildJSON, savedAt FROM user_builds WHERE userId = ? ORDER BY savedAt DESC`,
    [req.session.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Database error.' });
      const builds = rows.map(r => ({ id: r.id, build: JSON.parse(r.buildJSON), savedAt: r.savedAt }));
      res.json({ builds });
    }
  );
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});