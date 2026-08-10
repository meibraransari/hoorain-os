'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useSettings } from '@/components/providers/SettingsProvider';
import {
  User as UserIcon,
  Mail,
  Lock,
  ShieldCheck,
  Key,
  Globe,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
  Camera,
  RefreshCw,
} from 'lucide-react';

export default function ProfilePage() {
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { settings, updateSettings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [language, setLanguage] = useState('en');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/users/me');
      if (res) {
        setFirstName(res.firstName || '');
        setLastName(res.lastName || '');
        setEmail(res.email || '');
        setUsername(res.username || '');
        setAvatarUrl(res.avatarUrl || '');
        setRole(res.role || 'ADMIN');
        setCurrency(res.defaultCurrency || settings.defaultCurrency || 'INR');
        setTimezone(res.timezone || 'Asia/Kolkata');
        setLanguage(res.language || 'en');
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res: any = await api.patch('/users/me', {
        firstName,
        lastName,
        email,
        avatarUrl,
        defaultCurrency: currency,
        timezone,
        language,
      });

      setProfileSuccess('User profile details updated successfully!');
      if (authUser) {
        setUser({
          ...authUser,
          name: `${firstName} ${lastName}`.trim() || authUser.name,
          email: email || authUser.email,
        });
      }

      await updateSettings({ defaultCurrency: currency });

      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      await api.post('/users/me/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="h-32 rounded-2xl skeleton" />
        <div className="h-64 rounded-2xl skeleton" />
      </div>
    );
  }

  const initials = `${firstName ? firstName.charAt(0) : ''}${lastName ? lastName.charAt(0) : ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-bg-card via-bg-secondary to-bg-card p-6 shadow-xl before:absolute before:top-0 before:left-0 before:w-full before:h-[3px] before:bg-gradient-to-r before:from-accent before:via-accent-light before:to-transparent">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar Display */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-20 w-20 rounded-2xl object-cover border-2 border-accent/40 shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/15 border-2 border-accent/30 text-accent font-display text-2xl font-bold shadow-lg">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-accent text-white shadow">
              <Sparkles size={12} />
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-display font-bold text-text-primary">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : username}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-accent/20 text-accent border border-accent/30 tracking-wider">
                <ShieldCheck size={12} />
                {role}
              </span>
            </div>
            <p className="text-xs text-text-muted flex items-center justify-center sm:justify-start gap-1 font-mono">
              <Mail size={12} />
              {email || 'No email configured'}
            </p>
            <p className="text-[11px] text-text-secondary">
              Account Username: <strong className="text-text-primary font-mono">{username}</strong>
            </p>
          </div>

          <button
            onClick={fetchUserProfile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-bg-card hover:bg-bg-hover text-text-secondary hover:text-text-primary text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column (2 Spans): Profile Information Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="card p-6 border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <UserIcon size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-text-primary">User Profile & Personal Details</h2>
                  <p className="text-xs text-text-muted">Manage your display name, contact email, and avatar</p>
                </div>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-income/10 border border-income/20 text-income text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 pl-9 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                />
                <Mail size={14} className="absolute left-3 top-3 text-text-muted" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Avatar Image URL (Optional)</label>
              <div className="relative">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 pl-9 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                />
                <Camera size={14} className="absolute left-3 top-3 text-text-muted" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-accent-light cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>

          {/* Localization Preferences Form */}
          <div className="card p-6 border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Globe size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-base text-text-primary">Regional & Localization Preferences</h2>
                  <p className="text-xs text-text-muted">Configure currency, timezone, and language preferences</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-secondary p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-secondary p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC / GMT</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">System Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-secondary p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Span): Password & Security Form */}
        <div className="space-y-6">
          <form onSubmit={handleChangePassword} className="card p-6 border border-border/80 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-border/80 pb-3">
              <div className="p-2 rounded-xl bg-accent/10 text-accent">
                <Lock size={18} />
              </div>
              <div>
                <h2 className="font-bold text-base text-text-primary">Security & Password</h2>
                <p className="text-xs text-text-muted">Update your account login password</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-income/10 border border-income/20 text-income text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">New Password</label>
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
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-light text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              <Key size={15} />
              <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>

          {/* Database Backup Compatibility Badge Card */}
          <div className="card p-5 border border-income/30 bg-income/5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-income font-bold text-xs">
              <ShieldCheck size={16} />
              <span>SQL Backup Safe</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Profile changes update your PostgreSQL <code className="text-accent font-mono">users</code> entity safely. Database exports (`.sql` dumps) and database restorations maintain 100% integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
