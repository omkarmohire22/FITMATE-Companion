import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell
} from 'recharts'
import {
  TrendingUp, TrendingDown, Target, Calendar, Scale, Activity, Award,
  Flame, Zap, Heart, Camera, Upload, Download, RefreshCw, Plus, X,
  ChevronDown, ChevronUp, Clock, Check, AlertCircle, Info, Star,
  ArrowRight, BarChart3, PieChart as PieChartIcon, Trophy, Medal,
  Ruler, Percent, Calculator, Eye, EyeOff, Share2, Printer, FileText,
  ChevronLeft, ChevronRight, Sparkles, Dumbbell, Apple, Moon, Sun
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { traineeApi } from '../../utils/api'
import toast from 'react-hot-toast'

const EnhancedProgressTracker = () => {
  // State Management
  const [measurements, setMeasurements] = useState([])
  const [userProfile, setUserProfile] = useState(null) // Store user data for accurate calculations
  const [goals, setGoals] = useState({
    targetWeight: null,
    targetBodyFat: null,
    targetDate: '',
    fitnessGoal: 'weight_loss' // weight_loss, muscle_gain, maintenance
  })
  const [loading, setLoading] = useState(true)
  const [submittingGoal, setSubmittingGoal] = useState(false)
  const [activeView, setActiveView] = useState('overview') // overview, measurements, goals, photos, reports
  const [showAddForm, setShowAddForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [timeRange, setTimeRange] = useState('30') // 7, 30, 90, 365, all
  const [chartType, setChartType] = useState('area') // area, line, bar
  const [compareMode, setCompareMode] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('weight')
  const [progressPhotos, setProgressPhotos] = useState([])
  const [streak, setStreak] = useState({ current: 0, best: 0, lastCheckIn: null })
  const [report, setReport] = useState(null)
  const [workoutStats, setWorkoutStats] = useState(null)
  const [goalStats, setGoalStats] = useState(null) // Track goal-related stats
  
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: '',
    calves: '',
    neck: '',
    shoulders: '',
    notes: '',
    mood: 'good',
    sleep_quality: 'good',
    energy_level: 7,
    // New practical fields
    measurement_date: new Date().toISOString().split('T')[0],
    measurement_time: 'morning',
    workout_today: false,
    workout_type: 'strength',
    workout_duration: '',
    workout_intensity: 'moderate',
    water_intake: '',
    sleep_hours: ''
  })

  const [goalFormData, setGoalFormData] = useState({
    targetWeight: '',
    targetBodyFat: '',
    targetDate: '',
    fitnessGoal: 'weight_loss'
  })

  // Load data on mount
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadUserProfile(),
        loadProgress(),
        loadGoals(),
        loadReport(),
        loadWorkoutStats()
      ])
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const response = await traineeApi.getProfile()
      const profile = response.data || response
      setUserProfile({
        height: profile.height || 170,
        weight: profile.weight || profile.current_weight,
        age: profile.age || 25,
        gender: profile.gender || 'male',
        activityLevel: profile.activity_level || 'moderate',
        fitnessLevel: profile.fitness_level || 'intermediate',
        targetWeight: profile.target_weight,
        currentWeight: profile.weight || profile.current_weight
      })
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Set defaults if profile fails
      setUserProfile({
        height: 170,
        weight: 70,
        age: 25,
        gender: 'male',
        activityLevel: 'moderate',
        fitnessLevel: 'intermediate',
        targetWeight: null,
        currentWeight: 70
      })
    }
  }

  const loadProgress = async () => {
    try {
      const response = await traineeApi.getProgress()
      const data = (response.data?.measurements || [])
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((m) => ({
          id: m.id,
          date: m.date,
          dateFormatted: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: m.weight,
          bodyFat: m.body_fat,
          muscleMass: m.muscle_mass,
          waist: m.waist,
          chest: m.chest,
          hips: m.hips,
          biceps: m.biceps,
          notes: m.notes
        }))
      setMeasurements(data)
      calculateStreak(data)
      // Initialize goal form data from latest measurement or profile
      if (data.length > 0) {
        const latest = data[data.length - 1]
        setGoalFormData(prev => ({
          ...prev,
          targetWeight: prev.targetWeight || goals.targetWeight || (latest.weight ? (latest.weight - 5) : '')
        }))
      }
    } catch (error) {
      console.error('Error loading progress:', error)
      toast.error('Failed to load measurements')
    }
  }

  const loadGoals = async () => {
    try {
      const response = await traineeApi.getGoals?.()
      if (response?.data) {
        setGoals(response.data)
        setGoalFormData(response.data)
      }
    } catch (error) {
      console.error('Error loading goals:', error)
      // Goals optional - don't show error
    }
  }

  const loadReport = async () => {
    try {
      const response = await traineeApi.getProgressReport?.()
      if (response?.data) {
        setReport(response.data)
      }
    } catch (error) {
      console.error('Error loading report:', error)
    }
  }

  const loadWorkoutStats = async () => {
    try {
      const response = await traineeApi.getDashboard()
      setWorkoutStats(response.data)
    } catch (error) {
      console.error('Error loading workout stats:', error)
    }
  }

  const calculateStreak = (data) => {
    if (!data.length) {
      setStreak({ current: 0, best: 0, lastCheckIn: null })
      return
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 1
    
    // Sort by date descending to check from most recent
    const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
    
    // Weekly streak logic (more practical than daily)
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000
    const GRACE_DAYS = 3 // Allow 3 days grace for weekly check-ins
    
    // Check if latest measurement is within last week + grace period
    const latestDate = new Date(sorted[0].date)
    latestDate.setHours(0, 0, 0, 0)
    const daysSinceLastCheckIn = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastCheckIn <= 7 + GRACE_DAYS) {
      currentStreak = 1
      
      // Count consecutive weeks
      for (let i = 1; i < sorted.length; i++) {
        const prevDate = new Date(sorted[i - 1].date)
        prevDate.setHours(0, 0, 0, 0)
        const currDate = new Date(sorted[i].date)
        currDate.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24))
        
        // If measurements are 3-17 days apart, count as consecutive weeks
        if (daysDiff >= 3 && daysDiff <= 17) {
          currentStreak++
        } else if (daysDiff > 17) {
          break // Streak broken
        }
      }
    }
    
    // Calculate best streak
    tempStreak = 1
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1].date)
      prevDate.setHours(0, 0, 0, 0)
      const currDate = new Date(sorted[i].date)
      currDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff >= 3 && daysDiff <= 17) {
        tempStreak++
      } else if (daysDiff > 17) {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 1
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak, currentStreak)
    
    setStreak({ 
      current: currentStreak, 
      best: bestStreak, 
      lastCheckIn: sorted[0]?.date || null 
    })
  }

  const addMeasurement = async () => {
    // Validate required field
    if (!formData.weight || formData.weight === '') {
      toast.error('Weight is required')
      return
    }

    // Validate reasonable ranges
    const weight = parseFloat(formData.weight)
    if (weight < 20 || weight > 300) {
      toast.error('Weight must be between 20 and 300 kg')
      return
    }

    try {
      await traineeApi.addMeasurement({
        weight: weight,
        body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        biceps: formData.biceps ? parseFloat(formData.biceps) : null,
        thighs: formData.thighs ? parseFloat(formData.thighs) : null,
        calves: formData.calves ? parseFloat(formData.calves) : null,
        neck: formData.neck ? parseFloat(formData.neck) : null,
        shoulders: formData.shoulders ? parseFloat(formData.shoulders) : null,
        notes: formData.notes || null,
        mood: formData.mood,
        sleep_quality: formData.sleep_quality,
          energy_level: parseInt(formData.energy_level) || 5,
          // New practical fields
          measurement_date: formData.measurement_date,
          measurement_time: formData.measurement_time,
          workout_today: formData.workout_today,
          workout_type: formData.workout_today ? formData.workout_type : null,
          workout_duration: formData.workout_today ? parseInt(formData.workout_duration) || null : null,
          workout_intensity: formData.workout_today ? formData.workout_intensity : null,
          water_intake: formData.water_intake ? parseFloat(formData.water_intake) : null,
          sleep_hours: formData.sleep_hours ? parseFloat(formData.sleep_hours) : null
      })

      toast.success('Measurement logged successfully! 🎉')
      
      // Reset form properly
      setFormData({
        weight: '', body_fat: '', muscle_mass: '', chest: '', waist: '',
        hips: '', biceps: '', thighs: '', calves: '', neck: '', shoulders: '',
        notes: '', mood: 'good', sleep_quality: 'good', energy_level: 7,
        measurement_date: new Date().toISOString().split('T')[0],
        measurement_time: 'morning',
        workout_today: false,
        workout_type: 'strength',
        workout_duration: '',
        workout_intensity: 'moderate',
        water_intake: '',
        sleep_hours: ''
      })
      
      setShowAddForm(false)
      
      // Reload data
      await loadProgress()
    } catch (error) {
      console.error('Error adding measurement:', error)
      toast.error(error.response?.data?.message || 'Failed to add measurement')
    }
  }

  const saveGoals = async () => {
    if (!goalFormData.targetWeight) {
      toast.error('Please set a target weight')
      return
    }

    const targetWeight = parseFloat(goalFormData.targetWeight)
    if (targetWeight < 20 || targetWeight > 300) {
      toast.error('Target weight must be between 20 and 300 kg')
      return
    }

    setSubmittingGoal(true)
    try {
      // If API endpoint exists, use it; otherwise update local state
      if (traineeApi.saveGoals) {
        await traineeApi.saveGoals({
          targetWeight: targetWeight,
          targetBodyFat: goalFormData.targetBodyFat ? parseFloat(goalFormData.targetBodyFat) : null,
          targetDate: goalFormData.targetDate || null,
          fitnessGoal: goalFormData.fitnessGoal
        })
      }

      setGoals({
        targetWeight: targetWeight,
        targetBodyFat: goalFormData.targetBodyFat ? parseFloat(goalFormData.targetBodyFat) : null,
        targetDate: goalFormData.targetDate || '',
        fitnessGoal: goalFormData.fitnessGoal
      })

      toast.success('Goals saved successfully!')
      setShowGoalForm(false)
    } catch (error) {
      console.error('Error saving goals:', error)
      toast.error(error.response?.data?.message || 'Failed to save goals')
    } finally {
      setSubmittingGoal(false)
    }
  }

  const copyLastMeasurement = () => {
    if (measurements.length > 0) {
      const last = measurements[measurements.length - 1]
      setFormData(prev => ({
        ...prev,
        weight: last.weight?.toString() || '',
        body_fat: last.bodyFat?.toString() || '',
        muscle_mass: last.muscleMass?.toString() || '',
        chest: last.chest?.toString() || '',
        waist: last.waist?.toString() || '',
        hips: last.hips?.toString() || '',
        biceps: last.biceps?.toString() || '',
        thighs: last.thighs?.toString() || '',
        calves: last.calves?.toString() || '',
        neck: last.neck?.toString() || '',
        shoulders: last.shoulders?.toString() || '',
        // Don't copy date/time - use today
        measurement_date: new Date().toISOString().split('T')[0],
        measurement_time: 'morning'
      }))
      toast.success('Copied previous measurement!')
    }
  }

  // Calculations with user profile data
  const getFilteredData = () => {
    if (timeRange === 'all') return measurements
    const days = parseInt(timeRange)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return measurements.filter(m => new Date(m.date) >= cutoff)
  }

  const calculateBMI = (weight, heightCm = null) => {
    const height = heightCm || userProfile?.height || 170
    const heightM = height / 100
    if (weight <= 0 || height <= 0) return null
    return (weight / (heightM * heightM)).toFixed(1)
  }

  const calculateBMR = (weight, heightCm = null, age = null, gender = null) => {
    const h = heightCm || userProfile?.height || 170
    const a = age || userProfile?.age || 25
    const g = gender || userProfile?.gender || 'male'
    
    if (weight <= 0 || h <= 0 || a <= 0) return null
    
    // Mifflin-St Jeor Equation
    if (g.toLowerCase() === 'male' || g === 'M') {
      return Math.round(10 * weight + 6.25 * h - 5 * a + 5)
    }
    return Math.round(10 * weight + 6.25 * h - 5 * a - 161)
  }

  const calculateTDEE = (bmr, activityLevel = null) => {
    const level = activityLevel || userProfile?.activityLevel || 'moderate'
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
      'very_active': 1.9
    }
    return Math.round(bmr * (multipliers[level] || 1.55))
  }

  const getProgressPercentage = () => {
    if (measurements.length < 1 || !goals.targetWeight) return 0
    
    const first = measurements[0]
    const last = measurements[measurements.length - 1]
    const target = goals.targetWeight
    
    if (!first.weight || !last.weight) return 0
    
    // Determine goal direction
    const isWeightLoss = first.weight > target
    const isWeightGain = first.weight < target
    
    if (isWeightLoss) {
      // Weight loss goal
      const totalToLose = first.weight - target
      if (totalToLose <= 0) return 100
      
      const actualLost = first.weight - last.weight
      const progress = (actualLost / totalToLose) * 100
      return Math.min(100, Math.max(0, Math.round(progress)))
    } else if (isWeightGain) {
      // Weight gain goal
      const totalToGain = target - first.weight
      if (totalToGain <= 0) return 100
      
      const actualGained = last.weight - first.weight
      const progress = (actualGained / totalToGain) * 100
      return Math.min(100, Math.max(0, Math.round(progress)))
    } else {
      // Already at target or maintenance
      return 100
    }
  }

  const getPredictedGoalDate = () => {
    if (measurements.length < 2 || !goals.targetWeight) return null
    
    const data = getFilteredData()
    if (data.length < 2) return null
    
    const first = data[0]
    const last = data[data.length - 1]
    
    if (!first.weight || !last.weight) return null
    
    const daysDiff = Math.abs(new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)
    if (daysDiff === 0) return null // Same day data
    
    const weightChange = last.weight - first.weight
    const dailyRate = weightChange / daysDiff
    
    // Determine goal direction
    const isWeightLoss = first.weight > goals.targetWeight
    const remaining = goals.targetWeight - last.weight
    
    // Check if making progress in right direction
    if (isWeightLoss && dailyRate >= 0) return null // Not losing weight
    if (!isWeightLoss && dailyRate <= 0) return null // Not gaining weight
    
    // If already at or past goal
    if ((isWeightLoss && remaining >= 0) || (!isWeightLoss && remaining <= 0)) {
      return new Date() // Already achieved
    }
    
    const daysNeeded = Math.abs(remaining / dailyRate)
    
    // Reasonable prediction only if within 2 years (more realistic)
    if (daysNeeded > 730) return null
    
    const predictedDate = new Date()
    predictedDate.setDate(predictedDate.getDate() + Math.round(daysNeeded))
    
    return predictedDate
  }

  const latestMeasurement = measurements[measurements.length - 1]
  const firstMeasurement = measurements[0]
  const filteredData = getFilteredData()
  const progressPercent = getProgressPercentage()
  const predictedDate = getPredictedGoalDate()
  const bmi = latestMeasurement?.weight ? calculateBMI(latestMeasurement.weight) : null
  const bmr = latestMeasurement?.weight ? calculateBMR(latestMeasurement.weight) : null
  const tdee = bmr ? calculateTDEE(bmr) : null

  // BMI Category
  const getBMICategory = (bmi) => {
    if (!bmi) return { label: '--', color: 'gray' }
    const value = parseFloat(bmi)
    if (value < 18.5) return { label: 'Underweight', color: 'blue' }
    if (value < 25) return { label: 'Normal', color: 'green' }
    if (value < 30) return { label: 'Overweight', color: 'yellow' }
    return { label: 'Obese', color: 'red' }
  }

  const bmiCategory = getBMICategory(bmi)

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Radar data for body measurements - only include non-zero values
  const radarData = latestMeasurement ? [
    latestMeasurement.chest && { metric: 'Chest', value: latestMeasurement.chest, fullMark: 120 },
    latestMeasurement.waist && { metric: 'Waist', value: latestMeasurement.waist, fullMark: 100 },
    latestMeasurement.hips && { metric: 'Hips', value: latestMeasurement.hips, fullMark: 120 },
    latestMeasurement.biceps && { metric: 'Biceps', value: latestMeasurement.biceps, fullMark: 50 },
  ].filter(Boolean) : []

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              📈 Progress Tracker
            </h1>
            <p className="text-orange-100 mt-1 text-sm sm:text-base">Track your fitness journey with detailed analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-sky-600 rounded-xl font-bold text-sm hover:bg-sky-50 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Log Progress
            </button>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Streak Display */}
        <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Flame className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-lg">{streak.current}</span>
            <span className="text-orange-100 text-sm">week streak</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <Trophy className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-lg">{streak.best}</span>
            <span className="text-orange-100 text-sm">best streak</span>
          </div>
          {streak.lastCheckIn && (
            <div className="flex items-center gap-2 text-orange-100 text-sm">
              <Clock className="w-4 h-4" />
              Last: {new Date(streak.lastCheckIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
          {/* Check-in Reminder */}
          {streak.lastCheckIn && (() => {
            const daysSince = Math.floor((new Date() - new Date(streak.lastCheckIn)) / (1000 * 60 * 60 * 24))
            if (daysSince >= 7) {
              return (
                <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 rounded-xl px-4 py-2 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-bold">Time for weekly check-in!</span>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'measurements', label: 'Measurements', icon: Ruler },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'body', label: 'Body Stats', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeView === tab.id
                ? 'bg-sky-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <Scale className="w-8 h-8 text-blue-200" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Current</span>
              </div>
              <p className="text-3xl font-bold">{latestMeasurement?.weight || '--'}</p>
              <p className="text-blue-100 text-sm">kg weight</p>
              <div className="mt-2 space-y-1">
                {measurements.length > 1 && latestMeasurement && firstMeasurement && (
                  <div className={`flex items-center gap-1 text-sm ${
                    latestMeasurement.weight < firstMeasurement.weight ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {latestMeasurement.weight < firstMeasurement.weight ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {Math.abs(latestMeasurement.weight - firstMeasurement.weight).toFixed(1)} kg change
                  </div>
                )}
                {bmi && (
                  <div className="text-xs text-blue-200">
                    BMI: {bmi} ({getBMICategory(parseFloat(bmi)).label})
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <Percent className="w-8 h-8 text-purple-200" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Body Fat</span>
              </div>
              <p className="text-3xl font-bold">{latestMeasurement?.bodyFat || '--'}</p>
              <p className="text-purple-100 text-sm">% body fat</p>
              {measurements.length > 1 && latestMeasurement?.bodyFat && firstMeasurement?.bodyFat && (
                <div className={`mt-2 flex items-center gap-1 text-sm ${
                  latestMeasurement.bodyFat < firstMeasurement.bodyFat ? 'text-green-300' : 'text-red-300'
                }`}>
                  {latestMeasurement.bodyFat < firstMeasurement.bodyFat ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  {Math.abs(latestMeasurement.bodyFat - firstMeasurement.bodyFat).toFixed(1)}% change
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <Dumbbell className="w-8 h-8 text-green-200" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Muscle</span>
              </div>
              <p className="text-3xl font-bold">{latestMeasurement?.muscleMass || '--'}</p>
              <p className="text-green-100 text-sm">kg muscle mass</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <Target className="w-8 h-8 text-orange-200" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Progress</span>
              </div>
              <p className="text-3xl font-bold">{progressPercent}%</p>
              <p className="text-orange-100 text-sm">to goal</p>
              {measurements.length > 0 && (
                <div className="mt-2 text-xs text-orange-200">
                  {measurements.length} measurement{measurements.length !== 1 ? 's' : ''} logged
                </div>
              )}
              <p className="text-orange-100 text-sm">to goal</p>
              <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </motion.div>
          </div>

          {/* BMI & Health Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">📊 BMI</h3>
                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" title="Body Mass Index" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{bmi || '--'}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold mb-1 ${
                  bmiCategory.color === 'green' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                  bmiCategory.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                  bmiCategory.color === 'red' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' :
                  'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                }`}>
                  {bmiCategory.label}
                </span>
              </div>
              <div className="mt-4 bg-gradient-to-r from-blue-400 via-yellow-400 to-red-400 h-3 rounded-full relative">
                {bmi && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg"
                    style={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">🔥 BMR</h3>
                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" title="Basal Metabolic Rate" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{bmr || '--'}</span>
                <span className="text-slate-500 dark:text-slate-400 mb-1 font-medium">kcal/day</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Calories burned at rest
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">⚡ TDEE</h3>
                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500 cursor-help" title="Total Daily Energy Expenditure" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{tdee || '--'}</span>
                <span className="text-slate-500 dark:text-slate-400 mb-1 font-medium">kcal/day</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Maintenance calories
              </p>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">📉 Weight Progress</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 border-0 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
                  {['area', 'line', 'bar'].map(type => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        chartType === type ? 'bg-white dark:bg-gray-600 shadow text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'area' ? (
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dateFormatted" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#f97316"
                      strokeWidth={3}
                      fill="url(#weightGradient)"
                      name="Weight (kg)"
                    />
                  </AreaChart>
                ) : chartType === 'line' ? (
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dateFormatted" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                      name="Weight (kg)"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="dateFormatted" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="weight" fill="#f97316" radius={[4, 4, 0, 0]} name="Weight (kg)" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No data available for this period</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-3 text-sky-500 font-medium hover:underline"
                  >
                    Add your first measurement
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Goal Prediction */}
          {predictedDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Goal Prediction</h3>
                  <p className="text-green-100">Based on your current progress</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-green-100 text-sm">Predicted Achievement</p>
                  <p className="text-2xl font-bold mt-1">
                    {predictedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <p className="text-green-100 text-sm">Target Weight</p>
                  <p className="text-2xl font-bold mt-1">{goals.targetWeight} kg</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Measurements View */}
      {activeView === 'measurements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 text-lg">Measurement History</h3>
              <p className="text-slate-500 text-sm mt-1">Track all your body measurements over time</p>
            </div>
            
            {measurements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Weight</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Body Fat</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Muscle</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Waist</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Chest</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...measurements].reverse().map((m, idx) => (
                      <tr key={m.id || idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {new Date(m.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {m.weight ? `${m.weight} kg` : '--'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {m.bodyFat ? `${m.bodyFat}%` : '--'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {m.muscleMass ? `${m.muscleMass} kg` : '--'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {m.waist ? `${m.waist} cm` : '--'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {m.chest ? `${m.chest} cm` : '--'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                          {m.notes || '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Scale className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">No measurements recorded yet</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all"
                >
                  Add First Measurement
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals View */}
      {activeView === 'goals' && (
        <div className="space-y-6">
          {!showGoalForm ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Goal */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Current Goals</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-sky-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-sky-500" />
                      <span className="font-medium text-gray-900">Target Weight</span>
                    </div>
                    <span className="text-xl font-bold text-sky-600">
                      {goals.targetWeight ? `${goals.targetWeight} kg` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Percent className="w-6 h-6 text-purple-500" />
                      <span className="font-medium text-gray-900">Target Body Fat</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      {goals.targetBodyFat ? `${goals.targetBodyFat}%` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-green-500" />
                      <span className="font-medium text-gray-900">Target Date</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">
                      {goals.targetDate ? new Date(goals.targetDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Dumbbell className="w-6 h-6 text-blue-500" />
                      <span className="font-medium text-gray-900">Fitness Goal</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600 capitalize">
                      {goals.fitnessGoal?.replace('_', ' ') || 'Not set'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setGoalFormData(goals)
                    setShowGoalForm(true)
                  }}
                  className="mt-6 w-full py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all"
                >
                  Update Goals
                </button>
              </div>

              {/* Progress to Goal */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Progress to Goal</h3>
                {goals.targetWeight && latestMeasurement ? (
                  <div className="relative pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">
                        Start: {firstMeasurement?.weight || '--'} kg
                      </span>
                      <span className="text-sm font-medium text-slate-600">
                        Goal: {goals.targetWeight} kg
                      </span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-end px-3"
                      >
                        {progressPercent > 10 && (
                          <span className="text-xs font-bold text-white">{progressPercent}%</span>
                        )}
                      </motion.div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {latestMeasurement.weight} kg
                      </p>
                      <p className="text-slate-500 text-sm">Current Weight</p>
                      {latestMeasurement && goals.targetWeight && (
                        <div className="mt-3">
                          <p className="text-sm">
                            <span className="text-sky-600 font-medium">
                              {Math.abs(latestMeasurement.weight - goals.targetWeight).toFixed(1)} kg
                            </span>
                            {' '}remaining to goal
                          </p>
                          {predictedDate && predictedDate > new Date() && (
                            <p className="text-xs text-green-600 mt-2 font-medium">
                              🎯 Est. achievement: {predictedDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Target className="w-12 h-12 text-slate-300 mb-3" />
                    <p>Set a goal to track progress</p>
                    <button
                      onClick={() => setShowGoalForm(true)}
                      className="mt-4 px-6 py-2 bg-sky-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all"
                    >
                      Set Goal
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Goal Form
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Update Your Goals</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalFormData.targetWeight}
                    onChange={(e) => setGoalFormData({ ...goalFormData, targetWeight: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                    placeholder="70"
                  />
                  <p className="text-xs text-slate-500 mt-1">Your ideal target weight</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Body Fat (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalFormData.targetBodyFat}
                    onChange={(e) => setGoalFormData({ ...goalFormData, targetBodyFat: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                    placeholder="15"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optional: target body fat percentage</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalFormData.targetDate}
                    onChange={(e) => setGoalFormData({ ...goalFormData, targetDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optional: when do you want to reach this goal?</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Primary Fitness Goal
                  </label>
                  <select
                    value={goalFormData.fitnessGoal}
                    onChange={(e) => setGoalFormData({ ...goalFormData, fitnessGoal: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">This helps us personalize your recommendations</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowGoalForm(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGoals}
                  disabled={submittingGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submittingGoal ? 'Saving...' : 'Save Goals'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics View */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Multi-metric Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Body Composition Trends</h3>
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={filteredData}>
                  <defs>
                    <linearGradient id="weightG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fatG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="muscleG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="dateFormatted" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} fill="url(#weightG)" name="Weight (kg)" />
                  <Area type="monotone" dataKey="bodyFat" stroke="#ec4899" strokeWidth={2} fill="url(#fatG)" name="Body Fat (%)" />
                  <Area type="monotone" dataKey="muscleMass" stroke="#10b981" strokeWidth={2} fill="url(#muscleG)" name="Muscle (kg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-slate-500">
                No data available
              </div>
            )}
          </div>

          {/* Summary Report */}
          {report && report.message !== 'Not enough data for report' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-4">Progress Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600">Starting Weight</p>
                  <p className="text-2xl font-bold text-blue-700">{report.starting_weight} kg</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600">Current Weight</p>
                  <p className="text-2xl font-bold text-green-700">{report.current_weight} kg</p>
                </div>
                <div className={`p-4 rounded-xl ${report.weight_change < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm ${report.weight_change < 0 ? 'text-green-600' : 'text-red-600'}`}>Weight Change</p>
                  <p className={`text-2xl font-bold ${report.weight_change < 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {report.weight_change > 0 ? '+' : ''}{report.weight_change} kg
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600">Duration</p>
                  <p className="text-2xl font-bold text-purple-700">{report.duration_days} days</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body Stats View */}
      {activeView === 'body' && (
        <div className="space-y-6">
          {/* Radar Chart for Body Measurements */}
          {radarData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Body Measurements Overview</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Radar
                    name="Measurements"
                    dataKey="value"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Body Measurements Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Chest', value: latestMeasurement?.chest, icon: '💪', color: 'blue' },
              { label: 'Waist', value: latestMeasurement?.waist, icon: '📏', color: 'green' },
              { label: 'Hips', value: latestMeasurement?.hips, icon: '🦵', color: 'purple' },
              { label: 'Biceps', value: latestMeasurement?.biceps, icon: '💪', color: 'orange' },
            ].map(item => (
              <div key={item.label} className={`bg-${item.color}-50 rounded-2xl p-5 border border-${item.color}-100`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {item.value ? `${item.value} cm` : '--'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Log Progress</h2>
                  <p className="text-slate-500 text-sm">Record your measurements for today</p>
                </div>
                <div className="flex gap-2">
                  {measurements.length > 0 && (
                    <button
                      onClick={copyLastMeasurement}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all text-sm font-medium"
                      title="Copy previous measurement values"
                    >
                      📋 Copy Previous
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Measurement Date & Time */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">📅 When</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={formData.measurement_date}
                        onChange={(e) => setFormData({ ...formData, measurement_date: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                      <select
                        value={formData.measurement_time}
                        onChange={(e) => setFormData({ ...formData, measurement_time: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                      >
                        <option value="morning">Morning (Fasted)</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Primary Metrics */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Primary Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg) *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                        placeholder="70.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Body Fat (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.body_fat}
                        onChange={(e) => setFormData({ ...formData, body_fat: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                        placeholder="15.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Muscle Mass (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.muscle_mass}
                        onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                        placeholder="55.0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">* Required field only</p>
                </div>

                {/* Body Measurements */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Body Measurements (cm)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'chest', label: 'Chest', placeholder: '100' },
                      { key: 'waist', label: 'Waist', placeholder: '80' },
                      { key: 'hips', label: 'Hips', placeholder: '95' },
                      { key: 'biceps', label: 'Biceps', placeholder: '35' },
                      { key: 'thighs', label: 'Thighs', placeholder: '55' },
                      { key: 'calves', label: 'Calves', placeholder: '38' },
                      { key: 'neck', label: 'Neck', placeholder: '38' },
                      { key: 'shoulders', label: 'Shoulders', placeholder: '120' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData[field.key]}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                          placeholder={field.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">All measurements are optional</p>
                </div>

                {/* Workout Activity */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🏋️ Workout Today</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Did You Exercise?</label>
                      <select
                        value={formData.workout_today}
                        onChange={(e) => setFormData({ ...formData, workout_today: e.target.value === 'true' })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                      >
                        <option value="false">Rest Day</option>
                        <option value="true">Yes, I Worked Out</option>
                      </select>
                    </div>
                    
                    {formData.workout_today && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                          <select
                            value={formData.workout_type}
                            onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                          >
                            <option value="strength">Strength</option>
                            <option value="cardio">Cardio</option>
                            <option value="flexibility">Flexibility</option>
                            <option value="sports">Sports</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Duration (min)</label>
                          <input
                            type="number"
                            value={formData.workout_duration}
                            onChange={(e) => setFormData({ ...formData, workout_duration: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                            placeholder="45"
                            min="0"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Intensity</label>
                          <select
                            value={formData.workout_intensity}
                            onChange={(e) => setFormData({ ...formData, workout_intensity: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                          >
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="high">High</option>
                            <option value="extreme">Extreme</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Hydration */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">💧 Hydration</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Water Intake (Liters)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.water_intake}
                        onChange={(e) => setFormData({ ...formData, water_intake: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                        placeholder="2.5"
                        min="0"
                      />
                      <p className="text-xs text-slate-500 mt-1">Typical: 2-3L/day</p>
                    </div>
                  </div>
                </div>

                {/* Wellness Metrics */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Wellness Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mood</label>
                      <select
                        value={formData.mood}
                        onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                      >
                        <option value="great">Great 🤩</option>
                        <option value="good">Good 😊</option>
                        <option value="okay">Okay 😐</option>
                        <option value="bad">Bad 😔</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sleep Quality</label>
                      <select
                        value={formData.sleep_quality}
                        onChange={(e) => setFormData({ ...formData, sleep_quality: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                      >
                        <option value="great">Excellent</option>
                        <option value="good">Good</option>
                        <option value="okay">Fair</option>
                        <option value="bad">Poor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sleep Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.sleep_hours}
                        onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                        placeholder="7.5"
                        min="0"
                        max="12"
                      />
                      <p className="text-xs text-slate-500 mt-1">Ideal: 7-9 hours</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Energy Level (1-10)</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.energy_level}
                        onChange={(e) => setFormData({ ...formData, energy_level: e.target.value })}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-center text-sm font-medium text-sky-600 mt-1">
                        {formData.energy_level}/10
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-orange-500"
                    rows={3}
                    placeholder="How are you feeling? Any changes in diet or exercise? Anything else to note?"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optional: Add any notes about your progress</p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addMeasurement}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Save Measurement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500" />
            <span className="font-medium text-slate-700">Loading progress data...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedProgressTracker
