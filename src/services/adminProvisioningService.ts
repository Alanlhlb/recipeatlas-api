import bcrypt from 'bcrypt';
import db from '../db/database';
import type { PublicUser, User } from '../types/user';

interface AdminInput {
  name: string;
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MINIMUM_LENGTH = 12;

/**
 * Creates the initial administrator account from local environment settings.
 */
export async function provisionAdministrator(input: AdminInput): Promise<PublicUser> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) {
    throw new Error('ADMIN_NAME must contain at least 2 characters');
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }

  if (input.password.length < PASSWORD_MINIMUM_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must contain at least ${PASSWORD_MINIMUM_LENGTH} characters`);
  }

  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email) as Pick<User, 'id'> | undefined;

  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = db
    .prepare(
      `INSERT INTO users (name, email, passwordHash, role, createdAt, updatedAt)
       VALUES (?, ?, ?, 'admin', ?, ?)`,
    )
    .run(name, email, passwordHash, now, now);

  return {
    id: Number(result.lastInsertRowid),
    name,
    email,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  };
}
