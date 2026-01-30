import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronLeft, ChevronRight, Server, Monitor, Cloud } from "lucide-react";

type TeamType = "backend" | "frontend" | "devops";

interface DayTask {
  day: number;
  backend: string[];
  frontend: string[];
  devops: string[];
  milestone?: string;
}

const timeline: DayTask[] = [
  {
    day: 1,
    backend: ["Set up PostgreSQL with TimescaleDB extension", "Design core schema: plants, batches, facilities, users", "Initialize Prisma ORM with migrations"],
    frontend: ["Initialize React 18 + Vite project", "Configure TailwindCSS + shadcn/ui", "Set up React Query + Zustand state management"],
    devops: ["Provision AWS EKS cluster", "Set up GitHub Actions CI/CD pipeline", "Configure Terraform for IaC"],
    milestone: "Project Kickoff"
  },
  {
    day: 2,
    backend: ["Implement JWT authentication with refresh tokens", "Create user roles: admin, cultivator, inventory_manager", "Set up API versioning structure"],
    frontend: ["Build authentication flow UI", "Create protected route wrapper", "Implement token refresh interceptor"],
    devops: ["Configure AWS Secrets Manager", "Set up staging environment", "Implement blue-green deployment strategy"]
  },
  {
    day: 3,
    backend: ["Design Metrc integration adapter pattern", "Create Metrc API client with retry logic", "Implement rate limiting handler (150 req/min)"],
    frontend: ["Build dashboard layout shell", "Create navigation components", "Implement responsive sidebar"],
    devops: ["Set up Redis for caching & rate limiting", "Configure CloudWatch logging", "Implement health check endpoints"]
  },
  {
    day: 4,
    backend: ["Implement Metrc facility sync", "Create facility CRUD endpoints", "Build facility validation service"],
    frontend: ["Build facility selection UI", "Create facility dashboard view", "Implement facility switcher component"],
    devops: ["Set up database backups (hourly)", "Configure auto-scaling policies", "Implement SSL/TLS certificates"]
  },
  {
    day: 5,
    backend: ["Implement audit logging middleware", "Create audit_logs table with JSONB", "Build audit query endpoints"],
    frontend: ["Start design system documentation", "Create reusable form components", "Build loading state components"],
    devops: ["Set up ELK stack for log aggregation", "Configure audit log retention (7 years)", "Implement log encryption at rest"],
    milestone: "Infrastructure Complete"
  },
  {
    day: 6,
    backend: ["Implement Metrc plant batch sync", "Create batch tracking data models", "Build batch status state machine"],
    frontend: ["Build batch list view component", "Create batch detail page shell", "Implement infinite scroll pagination"],
    devops: ["Configure disaster recovery", "Set up cross-region replication", "Document recovery procedures"]
  },
  {
    day: 7,
    backend: ["Create plant lifecycle state machine", "Implement growth phase transitions", "Build plant event sourcing"],
    frontend: ["Build plant lifecycle visualization", "Create growth phase timeline UI", "Implement phase transition modals"],
    devops: ["Load testing setup with k6", "Baseline performance benchmarks", "Configure alerting thresholds"]
  },
  {
    day: 8,
    backend: ["Implement harvest batch endpoints", "Create harvest weight tracking", "Build harvest validation rules"],
    frontend: ["Build harvest recording UI", "Create weight input forms", "Implement harvest confirmation flow"],
    devops: ["Security audit - OWASP top 10", "Implement WAF rules", "Configure DDoS protection"],
    milestone: "Metrc Sync Operational"
  },
  {
    day: 9,
    backend: ["Build package creation from harvest", "Implement package tagging logic", "Create package transfer endpoints"],
    frontend: ["Build package creation wizard", "Create package label preview", "Implement barcode display"],
    devops: ["Set up penetration testing", "Configure intrusion detection", "Document security protocols"]
  },
  {
    day: 10,
    backend: ["Implement Metrc tag management", "Create tag assignment service", "Build tag validation middleware"],
    frontend: ["Build tag assignment UI", "Create tag search/filter", "Implement tag status badges"],
    devops: ["Performance optimization round 1", "Database query analysis", "Index optimization"]
  },
  {
    day: 11,
    backend: ["Create plant movement tracking", "Implement room/zone management", "Build movement history endpoints"],
    frontend: ["Build facility map visualization", "Create drag-drop plant placement", "Implement movement log view"],
    devops: ["Set up APM with Datadog", "Configure distributed tracing", "Implement error tracking"]
  },
  {
    day: 12,
    backend: ["Initialize mobile API endpoints", "Create mobile-optimized responses", "Implement offline sync queue"],
    frontend: ["Initialize React Native project", "Set up navigation structure", "Configure native modules"],
    devops: ["Set up mobile CI/CD (Fastlane)", "Configure TestFlight/Play Console", "Implement code signing"],
    milestone: "Mobile Development Start"
  },
  {
    day: 13,
    backend: ["Build QR code generation service", "Create plant QR encoding schema", "Implement QR validation API"],
    frontend: ["Integrate react-native-camera", "Build QR scanner component", "Implement scan result handling"],
    devops: ["Mobile crash reporting (Crashlytics)", "Set up mobile analytics", "Configure push notification service"]
  },
  {
    day: 14,
    backend: ["Create task assignment system", "Build task priority queue", "Implement task notification service"],
    frontend: ["Build task list mobile view", "Create task detail screen", "Implement task completion flow"],
    devops: ["Load test mobile endpoints", "Optimize API response times", "Configure CDN for assets"]
  },
  {
    day: 15,
    backend: ["Implement task templates", "Create recurring task scheduler", "Build task dependency system"],
    frontend: ["Build task creation form", "Create task assignment UI", "Implement task filters"],
    devops: ["Database sharding evaluation", "Connection pooling optimization", "Query caching implementation"],
    milestone: "Phase 1 Complete - Core Backend"
  },
  {
    day: 16,
    backend: ["Build inventory adjustment endpoints", "Create inventory reconciliation", "Implement stock alerts"],
    frontend: ["Build inventory dashboard", "Create stock level charts", "Implement low stock alerts UI"],
    devops: ["Scale up staging environment", "Implement feature flags", "Set up A/B testing framework"]
  },
  {
    day: 17,
    backend: ["Implement barcode generation", "Create barcode validation service", "Build barcode history tracking"],
    frontend: ["Build barcode scanner (web)", "Create barcode label designer", "Implement print integration"],
    devops: ["Set up printer integration service", "Configure label printer drivers", "Test barcode scanning hardware"]
  },
  {
    day: 18,
    backend: ["Create lot tracking system", "Implement FIFO/LIFO logic", "Build lot expiration service"],
    frontend: ["Build lot management UI", "Create lot search interface", "Implement lot history view"],
    devops: ["Performance profiling", "Memory leak analysis", "Garbage collection tuning"]
  },
  {
    day: 19,
    backend: ["Build waste tracking endpoints", "Create waste manifest generation", "Implement waste reporting"],
    frontend: ["Build waste logging UI", "Create waste manifest form", "Implement waste history view"],
    devops: ["Security patch management", "Dependency vulnerability scan", "Update security policies"]
  },
  {
    day: 20,
    backend: ["Implement inventory transfers", "Create transfer validation rules", "Build transfer notification system"],
    frontend: ["Build transfer request UI", "Create transfer approval flow", "Implement transfer tracking"],
    devops: ["Backup restoration testing", "Document recovery playbook", "Conduct disaster recovery drill"],
    milestone: "Inventory System Complete"
  },
  {
    day: 21,
    backend: ["Create compliance report generator", "Build report scheduling service", "Implement report export (PDF/CSV)"],
    frontend: ["Build report builder UI", "Create report preview", "Implement export functionality"],
    devops: ["Set up report storage (S3)", "Configure report retention", "Implement report access logs"]
  },
  {
    day: 22,
    backend: ["Implement Metrc manifest sync", "Create manifest validation", "Build manifest error handling"],
    frontend: ["Build manifest management UI", "Create manifest status tracking", "Implement manifest corrections"],
    devops: ["API gateway optimization", "Rate limiting refinement", "Request throttling tuning"]
  },
  {
    day: 23,
    backend: ["Build notification service", "Create notification preferences", "Implement push notification API"],
    frontend: ["Build notification center", "Create notification preferences UI", "Implement real-time notifications"],
    devops: ["WebSocket infrastructure", "Set up notification queuing", "Configure notification delivery"]
  },
  {
    day: 24,
    backend: ["Create dashboard analytics API", "Build KPI calculation service", "Implement trend analysis"],
    frontend: ["Build analytics dashboard", "Create KPI widgets", "Implement chart components"],
    devops: ["Analytics data pipeline", "Set up data warehouse", "Configure ETL jobs"]
  },
  {
    day: 25,
    backend: ["Implement search service", "Create full-text search indexes", "Build advanced filter API"],
    frontend: ["Build global search UI", "Create advanced filter panel", "Implement search suggestions"],
    devops: ["Set up Elasticsearch", "Configure search replicas", "Optimize search performance"],
    milestone: "Feature Complete"
  },
  {
    day: 26,
    backend: ["Integration testing setup", "Create test data generators", "Build API contract tests"],
    frontend: ["E2E testing setup (Playwright)", "Create critical path tests", "Build visual regression tests"],
    devops: ["Test environment isolation", "Configure test data management", "Set up test reporting"]
  },
  {
    day: 27,
    backend: ["Metrc integration testing", "Create Metrc mock server", "Test all Metrc endpoints"],
    frontend: ["Mobile E2E testing", "Test QR scanning flows", "Test offline scenarios"],
    devops: ["Load testing - 1000 concurrent users", "Stress testing", "Identify bottlenecks"]
  },
  {
    day: 28,
    backend: ["Fix critical bugs from testing", "Performance optimization", "API response time tuning"],
    frontend: ["Fix UI/UX issues", "Accessibility audit (WCAG 2.1)", "Performance optimization"],
    devops: ["Address load test findings", "Scale resources as needed", "Optimize costs"]
  },
  {
    day: 29,
    backend: ["Security penetration testing", "Fix security vulnerabilities", "Code security review"],
    frontend: ["Security testing (XSS, CSRF)", "Input validation review", "Secure storage audit"],
    devops: ["Infrastructure security audit", "Network security review", "Access control audit"]
  },
  {
    day: 30,
    backend: ["API documentation finalization", "Create SDK/client libraries", "Version 1.0 API freeze"],
    frontend: ["User documentation", "Create onboarding flows", "Build help system"],
    devops: ["Production environment prep", "Final security hardening", "Monitoring dashboard setup"],
    milestone: "Testing Complete"
  },
  {
    day: 31,
    backend: ["Production data migration scripts", "Create rollback procedures", "Build data validation checks"],
    frontend: ["Production build optimization", "Asset optimization", "Bundle size analysis"],
    devops: ["Production deployment checklist", "DNS configuration", "SSL certificate installation"]
  },
  {
    day: 32,
    backend: ["Staging deployment", "Smoke testing", "Integration verification"],
    frontend: ["Staging UI testing", "Cross-browser testing", "Mobile device testing"],
    devops: ["Staging monitoring verification", "Alert testing", "Log verification"]
  },
  {
    day: 33,
    backend: ["Performance benchmarking", "Database query optimization", "Cache warming strategies"],
    frontend: ["Performance profiling", "Lazy loading optimization", "Image optimization"],
    devops: ["CDN configuration", "Edge caching setup", "Performance monitoring"]
  },
  {
    day: 34,
    backend: ["UAT support", "Bug fixes from UAT", "API documentation updates"],
    frontend: ["UAT bug fixes", "UI polish", "UX improvements"],
    devops: ["UAT environment monitoring", "Performance during UAT", "User support tooling"]
  },
  {
    day: 35,
    backend: ["Final Metrc compliance verification", "Audit trail validation", "Compliance documentation"],
    frontend: ["Compliance UI verification", "Audit log UI testing", "Report accuracy check"],
    devops: ["Compliance infrastructure check", "Audit log storage verification", "Backup verification"],
    milestone: "UAT Complete"
  },
  {
    day: 36,
    backend: ["Production deployment - Phase 1", "Core services deployment", "Database migration"],
    frontend: ["Production deployment - Web", "CDN deployment", "Cache invalidation"],
    devops: ["Production monitoring active", "On-call rotation setup", "Incident response ready"]
  },
  {
    day: 37,
    backend: ["Production verification", "Metrc sync verification", "Data integrity checks"],
    frontend: ["Production smoke tests", "User acceptance verification", "Performance verification"],
    devops: ["Monitor production metrics", "Scale as needed", "Cost monitoring"]
  },
  {
    day: 38,
    backend: ["Mobile API production deployment", "Mobile-specific optimizations", "Push notification testing"],
    frontend: ["App store submission", "Mobile production testing", "Crash monitoring setup"],
    devops: ["Mobile backend scaling", "Mobile analytics verification", "Mobile monitoring"]
  },
  {
    day: 39,
    backend: ["Post-launch bug fixes", "Performance tuning", "Monitoring alert tuning"],
    frontend: ["Post-launch UI fixes", "User feedback integration", "Help documentation updates"],
    devops: ["Production optimization", "Cost optimization", "Resource right-sizing"]
  },
  {
    day: 40,
    backend: ["Documentation finalization", "Knowledge transfer", "Sprint retrospective"],
    frontend: ["Design system documentation", "Component library docs", "Training materials"],
    devops: ["Runbook finalization", "SOP documentation", "Handoff to operations"],
    milestone: "MVP Launch Complete"
  }
];

const teamColors: Record<TeamType, string> = {
  backend: "bg-primary/10 text-primary border-primary/20",
  frontend: "bg-accent/10 text-accent-foreground border-accent/20",
  devops: "bg-info/10 text-info border-info/20"
};

const teamIcons: Record<TeamType, typeof Server> = {
  backend: Server,
  frontend: Monitor,
  devops: Cloud
};

export function TimelineSection() {
  const [currentWeek, setCurrentWeek] = useState(0);
  const weeks = Math.ceil(timeline.length / 7);
  const weekStart = currentWeek * 7;
  const weekEnd = Math.min(weekStart + 7, timeline.length);
  const currentDays = timeline.slice(weekStart, weekEnd);

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
              disabled={currentWeek === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Week
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: weeks }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentWeek(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    i === currentWeek 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(Math.min(weeks - 1, currentWeek + 1))}
              disabled={currentWeek === weeks - 1}
            >
              Next Week
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Week Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Week {currentWeek + 1}
        </h2>
        <p className="text-muted-foreground">
          Days {weekStart + 1} - {weekEnd}
        </p>
      </div>

      {/* Daily Tasks */}
      <Accordion type="multiple" className="space-y-4">
        {currentDays.map((day) => (
          <AccordionItem 
            key={day.day} 
            value={`day-${day.day}`}
            className="glass-card rounded-lg border px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">{day.day}</span>
                </div>
                <div className="flex-grow text-left">
                  <span className="font-semibold text-foreground">Day {day.day}</span>
                  {day.milestone && (
                    <Badge className="ml-3 bg-success text-success-foreground">
                      {day.milestone}
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-3 gap-4 mt-4">
                {(["backend", "frontend", "devops"] as TeamType[]).map((team) => {
                  const Icon = teamIcons[team];
                  return (
                    <div 
                      key={team}
                      className={`p-4 rounded-lg border ${teamColors[team]}`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4" />
                        <span className="font-semibold capitalize">{team}</span>
                      </div>
                      <ul className="space-y-2">
                        {day[team].map((task, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
