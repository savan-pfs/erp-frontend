import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Database, HardDrive, Activity, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { databaseApi } from '@/lib/api/realApi';

export default function DatabaseStats() {
    const { toast } = useToast();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await databaseApi.getStats();
            setStats(data);
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to load database statistics." });
        } finally {
            setLoading(false);
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
                title="Database Status"
                description="Monitor system storage and performance metrics"
                breadcrumbs={[{ label: 'Database Status' }]}
                actions={
                    <Button variant="outline" onClick={loadStats}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.summary?.dbSize || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">Total storage used</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.summary?.connections || 0}</div>
                        <p className="text-xs text-muted-foreground">Current sessions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.summary?.totalTables || 0}</div>
                        <p className="text-xs text-muted-foreground">Managed relations</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Table Statistics</CardTitle>
                    <CardDescription>Storage usage by table</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Table Name</TableHead>
                                <TableHead className="text-right">Row Count</TableHead>
                                <TableHead className="text-right">Total Size</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats?.tables?.map((table: any) => (
                                <TableRow key={table.table_name}>
                                    <TableCell className="font-medium font-mono text-sm">{table.table_name}</TableCell>
                                    <TableCell className="text-right">{parseInt(table.row_count).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{table.total_size}</TableCell>
                                    <TableCell className="text-right"><Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Healthy</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
