import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Users, Target, TrendingUp, Activity, Award, MessageCircle,
  UserPlus, BarChart3, PieChart, LineChart, Settings, Bell, RefreshCw,
  Eye, MoreVertical, CheckCircle, XCircle, Clock, ChevronRight, Sparkles,
  Zap, Medal, Star, LogOut, Menu, X, TrendingDown, ArrowUp, ArrowDown,
  Calendar, Flame, Heart, Trophy, Crown, Gem, GraduationCap, Send, Mail,
  ArrowRight, User, Phone, MapPin, Shield, Save, BellRing, Inbox, AlertCircle, Plus,
  FileText, AlertTriangle, Edit3, Trash2, Moon, Sun
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import api, { messagingApi, trainerDashboardApi } from '../../utils/api'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MetricCard, DashboardCard, SectionHeader, LoadingSpinner, EmptyState } from '../../components/ui/DashboardComponents'
import { AttendanceTabContent } from './TrainerDashboardTabs'
import TrainerMessageBox from './components/TrainerMessageBox'
import TrainerNotifications from './components/TrainerNotifications'

const TrainerDashboard = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  useEffect(() => {
    if (!user || user.role !== 'TRAINER') {
      toast.error('Unauthorized access')
      logout()
    }
  }, [user])
  const [trainees, setTrainees] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false) // Closed by default on mobile
  const [notificationCount, setNotificationCount] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  // Real dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalTrainees: 0,
    totalWorkouts: 0,
    completedWorkouts: 0,
    successRate: 0,
    avgProgress: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [trainerProfile, setTrainerProfile] = useState(null)
  const [mySchedule, setMySchedule] = useState([])

  // Messaging state
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Analytics state
  const [selectedTrainee, setSelectedTrainee] = useState(null)
  const [traineeAnalytics, setTraineeAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)

  // Attendance state
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Schedule state
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    is_available: true
  });

  // Trainee Schedule Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignedSchedules, setAssignedSchedules] = useState([]);
  const [selectedTraineeForSchedule, setSelectedTraineeForSchedule] = useState(null);
  const [assignForm, setAssignForm] = useState({
    trainee_id: '',
    day_of_week: 0,
    start_time: '09:00',
    end_time: '10:00',
    session_type: 'personal_training',
    notes: '',
    send_notification: true
  });

  // Progress state
  const [progressData, setProgressData] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);
  const [selectedProgressTrainee, setSelectedProgressTrainee] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [progressFilter, setProgressFilter] = useState('all'); // all, improving, declining, stagnant

  // Settings & Profile state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    specialization: '',
    bio: '',
    experience_years: 0,
    certifications: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load trainees
        const traineesRes = await api.get('/api/trainer/trainees')
        const traineesData = traineesRes.data.trainees || []
        setTrainees(traineesData)

        // Load dashboard stats
        try {
          const dashRes = await api.get('/api/trainer/dashboard')
          const totalWorkouts = dashRes.data.total_workouts || 0
          const complianceRes = await api.get('/api/trainer/compliance-overview')
          const avgAdherence = complianceRes.data.average_adherence || 0

          setDashboardStats({
            totalTrainees: traineesData.length,
            totalWorkouts: totalWorkouts,
            completedWorkouts: totalWorkouts,
            successRate: avgAdherence,
            avgProgress: traineesData.length > 0 ? Math.min(25, 5 + traineesData.length) : 0
          })

          // Load real activity
          const activityRes = await trainerDashboardApi.getActivity()
          setRecentActivity(activityRes.data || [])
        } catch (err) {
          console.error('Failed to load dashboard stats', err)
          setDashboardStats(prev => ({ ...prev, totalTrainees: traineesData.length }))
        }

        // Build recent activity from trainees
        const activities = traineesData.slice(0, 4).map((t, idx) => ({
          user: t.name || t.user?.name || 'Trainee',
          action: ['Joined training', 'Updated profile', 'Completed workout', 'Sent message'][idx % 4],
          icon: ['Users', 'Target', 'CheckCircle', 'MessageCircle'][idx % 4],
          color: ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-sky-500'][idx % 4],
          bgColor: ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-sky-100'][idx % 4]
        }))
        setRecentActivity(activities)

      } catch (err) {
        console.error('Failed to load dashboard data', err)
        toast.error('Failed to load trainees')
      }
    }

    loadDashboardData()
  }, [])

  // Fetch trainees data
  const fetchTrainees = async () => {
    try {
      const traineesRes = await api.get('/api/trainer/trainees');
      const traineesData = traineesRes.data.trainees || [];
      setTrainees(traineesData);

      // Update dashboard stats
      setDashboardStats(prev => ({
        ...prev,
        totalTrainees: traineesData.length
      }));
    } catch (err) {
      console.error('Failed to load trainees:', err);
    }
  };



  // Mark attendance
  const handleMarkAttendance = async (traineeId, status) => {
    try {
      await trainerDashboardApi.markTraineeAttendance(traineeId, { status, date: new Date().toISOString().split('T')[0] });
      toast.success(`Marked as ${status}`);
      // Reload attendance data
      loadAttendanceData();
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      toast.error('Failed to mark attendance');
    }
  };

  // Load attendance data
  const loadAttendanceData = async () => {
    try {
      setAttendanceLoading(true);
      const res = await trainerDashboardApi.getAttendanceSummary();
      setAttendanceData(res.data || {});
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // View trainee analytics
  const viewTraineeAnalytics = async (trainee) => {
    try {
      setAnalyticsLoading(true)
      setSelectedTrainee(trainee)

      const [progressRes, milestonesRes] = await Promise.all([
        api.get(`/api/trainer/trainee/${trainee.id}/progress-summary`),
        api.get(`/api/trainer/trainee/${trainee.id}/milestones`)
      ])

      setTraineeAnalytics({
        progress: progressRes.data,
        milestones: milestonesRes.data
      })
      setShowAnalyticsModal(true)
    } catch (err) {
      console.error('Failed to load trainee analytics:', err)
      toast.error('Failed to load trainee analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  };

  // Load schedule data
  const loadScheduleData = async () => {
    try {
      setScheduleLoading(true);
      const [scheduleRes, assignedRes] = await Promise.all([
        trainerDashboardApi.getSchedule(),
        trainerDashboardApi.getAssignedTraineeSchedules()
      ]);
      setMySchedule(scheduleRes.data?.schedule || []);
      setAssignedSchedules(assignedRes.data?.assigned_schedules || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      toast.error('Failed to load schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Assign trainee to schedule
  const handleAssignTrainee = async (traineeId) => {
    if (!traineeId) {
      toast.error('Please select a trainee');
      return;
    }

    // Validate time range
    if (assignForm.start_time >= assignForm.end_time) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      await trainerDashboardApi.assignTraineeToSchedule({
        trainee_id: parseInt(traineeId),
        day_of_week: assignForm.day_of_week,
        start_time: assignForm.start_time,
        end_time: assignForm.end_time,
        session_type: assignForm.session_type,
        notes: assignForm.notes,
        send_notification: assignForm.send_notification
      });

      toast.success('Session scheduled! Trainee notified.');
      setSelectedTraineeForSchedule(null);
      setAssignForm({
        trainee_id: '',
        day_of_week: 0,
        start_time: '09:00',
        end_time: '10:00',
        session_type: 'personal_training',
        notes: '',
        send_notification: true
      });
      loadScheduleData();
    } catch (err) {
      console.error('Failed to assign trainee:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to schedule session';
      toast.error(errorMessage);
    }
  };

  // Unassign trainee from schedule
  const handleUnassignTrainee = async (scheduleId) => {
    if (window.confirm('Are you sure you want to cancel this session? The trainee will be notified.')) {
      try {
        await trainerDashboardApi.unassignTraineeFromSchedule(scheduleId, true);
        toast.success('Session cancelled and trainee notified');
        loadScheduleData();
      } catch (err) {
        console.error('Failed to unassign trainee:', err);
        toast.error('Failed to cancel session');
      }
    }
  };

  // Add or update schedule
  const handleSaveSchedule = async () => {
    if (!scheduleForm.start_time || !scheduleForm.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate time range
    if (scheduleForm.start_time >= scheduleForm.end_time) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      const payload = {
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        is_available: scheduleForm.is_available
      };

      if (editingSchedule) {
        await trainerDashboardApi.updateSchedule(editingSchedule.id, payload);
        toast.success('Schedule updated!');
      } else {
        await trainerDashboardApi.addSchedule(payload);
        toast.success('Schedule slot added!');
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);
      setScheduleForm({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_available: true });
      loadScheduleData();
    } catch (err) {
      console.error('Failed to save schedule:', err);
      // Show specific error message from backend if available
      const errorMessage = err.response?.data?.detail || 'Failed to save schedule';
      toast.error(errorMessage);
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule slot?')) {
      try {
        await trainerDashboardApi.deleteSchedule(scheduleId);
        toast.success('Schedule deleted!');
        loadScheduleData();
      } catch (err) {
        console.error('Failed to delete schedule:', err);
        toast.error('Failed to delete schedule');
      }
    }
  };

  // Load progress data for all trainees
  const loadProgressData = async (silent = false) => {
    try {
      if (!silent) setProgressLoading(true);
      const progressMap = {};

      // Load progress for all trainees in parallel
      const progressPromises = trainees.map(async (trainee) => {
        try {
          const res = await trainerDashboardApi.getProgressSummary(trainee.id);
          return { id: trainee.id, data: res.data };
        } catch (err) {
          console.error(`Failed to load progress for trainee ${trainee.id}:`, err);
          return { id: trainee.id, data: null };
        }
      });

      const results = await Promise.all(progressPromises);
      results.forEach(result => {
        if (result.data) {
          progressMap[result.id] = result.data;
        }
      });

      setProgressData(progressMap);
      setLastUpdated(new Date());
      if (!silent) {
        toast.success('Progress data refreshed', { duration: 2000 });
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
      if (!silent) {
        toast.error('Failed to load progress data');
      }
    } finally {
      if (!silent) setProgressLoading(false);
    }
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchTrainees(),
        loadProgressData(true)
      ]);
      toast.success('Dashboard refreshed!', { duration: 2000 });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Refresh error:', err);
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load today's schedule for overview
  const loadTodaySchedule = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1; // Convert Sunday=0 to our index
    const todaySlots = mySchedule.filter(s => s.day_of_week === dayIndex);
    setTodaySchedule(todaySlots);
  };

  useEffect(() => {
    loadTodaySchedule();
  }, [mySchedule]);

  // Initialize profile form from user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        specialization: trainerProfile?.specialization || '',
        bio: trainerProfile?.bio || '',
        experience_years: trainerProfile?.experience_years || 0,
        certifications: trainerProfile?.certifications || ''
      });
    }
  }, [user, trainerProfile]);

  // Save trainer profile
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await api.put('/api/trainer/profile', profileForm);
      toast.success('Profile saved successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceData();
    } else if (activeTab === 'schedule' || activeTab === 'trainees') {
      loadScheduleData();
    } else if (activeTab === 'analytics') {
      loadProgressData();
    }
  }, [activeTab, trainees]);

  const stats = [
    {
      title: 'Active Trainees',
      value: dashboardStats.totalTrainees,
      change: dashboardStats.totalTrainees > 0 ? '+Active' : 'None',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      trend: 'up',
      delay: 0.1
    },
    {
      title: 'Success Rate',
      value: `${dashboardStats.successRate}%`,
      change: dashboardStats.successRate >= 80 ? 'Great!' : 'Building',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      trend: 'up',
      delay: 0.2
    },
    {
      title: 'Avg. Progress',
      value: `+${dashboardStats.avgProgress}%`,
      change: 'Trending',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      trend: 'up',
      delay: 0.3
    },
    {
      title: 'Total Workouts',
      value: dashboardStats.totalWorkouts,
      change: dashboardStats.totalWorkouts > 0 ? 'Active' : 'Starting',
      icon: Activity,
      color: 'from-sky-500 to-blue-600',
      trend: 'up',
      delay: 0.4
    }
  ]

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'trainees', label: 'My Trainees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'analytics', label: 'Progress', icon: BarChart3 },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-md transition-colors duration-300 ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
        }`}>
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg lg:hidden transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
              >
                {sidebarOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5 text-indigo-400" />}
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent tracking-wide">
                    FitMate
                  </span>
                  <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold tracking-wider">
                    Trainer Panel
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search Bar */}
              <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-100 border-slate-200'
                }`}>
                <Activity className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent outline-none text-xs sm:text-sm w-32 sm:w-40 transition-colors ${isDark ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-500'
                    }`}
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-lg transition-colors relative group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                  }`}
                title="Refresh Dashboard"
              >
                <RefreshCw
                  className={`w-5 h-5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                <div className={`absolute top-full right-0 mt-2 hidden group-hover:block text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-50 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 border border-slate-200'
                  }`}>
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </button>

              {/* Notification Bell - Using TrainerNotifications component */}
              <TrainerNotifications
                trainees={trainees}
                onViewAllMessages={() => setActiveTab('messages')}
                onSelectConversation={(contact) => {
                  setSelectedConversation(contact)
                  setActiveTab('messages')
                }}
              />

              {/* User Profile */}
              <div className={`flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l transition-colors ${isDark ? 'border-slate-700/50' : 'border-slate-200'
                }`}>
                <div className="text-right hidden sm:block">
                  <p className={`text-xs sm:text-sm font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.name || 'Trainer'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold">
                    Coach
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                  {user?.name?.charAt(0) || 'T'}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 btn-danger text-xs sm:text-sm font-bold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r overflow-y-auto
          z-40 transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}
        `}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* Trainer Profile Section */}
            <div className={`p-5 border-b transition-colors ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
              >
                <div className="relative group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {trainerProfile?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'TR'}
                  </div>
                  {/* Online Status */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} shadow-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainerProfile?.name || user?.name || 'Trainer'}</h3>
                  <p className={`text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {trainerProfile?.specialization || 'Trainer'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Scrollable Navigation */}
            <div className={`flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-none transition-colors duration-300 ${isDark ? 'scrollbar-thumb-slate-700' : 'scrollbar-thumb-slate-200'}`}>
              {/* Main Navigation */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Dashboard
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: Activity, gradient: 'from-blue-500 to-cyan-500' },
                    { id: 'trainees', label: 'My Trainees', icon: Users, gradient: 'from-emerald-500 to-teal-500' },
                    { id: 'attendance', label: 'Attendance', icon: Calendar, gradient: 'from-amber-500 to-orange-500' },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="trainerActiveIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Planning Section */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Planning
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'schedule', label: 'Schedule', icon: Clock, gradient: 'from-violet-500 to-purple-500' },
                    { id: 'analytics', label: 'Progress', icon: BarChart3, gradient: 'from-sky-500 to-blue-500' },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="trainerActiveIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Communication Section */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Communication
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'messages', label: 'Messages', icon: MessageCircle, gradient: 'from-pink-500 to-rose-500' },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="trainerActiveIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Account Section */}
              <div>
                <h2 className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Account
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: 'settings', label: 'Settings', icon: Settings, gradient: 'from-slate-500 to-slate-600' },
                  ].map((tab, idx) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          if (window.innerWidth < 1024) setSidebarOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                          ${isActive
                            ? isDark
                              ? 'bg-indigo-500/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }
                        `}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm ${isActive
                          ? `bg-gradient-to-br ${tab.gradient} text-white`
                          : isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-50 text-slate-400 group-hover:bg-white'
                          }`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="trainerActiveIndicator"
                            className="w-1.5 h-6 rounded-full bg-indigo-500 absolute right-0"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Quick Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`rounded-2xl p-4 border shadow-xl transition-colors ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700/50' : 'bg-white border-slate-100 shadow-slate-100/50'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold text-sm flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-3.5 h-3.5 text-white" />
                    </div>
                    Quick Stats
                  </h3>
                </div>
                <div className="space-y-3">
                  {/* Total Workouts */}
                  <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                    <span className="text-xs text-slate-300 flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      Workouts
                    </span>
                    <span className="font-bold text-lg text-blue-400">{dashboardStats.totalWorkouts}</span>
                  </div>

                  {/* Success Rate */}
                  <div className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-green-400" />
                        Success Rate
                      </span>
                      <span className="font-bold text-sm text-white">{dashboardStats.successRate}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dashboardStats.successRate}%` }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Total Trainees */}
                  <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${isDark ? 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'
                    }`}>
                    <span className={`text-xs flex items-center gap-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-sm">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                      Trainees
                    </span>
                    <span className="font-bold text-lg text-purple-400">{dashboardStats.totalTrainees}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Theme Toggle Section */}
            <div className={`p-4 border-t transition-colors ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-amber-500 border border-slate-100 shadow-sm'
                    }`}>
                    {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${isDark ? 'left-5.5' : 'left-0.5'}`}></div>
                </div>
              </button>

              <button
                onClick={logout}
                className={`mt-3 w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border ${isDark
                  ? 'bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                  : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:border-red-200 shadow-sm'
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-red-500/10' : 'bg-white border border-red-100 shadow-sm'
                  }`}>
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0 transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-slate-50'
          }`}>
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className={`text-3xl lg:text-4xl font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Trainer Dashboard 💪
              </h1>
              <p className={`transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Manage your trainees, track progress, and optimize coaching
              </p>
            </motion.div>




            {/* Tab Navigation - Hidden on desktop since we have sidebar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8 hidden"
            >
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className={`flex overflow-x-auto border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  {navTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                          ? isDark
                            ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10'
                            : 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                          : isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>


            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Welcome Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <DashboardCard className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <GraduationCap className="w-8 h-8" />
                            </div>
                            <div>
                              <p className="text-white/80 text-sm font-medium mb-1">{getGreeting()}</p>
                              <h2 className="text-2xl sm:text-3xl font-bold mb-1">{user?.name || 'Trainer'}</h2>
                              <p className="text-white/70 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px] border border-white/30">
                              <p className="text-3xl font-bold">{trainees.length}</p>
                              <p className="text-xs text-white/80">Trainees</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px] border border-white/30">
                              <p className="text-3xl font-bold">{todaySchedule.length}</p>
                              <p className="text-xs text-white/80">Today's Sessions</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DashboardCard>
                  </motion.div>

                  {/* Stats Cards Row */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {[
                      { label: 'Active Trainees', value: dashboardStats.totalTrainees, icon: Users, color: 'from-blue-500 to-cyan-500', bgColor: isDark ? 'bg-blue-900/20' : 'bg-white', borderColor: isDark ? 'border-blue-700/30' : 'border-blue-100' },
                      { label: 'Total Workouts', value: dashboardStats.totalWorkouts, icon: Activity, color: 'from-green-500 to-emerald-500', bgColor: isDark ? 'bg-green-900/20' : 'bg-white', borderColor: isDark ? 'border-green-700/30' : 'border-green-100' },
                      { label: 'Success Rate', value: `${dashboardStats.successRate}%`, icon: Target, color: 'from-purple-500 to-pink-500', bgColor: isDark ? 'bg-purple-900/20' : 'bg-white', borderColor: isDark ? 'border-purple-700/30' : 'border-purple-100' },
                      { label: 'Avg Progress', value: `+${dashboardStats.avgProgress}%`, icon: TrendingUp, color: 'from-orange-500 to-amber-500', bgColor: isDark ? 'bg-orange-900/20' : 'bg-white', borderColor: isDark ? 'border-orange-700/30' : 'border-orange-100' }
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className={`${stat.bgColor} border ${stat.borderColor} rounded-2xl p-5 transition-all shadow-lg ${isDark ? 'shadow-black/20' : 'shadow-slate-200/60 hover:shadow-xl hover:shadow-slate-200/80'
                            }`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <p className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                          <p className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <DashboardCard className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h3>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1.5 rounded-lg text-sm shadow-md">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">Ready!</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Messages', icon: MessageCircle, color: 'from-blue-500 to-cyan-500', action: () => setActiveTab('messages') },
                          { label: 'Analytics', icon: BarChart3, color: 'from-emerald-500 to-teal-500', action: () => setActiveTab('analytics') },
                          { label: 'Trainees', icon: Users, color: 'from-purple-500 to-pink-500', action: () => setActiveTab('trainees') },
                          { label: 'Schedule', icon: Calendar, color: 'from-orange-500 to-amber-500', action: () => setActiveTab('schedule') }
                        ].map((action) => {
                          const Icon = action.icon;
                          return (
                            <motion.button
                              key={action.label}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={action.action}
                              className={`group p-4 rounded-2xl transition-all border shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-3 ${isDark
                                ? 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-slate-600'
                                : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 shadow-slate-100'
                                }`}
                            >
                              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <p className={`text-sm font-bold text-center transition-colors ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'
                                }`}>{action.label}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </DashboardCard>
                  </motion.div>

                  {/* Main Content - Improved 2-column layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Your Trainees */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <DashboardCard className="p-6 h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className={`text-lg font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Trainees</h3>
                            <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manage your assigned trainees</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('trainees')}
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors"
                          >
                            View All <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                          {trainees.length === 0 ? (
                            <div className="text-center py-12">
                              <Users className={`w-12 h-12 mx-auto mb-3 opacity-30 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-900'}`} />
                              <p className={`font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No Trainees Assigned</p>
                              <p className={`text-sm transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contact admin to get trainees</p>
                            </div>
                          ) : (
                            trainees.slice(0, 5).map((trainee, index) => (
                              <motion.div
                                key={trainee.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                whileHover={{ x: 5 }}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isDark
                                  ? 'bg-slate-800/30 hover:bg-slate-800 border-slate-700/50 hover:shadow-md'
                                  : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-indigo-100 hover:shadow-md'
                                  }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-bold text-lg">
                                    {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-base transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {trainee.name || trainee.user?.name || 'Unnamed'}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${trainee.fitness_level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        trainee.fitness_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                          trainee.fitness_level === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {trainee.fitness_level || 'New'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Link
                                  to={`/trainer/trainee/${trainee.id}`}
                                  className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </Link>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </DashboardCard>
                    </motion.div>

                    {/* Right: Schedule & Performance Combined */}
                    <div className="space-y-6">
                      {/* Today's Schedule */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <DashboardCard className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white">Today's Schedule</h3>
                              <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {todaySchedule.length > 0 ? (
                              todaySchedule.map((slot, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border-l-4 ${slot.is_available ? 'bg-green-900/20 border-l-green-500' : 'bg-orange-900/20 border-l-orange-500'}`}>
                                  <p className="font-semibold text-white text-sm">{slot.start_time} - {slot.end_time}</p>
                                  <p className={`text-xs ${slot.is_available ? 'text-green-400' : 'text-sky-400'}`}>
                                    {slot.is_available ? '✓ Available' : '◉ Booked'}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-slate-400">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No sessions scheduled today</p>
                                <button
                                  onClick={() => setActiveTab('schedule')}
                                  className="mt-2 text-indigo-400 text-sm font-medium hover:underline"
                                >
                                  Add a slot →
                                </button>
                              </div>
                            )}
                          </div>
                        </DashboardCard>
                      </motion.div>

                      {/* Performance & Activity Combined */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <DashboardCard className="p-6">
                          {/* Performance Metrics */}
                          <div className="mb-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-bold text-white">Performance</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-3 bg-yellow-900/20 rounded-lg">
                                <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">{dashboardStats.successRate}%</p>
                                <p className="text-xs text-slate-400">Success</p>
                              </div>
                              <div className="text-center p-3 bg-green-900/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">+{dashboardStats.avgProgress}%</p>
                                <p className="text-xs text-slate-400">Progress</p>
                              </div>
                              <div className="text-center p-3 bg-blue-900/20 rounded-lg">
                                <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">{dashboardStats.totalWorkouts}</p>
                                <p className="text-xs text-slate-400">Workouts</p>
                              </div>
                            </div>
                          </div>

                          {/* Recent Activity */}
                          <div className="pt-6 border-t border-slate-700/50">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-bold text-white">Recent Activity</h3>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                              {recentActivity.length > 0 ? (
                                recentActivity.slice(0, 5).map((activity, index) => {
                                  const iconMap = { Users, Target, CheckCircle, MessageCircle };
                                  const Icon = iconMap[activity.icon] || Users;
                                  return (
                                    <div key={index} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                      <div className={`w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <Icon className={`w-5 h-5 ${activity.color}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{activity.user}</p>
                                        <p className={`text-xs truncate transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{activity.action}</p>
                                      </div>
                                      <span className={`text-[10px] whitespace-nowrap transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Just now</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8">
                                  <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                  <p className="text-sm text-slate-400">No recent activity</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </DashboardCard>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Trainees Tab */}
              {activeTab === 'trainees' && (
                <motion.div
                  key="trainees"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Header Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <DashboardCard className={`p-5 bg-gradient-to-br border transition-colors ${isDark ? 'from-blue-900/20 to-blue-900/40 border-blue-700/50' : 'from-blue-50 to-white border-blue-100 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Total Assigned</p>
                          <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>{trainees.length}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                          <Users className={`w-6 h-6 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                      </div>
                    </DashboardCard>

                    <DashboardCard className={`p-5 bg-gradient-to-br border transition-colors ${isDark ? 'from-green-900/20 to-green-900/40 border-green-700/50' : 'from-green-50 to-white border-green-100 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`}>Beginners</p>
                          <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                            {trainees.filter(t => t.fitness_level === 'beginner').length}
                          </p>
                        </div>
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/10' : 'bg-green-100'}`}>
                          <Target className={`w-6 h-6 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                      </div>
                    </DashboardCard>

                    <DashboardCard className={`p-5 bg-gradient-to-br border transition-colors ${isDark ? 'from-yellow-900/20 to-yellow-900/40 border-yellow-700/50' : 'from-yellow-50 to-white border-yellow-100 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>Intermediate</p>
                          <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>
                            {trainees.filter(t => t.fitness_level === 'intermediate').length}
                          </p>
                        </div>
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-yellow-500/10' : 'bg-yellow-100'}`}>
                          <Activity className={`w-6 h-6 transition-colors ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                        </div>
                      </div>
                    </DashboardCard>

                    <DashboardCard className={`p-5 bg-gradient-to-br border transition-colors ${isDark ? 'from-red-900/20 to-red-900/40 border-red-700/50' : 'from-rose-50 to-white border-rose-100 shadow-sm'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium transition-colors ${isDark ? 'text-red-400' : 'text-rose-600'}`}>Advanced</p>
                          <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-red-300' : 'text-rose-800'}`}>
                            {trainees.filter(t => t.fitness_level === 'advanced').length}
                          </p>
                        </div>
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-rose-100'}`}>
                          <Trophy className={`w-6 h-6 transition-colors ${isDark ? 'text-red-400' : 'text-rose-600'}`} />
                        </div>
                      </div>
                    </DashboardCard>
                  </div>

                  <DashboardCard className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>My Assigned Trainees</h3>
                        <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Personal training clients assigned to you</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 border px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}>
                          <Activity className="w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search trainees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`bg-transparent outline-none text-sm w-40 transition-colors ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                              }`}
                          />
                        </div>
                      </div>
                    </div>

                    {trainees.length === 0 ? (
                      <div className="text-center py-16">
                        <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400 font-medium">No trainees assigned to you yet</p>
                        <p className="text-slate-500 text-sm mt-2">Contact admin to get trainees assigned</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {trainees
                          .filter(t => {
                            if (!searchQuery) return true
                            const name = (t.name || t.user?.name || '').toLowerCase()
                            const email = (t.email || t.user?.email || '').toLowerCase()
                            return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
                          })
                          .map((trainee, idx) => (
                            <motion.div
                              key={trainee.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              whileHover={{ scale: 1.01, y: -3 }}
                              className={`border rounded-2xl p-5 hover:shadow-xl transition-all ${isDark
                                ? 'bg-slate-800/60 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/80'
                                : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg shadow-sm'
                                }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg flex-shrink-0">
                                  <span className="text-white font-bold text-xl">
                                    {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {trainee.name || trainee.user?.name || 'Unnamed'}
                                  </h4>
                                  <p className={`text-xs sm:text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trainee.email || trainee.user?.email}</p>
                                  <div className="flex flex-wrap gap-2 mt-2.5">
                                    <span className={`px-2.5 py-0.5 text-[10px] sm:text-xs rounded-full font-bold uppercase tracking-wider ${trainee.fitness_level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 dark:border-green-700' :
                                      trainee.fitness_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-700' :
                                        trainee.fitness_level === 'advanced' ? 'bg-rose-100 text-rose-700 dark:bg-red-900/50 dark:text-red-400 dark:border-red-700' :
                                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                                      } ${isDark ? 'border' : ''}`}>
                                      {trainee.fitness_level || 'Not Set'}
                                    </span>
                                    {trainee.goal && (
                                      <span className={`px-2.5 py-0.5 text-[10px] sm:text-xs rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 dark:border-purple-700 ${isDark ? 'border' : ''}`}>
                                        {trainee.goal}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                                <div className={`rounded-xl p-2.5 border transition-colors ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-100'
                                  }`}>
                                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Weight</p>
                                  <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {trainee.weight || '--'} <span className="text-xs font-normal text-slate-500">kg</span>
                                  </p>
                                </div>
                                <div className={`rounded-lg p-2 border transition-colors ${isDark ? 'bg-slate-900/60 border-slate-700 hover:border-green-600' : 'bg-white border-slate-100 hover:border-green-500 hover:shadow-sm'
                                  }`}>
                                  <p className={`text-[10px] sm:text-xs transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Height</p>
                                  <p className="font-bold text-sm sm:text-base text-green-400">{trainee.height || '--'}</p>
                                  <p className="text-[9px] text-slate-600">cm</p>
                                </div>
                                <div className={`rounded-lg p-2 border transition-colors ${isDark ? 'bg-slate-900/60 border-slate-700 hover:border-purple-600' : 'bg-white border-slate-100 hover:border-purple-500 hover:shadow-sm'
                                  }`}>
                                  <p className={`text-[10px] sm:text-xs transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Target</p>
                                  <p className="font-bold text-sm sm:text-base text-purple-400">{trainee.target_weight || '--'}</p>
                                  <p className="text-[9px] text-slate-600">kg</p>
                                </div>
                              </div>

                              {trainee.health_conditions && (
                                <div className="mt-3 p-2.5 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                                  <p className="text-xs sm:text-sm text-yellow-300 font-medium flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{trainee.health_conditions}</span>
                                  </p>
                                </div>
                              )}

                              {/* Schedule Session Form - Inline */}
                              {selectedTraineeForSchedule === trainee.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-900/80 rounded-xl border border-primary-500/50"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary-400" />
                                      Schedule Session
                                    </h5>
                                    <button
                                      onClick={() => setSelectedTraineeForSchedule(null)}
                                      className="text-slate-400 hover:text-white transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <div>
                                      <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Day</label>
                                      <select
                                        value={assignForm.day_of_week}
                                        onChange={(e) => setAssignForm({ ...assignForm, day_of_week: parseInt(e.target.value) })}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                      >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, idx) => (
                                          <option key={idx} value={idx}>{d}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Type</label>
                                      <select
                                        value={assignForm.session_type}
                                        onChange={(e) => setAssignForm({ ...assignForm, session_type: e.target.value })}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                      >
                                        <option value="personal_training">Personal</option>
                                        <option value="assessment">Assessment</option>
                                        <option value="group">Group</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
                                    <div>
                                      <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Start</label>
                                      <input
                                        type="time"
                                        value={assignForm.start_time}
                                        onChange={(e) => setAssignForm({ ...assignForm, start_time: e.target.value })}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">End</label>
                                      <input
                                        type="time"
                                        value={assignForm.end_time}
                                        onChange={(e) => setAssignForm({ ...assignForm, end_time: e.target.value })}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="mb-2 sm:mb-3">
                                    <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Notes (optional)</label>
                                    <input
                                      type="text"
                                      value={assignForm.notes}
                                      onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                                      placeholder="e.g., Focus on cardio"
                                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                    <input
                                      type="checkbox"
                                      id={`notify-${trainee.id}`}
                                      checked={assignForm.send_notification}
                                      onChange={(e) => setAssignForm({ ...assignForm, send_notification: e.target.checked })}
                                      className="w-4 h-4 rounded border-slate-600 text-primary-500"
                                    />
                                    <label htmlFor={`notify-${trainee.id}`} className="text-[10px] sm:text-xs text-slate-400">
                                      Send notification to trainee
                                    </label>
                                  </div>

                                  <button
                                    onClick={() => handleAssignTrainee(trainee.id)}
                                    className="w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium text-xs sm:text-sm hover:shadow-lg hover:from-primary-600 hover:to-secondary-600 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Schedule & Notify
                                  </button>
                                </motion.div>
                              )}

                              <div className="mt-3 sm:mt-4 flex gap-2">
                                <button
                                  onClick={() => {
                                    if (selectedTraineeForSchedule === trainee.id) {
                                      setSelectedTraineeForSchedule(null);
                                    } else {
                                      setSelectedTraineeForSchedule(trainee.id);
                                      setAssignForm({
                                        trainee_id: trainee.id,
                                        day_of_week: 0,
                                        start_time: '09:00',
                                        end_time: '10:00',
                                        session_type: 'personal_training',
                                        notes: '',
                                        send_notification: true
                                      });
                                    }
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all font-medium text-xs sm:text-sm active:scale-95 ${selectedTraineeForSchedule === trainee.id
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                                    }`}
                                >
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{selectedTraineeForSchedule === trainee.id ? 'Cancel' : 'Schedule'}</span>
                                </button>
                                <button
                                  onClick={() => viewTraineeAnalytics(trainee)}
                                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium text-xs sm:text-sm active:scale-95"
                                >
                                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">Analytics</span>
                                </button>
                              </div>

                              <div className="mt-2 flex gap-2">
                                <Link
                                  to={`/trainer/trainee/${trainee.id}`}
                                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all font-medium text-xs sm:text-sm active:scale-95"
                                >
                                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">Details</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedConversation({ id: trainee.user_id, name: trainee.name || trainee.user?.name, isTrainee: true })
                                    setActiveTab('messages')
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-900/30 transition-all font-medium text-xs sm:text-sm active:scale-95"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">Message</span>
                                </button>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </DashboardCard>

                  {/* Assigned Sessions Section */}
                  {assignedSchedules.length > 0 && (
                    <DashboardCard className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-white">Scheduled Personal Training Sessions</h3>
                        <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded-full text-sm font-medium">
                          {assignedSchedules.length} Sessions
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedSchedules.map((session, idx) => (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-primary-500/50 transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2 py-1 bg-primary-900/50 text-primary-400 rounded-lg text-xs font-medium">
                                {session.day_name}
                              </span>
                              <span className="text-slate-400 text-sm">
                                {session.start_time} - {session.end_time}
                              </span>
                            </div>
                            {session.trainee && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                                  {session.trainee.name?.charAt(0) || 'T'}
                                </div>
                                <div>
                                  <p className="font-medium text-white">{session.trainee.name}</p>
                                  <p className="text-xs text-slate-400">{session.session_type?.replace('_', ' ')}</p>
                                </div>
                              </div>
                            )}
                            {session.notes && (
                              <p className="mt-2 text-xs text-slate-500 bg-slate-900/50 p-2 rounded">{session.notes}</p>
                            )}
                            <button
                              onClick={() => handleUnassignTrainee(session.id)}
                              className="mt-3 w-full py-2 text-red-400 border border-red-700 rounded-lg hover:bg-red-900/30 text-sm transition-colors"
                            >
                              Cancel Session
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </DashboardCard>
                  )}
                </motion.div>
              )}

              {/* Removed duplicate AttendanceTabContent rendering */}



              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Enhanced Schedule Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white overflow-hidden relative shadow-xl">
                      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Calendar className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-bold mb-1">Weekly Schedule</h3>
                            <p className="text-white/80 text-sm">Manage your availability and training sessions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={loadScheduleData}
                            disabled={scheduleLoading}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                            title="Refresh Schedule"
                          >
                            <RefreshCw className={`w-5 h-5 ${scheduleLoading ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              setShowScheduleModal(true);
                              setEditingSchedule(null);
                              setScheduleForm({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_available: true });
                            }}
                            className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all flex items-center gap-2 border border-white/30"
                          >
                            <Plus className="w-5 h-5" />
                            Add Time Slot
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ y: -3 }}
                      className={`rounded-xl p-5 border transition-all shadow-lg ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">TOTAL</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{mySchedule.length}</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time Slots</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      whileHover={{ y: -3 }}
                      className={`rounded-xl p-5 border transition-all shadow-lg ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-full">OPEN</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{mySchedule.filter(s => s.is_available).length}</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Available</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ y: -3 }}
                      className={`rounded-xl p-5 border transition-all shadow-lg ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                          <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-1 rounded-full">BUSY</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{mySchedule.filter(s => !s.is_available).length}</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Booked</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      whileHover={{ y: -3 }}
                      className={`rounded-xl p-5 border transition-all shadow-lg ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900 border-slate-700/50' : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-md">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">SESSIONS</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{assignedSchedules.length}</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assigned</p>
                    </motion.div>
                  </div>

                  {/* Today's Sessions Card */}
                  {todaySchedule.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 rounded-xl p-6 border border-emerald-500/30"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Today's Schedule</h4>
                          <p className="text-xs text-emerald-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {todaySchedule.map((slot, idx) => {
                          const assigned = assignedSchedules.find(a => a.day_of_week === slot.day_of_week && a.start_time === slot.start_time);
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg border ${assigned
                                ? 'bg-purple-900/40 border-purple-500/50'
                                : slot.is_available
                                  ? 'bg-emerald-900/40 border-emerald-500/50'
                                  : 'bg-amber-900/40 border-amber-500/50'
                                }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-bold text-white">{slot.start_time}</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-lg font-bold text-white">{slot.end_time}</span>
                              </div>
                              {assigned ? (
                                <p className="text-sm text-purple-300 font-medium">👤 {assigned.trainee?.name}</p>
                              ) : (
                                <p className={`text-sm font-medium ${slot.is_available ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {slot.is_available ? '✓ Available' : '◉ Booked'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Weekly Grid */}
                  <DashboardCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-white flex items-center gap-3">
                        <Clock className="w-6 h-6 text-purple-400" />
                        Weekly Time Slots
                      </h4>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                          <span className="text-slate-400">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                          <span className="text-slate-400">Booked</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                          <span className="text-slate-400">Assigned</span>
                        </div>
                      </div>
                    </div>

                    {scheduleLoading ? (
                      <div className="flex justify-center items-center py-16">
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="w-10 h-10 animate-spin text-purple-500" />
                          <p className="text-slate-400">Loading schedule...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                          const daySchedule = mySchedule.filter(s => s.day_of_week === idx);
                          const dayAssigned = assignedSchedules.filter(s => s.day_of_week === idx);
                          const isToday = new Date().getDay() === (idx === 6 ? 0 : idx + 1);

                          return (
                            <motion.div
                              key={day}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ y: -3 }}
                              className={`rounded-xl border transition-all overflow-hidden ${isToday
                                ? 'bg-gradient-to-b from-purple-900/40 to-slate-800/80 border-purple-500/50 ring-2 ring-purple-500/30'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                              {/* Day Header */}
                              <div className={`px-4 py-3 border-b ${isToday ? 'border-purple-500/30 bg-purple-500/10' : 'border-slate-700'}`}>
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-bold ${isToday ? 'text-purple-300' : 'text-white'}`}>
                                    {day.slice(0, 3)}
                                  </h4>
                                  {isToday && (
                                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                                      TODAY
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">{daySchedule.length} slots</p>
                              </div>

                              {/* Time Slots */}
                              <div className="p-3 space-y-2 min-h-[160px]">
                                {daySchedule.length > 0 ? (
                                  daySchedule.map((slot, sIdx) => {
                                    const assigned = dayAssigned.find(a => a.start_time === slot.start_time);
                                    return (
                                      <motion.div
                                        key={sIdx}
                                        whileHover={{ y: -3, scale: 1.02 }}
                                        className={`group relative p-3 rounded-xl border-2 transition-all h-full flex flex-col justify-between ${slot.is_available
                                          ? isDark
                                            ? 'bg-emerald-900/10 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-900/20'
                                            : 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md'
                                          : assigned
                                            ? isDark
                                              ? 'bg-purple-900/10 border-purple-500/30 hover:border-purple-500 hover:bg-purple-900/20'
                                              : 'bg-purple-50 border-purple-100 hover:border-purple-300 hover:bg-white hover:shadow-md'
                                            : isDark
                                              ? 'bg-amber-900/10 border-amber-500/30 hover:border-amber-500 hover:bg-amber-900/20'
                                              : 'bg-amber-50 border-amber-100 hover:border-amber-300 hover:bg-white hover:shadow-md'
                                          }`}
                                      >
                                        {/* Time */}
                                        <div className="flex items-center justify-between mb-2">
                                          <div className={`text-xs font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-black/30 text-white' : 'bg-white/80 text-slate-700 shadow-sm'}`}>
                                            {slot.start_time}
                                          </div>
                                          <div className={`text-xs font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-black/30 text-white' : 'bg-white/80 text-slate-700 shadow-sm'}`}>
                                            {slot.end_time}
                                          </div>
                                        </div>

                                        {/* Status */}
                                        {assigned ? (
                                          <div className="flex items-center gap-2 mt-1">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm">
                                              {assigned.trainee?.name?.charAt(0) || 'T'}
                                            </div>
                                            <p className={`font-semibold text-xs truncate flex-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                              {assigned.trainee?.name}
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${slot.is_available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <p className={`text-xs font-bold ${slot.is_available
                                              ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                                              : (isDark ? 'text-amber-400' : 'text-amber-600')
                                              }`}>
                                              {slot.is_available ? 'Available' : 'Booked'}
                                            </p>
                                          </div>
                                        )}

                                        {/* Hover Actions */}
                                        <div className={`absolute inset-0 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10 ${isDark ? 'bg-slate-900/80' : 'bg-white/80 backdrop-blur-sm'}`}>
                                          <button
                                            onClick={() => {
                                              setEditingSchedule(slot);
                                              setScheduleForm({
                                                day_of_week: slot.day_of_week,
                                                start_time: slot.start_time,
                                                end_time: slot.end_time,
                                                is_available: slot.is_available
                                              });
                                              setShowScheduleModal(true);
                                            }}
                                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                            title="Edit"
                                          >
                                            <Edit3 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSchedule(slot.id)}
                                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            title="Delete"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </motion.div>
                                    );
                                  })
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6">
                                    <Clock className="w-8 h-8 opacity-30 mb-2" />
                                    <p className="text-xs text-center">No slots</p>
                                    <button
                                      onClick={() => {
                                        setShowScheduleModal(true);
                                        setEditingSchedule(null);
                                        setScheduleForm({ day_of_week: idx, start_time: '09:00', end_time: '10:00', is_available: true });
                                      }}
                                      className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 font-medium"
                                    >
                                      + Add Slot
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </DashboardCard>

                  {/* Assigned Sessions List */}
                  {assignedSchedules.length > 0 && (
                    <DashboardCard className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-bold text-white flex items-center gap-3">
                          <Users className="w-6 h-6 text-purple-400" />
                          Assigned Training Sessions
                        </h4>
                        <span className="text-sm text-slate-400">{assignedSchedules.length} sessions</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assignedSchedules.map((session, idx) => (
                          <motion.div
                            key={session.id || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -3 }}
                            className={`rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${isDark
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                              : 'bg-white border-slate-100'
                              }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {session.trainee?.name?.charAt(0) || 'T'}
                                </div>
                                <div>
                                  <h5 className={`font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{session.trainee?.name || 'Unknown'}</h5>
                                  <p className={`text-xs transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{session.trainee?.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleUnassignTrainee(session.id)}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                title="Cancel Session"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <Calendar className="w-4 h-4 text-purple-500" />
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>{session.day_name}</span>
                              </div>
                              <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{session.start_time} - {session.end_time}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {session.session_type && (
                                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize ${isDark
                                    ? 'bg-purple-900/30 text-purple-300 border border-purple-800/50'
                                    : 'bg-purple-50 text-purple-700 border border-purple-100'
                                    }`}>
                                    {session.session_type.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              {session.notes && (
                                <p className={`text-xs mt-2 p-3 rounded-xl italic ${isDark ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50 text-slate-500'
                                  }`}>
                                  "{session.notes}"
                                </p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </DashboardCard>
                  )}

                  {/* Schedule Modal */}
                  <AnimatePresence>
                    {showScheduleModal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={() => setShowScheduleModal(false)}
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-white">
                                {editingSchedule ? 'Edit Time Slot' : 'Add Time Slot'}
                              </h3>
                            </div>
                            <button
                              onClick={() => setShowScheduleModal(false)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-5">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Day of Week</label>
                              <select
                                value={scheduleForm.day_of_week}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, idx) => (
                                  <option key={idx} value={idx}>{d}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
                                <input
                                  type="time"
                                  value={scheduleForm.start_time}
                                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
                                <input
                                  type="time"
                                  value={scheduleForm.end_time}
                                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                              <input
                                type="checkbox"
                                id="available"
                                checked={scheduleForm.is_available}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, is_available: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 cursor-pointer"
                              />
                              <label htmlFor="available" className="text-sm font-medium text-slate-300 cursor-pointer flex-1">
                                Mark as Available for Booking
                              </label>
                              {scheduleForm.is_available ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-amber-400" />
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => setShowScheduleModal(false)}
                              className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveSchedule}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold flex items-center justify-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              {editingSchedule ? 'Update Slot' : 'Add Slot'}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Enhanced Header with Refresh */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <DashboardCard className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white overflow-hidden relative border-0">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold mb-1">Progress & Analytics</h3>
                            <p className="text-white/80 text-sm">Track trainee progress, metrics, and performance insights</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => loadProgressData()}
                            disabled={progressLoading}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                            title="Refresh Data"
                          >
                            <RefreshCw className={`w-5 h-5 ${progressLoading ? 'animate-spin' : ''}`} />
                          </button>
                          <div className="text-right bg-white/20 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-xs text-white/70">Last Updated</p>
                            <p className="text-sm font-semibold">{lastUpdated.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    </DashboardCard>
                  </motion.div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div whileHover={{ y: -5 }} className={`rounded-xl p-6 border transition-all shadow-sm hover:shadow-md ${isDark ? 'bg-gradient-to-br from-blue-900/20 to-blue-900/40 border-blue-700/50' : 'bg-white border-blue-100'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                          <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>TOTAL</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{dashboardStats.totalTrainees}</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Assigned Trainees</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className={`rounded-xl p-6 border transition-all shadow-sm hover:shadow-md ${isDark ? 'bg-gradient-to-br from-green-900/20 to-green-900/40 border-green-700/50' : 'bg-white border-green-100'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                          <Activity className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'}`}>TOTAL</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{dashboardStats.totalWorkouts}</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-green-300' : 'text-green-600'}`}>Workouts Completed</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className={`rounded-xl p-6 border transition-all shadow-sm hover:shadow-md ${isDark ? 'bg-gradient-to-br from-purple-900/20 to-purple-900/40 border-purple-700/50' : 'bg-white border-purple-100'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                          <Target className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>AVG</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{dashboardStats.successRate}%</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Success Rate</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className={`rounded-xl p-6 border transition-all shadow-sm hover:shadow-md ${isDark ? 'bg-gradient-to-br from-orange-900/20 to-orange-900/40 border-orange-700/50' : 'bg-white border-orange-100'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                          <TrendingUp className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>AVG</span>
                      </div>
                      <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>+{dashboardStats.avgProgress}%</p>
                      <p className={`text-sm mt-1 transition-colors ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>Avg Progress</p>
                    </motion.div>
                  </div>

                  {/* Trainee Performance Table */}
                  <DashboardCard className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-white">Individual Trainee Progress</h4>
                      <button
                        onClick={() => loadProgressData()}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-5 h-5 text-slate-400 ${progressLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {progressLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                      </div>
                    ) : trainees.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No trainees assigned yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                              <th className={`text-left py-4 px-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trainee</th>
                              <th className={`text-left py-4 px-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Level</th>
                              <th className={`text-left py-4 px-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Goal</th>
                              <th className={`text-left py-4 px-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Weight Progress</th>
                              <th className={`text-left py-4 px-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
                              <th className={`text-left py-4 px-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Action</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {trainees.map((trainee) => {
                              const prog = progressData[trainee.id];
                              return (
                                <motion.tr
                                  key={trainee.id}
                                  whileHover={{ backgroundColor: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(241, 245, 249, 0.6)' }}
                                  className={`transition-colors ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}
                                >
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainee.name || trainee.user?.name}</p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trainee.email || trainee.user?.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${trainee.fitness_level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      trainee.fitness_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        trainee.fitness_level === 'advanced' ? 'bg-rose-100 text-rose-700 dark:bg-red-900/30 dark:text-red-400' :
                                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}>
                                      {trainee.fitness_level || 'Not Set'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{trainee.goal || 'Not Set'}</span>
                                  </td>
                                  <td className="py-4 px-4">
                                    {prog?.weight_progress ? (
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{prog.weight_progress.current || trainee.weight || '--'}kg</span>
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">{trainee.target_weight || '--'}kg</span>
                                      </div>
                                    ) : (
                                      <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>--</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Active
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <button
                                      onClick={() => viewTraineeAnalytics(trainee)}
                                      className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm transition-colors flex items-center gap-1"
                                    >
                                      View <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </DashboardCard>

                  {/* Trainee Compliance Cards */}
                  <DashboardCard className="p-8">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Trainee Compliance & Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trainees.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
                          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                          <p>No trainees to display</p>
                        </div>
                      ) : (
                        trainees.map((trainee) => (
                          <motion.div
                            key={trainee.id}
                            whileHover={{ y: -3 }}
                            className={`rounded-xl p-6 border transition-all ${isDark
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
                              : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                              }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h5 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainee.name || trainee.user?.name}</h5>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trainee ID: {trainee.id}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-3xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>--</p>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Adherence %</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className={`flex items-center gap-2 p-2.5 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <Activity className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Fitness: <span className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainee.fitness_level || 'Not Set'}</span></span>
                              </div>
                              <div className={`flex items-center gap-2 p-2.5 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <Target className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Goal: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainee.goal || 'Not Set'}</span></span>
                              </div>
                              <div className={`flex items-center gap-2 p-2.5 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                                <TrendingUp className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Weight: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainee.weight || '--'}kg</span></span>
                              </div>
                            </div>

                            <button
                              onClick={() => viewTraineeAnalytics(trainee)}
                              className="mt-5 w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                            >
                              View Full Progress →
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </DashboardCard>

                  {/* Progress Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <DashboardCard className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">IMPROVING</span>
                        </div>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">
                          {trainees.filter(t => progressData[t.id]?.weight_progress?.change < 0).length}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">Trainees on track</p>
                      </DashboardCard>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <DashboardCard className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                            <ArrowRight className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">STABLE</span>
                        </div>
                        <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mb-1">
                          {trainees.filter(t => !progressData[t.id]?.weight_progress).length}
                        </p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Need more data</p>
                      </DashboardCard>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <DashboardCard className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">TOTAL LOGS</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                          {Object.values(progressData).reduce((sum, p) => sum + (p?.progress?.compliance?.measurement_frequency || 0), 0)}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Progress entries</p>
                      </DashboardCard>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TrainerMessageBox
                    trainees={trainees}
                    onSelectConversation={(contact) => setSelectedConversation(contact)}
                    selectedConversation={selectedConversation}
                  />
                </motion.div>
              )}

              {activeTab === 'attendance' && (
                <AttendanceTabContent
                  trainees={trainees}
                  attendanceData={attendanceData}
                  attendanceLoading={attendanceLoading}
                  onMarkAttendance={handleMarkAttendance}
                />
              )}



              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Settings Header */}
                  <DashboardCard className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white overflow-hidden relative border-0">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Profile Settings</h2>
                          <p className="text-white/80 text-sm">Manage your profile and account</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-semibold">Active</span>
                      </div>
                    </div>
                  </DashboardCard>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Settings - Main Content */}
                    <div className="lg:col-span-2">
                      <DashboardCard className={`p-6 transition-colors shadow-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                        }`}>
                        {/* Profile Avatar */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b dark:border-slate-700 border-gray-200">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                              <span className="text-white font-bold text-3xl">{profileForm.name?.charAt(0) || user?.name?.charAt(0) || 'T'}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 dark:border-slate-900 border-white flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{profileForm.name || user?.name || 'Trainer'}</h3>
                            <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-md">Verified</span>
                              <span className="px-2 py-1 bg-indigo-500/20 text-indigo-500 text-xs font-medium rounded-md">Trainer</span>
                            </div>
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                            <input
                              type="text"
                              value={profileForm.name}
                              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'border-slate-700 text-white bg-slate-800' : 'border-slate-300 text-slate-900 bg-white'
                                }`}
                              placeholder="Your name"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phone</label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'border-slate-700 text-white bg-slate-800' : 'border-slate-300 text-slate-900 bg-white'
                                }`}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Specialization</label>
                            <select
                              value={profileForm.specialization}
                              onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'border-slate-700 text-white bg-slate-800' : 'border-slate-300 text-slate-900 bg-white'
                                }`}
                            >
                              <option value="">Select specialization</option>
                              <option value="Weight Training">Weight Training</option>
                              <option value="CrossFit">CrossFit</option>
                              <option value="Yoga">Yoga</option>
                              <option value="HIIT">HIIT</option>
                              <option value="Cardio">Cardio</option>
                              <option value="Functional Training">Functional Training</option>
                              <option value="Bodybuilding">Bodybuilding</option>
                            </select>
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Experience (Years)</label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={profileForm.experience_years}
                              onChange={(e) => setProfileForm({ ...profileForm, experience_years: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'border-slate-700 text-white bg-slate-800' : 'border-slate-300 text-slate-900 bg-white'
                                }`}
                              placeholder="0"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Certifications</label>
                            <input
                              type="text"
                              value={profileForm.certifications}
                              onChange={(e) => setProfileForm({ ...profileForm, certifications: e.target.value })}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'border-slate-700 text-white bg-slate-800' : 'border-slate-300 text-slate-900 bg-white'
                                }`}
                              placeholder="e.g., NASM-CPT, ACE, ISSA"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-1.5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Bio</label>
                            <textarea
                              rows={3}
                              maxLength={300}
                              value={profileForm.bio}
                              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all ${isDark ? 'border-slate-700 text-white bg-slate-800' : 'border-slate-300 text-slate-900 bg-white'
                                }`}
                              placeholder="Brief description about yourself..."
                            />
                            <p className={`text-xs mt-1 text-right transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{profileForm.bio?.length || 0}/300</p>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-3 mt-6 pt-4 border-t dark:border-slate-700 border-gray-200">
                          <button
                            onClick={handleSaveProfile}
                            disabled={savingProfile || !profileForm.name?.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50"
                          >
                            {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {savingProfile ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => setProfileForm({
                              name: user?.name || '',
                              phone: user?.phone || '',
                              specialization: '',
                              bio: '',
                              experience_years: 0,
                              certifications: ''
                            })}
                            className={`px-4 py-2.5 rounded-lg hover:opacity-80 transition-all ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-slate-600'
                              }`}
                          >
                            Reset
                          </button>
                        </div>
                      </DashboardCard>
                    </div>

                    {/* Sidebar - Account Info */}
                    <div className="space-y-6">
                      <DashboardCard className={`p-5 transition-colors shadow-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
                        }`}>
                        <h3 className={`font-bold mb-4 flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                          <Shield className="w-5 h-5 text-indigo-500" />
                          Account Info
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b dark:border-slate-700 border-gray-100">
                            <span className="text-sm dark:text-slate-400 text-gray-500">Role</span>
                            <span className="text-sm font-medium dark:text-white text-gray-900">Personal Trainer</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b dark:border-slate-700 border-gray-100">
                            <span className="text-sm dark:text-slate-400 text-gray-500">Trainees</span>
                            <span className="text-sm font-medium dark:text-white text-gray-900">{dashboardStats.totalTrainees}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b dark:border-slate-700 border-gray-100">
                            <span className="text-sm dark:text-slate-400 text-gray-500">Workouts</span>
                            <span className="text-sm font-medium dark:text-white text-gray-900">{dashboardStats.totalWorkouts}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b dark:border-slate-700 border-gray-100">
                            <span className="text-sm dark:text-slate-400 text-gray-500">Member Since</span>
                            <span className="text-sm font-medium dark:text-white text-gray-900">
                              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm dark:text-slate-400 text-gray-500">Status</span>
                            <span className="text-sm font-medium text-green-500 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                            </span>
                          </div>
                        </div>
                      </DashboardCard>

                      <DashboardCard className={`p-5 transition-colors shadow-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
                        }`}>
                        <h3 className={`font-bold mb-4 flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                          <Mail className="w-5 h-5 text-indigo-500" />
                          Email
                        </h3>
                        <p className={`text-sm break-all transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                        <p className={`text-xs mt-2 flex items-center gap-1 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Shield className="w-3 h-3 text-green-500" /> Verified & Secure
                        </p>
                      </DashboardCard>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Trainee Analytics Modal - Improved */}
      {showAnalyticsModal && selectedTrainee && traineeAnalytics && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col border transition-colors ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
              }`}
          >
            {/* Header - Sticky */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 text-white px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between shadow-lg">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="text-xl sm:text-2xl font-bold truncate">{selectedTrainee.name || selectedTrainee.user?.name}</h2>
                <p className="text-primary-100 text-xs sm:text-sm mt-0.5">Progress & Performance Analytics</p>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all flex-shrink-0 active:scale-95"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Progress Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* Weight Progress */}
                <div className={`rounded-xl p-4 sm:p-5 border shadow-sm transition-colors ${isDark ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                  }`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    <div className="p-1.5 bg-indigo-500 rounded-lg shadow-md">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span>Weight Progress</span>
                  </h3>
                  {traineeAnalytics.progress?.weight_progress ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`rounded-lg p-3 transition-colors ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
                          <p className="text-xs text-slate-500 mb-1">Initial Weight</p>
                          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{traineeAnalytics.progress.weight_progress.initial?.toFixed(1)}<span className="text-sm text-slate-400">kg</span></p>
                        </div>
                        <div className={`rounded-lg p-3 transition-colors ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
                          <p className="text-xs text-slate-500 mb-1">Current Weight</p>
                          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{traineeAnalytics.progress.weight_progress.current?.toFixed(1)}<span className="text-sm text-slate-400">kg</span></p>
                        </div>
                      </div>
                      <div className={`rounded-lg p-3 flex items-center justify-between shadow-sm transition-colors ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <span className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Change</span>
                        <div className="flex items-center gap-2">
                          {traineeAnalytics.progress.weight_progress.change !== 0 && (
                            traineeAnalytics.progress.weight_progress.change > 0 ?
                              <ArrowUp className="w-4 h-4 text-red-500" /> :
                              <ArrowDown className="w-4 h-4 text-green-500" />
                          )}
                          <span className={`text-lg sm:text-xl font-bold ${traineeAnalytics.progress.weight_progress.change > 0 ? 'text-red-600 dark:text-red-400' : traineeAnalytics.progress.weight_progress.change < 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-600'}`}>
                            {traineeAnalytics.progress.weight_progress.change > 0 ? '+' : ''}{traineeAnalytics.progress.weight_progress.change?.toFixed(1)}kg
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">No weight data available</p>
                  )}
                </div>

                {/* Body Fat Progress */}
                <div className={`rounded-xl p-4 sm:p-5 border shadow-sm transition-colors ${isDark ? 'bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-emerald-800' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100'
                  }`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                    <div className="p-1.5 bg-green-500 rounded-lg shadow-md">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span>Body Fat Progress</span>
                  </h3>
                  {traineeAnalytics.progress?.bodyfat_progress ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`rounded-lg p-3 transition-colors ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
                          <p className="text-xs text-slate-500 mb-1">Initial Body Fat</p>
                          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{traineeAnalytics.progress.bodyfat_progress.initial?.toFixed(1)}<span className="text-sm text-slate-400">%</span></p>
                        </div>
                        <div className={`rounded-lg p-3 transition-colors ${isDark ? 'bg-slate-800/50' : 'bg-white shadow-sm'}`}>
                          <p className="text-xs text-slate-500 mb-1">Current Body Fat</p>
                          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{traineeAnalytics.progress.bodyfat_progress.current?.toFixed(1)}<span className="text-sm text-slate-400">%</span></p>
                        </div>
                      </div>
                      <div className={`rounded-lg p-3 flex items-center justify-between shadow-sm transition-colors ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <span className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Change</span>
                        <div className="flex items-center gap-2">
                          {traineeAnalytics.progress.bodyfat_progress.change !== 0 && (
                            traineeAnalytics.progress.bodyfat_progress.change > 0 ?
                              <ArrowUp className="w-4 h-4 text-red-500" /> :
                              <ArrowDown className="w-4 h-4 text-green-500" />
                          )}
                          <span className={`text-lg sm:text-xl font-bold ${traineeAnalytics.progress.bodyfat_progress.change > 0 ? 'text-red-600 dark:text-red-400' : traineeAnalytics.progress.bodyfat_progress.change < 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-600'}`}>
                            {traineeAnalytics.progress.bodyfat_progress.change > 0 ? '+' : ''}{traineeAnalytics.progress.bodyfat_progress.change?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">No body fat data available</p>
                  )}
                </div>
              </div>

              {/* Compliance & Workouts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl p-4 sm:p-5 border border-purple-200 dark:border-purple-800 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500 rounded-lg">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span>Measurements Logged</span>
                  </h3>
                  {traineeAnalytics.progress?.compliance ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Logged</span>
                          <span className="font-bold text-2xl text-slate-900 dark:text-white">{traineeAnalytics.progress.compliance.measurement_frequency || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Adherence Rate</span>
                          <span className="font-bold text-xl text-purple-600 dark:text-purple-400">{traineeAnalytics.progress.compliance.adherence_rate?.toFixed(0) || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-violet-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, traineeAnalytics.progress.compliance.adherence_rate || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">No compliance data</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-4 sm:p-5 border border-orange-200 dark:border-orange-800 shadow-sm">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-orange-500 rounded-lg">
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span>Total Workouts</span>
                  </h3>
                  {traineeAnalytics.progress?.workouts ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
                          <span className="font-bold text-2xl text-slate-900 dark:text-white">{traineeAnalytics.progress.workouts.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
                          <span className="font-bold text-xl text-green-600 dark:text-green-400">{traineeAnalytics.progress.workouts.completed || 0}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium">Last Workout:</span> {traineeAnalytics.progress.workouts.last_workout ? new Date(traineeAnalytics.progress.workouts.last_workout).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">No workout data</p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 rounded-xl p-4 sm:p-5 border border-yellow-800/50 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-500 rounded-lg">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span>Achievements</span>
                  <span className="ml-auto text-sm bg-yellow-600 text-white px-2 py-0.5 rounded-full">
                    {traineeAnalytics.milestones?.total_unlocked || 0}
                  </span>
                </h3>
                {traineeAnalytics.milestones?.achievements?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {traineeAnalytics.milestones.achievements.map((achievement, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 sm:p-4 flex items-start gap-3 transition-all ${achievement.achieved
                          ? 'bg-slate-800 border-2 border-yellow-400 shadow-md'
                          : 'bg-slate-800/50 border border-slate-700 opacity-60'
                          }`}
                      >
                        <div className="text-2xl sm:text-3xl flex-shrink-0">
                          {achievement.achieved ? '🏆' : '🔒'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-white truncate">{achievement.title}</p>
                          <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No achievements yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-4 py-3 sm:px-6 sm:py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 sm:px-6 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm sm:text-base active:scale-95"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t shadow-lg transition-colors ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-100'
        }`}>
        <div className="flex items-center justify-around py-2 px-1">
          {[
            { id: 'overview', icon: Activity, label: 'Home' },
            { id: 'trainees', icon: Users, label: 'Trainees' },
            { id: 'schedule', icon: Clock, label: 'Schedule' },
            { id: 'messages', icon: MessageCircle, label: 'Messages' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${isActive
                  ? isDark ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] mt-1 font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  )
}


export default TrainerDashboard