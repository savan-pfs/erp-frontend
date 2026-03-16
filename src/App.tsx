import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import AppLayout from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/common";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Genetics from "./pages/Genetics";
import Batches from "./pages/Batches";
import BatchDetail from "./pages/BatchDetail";
import Plants from "./pages/Plants";
import Tasks from "./pages/Tasks";
import Compliance from "./pages/Compliance";
import MotherPlants from "./pages/MotherPlants";
import Environment from "./pages/Environment";
import Harvest from "./pages/Harvest";
import Inventory from "./pages/Inventory";
import Waste from "./pages/Waste";
import Manufacturing from "./pages/Manufacturing";
import QualityControl from "./pages/QualityControl";
import WasteManagement from "./pages/WasteManagement";
import AuditLogs from "./pages/AuditLogs";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import IPM from "./pages/IPM";
import Feeding from "./pages/Feeding";
import SOPs from "./pages/SOPs";
import Facilities from "./pages/Facilities";
import Reports from "./pages/Reports";
import Calendar from "./pages/Calendar";
import YieldAnalytics from "./pages/YieldAnalytics";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import UserManagement from "./pages/UserManagement";
import Organizations from "./pages/Organizations";
import Billing from "./pages/Billing";
import Integrations from "./pages/Integrations";
import SystemSettings from "./pages/SystemSettings";
import DatabaseStats from "./pages/DatabaseStats";
import DocumentVerification from "./pages/DocumentVerification";
import RolesPermissions from "./pages/RolesPermissions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route element={<AppLayout />}>
                {/* Public routes (logged in users) */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />

                {/* Cultivation routes - require cultivation permission or relevant roles */}
                <Route path="/rooms" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Rooms />
                  </ProtectedRoute>
                } />
                <Route path="/genetics" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Genetics />
                  </ProtectedRoute>
                } />
                <Route path="/mothers" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <MotherPlants />
                  </ProtectedRoute>
                } />
                <Route path="/batches" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Batches />
                  </ProtectedRoute>
                } />
                <Route path="/batches/:id" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <BatchDetail />
                  </ProtectedRoute>
                } />
                <Route path="/plants" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Plants />
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Tasks />
                  </ProtectedRoute>
                } />
                <Route path="/environment" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Environment />
                  </ProtectedRoute>
                } />
                <Route path="/harvest" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <Harvest />
                  </ProtectedRoute>
                } />
                <Route path="/ipm" element={
                  <ProtectedRoute requiredPermissions={['cultivation:view']} requiredRoles={['Cultivation Manager', 'Technician / Grower', 'Org Admin']}>
                    <IPM />
                  </ProtectedRoute>
                } />

                {/* Inventory routes */}
                <Route path="/inventory" element={
                  <ProtectedRoute requiredPermissions={['inventory:view']} requiredRoles={['Inventory Clerk', 'Cultivation Manager', 'Org Admin']}>
                    <Inventory />
                  </ProtectedRoute>
                } />
                <Route path="/waste" element={
                  <ProtectedRoute requiredPermissions={['inventory:view']} requiredRoles={['Inventory Clerk', 'Cultivation Manager', 'Org Admin']}>
                    <Waste />
                  </ProtectedRoute>
                } />

                {/* Manufacturing routes */}
                <Route path="/manufacturing" element={
                  <ProtectedRoute requiredPermissions={['manufacturing:view']} requiredRoles={['Processor / Mfg Operator', 'Org Admin']}>
                    <Manufacturing />
                  </ProtectedRoute>
                } />
                <Route path="/quality-control" element={
                  <ProtectedRoute requiredPermissions={['lab:view']} requiredRoles={['QA / Lab Manager', 'Org Admin']}>
                    <QualityControl />
                  </ProtectedRoute>
                } />

                {/* Compliance routes */}
                <Route path="/compliance" element={
                  <ProtectedRoute requiredPermissions={['compliance:view']} requiredRoles={['QA / Lab Manager', 'Auditor / Compliance', 'Org Admin']}>
                    <Compliance />
                  </ProtectedRoute>
                } />
                <Route path="/audit-logs" element={
                  <ProtectedRoute requiredPermissions={['audit:view']} requiredRoles={['Auditor / Compliance', 'Org Admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />

                {/* Analytics routes */}
                <Route path="/analytics" element={
                  <ProtectedRoute requiredPermissions={['analytics:view']} requiredRoles={['Cultivation Manager', 'QA / Lab Manager', 'Auditor / Compliance', 'Org Admin', 'Read-only Viewer']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/yield-analytics" element={
                  <ProtectedRoute requiredPermissions={['analytics:view']} requiredRoles={['Cultivation Manager', 'Org Admin']}>
                    <YieldAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute requiredPermissions={['analytics:view', 'analytics:export']} requiredRoles={['Cultivation Manager', 'Org Admin', 'Auditor / Compliance']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                {/* Management routes - Org Admin */}
                <Route path="/users" element={
                  <ProtectedRoute requiredPermissions={['org:manage_users', 'user:view']} requiredRoles={['Org Admin', 'org_admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                {/* Roles & Permissions - Only Super Admin and OrgAdmin */}
                <Route path="/roles-permissions" element={
                  <ProtectedRoute requiredPermissions={['org:manage_roles']} requiredRoles={['Super Admin', 'super_admin', 'Org Admin', 'org_admin']}>
                    <RolesPermissions />
                  </ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute requiredPermissions={['org:manage_users']} requiredRoles={['Org Admin', 'org_admin', 'Cultivation Manager']}>
                    <Team />
                  </ProtectedRoute>
                } />
                <Route path="/sops" element={
                  <ProtectedRoute requiredRoles={['Org Admin', 'org_admin', 'Cultivation Manager']}>
                    <SOPs />
                  </ProtectedRoute>
                } />
                <Route path="/facilities" element={
                  <ProtectedRoute requiredPermissions={['org:manage_locations']} requiredRoles={['Org Admin', 'org_admin']}>
                    <Facilities />
                  </ProtectedRoute>
                } />

                {/* Super Admin only routes */}
                <Route path="/super-admin" element={
                  <ProtectedRoute requiredRoles={['Super Admin', 'super_admin']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/organizations" element={
                  <ProtectedRoute requiredRoles={['Super Admin', 'super_admin']}>
                    <Organizations />
                  </ProtectedRoute>
                } />
                <Route path="/billing" element={
                  <ProtectedRoute requiredPermissions={['platform:billing']} requiredRoles={['Super Admin', 'super_admin']}>
                    <Billing />
                  </ProtectedRoute>
                } />
                <Route path="/integrations" element={
                  <ProtectedRoute requiredPermissions={['platform:integrations']} requiredRoles={['Super Admin', 'super_admin']}>
                    <Integrations />
                  </ProtectedRoute>
                } />
                <Route path="/system-settings" element={
                  <ProtectedRoute requiredPermissions={['platform:manage']} requiredRoles={['Super Admin', 'super_admin']}>
                    <SystemSettings />
                  </ProtectedRoute>
                } />
                <Route path="/database" element={
                  <ProtectedRoute requiredRoles={['Super Admin', 'super_admin']}>
                    <DatabaseStats />
                  </ProtectedRoute>
                } />
                <Route path="/documents/verification" element={
                  <ProtectedRoute requiredPermissions={['documents:approve']} requiredRoles={['Super Admin', 'super_admin']}>
                    <DocumentVerification />
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

