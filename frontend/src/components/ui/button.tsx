import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-transparent dark:to-transparent dark:bg-primary text-white dark:text-primary-foreground hover:opacity-90 shadow-sm shadow-black/5',
    secondary: 'bg-white dark:bg-secondary border border-gray-200 dark:border-border text-gray-700 dark:text-secondary-foreground hover:bg-gray-50 dark:hover:bg-secondary/80',
    outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
    ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-black/10',
  }

  const sizes = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-11 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
