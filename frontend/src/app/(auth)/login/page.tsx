'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ShieldCheck, PieChart, Activity, KeyRound, X, Info } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

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
              {/* Forgot Password Button */}
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="group flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors duration-200 mt-1"
              >
                <KeyRound size={12} className="group-hover:rotate-12 transition-transform duration-200" />
                <span>Forgot your password?</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent" 
              />
              <label htmlFor="remember" className="text-sm text-text-secondary">Remember me</label>
            </div>

            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
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

      {/* Forgot Password Modal */}
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
              className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"
            >
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-accent to-accent-light" />

              {/* Close */}
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <KeyRound size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Password Reset</h3>
                  <p className="text-sm text-text-secondary mt-1">Hoorain is self-hosted</p>
                </div>

                {/* Info box */}
                <div className="w-full rounded-xl bg-accent/10 border border-accent/20 p-4 text-left flex gap-3">
                  <Info size={16} className="text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Since this is a self-hosted application, password resets are managed by your administrator.
                    Please contact your admin to reset your password via the server CLI or database.
                  </p>
                </div>

                {/* Admin hint */}
                <div className="w-full rounded-xl bg-bg-secondary border border-border p-3 text-left">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">Admin reset command</p>
                  <code className="text-xs text-accent font-mono">docker exec -it financeos-backend npm run reset-password</code>
                </div>

                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-light transition-all shadow-lg shadow-accent/30"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
