import type { User } from 'firebase/auth';

export class AdminAccessError extends Error {
  constructor(
    message: string,
    readonly code = 'ADMIN_ACCESS_FAILED',
    readonly help: string[] = [],
    readonly status = 0
  ) {
    super(message);
    this.name = 'AdminAccessError';
  }
}

export async function ensureAdminAccess(
  user: User | null | undefined
): Promise<void> {
  if (user?.uid) return;

  throw new AdminAccessError(
    'You must sign in with a Firebase Authentication account to access admin.',
    'ADMIN_AUTH_REQUIRED',
    [
      'Open Firebase Console > Authentication > Users and confirm the account exists.',
      'Sign in with the email and password for a Firebase Authentication user.',
      'Keep account creation restricted to Firebase Console so every signed-in user is trusted.',
    ]
  );
}
