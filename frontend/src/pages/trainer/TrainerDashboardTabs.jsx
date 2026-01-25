/**
 * TRAINER DASHBOARD ENHANCEMENT FILE
 * This contains additional tab components for:
 * - Attendance Management (Enhanced)
 * 
 * Add these sections to your TrainerDashboard.jsx after the analytics section
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Zap, Users, Star, AlertTriangle, History, Check, X } from 'lucide-react';
import { DashboardCard, EmptyState } from '../../components/ui/DashboardComponents';
import { useTheme } from '../../contexts/ThemeContext';

// ===== ATTENDANCE TAB =====
export const AttendanceTabContent = ({ trainees, attendanceData, attendanceLoading, onMarkAttendance }) => {
  const { isDark } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, week, month
  const [expandedTrainee, setExpandedTrainee] = useState(null);

  // Calculate overall stats
  const overallStats = {
    totalTrainees: trainees.length,
    avgAttendance: trainees.length > 0
      ? Math.round(trainees.reduce((sum, t) => sum + (attendanceData[t.id]?.percentage || 0), 0) / trainees.length)
      : 0,
    perfectAttendance: trainees.filter(t => (attendanceData[t.id]?.percentage || 0) >= 90).length,
    atRisk: trainees.filter(t => (attendanceData[t.id]?.percentage || 0) < 70).length
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-700 bg-green-50';
    if (percentage >= 75) return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-700 bg-blue-50';
    if (percentage >= 60) return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-700 bg-yellow-50';
    return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-50';
  };

  const getAttendanceBadge = (percentage) => {
    if (percentage >= 90) return { label: 'Excellent', icon: '⭐' };
    if (percentage >= 75) return { label: 'Good', icon: '✓' };
    if (percentage >= 60) return { label: 'Fair', icon: '⚠' };
    return { label: 'At Risk', icon: '⚡' };
  };

  return (
    <motion.div
      key="attendance"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DashboardCard className={`p-6 transition-all border ${isDark ? 'bg-gradient-to-br from-blue-900/20 to-blue-900/40 border-blue-700/50' : 'bg-white border-blue-100 shadow-sm hover:shadow-md'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Trainees</p>
              <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-blue-300' : 'text-slate-900'}`}>{overallStats.totalTrainees}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Users className={`w-6 h-6 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className={`p-6 transition-all border ${isDark ? 'bg-gradient-to-br from-green-900/20 to-green-900/40 border-green-700/50' : 'bg-white border-green-100 shadow-sm hover:shadow-md'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg. Attendance</p>
              <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-green-300' : 'text-slate-900'}`}>{overallStats.avgAttendance}%</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <TrendingUp className={`w-6 h-6 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className={`p-6 transition-all border ${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-900/40 border-emerald-700/50' : 'bg-white border-emerald-100 shadow-sm hover:shadow-md'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Perfect (90%+)</p>
              <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-emerald-300' : 'text-slate-900'}`}>{overallStats.perfectAttendance}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
              <Star className={`w-6 h-6 transition-colors ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className={`p-6 transition-all border ${isDark ? 'bg-gradient-to-br from-orange-900/20 to-orange-900/40 border-orange-700/50' : 'bg-white border-orange-100 shadow-sm hover:shadow-md'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>At Risk (&lt;70%)</p>
              <p className={`text-3xl font-bold mt-1 transition-colors ${isDark ? 'text-orange-300' : 'text-slate-900'}`}>{overallStats.atRisk}</p>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
              <AlertTriangle className={`w-6 h-6 transition-colors ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Date & Filter Controls */}
      <DashboardCard className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className={`w-5 h-5 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-3 py-2 border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filterPeriod === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filterPeriod === 'month' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filterPeriod === 'week' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
            >
              This Week
            </button>
          </div>
        </div>
      </DashboardCard>

      {/* Trainees Attendance List */}
      <DashboardCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>Trainee Attendance</h3>
            <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mark attendance and track compliance</p>
          </div>
        </div>

        {attendanceLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <Zap className="w-8 h-8 text-primary-500" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {trainees.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Trainees"
                description="No trainees assigned yet. Attendance will appear here."
              />
            ) : (
              trainees.map((trainee, idx) => {
                const attendance = attendanceData[trainee.id] || {};
                const percentage = attendance.percentage || 0;
                const badge = getAttendanceBadge(percentage);
                const isExpanded = expandedTrainee === trainee.id;

                return (
                  <motion.div
                    key={trainee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group"
                  >
                    <div className={`rounded-xl p-6 border transition-all cursor-pointer ${getAttendanceColor(percentage)} border-current/20`}>
                      <div
                        className="flex items-center justify-between"
                        onClick={() => setExpandedTrainee(isExpanded ? null : trainee.id)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {(trainee.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{trainee.name || 'Unknown'}</h4>
                            <p className={`text-sm transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trainee.email || 'No email'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className={`text-3xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{percentage}%</p>
                            <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{badge.icon} {badge.label}</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-6 pt-6 border-t border-current/20"
                        >
                          <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className={`rounded-xl p-4 text-center transition-colors border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>TOTAL DAYS</p>
                              <p className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {attendance.total_days || 0}
                              </p>
                            </div>
                            <div className={`rounded-xl p-4 text-center transition-colors border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>PRESENT</p>
                              <p className="text-2xl font-bold text-green-500">
                                {attendance.present || 0}
                              </p>
                            </div>
                            <div className={`rounded-xl p-4 text-center transition-colors border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ABSENT</p>
                              <p className="text-2xl font-bold text-red-500">
                                {attendance.absent || 0}
                              </p>
                            </div>
                            <div className={`rounded-xl p-4 text-center transition-colors border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>STREAK</p>
                              <p className="text-2xl font-bold text-blue-500">
                                {attendance.current_streak || 0}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => onMarkAttendance(trainee.id, 'present')}
                              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Check className="w-5 h-5" /> Mark Present
                            </button>
                            <button
                              onClick={() => onMarkAttendance(trainee.id, 'absent')}
                              className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                              <X className="w-5 h-5" /> Mark Absent
                            </button>
                            <button
                              className={`flex-1 py-3 border rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              <History className="w-5 h-5" /> History
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </DashboardCard>
    </motion.div>
  );
};

