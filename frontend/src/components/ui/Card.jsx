import React from 'react'
import { motion } from 'framer-motion'

export const Card = ({
  children,
  className = '',
  variant = 'default',
  hover = true,
  dark = false,
  ...props
}) => {
  const variants = {
    default: dark
      ? 'bg-slate-800 border border-slate-700'
      : 'bg-white border border-slate-200',
    elevated: dark
      ? 'bg-slate-800 border border-slate-700 shadow-lg'
      : 'bg-white border border-slate-200 shadow-lg',
    subtle: dark
      ? 'bg-gray-850 border border-slate-700/50'
      : 'bg-slate-50 border border-gray-100',
  }

  return (
    <motion.div
      className={`
        rounded-lg transition-all duration-200 p-4 md:p-6
        ${variants[variant]}
        ${hover ? 'hover:shadow-md hover:scale-105' : ''}
        ${className}
      `}
      whileHover={hover ? { y: -2 } : {}}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const CardHeader = ({ title, subtitle, icon: Icon, action }) => {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2 bg-primary-100 rounded-lg">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
        )}
        <div>
          <h3 className="heading-3">{title}</h3>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export const CardContent = ({ children, className = '' }) => {
  return <div className={`space-y-4 ${className}`}>{children}</div>
}

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200 ${className}`}>
      {children}
    </div>
  )
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  className = '',
}) => {
  return (
    <Card className={`metric-card ${className}`} variant="default">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-primary-100 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
        )}
      </div>
    </Card>
  )
}

export default Card
