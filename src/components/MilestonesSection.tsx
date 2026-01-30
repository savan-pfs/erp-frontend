import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Flag, Target, Rocket, Shield, TestTube, Package } from "lucide-react";

interface Milestone {
  day: number;
  title: string;
  description: string;
  deliverables: string[];
  acceptance: string[];
  icon: typeof Flag;
  status: "completed" | "in-progress" | "upcoming";
}

const milestones: Milestone[] = [
  {
    day: 1,
    title: "Project Kickoff",
    description: "Team assembled, environments provisioned, development standards established",
    deliverables: [
      "All development environments running",
      "CI/CD pipeline deploying to staging",
      "Core schema migrations complete",
      "Authentication flow working"
    ],
    acceptance: [
      "Developer can clone repo and run locally in < 15 min",
      "Automated tests passing in CI",
      "Staging URL accessible"
    ],
    icon: Rocket,
    status: "upcoming"
  },
  {
    day: 5,
    title: "Infrastructure Complete",
    description: "Production-ready infrastructure with monitoring, logging, and security",
    deliverables: [
      "AWS EKS cluster operational",
      "Monitoring dashboards configured",
      "Audit logging capturing all events",
      "Security scanning automated"
    ],
    acceptance: [
      "99.9% uptime on staging",
      "Log queries return < 5 seconds",
      "No critical security findings"
    ],
    icon: Shield,
    status: "upcoming"
  },
  {
    day: 8,
    title: "Metrc Sync Operational",
    description: "Bidirectional sync with Metrc API for facilities, plants, and packages",
    deliverables: [
      "Facility sync working",
      "Plant batch sync working",
      "Package sync working",
      "Rate limiting handled gracefully"
    ],
    acceptance: [
      "Sync completes within 5 minutes for 1000 items",
      "Rate limiting doesn't cause data loss",
      "Error handling logs all failures"
    ],
    icon: Target,
    status: "upcoming"
  },
  {
    day: 12,
    title: "Mobile Development Start",
    description: "React Native app initialized with core navigation and authentication",
    deliverables: [
      "React Native project scaffolded",
      "Authentication working on mobile",
      "Navigation structure complete",
      "Camera permissions configured"
    ],
    acceptance: [
      "App builds for iOS and Android",
      "Login flow works end-to-end",
      "TestFlight/Play Console builds available"
    ],
    icon: Package,
    status: "upcoming"
  },
  {
    day: 15,
    title: "Phase 1 Complete",
    description: "Core backend functionality ready, all critical integrations working",
    deliverables: [
      "All CRUD operations for plants, batches, packages",
      "Metrc sync fully operational",
      "Task assignment system working",
      "Audit trail capturing all mutations"
    ],
    acceptance: [
      "API documentation complete",
      "Integration tests passing",
      "Performance benchmarks met"
    ],
    icon: Flag,
    status: "upcoming"
  },
  {
    day: 20,
    title: "Inventory System Complete",
    description: "Full inventory management with barcode scanning and lot tracking",
    deliverables: [
      "Barcode generation and scanning",
      "Lot tracking with FIFO/LIFO",
      "Inventory transfers",
      "Waste tracking and manifests"
    ],
    acceptance: [
      "Scan-to-action latency < 500ms",
      "Inventory accuracy 100%",
      "All regulatory reports generating"
    ],
    icon: Package,
    status: "upcoming"
  },
  {
    day: 25,
    title: "Feature Complete",
    description: "All MVP features implemented, ready for testing phase",
    deliverables: [
      "Mobile QR scanning working",
      "Task management operational",
      "Analytics dashboard live",
      "Search and filtering complete"
    ],
    acceptance: [
      "All user stories marked done",
      "No P0 bugs outstanding",
      "Feature flags for any incomplete items"
    ],
    icon: CheckCircle2,
    status: "upcoming"
  },
  {
    day: 30,
    title: "Testing Complete",
    description: "All testing phases passed, production deployment approved",
    deliverables: [
      "E2E test suite passing",
      "Load testing completed",
      "Security audit passed",
      "UAT signoff obtained"
    ],
    acceptance: [
      "95% test coverage",
      "P95 response time < 200ms",
      "Zero critical vulnerabilities"
    ],
    icon: TestTube,
    status: "upcoming"
  },
  {
    day: 35,
    title: "UAT Complete",
    description: "User acceptance testing finished, stakeholder approval received",
    deliverables: [
      "All UAT scenarios passed",
      "Training materials ready",
      "Support documentation complete",
      "Go-live checklist verified"
    ],
    acceptance: [
      "Stakeholder sign-off document",
      "Zero blocking issues",
      "Operations team trained"
    ],
    icon: CheckCircle2,
    status: "upcoming"
  },
  {
    day: 40,
    title: "MVP Launch Complete",
    description: "Production deployment successful, system operational",
    deliverables: [
      "Production environment live",
      "Mobile apps published",
      "Monitoring active",
      "Support rotation in place"
    ],
    acceptance: [
      "Users successfully logging in",
      "Metrc sync operational in production",
      "Zero P0 incidents in first 24 hours"
    ],
    icon: Rocket,
    status: "upcoming"
  }
];

const statusColors = {
  completed: "bg-success text-success-foreground",
  "in-progress": "bg-accent text-accent-foreground",
  upcoming: "bg-muted text-muted-foreground"
};

export function MilestonesSection() {
  return (
    <div className="space-y-8">
      {/* Timeline Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Milestone Timeline</CardTitle>
          <CardDescription>
            Key checkpoints and deliverables throughout the 40-day sprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={milestone.day} className="relative pl-16">
                  {/* Timeline dot */}
                  <div className={`absolute left-4 w-5 h-5 rounded-full border-2 border-background ${
                    milestone.status === "completed" ? "bg-success" :
                    milestone.status === "in-progress" ? "bg-accent" : "bg-muted"
                  } flex items-center justify-center`}>
                    {milestone.status === "completed" ? (
                      <CheckCircle2 className="w-3 h-3 text-success-foreground" />
                    ) : (
                      <Circle className="w-2 h-2" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <milestone.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                          <span className="text-sm text-muted-foreground">Day {milestone.day}</span>
                        </div>
                      </div>
                      <Badge className={statusColors[milestone.status]}>
                        {milestone.status === "in-progress" ? "In Progress" : 
                         milestone.status === "completed" ? "Completed" : "Upcoming"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{milestone.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Deliverables</h4>
                        <ul className="space-y-1">
                          {milestone.deliverables.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Acceptance Criteria</h4>
                        <ul className="space-y-1">
                          {milestone.acceptance.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-success">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Path */}
      <Card className="glass-card border-l-4 border-l-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Critical Path Items</CardTitle>
          <CardDescription>
            Tasks that directly impact project completion - no delays acceptable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Phase 1 (Days 1-15)</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Metrc API integration (Days 3-8)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Audit logging system (Days 5-10)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Core data models (Days 1-5)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Phase 2-3 (Days 16-40)</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Mobile QR scanning (Days 12-20)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Compliance verification (Days 30-35)</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Production deployment (Days 36-40)</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
