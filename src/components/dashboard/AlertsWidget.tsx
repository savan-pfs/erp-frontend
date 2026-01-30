import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Bell,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "warning" | "success" | "info" | "error";
  title: string;
  message: string;
  time: string;
  dismissible?: boolean;
}

interface AlertsWidgetProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

const alertConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-warning-light",
    borderColor: "border-warning/20",
    iconColor: "text-warning",
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-success-light",
    borderColor: "border-success/20",
    iconColor: "text-success",
  },
  info: {
    icon: Info,
    bgColor: "bg-info-light",
    borderColor: "border-info/20",
    iconColor: "text-info",
  },
  error: {
    icon: AlertTriangle,
    bgColor: "bg-destructive-light",
    borderColor: "border-destructive/20",
    iconColor: "text-destructive",
  },
};

const AlertSkeleton = () => (
  <div className="flex items-start gap-3 p-3 rounded-lg border animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-muted" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
    </div>
  </div>
);

export const AlertsWidget = memo(
  ({ alerts, onDismiss, onViewAll, isLoading }: AlertsWidgetProps) => {
    const unreadCount = alerts.length;

    if (isLoading) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted rounded animate-shimmer" />
                <div className="h-5 w-32 bg-muted rounded animate-shimmer" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <AlertSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-5 h-5 text-muted-foreground" />
              Alerts & Notifications
              {unreadCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {alerts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">All clear!</p>
              <p className="text-xs text-muted-foreground">
                No alerts at this time
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2 flex-1">
                {alerts.slice(0, 4).map((alert) => {
                  const config = alertConfig[alert.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group",
                        config.bgColor,
                        config.borderColor
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("w-4 h-4", config.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {alert.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {alert.time}
                        </p>
                      </div>
                      {alert.dismissible && onDismiss && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onDismiss(alert.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {onViewAll && alerts.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-muted-foreground hover:text-foreground"
                  onClick={onViewAll}
                >
                  View all {alerts.length} alerts
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }
);

AlertsWidget.displayName = "AlertsWidget";

export default AlertsWidget;
