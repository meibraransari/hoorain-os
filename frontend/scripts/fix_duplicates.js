const fs = require('fs');
const path = require('path');

const paths = [
  path.join(__dirname, '../src/app/(dashboard)/dashboard/page.tsx'),
  path.join(__dirname, '../src/app/(dashboard)/dashboard-analytics/page.tsx'),
  path.join(__dirname, '../src/app/(dashboard)/dashboard-planning/page.tsx')
];

paths.forEach(p => {
  let content = fs.readFileSync(p, 'utf8');
  let lines = content.split(/\r?\n/);
  
  // Only check imports section (first 100 lines)
  let seen = new Set();
  let newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('import ') && line.includes('@/components/')) {
      if (seen.has(line)) {
        console.log(`Removed duplicate import in ${path.basename(p)}: ${line}`);
        continue;
      }
      seen.add(line);
    }
    newLines.push(line);
  }
  
  fs.writeFileSync(p, newLines.join('\n'));
});

console.log("Duplicate imports cleaned.");
