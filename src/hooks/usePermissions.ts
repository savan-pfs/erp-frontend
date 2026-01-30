import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check user permissions
 * Uses the comprehensive RBAC system with all roles and permissions
 */
export const usePermissions = () => {
  const { user } = useAuth();

  /**
   * Helper to normalize role names for comparison
   * Handles both 'Super Admin' and 'super_admin' formats
   */
  const normalizeRole = (role: string): string => {
    return role?.toLowerCase().replace(/[\s\/]+/g, '_') || '';
  };

  /**
   * Check if user is a Super Admin
   */
  const isSuperAdmin = (): boolean => {
    if (!user) return false;
    
    const normalizedUserRole = normalizeRole(user.role || '');
    if (normalizedUserRole === 'super_admin') return true;
    
    if (user.roleNames && Array.isArray(user.roleNames)) {
      return user.roleNames.some((r: string) => normalizeRole(r) === 'super_admin');
    }
    
    return false;
  };

  /**
   * Check if user is an Org Admin
   */
  const isOrgAdmin = (): boolean => {
    if (!user) return false;
    
    const normalizedUserRole = normalizeRole(user.role || '');
    if (normalizedUserRole === 'org_admin') return true;
    
    if (user.roleNames && Array.isArray(user.roleNames)) {
      return user.roleNames.some((r: string) => normalizeRole(r) === 'org_admin');
    }
    
    return false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Super Admin has all permissions
    if (isSuperAdmin()) {
      return true;
    }

    // Check permissions from user object first (loaded from backend)
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      const hasBackendPermission = user.permissions.some((p: any) => {
        const permName = typeof p === 'string' ? p : p.name;
        return permName === permission;
      });
      if (hasBackendPermission) return true;
    }

    // Org Admin has all org-level and most operational permissions within their org
    // This is a safety net in case backend doesn't return all permissions
    if (isOrgAdmin()) {
      // Org Admin gets all org: and user: permissions
      if (permission.startsWith('org:') || permission.startsWith('user:')) {
        return true;
      }
      // Also cultivation, inventory, manufacturing, lab, shipping, compliance, analytics, audit, documents within their org
      if (
        permission.startsWith('cultivation:') ||
        permission.startsWith('inventory:') ||
        permission.startsWith('manufacturing:') ||
        permission.startsWith('lab:') ||
        permission.startsWith('shipping:') ||
        permission.startsWith('compliance:') ||
        permission.startsWith('analytics:') ||
        permission.startsWith('audit:') ||
        permission.startsWith('documents:view') ||
        permission.startsWith('documents:upload')
      ) {
        return true;
      }
    }

    // Fallback: Check role-based permissions for other roles
    // This handles cases where backend permissions might not be fully loaded
    const rolePermissionsMap: Record<string, string[]> = {
      'cultivation_manager': [
        'cultivation:view', 'cultivation:create', 'cultivation:update',
        'cultivation:move', 'cultivation:stage_change',
        'cultivation:harvest_schedule', 'cultivation:harvest_approve',
        'cultivation:work_orders', 'cultivation:record_weights',
        'inventory:view', 'inventory:create', 'inventory:update',
        'analytics:view', 'user:view',
      ],
      'technician_grower': [
        'cultivation:view', 'cultivation:update',
        'cultivation:move', 'cultivation:stage_change',
        'cultivation:work_orders', 'cultivation:record_weights',
        'inventory:view',
      ],
      'inventory_clerk': [
        'inventory:view', 'inventory:create', 'inventory:update',
        'inventory:transfer', 'inventory:adjust', 'inventory:cycle_count',
        'inventory:package',
      ],
      'qa_lab_manager': [
        'lab:view', 'lab:create', 'lab:update', 'lab:approve', 'lab:annotate',
        'inventory:view', 'compliance:view', 'compliance:export',
        'analytics:view',
      ],
      'processor_mfg_operator': [
        'manufacturing:view', 'manufacturing:create', 'manufacturing:update',
        'manufacturing:run', 'inventory:view', 'inventory:create', 'inventory:update',
      ],
      'shipper_logistics': [
        'shipping:view', 'shipping:create', 'shipping:update', 'shipping:book',
        'inventory:view', 'inventory:transfer',
      ],
      'auditor_compliance': [
        'audit:view', 'audit:export', 'compliance:view', 'compliance:export',
        'analytics:view', 'analytics:export',
        'cultivation:view', 'inventory:view', 'manufacturing:view',
        'lab:view', 'shipping:view', 'documents:view',
      ],
      'read_only_viewer': [
        'cultivation:view', 'inventory:view', 'manufacturing:view',
        'lab:view', 'shipping:view', 'analytics:view',
      ],
    };

    // Check primary role
    const normalizedUserRole = normalizeRole(user.role || '');
    const primaryRolePermissions = rolePermissionsMap[normalizedUserRole] || [];
    if (primaryRolePermissions.includes(permission)) return true;

    // Check all role names
    if (user.roleNames && Array.isArray(user.roleNames)) {
      for (const roleName of user.roleNames) {
        const normalizedRoleName = normalizeRole(roleName);
        const rolePerms = rolePermissionsMap[normalizedRoleName] || [];
        if (rolePerms.includes(permission)) return true;
      }
    }

    return false;
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;

    const normalizedTargetRole = normalizeRole(role);
    const normalizedUserRole = normalizeRole(user.role || '');

    // Check exact match or normalized match on primary role
    if (user.role === role || normalizedUserRole === normalizedTargetRole) {
      return true;
    }

    // Check role names array
    if (user.roleNames && Array.isArray(user.roleNames)) {
      return user.roleNames.some((r: string) => {
        return r === role || normalizeRole(r) === normalizedTargetRole;
      });
    }

    return false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.some(role => hasRole(role));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAnyPermission,
    isSuperAdmin: isSuperAdmin(),
    isOrgAdmin: isOrgAdmin(),
    user,
  };
};

