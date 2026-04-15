import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  Building2, 
  ArrowLeft,
  Save,
  CheckCircle2,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { User, UserRole } from '../types';
import { useToast } from '../App';
import { createUser, fetchUser, updateUser } from '../lib/users';

export function NewUser() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { showToast } = useToast();
  const isEditing = Boolean(userId);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'Viewer',
    department: '',
    status: 'Active'
  });

  useEffect(() => {
    if (!isEditing || !userId) return;
    let isActive = true;
    setIsLoading(true);
    fetchUser(userId)
      .then((user) => {
        if (!isActive) return;
        setNewUser(user);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load user.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isEditing, userId]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (isEditing && userId) {
        await updateUser(userId, newUser);
        showToast('User updated successfully!', 'success');
      } else {
        await createUser(newUser);
        showToast('User created successfully!', 'success');
      }
      navigate('/users');
    } catch (error) {
      showToast(`Unable to ${isEditing ? 'update' : 'create'} user. Please try again.`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/users')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{isEditing ? 'Edit User' : 'Add New User'}</h2>
            <p className="text-slate-500 text-sm mt-1">
              {isEditing ? 'Update user details and permissions.' : 'Create a new user account and assign permissions.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/users')}
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
          {/* Profile Information Section */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <UserIcon size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Profile Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. John Doe"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="email" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. john.doe@straussdaly.co.za"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Legal Operations"
                    value={newUser.department}
                    onChange={e => setNewUser({...newUser, department: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Employee ID (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. SD-1234"
                />
              </div>
            </div>
          </section>

          {/* Additional Details Section */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Account Preferences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notification Preferences</label>
                <div className="space-y-3">
                  {['Email Notifications', 'SMS Alerts', 'WhatsApp Updates'].map(pref => (
                    <label key={pref} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer group hover:bg-white hover:border-blue-200 transition-all">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        onChange={() => showToast(`${pref} updated`)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{pref}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Access</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer group hover:bg-white hover:border-blue-200 transition-all">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      onChange={() => showToast('Remote access updated')}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Allow Remote Access</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer group hover:bg-white hover:border-blue-200 transition-all">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      onChange={() => showToast('2FA requirement updated')}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20" 
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Require 2FA</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Role & Permissions Section */}
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Shield size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Role & Access</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Access Level</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  disabled={isLoading}
                >
                  <option value="Viewer">Viewer (Read-only)</option>
                  <option value="Manager">Manager (Edit access)</option>
                  <option value="Admin">Administrator (Full access)</option>
                </select>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Determines what actions the user can perform.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Account Status</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  value={newUser.status}
                  onChange={e => setNewUser({...newUser, status: e.target.value as any})}
                  disabled={isLoading}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / Suspended</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => navigate('/users')}
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
              Save User
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
