import { useEffect, useState } from 'react'
import { adminApi } from '../../../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit2, Trash2, Crown, Star, Shield, Zap, 
  Users, TrendingUp, Check, X, Eye, EyeOff, DollarSign,
  Clock, Award, Sparkles, Search, Filter, AlertTriangle, CalendarX
} from 'lucide-react'
import toast from 'react-hot-toast'

const MembershipPlans = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expiringMembers, setExpiringMembers] = useState([])
  const [showExpiryAlert, setShowExpiryAlert] = useState(false)
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalSubscribers: 0,
    monthlyRevenue: 0
  })
  
  const [form, setForm] = useState({
    name: '',
    membership_type: 'basic',
    price: '',
    duration_months: 1,
    features: '',
    is_active: true,
    max_freeze_days: 0,
    includes_pt: false,
    includes_diet_plan: false,
    includes_locker: false,
    guest_passes: 0,
    discount_percent: 0
  })

  const loadPlans = async (force = false) => {
    if (loaded && !force) return;
    
    try {
      setLoading(true)
      const res = await adminApi.getMembershipPlans()
      const plansData = res.data.membership_plans || []
      setPlans(plansData)
      setLoaded(true)
      
      const activePlans = plansData.filter(p => p.is_active !== false)
      setStats({
        totalPlans: plansData.length,
        activePlans: activePlans.length,
        totalSubscribers: plansData.reduce((acc, p) => acc + (p.subscribers_count || 0), 0),
        monthlyRevenue: plansData.reduce((acc, p) => acc + ((p.subscribers_count || 0) * (p.price || 0)), 0)
      })

      // Load expiring memberships
      loadExpiringMembers()
    } catch (err) {
      console.error(err)
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Try again.')
      } else {
        toast.error(err.message || 'Failed to load membership plans')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadExpiringMembers = async () => {
    try {
      const res = await adminApi.getMembers()
      const members = res.data.members || []
      
      // Filter members whose membership expires within 7 days
      const today = new Date()
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(today.getDate() + 7)
      
      const expiring = members.filter(member => {
        if (!member.membership_end_date) return false
        const endDate = new Date(member.membership_end_date)
        return endDate >= today && endDate <= sevenDaysFromNow
      })
      
      setExpiringMembers(expiring)
      if (expiring.length > 0) {
        setShowExpiryAlert(true)
      }
    } catch (err) {
      console.error('Failed to load expiring members:', err)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const resetForm = () => {
    setForm({
      name: '',
      membership_type: 'basic',
      price: '',
      duration_months: 1,
      features: '',
      is_active: true,
      max_freeze_days: 0,
      includes_pt: false,
      includes_diet_plan: false,
      includes_locker: false,
      guest_passes: 0,
      discount_percent: 0
    })
    setEditingPlan(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast.error('Name and price are required')
      return
    }
    
    let featuresArray = form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : []
    if (form.includes_pt) featuresArray.push('Personal Training Sessions')
    if (form.includes_diet_plan) featuresArray.push('Custom Diet Plan')
    if (form.includes_locker) featuresArray.push('Personal Locker')
    if (form.guest_passes > 0) featuresArray.push(`${form.guest_passes} Guest Passes/Month`)
    if (form.max_freeze_days > 0) featuresArray.push(`${form.max_freeze_days} Days Freeze Allowed`)
    
    // Only send allowed fields to backend
    const payload = {
      name: form.name,
      membership_type: form.membership_type,
      price: Number(form.price),
      duration_months: Number(form.duration_months),
      features: featuresArray.join(', '),
      is_active: form.is_active
    }
    
    try {
      if (editingPlan) {
        await adminApi.updateMembershipPlan(editingPlan.id, payload)
        toast.success('Membership plan updated')
      } else {
        await adminApi.createMembershipPlan(payload)
        toast.success('Membership plan created')
      }
      resetForm()
      setShowForm(false)
      loadPlans()
    } catch (err) {
      console.error(err)
      toast.error(editingPlan ? 'Failed to update plan' : 'Failed to create plan')
    }
  }

  const handleEdit = (plan) => {
    setForm({
      name: plan.name || '',
      membership_type: plan.membership_type || 'basic',
      price: plan.price?.toString() || '',
      duration_months: plan.duration_months || 1,
      features: plan.features || '',
      is_active: plan.is_active !== false,
      max_freeze_days: plan.max_freeze_days || 0,
      includes_pt: plan.features?.includes('Personal Training') || false,
      includes_diet_plan: plan.features?.includes('Diet Plan') || false,
      includes_locker: plan.features?.includes('Locker') || false,
      guest_passes: plan.guest_passes || 0,
      discount_percent: plan.discount_percent || 0
    })
    setEditingPlan(plan)
    setShowForm(true)
  }

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return
    try {
      await adminApi.deleteMembershipPlan(planId)
      toast.success('Plan deleted successfully!')
      loadPlans(true)
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete plan'
      toast.error(errorMsg)
    }
  }

  const getPlanIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'vip': return <Crown className="w-6 h-6" />
      case 'premium': return <Star className="w-6 h-6" />
      case 'pro': return <Zap className="w-6 h-6" />
      default: return <Shield className="w-6 h-6" />
    }
  }

  const getPlanGradient = (type) => {
    switch (type?.toLowerCase()) {
      case 'vip': return 'from-purple-500 to-pink-500'
      case 'premium': return 'from-yellow-500 to-orange-500'
      case 'pro': return 'from-blue-500 to-cyan-500'
      default: return 'from-emerald-500 to-teal-500'
    }
  }

  const getPlanBorder = (type) => {
    switch (type?.toLowerCase()) {
      case 'vip': return 'border-purple-200 hover:border-purple-400'
      case 'premium': return 'border-yellow-200 hover:border-yellow-400'
      case 'pro': return 'border-blue-200 hover:border-blue-400'
      default: return 'border-emerald-200 hover:border-emerald-400'
    }
  }

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || plan.membership_type === filterType
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Expiry Alert */}
      {expiringMembers.length > 0 && showExpiryAlert && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <button onClick={() => setShowExpiryAlert(false)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <CalendarX className="w-5 h-5" />
                Membership Expiry Alert
              </h3>
              <p className="text-white/90 mb-3 text-sm">
                {expiringMembers.length} member{expiringMembers.length > 1 ? 's have' : ' has'} membership{expiringMembers.length > 1 ? 's' : ''} expiring within the next 7 days
              </p>
              <div className="bg-white/10 rounded-xl p-3 max-h-32 overflow-y-auto backdrop-blur-sm">
                {expiringMembers.slice(0, 5).map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <span className="text-sm font-medium">{member.full_name || member.username}</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {new Date(member.membership_end_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {expiringMembers.length > 5 && (
                  <p className="text-xs text-white/70 text-center mt-2">
                    +{expiringMembers.length - 5} more members
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <Award className="w-8 h-8 text-orange-500" />
            Membership Plans
          </h2>
          <p className="text-gray-300 text-base mt-2 font-medium">Create and manage gym membership packages</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus className="w-5 h-5" />
          Create New Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100 font-medium">Total Plans</p>
              <p className="text-3xl font-bold mt-1">{stats.totalPlans}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100 font-medium">Active Plans</p>
              <p className="text-3xl font-bold mt-1">{stats.activePlans}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-100 font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold mt-1">{stats.totalSubscribers}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-100 font-medium">Monthly Revenue</p>
              <p className="text-3xl font-bold mt-1">₹{stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search plans..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            <option value="all">All Types</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredPlans.map((plan, index) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }} className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all ${getPlanBorder(plan.membership_type)} ${!plan.is_active && 'opacity-60'}`}>
              {/* Plan Header */}
              <div className={`bg-gradient-to-r ${getPlanGradient(plan.membership_type)} p-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">{getPlanIcon(plan.membership_type)}</div>
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <span className="text-xs font-medium uppercase tracking-wider opacity-90">{plan.membership_type}</span>
                    </div>
                  </div>
                  {plan.is_active === false && <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">Inactive</span>}
                </div>
              </div>

              {/* Plan Body */}
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">₹{(plan.price || 0).toLocaleString()}</span>
                    <span className="text-gray-500 text-sm">/{plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {(plan.features || 'No features specified').split(',').slice(0, 5).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature.trim()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b">
                  <Users className="w-4 h-4" />
                  <span>{plan.subscribers_count || 0} active subscribers</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(plan)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all">
                    <Edit2 className="w-4 h-4" />Edit
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPlans.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl shadow-xl p-12 text-center">
            <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No plans found</h3>
            <p className="text-gray-400 mb-4">Create your first membership plan to get started</p>
            <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all">
              <Plus className="w-4 h-4" />Create Plan
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Gold Membership" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type *</label>
                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.membership_type} onChange={(e) => setForm({ ...form, membership_type: e.target.value })}>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="number" className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2999" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months)</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="number" className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} min="1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
                    <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} min="0" max="100" placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Included Benefits</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" checked={form.includes_pt} onChange={(e) => setForm({ ...form, includes_pt: e.target.checked })} />
                      <span className="text-sm text-gray-700">Personal Training</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" checked={form.includes_diet_plan} onChange={(e) => setForm({ ...form, includes_diet_plan: e.target.checked })} />
                      <span className="text-sm text-gray-700">Diet Plan</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" checked={form.includes_locker} onChange={(e) => setForm({ ...form, includes_locker: e.target.checked })} />
                      <span className="text-sm text-gray-700">Personal Locker</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Passes / Month</label>
                    <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.guest_passes} onChange={(e) => setForm({ ...form, guest_passes: Number(e.target.value) })} min="0" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Freeze Days</label>
                    <input type="number" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" value={form.max_freeze_days} onChange={(e) => setForm({ ...form, max_freeze_days: Number(e.target.value) })} min="0" placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Features</label>
                  <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all" rows={3} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Enter features separated by commas (e.g., Pool access, Sauna, Group classes)" />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">{editingPlan ? 'Update Plan' : 'Create Plan'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MembershipPlans
