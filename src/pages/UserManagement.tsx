import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Plus,
  MoreHorizontal,
  Search,
  Shield,
  Key,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit,
  UserCog,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { usersApi, permissionsApi, organizationsApi, rolesApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  roleIds: number[];
  roleNames: string[];
  isActive: boolean;
  createdAt: string;
  organizationName?: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  resource_type: string;
  action: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);

  // ... other states ...
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [explicitPermissions, setExplicitPermissions] = useState<Permission[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ... formData ...
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleIds: [] as number[],
  });
  const [newPassword, setNewPassword] = useState('');
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedOrgForCreate, setSelectedOrgForCreate] = useState<string>('');

  const isSuperAdmin = currentUser?.role === 'super_admin' || 
                       currentUser?.role === 'Super Admin' ||
                       currentUser?.roleNames?.includes('super_admin') ||
                       currentUser?.roleNames?.includes('Super Admin');

  useEffect(() => {
    loadUsers();
    loadAllPermissions();
    loadAvailableRoles();
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [selectedOrgFilter]); // Reload when filter changes

  const loadAvailableRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await rolesApi.getAll();
      // Filter out Super Admin role for non-super-admins, and only show active roles
      const filteredRoles = data.filter((role: Role) => {
        const roleName = role.name?.toLowerCase().replace(/\s+/g, '_');
        // Don't show Super Admin role to anyone (it should be assigned manually)
        if (roleName === 'super_admin') return false;
        return true;
      });
      setAvailableRoles(filteredRoles);
    } catch (error: any) {
      console.error('Failed to load roles:', error);
      // Fallback to basic roles if API fails
      setAvailableRoles([
        { id: 0, name: 'Org Admin', display_name: 'Organization Admin', description: 'Full access to organization settings and users' },
      ]);
    } finally {
      setRolesLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const data = await organizationsApi.getAll();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to load organizations");
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedOrgFilter && selectedOrgFilter !== 'all') {
        params.organizationId = selectedOrgFilter;
      }

      const data = await usersApi.getAll(params);
      setUsers(data);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load users',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const data = await permissionsApi.getAll();
      setAllPermissions(data);
    } catch (error) {
      console.error("Failed to load permissions list");
    }
  }

  const loadPermissions = async (userId: number) => {
    setPermissionsLoading(true);
    setUserPermissions([]);
    setExplicitPermissions([]);
    try {
      // Get all effective permission names
      const effectiveData = await usersApi.getPermissions(userId);
      setUserPermissions(effectiveData.permissions || []);

      // Get explicit permission objects
      const explicitData = await usersApi.getExplicitPermissions(userId);
      setExplicitPermissions(explicitData || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load permissions',
        description: error.message,
      });
    } finally {
      setPermissionsLoading(false);
    }
  };

  const togglePermission = async (permissionId: number, isExplicit: boolean, isInherited: boolean) => {
    if (!selectedUser) return;
    if (isInherited) return; // Cannot toggle inherited permissions here

    try {
      if (isExplicit) {
        // Revoke
        await usersApi.revokePermission(selectedUser.id, permissionId);
        toast({ title: "Permission revoked" });
      } else {
        // Grant
        await usersApi.grantPermission(selectedUser.id, permissionId);
        toast({ title: "Permission granted" });
      }
      // Reload permissions to update state
      loadPermissions(selectedUser.id);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error.message
      });
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (formData.roleIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select at least one role',
      });
      return;
    }

    // For Super Admin, require organization selection when creating users
    if (isSuperAdmin && !selectedOrgForCreate && !currentUser?.organizationId) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select an organization for the new user',
      });
      return;
    }

    setProcessing(true);
    try {
      const primaryRoleId = formData.roleIds[0];
      const primaryRole = availableRoles.find(r => r.id === primaryRoleId)?.name || 'Technician / Grower';

      // Determine organization ID: Super Admin can select, others use their own
      const targetOrgId = isSuperAdmin && selectedOrgForCreate 
        ? parseInt(selectedOrgForCreate) 
        : currentUser?.organizationId;

      await usersApi.create({
        ...formData,
        role: primaryRole,
        organizationId: targetOrgId,
        roleIds: formData.roleIds
      });

      toast({
        title: 'User Created',
        description: 'New team member added successfully.',
      });
      setShowCreateDialog(false);
      resetForm();
      setSelectedOrgForCreate('');
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const primaryRoleId = formData.roleIds[0];
      const primaryRole = availableRoles.find(r => r.id === primaryRoleId)?.name || selectedUser.role;

      await usersApi.update(selectedUser.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: primaryRole,
        roleIds: formData.roleIds,
      });

      toast({
        title: 'User Updated',
        description: 'User details updated successfully.',
      });
      setShowEditDialog(false);
      resetForm();
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      await usersApi.delete(selectedUser.id);
      toast({
        title: 'User Deactivated',
        description: 'User access has been revoked.',
      });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deactivation Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long',
      });
      return;
    }

    setProcessing(true);
    try {
      await usersApi.resetPassword(selectedUser.id, newPassword);
      toast({
        title: 'Password Reset',
        description: 'Password has been updated.',
      });
      setShowResetPasswordDialog(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleIds: [],
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roleIds: user.roleIds || [],
    });
    setShowEditDialog(true);
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => {
      const currentIds = prev.roleIds;
      if (currentIds.includes(roleId)) {
        return { ...prev, roleIds: currentIds.filter(id => id !== roleId) };
      } else {
        return { ...prev, roleIds: [...currentIds, roleId] };
      }
    });
  };

  const filteredUsers = users.filter(u =>
    (u.firstName + ' ' + u.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group permissions by resource type
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource_type]) acc[perm.resource_type] = [];
    acc[perm.resource_type].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage team members, roles, and granular access permissions"
        breadcrumbs={[{ label: 'Users & Roles' }]}
        actions={
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <div className="w-[200px]">
                <Select value={selectedOrgFilter} onValueChange={setSelectedOrgFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Active accounts and their assigned roles in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                {isSuperAdmin && <TableHead>Organization</TableHead>}
                <TableHead>Contact</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted-foreground">ID: #{u.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{u.organizationName || 'N/A'}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-2" />
                          {u.email}
                        </div>
                        {u.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 mr-2" />
                            {u.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roleNames && u.roleNames.length > 0 ? (
                          u.roleNames.map((role, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {role.replace('_', ' ')}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">{u.role}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'default' : 'secondary'} className={u.isActive ? "bg-green-100 text-green-800 hover:bg-green-100 border-0" : ""}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-2" />
                        {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(u)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(u);
                            loadPermissions(u.id);
                            setShowPermissionsDialog(true);
                          }}>
                            <Shield className="w-4 h-4 mr-2" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(u);
                            setShowResetPasswordDialog(true);
                          }}>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          {u.id !== currentUser?.id && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteDialog(true);
                              }}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Deactivate User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              User: <span className="font-medium text-foreground">{selectedUser?.firstName} {selectedUser?.lastName}</span>
              <br />
              Grant granular permissions on top of assigned roles.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-1">
            {permissionsLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center">
                        <Shield className="w-3 h-3 mr-2" />
                        {resource}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perms.map(perm => {
                          const isInherited = userPermissions.includes(perm.name) && !explicitPermissions.some(ep => ep.id === perm.id);
                          const isExplicit = explicitPermissions.some(ep => ep.id === perm.id);
                          const isEffective = isInherited || isExplicit;

                          return (
                            <div
                              key={perm.id}
                              className={`
                                                    flex items-start space-x-3 p-3 rounded-lg border 
                                                    ${isEffective ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}
                                                    ${isInherited ? 'opacity-80' : ''}
                                                `}
                            >
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={isEffective}
                                disabled={isInherited}
                                onCheckedChange={() => togglePermission(perm.id, isExplicit, isInherited)}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Label
                                    htmlFor={`perm-${perm.id}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {perm.display_name}
                                  </Label>
                                  {isInherited && <Badge variant="secondary" className="text-[10px] h-4 px-1">Role</Badge>}
                                  {isExplicit && <Badge className="text-[10px] h-4 px-1 bg-green-600">Custom</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {perm.action}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPermissionsDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          resetForm();
          setSelectedOrgForCreate('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Create a new account for a staff member.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Organization selector for Super Admin */}
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="organization">Organization *</Label>
                <Select value={selectedOrgForCreate} onValueChange={setSelectedOrgForCreate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization for new user" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          {org.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  As Super Admin, select which organization this user belongs to
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Assign Roles *</Label>
              {rolesLoading ? (
                <div className="flex items-center justify-center p-4 border rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading roles...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {availableRoles.map((role) => (
                    <div key={role.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.roleIds.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label
                          htmlFor={`role-${role.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {role.display_name || role.name}
                        </Label>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              resetForm();
              setSelectedOrgForCreate('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={processing || rolesLoading}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Create Account</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={formData.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <Label>Roles</Label>
              {rolesLoading ? (
                <div className="flex items-center justify-center p-4 border rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading roles...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {availableRoles.map((role) => (
                    <div key={role.id} className="flex flex-row items-start space-x-3 space-y-0">
                      <Checkbox
                        id={`edit-role-${role.id}`}
                        checked={formData.roleIds.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label
                          htmlFor={`edit-role-${role.id}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {role.display_name || role.name}
                        </Label>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={processing || rolesLoading}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other dialogs  */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedUser?.firstName}? They will immediately lose access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a temporary password for {selectedUser?.firstName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="new-pass">New Password</Label>
            <Input
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={processing || newPassword.length < 8}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
