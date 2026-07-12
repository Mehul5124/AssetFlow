import React, { createContext, useContext, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast container in portal-like layer */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle className="text-emerald-500 h-5 w-5 flex-shrink-0" />,
    error: <AlertCircle className="text-rose-500 h-5 w-5 flex-shrink-0" />,
    info: <Info className="text-blue-500 h-5 w-5 flex-shrink-0" />,
    warning: <AlertTriangle className="text-amber-500 h-5 w-5 flex-shrink-0" />,
  }

  const bgColors = {
    success: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-emerald-500/30 text-zinc-900 dark:text-zinc-100',
    error: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-rose-500/30 text-zinc-900 dark:text-zinc-100',
    info: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-blue-500/30 text-zinc-900 dark:text-zinc-100',
    warning: 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-amber-500/30 text-zinc-900 dark:text-zinc-100',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start p-4 border rounded-xl shadow-lg shadow-black/10 dark:shadow-black/40 ${bgColors[toast.type]}`}
    >
      <div className="flex items-start space-x-3 w-full">
        {icons[toast.type]}
        <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg hover:bg-secondary/40"
        >
          <X size={15} />
        </button>
      </div>
    </motion.div>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
