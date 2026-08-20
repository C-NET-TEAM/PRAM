import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Palette, Bell, Globe, Clock, Shield, Key, Link2, Check, RefreshCw, Settings, SlidersHorizontal, Smartphone, Laptop, KeyRound, Lock, AlertTriangle } from 'lucide-react';
import { MOCK_CHANNELS } from '../constants/dummyData';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';

const SETTINGS_TABS = [
  { id: 'channels', key: 'connectedAccounts', icon: Link2 },
  { id: 'security', key: 'security', icon: Shield },
  { id: 'language', key: 'language', icon: Globe },
  { id: 'timezone', key: 'timezone', icon: Clock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('channels'); // default to channels to test
  const [channels, setChannels] = useState(MOCK_CHANNELS);
  const [isConnecting, setIsConnecting] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/social/accounts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const connected = await res.json();
          const connectedPlatforms = connected.map(a => a.platform);
          setChannels(MOCK_CHANNELS.map(c => ({
            ...c,
            status: connectedPlatforms.includes(c.platform) ? 'connected' : 'disconnected',
            username: connected.find(a => a.platform === c.platform)?.username
          })));
        }
      } catch (err) {
        console.error('Failed to fetch accounts', err);
      }
    };
    fetchAccounts();
  }, []);
  
  // i18n State
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [isSavingLang, setIsSavingLang] = useState(false);
  const [langMessage, setLangMessage] = useState('');

  // Timezone State
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kolkata');
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [tzMessage, setTzMessage] = useState('');

  // API Key State
  const [aiProvider, setAiProvider] = useState('openai');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [isSavingApi, setIsSavingApi] = useState(false);
  const [apiMessage, setApiMessage] = useState('');

  // Load Settings from DB
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.language) setSelectedLang(data.language);
          if (data.timezone) setSelectedTimezone(data.timezone);
          if (data.ai_provider) setAiProvider(data.ai_provider);
          if (data.ai_custom_base_url) setCustomBaseUrl(data.ai_custom_base_url);
          if (data.ai_api_key) setOpenaiKey(data.ai_api_key);
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      }
    };
    fetchSettings();
  }, []);

  const saveSettingsToDB = async (updates) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      // Fetch current settings to merge
      const res = await fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } });
      let current = {};
      if (res.ok) {
        current = await res.json();
      }
      const payload = {
        language: updates.language !== undefined ? updates.language : current.language,
        timezone: updates.timezone !== undefined ? updates.timezone : current.timezone,
        ai_provider: updates.ai_provider !== undefined ? updates.ai_provider : current.ai_provider,
        ai_custom_base_url: updates.ai_custom_base_url !== undefined ? updates.ai_custom_base_url : current.ai_custom_base_url,
        ai_api_key: updates.ai_api_key !== undefined ? updates.ai_api_key : current.ai_api_key,
      };

      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Failed to save settings to DB', err);
    }
  };

  const handleSaveLanguage = async () => {
    setIsSavingLang(true);
    i18n.changeLanguage(selectedLang);
    await saveSettingsToDB({ language: selectedLang });
    setIsSavingLang(false);
    setLangMessage(t('settings.langSaveSuccess', 'Language updated successfully!'));
    setTimeout(() => setLangMessage(''), 3000);
  };
  
  const handleSaveTimezone = async () => {
    setIsSavingTimezone(true);
    await saveSettingsToDB({ timezone: selectedTimezone });
    setIsSavingTimezone(false);
    setTzMessage(t('settings.tzSaveSuccess', 'Timezone updated successfully!'));
    setTimeout(() => setTzMessage(''), 3000);
  };
  
  const handleSaveApi = async () => {
    setIsSavingApi(true);
    await saveSettingsToDB({
      ai_provider: aiProvider,
      ai_custom_base_url: customBaseUrl,
      ai_api_key: openaiKey
    });
    setIsSavingApi(false);
    setApiMessage(t('settings.apiSaveSuccess', 'API Settings saved successfully!'));
    setTimeout(() => setApiMessage(''), 3000);
  };
  
  // Security State
  const { changePassword } = useAuth();
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: '', success: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdStatus({ loading: true, error: '', success: '' });

    if (passwords.new !== passwords.confirm) {
      setPwdStatus({ loading: false, error: 'New passwords do not match', success: '' });
      return;
    }

    if (passwords.new.length < 6) {
      setPwdStatus({ loading: false, error: 'Password must be at least 6 characters', success: '' });
      return;
    }

    const result = await changePassword(passwords.current, passwords.new);
    if (result.success) {
      setPwdStatus({ loading: false, error: '', success: 'Password changed successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setPwdStatus(prev => ({ ...prev, success: '' })), 3000);
    } else {
      setPwdStatus({ loading: false, error: result.error, success: '' });
    }
  };

  const currentTab = SETTINGS_TABS.find(t => t.id === activeTab);
  const CurrentIcon = currentTab?.icon || Settings;

  const handleConnect = (id) => {
    const channel = channels.find(c => c.id === id);
    const token = sessionStorage.getItem('token');
    
    if (channel.platform === 'Facebook' || channel.platform === 'Instagram') {
      window.location.href = `/api/auth/facebook?token=${token}`;
    } else if (channel.platform === 'LinkedIn') {
      window.location.href = `/api/auth/linkedin?token=${token}`;
    } else if (channel.platform === 'X') {
      window.location.href = `/api/auth/twitter?token=${token}`;
    } else {
      alert(`${channel.platform} integration is coming soon!`);
    }
  };

  const handleDisconnect = (id) => {
    setChannels(channels.map(c => c.id === id ? { ...c, status: 'disconnected' } : c));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10 h-full">
      {/* Sidebar Navigation for Settings */}
      <Card className="w-full lg:w-64 flex-shrink-0 h-fit">
        <div className="p-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            Settings
          </h3>
        </div>
        <nav className="p-2 space-y-1">
          {SETTINGS_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={twMerge(clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                ))}
              >
                <Icon className="w-4 h-4" />
                {t(`settings.${tab.key}`)}
              </button>
            );
          })}
        </nav>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <CurrentIcon className="w-6 h-6 text-primary" />
                {t('settings.connectedAccounts')}
              </h2>
              <p className="text-muted-foreground">Manage your social media integrations and API connections.</p>
            </div>

            <div className="space-y-4">
              {channels.map(channel => {
                const isConnected = channel.status === 'connected';
                const loading = isConnecting === channel.id;

                return (
                  <Card key={channel.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xl text-foreground">
                        {channel.platform[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{channel.platform}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={twMerge(clsx(
                            'w-2 h-2 rounded-full',
                            isConnected ? 'bg-[#22C55E]' : 'bg-gray-400'
                          ))} />
                          <span className={`text-sm ${isConnected ? 'text-[#22C55E] font-medium' : 'text-gray-500'}`}>
                            {isConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {isConnected ? (
                        <>
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDisconnect(channel.id)} className="flex-1 sm:flex-none">
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                            <Key className="w-4 h-4 mr-2" />
                            API
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConnect(channel.id)}
                            isLoading={loading}
                            className="flex-1 sm:flex-none min-w-[120px]"
                          >
                            {!loading && 'Connect with OAuth'}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                {t('settings.security')}
              </h2>
              <p className="text-muted-foreground">Manage your password, two-factor authentication, and connected devices.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Password Section */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Change Password</h3>
                </div>
                
                <form className="space-y-4" onSubmit={handlePasswordChange}>
                  {pwdStatus.error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                      {pwdStatus.error}
                    </div>
                  )}
                  {pwdStatus.success && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium">
                      {pwdStatus.success}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.current}
                      onChange={e => setPasswords({...passwords, current: e.target.value})}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 text-foreground transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 text-foreground transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                      required
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 text-foreground transition-all" 
                    />
                  </div>
                  <Button type="submit" disabled={pwdStatus.loading} className="w-full mt-2">
                    {pwdStatus.loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </Card>

              {/* 2FA & Alerts */}
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#22C55E]/10 rounded-lg">
                      <Lock className="w-5 h-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Two-Factor Auth</h3>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-bold text-foreground">Authenticator App</p>
                        <p className="text-xs text-muted-foreground">Google Authenticator, Authy, etc.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={twMerge(clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        twoFactor ? "bg-[#22C55E]" : "bg-gray-200"
                      ))}
                    >
                      <span className={twMerge(clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        twoFactor ? "translate-x-6" : "translate-x-1"
                      ))} />
                    </button>
                  </div>

                  {twoFactor && (
                    <div className="mt-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl flex gap-3 text-sm text-[#22C55E]">
                      <Check className="w-5 h-5 shrink-0" />
                      <p>2FA is enabled. Your social accounts are protected against unauthorized access.</p>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">Login Alerts</h3>
                        <p className="text-xs text-muted-foreground">Get notified of new logins.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setLoginAlerts(!loginAlerts)}
                      className={twMerge(clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        loginAlerts ? "bg-primary" : "bg-gray-200"
                      ))}
                    >
                      <span className={twMerge(clsx(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        loginAlerts ? "translate-x-6" : "translate-x-1"
                      ))} />
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Active Sessions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Active Sessions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div className="flex items-center gap-4">
                    <Laptop className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-bold text-foreground">Mac OS - Chrome <span className="text-xs ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Current</span></p>
                      <p className="text-xs text-muted-foreground">Mumbai, India • IP: 192.168.1.1</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                  <div className="flex items-center gap-4">
                    <Smartphone className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="font-bold text-foreground">iOS - Safari</p>
                      <p className="text-xs text-muted-foreground">Delhi, India • IP: 10.0.0.1 • Last active: 2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="danger" size="sm">Revoke</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Language Settings Tab */}
        {activeTab === 'language' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                {t('settings.languageSettings')}
              </h2>
              <p className="text-muted-foreground">{t('settings.languageDesc')}</p>
            </div>
            
            <Card className="p-6 max-w-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('settings.selectLanguage')}
                  </label>
                  <select 
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
                  >
                    <option value="en">{t('settings.english')}</option>
                    <option value="hi">{t('settings.hindi')}</option>
                    <option value="es">{t('settings.spanish')}</option>
                    <option value="fr">{t('settings.french')}</option>
                    <option value="de">{t('settings.german')}</option>
                    <option value="zh">{t('settings.chinese')}</option>
                  </select>
                </div>

                {langMessage && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium">
                    {langMessage}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button 
                    onClick={handleSaveLanguage} 
                    disabled={isSavingLang}
                    className="min-w-[140px]"
                  >
                    {isSavingLang ? t('settings.saving') : t('settings.saveChanges')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Timezone Settings Tab */}
        {activeTab === 'timezone' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                {t('settings.timezone', 'Timezone')}
              </h2>
              <p className="text-muted-foreground">{t('settings.timezoneDesc', 'Choose your local timezone for scheduling and analytics.')}</p>
            </div>
            
            <Card className="p-6 max-w-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('settings.selectTimezone', 'Select Timezone')}
                  </label>
                  <select 
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
                  >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="Asia/Kolkata">IST (Indian Standard Time) - Asia/Kolkata</option>
                    <option value="America/New_York">EST (Eastern Standard Time) - America/New_York</option>
                    <option value="America/Los_Angeles">PST (Pacific Standard Time) - America/Los_Angeles</option>
                    <option value="Europe/London">GMT (Greenwich Mean Time) - Europe/London</option>
                    <option value="Europe/Paris">CET (Central European Time) - Europe/Paris</option>
                  </select>
                </div>

                {tzMessage && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm font-medium">
                    {tzMessage}
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button 
                    onClick={handleSaveTimezone} 
                    disabled={isSavingTimezone}
                    className="min-w-[140px]"
                  >
                    {isSavingTimezone ? t('settings.saving', 'Saving...') : t('settings.saveChanges', 'Save Changes')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Fallback for other tabs */}
        {activeTab !== 'channels' && activeTab !== 'security' && activeTab !== 'language' && activeTab !== 'timezone' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground capitalize flex items-center gap-2">
                <CurrentIcon className="w-6 h-6 text-primary" />
                {currentTab ? t(`settings.${currentTab.key}`) : activeTab}
              </h2>
              <p className="text-muted-foreground">Manage your {activeTab} preferences.</p>
            </div>
            <Card className="p-12 flex flex-col items-center justify-center text-gray-500 border-dashed">
              <Settings className="w-8 h-8 mb-4 text-gray-400" />
              <p>This section is under construction.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
