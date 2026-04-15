export type ContractStatus = 'Active' | 'Draft' | 'Expired' | 'Terminated' | 'Pending Approval';

export interface Contract {
  id: string;
  title: string;
  partyName: string;
  departmentId?: string;
  departmentName?: string;
  startDate: string;
  endDate: string;
  value: number;
  status: ContractStatus;
  category: 'Service' | 'Employment' | 'Vendor' | 'Lease' | 'Other';
  lastModified: string;
  description?: string;
  tags?: string[];
  notificationEmail?: string;
  notificationPhone?: string;
  notificationDays?: number[];
  fileName?: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Viewer';

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
