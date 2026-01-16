import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, BellRing, X, Inbox, MessageCircle, Calendar, 
  CheckCircle, AlertCircle, Mail, ArrowRight, RefreshCw,
  User, Users, Clock
} from 'lucide-react'
import { messagingApi, trainerDashboardApi } from '../../../utils/api'
import { useTheme } from '../../../contexts/ThemeContext'

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'Just now'
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

const TrainerNotifications = ({ 
  onViewAllMessages, 
  onSelectConversation,
  trainees = []
}) => {
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all') // all, messages, schedule, system
  const notificationRef = useRef(null)

  // Load notifications and conversations
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const [convRes, unreadRes, notifRes] = await Promise.all([
        messagingApi.getConversations(),
        messagingApi.getUnreadCount(),
        trainerDashboardApi.getNotifications(false).catch(() => ({ data: { notifications: [] } }))
      ])
      
      const convs = convRes.data?.conversations || []
      const notifs = notifRes.data?.notifications || []
      
      // Combine conversations with unread messages into notifications
      const messageNotifs = convs
        .filter(c => c.unread_count > 0)
        .map(c => ({
          id: `msg-${c.user_id}`,
          type: 'message',
          title: `New message from ${c.user_name}`,
          message: c.last_message,
          user_id: c.user_id,
          user_name: c.user_name,
          user_role: c.user_role,
          unread_count: c.unread_count,
          created_at: c.last_message_time,
          importance: 'normal'
        }))
      
      // Combine all notifications
      const allNotifications = [
        ...messageNotifs,
        ...notifs.map(n => ({
          ...n,
          type: n.type || 'system'
        }))
      ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      
      setNotifications(allNotifications)
      setConversations(convs)
      setUnreadCount(unreadRes.data?.unread_count || 0)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.type === 'message' && onSelectConversation) {
      onSelectConversation({
        user_id: notification.user_id,
        user_name: notification.user_name,
        user_role: notification.user_role
      })
    }
    setIsOpen(false)
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'messages') return n.type === 'message'
    if (activeFilter === 'schedule') return n.type === 'schedule' || n.type === 'session'
    if (activeFilter === 'system') return n.type === 'system' || n.type === 'general'
    return true
  })

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return MessageCircle
      case 'schedule': 
      case 'session': return Calendar
      case 'trainee': return Users
      default: return AlertCircle
    }
  }

  // Get color for notification type
  const getNotificationColor = (type, importance) => {
    if (importance === 'critical') return 'from-red-500 to-red-600'
    if (importance === 'important') return 'from-orange-500 to-amber-500'
    switch (type) {
      case 'message': return 'from-indigo-500 to-purple-600'
      case 'schedule':
      case 'session': return 'from-sky-500 to-blue-600'
      case 'trainee': return 'from-green-500 to-emerald-600'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const totalUnread = unreadCount + notifications.filter(n => n.type !== 'message' && !n.is_read).length

  return (
    <div className="relative" ref={notificationRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) loadNotifications()
        }}
        className={`p-2 rounded-lg transition-colors relative ${
          isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
        }`}
      >
        <Bell className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`} />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg animate-pulse">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden z-50 ${
              isDark 
                ? 'bg-slate-900 border-slate-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BellRing className="w-5 h-5 text-indigo-500" />
                Notifications
                {totalUnread > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {totalUnread}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadNotifications}
                  disabled={loading}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className={`px-3 py-2 border-b flex gap-1 overflow-x-auto ${
              isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              {[
                { id: 'all', label: 'All' },
                { id: 'messages', label: 'Messages', count: unreadCount },
                { id: 'schedule', label: 'Schedule' },
                { id: 'system', label: 'System' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                    activeFilter === filter.id
                      ? 'bg-indigo-500 text-white'
                      : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeFilter === filter.id
                        ? 'bg-white/20'
                        : 'bg-red-500 text-white'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <RefreshCw className={`w-8 h-8 mx-auto mb-2 animate-spin ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Loading...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Inbox className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                  <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No notifications</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    {activeFilter === 'all' ? 'You\'re all caught up!' : `No ${activeFilter} notifications`}
                  </p>
                </div>
              ) : (
                <div className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                  {filteredNotifications.slice(0, 10).map((notification, idx) => {
                    const Icon = getNotificationIcon(notification.type)
                    const colorClass = getNotificationColor(notification.type, notification.importance)
                    
                    return (
                      <motion.div
                        key={notification.id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'
                        } ${notification.type === 'message' && notification.unread_count > 0 
                          ? isDark ? 'bg-indigo-900/20' : 'bg-indigo-50/50' 
                          : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 bg-gradient-to-br ${colorClass}`}>
                            {notification.type === 'message' 
                              ? notification.user_name?.charAt(0) || <Icon className="w-5 h-5" />
                              : <Icon className="w-5 h-5" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {notification.type === 'message' 
                                  ? notification.user_name 
                                  : notification.title || 'Notification'
                                }
                              </span>
                              <span className={`text-xs shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {notification.message || notification.last_message || 'New notification'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {notification.type === 'message' && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  notification.user_role === 'ADMIN'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                }`}>
                                  {notification.user_role}
                                </span>
                              )}
                              {notification.unread_count > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-medium border border-indigo-500/30">
                                  <Mail className="w-3 h-3" />
                                  {notification.unread_count} unread
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-4 py-3 border-t ${
              isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <button
                onClick={() => {
                  onViewAllMessages?.()
                  setIsOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                View all messages
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TrainerNotifications
