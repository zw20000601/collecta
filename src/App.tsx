import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import PageLoader from './components/ui/PageLoader'

const Home = lazy(() => import('./pages/Home'))
const Categories = lazy(() => import('./pages/Categories'))
const CategoryDetail = lazy(() => import('./pages/CategoryDetail'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Messages = lazy(() => import('./pages/Messages'))
const Login = lazy(() => import('./pages/Login'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminResources = lazy(() => import('./pages/admin/Resources'))
const AdminCategories = lazy(() => import('./pages/admin/Categories'))
const AdminMessages = lazy(() => import('./pages/admin/Messages'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminLogs = lazy(() => import('./pages/admin/Logs'))
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'))

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Admin routes - no navbar */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        {/* Frontend routes - with navbar */}
        <Route
          path="/*"
          element={
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafb' }}>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:categoryName" element={<CategoryDetail />} />
                  <Route
                    path="/favorites"
                    element={
                      <ProtectedRoute>
                        <Favorites />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default App
