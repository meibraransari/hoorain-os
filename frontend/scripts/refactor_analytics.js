const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(dashboard)/dashboard-analytics/page.tsx');
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
        pageKey="analyticsDashboard" 
        widgets={[
          ...(showProfitLoss ? [{
            id: 'profitLoss',
            defaultLayout: { w: 2, h: 2, x: 0, y: 0 },
            component: <ExecutiveProfitLossWidget />
          }] : []),
          ...(showCreditUtilization ? [{
            id: 'creditUtil',
            defaultLayout: { w: 2, h: 2, x: 0, y: 2 },
            component: <CreditUtilizationWidget />
          }] : []),
          ...(showSpendingGraph ? [{
            id: 'spendingGraph',
            defaultLayout: { w: 2, h: 4, x: 0, y: 4 },
            component: (
              <AreaChart
                data={chartData}
                title={
                  chartTimeframe === 'thisMonth'
                    ? \`Daily Cash Flow (\${currentMonthLabel})\`
                    : chartTimeframe === 'monthlyTrend'
                    ? \`12-Month Cash Flow Trend (\${currentYear})\`
                    : \`Cash Flow Trend (\${customStartDate && customEndDate ? \`\${customStartDate} → \${customEndDate}\` : 'Custom Range'})\`
                }
                height={320}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-bg-card p-1 rounded-xl border border-border shadow-sm">
                      <button
                        onClick={() => setChartTimeframe('thisMonth')}
                        className={\`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer \${
                          chartTimeframe === 'thisMonth'
                            ? 'bg-accent text-white shadow-sm font-bold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                        }\`}
                      >
                        This Month (Daily)
                      </button>
                      <button
                        onClick={() => setChartTimeframe('monthlyTrend')}
                        className={\`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer \${
                          chartTimeframe === 'monthlyTrend'
                            ? 'bg-accent text-white shadow-sm font-bold'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                        }\`}
                      >
                        12-Month Trend
                      </button>
                    </div>
                    <DateRangePicker
                      startDate={customStartDate}
                      endDate={customEndDate}
                      datePreset={customPresetKey}
                      onSelectRange={handleSelectCustomRange}
                    />
                  </div>
                }
              />
            )
          }] : []),
          ...(showWeeklySpendingHeatmap ? [{
            id: 'spendingHeatmap',
            defaultLayout: { w: 2, h: 3, x: 0, y: 8 },
            component: <WeeklySpendingHeatmap />
          }] : []),
          ...(showPieChart ? [{
            id: 'pieChart',
            defaultLayout: { w: 1, h: 3, x: 2, y: 0 },
            component: <PieChart data={categoryData} title={\`Top Expenses (\${currentMonthLabel})\`} />
          }] : []),
          ...(showCategoryAnalytics ? [{
            id: 'categoryAnalytics',
            defaultLayout: { w: 1, h: 4, x: 2, y: 3 },
            component: <CategoryAnalyticsWidget />
          }] : [])
        ]} 
      />

      `;

const newContent = preContent + newWidgetSection + postContent;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("dashboard-analytics/page.tsx refactored successfully!");
