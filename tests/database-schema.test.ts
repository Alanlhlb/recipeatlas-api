import db from '../src/db/database';

describe('database schema', () => {
  it('creates a users table with the expected columns', () => {
    const columns = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;

    expect(columns.map((column) => column.name)).toEqual([
      'id',
      'name',
      'email',
      'passwordHash',
      'role',
      'createdAt',
      'updatedAt',
    ]);
  });
});
