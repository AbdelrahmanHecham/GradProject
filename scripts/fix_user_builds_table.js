// Node.js script to add 'purpose' and 'savedAt' columns to user_builds table if missing
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/users.db');
const db = new sqlite3.Database(dbPath);

function addColumnIfNotExists(table, column, type) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, columns) => {
      if (err) return reject(err);
      const exists = columns.some(col => col.name === column);
      if (exists) {
        console.log(`Column '${column}' already exists.`);
        return resolve();
      }
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`, err => {
        if (err) return reject(err);
        console.log(`Added column '${column}' to table '${table}'.`);
        resolve();
      });
    });
  });
}

(async () => {
  try {
    await addColumnIfNotExists('user_builds', 'purpose', 'TEXT');
    await addColumnIfNotExists('user_builds', 'savedAt', 'DATETIME');
    console.log('Migration complete.');
    db.close();
  } catch (e) {
    console.error('Migration failed:', e);
    db.close();
    process.exit(1);
  }
})();
