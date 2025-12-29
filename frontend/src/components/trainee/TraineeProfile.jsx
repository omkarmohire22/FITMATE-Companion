import { useState, useEffect, useRef } from 'react'
import { uploadAvatar } from '../../utils/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, Calendar, MapPin, CreditCard, Heart, Target,
  Scale, Ruler, Activity, Trophy, Edit, Save, X, Camera, Upload,
  Shield, AlertCircle, CheckCircle, Clock, Dumbbell, Flame, Star,
  ChevronRight, Eye, EyeOff, Lock, Bell, Settings, Award, TrendingUp
} from 'lucide-react'
import { traineeApi } from '../../utils/api'
import toast from 'react-hot-toast'

const TraineeProfile = () => {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl p-6 lg:p-8 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt="Avatar"
                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl object-cover shadow-xl border-2 border-orange-400"
                  />
                ) : (
                  <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl lg:text-4xl shadow-xl">
                    {userData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">{userData?.name || 'User'}</h1>
                <p className="text-gray-400 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {userData?.email}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-sm font-semibold shadow-lg">
                    {userData?.membership_plan || 'Member'}
                  </span>
                  {userData?.is_verified && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg"
                >
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Workouts', value: stats?.total_workouts || stats?.totalWorkouts || 0, icon: Dumbbell, color: 'from-blue-500 to-cyan-500' },
              { label: 'Day Streak', value: stats?.streak || stats?.day_streak || 0, icon: Flame, color: 'from-orange-500 to-red-500' },
              { label: 'Achievements', value: stats?.achievements || 0, icon: Trophy, color: 'from-yellow-500 to-amber-500' },
              { label: 'Form Score', value: `${stats?.avgFormScore || stats?.avg_form_score || 0}%`, icon: Target, color: 'from-green-500 to-emerald-500' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'personal', label: 'Personal Info', icon: User },
          { id: 'fitness', label: 'Fitness Profile', icon: Dumbbell },
          { id: 'health', label: 'Health & Safety', icon: Heart },
          { id: 'goals', label: 'Goals & Progress', icon: Target },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Information Section */}
      {activeSection === 'personal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  // Always editable
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                    editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900'
                  }`}
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-3 border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  // Always editable
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                    editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900'
                  }`}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  disabled={!editMode}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                    editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                disabled={!editMode}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                  editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                <option value="">Select Gender</option>
                {genderOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editMode}
                  rows={2}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none ${
                    editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900'
                  }`}
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '--'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                <p className={`font-semibold mt-1 ${userData?.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {userData?.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1 capitalize">{userData?.role?.toLowerCase() || 'Trainee'}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">Trainer</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">{userData?.trainer_id ? 'Assigned' : 'Not Assigned'}</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Scale className="w-5 h-5 text-orange-500" />
              Body Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Weight (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    disabled={!editMode}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                      editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                    placeholder="70"
                  />
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    step="1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    disabled={!editMode}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                      editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                    placeholder="175"
                  />
                </div>
              </div>

              {/* Target Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Weight (kg)</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="number"
                    step="0.1"
                    value={formData.target_weight}
                    onChange={(e) => setFormData({ ...formData, target_weight: e.target.value })}
                    disabled={!editMode}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                      editMode ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                    placeholder="65"
                  />
                </div>
              </div>
            </div>

            {/* BMI Display */}
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 dark:from-orange-500/10 to-amber-50 dark:to-amber-500/10 rounded-xl border border-orange-100 dark:border-orange-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Body Mass Index (BMI)</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{bmi || '--'}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${bmiCategory.bg} ${bmiCategory.color} dark:bg-opacity-20`}>
                  {bmiCategory.label}
                </span>
              </div>
              <div className="mt-4 h-3 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-blue-400"></div>
                  <div className="flex-1 bg-green-400"></div>
                  <div className="flex-1 bg-yellow-400"></div>
                  <div className="flex-1 bg-red-400"></div>
                </div>
                {bmi && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 dark:border-white rounded-full shadow-lg transition-all z-10"
                    style={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>
            </div>
          </div>

          {/* Fitness Level & Goal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Fitness Level & Goals
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fitness Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fitness Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {fitnessLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => editMode && setFormData({ ...formData, fitness_level: level })}
                      disabled={!editMode}
                      className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        formData.fitness_level === level
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      } ${!editMode && 'opacity-75 cursor-not-allowed'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Goal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
                <select
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 ${
                    editMode ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <option value="">Select Goal</option>
                  {goalOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Fitness Goals (Detailed) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Fitness Goals</label>
                <textarea
                  value={formData.fitness_goals}
                  onChange={(e) => setFormData({ ...formData, fitness_goals: e.target.value })}
                  disabled={!editMode}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none ${
                    editMode ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                  placeholder="Describe your fitness goals in detail..."
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Health & Safety Section */}
      {activeSection === 'health' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-500" />
              Emergency Contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 ${
                    editMode ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                  placeholder="Emergency contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  disabled={!editMode}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 ${
                    editMode ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
                  }`}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Important</p>
                  <p className="text-sm text-red-600 mt-1">
                    This contact will be notified in case of any emergency during your workout sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Health Conditions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Health Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Conditions / Medical Notes
              </label>
              <textarea
                value={formData.health_conditions}
                onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                disabled={!editMode}
                rows={4}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none text-gray-900 ${
                  editMode ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'
                }`}
                placeholder="List any health conditions, allergies, injuries, or medical notes that trainers should be aware of..."
              />
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Privacy Notice</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Your health information is kept confidential and only shared with your assigned trainer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Goals & Progress Section */}
      {activeSection === 'goals' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Goal Progress */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Weight Goal Progress
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current: <strong>{formData.weight || '--'} kg</strong></span>
                <span className="text-gray-600">Target: <strong>{formData.target_weight || '--'} kg</strong></span>
              </div>
              
              <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">
                  {goalProgress.toFixed(0)}%
                </span>
              </div>

              {formData.weight && formData.target_weight && (
                <p className="text-center text-sm text-gray-500">
                  {Math.abs(formData.weight - formData.target_weight).toFixed(1)} kg to go!
                </p>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'First Workout', icon: '🎯', unlocked: true },
                { title: '7 Day Streak', icon: '🔥', unlocked: (stats?.streak || 0) >= 7 },
                { title: 'Weight Goal', icon: '⚖️', unlocked: goalProgress >= 100 },
                { title: 'Perfect Form', icon: '💯', unlocked: (stats?.avgFormScore || 0) >= 90 },
                { title: '30 Workouts', icon: '💪', unlocked: (stats?.total_workouts || 0) >= 30 },
                { title: '100 Workouts', icon: '🏆', unlocked: (stats?.total_workouts || 0) >= 100 },
                { title: 'Early Bird', icon: '🌅', unlocked: false },
                { title: 'Night Owl', icon: '🦉', unlocked: false },
              ].map(badge => (
                <div
                  key={badge.title}
                  className={`p-4 rounded-xl text-center transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200'
                      : 'bg-gray-50 border border-gray-200 opacity-50'
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className={`text-sm font-medium mt-2 ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {badge.title}
                  </p>
                  {badge.unlocked && (
                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default TraineeProfile
