import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from '@/components/layout/MainLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import CustomerWizard from '@/pages/customers/CustomerWizard';
import CustomerProfile from '@/pages/customers/CustomerProfile';
import InstallmentsPage from '@/pages/installments/InstallmentsPage';
import InstallmentWizard from '@/pages/installments/InstallmentWizard';
import InstallmentDetail from '@/pages/installments/InstallmentDetail';
import PaymentsPage from '@/pages/payments/PaymentsPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import DistributorsPage from '@/pages/distributors/DistributorsPage';
import DistributorDetail from '@/pages/distributors/DistributorDetail';
import WorkersPage from '@/pages/workers/WorkersPage';
import WorkerDashboard from '@/pages/workers/WorkerDashboard';
import ReportsPage from '@/pages/reports/ReportsPage';
import AgreementsPage from '@/pages/agreements/AgreementsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import { useAuthStore } from '@/store/authStore';

// Protected Route Wrapper
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If worker tries to access owner routes
    if (user?.role === 'worker') return <Navigate to="/worker-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Worker Only Route */}
        <Route 
          path="/worker-dashboard" 
          element={
            <PrivateRoute allowedRoles={['worker', 'manager', 'owner']}>
              <WorkerDashboard />
            </PrivateRoute>
          } 
        />

        {/* Owner/Manager Protected Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute allowedRoles={['owner', 'manager']}>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<CustomerWizard />} />
          <Route path="customers/:id" element={<CustomerProfile />} />
          <Route path="customers/:id/edit" element={<CustomerWizard />} />
          <Route path="installments" element={<InstallmentsPage />} />
          <Route path="installments/new" element={<InstallmentWizard />} />
          <Route path="installments/:id" element={<InstallmentDetail />} />
          <Route path="installments/:id/edit" element={<InstallmentWizard />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="distributors" element={<DistributorsPage />} />
          <Route path="distributors/:id" element={<DistributorDetail />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="agreements" element={<AgreementsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
