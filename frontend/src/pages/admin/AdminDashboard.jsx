import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  LogOut,
  Dumbbell,
  Search,
  Bell,
  Menu,
  X,
  RefreshCw,
  HeartPulse,
  Sparkles,
  BarChart2,
  Users,
  ClipboardList,
  Award,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { adminApi } from '../../utils/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

import Sidebar from './components/sidebar'
import DashboardOverview from './components/DashboardOverview'
import BillingFinance from './components/BillingFinance'
import TrainerManagement from './components/TrainerManagement'
import TraineeManagement from './components/TraineeManagement'
import MembershipPlans from './components/MembershipPlans'
import EquipmentManagement from './components/EquipmentManagement'
import TimeSchedule from './components/TimeSchedule'
import MessageBox from './components/MessageBox'
import UsersManagement from './components/UsersManagement'
import AdminProfile from './AdminProfile'
import AdminSettings from './AdminSettings'

const AdminDashboard = () => {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const [dashboardData, setDashboardData] = useState({
    total_members: 0,
    active_trainers: 0,
    monthly_revenue: 0,
    recent_workouts: 0,
    new_signups_today: 0,
    new_signups_week: 0,
    todays_revenue: 0,
    pending_payments: 0,
    overdue_payments: 0,
    expiring_memberships: 0,
    equipment_maintenance: 0,
    top_plans: [],
    ai_suggestions: [],
    system_health: { status: 'Healthy', details: '' },
    notifications: [],
    progress_analytics: {},
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState('all') // all, critical, important, normal
  const [hiddenNotifications, setHiddenNotifications] = useState(new Set())

  // Handle opening notifications panel and marking as read
  const handleNotificationClick = async () => {
    const wasOpen = showNotifications
    setShowNotifications(!showNotifications)
    
    // If opening the panel and there are unread notifications, mark them as read
    if (!wasOpen && notificationCount > 0) {
      try {
        await adminApi.markAllNotificationsRead()
        setNotificationCount(0)
      } catch (err) {
        console.error('Failed to mark notifications as read:', err)
      }
    }
  }

  useEffect(() => {
    if (!user) return;
    const role = user.role?.toUpperCase();
    if (role !== 'ADMIN') {
      toast.error('Access denied. Admin privileges required.');
      logout();
      return;
    }
    const loadDashboard = async () => {
      if (isRefreshing) return;
      try {
        setIsRefreshing(true)
        // Use new consolidated endpoint instead of 6 parallel calls
        const res = await adminApi.getDashboardComplete();
        const data = res.data || {};
        
        setDashboardData({
          total_members: data.live_metrics?.total_members || 0,
          active_trainers: data.live_metrics?.active_trainers || 0,
          monthly_revenue: data.live_metrics?.monthly_revenue || 0,
          todays_revenue: data.live_metrics?.todays_revenue || 0,
          new_signups_today: data.live_metrics?.new_signups_today || 0,
          new_signups_week: data.live_metrics?.new_signups_week || 0,
          pending_payments: data.live_metrics?.pending_payments || 0,
          top_plans: data.top_plans || [],
          ai_suggestions: data.ai_suggestions || [],
          system_health: data.system_health || { status: 'Healthy' },
          notifications: data.notifications || [],
          progress_analytics: data.progress_analytics || {},
        });
        setLastUpdated(new Date())
        setNotificationCount(data.unread_count || 0)
        setUnreadMessageCount(data.unread_message_count || 0)
      } catch (err) {
        console.error('Dashboard load error:', err);
        if (err.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          logout();
        } else if (err.code === 'ECONNABORTED') {
          toast.error('Dashboard load timed out. Retrying...');
        } else {
          toast.error('Failed to load dashboard data');
        }
      } finally {
        setIsRefreshing(false)
      }
    };

    loadDashboard();
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        loadDashboard();
      }
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, [user, logout]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Use new consolidated endpoint
      const res = await adminApi.getDashboardComplete();
      const data = res.data || {};
      
      setDashboardData({
        total_members: data.live_metrics?.total_members || 0,
        active_trainers: data.live_metrics?.active_trainers || 0,
        monthly_revenue: data.live_metrics?.monthly_revenue || 0,
        todays_revenue: data.live_metrics?.todays_revenue || 0,
        new_signups_today: data.live_metrics?.new_signups_today || 0,
        new_signups_week: data.live_metrics?.new_signups_week || 0,
        pending_payments: data.live_metrics?.pending_payments || 0,
        top_plans: data.top_plans || [],
        ai_suggestions: data.ai_suggestions || [],
        system_health: data.system_health || { status: 'Healthy' },
        notifications: data.notifications || [],
        progress_analytics: data.progress_analytics || {},
      });
      setLastUpdated(new Date())
      toast.success('Dashboard refreshed!', { duration: 2000 })
      setNotificationCount(data.unread_count || 0)
      setUnreadMessageCount(data.unread_message_count || 0)
    } catch (err) {
      console.error('Refresh error:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
      } else {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview dashboardData={dashboardData} />
      case 'billing':
        return <BillingFinance />
      case 'trainers':
        return <TrainerManagement />
      case 'trainees':
        return <TraineeManagement />
      case 'membership':
        return <MembershipPlans />
      case 'equipment':
        return <EquipmentManagement />
      case 'schedule':
        return <TimeSchedule />
      case 'messages':
        return <MessageBox />
      case 'users':
        return <UsersManagement />
      case 'profile':
        return <AdminProfile />
      case 'settings':
        return <AdminSettings />
      default:
        return <DashboardOverview dashboardData={dashboardData} />
    }
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 dark:bg-gray-800/95 bg-white backdrop-blur-md border-b dark:border-gray-700 border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-lg lg:hidden transition-colors dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-gray-900"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-base sm:text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                      FITMATE
                    </span>
                    <p className="text-[10px] sm:text-xs dark:text-indigo-400 text-indigo-600 font-medium">
                      Admin Dashboard
                    </p>
                  </div>
                </div>
            </div>
            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 dark:bg-gray-700/50 bg-gray-100 px-3 py-2 rounded-lg border dark:border-gray-600 border-gray-200">
                <Search className="w-4 h-4 dark:text-gray-400 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-xs sm:text-sm w-32 sm:w-40 dark:text-gray-200 text-gray-700 placeholder:dark:text-gray-500 placeholder:text-gray-400"
                />
              </div>
              {/* Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative group"
                title="Refresh Dashboard"
              >
                <RefreshCw 
                  className={`w-5 h-5 dark:text-gray-400 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block dark:bg-gray-800 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-50">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </button>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  className="p-2 dark:hover:bg-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                  onClick={handleNotificationClick}
                  title={notificationCount > 0 ? `${notificationCount} unread notification${notificationCount > 1 ? 's' : ''}` : 'Notifications'}
                >
                  <Bell className="w-5 h-5 dark:text-gray-400 text-gray-600" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md ring-2 ring-white dark:ring-gray-800 px-1.5 z-10">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 dark:bg-gray-800 bg-white border dark:border-gray-700 border-gray-200 rounded-xl shadow-xl z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b dark:border-gray-700 border-gray-200 flex items-center justify-between dark:bg-gray-800 bg-gray-50 rounded-t-xl">
                      <h3 className="font-semibold dark:text-white text-gray-900 text-sm">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="dark:text-gray-400 dark:hover:text-white text-gray-500 hover:text-gray-700 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="px-3 py-2 border-b dark:border-gray-700 border-gray-200 flex gap-1 dark:bg-gray-800/50 bg-gray-50 overflow-x-auto">
                      {[
                        { label: 'All', value: 'all', activeColor: 'bg-gray-600 dark:bg-gray-600' },
                        { label: 'Critical', value: 'critical', activeColor: 'bg-red-600 dark:bg-red-600' },
                        { label: 'Important', value: 'important', activeColor: 'bg-amber-600 dark:bg-amber-600' },
                        { label: 'Normal', value: 'normal', activeColor: 'bg-blue-600 dark:bg-blue-600' },
                      ].map(filter => (
                        <button
                          key={filter.value}
                          onClick={() => setNotificationFilter(filter.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            notificationFilter === filter.value
                              ? `${filter.activeColor} text-white`
                              : 'dark:text-gray-400 text-gray-600 dark:hover:bg-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {!Array.isArray(dashboardData.notifications) || dashboardData.notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="dark:text-gray-400 text-gray-500 text-sm">No notifications</p>
                        </div>
                      ) : (
                        <ul className="divide-y dark:divide-gray-700 divide-gray-200">
                          {dashboardData.notifications
                            .filter(note => notificationFilter === 'all' || note.importance === notificationFilter)
                            .filter(note => !hiddenNotifications.has(`${note.type}-${note.created_at}`))
                            .map((note, idx) => {
                              const importanceColors = {
                                critical: 'border-l-red-500 dark:bg-red-900/20 bg-red-50',
                                important: 'border-l-amber-500 dark:bg-amber-900/20 bg-amber-50',
                                normal: 'border-l-blue-500 dark:bg-blue-900/20 bg-blue-50',
                                info: 'border-l-gray-400 dark:bg-gray-700/20 bg-gray-50',
                              };
                              
                              const importanceBadge = {
                                critical: 'bg-red-600 text-white',
                                important: 'bg-amber-600 text-white',
                                normal: 'bg-blue-600 text-white',
                                info: 'dark:bg-gray-600 bg-gray-200 dark:text-gray-200 text-gray-700',
                              };
                              
                              return (
                                <li 
                                  key={idx} 
                                  className={`p-3 border-l-4 ${importanceColors[note.importance] || 'border-l-gray-400 dark:bg-gray-700/20 bg-gray-50'} dark:hover:bg-gray-700/40 hover:bg-gray-100 transition-colors group`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${importanceBadge[note.importance] || importanceBadge.info}`}>
                                          {note.importance || 'info'}
                                        </span>
                                        {note.type === 'payment' && <span className="text-xs">💳</span>}
                                        {note.type === 'signup' && <span className="text-xs">👤</span>}
                                        {note.type === 'maintenance' && <span className="text-xs">⚠️</span>}
                                        {note.type === 'feedback' && <span className="text-xs">💬</span>}
                                        {note.type === 'general' && <span className="text-xs">📢</span>}
                                      </div>
                                      <p className="dark:text-gray-200 text-gray-700 text-sm break-words">{note.message}</p>
                                      <p className="dark:text-gray-400 text-gray-500 text-xs mt-1">
                                        {note.created_at ? new Date(note.created_at).toLocaleString() : 'Just now'}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const key = `${note.type}-${note.created_at}`;
                                        setHiddenNotifications(prev => {
                                          const newSet = new Set(prev);
                                          newSet.add(key);
                                          return newSet;
                                        });
                                      }}
                                      className="dark:text-gray-500 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs"
                                      title="Dismiss"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="px-4 py-2 border-t dark:border-gray-700 border-gray-200 dark:bg-gray-800 bg-gray-50 rounded-b-xl text-xs dark:text-gray-400 text-gray-600 text-center">
                      {dashboardData.notifications?.length || 0} total notifications
                    </div>
                  </div>
                )}
              </div>
              {/* User Profile */}
              <div className="flex items-center gap-2 sm:gap-3 pl-3 dark:border-gray-700 border-gray-200 border-l">
                <div className="hidden sm:block text-right">
                  <p className="text-xs sm:text-sm font-semibold dark:text-white text-gray-900">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] sm:text-xs dark:text-indigo-400 text-indigo-600 font-medium">
                    Administrator
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all text-xs sm:text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Main layout */}
      <div className="flex pt-16 sm:pt-20 dark:bg-gray-900 bg-gray-50 min-h-screen">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:block fixed left-0 top-20 bottom-0 w-64">
          <Sidebar 
            activeTab={activeTab} 
            onChangeTab={setActiveTab} 
            unreadMessageCount={unreadMessageCount}
            onClearMessageBadge={() => setUnreadMessageCount(0)}
          />
        </div>
        {/* Sidebar slide-in for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              >
                <Sidebar 
                  activeTab={activeTab} 
                  onChangeTab={(id) => {
                    setActiveTab(id)
                    setSidebarOpen(false)
                  }}
                  unreadMessageCount={unreadMessageCount}
                  onClearMessageBadge={() => setUnreadMessageCount(0)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-5rem)]">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Welcome Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Welcome back, <span className="text-indigo-500 dark:text-indigo-400">{user?.name || 'Admin'}</span>
                  </h1>
                  <p className={`text-sm sm:text-base mt-1.5 max-w-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your gym is performing well. Here's your facility overview.
                  </p>
                </div>
                {/* Quick Stats Badge */}
                {dashboardData.new_signups_today > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold">
                      {dashboardData.new_signups_today} new signup{dashboardData.new_signups_today > 1 ? 's' : ''} today
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
            {/* Dashboard Widgets */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {/* System Health */}
                <div className={`rounded-xl p-5 flex items-center gap-4 border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800/80 border-emerald-500/30 hover:border-emerald-500/50' 
                    : 'bg-white border-emerald-200 hover:border-emerald-300 shadow-sm'
                }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <HeartPulse className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <div className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>System Health</div>
                    <div className={`text-2xl font-bold mt-1 ${dashboardData.system_health.status === 'Healthy' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {dashboardData.system_health.status}
                    </div>
                    <div className={`text-xs mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dashboardData.system_health.details || 'All systems operational'}</div>
                  </div>
                </div>
                {/* AI Suggestions */}
                <div className={`rounded-xl p-5 flex items-center gap-4 border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800/80 border-indigo-500/30 hover:border-indigo-500/50' 
                    : 'bg-white border-indigo-200 hover:border-indigo-300 shadow-sm'
                }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                    <Sparkles className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>AI Insights</div>
                    <div className="mt-1.5 space-y-1">
                      {!Array.isArray(dashboardData.ai_suggestions) || dashboardData.ai_suggestions.length === 0 ? (
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No insights today</p>
                      ) : (
                        dashboardData.ai_suggestions.slice(0, 2).map((s, i) => (
                          <p key={i} className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            • {typeof s === 'string' ? s : s.suggestion || s.message}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Top Membership Plans */}
                <div className={`rounded-xl p-5 flex items-center gap-4 border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800/80 border-amber-500/30 hover:border-amber-500/50' 
                    : 'bg-white border-amber-200 hover:border-amber-300 shadow-sm'
                }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <Award className="w-7 h-7 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Top Plans</div>
                    <div className="mt-1.5 space-y-1">
                      {!Array.isArray(dashboardData.top_plans) || dashboardData.top_plans.length === 0 ? (
                        <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No plan data</p>
                      ) : (
                        dashboardData.top_plans.slice(0, 2).map((plan, i) => (
                          <p key={i} className={`text-xs font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            <span className="text-amber-500 font-bold">{plan.signups || 0}</span> {plan.name || plan}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Progress Analytics */}
                <div className={`rounded-xl p-5 flex items-center gap-4 border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800/80 border-blue-500/30 hover:border-blue-500/50' 
                    : 'bg-white border-blue-200 hover:border-blue-300 shadow-sm'
                }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <BarChart2 className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <div className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Analytics</div>
                    <div className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {dashboardData.progress_analytics.summary || 'Growth: +12%'}
                    </div>
                    <div className={`text-xs mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Monthly performance</div>
                  </div>
                </div>
                {/* Community Stats */}
                <div className={`rounded-xl p-5 flex items-center gap-4 border-2 transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-800/80 border-violet-500/30 hover:border-violet-500/50' 
                    : 'bg-white border-violet-200 hover:border-violet-300 shadow-sm'
                }`}>
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
                    <Users className="w-7 h-7 text-violet-500" />
                  </div>
                  <div>
                    <div className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Community</div>
                    <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{dashboardData.total_members} <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Members</span></div>
                    <div className={`text-xs mt-0.5 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dashboardData.active_trainers} Active Trainers</div>
                  </div>
                </div>
              </div>
            )}
            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard