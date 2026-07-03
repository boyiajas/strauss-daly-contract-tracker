import { Client } from '../types';

type ClientApi = {
  id: number;
  title?: string | null;
  name: string;
  address?: string | null;
  contacts?: Array<{
    name: string;
    email?: string | null;
    phone?: string | null;
  }> | null;
  contracts_count?: number;
};

const mapClientFromApi = (client: ClientApi): Client => ({
  id: String(client.id),
  title: client.title ?? undefined,
  name: client.name,
  address: client.address ?? undefined,
  contacts: (client.contacts ?? []).map((contact) => ({
    name: contact.name,
    email: contact.email ?? undefined,
    phone: contact.phone ?? undefined,
  })),
  contractCount: client.contracts_count ?? 0,
});

export const fetchClients = async () => {
  const response = await fetch('/api/clients', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load clients.');
  }

  const data = (await response.json()) as ClientApi[];
  return data.map(mapClientFromApi);
};

export const createClient = async (client: Partial<Client>) => {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: client.title ?? '',
      name: client.name ?? '',
      address: client.address ?? '',
      contacts: client.contacts ?? [],
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Unable to create client.');
  }

  const data = (await response.json()) as ClientApi;
  return mapClientFromApi(data);
};

export const updateClient = async (id: string, client: Partial<Client>) => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: client.title ?? '',
      name: client.name ?? '',
      address: client.address ?? '',
      contacts: client.contacts ?? [],
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Unable to update client.');
  }

  const data = (await response.json()) as ClientApi;
  return mapClientFromApi(data);
};

export const deleteClient = async (id: string) => {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Unable to delete client.');
  }
};
