import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wasteManagementApi } from '@/lib/api/realApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRooms, useBatches, useHarvestBatches } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Trash2,
  Plus,
  Search,
  Scale,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
type WasteType = 'plant_material' | 'trim' | 'failed_qa' | 'expired' | 'other';

const Waste = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWaste, setNewWaste] = useState({
    waste_type: '' as WasteType | '',
    source_type: '',
    weight_lbs: '',
    reason: '',
    disposal_method: '',
    notes: '',
  });

  // Fetch waste records from API
  const { data: apiWasteLogs, isLoading } = useQuery({
    queryKey: ['waste-logs'],
    queryFn: async () => {
      const data = await wasteManagementApi.getAll();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch related data
  const { data: apiRooms } = useRooms();
  const { data: apiBatches } = useBatches();
  const { data: apiHarvestBatches } = useHarvestBatches();

  // Transform API data
  const wasteRecords = (apiWasteLogs || []).map((log: any) => ({
    id: log.id,
    waste_type: log.waste_type || log.wasteType || 'plant_material',
    source_type: log.batch_name || log.room_name || 'Unknown',
    weight_lbs: log.quantity ? (log.unit === 'lbs' ? log.quantity : log.quantity / 453.592) : 0,
    reason: log.reason || '',
    disposal_method: log.disposal_method || log.disposalMethod || '',
    waste_date: log.disposed_at || log.disposedAt || log.waste_date || new Date().toISOString().split('T')[0],
    room_name: log.room_name || log.room?.name || '',
    batch_name: log.batch_name || log.batch?.batchName || '',
    notes: log.notes || log.compliance_notes || '',
  }));

  // Facility logic removed

  // Create waste record via backend API
  const createWaste = useMutation({
    mutationFn: async (wasteData: typeof newWaste) => {
      if (!wasteData.waste_type || !wasteData.reason || !wasteData.weight_lbs) {
        throw new Error('Waste type, reason, and weight are required');
      }
      const quantity = parseFloat(String(wasteData.weight_lbs));
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Please enter a valid weight');
      }
      const payload = {
        wasteType: wasteData.waste_type,
        reason: wasteData.reason,
        quantity,
        unit: 'lbs' as const,
        disposalMethod: wasteData.disposal_method || undefined,
        complianceNotes: wasteData.notes || undefined,
      };
      return wasteManagementApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-logs'] });
      setIsDialogOpen(false);
      setNewWaste({
        waste_type: '',
        source_type: '',
        weight_lbs: '',
        reason: '',
        disposal_method: '',
        notes: '',
      });
      toast({
        title: 'Waste record created',
        description: 'Waste has been logged for compliance.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter waste records
  const filteredWaste = wasteRecords?.filter((record) => {
    const matchesSearch =
      record.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.source_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.batch_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || record.waste_type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Calculate stats from API data
  const stats = {
    totalRecords: wasteRecords?.length || 0,
    totalWeight: wasteRecords?.reduce((sum, r) => sum + Number(r.weight_lbs), 0) || 0,
    thisMonth: wasteRecords?.filter(r => {
      const wasteDate = new Date(r.waste_date);
      const now = new Date();
      return wasteDate.getMonth() === now.getMonth() && wasteDate.getFullYear() === now.getFullYear();
    }).reduce((sum, r) => sum + Number(r.weight_lbs), 0) || 0,
    pendingDisposal: wasteRecords?.filter(r => !r.disposal_date).length || 0,
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      plant_material: 'bg-green-500/10 text-green-500 border-green-500/20',
      stems: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      roots: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      leaves: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      trim: 'bg-lime-500/10 text-lime-500 border-lime-500/20',
      failed_product: 'bg-red-500/10 text-red-500 border-red-500/20',
      contaminated: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaste.waste_type || !newWaste.quantity || !newWaste.reason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in waste type, quantity, and reason.',
        variant: 'destructive',
      });
      return;
    }
    createWaste.mutate(newWaste);
  };

  const wasteTypes: WasteType[] = ['plant_material', 'trim', 'failed_qa', 'expired', 'other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Waste Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and document waste for compliance
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Log Waste
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log Waste Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waste_type">Waste Type *</Label>
                <Select
                  value={newWaste.waste_type}
                  onValueChange={(value) => setNewWaste({ ...newWaste, waste_type: value as WasteType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId">Room (Optional)</Label>
                  <Select
                    value={newWaste.roomId}
                    onValueChange={(value) => setNewWaste({ ...newWaste, roomId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {apiRooms?.filter((r: any) => r.isActive !== false).map((room: any) => (
                        <SelectItem key={room.id} value={String(room.id)}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchId">Batch (Optional)</Label>
                  <Select
                    value={newWaste.batchId}
                    onValueChange={(value) => setNewWaste({ ...newWaste, batchId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {apiBatches?.filter((b: any) => b.isActive !== false).map((batch: any) => (
                        <SelectItem key={batch.id} value={String(batch.id)}>
                          {batch.batchName || batch.batch_name || `Batch ${batch.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="100.00"
                    value={newWaste.quantity}
                    onChange={(e) => setNewWaste({ ...newWaste, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={newWaste.unit}
                    onValueChange={(value) => setNewWaste({ ...newWaste, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  placeholder="Reason for waste"
                  value={newWaste.reason}
                  onChange={(e) => setNewWaste({ ...newWaste, reason: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposal_method">Disposal Method</Label>
                <Input
                  id="disposal_method"
                  placeholder="e.g., Composting, Incineration"
                  value={newWaste.disposal_method}
                  onChange={(e) => setNewWaste({ ...newWaste, disposal_method: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compliance_notes">Compliance Notes</Label>
                <Textarea
                  id="compliance_notes"
                  placeholder="Compliance documentation..."
                  value={newWaste.compliance_notes}
                  onChange={(e) => setNewWaste({ ...newWaste, compliance_notes: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={newWaste.notes}
                  onChange={(e) => setNewWaste({ ...newWaste, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createWaste.isPending}>
                  {createWaste.isPending ? 'Saving...' : 'Log Waste'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="text-2xl font-bold">{stats.totalWeight.toFixed(1)} lbs</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Scale className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-orange-500">{stats.thisMonth.toFixed(1)} lbs</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Disposal</p>
                <p className="text-2xl font-bold text-yellow-500">{Object.keys(stats.byType || {}).length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search waste records..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Waste Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {wasteTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Waste Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredWaste && filteredWaste.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Disposal Method</TableHead>
                  <TableHead>Disposed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWaste.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.waste_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(record.waste_type)}>
                        {record.waste_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{record.source_type}</TableCell>
                    <TableCell>{record.weight_lbs} lbs</TableCell>
                    <TableCell className="max-w-xs truncate">{record.reason}</TableCell>
                    <TableCell>{record.disposal_method || '-'}</TableCell>
                    <TableCell>
                      {record.disposal_date ? (
                        <Badge className="bg-green-500/10 text-green-500">
                          {new Date(record.disposal_date).toLocaleDateString()}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No waste records</h3>
              <p className="text-muted-foreground mb-4">Start logging waste for compliance tracking</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Log Waste
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Waste;
