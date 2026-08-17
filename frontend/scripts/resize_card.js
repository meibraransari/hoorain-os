const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '../src/app/(dashboard)/dashboard/page.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// The regex will replace the old layout grid with the new tighter grid
content = content.replace(
  /<div className="flex items-center gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar">/g,
  '<div className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar items-start">'
);

content = content.replace(
  /w-64 min-w-\[240px\] p-4/g,
  'w-56 min-w-[224px] h-[100px] p-3.5'
);

content = content.replace(
  /w-10 h-10 rounded-xl/g,
  'w-8 h-8 rounded-lg'
);

content = content.replace(
  /<AccIcon size={18} \/>/g,
  '<AccIcon size={14} />'
);

content = content.replace(
  /text-\[10px\] font-extrabold uppercase tracking-wider px-2\.5 py-1/g,
  'text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5'
);

content = content.replace(
  /<div className="mt-4 space-y-1">/g,
  '<div className="mt-2 space-y-0.5">'
);

content = content.replace(
  /<span className="text-xs font-bold text-text-primary/g,
  '<span className="text-[11px] font-bold text-text-primary'
);

content = content.replace(
  /font-mono text-lg sm:text-xl font-extrabold/g,
  'font-mono text-base font-extrabold'
);

content = content.replace(
  /<ChevronRight size={16}/g,
  '<ChevronRight size={14}'
);

content = content.replace(
  /w-28 h-28/g,
  'w-24 h-24'
);

fs.writeFileSync(dashPath, content);
console.log("Card UI resized.");
