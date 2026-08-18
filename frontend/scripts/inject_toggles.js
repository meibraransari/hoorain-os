const fs = require('fs');
const path = require('path');

function replaceRegexInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [find, replace] of replacements) {
    content = content.replace(find, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. DASHBOARD
const dashPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/page.tsx');
replaceRegexInFile(dashPath, [
  [
    /showHealthScore = true,/g,
    `showHealthScore = true,\n    showIncomeCard = true,\n    showExpenseCard = true,\n    showSavingsRateCard = true,\n    showRecentTransactions = true,\n    showSavingsRateRunway = true,`
  ],
  [
    /\{ key: 'showQuickTransfer', label: 'Quick Fund Transfer Tool', active: showQuickTransfer, icon: Sparkles \},/g,
    `{ key: 'showQuickTransfer', label: 'Quick Fund Transfer Tool', active: showQuickTransfer, icon: Sparkles },\n                    { key: 'showIncomeCard', label: 'Income KPI Card', active: showIncomeCard, icon: TrendingUp },\n                    { key: 'showExpenseCard', label: 'Expenses KPI Card', active: showExpenseCard, icon: TrendingDown },\n                    { key: 'showSavingsRateCard', label: 'Savings Rate KPI Card', active: showSavingsRateCard, icon: Target },\n                    { key: 'showRecentTransactions', label: 'Recent Transactions Widget', active: showRecentTransactions, icon: LayoutGrid },\n                    { key: 'showSavingsRateRunway', label: 'Financial Runway Widget', active: showSavingsRateRunway, icon: Activity },\n                    { key: 'showHealthScore', label: 'AI Financial Health Score', active: showHealthScore, icon: BrainCircuit },`
  ],
  [
    /<StatCard[\s\S]*?title=\{`Income \(\$\{currentMonthLabel\}\)`\}/g,
    `{showIncomeCard && <StatCard\n          title={\`Income (\${currentMonthLabel})\`}`
  ],
  [
    /isLoading=\{txLoading\}\s*\/>\s*<StatCard\s*title=\{`Expenses \(\$\{currentMonthLabel\}\)`\}/g,
    `isLoading={txLoading}\n        />}\n        {showExpenseCard && <StatCard\n          title={\`Expenses (\${currentMonthLabel})\`}`
  ],
  [
    /isLoading=\{txLoading\}\s*\/>\s*<StatCard\s*title="Savings Rate"/g,
    `isLoading={txLoading}\n        />}\n        {showSavingsRateCard && <StatCard\n          title="Savings Rate"`
  ],
  [
    /isLoading=\{txLoading\}\s*\/>\s*<\/div>/g,
    `isLoading={txLoading}\n        />}\n      </div>`
  ],
  [
    /<CollapsibleCard\s*title=\{`Recent Transactions \(\$\{currentMonthLabel\}\)`\}/g,
    `{showRecentTransactions && <CollapsibleCard\n            title={\`Recent Transactions (\${currentMonthLabel})\`}`
  ],
  [
    /<\/tbody>\s*<\/table>\s*<\/div>\s*\)\}\s*<\/CollapsibleCard>/g,
    `</tbody>\n                </table>\n              </div>\n            )}\n          </CollapsibleCard>}`
  ],
  [
    /\{\/\* 2\. Financial Runway Widget \*\/\}\s*<SavingsRateRunwayWidget \/>/g,
    `{/* 2. Financial Runway Widget */}\n          {showSavingsRateRunway && <SavingsRateRunwayWidget />}`
  ]
]);

// 2. ANALYTICS
const analyticsPath = path.join(__dirname, '../src/app/(dashboard)/dashboard-analytics/page.tsx');
replaceRegexInFile(analyticsPath, [
  [
    /showCreditUtilization = true,/g,
    `showCreditUtilization = true,\n    showWeeklySpendingHeatmap = true,`
  ],
  [
    /\{ key: 'showCategoryAnalytics', label: 'Category Expense Progress', active: showCategoryAnalytics, icon: PieChartIcon \},/g,
    `{ key: 'showCategoryAnalytics', label: 'Category Expense Progress', active: showCategoryAnalytics, icon: PieChartIcon },\n                    { key: 'showCreditUtilization', label: 'Credit Utilization & Debt Safety Gauge', active: showCreditUtilization, icon: ShieldAlert },\n                    { key: 'showWeeklySpendingHeatmap', label: 'Weekly Spending Velocity', active: showWeeklySpendingHeatmap, icon: Activity },`
  ],
  [
    /<WeeklySpendingHeatmap \/>/g,
    `{showWeeklySpendingHeatmap && <WeeklySpendingHeatmap />}`
  ]
]);

// 3. PLANNING
const planningPath = path.join(__dirname, '../src/app/(dashboard)/dashboard-planning/page.tsx');
replaceRegexInFile(planningPath, [
  [
    /showObjectives = (true|false),/g,
    `showObjectives = $1,\n    showGoalVelocityTracker = true,\n    showMonthlyBudgets = true,`
  ],
  [
    /\{ key: 'showRecurringBills', label: 'Overdue & Upcoming Bills Widget', active: showRecurringBills, icon: CalendarClock \},/g,
    `{ key: 'showRecurringBills', label: 'Overdue & Upcoming Bills Widget', active: showRecurringBills, icon: CalendarClock },\n                    { key: 'showGoalVelocityTracker', label: 'Goal Velocity Tracker', active: showGoalVelocityTracker, icon: Target },\n                    { key: 'showMonthlyBudgets', label: 'Monthly Budgets Overview', active: showMonthlyBudgets, icon: Wallet },\n                    { key: 'showObjectives', label: 'Financial Goals & Objectives', active: showObjectives, icon: Target },`
  ],
  [
    /<GoalVelocityTracker \/>/g,
    `{showGoalVelocityTracker && <GoalVelocityTracker />}`
  ],
  [
    /<CollapsibleCard\s*title="Monthly Budgets"/g,
    `{showMonthlyBudgets && <CollapsibleCard\n            title="Monthly Budgets"`
  ],
  [
    /<\/div>\s*\)\}\s*<\/CollapsibleCard>/g,
    `</div>\n            )}\n          </CollapsibleCard>}`
  ]
]);

console.log("All files updated successfully with regex replacements.");
