import { useState, useEffect, useRef } from 'react'
import { uploadAvatar } from '../../utils/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Calendar, MapPin, CreditCard, Heart, Target,
  Scale, Ruler, Activity, Trophy, Edit, Save, X, Camera, Upload,
  Shield, AlertCircle, CheckCircle, Clock, Dumbbell, Flame, Star,
  ChevronRight, Eye, EyeOff, Lock, Bell, Settings, Award, TrendingUp,
  Sparkles, UserCircle, BadgeCheck, Briefcase, Info
} from 'lucide-react'
import { traineeApi } from '../../utils/api'
import { useTheme } from '../../contexts/ThemeContext'
import toast from 'react-hot-toast'

const TraineeProfile = () => {
  const { isDark } = useTheme()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')
  const [formData, setFormData] = useState({})
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [stats, setStats] = useState(null)
  const fileInputRef = useRef(null)

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !userData?.id) return
    try {
      toast.loading('Uploading avatar...')
      const res = await uploadAvatar(userData.id, file)
      toast.dismiss()
      if (res.avatar_url) {
        toast.success('Avatar updated!')
        // Optionally update userData/avatar display
        setUserData((prev) => ({ ...prev, avatar_url: res.avatar_url }))
      } else {
        toast.error('Upload failed')
      }
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to upload avatar')
    }
  }

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const res = await traineeApi.getProfile();
      const data = res.data || res;
      setUserData(data);
      setFormData({
        name: data?.name ?? '',
        email: data?.email ?? '',
        phone: data?.phone ?? '',
        goal: data?.goal ?? '',
        weight: data?.weight ?? '',
        height: data?.height ?? '',
        target_weight: data?.target_weight ?? '',
        fitness_level: data?.fitness_level ?? '',
        fitness_goals: data?.fitness_goals ?? '',
        date_of_birth: data?.date_of_birth ?? '',
        gender: data?.gender ?? '',
        address: data?.address ?? '',
        emergency_contact_name: data?.emergency_contact_name ?? '',
        emergency_contact_phone: data?.emergency_contact_phone ?? '',
        health_conditions: data?.health_conditions ?? '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }
  const loadStats = async () => {
    try {
      const res = await traineeApi.getDashboard()
      setStats(res.data || res)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      // Only send non-empty fields and correct types
      const payload = {};
      const floatFields = ['weight', 'height', 'target_weight'];
      for (const key in formData) {
        let value = formData[key];
        if (floatFields.includes(key)) {
          value = value !== '' && value !== undefined && value !== null ? parseFloat(value) : undefined;
        }
        if (value !== '' && value !== undefined && value !== null) {
          payload[key] = value;
        }
      }
      await traineeApi.updateProfile(payload);
      toast.success('Profile updated successfully! 🎉');
      setEditMode(false);
      loadProfile();
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      goal: userData?.goal || '',
      weight: userData?.weight || '',
      height: userData?.height || '',
      target_weight: userData?.target_weight || '',
      fitness_level: userData?.fitness_level || '',
      fitness_goals: userData?.fitness_goals || '',
      date_of_birth: userData?.date_of_birth || '',
      gender: userData?.gender || '',
      address: userData?.address || '',
      emergency_contact_name: userData?.emergency_contact_name || '',
      emergency_contact_phone: userData?.emergency_contact_phone || '',
      health_conditions: userData?.health_conditions || '',
    })
    setEditMode(false)
  }

  const calculateBMI = () => {
    if (!formData.weight || !formData.height) return null
    const heightM = formData.height / 100
    return (formData.weight / (heightM * heightM)).toFixed(1)
  }

  const getBMICategory = (bmi) => {
    if (!bmi) return { label: '--', color: 'gray', bg: 'bg-gray-100' }
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (bmi < 25) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' }
    if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const getProgressToGoal = () => {
    if (!formData.weight || !formData.target_weight) return 0
    const startWeight = formData.weight + 5 // Assume started 5kg more
    const progress = ((startWeight - formData.weight) / (startWeight - formData.target_weight)) * 100
    return Math.min(100, Math.max(0, progress))
  }

  const bmi = calculateBMI()
  const bmiCategory = getBMICategory(bmi)
  const goalProgress = getProgressToGoal()

  const fitnessLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']
  const goalOptions = ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness', 'Sports Performance']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center rounded-2xl p-10 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'}`}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className={`w-16 h-16 border-4 border-t-sky-500 rounded-full mx-auto mb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          />
          <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading Profile</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Please wait...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Enhanced Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl p-6 lg:p-8 shadow-2xl border relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-gray-700/50' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white border-indigo-700/50'}`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-br from-sky-600/15 to-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: Avatar and Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Enhanced Avatar */}
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  {userData?.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt="Avatar"
                      className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl object-cover shadow-2xl border-3 border-white/20 ring-4 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl lg:text-5xl shadow-2xl ring-4 ring-indigo-500/20">
                      {userData?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </div>
                  )}

                  {/* Camera Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-11 h-11 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-xl"
                  >
                    <Camera className="w-5 h-5" />
                  </motion.button>
                </motion.div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

                {/* Online Status */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>

              {/* User Info */}
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {userData?.name || 'User'}
                  </h1>
                  {userData?.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium border border-green-500/30">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className={`flex items-center justify-center sm:justify-start gap-2 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-indigo-100'}`}>
                    <Mail className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-indigo-200'}`} />
                    {userData?.email}
                  </p>
                  {userData?.phone && (
                    <p className={`flex items-center justify-center sm:justify-start gap-2 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-indigo-100'}`}>
                      <Phone className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-indigo-200'}`} />
                      {userData.phone}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 rounded-lg text-sm font-medium border border-indigo-500/30 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    {userData?.membership_plan || 'Member'}
                  </span>
                  {userData?.fitness_level && (
                    <span className="px-3 py-1.5 bg-sky-500/20 text-sky-300 rounded-lg text-sm font-medium border border-sky-500/30 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      {userData.fitness_level}
                    </span>
                  )}
                  {userData?.created_at && (
                    <span className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium border border-slate-600/30 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Since {new Date(userData.created_at).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-3 mt-4 lg:mt-0">
              {editMode ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-white font-medium transition-all border border-slate-600/50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Changes
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all"
                >
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </motion.button>
              )}
            </div>
          </div>

          {/* Enhanced Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {[
              { label: 'Workouts', value: stats?.total_workouts || stats?.totalWorkouts || 0, icon: Dumbbell, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: 'Day Streak', value: stats?.streak || stats?.day_streak || 0, icon: Flame, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
              { label: 'Achievements', value: stats?.achievements || 0, icon: Trophy, gradient: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
              { label: 'Form Score', value: `${stats?.avgFormScore || stats?.avg_form_score || 0}%`, icon: Target, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`border backdrop-blur-sm rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${isDark ? `${stat.bg} ${stat.border}` : 'bg-white/20 border-white/30 hover:bg-white/30'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-indigo-100'}`}>{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'personal', label: 'Personal Info', icon: User, description: 'Basic details' },
          { id: 'fitness', label: 'Fitness & Health', icon: Dumbbell, description: 'Goals & metrics' },
        ].map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeSection === tab.id
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25'
              : isDark ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700' : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeSection === tab.id ? 'bg-white/20' : isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
              <tab.icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">{tab.label}</p>
              <p className={`text-xs ${activeSection === tab.id ? 'text-sky-100' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>{tab.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Personal Information Section */}
      {activeSection === 'personal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 lg:p-8 border shadow-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Personal Information</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage your personal details</p>
              </div>
            </div>
            {editMode && (
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                <Edit className="w-3.5 h-3.5" />
                Editing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <User className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                Full Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white placeholder-gray-500' : 'bg-white border-2 border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-gray-900 placeholder-gray-400'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                  placeholder="Enter your name"
                  disabled={!editMode}
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Mail className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                Email Address
                <span className={`ml-auto text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className={`w-full px-4 py-3.5 rounded-xl cursor-not-allowed ${isDark ? 'bg-gray-700/30 border border-gray-600 text-gray-400' : 'bg-gray-100 border border-gray-200 text-gray-500'}`}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Phone className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white placeholder-gray-500' : 'bg-white border-2 border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-gray-900 placeholder-gray-400'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                  placeholder="+91 98765 43210"
                  disabled={!editMode}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Calendar className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all outline-none ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-500 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-default'
                    }`}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <UserCircle className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={!editMode}
                className={`w-full px-4 py-3.5 rounded-xl transition-all outline-none ${editMode
                  ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-gray-900'
                  : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-500 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-default'
                  }`}
              >
                <option value="">Select Gender</option>
                {genderOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2 space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MapPin className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                Address
              </label>
              <div className="relative">
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editMode}
                  rows={2}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all resize-none outline-none ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-500 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-default'
                    }`}
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fitness Profile Section */}
      {activeSection === 'fitness' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Body Metrics */}
          <div className={`rounded-2xl p-6 lg:p-8 border shadow-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Body Metrics</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Track your physical measurements</p>
                </div>
              </div>
              {editMode && (
                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  <Edit className="w-3.5 h-3.5" />
                  Editing
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weight */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Scale className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                  placeholder="70"
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Ruler className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-100 text-gray-500 cursor-default'
                    }`}
                  placeholder="175"
                />
              </div>

              {/* Target Weight */}
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Target className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.target_weight}
                  onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-100 text-gray-500 cursor-default'
                    }`}
                  placeholder="65"
                />
              </div>
            </div>

            {/* Enhanced BMI Display */}
            <div className={`mt-8 p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800/50 border-gray-600' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                    <span className="text-2xl font-bold text-emerald-400">{bmi || '--'}</span>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>Body Mass Index</p>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-emerald-900'}`}>BMI Calculator</p>
                  </div>
                </div>
                <div className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${bmiCategory.label === 'Normal'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : bmiCategory.label === 'Underweight'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : bmiCategory.label === 'Overweight'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : bmiCategory.label === 'Obese'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-700 text-slate-400'
                  }`}>
                  {bmiCategory.label}
                </div>
              </div>

              {/* BMI Scale */}
              <div className="relative h-4 rounded-full overflow-hidden bg-slate-700">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
                  <div className="flex-1 bg-gradient-to-r from-green-500 to-green-400"></div>
                  <div className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-400"></div>
                  <div className="flex-1 bg-gradient-to-r from-red-500 to-red-400"></div>
                </div>
                {bmi && (
                  <motion.div
                    initial={{ left: 0 }}
                    animate={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))}%` }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border-3 border-slate-900 shadow-xl z-10 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                  </motion.div>
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>
            </div>
          </div>

          {/* Fitness Level & Goal */}
          <div className={`rounded-2xl p-6 lg:p-8 border shadow-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fitness Level & Goals</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Set your fitness targets</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Fitness Level */}
              <div className="space-y-3">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Dumbbell className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Fitness Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {fitnessLevels.map(level => (
                    <motion.button
                      key={level}
                      whileHover={editMode ? { scale: 1.02 } : {}}
                      whileTap={editMode ? { scale: 0.98 } : {}}
                      onClick={() => editMode && setFormData({ ...formData, fitness_level: level })}
                      disabled={!editMode}
                      className={`px-4 py-3.5 rounded-xl border-2 font-medium transition-all text-sm ${formData.fitness_level === level
                        ? 'border-purple-500 bg-purple-500/20 text-purple-600 shadow-lg shadow-purple-500/10'
                        : editMode
                          ? isDark ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-200' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800'
                          : isDark ? 'border-gray-700/50 bg-gray-700/50 text-gray-500 cursor-default' : 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
                        }`}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Primary Goal */}
              <div className="space-y-3">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Target className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Primary Goal
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                >
                  <option value="">Select Goal</option>
                  {goalOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Fitness Goals (Detailed) */}
              <div className="md:col-span-2 space-y-3">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Sparkles className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Detailed Fitness Goals
                </label>
                <textarea
                  value={formData.fitness_goals}
                  onChange={(e) => setFormData({ ...formData, fitness_goals: e.target.value })}
                  disabled={!editMode}
                  rows={3}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all resize-none ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-gray-500' : 'bg-white border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-900 placeholder-gray-400'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                  placeholder="Describe your fitness goals in detail..."
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact & Health */}
          <div className={`rounded-2xl p-6 lg:p-8 border shadow-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Health & Emergency Contact</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Important medical information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <User className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Phone className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3.5 rounded-xl transition-all ${editMode
                    ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white' : 'bg-white border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-gray-900'
                    : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                    }`}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <AlertCircle className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                Health Conditions / Medical Notes
              </label>
              <textarea
                value={formData.health_conditions}
                onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                disabled={!editMode}
                rows={3}
                className={`w-full px-4 py-3.5 rounded-xl transition-all resize-none ${editMode
                  ? isDark ? 'bg-gray-700 border-2 border-gray-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-white placeholder-gray-500' : 'bg-white border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-gray-900 placeholder-gray-400'
                  : isDark ? 'bg-gray-700/50 border border-gray-600 text-gray-400 cursor-default' : 'bg-gray-50 border border-gray-200 text-gray-500 cursor-default'
                  }`}
                placeholder="List any health conditions, allergies, or medical notes..."
              />
            </div>

            {/* Health Info Note */}
            <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-gray-700/50 border-gray-600/50' : 'bg-blue-50 border-blue-100'}`}>
              <Info className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Why is this important?</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Your health information helps trainers customize safe workout plans. Emergency contact details ensure we can reach your loved ones if needed.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default TraineeProfile
