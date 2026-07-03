export type ContractStatus = 'Active' | 'Draft' | 'Expired' | 'Terminated' | 'Pending Approval';

export interface Client {
  id: string;
  title?: string;
  name: string;
  address?: string;
  contacts?: ClientContact[];
  contractCount?: number;
}

export interface ContractDocument {
  name: string;
  path: string;
}

export interface ClientContact {
  name: string;
  email?: string;
  phone?: string;
}

export interface Contract {
  id: string;
  title: string;
  partyName: string;
  clientId?: string;
  clientName?: string;
  client?: Client;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedToUserEmail?: string;
  departmentId?: string;
  departmentName?: string;
  contractType?: string;
  portfolio?: string;
  startDate: string;
  reviewDate?: string;
  endDate?: string;
  value: number;
  status: ContractStatus;
  category: string;
  lastModified: string;
  description?: string;
  tags?: string[];
  notificationEmail?: string;
  notificationPhone?: string;
  notificationEmails?: string[];
  notificationPhones?: string[];
  notificationDays?: number[];
  documents?: ContractDocument[];
  fileName?: string;
  filePath?: string;
}

export type UserRole = 'Admin' | 'Authoriser' | 'Manager' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive';
}

export interface Department {
  id: string;
  name: string;
}

export type NotificationChannel = 'Email' | 'SMS' | 'WhatsApp';

export interface NotificationRecipient {
  id?: string;
  channel: NotificationChannel;
  recipient: string;
  label?: string;
  isActive?: boolean;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  reminderDays: number;
  recipients: NotificationRecipient[];
}

export interface NotificationLog {
  id: string;
  recipient: string;
  type: 'Email' | 'SMS' | 'WhatsApp';
  status: 'Sent' | 'Failed' | 'Pending';
  timestamp: string;
  subject: string;
}

export interface SystemSettings {
  companyName: string;
  timezone: string;
  currency: string;
  notifications: NotificationSettings;
}
