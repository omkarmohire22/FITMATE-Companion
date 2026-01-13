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

const ProgressTracker = () => {
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
        <div className="glass rounded-xl p-6 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-lg">
              <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-300 mb-2">How Progress Tracker Works</h3>
              <div className="space-y-2 text-sm text-slate-300">
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
        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-6 h-6 text-indigo-400" />
            <span className="text-xs text-slate-400">Current Weight</span>
          </div>
          <div className="text-2xl font-bold">{latestMeasurement?.weight || '--'} kg</div>
          {measurements.length > 1 && latestMeasurement?.weight && (
            <div className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              {measurements[0].weight - latestMeasurement.weight > 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">
                    {Math.abs(measurements[0].weight - latestMeasurement.weight).toFixed(1)} kg lost
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400">
                    {Math.abs(measurements[0].weight - latestMeasurement.weight).toFixed(1)} kg gained
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-slate-400">Body Fat</span>
          </div>
          <div className="text-2xl font-bold">
            {latestMeasurement?.bodyFat ? `${latestMeasurement.bodyFat}%` : '--'}
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="w-6 h-6 text-pink-400" />
            <span className="text-xs text-slate-400">Total Workouts</span>
          </div>
          <div className="text-2xl font-bold">{totalWorkouts}</div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-orange-400" />
            <span className="text-xs text-slate-400">Total Calories</span>
          </div>
          <div className="text-2xl font-bold">{totalCalories.toFixed(0)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowAddMeasurement(!showAddMeasurement)}
          className="glass rounded-xl p-4 border border-white/10 hover:border-indigo-500/50 transition flex items-center gap-3"
        >
          <div className="p-2 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg">
            <Plus className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Add Measurement</h3>
            <p className="text-xs text-slate-400">Track your body metrics</p>
          </div>
        </button>

        <button
          onClick={() => setShowAddWorkout(!showAddWorkout)}
          className="glass rounded-xl p-4 border border-white/10 hover:border-pink-500/50 transition flex items-center gap-3"
        >
          <div className="p-2 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-lg">
            <Dumbbell className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">Log Workout</h3>
            <p className="text-xs text-slate-400">Record your training</p>
          </div>
        </button>
      </div>

      {/* Add Measurement Form */}
      {showAddMeasurement && (
        <div className="glass rounded-xl p-6 border-2 border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Add Measurement</h3>
              <p className="text-sm text-slate-400">Your data will be saved in "Saved Measurements" table below</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.weight}
                onChange={(e) => setMeasurementForm({ ...measurementForm, weight: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="70.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.body_fat}
                onChange={(e) => setMeasurementForm({ ...measurementForm, body_fat: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="15.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Muscle Mass (kg)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.muscle_mass}
                onChange={(e) => setMeasurementForm({ ...measurementForm, muscle_mass: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="55.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.chest}
                onChange={(e) => setMeasurementForm({ ...measurementForm, chest: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.waist}
                onChange={(e) => setMeasurementForm({ ...measurementForm, waist: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Biceps (cm)</label>
              <input
                type="number"
                step="0.1"
                value={measurementForm.biceps}
                onChange={(e) => setMeasurementForm({ ...measurementForm, biceps: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                placeholder="35"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-slate-300">Notes</label>
              <input
                type="text"
                value={measurementForm.notes}
                onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
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
        <div className="glass rounded-xl p-6 border-2 border-pink-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Dumbbell className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Log Workout</h3>
              <p className="text-sm text-slate-400">Your workout will appear in "Recent Workouts" section below</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Exercise Type *</label>
              <select
                value={workoutForm.exercise_type}
                onChange={(e) => setWorkoutForm({ ...workoutForm, exercise_type: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white"
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
              <label className="block text-sm font-medium mb-2 text-slate-300">Duration (min) *</label>
              <input
                type="number"
                value={workoutForm.duration_minutes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration_minutes: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white"
                placeholder="45"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Calories Burned</label>
              <input
                type="number"
                value={workoutForm.calories_burned}
                onChange={(e) => setWorkoutForm({ ...workoutForm, calories_burned: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white"
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Total Reps</label>
              <input
                type="number"
                value={workoutForm.total_reps}
                onChange={(e) => setWorkoutForm({ ...workoutForm, total_reps: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white"
                placeholder="50"
              />
            </div>
          </div>
          <button
            onClick={addWorkout}
            disabled={saving}
            className="mt-4 w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg font-semibold text-white hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Progress Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={measurements}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
                name="Weight (kg)"
              />
              <Area
                type="monotone"
                dataKey="bodyFat"
                stroke="#ec4899"
                fill="#ec4899"
                fillOpacity={0.3}
                name="Body Fat %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Measurements Chart */}
      {measurements.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Body Measurements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={measurements}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="chest" stroke="#f59e0b" name="Chest (cm)" strokeWidth={2} />
              <Line type="monotone" dataKey="waist" stroke="#ef4444" name="Waist (cm)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Workouts */}
      {workouts.length > 0 && (
        <div className="glass rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-pink-400" />
            Workout History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Exercise</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Calories</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Reps</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {workouts.map((workout, idx) => (
                  <tr
                    key={workout.id}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3 text-sm">
                      {new Date(workout.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-lg">
                          <Dumbbell className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="font-semibold text-white">{workout.exercise_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded font-medium">
                        {workout.duration_minutes} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {workout.calories_burned > 0 ? (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded font-medium">
                          {workout.calories_burned} kcal
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {workout.total_reps > 0 ? (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded font-medium">
                          {workout.total_reps}
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {workout.avg_accuracy ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded font-medium">
                          {workout.avg_accuracy}%
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <p>✓ Showing {workouts.length} recent workouts</p>
          </div>
        </div>
      )}

      {/* Measurement History Table */}
      {measurements.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-400" />
            Saved Measurements
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Weight (kg)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Body Fat %</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Muscle (kg)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Chest (cm)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Waist (cm)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Biceps (cm)</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice().reverse().map((m, idx) => (
                  <tr key={m.id || idx} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-sm font-medium">{m.fullDate}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">
                        {m.weight || '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{m.bodyFat ? `${m.bodyFat}%` : '--'}</td>
                    <td className="px-4 py-3 text-sm">{m.muscleMass || '--'}</td>
                    <td className="px-4 py-3 text-sm">{m.chest || '--'}</td>
                    <td className="px-4 py-3 text-sm">{m.waist || '--'}</td>
                    <td className="px-4 py-3 text-sm">{m.biceps || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <p>✓ Total {measurements.length} measurements saved</p>
          </div>
        </div>
      )}

      {measurements.length === 0 && workouts.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Data Yet</h3>
          <p className="text-slate-400">Start tracking by adding measurements and logging workouts!</p>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker






