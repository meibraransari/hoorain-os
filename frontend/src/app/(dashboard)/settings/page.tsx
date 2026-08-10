'use client';

import { useState, useEffect } from 'react';
import { CashewImportModal } from '@/components/modals/CashewImportModal';
import { DataCleanupModal } from '@/components/modals/DataCleanupModal';
import { DbRestoreModal } from '@/components/modals/DbRestoreModal';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { api } from '@/lib/api';
import { Upload, Download, Palette, DollarSign, Trash2, FileText, Database, Save, Check, Globe, Calendar, RefreshCw, LayoutDashboard, Activity, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { settings, updateSettings, isLoading: settingsLoading } = useSettings();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [isDbRestoreModalOpen, setIsDbRestoreModalOpen] = useState(false);

  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [numberFormat, setNumberFormat] = useState('standard');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [showNetWorth, setShowNetWorth] = useState(true);
  const [showCreditDebt, setShowCreditDebt] = useState(true);
  const [showSpendingGraph, setShowSpendingGraph] = useState(true);
  const [showPieChart, setShowPieChart] = useState(true);
  const [showObjectives, setShowObjectives] = useState(false);
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
      if (settings.removeZeroTransactionEntries !== undefined) setRemoveZeroTransactionEntries(settings.removeZeroTransactionEntries);
      if (settings.automaticallyPayUpcoming !== undefined) setAutomaticallyPayUpcoming(settings.automaticallyPayUpcoming);
      if (settings.use24HourFormat !== undefined) setUse24HourFormat(settings.use24HourFormat);
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
        removeZeroTransactionEntries,
        automaticallyPayUpcoming,
        use24HourFormat,
      });

      setHasUnsavedChanges(false);
      setSavedSuccess(true);

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
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

  const [downloadingDbDump, setDownloadingDbDump] = useState(false);

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
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage application preferences, theme styles, default currency, and data backups.</p>
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
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-lg transition-all ${
              hasUnsavedChanges
                ? 'bg-accent text-white hover:bg-accent-light scale-105 animate-pulse'
                : 'bg-accent text-white hover:bg-accent-light'
            }`}
          >
            <Save size={18} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* User Profile & Account Management Card */}
      <div className="card border border-accent/40 bg-accent/5 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-accent text-white shadow-lg">
            <User size={26} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">User Profile & Account Security</h2>
            <p className="text-xs text-text-muted mt-0.5">Manage display name, contact email, avatar, and security password.</p>
          </div>
        </div>
        <Link
          href="/profile"
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-md hover:bg-accent-light transition-all whitespace-nowrap text-center"
        >
          Manage User Profile & Security →
        </Link>
      </div>

      {/* Preferences & Default Currency */}
      <div className="card border border-border p-6 rounded-xl space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
            <Globe size={20} className="text-accent" />
            <h2>Regional & Currency Preferences</h2>
          </div>
          {hasUnsavedChanges && (
            <span className="text-xs text-warning font-semibold bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-lg border border-border bg-bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="INR" className="bg-bg-card text-text-primary">INR (₹) — Indian Rupee</option>
              <option value="USD" className="bg-bg-card text-text-primary">USD ($) — US Dollar</option>
              <option value="EUR" className="bg-bg-card text-text-primary">EUR (€) — Euro</option>
              <option value="GBP" className="bg-bg-card text-text-primary">GBP (£) — British Pound</option>
              <option value="CAD" className="bg-bg-card text-text-primary">CAD ($) — Canadian Dollar</option>
              <option value="AUD" className="bg-bg-card text-text-primary">AUD ($) — Australian Dollar</option>
              <option value="JPY" className="bg-bg-card text-text-primary">JPY (¥) — Japanese Yen</option>
              <option value="AED" className="bg-bg-card text-text-primary">AED (د.إ) — UAE Dirham</option>
            </select>
            <p className="text-xs text-text-muted mt-1">Used for new accounts and total dashboard calculations.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Date Display Format</label>
            <select
              value={dateFormat}
              onChange={(e) => {
                setDateFormat(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-lg border border-border bg-bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="DD/MM/YYYY" className="bg-bg-card text-text-primary">DD/MM/YYYY (e.g. 09/08/2026)</option>
              <option value="MM/DD/YYYY" className="bg-bg-card text-text-primary">MM/DD/YYYY (e.g. 08/09/2026)</option>
              <option value="YYYY-MM-DD" className="bg-bg-card text-text-primary">YYYY-MM-DD (e.g. 2026-08-09)</option>
            </select>
            <p className="text-xs text-text-muted mt-1">Format applied across transaction history views.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Number Format</label>
            <select
              value={numberFormat}
              onChange={(e) => {
                setNumberFormat(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-lg border border-border bg-bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="standard" className="bg-bg-card text-text-primary">Standard (1,234.56)</option>
              <option value="compact" className="bg-bg-card text-text-primary">Compact Abbreviation (1.2k)</option>
            </select>
            <p className="text-xs text-text-muted mt-1">Control balance rounding and formatting.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-text-muted mb-2">Time Format</label>
            <select
              value={use24HourFormat}
              onChange={(e) => {
                setUse24HourFormat(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="w-full rounded-lg border border-border bg-bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="system" className="bg-bg-card text-text-primary">System Default</option>
              <option value="true" className="bg-bg-card text-text-primary">24-Hour (14:30)</option>
              <option value="false" className="bg-bg-card text-text-primary">12-Hour (02:30 PM)</option>
            </select>
            <p className="text-xs text-text-muted mt-1">Control how time is displayed.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-accent-light transition-all"
          >
            <Save size={16} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="card border border-border p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
          <Palette size={20} className="text-accent" />
          <h2>Theme & Visual Style</h2>
        </div>
        <p className="text-sm text-text-muted">Select your preferred color theme and visual interface layout.</p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 pt-2">
          {[
            { id: 'dark', label: 'Dark Mode', color: '#0f172a' },
            { id: 'light', label: 'Light Mode', color: '#f8fafc' },
            { id: 'amoled', label: 'AMOLED Black', color: '#000000' },
            { id: 'cyberpunk', label: 'Cyberpunk', color: '#130e28' },
            { id: 'glassmorphism', label: 'Glassmorphism', color: '#0d1117' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                theme === t.id
                  ? 'border-accent bg-accent/10 shadow-lg scale-105'
                  : 'border-border bg-bg-hover hover:border-text-muted'
              }`}
            >
              <div className="w-8 h-8 rounded-full border border-border shadow-inner" style={{ backgroundColor: t.color }} />
              <span className="text-xs font-semibold text-text-primary">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Preferences */}
      <div className="card border border-border p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
          <LayoutDashboard size={20} className="text-accent" />
          <h2>Dashboard Preferences</h2>
        </div>
        <p className="text-sm text-text-muted">Customize which widgets appear on your main dashboard.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {[
            { id: 'netWorth', label: 'Net Worth Summary', state: showNetWorth, setter: setShowNetWorth },
            { id: 'creditDebt', label: 'Credit & Debt', state: showCreditDebt, setter: setShowCreditDebt },
            { id: 'spendingGraph', label: 'Spending Graph', state: showSpendingGraph, setter: setShowSpendingGraph },
            { id: 'pieChart', label: 'Expenses Pie Chart', state: showPieChart, setter: setShowPieChart },
            { id: 'objectives', label: 'Financial Objectives', state: showObjectives, setter: setShowObjectives },
          ].map((widget) => (
            <label key={widget.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent transition-colors">
              <span className="text-sm font-medium text-text-primary">{widget.label}</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={widget.state} 
                  onChange={(e) => {
                    widget.setter(e.target.checked);
                    setHasUnsavedChanges(true);
                  }} 
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Transaction Behaviors */}
      <div className="card border border-border p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
          <Activity size={20} className="text-accent" />
          <h2>Transaction Behavior</h2>
        </div>
        <p className="text-sm text-text-muted">Adjust how transactions are handled automatically.</p>

        <div className="grid grid-cols-1 gap-4 pt-2">
          <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent transition-colors">
            <div>
              <span className="block text-sm font-medium text-text-primary">Hide Zero Value Entries</span>
              <span className="block text-xs text-text-muted mt-0.5">Automatically hide transactions with a 0.00 amount from history.</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={removeZeroTransactionEntries} 
                onChange={(e) => {
                  setRemoveZeroTransactionEntries(e.target.checked);
                  setHasUnsavedChanges(true);
                }} 
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </div>
          </label>
          <label className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-secondary cursor-pointer hover:border-accent transition-colors">
            <div>
              <span className="block text-sm font-medium text-text-primary">Auto-Pay Upcoming</span>
              <span className="block text-xs text-text-muted mt-0.5">Automatically mark scheduled/upcoming transactions as paid on their due date.</span>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={automaticallyPayUpcoming} 
                onChange={(e) => {
                  setAutomaticallyPayUpcoming(e.target.checked);
                  setHasUnsavedChanges(true);
                }} 
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Cashew Data Import Box */}
      <div className="card border border-accent/30 bg-accent/5 p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent text-white rounded-xl shadow-lg">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Database Backup & SQL Importer</h2>
              <p className="text-sm text-text-secondary">Import exported database (.sql / .sqlite / .json) directly into Hoorain.</p>
            </div>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm shadow-md hover:bg-accent-light transition-colors whitespace-nowrap"
          >
            Import Backup File
          </button>
        </div>
      </div>

      {/* Data Export Options Box */}
      <div className="card border border-border p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-text-primary font-bold text-lg">
          <Download size={20} className="text-accent" />
          <h2>Export Options & Backups</h2>
        </div>
        <p className="text-sm text-text-muted">Export your financial records into open formats for reporting or offline storage.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-xl border border-border p-4 bg-bg-secondary flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Export Transactions (CSV)</h3>
                <p className="text-xs text-text-muted">Spreadsheet compatible format (Excel, Google Sheets).</p>
              </div>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={downloadingCsv}
              className="w-full py-2 px-4 rounded-lg border border-border bg-bg-card hover:bg-bg-hover text-text-primary font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              <span>{downloadingCsv ? 'Preparing CSV...' : 'Download CSV'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-border p-4 bg-bg-secondary flex flex-col justify-between space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm">Full System Backup (JSON)</h3>
                <p className="text-xs text-text-muted">Includes Accounts, Categories, Transactions, Budgets & Goals.</p>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              disabled={downloadingJson}
              className="w-full py-2 px-4 rounded-lg border border-border bg-bg-card hover:bg-bg-hover text-text-primary font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              <span>{downloadingJson ? 'Preparing JSON...' : 'Download Full Backup (JSON)'}</span>
            </button>
          </div>

          {/* Dedicated Native Postgres DB Backup & Restore Card */}
          <div className="col-span-1 sm:col-span-2 rounded-xl border border-accent/40 bg-accent/5 p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-accent text-white shadow-lg">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">Native PostgreSQL Database Backup & Restore</h3>
                  <p className="text-xs text-text-muted">Export complete Postgres SQL dump file or restore database tables & records from an existing .sql dump.</p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold px-2.5 py-1 rounded bg-accent/20 text-accent border border-accent/30 tracking-wider">
                Volume Persisted
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportDbDump}
                disabled={downloadingDbDump}
                className="py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-light text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Download size={15} />
                <span>{downloadingDbDump ? 'Exporting DB Dump...' : 'Export Postgres DB Dump (.sql)'}</span>
              </button>
              <button
                onClick={() => setIsDbRestoreModalOpen(true)}
                className="py-2.5 px-4 rounded-xl border border-border bg-bg-card hover:bg-bg-hover text-text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Upload size={15} className="text-accent" />
                <span>Restore Postgres DB Dump (.sql)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone / Data Cleanup Card */}
      <div className="card border border-danger/30 bg-danger/5 p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-danger/10 text-danger rounded-xl">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Data Cleanup & Reset</h2>
              <p className="text-sm text-text-secondary">Erase all financial transactions, accounts, categories, and goals from your account.</p>
            </div>
          </div>
          <button
            onClick={() => setIsCleanupModalOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-danger text-white font-semibold text-sm shadow-md hover:bg-danger/90 transition-colors whitespace-nowrap"
          >
            Erase All Data
          </button>
        </div>
      </div>

      <CashewImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <DbRestoreModal
        isOpen={isDbRestoreModalOpen}
        onClose={() => setIsDbRestoreModalOpen(false)}
      />

      <DataCleanupModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
      />
    </div>
  );
}
