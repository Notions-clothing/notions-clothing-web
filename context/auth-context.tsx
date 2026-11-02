'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, CustomerAddress } from '@/types/database';

interface AuthContextType {
  user: Customer | null;
  loading: boolean;
  isAccountModalOpen: boolean;
  modalMode: 'login' | 'register' | 'forgot';
  openAccountModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAccountModal: () => void;
  setModalMode: (mode: 'login' | 'register' | 'forgot') => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  savedAddresses: CustomerAddress[];
  loadingAddresses: boolean;
  refreshAddresses: () => Promise<void>;
  addAddress: (address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>) => Promise<{ success: boolean; address?: CustomerAddress; error?: string }>;
  updateAddress: (id: string, address: Partial<CustomerAddress>) => Promise<{ success: boolean; address?: CustomerAddress; error?: string }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const openAccountModal = useCallback((mode: 'login' | 'register' | 'forgot' = 'login') => {
    setModalMode(mode);
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
  }, []);

  const refreshAddresses = useCallback(async () => {
    try {
      setLoadingAddresses(true);
      const res = await fetch('/api/customer/addresses');
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error('Failed to load addresses:', e);
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/customer');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.customer) {
          setUser(data.customer);
          refreshAddresses();
          return;
        }
      }
      setUser(null);
      setSavedAddresses([]);
    } catch {
      setUser(null);
      setSavedAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [refreshAddresses]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to sign in' };
      }
      setUser(data.customer);
      refreshAddresses();
      closeAccountModal();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred' };
    }
  };

  const register = async (payload: { email: string; password: string; fullName: string; phone?: string }) => {
    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create account' };
      }
      setUser(data.customer);
      refreshAddresses();
      closeAccountModal();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setSavedAddresses([]);
    }
  };

  const addAddress = async (address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>) => {
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to add address' };
      }
      await refreshAddresses();
      return { success: true, address: data.address };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to add address' };
    }
  };

  const updateAddress = async (id: string, address: Partial<CustomerAddress>) => {
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...address }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update address' };
      }
      await refreshAddresses();
      return { success: true, address: data.address };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update address' };
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/customer/addresses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to delete address' };
      }
      await refreshAddresses();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete address' };
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      const res = await fetch('/api/customer/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to set default address' };
      }
      await refreshAddresses();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to set default address' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAccountModalOpen,
        modalMode,
        openAccountModal,
        closeAccountModal,
        setModalMode,
        login,
        register,
        logout,
        refreshUser,
        savedAddresses,
        loadingAddresses,
        refreshAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

