import { format } from 'date-fns';

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: 'Contracts' | 'Users' | 'Settings' | 'Security' | 'System';
  details: string;
  status: 'Success' | 'Warning' | 'Failure';
  ipAddress: string;
};

type AuditLogApi = {
  id: number;
  user: string;
  action: string;
  module: string;
  details: string;
  status: string;
  ip_address?: string | null;
  created_at?: string;
};

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  return format(new Date(value), 'yyyy-MM-dd HH:mm:ss');
};

const mapAuditFromApi = (log: AuditLogApi): AuditLogEntry => ({
  id: String(log.id),
  timestamp: formatTimestamp(log.created_at),
  user: log.user,
  action: log.action,
  module: (log.module as AuditLogEntry['module']) ?? 'System',
  details: log.details,
  status: (log.status as AuditLogEntry['status']) ?? 'Success',
  ipAddress: log.ip_address || 'Internal',
});

export const fetchAuditLogs = async () => {
  const response = await fetch('/api/audit-logs', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load audit logs.');
  }

  const data = (await response.json()) as AuditLogApi[];
  return data.map(mapAuditFromApi);
};
