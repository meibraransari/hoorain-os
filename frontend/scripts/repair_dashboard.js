const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/page.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');

// Replace all occurrences of the import with a single one.
const importStr = "import { SavingsRateRunwayWidget } from '@/components/ui/SavingsRateRunwayWidget';\r\n";
const importStr2 = "import { SavingsRateRunwayWidget } from '@/components/ui/SavingsRateRunwayWidget';\n";

dashContent = dashContent.split(importStr).join('');
dashContent = dashContent.split(importStr2).join('');

// Re-insert once at the bottom of the imports
const lastImportMarker = "import { format } from 'date-fns';";
dashContent = dashContent.replace(lastImportMarker, lastImportMarker + "\n" + "import { SavingsRateRunwayWidget } from '@/components/ui/SavingsRateRunwayWidget';");

// Clean up the fuzzy matcher mess from earlier where it duplicated the first 20 lines.
// Actually, let's just restore from git and run the whole pipeline. This is safer.
console.log("Written cleanup script");
