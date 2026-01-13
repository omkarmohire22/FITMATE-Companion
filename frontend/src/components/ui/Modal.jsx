import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = ''
}) => {
  const dialogRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => (document.body.style.overflow = 'unset')
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && onClose()
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const sizes = {
    sm: 'sm:max-w-md max-w-[calc(100%-2rem)]',
    md: 'sm:max-w-lg max-w-[calc(100%-2rem)]',
    lg: 'sm:max-w-2xl max-w-[calc(100%-2rem)]',
    xl: 'sm:max-w-4xl max-w-[calc(100%-2rem)]',
    full: 'max-w-[calc(100%-2rem)] sm:max-w-full'
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`w-full ${sizes[size]} bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${className}`}
            >
              {(title || showCloseButton) && (
                <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-white rounded-t-xl">
                  {title && <h3 className="text-lg sm:text-xl font-semibold text-slate-900">{title}</h3>}
                  {showCloseButton && (
                    <button onClick={onClose} className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  )}
                </div>
              )}

              <div className="p-4 sm:p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal
