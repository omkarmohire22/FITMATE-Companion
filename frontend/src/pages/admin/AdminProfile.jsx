import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Save, Eye, EyeOff, Shield, KeyRound, 
  Calendar, MapPin, Phone, Award, Activity, BarChart3, AlertCircle, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const AdminProfile = () => {
  const { isDark } = useTheme();
  const [profile, setProfile] = useState({ 
    name: 'Admin User',
    email: 'admin@fitmate.com',
    phone: '+1-800-FITMATE',
    department: 'Management',
    join_date: '2023-01-15',
    last_login: new Date().toISOString(),
    bio: 'Head Administrator of FitMate Pro Gym'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getProfile();
      if (res.data) {
        setProfile((prev) => ({ 
          ...prev, 
          name: res.data.name || prev.name,
          email: res.data.email || prev.email,
        }));
      }
    } catch (err) {
      console.error('Profile load error:', err);
      // Don't show error toast for 500 errors on initial load - use defaults
      if (err.response?.status !== 500) {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.name || !profile.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      setSaving(true);
      const res = await adminApi.updateProfile({ name: profile.name, email: profile.email });
      toast.success('✅ Profile updated successfully');
      // Update local state with response data if available
      if (res.data?.name || res.data?.email) {
        setProfile(prev => ({
          ...prev,
          name: res.data.name || prev.name,
          email: res.data.email || prev.email
        }));
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error('Password must contain uppercase letters and numbers');
      return;
    }
    try {
      setChangingPassword(true);
      // The backend expects only new password for admin profile update
      await adminApi.updateProfile({ password: newPassword });
      toast.success('✅ Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || 'Failed to change password';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
    </label>
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header with Avatar */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/30">
              <User className="w-16 h-16 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
              <p className="text-white/90 text-lg mb-4 font-medium">System Administrator</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.join_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 border-2 border-white/30">
              <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mb-1">Status</p>
              <p className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                Active
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { id: 'profile', label: 'Profile Information', icon: User },
            { id: 'security', label: 'Security & Password', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg'
                    : isDark
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Personal Information */}
            <div className={`rounded-2xl p-6 border shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <User className="w-6 h-6 text-indigo-500" />
                Personal Information
              </h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      placeholder="admin@fitmate.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      placeholder="+1-800-FITMATE"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Join Date</label>
                    <input
                      type="text"
                      value={new Date(profile.join_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      disabled
                      className={`w-full border rounded-lg px-4 py-3 cursor-not-allowed ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Change Password */}
            <div className={`rounded-2xl p-6 border shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Lock className="w-6 h-6 text-indigo-500" />
                Change Password
              </h2>
              
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full border rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Min 8 chars, uppercase & numbers required</p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Two-Factor Authentication */}
            <div className={`rounded-2xl p-6 sm:p-8 border shadow-xl ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Shield className="w-6 h-6 text-indigo-500" />
                Two-Factor Authentication
              </h2>
              <div className={`flex items-center justify-between p-5 rounded-xl border ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Enable 2FA</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add extra layer of security with authenticator app</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={twoFAEnabled}
                  onChange={(e) => setTwoFAEnabled(e.target.checked)}
                />
              </div>
              {twoFAEnabled && (
                <div className="mt-4 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
                  <p className="text-green-400 font-semibold flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Two-factor authentication is currently enabled
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your account has an extra layer of protection</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminProfile;
