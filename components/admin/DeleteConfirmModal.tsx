'use client';

import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  itemName,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => !isDeleting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 sm:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-full bg-red-50 border-8 border-red-50/60 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 text-center tracking-tight">
          {title}
        </h3>

        {/* Description & Item Details */}
        <div className="mt-2.5 text-center text-sm text-gray-600 leading-relaxed">
          {itemName ? (
            <p className="font-normal text-gray-700">
              Are you sure you want to delete <span className="font-semibold text-gray-900 break-words">"{itemName}"</span>?
            </p>
          ) : (
            <p className="font-normal text-gray-700">
              Are you sure you want to proceed with this deletion?
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            {message || 'This action cannot be undone. All associated data will be permanently removed.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition cursor-pointer disabled:opacity-40 text-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

