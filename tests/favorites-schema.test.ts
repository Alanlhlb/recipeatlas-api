import db from '../src/db/database';

describe('favorites database schema', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM favorites').run();
    db.prepare('DELETE FROM recipes').run();
    db.prepare('DELETE FROM users').run();
  });

  it('creates a favorites table with user and recipe ownership columns', () => {
    const columns = db.prepare('PRAGMA table_info(favorites)').all() as Array<{ name: string }>;

    expect(columns.map((column) => column.name)).toEqual([
      'userId',
      'recipeId',
      'createdAt',
    ]);
  });

  it('prevents duplicate favorites for the same user and recipe', () => {
    const now = new Date().toISOString();
    const user = db
      .prepare(
        `INSERT INTO users (name, email, passwordHash, role, createdAt, updatedAt)
         VALUES (?, ?, ?, 'user', ?, ?)`,
      )
      .run('Favorite User', 'favorite@example.com', 'hash', now, now);
    const recipe = db
      .prepare(
        `INSERT INTO recipes (title, instructions, createdAt, updatedAt)
         VALUES (?, ?, ?, ?)`,
      )
      .run('Favorite Recipe', 'Instructions', now, now);

    db.prepare('INSERT INTO favorites (userId, recipeId, createdAt) VALUES (?, ?, ?)').run(
      user.lastInsertRowid,
      recipe.lastInsertRowid,
      now,
    );

    expect(() => {
      db.prepare('INSERT INTO favorites (userId, recipeId, createdAt) VALUES (?, ?, ?)').run(
        user.lastInsertRowid,
        recipe.lastInsertRowid,
        now,
      );
    }).toThrow();
  });
});
