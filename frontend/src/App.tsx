import { createBrowserRouter, Navigate } from 'react-router-dom'
import { isAuthenticated } from './lib/api'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WorkbookPage from './pages/WorkbookPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/spreadsheet/:id',
    element: (
      <ProtectedRoute>
        <WorkbookPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
