const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../src/app/(dashboard)');

// Dashboard
const dashPath = path.join(root, 'dashboard/page.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

dashContent = dashContent.replace(`import { ExecutiveProfitLossWidget } from '@/components/ui/ExecutiveProfitLossWidget';
import { CreditUtilizationWidget } from '@/components/ui/CreditUtilizationWidget';`, `import { SavingsRateRunwayWidget } from '@/components/ui/SavingsRateRunwayWidget';`);

// Remove analytics/planning widgets imports from dashboard
dashContent = dashContent.replace(/import { AreaChart }.*?\n/g, '');
dashContent = dashContent.replace(/import { PieChart }.*?\n/g, '');
dashContent = dashContent.replace(/import { BudgetCard }.*?\n/g, '');
dashContent = dashContent.replace(/import { CategoryAnalyticsWidget }.*?\n/g, '');
dashContent = dashContent.replace(/import { DateRangePicker }.*?\n/g, '');
dashContent = dashContent.replace(/import { RecurringBillsWidget }.*?\n/g, '');

// Clean up left column in dashboard
dashContent = dashContent.replace(
  /{showProfitLoss && <ExecutiveProfitLossWidget \/>}\s*{\/\* Credit Utilization & Debt Safety Gauge Widget \*\/}\s*{showCreditUtilization && <CreditUtilizationWidget \/>}\s*{\/\* 1\. Cash Flow Analysis Chart \*\/}\s*{showSpendingGraph && \([\s\S]*?\)}\s*{\/\* 2\. Quick Transfer Tool \(Persistently toggled\) \*\/}/m,
  '{showQuickTransfer && <QuickTransferWidget />}\n\n          {/* Savings Rate Runway Widget */}\n          <SavingsRateRunwayWidget />'
);

// Clean up right column in dashboard
dashContent = dashContent.replace(
  /{\/\* 2\. Overdue & Upcoming Bills Widget \*\/}[\s\S]*?(?={\/\* AddTransactionModal \*\/})/m,
  '</div>\n      </div>\n\n      '
);
// Above regex stops at modal or end of div. Let's make it cleaner
dashContent = dashContent.replace(
  /{\/\* 2\. Overdue & Upcoming Bills Widget \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<AddTransactionModal/m,
  '</div>\n      </div>\n\n      <AddTransactionModal'
);

// Also remove `showCreditDebt = true,` etc inside settings block of dash
dashContent = dashContent.replace(/showSpendingGraph = true,\s*showPieChart = true,\s*showObjectives = false,\s*/, '');
dashContent = dashContent.replace(/showCategoryAnalytics = true,\s*showRecurringBills = true,\s*/, '');
dashContent = dashContent.replace(/showProfitLoss = true,\s*showCreditUtilization = true,\s*/, '');

fs.writeFileSync(dashPath, dashContent);

// Analytics
const anaPath = path.join(root, 'dashboard-analytics/page.tsx');
let anaContent = fs.readFileSync(anaPath, 'utf8');
anaContent = anaContent.replace(`export default function DashboardPage()`, `export default function AnalyticsDashboardPage()`);
anaContent = anaContent.replace(/<h1 className="text-3xl font-display font-bold text-text-primary">Dashboard<\/h1>/, `<h1 className="text-3xl font-display font-bold text-text-primary">Cashflow Analytics</h1>`);
anaContent = anaContent.replace(/Here is your financial performance for \{currentMonthLabel\}\./, `Deep dive into your spending and income trends.`);

// Replace accounts quick summary and KPI grid
anaContent = anaContent.replace(
  /{\/\* Account Quick Summary Widget Bar \(If visible accounts exist\) \*\/}[\s\S]*?{\/\* Integrated Masonry Dashboard Grid \*\/}/m,
  '{/* Integrated Masonry Dashboard Grid */}'
);

anaContent = anaContent.replace(
  /import { ExecutiveProfitLossWidget } from '@\/components\/ui\/ExecutiveProfitLossWidget';/,
  `import { ExecutiveProfitLossWidget } from '@/components/ui/ExecutiveProfitLossWidget';\nimport { WeeklySpendingHeatmap } from '@/components/ui/WeeklySpendingHeatmap';`
);

anaContent = anaContent.replace(
  /{\/\* 2\. Quick Transfer Tool \(Persistently toggled\) \*\/}[\s\S]*?(?=<\/div>\s*{\/\* Right Column)/m,
  '<WeeklySpendingHeatmap />\n        '
);

anaContent = anaContent.replace(
  /{\/\* 1\. AI Financial Health Score Widget \*\/}\s*{showHealthScore && <FinancialHealthWidget \/>}\s*{\/\* 2\. Overdue & Upcoming Bills Widget \*\/}\s*{showRecurringBills && <RecurringBillsWidget \/>}/m,
  ''
);

anaContent = anaContent.replace(
  /{\/\* 3\. Monthly Budgets Overview \*\/}[\s\S]*?(?=<\/div>\s*<\/div>\s*<AddTransactionModal)/m,
  ''
);

fs.writeFileSync(anaPath, anaContent);

// Planning
const planPath = path.join(root, 'dashboard-planning/page.tsx');
let planContent = fs.readFileSync(planPath, 'utf8');
planContent = planContent.replace(`export default function DashboardPage()`, `export default function PlanningDashboardPage()`);
planContent = planContent.replace(/<h1 className="text-3xl font-display font-bold text-text-primary">Dashboard<\/h1>/, `<h1 className="text-3xl font-display font-bold text-text-primary">Planning & Future</h1>`);
planContent = planContent.replace(/Here is your financial performance for \{currentMonthLabel\}\./, `Stay ahead of upcoming bills, goals, and budgets.`);

planContent = planContent.replace(
  /import { ExecutiveProfitLossWidget } from '@\/components\/ui\/ExecutiveProfitLossWidget';/,
  `import { ExecutiveProfitLossWidget } from '@/components/ui/ExecutiveProfitLossWidget';\nimport { GoalVelocityTracker } from '@/components/ui/GoalVelocityTracker';`
);

planContent = planContent.replace(
  /{\/\* Account Quick Summary Widget Bar \(If visible accounts exist\) \*\/}[\s\S]*?{\/\* Integrated Masonry Dashboard Grid \*\/}/m,
  '{/* Integrated Masonry Dashboard Grid */}'
);

planContent = planContent.replace(
  /{\/\* Executive P&L Summary Widget \*\/}[\s\S]*?{\/\* Credit Utilization & Debt Safety Gauge Widget \*\/}/m,
  '<GoalVelocityTracker />\n          {/* Credit Utilization & Debt Safety Gauge Widget */}'
);

planContent = planContent.replace(
  /{\/\* 1\. Cash Flow Analysis Chart \*\/}[\s\S]*?(?=<\/div>\s*{\/\* Right Column)/m,
  ''
);

planContent = planContent.replace(
  /{\/\* 1\. AI Financial Health Score Widget \*\/}\s*{showHealthScore && <FinancialHealthWidget \/>}\s*{\/\* 2\. Overdue & Upcoming Bills Widget \*\/}/m,
  '{/* 2. Overdue & Upcoming Bills Widget */}'
);

planContent = planContent.replace(
  /{\/\* 2\. Top Expenses Donut Widget \*\/}[\s\S]*?{\/\* 3\. Monthly Budgets Overview \*\/}/m,
  '{/* 3. Monthly Budgets Overview */}'
);

fs.writeFileSync(planPath, planContent);
console.log("Done");
