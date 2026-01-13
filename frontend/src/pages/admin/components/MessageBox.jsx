import { useEffect, useState } from 'react'
import { adminApi } from '../../../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, MessageCircle, Inbox, Mail, Users, User, Search, RefreshCw,
  Reply, Trash2, ChevronDown, ChevronUp, Check, CheckCheck, Clock,
  Megaphone, X, Filter, MailOpen, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function for case-insensitive role comparison
const isRole = (role, target) => role?.toUpperCase() === target.toUpperCase()
const isTrainer = (role) => isRole(role, 'TRAINER')
const isTrainee = (role) => isRole(role, 'TRAINEE')

const MessageBox = () => {
  const [outbox, setOutbox] = useState([])
  const [inbox, setInbox] = useState([])
  const [users, setUsers] = useState([])
  const [text, setText] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState('compose')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedMessages, setExpandedMessages] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastTarget, setBroadcastTarget] = useState('all') // all, trainers, trainees
  const [filterRole, setFilterRole] = useState('all')

  const loadData = async (force = false) => {
    if (loaded && !force) return;
    
    try {
      setLoading(true)
      const [outboxRes, inboxRes, usersRes] = await Promise.all([
        adminApi.getOutbox(),
        adminApi.getMessages(),
        adminApi.getUsers()
      ])
      setOutbox(outboxRes.data?.messages || [])
      setInbox(inboxRes.data?.messages || [])
      const allUsers = usersRes.data?.users || []
      setUsers(allUsers.filter(u => isTrainer(u.role) || isTrainee(u.role)))
      setLoaded(true)
    } catch (err) {
      console.error(err)
      if (err.code === 'ECONNABORTED') {
        toast.error('Request timeout loading messages')
      } else {
        toast.error(err.message || 'Failed to load messages')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (!selectedUser && !replyingTo) {
      toast.error('Please select a recipient')
      return
    }
    
    const recipientId = replyingTo?.from_user?.id || selectedUser?.id
    const recipientName = replyingTo?.from_user?.name || selectedUser?.name
    
    try {
      setSending(true)
      await adminApi.sendMessage({ receiver_id: recipientId, message: text.trim() })
      toast.success(`Message sent to ${recipientName}`)
      setText('')
      setSelectedUser(null)
      setReplyingTo(null)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('Please enter a message')
      return
    }
    
    const targetUsers = users.filter(u => {
      if (broadcastTarget === 'all') return true
      if (broadcastTarget === 'trainers') return isTrainer(u.role)
      if (broadcastTarget === 'trainees') return isTrainee(u.role)
      return false
    })

    if (targetUsers.length === 0) {
      toast.error('No recipients found')
      return
    }

    try {
      setSending(true)
      let successCount = 0
      for (const user of targetUsers) {
        try {
          await adminApi.sendMessage({ receiver_id: user.id, message: text.trim() })
          successCount++
        } catch (err) {
          console.error(`Failed to send to ${user.name}`, err)
        }
      }
      toast.success(`Broadcast sent to ${successCount} ${broadcastTarget === 'all' ? 'users' : broadcastTarget}`)
      setText('')
      setShowBroadcast(false)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  const handleReply = (message) => {
    setReplyingTo(message)
    setActiveTab('compose')
    setText('')
  }

  const toggleExpand = (id) => {
    setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || isRole(u.role, filterRole)
    return matchesSearch && matchesRole
  })

  // Stats
  const unreadCount = inbox.filter(m => !m.is_read).length
  const trainerMessages = inbox.filter(m => isTrainer(m.from_user?.role)).length
  const traineeMessages = inbox.filter(m => isTrainee(m.from_user?.role)).length

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <MessageCircle className="w-8 h-8 text-orange-500" />
            Message Center
          </h2>
          <p className="text-gray-300 text-base mt-2 font-medium">
            Communicate with trainers and trainees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcast(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Megaphone className="w-4 h-4" />
            Broadcast
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-100">Unread</p>
              <p className="text-2xl font-bold mt-1">{unreadCount}</p>
            </div>
            <MailOpen className="w-8 h-8 text-orange-200 opacity-70" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100">From Trainers</p>
              <p className="text-2xl font-bold mt-1">{trainerMessages}</p>
            </div>
            <User className="w-8 h-8 text-blue-200 opacity-70" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-100">From Trainees</p>
              <p className="text-2xl font-bold mt-1">{traineeMessages}</p>
            </div>
            <Users className="w-8 h-8 text-green-200 opacity-70" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl shadow-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-300">Total Sent</p>
              <p className="text-2xl font-bold mt-1">{outbox.length}</p>
            </div>
            <Send className="w-8 h-8 text-gray-400 opacity-70" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gradient-to-r from-gray-800 to-gray-900 p-1.5 rounded-2xl w-fit shadow-xl border border-white/10">
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
          { id: 'outbox', label: 'Sent', icon: Mail, count: outbox.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setReplyingTo(null) }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-[1.02]'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id ? 'bg-white/20' : tab.id === 'inbox' && unreadCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reply Banner */}
      {replyingTo && activeTab === 'compose' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Reply className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-800">Replying to {replyingTo.from_user?.name}</p>
              <p className="text-xs text-blue-600 truncate max-w-md">"{replyingTo.message?.substring(0, 60)}..."</p>
            </div>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-blue-100 rounded-lg transition-all">
            <X className="w-4 h-4 text-blue-500" />
          </button>
        </motion.div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Selection */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Select Recipient</h3>
                  <p className="text-xs text-gray-500">{filteredUsers.length} available</p>
                </div>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                <option value="all">All</option>
                <option value="trainer">Trainers</option>
                <option value="trainee">Trainees</option>
              </select>
            </div>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setSelectedUser(user); setReplyingTo(null) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedUser?.id === user.id
                        ? 'bg-orange-100 border-2 border-orange-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isTrainer(user.role) ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                    }`}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                        {isTrainer(user.role) ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {user.role}
                      </p>
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="w-5 h-5 text-orange-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Compose */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Write Message</h3>
                <p className="text-xs text-gray-500">Compose your message below</p>
              </div>
            </div>
            
            {(selectedUser || replyingTo) && (
              <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl flex items-center gap-3 border border-orange-100">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  (replyingTo?.from_user?.role || selectedUser?.role) === 'trainer' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                }`}>
                  {(replyingTo?.from_user?.name || selectedUser?.name)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {replyingTo ? 'Reply to:' : 'To:'} {replyingTo?.from_user?.name || selectedUser?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {replyingTo?.from_user?.email || selectedUser?.email} • {replyingTo?.from_user?.role || selectedUser?.role}
                  </p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSend} className="space-y-4">
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[200px] resize-none"
                placeholder={selectedUser || replyingTo ? `Write your message...` : 'Select a recipient first...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!selectedUser && !replyingTo}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{text.length} characters</p>
                <button
                  type="submit"
                  disabled={sending || (!selectedUser && !replyingTo) || !text.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {replyingTo ? 'Send Reply' : 'Send Message'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Received Messages</h3>
                  <p className="text-xs text-gray-600">{inbox.length} total messages</p>
                </div>
                {unreadCount > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {inbox.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No messages yet</h4>
                <p className="text-sm text-gray-300">Messages from trainers and trainees will appear here</p>
              </div>
            ) : (
              inbox.map((m, idx) => {
                const isExpanded = expandedMessages[m.id]
                const isLong = m.message?.length > 150
                
                return (
                  <motion.div
                    key={m.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-5 hover:bg-gray-50 transition-all ${!m.is_read ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                        isTrainer(m.from_user?.role) ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {m.from_user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{m.from_user?.name || 'Unknown'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                              isTrainer(m.from_user?.role) ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {m.from_user?.role}
                            </span>
                            {!m.is_read && (
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatDate(m.created_at)}
                          </div>
                        </div>
                        <p className={`text-sm text-gray-600 whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                          {m.message}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          {isLong && (
                            <button
                              onClick={() => toggleExpand(m.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          )}
                          <button
                            onClick={() => handleReply(m)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-medium transition-all"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Outbox Tab */}
      {activeTab === 'outbox' && (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Sent Messages</h3>
                <p className="text-xs text-gray-600">{outbox.length} total sent</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {outbox.length === 0 ? (
              <div className="text-center py-16">
                <Send className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No sent messages</h4>
                <p className="text-sm text-gray-300">Messages you send will appear here</p>
              </div>
            ) : (
              outbox.map((m, idx) => {
                const isExpanded = expandedMessages[`out-${m.id}`]
                const isLong = m.message?.length > 150
                
                return (
                  <motion.div
                    key={m.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-5 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                        isTrainer(m.to_user?.role) ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {m.to_user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">To: {m.to_user?.name || 'Unknown'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                              isTrainer(m.to_user?.role) ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {m.to_user?.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-xs ${m.is_read ? 'text-green-600' : 'text-gray-400'}`}>
                              {m.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                              {m.is_read ? 'Read' : 'Delivered'}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(m.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm text-gray-600 whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                          {m.message}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(`out-${m.id}`)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2"
                          >
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-purple-500" />
                    Broadcast Message
                  </h3>
                  <button onClick={() => setShowBroadcast(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleBroadcast} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'Everyone', count: users.length },
                      { id: 'trainers', label: 'Trainers', count: users.filter(u => isTrainer(u.role)).length },
                      { id: 'trainees', label: 'Trainees', count: users.filter(u => isTrainee(u.role)).length },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBroadcastTarget(opt.id)}
                        className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          broadcastTarget === opt.id
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {opt.label}
                        <span className="block text-xs mt-0.5 opacity-70">{opt.count} recipients</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[150px] resize-none"
                    placeholder="Type your broadcast message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    This will send a message to all {broadcastTarget === 'all' ? 'users' : broadcastTarget}. 
                    Make sure your message is appropriate for everyone.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcast(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Megaphone className="w-4 h-4" />
                        Send Broadcast
                      </>
                    )}
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

export default MessageBox
