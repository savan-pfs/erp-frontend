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
    TableRow
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common';
import {
    DollarSign,
    Download,
    Search,
    Users,
    Activity,
    MoreHorizontal,
    Loader2,
    FileText,
    CreditCard,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { billingApi } from '@/lib/api/realApi';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function Billing() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Data states
    const [kpi, setKpi] = useState({
        mrr: 0,
        activeSubscribers: 0,
        arpu: 0,
        churnRate: 0
    });
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
    const [planDistribution, setPlanDistribution] = useState<any[]>([]);

    // Action Dialog States
    const [selectedOrg, setSelectedOrg] = useState<any>(null);
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
    const [showEditPlanDialog, setShowEditPlanDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const [orgInvoices, setOrgInvoices] = useState<any[]>([]);
    const [invoicesLoading, setInvoicesLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Edit Plan Form
    const [editPlanData, setEditPlanData] = useState({
        plan: '',
        amount: 0,
        cycle: 'Monthly'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const overview = await billingApi.getOverview();
            setKpi(overview.kpi);
            setRevenueHistory(overview.revenueHistory || []);
            setPlanDistribution(overview.planDistribution || []);

            const subs = await billingApi.getSubscriptions();
            setSubscriptions(subs);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Data Load Error',
                description: 'Failed to load billing information.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await billingApi.exportReport();
            toast({ title: "Export Started", description: "Your report is downloading..." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Export Failed", description: "Could not generate report." });
        }
    };

    const openInvoiceDialog = async (org: any) => {
        setSelectedOrg(org);
        setShowInvoiceDialog(true);
        setInvoicesLoading(true);
        try {
            const data = await billingApi.getOrgInvoices(org.id);
            setOrgInvoices(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to load invoices." });
        } finally {
            setInvoicesLoading(false);
        }
    };

    const openEditPlanDialog = (org: any) => {
        setSelectedOrg(org);
        setEditPlanData({
            plan: org.subscription_plan,
            amount: parseFloat(org.amount),
            cycle: 'Monthly' // Default or fetch if available
        });
        setShowEditPlanDialog(true);
    };

    const handleGenerateInvoice = async (org: any) => {
        toast({ title: "Generating Invoice", description: "Please wait..." });
        try {
            await billingApi.generateInvoice(org.id);
            toast({ title: "Success", description: "New invoice generated." });
            // If viewing invoices, refresh list
            if (showInvoiceDialog && selectedOrg?.id === org.id) {
                openInvoiceDialog(org);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to generate invoice." });
        }
    };

    const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            toast({ title: "Downloading PDF", description: "Generating attractive invoice..." });
            await billingApi.downloadInvoicePDF(invoiceId, invoiceNumber);
        } catch (error) {
            toast({ variant: 'destructive', title: "Download Failed", description: "Could not download PDF." });
        }
    };

    const handleUpdatePlan = async () => {
        if (!selectedOrg) return;
        setProcessing(true);
        try {
            await billingApi.updatePlan(selectedOrg.id, editPlanData);
            toast({ title: "Plan Updated", description: "Subscription details updated successfully." });
            setShowEditPlanDialog(false);
            loadData(); // Refresh list
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Update Failed", description: error.message || "Failed to update plan." });
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!selectedOrg) return;
        setProcessing(true);
        try {
            await billingApi.cancelSubscription(selectedOrg.id);
            toast({ title: "Subscription Cancelled", description: "The subscription has been cancelled." });
            setShowCancelDialog(false);
            loadData(); // Refresh list
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Cancellation Failed", description: "Failed to cancel subscription." });
        } finally {
            setProcessing(false);
        }
    };

    const filteredSubs = subscriptions.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || sub.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">Active</Badge>;
            case 'Past Due': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Past Due</Badge>;
            case 'Cancelled': return <Badge variant="secondary">Cancelled</Badge>;
            default: return <Badge variant="outline">{status || 'N/A'}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen animate-fade-in">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Billing Administration"
                description="Real-time overview of platform revenue and subscriptions"
                breadcrumbs={[{ label: 'Billing Admin' }]}
                actions={
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total MRR</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${kpi.mrr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.activeSubscribers}</div>
                        <p className="text-xs text-blue-600 flex items-center mt-1">Organizations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Revenue / User</CardTitle>
                        <Activity className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${kpi.arpu}</div>
                        <p className="text-xs text-muted-foreground mt-1">Per Organization</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                        <Activity className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.churnRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Last 30 Days</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue History</CardTitle>
                        <CardDescription>Monthly revenue over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {revenueHistory.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueHistory}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No revenue history available yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Plan Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Distribution</CardTitle>
                        <CardDescription>Revenue by subscription tier</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {planDistribution.length > 0 ? (
                            <>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={planDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                                            <Tooltip formatter={(value) => [`${value}`, 'Count']} cursor={{ fill: 'transparent' }} />
                                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {planDistribution.map((plan: any) => (
                                        <div key={plan.name} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{plan.name}</span>
                                            <span className="font-bold">{plan.count} Orgs (${parseFloat(plan.revenue).toLocaleString()})</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No plan data available.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Customer Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Customer Subscriptions</CardTitle>
                            <CardDescription>Manage user plans and billing status</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customers..."
                                    className="pl-8 w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="past due">Past Due</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Next Billing</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No subscriptions found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredSubs.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="font-medium">{sub.name}</TableCell>
                                        <TableCell><Badge variant="outline">{sub.subscription_plan}</Badge></TableCell>
                                        <TableCell>{sub.user_count}</TableCell>
                                        <TableCell>${sub.amount}/mo</TableCell>
                                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                                        <TableCell>{sub.next_billing_date ? new Date(sub.next_billing_date).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openInvoiceDialog(sub)}>
                                                        <FileText className="w-4 h-4 mr-2" /> View Invoices
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleGenerateInvoice(sub)}>
                                                        <DollarSign className="w-4 h-4 mr-2" /> Generate Invoice
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditPlanDialog(sub)}>
                                                        <CreditCard className="w-4 h-4 mr-2" /> Edit Plan
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedOrg(sub); setShowCancelDialog(true); }}>
                                                        <XCircle className="w-4 h-4 mr-2" /> Cancel Subscription
                                                    </DropdownMenuItem>
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

            {/* Invoices Dialog */}
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Invoice History</DialogTitle>
                        <DialogDescription>Billing history for {selectedOrg?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="h-[400px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Download</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoicesLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                                ) : orgInvoices.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No invoices found.</TableCell></TableRow>
                                ) : (
                                    orgInvoices.map(inv => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                                            <TableCell>{inv.issue_date?.split('T')[0]}</TableCell>
                                            <TableCell>${inv.amount}</TableCell>
                                            <TableCell><Badge variant={inv.status === 'Paid' ? 'outline' : 'secondary'}>{inv.status}</Badge></TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownloadInvoice(inv.id, inv.invoice_number)}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Plan Dialog */}
            <Dialog open={showEditPlanDialog} onOpenChange={setShowEditPlanDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Subscription Plan</DialogTitle>
                        <DialogDescription>Update plan details for {selectedOrg?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan">Plan Tier</Label>
                            <Select
                                value={editPlanData.plan}
                                onValueChange={(val) => {
                                    let amount = 0;
                                    if (val === 'Basic') amount = 99;
                                    if (val === 'Pro') amount = 299;
                                    if (val === 'Enterprise') amount = 999;
                                    setEditPlanData({ ...editPlanData, plan: val, amount });
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Basic">Basic ($99/mo)</SelectItem>
                                    <SelectItem value="Pro">Pro ($299/mo)</SelectItem>
                                    <SelectItem value="Enterprise">Enterprise ($999/mo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Custom Amount ($)</Label>
                            <Input
                                type="number"
                                value={editPlanData.amount}
                                onChange={(e) => setEditPlanData({ ...editPlanData, amount: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditPlanDialog(false)}>Cancel</Button>
                        <Button onClick={handleUpdatePlan} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Subscription Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Cancel Subscription
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel the subscription for <strong>{selectedOrg?.name}</strong>?
                            This action may restrict their access immediately or at the end of the billing cycle.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Subscription</Button>
                        <Button variant="destructive" onClick={handleCancelSubscription} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancellation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
