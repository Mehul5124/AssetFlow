import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/toast'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'

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
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />
      case 'ASSET_MANAGER':
        return <Navigate to="/asset-manager" replace />
      case 'DEPARTMENT_HEAD':
        return <Navigate to="/department-head" replace />
      case 'EMPLOYEE':
      default:
        return <Navigate to="/employee" replace />
    }
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
    // Redirect user to their own valid dashboard route
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />
      case 'ASSET_MANAGER':
        return <Navigate to="/asset-manager" replace />
      case 'DEPARTMENT_HEAD':
        return <Navigate to="/department-head" replace />
      case 'EMPLOYEE':
      default:
        return <Navigate to="/employee" replace />
    }
  }

  return <>{children}</>
}

// Dashboard Redirect Helper
const DashboardRedirect: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />
    case 'ASSET_MANAGER':
      return <Navigate to="/asset-manager" replace />
    case 'DEPARTMENT_HEAD':
      return <Navigate to="/department-head" replace />
    case 'EMPLOYEE':
    default:
      return <Navigate to="/employee" replace />
  }
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
        
        {/* Role-Specific Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/asset-manager"
          element={
            <ProtectedRoute allowedRoles={['ASSET_MANAGER']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/department-head"
          element={
            <ProtectedRoute allowedRoles={['DEPARTMENT_HEAD']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Global Dashboard Redirect */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
