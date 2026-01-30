import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Clock, Server, Users, FileText, Wifi, DollarSign } from "lucide-react";

interface Risk {
  id: string;
  title: string;
  category: string;
  severity: "Critical" | "High" | "Medium";
  probability: "High" | "Medium" | "Low";
  impact: string;
  mitigation: string[];
  contingency: string;
  owner: string;
  icon: typeof AlertTriangle;
}

const risks: Risk[] = [
  {
    id: "RISK-001",
    title: "Metrc API Rate Limiting",
    category: "Integration",
    severity: "Critical",
    probability: "High",
    impact: "Sync failures during peak operations, compliance gaps",
    mitigation: [
      "Implement exponential backoff with jitter",
      "Request queue with priority levels (compliance > operational)",
      "Cache Metrc responses aggressively (TTL: 5 min for tags, 15 min for facilities)",
      "Batch API calls where possible (up to 50 items per request)",
      "Monitor rate limit headers, pause at 80% threshold"
    ],
    contingency: "Manual sync mode with Excel export/import for emergencies",
    owner: "Backend Lead",
    icon: Server
  },
  {
    id: "RISK-002",
    title: "Metrc API Downtime",
    category: "Integration",
    severity: "Critical",
    probability: "Medium",
    impact: "Unable to report plant movements, harvests to state",
    mitigation: [
      "Offline queue for all Metrc operations",
      "Local validation mirrors Metrc rules",
      "Health check endpoint polling (every 30s)",
      "Automatic retry on Metrc recovery",
      "Dashboard shows sync status clearly"
    ],
    contingency: "Generate offline manifest for manual state submission",
    owner: "Backend Lead",
    icon: Wifi
  },
  {
    id: "RISK-003",
    title: "Metrc API Schema Changes",
    category: "Integration",
    severity: "High",
    probability: "Medium",
    impact: "Integration failures, data mapping errors",
    mitigation: [
      "Abstract Metrc API behind adapter pattern",
      "Version all API interactions",
      "Monitor Metrc changelog weekly",
      "Schema validation layer catches changes early",
      "Feature flags for API version switching"
    ],
    contingency: "Rollback to previous API version if available",
    owner: "Backend Lead",
    icon: FileText
  },
  {
    id: "RISK-004",
    title: "Metrc Sandbox Limitations",
    category: "Integration",
    severity: "High",
    probability: "High",
    impact: "Cannot fully test integration before production",
    mitigation: [
      "Build comprehensive Metrc mock server",
      "Document all sandbox vs production differences",
      "Partner with Metrc-experienced consultant for review",
      "Plan 3-day production integration testing buffer",
      "Create rollback procedures for each endpoint"
    ],
    contingency: "Extended soft launch with manual verification",
    owner: "DevOps Lead",
    icon: Shield
  },
  {
    id: "RISK-005",
    title: "40-Day Timeline Overrun",
    category: "Schedule",
    severity: "High",
    probability: "Medium",
    impact: "MVP delay, increased costs, stakeholder confidence",
    mitigation: [
      "Daily standup with blocker escalation",
      "Feature flags allow partial releases",
      "Prioritized backlog: cut non-essential features first",
      "2-day buffer built into each phase",
      "Weekly scope review with stakeholders"
    ],
    contingency: "Phased launch: core Metrc + batch tracking first",
    owner: "Project Manager",
    icon: Clock
  },
  {
    id: "RISK-006",
    title: "Key Personnel Unavailability",
    category: "Team",
    severity: "High",
    probability: "Low",
    impact: "Knowledge gaps, development slowdown",
    mitigation: [
      "Cross-training on all critical components",
      "Pair programming for complex features",
      "Comprehensive documentation requirements",
      "No single point of failure in architecture",
      "External consultant on standby"
    ],
    contingency: "Contractor augmentation within 48 hours",
    owner: "Project Manager",
    icon: Users
  },
  {
    id: "RISK-007",
    title: "Compliance Audit Failure",
    category: "Regulatory",
    severity: "Critical",
    probability: "Low",
    impact: "License jeopardy, legal exposure",
    mitigation: [
      "Audit trail from day 1 (not bolted on)",
      "Weekly compliance checklist review",
      "External compliance consultant review at day 25",
      "All Metrc data changes logged with user attribution",
      "Immutable audit log (append-only, no deletes)"
    ],
    contingency: "Emergency compliance patch deployment capability",
    owner: "Security Engineer",
    icon: Shield
  },
  {
    id: "RISK-008",
    title: "Infrastructure Cost Overrun",
    category: "Budget",
    severity: "Medium",
    probability: "Medium",
    impact: "Reduced runway, feature cuts",
    mitigation: [
      "Cost alerts at 50%, 75%, 90% of budget",
      "Spot instances for non-critical workloads",
      "Auto-scaling with conservative thresholds",
      "Weekly cost review",
      "Reserved instances for baseline load"
    ],
    contingency: "Downgrade to smaller instances, reduce replicas",
    owner: "DevOps Lead",
    icon: DollarSign
  }
];

const severityColors = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-warning text-warning-foreground",
  Medium: "bg-info text-info-foreground"
};

const probabilityColors = {
  High: "border-destructive text-destructive",
  Medium: "border-warning text-warning-foreground",
  Low: "border-success text-success"
};

export function RiskSection() {
  const metrcRisks = risks.filter(r => r.category === "Integration");
  const otherRisks = risks.filter(r => r.category !== "Integration");

  return (
    <div className="space-y-8">
      {/* Risk Summary */}
      <Card className="glass-card border-l-4 border-l-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Metrc Integration Risk Assessment
          </CardTitle>
          <CardDescription>
            Critical risks specific to Metrc API integration requiring special attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {metrcRisks.map((risk) => (
              <div key={risk.id} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <risk.icon className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{risk.title}</h3>
                      <span className="text-xs text-muted-foreground font-mono">{risk.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={severityColors[risk.severity]}>{risk.severity}</Badge>
                    <Badge variant="outline" className={probabilityColors[risk.probability]}>
                      P: {risk.probability}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Impact:</strong> {risk.impact}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Mitigation Strategy</h4>
                    <ul className="space-y-1">
                      {risk.mitigation.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-success">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Contingency Plan</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {risk.contingency}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Owner:</strong> {risk.owner}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Risks */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Additional Project Risks</CardTitle>
          <CardDescription>
            Schedule, team, regulatory, and budget risks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {otherRisks.map((risk) => (
              <div key={risk.id} className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <risk.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{risk.title}</h3>
                      <span className="text-xs text-muted-foreground">{risk.category}</span>
                    </div>
                  </div>
                  <Badge className={severityColors[risk.severity]} variant="secondary">
                    {risk.severity}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{risk.impact}</p>
                
                <div className="text-xs text-muted-foreground">
                  <strong>Key Mitigation:</strong> {risk.mitigation[0]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Matrix */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Risk Matrix</CardTitle>
          <CardDescription>Visual risk assessment by probability and severity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <div></div>
            <div className="text-center text-sm font-medium text-muted-foreground p-2">Low Probability</div>
            <div className="text-center text-sm font-medium text-muted-foreground p-2">Medium Probability</div>
            <div className="text-center text-sm font-medium text-muted-foreground p-2">High Probability</div>
            
            <div className="text-sm font-medium text-muted-foreground p-2 flex items-center">Critical Severity</div>
            <div className="bg-warning/20 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-007</span>
            </div>
            <div className="bg-destructive/20 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-002</span>
            </div>
            <div className="bg-destructive/30 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-001</span>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground p-2 flex items-center">High Severity</div>
            <div className="bg-info/20 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-006</span>
            </div>
            <div className="bg-warning/20 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-003, 005</span>
            </div>
            <div className="bg-destructive/20 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-004</span>
            </div>
            
            <div className="text-sm font-medium text-muted-foreground p-2 flex items-center">Medium Severity</div>
            <div className="bg-success/20 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground">—</span>
            </div>
            <div className="bg-info/20 rounded-lg p-3 text-center">
              <span className="text-xs">RISK-008</span>
            </div>
            <div className="bg-warning/20 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground">—</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
