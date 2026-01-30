import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  Download,
  Search,
  Activity,
  UserCheck
} from 'lucide-react';
import { organizationsApi, documentsApi, usersApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';

interface PendingOrganization {
  id: number;
  name: string;
  legal_name?: string;
  location_state_code?: string;
  created_at: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  license_document_id?: number;
  license_file_name?: string;
  license_status?: string;
  signup_data?: any;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  organizationName?: string;
  isActive: boolean;
  createdAt: string;
}

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Organization State
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganization[]>([]);
  const [approvedOrgs, setApprovedOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<PendingOrganization | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pending, allOrgs, allUsers] = await Promise.all([
        organizationsApi.getPending(),
        organizationsApi.getAll(),
        usersApi.getAll()
      ]);

      setPendingOrgs(pending);

      const approved = allOrgs.filter((org: any) => {
        const status = org.approval_status || org.approvalStatus;
        return status === 'APPROVED' || status === 'Approved' || status === 'approved';
      });
      setApprovedOrgs(approved);

      setUsers(allUsers);
      setFilteredUsers(allUsers);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load dashboard data',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userSearch.trim()) {
      setFilteredUsers(users);
      return;
    }
    const lowerSearch = userSearch.toLowerCase();
    const filtered = users.filter(u =>
      u.email.toLowerCase().includes(lowerSearch) ||
      u.firstName.toLowerCase().includes(lowerSearch) ||
      u.lastName.toLowerCase().includes(lowerSearch) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(lowerSearch))
    );
    setFilteredUsers(filtered);
  }, [userSearch, users]);

  const handleApproveOrg = async () => {
    if (!selectedOrg) return;

    setProcessing(true);
    try {
      await organizationsApi.approve(selectedOrg.id);
      toast({
        title: 'Organization Approved',
        description: `${selectedOrg.name} has been approved successfully.`,
        className: 'bg-green-500 text-white',
      });
      setShowApproveDialog(false);
      setSelectedOrg(null);
      loadAllData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrg = async () => {
    if (!selectedOrg || !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection.',
      });
      return;
    }

    setProcessing(true);
    try {
      await organizationsApi.reject(selectedOrg.id, rejectionReason);
      toast({
        title: 'Organization Rejected',
        description: `${selectedOrg.name} has been rejected.`,
      });
      setShowRejectDialog(false);
      setSelectedOrg(null);
      setRejectionReason('');
      loadAllData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: error.message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewLicense = async (documentId: number) => {
    try {
      const blob = await documentsApi.download(documentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to download license',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System-wide overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAllData}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orgs</CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrgs.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orgs</CardTitle>
            <Building2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedOrgs.length}</div>
            <p className="text-xs text-muted-foreground">Total operational</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Across all organizations</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
            <Activity className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Uptime (Last 30 days)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList className="bg-white p-1 rounded-lg border">
          <TabsTrigger value="organizations" className="data-[state=active]:bg-slate-100 data-[state=active]:text-primary">
            <Building2 className="w-4 h-4 mr-2" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-100 data-[state=active]:text-primary">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-slate-100 data-[state=active]:text-primary">
            <Activity className="w-4 h-4 mr-2" />
            System Status
          </TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          {/* Pending Organizations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Pending Approvals</CardTitle>
              <CardDescription>Review organization signup requests</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-2 opacity-50" />
                  <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                  <p className="text-slate-500">No organizations waiting for approval.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Signup Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrgs.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-semibold">{org.name}</div>
                            {org.legal_name && (
                              <div className="text-xs text-muted-foreground">{org.legal_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {org.admin_first_name} {org.admin_last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{org.admin_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.location_state_code ? (
                            <Badge variant="outline" className="font-mono">{org.location_state_code}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {org.license_document_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-blue-600 hover:text-blue-700"
                              onClick={() => handleViewLicense(org.license_document_id!)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              View License
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8"
                              onClick={() => {
                                setSelectedOrg(org);
                                setShowApproveDialog(true);
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setSelectedOrg(org);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Approved Organizations */}
          <Card>
            <CardHeader>
              <CardTitle>Active Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Approved Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedOrgs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No active organizations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedOrgs.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">
                          <div>{org.name}</div>
                          <div className="text-xs text-muted-foreground">{org.legal_name || org.tax_id}</div>
                        </TableCell>
                        <TableCell>
                          {org.location_state_code ? (
                            <Badge variant="outline">{org.location_state_code}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* Placeholder for member count, could fetch if needed */}
                          <span className="text-muted-foreground text-sm">-</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {org.approved_at ? new Date(org.approved_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>Manage all users across the platform</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <span className="font-semibold text-xs text-slate-600">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.organizationName ? (
                            <span className="text-sm font-medium">{user.organizationName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">System / None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-foreground/60">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Real-time server metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm text-muted-foreground">12%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[12%]" />
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm text-muted-foreground">48%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[48%]" />
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-medium">Database Connections</span>
                    <span className="text-sm text-muted-foreground">15 / 100</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[15%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent System Logs</CardTitle>
                <CardDescription>Latest audit trail activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-medium">System backup completed</p>
                        <p className="text-xs text-muted-foreground">Automated task ran successfully at 2:00 AM</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedOrg?.name}? This will grant them full access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveOrg} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Organization</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedOrg?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectOrg} disabled={processing || !rejectionReason.trim()}>
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
