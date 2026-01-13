import React from 'react'
import { motion } from 'framer-motion'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-slate-900 focus:ring-gray-500 shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-md hover:shadow-lg',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-md hover:shadow-lg',
    error: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-slate-700 focus:ring-gray-400',
    link: 'bg-transparent text-primary-600 hover:text-primary-700 hover:underline focus:ring-primary-400'
  }

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl'
  }

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) onClick(e)
  }

  return (
    <motion.button
      type={type}
      aria-label={ariaLabel || 'button'}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}

      {!loading && icon && iconPosition === 'left' && <span>{icon}</span>}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span>{icon}</span>}
    </motion.button>
  )
}

export default Button
