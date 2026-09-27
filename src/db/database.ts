import Database from 'better-sqlite3';
import path from 'path';

/**
 * Selects the SQLite file name, using a dedicated database while tests run so the
 * development data is never overwritten by the test suite.
 */
const databaseFileName =
  process.env.NODE_ENV === 'test' ? 'recipeatlas.test.db' : 'recipeatlas.db';
/** Absolute path to the SQLite database file, stored at the project root. */
const dbPath = path.join(__dirname, '..', '..', databaseFileName);
/** Shared SQLite connection used by every service. */
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

/**
 * Creates the users, recipes, ingredients, favorites and messages tables when they
 * do not already exist. Foreign keys cascade recipe and user deletions to their
 * dependent rows.
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    category TEXT,
    imageUrl TEXT,
    cookingTime INTEGER,
    servings INTEGER,
    difficulty TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipeId INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT,
    FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    userId INTEGER NOT NULL,
    recipeId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    PRIMARY KEY (userId, recipeId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    recipeId INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipeId) REFERENCES recipes(id) ON DELETE CASCADE
  );
`);

/** The shared database connection, re-exported for use across the API. */
export default db;