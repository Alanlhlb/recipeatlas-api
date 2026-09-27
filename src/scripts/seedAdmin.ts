/**
 * Command-line script that provisions the first administrator account.
 *
 * Reads `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment and
 * exits with a non-zero status when the account cannot be created.
 */
import 'dotenv/config';
import { provisionAdministrator } from '../services/adminProvisioningService';

/**
 * Creates the administrator from the environment and reports the result.
 *
 * @throws {Error} when any required environment variable is missing.
 */
async function main(): Promise<void> {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }

  const admin = await provisionAdministrator({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  console.log(`Administrator created for ${admin.email}`);
}

/** Reports the failure reason and marks the process as failed. */
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unable to create administrator');
  process.exitCode = 1;
});
