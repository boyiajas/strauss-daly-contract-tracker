import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2,
  CircleUserRound,
  Mail,
  MapPin,
  FileText, 
  Upload, 
  Bell, 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  X
} from 'lucide-react';
import { Client, Contract, Department, User } from '../types';
import { useToast } from '../App';
import { createContract, fetchContract, updateContract } from '../lib/contracts';
import { fetchClients, updateClient } from '../lib/clients';
import { fetchDepartments } from '../lib/departments';
import { fetchUsers } from '../lib/users';
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
  const [clientLoadError, setClientLoadError] = useState<string | null>(null);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [authorisers, setAuthorisers] = useState<User[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removedDocumentPaths, setRemovedDocumentPaths] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [isSavingClientDetails, setIsSavingClientDetails] = useState(false);
  const [clientDetailsForm, setClientDetailsForm] = useState<Partial<Client>>({
    title: 'Mr',
    name: '',
    address: '',
    contacts: [{ name: '', email: '', phone: '' }],
  });
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    title: '',
    partyName: '',
    departmentId: '',
    contractType: '',
    portfolio: '',
    startDate: '',
    reviewDate: '',
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
  const selectedClient = clients.find((client) => client.id === newContract.clientId);

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

    fetchClients()
      .then((data) => {
        if (!isActive) return;
        setClients(data);
        setClientLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setClientLoadError('Unable to load clients.');
      });

    fetchUsers()
      .then((data) => {
        if (!isActive) return;
        setAuthorisers(
          data.filter((user) => user.role === 'Authoriser' && user.status === 'Active')
        );
        setUserLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setUserLoadError('Unable to load authorisers.');
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

  useEffect(() => {
    if (newContract.clientId || !newContract.partyName || clients.length === 0) return;
    const matchedClient = clients.find((client) => client.name === newContract.partyName);
    if (!matchedClient) return;

    setNewContract((prev) => ({
      ...prev,
      clientId: matchedClient.id,
      clientName: matchedClient.name,
    }));
  }, [clients, newContract.clientId, newContract.partyName]);

  useEffect(() => {
    if (!selectedClient) {
      setClientDetailsForm({
        title: 'Mr',
        name: '',
        address: '',
        contacts: [{ name: '', email: '', phone: '' }],
      });
      return;
    }

    setClientDetailsForm({
      title: selectedClient.title ?? 'Mr',
      name: selectedClient.name,
      address: selectedClient.address ?? '',
      contacts:
        selectedClient.contacts && selectedClient.contacts.length > 0
          ? selectedClient.contacts.map((contact) => ({
              name: contact.name ?? '',
              email: contact.email ?? '',
              phone: contact.phone ?? '',
            }))
          : [{ name: '', email: '', phone: '' }],
    });
  }, [selectedClient]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (isSaving) return;

    const missingFields = [
      !newContract.title?.trim() ? 'title' : null,
      !newContract.clientId ? 'client' : null,
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
      const contractPayload: Partial<Contract> = {
        ...newContract,
        status: 'Pending Approval',
      };

      if (isEditing && contractId) {
        await updateContract(contractId, contractPayload, selectedFiles, removedDocumentPaths);
        showToast('Contract updated and submitted for approval.', 'success');
      } else {
        await createContract(contractPayload, selectedFiles, removedDocumentPaths);
        showToast('Contract created and submitted for approval.', 'success');
      }
      navigate('/contracts');
    } catch (error) {
      showToast(`Unable to ${isEditing ? 'update' : 'create'} contract. Please try again.`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
    ];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showToast('Upload PDF, DOC, DOCX, or PNG files only.', 'error');
        event.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast('Each document must be 10MB or smaller.', 'error');
        event.target.value = '';
        return;
      }
    }

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const deduped = files.filter((file) => !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`));
      return [...prev, ...deduped];
    });
    showToast(`${files.length} document${files.length === 1 ? '' : 's'} selected for upload.`, 'success');
    event.target.value = '';
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    showToast('Selected document removed.', 'success');
  };

  const handleRemoveExistingDocument = (path: string) => {
    setRemovedDocumentPaths((prev) => (prev.includes(path) ? prev : [...prev, path]));
    setNewContract((prev) => ({
      ...prev,
      documents: (prev.documents ?? []).filter((document) => document.path !== path),
      fileName: prev.filePath === path ? undefined : prev.fileName,
      filePath: prev.filePath === path ? undefined : prev.filePath,
    }));
    showToast('Attached document removed from this draft.', 'success');
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

  const handleClientContactChange = (
    index: number,
    field: 'name' | 'email' | 'phone',
    value: string
  ) => {
    setClientDetailsForm((prev) => {
      const contacts = [...(prev.contacts ?? [{ name: '', email: '', phone: '' }])];
      const current = contacts[index] ?? { name: '', email: '', phone: '' };
      contacts[index] = { ...current, [field]: value };
      return { ...prev, contacts };
    });
  };

  const handleAddClientContact = () => {
    setClientDetailsForm((prev) => ({
      ...prev,
      contacts: [...(prev.contacts ?? []), { name: '', email: '', phone: '' }],
    }));
  };

  const handleRemoveClientContact = (index: number) => {
    setClientDetailsForm((prev) => {
      const contacts = (prev.contacts ?? []).filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        contacts: contacts.length > 0 ? contacts : [{ name: '', email: '', phone: '' }],
      };
    });
  };

  const handleSaveClientDetails = async () => {
    if (!selectedClient) return;

    const name = clientDetailsForm.name?.trim() ?? '';
    if (!name) {
      showToast('Enter the client name before saving.', 'error');
      return;
    }

    const contacts = (clientDetailsForm.contacts ?? [])
      .map((contact) => ({
        name: contact.name?.trim() ?? '',
        email: contact.email?.trim() || undefined,
        phone: contact.phone?.trim() || undefined,
      }))
      .filter((contact) => contact.name || contact.email || contact.phone);

    setIsSavingClientDetails(true);
    try {
      const updatedClient = await updateClient(selectedClient.id, {
        title: clientDetailsForm.title ?? 'Mr',
        name,
        address: clientDetailsForm.address?.trim() ?? '',
        contacts,
      });

      setClients((prev) =>
        prev.map((client) => (client.id === updatedClient.id ? updatedClient : client))
      );
      setNewContract((prev) => ({
        ...prev,
        clientId: updatedClient.id,
        clientName: updatedClient.name,
        partyName: updatedClient.name,
      }));
      showToast('Client contact details updated successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update client details.', 'error');
    } finally {
      setIsSavingClientDetails(false);
    }
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
      {clientLoadError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {clientLoadError}
        </div>
      )}
      {userLoadError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {userLoadError}
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Client</label>
                <div className="space-y-3">
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={newContract.clientId ?? ''}
                    onChange={e => {
                      const nextClient = clients.find((client) => client.id === e.target.value);
                      setNewContract({
                        ...newContract,
                        clientId: e.target.value,
                        clientName: nextClient?.name,
                        partyName: nextClient?.name ?? '',
                      });
                    }}
                    disabled={isLoading || clients.length === 0}
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.title ? `${client.title} ` : ''}{client.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsClientDetailsOpen(true)}
                    disabled={!selectedClient}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CircleUserRound size={16} />
                    View Client Contact Details
                  </button>
                </div>
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assign To</label>
                <div className="space-y-2">
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      className="w-full appearance-none pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={newContract.assignedToUserId ?? ''}
                      onChange={(e) => {
                        const assignee = authorisers.find((user) => user.id === e.target.value);
                        setNewContract({
                          ...newContract,
                          assignedToUserId: e.target.value || undefined,
                          assignedToUserName: assignee?.name,
                          assignedToUserEmail: assignee?.email,
                        });
                      }}
                      disabled={isLoading || authorisers.length === 0}
                    >
                      <option value="">Select authoriser</option>
                      {authorisers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    The assigned authoriser is treated as the responsible owner and is included in contract email notifications.
                  </p>
                </div>
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
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  New or updated contracts are routed for approval before they become active.
                </p>
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Review Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.reviewDate || ''}
                  onChange={e => setNewContract({...newContract, reviewDate: e.target.value})}
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
              <p className="text-sm font-bold text-slate-900">
                {selectedFiles.length > 0 || newContract.documents?.length ? 'Add or replace contract documents' : 'Click to upload'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX or PNG (max. 10MB)</p>
              <p className="text-xs font-semibold text-blue-600 mt-3">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} new document${selectedFiles.length === 1 ? '' : 's'} selected`
                  : newContract.documents?.length
                    ? `${newContract.documents.length} existing document${newContract.documents.length === 1 ? '' : 's'} attached`
                    : 'No document selected yet'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png"
                multiple
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>
            <div className="space-y-3">
              {(newContract.documents ?? []).map((document) => (
                <div
                  key={document.path}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-slate-700">{document.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingDocument(document.path)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2.5 text-red-500 transition-colors hover:bg-red-100"
                    aria-label={`Remove ${document.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-blue-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedFile(index)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2.5 text-red-500 transition-colors hover:bg-red-100"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {selectedFiles.length === 0 && !(newContract.documents?.length) && (
                <p className="text-xs text-slate-500">No documents selected yet.</p>
              )}
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

      {isClientDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
          <div className="flex min-h-full items-start justify-center pt-8 sm:pt-12">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Client Contact Details</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Linked address-book details for this contract counterparty.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClientDetailsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close client details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Client Name</p>
                  <input
                    type="text"
                    value={clientDetailsForm.name ?? ''}
                    onChange={(event) => setClientDetailsForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Client name"
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-slate-500">
                    <MapPin size={16} />
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Address</p>
                  </div>
                  <textarea
                    rows={4}
                    value={clientDetailsForm.address ?? ''}
                    onChange={(event) => setClientDetailsForm((prev) => ({ ...prev, address: event.target.value }))}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Client address"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={16} />
                  <p className="text-xs font-bold uppercase tracking-[0.18em]">Contact People</p>
                </div>
                {(clientDetailsForm.contacts ?? []).length > 0 ? (
                  <div className="grid gap-3">
                    {(clientDetailsForm.contacts ?? []).map((contact, index) => (
                      <div key={`client-contact-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-bold text-slate-900">Contact {index + 1}</p>
                          {(clientDetailsForm.contacts ?? []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveClientContact(index)}
                              className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                              aria-label={`Remove contact ${index + 1}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div className="md:col-span-1">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Contact Person</p>
                            <input
                              type="text"
                              value={contact.name ?? ''}
                              onChange={(event) => handleClientContactChange(index, 'name', event.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Email</p>
                            <input
                              type="email"
                              value={contact.email ?? ''}
                              onChange={(event) => handleClientContactChange(index, 'email', event.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Phone</p>
                            <input
                              type="tel"
                              value={contact.phone ?? ''}
                              onChange={(event) => handleClientContactChange(index, 'phone', event.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Phone number"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm font-semibold text-slate-600">
                    No linked client contacts have been captured yet. Update them from the Clients address book.
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddClientContact}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50/50"
                >
                  <Plus size={16} />
                  Add Contact
                </button>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientDetailsOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveClientDetails}
                  disabled={isSavingClientDetails}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSavingClientDetails ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Client Details
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
