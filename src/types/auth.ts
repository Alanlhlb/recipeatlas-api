import type { UserRole } from './user';

/** The identity attached to a request after its access token has been verified. */
export interface AuthenticatedUser {
  /** Identifier of the authenticated account. */
  id: number;
  /** Role carried by the access token, used for authorisation decisions. */
  role: UserRole;
}
