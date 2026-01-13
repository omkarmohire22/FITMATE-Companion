import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, Settings, User, Bell } from 'lucide-react'

/**
 * StandardDashboard - A reusable dashboard wrapper for consistent styling
 * Features:
 * - Mobile-responsive sidebar
 * - Sticky header
 * - Clean, modern design
 * - Consistent spacing and typography
 */
export const StandardDashboard = ({
  title,
  subtitle,
  children,
  sidebar,
  sidebarOpen,
  setSidebarOpen,
  header,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 bg-white border-b border-slate-200 z-40">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen bg-slate-900 text-white w-64 transform transition-transform duration-300 hidden md:block z-40 overflow-y-auto">
        {sidebar}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.3 }}
            className="fixed w-64 h-screen bg-slate-900 text-white overflow-y-auto z-40 md:hidden"
          >
            {sidebar}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Desktop Header */}
        {header && (
          <div className="hidden md:block sticky top-0 bg-white border-b border-slate-200 shadow-sm z-20">
            {header}
          </div>
        )}

        {/* Content Area */}
        <main className={`section-container ${className}`}>{children}</main>
      </div>
    </div>
  )
}

/**
 * DashboardCard - Consistent card component for dashboard sections
 */
export const DashboardCard = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  action,
  noPadding = false,
}) => {
  return (
    <motion.div
      className={`dashboard-card overflow-hidden ${className}`}
      whileHover={{ y: -2 }}
    >
      {title && (
        <div className="px-4 md:px-6 py-4 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {Icon && (
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
              )}
              <div>
                <h3 className="heading-3">{title}</h3>
                {subtitle && <p className="text-small text-slate-500 mt-1">{subtitle}</p>}
              </div>
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}

      <div className={!noPadding ? 'p-4 md:p-6' : ''}>{children}</div>
    </motion.div>
  )
}

/**
 * StatCard - Card for displaying metrics/statistics
 */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  className = '',
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={`dashboard-card p-4 md:p-6 cursor-pointer ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-small text-slate-600 font-medium">{label}</p>
          <p className="heading-2 text-slate-900 mt-2">{value}</p>
          {trend && (
            <p
              className={`text-small mt-2 ${trendUp ? 'text-green-600' : 'text-red-600'}`}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary-100 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

/**
 * DashboardGrid - Responsive grid for dashboard items
 */
export const DashboardGrid = ({ children, columns = 3, className = '' }) => {
  const gridClass =
    columns === 2
      ? 'dashboard-grid-2'
      : columns === 3
        ? 'dashboard-grid-3'
        : 'dashboard-grid-4'

  return <div className={`${gridClass} ${className}`}>{children}</div>
}

/**
 * DashboardSection - Section with title and content
 */
export const DashboardSection = ({
  title,
  subtitle,
  children,
  action,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="heading-2">{title}</h2>
          {subtitle && <p className="text-small text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

/**
 * TabGroup - Consistent tab navigation
 */
export const TabGroup = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`tab-nav ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={tab.id === activeTab ? 'tab-item tab-item-active' : 'tab-item'}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
          {tab.badge && <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">{tab.badge}</span>}
        </button>
      ))}
    </div>
  )
}

export default StandardDashboard
