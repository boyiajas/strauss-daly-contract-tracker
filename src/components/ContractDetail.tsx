import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  Building2,
  Calendar,
  CircleUserRound,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  UserCheck,
} from 'lucide-react';
import { Contract } from '../types';
import { fetchContract } from '../lib/contracts';
import { useToast } from '../App';
import { cn, formatCurrency } from '../lib/utils';
import { canAuthoriseContracts, getCurrentUserRole } from '../lib/auth';
import {
  contractStatusStyles,
  formatContractDate,
  formatContractDateRange,
  getContractDurationLabel,
  getDaysUntilExpiry,
} from '../lib/contract-ui';
import { approveContract } from '../lib/contracts';

const DetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-center gap-2 text-slate-500">
      <Icon size={16} />
      <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{label}</span>
    </div>
    <p className="text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

const getNotificationContacts = (values?: string[], fallback?: string) => {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  if (fallback?.trim()) {
    return [fallback.trim()];
  }

  return [];
};

export function ContractDetail() {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { showToast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const currentUserRole = getCurrentUserRole();
  const userCanAuthorise = canAuthoriseContracts(currentUserRole);

  useEffect(() => {
    if (!contractId) return;
    let isActive = true;
    setIsLoading(true);

    fetchContract(contractId)
      .then((data) => {
        if (!isActive) return;
        setContract(data);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load contract.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [contractId]);

  const daysUntilExpiry = useMemo(
    () => getDaysUntilExpiry(contract?.endDate),
    [contract?.endDate]
  );

  const expirySummary = useMemo(() => {
    if (daysUntilExpiry === null) return 'Expiry date unavailable';
    if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    if (daysUntilExpiry === 0) return 'Expires today';
    return `${daysUntilExpiry} days remaining`;
  }, [daysUntilExpiry]);

  const expiryTone =
    daysUntilExpiry === null
      ? 'bg-slate-100 text-slate-600'
      : daysUntilExpiry < 0
        ? 'bg-red-50 text-red-600'
        : daysUntilExpiry <= 30
          ? 'bg-amber-50 text-amber-700'
          : 'bg-emerald-50 text-emerald-700';
  const notificationEmails = getNotificationContacts(
    contract?.notificationEmails,
    contract?.notificationEmail
  );
  const notificationPhones = getNotificationContacts(
    contract?.notificationPhones,
    contract?.notificationPhone
  );

  const handleApproveContract = async () => {
    if (!contract) return;

    try {
      const updated = await approveContract(contract.id);
      setContract(updated);
      showToast('Contract approved and activated successfully.', 'success');
    } catch {
      showToast('Unable to approve contract right now.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600/20 border-t-blue-600" />
        </div>
      </div>
    );
  }

  if (loadError || !contract) {
    return (
      <div className="p-4 sm:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Contract Details</h2>
            <p className="text-sm text-slate-500">The selected contract could not be opened.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError ?? 'Unable to load contract.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                Contract record
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
                  contractStatusStyles[contract.status]
                )}
              >
                {contract.status}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{contract.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the agreement, key dates, and notification setup before making changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[contract.category, contract.departmentName, contract.contractType, contract.portfolio]
                .filter(Boolean)
                .map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {userCanAuthorise && contract.status === 'Pending Approval' && (
            <button
              onClick={handleApproveContract}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100"
            >
              <ShieldCheck size={18} />
              Approve Contract
            </button>
          )}
          <button
            onClick={() => showToast('Contract summary export coming soon')}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
          >
            <FileText size={18} />
            Export Summary
          </button>
          <button
            onClick={() => navigate(`/contracts/${contract.id}/edit`)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            <Edit3 size={18} />
            Edit Contract
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-6 py-8 text-white sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                <Building2 size={14} />
                {contract.partyName}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Contract term</p>
                  <p className="mt-3 text-lg font-semibold">{formatContractDateRange(contract.startDate, contract.endDate)}</p>
                  <p className="mt-2 text-sm text-blue-100/80">{getContractDurationLabel(contract.startDate, contract.endDate)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Contract value</p>
                  <p className="mt-3 text-lg font-semibold">{formatCurrency(contract.value)}</p>
                  <p className="mt-2 text-sm text-blue-100/80">
                    Last updated {formatContractDate(contract.lastModified)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-2 text-blue-100">
                  <Clock3 size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">Renewal watch</span>
                </div>
                <p className="mt-3 text-lg font-semibold">{expirySummary}</p>
                <span className={cn('mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]', expiryTone)}>
                  {contract.status}
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex items-center gap-2 text-blue-100">
                  <Bell size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">Notifications</span>
                </div>
                <p className="mt-3 text-lg font-semibold">
                  {contract.notificationDays?.length ? `${contract.notificationDays.length} reminder rules` : 'No reminders configured'}
                </p>
                <p className="mt-2 text-sm text-blue-100/80">
                  {notificationEmails.length > 0 || notificationPhones.length > 0
                    ? 'Custom channels are configured for this agreement.'
                    : 'System defaults will be used for this agreement.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-8 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Agreement Overview</h3>
                  <p className="text-sm text-slate-500">Core contract information and commercial context.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem icon={Building2} label="Counterparty" value={contract.partyName} />
                <DetailItem icon={FolderKanban} label="Department" value={contract.departmentName || 'Not assigned'} />
                <DetailItem icon={Tag} label="Category" value={contract.category} />
                <DetailItem icon={ShieldCheck} label="Type" value={contract.contractType || 'Not specified'} />
                <DetailItem icon={UserCheck} label="Assigned To" value={contract.assignedToUserName || 'No authoriser assigned'} />
                <DetailItem icon={Mail} label="Assigned Email" value={contract.assignedToUserEmail || 'No assigned email'} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Description</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {contract.description?.trim() || 'No additional contract description has been captured for this record.'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-slate-500">
                  <Tag size={16} />
                  <p className="text-xs font-bold uppercase tracking-[0.18em]">Tags</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(contract.tags?.length ? contract.tags : ['No tags assigned']).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Timeline & Governance</h3>
                  <p className="text-sm text-slate-500">Dates, durations, and lifecycle controls.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailItem icon={Calendar} label="Start Date" value={formatContractDate(contract.startDate)} />
                <DetailItem icon={Calendar} label="Review Date" value={formatContractDate(contract.reviewDate)} />
                <DetailItem icon={Calendar} label="End Date" value={formatContractDate(contract.endDate)} />
                <DetailItem icon={Clock3} label="Duration" value={getContractDurationLabel(contract.startDate, contract.endDate)} />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <CircleUserRound size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Client Address Book</h3>
                  <p className="text-sm text-slate-500">Linked client profile, address, and contact people.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem
                  icon={CircleUserRound}
                  label="Client"
                  value={
                    contract.clientName
                      ? `${contract.clientName}`
                      : contract.partyName || 'No linked client'
                  }
                />
                <DetailItem
                  icon={MapPin}
                  label="Address"
                  value={contract.client?.address?.trim() || 'No address captured'}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-slate-500">
                  <CircleUserRound size={16} />
                  <p className="text-xs font-bold uppercase tracking-[0.18em]">Client Contacts</p>
                </div>
                {contract.client?.contacts?.length ? (
                  <div className="mt-4 grid gap-3">
                    {contract.client.contacts.map((contact, index) => (
                      <div key={`${contact.name}-${contact.email ?? ''}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                        <p className="text-sm font-bold text-slate-900">{contact.name || `Contact ${index + 1}`}</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div className="flex items-start gap-2">
                            <Mail size={16} className="mt-0.5 text-slate-400" />
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Email</p>
                              <p className="mt-1 text-sm font-semibold text-slate-700">{contact.email?.trim() || 'Not captured'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone size={16} className="mt-0.5 text-slate-400" />
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Phone</p>
                              <p className="mt-1 text-sm font-semibold text-slate-700">{contact.phone?.trim() || 'Not captured'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-slate-600">No linked client contacts captured yet.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Notification Setup</h3>
                  <p className="text-sm text-slate-500">Reminder rules and delivery channels.</p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Reminder Windows</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(contract.notificationDays?.length ? [...contract.notificationDays].sort((a, b) => b - a) : []).map((days) => (
                      <span
                        key={days}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                      >
                        {days} days
                      </span>
                    ))}
                    {!contract.notificationDays?.length && (
                      <span className="text-sm text-slate-500">No reminders configured.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Notification Emails</p>
                    {notificationEmails.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {notificationEmails.map((email) => (
                          <span
                            key={email}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-900"
                          >
                            {email}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-slate-900">Using system default email routing</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Notification Phones</p>
                    {notificationPhones.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {notificationPhones.map((phone) => (
                          <span
                            key={phone}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-900"
                          >
                            {phone}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-slate-900">Using system default phone routing</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Record Metadata</h3>
                  <p className="text-sm text-slate-500">System references and document attributes.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <DetailItem icon={FileText} label="Contract ID" value={`#${contract.id}`} />
                <DetailItem icon={Clock3} label="Last Modified" value={formatContractDate(contract.lastModified)} />
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-500">
                    <FileText size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Attached File</span>
                  </div>
                  {contract.documents?.length ? (
                    <div className="space-y-2">
                      {contract.documents.map((document) => (
                        <a
                          key={document.path}
                          href={`/api/contracts/${contract.id}/document?path=${encodeURIComponent(document.path)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {document.name}
                          <ExternalLink size={16} />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">No document linked yet</p>
                  )}
                </div>
                <DetailItem icon={Tag} label="Portfolio" value={contract.portfolio || 'Not specified'} />
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
