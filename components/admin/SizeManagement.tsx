'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Ruler,
  AlertCircle,
  ArrowUpDown,
  Filter,
  Search,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { Category, CategorySize } from '@/types/database';
import DeleteConfirmModal from './DeleteConfirmModal';

interface SizeManagementProps {
  categories: Category[];
  sizes: CategorySize[];
  onRefresh: () => void;
  showNotification: (text: string, type?: 'success' | 'error') => void;
}

export default function SizeManagement({
  categories,
  sizes,
  onRefresh,
  showNotification,
}: SizeManagementProps) {
  // Strictly filter to Main Categories only (exclude subcategories with parent_id)
  const mainCategories = categories.filter((c) => !c.parent_id);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    mainCategories[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editingSize, setEditingSize] = useState<Partial<CategorySize> | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    size: CategorySize | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    size: null,
    isDeleting: false,
  });

  const selectedCategory = mainCategories.find((c) => c.id === selectedCategoryId) || categories.find((c) => c.id === selectedCategoryId);

  // Filter sizes for the chosen category and search/status
  const categorySizes = sizes.filter((s) => {
    const matchesCategory = selectedCategoryId ? s.category_id === selectedCategoryId : true;
    if (!matchesCategory) return false;

    if (statusFilter === 'active' && s.is_active === false) return false;
    if (statusFilter === 'inactive' && s.is_active !== false) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      if (!s.name.toLowerCase().includes(q)) return false;
    }

    return true;
  });

  const handleOpenAdd = () => {
    const nextOrder = sizes.filter((s) => s.category_id === selectedCategoryId).length + 1;
    setEditingSize({
      category_id: selectedCategoryId || (categories[0]?.id || ''),
      name: '',
      sort_order: nextOrder,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (size: CategorySize) => {
    setEditingSize({ ...size });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSize || !editingSize.name?.trim() || !editingSize.category_id) {
      showNotification('Size name and category selection are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === editingSize.category_id);
      const payload = {
        ...editingSize,
        name: editingSize.name.trim(),
        category_name: cat ? cat.name : editingSize.category_name,
        sort_order: Number(editingSize.sort_order) || 1,
      };

      const res = await fetch('/api/admin/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save size');
      }

      showNotification(
        editingSize.id ? 'Size updated successfully!' : 'Size added successfully!'
      );
      setShowModal(false);
      setEditingSize(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (size: CategorySize) => {
    setDeleteModalState({
      isOpen: true,
      size,
      isDeleting: false,
    });
  };

  const confirmDeleteSize = async () => {
    if (!deleteModalState.size) return;
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/sizes?id=${deleteModalState.size.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete size');
      }

      showNotification(`Size "${deleteModalState.size.name}" deleted.`);
      onRefresh();
      setDeleteModalState({ isOpen: false, size: null, isDeleting: false });
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete size', 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleToggleActive = async (size: CategorySize) => {
    try {
      const updated = { ...size, is_active: !size.is_active };
      const res = await fetch('/api/admin/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Failed to update size status');

      showNotification(
        `Size "${size.name}" ${updated.is_active ? 'activated' : 'deactivated'}.`
      );
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-[#143728]/10 text-[#143728] rounded-lg">
              <Ruler className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Product Sizes</h2>
            <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
              {sizes.length} Total Sizes
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Configure category-specific sizing conventions (Apparel, Footwear, Accessories, etc.)
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#143728] hover:bg-[#0e271c] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Size</span>
        </button>
      </div>

      {/* Category Selection Filter & Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Dropdown (Primary) */}
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Category To View & Manage Sizes
            </label>
            <div className="relative">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 hover:bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:outline-none focus:border-[#143728] cursor-pointer transition shadow-2xs"
              >
                {mainCategories.map((c) => {
                  const count = sizes.filter((s) => s.category_id === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count} sizes configured)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Stats & Active Filters */}
          <div className="flex flex-wrap items-center gap-2 md:self-end">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 font-bold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-gray-600 font-bold shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#143728] w-36"
              />
            </div>
          </div>
        </div>

        {/* Quick Category Chips for Fast Switching */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            Categories:
          </span>
          {mainCategories.map((c) => {
            const isSelected = selectedCategoryId === c.id;
            const sizeCount = sizes.filter((s) => s.category_id === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategoryId(c.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#143728] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {sizeCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes List Table / Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {selectedCategory?.name || 'Category'} Sizing Table
            </h3>
            <p className="text-xs text-gray-500">
              These sizes will appear exclusively when adding or editing products in this category.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {categorySizes.length} {categorySizes.length === 1 ? 'Size' : 'Sizes'}
          </span>
        </div>

        {categorySizes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
              <Ruler className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">
              No Sizes Configured for {selectedCategory?.name || 'this category'}
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-5 leading-relaxed">
              Every category requires its own specific sizing system (e.g. S, M, L for Shirts; 7, 8, 9 for Footwear; One Size for Accessories).
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#143728] hover:bg-[#0e271c] text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Size for {selectedCategory?.name}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-20 text-center">Order</th>
                  <th className="py-3 px-4">Size Name / Label</th>
                  <th className="py-3 px-4">Assigned Category</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categorySizes.map((size) => (
                  <tr key={size.id} className="hover:bg-gray-50/70 transition">
                    {/* Sort Order */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-mono font-bold text-xs">
                        {size.sort_order ?? 1}
                      </span>
                    </td>

                    {/* Size Label */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="min-w-9 h-8 px-2.5 rounded-lg border border-gray-300 bg-white font-bold text-gray-900 inline-flex items-center justify-center text-xs shadow-2xs">
                          {size.name}
                        </span>
                        <div>
                          <span className="font-bold text-gray-900 block text-xs">{size.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {size.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#143728] font-semibold text-[11px] border border-emerald-100">
                        <Layers className="w-3 h-3" />
                        {size.category_name || selectedCategory?.name || 'Assigned'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(size)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                          size.is_active !== false
                            ? 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            size.is_active !== false ? 'bg-emerald-600' : 'bg-gray-400'
                          }`}
                        />
                        {size.is_active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(size)}
                          className="p-1.5 text-gray-500 hover:text-[#143728] hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          title="Edit Size"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(size)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Size"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Size Modal */}
      {showModal && editingSize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-[#143728]/10 text-[#143728] rounded-lg">
                  <Ruler className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  {editingSize.id ? 'Edit Size' : 'Add New Category Size'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Category selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Category *</label>
                <select
                  required
                  value={editingSize.category_id || ''}
                  onChange={(e) =>
                    setEditingSize({ ...editingSize, category_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white font-medium focus:outline-none focus:border-[#143728]"
                >
                  <option value="">Select Category</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Sizes are strictly scoped to their category and will only appear for products in this category.
                </p>
              </div>

              {/* Size Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Size Name / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter size name"
                  value={editingSize.name || ''}
                  onChange={(e) =>
                    setEditingSize({ ...editingSize, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-bold focus:outline-none focus:border-[#143728]"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  min="1"
                  value={editingSize.sort_order ?? 1}
                  onChange={(e) =>
                    setEditingSize({
                      ...editingSize,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl font-mono focus:outline-none focus:border-[#143728]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Controls the sequence in which sizes appear on product cards and selectors.
                </p>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="font-bold text-gray-800 block text-xs">Active Size</span>
                  <span className="text-[10px] text-gray-500">
                    Inactive sizes will be hidden from product creators and customers.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSize.is_active !== false}
                    onChange={(e) =>
                      setEditingSize({ ...editingSize, is_active: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143728]"></div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#143728] hover:bg-[#0e271c] text-white font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSize.id ? 'Update Size' : 'Create Size'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Size"
        itemName={deleteModalState.size?.name}
        message={`This size will be deleted from the "${selectedCategory?.name || 'selected'}" category. Products will no longer see this size option.`}
        isDeleting={deleteModalState.isDeleting}
        onClose={() => setDeleteModalState({ isOpen: false, size: null, isDeleting: false })}
        onConfirm={confirmDeleteSize}
      />
    </div>
  );
}

