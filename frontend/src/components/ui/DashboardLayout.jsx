import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const DashboardLayout = ({
  children,
  sidebar,
  header,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40 flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">FitMate</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
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
      <div className="fixed md:fixed md:w-64 h-screen bg-gray-900 text-white overflow-y-auto transition-all duration-300 z-40 hidden md:block">
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
            className="fixed w-64 h-screen bg-gray-900 text-white overflow-y-auto z-40 md:hidden"
          >
            {sidebar}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Header */}
        {header && <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-20 hidden md:block">{header}</div>}

        {/* Mobile Top Spacing */}
        <div className="h-16 md:h-0 bg-gray-50" />

        {/* Content */}
        <main className={`section-container min-h-screen ${className}`}>{children}</main>
      </div>
    </div>
  )
}

export const DashboardHeader = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`px-6 py-4 flex items-center justify-between ${className}`}>
      <div>
        <h1 className="heading-2 text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export const DashboardSidebar = ({
  items,
  activeTab,
  onTabChange,
  footer,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">FitMate</h2>
        <p className="text-gray-400 text-xs mt-1">Fitness Tracking</p>
      </div>

      {/* Sidebar Items */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200 group
              ${
                activeTab === item.id
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            {item.icon && <span>{item.icon}</span>}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Sidebar Footer */}
      {footer && <div className="border-t border-gray-700 p-4">{footer}</div>}
    </div>
  )
}

export const DashboardGrid = ({ children, columns = 3 }) => {
  return (
    <div
      className={`grid gap-4 md:gap-6 grid-cols-1 ${
        columns === 2
          ? 'sm:grid-cols-2'
          : columns === 3
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : 'sm:grid-cols-2 lg:grid-cols-4'
      }`}
    >
      {children}
    </div>
  )
}

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
          <h2 className="heading-2 text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default DashboardLayout
