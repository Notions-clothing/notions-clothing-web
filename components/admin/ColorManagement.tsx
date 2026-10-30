'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Palette, AlertCircle } from 'lucide-react';
import { ProductColor } from '@/types/database';
import DeleteConfirmModal from './DeleteConfirmModal';

interface ColorManagementProps {
  colors: ProductColor[];
  onRefresh: () => void;
  showNotification: (text: string, type?: 'success' | 'error') => void;
}

export default function ColorManagement({
  colors,
  onRefresh,
  showNotification,
}: ColorManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingColor, setEditingColor] = useState<Partial<ProductColor> | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    color: ProductColor | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    color: null,
    isDeleting: false,
  });

  const filteredColors = colors.filter((c) => {
    if (filter === 'active') return c.is_active !== false;
    if (filter === 'inactive') return c.is_active === false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingColor({
      name: '',
      hex: '#143728',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (color: ProductColor) => {
    setEditingColor({ ...color });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColor || !editingColor.name || !editingColor.hex) {
      showNotification('Color name and HEX value are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingColor),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save color');
      }

      showNotification(
        editingColor.id ? 'Color updated successfully!' : 'Color created successfully!'
      );
      setShowModal(false);
      setEditingColor(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (color: ProductColor) => {
    setDeleteModalState({
      isOpen: true,
      color,
      isDeleting: false,
    });
  };

  const confirmDeleteColor = async () => {
    if (!deleteModalState.color) return;
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/colors?id=${deleteModalState.color.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete color');
      }

      showNotification(`Color "${deleteModalState.color.name}" deleted.`);
      onRefresh();
      setDeleteModalState({ isOpen: false, color: null, isDeleting: false });
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete color', 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleToggleActive = async (color: ProductColor) => {
    try {
      const updated = { ...color, is_active: !color.is_active };
      const res = await fetch('/api/admin/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Failed to update status');

      showNotification(`Color "${color.name}" ${updated.is_active ? 'activated' : 'deactivated'}.`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#143728]" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Product Colors Management ({colors.length})
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Define and manage custom colors with hex swatches. Colors configured here dynamically populate product variant forms.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#143728] hover:bg-[#0d261b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Color</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'active', 'inactive'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
              filter === tab
                ? 'bg-[#143728] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab} Colors ({tab === 'all' ? colors.length : colors.filter((c) => (tab === 'active' ? c.is_active !== false : c.is_active === false)).length})
          </button>
        ))}
      </div>

      {/* Colors Grid */}
      {filteredColors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Palette className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">No Product Colors Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {filter === 'all'
              ? 'Click "Add New Color" above to define color swatches for your product catalogue.'
              : `No colors currently marked as ${filter}.`}
          </p>
          {filter === 'all' && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-[#143728] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Color</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredColors.map((color) => {
            const isActive = color.is_active !== false;
            return (
              <div
                key={color.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Color Swatch Circle */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl border border-black/15 shadow-inner flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{color.name}</h4>
                        <span className="font-mono text-xs text-gray-500 uppercase">
                          {color.hex}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(color)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(color)}
                    className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-[#143728] hover:text-white text-gray-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(color)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Color"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Color Modal */}
      {showModal && editingColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#143728]" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {editingColor.id ? 'Edit Product Color' : 'Add New Product Color'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingColor(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Color Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Color Name * <span className="text-gray-400 font-normal">(e.g. Royal Blue, Charcoal Grey)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter color name"
                  value={editingColor.name || ''}
                  onChange={(e) => setEditingColor({ ...editingColor, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                />
              </div>

              {/* Color Picker & HEX Code */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Select Color Swatch & HEX Value *
                </label>
                <div className="flex items-center gap-3">
                  {/* Interactive Color Picker Input */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-300 shrink-0 cursor-pointer shadow-inner">
                    <input
                      type="color"
                      value={editingColor.hex || '#143728'}
                      onChange={(e) => setEditingColor({ ...editingColor, hex: e.target.value.toUpperCase() })}
                      className="absolute -inset-2 w-16 h-16 cursor-pointer border-0 p-0"
                    />
                  </div>

                  {/* HEX text input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Enter hex code"
                      value={editingColor.hex || ''}
                      onChange={(e) => setEditingColor({ ...editingColor, hex: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 text-sm font-mono uppercase border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Banner */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium">Live Swatch Preview:</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full border border-black/15 shadow-2xs inline-block"
                    style={{ backgroundColor: editingColor.hex || '#000000' }}
                  />
                  <span className="text-xs font-bold text-gray-900">
                    {editingColor.name || 'Color Name'} ({editingColor.hex || '#000000'})
                  </span>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-semibold text-gray-700 block">Active Status</span>
                  <span className="text-gray-500 text-[11px]">
                    Only active colors appear as selectable options in product forms.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingColor.is_active !== false}
                    onChange={(e) =>
                      setEditingColor({ ...editingColor, is_active: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143728]" />
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingColor(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold cursor-pointer hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#143728] hover:bg-[#0d261b] text-white font-semibold transition cursor-pointer disabled:opacity-70"
                >
                  {saving ? 'Saving...' : editingColor.id ? 'Save Color' : 'Create Color'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Color"
        itemName={deleteModalState.color ? `${deleteModalState.color.name} (${deleteModalState.color.hex})` : ''}
        message="Are you sure you want to delete this color? Products using this color will no longer have it available in new edits."
        isDeleting={deleteModalState.isDeleting}
        onClose={() => setDeleteModalState({ isOpen: false, color: null, isDeleting: false })}
        onConfirm={confirmDeleteColor}
      />
    </div>
  );
}

