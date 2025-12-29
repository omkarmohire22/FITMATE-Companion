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
import { TrendingUp, Target, Calendar } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const ProgressTracker = () => {
  const [measurements, setMeasurements] = useState([])
  const [predictedGoalDate, setPredictedGoalDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    weight: '',
    body_fat: '',
    muscle_mass: '',
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    notes: '',
  })

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const response = await api.get('/api/trainee/progress')
      const data = response.data.measurements.map((m) => ({
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight,
        bodyFat: m.body_fat,
        muscleMass: m.muscle_mass,
        waist: m.waist,
        chest: m.chest,
      }))
      setMeasurements(data)
      calculatePrediction(data)
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePrediction = (data) => {
    if (data.length < 2) return

    // Simple linear regression for weight prediction
    const weights = data.map((d) => d.weight).filter((w) => w != null)
    if (weights.length < 2) return

    const n = weights.length
    const firstWeight = weights[0]
    const lastWeight = weights[n - 1]
    const trend = (lastWeight - firstWeight) / (n - 1)

    // Predict when user will reach target (assuming 70kg target)
    const targetWeight = 70
    const currentWeight = lastWeight
    const weightToLose = currentWeight - targetWeight

    if (trend < 0 && weightToLose > 0) {
      // Losing weight
      const weeksNeeded = Math.abs(weightToLose / trend)
      const predictedDate = new Date()
      predictedDate.setDate(predictedDate.getDate() + weeksNeeded * 7)
      setPredictedGoalDate(predictedDate)
    }
  }

  const addMeasurement = async () => {
    if (!formData.weight) {
      toast.error('Please enter at least your weight')
      return
    }

    try {
      await api.post('/api/trainee/measurements', {
        weight: parseFloat(formData.weight),
        body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        biceps: formData.biceps ? parseFloat(formData.biceps) : null,
        notes: formData.notes || null,
      })

      toast.success('Measurement added!')
      setFormData({
        weight: '',
        body_fat: '',
        muscle_mass: '',
        chest: '',
        waist: '',
        hips: '',
        biceps: '',
        notes: '',
      })
      setShowAddForm(false)
      loadProgress()
    } catch (error) {
      toast.error('Failed to add measurement')
      console.error(error)
    }
  }

  const latestMeasurement = measurements[measurements.length - 1]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-primary-400" />
            <span className="text-sm text-gray-400">Current Weight</span>
          </div>
          <div className="text-3xl font-bold">
            {latestMeasurement?.weight || '--'} kg
          </div>
          {latestMeasurement?.weight && measurements.length > 1 && (
            <div className="text-sm text-gray-400 mt-2">
              {measurements[0].weight - latestMeasurement.weight > 0 ? (
                <span className="text-green-400">
                  ↓ {Math.abs(measurements[0].weight - latestMeasurement.weight).toFixed(1)} kg
                  lost
                </span>
              ) : (
                <span className="text-red-400">
                  ↑ {Math.abs(measurements[0].weight - latestMeasurement.weight).toFixed(1)} kg
                  gained
                </span>
              )}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-secondary-400" />
            <span className="text-sm text-gray-400">Body Fat %</span>
          </div>
          <div className="text-3xl font-bold">
            {latestMeasurement?.bodyFat ? `${latestMeasurement.bodyFat}%` : '--'}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-green-400" />
            <span className="text-sm text-gray-400">Goal Prediction</span>
          </div>
          <div className="text-lg font-bold">
            {predictedGoalDate
              ? predictedGoalDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '--'}
          </div>
          {predictedGoalDate && (
            <div className="text-sm text-gray-400 mt-2">
              Estimated achievement date
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      {measurements.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Progress Trends (30 Days)</h2>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Weight & Body Composition</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={measurements}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  fill="#3b82f6"
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
                <Area
                  type="monotone"
                  dataKey="muscleMass"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Muscle Mass (kg)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Body Measurements</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={measurements}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="chest"
                  stroke="#f59e0b"
                  name="Chest (cm)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="waist"
                  stroke="#ef4444"
                  name="Waist (cm)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Measurement Form */}
      <div className="glass rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add Measurement</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg hover:bg-primary-500/30 transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Measurement'}
          </button>
        </div>

        {showAddForm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="70.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Body Fat (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.body_fat}
                onChange={(e) => setFormData({ ...formData, body_fat: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="15.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Muscle Mass (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.muscle_mass}
                onChange={(e) => setFormData({ ...formData, muscle_mass: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="55.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.waist}
                onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="80.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.chest}
                onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="100.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Hips (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.hips}
                onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="90.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Biceps (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.biceps}
                onChange={(e) => setFormData({ ...formData, biceps: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="35.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                placeholder="Optional notes"
              />
            </div>
          </div>
        )}

        {showAddForm && (
          <button
            onClick={addMeasurement}
            className="mt-6 w-full py-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg font-semibold text-white hover:shadow-lg transition"
          >
            Save Measurement
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      )}
    </div>
  )
}

export default ProgressTracker






