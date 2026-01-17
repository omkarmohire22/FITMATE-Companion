import { useEffect, useState } from 'react'
import { adminApi } from '../../../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, Plus, Edit2, Trash2, Users, Bell, 
  X, Search, ChevronDown, CheckCircle, AlertCircle,
  User, Filter, Send, RefreshCw, BellRing, Info
} from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SLOT_TYPES = [
  { value: 'general', label: 'General Gym', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { value: 'class', label: 'Group Class', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  { value: 'personal_training', label: 'PT Session', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  { value: 'special', label: 'Special Event', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
]

const TimeSchedule = () => {
  const [slots, setSlots] = useState([])
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [selectedDay, setSelectedDay] = useState('all')
  const [notifyOnSave, setNotifyOnSave] = useState(true)

  const [form, setForm] = useState({
    day_of_week: 'Monday',
    start_time: '06:00',
    end_time: '10:00',
    slot_type: 'general',
    title: '',
    description: '',
    trainer_id: '',
    max_capacity: 0,
    is_active: true,
  })

  const loadData = async (force = false) => {
    if (loaded && !force) return;
    
    try {
      setLoading(true)
      const [scheduleRes, trainersRes] = await Promise.all([
        adminApi.getGymSchedule(),
        adminApi.getTrainers()
      ])
      setSlots(scheduleRes.data.slots || [])
      setTrainers(trainersRes.data.trainers || [])
      setLoaded(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout loading schedule')
      }
      // Use mock data if API fails
      setSlots([
        { id: 1, day_of_week: 'Monday', start_time: '06:00 AM', end_time: '10:00 AM', slot_type: 'general', title: 'Morning Session' },
        { id: 2, day_of_week: 'Monday', start_time: '05:00 PM', end_time: '09:00 PM', slot_type: 'general', title: 'Evening Session' },
        { id: 3, day_of_week: 'Tuesday', start_time: '07:00 AM', end_time: '08:00 AM', slot_type: 'class', title: 'Yoga Class' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setForm({
      day_of_week: 'Monday',
      start_time: '06:00',
      end_time: '10:00',
      slot_type: 'general',
      title: '',
      description: '',
      trainer_id: '',
      max_capacity: 0,
      is_active: true,
    })
    setEditingSlot(null)
  }

  const formatTimeForDisplay = (time) => {
    if (!time) return ''
    // If already formatted with AM/PM, return as is
    if (time.includes('AM') || time.includes('PM')) return time
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatTimeForInput = (time) => {
    if (!time) return ''
    // If in 12h format, convert to 24h
    if (time.includes('AM') || time.includes('PM')) {
      const [timePart, ampm] = time.split(' ')
      const [hours, minutes] = timePart.split(':')
      let h = parseInt(hours)
      if (ampm === 'PM' && h !== 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return `${h.toString().padStart(2, '0')}:${minutes}`
    }
    return time
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.start_time || !form.end_time) {
      toast.error('Start and end time are required')
      return
    }

    const payload = {
      ...form,
      start_time: formatTimeForDisplay(form.start_time),
      end_time: formatTimeForDisplay(form.end_time),
      trainer_id: form.trainer_id || null,
      max_capacity: Number(form.max_capacity) || 0,
    }

    try {
      if (editingSlot) {
        await adminApi.updateGymScheduleSlot(editingSlot.id, payload, notifyOnSave)
        toast.success(notifyOnSave ? '✅ Schedule updated & notifications sent to all trainees & trainers!' : 'Schedule updated')
      } else {
        await adminApi.createGymScheduleSlot(payload, notifyOnSave)
        toast.success(notifyOnSave ? '✅ Schedule created & notifications sent to all trainees & trainers!' : 'Schedule created')
      }
      resetForm()
      setShowForm(false)
      loadData(true)
    } catch (err) {
      console.error(err)
      toast.error(editingSlot ? 'Failed to update schedule' : 'Failed to create schedule')
    }
  }

  const handleEdit = (slot) => {
    setForm({
      day_of_week: slot.day_of_week || 'Monday',
      start_time: formatTimeForInput(slot.start_time) || '06:00',
      end_time: formatTimeForInput(slot.end_time) || '10:00',
      slot_type: slot.slot_type || 'general',
      title: slot.title || '',
      description: slot.description || '',
      trainer_id: slot.trainer_id || '',
      max_capacity: slot.max_capacity || 0,
      is_active: slot.is_active ?? true,
    })
    setEditingSlot(slot)
    setShowForm(true)
  }

  const handleDelete = async (slot) => {
    const confirmMessage = notifyOnSave 
      ? `Delete "${slot.title || 'this schedule'}"?\n\n⚠️ All trainees and trainers will be notified about this deletion.`
      : `Delete "${slot.title || 'this schedule'}"?`
    
    if (!window.confirm(confirmMessage)) return
    
    const toastId = toast.loading('Deleting schedule...')
    
    try {
      await adminApi.deleteGymScheduleSlot(slot.id, notifyOnSave)
      toast.success(notifyOnSave ? '✅ Schedule deleted & notifications sent!' : 'Schedule deleted', { id: toastId })
      loadData(true)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete schedule', { id: toastId })
    }
  }

  const getSlotTypeStyle = (type) => {
    const found = SLOT_TYPES.find(t => t.value === type)
    return found?.color || 'bg-gray-100 text-gray-700'
  }

  const getSlotTypeLabel = (type) => {
    const found = SLOT_TYPES.find(t => t.value === type)
    return found?.label || type
  }

  // Group slots by day
  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day_of_week === day)
    return acc
  }, {})

  const filteredDays = selectedDay === 'all' ? DAYS : [selectedDay]

  // Stats
  const totalSlots = slots.length
  const generalSlots = slots.filter(s => s.slot_type === 'general').length
  const classSlots = slots.filter(s => s.slot_type === 'class').length
  const ptSlots = slots.filter(s => s.slot_type === 'personal_training').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Calendar className="w-8 h-8 text-indigo-500" />
            Gym Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base mt-2 font-medium">Manage gym hours, classes, and trainer schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white rounded-xl font-semibold border border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 transition-all"
            title="Refresh schedule"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Schedule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100">Total Slots</p>
              <p className="text-2xl font-bold mt-1">{totalSlots}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-200 opacity-70" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100">General Sessions</p>
              <p className="text-2xl font-bold mt-1">{generalSlots}</p>
            </div>
            <Clock className="w-8 h-8 text-emerald-200 opacity-70" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100">Group Classes</p>
              <p className="text-2xl font-bold mt-1">{classSlots}</p>
            </div>
            <Users className="w-8 h-8 text-purple-200 opacity-70" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-100">PT Sessions</p>
              <p className="text-2xl font-bold mt-1">{ptSlots}</p>
            </div>
            <User className="w-8 h-8 text-orange-200 opacity-70" />
          </div>
        </motion.div>
      </div>

      {/* Notification Toggle + Day Filter */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifyOnSave ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gray-300 dark:bg-gray-600'} transition-colors shadow-lg`}>
              {notifyOnSave ? <BellRing className="w-5 h-5 text-white" /> : <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={notifyOnSave}
                  onChange={(e) => setNotifyOnSave(e.target.checked)}
                  className="w-5 h-5 text-indigo-500 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 bg-white dark:bg-gray-700"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    Send Notifications
                  </span>
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${notifyOnSave ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {notifyOnSave 
                      ? <>✅ All trainees & trainers will be notified about schedule changes</> 
                      : <>⚠️ Changes will be made silently without notifications</>}
                  </p>
                </div>
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 shadow-sm"
            >
              <option value="all">📅 All Days</option>
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="space-y-4">
        {filteredDays.map(day => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-700 dark:to-blue-800 px-5 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                {day}
                <span className="ml-auto text-sky-100 text-sm font-normal bg-white/10 px-3 py-1 rounded-full">
                  {slotsByDay[day].length} {slotsByDay[day].length === 1 ? 'slot' : 'slots'}
                </span>
              </h3>
            </div>
            
            <div className="p-4">
              {slotsByDay[day].length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No schedules for {day}</p>
                  <button
                    onClick={() => { setForm({ ...form, day_of_week: day }); setShowForm(true); }}
                    className="mt-3 text-indigo-500 hover:text-sky-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-4 h-4" /> Add Schedule
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {slotsByDay[day].map(slot => (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-sky-300 dark:hover:border-sky-500 hover:shadow-lg transition-all bg-gray-50/50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide ${getSlotTypeStyle(slot.slot_type)}`}>
                          {getSlotTypeLabel(slot.slot_type)}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(slot)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all" aria-label="Edit schedule">
                            <Edit2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button onClick={() => handleDelete(slot)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all" aria-label="Delete schedule">
                            <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">{slot.title || 'Open Session'}</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                        </div>
                        {slot.trainer_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <User className="w-4 h-4 text-purple-500" />
                            {slot.trainer_name}
                          </div>
                        )}
                        {slot.max_capacity > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Users className="w-4 h-4 text-green-500" />
                            Max {slot.max_capacity} people
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/5 dark:to-blue-500/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    {editingSlot ? 'Edit Schedule' : 'Add New Schedule'}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Day *</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.day_of_week}
                      onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.slot_type}
                      onChange={(e) => setForm({ ...form, slot_type: e.target.value })}
                    >
                      {SLOT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">End Time *</label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 placeholder-gray-400 dark:placeholder-slate-500"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Morning Cardio Session"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description (optional)</label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 placeholder-gray-400 dark:placeholder-slate-500"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Any additional details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Trainer (optional)</label>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500"
                      value={form.trainer_id}
                      onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
                    >
                      <option value="">No specific trainer</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max Capacity</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 placeholder-gray-400 dark:placeholder-slate-500"
                      value={form.max_capacity}
                      onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
                      min="0"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>

                {/* Notify toggle in modal */}
                <div className={`p-4 rounded-xl border-2 transition-all ${notifyOnSave ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-500/30' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={notifyOnSave}
                      onChange={(e) => setNotifyOnSave(e.target.checked)}
                      className="w-5 h-5 text-indigo-500 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 mt-0.5 bg-white dark:bg-gray-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {notifyOnSave ? <BellRing className="w-5 h-5 text-indigo-500" /> : <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          Notify all trainees & trainers
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notifyOnSave 
                          ? '✅ Everyone will receive a notification about this schedule change' 
                          : '⚠️ Changes will be made without sending notifications'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    {notifyOnSave && <Send className="w-4 h-4" />}
                    {editingSlot ? 'Update' : 'Create'} Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TimeSchedule
