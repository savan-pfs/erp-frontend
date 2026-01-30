import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { staticData } from "@/lib/staticData";
import { PageHeader } from "@/components/common";
import {
  Settings as SettingsIcon,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  User,
  Building,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  HardDrive,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Download,
  Upload,
  FileText,
  Key,
  Users,
  Zap,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Appearance
    theme: "light",
    compactMode: false,
    animationsEnabled: true,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    complianceAlerts: true,
    
    // Regional
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    timezone: "America/Denver",
    
    // Security
    twoFactorEnabled: false,
    sessionTimeout: "30",
    
    // Data
    autoBackup: true,
    backupFrequency: "daily",
  });

  const handleSeedDatabase = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to reset data",
        variant: "destructive",
      });
      return;
    }

    setIsSeeding(true);
    try {
      staticData.reset();
      toast({
        title: "Success!",
        description: "Data has been reset to default demo data",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset data",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!user?.id) return;

    setIsClearing(true);
    try {
      staticData.reset();
      toast({
        title: "Success!",
        description: "Data has been reset",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear data",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
    setIsSaving(false);
  };

  const SettingsSection = ({
    icon: Icon,
    title,
    description,
    children,
    action,
  }: {
    icon: any;
    title: string;
    description: string;
    children: React.ReactNode;
    action?: React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const SettingsRow = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Manage your account and application settings"
        breadcrumbs={[{ label: "Settings" }]}
        actions={
          <Button onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        }
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <SettingsSection
            icon={Palette}
            title="Appearance"
            description="Customize how the application looks"
          >
            <div className="space-y-1">
              <SettingsRow label="Theme" description="Select your preferred theme">
                <div className="flex items-center gap-2">
                  <Button
                    variant={settings.theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, theme: "light" })}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={settings.theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, theme: "dark" })}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={settings.theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, theme: "system" })}
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    System
                  </Button>
                </div>
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Compact Mode"
                description="Use smaller spacing and font sizes"
              >
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, compactMode: checked })
                  }
                />
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Animations"
                description="Enable smooth transitions and animations"
              >
                <Switch
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, animationsEnabled: checked })
                  }
                />
              </SettingsRow>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Globe}
            title="Regional Settings"
            description="Configure language and date/time formats"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) =>
                    setSettings({ ...settings, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) =>
                    setSettings({ ...settings, dateFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select
                  value={settings.timeFormat}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timeFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <SettingsSection
            icon={User}
            title="Profile"
            description="Manage your personal information"
            action={
              <Button variant="outline" onClick={() => navigate("/profile")}>
                Edit Profile
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            }
          >
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                  <Badge variant="outline">
                    <Building className="w-3 h-3 mr-1" />
                    Operations
                  </Badge>
                </div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Building}
            title="Organization"
            description="Your cultivation facility details"
          >
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Facility Name</span>
                <span className="font-medium">CannaCultivate Demo</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">License Number</span>
                <span className="font-mono">LIC-2024-001</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">State</span>
                <span>Colorado</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">License Status</span>
                <Badge className="bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Users}
            title="Team Members"
            description="Manage your team and permissions"
          >
            <div className="space-y-3">
              {[
                { name: "John Smith", email: "john@example.com", role: "Admin" },
                { name: "Jane Doe", email: "jane@example.com", role: "Manager" },
                { name: "Mike Johnson", email: "mike@example.com", role: "Operator" },
              ].map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsSection
            icon={Bell}
            title="Notification Preferences"
            description="Choose how you want to be notified"
          >
            <div className="space-y-1">
              <SettingsRow
                label="Email Notifications"
                description="Receive notifications via email"
              >
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Push Notifications"
                description="Receive browser push notifications"
              >
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Task Reminders"
                description="Get reminded about upcoming and overdue tasks"
              >
                <Switch
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, taskReminders: checked })
                  }
                />
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Compliance Alerts"
                description="Receive alerts about compliance issues"
              >
                <Switch
                  checked={settings.complianceAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, complianceAlerts: checked })
                  }
                />
              </SettingsRow>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <SettingsSection
            icon={Lock}
            title="Security Settings"
            description="Manage your account security"
          >
            <div className="space-y-1">
              <SettingsRow
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
              >
                <div className="flex items-center gap-2">
                  {settings.twoFactorEnabled ? (
                    <Badge className="bg-success/10 text-success border-success/20">
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline">Disabled</Badge>
                  )}
                  <Button variant="outline" size="sm">
                    {settings.twoFactorEnabled ? "Manage" : "Enable"}
                  </Button>
                </div>
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Session Timeout"
                description="Automatically log out after inactivity"
              >
                <Select
                  value={settings.sessionTimeout}
                  onValueChange={(value) =>
                    setSettings({ ...settings, sessionTimeout: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Change Password"
                description="Update your account password"
              >
                <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                  <Key className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </SettingsRow>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Zap}
            title="Active Sessions"
            description="Manage your active login sessions"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Current Session</p>
                    <p className="text-xs text-muted-foreground">
                      Windows • Chrome • Denver, CO
                    </p>
                  </div>
                </div>
                <Badge className="bg-success/10 text-success border-success/20">
                  Active
                </Badge>
              </div>
              <Button variant="outline" className="w-full">
                Sign Out All Other Sessions
              </Button>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data" className="space-y-6">
          <SettingsSection
            icon={HardDrive}
            title="Data Backup"
            description="Configure automatic backups"
          >
            <div className="space-y-1">
              <SettingsRow
                label="Automatic Backup"
                description="Automatically backup your data"
              >
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoBackup: checked })
                  }
                />
              </SettingsRow>
              <Separator />
              <SettingsRow
                label="Backup Frequency"
                description="How often to create backups"
              >
                <Select
                  value={settings.backupFrequency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, backupFrequency: value })
                  }
                  disabled={!settings.autoBackup}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Database}
            title="Demo Data Management"
            description="Seed or clear demo data for testing"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seed Database */}
              <div className="p-5 border rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Reset Demo Data</h3>
                    <p className="text-xs text-muted-foreground">
                      Restore default sample data
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Reset all data to the default demo state. Current data will be replaced.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                >
                  {isSeeding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Reset Data
                </Button>
              </div>

              {/* Clear Data */}
              <div className="p-5 border rounded-xl bg-gradient-to-br from-destructive/5 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Clear All Data</h3>
                    <p className="text-xs text-muted-foreground">
                      Remove all sample data
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete all demo data. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all demo data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isClearing ? "Clearing..." : "Yes, Clear Data"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">Important Note</p>
                <p className="text-sm text-muted-foreground">
                  Demo data is stored locally in your browser. In production, data would be stored securely in the cloud.
                </p>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
