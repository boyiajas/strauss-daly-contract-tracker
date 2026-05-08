import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  isValid,
  parseISO,
} from 'date-fns';
import type { ContractStatus } from '../types';

export const contractStatusStyles: Record<ContractStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Draft: 'bg-slate-50 text-slate-700 border-slate-100',
  Expired: 'bg-red-50 text-red-700 border-red-100',
  Terminated: 'bg-slate-900 text-white border-slate-800',
  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-100',
};

export const contractTypeOptions = [
  'Service Level Contract',
  'Addendum',
  'Master Agreement',
  'Framework Agreement',
  'Statement of Work',
  'Consultancy Agreement',
  'Retainer Agreement',
  'Lease Agreement',
  'Settlement Agreement',
  'Outsourcing Agreement',
  'Mandate Letter',
  'Non-Disclosure Agreement',
  'Other',
];

export const categoryOptions = [
  'Debt Collection',
  'Conveyancing',
  'Pre-Legal',
  'Commercial',
  'Public Sector',
  'Litigation',
  'Compliance',
  'Insolvency & Restructuring',
  'Property',
  'Employment',
  'Corporate Services',
  'Other',
];

export const portfolioOptions = [
  'VAF',
  'Foreclosures',
  'Debt Review',
  'Unsecured',
  'Bonds',
  'Transfers',
  'Estates',
  'Collections',
  'Recoveries',
  'Litigation',
  'Property',
  'Municipal',
  'Commercial',
  'Public Sector',
  'Other',
];

export const defaultAlertDays = [90, 60, 30];

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const formatContractDate = (value?: string | null) => {
  if (!value) return 'Not set';
  const parsed = parseDate(value);
  return parsed ? format(parsed, 'dd MMM yyyy') : value;
};

export const formatContractDateRange = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate && !endDate) return 'Dates not set';
  if (startDate && !endDate) {
    const start = parseDate(startDate);
    return start ? `From ${format(start, 'dd MMM yyyy')}` : `From ${startDate}`;
  }
  if (!startDate && endDate) {
    const end = parseDate(endDate);
    return end ? `Until ${format(end, 'dd MMM yyyy')}` : `Until ${endDate}`;
  }
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) {
    return `${startDate} — ${endDate}`;
  }
  return `${format(start, 'dd MMM yyyy')} — ${format(end, 'dd MMM yyyy')}`;
};

export const getDaysUntilExpiry = (endDate?: string | null, referenceDate = new Date()) => {
  const parsedEndDate = parseDate(endDate);
  if (!parsedEndDate) return null;
  return differenceInCalendarDays(parsedEndDate, referenceDate);
};

export const getContractDurationLabel = (startDate?: string | null, endDate?: string | null) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start) return 'Duration unavailable';
  if (!end) return 'Open-ended';

  const totalDays = Math.max(differenceInCalendarDays(end, start), 0);
  if (totalDays <= 31) {
    return `${Math.max(totalDays, 1)} day term`;
  }

  const totalMonths = Math.max(differenceInCalendarMonths(end, start), 1);
  if (totalMonths < 12) {
    return `${totalMonths} month term`;
  }

  const years = totalMonths / 12;
  return `${Number.isInteger(years) ? years : years.toFixed(1)} year term`;
};
