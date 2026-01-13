import { useState, useEffect } from 'react'
import { nutritionApi } from '../../utils/api'
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target } from 'lucide-react'
import { toast } from 'react-hot-toast'

/**
 * Nutrition Analytics Dashboard
 * Shows trends, weekly patterns, and progress towards goals
 */
export default function NutritionAnalytics() {
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFats: 0,
    trend: 'stable'
  })

  useEffect(() => {
    fetchWeeklyData()
  }, [])

  const fetchWeeklyData = async () => {
    try {
      setLoading(true)
      const response = await nutritionApi.getLogs(100, 0) // Get last 100 logs
      
      // Group logs by date
      const byDate = {}
      const logs = response.data.logs || []
      
      logs.forEach(log => {
        // Handle different date field names (date, logged_at, created_at)
        const dateStr = log.date || log.logged_at || log.created_at
        if (!dateStr) return
        
        const date = dateStr.split('T')[0]
        if (!byDate[date]) {
          byDate[date] = {
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            mealCount: 0
          }
        }
        byDate[date].calories += log.calories || 0
        // Handle both 'macros' and 'nutrition' field names
        const macros = log.macros || log.nutrition || {}
        byDate[date].protein += macros.protein || 0
        byDate[date].carbs += macros.carbs || 0
        byDate[date].fats += macros.fats || 0
        byDate[date].mealCount += 1
      })

      const data = Object.values(byDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7) // Last 7 days

      setWeeklyData(data)

      // Calculate stats
      if (data.length > 0) {
        const avgCalories = Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length)
        const avgProtein = Math.round(data.reduce((sum, d) => sum + d.protein, 0) / data.length * 10) / 10
        const avgCarbs = Math.round(data.reduce((sum, d) => sum + d.carbs, 0) / data.length * 10) / 10
        const avgFats = Math.round(data.reduce((sum, d) => sum + d.fats, 0) / data.length * 10) / 10

        // Determine trend
        let trend = 'stable'
        if (data.length >= 2) {
          const lastThree = data.slice(-3).map(d => d.calories)
          const avg = lastThree.reduce((a, b) => a + b, 0) / lastThree.length
          const firstCalories = lastThree[0]
          const lastCalories = lastThree[lastThree.length - 1]
          
          if (lastCalories > avg * 1.1) trend = 'increasing'
          else if (lastCalories < avg * 0.9) trend = 'decreasing'
        }

        setStats({
          avgCalories,
          avgProtein,
          avgCarbs,
          avgFats,
          trend
        })
      }
    } catch (error) {
      console.error('Failed to fetch weekly data:', error)
      // Don't show error toast if just no data
      if (error.response?.status !== 404) {
        toast.error('Failed to load analytics')
      }
      setWeeklyData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    )
  }

  const maxCalories = weeklyData.length > 0 
    ? Math.max(...weeklyData.map(d => d.calories), 2500)
    : 2500

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date()
  const dayLabels = weeklyData.map(d => {
    const date = new Date(d.date)
    const dayIndex = date.getDay()
    return days[dayIndex] + ' ' + date.getDate()
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold">📊 Nutrition Analytics</h3>
            <p className="text-indigo-100 text-sm sm:text-base">Track your 7-day nutrition trends</p>
          </div>
        </div>
      </div>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Avg Calories */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-2xl p-4 sm:p-5 border border-orange-200 dark:border-orange-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Avg Calories</h4>
            <span className="text-xl">🔥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400">{stats.avgCalories}</p>
          <p className="text-xs font-medium text-orange-700 dark:text-sky-400/80 mt-2">per day</p>
        </div>

        {/* Avg Protein */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl p-4 sm:p-5 border border-red-200 dark:border-red-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">Avg Protein</h4>
            <span className="text-xl">🥩</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{stats.avgProtein}g</p>
          <p className="text-xs font-medium text-red-700 dark:text-red-400/80 mt-2">per day</p>
        </div>

        {/* Avg Carbs */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-2xl p-4 sm:p-5 border border-amber-200 dark:border-amber-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Avg Carbs</h4>
            <span className="text-xl">🍞</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.avgCarbs}g</p>
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400/80 mt-2">per day</p>
        </div>

        {/* Avg Fats */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-2xl p-4 sm:p-5 border border-yellow-200 dark:border-yellow-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">Avg Fats</h4>
            <span className="text-xl">🥑</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.avgFats}g</p>
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400/80 mt-2">per day</p>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className={`rounded-2xl p-5 sm:p-6 border shadow-sm ${
        stats.trend === 'increasing' ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border-orange-200 dark:border-orange-700/50' :
        stats.trend === 'decreasing' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 border-green-200 dark:border-green-700/50' :
        'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700/50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg">📈 Calorie Trend</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {stats.trend === 'increasing' && '⬆️ Your daily calories are increasing'}
              {stats.trend === 'decreasing' && '⬇️ Your daily calories are decreasing'}
              {stats.trend === 'stable' && '➡️ Your calorie intake is stable'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${
            stats.trend === 'increasing' ? 'bg-sky-100 dark:bg-orange-900/50' :
            stats.trend === 'decreasing' ? 'bg-green-100 dark:bg-green-900/50' :
            'bg-blue-100 dark:bg-blue-900/50'
          }`}>
            {stats.trend === 'increasing' && <TrendingUp className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
            {stats.trend === 'decreasing' && <TrendingDown className="w-8 h-8 text-green-600 dark:text-green-400" />}
            {stats.trend === 'stable' && <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">📅 Daily Calories (7 Days)</h4>
        
        {weeklyData.length > 0 ? (
          <div>
            {/* Chart */}
            <div className="flex items-end justify-between gap-2 sm:gap-3 h-64 mb-6 px-2">
              {weeklyData.map((day, index) => {
                const height = (day.calories / maxCalories) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      {/* Tooltip */}
                      <div className="mb-2 text-center">
                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white h-5">
                          {day.calories > 0 ? day.calories : ''}
                        </p>
                      </div>
                      {/* Bar */}
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-500 rounded-t-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                        title={`${day.calories} calories`}
                      />
                    </div>
                    {/* Label */}
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-3 text-center whitespace-nowrap">
                      {dayLabels[index]}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Goal Line */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">🎯 2200 cal goal</p>
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">No data for the last 7 days</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Start logging meals to see trends</p>
          </div>
        )}
      </div>

      {/* Macro Breakdown Over Time */}
      {weeklyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein Chart */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl p-5 border border-red-200 dark:border-red-700/50 shadow-sm">
            <h4 className="font-bold text-red-800 dark:text-red-300 mb-4">🥩 Protein Trend</h4>
            <div className="flex items-end gap-1 h-32 bg-white/50 dark:bg-slate-800/50 rounded-xl p-2">
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-red-500 to-red-400 dark:from-red-600 dark:to-red-500 rounded-t transition-all hover:scale-105"
                  style={{
                    height: `${(day.protein / Math.max(...weeklyData.map(d => d.protein), 100)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.protein.toFixed(0)}g`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mt-3">Avg: {stats.avgProtein}g/day</p>
          </div>

          {/* Carbs Chart */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-700/50 shadow-sm">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-4">🍞 Carbs Trend</h4>
            <div className="flex items-end gap-1 h-32 bg-white/50 dark:bg-slate-800/50 rounded-xl p-2">
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500 rounded-t transition-all hover:scale-105"
                  style={{
                    height: `${(day.carbs / Math.max(...weeklyData.map(d => d.carbs), 100)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.carbs.toFixed(0)}g`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-3">Avg: {stats.avgCarbs}g/day</p>
          </div>

          {/* Fats Chart */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-700/50 shadow-sm">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-4">🥑 Fats Trend</h4>
            <div className="flex items-end gap-1 h-32 bg-white/50 dark:bg-slate-800/50 rounded-xl p-2">
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-yellow-500 to-yellow-400 dark:from-yellow-600 dark:to-yellow-500 rounded-t transition-all hover:scale-105"
                  style={{
                    height: `${(day.fats / Math.max(...weeklyData.map(d => d.fats), 100)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.fats.toFixed(0)}g`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mt-3">Avg: {stats.avgFats}g/day</p>
          </div>
        </div>
      )}
    </div>
  )
}
