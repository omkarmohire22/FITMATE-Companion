import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, User, Mail, Phone, Target, Activity, Calendar, 
  MessageCircle, FileText, Plus, X, Dumbbell, Clock, Send,
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react'

const TraineeDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()

  const [trainee, setTrainee] = useState(null)
  const [workouts, setWorkouts] = useState([])
  const [reports, setReports] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('profile')
  
  // Workout creation state
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [workoutForm, setWorkoutForm] = useState({
    exercise_type: '',
    description: '',
    sets: '',
    reps: '',
    duration_minutes: '',
    notes: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ 1. Get trainee list
        const tRes = await api.get('/api/trainer/trainees')
        const trainees = tRes?.data?.trainees || []

        const found = trainees.find(t => String(t.id) === String(id))
        setTrainee(found || null)

        // ✅ 2. Get workouts
        const wRes = await api.get(`/api/trainer/trainees/${id}/workouts`)
        setWorkouts(wRes?.data?.workouts || [])

        // ✅ 3. Get AI reports (only if exists in backend)
        try {
          const rRes = await api.get(`/api/trainer/trainees/${id}/ai-reports`)
          setReports(rRes?.data?.reports || [])
        } catch {
          setReports([])
        }

        // ✅ 4. Get messages (only if exists)
        try {
          const mRes = await api.get(`/api/trainer/trainees/${id}/messages`)
          setMessages(mRes?.data || [])
        } catch {
          setMessages([])
        }

      } catch (err) {
        console.error('Error loading trainee details:', err)
        setError('Failed to load trainee data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await api.post(`/api/trainer/trainees/${id}/messages`, {
        message: newMessage
      })

      setNewMessage('')

      const mRes = await api.get(`/api/trainer/trainees/${id}/messages`)
      setMessages(mRes?.data || [])
      toast.success('Message sent!')

    } catch (err) {
      console.error('Message error:', err)
      toast.error('Message failed to send')
    }
  }

  // Handle workout creation (placeholder - needs backend endpoint)
  const handleCreateWorkout = async (e) => {
    e.preventDefault()
    try {
      // This would need a backend endpoint like POST /api/trainer/trainees/{id}/workouts
      toast.success('Workout plan created! (Demo - needs backend)')
      setShowWorkoutForm(false)
      setWorkoutForm({
        exercise_type: '',
        description: '',
        sets: '',
        reps: '',
        duration_minutes: '',
        notes: ''
      })
    } catch (err) {
      toast.error('Failed to create workout')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Loading trainee details...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg mb-4">{typeof error === 'string' ? error : error?.message || JSON.stringify(error)}</p>
        <Link to="/trainer" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )

  if (!trainee) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <User className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Trainee not found</h2>
        <Link to="/trainer" className="text-blue-400 hover:underline">Back to Dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link to="/trainer" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-3xl">
                  {(trainee.name || trainee.user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{trainee.name || trainee.user?.name}</h1>
                <p className="text-blue-100">{trainee.email || trainee.user?.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                    trainee.fitness_level === 'beginner' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    trainee.fitness_level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    trainee.fitness_level === 'advanced' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-gray-500/20 text-slate-300 border border-gray-500/30'
                  }`}>
                    {trainee.fitness_level || 'Not Set'}
                  </span>
                  {trainee.goal && (
                    <span className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {trainee.goal}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWorkoutForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Assign Workout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'workouts', label: 'Workouts', icon: Dumbbell },
            { id: 'reports', label: 'AI Reports', icon: FileText },
            { id: 'messages', label: 'Messages', icon: MessageCircle }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeSection === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Profile Information
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainee.gender && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Gender</span>
                    <p className="font-semibold text-white capitalize">{trainee.gender}</p>
                  </div>
                )}
                {trainee.date_of_birth && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Date of Birth</span>
                    <p className="font-semibold text-white">{trainee.date_of_birth}</p>
                  </div>
                )}
                {trainee.address && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Address</span>
                    <p className="font-semibold text-white">{trainee.address}</p>
                  </div>
                )}
                {trainee.fitness_level && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Fitness Level</span>
                    <p className="font-semibold text-white capitalize">{trainee.fitness_level}</p>
                  </div>
                )}
                {trainee.weight && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Weight</span>
                    <p className="font-semibold text-white">{trainee.weight} kg</p>
                  </div>
                )}
                {trainee.height && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Height</span>
                    <p className="font-semibold text-white">{trainee.height} cm</p>
                  </div>
                )}
                {trainee.target_weight && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Target Weight</span>
                    <p className="font-semibold text-white">{trainee.target_weight} kg</p>
                  </div>
                )}
                {trainee.goal && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Goal</span>
                    <p className="font-semibold text-white">{trainee.goal}</p>
                  </div>
                )}
                {trainee.joined_at && (
                  <div className="bg-white/5 p-4 rounded-xl">
                    <span className="text-slate-400 text-sm">Member Since</span>
                    <p className="font-semibold text-white">{new Date(trainee.joined_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Fitness Goals */}
              {trainee.fitness_goals && (
                <div className="mt-4 bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl">
                  <span className="text-purple-400 text-sm font-medium">🎯 Fitness Goals</span>
                  <p className="font-semibold mt-1 text-white">{trainee.fitness_goals}</p>
                </div>
              )}

              {/* Health Conditions */}
              {trainee.health_conditions && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                  <span className="text-yellow-400 text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Health Conditions
                  </span>
                  <p className="font-semibold mt-1 text-yellow-100">{trainee.health_conditions}</p>
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            {(trainee.emergency_contact_name || trainee.emergency_contact_phone) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Contact
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {trainee.emergency_contact_name && (
                    <div className="bg-white/5 p-4 rounded-xl">
                      <span className="text-slate-400 text-sm">Contact Name</span>
                      <p className="font-semibold text-white">{trainee.emergency_contact_name}</p>
                    </div>
                  )}
                  {trainee.emergency_contact_phone && (
                    <div className="bg-white/5 p-4 rounded-xl">
                      <span className="text-slate-400 text-sm">Contact Phone</span>
                      <p className="font-semibold text-white">{trainee.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workouts Section */}
        {activeSection === 'workouts' && (
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-green-400" />
                Workouts History
              </h2>
              <button
                onClick={() => setShowWorkoutForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Assign Workout
              </button>
            </div>
            {workouts.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No workouts recorded yet</p>
                <p className="text-slate-500 text-sm mt-2">Assign a workout to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map(w => (
                  <div key={w.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{w.exercise_type || 'Workout'}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-slate-400">
                            <Activity className="w-4 h-4 inline mr-1" />
                            Reps: {w.total_reps || 0}
                          </span>
                          <span className="text-slate-400">
                            <Target className="w-4 h-4 inline mr-1" />
                            Accuracy: {w.avg_accuracy ? `${w.avg_accuracy}%` : '--'}
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-500 text-sm">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(w.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              AI Reports
            </h2>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No AI reports generated</p>
                <p className="text-slate-500 text-sm mt-2">Reports will appear after workout analysis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(r => (
                  <div key={r.id} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{r.report_type}</span>
                      <span className="text-slate-500 text-sm">Workout #{r.workout_id}</span>
                    </div>
                    <pre className="text-xs mt-2 text-slate-300 bg-black/20 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(r.report_json, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Section */}
        {activeSection === 'messages' && (
          <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages with {trainee.name || trainee.user?.name}
              </h2>
            </div>
            
            <div className="h-96 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No messages yet</p>
                  <p className="text-slate-500 text-sm mt-2">Start a conversation below</p>
                </div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                    msg.sender_id === user?.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md'
                      : 'bg-white/10 text-white rounded-bl-md'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-purple-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type a message..."
                />
                <button 
                  type="submit"
                  className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white hover:shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Workout Creation Modal */}
      {showWorkoutForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Assign Workout</h3>
              <button onClick={() => setShowWorkoutForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Exercise Type</label>
                <select
                  value={workoutForm.exercise_type}
                  onChange={(e) => setWorkoutForm({...workoutForm, exercise_type: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select exercise</option>
                  <option value="push-ups">Push-ups</option>
                  <option value="squats">Squats</option>
                  <option value="planks">Planks</option>
                  <option value="lunges">Lunges</option>
                  <option value="burpees">Burpees</option>
                  <option value="cardio">Cardio</option>
                  <option value="weight-training">Weight Training</option>
                  <option value="yoga">Yoga</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sets</label>
                  <input
                    type="number"
                    value={workoutForm.sets}
                    onChange={(e) => setWorkoutForm({...workoutForm, sets: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reps</label>
                  <input
                    type="number"
                    value={workoutForm.reps}
                    onChange={(e) => setWorkoutForm({...workoutForm, reps: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (min)</label>
                  <input
                    type="number"
                    value={workoutForm.duration_minutes}
                    onChange={(e) => setWorkoutForm({...workoutForm, duration_minutes: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes / Instructions</label>
                <textarea
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({...workoutForm, notes: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any specific instructions for this workout..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWorkoutForm(false)}
                  className="flex-1 px-4 py-3 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Assign Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TraineeDetails
