import type { UserRole } from './user';

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}
