import type { User } from 'firebase/auth';

import { AdminAccessError, ensureAdminAccess } from '../adminClient';

describe('ensureAdminAccess', () => {
  it('allows signed-in Firebase Authentication users', async () => {
    await expect(ensureAdminAccess({ uid: 'firebase-user-id' } as User))
      .resolves.toBeUndefined();
  });

  it('rejects missing Firebase Authentication sessions', async () => {
    await expect(
      ensureAdminAccess(null)
    ).rejects.toMatchObject<Partial<AdminAccessError>>({
      code: 'ADMIN_AUTH_REQUIRED',
    });
  });
});
