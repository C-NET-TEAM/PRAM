import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const NAV_ITEMS = [
  { nameKey: 'calendar', path: '/calendar', icon: CalendarDays },
  { nameKey: 'assistant', path: '/assistant', icon: Sparkles },
  { nameKey: 'analytics', path: '/analytics', icon: TrendingUp },
];

const BOTTOM_ITEMS = [
  { nameKey: 'settings', path: '/settings', icon: SlidersHorizontal },
];

export function Sidebar({ collapsed, setCollapsed, isMobile }) {
  const { t } = useTranslation();
  return (
    <aside
      className={twMerge(
        clsx(
          'fixed top-0 left-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 flex flex-col',
          isMobile 
            ? (collapsed ? '-translate-x-full w-[280px]' : 'translate-x-0 w-[280px]')
            : (collapsed ? 'w-20' : 'w-[280px]')
        )
      )}
    >
      <div className="h-[72px] flex items-center border-b border-border overflow-hidden shrink-0">
        <div className="w-20 h-full flex items-center justify-center shrink-0">
          <img src="/logo-1.png" alt="Logo" className="w-[72px] h-[72px] object-contain scale-110" />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t(`nav.${item.nameKey}`)}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-border space-y-1">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t(`nav.${item.nameKey}`)}</span>}
            </NavLink>
          );
        })}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-gray-100 hover:text-foreground w-full mt-2"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
