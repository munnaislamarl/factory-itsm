import { ResourcePage } from '@/components/resource/ResourcePage'
import { RESOURCES } from '@/config/resources'

export function EmployeesPage() {
  return <ResourcePage config={RESOURCES.employees} />
}
export function DepartmentsPage() {
  return <ResourcePage config={RESOURCES.departments} />
}
export function LocationsPage() {
  return <ResourcePage config={RESOURCES.locations} />
}
export function NetworkPage() {
  return <ResourcePage config={RESOURCES.network} />
}
export function ServersPage() {
  return <ResourcePage config={RESOURCES.servers} />
}
export function BackupsPage() {
  return <ResourcePage config={RESOURCES.backups} />
}
export function SoftwarePage() {
  return <ResourcePage config={RESOURCES.software} />
}
export function MaintenancePage() {
  return <ResourcePage config={RESOURCES.maintenance} />
}
export function VendorsPage() {
  return <ResourcePage config={RESOURCES.vendors} />
}
export function DocumentsPage() {
  return <ResourcePage config={RESOURCES.documents} />
}
export function UsersPage() {
  return <ResourcePage config={RESOURCES.users} />
}
export function TicketCategoriesPage() {
  return <ResourcePage config={RESOURCES['ticket-categories']} />
}
export function TicketSubcategoriesPage() {
  return <ResourcePage config={RESOURCES['ticket-subcategories']} />
}
export function AssetsPage() {
  return <ResourcePage config={RESOURCES.assets} />
}
