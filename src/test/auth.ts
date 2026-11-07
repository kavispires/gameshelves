import type { User } from 'firebase/auth';

export function createAuthUser(uid = 'test-user'): User {
  return {
    uid,
    email: 'test@example.com',
    emailVerified: false,
    isAnonymous: false,
    displayName: null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
    providerData: [],
    metadata: {},
    refreshToken: 'test-refresh-token',
    tenantId: null,
    delete: async () => {},
    reload: async () => {},
    getIdToken: async () => 'test-token',
    getIdTokenResult: async () => ({
      token: 'test-token',
      authTime: '',
      issuedAtTime: '',
      expirationTime: '',
      signInProvider: 'password',
      signInSecondFactor: null,
      claims: {},
    }),
    toJSON: () => ({ uid }),
  };
}
