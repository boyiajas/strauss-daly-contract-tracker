import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Edit2, Plus, RefreshCw, Save, Search } from 'lucide-react';
import { useToast } from '../App';
import { createDepartment, fetchDepartments, updateDepartment } from '../lib/departments';
import { Department } from '../types';

export function DepartmentManagement() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    fetchDepartments()
      .then((data) => {
        if (!isActive) return;
        setDepartments(data);
        setLoadError(null);
      })
      .catch(() => {
        if (!isActive) return;
        setLoadError('Unable to load departments.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) =>
      department.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  const resetForm = () => {
    setEditingDepartment(null);
    setName('');
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setName(department.name);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast('Department name is required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingDepartment) {
        const updated = await updateDepartment(editingDepartment.id, trimmedName);
        setDepartments((prev) =>
          prev.map((department) => (department.id === updated.id ? updated : department))
        );
        showToast('Department updated successfully.', 'success');
      } else {
        const created = await createDepartment(trimmedName);
        setDepartments((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        showToast('Department created successfully.', 'success');
      }
      resetForm();
    } catch (error) {
      showToast(editingDepartment ? 'Unable to update department.' : 'Unable to create department.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const emptyMessage = isLoading
    ? 'Loading departments...'
    : loadError
      ? loadError
      : filteredDepartments.length === 0
        ? searchQuery
          ? 'No departments match your search.'
          : 'No departments configured yet.'
        : null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Department Management</h2>
          <p className="text-slate-500 text-sm">Create and maintain department options used across the tracker.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emptyMessage ? (
              <div className="col-span-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              filteredDepartments.map((department) => (
                <div key={department.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{department.name}</p>
                        <p className="text-xs text-slate-500">Available for contract assignment</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(department)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingDepartment ? 'Update Department' : 'Add Department'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {editingDepartment ? 'Rename an existing department.' : 'Create a new department for contract assignment.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Conveyancing"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={18} className="animate-spin" /> : editingDepartment ? <Save size={18} /> : <Plus size={18} />}
                {editingDepartment ? 'Update' : 'Add Department'}
              </button>
              {editingDepartment && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
