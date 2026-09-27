import 'dotenv/config';
import { provisionAdministrator } from '../services/adminProvisioningService';

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

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Unable to create administrator');
  process.exitCode = 1;
});
