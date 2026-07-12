import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  isValid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, type = 'text', className, isValid, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'
    
    // Toggle password visibility
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="w-full flex flex-col space-y-1.5 text-left">
        {label && (
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-muted-foreground flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={twMerge(
              clsx(
                'w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground premium-input',
                icon && 'pl-11',
                isPassword && 'pr-11',
                error && 'border-destructive/60 focus:ring-destructive/50 focus:border-destructive/60 bg-destructive/5',
                isValid && !error && 'border-emerald-500/50 focus:ring-emerald-500/40 focus:border-emerald-500/50 bg-emerald-500/5',
                className
              )
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowPassword(!showPassword)
              }}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors p-1 z-10 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-xs text-destructive mt-1 block font-medium animate-slide-up">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
