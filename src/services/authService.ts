import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import type { PublicUser, User } from '../types/user';

/** Raw registration body; fields are unvalidated and typed `unknown` on purpose. */
interface RegisterInput {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

/** Raw login body; fields are unvalidated and typed `unknown` on purpose. */
interface LoginInput {
  email?: unknown;
  password?: unknown;
}

/** A full user row as stored, including the password hash. */
interface UserRow extends User {}

/** Simple format check applied to email addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Minimum length required for a new account password. */
const PASSWORD_MINIMUM_LENGTH = 8;

/**
 * Validates and normalises a registration payload.
 *
 * @param input - Raw registration body.
 * @returns The trimmed name, lower-cased email and untouched password.
 * @throws {AppError} 400 when the name, email or password is invalid.
 */
function validateRegistration(input: RegisterInput): {
  name: string;
  email: string;
  password: string;
} {
  if (typeof input.name !== 'string' || input.name.trim().length < 2) {
    throw new AppError('Name must contain at least 2 characters', 400);
  }

  if (typeof input.email !== 'string' || !EMAIL_PATTERN.test(input.email.trim())) {
    throw new AppError('A valid email address is required', 400);
  }

  if (typeof input.password !== 'string' || input.password.length < PASSWORD_MINIMUM_LENGTH) {
    throw new AppError(
      `Password must contain at least ${PASSWORD_MINIMUM_LENGTH} characters`,
      400,
    );
  }

  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
}

/**
 * Validates and normalises a login payload.
 *
 * @param input - Raw login body.
 * @returns The lower-cased email and the supplied password.
 * @throws {AppError} 400 when the email or password is missing or malformed.
 */
function validateLogin(input: LoginInput): { email: string; password: string } {
  if (typeof input.email !== 'string' || !EMAIL_PATTERN.test(input.email.trim())) {
    throw new AppError('A valid email address is required', 400);
  }

  if (typeof input.password !== 'string' || input.password.length === 0) {
    throw new AppError('Password is required', 400);
  }

  return {
    email: input.email.trim().toLowerCase(),
    password: input.password,
  };
}

/**
 * Strips the password hash from a stored user row.
 *
 * @param user - Full user row read from the database.
 * @returns The same user without its `passwordHash` field.
 */
function toPublicUser(user: UserRow): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

/**
 * Finds a user for an authenticated account request.
 *
 * @param id - Identifier carried by the validated access token.
 * @returns The matching account without its password hash.
 * @throws {AppError} 401 when no account has that identifier.
 */
export function getPublicUserById(id: number): PublicUser {
  const user = db
    .prepare(
      `SELECT id, name, email, passwordHash, role, createdAt, updatedAt
       FROM users WHERE id = ?`,
    )
    .get(id) as UserRow | undefined;

  if (!user) {
    throw new AppError('User account was not found', 401);
  }

  return toPublicUser(user);
}

/**
 * Creates a standard user account. Public registration never creates admins.
 *
 * @param input - Raw registration body.
 * @returns The created account, without its password hash.
 * @throws {AppError} 400 when the payload is invalid, 409 when the email is taken.
 */
export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const { name, email, password } = validateRegistration(input);
  const existingUser = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email) as Pick<User, 'id'> | undefined;

  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = db
      .prepare(
        `INSERT INTO users (name, email, passwordHash, role, createdAt, updatedAt)
         VALUES (?, ?, ?, 'user', ?, ?)`,
      )
      .run(name, email, passwordHash, now, now);

    const createdUser = db
      .prepare(
        `SELECT id, name, email, passwordHash, role, createdAt, updatedAt
         FROM users WHERE id = ?`,
      )
      .get(result.lastInsertRowid) as UserRow;

    return toPublicUser(createdUser);
  } catch (error) {
    if (error instanceof Error && error.message.includes('users.email')) {
      throw new AppError('An account with this email already exists', 409);
    }

    throw error;
  }
}

/**
 * Verifies credentials and returns a signed access token.
 *
 * @param input - Raw login body.
 * @returns A one-hour JWT and the matching public user.
 * @throws {AppError} 400 when the payload is invalid, 401 when the credentials do not match.
 */
export async function loginUser(
  input: LoginInput,
): Promise<{ token: string; user: PublicUser }> {
  const { email, password } = validateLogin(input);
  const user = db
    .prepare(
      `SELECT id, name, email, passwordHash, role, createdAt, updatedAt
       FROM users WHERE email = ?`,
    )
    .get(email) as UserRow | undefined;

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: '1h',
  });

  return { token, user: toPublicUser(user) };
}
