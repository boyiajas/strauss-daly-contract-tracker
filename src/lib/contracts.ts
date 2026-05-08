import { Contract } from '../types';

type ContractApi = {
  id: number;
  title: string;
  party_name: string;
  department_id?: number | null;
  contract_type?: string | null;
  portfolio?: string | null;
  department?: {
    id: number;
    name: string;
  } | null;
  start_date: string;
  end_date?: string | null;
  value: string | number;
  status: string;
  category: string;
  description?: string | null;
  tags?: string[] | null;
  notification_email?: string | null;
  notification_phone?: string | null;
  notification_emails?: string[] | null;
  notification_phones?: string[] | null;
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

const normalizeDateOnly = (value: string | null | undefined) => {
  if (!value) return '';
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
};

const normalizeStringArray = (value?: string[] | null, fallback?: string | null) => {
  const normalized = (value ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  if (fallback?.trim()) {
    return [fallback.trim()];
  }

  return [];
};

export const mapContractFromApi = (contract: ContractApi): Contract => {
  const notificationEmails = normalizeStringArray(
    contract.notification_emails,
    contract.notification_email
  );
  const notificationPhones = normalizeStringArray(
    contract.notification_phones,
    contract.notification_phone
  );

  return {
    id: String(contract.id),
    title: contract.title,
    partyName: contract.party_name,
    departmentId: contract.department_id ? String(contract.department_id) : undefined,
    departmentName: contract.department?.name ?? undefined,
    contractType: contract.contract_type ?? undefined,
    portfolio: contract.portfolio ?? undefined,
    startDate: normalizeDateOnly(contract.start_date),
    endDate: normalizeDateOnly(contract.end_date),
    value: toNumber(contract.value),
    status: contract.status as Contract['status'],
    category: contract.category as Contract['category'],
    lastModified: contract.updated_at || contract.created_at || contract.start_date,
    description: contract.description ?? undefined,
    tags: contract.tags ?? [],
    notificationEmail: notificationEmails[0] ?? undefined,
    notificationPhone: notificationPhones[0] ?? undefined,
    notificationEmails,
    notificationPhones,
    notificationDays: contract.notification_days ?? undefined,
    fileName: contract.file_name ?? undefined,
  };
};

export const mapContractToApi = (contract: Partial<Contract>) => {
  const notificationEmails = normalizeStringArray(
    contract.notificationEmails,
    contract.notificationEmail
  );
  const notificationPhones = normalizeStringArray(
    contract.notificationPhones,
    contract.notificationPhone
  );

  return {
    title: contract.title ?? '',
    party_name: contract.partyName ?? '',
    department_id: contract.departmentId ? Number(contract.departmentId) : null,
    contract_type: contract.contractType ?? '',
    portfolio: contract.portfolio ?? '',
    start_date: normalizeDateOnly(contract.startDate) ?? '',
    end_date: normalizeDateOnly(contract.endDate) || null,
    value: contract.value ?? 0,
    status: contract.status ?? 'Draft',
    category: contract.category ?? '',
    description: contract.description ?? null,
    tags: contract.tags ?? [],
    notification_email: notificationEmails[0] ?? null,
    notification_phone: notificationPhones[0] ?? null,
    notification_emails: notificationEmails,
    notification_phones: notificationPhones,
    notification_days: contract.notificationDays ?? [],
    file_name: contract.fileName ?? null,
  };
};

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
