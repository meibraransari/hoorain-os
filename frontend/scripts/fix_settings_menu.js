const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../src/app/(dashboard)');

// Fix Dashboard
const dashPath = path.join(root, 'dashboard/page.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
dashContent = dashContent.replace(
  /\{\s*key:\s*'showProfitLoss'[\s\S]*?(?=\{\s*key:\s*'showHealthScore')/m,
  ''
);
dashContent = dashContent.replace(
  /\{\s*key:\s*'showCreditDebt'[\s\S]*?(?=\{\s*key:\s*'showQuickTransfer')/m,
  ''
);
dashContent = dashContent.replace(
  /\{\s*key:\s*'showCategoryAnalytics'[\s\S]*?(?=\]\.map\()/m,
  ''
);
fs.writeFileSync(dashPath, dashContent);

// Fix Analytics Dashboard
const anaPath = path.join(root, 'dashboard-analytics/page.tsx');
let anaContent = fs.readFileSync(anaPath, 'utf8');
anaContent = anaContent.replace(
  /\{\s*key:\s*'showNetWorth'[\s\S]*?(?=\{\s*key:\s*'showProfitLoss')/m,
  ''
);
anaContent = anaContent.replace(
  /\{\s*key:\s*'showHealthScore'[\s\S]*?(?=\{\s*key:\s*'showSpendingGraph')/m,
  ''
);
anaContent = anaContent.replace(
  /\{\s*key:\s*'showRecurringBills'[\s\S]*?(?=\{\s*key:\s*'showCategoryAnalytics')/m,
  ''
);
fs.writeFileSync(anaPath, anaContent);

// Fix Planning Dashboard
const planPath = path.join(root, 'dashboard-planning/page.tsx');
let planContent = fs.readFileSync(planPath, 'utf8');
planContent = planContent.replace(
  /\{\s*key:\s*'showNetWorth'[\s\S]*?(?=\{\s*key:\s*'showCreditUtilization')/m,
  ''
);
planContent = planContent.replace(
  /\{\s*key:\s*'showHealthScore'[\s\S]*?(?=\{\s*key:\s*'showRecurringBills')/m,
  ''
);
planContent = planContent.replace(
  /\{\s*key:\s*'showObjectives'[\s\S]*?(?=\]\.map\()/m,
  ''
);
// In planning, we also have CategoryAnalytics and QuickTransfer that needs removal from popup
planContent = planContent.replace(
  /\{\s*key:\s*'showQuickTransfer'[\s\S]*?(?=\]\.map\()/m,
  ''
);
fs.writeFileSync(planPath, planContent);
console.log("Fixes applied.");
