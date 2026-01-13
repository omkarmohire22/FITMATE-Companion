import { useState, useEffect } from 'react'
import { nutritionApi } from '../../utils/api'
import { toast } from 'react-hot-toast'
import { Plus, Trash2, Upload, Loader, BarChart3 } from 'lucide-react'
import MealConfirmationModal from './MealConfirmationModal'
import NutritionAnalytics from './NutritionAnalytics'

export default function NutritionTracker() {
  const [dailyLogs, setDailyLogs] = useState([])
  const [totalCalories, setTotalCalories] = useState(0)
  const [totalProtein, setTotalProtein] = useState(0)
  const [totalCarbs, setTotalCarbs] = useState(0)
  const [totalFats, setTotalFats] = useState(0)
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 70
  })
  const [waterIntake, setWaterIntake] = useState(0)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  
  // Form states
  const [foodName, setFoodName] = useState('')
  const [portionGrams, setPortionGrams] = useState(100)
  const [mealType, setMealType] = useState('lunch')
  const [mealTime, setMealTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
  const [mealNotes, setMealNotes] = useState('')
  const [activeTab, setActiveTab] = useState('manual')
  const [activeTrackerTab, setActiveTrackerTab] = useState('today')

  // Fetch daily summary on mount
  useEffect(() => {
    fetchDailySummary()
  }, [])

  const fetchDailySummary = async () => {
    try {
      setLoading(true)
      const response = await nutritionApi.getDailySummary()
      
      // Handle both 'logs' and 'meals' field names from different backend endpoints
      const logs = response.data.logs || response.data.meals || []
      setDailyLogs(logs)

      // Calculate totals
      let calories = 0
      let protein = 0
      let carbs = 0
      let fats = 0

      logs.forEach(log => {
        calories += log.calories || 0
        if (log.macros) {
          protein += log.macros.protein || 0
          carbs += log.macros.carbs || 0
          fats += log.macros.fats || 0
        }
      })

      setTotalCalories(calories)
      setTotalProtein(protein)
      setTotalCarbs(carbs)
      setTotalFats(fats)
      setWaterIntake(response.data.water_intake || 0)

      // Set personalized goals if available
      if (response.data.goals) {
        setDailyGoals(response.data.goals)
      }
    } catch (error) {
      console.error('Failed to fetch daily summary:', error)
      toast.error('Failed to load nutrition data')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setAnalyzing(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await nutritionApi.analyzeMeal(formData)
      
      // Show confirmation modal with analysis results
      if (response.data.status === 'success') {
        setAnalysisResult(response.data)
        setShowConfirmation(true)
      } else {
        toast.error(response.data.message || 'Failed to analyze meal')
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error('Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const addFoodItem = async () => {
    if (!foodName.trim()) {
      toast.error('Please enter a food name')
      return
    }

    if (!portionGrams || portionGrams <= 0) {
      toast.error('Please enter a valid portion size')
      return
    }

    try {
      const response = await nutritionApi.logFood({
        food_name: foodName,
        portion_grams: parseInt(portionGrams),
        meal_type: mealType,
        meal_time: mealTime,
        notes: mealNotes
      })

      if (response.data.success || response.data.status === 'success') {
        toast.success(`${foodName} logged to ${mealType}!`)
        // Reset form
        setFoodName('')
        setPortionGrams(100)
        setMealTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
        setMealNotes('')
        fetchDailySummary()
      }
    } catch (error) {
      console.error('Failed to log food:', error)
      toast.error(error.response?.data?.detail || 'Failed to log food item')
    }
  }

  const deleteLog = async (logId) => {
    try {
      await nutritionApi.deleteLog(logId)
      toast.success('Meal removed')
      fetchDailySummary()
    } catch (error) {
      console.error('Failed to delete log:', error)
      toast.error('Failed to remove meal')
    }
  }

  const addWater = async () => {
    try {
      // Log water as a special food item
      await nutritionApi.logFood({
        food_name: 'Water',
        portion_grams: 250,
        meal_type: 'water'
      })
      setWaterIntake(waterIntake + 1)
      toast.success('Water logged!')
      fetchDailySummary()
    } catch (error) {
      console.error('Failed to log water:', error)
      toast.error('Failed to log water')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const caloriesRemaining = dailyGoals.calories - totalCalories
  const proteinRemaining = dailyGoals.protein - totalProtein
  const carbsRemaining = dailyGoals.carbs - totalCarbs
  const fatsRemaining = dailyGoals.fats - totalFats

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {showConfirmation && analysisResult && (
        <MealConfirmationModal 
          analysisResult={analysisResult}
          onConfirm={() => {
            setShowConfirmation(false)
            setAnalysisResult(null)
            fetchDailySummary()
          }}
          onCancel={() => {
            setShowConfirmation(false)
            setAnalysisResult(null)
          }}
        />
      )}
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <h2 className="text-2xl lg:text-3xl font-bold mb-2">🍽️ Nutrition Tracker</h2>
        <p className="text-green-100 text-sm sm:text-base">Track your meals and macros with AI-powered food detection</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-2xl -mb-px shadow-sm">
        <button
          onClick={() => setActiveTrackerTab('today')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base border-b-2 transition-colors ${
            activeTrackerTab === 'today'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          📅 Today
        </button>
        <button
          onClick={() => setActiveTrackerTab('analytics')}
          className={`px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base border-b-2 transition-colors flex items-center gap-2 ${
            activeTrackerTab === 'analytics'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          Analytics
        </button>
      </div>

      {/* Stats Cards */}
      {activeTrackerTab === 'today' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Calories Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-2xl p-5 sm:p-6 border border-orange-200 dark:border-orange-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide">Calories</h3>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400">{totalCalories}</span>
                <span className="text-sm text-orange-700 dark:text-sky-400/80">/ {dailyGoals.calories}</span>
              </div>
              <div className="w-full bg-orange-200 dark:bg-orange-900/50 rounded-full h-3">
                <div
                  className="h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                  style={{ width: `${Math.min((totalCalories / dailyGoals.calories) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm font-medium text-orange-700 dark:text-sky-400 mt-3">
                {caloriesRemaining > 0 ? `${caloriesRemaining} remaining` : `${Math.abs(caloriesRemaining)} over goal`}
              </p>
            </div>

            {/* Water Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl p-5 sm:p-6 border border-blue-200 dark:border-blue-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Water</h3>
                <span className="text-2xl">💧</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">{waterIntake}</span>
                <span className="text-sm text-blue-700 dark:text-blue-400/80">/ 8 cups</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3">
                <div
                  className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min((waterIntake / 8) * 100, 100)}%` }}
                />
              </div>
              <button
                onClick={addWater}
                className="w-full mt-3 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow transition-all"
              >
                + Add Cup
              </button>
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-2xl p-5 sm:p-6 border border-purple-200 dark:border-purple-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">Daily Progress</h3>
                <span className="text-2xl">📊</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {((totalCalories / dailyGoals.calories) * 100).toFixed(0)}%
                </span>
                <span className="text-sm text-purple-700 dark:text-purple-400/80">of daily goal</span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/50 rounded-full h-3">
                <div
                  className="h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                  style={{ width: `${Math.min((totalCalories / dailyGoals.calories) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400 mt-3">
                {totalCalories < dailyGoals.calories ? '📉 Under goal - Keep eating!' : '📈 Goal reached! 🎉'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Macros Breakdown */}
      {activeTrackerTab === 'today' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Macronutrients</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Protein */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-red-800 dark:text-red-300">Protein</h4>
                <span className="text-lg">🥩</span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{totalProtein.toFixed(0)}</span>
                <span className="text-sm text-red-700 dark:text-red-400/80">/ {dailyGoals.protein}g</span>
              </div>
              <div className="w-full bg-red-200 dark:bg-red-900/50 rounded-full h-2.5">
                <div
                  className="h-2.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                  style={{ width: `${Math.min((totalProtein / dailyGoals.protein) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-amber-800 dark:text-amber-300">Carbs</h4>
                <span className="text-lg">🍞</span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalCarbs.toFixed(0)}</span>
                <span className="text-sm text-amber-700 dark:text-amber-400/80">/ {dailyGoals.carbs}g</span>
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-900/50 rounded-full h-2.5">
                <div
                  className="h-2.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
                  style={{ width: `${Math.min((totalCarbs / dailyGoals.carbs) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Fats */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-700/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-yellow-800 dark:text-yellow-300">Fats</h4>
                <span className="text-lg">🥑</span>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalFats.toFixed(0)}</span>
                <span className="text-sm text-yellow-700 dark:text-yellow-400/80">/ {dailyGoals.fats}g</span>
              </div>
              <div className="w-full bg-yellow-200 dark:bg-yellow-900/50 rounded-full h-2.5">
                <div
                  className="h-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all"
                  style={{ width: `${Math.min((totalFats / dailyGoals.fats) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Food Section */}
      {activeTrackerTab === 'today' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">➕ Add Food</h3>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'manual'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ✏️ Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'scan'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📷 Scan Food
            </button>
          </div>

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none transition-all text-base"
                >
                  <option value="breakfast">🌅 Breakfast</option>
                  <option value="lunch">🍽️ Lunch</option>
                  <option value="dinner">🍴 Dinner</option>
                  <option value="snack">🍎 Snack</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time</label>
                <input
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none transition-all text-base"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Food Name</label>
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Chicken Breast, Brown Rice"
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none transition-all text-base"
                onKeyPress={(e) => e.key === 'Enter' && addFoodItem()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Portion (g)</label>
                <input
                  type="number"
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(e.target.value)}
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none transition-all text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Portions</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPortionGrams(50)}
                    className="flex-1 px-3 py-3 text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 rounded-xl transition-all"
                  >
                    50g
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortionGrams(100)}
                    className="flex-1 px-3 py-3 text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 rounded-xl transition-all"
                  >
                    100g
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortionGrams(200)}
                    className="flex-1 px-3 py-3 text-sm font-semibold bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 rounded-xl transition-all"
                  >
                    200g
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</label>
              <input
                type="text"
                value={mealNotes}
                onChange={(e) => setMealNotes(e.target.value)}
                placeholder="e.g., Grilled, No sauce"
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none transition-all text-base"
              />
            </div>

            <button
              onClick={addFoodItem}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Log Food
            </button>
          </div>
        )}

        {/* Scan Food Tab */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-800 outline-none transition-all text-base"
              >
                <option value="breakfast">🌅 Breakfast</option>
                <option value="lunch">🍽️ Lunch</option>
                <option value="dinner">🍴 Dinner</option>
                <option value="snack">🍎 Snack</option>
              </select>
            </div>

            <label className="block border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={analyzing}
                className="hidden"
              />
              {analyzing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-10 h-10 text-green-500 animate-spin" />
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Analyzing image...</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">AI is identifying your meal</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Click to upload meal photo</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">or drag and drop</p>
                </div>
              )}
            </label>
          </div>
        )}
        </div>
      )}

      {/* Today's Meals */}
      {activeTrackerTab === 'today' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
            <span>📋 Today's Meals</span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </h3>
        
        {dailyLogs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🍽️</span>
            </div>
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">No meals logged yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Start by adding a food or scanning a meal photo</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group meals by meal type */}
            {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
              const mealsOfType = dailyLogs.filter(log => {
                const mealType = log.meal_type || log.macros?.meal_type
                return mealType === type
              })
              if (mealsOfType.length === 0) return null
              
              const typeEmoji = type === 'breakfast' ? '🌅' : type === 'lunch' ? '🍽️' : type === 'dinner' ? '🍴' : '🍎'
              const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
              const typeBg = type === 'breakfast' ? 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50' 
                           : type === 'lunch' ? 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800/50'
                           : type === 'dinner' ? 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800/50'
                           : 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50'
              
              return (
                <div key={type} className={`bg-gradient-to-br ${typeBg} rounded-2xl p-4 border`}>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3 uppercase tracking-wide">
                    <span className="text-lg">{typeEmoji}</span>
                    <span>{typeLabel}</span>
                    <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                      {mealsOfType.length} item{mealsOfType.length > 1 ? 's' : ''}
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {mealsOfType.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200/50 dark:border-slate-700/50 hover:shadow-md transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{log.food || log.item}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <span className="font-medium">{log.portion_grams || log.macros?.portion_grams || '--'}g</span>
                            {(log.meal_time || log.macros?.meal_time) && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span>{log.meal_time || log.macros?.meal_time}</span>
                              </>
                            )}
                          </div>
                          {(log.notes || log.macros?.notes) && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 italic">💬 {log.notes || log.macros?.notes}</p>
                          )}
                        </div>
                        <div className="text-right mx-3 flex-shrink-0">
                          <p className="font-bold text-gray-900 dark:text-white text-lg">{log.calories?.toFixed(0) || 0}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">cal</p>
                          {(log.macros || log.nutrition) && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              P:{((log.macros || log.nutrition)?.protein)?.toFixed(0) || 0} C:{((log.macros || log.nutrition)?.carbs)?.toFixed(0) || 0} F:{((log.macros || log.nutrition)?.fats)?.toFixed(0) || 0}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500 flex-shrink-0"
                          title="Delete meal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTrackerTab === 'analytics' && (
        <NutritionAnalytics />
      )}
    </div>
  )
}
