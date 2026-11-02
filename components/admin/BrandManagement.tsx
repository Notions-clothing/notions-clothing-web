'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  UploadCloud,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Search,
  Package,
} from 'lucide-react';
import { Brand, Product } from '@/types/database';
import DeleteConfirmModal from './DeleteConfirmModal';

interface BrandManagementProps {
  brands: Brand[];
  products: Product[];
  onRefresh: () => void;
  showNotification: (text: string, type?: 'success' | 'error') => void;
  handleFileUpload: (file: File, folder?: string) => Promise<any>;
}

export default function BrandManagement({
  brands,
  products,
  onRefresh,
  showNotification,
  handleFileUpload,
}: BrandManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    brand: Brand | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    brand: null,
    isDeleting: false,
  });

  // Filtered brands
  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return b.is_active !== false;
    if (statusFilter === 'disabled') return b.is_active === false;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingBrand({
      name: '',
      slug: '',
      description: '',
      logo_url: '',
      logo_public_id: '',
      banner_url: '',
      banner_public_id: '',
      website_url: '',
      is_active: true,
      sort_order: brands.length + 1,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand({ ...brand });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand || !editingBrand.name?.trim()) {
      showNotification('Brand name is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBrand),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save brand');

      showNotification(
        editingBrand.id ? `Updated brand "${editingBrand.name}"` : `Created brand "${editingBrand.name}"`
      );
      setShowModal(false);
      setEditingBrand(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      const updated = { ...brand, is_active: !brand.is_active };
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Failed to update brand status');
      showNotification(`Brand "${brand.name}" is now ${updated.is_active ? 'Active' : 'Disabled'}.`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const confirmDeleteBrand = async () => {
    if (!deleteModalState.brand) return;
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const res = await fetch(`/api/admin/brands?id=${deleteModalState.brand.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete brand');

      showNotification(`Brand "${deleteModalState.brand.name}" deleted successfully.`);
      onRefresh();
      setDeleteModalState({ isOpen: false, brand: null, isDeleting: false });
    } catch (err: any) {
      showNotification(err.message, 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner / Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#143728]" />
            <span>Brand Management</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create and manage clothing brands, logos, banners, and storefront showcases.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#143728] hover:bg-[#0d261b] text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands by name or slug..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-[#143728] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(['all', 'active', 'disabled'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setStatusFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                statusFilter === mode
                  ? 'bg-[#143728] text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#143728] flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">No Brands Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
            {searchQuery
              ? `No brands match "${searchQuery}". Try a different search.`
              : 'Add your first brand to assign clothing products, logos, and custom editorial pages.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#143728] text-white text-xs font-semibold rounded-xl hover:bg-[#0d261b] transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Brand</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBrands.map((b) => {
            const brandProductCount = products.filter(
              (p) => p.brand_id === b.id || (p.brand_slug && p.brand_slug.toLowerCase() === b.slug.toLowerCase())
            ).length;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-gray-300 transition group"
              >
                {/* Brand Banner Preview */}
                <div className="relative h-28 w-full bg-gradient-to-r from-stone-200 to-amber-100/60 overflow-hidden">
                  {b.banner_url ? (
                    <Image
                      src={b.banner_url}
                      alt={`${b.name} banner`}
                      fill
                      className="object-cover group-hover:scale-102 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs italic">
                      No banner image
                    </div>
                  )}

                  {/* Status Pill */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-2xs ${
                        b.is_active !== false
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-700 text-gray-200'
                      }`}
                    >
                      {b.is_active !== false ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Brand Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#143728] transition truncate">
                        {b.name}
                      </h3>
                      <Link
                        href={`/brands/${b.slug}`}
                        target="_blank"
                        className="text-[11px] font-semibold text-[#143728] hover:underline flex items-center gap-1 shrink-0"
                        title="Open Brand Page"
                      >
                        <span>Live Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {b.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Info Row: Product Count & Sort Order */}
                  <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200/80">
                      <Package className="w-3.5 h-3.5 text-gray-500" />
                      <span>{brandProductCount} Products</span>
                    </span>

                    <span className="text-[11px] text-gray-400">
                      Sort: #{b.sort_order ?? 1}
                    </span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(b)}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    {b.is_active !== false ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                        <span>Disable</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Enable</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 text-gray-600 hover:text-[#143728] hover:bg-white rounded-lg transition cursor-pointer"
                      title="Edit Brand"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteModalState({
                          isOpen: true,
                          brand: b,
                          isDeleting: false,
                        })
                      }
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================
          ADD / EDIT BRAND MODAL
      ==================================================== */}
      {showModal && editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBrand.id ? 'Edit Brand' : 'Add New Brand'}
                </h3>
                <p className="text-xs text-gray-500">
                  Set brand name, header banner image, and storefront visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingBrand(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Brand Name (Slug is generated and kept hidden) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter brand name"
                  value={editingBrand.name || ''}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    const autoSlug = nameVal
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');

                    setEditingBrand({
                      ...editingBrand,
                      name: nameVal,
                      slug: autoSlug,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                />
                <input type="hidden" value={editingBrand.slug || ''} />
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Brand Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter brand description"
                  value={editingBrand.description || ''}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                />
              </div>

              {/* Brand Cover Image Upload */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <label className="block font-bold text-gray-800 text-xs uppercase tracking-wider">
                  Brand Cover Image
                </label>
                <p className="text-[11px] text-gray-500">
                  Cover image displayed at the top banner of the brand's dedicated storefront page (recommended 1200 × 400 px).
                </p>

                <div className="flex flex-col gap-2.5 pt-1">
                  {editingBrand.banner_url ? (
                    <div className="relative w-full h-28 rounded-xl bg-white border border-gray-300 overflow-hidden shadow-2xs group">
                      <Image
                        src={editingBrand.banner_url}
                        alt="Cover Image Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingBrand({
                            ...editingBrand,
                            banner_url: '',
                            banner_public_id: '',
                          })
                        }
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Remove Cover Image"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  ) : null}

                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition self-start">
                    <UploadCloud className="w-4 h-4 text-gray-500" />
                    <span>{uploadingBanner ? 'Uploading Cover Image...' : 'Upload Cover Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingBanner}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploadingBanner(true);
                          const uploaded = await handleFileUpload(file, 'notions/brands/banners');
                          setEditingBrand((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  banner_url: uploaded.url,
                                  banner_public_id: uploaded.public_id,
                                }
                              : null
                          );
                          showNotification('Brand cover image uploaded successfully!');
                        } catch (err: any) {
                          showNotification(err.message || 'Failed to upload cover image', 'error');
                        } finally {
                          setUploadingBanner(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Display Sort Order */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Display Sort Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingBrand.sort_order ?? 1}
                  onChange={(e) =>
                    setEditingBrand({
                      ...editingBrand,
                      sort_order: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-full sm:w-48 px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-[#143728] focus:outline-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="brand_is_active"
                  checked={editingBrand.is_active !== false}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-[#143728] rounded border-gray-300 focus:ring-[#143728]"
                />
                <label htmlFor="brand_is_active" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Brand is Active & Published on Storefront
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBrand(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingBanner}
                  className="px-5 py-2 bg-[#143728] text-white rounded-xl text-xs font-semibold hover:bg-[#0d261b] transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingBrand.id ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Brand"
        itemName={deleteModalState.brand?.name || 'this brand'}
        message="Deleting this brand will remove it from the brand registry. Existing products assigned to this brand will remain in your catalog with their brand association cleared."
        isDeleting={deleteModalState.isDeleting}
        onConfirm={confirmDeleteBrand}
        onCancel={() =>
          setDeleteModalState({ isOpen: false, brand: null, isDeleting: false })
        }
      />
    </div>
  );
}

