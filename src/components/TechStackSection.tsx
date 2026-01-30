import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Zap, Shield, Scale, DollarSign } from "lucide-react";

const techDecisions = [
  {
    category: "Backend Runtime",
    choice: "Node.js + TypeScript",
    alternatives: ["Go", "Python/Django", "Java/Spring"],
    justification: [
      "Fastest development velocity for MVP timeline",
      "Shared language with React frontend reduces context switching",
      "Rich ecosystem for barcode/QR libraries",
      "TypeScript provides type safety without Java overhead",
      "Async I/O ideal for API gateway pattern with Metrc"
    ],
    tradeoffs: "Slightly lower raw performance than Go, but development speed prioritized"
  },
  {
    category: "Database",
    choice: "PostgreSQL + TimescaleDB",
    alternatives: ["MySQL", "MongoDB", "DynamoDB"],
    justification: [
      "TimescaleDB extension for time-series plant growth data",
      "JSONB for flexible audit logging without schema migrations",
      "Strong ACID compliance for regulatory requirements",
      "Excellent tooling (pgAdmin, Prisma ORM)",
      "Cost-effective at MVP scale vs. managed NoSQL"
    ],
    tradeoffs: "More operational overhead than fully managed options, but better control"
  },
  {
    category: "ORM",
    choice: "Prisma",
    alternatives: ["TypeORM", "Sequelize", "Knex"],
    justification: [
      "Type-safe database client generation",
      "Excellent migration tooling",
      "Visual database browser (Prisma Studio)",
      "Modern, well-maintained with great DX",
      "Faster development than raw SQL"
    ],
    tradeoffs: "Some complex queries need raw SQL escape hatch"
  },
  {
    category: "Frontend Framework",
    choice: "React 18 + Vite",
    alternatives: ["Next.js", "Vue 3", "Angular"],
    justification: [
      "Vite's instant HMR maximizes developer productivity",
      "React's ecosystem has most barcode/QR libraries",
      "Team familiarity reduces ramp-up time",
      "No SSR complexity for internal tool",
      "Easy to add SSR later if needed"
    ],
    tradeoffs: "No built-in SSR, but not needed for internal ERP"
  },
  {
    category: "Mobile Framework",
    choice: "React Native",
    alternatives: ["Flutter", "Native iOS/Android", "PWA"],
    justification: [
      "Code sharing with web React components",
      "Single team can maintain web + mobile",
      "Mature camera/barcode libraries",
      "Offline-first architecture support",
      "OTA updates without app store review"
    ],
    tradeoffs: "Slightly more complex camera integration than native"
  },
  {
    category: "State Management",
    choice: "Zustand + React Query",
    alternatives: ["Redux", "MobX", "Recoil"],
    justification: [
      "Zustand: Minimal boilerplate, tiny bundle size",
      "React Query: Server state caching out of the box",
      "Combined: Clean separation of concerns",
      "Faster development than Redux ceremony",
      "Built-in offline support in React Query"
    ],
    tradeoffs: "Less established patterns than Redux for very large apps"
  },
  {
    category: "Infrastructure",
    choice: "AWS EKS (Kubernetes)",
    alternatives: ["AWS ECS", "Heroku", "Vercel + Serverless"],
    justification: [
      "Kubernetes enables gradual scaling strategy",
      "Better resource utilization than serverless at scale",
      "Team has K8s experience",
      "Portable to other clouds if needed",
      "Fine-grained control for compliance"
    ],
    tradeoffs: "Higher initial complexity, but worth it for compliance control"
  },
  {
    category: "CI/CD",
    choice: "GitHub Actions",
    alternatives: ["CircleCI", "GitLab CI", "Jenkins"],
    justification: [
      "Native GitHub integration (no context switching)",
      "Excellent marketplace for actions",
      "Free tier generous for MVP",
      "Matrix builds for testing",
      "Easy secrets management"
    ],
    tradeoffs: "Less customizable than Jenkins, but faster to set up"
  }
];

const speedPrinciples = [
  {
    icon: Clock,
    title: "Convention Over Configuration",
    description: "Use opinionated frameworks (Prisma, React Query) to reduce decision fatigue"
  },
  {
    icon: Zap,
    title: "Monorepo Structure",
    description: "Shared types between frontend/backend, single CI pipeline"
  },
  {
    icon: Shield,
    title: "Security by Default",
    description: "Authentication, audit logging built into base architecture from day 1"
  },
  {
    icon: Scale,
    title: "Horizontal Scaling Design",
    description: "Stateless services, Redis for sessions, ready to scale from start"
  },
  {
    icon: DollarSign,
    title: "Cost-Conscious",
    description: "Use managed services only where they save significant time"
  }
];

export function TechStackSection() {
  return (
    <div className="space-y-8">
      {/* Speed Principles */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Speed-First Architecture Principles</CardTitle>
          <CardDescription>
            Every technology choice optimized for 40-day delivery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {speedPrinciples.map((principle) => (
              <div key={principle.title} className="text-center p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <principle.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground mb-1">{principle.title}</h4>
                <p className="text-xs text-muted-foreground">{principle.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tech Decisions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Technology Decisions & Justifications</h2>
        
        <div className="grid gap-4">
          {techDecisions.map((decision) => (
            <Card key={decision.category} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{decision.category}</Badge>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      {decision.choice}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Alternatives Considered</p>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {decision.alternatives.map((alt) => (
                        <Badge key={alt} variant="secondary" className="text-xs">
                          {alt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Why This Choice?</h4>
                    <ul className="space-y-1">
                      {decision.justification.map((point, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-success mt-1">✓</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Trade-offs Accepted</h4>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {decision.tradeoffs}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
