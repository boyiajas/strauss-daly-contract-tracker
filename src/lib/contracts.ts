import { Contract } from '../types';

type ContractApi = {
  id: number;
  title: string;
  party_name: string;
  department_id?: number | null;
  department?: {
    id: number;
    name: string;
  } | null;
  start_date: string;
  end_date: string;
  value: string | number;
  status: string;
  category: string;
  description?: string | null;
  tags?: string[] | null;
  notification_email?: string | null;
  notification_phone?: string | null;
  notification_days?: number[] | null;
  file_name?: string | null;
  created_at?: string;
  updated_at?: string;
};

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  return typeof value === 'string' ? Number(value) : value;
};

export const mapContractFromApi = (contract: ContractApi): Contract => ({
  id: String(contract.id),
  title: contract.title,
  partyName: contract.party_name,
  departmentId: contract.department_id ? String(contract.department_id) : undefined,
  departmentName: contract.department?.name ?? undefined,
  startDate: contract.start_date,
  endDate: contract.end_date,
  value: toNumber(contract.value),
  status: contract.status as Contract['status'],
  category: contract.category as Contract['category'],
  lastModified: contract.updated_at || contract.created_at || contract.start_date,
  description: contract.description ?? undefined,
  tags: contract.tags ?? [],
  notificationEmail: contract.notification_email ?? undefined,
  notificationPhone: contract.notification_phone ?? undefined,
  notificationDays: contract.notification_days ?? undefined,
  fileName: contract.file_name ?? undefined,
});

export const mapContractToApi = (contract: Partial<Contract>) => ({
  title: contract.title ?? '',
  party_name: contract.partyName ?? '',
  department_id: contract.departmentId ? Number(contract.departmentId) : null,
  start_date: contract.startDate ?? '',
  end_date: contract.endDate ?? '',
  value: contract.value ?? 0,
  status: contract.status ?? 'Draft',
  category: contract.category ?? 'Service',
  description: contract.description ?? null,
  tags: contract.tags ?? [],
  notification_email: contract.notificationEmail ?? null,
  notification_phone: contract.notificationPhone ?? null,
  notification_days: contract.notificationDays ?? [],
  file_name: contract.fileName ?? null,
});

export const fetchContracts = async () => {
  const response = await fetch('/api/contracts', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load contracts.');
  }

  const data = (await response.json()) as ContractApi[];
  return data.map(mapContractFromApi);
};

export const fetchContract = async (id: string) => {
  const response = await fetch(`/api/contracts/${id}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load contract.');
  }

  const data = (await response.json()) as ContractApi;
  return mapContractFromApi(data);
};

export const createContract = async (contract: Partial<Contract>) => {
  const response = await fetch('/api/contracts', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapContractToApi(contract)),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to create contract.';
    throw new Error(message);
  }

  const data = (await response.json()) as ContractApi;
  return mapContractFromApi(data);
};

export const updateContract = async (id: string, contract: Partial<Contract>) => {
  const response = await fetch(`/api/contracts/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapContractToApi(contract)),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to update contract.';
    throw new Error(message);
  }

  const data = (await response.json()) as ContractApi;
  return mapContractFromApi(data);
};

export const deleteContract = async (id: string) => {
  const response = await fetch(`/api/contracts/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to delete contract.');
  }
};
