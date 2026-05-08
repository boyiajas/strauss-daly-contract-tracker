import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2,
  FileText, 
  Upload, 
  Bell, 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Contract, Department } from '../types';
import { useToast } from '../App';
import { createContract, fetchContract, updateContract } from '../lib/contracts';
import { fetchDepartments } from '../lib/departments';
import {
  categoryOptions,
  contractTypeOptions,
  defaultAlertDays,
  portfolioOptions,
} from '../lib/contract-ui';

const ensureContactInputs = (values?: string[], fallback?: string) => {
  if (values && values.length > 0) {
    return values.map((value) => value ?? '');
  }

  if (fallback?.trim()) {
    return [fallback.trim()];
  }

  return [''];
};

export function NewContract() {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { showToast } = useToast();
  const isEditing = Boolean(contractId);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [departmentLoadError, setDepartmentLoadError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    title: '',
    partyName: '',
    departmentId: '',
    contractType: '',
    portfolio: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'Draft',
    category: '',
    description: '',
    tags: [],
    notificationDays: [90, 60, 30],
    notificationEmails: [''],
    notificationPhones: [''],
  });

  const alertDeadlineOptions = Array.from(
    new Set([...(newContract.notificationDays ?? []), ...defaultAlertDays])
  ).sort((a, b) => b - a);

  useEffect(() => {
    let isActive = true;
    fetchDepartments()
      .then((data) => {
        if (!isActive) return;
        setDepartments(data);
        setDepartmentLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setDepartmentLoadError('Unable to load departments.');
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditing || !contractId) return;
    let isActive = true;
    setIsLoading(true);
    fetchContract(contractId)
      .then((contract) => {
        if (!isActive) return;
        const notificationEmails = ensureContactInputs(
          contract.notificationEmails,
          contract.notificationEmail
        );
        const notificationPhones = ensureContactInputs(
          contract.notificationPhones,
          contract.notificationPhone
        );

        setNewContract({
          ...contract,
          notificationDays:
            contract.notificationDays && contract.notificationDays.length > 0
              ? contract.notificationDays
              : [90, 60, 30],
          notificationEmails,
          notificationPhones,
          notificationEmail: notificationEmails.find((value) => value.trim()) || undefined,
          notificationPhone: notificationPhones.find((value) => value.trim()) || undefined,
        });
        setTagsInput((contract.tags ?? []).join(', '));
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
  }, [isEditing, contractId]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (isSaving) return;

    const missingFields = [
      !newContract.title?.trim() ? 'title' : null,
      !newContract.partyName?.trim() ? 'counterparty' : null,
      !newContract.departmentId ? 'department' : null,
      !newContract.contractType ? 'type' : null,
      !newContract.portfolio ? 'portfolio' : null,
      !newContract.startDate ? 'start date' : null,
      !newContract.category ? 'category' : null,
      !newContract.status ? 'status' : null,
      newContract.value === undefined || newContract.value === null || String(newContract.value) === ''
        ? 'value'
        : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      showToast(`Complete all required contract fields before saving: ${missingFields.join(', ')}.`, 'error');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && contractId) {
        await updateContract(contractId, newContract);
        showToast('Contract updated successfully!', 'success');
      } else {
        await createContract(newContract);
        showToast('Contract created successfully!', 'success');
      }
      navigate('/contracts');
    } catch (error) {
      showToast(`Unable to ${isEditing ? 'update' : 'create'} contract. Please try again.`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = () => {
    showToast('File upload dialog opened');
  };

  const handleAddDeadline = () => {
    const days = Number(customDeadline);
    if (!Number.isInteger(days) || days <= 0) {
      showToast('Enter a valid number of days greater than zero.', 'error');
      return;
    }

    if (newContract.notificationDays?.includes(days)) {
      showToast('That alert deadline already exists.', 'error');
      return;
    }

    setNewContract((prev) => ({
      ...prev,
      notificationDays: Array.from(new Set([...(prev.notificationDays ?? []), days])).sort((a, b) => b - a),
    }));
    setCustomDeadline('');
    setIsAddingDeadline(false);
  };

  const handleRemoveDeadline = (days: number) => {
    setNewContract((prev) => ({
      ...prev,
      notificationDays: (prev.notificationDays ?? []).filter((day) => day !== days),
    }));
  };

  const handleNotificationEmailChange = (index: number, value: string) => {
    setNewContract((prev) => {
      const notificationEmails = [...ensureContactInputs(prev.notificationEmails, prev.notificationEmail)];
      notificationEmails[index] = value;
      return {
        ...prev,
        notificationEmails,
        notificationEmail: notificationEmails.find((item) => item.trim()) || undefined,
      };
    });
  };

  const handleAddNotificationEmail = () => {
    setNewContract((prev) => ({
      ...prev,
      notificationEmails: [...ensureContactInputs(prev.notificationEmails, prev.notificationEmail), ''],
    }));
  };

  const handleRemoveNotificationEmail = (index: number) => {
    setNewContract((prev) => {
      const current = [...ensureContactInputs(prev.notificationEmails, prev.notificationEmail)];
      const notificationEmails = current.filter((_, itemIndex) => itemIndex !== index);
      const nextEmails = notificationEmails.length > 0 ? notificationEmails : [''];
      return {
        ...prev,
        notificationEmails: nextEmails,
        notificationEmail: nextEmails.find((item) => item.trim()) || undefined,
      };
    });
  };

  const handleNotificationPhoneChange = (index: number, value: string) => {
    setNewContract((prev) => {
      const notificationPhones = [...ensureContactInputs(prev.notificationPhones, prev.notificationPhone)];
      notificationPhones[index] = value;
      return {
        ...prev,
        notificationPhones,
        notificationPhone: notificationPhones.find((item) => item.trim()) || undefined,
      };
    });
  };

  const handleAddNotificationPhone = () => {
    setNewContract((prev) => ({
      ...prev,
      notificationPhones: [...ensureContactInputs(prev.notificationPhones, prev.notificationPhone), ''],
    }));
  };

  const handleRemoveNotificationPhone = (index: number) => {
    setNewContract((prev) => {
      const current = [...ensureContactInputs(prev.notificationPhones, prev.notificationPhone)];
      const notificationPhones = current.filter((_, itemIndex) => itemIndex !== index);
      const nextPhones = notificationPhones.length > 0 ? notificationPhones : [''];
      return {
        ...prev,
        notificationPhones: nextPhones,
        notificationPhone: nextPhones.find((item) => item.trim()) || undefined,
      };
    });
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/contracts')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{isEditing ? 'Edit Contract' : 'New Contract'}</h2>
            <p className="text-slate-500 text-sm mt-1">
              {isEditing ? 'Update the agreement record, renewal controls, and notification rules.' : 'Register a new agreement and set up alerts.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/contracts')}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditing ? 'Save Changes' : 'Save'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {loadError}
        </div>
      )}
      {departmentLoadError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {departmentLoadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
        <div className="xl:col-span-2 space-y-8">
          {/* Core Details Section */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Core Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contract Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Master Services Agreement"
                  value={newContract.title}
                  onChange={e => setNewContract({...newContract, title: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Client &amp; Supplies</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Acme Corp"
                  value={newContract.partyName}
                  onChange={e => setNewContract({...newContract, partyName: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    required
                    className="w-full appearance-none pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={newContract.departmentId ?? ''}
                    onChange={e => setNewContract({ ...newContract, departmentId: e.target.value })}
                    disabled={isLoading || departments.length === 0}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.contractType ?? ''}
                  onChange={e => setNewContract({ ...newContract, contractType: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="">Select contract type</option>
                  {contractTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.category ?? ''}
                  onChange={e => setNewContract({ ...newContract, category: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Portfolio</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.portfolio ?? ''}
                  onChange={e => setNewContract({ ...newContract, portfolio: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="">Select portfolio</option>
                  {portfolioOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.status}
                  onChange={e => setNewContract({...newContract, status: e.target.value as any})}
                  disabled={isLoading}
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Value</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="0.00"
                  value={newContract.value}
                  onChange={e => setNewContract({...newContract, value: Number(e.target.value)})}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Start Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.startDate}
                  onChange={e => setNewContract({...newContract, startDate: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">End Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.endDate || ''}
                  onChange={e => setNewContract({...newContract, endDate: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Contract details..."
                  value={newContract.description || ''}
                  onChange={e => setNewContract({...newContract, description: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tags</label>
                  <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Comma separated tags (e.g. nda, software, priority)"
                  value={tagsInput}
                  onChange={e => {
                    const value = e.target.value;
                    setTagsInput(value);
                    const tags = value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    setNewContract({ ...newContract, tags });
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Upload Section */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Upload size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Contract Document</h3>
            </div>
            
            <div 
              onClick={handleFileUpload}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-slate-900">Click to upload</p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOCX or PNG (max. 10MB)</p>
              <input type="file" className="hidden" />
            </div>
          </section>

          {/* Notifications Section */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Bell size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Notifications</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alert Deadlines</label>
                <div className="space-y-2">
                  {alertDeadlineOptions.map((days) => {
                    const label = `${days} ${days === 1 ? 'Day' : 'Days'} Before Expiry`;
                    const isChecked = newContract.notificationDays?.includes(days) ?? false;
                    const isCustomDeadline = !defaultAlertDays.includes(days);
                    return (
                      <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl group hover:bg-white hover:border-blue-200 transition-all">
                        <label className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(event) => {
                              const next = event.target.checked;
                              setNewContract((prev) => {
                                const current = prev.notificationDays ?? [];
                                const updated = next
                                  ? Array.from(new Set([...current, days])).sort((a, b) => b - a)
                                  : current.filter((day) => day !== days);
                                return { ...prev, notificationDays: updated };
                              });
                            }}
                            disabled={isLoading}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                          />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
                        </label>
                        {isCustomDeadline && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDeadline(days)}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            aria-label={`Remove ${label}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isAddingDeadline && (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customDeadline}
                      onChange={(event) => setCustomDeadline(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddDeadline();
                        }
                      }}
                      placeholder="Days before expiry"
                      disabled={isLoading}
                      className="min-w-0 flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddDeadline}
                      disabled={isLoading}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDeadline('');
                        setIsAddingDeadline(false);
                      }}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2.5 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                      aria-label="Cancel deadline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddingDeadline(true)}
                  disabled={isLoading || isAddingDeadline}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add Deadline
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notification Email</label>
                  <div className="space-y-3">
                    {ensureContactInputs(newContract.notificationEmails, newContract.notificationEmail).map((email, index) => (
                      <div key={`notification-email-${index}`} className="flex items-center gap-3">
                        <input
                          type="email"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="Leave blank to use default"
                          value={email}
                          onChange={(event) => handleNotificationEmailChange(index, event.target.value)}
                          disabled={isLoading}
                        />
                        {ensureContactInputs(newContract.notificationEmails, newContract.notificationEmail).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNotificationEmail(index)}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2.5 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                            aria-label={`Remove notification email ${index + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddNotificationEmail}
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Add More Email
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notification Phone</label>
                  <div className="space-y-3">
                    {ensureContactInputs(newContract.notificationPhones, newContract.notificationPhone).map((phone, index) => (
                      <div key={`notification-phone-${index}`} className="flex items-center gap-3">
                        <input
                          type="tel"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="Leave blank to use default"
                          value={phone}
                          onChange={(event) => handleNotificationPhoneChange(index, event.target.value)}
                          disabled={isLoading}
                        />
                        {ensureContactInputs(newContract.notificationPhones, newContract.notificationPhone).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNotificationPhone(index)}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2.5 text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                            aria-label={`Remove notification phone ${index + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddNotificationPhone}
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Add More Phone
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => navigate('/contracts')}
              className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-base font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-base font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isEditing ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
