import { format } from 'date-fns';
import { NotificationLog, NotificationRecipient, NotificationSettings } from '../types';

type NotificationSettingsApi = {
  id: number;
  channel_email: boolean;
  channel_sms: boolean;
  channel_whatsapp: boolean;
  recipients?: {
    id: number;
    channel: string;
    recipient: string;
    label: string | null;
    is_active: boolean;
  }[];
};

type NotificationLogApi = {
  id: number;
  recipient: string;
  type: string;
  status: string;
  subject: string;
  created_at?: string;
};

const formatTimestamp = (value?: string) => {
  if (!value) return '';
  return format(new Date(value), 'yyyy-MM-dd HH:mm');
};

const mapSettingsFromApi = (settings: NotificationSettingsApi): NotificationSettings => ({
  email: settings.channel_email,
  sms: settings.channel_sms,
  whatsapp: settings.channel_whatsapp,
  reminderDays: 30,
  recipients: (settings.recipients ?? []).map((recipient) => ({
    id: String(recipient.id),
    channel: recipient.channel as NotificationRecipient['channel'],
    recipient: recipient.recipient,
    label: recipient.label ?? undefined,
    isActive: recipient.is_active,
  })),
});

const mapSettingsToApi = (settings: NotificationSettings) => ({
  channel_email: settings.email,
  channel_sms: settings.sms,
  channel_whatsapp: settings.whatsapp,
  recipients: settings.recipients
    .filter((recipient) => recipient.recipient.trim().length > 0)
    .map((recipient) => ({
      id: recipient.id ? Number(recipient.id) : undefined,
      channel: recipient.channel,
      recipient: recipient.recipient.trim(),
      label: recipient.label?.trim() || null,
      is_active: recipient.isActive ?? true,
    })),
});

const mapLogFromApi = (log: NotificationLogApi): NotificationLog => ({
  id: String(log.id),
  recipient: log.recipient,
  type: log.type as NotificationLog['type'],
  status: log.status as NotificationLog['status'],
  subject: log.subject,
  timestamp: formatTimestamp(log.created_at),
});

export const fetchNotificationSettings = async () => {
  const response = await fetch('/api/notification-settings', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load notification settings.');
  }

  const data = (await response.json()) as NotificationSettingsApi;
  return mapSettingsFromApi(data);
};

export const saveNotificationSettings = async (settings: NotificationSettings) => {
  const response = await fetch('/api/notification-settings', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapSettingsToApi(settings)),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to save notification settings.';
    throw new Error(message);
  }

  const data = (await response.json()) as NotificationSettingsApi;
  return mapSettingsFromApi(data);
};

export const fetchNotificationLogs = async () => {
  const response = await fetch('/api/notification-logs', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load notification logs.');
  }

  const data = (await response.json()) as NotificationLogApi[];
  return data.map(mapLogFromApi);
};

export const sendTestNotification = async () => {
  const response = await fetch('/api/notification-logs/test', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to send test notification.';
    throw new Error(message);
  }

  const data = (await response.json()) as NotificationLogApi;
  return mapLogFromApi(data);
};
