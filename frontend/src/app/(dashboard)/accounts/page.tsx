'use client';

import { useState } from 'react';
import { useAccounts, useAccountTypes } from '@/lib/hooks/useFinance';
import { AccountCard } from '@/components/ui/AccountCard';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
import { ManageAccountTypesModal } from '@/components/modals/ManageAccountTypesModal';
import { Plus, Edit2, Trash2, Wallet, Layers, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePrivacy } from '@/components/providers/PrivacyProvider';

export default function AccountsPage() {
  const { formatPrivateCurrency } = usePrivacy();
  const { accounts, isLoading, deleteAccount } = useAccounts();
  const { accountTypes, deleteAccountType } = useAccountTypes();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<any>(null);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeToEdit, setTypeToEdit] = useState<any>(null);

  const handleEditAccount = (acc: any) => {
    setAccountToEdit(acc);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteAccount(id);
    }
  };

  const handleEditType = (typeObj: any) => {
    setTypeToEdit(typeObj);
    setIsTypeModalOpen(true);
  };

  const handleDeleteType = async (typeObj: any) => {
    const code = typeObj.code || typeObj.name.toLowerCase();
    const assignedCount = accounts.filter((a: any) => a.type === code || a.type?.toLowerCase() === code.toLowerCase()).length;

    let confirmMsg = `Are you sure you want to delete the "${typeObj.name}" account type?`;
    if (assignedCount > 0) {
      confirmMsg = `Warning: "${typeObj.name}" has ${assignedCount} active account(s) assigned to it. Are you sure you want to delete this account type?`;
    }

    if (confirm(confirmMsg)) {
      await deleteAccountType(typeObj.id || code);
      if (selectedType === code) {
        setSelectedType('all');
      }
    }
  };

  const filteredAccounts = selectedType === 'all'
    ? accounts
    : accounts.filter((acc: any) => acc.type === selectedType || acc.type?.toLowerCase() === selectedType.toLowerCase());

  const totalBalance = filteredAccounts.reduce((acc: number, curr: any) => acc + (parseFloat(curr.currentBalance) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Accounts</h1>
          <p className="text-text-secondary mt-1">Manage bank accounts, cash wallets, credit cards, and custom account categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setTypeToEdit(null);
              setIsTypeModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-hover transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Account Type</span>
          </button>

          <button
            onClick={() => {
              setAccountToEdit(null);
              setIsAccountModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-accent-light hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Account Types Manager */}
        <div className="card p-4 border border-border rounded-xl space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 font-semibold text-text-primary">
              <Layers size={18} className="text-accent" />
              <span>Account Types</span>
            </div>
            <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-secondary font-medium">
              {accountTypes.length} Types
            </span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selectedType === 'all'
                  ? 'bg-accent/15 text-accent font-semibold'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter size={15} />
                <span>All Accounts</span>
              </div>
              <span className="text-xs font-bold text-text-muted">{accounts.length}</span>
            </button>

            {accountTypes.map((t: any) => {
              const code = t.code || t.name.toLowerCase();
              const count = accounts.filter((a: any) => a.type === code || a.type?.toLowerCase() === code.toLowerCase()).length;
              const isSelected = selectedType === code;

              return (
                <div
                  key={t.id || t.code}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent/15 text-accent font-semibold'
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                  onClick={() => setSelectedType(code)}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3f51b5' }} />
                    <span className="truncate">{t.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-text-muted group-hover:hidden">{count}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditType(t);
                        }}
                        className="p-1 text-text-muted hover:text-accent transition-colors"
                        title="Edit Account Type"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteType(t);
                        }}
                        className="p-1 text-text-muted hover:text-expense transition-colors"
                        title="Delete Account Type"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              setTypeToEdit(null);
              setIsTypeModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-border text-xs text-text-muted hover:text-accent hover:border-accent/40 transition-colors"
          >
            <Plus size={14} />
            <span>Create Custom Account Type</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Total Balance Stat Card */}
          <div className="card bg-gradient-to-r from-bg-card to-bg-hover border border-border p-6 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-text-muted">
                {selectedType === 'all' ? 'Total Accounts Balance' : `Filtered Balance (${selectedType})`}
              </span>
              <div className="text-3xl font-bold text-text-primary mt-1">{formatPrivateCurrency(totalBalance)}</div>
            </div>
            <div className="p-3 bg-accent/10 text-accent rounded-xl">
              <Wallet size={28} />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 rounded-xl skeleton" />
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="card p-12 text-center text-text-muted space-y-3 border border-dashed border-border rounded-xl">
              <Wallet size={48} className="mx-auto text-text-muted/50" />
              <p className="text-lg font-medium text-text-primary">No accounts found</p>
              <p className="text-sm text-text-muted">
                {selectedType === 'all'
                  ? 'Click "Add Account" or import your Cashew export file to create accounts.'
                  : `No accounts created under "${selectedType}". Click "Add Account" to create one.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts.map((acc: any) => (
                <div key={acc.id} className="relative group">
                  <AccountCard account={acc} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-bg-card/90 backdrop-blur-sm p-1 rounded-lg border border-border">
                    <button
                      onClick={() => handleEditAccount(acc)}
                      className="p-1.5 text-text-muted hover:text-accent transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 text-text-muted hover:text-expense transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountToEdit={accountToEdit}
      />

      <ManageAccountTypesModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        typeToEdit={typeToEdit}
      />
    </div>
  );
}
