import React from 'react'

/**
 * Responsive Layout Components for consistent dashboard styling
 */

export const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <div className={`section-container ${className}`}>
      {children}
    </div>
  )
}

export const ResponsiveHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6 ${className}`}>
      <div className="flex-1">
        <h1 className="heading-1">{title}</h1>
        {subtitle && <p className="text-body text-slate-600 mt-2">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

export const ResponsiveGrid = ({ children, columns = 3, className = '' }) => {
  const gridClasses = {
    2: 'dashboard-grid-2',
    3: 'dashboard-grid-3',
    4: 'dashboard-grid-4',
  }
  return (
    <div className={`${gridClasses[columns] || 'dashboard-grid-3'} ${className}`}>
      {children}
    </div>
  )
}

export const ResponsiveTable = ({ headers, rows, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm md:text-base">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 md:px-6 py-3 text-left font-semibold text-slate-900"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, ridx) => (
            <tr key={ridx} className="hover:bg-slate-50 transition-colors">
              {row.map((cell, cidx) => (
                <td
                  key={cidx}
                  className="px-4 md:px-6 py-3 text-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const ResponsiveList = ({ items, className = '' }) => {
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item, idx) => (
        <li
          key={idx}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900">{item.title}</p>
            {item.subtitle && (
              <p className="text-small text-slate-600 mt-0.5">{item.subtitle}</p>
            )}
          </div>
          {item.action && <div className="flex-shrink-0">{item.action}</div>}
        </li>
      ))}
    </ul>
  )
}

export const ResponsiveAlert = ({ type = 'info', title, message, action, onClose }) => {
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div
      className={`border rounded-lg p-4 md:p-6 flex items-start gap-4 ${typeClasses[type]}`}
    >
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        {message && <p className="text-sm">{message}</p>}
      </div>
      <div className="flex-shrink-0 flex gap-2">
        {action && <div>{action}</div>}
        {onClose && (
          <button
            onClick={onClose}
            className="text-current hover:opacity-75 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export const ResponsiveStats = ({ stats, className = '' }) => {
  return (
    <div className={`dashboard-grid-4 ${className}`}>
      {stats.map((stat, idx) => (
        <div key={idx} className="dashboard-card p-4 md:p-6">
          <p className="text-small text-slate-600 font-medium">{stat.label}</p>
          <p className="heading-2 text-slate-900 mt-2">{stat.value}</p>
          {stat.change && (
            <p
              className={`text-small mt-2 font-medium ${
                stat.changeUp ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.changeUp ? '↑' : '↓'} {stat.change}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default ResponsiveContainer
