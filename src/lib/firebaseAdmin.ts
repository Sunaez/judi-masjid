import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export type FirebaseAdminConfigErrorCode =
  | 'FIREBASE_ADMIN_MISSING'
  | 'FIREBASE_ADMIN_INCOMPLETE'
  | 'FIREBASE_PRIVATE_KEY_INVALID';

export class FirebaseAdminConfigError extends Error {
  constructor(
    readonly code: FirebaseAdminConfigErrorCode,
    message: string,
    readonly missingVariables: string[] = []
  ) {
    super(message);
    this.name = 'FirebaseAdminConfigError';
  }
}

function getAdminProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
  );
}

function getAdminPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

function getAdminAppOptions(): AppOptions {
  const explicitProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const projectId = getAdminProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = getAdminPrivateKey();
  const hasServiceAccountEnv =
    Boolean(explicitProjectId) || Boolean(clientEmail) || Boolean(privateKey);

  if (hasServiceAccountEnv) {
    const missingVariables = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean) as string[];

    if (missingVariables.length > 0) {
      throw new FirebaseAdminConfigError(
        'FIREBASE_ADMIN_INCOMPLETE',
        `Firebase Admin SDK credentials are incomplete. Missing: ${missingVariables.join(', ')}.`,
        missingVariables
      );
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new FirebaseAdminConfigError(
        'FIREBASE_ADMIN_INCOMPLETE',
        'Firebase Admin SDK credentials are incomplete.'
      );
    }

    if (
      !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
      !privateKey.includes('-----END PRIVATE KEY-----')
    ) {
      throw new FirebaseAdminConfigError(
        'FIREBASE_PRIVATE_KEY_INVALID',
        'FIREBASE_PRIVATE_KEY does not look like a Firebase service account private key.'
      );
    }

    return {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
    return {
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
    };
  }

  throw new FirebaseAdminConfigError(
    'FIREBASE_ADMIN_MISSING',
    'Firebase Admin SDK is not configured. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or configure GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

export function getFirebaseAdminApp(): App {
  return getApps()[0] ?? initializeApp(getAdminAppOptions());
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
