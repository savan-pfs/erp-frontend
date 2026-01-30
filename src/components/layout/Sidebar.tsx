import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Leaf,
  Layers,
  Home,
  Dna,
  Sprout,
  Scissors,
  Package,
  Trash2,
  ClipboardList,
  Shield,
  FileText,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  BarChart3,
  Bug,
  Droplets,
  BookOpen,
  Building2,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  Factory,
  Beaker,
  ChevronDown,
  HelpCircle,
  Zap,
  Globe,
  CreditCard,
  Plug,
  Database,
  UserCog,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { organizationsApi } from "@/lib/api/realApi";

// Sidebar context for collapsed state
const SidebarContext = createContext<{
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  collapsed: boolean;
}

const NavItem = ({ to, icon: Icon, label, badge, collapsed, isBlocked, isDashboard }: NavItemProps & { isBlocked?: boolean; isDashboard?: boolean }) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  // If blocked and not dashboard, blur and disable
  const shouldBlock = isBlocked && !isDashboard;

  const content = (
    <NavLink
      to={to}
      className={cn("block", shouldBlock && "pointer-events-none cursor-not-allowed")}
      onClick={(e) => {
        if (shouldBlock) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className={cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          shouldBlock && "opacity-30 blur-sm"
        )}
      >
        {/* Active indicator bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-foreground rounded-r-full" />
        )}

        <Icon
          className={cn(
            "w-5 h-5 flex-shrink-0 transition-transform duration-200",
            !isActive && "group-hover:scale-110"
          )}
        />

        {!collapsed && (
          <>
            <span className="text-sm font-medium truncate flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span
                className={cn(
                  "badge-count",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </>
        )}

        {collapsed && badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="badge-count bg-primary text-primary-foreground">
              {badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

interface NavGroupProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  collapsed: boolean;
  defaultOpen?: boolean;
  isBlocked?: boolean;
  isDashboardGroup?: boolean;
}

const NavGroup = ({
  title,
  icon: Icon,
  children,
  collapsed,
  defaultOpen = true,
  isBlocked,
  isDashboardGroup,
}: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // If blocked and not dashboard group, blur and disable
  const shouldBlock = isBlocked && !isDashboardGroup;

  if (collapsed) {
    return <div className={cn("space-y-1 py-2", shouldBlock && "opacity-30 blur-sm pointer-events-none")}>{children}</div>;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={shouldBlock ? undefined : setIsOpen}
      className={cn("py-2", shouldBlock && "opacity-30 blur-sm pointer-events-none")}
    >
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group",
          shouldBlock && "cursor-not-allowed"
        )}
        disabled={shouldBlock}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="flex-1 text-left">{title}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { hasPermission, hasAnyRole, hasRole } = usePermissions();
  const { user } = useAuth();
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  // Check organization approval status
  useEffect(() => {
    const checkOrganizationStatus = async () => {
      if (!user?.organizationId) {
        setIsLoadingOrg(false);
        return;
      }

      try {
        const org = await organizationsApi.getById(user.organizationId);
        setOrganizationStatus(org.approval_status);
        setIsLoadingOrg(false);
      } catch (error) {
        console.error('Failed to fetch organization status:', error);
        setIsLoadingOrg(false);
      }
    };

    checkOrganizationStatus();
  }, [user?.organizationId]);

  // Get role flags from usePermissions hook
  const { isSuperAdmin, isOrgAdmin } = usePermissions();

  // Check if organization is pending approval or rejected
  const isPendingApproval = organizationStatus === 'PENDING_APPROVAL';
  const isRejected = organizationStatus === 'REJECTED';
  const isBlocked = isPendingApproval || isRejected;



  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-foreground text-base">
                  CannaCultivate
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                  ERP Platform
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin">
          {isSuperAdmin ? (
            // Super Admin Sidebar - Platform Management View
            <>
              <NavGroup title="Overview" collapsed={collapsed} isDashboardGroup={true}>
                {/* <NavItem
                  to="/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  collapsed={collapsed}
                  isDashboard={true}
                /> */}
                <NavItem
                  to="/super-admin"
                  icon={LayoutDashboard}
                  label="Super Admin Dashboard"
                  collapsed={collapsed}
                  isDashboard={true}
                />
              </NavGroup>

              <NavGroup title="Platform" collapsed={collapsed}>
                <NavItem
                  to="/organizations"
                  icon={Globe}
                  label="Organizations"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/documents/verification"
                  icon={FileText}
                  label="Document Verification"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/users"
                  icon={UserCog}
                  label="Users & Roles"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/billing"
                  icon={CreditCard}
                  label="Billing"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/integrations"
                  icon={Plug}
                  label="Integrations"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/system-settings"
                  icon={Settings}
                  label="System Settings"
                  collapsed={collapsed}
                />
              </NavGroup>

              <NavGroup title="Monitoring" icon={BarChart3} collapsed={collapsed}>
                <NavItem
                  to="/audit-logs"
                  icon={FileText}
                  label="Audit Logs"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/analytics"
                  icon={BarChart3}
                  label="Platform Analytics"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/reports"
                  icon={Download}
                  label="System Reports"
                  collapsed={collapsed}
                />
                <NavItem
                  to="/database"
                  icon={Database}
                  label="Database"
                  collapsed={collapsed}
                />
              </NavGroup>
            </>
          ) : (
            // Regular User Sidebar - Cultivation Flow
            <>
              <NavGroup title="Overview" collapsed={collapsed} isDashboardGroup={true} isBlocked={isBlocked}>
                <NavItem
                  to="/dashboard"
                  icon={LayoutDashboard}
                  label="Dashboard"
                  collapsed={collapsed}
                  isDashboard={true}
                  isBlocked={isBlocked}
                />
                {isSuperAdmin && (
                  <NavItem
                    to="/super-admin"
                    icon={LayoutDashboard}
                    label="Super Admin Dashboard"
                    collapsed={collapsed}
                    isDashboard={true}
                    isBlocked={isBlocked}
                  />
                )}
                {/* <NavItem
                  to="/calendar"
                  icon={CalendarIcon}
                  label="Calendar"
                  badge={3}
                  collapsed={collapsed}
                /> */}
                {/* <NavItem
                  to="/tasks"
                  icon={ClipboardList}
                  label="Tasks"
                  badge={12}
                  collapsed={collapsed}
                /> */}
              </NavGroup>

              {/* Cultivation Flow - Step by Step */}
              {(hasPermission('cultivation:view') || hasAnyRole(['Cultivation Manager', 'Technician / Grower', 'Org Admin', 'Read-only Viewer'])) && (
                <>
                  <NavGroup title="1. Planning" icon={Dna} collapsed={collapsed} isBlocked={isBlocked}>
                    <NavItem
                      to="/genetics"
                      icon={Dna}
                      label="Genetics"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                    <NavItem
                      to="/mothers"
                      icon={Sprout}
                      label="Mother Plants"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                  </NavGroup>

                  <NavGroup title="2. Propagation" icon={Layers} collapsed={collapsed} isBlocked={isBlocked}>
                    <NavItem
                      to="/batches"
                      icon={Layers}
                      label="Batches"
                      badge={2}
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                    <NavItem
                      to="/rooms"
                      icon={Home}
                      label="Rooms"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                  </NavGroup>

                  <NavGroup title="3. Growth" icon={Leaf} collapsed={collapsed} isBlocked={isBlocked}>
                    <NavItem
                      to="/plants"
                      icon={Leaf}
                      label="Plants"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                    <NavItem
                      to="/environment"
                      icon={Thermometer}
                      label="Environment"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                    <NavItem
                      to="/ipm"
                      icon={Bug}
                      label="IPM"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                  </NavGroup>

                  <NavGroup title="4. Harvest" icon={Scissors} collapsed={collapsed} isBlocked={isBlocked}>
                    <NavItem
                      to="/harvest"
                      icon={Scissors}
                      label="Harvest"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                  </NavGroup>
                </>
              )}

              {(hasPermission('inventory:view') || hasAnyRole(['Inventory Clerk', 'Cultivation Manager', 'Org Admin', 'Read-only Viewer'])) && (
                <NavGroup title="5. Post-Harvest" icon={Package} collapsed={collapsed} isBlocked={isBlocked}>
                  <NavItem
                    to="/inventory"
                    icon={Package}
                    label="Inventory"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/waste"
                    icon={Trash2}
                    label="Waste"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                </NavGroup>
              )}

              {(hasPermission('manufacturing:view') || hasAnyRole(['Processor / Mfg Operator', 'Org Admin'])) && (
                <NavGroup title="6. Processing" icon={Factory} collapsed={collapsed} isBlocked={isBlocked}>
                  <NavItem
                    to="/manufacturing"
                    icon={Factory}
                    label="Manufacturing"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/quality-control"
                    icon={Beaker}
                    label="Quality Control"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                </NavGroup>
              )}

              {/* Shipping hidden as of now */}
              {/* {(hasPermission('shipping:view') || hasAnyRole(['Shipper / Logistics', 'Org Admin'])) && (
                <NavGroup title="7. Shipping" icon={Package} collapsed={collapsed}>
                  <NavItem
                    to="/shipping"
                    icon={Package}
                    label="Shipping"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                </NavGroup>
              )} */}

              {(hasPermission('analytics:view') || hasAnyRole(['Cultivation Manager', 'QA / Lab Manager', 'Auditor / Compliance', 'Org Admin', 'Read-only Viewer'])) && (
                <NavGroup title="Analytics" icon={BarChart3} collapsed={collapsed} isBlocked={isBlocked}>
                  <NavItem
                    to="/analytics"
                    icon={BarChart3}
                    label="Analytics"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/yield-analytics"
                    icon={TrendingUp}
                    label="Yield Analytics"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/reports"
                    icon={Download}
                    label="Reports"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                </NavGroup>
              )}

              {(hasPermission('compliance:view') || hasAnyRole(['QA / Lab Manager', 'Auditor / Compliance', 'Org Admin'])) && (
                <NavGroup title="Compliance" icon={Shield} collapsed={collapsed}>
                  <NavItem
                    to="/compliance"
                    icon={Shield}
                    label="Compliance"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/audit-logs"
                    icon={FileText}
                    label="Audit Logs"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                </NavGroup>
              )}

              {(hasPermission('org:manage_users') || hasAnyRole(['Org Admin', 'org_admin'])) && (
                <NavGroup title="Management" icon={Building2} collapsed={collapsed} defaultOpen={false} isBlocked={isBlocked}>
                  <NavItem
                    to="/users"
                    icon={UserCog}
                    label="User Management"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  {/* Roles & Permissions - Only Super Admin and OrgAdmin can see this */}
                  {(isSuperAdmin || isOrgAdmin) && (
                    <NavItem
                      to="/roles-permissions"
                      icon={Shield}
                      label="Roles & Permissions"
                      collapsed={collapsed}
                      isBlocked={isBlocked}
                    />
                  )}
                  <NavItem
                    to="/sops"
                    icon={BookOpen}
                    label="SOPs"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/facilities"
                    icon={Building2}
                    label="Facilities"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/team"
                    icon={Users}
                    label="Team"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                  <NavItem
                    to="/settings"
                    icon={Settings}
                    label="Settings"
                    collapsed={collapsed}
                    isBlocked={isBlocked}
                  />
                </NavGroup>
              )}
            </>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* Help */}
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Help & Support</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm">Help & Support</span>
            </Button>
          )}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-muted-foreground hover:text-foreground transition-all",
              collapsed ? "justify-center" : "justify-start gap-3"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </SidebarContext.Provider>
  );
};

export default Sidebar;
