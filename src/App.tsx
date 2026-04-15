import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ContractList } from './components/ContractList';
import { UserList } from './components/UserList';
import { Settings } from './components/Settings';
import { Notifications } from './components/Notifications';
import { AuditLog } from './components/AuditLog';
import { NewContract } from './components/NewContract';
import { NewUser } from './components/NewUser';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from './lib/utils';

// Toast Context
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('strauss_daly_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('strauss_daly_user', JSON.stringify(userData));
    showToast(`Welcome back, ${userData.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('strauss_daly_user');
    showToast('Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const authContent = !user ? (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  ) : (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLogout={handleLogout}
        userRole={user.role}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onLogout={handleLogout}
          user={user}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contracts" element={<ContractList />} />
              <Route path="/contracts/new" element={<NewContract />} />
              <Route path="/contracts/:contractId/edit" element={<NewContract />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/users/new" element={<NewUser />} />
              <Route path="/users/:userId/edit" element={<NewUser />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/audit-log" element={<AuditLog />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Router>
        {authContent}
      </Router>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-300",
          toast.type === 'success' ? "bg-white border-emerald-100 text-emerald-600" : "bg-white border-red-100 text-red-600"
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold text-slate-900">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
