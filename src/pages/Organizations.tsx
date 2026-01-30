import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Globe,
    MoreHorizontal,
    Search,
    Filter,
    ShieldCheck,
    Mail,
    Phone,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2,
    Building2,
    AlertCircle
} from 'lucide-react';
import { organizationsApi, billingApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Organizations() {
    const { toast } = useToast();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('active');

    // Action states
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            setLoading(true);
            const data = await organizationsApi.getAll();
            setOrganizations(data);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load organizations',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedOrg) return;

        setProcessing(true);
        try {
            await organizationsApi.approve(selectedOrg.id);
            toast({
                title: 'Organization Approved',
                description: `${selectedOrg.name} has been approved successfully.`,
            });
            setShowApproveDialog(false);
            setSelectedOrg(null);
            loadOrganizations();
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

    const handleSuspend = async () => {
        if (!selectedOrg) return;

        setProcessing(true);
        try {
            // Toggle active status (Suspend = isActive: false)
            await organizationsApi.update(selectedOrg.id, { isActive: false });
            toast({
                title: 'Organization Suspended',
                description: `${selectedOrg.name} has been suspended.`
            });
            setShowSuspendDialog(false);
            setSelectedOrg(null);
            loadOrganizations();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Suspension Failed',
                description: error.message
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateSubscription = async () => {
        if (!selectedOrg || !selectedPlan) return;

        setProcessing(true);
        try {
            await billingApi.updatePlan(selectedOrg.id, { plan: selectedPlan, amount: 0 }); // Amount 0 for now/demo
            toast({
                title: 'Subscription Updated',
                description: `Subscription for ${selectedOrg.name} updated to ${selectedPlan}.`
            });
            setShowSubscriptionDialog(false);
            setSelectedOrg(null);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedOrg || !rejectionReason.trim()) {
            toast({
                variant: 'destructive',
                title: 'Reason required',
                description: 'Please provide a reason for rejecting this organization.',
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
            loadOrganizations();
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

    const filteredOrgs = organizations.filter(org => {
        const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.email?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'active') return org.approval_status === 'APPROVED';
        if (activeTab === 'pending') return org.approval_status === 'PENDING_APPROVAL';
        if (activeTab === 'rejected') return org.approval_status === 'REJECTED';
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Active</Badge>;
            case 'PENDING_APPROVAL':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">Pending</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Organizations"
                description="Manage all organizations registered on the platform"
                breadcrumbs={[{ label: 'Organizations' }]}
                actions={
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search organizations..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                }
            />

            <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending
                        {organizations.some(o => o.approval_status === 'PENDING_APPROVAL') && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {activeTab === 'active' && 'Active Organizations'}
                                {activeTab === 'pending' && 'Pending Approval'}
                                {activeTab === 'rejected' && 'Rejected Organizations'}
                                {activeTab === 'all' && 'All Organizations'}
                            </CardTitle>
                            <CardDescription>
                                {activeTab === 'pending'
                                    ? 'Review and approve new organization registrations'
                                    : 'List of organizations currently registered on the platform'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>License</TableHead>
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
                                                    Loading organizations...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredOrgs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                    <Building2 className="w-10 h-10 opacity-20" />
                                                    <p>No organizations found in this category.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrgs.map((org) => (
                                            <TableRow key={org.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <Globe className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{org.name}</p>
                                                            <p className="text-xs text-muted-foreground">{org.type || 'Cultivation'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-muted-foreground">
                                                            <Mail className="w-3 h-3 mr-2" />
                                                            {org.email || 'N/A'}
                                                        </div>
                                                        {org.phone && (
                                                            <div className="flex items-center text-sm text-muted-foreground">
                                                                <Phone className="w-3 h-3 mr-2" />
                                                                {org.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                        {org.license_number || 'PENDING'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(org.approval_status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <Calendar className="w-3 h-3 mr-2" />
                                                        {new Date(org.created_at).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        {org.approval_status === 'PENDING_APPROVAL' ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                                    onClick={() => {
                                                                        setSelectedOrg(org);
                                                                        setShowApproveDialog(true);
                                                                    }}
                                                                >
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
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => {
                                                                        setSelectedOrg(org);
                                                                        setShowDetailsDialog(true);
                                                                    }}>View Details</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => {
                                                                        setSelectedOrg(org);
                                                                        setShowSubscriptionDialog(true);
                                                                    }}>Manage Subscription</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => {
                                                                            setSelectedOrg(org);
                                                                            setShowSuspendDialog(true);
                                                                        }}
                                                                    >Suspend Organization</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            Approve Organization
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve <span className="font-medium text-foreground">"{selectedOrg?.name}"</span>?
                            This will grant them full access to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowApproveDialog(false);
                                setSelectedOrg(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Confirm Approval
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
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            Reject Organization
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting <span className="font-medium text-foreground">"{selectedOrg?.name}"</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason">Rejection Reason <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason..."
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setSelectedOrg(null);
                                setRejectionReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing || !rejectionReason.trim()}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Rejecting...
                                </>
                            ) : 'Reject Organization'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suspend Dialog */}
            <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            Suspend Organization
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to suspend <span className="font-medium text-foreground">"{selectedOrg?.name}"</span>?
                            Their access to the platform will be revoked immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleSuspend} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suspend Organization"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Organization Details</DialogTitle>
                        <DialogDescription>Full details for {selectedOrg?.name}</DialogDescription>
                    </DialogHeader>
                    {selectedOrg && (
                        <div className="grid grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-muted-foreground">Legal Name</Label>
                                    <p className="font-medium">{selectedOrg.legal_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Tax ID</Label>
                                    <p className="font-medium">{selectedOrg.tax_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Location</Label>
                                    <p className="font-medium">{selectedOrg.location_state_code}, {selectedOrg.location_country_code}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-muted-foreground">License Number</Label>
                                    <p className="font-medium">{selectedOrg.license_number || 'Pending'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Joined Date</Label>
                                    <p className="font-medium">{new Date(selectedOrg.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Description</Label>
                                    <p className="text-sm">{selectedOrg.description || 'No description provided'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Subscription Dialog */}
            <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage Subscription</DialogTitle>
                        <DialogDescription>Update subscription plan for {selectedOrg?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select onValueChange={setSelectedPlan} defaultValue={selectedPlan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="starter">Starter ($49/mo)</SelectItem>
                                    <SelectItem value="growth">Growth ($149/mo)</SelectItem>
                                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdateSubscription} disabled={processing || !selectedPlan}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Subscription"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
