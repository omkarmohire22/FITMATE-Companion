import React, { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getNotifications();
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case 'payment': return 'text-sky-600 bg-sky-50';
      case 'payout': return 'text-green-600 bg-green-50';
      case 'message': return 'text-blue-600 bg-blue-50';
      case 'alert': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
            <p className="text-slate-400 text-sm">Stay updated with latest activities</p>
          </div>
        </div>
        <button
          onClick={loadNotifications}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n, idx) => (
              <li key={idx} className={`p-4 rounded-xl border border-gray-100 ${getTypeColor(n.type)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold">{n.message}</span>
                    <span className="block text-xs mt-1 opacity-70">{n.time}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
