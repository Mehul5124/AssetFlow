import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Shield, ArrowRight, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'

// Schema validation using Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional(),
})

type LoginFormInputs = z.infer<typeof loginSchema>

export const Login: React.FC = () => {
  const { login, forgotPassword, isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isForgotLoading, setIsForgotLoading] = useState(false)

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
    setValue,
    formState: { errors, isValid, touchedFields },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: 'all',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('assetflow_remember_email')
    if (savedEmail) {
      setValue('email', savedEmail)
      setValue('rememberMe', true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true)
    try {
      const loggedUser = await login(data.email, data.password)
      
      // Manage Remember Me
      if (data.rememberMe) {
        localStorage.setItem('assetflow_remember_email', data.email)
      } else {
        localStorage.removeItem('assetflow_remember_email')
      }

      toast('Logged in successfully!', 'success')
      
      switch (loggedUser.role) {
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
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMsg = error.response?.data?.message || 'Invalid email or password. Please try again.'
      toast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !z.string().email().safeParse(forgotEmail).success) {
      toast('Please enter a valid email address', 'error')
      return
    }

    setIsForgotLoading(true)
    try {
      await forgotPassword(forgotEmail)
      toast('Password reset link sent successfully!', 'success')
      setShowForgotModal(false)
      setForgotEmail('')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      const errorMsg = error.response?.data?.message || 'Something went wrong. Please try again.'
      toast(errorMsg, 'error')
    } finally {
      setIsForgotLoading(false)
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
            Streamline Your{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Enterprise Assets
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-muted-foreground text-base leading-relaxed"
          >
            Digitalizing the physical asset lifecycle with hard conflict prevention, reservation scheduling, and structured audit cycles.
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
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your ERP dashboard
            </p>
          </div>

          {/* Form */}
          <Card className="p-6 sm:p-8 bg-zinc-900/60 border-border/80 shadow-2xl glassmorphism">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  error={errors.password?.message}
                  isValid={touchedFields.password && !errors.password}
                  {...register('password')}
                  disabled={isLoading}
                />
              </div>

              {/* Remember Me checkbox */}
              <div className="flex items-center space-x-2 text-left">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="rounded border-border bg-secondary/30 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-background h-4 w-4 transition-colors cursor-pointer"
                  {...register('rememberMe')}
                  disabled={isLoading}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-muted-foreground font-medium select-none cursor-pointer"
                >
                  Remember my work email
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                disabled={!isValid || isLoading}
              >
                <span>Sign In</span>
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>
          </Card>

          {/* Signup Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              Request Access
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md bg-zinc-900 border border-border rounded-xl shadow-2xl overflow-hidden glassmorphism p-6 z-10"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Reset Password</h3>
                  <p className="text-xs text-muted-foreground">
                    Get a recovery link for your account
                  </p>
                </div>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="name@company.com"
                  icon={<Mail size={16} />}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isForgotLoading}
                  required
                />

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotModal(false)}
                    disabled={isForgotLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isForgotLoading}
                  >
                    Send recovery link
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
