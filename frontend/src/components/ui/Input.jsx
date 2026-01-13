import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  className = '',
  containerClassName = '',
  id,
  ...props
}, ref) => {
  const baseClasses =
    'w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100'

  const variants = {
    default: 'border-slate-300 bg-white text-slate-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20',
    error: 'border-red-300 bg-white text-slate-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20',
    success: 'border-green-300 bg-white text-slate-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20',
    dark: 'border-slate-600 bg-slate-800 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20'
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg'
  }

  const inputClasses = `
    ${baseClasses}
    ${variants[error ? 'error' : variant]}
    ${sizes[size]}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
    ${className}
  `

  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <motion.input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={inputClasses}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600"
        >
          {typeof error === 'string' ? error : error?.message || JSON.stringify(error)}
        </motion.p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
