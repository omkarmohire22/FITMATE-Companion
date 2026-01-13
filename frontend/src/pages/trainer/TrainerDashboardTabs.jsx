/**
 * TRAINER DASHBOARD ENHANCEMENT FILE
 * This contains additional tab components for:
 * - Attendance Management (Enhanced)
 * 
 * Add these sections to your TrainerDashboard.jsx after the analytics section
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { DashboardCard, EmptyState } from '../../components/ui/DashboardComponents';

// ===== ATTENDANCE TAB =====
export const AttendanceTabContent = ({ trainees, attendanceData, attendanceLoading, onMarkAttendance }) => {
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
    if (percentage >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
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
        <DashboardCard className="p-6 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-900/40 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Active Trainees</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{overallStats.totalTrainees}</p>
            </div>
            <div className="text-4xl opacity-40">👥</div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6 bg-gradient-to-br from-green-50 dark:from-green-900/20 to-green-100 dark:to-green-900/40 border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Avg. Attendance</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{overallStats.avgAttendance}%</p>
            </div>
            <div className="text-4xl opacity-40">📊</div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6 bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-emerald-100 dark:to-emerald-900/40 border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Perfect (90%+)</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{overallStats.perfectAttendance}</p>
            </div>
            <div className="text-4xl opacity-40">⭐</div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-6 bg-gradient-to-br from-orange-50 dark:from-orange-900/20 to-orange-100 dark:to-orange-900/40 border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">At Risk (&lt;70%)</p>
              <p className="text-3xl font-bold text-orange-700 dark:text-orange-300 mt-1">{overallStats.atRisk}</p>
            </div>
            <div className="text-4xl opacity-40">⚠️</div>
          </div>
        </DashboardCard>
      </div>

      {/* Date & Filter Controls */}
      <DashboardCard className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Trainee Attendance</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Mark attendance and track compliance</p>
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
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {(trainee.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{trainee.name || 'Unknown'}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{trainee.email || 'No email'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{percentage}%</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{badge.icon} {badge.label}</p>
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
                            <div className="bg-white dark:bg-gray-600 rounded-lg p-4 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">TOTAL DAYS</p>
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {attendance.total_days || 0}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-600 rounded-lg p-4 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">PRESENT</p>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {attendance.present || 0}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-600 rounded-lg p-4 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">ABSENT</p>
                              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {attendance.absent || 0}
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-600 rounded-lg p-4 text-center">
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">STREAK</p>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {attendance.current_streak || 0}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => onMarkAttendance(trainee.id, 'present')}
                              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-sm"
                            >
                              ✓ Mark Present
                            </button>
                            <button
                              onClick={() => onMarkAttendance(trainee.id, 'absent')}
                              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors shadow-sm"
                            >
                              ✗ Mark Absent
                            </button>
                            <button
                              className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-sm"
                            >
                              📋 History
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

