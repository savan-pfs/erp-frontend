import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  Users,
  Home,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Loader2,
  Eye,
  Edit,
  Shield,
  Thermometer,
  Droplets,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/common";

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
  totalRooms: number;
  activeRooms: number;
  totalCapacity: number;
  currentOccupancy: number;
  manager: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  facility: string;
  room: string;
  status: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

const Facilities = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock facilities
  const facilities: Facility[] = [
    {
      id: "FAC-001",
      name: "PassionFarm Main Campus",
      type: "Cultivation",
      address: "1234 Green Valley Road",
      city: "Denver",
      state: "CO",
      zip: "80202",
      phone: "(303) 555-0100",
      email: "main@passionfarmd.com",
      licenseNumber: "LIC-2024-001",
      licenseExpiry: "2025-06-15",
      status: "active",
      totalRooms: 12,
      activeRooms: 10,
      totalCapacity: 5000,
      currentOccupancy: 4250,
      manager: "John Smith",
    },
    {
      id: "FAC-002",
      name: "PassionFarm Processing",
      type: "Manufacturing",
      address: "5678 Industrial Blvd",
      city: "Denver",
      state: "CO",
      zip: "80205",
      phone: "(303) 555-0200",
      email: "processing@passionfarmd.com",
      licenseNumber: "LIC-2024-002",
      licenseExpiry: "2025-08-20",
      status: "active",
      totalRooms: 6,
      activeRooms: 5,
      totalCapacity: 0,
      currentOccupancy: 0,
      manager: "Jane Doe",
    },
    {
      id: "FAC-003",
      name: "PassionFarm Warehouse",
      type: "Distribution",
      address: "9012 Commerce Drive",
      city: "Aurora",
      state: "CO",
      zip: "80010",
      phone: "(303) 555-0300",
      email: "warehouse@passionfarmd.com",
      licenseNumber: "LIC-2024-003",
      licenseExpiry: "2025-03-10",
      status: "attention",
      totalRooms: 4,
      activeRooms: 4,
      totalCapacity: 0,
      currentOccupancy: 0,
      manager: "Mike Johnson",
    },
  ];

  // Mock equipment
  const equipment: Equipment[] = [
    {
      id: "EQP-001",
      name: "HVAC System A",
      type: "Climate Control",
      facility: "Main Campus",
      room: "Flower Room A",
      status: "operational",
      lastMaintenance: "2024-11-15",
      nextMaintenance: "2025-02-15",
    },
    {
      id: "EQP-002",
      name: "LED Grow Lights Array 1",
      type: "Lighting",
      facility: "Main Campus",
      room: "Flower Room A",
      status: "operational",
      lastMaintenance: "2024-12-01",
      nextMaintenance: "2025-03-01",
    },
    {
      id: "EQP-003",
      name: "Irrigation System",
      type: "Watering",
      facility: "Main Campus",
      room: "All Rooms",
      status: "maintenance_due",
      lastMaintenance: "2024-09-10",
      nextMaintenance: "2024-12-10",
    },
    {
      id: "EQP-004",
      name: "CO2 Generator",
      type: "Environment",
      facility: "Main Campus",
      room: "Flower Room B",
      status: "operational",
      lastMaintenance: "2024-10-20",
      nextMaintenance: "2025-01-20",
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
      case "operational":
        return { color: "bg-success/10 text-success", label: status === "active" ? "Active" : "Operational", icon: <CheckCircle2 className="w-3 h-3" /> };
      case "attention":
      case "maintenance_due":
        return { color: "bg-warning/10 text-warning", label: status === "attention" ? "Needs Attention" : "Maintenance Due", icon: <AlertTriangle className="w-3 h-3" /> };
      case "inactive":
        return { color: "bg-gray-500/10 text-gray-600", label: "Inactive", icon: null };
      default:
        return { color: "bg-gray-500/10 text-gray-600", label: status, icon: null };
    }
  };

  const getFacilityTypeColor = (type: string) => {
    switch (type) {
      case "Cultivation":
        return "bg-success/10 text-success";
      case "Manufacturing":
        return "bg-purple-500/10 text-purple-600";
      case "Distribution":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const handleCreateFacility = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }, 1000);
  };

  const totalRooms = facilities.reduce((sum, f) => sum + f.totalRooms, 0);
  const activeRooms = facilities.reduce((sum, f) => sum + f.activeRooms, 0);
  const totalCapacity = facilities.reduce((sum, f) => sum + f.totalCapacity, 0);
  const currentOccupancy = facilities.reduce((sum, f) => sum + f.currentOccupancy, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Facilities"
        description="Manage facilities, rooms, and equipment"
        breadcrumbs={[{ label: "Operations", href: "/tasks" }, { label: "Facilities" }]}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Facility
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Facility</DialogTitle>
                <DialogDescription>Register a new facility location</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Facility Name</Label>
                  <Input placeholder="Facility name..." />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultivation">Cultivation</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input placeholder="Street address..." />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input placeholder="State" />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP</Label>
                    <Input placeholder="ZIP" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="(xxx) xxx-xxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input placeholder="LIC-XXXX-XXX" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFacility} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Facility"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Facilities"
          value={facilities.length}
          icon={<Building2 className="w-5 h-5" />}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Rooms"
          value={`${activeRooms}/${totalRooms}`}
          icon={<Home className="w-5 h-5" />}
          iconColor="bg-blue-500/10 text-blue-600"
          subtitle="Active / Total"
        />
        <StatCard
          title="Plant Capacity"
          value={totalCapacity.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Current Occupancy"
          value={`${Math.round((currentOccupancy / totalCapacity) * 100)}%`}
          icon={<Thermometer className="w-5 h-5" />}
          iconColor="bg-orange-500/10 text-orange-600"
          subtitle={`${currentOccupancy.toLocaleString()} plants`}
        />
      </div>

      <Tabs defaultValue="facilities" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="facilities" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {facilities.map((facility) => {
              const statusConfig = getStatusConfig(facility.status);
              const occupancyPercent = facility.totalCapacity > 0
                ? Math.round((facility.currentOccupancy / facility.totalCapacity) * 100)
                : 0;
              return (
                <Card key={facility.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{facility.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getFacilityTypeColor(facility.type)} border-0`}>
                              {facility.type}
                            </Badge>
                            <Badge className={`${statusConfig.color} border-0`}>
                              {statusConfig.icon}
                              <span className="ml-1">{statusConfig.label}</span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span>
                          {facility.address}, {facility.city}, {facility.state} {facility.zip}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{facility.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{facility.email}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            License
                          </span>
                          <span className="font-mono">{facility.licenseNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expires</span>
                          <span>{new Date(facility.licenseExpiry).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl border text-center">
                          <p className="text-2xl font-bold">{facility.activeRooms}/{facility.totalRooms}</p>
                          <p className="text-xs text-muted-foreground">Active Rooms</p>
                        </div>
                        {facility.totalCapacity > 0 && (
                          <div className="p-3 rounded-xl border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">Occupancy</span>
                              <span className="text-sm font-bold">{occupancyPercent}%</span>
                            </div>
                            <Progress value={occupancyPercent} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Manager: {facility.manager}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Equipment Inventory</CardTitle>
                  <CardDescription>Track and manage facility equipment</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Equipment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {equipment.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  return (
                    <div
                      key={item.id}
                      className="p-4 border rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            {item.type === "Climate Control" ? (
                              <Thermometer className="w-6 h-6 text-primary" />
                            ) : item.type === "Watering" ? (
                              <Droplets className="w-6 h-6 text-primary" />
                            ) : (
                              <Settings className="w-6 h-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{item.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {item.facility} • {item.room}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${statusConfig.color} border-0`}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            Next: {new Date(item.nextMaintenance).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Facilities;
