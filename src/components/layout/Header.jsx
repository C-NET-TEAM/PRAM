import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, User, Settings, CheckCircle2, AlertCircle, AlertTriangle, Shield, LogOut, CreditCard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_ALERTS } from '../../constants/dummyData';
import { useAuth } from '../../context/AuthContext';

export function Header({ collapsed, setCollapsed, isMobile }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const alertsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) {
        setIsAlertsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/calendar': return t('nav.calendar', 'Calendar');
      case '/assistant': return t('nav.assistant', 'AI Assistant');
      case '/analytics': return t('nav.analytics', 'Analytics');
      case '/alerts': return t('nav.alerts', 'Alerts');
      case '/settings': return t('nav.settings', 'Settings');
      case '/profile': return t('header.profile', 'Profile');
      default: return t('nav.dashboard', 'Dashboard');
    }
  };

  return (
    <header className="h-[72px] bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 -ml-2 rounded-xl text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
          <p className="text-sm font-medium text-primary hidden sm:block">Public Relation Activity Management</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-card"></span>
          </button>

          {isAlertsOpen && (
            <div className="fixed inset-x-4 top-[80px] sm:absolute sm:inset-auto sm:-right-4 sm:top-full sm:mt-3 sm:w-96 max-h-[420px] overflow-y-auto bg-card border border-border/60 rounded-2xl shadow-2xl z-50 p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  {t('header.notifications', 'Notifications')}
                  <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">New</span>
                </h3>
                <button className="text-xs text-primary font-medium hover:text-[#1D4ED8] transition-colors">Mark all as read</button>
              </div>
              <div className="p-2 space-y-1 mt-1">
                {MOCK_ALERTS.map(alert => {
                  let Icon = CheckCircle2;
                  let iconColor = "text-[#10B981]";
                  let bgColor = "bg-[#10B981]/10";

                  if (alert.type === 'warning') {
                    Icon = AlertTriangle;
                    iconColor = "text-[#F59E0B]";
                    bgColor = "bg-[#F59E0B]/10";
                  }
                  if (alert.type === 'danger') {
                    Icon = AlertCircle;
                    iconColor = "text-[#EF4444]";
                    bgColor = "bg-[#EF4444]/10";
                  }

                  return (
                    <div key={alert.id} className={`flex gap-3.5 p-3 rounded-xl cursor-pointer transition-all duration-200 ${alert.read ? 'hover:bg-gray-50' : 'bg-primary/[0.02] hover:bg-primary/5'}`}>
                      <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${bgColor}`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${alert.read ? 'text-foreground/80' : 'text-foreground'}`}>{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{alert.time}</p>
                      </div>
                      {!alert.read && (
                        <div className="flex-shrink-0 flex items-center h-5 mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-border mx-2 hidden sm:block"></div>
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1 pr-3 rounded-full border border-border hover:bg-gray-100 hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-primary/20">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-3 w-64 bg-card border border-border/60 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 bg-gray-50/50 flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email || 'user@example.com'}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                  className="p-1.5 text-primary bg-primary/10 rounded-lg transition-colors"
                  title={t('header.profile', 'My Profile')}
                >
                  <User className="w-8 h-8" />
                </button>
              </div>


              <div className="p-2">
                <button
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('header.logout', 'Logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
