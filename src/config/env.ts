/** JWT signing secret supplied through the environment. */
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set before starting the API');
}

/**
 * Validated runtime configuration shared across the API.
 *
 * Reading the secret at import time makes a missing `JWT_SECRET` fail fast at
 * startup rather than at the first token operation.
 */
export default {
  /** Secret used to sign and verify access tokens. */
  jwtSecret,
  /** Origin permitted by CORS; defaults to the local Vite dev server. */
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
};
