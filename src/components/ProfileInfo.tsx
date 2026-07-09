import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, RefreshCw, Save, User as UserIcon } from 'lucide-react';
import { Department, User, UserRole } from '../types';
import { useToast } from '../App';
import { fetchUser, updateUser } from '../lib/users';
import { fetchDepartments } from '../lib/departments';

interface ProfileInfoProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export function ProfileInfo({ user, onUserUpdate }: ProfileInfoProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Partial<User>>(user);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [departmentLoadError, setDepartmentLoadError] = useState<string | null>(null);

  useEffect(() => {
    setProfile(user);
    setSelectedDepartments(
      (user.department ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }, [user]);

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
    if (!user.id) return;
    let isActive = true;
    setIsLoading(true);
    fetchUser(user.id)
      .then((fetchedUser) => {
        if (!isActive) return;
        setProfile(fetchedUser);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load your latest profile details.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user.id]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (isSaving) return;

    const nextProfile: User = {
      id: user.id,
      name: profile.name?.trim() || user.name,
      email: profile.email?.trim() || user.email,
      department: selectedDepartments.join(', '),
      role: (profile.role ?? user.role) as UserRole,
      status: (profile.status ?? user.status) as User['status'],
    };

    setIsSaving(true);
    try {
      if (user.id) {
        const updated = await updateUser(user.id, nextProfile);
        onUserUpdate(updated);
      } else {
        onUserUpdate(nextProfile);
      }
      showToast('Profile updated successfully.', 'success');
      navigate('/');
    } catch {
      showToast('Unable to update your profile right now.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Profile Info</h2>
            <p className="text-slate-500 text-sm mt-1">Update your account details and contact information.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/')}
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
            Update Profile
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

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <UserIcon size={20} />
            </div>
            <h3 className="font-bold text-slate-900">Account Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={profile.name ?? ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
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
                  value={profile.email ?? ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Departments</label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-500">
                  <Building2 size={18} />
                  <p className="text-xs font-semibold">Select one or more departments</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {departments.map((department) => {
                    const isChecked = selectedDepartments.includes(department.name);
                    return (
                      <label
                        key={department.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const nextChecked = e.target.checked;
                            setSelectedDepartments((prev) =>
                              nextChecked
                                ? [...prev, department.name]
                                : prev.filter((item) => item !== department.name)
                            );
                          }}
                          disabled={isLoading}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                        />
                        <span>{department.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {selectedDepartments.length > 0
                    ? `Selected: ${selectedDepartments.join(', ')}`
                    : 'No departments selected yet.'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Role</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600"
                value={profile.role ?? ''}
                disabled
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
