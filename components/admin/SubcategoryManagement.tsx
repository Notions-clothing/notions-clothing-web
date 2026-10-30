'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  UploadCloud,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Category } from '@/types/database';
import DeleteConfirmModal from './DeleteConfirmModal';

interface SubcategoryManagementProps {
  categories: Category[];
  onRefresh: () => void;
  showNotification: (text: string, type?: 'success' | 'error') => void;
  handleFileUpload: (file: File, folder?: string) => Promise<{ url: string; public_id?: string }>;
}

export default function SubcategoryManagement({
  categories,
  onRefresh,
  showNotification,
  handleFileUpload,
}: SubcategoryManagementProps) {
  // Main parent categories (categories without a parent_id)
  const mainCategories = categories.filter((c) => !c.parent_id);

  // Filter state
  const [selectedParentId, setSelectedParentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<Category> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    subcategory: Category | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    subcategory: null,
    isDeleting: false,
  });

  // All subcategories (categories with a parent_id)
  const allSubcategories = categories.filter((c) => Boolean(c.parent_id));

  // Filtered subcategories
  const filteredSubcategories = allSubcategories.filter((sub) => {
    const matchesParent = selectedParentId === 'all' || sub.parent_id === selectedParentId;
    const matchesSearch =
      !searchTerm ||
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && sub.is_published !== false) ||
      (statusFilter === 'hidden' && sub.is_published === false);

    return matchesParent && matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    const defaultParentId =
      selectedParentId !== 'all' ? selectedParentId : mainCategories[0]?.id || '';

    setEditingSubcategory({
      name: '',
      slug: '',
      parent_id: defaultParentId,
      description: '',
      image_url: '',
      sort_order: allSubcategories.length + 1,
      is_published: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (subcat: Category) => {
    setEditingSubcategory({ ...subcat });
    setShowModal(true);
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;

    if (!editingSubcategory.name?.trim()) {
      showNotification('Please enter a subcategory name', 'error');
      return;
    }

    if (!editingSubcategory.parent_id) {
      showNotification('Please select a parent category', 'error');
      return;
    }

    const slug =
      editingSubcategory.slug?.trim() ||
      editingSubcategory.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingSubcategory,
          slug,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save subcategory');
      }

      showNotification(
        editingSubcategory.id
          ? 'Subcategory updated successfully!'
          : 'Subcategory created successfully!'
      );
      setShowModal(false);
      setEditingSubcategory(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save subcategory', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (subcat: Category) => {
    try {
      const updated = { ...subcat, is_published: !subcat.is_published };
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Failed to update status');
      showNotification(`Subcategory "${subcat.name}" ${updated.is_published ? 'published' : 'hidden'}`);
      onRefresh();
    } catch (e: any) {
      showNotification(e.message || 'Failed to update subcategory', 'error');
    }
  };

  const confirmDeleteSubcategory = async () => {
    if (!deleteModalState.subcategory) return;
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/categories?id=${deleteModalState.subcategory.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subcategory');
      showNotification(`Subcategory "${deleteModalState.subcategory.name}" deleted.`);
      onRefresh();
      setDeleteModalState({ isOpen: false, subcategory: null, isDeleting: false });
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete subcategory', 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#143728]/10 text-[#143728] flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Product Subcategories
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create and organize child subcategories under each main department category.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={mainCategories.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#143728] hover:bg-[#0d261b] text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subcategory</span>
        </button>
      </div>

      {/* Warning if no main categories exist */}
      {mainCategories.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">No Main Categories Found</span>
            <p className="mt-0.5 text-xs text-amber-800">
              Subcategories must belong to a parent category. Please create at least one main category in the{' '}
              <span className="font-semibold underline">Categories</span> tab first.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar & Category Chips */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subcategory by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:border-[#143728] focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl bg-white text-gray-700 focus:border-[#143728] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {/* Parent Category Filter Tabs / Chips */}
        {mainCategories.length > 0 && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
              Parent Category:
            </span>
            <button
              type="button"
              onClick={() => setSelectedParentId('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                selectedParentId === 'all'
                  ? 'bg-[#143728] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Parents ({allSubcategories.length})
            </button>
            {mainCategories.map((cat) => {
              const count = allSubcategories.filter((s) => s.parent_id === cat.id).length;
              const isSelected = selectedParentId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedParentId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#143728] text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Subcategories Grid */}
      {filteredSubcategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <FolderTree className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Subcategories Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No subcategories match your search query.'
              : selectedParentId !== 'all'
              ? `No subcategories configured under the selected category yet.`
              : 'Get started by creating your first subcategory under a main department.'}
          </p>
          {mainCategories.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#143728] text-white text-xs font-semibold rounded-xl hover:bg-[#0e271c] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Subcategory</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSubcategories.map((subcat) => {
            const parentCat = mainCategories.find((c) => c.id === subcat.parent_id);
            const isUploadedImg = Boolean(subcat.image_url && subcat.image_url.startsWith('http'));

            return (
              <div
                key={subcat.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 p-4 flex flex-col justify-between transition shadow-2xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Thumbnail Image */}
                    <div className="relative w-14 h-14 rounded-xl bg-[#F3EFE6] border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {subcat.image_url ? (
                        <Image
                          src={subcat.image_url}
                          alt={subcat.name}
                          fill
                          sizes="56px"
                          className={isUploadedImg ? 'object-cover' : 'object-contain p-1.5'}
                        />
                      ) : (
                        <FolderTree className="w-6 h-6 text-[#143728]/40" />
                      )}
                    </div>

                    {/* Status & Sort Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(subcat)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition ${
                          subcat.is_published !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        title="Click to toggle status"
                      >
                        {subcat.is_published !== false ? 'Published' : 'Hidden'}
                      </button>
                      <span className="text-[10px] font-semibold text-gray-400">
                        Order #{subcat.sort_order}
                      </span>
                    </div>
                  </div>

                  {/* Subcategory Details */}
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#143728] transition truncate">
                    {subcat.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                    /category/{subcat.slug}
                  </p>

                  {/* Parent Badge */}
                  <div className="mt-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#143728]/10 text-[#143728]">
                      <Layers className="w-3 h-3" />
                      <span>{parentCat ? parentCat.name : 'Unknown Parent'}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(subcat)}
                    className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-[#143728] hover:text-white text-gray-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteModalState({
                        isOpen: true,
                        subcategory: subcat,
                        isDeleting: false,
                      })
                    }
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Delete Subcategory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subcategory Modal */}
      {showModal && editingSubcategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#143728]" />
                <h3 className="text-lg font-bold text-gray-900">
                  {editingSubcategory.id ? 'Edit Subcategory' : 'Add New Subcategory'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingSubcategory(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="space-y-4 text-xs">
              {/* Parent Category Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingSubcategory.parent_id || ''}
                  onChange={(e) =>
                    setEditingSubcategory({ ...editingSubcategory, parent_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white focus:border-[#143728] focus:outline-none"
                >
                  <option value="">-- Select Parent Category --</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Every subcategory must belong to a parent department.
                </p>
              </div>

              {/* Subcategory Name */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linen Shirts, Sneakers, Casual Belts"
                  value={editingSubcategory.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '');
                    setEditingSubcategory({
                      ...editingSubcategory,
                      name,
                      slug: editingSubcategory.id ? editingSubcategory.slug : autoSlug,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                >
                </input>
              </div>

              {/* Subcategory Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-gray-700">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = (editingSubcategory.name || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      setEditingSubcategory({ ...editingSubcategory, slug: generated });
                    }}
                    className="text-[10px] text-[#143728] hover:underline font-bold cursor-pointer"
                  >
                    Auto-generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. linen-shirts"
                  value={editingSubcategory.slug || ''}
                  onChange={(e) =>
                    setEditingSubcategory({ ...editingSubcategory, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl font-mono focus:border-[#143728] focus:outline-none"
                />
              </div>

              {/* Display Sort Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingSubcategory.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingSubcategory({
                        ...editingSubcategory,
                        sort_order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={editingSubcategory.is_published !== false}
                      onChange={(e) =>
                        setEditingSubcategory({
                          ...editingSubcategory,
                          is_published: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143728]" />
                    <span className="ml-2 text-xs font-medium text-gray-700">
                      {editingSubcategory.is_published !== false ? 'Published' : 'Hidden'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Subcategory Image Upload */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Subcategory Photograph / Icon (Optional)
                </label>
                <div className="flex items-center gap-3">
                  {editingSubcategory.image_url ? (
                    <div className="relative w-14 h-14 rounded-xl bg-[#F3EFE6] border border-gray-300 overflow-hidden shrink-0">
                      <Image
                        src={editingSubcategory.image_url}
                        alt="Subcategory"
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 hover:border-[#143728] rounded-xl cursor-pointer transition text-gray-700 font-semibold">
                    <UploadCloud className="w-4 h-4 text-[#143728]" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        try {
                          const uploaded = await handleFileUpload(file, 'notions/categories');
                          setEditingSubcategory({
                            ...editingSubcategory,
                            image_url: uploaded.url,
                            image_public_id: uploaded.public_id,
                          });
                          showNotification('Subcategory image uploaded!');
                        } catch (err: any) {
                          showNotification(err.message || 'Upload failed', 'error');
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                    />
                  </label>

                  {editingSubcategory.image_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSubcategory({
                          ...editingSubcategory,
                          image_url: '',
                          image_public_id: '',
                        })
                      }
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubcategory(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#143728] hover:bg-[#0d261b] text-white font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingSubcategory.id
                    ? 'Save Changes'
                    : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Delete Confirmation UI */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Subcategory"
        itemName={deleteModalState.subcategory?.name}
        message="This subcategory will be permanently removed. Products currently assigned to this subcategory will retain their main category."
        isDeleting={deleteModalState.isDeleting}
        onClose={() => setDeleteModalState({ isOpen: false, subcategory: null, isDeleting: false })}
        onConfirm={confirmDeleteSubcategory}
      />
    </div>
  );
}

