import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, X, Check, Sparkles } from 'lucide-react';
import { MOCK_ALERTS } from '../constants/dummyData';

export default function AlertsPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);

  React.useEffect(() => {
    fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setAlerts(data);
      })
      .catch(console.error);
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setAlerts(alerts.map(alert => alert.id === id ? { ...alert, is_read: 1 } : alert));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setAlerts(alerts.map(alert => ({ ...alert, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const removeAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const getIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />;
      case 'danger': return <AlertCircle className="w-6 h-6 text-[#EF4444]" />;
      default: return <Bell className="w-6 h-6 text-primary" />;
    }
  };

  const getBg = (type) => {
    switch(type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'warning': return 'bg-yellow-50 border-yellow-100';
      case 'danger': return 'bg-red-50 border-red-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            {t('alerts.title', 'Alerts & Notifications')}
            {unreadCount > 0 && (
              <span className="bg-[#EF4444] text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">{t('alerts.desc', 'Stay updated with your account activity and milestones.')}</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            {t('alerts.markAllRead', 'Mark all as read')}
          </Button>
        )}
      </div>

      <div className="space-y-4 mt-8">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">You're all caught up!</h3>
            <p className="text-muted-foreground">No new alerts at the moment.</p>
          </div>
        ) : (
          alerts.map(alert => {
            const isRead = alert.is_read === 1;
            return (
            <Card 
              key={alert.id} 
              className={`overflow-hidden transition-all duration-300 ${!isRead ? 'border-l-4 border-l-primary shadow-md' : 'opacity-70'}`}
            >
              <div className="p-4 sm:p-6 flex gap-4 sm:gap-6 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getBg(alert.type)} border`}>
                  {getIcon(alert.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold text-foreground ${!isRead ? 'text-lg' : 'text-base'}`}>
                      {alert.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 font-medium">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                    {alert.message}
                  </p>
                  
                  {!isRead && (
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" onClick={() => markAsRead(alert.id)}>Mark as read</Button>
                      <Button size="sm" variant="ghost" onClick={() => removeAlert(alert.id)}>Dismiss</Button>
                    </div>
                  )}
                </div>

                {isRead && (
                  <button 
                    onClick={() => removeAlert(alert.id)}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </Card>
          )})
        )}
      </div>

      {/* Special Rule Alert Demo section */}
      <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-card rounded-xl shadow-sm">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-1">Automation Rule Triggered</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Your post "10 Tips for better React performance" crossed <strong>250+ Engagement</strong>. A success alert was automatically generated.
            </p>
            <Button size="sm" variant="secondary">View Rule Settings</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
// Using this because I used Sparkles but didn't import it in the file.
