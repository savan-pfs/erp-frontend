import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermissions?: string[];
    requiredRoles?: string[];
    requireAll?: boolean; // If true, all permissions/roles must match. Default is false (any match)
    fallbackPath?: string; // Where to redirect if access denied. Default is /dashboard
}

/**
 * ProtectedRoute component that restricts access based on roles and permissions.
 * 
 * Usage:
 * ```tsx
 * // Require any of the listed roles
 * <ProtectedRoute requiredRoles={['Super Admin', 'Org Admin']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * // Require specific permission
 * <ProtectedRoute requiredPermissions={['user:create']}>
 *   <CreateUserPage />
 * </ProtectedRoute>
 * 
 * // Require all permissions (AND logic)
 * <ProtectedRoute requiredPermissions={['inventory:view', 'inventory:update']} requireAll>
 *   <InventoryEditor />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredPermissions = [],
    requiredRoles = [],
    requireAll = false,
    fallbackPath = '/dashboard'
}) => {
    const { hasPermission, hasRole, user } = usePermissions();
    const { loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while auth is initializing
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not logged in - redirect to auth
    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Super Admin always has access to everything
    const isSuperAdmin = hasRole('Super Admin') || hasRole('super_admin');
    if (isSuperAdmin) {
        return <>{children}</>;
    }

    // Check if user has required access
    let hasAccess = false;

    // If no requirements specified, allow access (just needs to be logged in)
    if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
        hasAccess = true;
    } else if (requireAll) {
        // AND logic - user must have all required permissions AND all required roles
        const hasAllPermissions = requiredPermissions.length === 0 ||
            requiredPermissions.every(p => hasPermission(p));
        const hasAllRoles = requiredRoles.length === 0 ||
            requiredRoles.every(r => hasRole(r));
        hasAccess = hasAllPermissions && hasAllRoles;
    } else {
        // OR logic - user must have any required permission OR any required role
        const hasAnyPermission = requiredPermissions.length === 0 ||
            requiredPermissions.some(p => hasPermission(p));
        const hasAnyRole = requiredRoles.length === 0 ||
            requiredRoles.some(r => hasRole(r));

        // If both are specified, user needs to match at least one from each
        if (requiredPermissions.length > 0 && requiredRoles.length > 0) {
            hasAccess = hasAnyPermission || hasAnyRole;
        } else {
            hasAccess = hasAnyPermission && hasAnyRole;
        }
    }

    if (!hasAccess) {
        // Access denied - redirect to fallback
        return <Navigate to={fallbackPath} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
