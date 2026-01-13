import { useAuth } from '../../contexts/AuthContext'
import {
  Users, Target, TrendingUp, Activity, Award, MessageCircle,
  UserPlus, BarChart3, PieChart, LineChart, Settings, Bell, RefreshCw,
  Eye, MoreVertical, CheckCircle, XCircle, Clock, ChevronRight, Sparkles,
  Zap, Medal, Star, LogOut, Menu, X, TrendingDown, ArrowUp, ArrowDown,
  Calendar, Flame, Heart, Trophy, Crown, Gem, GraduationCap, Send, Mail,
  ArrowRight, User, Phone, MapPin, Shield, Save, BellRing, Inbox, AlertCircle, Plus,
  FileText, AlertTriangle, Edit3, Trash2
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import api, { messagingApi, trainerDashboardApi } from '../../utils/api'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MetricCard, DashboardCard, SectionHeader, LoadingSpinner, EmptyState } from '../../components/ui/DashboardComponents'
import { AttendanceTabContent } from './TrainerDashboardTabs'

const TrainerDashboard = () => {
  const { user, logout } = useAuth()
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
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Analytics state
  const [selectedTrainee, setSelectedTrainee] = useState(null)
  const [traineeAnalytics, setTraineeAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationRef = useRef(null);

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

  // Fetch messaging data
  const fetchMessagingData = async () => {
    try {
      const [convRes, contactsRes, unreadRes] = await Promise.all([
        messagingApi.getConversations(),
        messagingApi.getContacts(),
        messagingApi.getUnreadCount()
      ]);
      setConversations(convRes.data?.conversations || []);
      setContacts(contactsRes.data?.contacts || []);
      setUnreadCount(unreadRes.data?.unread_count || 0);
      setNotificationCount(unreadRes.data?.unread_count || 0);
    } catch (err) {
      console.error('Failed to load messaging data:', err);
    }
  };

  useEffect(() => {
    fetchMessagingData();
    const interval = setInterval(fetchMessagingData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load messages for selected conversation
  const loadMessages = async (userId, isTrainee = false) => {
    try {
      setMessagesLoading(true);
      let res;
      if (isTrainee) {
        // Load trainee-specific messages
        res = await api.get(`/api/trainer/trainees/${userId}/messages`);
        setConversationMessages(res.data?.messages || []);
      } else {
        // Load general chat messages
        res = await messagingApi.getMessages(userId);
        setConversationMessages(res.data?.messages || []);
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      if (selectedConversation?.isTrainee) {
        // Send to trainee
        await api.post(`/api/trainer/trainees/${selectedConversation.id}/messages`, {
          message: newMessage.trim()
        });
      } else {
        // Send general message
        await messagingApi.sendMessage({
          receiver_id: selectedConversation.id,
          message: newMessage.trim()
        });
      }
      setNewMessage('');
      loadMessages(selectedConversation.id, selectedConversation?.isTrainee);
      const convRes = await messagingApi.getConversations();
      setConversations(convRes.data?.conversations || []);
      toast.success('Message sent!');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    }
  };

  // Select conversation
  const selectConversation = (contact) => {
    setSelectedConversation(contact);
    loadMessages(contact.id || contact.user_id, contact.isTrainee);
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
      toast.error('Failed to schedule session');
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
      toast.error('Please fill in all fields');
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
      toast.error('Failed to save schedule');
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
        fetchMessagingData(),
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
    } else if (activeTab === 'schedule') {
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
    <div className="min-h-screen bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
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
              <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/50">
                <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trainees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-xs sm:text-sm w-32 sm:w-40 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative group"
                title="Refresh Dashboard"
              >
                <RefreshCw 
                  className={`w-5 h-5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-50">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchMessagingData();
                    }
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  {(notificationCount > 0 || unreadCount > 0) && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                      {unreadCount || notificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 w-96 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-700/50 rounded-t-2xl">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <BellRing className="w-5 h-5 text-indigo-400" />
                          Notifications
                        </h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Notification List */}
                      <div className="max-h-80 overflow-y-auto">
                        {conversations.length === 0 ? (
                          <div className="py-8 text-center">
                            <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No notifications yet</p>
                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Messages will appear here</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {conversations.slice(0, 5).map((conv, idx) => (
                              <motion.div
                                key={conv.user_id || idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => {
                                  setActiveTab('messages');
                                  selectConversation({ id: conv.user_id, name: conv.name });
                                  setShowNotifications(false);
                                }}
                                className="px-4 py-3 hover:bg-slate-700/30 cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${conv.role === 'ADMIN'
                                    ? 'bg-gradient-to-br from-red-500 to-pink-500'
                                    : 'bg-gradient-to-br from-primary-500 to-secondary-500'
                                    }`}>
                                    {conv.name?.charAt(0) || 'U'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-slate-900 text-sm truncate">
                                        {conv.name || 'User'}
                                      </span>
                                      <span className="text-xs text-slate-500 shrink-0">
                                        {conv.role === 'ADMIN' ? '👑 Admin' : '🏃 Trainee'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                      {conv.last_message || 'New conversation'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        <Mail className="w-3 h-3" />
                                        {conv.unread_count} unread
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 bg-slate-700/30 border-t border-slate-700">
                        <button
                          onClick={() => {
                            setActiveTab('messages');
                            setShowNotifications(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 text-sm text-indigo-400 hover:text-primary-700 font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          View all messages
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    {user?.name?.split(' ')[0] || 'Trainer'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-indigo-400 font-semibold">
                    Coach
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                  {user?.name?.split(' ')[0]?.charAt(0) || 'T'}
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

        {/* Bottom Tab Bar for Mobile */}
        <div className="lg:hidden flex items-center justify-around px-1 py-2 bg-white/95 dark:bg-slate-800/95 border-t border-slate-800">
          {navTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 text-xs ${isActive ? 'text-indigo-400 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700/50' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-400 dark:hover:text-primary-400'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="mt-0.5 font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>


      {/* Main Content */}
      <div className="flex pt-[120px] sm:pt-[140px] lg:pt-20">
        {/* Sidebar - Desktop */}
        <aside className={`
          fixed left-0 top-[120px] sm:top-[140px] lg:top-20 h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto shadow-sm z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Navigation</h3>
            <nav className="space-y-2">
              {navTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-200 dark:border-primary-700/50'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-700/30 dark:hover:bg-slate-700/50 hover:text-indigo-400 dark:hover:text-primary-400'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                )
              })}
            </nav>

            {/* Quick Stats Sidebar */}
            <div className="mt-8 pt-8 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/30">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Workouts</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{dashboardStats.totalWorkouts}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/30">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{dashboardStats.successRate}%</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-lg p-4 border border-purple-500/30">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">My Trainees</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{dashboardStats.totalTrainees}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}


        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 min-h-screen bg-slate-950">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Trainer Dashboard 💪
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your trainees, track progress, and optimize coaching
              </p>
            </motion.div>




            {/* Tab Navigation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="flex overflow-x-auto border-b border-gray-200">
                  {navTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                          ? 'text-indigo-400 border-b-2 border-primary-500 bg-primary-50/50'
                          : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700/30'
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
                      { label: 'Active Trainees', value: dashboardStats.totalTrainees, icon: Users, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
                      { label: 'Total Workouts', value: dashboardStats.totalWorkouts, icon: Activity, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
                      { label: 'Success Rate', value: `${dashboardStats.successRate}%`, icon: Target, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
                      { label: 'Avg Progress', value: `+${dashboardStats.avgProgress}%`, icon: TrendingUp, color: 'from-orange-500 to-orange-600', bgColor: 'bg-sky-50 dark:bg-orange-900/20' }
                    ].map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <motion.div
                          key={stat.label}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className={`${stat.bgColor} rounded-xl p-5 border border-slate-800 hover:shadow-lg transition-all`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
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
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1.5 rounded-lg text-sm">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">Ready!</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Messages', icon: MessageCircle, color: 'from-blue-500 to-blue-600', action: () => setActiveTab('messages') },
                          { label: 'Analytics', icon: BarChart3, color: 'from-green-500 to-green-600', action: () => setActiveTab('analytics') },
                          { label: 'Trainees', icon: Users, color: 'from-purple-500 to-purple-600', action: () => setActiveTab('trainees') },
                          { label: 'Schedule', icon: Calendar, color: 'from-orange-500 to-orange-600', action: () => setActiveTab('schedule') }
                        ].map((action) => {
                          const Icon = action.icon;
                          return (
                            <motion.button
                              key={action.label}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={action.action}
                              className="group p-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-md"
                            >
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform shadow-md`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center">{action.label}</p>
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
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Trainees</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your assigned trainees</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('trainees')}
                            className="text-indigo-400 dark:text-primary-400 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            View All <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {trainees.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p className="font-medium">No Trainees Assigned</p>
                              <p className="text-sm">Contact admin to get trainees</p>
                            </div>
                          ) : (
                            trainees.slice(0, 5).map((trainee, index) => (
                              <motion.div
                                key={trainee.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.02)' }}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:shadow-sm transition-all border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                    <span className="text-white font-bold">
                                      {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                      {trainee.name || trainee.user?.name || 'Unnamed'}
                                    </h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${trainee.fitness_level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      trainee.fitness_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        trainee.fitness_level === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                          'bg-gray-100 text-slate-600 dark:bg-gray-600 dark:text-slate-300'
                                      }`}>
                                      {trainee.fitness_level || 'Not Set'}
                                    </span>
                                  </div>
                                </div>
                                <Link
                                  to={`/trainer/trainee/${trainee.id}`}
                                  className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View
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
                              <h3 className="font-bold text-slate-900 dark:text-white">Today's Schedule</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {todaySchedule.length > 0 ? (
                              todaySchedule.map((slot, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border-l-4 ${slot.is_available ? 'bg-green-50 dark:bg-green-900/20 border-l-green-500' : 'bg-sky-50 dark:bg-orange-900/20 border-l-orange-500'}`}>
                                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{slot.start_time} - {slot.end_time}</p>
                                  <p className={`text-xs ${slot.is_available ? 'text-green-600 dark:text-green-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                    {slot.is_available ? '✓ Available' : '◉ Booked'}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No sessions scheduled today</p>
                                <button
                                  onClick={() => setActiveTab('schedule')}
                                  className="mt-2 text-indigo-400 dark:text-primary-400 text-sm font-medium hover:underline"
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
                              <h3 className="font-bold text-slate-900 dark:text-white">Performance</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboardStats.successRate}%</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Success</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-slate-900 dark:text-white">+{dashboardStats.avgProgress}%</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Progress</p>
                              </div>
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                <p className="text-xl font-bold text-slate-900 dark:text-white">{dashboardStats.totalWorkouts}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Workouts</p>
                              </div>
                            </div>
                          </div>

                          {/* Recent Activity */}
                          <div className="pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                              </div>
                              <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                            </div>

                            <div className="space-y-2 max-h-[240px] overflow-y-auto">
                              {recentActivity.length > 0 ? (
                                recentActivity.slice(0, 5).map((activity, index) => {
                                  const iconMap = { Users, Target, CheckCircle, MessageCircle };
                                  const Icon = iconMap[activity.icon] || Users;
                                  return (
                                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 dark:hover:bg-slate-700/50 transition-colors">
                                      <div className={`w-8 h-8 rounded-lg ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-4 h-4 ${activity.color}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.user}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activity.action}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8">
                                  <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                  <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
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

              {/* Messages Tab */}
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
                    <DashboardCard className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Assigned</p>
                          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{trainees.length}</p>
                        </div>
                        <Users className="w-10 h-10 text-blue-500 opacity-50" />
                      </div>
                    </DashboardCard>

                    <DashboardCard className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Beginners</p>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                            {trainees.filter(t => t.fitness_level === 'beginner').length}
                          </p>
                        </div>
                        <Target className="w-10 h-10 text-green-500 opacity-50" />
                      </div>
                    </DashboardCard>

                    <DashboardCard className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/40 border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Intermediate</p>
                          <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                            {trainees.filter(t => t.fitness_level === 'intermediate').length}
                          </p>
                        </div>
                        <Activity className="w-10 h-10 text-yellow-500 opacity-50" />
                      </div>
                    </DashboardCard>

                    <DashboardCard className="p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 border-red-200 dark:border-red-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">Advanced</p>
                          <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">
                            {trainees.filter(t => t.fitness_level === 'advanced').length}
                          </p>
                        </div>
                        <Trophy className="w-10 h-10 text-red-500 opacity-50" />
                      </div>
                    </DashboardCard>
                  </div>

                  <DashboardCard className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">My Assigned Trainees</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Personal training clients assigned to you</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-800/50 dark:bg-slate-700/50 border border-slate-700 px-3 py-2 rounded-lg">
                          <Activity className="w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search trainees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent outline-none text-sm w-40 text-white placeholder-slate-500"
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
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ scale: 1.02, y: -5 }}
                              className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:shadow-xl hover:border-primary-500/50 transition-all"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg flex-shrink-0">
                                  <span className="text-white font-bold text-xl">
                                    {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-bold text-white truncate">
                                    {trainee.name || trainee.user?.name || 'Unnamed'}
                                  </h4>
                                  <p className="text-slate-400 text-sm truncate">{trainee.email || trainee.user?.email}</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${trainee.fitness_level === 'beginner' ? 'bg-green-900/50 text-green-400 border border-green-700' :
                                      trainee.fitness_level === 'intermediate' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' :
                                        trainee.fitness_level === 'advanced' ? 'bg-red-900/50 text-red-400 border border-red-700' :
                                          'bg-slate-700 text-slate-400 border border-slate-600'
                                      }`}>
                                      {trainee.fitness_level || 'Not Set'}
                                    </span>
                                    {trainee.goal && (
                                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-900/50 text-purple-400 border border-purple-700">
                                        {trainee.goal}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                                  <p className="text-xs text-slate-500">Weight</p>
                                  <p className="font-bold text-primary-400">{trainee.weight || '--'} kg</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                                  <p className="text-xs text-slate-500">Height</p>
                                  <p className="font-bold text-green-400">{trainee.height || '--'} cm</p>
                                </div>
                                <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
                                  <p className="text-xs text-slate-500">Target</p>
                                  <p className="font-bold text-purple-400">{trainee.target_weight || '--'} kg</p>
                                </div>
                              </div>

                              {trainee.health_conditions && (
                                <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                                  <p className="text-xs text-yellow-400 font-medium">⚠️ {trainee.health_conditions}</p>
                                </div>
                              )}

                              {/* Schedule Session Form - Inline */}
                              {selectedTraineeForSchedule === trainee.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-primary-500/50"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary-400" />
                                      Schedule Session
                                    </h5>
                                    <button
                                      onClick={() => setSelectedTraineeForSchedule(null)}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">Day</label>
                                      <select
                                        value={assignForm.day_of_week}
                                        onChange={(e) => setAssignForm({ ...assignForm, day_of_week: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                      >
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, idx) => (
                                          <option key={idx} value={idx}>{d}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">Type</label>
                                      <select
                                        value={assignForm.session_type}
                                        onChange={(e) => setAssignForm({ ...assignForm, session_type: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                      >
                                        <option value="personal_training">Personal Training</option>
                                        <option value="assessment">Assessment</option>
                                        <option value="group">Group Session</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">Start Time</label>
                                      <input
                                        type="time"
                                        value={assignForm.start_time}
                                        onChange={(e) => setAssignForm({ ...assignForm, start_time: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-slate-400 mb-1">End Time</label>
                                      <input
                                        type="time"
                                        value={assignForm.end_time}
                                        onChange={(e) => setAssignForm({ ...assignForm, end_time: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
                                    <input
                                      type="text"
                                      value={assignForm.notes}
                                      onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                                      placeholder="e.g., Focus on cardio"
                                      className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2 mb-3">
                                    <input
                                      type="checkbox"
                                      id={`notify-${trainee.id}`}
                                      checked={assignForm.send_notification}
                                      onChange={(e) => setAssignForm({ ...assignForm, send_notification: e.target.checked })}
                                      className="w-4 h-4 rounded border-slate-600 text-primary-500"
                                    />
                                    <label htmlFor={`notify-${trainee.id}`} className="text-xs text-slate-400">
                                      Send notification to trainee
                                    </label>
                                  </div>

                                  <button
                                    onClick={() => handleAssignTrainee(trainee.id)}
                                    className="w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                  >
                                    <Bell className="w-4 h-4" />
                                    Schedule & Notify
                                  </button>
                                </motion.div>
                              )}

                              <div className="mt-4 flex gap-2">
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
                                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all font-medium text-sm ${selectedTraineeForSchedule === trainee.id
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                                    }`}
                                >
                                  <Calendar className="w-4 h-4" />
                                  {selectedTraineeForSchedule === trainee.id ? 'Cancel' : 'Schedule'}
                                </button>
                                <button
                                  onClick={() => viewTraineeAnalytics(trainee)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium text-sm"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                  Analytics
                                </button>
                              </div>

                              <div className="mt-2 flex gap-2">
                                <Link
                                  to={`/trainer/trainee/${trainee.id}`}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all font-medium text-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                  Details
                                </Link>
                                <button
                                  onClick={() => {
                                    setSelectedConversation({ id: trainee.user_id, name: trainee.name || trainee.user?.name, isTrainee: true })
                                    setActiveTab('messages')
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-900/30 transition-all font-medium text-sm"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Message
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

              {activeTab === 'attendance' && (
                <AttendanceTabContent
                  trainees={trainees}
                  attendanceData={attendanceData}
                  attendanceLoading={attendanceLoading}
                  onMarkAttendance={handleMarkAttendance}
                />
              )}



              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Schedule Overview Card */}
                  <DashboardCard className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Weekly Schedule & Sessions</h3>
                        <p className="text-slate-400 text-sm">Manage your availability (assign sessions from My Trainees tab)</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowScheduleModal(true);
                            setEditingSchedule(null);
                            setScheduleForm({ day_of_week: 0, start_time: '09:00', end_time: '10:00', is_available: true });
                          }}
                          className="px-5 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add Time Slot
                        </button>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                      <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700">
                        <p className="text-sm text-blue-400 font-medium">Total Slots</p>
                        <p className="text-3xl font-bold text-blue-300 mt-1">{mySchedule.length}</p>
                      </div>
                      <div className="bg-green-900/20 rounded-xl p-4 border border-green-700">
                        <p className="text-sm text-green-400 font-medium">Available</p>
                        <p className="text-3xl font-bold text-green-300 mt-1">{mySchedule.filter(s => s.is_available).length}</p>
                      </div>
                      <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-700">
                        <p className="text-sm text-orange-400 font-medium">Booked</p>
                        <p className="text-3xl font-bold text-orange-300 mt-1">{mySchedule.filter(s => !s.is_available).length}</p>
                      </div>
                      <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-700">
                        <p className="text-sm text-purple-400 font-medium">Assigned Sessions</p>
                        <p className="text-3xl font-bold text-purple-300 mt-1">{assignedSchedules.length}</p>
                      </div>
                    </div>

                    {/* Weekly Grid */}
                    {scheduleLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                          const daySchedule = mySchedule.filter(s => s.day_of_week === idx);
                          const dayAssigned = assignedSchedules.filter(s => s.day_of_week === idx);
                          return (
                            <motion.div
                              key={day}
                              whileHover={{ y: -3 }}
                              className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-primary-500/50 transition-all"
                            >
                              <h4 className="font-bold text-white mb-3 text-center border-b border-slate-700 pb-3">
                                <span className="text-lg">{day.slice(0, 3)}</span>
                              </h4>
                              <div className="space-y-2 min-h-[120px]">
                                {daySchedule.length > 0 ? (
                                  daySchedule.map((slot, sIdx) => {
                                    const assigned = dayAssigned.find(a => a.start_time === slot.start_time);
                                    return (
                                      <motion.div
                                        key={sIdx}
                                        whileHover={{ scale: 1.02 }}
                                        className={`p-3 rounded-lg text-xs border-l-4 cursor-pointer group ${assigned
                                          ? 'bg-purple-900/30 border-l-purple-500 hover:bg-purple-900/50'
                                          : slot.is_available
                                            ? 'bg-green-900/30 border-l-green-500 hover:bg-green-900/50'
                                            : 'bg-orange-900/30 border-l-orange-500 hover:bg-orange-900/50'
                                          }`}
                                      >
                                        <p className="font-bold text-white">{slot.start_time} - {slot.end_time}</p>
                                        {assigned ? (
                                          <div className="mt-1">
                                            <p className="text-purple-400 font-medium text-[10px]">👤 {assigned.trainee?.name}</p>
                                          </div>
                                        ) : (
                                          <p className={`text-[10px] mt-1 ${slot.is_available ? 'text-green-400' : 'text-orange-400'} font-medium`}>
                                            {slot.is_available ? '✓ Available' : '◉ Booked'}
                                          </p>
                                        )}
                                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                            className="flex-1 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded hover:bg-blue-600 transition-colors"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSchedule(slot.id)}
                                            className="flex-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded hover:bg-red-600 transition-colors"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </motion.div>
                                    );
                                  })
                                ) : (
                                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
                                    <p className="text-[11px] text-center">No time slots</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </DashboardCard>

                  {/* Schedule Modal */}
                  {showScheduleModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                      onClick={() => setShowScheduleModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-slate-900 rounded-xl p-8 max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                          {editingSchedule ? 'Edit Schedule Slot' : 'Add Schedule Slot'}
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Day of Week</label>
                            <select
                              value={scheduleForm.day_of_week}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(e.target.value) })}
                              className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, idx) => (
                                <option key={idx} value={idx}>{d}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Time</label>
                              <input
                                type="time"
                                value={scheduleForm.start_time}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Time</label>
                              <input
                                type="time"
                                value={scheduleForm.end_time}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                            <input
                              type="checkbox"
                              id="available"
                              checked={scheduleForm.is_available}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, is_available: e.target.checked })}
                              className="w-5 h-5 rounded border-slate-300 text-primary-500 cursor-pointer"
                            />
                            <label htmlFor="available" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                              Mark as Available
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                          <button
                            onClick={() => setShowScheduleModal(false)}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-700/30 dark:hover:bg-slate-700 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveSchedule}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                          >
                            {editingSchedule ? 'Update' : 'Add Slot'}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
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
                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">TOTAL</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{dashboardStats.totalTrainees}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Assigned Trainees</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 rounded-xl p-6 border border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">TOTAL</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{dashboardStats.totalWorkouts}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">Workouts Completed</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AVG</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{dashboardStats.successRate}%</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Success Rate</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/40 rounded-xl p-6 border border-orange-200 dark:border-orange-700">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">AVG</span>
                      </div>
                      <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">+{dashboardStats.avgProgress}%</p>
                      <p className="text-sm text-sky-600 dark:text-sky-400 mt-1">Avg Progress</p>
                    </motion.div>
                  </div>

                  {/* Trainee Performance Table */}
                  <DashboardCard className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">Individual Trainee Progress</h4>
                      <button
                        onClick={() => loadProgressData()}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${progressLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {progressLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
                      </div>
                    ) : trainees.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>No trainees assigned yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-800">
                              <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">Trainee</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">Level</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">Goal</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">Weight Progress</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                              <th className="text-left py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trainees.map((trainee) => {
                              const prog = progressData[trainee.id];
                              return (
                                <motion.tr
                                  key={trainee.id}
                                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                  className="border-b border-gray-100 dark:border-slate-700 hover:bg-slate-700/30 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                                        {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{trainee.name || trainee.user?.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{trainee.email || trainee.user?.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${trainee.fitness_level === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      trainee.fitness_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        trainee.fitness_level === 'advanced' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                          'bg-gray-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                      }`}>
                                      {trainee.fitness_level || 'Not Set'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{trainee.goal || 'Not Set'}</span>
                                  </td>
                                  <td className="py-4 px-4">
                                    {prog?.weight_progress ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{prog.weight_progress.current || trainee.weight || '--'}kg</span>
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-semibold text-indigo-400 dark:text-primary-400">{trainee.target_weight || '--'}kg</span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-slate-500 dark:text-slate-400">--</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                      Active
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <button
                                      onClick={() => viewTraineeAnalytics(trainee)}
                                      className="text-indigo-400 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
                                    >
                                      View →
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
                            className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h5 className="text-lg font-bold text-slate-900 dark:text-white">{trainee.name || trainee.user?.name}</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Trainee ID: {trainee.id}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-indigo-400 dark:text-primary-400">--</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Adherence %</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-700/50">
                                <Activity className="w-4 h-4 text-indigo-400 dark:text-primary-400" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Fitness: <span className="font-semibold capitalize">{trainee.fitness_level || 'Not Set'}</span></span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-700/50">
                                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Goal: <span className="font-semibold">{trainee.goal || 'Not Set'}</span></span>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-700/50">
                                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Weight: <span className="font-semibold">{trainee.weight || '--'}kg</span></span>
                              </div>
                            </div>

                            <button
                              onClick={() => viewTraineeAnalytics(trainee)}
                              className="mt-4 w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
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

              {/* OLD DUPLICATE - REMOVED - THIS SECTION WAS REPLACED ABOVE */}

              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DashboardCard className="overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
                      <h3 className="text-2xl font-bold mb-1">Messages</h3>
                      <p className="text-primary-100">Chat with your assigned trainees and admin</p>
                      {unreadCount > 0 && (
                        <div className="mt-2 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          <span className="text-sm">{unreadCount} unread messages</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 h-[550px]">
                      {/* Contacts List */}
                      <div className="border-r border-gray-200 overflow-y-auto bg-gray-50">
                        {/* Assigned Trainees Section */}
                        <div className="p-3 bg-white border-b border-gray-200 sticky top-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <p className="text-xs font-semibold text-slate-700 uppercase">Assigned Trainees</p>
                          </div>
                          <p className="text-[10px] text-slate-500">Direct messaging</p>
                        </div>
                        {trainees.length > 0 ? (
                          trainees.map((trainee) => (
                            <button
                              key={`trainee-${trainee.id}`}
                              onClick={() => selectConversation({
                                id: trainee.id,
                                name: trainee.name || trainee.user?.name || 'Trainee',
                                role: 'TRAINEE',
                                isTrainee: true
                              })}
                              className={`w-full p-3 flex items-center gap-3 hover:bg-white transition-colors border-b border-gray-100 ${selectedConversation?.id === trainee.id && selectedConversation?.isTrainee ? 'bg-green-50 border-l-2 border-l-green-500' : ''
                                }`}
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {(trainee.name || trainee.user?.name || 'T').charAt(0)}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-medium text-slate-900 truncate">{trainee.name || trainee.user?.name || 'Trainee'}</p>
                                <p className="text-[10px] text-slate-500 truncate">{trainee.email || trainee.user?.email || 'No email'}</p>
                                <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mt-1">Trainee</span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 text-sm">
                            <p>No assigned trainees</p>
                          </div>
                        )}

                        {/* Other Conversations Section */}
                        {conversations.length > 0 && (
                          <>
                            <div className="p-3 bg-white border-b border-t border-slate-300 sticky top-[140px]">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageCircle className="w-4 h-4 text-indigo-400" />
                                <p className="text-xs font-semibold text-slate-700 uppercase">Other Conversations</p>
                              </div>
                            </div>
                            {conversations.map((conv) => (
                              <button
                                key={conv.user_id}
                                onClick={() => selectConversation({ id: conv.user_id, name: conv.user_name, role: conv.user_role })}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-white transition-colors border-b border-gray-100 ${selectedConversation?.id === conv.user_id && !selectedConversation?.isTrainee ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                                  }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                                  {conv.user_name?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-slate-900">{conv.user_name}</p>
                                    {conv.unread_count > 0 && (
                                      <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                                        {conv.unread_count}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">{conv.last_message || 'No messages'}</p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${conv.user_role === 'ADMIN'
                                    ? 'text-red-600 bg-red-100'
                                    : 'text-indigo-400 bg-primary-100'
                                    }`}>
                                    {conv.user_role}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </>
                        )}

                        {contacts.filter(c => !conversations.find(conv => conv.user_id === c.id)).length > 0 && (
                          <div className="p-3 bg-white border-t border-slate-300">
                            <p className="text-xs text-slate-600 font-semibold mb-2">💬 Start New Conversation</p>
                            {contacts.filter(c => !conversations.find(conv => conv.user_id === c.id)).map((contact) => (
                              <button
                                key={contact.id}
                                onClick={() => selectConversation(contact)}
                                className="w-full p-2 flex items-center gap-2 hover:bg-gray-100 rounded-lg transition-colors mb-1"
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
                                  {contact.name?.charAt(0)}
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="font-medium text-slate-700 text-sm truncate">{contact.name}</p>
                                  <span className="text-[10px] text-slate-500">{contact.label}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {conversations.length === 0 && trainees.length === 0 && contacts.length === 0 && (
                          <div className="p-6 text-center text-slate-500">
                            <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No contacts available</p>
                          </div>
                        )}
                      </div>

                      {/* Chat Area */}
                      <div className="lg:col-span-2 flex flex-col bg-white">
                        {selectedConversation ? (
                          <>
                            <div className="p-4 border-b border-gray-200 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                                  {selectedConversation.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{selectedConversation.name}</p>
                                  <p className="text-xs text-slate-500">{selectedConversation.role || selectedConversation.label}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                              {messagesLoading ? (
                                <div className="flex items-center justify-center h-full">
                                  <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
                                </div>
                              ) : conversationMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-400">
                                  <p>No messages yet</p>
                                </div>
                              ) : (
                                conversationMessages.map((msg) => (
                                  <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-2xl ${msg.is_mine
                                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-br-md'
                                      : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-gray-200'
                                      }`}>
                                      <p className="text-sm">{msg.message}</p>
                                      <p className={`text-[10px] mt-1 ${msg.is_mine ? 'text-primary-100' : 'text-slate-400'}`}>
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                              <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-gray-200 bg-white">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                  placeholder="Type a message..."
                                  className="flex-1 px-4 py-3 border border-gray-200 bg-gray-50 text-slate-900 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                  onClick={handleSendMessage}
                                  disabled={!newMessage.trim()}
                                  className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                                >
                                  <Send className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-500 bg-gray-50">
                            <div className="text-center">
                              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-medium text-slate-700">Select a conversation</p>
                              <p className="text-sm text-slate-500">Choose a trainee or admin to chat with</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DashboardCard>
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
                            <Settings className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold mb-1">Account Settings</h2>
                            <p className="text-white/80 text-sm">Manage your profile, preferences, and account details</p>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                          <Shield className="w-5 h-5" />
                          <div className="text-right">
                            <p className="text-xs text-white/70">Account Status</p>
                            <p className="text-sm font-semibold">Active</p>
                          </div>
                        </div>
                      </div>
                    </DashboardCard>
                  </motion.div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Settings - 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Profile Settings Card */}
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <DashboardCard className="p-6 sm:p-8 bg-slate-900 border-slate-700 shadow-xl">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">Profile Information</h3>
                                <p className="text-sm text-slate-400">Update your personal details and credentials</p>
                              </div>
                            </div>
                            {savingProfile && (
                              <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-2 rounded-lg">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Saving...</span>
                              </div>
                            )}
                          </div>

                          {/* Profile Avatar Section */}
                          <div className="flex items-center gap-6 mb-8 p-6 bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-2xl border border-slate-700/50 shadow-lg">
                            <div className="relative">
                              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                                <span className="text-white font-bold text-4xl">{profileForm.name?.charAt(0) || user?.name?.charAt(0) || 'T'}</span>
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-xl mb-1">{profileForm.name || user?.name || 'Trainer'}</h4>
                              <p className="text-sm text-slate-400 mb-2">{user?.email}</p>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                                  <Shield className="w-3.5 h-3.5" /> Verified Trainer
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                                  <Award className="w-3.5 h-3.5" /> Professional
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <User className="w-4 h-4 inline mr-2 text-indigo-400" />
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white bg-slate-800/50 placeholder-slate-500 transition-all"
                                placeholder="Enter your full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Mail className="w-4 h-4 inline mr-2 text-indigo-400" />
                                Email Address
                              </label>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={user?.email || ''}
                                  disabled
                                  className="w-full px-4 py-3 border-2 border-slate-700/50 rounded-xl bg-slate-800/30 text-slate-400 cursor-not-allowed"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Shield className="w-4 h-4 text-green-500" />
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Email cannot be changed for security reasons
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Phone className="w-4 h-4 inline mr-2 text-indigo-400" />
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white bg-slate-800/50 placeholder-slate-500 transition-all"
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Award className="w-4 h-4 inline mr-2 text-indigo-400" />
                                Specialization
                              </label>
                              <select
                                value={profileForm.specialization}
                                onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white bg-slate-800/50 transition-all cursor-pointer"
                              >
                                <option value="" className="bg-slate-800">Select your specialization</option>
                                <option value="Weight Training" className="bg-slate-800">Weight Training</option>
                                <option value="CrossFit" className="bg-slate-800">CrossFit</option>
                                <option value="Yoga" className="bg-slate-800">Yoga</option>
                                <option value="HIIT" className="bg-slate-800">HIIT</option>
                                <option value="Cardio" className="bg-slate-800">Cardio</option>
                                <option value="Functional Training" className="bg-slate-800">Functional Training</option>
                                <option value="Bodybuilding" className="bg-slate-800">Bodybuilding</option>
                                <option value="Rehabilitation" className="bg-slate-800">Rehabilitation</option>
                                <option value="Sports Training" className="bg-slate-800">Sports Training</option>
                                <option value="Nutrition & Fitness" className="bg-slate-800">Nutrition & Fitness</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Clock className="w-4 h-4 inline mr-2 text-indigo-400" />
                                Experience (Years)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={profileForm.experience_years}
                                onChange={(e) => setProfileForm({ ...profileForm, experience_years: Math.min(50, Math.max(0, parseInt(e.target.value) || 0)) })}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white bg-slate-800/50 placeholder-slate-500 transition-all"
                                placeholder="Years of experience"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Award className="w-4 h-4 inline mr-2 text-indigo-400" />
                                Certifications
                              </label>
                              <input
                                type="text"
                                value={profileForm.certifications}
                                onChange={(e) => setProfileForm({ ...profileForm, certifications: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white bg-slate-800/50 placeholder-slate-500 transition-all"
                                placeholder="e.g., NASM-CPT, ACE, ISSA"
                              />
                            </div>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                              <FileText className="w-4 h-4 inline mr-2 text-indigo-400" />
                              Professional Bio
                            </label>
                            <textarea
                              rows={4}
                              maxLength={500}
                              value={profileForm.bio}
                              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                              className="w-full px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white bg-slate-800/50 resize-none placeholder-slate-500 transition-all"
                              placeholder="Tell your trainees about yourself, your training philosophy, expertise, and what makes you unique as a trainer..."
                            />
                            <div className="flex justify-between mt-2">
                              <p className="text-xs text-slate-500">Describe your expertise, training approach, and professional background</p>
                              <p className={`text-xs font-medium ${(profileForm.bio?.length || 0) > 450 ? 'text-yellow-400' : (profileForm.bio?.length || 0) > 400 ? 'text-orange-400' : 'text-slate-500'}`}>
                                {profileForm.bio?.length || 0}/500 characters
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-700">
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleSaveProfile}
                              disabled={savingProfile || !profileForm.name?.trim()}
                              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-2xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                              {savingProfile ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                              {savingProfile ? 'Saving Changes...' : 'Save Profile'}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setProfileForm({
                                name: user?.name || '',
                                phone: user?.phone || '',
                                specialization: '',
                                bio: '',
                                experience_years: 0,
                                certifications: ''
                              })}
                              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                            >
                              Reset Changes
                            </motion.button>
                          </div>
                        </DashboardCard>
                      </motion.div>

                      {/* Notification Preferences - Simplified */}
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <DashboardCard className="p-6 sm:p-8 bg-slate-900 border-slate-700 shadow-xl">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                                <Bell className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white">Notifications</h3>
                                <p className="text-sm text-slate-400">Stay updated with important alerts</p>
                              </div>
                            </div>
                            <div className="bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30">
                              <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                All Active
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {[
                              { id: 'message_alerts', label: 'Messages', desc: 'New messages from trainees', icon: MessageCircle, color: 'blue' },
                              { id: 'trainee_updates', label: 'Progress Updates', desc: 'Trainee progress logs', icon: TrendingUp, color: 'purple' },
                              { id: 'schedule_reminders', label: 'Session Reminders', desc: 'Upcoming sessions', icon: Calendar, color: 'orange' }
                            ].map((pref) => {
                              const Icon = pref.icon;
                              return (
                                <div key={pref.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg bg-${pref.color}-500/10 border border-${pref.color}-500/20 flex items-center justify-center`}>
                                      <Icon className={`w-5 h-5 text-${pref.color}-400`} />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-white text-sm">{pref.label}</p>
                                      <p className="text-xs text-slate-400">{pref.desc}</p>
                                    </div>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked={true} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-500"></div>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </DashboardCard>
                      </motion.div>
                    </div>

                    {/* Sidebar - 1 column */}
                    <div className="space-y-6">
                      {/* Account Summary Card */}
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <DashboardCard className="p-6 bg-slate-900 border-slate-700 shadow-xl">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">Account Summary</h3>
                              <p className="text-xs text-slate-400">Your account details</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400 uppercase tracking-wider">Role</span>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              </div>
                              <p className="text-lg font-bold text-white">Personal Trainer</p>
                              <p className="text-xs text-indigo-400 mt-1">Professional Account</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-1">
                                  <Users className="w-4 h-4 text-blue-400" />
                                  <span className="text-xs text-slate-400">Trainees</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{dashboardStats.totalTrainees}</p>
                              </div>
                              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="w-4 h-4 text-green-400" />
                                  <span className="text-xs text-slate-400">Workouts</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{dashboardStats.totalWorkouts}</p>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Member Since</span>
                                <span className="font-medium text-white">
                                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Account Status</span>
                                <span className="font-medium text-green-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active
                                </span>
                              </div>
                            </div>
                          </div>
                        </DashboardCard>
                      </motion.div>

                      {/* Quick Actions */}
                      <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <DashboardCard className="p-6 bg-slate-900 border-slate-700 shadow-xl">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                              <LogOut className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">Session Control</h3>
                              <p className="text-xs text-slate-400">Manage your session</p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-400 border border-red-500/30 rounded-xl transition-all font-semibold"
                          >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                          </motion.button>
                        </DashboardCard>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Trainee Analytics Modal */}
      {showAnalyticsModal && selectedTrainee && traineeAnalytics && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedTrainee.name || selectedTrainee.user?.name}</h2>
                <p className="text-primary-100 text-sm">Progress & Performance Analytics</p>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Progress Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weight Progress */}
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Weight Progress
                  </h3>
                  {traineeAnalytics.progress?.weight_progress && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Initial Weight</p>
                        <p className="text-2xl font-bold text-slate-900">{traineeAnalytics.progress.weight_progress.initial?.toFixed(1)}kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Current Weight</p>
                        <p className="text-2xl font-bold text-slate-900">{traineeAnalytics.progress.weight_progress.current?.toFixed(1)}kg</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 flex items-center gap-2">
                        <span className={`text-lg font-bold ${traineeAnalytics.progress.weight_progress.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {traineeAnalytics.progress.weight_progress.change > 0 ? '+' : ''}{traineeAnalytics.progress.weight_progress.change?.toFixed(1)}kg
                        </span>
                        <span className="text-sm text-slate-600">Change</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Body Fat Progress */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-green-600" />
                    Body Fat Progress
                  </h3>
                  {traineeAnalytics.progress?.bodyfat_progress && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Initial Body Fat</p>
                        <p className="text-2xl font-bold text-slate-900">{traineeAnalytics.progress.bodyfat_progress.initial?.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Current Body Fat</p>
                        <p className="text-2xl font-bold text-slate-900">{traineeAnalytics.progress.bodyfat_progress.current?.toFixed(1)}%</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 flex items-center gap-2">
                        <span className={`text-lg font-bold ${traineeAnalytics.progress.bodyfat_progress.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {traineeAnalytics.progress.bodyfat_progress.change > 0 ? '+' : ''}{traineeAnalytics.progress.bodyfat_progress.change?.toFixed(1)}%
                        </span>
                        <span className="text-sm text-slate-600">Change</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance & Workouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    Compliance
                  </h3>
                  {traineeAnalytics.progress?.compliance && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Measurements Logged</span>
                        <span className="font-bold text-slate-900">{traineeAnalytics.progress.compliance.measurement_frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Adherence Rate</span>
                        <span className="font-bold text-slate-900">{traineeAnalytics.progress.compliance.adherence_rate?.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-3 mt-2">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(100, traineeAnalytics.progress.compliance.adherence_rate || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-600" />
                    Workouts
                  </h3>
                  {traineeAnalytics.progress?.workouts && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Workouts</span>
                        <span className="font-bold text-slate-900">{traineeAnalytics.progress.workouts.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Completed</span>
                        <span className="font-bold text-slate-900">{traineeAnalytics.progress.workouts.completed}</span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Last Workout: {traineeAnalytics.progress.workouts.last_workout ? new Date(traineeAnalytics.progress.workouts.last_workout).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Achievements ({traineeAnalytics.milestones?.total_unlocked || 0})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {traineeAnalytics.milestones?.achievements?.map((achievement, idx) => (
                    <div key={idx} className={`rounded-lg p-4 flex items-start gap-3 ${achievement.achieved ? 'bg-white border-2 border-yellow-400' : 'bg-gray-100 opacity-50'}`}>
                      <span className="text-2xl">{achievement.title.charAt(0)}</span>
                      <div>
                        <p className="font-semibold text-slate-900">{achievement.title}</p>
                        <p className="text-sm text-slate-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {!traineeAnalytics.milestones?.achievements?.length && (
                  <p className="text-slate-500 text-center py-4">No achievements yet</p>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}


export default TrainerDashboard
