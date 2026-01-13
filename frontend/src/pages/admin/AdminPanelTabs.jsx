import React, { useState, useEffect } from 'react';
import axios from '../../utils/api';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Save, Eye, EyeOff, Shield, Bell, Settings, Check } from 'lucide-react';

const AdminPanel = () => {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' });
  
  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, notifRes, settingsRes] = await Promise.all([
          axios.get('/api/admin/profile'),
          axios.get('/api/admin/notifications'),
          axios.get('/api/admin/settings'),
        ]);
        setProfile(profileRes.data);
        setProfileForm({ name: profileRes.data.name || '', email: profileRes.data.email || '', password: '' });
        setNotifications(notifRes.data.notifications || []);
        setSettings(settingsRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load admin data');
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleProfileEdit = () => setEditMode(true);
  const handleProfileCancel = () => {
    setEditMode(false);
    setProfileForm({ name: profile?.name || '', email: profile?.email || '', password: '' });
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const handleProfileSave = async () => {
    try {
      setSaving(true);
      const updateData = {};
      
      // Update name if changed
      if (profileForm.name && profileForm.name !== profile?.name) {
        updateData.name = profileForm.name;
      }
      
      // Update email if changed
      if (profileForm.email && profileForm.email !== profile?.email) {
        updateData.email = profileForm.email;
      }
      
      if (Object.keys(updateData).length > 0) {
        await axios.put('/api/admin/profile', updateData);
        setProfile({ ...profile, ...updateData });
        toast.success('Profile updated successfully');
      }
      
      setEditMode(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setChangingPassword(true);
      await axios.put('/api/admin/profile', { password: newPassword });
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put('/api/admin/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-sky-600">Admin Panel</h2>
          <p className="text-slate-500 text-sm">Manage your profile and settings</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-sky-500" />
              <h3 className="text-xl font-semibold text-gray-800">Profile</h3>
            </div>
            {!editMode && (
              <button 
                className="px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors" 
                onClick={handleProfileEdit}
              >
                Edit
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" /> Name
                  </label>
                  <input 
                    className={`w-full border rounded-lg px-4 py-3 transition-all ${
                      editMode 
                        ? 'border-orange-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500' 
                        : 'bg-gray-100 border-slate-200 text-slate-600'
                    }`}
                    value={profileForm.name} 
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    disabled={!editMode}
                    placeholder="Admin Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" /> Email
                  </label>
                  <input 
                    className={`w-full border rounded-lg px-4 py-3 transition-all ${
                      editMode 
                        ? 'border-orange-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500' 
                        : 'bg-gray-100 border-slate-200 text-slate-600'
                    }`}
                    type="email"
                    value={profileForm.email} 
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={!editMode}
                    placeholder="admin@fitmate.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Shield className="w-4 h-4 inline mr-1" /> Role
                  </label>
                  <input 
                    className="w-full border rounded-lg px-4 py-3 bg-gray-100 border-slate-200 text-slate-600 capitalize" 
                    value={profile?.role || 'admin'} 
                    disabled 
                  />
                </div>
              </div>
              
              {editMode && (
                <div className="mt-6 flex gap-3">
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50" 
                    onClick={handleProfileSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save
                      </>
                    )}
                  </button>
                  <button 
                    className="px-4 py-3 bg-gray-200 text-slate-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors" 
                    onClick={handleProfileCancel}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Change Password Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-sky-500" />
            <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              onClick={handlePasswordChange}
              disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
            >
              {changingPassword ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Change Password
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Notification Center */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-sky-500" />
            <h3 className="text-xl font-semibold text-gray-800">Notifications</h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <ul className="space-y-3 max-h-[250px] overflow-y-auto">
              {notifications.map((n, idx) => (
                <li key={idx} className="p-3 bg-slate-50 rounded-lg border border-gray-100">
                  <span className={`font-medium text-sm ${
                    n.type === 'payment' ? 'text-sky-600' : 
                    n.type === 'payout' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {n.message}
                  </span>
                  <span className="block text-xs text-slate-400 mt-1">{n.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Settings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-sky-500" />
            <h3 className="text-xl font-semibold text-gray-800">Settings</h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
          ) : settings && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  value={settings.theme || 'light'}
                  onChange={e => setSettings({ ...settings, theme: e.target.value })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add extra security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.security?.['2fa_enabled'] || false}
                    onChange={e => setSettings({
                      ...settings,
                      security: { ...settings.security, '2fa_enabled': e.target.checked }
                    })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications_enabled || false}
                    onChange={e => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>
              
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                onClick={handleSaveSettings}
              >
                <Check className="w-4 h-4" /> Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
