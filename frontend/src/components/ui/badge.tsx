import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className, ...props }) => {
  const styles = {
    default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border tracking-wide transition-colors',
          styles[variant],
          className
        )
      )}
      {...props}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse', {
        'bg-zinc-400': variant === 'default',
        'bg-emerald-400': variant === 'success',
        'bg-amber-400': variant === 'warning',
        'bg-rose-400': variant === 'error',
        'bg-blue-400': variant === 'info',
        'bg-indigo-400': variant === 'purple',
      })} />
      {children}
    </span>
  )
}
