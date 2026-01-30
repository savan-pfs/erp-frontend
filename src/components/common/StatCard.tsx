import { ReactNode, memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  iconColor?: string;
  subtitle?: string;
  sparkline?: number[];
  className?: string;
  onClick?: () => void;
}

const MiniSparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
};

export const StatCard = memo(
  ({
    title,
    value,
    change,
    trend,
    icon,
    iconColor = "bg-primary/10 text-primary",
    subtitle,
    sparkline,
    className,
    onClick,
  }: StatCardProps) => {
    const TrendIcon =
      trend === "up"
        ? TrendingUp
        : trend === "down"
        ? TrendingDown
        : Minus;

    const trendColor =
      trend === "up"
        ? "text-success"
        : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

    return (
      <div
        className={cn(
          "stat-card group",
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>

            {/* Change indicator */}
            {change && (
              <div className="flex items-center gap-1.5 mt-2">
                <TrendIcon className={cn("w-3.5 h-3.5", trendColor)} />
                <span className={cn("text-xs font-medium", trendColor)}>
                  {change}
                </span>
              </div>
            )}

            {/* Subtitle */}
            {subtitle && !change && (
              <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>

          {/* Right side: Icon or Sparkline */}
          <div className="flex flex-col items-end gap-2">
            {icon && (
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  iconColor
                )}
              >
                {icon}
              </div>
            )}
            {sparkline && (
              <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                <MiniSparkline data={sparkline} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export default StatCard;
