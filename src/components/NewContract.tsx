import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Bell, 
  X, 
  ArrowLeft,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Contract } from '../types';
import { useToast } from '../App';
import { createContract, fetchContract, updateContract } from '../lib/contracts';

export function NewContract() {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { showToast } = useToast();
  const isEditing = Boolean(contractId);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    title: '',
    partyName: '',
    startDate: '',
    endDate: '',
    value: 0,
    status: 'Draft',
    category: 'Service',
    description: '',
    tags: [],
    notificationDays: [90, 60, 30],
  });

  useEffect(() => {
    if (!isEditing || !contractId) return;
    let isActive = true;
    setIsLoading(true);
    fetchContract(contractId)
      .then((contract) => {
        if (!isActive) return;
        setNewContract(contract);
        setTagsInput((contract.tags ?? []).join(', '));
        if (!contract.notificationDays || contract.notificationDays.length === 0) {
          setNewContract((prev) => ({ ...prev, notificationDays: [90, 60, 30] }));
        }
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
              {isEditing ? 'Update the agreement details and alerts.' : 'Register a new agreement and set up alerts.'}
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
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {loadError}
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Counterparty</label>
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                <select 
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.category}
                  onChange={e => setNewContract({...newContract, category: e.target.value as any})}
                  disabled={isLoading}
                >
                  <option value="Service">Service</option>
                  <option value="Lease">Lease</option>
                  <option value="Employment">Employment</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Other">Other</option>
                </select>
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
                  required
                  type="date" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newContract.endDate}
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
                  {[90, 60, 30].map((days) => {
                    const label = `${days} Days Before Expiry`;
                    const isChecked = newContract.notificationDays?.includes(days) ?? false;
                    return (
                      <label key={label} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer group hover:bg-white hover:border-blue-200 transition-all">
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
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notification Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Leave blank to use default"
                    value={newContract.notificationEmail || ''}
                    onChange={e => setNewContract({...newContract, notificationEmail: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notification Phone</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Leave blank to use default"
                    value={newContract.notificationPhone || ''}
                    onChange={e => setNewContract({...newContract, notificationPhone: e.target.value})}
                    disabled={isLoading}
                  />
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
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
