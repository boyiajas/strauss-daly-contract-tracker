import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookUser, Building2, Edit2, Mail, Phone, Plus, Search, Trash2, X } from 'lucide-react';
import { fetchClients, updateClient } from '../lib/clients';
import { useToast } from '../App';
import { Client, ClientContact } from '../types';

type AddressBookEntry = {
  id: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  contactIndex: number;
  contact: ClientContact;
};

type ContactModalState = {
  mode: 'create' | 'edit';
  clientId: string;
  contactIndex?: number;
};

export function AddressBook() {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<ContactModalState | null>(null);
  const [contactForm, setContactForm] = useState<ClientContact>({ name: '', email: '', phone: '' });
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchClients();
      setClients(data);
      setLoadError(null);
    } catch {
      setLoadError('Unable to load address book.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const entries = useMemo<AddressBookEntry[]>(() => {
    return clients.flatMap((client) =>
      (client.contacts ?? []).map((contact, index) => ({
        id: `${client.id}-${index}`,
        clientId: client.id,
        clientName: client.name,
        clientAddress: client.address,
        contactIndex: index,
        contact,
      }))
    );
  }, [clients]);

  const filteredEntries = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return entries;

    return entries.filter((entry) =>
      [
        entry.contact.name,
        entry.contact.email ?? '',
        entry.contact.phone ?? '',
        entry.clientName,
        entry.clientAddress ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [entries, searchQuery]);

  const openCreateModal = () => {
    setSelectedClientId(clients[0]?.id ?? '');
    setContactForm({ name: '', email: '', phone: '' });
    setModalState({ mode: 'create', clientId: clients[0]?.id ?? '' });
  };

  const openEditModal = (entry: AddressBookEntry) => {
    setSelectedClientId(entry.clientId);
    setContactForm({
      name: entry.contact.name ?? '',
      email: entry.contact.email ?? '',
      phone: entry.contact.phone ?? '',
    });
    setModalState({ mode: 'edit', clientId: entry.clientId, contactIndex: entry.contactIndex });
  };

  const handleSaveContact = async () => {
    const clientId = modalState?.mode === 'create' ? selectedClientId : modalState?.clientId;
    const client = clients.find((item) => item.id === clientId);
    const contactName = contactForm.name.trim();

    if (!client || !clientId) {
      showToast('Select a client before saving this contact.', 'error');
      return;
    }

    if (!contactName) {
      showToast('Enter the contact person name before saving.', 'error');
      return;
    }

    const nextContact: ClientContact = {
      name: contactName,
      email: contactForm.email?.trim() || undefined,
      phone: contactForm.phone?.trim() || undefined,
    };

    const nextContacts = [...(client.contacts ?? [])];
    if (modalState?.mode === 'edit' && modalState.contactIndex !== undefined) {
      nextContacts[modalState.contactIndex] = nextContact;
    } else {
      nextContacts.push(nextContact);
    }

    setIsSaving(true);
    try {
      const updatedClient = await updateClient(client.id, {
        ...client,
        contacts: nextContacts,
      });
      setClients((prev) => prev.map((item) => (item.id === updatedClient.id ? updatedClient : item)));
      setModalState(null);
      showToast('Address book contact saved successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save contact.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (entry: AddressBookEntry) => {
    const client = clients.find((item) => item.id === entry.clientId);
    if (!client) return;

    const nextContacts = (client.contacts ?? []).filter((_, index) => index !== entry.contactIndex);
    try {
      const updatedClient = await updateClient(client.id, {
        ...client,
        contacts: nextContacts,
      });
      setClients((prev) => prev.map((item) => (item.id === updatedClient.id ? updatedClient : item)));
      showToast('Address book contact removed successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to remove contact.', 'error');
    }
  };

  const tableMessage = isLoading
    ? 'Loading contact people...'
    : loadError
      ? loadError
      : filteredEntries.length === 0
        ? searchQuery
          ? 'No contact people match your search.'
          : 'No contact people captured yet.'
        : null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Address Book</h2>
          <p className="text-slate-500 text-sm">Manage contact people linked to client records.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={clients.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          <Plus size={16} />
          New Contact Person
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search contacts, client, email, or phone..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
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
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <BookUser size={20} />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{entry.contact.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">{entry.clientName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.contact.email || 'Not set'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.contact.phone || 'Not set'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{entry.clientAddress || 'Not set'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(entry)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteContact(entry)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
            <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/50 px-4 py-10">
              <div className="flex min-h-full items-start justify-center">
                <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {modalState.mode === 'edit' ? 'Edit Contact Person' : 'New Contact Person'}
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
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Client</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                          value={modalState.mode === 'create' ? selectedClientId : modalState.clientId}
                          onChange={(event) => {
                            setSelectedClientId(event.target.value);
                            setModalState((prev) => (prev ? { ...prev, clientId: event.target.value } : prev));
                          }}
                          disabled={modalState.mode === 'edit'}
                          className="w-full appearance-none pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                        >
                          <option value="">Select client</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Contact Person</label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Full name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="email"
                            value={contactForm.email ?? ''}
                            onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="name@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="tel"
                            value={contactForm.phone ?? ''}
                            onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="Phone number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setModalState(null)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveContact()}
                      disabled={isSaving}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Contact'}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
