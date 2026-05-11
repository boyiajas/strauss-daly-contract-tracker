import { Contract, Department } from '../types';

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
  review_date?: string | null;
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
    reviewDate: normalizeDateOnly(contract.review_date),
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
    review_date: normalizeDateOnly(contract.reviewDate) || null,
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

export type ImportedContractRow = {
  contractId?: string;
  contract: Partial<Contract>;
  rowNumber: number;
};

export type ParsedContractsWorkbook = {
  rows: ImportedContractRow[];
  errors: string[];
};

const normalizeLookupKey = (value: string) => value.trim().toLowerCase();

const parseStringCell = (value: unknown) => String(value ?? '').trim();

const parseCsvList = (value: unknown) =>
  parseStringCell(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseNumericCell = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const stringValue = parseStringCell(value);
  if (!stringValue) {
    return 0;
  }

  let normalized = stringValue.replace(/[^\d,.-]/g, '');
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized =
      normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
        ? normalized.replace(/\./g, '').replace(',', '.')
        : normalized.replace(/,/g, '');
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const collectIndexedValues = (row: Record<string, unknown>, pattern: RegExp) =>
  Object.entries(row)
    .map(([key, value]) => {
      const match = key.match(pattern);
      if (!match) return null;
      return {
        index: Number.parseInt(match[1] ?? '0', 10),
        value: parseStringCell(value),
      };
    })
    .filter((item): item is { index: number; value: string } => Boolean(item) && Number.isFinite(item.index))
    .sort((a, b) => a.index - b.index)
    .map((item) => item.value)
    .filter(Boolean);

export const parseContractsWorkbook = async (
  file: File,
  departments: Department[]
): Promise<ParsedContractsWorkbook> => {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('The selected workbook does not contain any sheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  const departmentMap = new Map(
    departments.map((department) => [normalizeLookupKey(department.name), department])
  );
  const rows: ImportedContractRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const values = Object.values(row).map((value) => parseStringCell(value));
    if (values.every((value) => value.length === 0)) {
      return;
    }

    const title = parseStringCell(row['Contract Title']);
    const partyName = parseStringCell(row.Counterparty);
    const departmentName = parseStringCell(row.Department);
    const department = departmentMap.get(normalizeLookupKey(departmentName));
    const contractType = parseStringCell(row.Type);
    const category = parseStringCell(row.Category);
    const portfolio = parseStringCell(row.Portfolio);
    const status = parseStringCell(row.Status) || 'Draft';
    const startDate = parseStringCell(row['Start Date']);
    const reviewDate = parseStringCell(row['Review Date']);
    const endDate = parseStringCell(row['End Date']);
    const value = parseNumericCell(row.Value);
    const description = parseStringCell(row.Description);
    const tags = parseCsvList(row.Tags);

    const notificationDays = collectIndexedValues(row, /^Alert Deadline (\d+) \(Days\)$/)
      .map((item) => Number.parseInt(item, 10))
      .filter((item) => Number.isInteger(item) && item > 0);
    const fallbackNotificationDays = parseCsvList(row['Alert Deadline Days'])
      .map((item) => Number.parseInt(item, 10))
      .filter((item) => Number.isInteger(item) && item > 0);
    const normalizedNotificationDays = Array.from(
      new Set(notificationDays.length > 0 ? notificationDays : fallbackNotificationDays)
    ).sort((a, b) => b - a);

    const notificationEmails = collectIndexedValues(row, /^Contract Notification Email (\d+)$/);
    const fallbackNotificationEmails = parseCsvList(row['Notification Emails']);
    const normalizedNotificationEmails = notificationEmails.length > 0
      ? notificationEmails
      : fallbackNotificationEmails;

    const notificationPhones = collectIndexedValues(row, /^Contract Notification Phone (\d+)$/);
    const fallbackNotificationPhones = parseCsvList(row['Notification Phones']);
    const normalizedNotificationPhones = notificationPhones.length > 0
      ? notificationPhones
      : fallbackNotificationPhones;

    const missingFields = [
      !title ? 'Contract Title' : null,
      !partyName ? 'Counterparty' : null,
      !departmentName ? 'Department' : null,
      !contractType ? 'Type' : null,
      !portfolio ? 'Portfolio' : null,
      !startDate ? 'Start Date' : null,
      !category ? 'Category' : null,
      !status ? 'Status' : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      errors.push(`Row ${rowNumber}: missing ${missingFields.join(', ')}.`);
      return;
    }

    if (!department) {
      errors.push(`Row ${rowNumber}: department "${departmentName}" does not exist in the system.`);
      return;
    }

    const contractId = parseStringCell(row['Contract ID']) || undefined;

    rows.push({
      contractId,
      rowNumber,
      contract: {
        title,
        partyName,
        departmentId: department.id,
        departmentName: department.name,
        contractType,
        category,
        portfolio,
        status: status as Contract['status'],
        startDate,
        reviewDate: reviewDate || undefined,
        endDate: endDate || undefined,
        value,
        description: description || undefined,
        tags,
        notificationDays: normalizedNotificationDays,
        notificationEmails: normalizedNotificationEmails,
        notificationPhones: normalizedNotificationPhones,
        notificationEmail: normalizedNotificationEmails[0] || undefined,
        notificationPhone: normalizedNotificationPhones[0] || undefined,
      },
    });
  });

  return { rows, errors };
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
