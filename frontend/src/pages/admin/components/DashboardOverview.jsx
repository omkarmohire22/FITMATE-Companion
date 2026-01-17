import { motion } from 'framer-motion'
import {
  Users, Dumbbell, DollarSign, Activity, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Calendar, Zap, Award, Clock, Eye,
  UserPlus, Wrench, Bell, Sparkles, ArrowRight, RefreshCw
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '../../../contexts/ThemeContext'

const DashboardOverview = ({ dashboardData }) => {
  const { isDark } = useTheme()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const safeData = dashboardData || {}
  const totalMembers = safeData.total_members || 0
  const activeTrainers = safeData.active_trainers || 0
  const monthlyRevenue = safeData.monthly_revenue || 0
  const recentWorkouts = safeData.recent_workouts || 0
  const newSignupsToday = safeData.new_signups_today || 0
  const newSignupsWeek = safeData.new_signups_week || 0
  const todaysRevenue = safeData.todays_revenue || 0
  const pendingPayments = safeData.pending_payments || 0
  const overduePayments = safeData.overdue_payments || 0
  const expiringMemberships = safeData.expiring_memberships || 0
  const equipmentMaintenance = safeData.equipment_maintenance || 0
  const systemHealth = safeData.system_health || { status: 'Unknown', details: '' }
  const topPlansData = safeData.top_plans || []
  const aiSuggestionsData = safeData.ai_suggestions || []
  const progressAnalytics = safeData.progress_analytics || {}

  // Real-Time Metrics
  const metrics = [
    {
      title: 'Total Members',
      value: totalMembers,
      subtitle: 'Registered trainees',
      icon: Users,
      iconBg: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
      iconColor: 'text-blue-500',
      trend: newSignupsWeek > 0 ? `+${newSignupsWeek} this week` : 'No new signups',
      trendUp: newSignupsWeek > 0,
    },
    {
      title: 'Active Trainers',
      value: activeTrainers,
      subtitle: 'Handling members',
      icon: Dumbbell,
      iconBg: isDark ? 'bg-violet-500/15' : 'bg-violet-50',
      iconColor: 'text-violet-500',
      trend: activeTrainers > 0 ? 'Active' : 'None',
      trendUp: activeTrainers > 0,
    },
    {
      title: 'Monthly Revenue',
      value: `₹${monthlyRevenue.toLocaleString()}`,
      subtitle: 'Last 30 days',
      icon: DollarSign,
      iconBg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      trend: todaysRevenue > 0 ? `₹${todaysRevenue.toLocaleString()} today` : 'No revenue today',
      trendUp: todaysRevenue > 0,
    },
    {
      title: 'Recent Workouts',
      value: recentWorkouts,
      subtitle: 'Tracked by system',
      icon: Activity,
      iconBg: isDark ? 'bg-amber-500/15' : 'bg-amber-50',
      iconColor: 'text-amber-500',
      trend: recentWorkouts > 0 ? 'Active tracking' : 'No recent workouts',
      trendUp: recentWorkouts > 0,
    },
  ]

  // Payment Insights - using real data
  const paymentInsights = [
    { label: 'Pending Payments', value: `₹${pendingPayments.toLocaleString()}`, status: pendingPayments > 0 ? 'warning' : 'success', icon: Clock },
    { label: 'Overdue', value: `₹${overduePayments.toLocaleString()}`, status: overduePayments > 0 ? 'danger' : 'success', icon: AlertCircle },
    { label: "Today's Revenue", value: `₹${todaysRevenue.toLocaleString()}`, status: todaysRevenue > 0 ? 'success' : 'info', icon: CheckCircle },
    { label: 'Expiring Soon', value: `${expiringMemberships} Members`, status: expiringMemberships > 0 ? 'info' : 'success', icon: Calendar },
  ]

  // AI Suggestions - using real data with fallback
  const aiSuggestions = aiSuggestionsData.length > 0 ? aiSuggestionsData : [
    "No AI suggestions available at the moment.",
    "Check back later for personalized recommendations.",
    "Add more data to enable AI insights."
  ]

  // Quick Actions
  const quickActions = [
    { label: 'Add Trainer', icon: UserPlus, color: 'blue' },
    { label: 'Add Trainee', icon: Users, color: 'green' },
    { label: 'Create Plan', icon: Award, color: 'purple' },
    { label: 'Send Alert', icon: Bell, color: 'orange' },
  ]

  // Top Performing Plans - using real data with fallback
  const planColors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500']
  const topPlans = topPlansData.length > 0 
    ? topPlansData.slice(0, 5).map((plan, idx) => ({
        name: plan.name || 'Unknown Plan',
        revenue: plan.revenue || 0,
        members: plan.purchase_count || 0,
        color: planColors[idx % planColors.length],
        renewalRate: plan.renewal_rate || 0
      }))
    : [
        { name: 'No plans found', revenue: 0, members: 0, color: 'bg-gray-400', renewalRate: 0 }
      ]

  // Calculate max revenue for progress bars
  const maxRevenue = Math.max(...topPlans.map(p => p.revenue), 1)

  return (
    <div className="space-y-6">
      {/* Header with Auto-Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Sparkles className="w-6 h-6 text-indigo-500" />
            Real-Time Dashboard
          </h2>
          <p className={`text-sm mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Last updated: {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${
            autoRefresh
              ? isDark 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : isDark 
                ? 'bg-gray-700/50 text-gray-400 border border-gray-600'
                : 'bg-gray-100 text-gray-500 border border-gray-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div className={`rounded-xl p-5 border transition-all hover:-translate-y-0.5 ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className={`text-xs uppercase tracking-wide font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {metric.title}
                    </p>
                    <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{metric.value}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{metric.subtitle}</p>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-lg ${metric.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                </div>
                <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  {metric.trendUp ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      metric.trendUp ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')
                    }`}
                  >
                    {metric.trend}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>vs last month</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Payment Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-xl border p-6 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Payment Insights
          </h3>
          <button className={`text-sm font-medium flex items-center gap-1 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentInsights.map((item, idx) => {
            const Icon = item.icon
            const statusStyles = {
              success: isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
              warning: isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200',
              danger: isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200',
              info: isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
            }
            const iconColors = {
              success: 'text-emerald-500',
              warning: 'text-amber-500',
              danger: 'text-red-500',
              info: 'text-blue-500'
            }
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border-2 ${statusStyles[item.status] || statusStyles.info} transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                    item.status === 'success' ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100') :
                    item.status === 'warning' ? (isDark ? 'bg-amber-500/20' : 'bg-amber-100') :
                    item.status === 'danger' ? (isDark ? 'bg-red-500/20' : 'bg-red-100') :
                    (isDark ? 'bg-blue-500/20' : 'bg-blue-100')
                  }`}>
                    <Icon className={`w-5 h-5 ${iconColors[item.status] || iconColors.info}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Quick Actions & AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-xl border p-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Zap className="w-5 h-5 text-amber-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <button
                  key={idx}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-md ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-600 hover:border-indigo-500/50 hover:bg-gray-700'
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    action.color === 'blue'
                      ? (isDark ? 'bg-blue-500/20' : 'bg-blue-100')
                      : action.color === 'green'
                      ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-100')
                      : action.color === 'purple'
                      ? (isDark ? 'bg-violet-500/20' : 'bg-violet-100')
                      : (isDark ? 'bg-amber-500/20' : 'bg-amber-100')
                  }`}>
                    <Icon
                      className={`w-5 h-5 ${
                        action.color === 'blue'
                          ? 'text-blue-500'
                          : action.color === 'green'
                          ? 'text-emerald-500'
                          : action.color === 'purple'
                          ? 'text-violet-500'
                          : 'text-amber-500'
                      }`}
                    />
                  </div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{action.label}</p>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Suggestions
          </h3>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3.5 border-l-4 border-l-indigo-500 transition-all ${
                  isDark 
                    ? 'bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15' 
                    : 'bg-indigo-50/70 border border-indigo-100 hover:bg-indigo-50'
                }`}
              >
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{suggestion}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Performing Plans & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plans Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`lg:col-span-2 rounded-xl border p-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Award className="w-5 h-5 text-yellow-500" />
              Top Performing Plans
            </h3>
            <button className={`text-sm font-medium ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
              View All
            </button>
          </div>
          <div className="space-y-4">
            {topPlans.map((plan, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-lg ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'} flex items-center justify-center text-indigo-500 font-bold text-sm`}>
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ₹{plan.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Users className="w-3 h-3" />
                    {plan.members} members
                    {plan.renewalRate > 0 && (
                      <span className="ml-2">• {(plan.renewalRate * 100).toFixed(0)}% renewal</span>
                    )}
                  </div>
                  <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-full bg-indigo-500"
                      style={{ width: `${Math.min((plan.revenue / maxRevenue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {topPlans.length === 0 && (
              <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No plans data available</p>
            )}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-xl border p-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Activity className="w-5 h-5 text-emerald-500" />
            System Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${
                systemHealth.status === 'Healthy' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 
                systemHealth.status === 'Warning' ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-red-400' : 'text-red-600')
              }`}>
                {systemHealth.status === 'Healthy' && <CheckCircle className="w-4 h-4" />}
                {systemHealth.status === 'Warning' && <AlertCircle className="w-4 h-4" />}
                {systemHealth.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>New Today</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{newSignupsToday} signups</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Active Trainers</span>
              <span className={`text-sm font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{activeTrainers} online</span>
            </div>
            <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Equipment Alert</span>
                <Wrench className={`w-4 h-4 ${equipmentMaintenance > 0 ? (isDark ? 'text-amber-400' : 'text-amber-500') : (isDark ? 'text-emerald-400' : 'text-emerald-500')}`} />
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {equipmentMaintenance > 0 
                  ? `${equipmentMaintenance} equipment needs maintenance`
                  : 'All equipment in good condition'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Growth Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`rounded-xl border p-6 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm uppercase tracking-wide font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>Today's Summary</p>
            <h3 className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Real-Time Metrics</h3>
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>New Today</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{newSignupsToday} Signups</p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>This Week</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{newSignupsWeek} Members</p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Active</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalMembers}</p>
              </div>
              <div>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Today's Revenue</p>
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{todaysRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <Eye className={`w-16 h-16 ${isDark ? 'text-indigo-500/20' : 'text-indigo-100'}`} />
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardOverview

