'use client';

import { useState, useEffect } from 'react';
import { useTheme, THEMES } from '@/components/providers/ThemeProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { api } from '@/lib/api';
import {
  Upload, Download, Palette, DollarSign, Trash2, FileText, Database,
  Save, Check, Globe, Calendar, RefreshCw, LayoutDashboard, Activity,
  User, ShieldCheck, Mail, Server, Lock, Send, AlertCircle, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// Modals
import { CashewImportModal } from '@/components/modals/CashewImportModal';
import { DataCleanupModal } from '@/components/modals/DataCleanupModal';
import { DbRestoreModal } from '@/components/modals/DbRestoreModal';

export default function SettingsPage() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [isDbRestoreModalOpen, setIsDbRestoreModalOpen] = useState(false);

  // General Regional Settings
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [numberFormat, setNumberFormat] = useState('standard');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Export States
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingDbDump, setDownloadingDbDump] = useState(false);

  // Dashboard Widget Visibility Toggles
  const [showNetWorth, setShowNetWorth] = useState(true);
  const [showCreditDebt, setShowCreditDebt] = useState(true);
  const [showSpendingGraph, setShowSpendingGraph] = useState(true);
  const [showPieChart, setShowPieChart] = useState(true);
  const [showObjectives, setShowObjectives] = useState(false);
  const [showQuickTransfer, setShowQuickTransfer] = useState(true);
  const [showCategoryAnalytics, setShowCategoryAnalytics] = useState(true);

  // Behavior Settings
  const [removeZeroTransactionEntries, setRemoveZeroTransactionEntries] = useState(false);
  const [automaticallyPayUpcoming, setAutomaticallyPayUpcoming] = useState(true);
  const [use24HourFormat, setUse24HourFormat] = useState('system');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (settings) {
      if (settings.defaultCurrency) setCurrency(settings.defaultCurrency);
      if (settings.dateFormat) setDateFormat(settings.dateFormat);
      if (settings.numberFormat) setNumberFormat(settings.numberFormat);
      if (settings.showNetWorth !== undefined) setShowNetWorth(settings.showNetWorth);
      if (settings.showCreditDebt !== undefined) setShowCreditDebt(settings.showCreditDebt);
      if (settings.showSpendingGraph !== undefined) setShowSpendingGraph(settings.showSpendingGraph);
      if (settings.showPieChart !== undefined) setShowPieChart(settings.showPieChart);
      if (settings.showObjectives !== undefined) setShowObjectives(settings.showObjectives);
      if (settings.showQuickTransfer !== undefined) setShowQuickTransfer(settings.showQuickTransfer);
      if (settings.showCategoryAnalytics !== undefined) setShowCategoryAnalytics(settings.showCategoryAnalytics);
      if (settings.removeZeroTransactionEntries !== undefined) setRemoveZeroTransactionEntries(settings.removeZeroTransactionEntries);
      if (settings.automaticallyPayUpcoming !== undefined) setAutomaticallyPayUpcoming(settings.automaticallyPayUpcoming);
      if (settings.use24HourFormat !== undefined) setUse24HourFormat(settings.use24HourFormat);
      if (settings.smtpHost) setSmtpHost(settings.smtpHost);
      if (settings.smtpPort) setSmtpPort(settings.smtpPort);
      if (settings.smtpUser) setSmtpUser(settings.smtpUser);
      if (settings.smtpPass) setSmtpPass(settings.smtpPass);
      if (settings.smtpFrom) setSmtpFrom(settings.smtpFrom);
      if (settings.smtpSecure !== undefined) setSmtpSecure(settings.smtpSecure);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        defaultCurrency: currency,
        dateFormat,
        numberFormat,
        showNetWorth,
        showCreditDebt,
        showSpendingGraph,
        showPieChart,
        showObjectives,
        showQuickTransfer,
        showCategoryAnalytics,
        removeZeroTransactionEntries,
        automaticallyPayUpcoming,
        use24HourFormat,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpSecure,
      });

      setHasUnsavedChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      // First save current SMTP settings
      await updateSettings({
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpFrom,
        smtpSecure,
      });

      const res: any = await api.post('/settings/test-smtp');
      setSmtpTestResult({
        success: res.success ?? true,
        message: res.message || 'SMTP connection tested successfully.',
      });
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.response?.data?.message || 'SMTP Connection Test Failed. Check credentials.',
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleExportCsv = async () => {
    setDownloadingCsv(true);
    try {
      const response: any = await api.get('/export/transactions?format=csv', { responseType: 'blob' });
      const blob = new Blob([response.data || response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV transactions');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleExportJson = async () => {
    setDownloadingJson(true);
    try {
      const response: any = await api.get('/export/backup/json', { responseType: 'blob' });
      const blob = new Blob([response.data || response], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hoorain-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export JSON backup');
    } finally {
      setDownloadingJson(false);
    }
  };

  const handleExportDbDump = async () => {
    setDownloadingDbDump(true);
    try {
      const response: any = await api.get('/export/db-dump', { responseType: 'blob' });
      const blob = new Blob([response.data || response], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hoorain_postgres_db_backup_${new Date().toISOString().split('T')[0]}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export PostgreSQL database dump');
    } finally {
      setDownloadingDbDump(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage regional preferences, SMTP email server, dashboard widgets, and SQL database backups.</p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-income/10 text-income border border-income/30 text-xs font-bold animate-fade-in">
              <Check size={14} />
              <span>Settings Saved!</span>
            </span>
          )}
          <button
            onClick={handleSaveSettings}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-accent text-white hover:bg-accent-light scale-105 animate-pulse'
                : 'bg-accent text-white hover:bg-accent-light'
            }`}
          >
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* 1. User Profile & Account Security Card */}
      <div className="card border border-accent/40 bg-accent/5 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-accent text-white shadow-lg">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">User Profile & Account Details</h2>
            <p className="text-xs text-text-muted mt-0.5">Edit First Name, Last Name, Email, Avatar Photo, and Password</p>
          </div>
        </div>
        <Link
          href="/profile"
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-md hover:bg-accent-light transition-all whitespace-nowrap text-center"
        >
          Manage Profile & Password →
        </Link>
      </div>

      {/* 2. Appearance & Theme */}
      <div className="card border border-border p-6 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-base">
            <Palette size={18} className="text-accent" />
            <h2>Appearance &amp; Theme</h2>
          </div>
          <span className="text-[11px] text-accent font-mono font-semibold bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">
            {THEMES.find(t => t.id === theme)?.label ?? 'Dark'} Active
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border transition-all cursor-pointer text-left group ${
                  isActive
                    ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                    : 'border-border bg-bg-secondary/50 hover:border-accent/50 hover:bg-bg-hover'
                }`}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <span
                    className="h-5 w-5 rounded-md flex-shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: t.accentColor }}
                  />
                  <span className="h-3 w-3 rounded-sm flex-shrink-0 opacity-60" style={{ backgroundColor: t.accentColor + '88' }} />
                  <span className="h-3 w-3 rounded-sm flex-shrink-0 opacity-30" style={{ backgroundColor: t.accentColor + '44' }} />
                  {isActive && (
                    <span className="ml-auto text-[10px] font-bold text-accent bg-accent/15 px-1.5 py-0.5 rounded-full">✓ Active</span>
                  )}
                </div>
                <div>
                  <p className={`text-xs font-bold ${isActive ? 'text-accent' : 'text-text-primary group-hover:text-accent transition-colors'}`}>
                    {t.label}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Regional & Currency Preferences */}
      <div className="card border border-border p-6 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-base">
            <Globe size={18} className="text-accent" />
            <h2>Regional & Currency Preferences</h2>
          </div>
          {hasUnsavedChanges && (
            <span className="text-[11px] text-warning font-bold bg-warning/10 border border-warning/20 px-2.5 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-xl border border-border bg-bg-secondary p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-xl border border-border bg-bg-secondary p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Number Format</label>
            <select
              value={numberFormat}
              onChange={(e) => {
                setNumberFormat(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-xl border border-border bg-bg-secondary p-2.5 text-xs font-bold text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="standard">Standard (1,234,567.89)</option>
              <option value="indian">Indian (12,34,567.89)</option>
              <option value="european">European (1.234.567,89)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. SMTP Email Server Configuration */}
      <div className="card border border-border p-6 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-base">
            <Mail size={18} className="text-accent" />
            <h2>SMTP & Email Server Configuration</h2>
          </div>
          <span className="text-[11px] text-accent font-mono font-semibold bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">
            Password Reset Enabled
          </span>
        </div>

        {smtpTestResult && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            smtpTestResult.success
              ? 'bg-income/10 border border-income/20 text-income'
              : 'bg-expense/10 border border-expense/20 text-expense'
          }`}>
            {smtpTestResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{smtpTestResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => {
                setSmtpHost(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="smtp.gmail.com"
              className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">SMTP Port</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => {
                setSmtpPort(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="587"
              className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">Sender Email (From)</label>
            <input
              type="text"
              value={smtpFrom}
              onChange={(e) => {
                setSmtpFrom(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="noreply@hoorain.app"
              className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">SMTP Username</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => {
                setSmtpUser(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="notifications@hoorain.app"
              className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">SMTP Password</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => {
                setSmtpPass(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-bg-secondary px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between sm:pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smtpSecure}
                onChange={(e) => {
                  setSmtpSecure(e.target.checked);
                  setHasUnsavedChanges(true);
                }}
                className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent cursor-pointer"
              />
              <span className="text-xs font-bold text-text-primary">SSL/TLS Connection</span>
            </label>

            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={testingSmtp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent font-bold text-xs hover:bg-accent hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              <span>{testingSmtp ? 'Testing...' : 'Test SMTP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Dashboard Widgets & Visibility Toggles */}
      <div className="card border border-border p-6 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-base">
            <LayoutDashboard size={18} className="text-accent" />
            <h2>Dashboard Widgets & View Controls</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Net Worth KPI Summary', value: showNetWorth, setter: setShowNetWorth },
            { label: 'Assets & Debt Breakdown', value: showCreditDebt, setter: setShowCreditDebt },
            { label: 'Cash Flow Analysis Chart', value: showSpendingGraph, setter: setShowSpendingGraph },
            { label: 'Top Expenses Donut Chart', value: showPieChart, setter: setShowPieChart },
            { label: 'Quick Fund Transfer Tool', value: showQuickTransfer, setter: setShowQuickTransfer },
            { label: 'Category Expense Progress', value: showCategoryAnalytics, setter: setShowCategoryAnalytics },
            { label: 'Financial Objectives', value: showObjectives, setter: setShowObjectives },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-bg-secondary/50 hover:bg-bg-secondary transition-colors cursor-pointer">
              <span className="text-xs font-semibold text-text-primary">{item.label}</span>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => {
                  item.setter(e.target.checked);
                  setHasUnsavedChanges(true);
                }}
                className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 5. Transaction Behavior & Automation */}
      <div className="card border border-border p-6 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-base">
            <Activity size={18} className="text-accent" />
            <h2>Transaction Automation & Behavior</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-bg-secondary/50 hover:bg-bg-secondary transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-text-primary block">Hide Zero-Value Entries</span>
              <span className="text-[11px] text-text-muted">Filter out transactions with amount equal to 0</span>
            </div>
            <input
              type="checkbox"
              checked={removeZeroTransactionEntries}
              onChange={(e) => {
                setRemoveZeroTransactionEntries(e.target.checked);
                setHasUnsavedChanges(true);
              }}
              className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-bg-secondary/50 hover:bg-bg-secondary transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-bold text-text-primary block">Auto-Pay Scheduled Items</span>
              <span className="text-[11px] text-text-muted">Automatically process upcoming recurring transactions</span>
            </div>
            <input
              type="checkbox"
              checked={automaticallyPayUpcoming}
              onChange={(e) => {
                setAutomaticallyPayUpcoming(e.target.checked);
                setHasUnsavedChanges(true);
              }}
              className="h-4 w-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 6. Database Backup & SQL Importer (CRITICAL COMPONENT) */}
      <div className="card border border-accent/40 p-6 rounded-2xl bg-bg-card/90 backdrop-blur-md shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary font-bold text-base">
            <Database size={18} className="text-accent" />
            <h2>Database Backup & SQL Importer</h2>
          </div>
          <span className="text-[11px] text-income font-bold bg-income/10 border border-income/30 px-2.5 py-0.5 rounded-full">
            Full PostgreSQL Dump Supported
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Export your complete PostgreSQL database dump, restore a previous backup, or import financial data from Cashew database files.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={handleExportDbDump}
            disabled={downloadingDbDump}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-accent/40 bg-accent/5 hover:bg-accent/15 transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <Database size={22} className="text-accent group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-text-primary">Export PostgreSQL Dump (.sql)</span>
            <span className="text-[10px] text-text-muted mt-0.5">Native pg_dump database export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDbRestoreModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-bg-secondary/60 hover:bg-bg-secondary transition-all text-center group cursor-pointer"
          >
            <Upload size={22} className="text-accent group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-text-primary">Restore PostgreSQL Dump (.sql)</span>
            <span className="text-[10px] text-text-muted mt-0.5">Restore database via psql utility</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-bg-secondary/60 hover:bg-bg-secondary transition-all text-center group cursor-pointer"
          >
            <FileText size={22} className="text-accent group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-text-primary">Import Database Backup File</span>
            <span className="text-[10px] text-text-muted mt-0.5">Import Cashew SQLite/JSON backup</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={downloadingJson}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-bg-secondary/60 hover:bg-bg-secondary transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <Download size={22} className="text-accent group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-text-primary">Export System Backup (.json)</span>
            <span className="text-[10px] text-text-muted mt-0.5">Full JSON data export</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={downloadingCsv}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-bg-secondary/60 hover:bg-bg-secondary transition-all text-center group cursor-pointer disabled:opacity-50"
          >
            <FileText size={22} className="text-accent group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs font-bold text-text-primary">Export Transactions (.csv)</span>
            <span className="text-[10px] text-text-muted mt-0.5">Spreadsheet-compatible CSV</span>
          </button>
        </div>
      </div>

      {/* 7. Factory Reset & Data Erasure */}
      <div className="card border border-danger/30 p-6 rounded-2xl bg-danger/5 space-y-4">
        <div className="flex items-center justify-between border-b border-danger/20 pb-3">
          <div className="flex items-center gap-2 text-danger font-bold text-base">
            <Trash2 size={18} />
            <h2>Factory Reset & Financial Data Erasure</h2>
          </div>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Permanently erase all user accounts, transactions, categories, budgets, and goals. User profile credentials and system settings are retained.
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsCleanupModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Erase All Financial Data...</span>
          </button>
        </div>
      </div>

      {/* Modal Dialogs */}
      <CashewImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <DbRestoreModal isOpen={isDbRestoreModalOpen} onClose={() => setIsDbRestoreModalOpen(false)} />
      <DataCleanupModal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} />
    </div>
  );
}
