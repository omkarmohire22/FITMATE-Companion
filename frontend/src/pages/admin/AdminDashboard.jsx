import { useAuth } from '../../contexts/AuthContext'
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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState('all') // all, critical, important, normal
  const [hiddenNotifications, setHiddenNotifications] = useState(new Set())

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
        setNotificationCount(data.notifications?.length || 0)
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
      setNotificationCount(data.notifications?.length || 0)
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
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center gap-4">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg lg:hidden transition-colors text-slate-400 hover:text-white"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-base sm:text-xl font-bold text-white tracking-tight">
                      FITMATE
                    </span>
                    <p className="text-[10px] sm:text-xs text-sky-400 font-medium">
                      Admin Dashboard
                    </p>
                  </div>
                </div>
            </div>
            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/50">
                <Search className="w-4 h-4 text-sky-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none text-xs sm:text-sm w-32 sm:w-40 text-slate-200 placeholder:text-slate-500"
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
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5 text-slate-400" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800">
                      <h3 className="font-semibold text-white text-sm">Notifications</h3>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="px-3 py-2 border-b border-slate-700 flex gap-1 bg-slate-900/50 overflow-x-auto">
                      {[
                        { label: 'All', value: 'all', color: 'bg-slate-700' },
                        { label: 'Critical', value: 'critical', color: 'bg-red-900/50' },
                        { label: 'Important', value: 'important', color: 'bg-sky-900/50' },
                        { label: 'Normal', value: 'normal', color: 'bg-blue-900/50' },
                      ].map(filter => (
                        <button
                          key={filter.value}
                          onClick={() => setNotificationFilter(filter.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                            notificationFilter === filter.value
                              ? `${filter.color} text-white`
                              : 'text-slate-400 hover:text-sky-400'
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
                          <p className="text-slate-400 text-sm">No notifications</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-700/50">
                          {dashboardData.notifications
                            .filter(note => notificationFilter === 'all' || note.importance === notificationFilter)
                            .filter(note => !hiddenNotifications.has(`${note.type}-${note.created_at}`))
                            .map((note, idx) => {
                              const importanceColors = {
                                critical: 'border-l-red-500 bg-red-950/10',
                                important: 'border-l-sky-500 bg-sky-950/10',
                                normal: 'border-l-blue-500 bg-blue-950/10',
                                info: 'border-l-slate-500 bg-slate-800/20',
                              };
                              
                              const importanceBadge = {
                                critical: 'bg-red-900/80 text-red-200',
                                important: 'bg-sky-900/80 text-sky-200',
                                normal: 'bg-blue-900/80 text-blue-200',
                                info: 'bg-slate-700 text-slate-200',
                              };
                              
                              return (
                                <li 
                                  key={idx} 
                                  className={`p-3 border-l-4 ${importanceColors[note.importance] || 'border-l-slate-500 bg-slate-800/20'} hover:bg-slate-800/40 transition-colors group`}
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
                                      <p className="text-slate-200 text-sm break-words">{note.message}</p>
                                      <p className="text-slate-500 text-xs mt-1">
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
                                      className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs"
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
                    <div className="px-4 py-2 border-t border-slate-700 bg-slate-800 text-xs text-slate-400 text-center">
                      {dashboardData.notifications?.length || 0} total notifications
                    </div>
                  </div>
                )}
              </div>
              {/* User Profile */}
              <div className="flex items-center gap-2 sm:gap-3 pl-3 border-l border-slate-700">
                <div className="hidden sm:block text-right">
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-sky-400 font-medium">
                    Administrator
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              </div>
              {/* Logout Button */}
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Main layout */}
      <div className="flex pt-16 sm:pt-20">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:block fixed left-0 top-20 bottom-0 w-64">
          <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} />
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
                className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-gray-900 shadow-2xl"
              >
                <Sidebar activeTab={activeTab} onChangeTab={(id) => {
                  setActiveTab(id)
                  setSidebarOpen(false)
                }} />
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
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Welcome back, <span className="text-sky-500">{user?.name || 'Admin'}</span>
                  </h1>
                  <p className="text-slate-400 text-sm sm:text-base mt-1.5 font-medium max-w-2xl">
                    Your gym is performing well. Here's your facility overview.
                  </p>
                </div>
                {/* Quick Stats Badge */}
                {dashboardData.new_signups_today > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2.5 bg-sky-500/10 text-sky-400 px-4 py-2 rounded-lg border border-sky-500/30"
                  >
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
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
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4 border border-slate-700/50 hover:border-sky-500/40 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-400 text-xs uppercase">System Health</div>
                    <div className={`text-xl font-bold mt-1 ${dashboardData.system_health.status === 'Healthy' ? 'text-green-400' : 'text-red-400'}`}>
                      {dashboardData.system_health.status}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{dashboardData.system_health.details || 'All systems operational'}</div>
                  </div>
                </div>
                {/* AI Suggestions */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4 border border-slate-700/50 hover:border-sky-500/40 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-400 text-xs uppercase">AI Insights</div>
                    <div className="mt-1.5 space-y-1">
                      {!Array.isArray(dashboardData.ai_suggestions) || dashboardData.ai_suggestions.length === 0 ? (
                        <p className="text-xs text-slate-500">No insights today</p>
                      ) : (
                        dashboardData.ai_suggestions.slice(0, 2).map((s, i) => (
                          <p key={i} className="text-xs text-slate-300 truncate">
                            • {typeof s === 'string' ? s : s.suggestion || s.message}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Top Membership Plans */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4 border border-slate-700/50 hover:border-sky-500/40 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-400 text-xs uppercase">Top Plans</div>
                    <div className="mt-1.5 space-y-1">
                      {!Array.isArray(dashboardData.top_plans) || dashboardData.top_plans.length === 0 ? (
                        <p className="text-xs text-slate-500">No plan data</p>
                      ) : (
                        dashboardData.top_plans.slice(0, 2).map((plan, i) => (
                          <p key={i} className="text-xs text-slate-300 truncate">
                            <span className="text-sky-400 font-semibold">{plan.signups || 0}</span> {plan.name || plan}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                {/* Progress Analytics */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4 border border-slate-700/50 hover:border-sky-500/40 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-400 text-xs uppercase">Analytics</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {dashboardData.progress_analytics.summary || 'Growth: +12%'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Monthly performance</div>
                  </div>
                </div>
                {/* Community Stats */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 flex items-center gap-4 border border-slate-700/50 hover:border-sky-500/40 transition-all duration-200 group">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-400 text-xs uppercase">Community</div>
                    <div className="text-xl font-bold text-white mt-1">{dashboardData.total_members} <span className="text-sm font-normal text-slate-500">Members</span></div>
                    <div className="text-xs text-slate-500 mt-0.5">{dashboardData.active_trainers} Active Trainers</div>
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