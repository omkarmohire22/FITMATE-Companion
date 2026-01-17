import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, MessageCircle, DollarSign, AlertTriangle, User, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const AdminNotifications = () => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminApi.getNotifications();
      const notifs = res.data?.notifications || [];
      setNotifications(notifs);
      const newUnreadCount = res.data?.unread_count || notifs.filter(n => !n.is_read).length;
      setUnreadCount(newUnreadCount);
      
      // Update document title with unread count
      document.title = newUnreadCount > 0 
        ? `(${newUnreadCount}) Admin Notifications - FitMate`
        : 'Admin Notifications - FitMate';
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error('Failed to load notifications');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Setup auto-refresh
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadNotifications(true); // Silent refresh
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      document.title = 'FitMate'; // Reset title
    };
  }, [refreshInterval]);

  const markAsRead = async (notificationId) => {
    try {
      await adminApi.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        document.title = newCount > 0 
          ? `(${newCount}) Admin Notifications - FitMate`
          : 'Admin Notifications - FitMate';
        return newCount;
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      document.title = 'Admin Notifications - FitMate';
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment':
      case 'billing':
        return <DollarSign className="w-5 h-5" />;
      case 'message':
      case 'chat':
        return <MessageCircle className="w-5 h-5" />;
      case 'alert':
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'user':
      case 'trainee':
      case 'trainer':
        return <User className="w-5 h-5" />;
      case 'schedule':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type, isRead) => {
    const baseOpacity = isRead ? 'opacity-70' : '';
    switch (type) {
      case 'payment':
      case 'billing':
        return `${isDark ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-green-50 text-green-600 border-green-200'} ${baseOpacity}`;
      case 'message':
      case 'chat':
        return `${isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'} ${baseOpacity}`;
      case 'alert':
      case 'warning':
        return `${isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'} ${baseOpacity}`;
      case 'user':
      case 'trainee':
      case 'trainer':
        return `${isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-600 border-purple-200'} ${baseOpacity}`;
      case 'schedule':
        return `${isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-50 text-orange-600 border-orange-200'} ${baseOpacity}`;
      default:
        return `${isDark ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-50 text-gray-600 border-gray-200'} ${baseOpacity}`;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${autoRefresh ? (isDark ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-green-50 text-green-700 border border-green-200') : (isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="hidden sm:inline">Auto</span>
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Mark All Read</span>
                <span className="sm:hidden">All</span>
              </button>
            )}
            <button
              onClick={() => loadNotifications()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'read', label: 'Read', count: notifications.length - unreadCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === tab.id
                  ? 'bg-white/20 text-white'
                  : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className={`rounded-2xl border shadow-xl overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Bell className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <p className={`font-semibold text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {filter === 'all' ? "You're all caught up!" : 'Check other filters'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <ul className={`divide-y ${isDark ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                {filteredNotifications.map((n, idx) => (
                  <motion.li
                    key={n.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-4 sm:p-5 transition-all ${!n.is_read ? (isDark ? 'bg-sky-500/5' : 'bg-sky-50/50') : ''} ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${getTypeStyles(n.notification_type, n.is_read)}`}>
                        {getTypeIcon(n.notification_type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {n.title && (
                              <h3 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'} ${n.is_read ? 'opacity-70' : ''}`}>
                                {n.title}
                              </h3>
                            )}
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} ${n.is_read ? 'opacity-70' : ''}`}>
                              {n.message}
                            </p>
                            <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {formatTime(n.created_at)}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!n.is_read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-gray-600 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {!n.is_read && (
                              <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-pulse" title="Unread"></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
