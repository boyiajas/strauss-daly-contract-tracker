import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Download,
  Calendar,
  Building2,
  Tag,
  Plus,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2
} from 'lucide-react';
import { Contract } from '../types';
import { deleteContract, fetchContracts } from '../lib/contracts';
import { format } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';
import { useToast } from '../App';

const statusStyles: any = {
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Draft': 'bg-slate-50 text-slate-700 border-slate-100',
  'Expired': 'bg-red-50 text-red-700 border-red-100',
  'Terminated': 'bg-slate-900 text-white border-slate-800',
  'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-100',
};

export function ContractList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetchContracts()
      .then((data) => {
        if (!isActive) return;
        setContracts(data);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load contracts.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.departmentName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${startDate} — ${endDate}`;
    }
    return `${format(start, 'dd MMM yyyy')} — ${format(end, 'dd MMM yyyy')}`;
  };

  const closeMenu = useCallback(() => {
    setActiveMenu(null);
    setMenuPosition(null);
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    showToast('Exporting contract repository...');
    setTimeout(() => {
      setIsExporting(false);
      showToast('Contract repository exported to CSV');
    }, 1500);
  };

  const handleAction = (action: string, id: string) => {
    showToast(`${action} action triggered for contract ${id}`);
    closeMenu();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContract(id);
      setContracts((prev) => prev.filter((contract) => contract.id !== id));
      showToast(`Contract ${id} deleted successfully`, 'success');
    } catch (error) {
      showToast('Unable to delete contract. Please try again.', 'error');
    } finally {
      closeMenu();
    }
  };

  const handleMenuToggle = (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (activeMenu === id) {
      closeMenu();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = 148;
    let left = rect.right - menuWidth;
    let top = rect.bottom + 8;

    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }
    if (top + menuHeight > window.innerHeight - 8) {
      top = rect.top - menuHeight - 8;
    }
    if (top < 8) top = 8;

    setActiveMenu(id);
    setMenuPosition({ top, left });
  };

  useEffect(() => {
    if (!activeMenu) return;
    const handleScroll = () => closeMenu();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeMenu, closeMenu]);

  const activeContract = useMemo(() => {
    if (!activeMenu) return null;
    return contracts.find((contract) => contract.id === activeMenu) ?? null;
  }, [activeMenu, contracts]);

  const tableMessage = isLoading
    ? 'Loading contracts...'
    : loadError
      ? loadError
      : filteredContracts.length === 0
        ? searchQuery
          ? 'No contracts match your search.'
          : 'No contracts yet. Create one to get started.'
        : null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contracts Repository</h2>
          <p className="text-slate-500 text-sm">Manage and track all organizational legal documents.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/contracts/new')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} />
            New Contract
          </button>
          <button 
            onClick={() => showToast('Filters applied')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Filter size={16} />
            Filters
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Plus size={16} className="animate-spin" /> : <Download size={16} />}
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible relative">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search contracts, parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Counterparty</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableMessage ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    {tableMessage}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {contract.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Tag size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                              {contract.category}
                            </span>
                            {contract.departmentName && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                  {contract.departmentName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">{contract.partyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={14} />
                      <span>{formatDateRange(contract.startDate, contract.endDate)}</span>
                    </div>
                  </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(contract.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide",
                        statusStyles[contract.status]
                      )}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleAction('External View', contract.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <ExternalLink size={18} />
                        </button>
                      <button 
                        onClick={(event) => handleMenuToggle(contract.id, event)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">Showing {filteredContracts.length} of {contracts.length} contracts</p>
          <div className="flex gap-2">
            <button 
              onClick={() => showToast('Already on first page')}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => showToast('No more pages')}
              className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {activeMenu && menuPosition && activeContract && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={closeMenu} />
              <div
                className="fixed z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <button onClick={() => handleAction('View', activeContract.id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
                  <Eye size={16} /> View Details
                </button>
                <button onClick={() => navigate(`/contracts/${activeContract.id}/edit`)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
                  <Edit2 size={16} /> Edit Contract
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button onClick={() => handleDelete(activeContract.id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}
