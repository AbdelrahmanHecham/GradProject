// server.js
const express      = require('express');
const bodyParser   = require('body-parser');
const bcrypt       = require('bcrypt');
const sqlite3      = require('sqlite3').verbose();
const session      = require('express-session');
const path         = require('path');

const app = express();
const db  = new sqlite3.Database(path.join(__dirname, 'data', 'users.db'));

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      build TEXT NOT NULL,
      savedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
});

app.use(bodyParser.json());
app.use(session({
  secret: 'replace-with-a-strong-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(express.static(path.join(__dirname)));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  next();
}

// --- Sign-Up ---
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
      function(err) {
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

// --- Log-In ---
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
    res.json({ message: 'Logged in successfully!' });
  });
});

// --- Log-Out ---
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed.' });
    res.json({ message: 'Logged out.' });
  });
});

// --- Compatibility check ---
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
  const cpuTDP    = Number(build.cpu.tdp) || 0;
  const gpuTDP    = Number(build.videoCard.tdp) || 0;
  const coolerTDP = Number(build.cpuCooler.tdp) || 0;
  const totalTDP  = cpuTDP + gpuTDP + coolerTDP;
  const required  = totalTDP * 1.2;
  if (Number(build.powerSupply.wattage) < required) {
    errors.push(
      `PSU wattage (${build.powerSupply.wattage}W) may be insufficient for total TDP (${totalTDP}W).`
    );
  }
  res.json({ compatible: errors.length === 0, errors });
});

// --- Save Build ---
app.post('/api/builds', requireAuth, (req, res) => {
  const { build } = req.body;
  const userId    = req.session.userId;
  const buildStr  = JSON.stringify(build);
  db.run(
    `INSERT INTO user_builds (userId, build) VALUES (?, ?)`,
    [userId, buildStr],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      res.status(201).json({ id: this.lastID, message: 'Build saved successfully!' });
    }
  );
});

// --- Get Saved Builds ---
app.get('/api/builds', requireAuth, (req, res) => {
  const userId = req.session.userId;
  db.all(
    `SELECT id, build, savedAt FROM user_builds WHERE userId = ? ORDER BY savedAt DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error.' });
      }
      const builds = rows.map(r => ({
        id: r.id,
        build: JSON.parse(r.build),
        savedAt: r.savedAt
      }));
      res.json({ builds });
    }
  );
});
// Delete a saved build
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

// --- Protect Pages ---
function serveAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login.html');
  next();
}
app.get('/recommendations.html', serveAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'recommendations.html'));
});
app.get('/dashboard.html', serveAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// --- Serve Static ---
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});