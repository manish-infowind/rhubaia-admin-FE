let twoFactorToken: string | null = null;
let twoFactorEmail: string | null = null;

export const twoFactorStore = {
  set(payload: { token: string; email?: string | null }) {
    twoFactorToken = payload.token;
    twoFactorEmail = payload.email ?? null;
  },
  getToken() {
    return twoFactorToken;
  },
  getEmail() {
    return twoFactorEmail;
  },
  clear() {
    twoFactorToken = null;
    twoFactorEmail = null;
  },
};

