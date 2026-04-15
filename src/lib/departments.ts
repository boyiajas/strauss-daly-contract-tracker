import { Department } from '../types';

type DepartmentApi = {
  id: number;
  name: string;
};

const mapDepartmentFromApi = (department: DepartmentApi): Department => ({
  id: String(department.id),
  name: department.name,
});

export const fetchDepartments = async () => {
  const response = await fetch('/api/departments', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load departments.');
  }

  const data = (await response.json()) as DepartmentApi[];
  return data.map(mapDepartmentFromApi);
};

export const createDepartment = async (name: string) => {
  const response = await fetch('/api/departments', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Unable to create department.');
  }

  const data = (await response.json()) as DepartmentApi;
  return mapDepartmentFromApi(data);
};

export const updateDepartment = async (id: string, name: string) => {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Unable to update department.');
  }

  const data = (await response.json()) as DepartmentApi;
  return mapDepartmentFromApi(data);
};
