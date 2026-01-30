import { memo } from "react";
import { StatCard } from "@/components/common";
import { Leaf, Layers, Package, ClipboardList, LucideIcon } from "lucide-react";

interface QuickStatsProps {
  stats: {
    totalPlants: number;
    activeBatches: number;
    inventoryLots: number;
    pendingTasks: number;
  };
  isLoading?: boolean;
}

interface StatConfig {
  key: keyof QuickStatsProps["stats"];
  title: string;
  icon: LucideIcon;
  iconColor: string;
  change: string;
  trend: "up" | "down" | "neutral";
  sparkline: number[];
}

const statsConfig: StatConfig[] = [
  {
    key: "totalPlants",
    title: "Total Plants",
    icon: Leaf,
    iconColor: "bg-success-light text-success",
    change: "+45 this week",
    trend: "up",
    sparkline: [120, 132, 145, 140, 155, 160, 175],
  },
  {
    key: "activeBatches",
    title: "Active Batches",
    icon: Layers,
    iconColor: "bg-info-light text-info",
    change: "2 in flowering",
    trend: "neutral",
    sparkline: [5, 6, 6, 7, 8, 8, 8],
  },
  {
    key: "inventoryLots",
    title: "Inventory Lots",
    icon: Package,
    iconColor: "bg-warning-light text-warning",
    change: "5 pending QA",
    trend: "up",
    sparkline: [18, 19, 20, 21, 22, 23, 23],
  },
  {
    key: "pendingTasks",
    title: "Pending Tasks",
    icon: ClipboardList,
    iconColor: "bg-primary-light text-primary",
    change: "3 urgent",
    trend: "down",
    sparkline: [20, 18, 16, 15, 14, 13, 12],
  },
];

const StatSkeleton = () => (
  <div className="stat-card">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
        <div className="h-8 w-16 bg-muted rounded animate-shimmer" />
        <div className="h-3 w-20 bg-muted rounded animate-shimmer" />
      </div>
      <div className="w-12 h-12 bg-muted rounded-xl animate-shimmer" />
    </div>
  </div>
);

export const QuickStats = memo(({ stats, isLoading }: QuickStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((config) => {
        const Icon = config.icon;
        return (
          <StatCard
            key={config.key}
            title={config.title}
            value={stats[config.key]}
            change={config.change}
            trend={config.trend}
            icon={<Icon className="w-6 h-6" />}
            iconColor={config.iconColor}
            sparkline={config.sparkline}
          />
        );
      })}
    </div>
  );
});

QuickStats.displayName = "QuickStats";

export default QuickStats;
