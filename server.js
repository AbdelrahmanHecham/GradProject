// server.js
require('dotenv').config();
const express      = require('express');
const bodyParser   = require('body-parser');
const bcrypt       = require('bcrypt');
const sqlite3      = require('sqlite3').verbose();
const session      = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
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
      avatar    TEXT,
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

  // Public builds table
  db.run(`
    CREATE TABLE IF NOT EXISTS public_builds (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      userId      INTEGER NOT NULL,
      build       TEXT    NOT NULL,
      title       TEXT,
      description TEXT,
      publishedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
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
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, 'data') }),
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
        // Auto-login after signup
        req.session.userId = this.lastID;
        req.session.username = username;
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
  console.log('DEBUG POST /api/builds request body:', req.body);
  console.log('DEBUG POST /api/builds inserting:', {
    userId,
    buildStr,
    purpose: purpose || null,
    savedAt: savedAt || null
  });
  // Debug log all variables
  console.log('DEBUG userId:', userId);
  console.log('DEBUG buildStr:', buildStr);
  console.log('DEBUG purpose:', purpose);
  console.log('DEBUG savedAt:', savedAt);
  db.run(
    `INSERT INTO user_builds (userId, build, purpose, savedAt) VALUES (?,?,?,?)`,
    [userId, buildStr, purpose || null, savedAt || null],
    function(err) {
      if (err) {
        console.error('DEBUG: Database error in POST /api/builds:', err);
        console.error('DEBUG: Error stack:', err && err.stack);
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
        purpose: (r.purpose && r.purpose.trim() !== '') ? r.purpose : 'Untitled Build',
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
  // Only update purpose if it's a non-empty string
  const updateFields = ['build = ?'];
  const updateValues = [buildStr];
  if (purpose && typeof purpose === 'string' && purpose.trim() !== '') {
    updateFields.push('purpose = ?');
    updateValues.push(purpose);
  }
  if (savedAt) {
    updateFields.push('savedAt = ?');
    updateValues.push(savedAt);
  }
  updateValues.push(buildId, userId);
  const sql = `UPDATE user_builds SET ${updateFields.join(', ')} WHERE id = ? AND userId = ?`;
  db.run(sql, updateValues, function(err) {
    if (err) {
      console.error('DEBUG: Database error in PUT /api/builds/:id', err);
      return res.status(500).json({ message: 'Database error.' });
    }
    if (this.changes === 0) {
      console.log('DEBUG: No build updated for buildId', buildId, 'userId', userId);
      return res.status(404).json({ message: 'Build not found.' });
    }
    res.json({ message: 'Build updated.' });
  });
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

// ─── Component Price API ─────────────────────────────────────────────
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const COMPONENT_CSVS = [
  { type: 'cpu', file: 'cpu.csv' },
  { type: 'gpu', file: 'video-card.csv' },
  { type: 'ram', file: 'memory.csv' },
  { type: 'motherboard', file: 'motherboard.csv' },
  { type: 'storage', file: 'internal-hard-drive.csv' },
  { type: 'psu', file: 'power-supply.csv' },
  { type: 'case', file: 'case.csv' },
  { type: 'cooler', file: 'cpu-cooler.csv' },
  { type: 'monitor', file: 'monitor.csv' }
];

app.get('/api/component-price', (req, res) => {
  try {
    const q = (req.query.name || '').trim().toLowerCase();
    if (!q) return res.status(400).json({ message: 'Missing name parameter.' });
    for (const comp of COMPONENT_CSVS) {
      const filePath = path.join(__dirname, 'data', comp.file);
      if (!fs.existsSync(filePath)) continue;
      let rows = [];
      try {
        const csv = fs.readFileSync(filePath, 'utf8');
        rows = parse(csv, { columns: true, skip_empty_lines: true, relax_column_count: true });
      } catch (err) {
        console.error('CSV parse error in', comp.file, ':', err.message);
        continue;
      }
      for (const row of rows) {
        // Only use rows with BOTH non-empty name and price
        if (!row.name || !row.price || String(row.price).trim() === '') continue;
        if (row.name.toLowerCase().includes(q) || comp.type === q) {
          let price = row.price;
          if (typeof price === 'string') price = price.replace(/[^\d.]/g, '');
          price = parseFloat(price);
          if (!isNaN(price)) {
            return res.json({ price, name: row.name });
          }
        }
      }
    }
    res.status(404).json({ message: 'Component not found.' });
  } catch (err) {
    console.error('Component price API error:', err.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// ─── Public Builds API ─────────────────────────────────────────────────────────
// Publish a build to the public gallery
app.post('/api/public-builds', requireAuth, (req, res) => {
  const { build, title, description } = req.body;
  const userId = req.session.userId;
  if (!build) {
    return res.status(400).json({ message: 'Build is required.' });
  }
  const buildStr = JSON.stringify(build);
  db.run(
    `INSERT INTO public_builds (userId, build, title, description) VALUES (?, ?, ?, ?)`,
    [userId, buildStr, title || '', description || ''],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(201).json({ id: this.lastID, message: 'Build published to gallery!' });
    }
  );
});

// List all public builds
app.get('/api/public-builds', (req, res) => {
  db.all(
    `SELECT public_builds.*, users.username FROM public_builds JOIN users ON public_builds.userId = users.id ORDER BY publishedAt DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      const builds = rows.map(r => ({
        id: r.id,
        userId: r.userId,
        username: r.username,
        build: JSON.parse(r.build),
        title: r.title,
        description: r.description,
        publishedAt: r.publishedAt
      }));
      res.json({ builds });
    }
  );
});

// ─── Profile API ─────────────────────────────────────────────────────────────--
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'images', 'avatars') });

// Get current user profile
app.get('/api/profile', requireAuth, (req, res) => {
  db.get('SELECT firstName, lastName, address, email, avatar FROM users WHERE id = ?', [req.session.userId], (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!row) return res.status(404).json({ message: 'User not found.' });
    res.json(row);
  });
});

// Update profile info (firstName, lastName, address, avatar)
app.put('/api/profile', requireAuth, (req, res) => {
  const { firstName, lastName, address, avatar } = req.body;
  db.run(
    'UPDATE users SET firstName = ?, lastName = ?, address = ?, avatar = ? WHERE id = ?',
    [firstName, lastName, address, avatar, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ message: 'Database error.' });
      if (this.changes === 0) return res.status(404).json({ message: 'User not found.' });
      res.json({ message: 'Profile updated.' });
    }
  );
});

// Upload avatar image
app.post('/api/profile/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  // Save file path relative to /images/avatars
  const avatarPath = `images/avatars/${req.file.filename}`;
  db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.session.userId], function(err) {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json({ avatar: avatarPath });
  });
});

// Change password
app.put('/api/profile/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new password are required.' });
  db.get('SELECT password FROM users WHERE id = ?', [req.session.userId], async (err, row) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (!row) return res.status(404).json({ message: 'User not found.' });
    const match = await bcrypt.compare(currentPassword, row.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.userId], function(err) {
      if (err) return res.status(500).json({ message: 'Database error.' });
      res.json({ message: 'Password updated.' });
    });
  });
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