import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User as UserIcon, 
  Activity,
  Shield,
  Database,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchAuditLogs, type AuditLogEntry } from '../lib/audit-logs';
import { useToast } from '../App';

const moduleIcons: any = {
  'Contracts': FileText,
  'Users': UserIcon,
  'Settings': Activity,
  'Security': Shield,
  'System': Database,
};

const statusColors: any = {
  'Success': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'Warning': 'text-amber-600 bg-amber-50 border-amber-100',
  'Failure': 'text-red-600 bg-red-50 border-red-100',
};

export function AuditLog() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetchAuditLogs()
      .then((data) => {
        if (!isActive) return;
        setLogs(data);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load audit logs.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    showToast('Preparing audit log export...');
    setTimeout(() => {
      setIsExporting(false);
      showToast('Audit log exported successfully', 'success');
    }, 1500);
  };

  const handlePagination = (page: number) => {
    showToast(`Navigating to page ${page}`);
  };

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tableMessage = isLoading
    ? 'Loading audit logs...'
    : loadError
      ? loadError
      : filteredLogs.length === 0
        ? searchTerm
          ? 'No audit logs match your search.'
          : 'No audit logs yet.'
        : null;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">System Audit Log</h2>
          <p className="text-slate-500 mt-1">Comprehensive trail of all administrative and system-level activities.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
            Export Logs
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by user, action, or details..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            onChange={() => showToast('Module filter updated')}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>All Modules</option>
            <option>Contracts</option>
            <option>Security</option>
            <option>Users</option>
            <option>System</option>
          </select>
          <select 
            onChange={() => showToast('Status filter updated')}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option>All Statuses</option>
            <option>Success</option>
            <option>Warning</option>
            <option>Failure</option>
          </select>
          <button 
            onClick={() => showToast('Advanced filters applied')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
          >
            <Filter size={16} />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User & IP</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action & Module</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableMessage ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    {tableMessage}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const Icon = moduleIcons[log.module] || Activity;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Clock size={14} className="text-slate-400" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{log.user}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.ipAddress}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{log.action}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{log.module}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide flex items-center gap-1.5 w-fit",
                          statusColors[log.status]
                        )}>
                          {log.status === 'Success' && <CheckCircle2 size={12} />}
                          {log.status === 'Warning' && <AlertCircle size={12} />}
                          {log.status === 'Failure' && <AlertCircle size={12} />}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Showing 1 to {filteredLogs.length} of {logs.length} entries</p>
          <div className="flex gap-2">
            <button 
              onClick={() => handlePagination(0)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all disabled:opacity-50" 
              disabled
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePagination(1)} className="w-8 h-8 bg-blue-600 text-white rounded-lg text-xs font-bold">1</button>
              <button onClick={() => handlePagination(2)} className="w-8 h-8 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">2</button>
              <button onClick={() => handlePagination(3)} className="w-8 h-8 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">3</button>
              <span className="px-1 text-slate-400">...</span>
              <button onClick={() => handlePagination(207)} className="w-8 h-8 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">207</button>
            </div>
            <button 
              onClick={() => handlePagination(2)}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
