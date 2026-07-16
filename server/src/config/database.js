// ============================================================
// Industrias RUAM - Database Configuration & Initialization
// Uses better-sqlite3 with WAL mode for optimal performance
// ============================================================

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env at server root
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Resolve DB_PATH relative to the server root directory
const serverRoot = path.join(__dirname, '..', '..');
const dbRelativePath = process.env.DB_PATH || './data/ruam.db';
const dbPath = path.resolve(serverRoot, dbRelativePath);

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

// Initialize the better-sqlite3 database connection
const db = new Database(dbPath);

// Enable WAL journal mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Enable foreign key enforcement (off by default in SQLite)
db.pragma('foreign_keys = ON');

/**
 * Reads and executes the schema.sql file to create all tables.
 * Uses CREATE TABLE IF NOT EXISTS so it is safe to call multiple times.
 */
function initializeDatabase() {
    const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
    console.log('[DB] Database initialized successfully at', dbPath);
}

// Run initialization on module load
initializeDatabase();

module.exports = db;
module.exports.initializeDatabase = initializeDatabase;
