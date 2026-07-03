import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Edit2, ExternalLink, MoreVertical, Plus, Search, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient, deleteClient, fetchClients, updateClient } from '../lib/clients';
import { fetchContracts } from '../lib/contracts';
import { useToast } from '../App';
import { Client, Contract } from '../types';
import { formatCurrency } from '../lib/utils';

type ClientModalState = {
  mode: 'create' | 'edit';
  client?: Client;
};

type ClientSummary = {
  id: string;
  name: string;
  contractCount: number;
  activeCount: number;
  totalValue: number;
  latestReviewDate?: string;
};

const getLatestDate = (current?: string, incoming?: string) => {
  if (!incoming) return current;
  if (!current) return incoming;
  return incoming > current ? incoming : current;
};

export function ClientManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<ClientModalState | null>(null);
  const [clientForm, setClientForm] = useState<Partial<Client>>({ title: 'Mr', name: '', address: '', contacts: [{ name: '', email: '', phone: '' }] });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientData, contractData] = await Promise.all([fetchClients(), fetchContracts()]);
      setClients(clientData);
      setContracts(contractData);
      setLoadError(null);
    } catch {
      setLoadError('Unable to load clients.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const clientSummaries = useMemo(() => {
    return clients
      .map<ClientSummary>((client) => {
        const linkedContracts = contracts.filter(
          (contract) => contract.clientId === client.id || (!contract.clientId && contract.partyName === client.name)
        );

        return {
          id: client.id,
          name: client.name,
          contractCount: linkedContracts.length,
          activeCount: linkedContracts.filter((contract) => contract.status === 'Active').length,
          totalValue: linkedContracts.reduce((sum, contract) => sum + (Number(contract.value) || 0), 0),
          latestReviewDate: linkedContracts.reduce<string | undefined>(
            (latest, contract) => getLatestDate(latest, contract.reviewDate),
            undefined
          ),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, contracts]);

  const filteredClients = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return clientSummaries;
    return clientSummaries.filter((client) => client.name.toLowerCase().includes(normalized));
  }, [clientSummaries, searchQuery]);

  const tableMessage = isLoading
    ? 'Loading clients...'
    : loadError
      ? loadError
      : filteredClients.length === 0
        ? searchQuery
          ? 'No clients match your search.'
          : 'No clients available yet.'
        : null;

  const openCreateModal = () => {
    setClientForm({ title: 'Mr', name: '', address: '', contacts: [{ name: '', email: '', phone: '' }] });
    setModalState({ mode: 'create' });
  };

  const openEditModal = (client: Client) => {
    setClientForm({
      title: client.title ?? 'Mr',
      name: client.name,
      address: client.address ?? '',
      contacts: client.contacts && client.contacts.length > 0 ? client.contacts : [{ name: '', email: '', phone: '' }],
    });
    setModalState({ mode: 'edit', client });
  };

  const handleSaveClient = async () => {
    const name = clientForm.name?.trim() ?? '';
    const contacts = (clientForm.contacts ?? []).filter((contact) => contact.name?.trim() || contact.email?.trim() || contact.phone?.trim());
    if (!name) {
      showToast('Enter a client name before saving.', 'error');
      return;
    }

    setIsSavingClient(true);
    try {
      if (modalState?.mode === 'edit' && modalState.client) {
        await updateClient(modalState.client.id, { ...clientForm, name, contacts });
        showToast('Client updated successfully.', 'success');
      } else {
        await createClient({ ...clientForm, name, contacts });
        showToast('Client created successfully.', 'success');
      }
      setModalState(null);
      setClientForm({ title: 'Mr', name: '', address: '', contacts: [{ name: '', email: '', phone: '' }] });
      await loadData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save client.', 'error');
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDeleteClient = async (client: ClientSummary) => {
    if (client.contractCount > 0) {
      showToast('This client cannot be deleted while contracts are still linked to it.', 'error');
      return;
    }

    setDeletingClientId(client.id);
    try {
      await deleteClient(client.id);
      setClients((prev) => prev.filter((item) => item.id !== client.id));
      showToast('Client deleted successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to delete client.', 'error');
    } finally {
      setDeletingClientId(null);
      setActiveMenu(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="text-slate-500 text-sm">Manage client records and review the contracts linked to each client.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          New Client
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contracts</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Active</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Latest Review Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableMessage ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    {tableMessage}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 size={20} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{client.contractCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{client.activeCount}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(client.totalValue)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.latestReviewDate || 'Not set'}</td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/contracts?search=${encodeURIComponent(client.name)}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMenu(activeMenu === client.id ? null : client.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      {activeMenu === client.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-6 top-14 z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                            <button
                              onClick={() => {
                                openEditModal({ id: client.id, name: client.name });
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left"
                            >
                              <Edit2 size={16} /> Edit Client
                            </button>
                            <div className="h-px bg-slate-100 my-1" />
                            <button
                              onClick={() => handleDeleteClient(client)}
                              disabled={client.contractCount > 0 || deletingClientId === client.id}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalState && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">
                {modalState.mode === 'edit' ? 'Edit Client' : 'New Client'}
              </h3>
                  <button
                    type="button"
                    onClick={() => setModalState(null)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-4 px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title</label>
                      <select
                        value={clientForm.title ?? 'Mr'}
                        onChange={(event) => setClientForm((prev) => ({ ...prev, title: event.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Client Name</label>
                      <input
                        type="text"
                        value={clientForm.name ?? ''}
                        onChange={(event) => setClientForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address</label>
                    <textarea
                      rows={3}
                      value={clientForm.address ?? ''}
                      onChange={(event) => setClientForm((prev) => ({ ...prev, address: event.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="Street, suburb, city, postal code"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact Details</label>
                      <button
                        type="button"
                        onClick={() => setClientForm((prev) => ({
                          ...prev,
                          contacts: [...(prev.contacts ?? []), { name: '', email: '', phone: '' }],
                        }))}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        + Add Contact
                      </button>
                    </div>
                    {(clientForm.contacts ?? []).map((contact, index) => (
                      <div key={`contact-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact {index + 1}</p>
                          {(clientForm.contacts ?? []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => setClientForm((prev) => ({
                                ...prev,
                                contacts: (prev.contacts ?? []).filter((_, itemIndex) => itemIndex !== index),
                              }))}
                              className="text-xs font-bold text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={contact.name ?? ''}
                          onChange={(event) => setClientForm((prev) => ({
                            ...prev,
                            contacts: (prev.contacts ?? []).map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: event.target.value } : item
                            ),
                          }))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          placeholder="Contact person name"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="email"
                            value={contact.email ?? ''}
                            onChange={(event) => setClientForm((prev) => ({
                              ...prev,
                              contacts: (prev.contacts ?? []).map((item, itemIndex) =>
                                itemIndex === index ? { ...item, email: event.target.value } : item
                              ),
                            }))}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="contact@example.com"
                          />
                          <input
                            type="text"
                            value={contact.phone ?? ''}
                            onChange={(event) => setClientForm((prev) => ({
                              ...prev,
                              contacts: (prev.contacts ?? []).map((item, itemIndex) =>
                                itemIndex === index ? { ...item, phone: event.target.value } : item
                              ),
                            }))}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="+27 82 000 0000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setModalState(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClient}
                    disabled={isSavingClient}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingClient ? 'Saving...' : modalState.mode === 'edit' ? 'Save Changes' : 'Create Client'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
