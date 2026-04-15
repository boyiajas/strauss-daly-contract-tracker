import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  MoreHorizontal,
  Mail,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { User } from '../types';
import { deleteUser, fetchUsers, updateUser } from '../lib/users';
import { cn } from '../lib/utils';
import { useToast } from '../App';

const roleIcons: any = {
  'Admin': ShieldAlert,
  'Manager': ShieldCheck,
  'Viewer': Shield,
};

const roleColors: any = {
  'Admin': 'text-red-600 bg-red-50',
  'Manager': 'text-blue-600 bg-blue-50',
  'Viewer': 'text-slate-600 bg-slate-50',
};

export function UserList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetchUsers()
      .then((data) => {
        if (!isActive) return;
        setUsers(data);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load users.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (action: string, id: string) => {
    showToast(`${action} action triggered for user ${id}`);
    setActiveMenu(null);
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await updateUser(user.id, { status: nextStatus });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
      showToast(`User ${user.name} ${nextStatus === 'Active' ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      showToast('Unable to update user status.', 'error');
    } finally {
      setActiveMenu(null);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      showToast(`User ${user.name} deleted successfully`, 'success');
    } catch (error) {
      showToast('Unable to delete user.', 'error');
    } finally {
      setActiveMenu(null);
    }
  };

  const emptyMessage = isLoading
    ? 'Loading users...'
    : loadError
      ? loadError
      : filteredUsers.length === 0
        ? searchQuery
          ? 'No users match your search.'
          : 'No users yet. Add one to get started.'
        : null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500 text-sm">Control access levels and manage team permissions.</p>
        </div>
        <button 
          onClick={() => navigate('/users/new')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emptyMessage ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-sm text-slate-500 col-span-full">
            {emptyMessage}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const Icon = roleIcons[user.role];
            return (
              <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    
                    {activeMenu === user.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                          <button onClick={() => navigate(`/users/${user.id}/edit`)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
                            <Edit2 size={16} /> Edit Profile
                          </button>
                          <button onClick={() => handleToggleStatus(user)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
                            {user.status === 'Active' ? <UserMinus size={16} /> : <UserCheck size={16} />}
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <div className="h-px bg-slate-100 my-1" />
                          <button onClick={() => handleDelete(user)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                            <Trash2 size={16} /> Delete User
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900">{user.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    roleColors[user.role]
                  )}>
                    <Icon size={12} />
                    {user.role}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      user.status === 'Active' ? "bg-emerald-500" : "bg-slate-300"
                    )}></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
