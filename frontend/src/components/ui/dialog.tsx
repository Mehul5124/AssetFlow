import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden dark:glassmorphism z-10 flex flex-col max-h-[90vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-secondary/40"
            >
              <X size={16} />
            </button>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-6 pb-4 border-b border-border/40 flex flex-col space-y-1.5 text-left ${className}`}>
      {children}
    </div>
  )
}

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">{children}</h3>
}

export const DialogDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-6 flex-1 overflow-y-auto no-scrollbar ${className}`}>{children}</div>
}

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-6 pt-4 border-t border-border/40 flex items-center justify-end space-x-3 bg-zinc-950/20 ${className}`}>
      {children}
    </div>
  )
}
