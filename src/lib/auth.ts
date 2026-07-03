import { UserRole } from '../types';

type SessionUser = {
  role?: UserRole;
};

export const getCurrentUserRole = (): UserRole | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem('strauss_daly_user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as SessionUser;
    return user.role ?? null;
  } catch {
    return null;
  }
};

export const canAuthoriseContracts = (role: UserRole | null) =>
  role === 'Admin' || role === 'Authoriser';
