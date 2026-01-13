import { useEffect, useState } from 'react'
import { adminApi } from '../../../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Edit, Trash2, Search, Filter, Lock, Unlock, 
  Mail, Phone, Calendar, CheckCircle, XCircle, Eye, 
  Plus, AlertCircle, RefreshCw 
} from 'lucide-react'
import toast from 'react-hot-toast'

const UsersManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedUser, setExpandedUser] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState(new Set())

  const loadUsers = async (force = false) => {
    if (loaded && !force) return;
    
    try {
      setLoading(true)
      const res = await adminApi.getUsers()
      setUsers(res.data.users || [])
      setLoaded(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout. Try again.')
      } else {
        toast.error(err.message || 'Failed to load users')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active
      await adminApi.updateUser(user.id, { is_active: newStatus })
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`)
      loadUsers()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update user status')
    }
  }

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId)
    
    // Prevent deletion of admin users
    if (userToDelete?.role?.toUpperCase() === 'ADMIN') {
      toast.error('Cannot delete admin users')
      return
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      await adminApi.deleteUser(userId)
      toast.success('User deleted successfully')
      loadUsers()
    } catch (err) {
      console.error("Delete User Error:", err)
      
      const msg =
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        err.message ||
        'Failed to delete user'
      
      toast.error(msg)
    }
  }

  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || u.role?.toUpperCase() === filterRole.toUpperCase()
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? u.is_active : !u.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Calculate stats
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role?.toUpperCase() === 'ADMIN').length
  const trainerCount = users.filter(u => u.role?.toUpperCase() === 'TRAINER').length
  const traineeCount = users.filter(u => u.role?.toUpperCase() === 'TRAINEE').length
  const activeCount = users.filter(u => u.is_active).length

  const getRoleColor = (role) => {
    const upper = role?.toUpperCase()
    switch (upper) {
      case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200'
      case 'TRAINER': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'TRAINEE': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-sky-400" />
            System Users
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage all admin, trainer, and trainee accounts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4">
          <p className="text-xs text-slate-400 font-medium">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{totalUsers}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-red-500/40 shadow-lg p-4">
          <p className="text-xs text-red-400 font-medium">Admins</p>
          <p className="text-2xl font-bold text-white mt-1">{adminCount}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-blue-500/40 shadow-lg p-4">
          <p className="text-xs text-blue-400 font-medium">Trainers</p>
          <p className="text-2xl font-bold text-white mt-1">{trainerCount}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-emerald-500/40 shadow-lg p-4">
          <p className="text-xs text-emerald-400 font-medium">Trainees</p>
          <p className="text-2xl font-bold text-white mt-1">{traineeCount}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-green-500/40 shadow-lg p-4">
          <p className="text-xs text-green-400 font-medium">Active</p>
          <p className="text-2xl font-bold text-white mt-1">{activeCount}</p>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="trainee">Trainee</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={loadUsers} className="p-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/60 transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-700/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700/50 border-b border-slate-700">
              <tr>
                <th className="py-4 px-6 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
                      } else {
                        setSelectedUsers(new Set())
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600"
                  />
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">User</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Joined</th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              <AnimatePresence>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, index) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(u.id)}
                          onChange={() => handleSelectUser(u.id)}
                          className="w-4 h-4 rounded border-slate-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            u.role?.toUpperCase() === 'ADMIN' ? 'bg-red-500' :
                            u.role?.toUpperCase() === 'TRAINER' ? 'bg-blue-500' :
                            'bg-emerald-500'
                          }`}>
                            {(u.name || 'U')[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase border ${getRoleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {u.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400">Inactive</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-sky-400"
                          >
                            {u.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-blue-400"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.role?.toUpperCase() === 'ADMIN'}
                            title={u.role?.toUpperCase() === 'ADMIN' ? 'Cannot delete admin users' : 'Delete user'}
                            className={`p-2 rounded-lg transition-colors ${
                              u.role?.toUpperCase() === 'ADMIN'
                                ? 'text-slate-500 cursor-not-allowed opacity-50'
                                : 'hover:bg-red-900/30 text-red-400 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-500" />
                        <p className="text-slate-400">No users found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable User Details */}
      <AnimatePresence>
        {expandedUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/60 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-slate-700/50"
          >
            {users.find(u => u.id === expandedUser) && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">User Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase">Full Name</label>
                    <p className="text-white mt-1">{users.find(u => u.id === expandedUser)?.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase">Email</label>
                    <p className="text-white mt-1 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-sky-400" />
                      {users.find(u => u.id === expandedUser)?.email}
                    </p>
                  </div>
                  {users.find(u => u.id === expandedUser)?.phone && (
                    <div>
                      <label className="text-xs text-slate-400 font-semibold uppercase">Phone</label>
                      <p className="text-white mt-1 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-sky-400" />
                        {users.find(u => u.id === expandedUser)?.phone}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase">Role</label>
                    <p className="text-white mt-1">{users.find(u => u.id === expandedUser)?.role}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UsersManagement
