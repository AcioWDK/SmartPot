const sqlite3 = require('sqlite3').verbose();

// Open database (creates if not exists)
const db = new sqlite3.Database('./smartpot.db', (err) => {
  if (err) {
    console.error('Database opening error: ', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS humidity_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value INTEGER NOT NULL,
    timestamp DATETIME DEFAULT (datetime('now', 'localtime'))
  )
`);

module.exports = db;
