import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Package, FileQuestion, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
  variant?: "default" | "search" | "error";
}

const variantConfig = {
  default: {
    icon: Package,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  search: {
    icon: Search,
    iconBg: "bg-info-light",
    iconColor: "text-info",
  },
  error: {
    icon: FileQuestion,
    iconBg: "bg-destructive-light",
    iconColor: "text-destructive",
  },
};

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
  variant = "default",
}: EmptyStateProps) => {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;
  const ActionIcon = action?.icon || Plus;

  return (
    <div className={cn("empty-state animate-fade-in", className)}>
      <div
        className={cn(
          "empty-state-icon",
          config.iconBg
        )}
      >
        <Icon className={cn("w-8 h-8", config.iconColor)} />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>

      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              <ActionIcon className="w-4 h-4" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};

// Preset empty states
export const NoDataEmptyState = ({
  entityName,
  onAdd,
}: {
  entityName: string;
  onAdd?: () => void;
}) => (
  <EmptyState
    title={`No ${entityName} yet`}
    description={`Get started by adding your first ${entityName.toLowerCase()}.`}
    action={
      onAdd
        ? {
            label: `Add ${entityName}`,
            onClick: onAdd,
          }
        : undefined
    }
  />
);

export const NoSearchResultsEmptyState = ({
  searchTerm,
  onClear,
}: {
  searchTerm: string;
  onClear?: () => void;
}) => (
  <EmptyState
    variant="search"
    title="No results found"
    description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search or filters.`}
    action={
      onClear
        ? {
            label: "Clear search",
            onClick: onClear,
            icon: Search,
          }
        : undefined
    }
  />
);

export const ErrorEmptyState = ({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <EmptyState
    variant="error"
    title="Something went wrong"
    description={message || "An error occurred while loading the data. Please try again."}
    action={
      onRetry
        ? {
            label: "Try again",
            onClick: onRetry,
          }
        : undefined
    }
  />
);

export default EmptyState;
