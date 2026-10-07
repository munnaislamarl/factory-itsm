import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { env } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { isDemoMode } from '@/services/datasource'
import type { Theme } from '@/hooks/useTheme'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/utils/permissions'
import type { Permission } from '@/utils/permissions'
import { ROLES, ROLE_DESCRIPTIONS, optionLabel } from '@/utils/constants'

const PERMISSION_GROUPS: { label: string; prefix: string }[] = [
  { label: 'Dashboard', prefix: 'dashboard.' },
  { label: 'Tickets', prefix: 'tickets.' },
  { label: 'Assets', prefix: 'assets.' },
  { label: 'Employees & Locations', prefix: 'employees.' },
  { label: 'Network & Servers', prefix: 'network.' },
  { label: 'Software', prefix: 'software.' },
  { label: 'Maintenance & Spares', prefix: 'maintenance.' },
  { label: 'Vendors & Documents', prefix: 'vendors.' },
  { label: 'Reports & Notifications', prefix: 'reports.' },
  { label: 'Administration', prefix: 'settings.' },
]

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function SettingsPage() {
  const { user, can } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const grouped = (prefix: string) => PERMISSIONS.filter((permission) => permission.startsWith(prefix))

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Manage configuration, roles and system preferences." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          {can('lookup.manage') || can('settings.view') ? <TabsTrigger value="catalog">Catalogs</TabsTrigger> : null}
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name" value={user?.name} />
              <Field label="Email" value={user?.email} />
              <Field label="Role" value={optionLabel(ROLES, user?.role ?? '')} />
              <Field label="Department" value={user?.department ?? '—'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how the ITSM portal looks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {THEMES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTheme(item.value)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      theme === item.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Role-based access control is enforced in the UI and the API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ROLES.map((role) => (
                  <div key={role.value} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold text-foreground">{role.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role.value]}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {ROLE_PERMISSIONS[role.value as keyof typeof ROLE_PERMISSIONS]?.length ?? 0} permissions
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="min-w-[220px]">Permission</TableHead>
                      {ROLES.map((role) => (
                        <TableHead key={role.value} className="text-center">{role.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_GROUPS.filter((group) => grouped(group.prefix).length > 0).map((group) => (
                      <Fragment key={group.label}>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={ROLES.length + 1} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.label}
                          </TableCell>
                        </TableRow>
                        {grouped(group.prefix).map((permission) => (
                          <TableRow key={permission}>
                            <TableCell className="font-mono text-xs">{permission}</TableCell>
                            {ROLES.map((role) => {
                              const allowed = ROLE_PERMISSIONS[role.value as keyof typeof ROLE_PERMISSIONS]?.includes(permission as Permission)
                              return (
                                <TableCell key={role.value} className="text-center">
                                  {allowed ? <Check className="mx-auto h-4 w-4 text-success" /> : <span className="text-muted-foreground">—</span>}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <CardTitle>Catalogs & Lookups</CardTitle>
              <CardDescription>Maintain ticket categories, sub-categories, departments and locations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/app/ticket-categories')}>Ticket Categories</Button>
              <Button variant="outline" onClick={() => navigate('/app/ticket-subcategories')}>Ticket Sub-categories</Button>
              <Button variant="outline" onClick={() => navigate('/app/departments')}>Departments</Button>
              <Button variant="outline" onClick={() => navigate('/app/locations')}>Locations</Button>
              <Button variant="outline" onClick={() => navigate('/app/users')}>Users</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System</CardTitle>
              <CardDescription>Environment and backend connection.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Application" value={env.appName} />
              <Field label="Company" value={env.companyName} />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Data source</p>
                <Badge variant={isDemoMode ? 'warning' : 'success'}>
                  {isDemoMode ? 'Demo (in-memory)' : 'Google Sheets (live)'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">API configured</p>
                <Badge variant={env.isApiConfigured ? 'success' : 'muted'}>
                  {env.isApiConfigured ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  )
}
