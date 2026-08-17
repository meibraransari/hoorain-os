const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../src/app/(dashboard)');

// Dashboard
const dashPath = path.join(root, 'dashboard/page.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
dashContent = dashContent.replace(
  /import \{ CreditUtilizationWidget \} from '@\/components\/ui\/CreditUtilizationWidget';/g,
  `import { CreditUtilizationWidget } from '@/components/ui/CreditUtilizationWidget';\nimport { SavingsRateRunwayWidget } from '@/components/ui/SavingsRateRunwayWidget';`
);
fs.writeFileSync(dashPath, dashContent);

console.log("Imports fixed.");
