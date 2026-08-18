const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(dashboard)/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add DraggableDashboard import
if (!content.includes('DraggableDashboard')) {
  content = content.replace(
    `import { useSettings, AppSettings } from '@/components/providers/SettingsProvider';`,
    `import { useSettings, AppSettings } from '@/components/providers/SettingsProvider';\nimport { DraggableDashboard, DashboardWidget } from '@/components/ui/DraggableDashboard';`
  );
}

// 2. We need to extract the NetWorth, Income, Expense, Savings Rate, Recent Transactions, Health, Runway, and Transfer widgets.
// They are located between {/* KPI Cards Grid */} and the final </div> just above AddTransactionModal.
const startMarker = `{/* KPI Cards Grid */}`;
const endMarker = `<AddTransactionModal isOpen={isAddTxOpen} onClose={() => setIsAddTxOpen(false)} />`;

const parts = content.split(startMarker);
if (parts.length < 2) {
  console.log("Could not find start marker");
  process.exit(1);
}

const preContent = parts[0];
const postParts = parts[1].split(endMarker);
const widgetJSX = postParts[0];
const postContent = endMarker + postParts[1];

// Let's create the array building logic
const newWidgetSection = `
      {/* Draggable Dashboard Layout */}
      <DraggableDashboard 
        pageKey="mainOverview" 
        widgets={[
          ...(showNetWorth ? [{
            id: 'netWorth',
            defaultLayout: { w: 1, h: 2, x: 0, y: 0 },
            component: (
              <CollapsibleCard
                title={
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-text-muted">Net Worth</span>
                  </div>
                }
                action={
                  <div className="p-2 bg-accent/10 text-accent rounded-xl">
                    <Wallet size={18} />
                  </div>
                }
              >
                <div>
                  <div className={\`text-2xl font-bold \${netWorth >= 0 ? 'text-text-primary' : 'text-expense'}\`}>
                    {formatPrivateCurrency(netWorth)}
                  </div>
                  {showCreditDebt && (
                    <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-border">
                      <span className="text-income font-medium flex items-center gap-0.5">
                        <ArrowUpRight size={13} /> Assets: {formatPrivateCurrency(totalAssets)}
                      </span>
                      <span className="text-expense font-medium flex items-center gap-0.5">
                        <ArrowDownRight size={13} /> Debt: {formatPrivateCurrency(totalLiabilities)}
                      </span>
                    </div>
                  )}
                </div>
                {totalLiabilities > 0 && (
                  <Link
                    href="/accounts"
                    className="flex items-center gap-1 text-[11px] text-accent hover:underline pt-2 block"
                  >
                    <AlertCircle size={12} />
                    <span>Edit account initial balances to adjust Net Worth</span>
                  </Link>
                )}
              </CollapsibleCard>
            )
          }] : []),
          ...(showIncomeCard ? [{
            id: 'income',
            defaultLayout: { w: 1, h: 2, x: 1, y: 0 },
            component: (
              <StatCard
                title={\`Income (\${currentMonthLabel})\`}
                value={formatPrivateCurrency(monthlyIncome)}
                subtitle={\`Yearly \${currentYear}: \${formatPrivateCurrency(yearlyIncome)}\`}
                icon={<TrendingUp size={20} className="text-income" />}
                trend="This Month"
                trendType="up"
                isLoading={txLoading}
              />
            )
          }] : []),
          ...(showExpenseCard ? [{
            id: 'expense',
            defaultLayout: { w: 1, h: 2, x: 2, y: 0 },
            component: (
              <StatCard
                title={\`Expenses (\${currentMonthLabel})\`}
                value={formatPrivateCurrency(monthlyExpense)}
                subtitle={\`Yearly \${currentYear}: \${formatPrivateCurrency(yearlyExpense)}\`}
                icon={<TrendingDown size={20} className="text-expense" />}
                trend="This Month"
                trendType="down"
                isLoading={txLoading}
              />
            )
          }] : []),
          ...(showSavingsRateCard ? [{
            id: 'savingsRate',
            defaultLayout: { w: 1, h: 2, x: 0, y: 2 },
            component: (
              <StatCard
                title="Savings Rate"
                value={formatPrivateNumber(savingsRate, '%')}
                subtitle={\`Yearly Net: \${formatPrivateCurrency(yearlyIncome - yearlyExpense)}\`}
                icon={<Target size={20} className="text-accent" />}
                isLoading={txLoading}
              />
            )
          }] : []),
          ...(showRecentTransactions ? [{
            id: 'recentTx',
            defaultLayout: { w: 2, h: 4, x: 0, y: 4 },
            component: (
              <CollapsibleCard
                title={\`Recent Transactions (\${currentMonthLabel})\`}
                action={
                  <Link href="/transactions" className="text-xs font-semibold text-accent hover:underline">
                    View All
                  </Link>
                }
              >
                {txLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 rounded-xl skeleton" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-sm">
                    No transactions recorded yet. Click "Add Transaction" or import your database backup.
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-2 pb-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-bg-secondary text-text-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Date</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Description</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Category</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Account</th>
                          <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {transactions.slice(0, 7).map((tx: any) => {
                          const rawAmount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0;
                          const isTransfer = tx.isTransfer || tx.type === 'transfer';
                          const isIncome = !isTransfer && (tx.type === 'income' || tx.income === 1);
                          const categoryName = typeof tx.category === 'string' ? tx.category : tx.category?.name || (isTransfer ? 'Transfer' : 'General');
                          const accountName = typeof tx.account === 'string' ? tx.account : tx.account?.name || 'Account';
                          const primaryTitle = tx.title || categoryName || 'Transaction';
                          const formattedDate = tx.date ? format(new Date(tx.date), 'EEEE, MMMM d, yyyy') : 'Unknown Date';
                          
                          const iconVal = typeof tx.category === 'object' ? tx.category?.icon : undefined;
                          const categoryIcon = renderCategoryIcon(iconVal, categoryName);
                          
                          return (
                            <tr key={tx.id} className="hover:bg-bg-hover transition-colors group">
                              <td className="px-4 py-3 text-text-secondary font-medium">{formattedDate}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={\`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm text-base \${
                                      isTransfer
                                        ? 'bg-transfer/20 text-transfer border border-violet-500/20'
                                        : isIncome
                                        ? 'bg-income/20 text-income border border-income/20'
                                        : 'bg-expense/20 text-expense border border-expense/20'
                                    }\`}
                                  >
                                    {isTransfer ? '🔄' : categoryIcon}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-text-primary group-hover:text-accent-light transition-colors">
                                      {primaryTitle}
                                    </span>
                                    {tx.notes && (
                                      <span className="text-[11px] text-text-muted truncate max-w-[200px] mt-0.5">{tx.notes}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-bg-secondary border border-border text-xs font-semibold text-text-secondary">
                                  {categoryName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-text-secondary">
                                <span className="font-semibold">{accountName}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span
                                  className={\`font-extrabold text-[15px] tracking-tight \${
                                    isTransfer
                                      ? 'text-info'
                                      : isIncome
                                      ? 'text-success'
                                      : 'text-text-primary'
                                  }\`}
                                >
                                  {isTransfer ? '' : isIncome ? '+' : '-'}{formatPrivateCurrency(Math.abs(rawAmount))}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CollapsibleCard>
            )
          }] : []),
          ...(showHealthScore ? [{
            id: 'health',
            defaultLayout: { w: 1, h: 2, x: 2, y: 2 },
            component: <FinancialHealthWidget />
          }] : []),
          ...(showSavingsRateRunway ? [{
            id: 'runway',
            defaultLayout: { w: 1, h: 2, x: 2, y: 4 },
            component: <SavingsRateRunwayWidget />
          }] : []),
          ...(showQuickTransfer ? [{
            id: 'transfer',
            defaultLayout: { w: 1, h: 2, x: 2, y: 6 },
            component: <QuickTransferWidget />
          }] : [])
        ]} 
      />

      `;

const newContent = preContent + newWidgetSection + postContent;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("dashboard/page.tsx refactored successfully!");
