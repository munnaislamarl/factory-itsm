import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { LookupProvider } from '@/hooks/useLookups'
import { ThemeProvider } from '@/hooks/useTheme'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { RoleGuard } from '@/layouts/RoleGuard'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import type { Permission } from '@/utils/permissions'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TicketsPage = lazy(() => import('@/pages/TicketsPage').then((m) => ({ default: m.TicketsPage })))
const TicketDetailPage = lazy(() => import('@/pages/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage })))
const AssetDetailPage = lazy(() => import('@/pages/AssetDetailPage').then((m) => ({ default: m.AssetDetailPage })))
const SparePartsPage = lazy(() => import('@/pages/SparePartsPage').then((m) => ({ default: m.SparePartsPage })))
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const resourcePages = () => import('@/pages/resourcePages')

const EmployeesPage = lazy(() => resourcePages().then((m) => ({ default: m.EmployeesPage })))
const DepartmentsPage = lazy(() => resourcePages().then((m) => ({ default: m.DepartmentsPage })))
const LocationsPage = lazy(() => resourcePages().then((m) => ({ default: m.LocationsPage })))
const NetworkPage = lazy(() => resourcePages().then((m) => ({ default: m.NetworkPage })))
const ServersPage = lazy(() => resourcePages().then((m) => ({ default: m.ServersPage })))
const BackupsPage = lazy(() => resourcePages().then((m) => ({ default: m.BackupsPage })))
const SoftwarePage = lazy(() => resourcePages().then((m) => ({ default: m.SoftwarePage })))
const MaintenancePage = lazy(() => resourcePages().then((m) => ({ default: m.MaintenancePage })))
const VendorsPage = lazy(() => resourcePages().then((m) => ({ default: m.VendorsPage })))
const DocumentsPage = lazy(() => resourcePages().then((m) => ({ default: m.DocumentsPage })))
const UsersPage = lazy(() => resourcePages().then((m) => ({ default: m.UsersPage })))
const TicketCategoriesPage = lazy(() => resourcePages().then((m) => ({ default: m.TicketCategoriesPage })))
const TicketSubcategoriesPage = lazy(() => resourcePages().then((m) => ({ default: m.TicketSubcategoriesPage })))
const AssetsPage = lazy(() => resourcePages().then((m) => ({ default: m.AssetsPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

function guard(permission: Permission, node: React.ReactNode) {
  return <RoleGuard permission={permission}>{node}</RoleGuard>
}

function LoginRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  if (isBootstrapping) return <RouteFallback />
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />
  return <LoginPage />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LookupProvider>
          <TooltipProvider delayDuration={200}>
            <HashRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/login" element={<LoginRoute />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<DashboardLayout />}>
                      <Route index element={<Navigate to="/app/dashboard" replace />} />
                      <Route path="dashboard" element={guard('dashboard.view', <DashboardPage />)} />
                      <Route path="tickets" element={guard('tickets.view', <TicketsPage />)} />
                      <Route path="tickets/:id" element={guard('tickets.view', <TicketDetailPage />)} />
                      <Route path="assets" element={guard('assets.view', <AssetsPage />)} />
                      <Route path="assets/:id" element={guard('assets.view', <AssetDetailPage />)} />
                      <Route path="maintenance" element={guard('maintenance.view', <MaintenancePage />)} />
                      <Route path="spare-parts" element={guard('spares.view', <SparePartsPage />)} />
                      <Route path="network" element={guard('network.view', <NetworkPage />)} />
                      <Route path="servers" element={guard('servers.view', <ServersPage />)} />
                      <Route path="backups" element={guard('servers.view', <BackupsPage />)} />
                      <Route path="software" element={guard('software.view', <SoftwarePage />)} />
                      <Route path="employees" element={guard('employees.view', <EmployeesPage />)} />
                      <Route path="departments" element={guard('employees.view', <DepartmentsPage />)} />
                      <Route path="locations" element={guard('employees.view', <LocationsPage />)} />
                      <Route path="vendors" element={guard('vendors.view', <VendorsPage />)} />
                      <Route path="documents" element={guard('documents.view', <DocumentsPage />)} />
                      <Route path="reports" element={guard('reports.view', <ReportsPage />)} />
                      <Route path="notifications" element={guard('notifications.view', <NotificationsPage />)} />
                      <Route path="users" element={guard('users.manage', <UsersPage />)} />
                      <Route path="ticket-categories" element={guard('settings.view', <TicketCategoriesPage />)} />
                      <Route path="ticket-subcategories" element={guard('settings.view', <TicketSubcategoriesPage />)} />
                      <Route path="settings" element={guard('settings.view', <SettingsPage />)} />
                    </Route>
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </HashRouter>
            <Toaster />
          </TooltipProvider>
        </LookupProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
