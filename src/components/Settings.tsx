import React, { useEffect, useState } from 'react';
import { 
  Save,
  Shield,
  Globe,
  Coins,
  Building2,
  Lock,
  Database,
  FileCode,
  RefreshCw,
  Tag,
  Download,
  Trash2,
  Plus
} from 'lucide-react';
import { useToast } from '../App';
import { fetchSystemSettings, saveSystemSettings, type SystemSettingsData } from '../lib/system-settings';

export function Settings() {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettingsData>({
    companyName: 'Strauss Daly',
    registrationNumber: '2024/123456/07',
    systemLanguage: 'English (South Africa)',
    defaultCurrency: 'ZAR',
    twoFactorEnabled: true,
    sessionTimeoutEnabled: true,
    categories: ['Service', 'Employment', 'Vendor', 'Lease', 'NDA'],
  });

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetchSystemSettings()
      .then((data) => {
        if (!isActive) return;
        setSettings(data);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load system settings.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await saveSystemSettings(settings);
      setSettings(updated);
      setIsSaving(false);
      showToast('System settings updated successfully');
    } catch (error) {
      setIsSaving(false);
      showToast('Unable to save system settings.', 'error');
    }
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    showToast('Preparing system backup...');
    setTimeout(() => {
      setIsBackingUp(false);
      showToast('System backup completed and downloaded');
    }, 2500);
  };

  const handleRemoveCategory = (category: string) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item !== category),
    }));
    showToast(`Category ${category} deleted`, 'success');
  };

  const handleAddCategory = () => {
    const name = window.prompt('Enter a new category name');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setSettings((prev) => ({
      ...prev,
      categories: Array.from(new Set([...prev.categories, trimmed])),
    }));
    showToast(`Category ${trimmed} added`, 'success');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">System Settings</h2>
          <p className="text-slate-500 mt-1">Configure global organization preferences and system security.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Settings */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <Building2 size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Organization Profile</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                <input 
                  type="text" 
                  value={settings.companyName}
                  onChange={(e) => setSettings((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Number</label>
                <input 
                  type="text" 
                  value={settings.registrationNumber}
                  onChange={(e) => setSettings((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Language</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={settings.systemLanguage}
                    onChange={(e) => setSettings((prev) => ({ ...prev, systemLanguage: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                    disabled={isLoading}
                  >
                    <option>English (South Africa)</option>
                    <option>Afrikaans</option>
                    <option>Zulu</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Currency</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => setSettings((prev) => ({ ...prev, defaultCurrency: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
                    disabled={isLoading}
                  >
                    <option value="ZAR">ZAR (R)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Security Settings */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <Lock size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Security & Access</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Require 2FA for all administrative accounts.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.twoFactorEnabled}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, twoFactorEnabled: event.target.checked }))
                    }
                    className="sr-only peer" 
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-50">
                <div>
                  <p className="text-sm font-bold text-slate-900">Session Timeout</p>
                  <p className="text-xs text-slate-500">Automatically log out users after 30 minutes of inactivity.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.sessionTimeoutEnabled}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, sessionTimeoutEnabled: event.target.checked }))
                    }
                    className="sr-only peer" 
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <Tag size={20} className="text-blue-600" />
              <h4 className="font-bold text-sm">Contract Categories</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.categories.map(cat => (
                <div key={cat} className="group flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                  {cat}
                  <button 
                    onClick={() => handleRemoveCategory(cat)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              <button 
                onClick={handleAddCategory}
                className="px-2 py-1 border border-dashed border-slate-300 text-slate-400 rounded text-[10px] font-bold uppercase hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add
              </button>
            </div>
            {loadError && (
              <p className="text-xs text-red-500">{loadError}</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <Database size={20} className="text-blue-600" />
              <h4 className="font-bold text-sm">Data Management</h4>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Last system backup was completed on April 3, 2024 at 03:00 AM.
            </p>
            <button 
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all disabled:opacity-50"
            >
              {isBackingUp ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              Download Backup
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <FileCode size={20} className="text-indigo-600" />
              <h4 className="font-bold text-sm">API Access</h4>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Manage your API keys for external integrations and custom reporting.
            </p>
            <button 
              onClick={() => showToast('API management access granted')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              Manage API Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
