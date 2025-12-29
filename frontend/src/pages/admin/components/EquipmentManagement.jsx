import { useEffect, useState } from 'react'
import { adminApi } from '../../../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dumbbell, Plus, AlertCircle, CheckCircle, Edit2, Trash2, 
  Wrench, Calendar, Clock, MapPin, Bell, X, Search, Filter,
  AlertTriangle, Settings, ChevronRight, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCondition, setFilterCondition] = useState('all')
  const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(true)
  
  const [form, setForm] = useState({
    name: '',
    type: '',
    quantity: 1,
    condition: 'good',
    status: 'operational',
    location: '',
    last_maintenance: '',
    next_maintenance: '',
    maintenance_notes: '',
    purchase_date: '',
    warranty_expiry: '',
    serial_number: ''
  })

  const loadEquipment = async (force = false) => {
    if (loaded && !force) return;
    
    try {
      setLoading(true)
      const res = await adminApi.getEquipment()
      setEquipment(res.data.equipment || [])
      setLoaded(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Try again.')
      } else {
        toast.error(err.message || 'Failed to load equipment')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEquipment()
  }, [])

  const resetForm = () => {
    setForm({
      name: '',
      type: '',
      quantity: 1,
      condition: 'good',
      status: 'operational',
      location: '',
      last_maintenance: '',
      next_maintenance: '',
      maintenance_notes: '',
      purchase_date: '',
      warranty_expiry: '',
      serial_number: ''
    })
    setEditingEquipment(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.type) {
      toast.error('Name and type are required')
      return
    }
    
    const payload = {
      ...form,
      quantity: Number(form.quantity),
    }
    
    try {
      if (editingEquipment) {
        await adminApi.updateEquipment(editingEquipment.id, payload)
        toast.success('Equipment updated')
      } else {
        await adminApi.addEquipment(payload)
        toast.success('Equipment added')
      }
      resetForm()
      setShowForm(false)
      loadEquipment()
    } catch (err) {
      console.error(err)
      toast.error(editingEquipment ? 'Failed to update equipment' : 'Failed to add equipment')
    }
  }

  const handleEdit = (item) => {
    setForm({
      name: item.name || '',
      type: item.type || '',
      quantity: item.quantity || 1,
      condition: item.condition || 'good',
      status: item.status || 'operational',
      location: item.location || '',
      last_maintenance: item.last_maintenance ? item.last_maintenance.split('T')[0] : '',
      next_maintenance: item.next_maintenance ? item.next_maintenance.split('T')[0] : '',
      maintenance_notes: item.maintenance_notes || '',
      purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
      warranty_expiry: item.warranty_expiry ? item.warranty_expiry.split('T')[0] : '',
      serial_number: item.serial_number || ''
    })
    setEditingEquipment(item)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return
    try {
      await adminApi.deleteEquipment(id)
      toast.success('Equipment deleted')
      loadEquipment()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete equipment')
    }
  }

  const handleMarkMaintenance = async (item) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      await adminApi.updateEquipment(item.id, {
        ...item,
        last_maintenance: today,
        next_maintenance: nextMonth.toISOString().split('T')[0],
        condition: 'good',
        status: 'operational'
      })
      toast.success('Maintenance completed!')
      loadEquipment()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update maintenance')
    }
  }

  // Calculate stats
  const needsMaintenance = equipment.filter(e => e.condition === 'poor' || e.status === 'maintenance').length
  const inGood = equipment.filter(e => e.condition === 'good').length
  const inFair = equipment.filter(e => e.condition === 'fair').length
  
  // Get equipment needing maintenance soon (within 7 days)
  const maintenanceDue = equipment.filter(e => {
    if (!e.next_maintenance) return false
    const nextDate = new Date(e.next_maintenance)
    const today = new Date()
    const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays >= 0
  })

  // Get overdue maintenance
  const maintenanceOverdue = equipment.filter(e => {
    if (!e.next_maintenance) return false
    const nextDate = new Date(e.next_maintenance)
    const today = new Date()
    return nextDate < today
  })

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterCondition === 'all' || item.condition === filterCondition
    return matchesSearch && matchesFilter
  })

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'fair': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'poor': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-700'
      case 'maintenance': return 'bg-yellow-100 text-yellow-700'
      case 'out_of_order': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDaysUntilMaintenance = (nextDate) => {
    if (!nextDate) return null
    const next = new Date(nextDate)
    const today = new Date()
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Maintenance Alerts Banner */}
      {showMaintenanceAlert && (maintenanceOverdue.length > 0 || maintenanceDue.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-200 rounded-2xl p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Maintenance Alerts</h3>
                <div className="mt-1 space-y-1">
                  {maintenanceOverdue.length > 0 && (
                    <p className="text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      {maintenanceOverdue.length} equipment overdue for maintenance!
                    </p>
                  )}
                  {maintenanceDue.length > 0 && (
                    <p className="text-sm text-orange-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {maintenanceDue.length} equipment due for maintenance within 7 days
                    </p>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...maintenanceOverdue, ...maintenanceDue].slice(0, 3).map(item => (
                    <span key={item.id} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-700 border">
                      {item.name}
                    </span>
                  ))}
                  {(maintenanceOverdue.length + maintenanceDue.length) > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{(maintenanceOverdue.length + maintenanceDue.length) - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setShowMaintenanceAlert(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Dumbbell className="w-8 h-8 text-orange-500" />
            Equipment Management
          </h2>
          <p className="text-gray-300 text-base mt-2 font-medium">Track, maintain and manage gym equipment</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Equipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 font-medium">Total Equipment</p>
              <p className="text-3xl font-bold mt-1">{equipment.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 font-medium">Good Condition</p>
              <p className="text-3xl font-bold mt-1">{inGood}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-100 font-medium">Fair Condition</p>
              <p className="text-3xl font-bold mt-1">{inFair}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-100 font-medium">Needs Maintenance</p>
              <p className="text-3xl font-bold mt-1">{needsMaintenance}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search equipment..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)} className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            <option value="all">All Conditions</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredEquipment.map((item, index) => {
            const daysUntil = getDaysUntilMaintenance(item.next_maintenance)
            const isOverdue = daysUntil !== null && daysUntil < 0
            const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7
            
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }} className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all ${isOverdue ? 'border-red-300' : isDueSoon ? 'border-orange-300' : 'border-transparent hover:border-gray-200'}`}>
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.type}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase border ${getConditionColor(item.condition)}`}>
                      {item.condition}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Settings className="w-4 h-4" /> Quantity
                    </span>
                    <span className="font-medium text-gray-900">{item.quantity}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Location
                    </span>
                    <span className="font-medium text-gray-900">{item.location || '—'}</span>
                  </div>

                  {item.status && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Maintenance Timeline */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Next Maintenance
                      </span>
                      {daysUntil !== null ? (
                        <span className={`font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-900'}`}>
                          {isOverdue ? `${Math.abs(daysUntil)} days overdue` : daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not scheduled</span>
                      )}
                    </div>
                    
                    {/* Progress bar for maintenance */}
                    {item.last_maintenance && item.next_maintenance && (
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-orange-500' : 'bg-emerald-500'}`}
                          style={{ 
                            width: `${Math.max(0, Math.min(100, ((30 - (daysUntil || 30)) / 30) * 100))}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 pb-5 flex items-center gap-2">
                  <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all">
                    <Edit2 className="w-4 h-4" />Edit
                  </button>
                  <button onClick={() => handleMarkMaintenance(item)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-medium transition-all">
                    <Wrench className="w-4 h-4" />Service
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredEquipment.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl shadow-xl p-12 text-center">
            <Dumbbell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No equipment found</h3>
            <p className="text-gray-400 mb-4">Add your first equipment to start tracking</p>
            <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all">
              <Plus className="w-4 h-4" />Add Equipment
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-orange-500" />
                    {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Treadmill Pro X500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="">Select type</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Strength">Strength</option>
                      <option value="Free Weights">Free Weights</option>
                      <option value="Machine">Machine</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="operational">Operational</option>
                      <option value="maintenance">Under Maintenance</option>
                      <option value="out_of_order">Out of Order</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Floor 1 - Cardio Zone" />
                </div>

                {/* Maintenance Section */}
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    Maintenance Schedule
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Maintenance</label>
                      <input type="date" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.last_maintenance} onChange={(e) => setForm({ ...form, last_maintenance: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Maintenance</label>
                      <input type="date" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.next_maintenance} onChange={(e) => setForm({ ...form, next_maintenance: e.target.value })} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Notes</label>
                    <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" rows={2} value={form.maintenance_notes} onChange={(e) => setForm({ ...form, maintenance_notes: e.target.value })} placeholder="Any notes about maintenance history or requirements..." />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">{editingEquipment ? 'Update Equipment' : 'Add Equipment'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EquipmentManagement
