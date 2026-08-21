import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setCollapsed(true);
      } else {
        setIsMobile(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex overflow-hidden font-sans">
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity"
          onClick={() => setCollapsed(true)}
        />
      )}

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} />

      <main
        className={twMerge(
          clsx(
            'flex-1 flex flex-col min-h-[100dvh] transition-all duration-300 relative',
            collapsed ? 'lg:ml-20' : 'lg:ml-[280px]',
            isMobile && 'ml-0'
          )
        )}
      >
        <Header collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} />

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto w-full h-full relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="fixed bottom-4 right-6 text-[11px] font-bold text-primary tracking-wide z-40 bg-card/50 backdrop-blur-sm px-2 py-1 rounded-md border border-primary/20 shadow-sm">
            POWERED BY C-NET INFOTECH
          </div>
        </div>
      </main>
    </div>
  );
}
