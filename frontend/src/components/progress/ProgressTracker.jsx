import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { TrendingUp, Target, Dumbbell, Activity, Plus, TrendingDown } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useTheme } from '../../contexts/ThemeContext'

const ProgressTracker = () => {
  const { isDark } = useTheme()
  const [measurements, setMeasurements] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddMeasurement, setShowAddMeasurement] = useState(false)
  const [showAddWorkout, setShowAddWorkout] = useState(false)

  const [measurementForm, setMeasurementForm] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    biceps: '',
    notes: '',
  })

  const [workoutForm, setWorkoutForm] = useState({
    exercise_type: '',
    duration_minutes: '',
    calories_burned: '',
    total_reps: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadMeasurements(), loadWorkouts()])
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  const loadMeasurements = async () => {
    try {
      const response = await api.get('/api/trainee/progress')
      const data = response.data.measurements.map((m) => ({
        id: m.id,
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: new Date(m.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        weight: m.weight,
        bodyFat: m.body_fat,
        muscleMass: m.muscle_mass,
        waist: m.waist,
        chest: m.chest,
        biceps: m.biceps,
        notes: m.notes,
      }))
      setMeasurements(data)
    } catch (error) {
      console.error('Error loading measurements:', error)
    }
  }

  const loadWorkouts = async () => {
    try {
      const response = await api.get('/api/trainee/workouts')
      setWorkouts(response.data.workouts.slice(0, 10) || [])
    } catch (error) {
      console.error('Error loading workouts:', error)
    }
  }

  const addMeasurement = async () => {
    if (!measurementForm.weight) {
      toast.error('Please enter at least your weight')
      return
    }

    setSaving(true)
    try {
      const response = await api.post('/api/trainee/measurements', {
        weight: parseFloat(measurementForm.weight),
        body_fat: measurementForm.body_fat ? parseFloat(measurementForm.body_fat) : null,
        muscle_mass: measurementForm.muscle_mass ? parseFloat(measurementForm.muscle_mass) : null,
        chest: measurementForm.chest ? parseFloat(measurementForm.chest) : null,
        waist: measurementForm.waist ? parseFloat(measurementForm.waist) : null,
        hips: null, // Not in form, but backend expects it
        biceps: measurementForm.biceps ? parseFloat(measurementForm.biceps) : null,
        notes: measurementForm.notes || null,
      })

      toast.success(`✓ Measurement saved! Weight: ${measurementForm.weight}kg recorded.`, {
        duration: 3000,
        icon: '📊',
      })
      setMeasurementForm({ weight: '', body_fat: '', muscle_mass: '', chest: '', waist: '', biceps: '', notes: '' })
      setShowAddMeasurement(false)
      await loadMeasurements()
    } catch (error) {
      toast.error('Failed to add measurement')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const addWorkout = async () => {
    if (!workoutForm.exercise_type || !workoutForm.duration_minutes) {
      toast.error('Please enter exercise type and duration')
      return
    }

    setSaving(true)
    try {
      const response = await api.post('/api/trainee/workouts/manual', {
        exercise_type: workoutForm.exercise_type,
        duration_minutes: parseInt(workoutForm.duration_minutes),
        calories_burned: workoutForm.calories_burned ? parseFloat(workoutForm.calories_burned) : 0,
        total_reps: workoutForm.total_reps ? parseInt(workoutForm.total_reps) : 0,
        notes: workoutForm.notes || '',
      })

      toast.success(`✓ Workout logged! ${workoutForm.exercise_type} - ${workoutForm.duration_minutes} mins`, {
        duration: 3000,
        icon: '💪',
      })
      setWorkoutForm({ exercise_type: '', duration_minutes: '', calories_burned: '', total_reps: '', notes: '' })
      setShowAddWorkout(false)
      await loadWorkouts()
    } catch (error) {
      toast.error('Failed to log workout')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const latestMeasurement = measurements[measurements.length - 1]
  const totalWorkouts = workouts.length
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Info Card - Only show when no data */}
      {measurements.length === 0 && workouts.length === 0 && (
        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark
          ? 'glass border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5'
          : 'bg-white border-indigo-100 shadow-sm'
          }`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <Target className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>How Progress Tracker Works</h3>
              <div className={`space-y-2 text-sm transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <p>📊 <strong>Add Measurements:</strong> Track weight, body fat, muscle mass, and body measurements</p>
                <p>💪 <strong>Log Workouts:</strong> Record your exercises, duration, and calories burned</p>
                <p>📈 <strong>View Charts:</strong> See your progress trends over time</p>
                <p>📋 <strong>Check History:</strong> All your data is saved in tables below the charts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-indigo-500" />
            <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Weight</span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{latestMeasurement?.weight || '--'} kg</div>
          {measurements.length > 1 && latestMeasurement?.weight && (
            <div className="text-sm mt-1 flex items-center gap-1">
              {measurements[0].weight - latestMeasurement.weight > 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">
                    {Math.abs(measurements[0].weight - latestMeasurement.weight).toFixed(1)} kg lost
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">
                    {Math.abs(measurements[0].weight - latestMeasurement.weight).toFixed(1)} kg gained
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-purple-500" />
            <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Body Fat</span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {latestMeasurement?.bodyFat ? `${latestMeasurement.bodyFat}%` : '--'}
          </div>
        </div>

        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="w-6 h-6 text-pink-500" />
            <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Workouts</span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalWorkouts}</div>
        </div>

        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <span className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Calories</span>
          </div>
          <div className={`text-2xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCalories.toFixed(0)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowAddMeasurement(!showAddMeasurement)}
          className={`rounded-xl p-4 border transition-all duration-300 flex items-center gap-3 ${isDark
            ? 'glass border-white/10 hover:border-indigo-500/50'
            : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
            }`}
        >
          <div className="p-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg">
            <Plus className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-left">
            <h3 className={`font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Measurement</h3>
            <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Track your body metrics</p>
          </div>
        </button>

        <button
          onClick={() => setShowAddWorkout(!showAddWorkout)}
          className={`rounded-xl p-4 border transition-all duration-300 flex items-center gap-3 ${isDark
            ? 'glass border-white/10 hover:border-pink-500/50'
            : 'bg-white border-slate-200 hover:border-pink-300 shadow-sm'
            }`}
        >
          <div className="p-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-lg">
            <Dumbbell className="w-5 h-5 text-pink-500" />
          </div>
          <div className="text-left">
            <h3 className={`font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Log Workout</h3>
            <p className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Record your training</p>
          </div>
        </button>
      </div>

      {/* Add Measurement Form */}
      {showAddMeasurement && (
        <div className={`rounded-xl p-6 border-2 transition-all duration-300 shadow-xl ${isDark ? 'glass border-indigo-500/30' : 'bg-white border-indigo-100'
          }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Target className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className={`text-xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Measurement</h3>
              <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your data will be saved in "Saved Measurements" table below</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.weight}
                onChange={(e) => setMeasurementForm({ ...measurementForm, weight: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="70.5"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.body_fat}
                onChange={(e) => setMeasurementForm({ ...measurementForm, body_fat: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="15.0"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Muscle Mass (kg)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.muscle_mass}
                onChange={(e) => setMeasurementForm({ ...measurementForm, muscle_mass: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="55.0"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.chest}
                onChange={(e) => setMeasurementForm({ ...measurementForm, chest: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="100"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.waist}
                onChange={(e) => setMeasurementForm({ ...measurementForm, waist: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="80"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Biceps (cm)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.biceps}
                onChange={(e) => setMeasurementForm({ ...measurementForm, biceps: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="35"
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Notes</label>
              <input
                type="text"
                value={measurementForm.notes}
                onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <button
            onClick={addMeasurement}
            disabled={saving}
            className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Save Measurement
              </>
            )}
          </button>
        </div>
      )}

      {/* Add Workout Form */}
      {showAddWorkout && (
        <div className={`rounded-xl p-6 border-2 transition-all duration-300 shadow-xl ${isDark ? 'glass border-pink-500/30' : 'bg-white border-pink-100'
          }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Dumbbell className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className={`text-xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Log Workout</h3>
              <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your workout will appear in "Recent Workouts" section below</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Exercise Type *</label>
              <select
                value={workoutForm.exercise_type}
                onChange={(e) => setWorkoutForm({ ...workoutForm, exercise_type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
              >
                <option value="">Select exercise</option>
                <option value="Cardio">Cardio</option>
                <option value="Strength Training">Strength Training</option>
                <option value="Yoga">Yoga</option>
                <option value="HIIT">HIIT</option>
                <option value="CrossFit">CrossFit</option>
                <option value="Running">Running</option>
                <option value="Cycling">Cycling</option>
                <option value="Swimming">Swimming</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Duration (min) *</label>
              <input
                type="number"
                value={workoutForm.duration_minutes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration_minutes: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="45"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Calories Burned</label>
              <input
                type="number"
                value={workoutForm.calories_burned}
                onChange={(e) => setWorkoutForm({ ...workoutForm, calories_burned: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="300"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Total Reps</label>
              <input
                type="number"
                value={workoutForm.total_reps}
                onChange={(e) => setWorkoutForm({ ...workoutForm, total_reps: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                placeholder="50"
              />
            </div>
          </div>
          <button
            onClick={addWorkout}
            disabled={saving}
            className="mt-4 w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-pink-500/20"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Logging...
              </>
            ) : (
              <>
                <Dumbbell className="w-4 h-4" />
                Log Workout
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Chart */}
      {measurements.length > 0 && (
        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Progress Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={measurements}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
              <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#64748b"} />
              <YAxis stroke={isDark ? "#9ca3af" : "#64748b"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  color: isDark ? '#ffffff' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#6366f1"
                fill="url(#colorWeight)"
                fillOpacity={0.3}
                name="Weight (kg)"
              />
              <Area
                type="monotone"
                dataKey="bodyFat"
                stroke="#ec4899"
                fill="url(#colorFat)"
                fillOpacity={0.3}
                name="Body Fat %"
              />
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Measurements Chart */}
      {measurements.length > 0 && (
        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-xl font-bold mb-4 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>Body Measurements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={measurements}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
              <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#64748b"} />
              <YAxis stroke={isDark ? "#9ca3af" : "#64748b"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  color: isDark ? '#ffffff' : '#0f172a',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="chest" stroke="#f59e0b" name="Chest (cm)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="waist" stroke="#ef4444" name="Waist (cm)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Workouts */}
      {workouts.length > 0 && (
        <div className={`rounded-xl p-6 border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Dumbbell className="w-6 h-6 text-pink-500" />
            Workout History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Exercise</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Duration</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Calories</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Reps</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((workout, idx) => (
                  <tr
                    key={workout.id}
                    className={`border-b transition-all duration-200 ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-50 hover:bg-slate-50'}`}
                  >
                    <td className={`px-4 py-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {new Date(workout.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-lg text-pink-500">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <span className={`font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>{workout.exercise_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded font-medium transition-colors duration-300 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        {workout.duration_minutes} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {workout.calories_burned > 0 ? (
                        <span className={`px-2 py-1 rounded font-medium transition-colors duration-300 ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                          {workout.calories_burned} kcal
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {workout.total_reps > 0 ? (
                        <span className={`px-2 py-1 rounded font-medium transition-colors duration-300 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                          {workout.total_reps}
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {workout.avg_accuracy ? (
                        <span className={`px-2 py-1 rounded font-medium transition-colors duration-300 ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                          {workout.avg_accuracy}%
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Measurement History Table */}
      {measurements.length > 0 && (
        <div className={`rounded-xl p-6 border transition-all duration-300 shadow-sm ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Target className="w-6 h-6 text-indigo-500" />
            Saved Measurements
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b transition-colors duration-300 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Weight (kg)</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Body Fat %</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Muscle (kg)</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Chest (cm)</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Waist (cm)</th>
                  <th className={`px-4 py-3 text-left text-sm font-semibold transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Biceps (cm)</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice().reverse().map((m, idx) => (
                  <tr key={m.id || idx} className={`border-b transition-all duration-200 ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-50 hover:bg-slate-50'}`}>
                    <td className={`px-4 py-3 text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{m.fullDate}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded transition-colors duration-300 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                        {m.weight || '--'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.bodyFat ? `${m.bodyFat}%` : '--'}</td>
                    <td className={`px-4 py-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.muscleMass || '--'}</td>
                    <td className={`px-4 py-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.chest || '--'}</td>
                    <td className={`px-4 py-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.waist || '--'}</td>
                    <td className={`px-4 py-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.biceps || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {measurements.length === 0 && workouts.length === 0 && (
        <div className={`rounded-xl p-12 text-center border transition-all duration-300 ${isDark ? 'glass border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <Target className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Data Yet</h3>
          <p className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Start tracking by adding measurements and logging workouts!</p>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker






