import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  FileText,
  Bell,
  Download,
  Calendar as CalendarIcon,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { addDays, differenceInDays, format, isSameMonth, parseISO, startOfMonth, subMonths } from 'date-fns';
import { Contract } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { fetchContracts } from '../lib/contracts';
import { fetchAuditLogs, type AuditLogEntry } from '../lib/audit-logs';
import { useToast } from '../App';

const activityIcons: Record<string, React.ComponentType<any>> = {
  Contracts: FileText,
  Users: UserIcon,
  Settings: RefreshCw,
  Security: Shield,
  System: Bell,
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="text-white" size={24} />
      </div>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

export function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    Promise.allSettled([fetchContracts(), fetchAuditLogs()])
      .then(([contractsResult, auditResult]) => {
        if (!isActive) return;

        const contractsLoaded = contractsResult.status === 'fulfilled';
        const auditLoaded = auditResult.status === 'fulfilled';

        if (contractsLoaded) {
          setContracts(contractsResult.value);
        }

        if (auditLoaded) {
          setAuditLogs(auditResult.value);
        }

        setLoadError(contractsLoaded || auditLoaded ? null : 'Unable to load dashboard data.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const now = new Date();
  const expiringWindow = addDays(now, 30);

  const totals = useMemo(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter((contract) => contract.status === 'Active').length;
    const totalValue = contracts.reduce((sum, contract) => sum + (Number(contract.value) || 0), 0);
    const expiringSoon = contracts.filter((contract) => {
      const endDate = parseISO(contract.endDate);
      return endDate >= now && endDate <= expiringWindow;
    }).length;

    return {
      totalContracts,
      activeContracts,
      expiringSoon,
      totalValue,
    };
  }, [contracts, expiringWindow, now]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, index) =>
      subMonths(startOfMonth(now), 5 - index)
    );
    return months.map((month) => {
      const value = contracts.reduce((sum, contract) => {
        if (!contract.startDate) return sum;
        const start = parseISO(contract.startDate);
        if (!isSameMonth(start, month)) return sum;
        return sum + (Number(contract.value) || 0);
      }, 0);
      return {
        name: format(month, 'MMM'),
        value,
      };
    });
  }, [contracts, now]);

  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      Active: 0,
      Draft: 0,
      'Pending Approval': 0,
      Expired: 0,
      Terminated: 0,
    };

    contracts.forEach((contract) => {
      statusCounts[contract.status] = (statusCounts[contract.status] ?? 0) + 1;
    });

    return [
      { name: 'Active', count: statusCounts.Active, color: '#2563eb' },
      { name: 'Draft', count: statusCounts.Draft, color: '#94a3b8' },
      { name: 'Pending Approval', count: statusCounts['Pending Approval'], color: '#f59e0b' },
      { name: 'Expired', count: statusCounts.Expired, color: '#ef4444' },
      { name: 'Terminated', count: statusCounts.Terminated, color: '#0f172a' },
    ];
  }, [contracts]);

  const recentActivity = useMemo(() => {
    return auditLogs.slice(0, 3).map((log) => ({
      id: log.id,
      user: log.user,
      action: log.action,
      target: log.details,
      time: log.timestamp,
      icon: activityIcons[log.module] ?? RefreshCw,
    }));
  }, [auditLogs]);

  const upcomingExpirations = useMemo(() => {
    return contracts
      .map((contract) => {
        const endDate = parseISO(contract.endDate);
        return {
          id: contract.id,
          title: contract.title,
          party: contract.partyName,
          date: contract.endDate,
          days: differenceInDays(endDate, now),
        };
      })
      .filter((item) => item.days >= 0)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  }, [contracts, now]);

  const handleExport = () => {
    setIsExporting(true);
    showToast('Preparing dashboard report...');
    setTimeout(() => {
      setIsExporting(false);
      showToast('Dashboard report exported successfully!');
    }, 2000);
  };

  const statusTotal = Math.max(
    statusData.reduce((sum, item) => sum + item.count, 0),
    1
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {loadError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
          {loadError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening with your contracts.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            Export Report
          </button>
          <button 
            onClick={() => navigate('/contracts/new')}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            + New Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Contracts" 
          value={totals.totalContracts}
          icon={TrendingUp} 
          trend={undefined} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Active Contracts" 
          value={totals.activeContracts}
          icon={CheckCircle2} 
          trend={undefined} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Expiring Soon" 
          value={totals.expiringSoon}
          icon={Clock} 
          trend={undefined} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Total Value" 
          value={formatCurrency(totals.totalValue)} 
          icon={AlertCircle} 
          trend={undefined} 
          color="bg-indigo-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Contract Value Growth</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Status Distribution</h3>
          <div className="space-y-6">
            {statusData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">{item.name}</span>
                  <span className="text-slate-900 font-bold">{item.count}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(item.count / statusTotal) * 100}%`, backgroundColor: item.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Recent Activity</h3>
            <button 
              onClick={() => navigate('/audit-log')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {isLoading && (
              <p className="text-sm text-slate-500">Loading activity...</p>
            )}
            {!isLoading && recentActivity.length === 0 && (
              <p className="text-sm text-slate-500">No recent activity yet.</p>
            )}
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <activity.icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-bold text-slate-900">{activity.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Expirations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Upcoming Expirations</h3>
            <button 
              onClick={() => showToast('Calendar view coming soon!', 'error')}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              <CalendarIcon size={14} />
              View Calendar
            </button>
          </div>
          <div className="space-y-4">
            {isLoading && (
              <p className="text-sm text-slate-500">Loading expirations...</p>
            )}
            {!isLoading && upcomingExpirations.length === 0 && (
              <p className="text-sm text-slate-500">No upcoming expirations.</p>
            )}
            {upcomingExpirations.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.party}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.date}</p>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">In {item.days} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
