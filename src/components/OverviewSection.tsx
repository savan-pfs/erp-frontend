import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Shield, 
  Smartphone, 
  QrCode, 
  Package, 
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";

const coreFeatures = [
  {
    icon: Shield,
    title: "Metrc Integration",
    description: "Mandatory regulatory compliance with real-time sync",
    priority: "Critical",
    days: "Days 1-15"
  },
  {
    icon: Target,
    title: "Plant Lifecycle Tracking",
    description: "Batch-level tracking from seed to sale",
    priority: "Critical",
    days: "Days 8-25"
  },
  {
    icon: Smartphone,
    title: "Mobile Task Management",
    description: "QR scanning for field operations",
    priority: "High",
    days: "Days 12-30"
  },
  {
    icon: Package,
    title: "Inventory Management",
    description: "Barcode-based inventory with lot tracking",
    priority: "High",
    days: "Days 18-32"
  },
  {
    icon: FileText,
    title: "Audit Trails",
    description: "Full compliance audit logging",
    priority: "Critical",
    days: "Days 5-35"
  }
];

const stats = [
  { label: "Total Sprint Days", value: "40", icon: Clock },
  { label: "Core Features", value: "5", icon: CheckCircle2 },
  { label: "Risk Items", value: "8", icon: AlertTriangle },
  { label: "Team Size", value: "9+", icon: Target }
];

export function OverviewSection() {
  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MVP Scope */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            MVP Scope Definition
          </CardTitle>
          <CardDescription>
            Ruthlessly prioritized features for regulatory compliance and operational efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {coreFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <Badge 
                      variant={feature.priority === "Critical" ? "default" : "secondary"}
                      className={feature.priority === "Critical" ? "bg-destructive" : ""}
                    >
                      {feature.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  <span className="text-xs font-mono text-primary">{feature.days}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phase Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Phase 1: Foundation</CardTitle>
            <CardDescription>Days 1-15</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={100} className="h-2 mb-3" />
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Infrastructure & CI/CD</li>
              <li>• Metrc API integration</li>
              <li>• Core data models</li>
              <li>• Authentication system</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Phase 2: Core Features</CardTitle>
            <CardDescription>Days 16-30</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={65} className="h-2 mb-3" />
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Plant lifecycle UI</li>
              <li>• Mobile app development</li>
              <li>• Inventory management</li>
              <li>• QR/Barcode scanning</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card border-l-4 border-l-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Phase 3: Polish & Launch</CardTitle>
            <CardDescription>Days 31-40</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={30} className="h-2 mb-3" />
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Integration testing</li>
              <li>• Audit trail verification</li>
              <li>• Performance optimization</li>
              <li>• UAT & deployment</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
