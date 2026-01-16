import { useEffect, useState, useCallback, useRef } from 'react'
import { messagingApi } from '../../../utils/api'
import { useTheme } from '../../../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, MessageCircle, Inbox, Mail, Users, User, Search, RefreshCw,
  Reply, ChevronDown, ChevronUp, Check, CheckCheck, Clock,
  X, MailOpen, MessageSquare, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function for case-insensitive role comparison
const isRole = (role, target) => role?.toUpperCase() === target.toUpperCase()
const isAdmin = (role) => isRole(role, 'ADMIN')
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

// Inbox Message Item component
const InboxMessageItem = ({ message, isDark, isExpanded, onToggleExpand, onReply }) => {
  const isLong = message.message?.length > 150
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 sm:p-5 transition-all ${
        !message.is_read 
          ? isDark ? 'bg-indigo-900/20' : 'bg-indigo-50/50' 
          : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md ${
          isAdmin(message.sender_role) ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-emerald-500 to-green-600'
        }`}>
          {message.sender_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{message.sender_name || 'Unknown'}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                isAdmin(message.sender_role) 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {message.sender_role}
              </span>
              {!message.is_read && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-medium rounded-full border border-indigo-500/30">
                  <MailOpen className="w-3 h-3" />
                  New
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              {formatDate(message.created_at)}
            </div>
          </div>
          <p className={`text-sm whitespace-pre-wrap ${!isExpanded && isLong ? 'line-clamp-2' : ''} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {message.message}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {isLong && (
              <button
                onClick={() => onToggleExpand(message.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
            <button
              onClick={() => onReply(message)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-medium transition-all shadow-md hover:shadow-lg"
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

const TrainerMessageBox = ({ trainees = [], onSelectConversation, selectedConversation: externalSelectedConversation }) => {
  const { isDark } = useTheme()
  const [conversations, setConversations] = useState([])
  const [contacts, setContacts] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('conversations')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedMessages, setExpandedMessages] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const messagesEndRef = useRef(null)
  
  // Stats
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  const adminMessages = conversations.filter(c => isAdmin(c.user_role)).length
  const traineeMessages = conversations.filter(c => isTrainee(c.user_role)).length

  const loadData = useCallback(async (force = false) => {
    try {
      setLoading(true)
      const [convRes, contactsRes] = await Promise.all([
        messagingApi.getConversations(),
        messagingApi.getContacts()
      ])
      setConversations(convRes.data?.conversations || [])
      setContacts(contactsRes.data?.contacts || [])
    } catch (err) {
      console.error('Failed to load messaging data:', err)
      if (err.code !== 'ECONNABORTED') {
        toast.error('Failed to load messages')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(), 15000) // Refresh every 15s
    return () => clearInterval(interval)
  }, [loadData])

  // Load messages for selected conversation
  const loadMessages = async (userId) => {
    try {
      setMessagesLoading(true)
      const res = await messagingApi.getMessages(userId)
      setMessages(res.data?.messages || [])
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      console.error('Failed to load messages:', err)
      toast.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  // Sync external selected conversation
  useEffect(() => {
    if (externalSelectedConversation) {
      setSelectedConversation(externalSelectedConversation)
      const userId = externalSelectedConversation.user_id || externalSelectedConversation.id
      if (userId) {
        loadMessages(userId)
      }
    }
  }, [externalSelectedConversation])

  // Select conversation
  const selectConversation = (contact) => {
    setSelectedConversation(contact)
    loadMessages(contact.user_id || contact.id)
    if (onSelectConversation) {
      onSelectConversation(contact)
    }
  }

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (!selectedConversation && !replyingTo) {
      toast.error('Please select a recipient')
      return
    }
    
    const recipientId = replyingTo?.sender_id || selectedConversation?.user_id || selectedConversation?.id
    
    try {
      setSending(true)
      await messagingApi.sendMessage({ 
        receiver_id: recipientId, 
        message: newMessage.trim() 
      })
      toast.success('Message sent!')
      setNewMessage('')
      setReplyingTo(null)
      loadData(true)
      if (selectedConversation) {
        loadMessages(recipientId)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleReply = (message) => {
    setReplyingTo(message)
    setActiveTab('compose')
    setNewMessage('')
  }

  const toggleExpand = (id) => {
    setExpandedMessages(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter contacts based on search
  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Combine trainees with contacts for the contact list
  const allContacts = [
    ...trainees.map(t => ({
      id: t.user_id || t.id,
      user_id: t.user_id || t.id,
      name: t.name || t.user?.name || 'Trainee',
      email: t.email || t.user?.email,
      role: 'TRAINEE',
      label: 'My Trainee',
      isTrainee: true
    })),
    ...contacts.filter(c => !trainees.some(t => (t.user_id || t.id) === c.id))
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className={`text-2xl sm:text-3xl font-bold flex items-center gap-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            Message Center
          </h2>
          <p className={`text-sm sm:text-base mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Chat with your trainees and admin
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300' 
              : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Unread</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{unreadCount}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
              unreadCount > 0 
                ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                : isDark ? 'bg-slate-700' : 'bg-gray-100'
            }`}>
              <MailOpen className={`w-5 h-5 sm:w-6 sm:h-6 ${unreadCount > 0 ? 'text-white' : isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.05 }} 
          className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Admin</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{adminMessages}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
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
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Trainees</p>
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
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700/50' 
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Chats</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{conversations.length}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Send className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 sm:gap-2 p-1.5 rounded-2xl w-fit shadow-lg border ${
        isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-gray-100 border-gray-200'
      }`}>
        {[
          { id: 'conversations', label: 'Conversations', icon: MessageCircle, count: conversations.length },
          { id: 'compose', label: 'New Message', icon: Send },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-[1.02]'
                : isDark 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && activeTab !== tab.id && (
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
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
              ? 'bg-indigo-900/30 border-indigo-700/50' 
              : 'bg-indigo-50 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'
            }`}>
              <Reply className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                Replying to {replyingTo.sender_name}
              </p>
              <p className={`text-xs truncate max-w-md ${isDark ? 'text-indigo-400/70' : 'text-indigo-600'}`}>
                "{replyingTo.message?.substring(0, 60)}..."
              </p>
            </div>
          </div>
          <button 
            onClick={() => setReplyingTo(null)} 
            className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-indigo-800/50' : 'hover:bg-indigo-100'}`}
          >
            <X className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </button>
        </motion.div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className={`rounded-2xl shadow-xl overflow-hidden border ${
          isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-gray-100'
        }`}>
          {/* Chat Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
            {/* Contacts List */}
            <div className={`border-r overflow-y-auto ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
              {/* My Trainees Section */}
              <div className={`p-3 border-b sticky top-0 z-10 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs font-semibold text-indigo-500 uppercase">My Trainees</p>
                </div>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Quick access to your trainees</p>
              </div>
              
              {trainees.length > 0 ? (
                trainees.map((trainee) => {
                  const conv = conversations.find(c => c.user_id === (trainee.user_id || trainee.id))
                  return (
                    <button
                      key={`trainee-${trainee.id}`}
                      onClick={() => selectConversation({
                        user_id: trainee.user_id || trainee.id,
                        user_name: trainee.name || trainee.user?.name || 'Trainee',
                        user_role: 'TRAINEE',
                        ...trainee
                      })}
                      className={`w-full p-3 flex items-center gap-3 hover:bg-opacity-80 transition-colors border-b ${
                        selectedConversation?.user_id === (trainee.user_id || trainee.id)
                          ? isDark ? 'bg-green-900/30 border-l-2 border-l-green-500 border-b-slate-700' : 'bg-green-50 border-l-2 border-l-green-500 border-b-gray-100'
                          : isDark ? 'hover:bg-slate-700/50 border-b-slate-700' : 'hover:bg-white border-b-gray-100'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(trainee.name || trainee.user?.name || 'T').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {trainee.name || trainee.user?.name || 'Trainee'}
                          </p>
                          {conv?.unread_count > 0 && (
                            <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {conv?.last_message || 'Start a conversation'}
                        </p>
                        <span className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                          Trainee
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-4 text-center">
                  <Users className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No trainees assigned</p>
                </div>
              )}

              {/* Other Conversations */}
              {conversations.filter(c => !trainees.some(t => (t.user_id || t.id) === c.user_id)).length > 0 && (
                <>
                  <div className={`p-3 border-b border-t sticky ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-indigo-400" />
                      <p className="text-xs font-semibold text-indigo-500 uppercase">Other Conversations</p>
                    </div>
                  </div>
                  {conversations
                    .filter(c => !trainees.some(t => (t.user_id || t.id) === c.user_id))
                    .map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-3 flex items-center gap-3 hover:bg-opacity-80 transition-colors border-b ${
                          selectedConversation?.user_id === conv.user_id
                            ? isDark ? 'bg-indigo-900/30 border-l-2 border-l-indigo-500 border-b-slate-700' : 'bg-indigo-50 border-l-2 border-l-indigo-500 border-b-gray-100'
                            : isDark ? 'hover:bg-slate-700/50 border-b-slate-700' : 'hover:bg-white border-b-gray-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                          isAdmin(conv.user_role) ? 'bg-gradient-to-br from-red-500 to-pink-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }`}>
                          {conv.user_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{conv.user_name}</p>
                            {conv.unread_count > 0 && (
                              <span className="w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {conv.last_message || 'No messages'}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 ${
                            isAdmin(conv.user_role)
                              ? 'text-red-500 bg-red-500/10'
                              : 'text-indigo-500 bg-indigo-500/10'
                          }`}>
                            {conv.user_role}
                          </span>
                        </div>
                      </button>
                    ))}
                </>
              )}

              {conversations.length === 0 && trainees.length === 0 && (
                <div className="p-6 text-center">
                  <Mail className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No conversations yet</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Start messaging your trainees or admin</p>
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className={`lg:col-span-2 flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        isAdmin(selectedConversation.user_role) 
                          ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                          : 'bg-gradient-to-br from-green-500 to-emerald-500'
                      }`}>
                        {(selectedConversation.user_name || selectedConversation.name)?.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedConversation.user_name || selectedConversation.name}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {selectedConversation.user_role || selectedConversation.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                          <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No messages yet</p>
                          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl ${
                            msg.is_mine
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                              : isDark
                                ? 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700'
                                : 'bg-white text-gray-700 rounded-bl-md shadow-sm border border-gray-200'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 ${msg.is_mine ? 'justify-end' : ''}`}>
                              <p className={`text-[10px] ${msg.is_mine ? 'text-indigo-200' : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                              {msg.is_mine && (
                                msg.is_read 
                                  ? <CheckCheck className="w-3 h-3 text-indigo-200" />
                                  : <Check className="w-3 h-3 text-indigo-200" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className={`p-4 border-t ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className={`flex-1 px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                          isDark 
                            ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                        }`}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {sending ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                    <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Select a conversation</p>
                    <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Choose a trainee or admin to chat with</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Contact Selection */}
          <div className={`rounded-2xl shadow-xl p-4 sm:p-6 border ${
            isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Recipient</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{allContacts.length} available</p>
              </div>
            </div>
            
            <div className="relative mb-4">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500'
                }`}
              />
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {allContacts.filter(c => 
                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(contact => (
                <button
                  key={contact.id}
                  onClick={() => {
                    setSelectedConversation({
                      user_id: contact.id,
                      user_name: contact.name,
                      user_role: contact.role
                    })
                    setReplyingTo(null)
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedConversation?.user_id === contact.id
                      ? isDark 
                        ? 'bg-indigo-900/50 border-2 border-indigo-500' 
                        : 'bg-indigo-50 border-2 border-indigo-500'
                      : isDark
                        ? 'hover:bg-slate-800 border-2 border-transparent'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    isAdmin(contact.role) 
                      ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                      : 'bg-gradient-to-br from-emerald-500 to-green-600'
                  }`}>
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.name}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {contact.label || contact.role}
                    </p>
                  </div>
                  {selectedConversation?.user_id === contact.id && (
                    <Check className="w-5 h-5 text-indigo-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Compose Message */}
          <div className={`lg:col-span-2 rounded-2xl shadow-xl p-4 sm:p-6 border ${
            isDark ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Write Message</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Compose your message below</p>
              </div>
            </div>
            
            {(selectedConversation || replyingTo) && (
              <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 border ${
                isDark 
                  ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700' 
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ${
                  isAdmin(replyingTo?.sender_role || selectedConversation?.user_role)
                    ? 'bg-gradient-to-br from-red-500 to-pink-600' 
                    : 'bg-gradient-to-br from-emerald-500 to-green-600'
                }`}>
                  {(replyingTo?.sender_name || selectedConversation?.user_name)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {replyingTo ? 'Reply to:' : 'To:'} {replyingTo?.sender_name || selectedConversation?.user_name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {replyingTo?.sender_role || selectedConversation?.user_role}
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
              </div>
            )}
            
            <form onSubmit={handleSend} className="space-y-4">
              <textarea
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[200px] resize-none transition-all ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500'
                }`}
                placeholder={selectedConversation || replyingTo ? 'Write your message...' : 'Select a recipient first...'}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!selectedConversation && !replyingTo}
              />
              <div className="flex items-center justify-between">
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{newMessage.length} characters</p>
                <button
                  type="submit"
                  disabled={sending || (!selectedConversation && !replyingTo) || !newMessage.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
    </div>
  )
}

export default TrainerMessageBox
