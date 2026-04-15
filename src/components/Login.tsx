import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (user: any) => void;
}

const SAMPLE_USERS = [
  { email: 'admin@straussdaly.co.za', password: 'password123', name: 'John Admin', role: 'Admin' },
  { email: 'manager@straussdaly.co.za', password: 'password123', name: 'Sarah Manager', role: 'Manager' },
  { email: 'viewer@straussdaly.co.za', password: 'password123', name: 'Mike Viewer', role: 'Viewer' },
];

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock authentication
    setTimeout(() => {
      const user = SAMPLE_USERS.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
        navigate('/');
      } else {
        setError('Invalid email or password. Please try the sample credentials.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/20 mb-4 animate-in zoom-in duration-500">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Strauss Daly</h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Contract Tracker Management</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@straussdaly.co.za"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Password</label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:underline">Create Account</Link>
            </p>
          </div>
        </div>

        {/* Sample Credentials Helper */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-3 animate-in fade-in duration-1000 delay-300">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider text-center">Sample Credentials (Password: password123)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {SAMPLE_USERS.map(u => (
              <button 
                key={u.role}
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password);
                }}
                className="px-3 py-2 bg-white border border-blue-100 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors text-center"
              >
                {u.role} Login
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
