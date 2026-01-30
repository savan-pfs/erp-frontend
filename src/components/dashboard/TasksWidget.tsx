import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TasksWidgetProps {
  completed: number;
  pending: number;
  urgent: number;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export const TasksWidget = memo(
  ({ completed, pending, urgent, onViewAll, isLoading }: TasksWidgetProps) => {
    const total = completed + pending;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (isLoading) {
      return (
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-shimmer" />
              <div className="h-5 w-32 bg-muted rounded animate-shimmer" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-3 bg-muted rounded-full animate-shimmer" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted rounded-xl animate-shimmer" />
              <div className="h-20 bg-muted rounded-xl animate-shimmer" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
              Today's Tasks
            </CardTitle>
            {urgent > 0 && (
              <Badge
                variant="outline"
                className="bg-destructive-light text-destructive border-destructive/20"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {urgent} urgent
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {completed} / {total} completed
              </span>
            </div>
            <Progress
              value={completionRate}
              className="h-2.5 [&>div]:bg-success"
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="p-4 rounded-xl bg-success-light border border-success/20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-success">{completed}</p>
              <p className="text-xs text-success/80">Completed</p>
            </div>

            <div className="p-4 rounded-xl bg-warning-light border border-warning/20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-warning">{pending}</p>
              <p className="text-xs text-warning/80">Pending</p>
            </div>
          </div>

          {/* Completion message */}
          {completionRate === 100 && (
            <div className="mt-4 p-3 rounded-lg bg-success-light border border-success/20 text-center">
              <p className="text-sm font-medium text-success">
                All tasks completed! Great work!
              </p>
            </div>
          )}

          {onViewAll && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-muted-foreground hover:text-foreground"
              onClick={onViewAll}
            >
              View all tasks
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

TasksWidget.displayName = "TasksWidget";

export default TasksWidget;
