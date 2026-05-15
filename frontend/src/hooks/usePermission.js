import { useAuthStore } from '../store/authStore';

/**
 * Returns true if the current user's role is in the allowedRoles list.
 *
 * Usage:
 *   const canViewReports = usePermission(['owner', 'manager']);
 *   if (!canViewReports) return <AccessDenied />;
 */
export const usePermission = (allowedRoles = []) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return allowedRoles.includes(user.role);
};

/**
 * Returns the current user and convenience role booleans.
 */
export const useAuth = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  return {
    user,
    isAuthenticated,
    logout,
    isOwner: user?.role === 'owner',
    isManager: user?.role === 'manager',
    isWorker: user?.role === 'worker',
    canAccessReports: ['owner'].includes(user?.role),
    canManageUsers: ['owner'].includes(user?.role),
    canEditSettings: ['owner'].includes(user?.role),
  };
};
