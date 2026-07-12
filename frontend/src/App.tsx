import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/toast'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { DashboardLayout } from './components/DashboardLayout'
import { AssetManagement } from './pages/AssetManagement'
import { AssetDetails } from './pages/AssetDetails'
import { AssetAllocation } from './pages/AssetAllocation'
import { ResourceBooking } from './pages/ResourceBooking'
import { Maintenance } from './pages/Maintenance'
import { Audit } from './pages/Audit'
import { Reports } from './pages/Reports'
import { Notifications } from './pages/Notifications'
import { OrgSetup } from './pages/OrgSetup'
import { UserApprovals } from './pages/UserApprovals'

// Loading screen helper
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <svg
        className="animate-spin h-8 w-8 text-indigo-500"
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
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        Verifying Secure Session...
      </span>
    </div>
  </div>
)

// Public Route Guard (Redirects logged-in users away from auth pages)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return <LoadingScreen />
  }
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

// Protected Route Guard (Restricts access based on authentication and roles)
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <DashboardLayout>{children}</DashboardLayout>
}

// App routing and providers wrapper
const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        
        {/* Protected Dashboard & Module Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets"
          element={
            <ProtectedRoute>
              <AssetManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assets/:id"
          element={
            <ProtectedRoute>
              <AssetDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <ResourceBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/allocations"
          element={
            <ProtectedRoute>
              <AssetAllocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-setup"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <OrgSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audits"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ASSET_MANAGER']}>
              <Audit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ASSET_MANAGER']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Legacy redirect routes for backwards compatibility */}
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="/asset-manager" element={<Navigate to="/dashboard" replace />} />
        <Route path="/department-head" element={<Navigate to="/dashboard" replace />} />
        <Route path="/employee" element={<Navigate to="/dashboard" replace />} />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  React.useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
