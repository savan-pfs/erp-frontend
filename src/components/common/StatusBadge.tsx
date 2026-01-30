import { ReactNode, memo } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";

type StatusType =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "pending"
  | "default"
  | "processing";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

const statusConfig: Record<
  StatusType,
  {
    icon: typeof CheckCircle2;
    className: string;
    defaultLabel: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className: "bg-success-light text-success border-success/20",
    defaultLabel: "Success",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-warning-light text-warning border-warning/20",
    defaultLabel: "Warning",
  },
  danger: {
    icon: XCircle,
    className: "bg-destructive-light text-destructive border-destructive/20",
    defaultLabel: "Error",
  },
  info: {
    icon: Info,
    className: "bg-info-light text-info border-info/20",
    defaultLabel: "Info",
  },
  pending: {
    icon: Clock,
    className: "bg-warning-light text-warning border-warning/20",
    defaultLabel: "Pending",
  },
  processing: {
    icon: Loader2,
    className: "bg-info-light text-info border-info/20",
    defaultLabel: "Processing",
  },
  default: {
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground border-border",
    defaultLabel: "Unknown",
  },
};

const sizeConfig = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5",
  lg: "text-sm px-3 py-1.5 gap-2",
};

const iconSizeConfig = {
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
  lg: "w-4 h-4",
};

export const StatusBadge = memo(
  ({
    status,
    label,
    showIcon = true,
    size = "md",
    className,
    children,
  }: StatusBadgeProps) => {
    const config = statusConfig[status] || statusConfig.default;
    const Icon = config.icon;
    const displayLabel = label || children || config.defaultLabel;

    return (
      <span
        className={cn(
          "inline-flex items-center font-medium rounded-full border",
          config.className,
          sizeConfig[size],
          className
        )}
      >
        {showIcon && (
          <Icon
            className={cn(
              iconSizeConfig[size],
              status === "processing" && "animate-spin"
            )}
          />
        )}
        {displayLabel}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

// Convenience components for common statuses
export const SuccessBadge = (props: Omit<StatusBadgeProps, "status">) => (
  <StatusBadge status="success" {...props} />
);

export const WarningBadge = (props: Omit<StatusBadgeProps, "status">) => (
  <StatusBadge status="warning" {...props} />
);

export const DangerBadge = (props: Omit<StatusBadgeProps, "status">) => (
  <StatusBadge status="danger" {...props} />
);

export const InfoBadge = (props: Omit<StatusBadgeProps, "status">) => (
  <StatusBadge status="info" {...props} />
);

export const PendingBadge = (props: Omit<StatusBadgeProps, "status">) => (
  <StatusBadge status="pending" {...props} />
);

export default StatusBadge;
