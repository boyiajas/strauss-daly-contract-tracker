import { User } from '../types';

type UserApi = {
  id: number;
  name: string;
  email: string;
  role?: string;
  department?: string;
  status?: string;
};

const mapUserFromApi = (user: UserApi): User => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  role: (user.role ?? 'Viewer') as User['role'],
  department: user.department ?? '',
  status: (user.status ?? 'Active') as User['status'],
});

export const fetchUsers = async () => {
  const response = await fetch('/api/users', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load users.');
  }

  const data = (await response.json()) as UserApi[];
  return data.map(mapUserFromApi);
};

export const fetchUser = async (id: string) => {
  const response = await fetch(`/api/users/${id}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load user.');
  }

  const data = (await response.json()) as UserApi;
  return mapUserFromApi(data);
};

export const createUser = async (user: Partial<User>) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role ?? 'Viewer',
      department: user.department ?? '',
      status: user.status ?? 'Active',
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to create user.';
    throw new Error(message);
  }

  const data = (await response.json()) as UserApi;
  return mapUserFromApi(data);
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: updates.name,
      email: updates.email,
      role: updates.role,
      department: updates.department,
      status: updates.status,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to update user.';
    throw new Error(message);
  }

  const data = (await response.json()) as UserApi;
  return mapUserFromApi(data);
};

export const deleteUser = async (id: string) => {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to delete user.');
  }
};
