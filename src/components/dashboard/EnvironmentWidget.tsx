import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Thermometer,
  Droplets,
  Home,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  name: string;
  temp: number;
  humidity: number;
  plants: number;
  capacity: number;
  hasAlert?: boolean;
}

interface EnvironmentWidgetProps {
  rooms: Room[];
  onViewAll?: () => void;
  isLoading?: boolean;
}

const getCapacityColor = (percentage: number) => {
  if (percentage >= 90) return "bg-destructive";
  if (percentage >= 75) return "bg-warning";
  return "bg-primary";
};

const RoomSkeleton = () => (
  <div className="p-4 rounded-xl border bg-card animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-5 w-16 bg-muted rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="h-8 bg-muted rounded" />
      <div className="h-8 bg-muted rounded" />
      <div className="h-2 bg-muted rounded-full" />
    </div>
  </div>
);

export const EnvironmentWidget = memo(
  ({ rooms, onViewAll, isLoading }: EnvironmentWidgetProps) => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <RoomSkeleton key={i} />
              ))}
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
              <Home className="w-5 h-5 text-muted-foreground" />
              Rooms Overview
            </CardTitle>
            {rooms.some((r) => r.hasAlert) && (
              <Badge
                variant="outline"
                className="bg-warning-light text-warning border-warning/20"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                Alerts
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {rooms.slice(0, 4).map((room) => {
              const capacityPercent = Math.round(
                (room.plants / room.capacity) * 100
              );

              return (
                <div
                  key={room.id}
                  className={cn(
                    "p-4 rounded-xl border bg-gradient-to-br from-card to-muted/20 transition-all duration-200 hover:shadow-md hover:border-primary/20 cursor-pointer group",
                    room.hasAlert && "border-warning/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {room.name}
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-xs font-medium"
                    >
                      {capacityPercent}%
                    </Badge>
                  </div>

                  <div className="space-y-2.5">
                    {/* Temperature */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Thermometer className="w-3.5 h-3.5" />
                        Temp
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {room.temp}°F
                      </span>
                    </div>

                    {/* Humidity */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Droplets className="w-3.5 h-3.5" />
                        RH
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {room.humidity}%
                      </span>
                    </div>

                    {/* Capacity */}
                    <div className="pt-1">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">
                          {room.plants} plants
                        </span>
                        <span className="text-muted-foreground">
                          {room.capacity} max
                        </span>
                      </div>
                      <Progress
                        value={capacityPercent}
                        className={cn(
                          "h-1.5",
                          `[&>div]:${getCapacityColor(capacityPercent)}`
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {onViewAll && rooms.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-muted-foreground hover:text-foreground"
              onClick={onViewAll}
            >
              View all {rooms.length} rooms
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

EnvironmentWidget.displayName = "EnvironmentWidget";

export default EnvironmentWidget;
