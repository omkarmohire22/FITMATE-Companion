import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { useEffect } from 'react'

import HeroPage from './pages/HeroPage'
import Login from './pages/auth/Login'
import AdminLogin from './pages/auth/AdminLogin'
import TrainerLogin from './pages/auth/TrainerLogin'
import FeedbackPage from './pages/FeedbackPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import TrainerDashboard from './pages/trainer/TrainerDashboard'
import TraineeDashboard from './pages/trainee/TraineeDashboard'
import TraineeDetails from './pages/trainer/TraineeDetails'

function App() {
  useEffect(() => {
    // Enable dark mode
    document.documentElement.classList.add('dark')
  }, [])
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div className="min-h-screen">

            <Routes>

              {/* ================= PUBLIC ROUTES ================= */}
              <Route path="/" element={<HeroPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/trainer-login" element={<TrainerLogin />} />
              <Route path="/feedback" element={<FeedbackPage />} />

              {/* ================= ADMIN ROUTES ================= */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ================= TRAINER ROUTES ================= */}
              <Route
                path="/trainer"
                element={
                  <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                    <TrainerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/trainer/trainee/:id"
                element={
                  <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN']}>
                    <TraineeDetails />
                  </ProtectedRoute>
                }
              />

              {/* ================= TRAINEE ROUTES ================= */}

              <Route
                path="/trainee"
                element={
                  <ProtectedRoute allowedRoles={['TRAINEE', 'TRAINER', 'ADMIN']}>
                    <TraineeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ================= 404 ================= */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                      <p className="text-gray-400 mb-8">Page not found</p>
                      <a
                        href="/login"
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        Go to Login
                      </a>
                    </div>
                  </div>
                }
              />

            </Routes>

            {/* ================= TOAST ================= */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

          </div>
        </AuthProvider>
        </Router>
    </ErrorBoundary>
  )
}

export default App
