import React from 'react'
import { motion } from 'framer-motion'

/**
 * DashboardCard - Base card component for all dashboard sections
 * Provides consistent styling and spacing across all dashboards
 */
export const DashboardCard = ({
  children,
  className = '',
  hoverable = true,
  onClick = null,
  variant = 'light',
  ...props
}) => {
  const baseClasses = 'dashboard-card'
  const hoverClass = hoverable ? 'cursor-pointer' : ''
  const variantClass = variant === 'dark' ? 'dashboard-card-dark' : ''

  return (
    <motion.div
      className={`${baseClasses} ${hoverClass} ${variantClass} ${className}`}
      onClick={onClick}
      whileHover={hoverable ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * MetricCard - For displaying KPIs and metrics
 * Shows value, label, and optional trend
 */
export const MetricCard = ({
  icon: Icon,
  label,
  value,
  trend = null,
  trendUp = true,
  color = 'primary',
  className = '',
}) => {
  const colorStyles = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-red-500 to-red-600',
    info: 'from-blue-500 to-blue-600',
  }

  return (
    <DashboardCard className={`p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`bg-gradient-to-br ${colorStyles[color]} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </DashboardCard>
  )
}

/**
 * SectionHeader - Consistent section title component
 */
export const SectionHeader = ({
  title,
  subtitle = null,
  action = null,
  icon: Icon = null,
  className = '',
}) => {
  return (
    <div className={`flex-between mb-6 ${className}`}>
      <div>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-primary-600" />}
          <h2 className="heading-3">{title}</h2>
        </div>
        {subtitle && <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * DashboardHeader - Main page header with title and controls
 */
export const DashboardHeader = ({
  title,
  subtitle = null,
  actions = null,
  backButton = false,
  onBack = null,
}) => {
  return (
    <div className="dashboard-header">
      <div className="page-container flex-between py-6">
        <div>
          <h1 className="heading-1">{title}</h1>
          {subtitle && <p className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  )
}

/**
 * StatBox - Compact stat display
 */
export const StatBox = ({
  label,
  value,
  unit = null,
  icon: Icon = null,
  color = 'primary',
}) => {
  const colorStyles = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  }

  return (
    <div className={`${colorStyles[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-75">
            {label}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm opacity-75">{unit}</span>}
          </div>
        </div>
        {Icon && <Icon className="w-8 h-8 opacity-50" />}
      </div>
    </div>
  )
}

/**
 * DataTable - Consistent table component
 */
export const DataTable = ({ columns, data, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-gray-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * EmptyState - Consistent empty state component
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description = null,
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {Icon && (
        <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-lg mb-4">
          <Icon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-slate-600 dark:text-slate-400 text-center mb-4 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * LoadingSpinner - Consistent loading indicator
 */
export const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const spinner = (
    <div className={`${sizes[size]} border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full animate-spin`} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-50">
        {spinner}
      </div>
    )
  }

  return <div className="flex-center">{spinner}</div>
}

/**
 * AlertBox - Consistent alert/notification component
 */
export const AlertBox = ({
  type = 'info',
  title = null,
  message,
  action = null,
  onClose = null,
}) => {
  const styles = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50 text-green-900 dark:text-green-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-400',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-900 dark:text-red-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-900 dark:text-blue-400',
  }

  return (
    <div className={`border rounded-lg p-4 ${styles[type]}`}>
      <div className="flex justify-between items-start">
        <div>
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xl ml-2 opacity-50 hover:opacity-100">
            ×
          </button>
        )}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export default {
  DashboardCard,
  MetricCard,
  SectionHeader,
  DashboardHeader,
  StatBox,
  DataTable,
  EmptyState,
  LoadingSpinner,
  AlertBox,
}
