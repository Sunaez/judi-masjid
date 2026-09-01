import {
  getFirebaseAuthFeedback,
  getPasswordResetFeedback,
} from '../adminMessages';

describe('adminMessages', () => {
  it('gives actionable messages for common Firebase sign-in errors', () => {
    expect(getFirebaseAuthFeedback('auth/invalid-email').message).toBe(
      'Enter a valid admin email address.'
    );
    expect(getFirebaseAuthFeedback('auth/operation-not-allowed').help).toContain(
      'Enable the Email/Password provider, then try again.'
    );
    expect(getFirebaseAuthFeedback('auth/invalid-credential').message).toBe(
      'Invalid admin email or password.'
    );
  });

  it('keeps password reset enumeration-safe by default', () => {
    expect(getPasswordResetFeedback('auth/user-not-found').message).toBe(
      'If an admin account exists for that email, a password reset link has been sent.'
    );
    expect(getPasswordResetFeedback('auth/invalid-email').help).toHaveLength(1);
  });
});
