import { useState, useEffect } from 'react'
import { nutritionApi } from '../../utils/api'
import { toast } from 'react-hot-toast'
import { 
  Plus, Trash2, Upload, Loader, BarChart3, TrendingUp, 
  Target, Clock, AlertCircle, CheckCircle2, Lightbulb, Calendar
} from 'lucide-react'
import MealConfirmationModal from './MealConfirmationModal'
import NutritionAnalytics from './NutritionAnalytics'

export default function NutritionTrackerEnhanced() {
  // State Management
  const [dailyData, setDailyData] = useState(null)
  const [weeklyData, setWeeklyData] = useState(null)
  const [mealPlan, setMealPlan] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  
  // Tabs
  const [activeTab, setActiveTab] = useState('today') // today, analytics, meal-plan
  const [inputTab, setInputTab] = useState('manual') // manual, scan
  
  // Form states
  const [foodName, setFoodName] = useState('')
  const [portionGrams, setPortionGrams] = useState(100)
  const [mealType, setMealType] = useState('lunch')
  const [notes, setNotes] = useState('')

  // Load data on mount
  useEffect(() => {
    loadTodayData()
    loadWeeklyData()
  }, [])

  const loadTodayData = async () => {
    try {
      setLoading(true)
      const response = await nutritionApi.getDailySummary()
      setDailyData(response.data)
    } catch (error) {
      console.error('Failed to load daily data:', error)
      toast.error('Failed to load nutrition data')
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklyData = async () => {
    try {
      const response = await nutritionApi.getLogs(7)
      setWeeklyData(response.data)
    } catch (error) {
      console.error('Failed to load weekly data:', error)
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

    try {
      const response = await nutritionApi.logFood({
        food_name: foodName,
        portion_grams: parseInt(portionGrams),
        meal_type: mealType,
        notes: notes || undefined
      })

      if (response.data.status === 'success') {
        toast.success(`${foodName} logged!`)
        setFoodName('')
        setPortionGrams(100)
        setNotes('')
        loadTodayData()
      }
    } catch (error) {
      console.error('Failed to log food:', error)
      toast.error(error.response?.data?.detail || 'Failed to log food')
    }
  }

  const deleteLog = async (logId) => {
    try {
      await nutritionApi.deleteLog(logId)
      toast.success('Meal removed')
      loadTodayData()
    } catch (error) {
      console.error('Failed to delete log:', error)
      toast.error('Failed to remove meal')
    }
  }

  const loadMealPlan = async () => {
    try {
      setLoading(true)
      const response = await nutritionApi.getMealPlan(7)
      setMealPlan(response.data)
    } catch (error) {
      console.error('Failed to load meal plan:', error)
      toast.error('Failed to load meal plan')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !dailyData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const goals = dailyData?.goals || {}
  const totals = dailyData?.totals || {}
  const remaining = dailyData?.remaining || {}
  const progress = dailyData?.progress || {}
  const recommendations = dailyData?.recommendations || {}

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      {showConfirmation && analysisResult && (
        <MealConfirmationModal 
          analysisResult={analysisResult}
          onConfirm={() => {
            setShowConfirmation(false)
            setAnalysisResult(null)
            loadTodayData()
          }}
          onCancel={() => {
            setShowConfirmation(false)
            setAnalysisResult(null)
          }}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-2xl">
        <h2 className="text-2xl lg:text-3xl font-bold mb-2">Nutrition Tracker</h2>
        <p className="text-green-100">AI-powered meal tracking with personalized recommendations</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white rounded-t-2xl -mb-px">
        {[
          { id: 'today', label: 'Today', icon: Clock },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'meal-plan', label: 'Meal Plan', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'meal-plan') loadMealPlan()
              }}
              className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* TODAY'S TRACKING */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Recommendations Banner */}
          {recommendations.status === 'under' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-blue-900">Under Your Goal</p>
                <p className="text-blue-800 text-sm">You have {remaining.calories?.toFixed(0) || 0} calories remaining</p>
              </div>
            </div>
          )}
          
          {recommendations.status === 'over' && (
            <div className="bg-sky-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-orange-900">Exceeded Goal</p>
                <p className="text-orange-800 text-sm">You've consumed {Math.abs(remaining.calories)?.toFixed(0) || 0} extra calories</p>
              </div>
            </div>
          )}

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calories Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-orange-900">Calories</h3>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-sky-600">{totals.calories?.toFixed(0) || 0}</span>
                <span className="text-sm text-orange-700">/ {goals.calories?.toFixed(0) || 2000}</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-3">
                <div
                  className="h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                  style={{ width: `${Math.min((progress.calories_percent || 0), 100)}%` }}
                />
              </div>
              <p className="text-xs text-orange-700 mt-2 font-medium">
                {progress.calories_percent?.toFixed(0) || 0}% of daily goal
              </p>
            </div>

            {/* Macros Summary Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">Macros</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Protein</span>
                  <span className="font-semibold text-purple-900">{totals.protein?.toFixed(0) || 0}g / {goals.protein?.toFixed(0) || 120}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Carbs</span>
                  <span className="font-semibold text-purple-900">{totals.carbs?.toFixed(0) || 0}g / {goals.carbs?.toFixed(0) || 250}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-700">Fats</span>
                  <span className="font-semibold text-purple-900">{totals.fats?.toFixed(0) || 0}g / {goals.fats?.toFixed(0) || 70}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Macros */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Macronutrient Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Protein */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-900">Protein</h4>
                  <span className="text-sm">🥩</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-2">{totals.protein?.toFixed(0) || 0}g</div>
                <div className="w-full bg-red-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                    style={{ width: `${Math.min((progress.protein_percent || 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-red-700">{progress.protein_percent?.toFixed(0) || 0}% of goal</p>
              </div>

              {/* Carbs */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-900">Carbs</h4>
                  <span className="text-sm">🍞</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-2">{totals.carbs?.toFixed(0) || 0}g</div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    style={{ width: `${Math.min((progress.carbs_percent || 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700">{progress.carbs_percent?.toFixed(0) || 0}% of goal</p>
              </div>

              {/* Fats */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-yellow-900">Fats</h4>
                  <span className="text-sm">🥑</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mb-2">{totals.fats?.toFixed(0) || 0}g</div>
                <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                  <div
                    className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"
                    style={{ width: `${Math.min((progress.fats_percent || 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-yellow-700">{progress.fats_percent?.toFixed(0) || 0}% of goal</p>
              </div>
            </div>
          </div>

          {/* Add Food Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Food</h3>
            
            {/* Input Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputTab('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputTab === 'manual'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setInputTab('scan')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputTab === 'scan'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
                }`}
              >
                Scan Photo
              </button>
            </div>

            {/* Manual Entry */}
            {inputTab === 'manual' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Food Name *</label>
                  <input
                    type="text"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g., Grilled Chicken, Brown Rice, Salad"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">Example: chicken breast, rice, eggs, milk, yogurt, etc.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Portion (grams)</label>
                    <input
                      type="number"
                      value={portionGrams}
                      onChange={(e) => setPortionGrams(e.target.value)}
                      min="1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Meal Type</label>
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                    >
                      <option value="breakfast">🌅 Breakfast</option>
                      <option value="lunch">🍽️ Lunch</option>
                      <option value="dinner">🍴 Dinner</option>
                      <option value="snack">🍎 Snack</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., cooked in olive oil, with sauce"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                  />
                </div>

                <button
                  onClick={addFoodItem}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Log Food
                </button>
              </div>
            )}

            {/* Photo Scan */}
            {inputTab === 'scan' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="breakfast">🌅 Breakfast</option>
                    <option value="lunch">🍽️ Lunch</option>
                    <option value="dinner">🍴 Dinner</option>
                    <option value="snack">🍎 Snack</option>
                  </select>
                </div>

                <label className="block border-2 border-dashed border-green-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={analyzing}
                    className="hidden"
                  />
                  {analyzing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader className="w-8 h-8 text-green-500 animate-spin" />
                      <p className="text-sm font-medium text-slate-700">Analyzing meal...</p>
                      <p className="text-xs text-slate-500">Using AI to identify foods</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">Click to upload meal photo</p>
                      <p className="text-xs text-slate-500">AI will analyze nutrition automatically</p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Today's Meals */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Meals ({dailyData?.meals?.length || 0})</h3>
            
            {!dailyData?.meals || dailyData.meals.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No meals logged yet</p>
                <p className="text-sm text-slate-400">Start by adding a food or scanning a meal photo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyData.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-green-300 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {meal.meal_type === 'breakfast' && '🌅'}
                          {meal.meal_type === 'lunch' && '🍽️'}
                          {meal.meal_type === 'dinner' && '🍴'}
                          {meal.meal_type === 'snack' && '🍎'}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{meal.food}</p>
                          <p className="text-sm text-slate-600">
                            {meal.portion_grams}g • {meal.meal_type}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <p className="font-bold text-gray-900">{meal.calories?.toFixed(0) || 0} cal</p>
                      {meal.nutrition && (
                        <p className="text-xs text-slate-600">
                          P: {meal.nutrition.protein?.toFixed(0)}g | C: {meal.nutrition.carbs?.toFixed(0)}g | F: {meal.nutrition.fats?.toFixed(0)}g
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteLog(meal.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                      title="Delete meal"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <NutritionAnalytics weeklyData={weeklyData} />
      )}

      {/* MEAL PLAN TAB */}
      {activeTab === 'meal-plan' && mealPlan && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Personalized Meal Prep Plan</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Daily Goals:</strong> {mealPlan.daily_goals?.calories?.toFixed(0) || 0} cal | 
              Protein: {mealPlan.daily_goals?.protein?.toFixed(0) || 0}g | 
              Carbs: {mealPlan.daily_goals?.carbs?.toFixed(0) || 0}g | 
              Fats: {mealPlan.daily_goals?.fats?.toFixed(0) || 0}g
            </p>
          </div>

          <div className="space-y-4">
            {mealPlan.plan?.map((dayPlan, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all">
                <h4 className="font-semibold text-gray-900 mb-3">Day {dayPlan.day}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(mealTime => {
                    const meal = dayPlan[mealTime]
                    return (
                      <div key={mealTime} className="bg-gray-50 rounded p-3 text-sm">
                        <p className="font-medium text-gray-900 capitalize mb-1">{mealTime}</p>
                        <p className="text-slate-700">{meal?.name}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {meal?.cal} cal | P: {meal?.protein}g C: {meal?.carbs}g F: {meal?.fats}g
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
