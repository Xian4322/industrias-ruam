import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useOfflineSync } from './hooks/useOfflineSync';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import KanbanPage from './pages/KanbanPage';
import QualityPage from './pages/QualityPage';
import EVMPage from './pages/EVMPage';
import ChangesPage from './pages/ChangesPage';
import OperatorView from './pages/OperatorView';

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-ruam-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/operator'} replace />;
  }
  return <Outlet />;
}

function AdminLayout() {
  const { isOnline } = useOfflineSync();
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64 p-6 transition-all duration-300">
        <Header title="Industrias RUAM" isOnline={isOnline} />
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/kanban" element={<KanbanPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/evm" element={<EVMPage />} />
          <Route path="/changes" element={<ChangesPage />} />
        </Route>
      </Route>

      {/* Operator Routes */}
      <Route element={<ProtectedRoute allowedRoles={['operario']} />}>
        <Route path="/operator/*" element={<OperatorView />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
