import bcrypt from 'bcrypt';
import db from '../src/db/database';
import { provisionAdministrator } from '../src/services/adminProvisioningService';

describe('administrator provisioning', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM users').run();
  });

  it('creates an admin account with a hashed password', async () => {
    const admin = await provisionAdministrator({
      name: 'Recipe Admin',
      email: 'admin@example.com',
      password: 'strong-admin-password',
    });

    expect(admin).toMatchObject({
      name: 'Recipe Admin',
      email: 'admin@example.com',
      role: 'admin',
    });
    expect('passwordHash' in admin).toBe(false);

    const storedAdmin = db
      .prepare('SELECT passwordHash, role FROM users WHERE email = ?')
      .get('admin@example.com') as { passwordHash: string; role: string };

    expect(storedAdmin.role).toBe('admin');
    expect(await bcrypt.compare('strong-admin-password', storedAdmin.passwordHash)).toBe(true);
  });

  it('does not allow a second account with the same email', async () => {
    const input = {
      name: 'Recipe Admin',
      email: 'admin@example.com',
      password: 'strong-admin-password',
    };

    await provisionAdministrator(input);

    await expect(provisionAdministrator(input)).rejects.toThrow(
      'An account with this email already exists',
    );
  });
});
