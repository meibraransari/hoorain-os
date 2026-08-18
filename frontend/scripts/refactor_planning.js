const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(dashboard)/dashboard-planning/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('DraggableDashboard')) {
  content = content.replace(
    `import { useSettings, AppSettings } from '@/components/providers/SettingsProvider';`,
    `import { useSettings, AppSettings } from '@/components/providers/SettingsProvider';\nimport { DraggableDashboard, DashboardWidget } from '@/components/ui/DraggableDashboard';`
  );
}

const startMarker = `{/* Integrated Masonry Dashboard Grid */}`;
const endMarker = `<AddTransactionModal isOpen={isAddTxOpen} onClose={() => setIsAddTxOpen(false)} />`;

const parts = content.split(startMarker);
if (parts.length < 2) {
  console.log("Could not find start marker");
  process.exit(1);
}

const preContent = parts[0];
const postParts = parts[1].split(endMarker);
const postContent = endMarker + postParts[1];

const newWidgetSection = `
      {/* Draggable Dashboard Layout */}
      <DraggableDashboard 
        pageKey="planningDashboard" 
        widgets={[
          ...(showGoalVelocityTracker ? [{
            id: 'goalVelocityTracker',
            defaultLayout: { w: 2, h: 4, x: 0, y: 0 },
            component: <GoalVelocityTracker />
          }] : []),
          ...(showCreditUtilization ? [{
            id: 'creditUtilPlanning',
            defaultLayout: { w: 2, h: 2, x: 0, y: 4 },
            component: <CreditUtilizationWidget />
          }] : []),
          ...(showRecurringBills ? [{
            id: 'recurringBills',
            defaultLayout: { w: 1, h: 3, x: 2, y: 0 },
            component: <RecurringBillsWidget />
          }] : []),
          ...(showMonthlyBudgets ? [{
            id: 'monthlyBudgets',
            defaultLayout: { w: 1, h: 4, x: 2, y: 3 },
            component: (
              <CollapsibleCard
                title="Monthly Budgets"
                action={
                  <Link href="/budgets" className="text-xs font-semibold text-accent hover:underline">
                    Manage Budgets
                  </Link>
                }
              >
                {budgetLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 rounded-xl skeleton" />
                    ))}
                  </div>
                ) : budgets.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-sm space-y-2">
                    <p>No active monthly budgets set up.</p>
                    <Link href="/budgets" className="text-xs font-semibold text-accent hover:underline inline-block">
                      + Create Monthly Budget
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {budgets.slice(0, 3).map((b: any) => (
                      <BudgetCard key={b.id} budget={b} />
                    ))}
                  </div>
                )}
              </CollapsibleCard>
            )
          }] : []),
          ...(showObjectives ? [{
            id: 'financialObjectives',
            defaultLayout: { w: 1, h: 2, x: 2, y: 7 },
            component: (
              <CollapsibleCard
                title="Financial Goals & Objectives"
                action={
                  <Link href="/goals" className="text-xs font-semibold text-accent hover:underline">
                    Manage Goals
                  </Link>
                }
              >
                <div className="p-4 text-center text-text-muted text-sm space-y-2">
                  <p>Financial Objectives widget is active.</p>
                  <Link href="/goals" className="text-xs font-semibold text-accent hover:underline inline-block">
                    + View Financial Goals
                  </Link>
                </div>
              </CollapsibleCard>
            )
          }] : [])
        ]} 
      />

      `;

const newContent = preContent + newWidgetSection + postContent;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("dashboard-planning/page.tsx refactored successfully!");
