import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  Settings, Shield, Bell, Palette, Save, Check, Mail, Database,
  Clock, Users, DollarSign, AlertCircle, Eye, EyeOff,
  Smartphone, Lock, Globe, Activity, Key, Server, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    gym_name: 'FitMate Pro Gym',
    email: 'admin@fitmate.com',
    phone: '+1-800-FITMATE',
    address: '123 Fitness St, City',
    theme: 'dark',
    notifications_enabled: true,
    email_notifications: true,
    maintenance_reminders: true,
    schedule_notifications: true,
    timezone: 'UTC',
    currency: 'USD',
    security_2fa: false,
    backup_enabled: true,
    data_retention_days: 365,
    max_failed_logins: 5,
    session_timeout_minutes: 30,
    auto_backup_enabled: true,
    backup_frequency: 'daily'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getSettings();
      if (res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error('Settings load error:', err);
      if (err.code === 'ECONNABORTED') {
        toast.error('Settings load timed out. Please refresh.');
      } else {
        toast.error('Failed to load settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminApi.updateSettings(settings);
      if (response.status === 200 || response.data.success) {
        toast.success('✅ All settings saved successfully!');
      }
    } catch (err) {
      console.error('Save Settings Error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to save settings';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div>
      </div>
    );
  }

  const tabConfig = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
    </label>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Settings</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your gym preferences and configurations</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Gym Information */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Globe className="w-6 h-6 text-sky-400" />
                Gym Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Gym Name</label>
                  <input
                    type="text"
                    value={settings.gym_name}
                    onChange={e => setSettings({ ...settings, gym_name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    placeholder="Enter gym name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    placeholder="admin@fitmate.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    placeholder="+1-800-FITMATE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={e => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 mt-4">Gym Address</label>
                <textarea
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  rows="3"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  placeholder="Enter complete gym address"
                />
              </div>
            </div>

            {/* Display & Regional Settings */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Palette className="w-6 h-6 text-sky-400" />
                Display & Regional
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Theme</label>
                  <select
                    value={settings.theme}
                    onChange={e => setSettings({ ...settings, theme: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  >
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  >
                    <option value="UTC">UTC (GMT+0)</option>
                    <option value="EST">EST (GMT-5)</option>
                    <option value="CST">CST (GMT-6)</option>
                    <option value="PST">PST (GMT-8)</option>
                    <option value="IST">IST (GMT+5:30)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-slate-700 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-sky-400" />
              Notification Preferences
            </h2>
            <div className="space-y-4">
              {[
                { key: 'notifications_enabled', label: 'Enable All Notifications', icon: Activity, desc: 'Receive all system notifications' },
                { key: 'email_notifications', label: 'Email Notifications', icon: Mail, desc: 'Get important updates via email' },
                { key: 'maintenance_reminders', label: 'Equipment Maintenance Reminders', icon: AlertCircle, desc: 'Alerts when equipment needs maintenance' },
                { key: 'schedule_notifications', label: 'Schedule & Class Notifications', icon: Clock, desc: 'Notifications for schedule changes' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-sky-400" />
                    <div>
                      <label className="text-gray-200 font-semibold cursor-pointer block">{item.label}</label>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings[item.key]}
                    onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Security Settings */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-sky-400" />
                Security & Authentication
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition border border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Key className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <label className="text-gray-200 font-bold cursor-pointer block text-lg">Two-Factor Authentication</label>
                      <p className="text-sm text-slate-400">Enhance account security with 2FA</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={settings.security_2fa}
                    onChange={e => setSettings({ ...settings, security_2fa: e.target.checked })}
                  />
                </div>

                <div className="p-5 bg-slate-700/50 rounded-xl border border-slate-600">
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Session Timeout</label>
                  <select
                    value={settings.session_timeout_minutes}
                    onChange={e => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 transition"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">Auto logout if inactive</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 flex gap-4 justify-end"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 min-w-[200px]"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save All Settings
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
