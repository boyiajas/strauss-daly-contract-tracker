import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Download,
  Upload,
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
import { createContract, deleteContract, fetchContracts, parseContractsWorkbook, updateContract } from '../lib/contracts';
import { fetchDepartments } from '../lib/departments';
import { fetchNotificationSettings } from '../lib/notifications';
import { cn, formatCurrency } from '../lib/utils';
import { useToast } from '../App';
import { contractStatusStyles, formatContractDateRange } from '../lib/contract-ui';

const getNotificationContacts = (values?: string[], fallback?: string) => {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }

  if (fallback?.trim()) {
    return [fallback.trim()];
  }

  return [];
};

export function ContractList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchContracts();
      setContracts(data);
      setLoadError(null);
    } catch {
      setLoadError('Unable to load contracts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
    return () => {
      //
    };
  }, [loadContracts]);

  const filteredContracts = contracts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.departmentName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contractType ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.portfolio ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const closeMenu = useCallback(() => {
    setActiveMenu(null);
    setMenuPosition(null);
  }, []);

  const handleExport = () => {
    if (filteredContracts.length === 0) {
      showToast('No contracts available to export.', 'error');
      return;
    }

    setIsExporting(true);
    showToast('Preparing Excel export...');

    Promise.all([import('xlsx'), fetchNotificationSettings()])
      .then(([XLSX, notificationSettings]) => {
        const activeRecipients = (notificationSettings.recipients ?? []).filter(
          (recipient) => (recipient.isActive ?? true) && recipient.recipient.trim().length > 0
        );
        const maxDeadlineCount = filteredContracts.reduce(
          (max, contract) => Math.max(max, contract.notificationDays?.length ?? 0),
          0
        );
        const maxEmailCount = filteredContracts.reduce(
          (max, contract) =>
            Math.max(
              max,
              getNotificationContacts(contract.notificationEmails, contract.notificationEmail).length
            ),
          0
        );
        const maxPhoneCount = filteredContracts.reduce(
          (max, contract) =>
            Math.max(
              max,
              getNotificationContacts(contract.notificationPhones, contract.notificationPhone).length
            ),
          0
        );

        const recipientColumns = activeRecipients.reduce<Record<string, string>>((acc, recipient, index) => {
          const columnNumber = index + 1;
          acc[`Notification Recipient ${columnNumber} Channel`] = recipient.channel;
          acc[`Notification Recipient ${columnNumber}`] = recipient.recipient.trim();
          return acc;
        }, {});

        const rows = filteredContracts.map((contract) => {
          const notificationEmails = getNotificationContacts(
            contract.notificationEmails,
            contract.notificationEmail
          );
          const notificationPhones = getNotificationContacts(
            contract.notificationPhones,
            contract.notificationPhone
          );
          const deadlineColumns = Array.from({ length: maxDeadlineCount }).reduce<Record<string, string | number>>(
            (acc, _, index) => {
              const days = contract.notificationDays?.[index];
              acc[`Alert Deadline ${index + 1} (Days)`] = days ?? '';
              return acc;
            },
            {}
          );
          const notificationEmailColumns = Array.from({ length: maxEmailCount }).reduce<Record<string, string>>(
            (acc, _, index) => {
              acc[`Contract Notification Email ${index + 1}`] = notificationEmails[index] ?? '';
              return acc;
            },
            {}
          );
          const notificationPhoneColumns = Array.from({ length: maxPhoneCount }).reduce<Record<string, string>>(
            (acc, _, index) => {
              acc[`Contract Notification Phone ${index + 1}`] = notificationPhones[index] ?? '';
              return acc;
            },
            {}
          );

          return {
            'Contract ID': contract.id,
            'Contract Title': contract.title,
            Counterparty: contract.partyName,
            Department: contract.departmentName ?? '',
            Type: contract.contractType ?? '',
            Category: contract.category,
            Portfolio: contract.portfolio ?? '',
            Status: contract.status,
            'Start Date': contract.startDate || '',
            'End Date': contract.endDate || '',
            Duration: formatContractDateRange(contract.startDate, contract.endDate),
            Value: Number(contract.value) || 0,
            Description: contract.description ?? '',
            Tags: (contract.tags ?? []).join(', '),
            'Alert Deadline Days': (contract.notificationDays ?? []).join(', '),
            ...deadlineColumns,
            'Notification Emails': notificationEmails.join(', '),
            ...notificationEmailColumns,
            'Notification Phones': notificationPhones.join(', '),
            ...notificationPhoneColumns,
            ...recipientColumns,
          };
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const columns = [
          { wch: 12 },
          { wch: 36 },
          { wch: 32 },
          { wch: 22 },
          { wch: 24 },
          { wch: 18 },
          { wch: 18 },
          { wch: 18 },
          { wch: 14 },
          { wch: 14 },
          { wch: 28 },
          { wch: 16 },
          { wch: 40 },
          { wch: 30 },
          { wch: 20 },
          ...Array.from({ length: maxDeadlineCount }, () => ({ wch: 18 })),
          { wch: 34 },
          ...Array.from({ length: maxEmailCount }, () => ({ wch: 34 })),
          { wch: 24 },
          ...Array.from({ length: maxPhoneCount }, () => ({ wch: 24 })),
        ];
        activeRecipients.forEach(() => {
          columns.push({ wch: 22 });
          columns.push({ wch: 34 });
        });
        worksheet['!cols'] = columns;

        const valueColumnIndex = 11;
        const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1');
        for (let row = range.s.r + 1; row <= range.e.r; row += 1) {
          const cellAddress = XLSX.utils.encode_cell({ c: valueColumnIndex, r: row });
          if (worksheet[cellAddress]) {
            worksheet[cellAddress].t = 'n';
            worksheet[cellAddress].z = '"R" #,##0.00';
          }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');

        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `contracts-repository-${today}.xlsx`, { compression: true });
        showToast('Contract repository exported to Excel.', 'success');
      })
      .catch(() => {
        showToast('Unable to export contracts right now.', 'error');
      })
      .finally(() => {
        setIsExporting(false);
      });
  };

  const handleImportClick = () => {
    if (isImporting) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    showToast('Preparing contract import...');

    try {
      const departments = await fetchDepartments();
      const parsedWorkbook = await parseContractsWorkbook(file, departments);

      if (parsedWorkbook.rows.length === 0) {
        showToast(parsedWorkbook.errors[0] ?? 'No valid contract rows were found in that workbook.', 'error');
        return;
      }

      const existingContractIds = new Set(contracts.map((contract) => contract.id));
      const importErrors = [...parsedWorkbook.errors];
      let createdCount = 0;
      let updatedCount = 0;

      for (const row of parsedWorkbook.rows) {
        try {
          if (row.contractId && existingContractIds.has(row.contractId)) {
            await updateContract(row.contractId, row.contract);
            updatedCount += 1;
          } else {
            await createContract(row.contract);
            createdCount += 1;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to import this row.';
          importErrors.push(`Row ${row.rowNumber}: ${message}`);
        }
      }

      await loadContracts();

      const importedCount = createdCount + updatedCount;
      if (importedCount === 0) {
        showToast(importErrors[0] ?? 'No contracts were imported from that workbook.', 'error');
        return;
      }

      if (importErrors.length > 0) {
        showToast(
          `Imported ${importedCount} contracts (${updatedCount} updated, ${createdCount} created). ${importErrors.length} row${importErrors.length === 1 ? '' : 's'} failed. ${importErrors[0]}`,
          'error'
        );
        return;
      }

      showToast(
        `Imported ${importedCount} contracts successfully (${updatedCount} updated, ${createdCount} created).`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import contracts right now.';
      showToast(message, 'error');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const openContract = (id: string) => {
    navigate(`/contracts/${id}`);
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportFile}
          />
          <button 
            onClick={() => navigate('/contracts/new')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} />
            New Contract
          </button>
          <button
            onClick={handleImportClick}
            disabled={isImporting || isExporting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Upload size={16} />
            {isImporting ? 'Importing...' : 'Import'}
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
            disabled={isExporting || isImporting}
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
                            {contract.contractType && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                  {contract.contractType}
                                </span>
                              </>
                            )}
                            {contract.portfolio && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                  {contract.portfolio}
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
                        <span>{formatContractDateRange(contract.startDate, contract.endDate)}</span>
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
                        contractStatusStyles[contract.status]
                      )}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/contracts/${contract.id}`)}
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
                <button onClick={() => openContract(activeContract.id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
                  <Eye size={16} /> View Details
                </button>
                <button onClick={() => {
                  navigate(`/contracts/${activeContract.id}/edit`);
                  closeMenu();
                }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors text-left">
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
