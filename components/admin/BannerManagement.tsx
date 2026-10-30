'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, UploadCloud, X, ArrowRight, Eye, EyeOff, Layers, Package, Link as LinkIcon } from 'lucide-react';
import { Banner, Category, Product } from '@/types/database';
import DeleteConfirmModal from './DeleteConfirmModal';

interface BannerManagementProps {
  banners: Banner[];
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
  showNotification: (text: string, type?: 'success' | 'error') => void;
  handleFileUpload: (file: File, folder?: string) => Promise<any>;
}

export default function BannerManagement({
  banners,
  categories,
  products,
  onRefresh,
  showNotification,
  handleFileUpload,
}: BannerManagementProps) {
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'hero' | 'editorial'>('all');

  // Filter state for Product Selection inside Destination picker
  const [selectedProductCategoryId, setSelectedProductCategoryId] = useState<string>('');

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    banner: Banner | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    banner: null,
    isDeleting: false,
  });

  const filteredBanners = banners.filter((b) => {
    if (sectionFilter === 'hero') return b.section === 'hero';
    if (sectionFilter === 'editorial') return b.section !== 'hero';
    return true;
  });

  const sectionLabels: Record<string, string> = {
    hero: 'Hero Slider Banner',
    essentials: 'Modern Essentials Feature Card',
    footwear: 'Footwear Editorial Banner',
    accessories: 'Accessories Editorial Banner',
    new_arrivals: 'New Arrivals Editorial Banner',
  };

  const handleOpenAdd = () => {
    setEditingBanner({
      section: 'hero',
      title: '',
      subtitle: '',
      description: '',
      cta_label: 'Shop Now',
      cta_url: '/',
      destination_type: 'custom',
      destination_id: null,
      sort_order: banners.length + 1,
      is_published: true,
    });
    setSelectedProductCategoryId('');
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner({ ...banner });
    // If destination type is product, find the product's category to prefill dropdown
    if (banner.destination_type === 'product' && banner.destination_id) {
      const prod = products.find((p) => p.id === banner.destination_id);
      if (prod) {
        setSelectedProductCategoryId(prod.category_id);
      }
    } else {
      setSelectedProductCategoryId('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save banner');
      }

      showNotification(editingBanner.id ? 'Banner updated successfully!' : 'Banner created successfully!');
      setEditingBanner(null);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (banner: Banner) => {
    setDeleteModalState({
      isOpen: true,
      banner,
      isDeleting: false,
    });
  };

  const confirmDeleteBanner = async () => {
    if (!deleteModalState.banner) return;
    setDeleteModalState((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(`/api/admin/banners?id=${deleteModalState.banner.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete banner');
      showNotification('Banner deleted.');
      onRefresh();
      setDeleteModalState({ isOpen: false, banner: null, isDeleting: false });
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete banner', 'error');
      setDeleteModalState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleTogglePublish = async (banner: Banner) => {
    try {
      const updated = { ...banner, is_published: !banner.is_published };
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update banner');
      showNotification(`Banner ${updated.is_published ? 'enabled' : 'disabled'}.`);
      onRefresh();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Products belonging to currently selected category in banner destination modal
  const categoryProducts = selectedProductCategoryId
    ? products.filter(
        (p) =>
          p.category_id === selectedProductCategoryId ||
          p.category_slug === selectedProductCategoryId ||
          p.subcategory_id === selectedProductCategoryId
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Homepage Banners & Hero Slider Management ({banners.length})
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage multiple continuous rotating hero banners, configure destination routing (Category, Product, Custom URL), and adjust display ordering.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#143728] hover:bg-[#0d261b] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'hero', 'editorial'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSectionFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
              sectionFilter === tab
                ? 'bg-[#143728] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab === 'all'
              ? `All Banners (${banners.length})`
              : tab === 'hero'
              ? `Hero Slider (${banners.filter((b) => b.section === 'hero').length})`
              : `Editorial Cards (${banners.filter((b) => b.section !== 'hero').length})`}
          </button>
        ))}
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredBanners.map((b) => {
          const isHero = b.section === 'hero';
          return (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs flex flex-col justify-between ${
                isHero ? 'md:col-span-2' : ''
              }`}
            >
              <div>
                {/* Banner Visual Preview */}
                <div
                  className={`relative w-full bg-gray-100 border-b border-gray-100 overflow-hidden ${
                    isHero ? 'h-52 sm:h-64' : 'h-44'
                  }`}
                >
                  <Image
                    src={b.image_url || '/logo.png'}
                    alt={b.title || 'Banner'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-gray-900/85 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg">
                      {sectionLabels[b.section] || b.section}
                    </span>
                    <span className="bg-white/90 text-gray-800 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                      Order: #{b.sort_order}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 ${
                        b.is_published
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-800/80 text-gray-200'
                      }`}
                    >
                      {b.is_published ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {b.subtitle && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#143728]">
                          {b.subtitle}
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                        {b.title}
                      </h3>
                      {b.description && (
                        <p className="text-xs text-gray-500 mt-1">{b.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">
                      Button: &ldquo;{b.cta_label || 'Shop Now'}&rdquo;
                    </span>
                    <span>→</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                      {b.destination_type ? `[${b.destination_type}] ` : ''}
                      {b.cta_url}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(b)}
                  className="flex-1 py-2.5 px-4 bg-[#143728] hover:bg-[#0d261b] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Banner & Destination</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b)}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-xl w-full p-6 shadow-2xl font-sans max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingBanner.id ? 'Edit Banner' : 'Create New Banner'}
                </h3>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  Section: {editingBanner.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Section & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Target Section *</label>
                  <select
                    value={editingBanner.section || 'hero'}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        section: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl bg-white focus:border-[#143728] focus:outline-none"
                  >
                    <option value="hero">Hero Slider (Homepage Top)</option>
                    <option value="essentials">Modern Essentials Feature Card</option>
                    <option value="footwear">Footwear Editorial</option>
                    <option value="accessories">Accessories Editorial</option>
                    <option value="new_arrivals">New Arrivals Editorial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={editingBanner.sort_order ?? 1}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        sort_order: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Banner Visual Upload */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                <label className="block font-bold text-gray-800">Banner Photograph / Visual</label>
                {editingBanner.image_url && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden bg-white border border-gray-200">
                    <Image
                      src={editingBanner.image_url}
                      alt="Banner visual"
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-gray-300 hover:border-[#143728] rounded-xl cursor-pointer transition">
                  <UploadCloud className="w-4 h-4 text-[#143728]" />
                  <span className="font-semibold text-gray-700">
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Banner Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      try {
                        const uploaded = await handleFileUpload(file, 'notions/banners');
                        setEditingBanner({
                          ...editingBanner,
                          image_url: uploaded.url,
                          image_public_id: uploaded.public_id,
                        });
                        showNotification('Banner image uploaded!');
                      } catch (err: any) {
                        showNotification(err.message, 'error');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Headline & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Headline / Title *</label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subtitle / Tag</label>
                  <input
                    type="text"
                    value={editingBanner.subtitle || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Supporting Text / Description</label>
                <input
                  type="text"
                  value={editingBanner.description || ''}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              {/* CTA Button Label */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={editingBanner.cta_label || ''}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, cta_label: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl"
                />
              </div>

              {/* ====================================================
                  DESTINATION CONFIGURATION (Phase 2 Requirement)
              ==================================================== */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                <label className="block font-bold text-gray-900">
                  Banner Click Destination
                </label>

                {/* 3 Destination Type Radio Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'custom', label: 'Custom URL', icon: LinkIcon },
                    { id: 'category', label: 'Category', icon: Layers },
                    { id: 'product', label: 'Product', icon: Package },
                  ].map((type) => {
                    const Icon = type.icon;
                    const isSelected = (editingBanner.destination_type || 'custom') === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setEditingBanner({
                            ...editingBanner,
                            destination_type: type.id as any,
                            destination_id: null,
                            cta_url: type.id === 'custom' ? (editingBanner.cta_url || '/') : '',
                          });
                          setSelectedProductCategoryId('');
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#143728] text-white border-[#143728] shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Destination Selector: Category */}
                {editingBanner.destination_type === 'category' && (
                  <div className="space-y-1">
                    <label className="block text-gray-700 font-semibold">
                      Select Target Category
                    </label>
                    <select
                      value={editingBanner.destination_id || ''}
                      onChange={(e) => {
                        const catId = e.target.value;
                        const cat = categories.find((c) => c.id === catId);
                        setEditingBanner({
                          ...editingBanner,
                          destination_id: catId,
                          cta_url: cat ? `/category/${cat.slug}` : '/',
                        });
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl"
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Destination Selector: Product (Category first, then Product) */}
                {editingBanner.destination_type === 'product' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        1. Select Product Category
                      </label>
                      <select
                        value={selectedProductCategoryId}
                        onChange={(e) => {
                          setSelectedProductCategoryId(e.target.value);
                          setEditingBanner({
                            ...editingBanner,
                            destination_id: null,
                            cta_url: '',
                          });
                        }}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl"
                      >
                        <option value="">-- Choose Category to Load Products --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProductCategoryId && (
                      <div>
                        <label className="block text-gray-700 font-semibold mb-1">
                          2. Select Target Product
                        </label>
                        <select
                          value={editingBanner.destination_id || ''}
                          onChange={(e) => {
                            const prodId = e.target.value;
                            const prod = products.find((p) => p.id === prodId);
                            setEditingBanner({
                              ...editingBanner,
                              destination_id: prodId,
                              cta_url: prod ? `/product/${prod.slug}` : '/',
                            });
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl"
                        >
                          <option value="">-- Select Product --</option>
                          {categoryProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₹{p.price})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Destination Selector: Custom URL */}
                {editingBanner.destination_type === 'custom' && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      Enter Custom URL / Path
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /category/men or https://..."
                      value={editingBanner.cta_url || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, cta_url: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl font-mono"
                    />
                  </div>
                )}

                {/* Final Resolved URL Preview */}
                <div className="pt-1 text-[11px] text-gray-600 flex items-center gap-1.5">
                  <span className="font-semibold text-gray-800">Final Navigation URL:</span>
                  <span className="font-mono text-[#143728] font-bold">
                    {editingBanner.cta_url || '(Not configured)'}
                  </span>
                </div>
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-semibold text-gray-700 block">Published / Active</span>
                  <span className="text-gray-500 text-[11px]">
                    Only published banners appear in the storefront slider and promotional rows.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBanner.is_published !== false}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, is_published: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143728]" />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold cursor-pointer hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#143728] hover:bg-[#0d261b] text-white font-semibold cursor-pointer disabled:opacity-70"
                >
                  {saving ? 'Saving...' : editingBanner.id ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Banner"
        itemName={deleteModalState.banner?.title || deleteModalState.banner?.section}
        message="This banner will be permanently deleted from the CMS and will immediately stop displaying on your storefront."
        isDeleting={deleteModalState.isDeleting}
        onClose={() => setDeleteModalState({ isOpen: false, banner: null, isDeleting: false })}
        onConfirm={confirmDeleteBanner}
      />
    </div>
  );
}

