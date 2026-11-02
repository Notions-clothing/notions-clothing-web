'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function AccountModal() {
  const router = useRouter();
  const { isAccountModalOpen, closeAccountModal, modalMode, setModalMode, login, register } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Forgot password flow states (1: email, 2: otp, 3: new password, 4: done)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAccountModalOpen) return null;

  const resetMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleModeSwitch = (mode: 'login' | 'register' | 'forgot') => {
    resetMessages();
    setForgotStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setModalMode(mode);
  };

  // Sign In handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push('/account');
    } else {
      setErrorMsg(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  // Registration handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const res = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
    });
    setIsLoading(false);

    if (res.success) {
      router.push('/account');
    } else {
      setErrorMsg(res.error || 'Failed to register account.');
    }
  };

  // Forgot Password: Step 1 (Request OTP)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: 'customer' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Unable to request password reset code.');
      } else {
        setSuccessMsg(data.message || 'Verification code sent to your email.');
        setForgotStep(2);
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Step 2 (Verify OTP)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit code received via email.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim(), role: 'customer' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid or expired verification code.');
      } else {
        resetMessages();
        setForgotStep(3);
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Step 3 (Reset Password)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
          newPassword,
          role: 'customer',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to update password.');
      } else {
        setForgotStep(4);
        setSuccessMsg('Your password has been reset successfully.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeAccountModal}
      />

      {/* Modal Dialog (Outer border removed) */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-[#143728] px-6 py-6 text-white relative">
          <button
            onClick={closeAccountModal}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C2A265] mb-1">
            Opulent Membership
          </div>
          <h2 className="font-serif text-2xl font-light tracking-wide text-white">
            {modalMode === 'login' && 'Sign in to NOTIONS®'}
            {modalMode === 'register' && 'Create Your Account'}
            {modalMode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-white/75 mt-1 font-sans">
            {modalMode === 'login' && 'Access your orders, saved addresses & bespoke curation.'}
            {modalMode === 'register' && 'Join NOTIONS® for private access and personalized styling.'}
            {modalMode === 'forgot' && 'Follow the steps to securely recover your account.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {modalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#181818]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-xs text-[#143728] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A756D] hover:text-[#181818] p-1 cursor-pointer transition-colors"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#143728] text-white rounded-lg font-medium text-sm hover:bg-[#0f291e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-3 border-t border-[#EAE5DC]">
                <p className="text-xs text-[#7A756D]">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('register')}
                    className="text-[#143728] font-semibold hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. REGISTER MODE */}
          {modalMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181818] mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number (optional)"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={14} />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-8 pr-7 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((prev) => !prev)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7A756D] hover:text-[#181818] p-1 cursor-pointer transition-colors"
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181818] mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={14} />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Enter confirm password"
                      className="w-full pl-8 pr-7 py-2 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-xs text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7A756D] hover:text-[#181818] p-1 cursor-pointer transition-colors"
                      aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegConfirmPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 bg-[#143728] text-white rounded-lg font-medium text-sm hover:bg-[#0f291e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2.5 border-t border-[#EAE5DC]">
                <p className="text-xs text-[#7A756D]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    className="text-[#143728] font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD MODE */}
          {modalMode === 'forgot' && (
            <div>
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <p className="text-xs text-[#555555]">
                    Enter your account email address. We will send a secure 6-digit verification code to confirm your identity.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      Registered Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#143728] text-white rounded-lg font-medium text-sm hover:bg-[#0f291e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      className="text-xs text-[#7A756D] hover:text-[#181818] underline cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <p className="text-xs text-[#555555]">
                    We sent a 6-digit code to <strong className="text-[#181818]">{email}</strong>. Please enter it below to verify your request.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      6-Digit Security Code
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-lg font-mono font-bold tracking-[0.3em] text-[#143728] text-center focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#143728] text-white rounded-lg font-medium text-sm hover:bg-[#0f291e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[#7A756D] hover:text-[#181818] underline cursor-pointer"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-[#143728] font-medium hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs text-[#555555]">
                    Code verified. Enter your new desired password below.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      New Password (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A756D] hover:text-[#181818] p-1 cursor-pointer transition-colors"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181818] mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756D]" size={16} />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Enter confirm password"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#FAF9F5] border border-[#EAE5DC] rounded-lg text-sm text-[#181818] focus:outline-none focus:border-[#143728] focus:ring-1 focus:ring-[#143728] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A756D] hover:text-[#181818] p-1 cursor-pointer transition-colors"
                        aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#143728] text-white rounded-lg font-medium text-sm hover:bg-[#0f291e] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {forgotStep === 4 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-[#181818]">
                    Password Reset Complete
                  </h3>
                  <p className="text-xs text-[#555555]">
                    Your password has been successfully updated. You may now sign in using your new credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    className="w-full py-3 bg-[#143728] text-white rounded-lg font-medium text-sm hover:bg-[#0f291e] transition-colors cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
