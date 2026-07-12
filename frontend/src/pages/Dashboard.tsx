import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon, Mail, Shield, Building } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { useToast } from '../components/ui/toast'
import { motion } from 'framer-motion'

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast('Logged out successfully.', 'info')
    navigate('/login')
  }

  if (!user) {
    return null
  }

  const roleColors = {
    EMPLOYEE: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    DEPARTMENT_HEAD: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    ASSET_MANAGER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="min-h-screen bg-background text-foreground flex flex-col"
    >
      {/* Top Navbar */}
      <header className="border-b border-border bg-zinc-950/40 backdrop-blur-md sticky top-0 z-30 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Shield className="text-white h-4.5 w-4.5" />
          </div>
          <span className="font-bold text-sm tracking-wider text-white">ASSETFLOW</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-xs border-border/80 text-muted-foreground hover:text-foreground"
        >
          <LogOut size={14} className="mr-1.5" />
          Logout
        </Button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto flex flex-col justify-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Mockup</h1>
          <p className="text-sm text-muted-foreground">
            Authentication successfully verified. Below is the active session context.
          </p>
        </div>

        {/* User Session Info Card */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 glassmorphism bg-zinc-900/40 p-6 flex flex-col space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserIcon size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 border rounded-full font-medium ${roleColors[user.role as keyof typeof roleColors] || roleColors.EMPLOYEE}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-4 text-left">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail size={16} className="mr-3 text-indigo-400" />
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Building size={16} className="mr-3 text-indigo-400" />
                <span>Department Assignment: <strong className="text-white font-medium">{user.departmentId || 'Not Assigned'}</strong></span>
              </div>
            </div>
          </Card>

          <Card className="glassmorphism bg-zinc-900/40 p-6 flex flex-col justify-between text-left">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Session Parameters
              </h4>
              <ul className="space-y-2 text-xs font-mono bg-black/30 p-4 rounded-lg border border-border/40 text-zinc-400 overflow-x-auto no-scrollbar">
                <li>TOKEN: <span className="text-emerald-400">Present</span></li>
                <li>EXPIRES: <span className="text-zinc-500">24 Hours</span></li>
                <li>STORAGE: <span className="text-indigo-400">localStorage</span></li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Access token successfully verified at `http://localhost:5000/api/auth/me`.
            </p>
          </Card>
        </div>
      </main>
    </motion.div>
  )
}
