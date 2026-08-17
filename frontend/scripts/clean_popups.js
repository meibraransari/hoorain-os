const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../src/app/(dashboard)');

function updatePopup(filePath, newItems) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the widgets array start
  const regex = /\{\[\s*\{[\s\S]*?\]\.map\(\(item\) => \{/m;
  
  let newArrayString = '{[\n';
  for (const item of newItems) {
    newArrayString += `                    { key: '${item.key}', label: '${item.label}', active: ${item.key}, icon: ${item.icon} },\n`;
  }
  newArrayString += `                  ].map((item) => {`;
  
  if (regex.test(content)) {
    content = content.replace(regex, newArrayString);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Failed to match regex in ${filePath}`);
  }
}

const dashWidgets = [
  { key: 'showNetWorth', label: 'Net Worth KPI Card', icon: 'Wallet' },
  { key: 'showQuickTransfer', label: 'Quick Fund Transfer Tool', icon: 'Sparkles' },
];

const analyticsWidgets = [
  { key: 'showProfitLoss', label: 'Executive P&L Summary Widget', icon: 'BarChart3' },
  { key: 'showSpendingGraph', label: 'Cash Flow Analysis Chart', icon: 'TrendingUp' },
  { key: 'showPieChart', label: 'Top Expenses Donut Chart', icon: 'PieChartIcon' },
  { key: 'showCategoryAnalytics', label: 'Category Expense Progress', icon: 'PieChartIcon' },
];

const planningWidgets = [
  { key: 'showCreditUtilization', label: 'Credit Utilization & Debt Safety Gauge', icon: 'ShieldAlert' },
  { key: 'showRecurringBills', label: 'Overdue & Upcoming Bills Widget', icon: 'CalendarClock' },
];

updatePopup(path.join(root, 'dashboard/page.tsx'), dashWidgets);
updatePopup(path.join(root, 'dashboard-analytics/page.tsx'), analyticsWidgets);
updatePopup(path.join(root, 'dashboard-planning/page.tsx'), planningWidgets);

console.log("Popups updated.");
