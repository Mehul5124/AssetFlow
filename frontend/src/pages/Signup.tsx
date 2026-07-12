import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Shield, ArrowRight, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'

// Schema validation using Zod
const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormInputs = z.infer<typeof signupSchema>

export const Signup: React.FC = () => {
  const { signup, isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin')
          break
        case 'ASSET_MANAGER':
          navigate('/asset-manager')
          break
        case 'DEPARTMENT_HEAD':
          navigate('/department-head')
          break
        case 'EMPLOYEE':
        default:
          navigate('/employee')
          break
      }
    }
  }, [isAuthenticated, user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, touchedFields },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    mode: 'all',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignupFormInputs) => {
    setIsLoading(true)
    try {
      await signup(data.name, data.email, data.password)
      toast('Account created successfully! Please sign in.', 'success')
      navigate('/login')
    } catch (error: any) {
      console.error('Signup error:', error)
      const errorMsg = error.response?.data?.message || 'Failed to create account. Check details or try again later.'
      toast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex text-foreground bg-background"
    >
      {/* Left Pane - Premium Brand Panel (hidden on small/medium screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 flex-col justify-between p-12 overflow-hidden border-r border-border">
        {/* Soft floating gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_40%)] pointer-events-none" />
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Top Branding Logo */}
        <div className="flex items-center space-x-2.5 z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="text-white h-5.5 w-5.5" />
          </div>
          <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            ASSETFLOW
          </span>
        </div>

        {/* Feature Promo details */}
        <div className="space-y-6 max-w-md my-auto z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-extrabold tracking-tight leading-tight text-white"
          >
            Join the Next-Gen{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              ERP Resource Manager
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-muted-foreground text-base leading-relaxed"
          >
            Create an employee account and request access to your organization's assets, bookings, and departments.
          </motion.p>
        </div>

        {/* Footer Meta */}
        <div className="text-xs text-muted-foreground/60 z-10 flex justify-between items-center">
          <span>© 2026 AssetFlow ERP Technologies</span>
          <span>v1.0.4</span>
        </div>
      </div>

      {/* Right Pane - Form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative overflow-hidden">
        {/* Mobile decorative gradient background */}
        <div className="lg:hidden absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />

        <div className="w-full max-w-[420px] flex flex-col space-y-8 relative z-10">
          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign up below to request portal access
            </p>
          </div>

          {/* Form */}
          <Card className="p-6 sm:p-8 bg-zinc-900/60 border-border/80 shadow-2xl glassmorphism">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={<User size={16} />}
                error={errors.name?.message}
                isValid={touchedFields.name && !errors.name}
                {...register('name')}
                disabled={isLoading}
              />

              <Input
                label="Work Email"
                type="email"
                placeholder="name@company.com"
                icon={<Mail size={16} />}
                error={errors.email?.message}
                isValid={touchedFields.email && !errors.email}
                {...register('email')}
                disabled={isLoading}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.password?.message}
                isValid={touchedFields.password && !errors.password}
                {...register('password')}
                disabled={isLoading}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={16} />}
                error={errors.confirmPassword?.message}
                isValid={touchedFields.confirmPassword && !errors.confirmPassword}
                {...register('confirmPassword')}
                disabled={isLoading}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-4"
                isLoading={isLoading}
                disabled={!isValid || isLoading}
              >
                <span>Request Account</span>
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>
          </Card>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
