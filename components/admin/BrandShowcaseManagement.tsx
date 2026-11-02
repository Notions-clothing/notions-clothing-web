'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  UploadCloud,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { BrandShowcase, Category, Brand } from '@/types/database';

interface BrandShowcaseManagementProps {
  brands?: Brand[];
  categories: Category[];
  showNotification: (text: string, type?: 'success' | 'error') => void;
  handleFileUpload: (file: File, folder?: string) => Promise<any>;
}

export default function BrandShowcaseManagement({
  brands = [],
  categories,
  showNotification,
  handleFileUpload,
}: BrandShowcaseManagementProps) {
  const [showcase, setShowcase] = useState<BrandShowcase>({
    id: 'brand-showcase-tanay',
    is_enabled: true,
    section_label: 'OUR OWN BRAND',
    heading: 'A Signature of Our Own',
    description: 'Premium everyday wear crafted for modern men. Timeless style, trusted quality.',
    brand_logo_url: '',
    brand_logo_public_id: '',
    background_image_url: '/tanay-showcase-bg.jpg',
    background_image_public_id: '',
    button_text: 'Explore TANAY',
    category_id: '',
    category_slug: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  // Fetch current data on mount
  const fetchShowcase = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/brand-showcase');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setShowcase((prev) => ({ ...prev, ...data }));
        }
      }
    } catch (err) {
      console.error('Failed to load brand showcase config:', err);
      showNotification('Failed to load Brand Showcase settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowcase();
  }, []);

  // Filter active published categories for the destination dropdown
  const activeCategories = categories.filter((c) => c.is_published !== false);

  // Handle Logo Upload
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const uploaded = await handleFileUpload(file, 'notions/brand');
      setShowcase((prev) => ({
        ...prev,
        brand_logo_url: uploaded.url,
        brand_logo_public_id: uploaded.public_id || '',
      }));
      showNotification('Brand logo uploaded successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Handle Logo Removal
  const handleRemoveLogo = () => {
    setShowcase((prev) => ({
      ...prev,
      brand_logo_url: '',
      brand_logo_public_id: '',
    }));
    showNotification('Brand logo removed.');
  };

  // Handle Background Image Upload
  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBackground(true);
      const uploaded = await handleFileUpload(file, 'notions/brand');
      setShowcase((prev) => ({
        ...prev,
        background_image_url: uploaded.url,
        background_image_public_id: uploaded.public_id || '',
      }));
      showNotification('Background image uploaded successfully!');
    } catch (err: any) {
      showNotification(err.message || 'Failed to upload background image', 'error');
    } finally {
      setUploadingBackground(false);
      e.target.value = '';
    }
  };

  // Handle Background Image Removal
  const handleRemoveBackground = () => {
    setShowcase((prev) => ({
      ...prev,
      background_image_url: '',
      background_image_public_id: '',
    }));
    showNotification('Background image removed.');
  };

  // Handle Category Select Change
  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = activeCategories.find((c) => c.id === selectedId);
    setShowcase((prev) => ({
      ...prev,
      category_id: selectedId,
      category_slug: found ? found.slug : '',
    }));
  };

  // Save changes to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const res = await fetch('/api/admin/brand-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showcase),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save Brand Showcase settings');
      }

      setShowcase((prev) => ({ ...prev, ...resData.brand_showcase }));
      showNotification('Brand Showcase settings saved and updated live!');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Failed to update Brand Showcase', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#143728] animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-700">Loading Brand Showcase configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#143728]/10 text-[#143728] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Brand Showcase Section</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage the dedicated brand spotlight section displayed above &quot;All Products&quot; on the homepage.
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {showcase.is_enabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live on Homepage</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Section Hidden</span>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visibility Toggle Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Homepage Visibility</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enable or disable the TANAY Brand Showcase section on the storefront homepage.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showcase.is_enabled}
                    onChange={(e) => setShowcase((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#143728]"></div>
                </label>
              </div>
            </div>

            {/* Content Details Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Editorial Content
              </h3>

              {/* Section Label */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Section Label / Tagline
                </label>
                <input
                  type="text"
                  required
                  value={showcase.section_label}
                  onChange={(e) => setShowcase((prev) => ({ ...prev, section_label: e.target.value }))}
                  placeholder="e.g. OUR OWN BRAND"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#143728] transition"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Displayed in small uppercase typography above the heading.
                </span>
              </div>

              {/* Heading */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Main Headline *
                </label>
                <input
                  type="text"
                  required
                  value={showcase.heading}
                  onChange={(e) => setShowcase((prev) => ({ ...prev, heading: e.target.value }))}
                  placeholder="e.g. A Signature of Our Own"
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#143728] transition font-serif text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Supporting Editorial Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={showcase.description}
                  onChange={(e) => setShowcase((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Premium everyday wear crafted for modern men. Timeless style, trusted quality."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#143728] transition leading-relaxed"
                />
              </div>

              {/* Associated Brand */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Showcase Brand (Recommended for Brand Page)</span>
                  <span className="text-[11px] text-gray-400">Routes button to /brands/[slug]</span>
                </label>
                <select
                  value={showcase.brand_id || ''}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const matchedBrand = brands.find((b) => b.id === selId);
                    setShowcase((prev) => ({
                      ...prev,
                      brand_id: selId || null,
                      brand_slug: matchedBrand ? matchedBrand.slug : null,
                      button_text: matchedBrand && (!prev.button_text || prev.button_text.startsWith('Explore'))
                        ? `Explore ${matchedBrand.name}`
                        : prev.button_text,
                      brand_logo_url: matchedBrand?.logo_url && !prev.brand_logo_url
                        ? matchedBrand.logo_url
                        : prev.brand_logo_url,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#143728] transition"
                >
                  <option value="">-- Select Brand for Dedicated Brand Page --</option>
                  {brands
                    .filter((b) => b.is_active !== false)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        Brand: {b.name} &bull; /brands/{b.slug}
                      </option>
                    ))}
                </select>
              </div>

              {/* Button Text & Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Button Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={showcase.button_text}
                    onChange={(e) => setShowcase((prev) => ({ ...prev, button_text: e.target.value }))}
                    placeholder="e.g. Explore TANAY"
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#143728] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Fallback Category</span>
                    <span className="text-[10px] text-gray-400">Used if no brand selected</span>
                  </label>
                  <select
                    value={showcase.category_id || ''}
                    onChange={handleCategorySelect}
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-gray-300 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#143728] transition"
                  >
                    <option value="">-- All Products Storefront (/shop) --</option>
                    {activeCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat.parent_id ? '(Subcategory)' : ''} &bull; /category/{cat.slug}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resolved Destination Link Pill */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#143728]" />
                  <span>Target Route:</span>
                  <strong className="text-gray-900 font-mono text-[11px]">
                    {showcase.brand_slug
                      ? `/brands/${showcase.brand_slug}`
                      : showcase.category_slug
                      ? `/category/${showcase.category_slug}`
                      : '/shop'}
                  </strong>
                </div>
                {showcase.brand_slug ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/60 font-semibold px-2 py-0.5 rounded">
                    Brand Page
                  </span>
                ) : showcase.category_slug ? (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/60 font-semibold px-2 py-0.5 rounded">
                    Category Page
                  </span>
                ) : null}
              </div>
            </div>

            {/* Media Uploads Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
                Media & Visual Assets
              </h3>

              {/* 1. Brand Logo Patch Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800">
                      Brand Logo Image (e.g. TANAY Stitched Patch)
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Upload, replace, or remove the brand logo emblem.
                    </span>
                  </div>
                  {showcase.brand_logo_url && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60">
                  {showcase.brand_logo_url ? (
                    <div className="relative w-44 h-20 bg-[#F4EFE6] rounded-lg border border-[#DDD5C7] overflow-hidden flex items-center justify-center p-2 shadow-2xs">
                      <Image
                        src={showcase.brand_logo_url}
                        alt="Brand Logo"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-20 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-[10px]">No logo uploaded</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl shadow-2xs cursor-pointer transition">
                      <UploadCloud className="w-4 h-4 text-[#143728]" />
                      <span>
                        {uploadingLogo
                          ? 'Uploading to Cloudinary...'
                          : showcase.brand_logo_url
                          ? 'Replace Brand Logo'
                          : 'Upload Brand Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingLogo}
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-400">
                      PNG, WebP, or JPG with transparent or stitched fabric background recommended.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Section Background Image */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800">
                      Section Background Lifestyle / Product Image
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Warm lifestyle photo displaying the folded apparel and cap.
                    </span>
                  </div>
                  {showcase.background_image_url && (
                    <button
                      type="button"
                      onClick={handleRemoveBackground}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Background</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60">
                  {showcase.background_image_url ? (
                    <div className="relative w-44 h-24 bg-gray-200 rounded-lg border border-gray-300 overflow-hidden shadow-2xs">
                      <Image
                        src={showcase.background_image_url}
                        alt="Section Background"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-24 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-[10px]">No image uploaded</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-semibold rounded-xl shadow-2xs cursor-pointer transition">
                      <UploadCloud className="w-4 h-4 text-[#143728]" />
                      <span>
                        {uploadingBackground
                          ? 'Uploading to Cloudinary...'
                          : showcase.background_image_url
                          ? 'Replace Background Image'
                          : 'Upload Background Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingBackground}
                        onChange={handleBgFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-400">
                      High-resolution landscape image (1400x500px or similar) matching the warm editorial aesthetic.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-[#143728] hover:bg-[#0c2419] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:bg-gray-400"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Publish Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Live Real-Time Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-24 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#143728]" />
                  <span>Real-Time Editorial Preview</span>
                </span>
                <span className="text-[11px] text-gray-500">Live preview of homepage placement</span>
              </div>

              {/* Preview Card */}
              <div className="bg-[#FAF9F5] p-3 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="relative rounded-2xl overflow-hidden min-h-[330px] bg-[#F4EFE6] border border-[#E8E1D5] flex flex-col justify-between p-5">
                  {/* Background Image in Preview */}
                  {showcase.background_image_url && (
                    <Image
                      src={showcase.background_image_url}
                      alt="Preview"
                      fill
                      className="object-cover object-[center_right]"
                    />
                  )}

                  {/* Gradient Overlay for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F4EFE6] via-[#F4EFE6]/90 via-55% to-transparent pointer-events-none z-5" />

                  {/* Live Content */}
                  <div className="relative z-10 space-y-3 max-w-[280px]">
                    {/* Label */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-[0.22em] text-[#7A7165] uppercase">
                        {showcase.section_label || 'OUR OWN BRAND'}
                      </span>
                      <div className="h-px w-6 bg-[#8C8275]/60" />
                    </div>

                    {/* Logo */}
                    {showcase.brand_logo_url ? (
                      <div className="relative h-12 w-36">
                        <Image
                          src={showcase.brand_logo_url}
                          alt="Brand Logo"
                          fill
                          className="object-contain object-left"
                        />
                      </div>
                    ) : (
                      /* Fallback styled patch matching the reference */
                      <div className="inline-flex flex-col items-center justify-center px-4 py-2 rounded border border-[#C5BBAA] bg-[#EDE5D8] shadow-2xs">
                        <span className="text-xs font-bold tracking-[0.25em] text-[#1E1B18] font-sans">
                          T A N A Y
                        </span>
                        <div className="w-12 h-px bg-[#8C8275] my-0.5" />
                        <span className="text-[9px] text-[#5C5449] tracking-wider">
                          BY notions&reg;
                        </span>
                      </div>
                    )}

                    {/* Heading */}
                    <h4 className="font-serif italic text-xl text-[#181818] leading-tight">
                      {showcase.heading || 'A Signature of Our Own'}
                    </h4>

                    {/* Description */}
                    <p className="text-[10.5px] text-[#554F46] leading-relaxed">
                      {showcase.description || 'Premium everyday wear crafted for modern men.'}
                    </p>

                    {/* CTA Button */}
                    <div className="pt-1.5">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#143728] text-white text-[11px] font-semibold rounded-lg shadow-sm">
                        <span>{showcase.button_text || 'Explore TANAY'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="relative z-10 pt-4 flex items-center justify-between text-[10px] text-gray-500 border-t border-[#E8E1D5]/60">
                    <span>Placement: Above &quot;All Products&quot;</span>
                    <span>Status: {showcase.is_enabled ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

