'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Wallet, ShieldCheck, PieChart, Activity, KeyRound, X, CheckCircle, AlertCircle, Send, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot / Reset Password States
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [identity, setIdentity] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res: any = await api.post('/auth/forgot-password', { identity });
      setResetSuccess(res.message || 'Reset code sent!');
      if (res.devResetCode) {
        setResetCode(res.devResetCode);
      }
      setResetStep(2);
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to request password reset code.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setResetError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res: any = await api.post('/auth/reset-password', {
        identity,
        code: resetCode,
        newPassword,
      });
      setResetSuccess(res.message || 'Password reset successfully!');
      setTimeout(() => {
        setShowForgotModal(false);
        setResetStep(1);
        setUsername(identity);
      }, 2500);
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Check code.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden">
      {/* Left Side: Animated Background */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center p-12 lg:flex">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-accent/20 blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent-light/20 blur-[100px]" />
        </div>

        <div className="z-10 flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/50">
              <Wallet size={32} />
            </div>
            <h1 className="text-5xl font-display font-bold text-text-primary tracking-tight">Hoorain</h1>
          </motion.div>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-text-secondary max-w-md"
          >
            Your self-hosted hub for complete financial clarity and control.
          </motion.p>

          <div className="grid grid-cols-2 gap-4 mt-12">
            {[
              { icon: ShieldCheck, title: "Self-Hosted", desc: "Your data stays with you" },
              { icon: PieChart, title: "Deep Analytics", desc: "Understand your spending" },
              { icon: Activity, title: "Real-time", desc: "Always up to date" },
              { icon: Wallet, title: "All Accounts", desc: "In one single place" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="glass rounded-xl p-4 flex flex-col items-center text-center gap-2"
              >
                <feature.icon className="text-accent" size={24} />
                <h3 className="font-semibold text-text-primary">{feature.title}</h3>
                <p className="text-sm text-text-muted">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-24 xl:px-32 relative z-10">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="glass card w-full max-w-md mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-light" />

          <div className="mb-8 mt-4 text-center">
            <h2 className="text-3xl font-display font-bold text-text-primary">Welcome back</h2>
            <p className="mt-2 text-text-secondary">Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                placeholder="admin"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => {
                  setIdentity(username);
                  setResetStep(1);
                  setResetSuccess('');
                  setResetError('');
                  setShowForgotModal(true);
                }}
                className="group flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors duration-200 mt-1 cursor-pointer"
              >
                <KeyRound size={12} className="group-hover:rotate-12 transition-transform duration-200" />
                <span>Forgot your password?</span>
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  Sign In
                </span>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Forgot / Reset Password Interactive Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowForgotModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-2xl space-y-4"
            >
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-accent via-accent-light to-transparent" />

              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent shrink-0">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-text-primary">
                    {resetStep === 1 ? 'Forgot Password' : 'Set New Password'}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {resetStep === 1 ? 'Step 1: Request reset verification code' : 'Step 2: Enter reset code & new password'}
                  </p>
                </div>
              </div>

              {resetSuccess && (
                <div className="p-3 rounded-xl bg-income/10 border border-income/20 text-income text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{resetSuccess}</span>
                </div>
              )}
              {resetError && (
                <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{resetError}</span>
                </div>
              )}

              {resetStep === 1 ? (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
                      Username or Email Address
                    </label>
                    <input
                      type="text"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      placeholder="admin or admin@hoorain.app"
                      className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{resetLoading ? 'Sending Reset Code...' : 'Send Password Reset Code'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 font-mono text-center text-sm tracking-widest font-bold text-text-primary focus:border-accent focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="w-1/3 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-2/3 py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Lock size={14} />
                      <span>{resetLoading ? 'Resetting Password...' : 'Confirm New Password'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
