import { useState, useEffect } from 'react'
import { nutritionApi } from '../../utils/api'
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { toast } from 'react-hot-toast'

/**
 * Nutrition Analytics Dashboard
 * Shows trends, weekly patterns, and progress towards goals
 */
export default function NutritionAnalytics() {
  const { isDark } = useTheme()
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

      if (data.length > 0) {
        const avgCalories = Math.round(data.reduce((sum, d) => sum + d.calories, 0) / data.length)
        const avgProtein = Math.round(data.reduce((sum, d) => sum + d.protein, 0) / data.length * 10) / 10
        const avgCarbs = Math.round(data.reduce((sum, d) => sum + d.carbs, 0) / data.length * 10) / 10
        const avgFats = Math.round(data.reduce((sum, d) => sum + d.fats, 0) / data.length * 10) / 10

        let trend = 'stable'
        if (data.length >= 2) {
          const lastThree = data.slice(-3).map(d => d.calories)
          const avg = lastThree.reduce((a, b) => a + b, 0) / lastThree.length
          const lastCalories = lastThree[lastThree.length - 1]

          if (lastCalories > avg * 1.1) trend = 'increasing'
          else if (lastCalories < avg * 0.9) trend = 'decreasing'
        }

        setStats({ avgCalories, avgProtein, avgCarbs, avgFats, trend })
      }
    } catch (error) {
      console.error('Failed to fetch weekly data:', error)
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
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-sky-400' : 'border-green-500'}`} />
      </div>
    )
  }

  const maxCalories = weeklyData.length > 0
    ? Math.max(...weeklyData.map(d => d.calories), 2500)
    : 2500

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
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
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-orange-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>Avg Calories</h4>
            <span className="text-xl">🔥</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{stats.avgCalories}</p>
          <p className={`text-xs font-medium mt-2 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>per day</p>
        </div>

        {/* Avg Protein */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${isDark ? 'text-red-300' : 'text-red-600'}`}>Avg Protein</h4>
            <span className="text-xl">🥩</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats.avgProtein}g</p>
          <p className={`text-xs font-medium mt-2 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>per day</p>
        </div>

        {/* Avg Carbs */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>Avg Carbs</h4>
            <span className="text-xl">🍞</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{stats.avgCarbs}g</p>
          <p className={`text-xs font-medium mt-2 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>per day</p>
        </div>

        {/* Avg Fats */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-yellow-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-xs font-bold uppercase tracking-wide transition-colors duration-300 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>Avg Fats</h4>
            <span className="text-xl">🥑</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold transition-colors duration-300 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.avgFats}g</p>
          <p className={`text-xs font-medium mt-2 transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>per day</p>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 shadow-sm ${stats.trend === 'increasing' ? (isDark ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100') :
          stats.trend === 'decreasing' ? (isDark ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-100') :
            (isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')
        }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>📈 Calorie Trend</h4>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {stats.trend === 'increasing' && '⬆️ Your daily calories are increasing'}
              {stats.trend === 'decreasing' && '⬇️ Your daily calories are decreasing'}
              {stats.trend === 'stable' && '➡️ Your calorie intake is stable'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${stats.trend === 'increasing' ? (isDark ? 'bg-orange-500/20' : 'bg-orange-100') :
              stats.trend === 'decreasing' ? (isDark ? 'bg-green-500/20' : 'bg-green-100') :
                (isDark ? 'bg-slate-800' : 'bg-slate-200')
            }`}>
            {stats.trend === 'increasing' && <TrendingUp className={`w-8 h-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />}
            {stats.trend === 'decreasing' && <TrendingDown className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />}
            {stats.trend === 'stable' && <Target className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className={`rounded-2xl p-5 sm:p-6 border transition-all duration-300 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h4 className={`font-bold mb-6 text-lg transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>📅 Daily Calories (7 Days)</h4>

        {weeklyData.length > 0 ? (
          <div>
            <div className="flex items-end justify-between gap-2 sm:gap-3 h-64 mb-6 px-2">
              {weeklyData.map((day, index) => {
                const height = (day.calories / maxCalories) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      <div className="mb-2 text-center">
                        <p className={`text-xs sm:text-sm font-bold h-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {day.calories > 0 ? day.calories : ''}
                        </p>
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-sky-500 to-indigo-400 dark:from-sky-600 dark:to-indigo-500 rounded-t-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                        style={{ height: `${height}%`, minHeight: height > 0 ? '8px' : '0' }}
                        title={`${day.calories} calories`}
                      />
                    </div>
                    <p className={`text-xs font-medium mt-3 text-center whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {dayLabels[index]}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className={`flex items-center gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              <p className={`text-xs font-semibold px-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>🎯 Target: 2200 kcal</p>
              <div className={`flex-1 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <Calendar className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No data for the last 7 days</p>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Start logging meals to see trends</p>
          </div>
        )}
      </div>

      {/* Macro Breakdown Over Time */}
      {weeklyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein Chart */}
          <div className={`rounded-2xl p-5 border transition-all duration-300 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-red-100'}`}>
            <h4 className={`font-bold mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>🥩 Protein Trend</h4>
            <div className={`flex items-end gap-1 h-32 rounded-xl p-2 ${isDark ? 'bg-slate-800/50' : 'bg-red-50/50'}`}>
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all hover:scale-105"
                  style={{
                    height: `${(day.protein / Math.max(...weeklyData.map(d => d.protein), 100)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.protein.toFixed(0)}g`}
                />
              ))}
            </div>
            <p className={`text-sm font-semibold mt-3 ${isDark ? 'text-red-400/80' : 'text-red-500'}`}>Avg: {stats.avgProtein}g/day</p>
          </div>

          {/* Carbs Chart */}
          <div className={`rounded-2xl p-5 border transition-all duration-300 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-amber-100'}`}>
            <h4 className={`font-bold mb-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>🍞 Carbs Trend</h4>
            <div className={`flex items-end gap-1 h-32 rounded-xl p-2 ${isDark ? 'bg-slate-800/50' : 'bg-amber-50/50'}`}>
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t transition-all hover:scale-105"
                  style={{
                    height: `${(day.carbs / Math.max(...weeklyData.map(d => d.carbs), 100)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.carbs.toFixed(0)}g`}
                />
              ))}
            </div>
            <p className={`text-sm font-semibold mt-3 ${isDark ? 'text-amber-400/80' : 'text-amber-500'}`}>Avg: {stats.avgCarbs}g/day</p>
          </div>

          {/* Fats Chart */}
          <div className={`rounded-2xl p-5 border transition-all duration-300 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-yellow-100'}`}>
            <h4 className={`font-bold mb-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>🥑 Fats Trend</h4>
            <div className={`flex items-end gap-1 h-32 rounded-xl p-2 ${isDark ? 'bg-slate-800/50' : 'bg-yellow-50/50'}`}>
              {weeklyData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t transition-all hover:scale-105"
                  style={{
                    height: `${(day.fats / Math.max(...weeklyData.map(d => d.fats), 100)) * 100}%`,
                    minHeight: '4px'
                  }}
                  title={`${day.fats.toFixed(0)}g`}
                />
              ))}
            </div>
            <p className={`text-sm font-semibold mt-3 ${isDark ? 'text-yellow-400/80' : 'text-yellow-500'}`}>Avg: {stats.avgFats}g/day</p>
          </div>
        </div>
      )}
    </div>
  )
}
