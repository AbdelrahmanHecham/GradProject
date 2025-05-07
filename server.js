// server.js
require('dotenv').config();
const express      = require('express');
const bodyParser   = require('body-parser');
const bcrypt       = require('bcrypt');
const sqlite3      = require('sqlite3').verbose();
const session      = require('express-session');
const path         = require('path');

const app = express();

// ─── Configuration ─────────────────────────────────────────────────────────────
const PORT           = process.env.PORT           || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback_secret';
const DB_PATH        = process.env.DATABASE_PATH  || 'data/users.db';

// ─── Initialize SQLite Database ────────────────────────────────────────────────
const db = new sqlite3.Database(path.join(__dirname, DB_PATH));

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT    UNIQUE NOT NULL,
      firstName TEXT    NOT NULL,
      lastName  TEXT    NOT NULL,
      address   TEXT,
      email     TEXT    UNIQUE NOT NULL,
      password  TEXT    NOT NULL,
      created   DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Saved builds table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_builds (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      userId   INTEGER NOT NULL,
      build    TEXT    NOT NULL,
      savedAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);

  // Feedback table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_feedback (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      userId   INTEGER NOT NULL,
      build    TEXT    NOT NULL,
      helpful  INTEGER NOT NULL,
      created  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Serve all static files from the project root
app.use(express.static(path.join(__dirname)));


// ─── Authentication Guard ───────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  next();
}

// ─── API Endpoints ──────────────────────────────────────────────────────────────

// Update Address
app.post('/api/update-address', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { address } = req.body;
  if (!address || !userId) {
    return res.status(400).json({ message: 'Address and authentication required.' });
  }
  db.run(
    `UPDATE users SET address = ? WHERE id = ?`,
    [address, userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.json({ message: 'Address updated successfully.' });
    }
  );
});


// Sign-Up
app.post('/api/signup', async (req, res) => {
  const { username, email, password, address } = req.body;
  // Split username into firstName and lastName
  let firstName = '', lastName = '';
  if (username) {
    const parts = username.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, firstName, lastName, address, email, password) VALUES (?,?,?,?,?,?)`,
      [username, firstName, lastName, address || '', email, hash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Username or email already exists.' });
          }
          return res.status(500).json({ message: 'Database error.' });
        }
        res.status(201).json({ message: 'Account created successfully!', username, address: address || '' });
      }
    );
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Log-In
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
    req.session.userId   = user.id;
    req.session.username = user.username;
    res.json({ message: 'Logged in successfully!', username: user.username, address: user.address });
  });
});

// Log-Out
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed.' });
    res.json({ message: 'Logged out.' });
  });
});

// “Who am I?”
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in.' });
  // Fetch address from DB for the current user
  db.get('SELECT address FROM users WHERE id = ?', [req.session.userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json({ id: req.session.userId, username: req.session.username, address: row ? row.address : '' });
  });
});

// Compatibility Check
app.post('/api/check-compatibility', (req, res) => {
  const { build } = req.body;
  const errors = [];

  if (build.cpu.socket !== build.motherboard.socket) {
    errors.push(
      `CPU socket (${build.cpu.socket}) does not match motherboard socket (${build.motherboard.socket}).`
    );
  }
  if (build.memory.type !== build.motherboard.memoryType) {
    errors.push(
      `Memory type (${build.memory.type}) is incompatible with motherboard (${build.motherboard.memoryType}).`
    );
  }
  const cpuTDP    = Number(build.cpu.tdp)       || 0;
  const gpuTDP    = Number(build.videoCard.tdp)  || 0;
  const coolerTDP = Number(build.cpuCooler.tdp)  || 0;
  const totalTDP  = cpuTDP + gpuTDP + coolerTDP;
  const requiredW = Math.ceil(totalTDP * 1.2);
  if (Number(build.powerSupply.wattage) < requiredW) {
    errors.push(
      `PSU wattage (${build.powerSupply.wattage}W) may be insufficient for total TDP (${totalTDP}W).`
    );
  }

  res.json({ compatible: errors.length === 0, errors });
});

// Save a Build
app.post('/api/builds', requireAuth, (req, res) => {
  const { build, purpose, savedAt } = req.body;
  const userId    = req.session.userId;
  const buildStr  = JSON.stringify(build);
  db.run(
    `INSERT INTO user_builds (userId, build, purpose, savedAt) VALUES (?,?,?,?)`,
    [userId, buildStr, purpose || null, savedAt || null],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(201).json({ id: this.lastID, message: 'Build saved successfully!' });
    }
  );
});

// Delete a Saved Build
app.delete('/api/builds/:id', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const buildId = req.params.id;
  db.run(
    `DELETE FROM user_builds WHERE id = ? AND userId = ?`,
    [buildId, userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Build not found or not authorized.' });
      }
      res.json({ message: 'Build deleted successfully.' });
    }
  );
});

// List Saved Builds
app.get('/api/builds', requireAuth, (req, res) => {
  const userId = req.session.userId;
  console.log('DEBUG /api/builds for userId:', userId);
  db.all(
    `SELECT id, build, purpose, savedAt FROM user_builds WHERE userId = ? ORDER BY savedAt DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      const builds = rows.map(r => ({
        id: r.id,
        build: JSON.parse(r.build),
        purpose: r.purpose || '',
        savedAt: r.savedAt || null
      }));
      console.log('DEBUG /api/builds returning:', builds);
      res.json({ builds });
    }
  );
});

// Update a Build
app.put('/api/builds/:id', requireAuth, (req, res) => {
  const buildId = req.params.id;
  const userId = req.session.userId;
  const { build, purpose, savedAt } = req.body;
  console.log('DEBUG PUT /api/builds/:id', { buildId, userId, build, purpose, savedAt });
  if (!build) {
    console.log('DEBUG: No build data provided');
    return res.status(400).json({ message: 'No build data provided.' });
  }
  const buildStr = JSON.stringify(build);
  db.run(
    `UPDATE user_builds SET build = ?, purpose = COALESCE(?, purpose), savedAt = COALESCE(?, savedAt) WHERE id = ? AND userId = ?`,
    [buildStr, purpose, savedAt, buildId, userId],
    function(err) {
      if (err) {
        console.error('DEBUG: Database error in PUT /api/builds/:id', err);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (this.changes === 0) {
        console.log('DEBUG: No build updated for buildId', buildId, 'userId', userId);
        return res.status(404).json({ message: 'Build not found.' });
      }
      res.json({ message: 'Build updated.' });
    }
  );
});

// Delete a Build
app.delete('/api/builds/:id', requireAuth, (req, res) => {
  const buildId = req.params.id;
  const userId  = req.session.userId;
  db.run(
    `DELETE FROM user_builds WHERE id = ? AND userId = ?`,
    [buildId, userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Build not found.' });
      }
      res.json({ message: 'Build deleted.' });
    }
  );
});

// Record Feedback
app.post('/api/feedback', requireAuth, (req, res) => {
  const { build, helpful } = req.body;
  const userId            = req.session.userId;
  const buildStr          = JSON.stringify(build);
  const helpVal           = helpful ? 1 : 0;

  db.run(
    `INSERT INTO user_feedback (userId, build, helpful) VALUES (?,?,?)`,
    [userId, buildStr, helpVal],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.json({ message: 'Feedback recorded. Thank you!' });
    }
  );
});

// ─── Protect Static HTML Pages ─────────────────────────────────────────────────
app.get('/recommendations.html', requireAuth, (req, res) =>
  res.sendFile(path.join(__dirname, 'recommendations.html'))
);
app.get('/dashboard.html', requireAuth, (req, res) =>
  res.sendFile(path.join(__dirname, 'dashboard.html'))
);

// ─── Start Server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});