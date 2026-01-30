import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Key,
  Loader2,
  Search,
  Settings,
  Eye,
  Lock,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader, StatCard, EmptyState } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { rolesApi, permissionsApi, usersApi } from "@/lib/api/realApi";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  member_count: number;
  is_system: boolean;
  organization_id?: number;
  dashboard_view?: string;
}

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
}

const DASHBOARD_VIEW_OPTIONS = [
  { value: "default", label: "Default Dashboard" },
  { value: "cultivation", label: "Cultivation Dashboard" },
  { value: "inventory", label: "Inventory Dashboard" },
  { value: "manufacturing", label: "Manufacturing Dashboard" },
  { value: "compliance", label: "Compliance Dashboard" },
  { value: "analytics", label: "Analytics Dashboard" },
  { value: "minimal", label: "Minimal Dashboard" },
];

const RolesPermissions = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin, isOrgAdmin } = usePermissions();

  // State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDashboardConfigDialog, setShowDashboardConfigDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    display_name: "",
    description: "",
    dashboard_view: "default",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        rolesApi.getAll(),
        permissionsApi.getAll(),
      ]);
      setRoles(rolesData || []);
      setPermissions(permsData || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter roles by search
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const resource = perm.resource || perm.name.split(":")[0];
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleCreateRole = async () => {
    if (!roleFormData.name || !roleFormData.display_name) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and Display Name are required",
      });
      return;
    }

    setProcessing(true);
    try {
      await rolesApi.create({
        name: roleFormData.name.toLowerCase().replace(/\s+/g, "_"),
        display_name: roleFormData.display_name,
        description: roleFormData.description,
        dashboard_view: roleFormData.dashboard_view,
        permission_ids: selectedPermissions,
      });
      toast({
        title: "Role Created",
        description: `${roleFormData.display_name} has been created successfully.`,
      });
      setShowCreateRoleDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create role",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;

    setProcessing(true);
    try {
      await rolesApi.update(selectedRole.id, {
        display_name: roleFormData.display_name,
        description: roleFormData.description,
        dashboard_view: roleFormData.dashboard_view,
        permission_ids: selectedPermissions,
      });
      toast({
        title: "Role Updated",
        description: `${roleFormData.display_name} has been updated successfully.`,
      });
      setShowEditRoleDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    if (selectedRole.is_system) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: "System roles cannot be deleted.",
      });
      return;
    }

    setProcessing(true);
    try {
      await rolesApi.delete(selectedRole.id);
      toast({
        title: "Role Deleted",
        description: `${selectedRole.display_name} has been deleted.`,
      });
      setShowDeleteDialog(false);
      setSelectedRole(null);
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete role",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData({
      name: role.name,
      display_name: role.display_name || role.name,
      description: role.description || "",
      dashboard_view: role.dashboard_view || "default",
    });
    // Get permission IDs from role permissions
    const permIds = (role.permissions || [])
      .map((permName) => {
        const perm = permissions.find((p) => p.name === permName);
        return perm?.id;
      })
      .filter((id): id is number => id !== undefined);
    setSelectedPermissions(permIds);
    setShowEditRoleDialog(true);
  };

  const handleConfigureDashboard = (role: Role) => {
    setSelectedRole(role);
    setRoleFormData((prev) => ({
      ...prev,
      dashboard_view: role.dashboard_view || "default",
    }));
    setShowDashboardConfigDialog(true);
  };

  const handleSaveDashboardConfig = async () => {
    if (!selectedRole) return;

    setProcessing(true);
    try {
      await rolesApi.update(selectedRole.id, {
        dashboard_view: roleFormData.dashboard_view,
      });
      toast({
        title: "Dashboard View Updated",
        description: `Dashboard view for ${selectedRole.display_name} has been updated.`,
      });
      setShowDashboardConfigDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const resetForm = () => {
    setRoleFormData({
      name: "",
      display_name: "",
      description: "",
      dashboard_view: "default",
    });
    setSelectedPermissions([]);
    setSelectedRole(null);
  };

  const getRoleTypeColor = (role: Role) => {
    if (role.is_system) return "bg-blue-500/10 text-blue-600";
    if (role.name.includes("admin")) return "bg-purple-500/10 text-purple-600";
    return "bg-green-500/10 text-green-600";
  };

  // Stats
  const totalRoles = roles.length;
  const systemRoles = roles.filter((r) => r.is_system).length;
  const customRoles = roles.filter((r) => !r.is_system).length;
  const totalPermissions = permissions.length;

  // Check if user can manage roles
  const canManageRoles = isSuperAdmin || isOrgAdmin;

  if (!canManageRoles) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Only Super Admins and Organization Admins can manage roles and permissions.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles, permissions, and dashboard views"
        breadcrumbs={[
          { label: "Management", href: "/users" },
          { label: "Roles & Permissions" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button onClick={() => setShowCreateRoleDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Roles"
          value={totalRoles}
          icon={<Shield className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="System Roles"
          value={systemRoles}
          icon={<Lock className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Custom Roles"
          value={customRoles}
          icon={<Settings className="w-5 h-5" />}
          iconColor="bg-green-500/10 text-green-600"
        />
        <StatCard
          title="Permissions"
          value={totalPermissions}
          icon={<Key className="w-5 h-5" />}
          iconColor="bg-purple-500/10 text-purple-600"
        />
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Role-Based Access Control</AlertTitle>
        <AlertDescription>
          Each role can have a dedicated dashboard view. Users assigned to a role will see the configured dashboard when they log in. 
          {isSuperAdmin && " As a Super Admin, you have full control over all roles and permissions."}
          {isOrgAdmin && !isSuperAdmin && " As an Organization Admin, you can manage roles within your organization."}
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Key className="w-4 h-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="dashboard-views" className="gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Views
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No roles found"
              description="Create your first custom role to get started."
              action={{
                label: "Create Role",
                onClick: () => setShowCreateRoleDialog(true),
                icon: Plus,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleTypeColor(role)}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {role.display_name || role.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {role.name}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {role.is_system && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {role.description || "No description"}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{role.member_count || 0} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {Array.isArray(role.permissions) ? role.permissions.length : 0} permissions
                        </span>
                      </div>
                    </div>

                    {role.dashboard_view && role.dashboard_view !== "default" && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <LayoutDashboard className="w-3 h-3" />
                        <span>
                          {DASHBOARD_VIEW_OPTIONS.find((o) => o.value === role.dashboard_view)?.label || role.dashboard_view}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditRole(role)}
                        disabled={role.is_system && !isSuperAdmin}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleConfigureDashboard(role)}
                      >
                        <LayoutDashboard className="w-3 h-3 mr-1" />
                        Dashboard
                      </Button>
                      {!role.is_system && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>All Permissions</CardTitle>
              <CardDescription>
                Overview of all available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        {resource}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perms.map((perm) => (
                          <div
                            key={perm.id}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {perm.action}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">
                              {perm.display_name || perm.name}
                            </p>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {perm.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Views Tab */}
        <TabsContent value="dashboard-views">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard View Configuration</CardTitle>
              <CardDescription>
                Configure which dashboard view each role sees when they log in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleTypeColor(role)}`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{role.display_name || role.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.member_count || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {DASHBOARD_VIEW_OPTIONS.find((o) => o.value === (role.dashboard_view || "default"))?.label || "Default"}
                        </p>
                        <p className="text-xs text-muted-foreground">Current View</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfigureDashboard(role)}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a custom role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., shift_supervisor"
                  value={roleFormData.name}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Shift Supervisor"
                  value={roleFormData.display_name}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, display_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Role description..."
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dashboard View</Label>
              <Select
                value={roleFormData.dashboard_view}
                onValueChange={(value) =>
                  setRoleFormData({ ...roleFormData, dashboard_view: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dashboard view" />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_VIEW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <ScrollArea className="h-64 border rounded-lg p-3">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="mb-4">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
                      {resource}
                    </h4>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <Label
                            htmlFor={`perm-${perm.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {perm.display_name || perm.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role settings and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_display_name">Display Name</Label>
              <Input
                id="edit_display_name"
                value={roleFormData.display_name}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, display_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={roleFormData.description}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dashboard View</Label>
              <Select
                value={roleFormData.dashboard_view}
                onValueChange={(value) =>
                  setRoleFormData({ ...roleFormData, dashboard_view: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_VIEW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <ScrollArea className="h-64 border rounded-lg p-3">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="mb-4">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
                      {resource}
                    </h4>
                    <div className="space-y-2">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-perm-${perm.id}`}
                            checked={selectedPermissions.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <Label
                            htmlFor={`edit-perm-${perm.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {perm.display_name || perm.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Config Dialog */}
      <Dialog open={showDashboardConfigDialog} onOpenChange={setShowDashboardConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Dashboard View</DialogTitle>
            <DialogDescription>
              Set the default dashboard view for {selectedRole?.display_name || selectedRole?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dashboard View</Label>
              <Select
                value={roleFormData.dashboard_view}
                onValueChange={(value) =>
                  setRoleFormData({ ...roleFormData, dashboard_view: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_VIEW_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Users with this role will see this dashboard by default when they log in.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDashboardConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDashboardConfig} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedRole?.display_name || selectedRole?.name}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPermissions;
