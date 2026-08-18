'use client';

import React, { useState, useEffect } from 'react';
// @ts-ignore
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useSettings } from '@/components/providers/SettingsProvider';
import { GripHorizontal } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardWidget {
  id: string;
  component: React.ReactNode;
  defaultLayout?: { w: number; h: number; x: number; y: number };
}

interface Props {
  pageKey: string;
  widgets: DashboardWidget[];
}

export function DraggableDashboard({ pageKey, widgets }: Props) {
  const { settings, updateSettings } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const savedLayouts = settings?.dashboardLayouts?.[pageKey] || {};

  const generateLayout = () => {
    return widgets.map((w, i) => {
      const dl = w.defaultLayout || { w: 1, h: 2, x: i % 3, y: Math.floor(i / 3) * 2 };
      return { i: w.id, ...dl };
    });
  };

  const defaultLayouts: any = {
    lg: generateLayout(),
  };

  const handleLayoutChange = (currentLayout: any[], allLayouts: any) => {
    if (!mounted) return;
    const newLayouts = { ...(settings?.dashboardLayouts || {}), [pageKey]: allLayouts };
    updateSettings({ dashboardLayouts: newLayouts });
  };

  useEffect(() => {
    if (!mounted) return;
    const handleWidgetCollapse = (e: any) => {
      const { widgetId, collapsed, minH = 2, maxH = 5 } = e.detail;
      const currentLayouts = settings?.dashboardLayouts?.[pageKey] || defaultLayouts;
      const newLayouts = { ...currentLayouts };
      
      Object.keys(newLayouts).forEach(bp => {
        newLayouts[bp] = newLayouts[bp].map((item: any) => {
          if (item.i === widgetId) {
            if (collapsed) {
              // Only save previousH if it was actually larger than minH (they didn't already manually shrink it too much)
              const saveH = item.h > minH ? item.h : (item.previousH || maxH);
              return { ...item, previousH: saveH, h: minH };
            } else {
              // Expand to previous height, or default maxH
              return { ...item, h: item.previousH || maxH };
            }
          }
          return item;
        });
      });
      updateSettings({ dashboardLayouts: { ...(settings?.dashboardLayouts || {}), [pageKey]: newLayouts } });
    };

    window.addEventListener('widget-collapse', handleWidgetCollapse);
    return () => window.removeEventListener('widget-collapse', handleWidgetCollapse);
  }, [mounted, settings, pageKey, defaultLayouts, updateSettings]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {widgets.map(w => (
          <div key={w.id} className="opacity-50 pointer-events-none">
            {w.component}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="layout -mx-4 sm:mx-0"
      layouts={Object.keys(savedLayouts).length > 0 ? savedLayouts : defaultLayouts}
      breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 480, xxs: 0 }}
      cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
      rowHeight={100}
      margin={[24, 24]}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".drag-handle"
      isResizable={true}
      isDraggable={true}
      compactType="vertical"
    >
      {widgets.map((widget) => (
        <div key={widget.id} className="relative group flex flex-col h-full w-full">
          {/* Drag Handle (Hover only) */}
          <div 
            className="absolute top-3 right-3 z-50 drag-handle cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 p-1.5 bg-bg-secondary/90 backdrop-blur-sm rounded-lg border border-border/80 shadow-sm hover:bg-accent hover:text-white transition-all hover:scale-105"
            title="Drag to move widget"
          >
            <GripHorizontal size={14} />
          </div>
          
          {/* Inner Content wrapper: make it take 100% height */}
          <div className="flex-1 w-full h-full [&>div]:h-full">
            {React.isValidElement(widget.component) 
              ? React.cloneElement(widget.component as React.ReactElement<any>, { widgetId: widget.id }) 
              : widget.component}
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
