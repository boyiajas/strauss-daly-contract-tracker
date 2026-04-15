export type SystemSettingsData = {
  companyName: string;
  registrationNumber: string;
  systemLanguage: string;
  defaultCurrency: string;
  twoFactorEnabled: boolean;
  sessionTimeoutEnabled: boolean;
  categories: string[];
};

type SystemSettingsApi = {
  id: number;
  company_name: string;
  registration_number: string;
  system_language: string;
  default_currency: string;
  two_factor_enabled: boolean;
  session_timeout_enabled: boolean;
  categories: string[] | null;
};

const mapSettingsFromApi = (settings: SystemSettingsApi): SystemSettingsData => ({
  companyName: settings.company_name,
  registrationNumber: settings.registration_number,
  systemLanguage: settings.system_language,
  defaultCurrency: settings.default_currency,
  twoFactorEnabled: settings.two_factor_enabled,
  sessionTimeoutEnabled: settings.session_timeout_enabled,
  categories: settings.categories ?? [],
});

const mapSettingsToApi = (settings: SystemSettingsData) => ({
  company_name: settings.companyName,
  registration_number: settings.registrationNumber,
  system_language: settings.systemLanguage,
  default_currency: settings.defaultCurrency,
  two_factor_enabled: settings.twoFactorEnabled,
  session_timeout_enabled: settings.sessionTimeoutEnabled,
  categories: settings.categories,
});

export const fetchSystemSettings = async () => {
  const response = await fetch('/api/system-settings', {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load system settings.');
  }

  const data = (await response.json()) as SystemSettingsApi;
  return mapSettingsFromApi(data);
};

export const saveSystemSettings = async (settings: SystemSettingsData) => {
  const response = await fetch('/api/system-settings', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapSettingsToApi(settings)),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || 'Unable to save system settings.';
    throw new Error(message);
  }

  const data = (await response.json()) as SystemSettingsApi;
  return mapSettingsFromApi(data);
};
