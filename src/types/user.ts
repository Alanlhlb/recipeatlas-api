/** Role assigned to an account, controlling access to administrator operations. */
export type UserRole = 'user' | 'admin';

/** A user account as stored in the database, including the password hash. */
export interface User {
  /** Surrogate key of the account. */
  id: number;
  /** Display name of the account holder. */
  name: string;
  /** Unique, case-insensitive email address used to log in. */
  email: string;
  /** bcrypt hash of the account password; never returned to clients. */
  passwordHash: string;
  /** Role controlling access to administrator endpoints. */
  role: UserRole;
  /** ISO-8601 timestamp of creation. */
  createdAt: string;
  /** ISO-8601 timestamp of the most recent update. */
  updatedAt: string;
}

/** A user account as returned to API clients, without the password hash. */
export type PublicUser = Omit<User, 'passwordHash'>;
