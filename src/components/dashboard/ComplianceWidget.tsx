import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Shield, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ComplianceItem {
  id: string;
  label: string;
  status: "passed" | "warning" | "pending";
}

interface ComplianceWidgetProps {
  score: number;
  items: ComplianceItem[];
  onViewDetails?: () => void;
  isLoading?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-destructive";
};

const getScoreStrokeColor = (score: number) => {
  if (score >= 90) return "stroke-success";
  if (score >= 70) return "stroke-warning";
  return "stroke-destructive";
};

const statusConfig = {
  passed: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success-light",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  pending: {
    icon: AlertTriangle,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

export const ComplianceWidget = memo(
  ({ score, items, onViewDetails, isLoading }: ComplianceWidgetProps) => {
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    if (isLoading) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-shimmer" />
              <div className="h-5 w-32 bg-muted rounded animate-shimmer" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 bg-muted rounded-full animate-shimmer" />
              <div className="flex-1 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-shimmer" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5 text-muted-foreground" />
            Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center gap-6">
            {/* Circular Progress */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeWidth="8"
                  className="stroke-muted"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={cn(
                    "transition-all duration-1000 ease-out",
                    getScoreStrokeColor(score)
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "text-2xl font-bold",
                    getScoreColor(score)
                  )}
                >
                  {score}%
                </span>
                <span className="text-xs text-muted-foreground">Score</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="flex-1 space-y-2">
              {items.map((item) => {
                const config = statusConfig[item.status];
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center",
                        config.bgColor
                      )}
                    >
                      <Icon className={cn("w-3 h-3", config.color)} />
                    </div>
                    <span
                      className={cn(
                        item.status === "passed"
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-muted-foreground hover:text-foreground"
              onClick={onViewDetails}
            >
              View compliance details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

ComplianceWidget.displayName = "ComplianceWidget";

export default ComplianceWidget;
