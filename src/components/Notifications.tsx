import React, { useEffect, useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Smartphone, 
  BellRing, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  User as UserIcon,
  Clock,
  Send,
  Save
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NotificationLog, NotificationSettings } from '../types';
import { useToast } from '../App';
import { fetchNotificationLogs, fetchNotificationSettings, saveNotificationSettings, sendTestNotification } from '../lib/notifications';

const defaultSettings: NotificationSettings = {
  email: true,
  sms: true,
  whatsapp: true,
  reminderDays: 30,
  recipients: [],
};

export function Notifications() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoadingSettings(true);
    fetchNotificationSettings()
      .then((data) => {
        if (!isActive) return;
        setSettings(data);
        setSettingsError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setSettingsError('Unable to load notification settings.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingSettings(false);
      });

    setIsLoadingLogs(true);
    fetchNotificationLogs()
      .then((data) => {
        if (!isActive) return;
        setLogs(data);
        setLogsError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLogsError('Unable to load notification logs.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoadingLogs(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleTestNotification = async () => {
    setIsTesting(true);
    showToast('Sending test notification...');
    try {
      const log = await sendTestNotification();
      setLogs((prev) => [log, ...prev]);
      setIsTesting(false);
      setTestSuccess(true);
      showToast('Test notification sent successfully!', 'success');
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (error) {
      setIsTesting(false);
      showToast('Test notification failed.', 'error');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await saveNotificationSettings(settings);
      setSettings(updated);
      setIsSaving(false);
      showToast('Notification settings saved');
    } catch (error) {
      setIsSaving(false);
      showToast('Unable to save notification settings.', 'error');
    }
  };

  const historyMessage = isLoadingLogs
    ? 'Loading notification history...'
    : logsError
      ? logsError
      : logs.length === 0
        ? 'No notifications have been sent yet.'
        : null;

  const handleRecipientChange = (index: number, updates: Partial<NotificationSettings['recipients'][number]>) => {
    setSettings((prev) => ({
      ...prev,
      recipients: prev.recipients.map((recipient, idx) =>
        idx === index ? { ...recipient, ...updates } : recipient
      ),
    }));
  };

  const handleAddRecipient = () => {
    setSettings((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        { channel: 'Email', recipient: '', label: '', isActive: true },
      ],
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Notifications Center</h2>
          <p className="text-slate-500 mt-1">Manage communication channels, default recipients, and track alert history.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleTestNotification}
            disabled={isTesting}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg",
              testSuccess 
                ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/10" 
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-200/50"
            )}
          >
            {isTesting ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : testSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              <Send size={18} />
            )}
            {isTesting ? "Sending Test..." : testSuccess ? "Test Sent!" : "Send Test Alert"}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Settings
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('config')}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all border-b-2",
            activeTab === 'config' 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2",
            activeTab === 'history' 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          <History size={16} />
          Notification History
        </button>
      </div>

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-2 space-y-8">
            {settingsError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {settingsError}
              </div>
            )}
            {/* Recipients */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <UserIcon size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Recipients</h3>
              </div>

              <div className="space-y-4">
                {settings.recipients.length === 0 && (
                  <p className="text-sm text-slate-500">No recipients yet. Add one to start sending alerts.</p>
                )}
                {settings.recipients.map((recipient, index) => (
                  <div key={`${recipient.id ?? 'new'}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channel</label>
                      <select
                        value={recipient.channel}
                        onChange={(event) => handleRecipientChange(index, { channel: event.target.value as NotificationSettings['recipients'][number]['channel'] })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        disabled={isLoadingSettings}
                      >
                        <option value="Email">Email</option>
                        <option value="SMS">SMS</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</label>
                      <input
                        type="text"
                        placeholder="notifications@straussdaly.co.za or +27 82 000 0000"
                        value={recipient.recipient}
                        onChange={(event) => handleRecipientChange(index, { recipient: event.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        disabled={isLoadingSettings}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(index)}
                        className="w-full px-3 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                        disabled={isLoadingSettings}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddRecipient}
                className="w-full px-4 py-3 border border-dashed border-slate-300 text-slate-500 rounded-xl text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition-colors"
                disabled={isLoadingSettings}
              >
                + Add Recipient
              </button>
            </section>
          </div>

          <div className="space-y-8">
            {/* Active Channels */}
            <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <BellRing size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Active Channels</h3>
              </div>

              <div className="space-y-4">
                {[
                  { id: 'email', icon: Mail, label: 'Email Notifications', desc: 'Summaries & Reports', color: 'text-blue-500' },
                  { id: 'sms', icon: Smartphone, label: 'SMS Alerts', desc: 'Critical Expirations', color: 'text-emerald-500' },
                  { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp Business', desc: 'Real-time Updates', color: 'text-green-500' },
                ].map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-slate-50", channel.color)}>
                        <channel.icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{channel.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{channel.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={
                          channel.id === 'email'
                            ? settings.email
                            : channel.id === 'sms'
                              ? settings.sms
                              : settings.whatsapp
                        }
                        onChange={(event) => {
                          const nextValue = event.target.checked;
                          setSettings((prev) => ({
                            ...prev,
                            email: channel.id === 'email' ? nextValue : prev.email,
                            sms: channel.id === 'sms' ? nextValue : prev.sms,
                            whatsapp: channel.id === 'whatsapp' ? nextValue : prev.whatsapp,
                          }));
                        }}
                        disabled={isLoadingSettings}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <h4 className="font-bold">System Alert</h4>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                WhatsApp Business API is currently in sandbox mode. Production activation requires verified business credentials.
              </p>
              <button 
                onClick={() => showToast('Verification process initiated')}
                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
              >
                Verify Credentials
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {/* Notification History */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <History size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Full Notification Log</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => showToast('Log filters applied')}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <Send size={14} />
                  Filter Logs
                </button>
                <button 
                  onClick={() => showToast('Notification history exported')}
                  className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                >
                  Export History
                </button>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historyMessage ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-500">
                        {historyMessage}
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="text-sm hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {log.timestamp}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-bold">{log.recipient}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-tight",
                            log.type === 'Email' ? "bg-blue-50 text-blue-600" :
                            log.type === 'SMS' ? "bg-emerald-50 text-emerald-600" :
                            "bg-green-50 text-green-600"
                          )}>
                            {log.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-600 font-medium">{log.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "flex items-center gap-1.5 font-bold",
                            log.status === 'Sent' ? "text-emerald-600" : 
                            log.status === 'Pending' ? "text-amber-500" : "text-red-500"
                          )}>
                            {log.status === 'Sent' ? <CheckCircle2 size={14} /> : 
                             log.status === 'Pending' ? <RefreshCw size={14} className="animate-spin" /> : 
                             <AlertTriangle size={14} />}
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
