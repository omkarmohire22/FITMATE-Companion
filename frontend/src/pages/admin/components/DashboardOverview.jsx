import { motion } from 'framer-motion'
import {
  Users, Dumbbell, DollarSign, Activity, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Calendar, Zap, Award, Clock, Eye,
  UserPlus, Wrench, Bell, Sparkles, ArrowRight, RefreshCw
} from 'lucide-react'
import { useState, useEffect } from 'react'

const DashboardOverview = ({ dashboardData }) => {
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
      color: 'from-blue-500 to-cyan-500',
      trend: newSignupsWeek > 0 ? `+${newSignupsWeek} this week` : 'No new signups',
      trendUp: newSignupsWeek > 0,
    },
    {
      title: 'Active Trainers',
      value: activeTrainers,
      subtitle: 'Handling members',
      icon: Dumbbell,
      color: 'from-purple-500 to-pink-500',
      trend: activeTrainers > 0 ? 'Active' : 'None',
      trendUp: activeTrainers > 0,
    },
    {
      title: 'Monthly Revenue',
      value: `₹${monthlyRevenue.toLocaleString()}`,
      subtitle: 'Last 30 days',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      trend: todaysRevenue > 0 ? `₹${todaysRevenue.toLocaleString()} today` : 'No revenue today',
      trendUp: todaysRevenue > 0,
    },
    {
      title: 'Recent Workouts',
      value: recentWorkouts,
      subtitle: 'Tracked by system',
      icon: Activity,
      color: 'from-orange-500 to-red-500',
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
    <div className="space-y-6 dark:bg-gray-900 dark:text-white">
      {/* Header with Auto-Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white dark:text-white flex items-center gap-3 tracking-tight">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Real-Time Dashboard
          </h2>
          <p className="text-gray-300 dark:text-gray-300 text-base mt-2 font-medium">
            Last updated: {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            autoRefresh
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/50 dark:bg-gray-500/20 dark:text-gray-400'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metric.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{metric.subtitle}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {metric.trendUp ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      metric.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {metric.trend}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Payment Insights
          </h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1">
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentInsights.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border-2 ${
                  item.status === 'success'
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/50'
                    : item.status === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/50'
                    : item.status === 'danger'
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/50'
                    : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      item.status === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : item.status === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : item.status === 'danger'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <button
                  key={idx}
                  className={`p-4 rounded-xl border-2 hover:shadow-lg transition-all group ${
                    action.color === 'blue'
                      ? 'border-blue-200 dark:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                      : action.color === 'green'
                      ? 'border-green-200 dark:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-500/10'
                      : action.color === 'purple'
                      ? 'border-purple-200 dark:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-500/10'
                      : 'border-orange-200 dark:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      action.color === 'blue'
                        ? 'text-blue-600 dark:text-blue-400'
                        : action.color === 'green'
                        ? 'text-green-600 dark:text-green-400'
                        : action.color === 'purple'
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</p>
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
          className="bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            🤖 FitMate AI Suggestions
          </h3>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/20 transition-all"
              >
                <p className="text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Performing Plans & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plans Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Top Performing Plans
            </h3>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {topPlans.map((plan, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${plan.color} flex items-center justify-center text-white font-bold`}>
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      ₹{plan.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Users className="w-3 h-3" />
                    {plan.members} members
                    {plan.renewalRate > 0 && (
                      <span className="ml-2">• {(plan.renewalRate * 100).toFixed(0)}% renewal</span>
                    )}
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${plan.color}`}
                      style={{ width: `${Math.min((plan.revenue / maxRevenue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {topPlans.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No plans data available</p>
            )}
          </div>
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            System Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${
                systemHealth.status === 'Healthy' ? 'text-green-600 dark:text-green-400' : 
                systemHealth.status === 'Warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {systemHealth.status === 'Healthy' && <CheckCircle className="w-4 h-4" />}
                {systemHealth.status === 'Warning' && <AlertCircle className="w-4 h-4" />}
                {systemHealth.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">New Today</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{newSignupsToday} signups</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Trainers</span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{activeTrainers} online</span>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Equipment Alert</span>
                <Wrench className={`w-4 h-4 ${equipmentMaintenance > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
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
        className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 rounded-2xl shadow-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide opacity-90">Today's Summary</p>
            <h3 className="text-2xl font-bold mt-1">Real-Time Metrics</h3>
            <div className="flex items-center gap-6 mt-4">
              <div>
                <p className="text-xs opacity-75">New Today</p>
                <p className="text-xl font-bold">{newSignupsToday} Signups</p>
              </div>
              <div>
                <p className="text-xs opacity-75">This Week</p>
                <p className="text-xl font-bold">{newSignupsWeek} Members</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Total Active</p>
                <p className="text-xl font-bold">{totalMembers}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Today's Revenue</p>
                <p className="text-xl font-bold">₹{todaysRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <Eye className="w-16 h-16 opacity-20" />
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardOverview

