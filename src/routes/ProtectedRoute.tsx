import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types/models';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== Role.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
