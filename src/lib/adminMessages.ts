export interface AdminFeedback {
  message: string;
  help: string[];
}

export function getFirebaseAuthFeedback(code: string): AdminFeedback {
  switch (code) {
    case 'auth/invalid-email':
      return {
        message: 'Enter a valid admin email address.',
        help: ['Check for missing characters or spaces in the email address.'],
      };
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
      return {
        message: 'Firebase Authentication is not configured correctly for this app.',
        help: [
          'Check NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.',
          'Make sure the Firebase project has Email/Password sign-in enabled.',
        ],
      };
    case 'auth/operation-not-allowed':
      return {
        message: 'Email/password login is not enabled in Firebase Authentication.',
        help: [
          'Open Firebase Console > Authentication > Sign-in method.',
          'Enable the Email/Password provider, then try again.',
        ],
      };
    case 'auth/user-disabled':
      return {
        message: 'This Firebase Authentication user is disabled.',
        help: [
          'Open Firebase Console > Authentication > Users.',
          'Re-enable the admin user, then sign in again.',
        ],
      };
    case 'auth/network-request-failed':
      return {
        message: 'The browser could not reach Firebase Authentication.',
        help: [
          'Check the internet connection and try again.',
          'If this is local development, check that the dev server is still running.',
        ],
      };
    case 'auth/too-many-requests':
      return {
        message: 'Too many failed attempts. Firebase has temporarily blocked sign-in.',
        help: [
          'Wait a few minutes before trying again.',
          'Use the password reset button if the password may be wrong.',
        ],
      };
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return {
        message: 'Invalid admin email or password.',
        help: [
          'Use the exact email for a Firebase Authentication user created in Firebase Console.',
          'Reset the password if you are unsure it is correct.',
        ],
      };
    default:
      return {
        message: 'Admin sign-in failed.',
        help: [
          'Check the email and password, then try again.',
          'Open the browser console or server logs for the Firebase error code.',
        ],
      };
  }
}

export function getPasswordResetFeedback(code: string): AdminFeedback {
  switch (code) {
    case 'auth/invalid-email':
      return {
        message: 'Enter a valid email address.',
        help: ['Check the email field before sending a reset link.'],
      };
    case 'auth/network-request-failed':
      return {
        message: 'Could not contact Firebase to send the reset link.',
        help: ['Check the internet connection, then try again.'],
      };
    default:
      return {
        message:
          'If an admin account exists for that email, a password reset link has been sent.',
        help: [],
      };
  }
}
