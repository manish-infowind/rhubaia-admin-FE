import type { User } from '@/api/types';

const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  tempToken: 'tempToken',
  user: 'user',
  sessionId: 'sessionId',
  isSuperAdmin: 'isSuperAdmin',
  passwordChanged: 'passwordChanged',
} as const;

export const AUTH_LOGOUT_EVENT = 'auth:logout';

type StoredUser = User | Record<string, unknown>;

const SENSITIVE_USER_FIELDS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'accessToken',
  'refreshToken',
  'token',
  'tempToken',
]);

const sanitizeStoredUser = (user: StoredUser | null | undefined): StoredUser | null => {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !SENSITIVE_USER_FIELDS.has(key))
  );
};

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  },

  getTempToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.tempToken);
  },

  getCurrentUser<T extends StoredUser = User>(): T | null {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.user);
      return user ? (JSON.parse(user) as T) : null;
    } catch {
      return null;
    }
  },

  setTokens(accessToken: string, refreshToken?: string | null): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);

    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    }
  },

  setTempToken(tempToken: string): void {
    localStorage.setItem(STORAGE_KEYS.tempToken, tempToken);
  },

  setCurrentUser(user: StoredUser | null | undefined): void {
    const sanitizedUser = sanitizeStoredUser(user);

    if (!sanitizedUser) {
      localStorage.removeItem(STORAGE_KEYS.user);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(sanitizedUser));
  },

  setSessionMetadata(sessionId?: string | null, isSuperAdmin?: boolean | null): void {
    if (sessionId) {
      localStorage.setItem(STORAGE_KEYS.sessionId, sessionId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.sessionId);
    }

    if (typeof isSuperAdmin === 'boolean') {
      localStorage.setItem(STORAGE_KEYS.isSuperAdmin, String(isSuperAdmin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.isSuperAdmin);
    }
  },

  markPasswordChanged(): void {
    localStorage.setItem(STORAGE_KEYS.passwordChanged, 'true');
  },

  consumePasswordChangedFlag(): boolean {
    const wasChanged = localStorage.getItem(STORAGE_KEYS.passwordChanged) === 'true';
    localStorage.removeItem(STORAGE_KEYS.passwordChanged);
    return wasChanged;
  },

  clearAuth(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

export { STORAGE_KEYS };
