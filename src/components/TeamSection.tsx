import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Monitor, Cloud, Users, Code, Database, Smartphone, GitBranch, Shield } from "lucide-react";

const teams = [
  {
    name: "Backend Team",
    icon: Server,
    color: "bg-primary",
    members: [
      { role: "Tech Lead / Senior Backend", focus: "Architecture, Metrc Integration" },
      { role: "Backend Developer", focus: "API Development, Database" },
      { role: "Backend Developer", focus: "Business Logic, Testing" }
    ],
    responsibilities: [
      "PostgreSQL + TimescaleDB for time-series plant data",
      "Node.js/Express API with TypeScript",
      "Metrc API integration and sync",
      "Authentication & authorization",
      "Audit logging system",
      "Business logic & validation"
    ],
    techStack: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Prisma"]
  },
  {
    name: "Frontend Team",
    icon: Monitor,
    color: "bg-accent",
    members: [
      { role: "Frontend Lead", focus: "Architecture, Web App" },
      { role: "Mobile Developer", focus: "React Native, QR Scanning" },
      { role: "UI/UX Developer", focus: "Design System, Components" }
    ],
    responsibilities: [
      "React 18 web application",
      "React Native mobile app",
      "QR code scanning integration",
      "Barcode reader integration",
      "Real-time updates (WebSocket)",
      "Offline-first mobile architecture"
    ],
    techStack: ["React", "React Native", "TypeScript", "TailwindCSS", "Zustand"]
  },
  {
    name: "DevOps Team",
    icon: Cloud,
    color: "bg-info",
    members: [
      { role: "DevOps Lead", focus: "Infrastructure, CI/CD" },
      { role: "Platform Engineer", focus: "Kubernetes, Monitoring" },
      { role: "Security Engineer", focus: "Compliance, Security" }
    ],
    responsibilities: [
      "AWS EKS Kubernetes cluster",
      "CI/CD with GitHub Actions",
      "Infrastructure as Code (Terraform)",
      "Monitoring & alerting (Datadog)",
      "Security & compliance",
      "Backup & disaster recovery"
    ],
    techStack: ["AWS", "Kubernetes", "Terraform", "GitHub Actions", "Datadog"]
  }
];

const sharedRequirements = [
  {
    icon: Database,
    title: "Database Design",
    description: "Shared schema ownership with clear boundaries"
  },
  {
    icon: Code,
    title: "API Contracts",
    description: "OpenAPI specs agreed before implementation"
  },
  {
    icon: GitBranch,
    title: "Git Workflow",
    description: "Feature branches, PR reviews, trunk-based deployment"
  },
  {
    icon: Shield,
    title: "Security Standards",
    description: "OWASP compliance, regular security audits"
  }
];

export function TeamSection() {
  return (
    <div className="space-y-8">
      {/* Team Cards */}
      <div className="grid grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.name} className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${team.color} flex items-center justify-center`}>
                  <team.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{team.name}</CardTitle>
              </div>
              <CardDescription>
                {team.members.length} team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Members */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Composition
                </h4>
                <div className="space-y-2">
                  {team.members.map((member, i) => (
                    <div key={i} className="p-2 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-foreground">{member.role}</p>
                      <p className="text-xs text-muted-foreground">{member.focus}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Key Responsibilities</h4>
                <ul className="space-y-1">
                  {team.responsibilities.map((resp, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {team.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Collaboration Requirements */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Cross-Team Collaboration</CardTitle>
          <CardDescription>
            Shared standards and processes for team coordination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {sharedRequirements.map((req) => (
              <div key={req.title} className="p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <req.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">{req.title}</h4>
                <p className="text-sm text-muted-foreground">{req.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Cadence */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Communication Cadence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Daily</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  15-min standup (9:00 AM)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Slack async updates
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  PR reviews within 4 hours
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Weekly</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  Sprint planning (Monday)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  Tech sync (Wednesday)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  Demo & retrospective (Friday)
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">As Needed</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-info" />
                  Architecture decision records
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-info" />
                  Incident response calls
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-info" />
                  Cross-team pairing sessions
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
