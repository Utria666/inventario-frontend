import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProtectedRoute, { AdminRoute } from './ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductosPage from '../pages/productos/ProductosPage';
import CategoriasPage from '../pages/categorias/CategoriasPage';
import LocationsPage from '../pages/ubicaciones/LocationsPage';
import ProveedoresPage from '../pages/proveedores/ProveedoresPage';
import UsersPage from '../pages/usuarios/UsersPage';
import ProductLocationsPage from '../pages/productLocations/ProductLocationsPage';
import MovimientosPage from '../pages/movimientos/MovimientosPage';
import ReportesPage from '../pages/reportes/ReportesPage';
import NotFoundPage from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'productos',
            element: <ProductosPage />,
          },
          {
            element: <AdminRoute />,
            children: [
              {
                path: 'categorias',
                element: <CategoriasPage />,
              },
              {
                path: 'ubicaciones',
                element: <LocationsPage />,
              },
              {
                path: 'proveedores',
                element: <ProveedoresPage />,
              },
              {
                path: 'usuarios',
                element: <UsersPage />,
              },
            ],
          },
          {
            path: 'stock',
            element: <ProductLocationsPage />,
          },
          {
            path: 'movimientos',
            element: <MovimientosPage />,
          },
          {
            path: 'reportes',
            element: <ReportesPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
