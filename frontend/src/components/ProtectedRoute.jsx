import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // 1️⃣ Still loading profile → show loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-400">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // 2️⃣ No user → force login (admin routes go to admin-login)
  if (!user) {
    const isAdminRoute = allowedRoles?.includes('ADMIN');
    return <Navigate to={isAdminRoute ? "/admin-login" : "/login"} replace />;
  }

  // 3️⃣ Normalize role (backend always uses UPPERCASE)
  const role = user.role?.toUpperCase();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // 4️⃣ Access not allowed → redirect the user to their dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'TRAINER') return <Navigate to="/trainer" replace />;
    if (role === 'TRAINEE') return <Navigate to="/trainee" replace />;

    return <Navigate to="/login" replace />;
  }

  // 5️⃣ Access approved
  return children;
};

export { ProtectedRoute };
