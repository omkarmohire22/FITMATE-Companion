import { useEffect, useState, useCallback, useRef } from 'react'
import { adminApi } from '../../../utils/api'
import { useTheme } from '../../../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, MessageCircle, Inbox, Mail, Users, User, Search, RefreshCw,
  Reply, Trash2, ChevronDown, ChevronUp, Check, CheckCheck, Clock,
  Megaphone, X, Filter, MailOpen, AlertCircle, MessageSquare, UserCheck, Bell, Eye, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function for case-insensitive role comparison
const isRole = (role, target) => role?.toUpperCase() === target.toUpperCase()
const isTrainer = (role) => isRole(role, 'TRAINER')
const isTrainee = (role) => isRole(role, 'TRAINEE')

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Inbox Message Item component with auto mark-as-read on view
const InboxMessageItem = ({ message, isDark, isExpanded, onToggleExpand, onReply, onMarkAsRead }) => {
  const messageRef = useRef(null)
  const hasMarkedRef = useRef(false)
  
  useEffect(() => {
    // Only observe if message is unread
    if (message.is_read || hasMarkedRef.current) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !message.is_read && !hasMarkedRef.current) {
            hasMarkedRef.current = true
            // Small delay to ensure the user actually saw it
            setTimeout(() => {
              onMarkAsRead(message.id)
            }, 500)
          }
        })
      },
      { threshold: 0.5 } // 50% of message must be visible
    )
    
    if (messageRef.current) {
      observer.observe(messageRef.current)
    }
    
    return () => observer.disconnect()
  }, [message.id, message.is_read, onMarkAsRead])
  
  const isLong = message.message?.length > 150
  
  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 sm:p-5 transition-all ${
        !message.is_read 
          ? isDark ? 'bg-sky-900/20' : 'bg-sky-50/50' 
          : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md ${
          isTrainer(message.from_user?.role) ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
        }`}>
          {message.from_user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{message.from_user?.name || 'Unknown'}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                isTrainer(message.from_user?.role) 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {message.from_user?.role}
              </span>
              {!message.is_read && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-medium rounded-full border border-sky-500/30">
                  <Eye className="w-3 h-3" />
                  New
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              {formatDate(message.created_at)}
            </div>
          </div>
          <p className={`text-sm whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2' : ''} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {message.message}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {isLong && (
              <button
                onClick={() => onToggleExpand(message.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
            <button
              onClick={() => onReply(message)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const MessageBox = () => {
  const { isDark } = useTheme()
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
  
  // Ref to track which messages have been marked as read (to avoid duplicate API calls)
  // This ref tracks message IDs currently being processed to prevent duplicate API calls
  const markedAsReadRef = useRef(new Set())

  // Stats computed from state
  const unreadCount = inbox.filter(m => !m.is_read).length
  const trainerMessages = inbox.filter(m => isTrainer(m.from_user?.role)).length
  const traineeMessages = inbox.filter(m => isTrainee(m.from_user?.role)).length

  const loadData = useCallback(async (force = false) => {
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
      
      // IMPORTANT: Clear the markedAsReadRef when data is reloaded from backend
      // This ensures we trust the backend's read status instead of stale local state
      markedAsReadRef.current.clear()
      
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
  }, [loaded])

  useEffect(() => {
    loadData()
  }, [])

  // Mark all messages as read when switching to inbox tab
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId)
    setReplyingTo(null)
  }

  /**
   * Mark a single message as read.
   * 
   * How it works:
   * 1. Checks if message is already unread (if not, skip)
   * 2. Adds to markedAsReadRef to prevent duplicate API calls
   * 3. Makes API call to backend to mark as read (sets is_read=true and read_at timestamp)
   * 4. Updates local state only AFTER successful API call
   * 5. If API fails, removes from markedAsReadRef so it can be retried
   * 
   * @param {number} messageId - The ID of the message to mark as read
   */
  const markMessageAsRead = useCallback(async (messageId) => {
    // Skip if already marked or being marked
    if (markedAsReadRef.current.has(messageId)) return
    
    // Find the message to check if it's unread
    const message = inbox.find(m => m.id === messageId)
    if (!message || message.is_read) return  // Already read, skip
    
    // Add to set immediately to prevent duplicate API calls
    markedAsReadRef.current.add(messageId)
    
    try {
      // Make API call to backend - this persists to database
      await adminApi.markMessageRead(messageId)
      
      // Update local state ONLY after successful backend operation
      setInbox(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() } 
          : msg
      ))
    } catch (err) {
      // Remove from set on error so it can be retried on next attempt
      markedAsReadRef.current.delete(messageId)
      console.error('Failed to mark message as read:', err)
    }
  }, [inbox])

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
      loadData(true)  // Force reload to get fresh data
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
      loadData(true)  // Force reload to get fresh data
    } catch (err) {
      console.error(err)
      toast.error('Broadcast failed')
    } finally {
      setSending(false)
    }
  }

  const handleReply = (message) => {
    // Mark as read when replying
    if (!message.is_read) {
      markMessageAsRead(message.id)
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold flex items-center gap-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Message Center
          </h2>
          <p className={`text-sm sm:text-base mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Communicate with trainers and trainees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcast(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300' 
                : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm'
            }`}
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-gray-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unread</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{unreadCount}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
              unreadCount > 0 
                ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                : isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <MailOpen className={`w-5 h-5 sm:w-6 sm:h-6 ${unreadCount > 0 ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-orange-500">
              <Bell className="w-3 h-3" />
              <span>New messages</span>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.05 }} 
          className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-gray-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>From Trainers</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{trainerMessages}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-gray-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>From Trainees</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{traineeMessages}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.15 }} 
          className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-gray-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Sent</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{outbox.length}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Send className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 sm:gap-2 p-1.5 rounded-2xl w-fit shadow-lg border ${
        isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-gray-100 border-gray-200'
      }`}>
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount, showBadge: unreadCount > 0 },
          { id: 'outbox', label: 'Sent', icon: Mail, count: outbox.length, showBadge: false },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg scale-[1.02]'
                : isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.showBadge && tab.count > 0 && (
              <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                activeTab === tab.id 
                  ? 'bg-white/20' 
                  : 'bg-red-500 text-white animate-pulse'
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
          className={`rounded-xl p-4 flex items-center justify-between border ${
            isDark 
              ? 'bg-sky-900/30 border-sky-700/50' 
              : 'bg-sky-50 border-sky-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-sky-900/50' : 'bg-sky-100'
            }`}>
              <Reply className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-sky-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                Replying to {replyingTo.from_user?.name}
              </p>
              <p className={`text-xs truncate max-w-md ${isDark ? 'text-indigo-400/70' : 'text-sky-600'}`}>
                "{replyingTo.message?.substring(0, 60)}..."
              </p>
            </div>
          </div>
          <button 
            onClick={() => setReplyingTo(null)} 
            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-indigo-800/50' : 'hover:bg-indigo-100'}`}
          >
            <X className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-sky-600'}`} />
          </button>
        </motion.div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* User Selection */}
          <div className={`rounded-2xl shadow-xl p-4 sm:p-6 border ${
            isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Recipient</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{filteredUsers.length} available</p>
                </div>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className={`text-xs border rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-sky-500 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="all">All</option>
                <option value="trainer">Trainers</option>
                <option value="trainee">Trainees</option>
              </select>
            </div>
            
            <div className="relative mb-4">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-sky-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-sky-500'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="max-h-[350px] overflow-y-auto space-y-1 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setSelectedUser(user); setReplyingTo(null) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedUser?.id === user.id
                        ? isDark 
                          ? 'bg-sky-900/50 border-2 border-sky-500' 
                          : 'bg-sky-50 border-2 border-sky-500'
                        : isDark
                          ? 'hover:bg-gray-800 border-2 border-transparent'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isTrainer(user.role) ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
                    }`}>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                      <p className={`text-xs capitalize flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isTrainer(user.role) ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {user.role}
                      </p>
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="w-5 h-5 text-indigo-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Compose */}
          <div className={`lg:col-span-2 rounded-2xl shadow-xl p-4 sm:p-6 border ${
            isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Write Message</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Compose your message below</p>
              </div>
            </div>
            
            {(selectedUser || replyingTo) && (
              <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 border ${
                isDark 
                  ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-gray-700' 
                  : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-sky-100'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${
                  isTrainer(replyingTo?.from_user?.role || selectedUser?.role) 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-emerald-500 to-green-600'
                }`}>
                  {(replyingTo?.from_user?.name || selectedUser?.name)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {replyingTo ? 'Reply to:' : 'To:'} {replyingTo?.from_user?.name || selectedUser?.name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {replyingTo?.from_user?.email || selectedUser?.email} • {replyingTo?.from_user?.role || selectedUser?.role}
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
            )}
            
            <form onSubmit={handleSend} className="space-y-4">
              <textarea
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[200px] resize-none transition-all ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-sky-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-sky-500'
                }`}
                placeholder={selectedUser || replyingTo ? `Write your message...` : 'Select a recipient first...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!selectedUser && !replyingTo}
              />
              <div className="flex items-center justify-between">
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{text.length} characters</p>
                <button
                  type="submit"
                  disabled={sending || (!selectedUser && !replyingTo) || !text.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
        <div className={`rounded-2xl shadow-xl overflow-hidden border ${
          isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-100'
        }`}>
          <div className={`p-4 sm:p-6 border-b ${
            isDark ? 'border-gray-700/50 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Inbox className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Received Messages</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{inbox.length} total messages</p>
                </div>
              </div>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full animate-pulse shadow-lg">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
          
          <div className={`divide-y max-h-[600px] overflow-y-auto custom-scrollbar ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
            {inbox.length === 0 ? (
              <div className="text-center py-16">
                <Inbox className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-200'}`} />
                <h4 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No messages yet</h4>
                <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>Messages from trainers and trainees will appear here</p>
              </div>
            ) : (
              inbox.map((m, idx) => (
                <InboxMessageItem
                  key={m.id || idx}
                  message={m}
                  isDark={isDark}
                  isExpanded={expandedMessages[m.id]}
                  onToggleExpand={toggleExpand}
                  onReply={handleReply}
                  onMarkAsRead={markMessageAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Outbox Tab */}
      {activeTab === 'outbox' && (
        <div className={`rounded-2xl shadow-xl overflow-hidden border ${
          isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white border-gray-100'
        }`}>
          <div className={`p-4 sm:p-6 border-b ${
            isDark ? 'border-gray-700/50 bg-gradient-to-r from-slate-800 to-slate-900' : 'border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Sent Messages</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{outbox.length} total sent</p>
              </div>
            </div>
          </div>
          
          <div className={`divide-y max-h-[600px] overflow-y-auto custom-scrollbar ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
            {outbox.length === 0 ? (
              <div className="text-center py-16">
                <Send className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-200'}`} />
                <h4 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No sent messages</h4>
                <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>Messages you send will appear here</p>
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
                    className={`p-4 sm:p-5 transition-all ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md ${
                        isTrainer(m.to_user?.role) ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
                      }`}>
                        {m.to_user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>To: {m.to_user?.name || 'Unknown'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                              isTrainer(m.to_user?.role) 
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {m.to_user?.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-xs ${m.is_read ? 'text-emerald-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {m.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                              {m.is_read ? 'Read' : 'Delivered'}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3" />
                              {formatDate(m.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2' : ''} ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {m.message}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(`out-${m.id}`)}
                            className={`flex items-center gap-1 text-xs mt-2 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowBroadcast(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}
            >
              <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    Broadcast Message
                  </h3>
                  <button 
                    onClick={() => setShowBroadcast(false)} 
                    className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleBroadcast} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Send To</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'Everyone', count: users.length, color: 'violet' },
                      { id: 'trainers', label: 'Trainers', count: users.filter(u => isTrainer(u.role)).length, color: 'blue' },
                      { id: 'trainees', label: 'Trainees', count: users.filter(u => isTrainee(u.role)).length, color: 'emerald' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBroadcastTarget(opt.id)}
                        className={`flex-1 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          broadcastTarget === opt.id
                            ? isDark 
                              ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                              : 'border-purple-500 bg-purple-50 text-purple-700'
                            : isDark
                              ? 'border-gray-700 hover:border-gray-600 text-gray-400'
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
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
                  <textarea
                    className={`w-full rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[150px] resize-none transition-all ${
                      isDark 
                        ? 'bg-gray-800/50 border border-gray-700 text-white placeholder-slate-500'
                        : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    placeholder="Type your broadcast message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>

                <div className={`p-3 rounded-xl border flex items-start gap-2 ${
                  isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-100'
                }`}>
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    This will send a message to all {broadcastTarget === 'all' ? 'users' : broadcastTarget}. 
                    Make sure your message is appropriate for everyone.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcast(false)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
