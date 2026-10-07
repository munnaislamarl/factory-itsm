import { addDays, subDays } from 'date-fns'

import type {
  ActivityLogEntry,
  AppNotification,
  AppUser,
  Asset,
  AssetAssignment,
  AssetHistory,
  AssetTransfer,
  Backup,
  Department,
  Employee,
  IpAddress,
  ItDocument,
  Location,
  Maintenance,
  NetworkDevice,
  Server,
  SlaRule,
  Software,
  SparePart,
  SpareTransaction,
  Ticket,
  TicketCategory,
  TicketComment,
  TicketHistory,
  TicketSubcategory,
  TicketWorkLog,
  Vendor,
  VendorService,
} from '@/types'
import { DEFAULT_CATEGORIES, DEFAULT_SLA_RULES } from '@/utils/constants'

export interface SeedStore {
  users: AppUser[]
  departments: Department[]
  locations: Location[]
  employees: Employee[]
  ticket_categories: TicketCategory[]
  ticket_subcategories: TicketSubcategory[]
  tickets: Ticket[]
  ticket_comments: TicketComment[]
  ticket_worklogs: TicketWorkLog[]
  ticket_attachments: never[]
  ticket_history: TicketHistory[]
  sla_rules: SlaRule[]
  assets: Asset[]
  asset_assignments: AssetAssignment[]
  asset_transfers: AssetTransfer[]
  asset_history: AssetHistory[]
  network_devices: NetworkDevice[]
  ip_addresses: IpAddress[]
  servers: Server[]
  backups: Backup[]
  software: Software[]
  software_assignments: never[]
  maintenance: Maintenance[]
  spare_parts: SparePart[]
  spare_transactions: SpareTransaction[]
  vendors: Vendor[]
  vendor_services: VendorService[]
  documents: ItDocument[]
  notifications: AppNotification[]
  activity: ActivityLogEntry[]
}

const iso = (date: Date) => date.toISOString()
const daysFromNow = (offset: number) => iso(addDays(new Date(), offset))
const hoursAgo = (offset: number) => iso(subDays(new Date(), offset / 24))

function createRng(seed: number) {
  let value = seed
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return value / 2147483648
  }
}

const FIRST_NAMES = [
  'Rahim', 'Karim', 'Ayesha', 'Farida', 'Jamal', 'Nusrat', 'Sabbir', 'Tanvir', 'Mitu', 'Rased',
  'Shakil', 'Nasrin', 'Imran', 'Rubel', 'Sumaiya', 'Arif', 'Hasan', 'Lima', 'Nayeem', 'Parvin',
  'Sohel', 'Rina', 'Fahim', 'Tania', 'Mizan', 'Sharmin', 'Rakib', 'Jahid', 'Munia', 'Omar',
]
const LAST_NAMES = ['Hossain', 'Ahmed', 'Islam', 'Akter', 'Chowdhury', 'Rahman', 'Sarker', 'Mia']

export function buildSeed(): SeedStore {
  const rng = createRng(20240917)

  /* Departaments ------------------------------------------------------ */
  const departmentSeeds: { name: string; code: string; description: string }[] = [
    { name: 'Information Technology', code: 'IT', description: 'IT support and infrastructure' },
    { name: 'Production', code: 'PROD', description: 'Factory production floor' },
    { name: 'HR & Admin', code: 'HR', description: 'Human resources and administration' },
    { name: 'Accounts & Finance', code: 'ACC', description: 'Accounts and finance' },
    { name: 'Quality Assurance', code: 'QA', description: 'Quality control and assurance' },
    { name: 'Procurement & Store', code: 'PRC', description: 'Procurement and central store' },
  ]
  const departments: Department[] = departmentSeeds.map((item, index) => ({
    id: `dep_${index + 1}`,
    name: item.name,
    code: item.code,
    description: item.description,
    active: true,
    createdAt: daysFromNow(-400),
    updatedAt: daysFromNow(-30),
  }))

  /* Locations -------------------------------------------------------- */
  const buildings = [
    { name: 'Main Building', floors: ['Ground Floor', '1st Floor', '2nd Floor'] },
    { name: 'Production Block A', floors: ['Ground Floor', '1st Floor'] },
    { name: 'Production Block B', floors: ['Ground Floor', '1st Floor'] },
    { name: 'Utility Building', floors: ['Ground Floor'] },
  ]
  const locations: Location[] = []
  let locationSeq = 1
  buildings.forEach((building) => {
    building.floors.forEach((floor, floorIndex) => {
      const roomCount = 2 + Math.floor(rng() * 2)
      for (let r = 1; r <= roomCount; r += 1) {
        locations.push({
          id: `loc_${locationSeq}`,
          building: building.name,
          floor,
          room: `Room ${floorIndex + 1}0${r}`,
          departmentId: departments[(locationSeq - 1) % departments.length].id,
          description: `${building.name} ${floor}`,
          active: true,
          createdAt: daysFromNow(-380),
          updatedAt: daysFromNow(-60),
        })
        locationSeq += 1
      }
    })
  })

  /* Employees -------------------------------------------------------- */
  const designations = [
    'IT Support Engineer', 'Senior IT Officer', 'Network Engineer', 'System Administrator',
    'Production Supervisor', 'Machine Operator', 'HR Executive', 'Accounts Officer',
    'Quality Inspector', 'Store Keeper', 'Line Leader', 'Maintenance Technician',
  ]
  const employees: Employee[] = []
  for (let i = 0; i < 30; i += 1) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length]
    const department = departments[i % departments.length]
    const name = `${first} ${last}`
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@factory.com`
    employees.push({
      id: `emp_${i + 1}`,
      employeeId: `EMP-${String(1000 + i + 1)}`,
      name,
      departmentId: department.id,
      designation: designations[i % designations.length],
      email,
      phone: `+8801${7 + (i % 3)}${String(10000000 + i * 137).slice(0, 8)}`,
      locationId: locations[i % locations.length].id,
      status: i % 17 === 0 ? 'on_leave' : i % 23 === 0 ? 'inactive' : 'active',
      joinedAt: daysFromNow(-(200 + i * 9)),
      notes: '',
      createdAt: daysFromNow(-(300 - i)),
      updatedAt: daysFromNow(-i),
    })
  }
  departments[0].headEmployeeId = 'emp_2'
  departments[1].headEmployeeId = 'emp_5'
  departments[2].headEmployeeId = 'emp_7'

  /* Categories ------------------------------------------------------- */
  const ticket_categories: TicketCategory[] = []
  const ticket_subcategories: TicketSubcategory[] = []
  DEFAULT_CATEGORIES.forEach((category, index) => {
    const categoryId = `cat_${index + 1}`
    ticket_categories.push({
      id: categoryId,
      name: category.name,
      icon: category.icon,
      active: true,
      createdAt: daysFromNow(-390),
      updatedAt: daysFromNow(-390),
    })
    category.subcategories.forEach((sub, subIndex) => {
      ticket_subcategories.push({
        id: `sub_${index + 1}_${subIndex + 1}`,
        categoryId,
        name: sub,
        active: true,
        createdAt: daysFromNow(-390),
        updatedAt: daysFromNow(-390),
      })
    })
  })

  /* Users ------------------------------------------------------------ */
  const users: AppUser[] = [
    { id: 'usr_admin', name: 'System Administrator', email: 'admin@factory.com', role: 'super_admin', active: true, createdAt: daysFromNow(-400), lastLogin: hoursAgo(2) },
    { id: 'usr_manager', name: employees[1].name, email: 'manager@factory.com', role: 'it_manager', employeeId: employees[1].id, departmentId: departments[0].id, department: departments[0].name, active: true, createdAt: daysFromNow(-380), lastLogin: hoursAgo(1) },
    { id: 'usr_officer', name: employees[0].name, email: 'officer@factory.com', role: 'it_officer', employeeId: employees[0].id, departmentId: departments[0].id, department: departments[0].name, active: true, createdAt: daysFromNow(-360), lastLogin: hoursAgo(3) },
    { id: 'usr_officer2', name: employees[3].name, email: 'officer2@factory.com', role: 'it_officer', employeeId: employees[3].id, departmentId: departments[0].id, department: departments[0].name, active: true, createdAt: daysFromNow(-340), lastLogin: hoursAgo(6) },
    { id: 'usr_employee', name: employees[4].name, email: 'employee@factory.com', role: 'employee', employeeId: employees[4].id, departmentId: departments[1].id, department: departments[1].name, active: true, createdAt: daysFromNow(-320), lastLogin: hoursAgo(20) },
    { id: 'usr_viewer', name: employees[6].name, email: 'viewer@factory.com', role: 'viewer', employeeId: employees[6].id, departmentId: departments[2].id, department: departments[2].name, active: true, createdAt: daysFromNow(-300), lastLogin: hoursAgo(30) },
  ]

  /* SLA rules -------------------------------------------------------- */
  const sla_rules: SlaRule[] = DEFAULT_SLA_RULES.map((rule, index) => ({
    id: `sla_${index + 1}`,
    priority: rule.priority as SlaRule['priority'],
    responseHours: rule.responseHours,
    resolveHours: rule.resolveHours,
    active: true,
    createdAt: daysFromNow(-390),
    updatedAt: daysFromNow(-390),
  }))
  const slaByPriority: Record<string, number> = Object.fromEntries(
    DEFAULT_SLA_RULES.map((rule) => [rule.priority, rule.resolveHours]),
  )

  /* Assets ----------------------------------------------------------- */
  const assetTypeList = [
    'Desktop', 'Laptop', 'Monitor', 'Printer', 'Scanner', 'Server', 'Switch', 'Router',
    'Firewall', 'Wi-Fi Access Point', 'CCTV Camera', 'NVR', 'Biometric Device', 'IP Phone', 'UPS',
  ]
  const brands: Record<string, string[]> = {
    Desktop: ['HP', 'Dell', 'Lenovo'],
    Laptop: ['Dell', 'HP', 'Lenovo'],
    Monitor: ['Samsung', 'Dell', 'LG'],
    Printer: ['HP', 'Canon', 'Epson'],
    Scanner: ['Canon', 'Epson'],
    Server: ['Dell', 'HP', 'Supermicro'],
    Switch: ['Cisco', 'TP-Link', 'D-Link'],
    Router: ['Cisco', 'MikroTik'],
    Firewall: ['Fortinet', 'Cisco'],
    'Wi-Fi Access Point': ['Ubiquiti', 'TP-Link', 'Cisco'],
    'CCTV Camera': ['Hikvision', 'Dahua'],
    NVR: ['Hikvision', 'Dahua'],
    'Biometric Device': ['ZKTeco', 'Suprema'],
    'IP Phone': ['Grandstream', 'Cisco'],
    UPS: ['APC', 'Eaton'],
  }
  const assets: Asset[] = []
  const assetStatuses: Asset['status'][] = ['assigned', 'assigned', 'assigned', 'available', 'under_maintenance', 'in_repair']
  for (let i = 0; i < 50; i += 1) {
    const type = assetTypeList[i % assetTypeList.length]
    const typeBrands = brands[type] ?? ['Generic']
    const status = assetStatuses[i % assetStatuses.length]
    const department = departments[i % departments.length]
    const isAssigned = status === 'assigned'
    const warrantyEnd = i % 9 === 0 ? daysFromNow(20 + i) : daysFromNow(300 + i * 3)
    assets.push({
      id: `ast_${i + 1}`,
      assetTag: `AST-2024-${String(1000 + i)}`,
      typeId: type,
      name: `${type} ${i + 1}`,
      brand: typeBrands[i % typeBrands.length],
      model: `MDL-${String(100 + (i % 40))}`,
      serialNumber: `SN${String(900000 + i * 37)}`,
      purchaseDate: daysFromNow(-(300 + i * 5)),
      purchaseCost: 15000 + (i % 12) * 8500,
      vendorId: `ven_${(i % 5) + 1}`,
      warrantyStart: daysFromNow(-(300 + i * 5)),
      warrantyEnd,
      locationId: locations[i % locations.length].id,
      building: locations[i % locations.length].building,
      floor: locations[i % locations.length].floor,
      departmentId: department.id,
      assignedEmployeeId: isAssigned ? employees[i % employees.length].id : undefined,
      status,
      condition: isAssigned ? 'good' : i % 4 === 0 ? 'fair' : 'good',
      notes: '',
      createdAt: daysFromNow(-(300 + i * 5)),
      updatedAt: daysFromNow(-i),
    })
  }

  const asset_assignments: AssetAssignment[] = assets
    .filter((asset) => asset.status === 'assigned' && asset.assignedEmployeeId)
    .map((asset, index) => ({
      id: `asg_${index + 1}`,
      assetId: asset.id,
      employeeId: asset.assignedEmployeeId as string,
      employeeName: employees.find((e) => e.id === asset.assignedEmployeeId)?.name,
      assignedAt: daysFromNow(-(60 + index * 3)),
      assignedBy: 'usr_officer',
      note: 'Initial assignment',
      createdAt: daysFromNow(-(60 + index * 3)),
      updatedAt: daysFromNow(-(60 + index * 3)),
    }))

  const asset_transfers: AssetTransfer[] = [
    {
      id: 'atf_1', assetId: 'ast_2', fromEmployeeId: 'emp_1', toEmployeeId: 'emp_12',
      transferredAt: daysFromNow(-14), reason: 'Department change', by: 'usr_manager',
      createdAt: daysFromNow(-14), updatedAt: daysFromNow(-14),
    },
    {
      id: 'atf_2', assetId: 'ast_5', fromEmployeeId: 'emp_3', toEmployeeId: 'emp_18',
      transferredAt: daysFromNow(-6), reason: 'Device replacement', by: 'usr_officer',
      createdAt: daysFromNow(-6), updatedAt: daysFromNow(-6),
    },
  ]

  const asset_history: AssetHistory[] = [
    { id: 'ah_1', assetId: 'ast_1', action: 'Created', actor: 'usr_admin', detail: 'Asset registered in inventory', createdAt: daysFromNow(-300) },
    { id: 'ah_2', assetId: 'ast_1', action: 'Assigned', actor: 'usr_officer', detail: `Assigned to ${employees[0].name}`, createdAt: daysFromNow(-60) },
    { id: 'ah_3', assetId: 'ast_2', action: 'Transferred', actor: 'usr_manager', detail: 'Transferred between employees', createdAt: daysFromNow(-14) },
  ]

  /* Network ---------------------------------------------------------- */
  const network_device_seeds: { name: string; deviceType: string; brand: string; ip: string; status: string }[] = [
    { name: 'Core Router', deviceType: 'Router', brand: 'MikroTik', ip: '192.168.1.1', status: 'online' },
    { name: 'Core Switch', deviceType: 'Switch', brand: 'Cisco', ip: '192.168.1.2', status: 'online' },
    { name: 'Edge Firewall', deviceType: 'Firewall', brand: 'Fortinet', ip: '192.168.1.254', status: 'online' },
    { name: 'Wi-Fi AP - Main Lobby', deviceType: 'Wi-Fi Access Point', brand: 'Ubiquiti', ip: '192.168.10.11', status: 'online' },
    { name: 'Wi-Fi AP - Production A', deviceType: 'Wi-Fi Access Point', brand: 'Ubiquiti', ip: '192.168.10.12', status: 'degraded' },
    { name: 'Access Switch - Floor 1', deviceType: 'Switch', brand: 'TP-Link', ip: '192.168.1.21', status: 'online' },
    { name: 'Access Switch - Floor 2', deviceType: 'Switch', brand: 'TP-Link', ip: '192.168.1.22', status: 'maintenance' },
    { name: 'Branch Router', deviceType: 'Router', brand: 'Cisco', ip: '192.168.2.1', status: 'offline' },
    { name: 'Server Farm Switch', deviceType: 'Switch', brand: 'Cisco', ip: '10.0.0.2', status: 'online' },
    { name: 'Guest Wi-Fi AP - QA', deviceType: 'Wi-Fi Access Point', brand: 'TP-Link', ip: '192.168.30.11', status: 'online' },
  ]
  const network_devices: NetworkDevice[] = network_device_seeds.map((device, index) => ({
    id: `net_${index + 1}`,
    name: device.name,
    deviceType: device.deviceType,
    brand: device.brand,
    model: `NW-${200 + index}`,
    ipAddress: device.ip,
    macAddress: `A4:B1:C2:${String(10 + index).padStart(2, '0')}:D${index}:0${index}`,
    vlan: String(10 * ((index % 3) + 1)),
    isp: device.deviceType === 'Router' ? 'Link3 Technologies' : undefined,
    locationId: locations[index % locations.length].id,
    status: device.status,
    notes: '',
    createdAt: daysFromNow(-200),
    updatedAt: daysFromNow(-index),
  }))

  const ip_addresses: IpAddress[] = []
  for (let i = 0; i < 20; i += 1) {
    ip_addresses.push({
      id: `ip_${i + 1}`,
      address: `192.168.1.${50 + i}`,
      vlan: String(10 * ((i % 3) + 1)),
      deviceId: i < network_devices.length ? network_devices[i].id : undefined,
      status: i % 5 === 0 ? 'reserved' : 'in_use',
      description: i % 5 === 0 ? 'Reserved for future device' : 'DHCP lease',
      createdAt: daysFromNow(-180),
      updatedAt: daysFromNow(-i),
    })
  }

  /* Servers & backups ------------------------------------------------ */
  const servers: Server[] = [
    { id: 'srv_1', name: 'Domain Controller', hostname: 'DC01', ip: '10.0.0.10', serverType: 'Physical', virtualization: 'N/A', os: 'Windows Server 2022', cpu: 'Intel Xeon Silver 4310', ram: '64 GB', storage: '2 x 960 GB SSD RAID1', locationId: 'loc_1', status: 'online', ownerId: 'usr_officer', notes: 'Primary AD / DNS', createdAt: daysFromNow(-280), updatedAt: daysFromNow(-2) },
    { id: 'srv_2', name: 'ERP Application Server', hostname: 'ERPAPP01', ip: '10.0.0.20', serverType: 'Virtual', virtualization: 'VMware ESXi', os: 'Windows Server 2019', cpu: '8 vCPU', ram: '32 GB', storage: '500 GB', locationId: 'loc_1', status: 'online', ownerId: 'usr_officer2', notes: '', createdAt: daysFromNow(-250), updatedAt: daysFromNow(-1) },
    { id: 'srv_3', name: 'Database Server', hostname: 'DBSRV01', ip: '10.0.0.30', serverType: 'Physical', virtualization: 'N/A', os: 'Ubuntu Server 22.04', cpu: 'AMD EPYC 7302', ram: '128 GB', storage: '4 x 1.8 TB SAS RAID10', locationId: 'loc_1', status: 'online', ownerId: 'usr_officer', notes: 'PostgreSQL / MySQL', createdAt: daysFromNow(-240), updatedAt: daysFromNow(-1) },
    { id: 'srv_4', name: 'File Server', hostname: 'FS01', ip: '10.0.0.40', serverType: 'Virtual', virtualization: 'Hyper-V', os: 'Windows Server 2022', cpu: '4 vCPU', ram: '16 GB', storage: '8 TB', locationId: 'loc_2', status: 'degraded', ownerId: 'usr_officer2', notes: 'Disk usage high', createdAt: daysFromNow(-210), updatedAt: hoursAgo(5) },
    { id: 'srv_5', name: 'Backup Server', hostname: 'BKP01', ip: '10.0.0.50', serverType: 'Physical', virtualization: 'N/A', os: 'Windows Server 2022', cpu: 'Intel Xeon E-2288G', ram: '32 GB', storage: '12 x 4 TB RAID6', locationId: 'loc_2', status: 'online', ownerId: 'usr_officer', notes: 'Veeam backup repository', createdAt: daysFromNow(-200), updatedAt: daysFromNow(-1) },
  ]

  const backups: Backup[] = [
    { id: 'bkp_1', name: 'DC01 System State', serverId: 'srv_1', backupType: 'Full', schedule: 'Daily 01:00', lastBackup: daysFromNow(-1), status: 'successful', nextBackup: daysFromNow(1), storageLocation: 'BKP01 / D:', notes: '', createdAt: daysFromNow(-180), updatedAt: daysFromNow(-1) },
    { id: 'bkp_2', name: 'ERP App Daily', serverId: 'srv_2', backupType: 'Incremental', schedule: 'Daily 02:00', lastBackup: daysFromNow(-1), status: 'successful', nextBackup: daysFromNow(1), storageLocation: 'BKP01 / E:', notes: '', createdAt: daysFromNow(-180), updatedAt: daysFromNow(-1) },
    { id: 'bkp_3', name: 'Database Full Backup', serverId: 'srv_3', backupType: 'Full', schedule: 'Daily 00:30', lastBackup: daysFromNow(-1), status: 'warning', nextBackup: daysFromNow(1), storageLocation: 'BKP01 / F:', notes: 'Backup finished with warnings', createdAt: daysFromNow(-180), updatedAt: daysFromNow(-1) },
    { id: 'bkp_4', name: 'File Server Sync', serverId: 'srv_4', backupType: 'Incremental', schedule: 'Every 6 hours', lastBackup: daysFromNow(-2), status: 'failed', nextBackup: daysFromNow(0), storageLocation: 'BKP01 / G:', notes: 'Destination out of space', createdAt: daysFromNow(-150), updatedAt: daysFromNow(-2) },
    { id: 'bkp_5', name: 'Backup Repository', serverId: 'srv_5', backupType: 'Full', schedule: 'Weekly Sunday', lastBackup: daysFromNow(-5), status: 'successful', nextBackup: daysFromNow(2), storageLocation: 'Tape Library', notes: '', createdAt: daysFromNow(-150), updatedAt: daysFromNow(-5) },
    { id: 'bkp_6', name: 'Network Config Backup', serverId: 'srv_5', backupType: 'Configuration', schedule: 'Daily 23:00', lastBackup: undefined, status: 'never_run', nextBackup: daysFromNow(1), storageLocation: 'BKP01 / configs', notes: 'Not yet configured', createdAt: daysFromNow(-20), updatedAt: daysFromNow(-20) },
  ]

  /* Software --------------------------------------------------------- */
  const software: Software[] = [
    { id: 'sw_1', name: 'Microsoft Windows 11 Pro', vendorId: 'ven_2', version: '23H2', licenseType: 'oem', licenseKey: 'XXXXX-XXXXX-XXXXX', totalLicenses: 60, usedLicenses: 54, purchaseDate: daysFromNow(-320), expiryDate: undefined, notes: 'Bundled with desktops', createdAt: daysFromNow(-320), updatedAt: daysFromNow(-5) },
    { id: 'sw_2', name: 'Microsoft 365 Business', vendorId: 'ven_2', version: 'Current', licenseType: 'subscription', licenseKey: 'M365-AB12-CD34', totalLicenses: 60, usedLicenses: 58, purchaseDate: daysFromNow(-300), expiryDate: daysFromNow(25), notes: 'Annual subscription', createdAt: daysFromNow(-300), updatedAt: daysFromNow(-2) },
    { id: 'sw_3', name: 'Kaspersky Endpoint Security', vendorId: 'ven_3', version: '12.3', licenseType: 'subscription', licenseKey: 'KAS-7788-9900', totalLicenses: 80, usedLicenses: 72, purchaseDate: daysFromNow(-280), expiryDate: daysFromNow(60), notes: '', createdAt: daysFromNow(-280), updatedAt: daysFromNow(-3) },
    { id: 'sw_4', name: 'AutoCAD', version: '2024', vendorId: 'ven_1', licenseType: 'perpetual', licenseKey: 'ACAD-1111-2222', totalLicenses: 5, usedLicenses: 5, purchaseDate: daysFromNow(-260), expiryDate: undefined, notes: 'Engineering use', createdAt: daysFromNow(-260), updatedAt: daysFromNow(-10) },
    { id: 'sw_5', name: 'Veeam Backup & Replication', vendorId: 'ven_1', version: '12', licenseType: 'subscription', licenseKey: 'VEE-3344-5566', totalLicenses: 10, usedLicenses: 6, purchaseDate: daysFromNow(-240), expiryDate: daysFromNow(120), notes: '', createdAt: daysFromNow(-240), updatedAt: daysFromNow(-4) },
    { id: 'sw_6', name: 'Adobe Acrobat Pro', vendorId: 'ven_1', version: 'DC', licenseType: 'subscription', licenseKey: 'ADBE-9900-1122', totalLicenses: 15, usedLicenses: 15, purchaseDate: daysFromNow(-220), expiryDate: daysFromNow(15), notes: '', createdAt: daysFromNow(-220), updatedAt: daysFromNow(-6) },
    { id: 'sw_7', name: 'MySQL Server', version: '8.0', licenseType: 'free', licenseKey: 'GPL', totalLicenses: 100, usedLicenses: 4, purchaseDate: daysFromNow(-200), notes: 'Open source', createdAt: daysFromNow(-200), updatedAt: daysFromNow(-7) },
    { id: 'sw_8', name: 'Tally Prime', vendorId: 'ven_4', version: '4.0', licenseType: 'perpetual', licenseKey: 'TALLY-4455', totalLicenses: 8, usedLicenses: 8, purchaseDate: daysFromNow(-180), notes: 'Finance department', createdAt: daysFromNow(-180), updatedAt: daysFromNow(-8) },
    { id: 'sw_9', name: 'AnyDesk Business', vendorId: 'ven_3', version: '8.0', licenseType: 'subscription', licenseKey: 'AD-5566-7788', totalLicenses: 12, usedLicenses: 9, purchaseDate: daysFromNow(-160), expiryDate: daysFromNow(90), notes: '', createdAt: daysFromNow(-160), updatedAt: daysFromNow(-9) },
    { id: 'sw_10', name: '7-Zip', version: '23.01', licenseType: 'free', licenseKey: 'LGPL', totalLicenses: 999, usedLicenses: 45, purchaseDate: daysFromNow(-140), notes: 'Open source utility', createdAt: daysFromNow(-140), updatedAt: daysFromNow(-11) },
  ]

  /* Maintenance ------------------------------------------------------ */
  const maintenance: Maintenance[] = []
  const maintenanceTypes = ['preventive', 'corrective', 'repair', 'service']
  const maintenanceStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
  for (let i = 0; i < 12; i += 1) {
    const status = maintenanceStatuses[i % maintenanceStatuses.length]
    const completed = status === 'completed' ? daysFromNow(-(7 + i)) : undefined
    maintenance.push({
      id: `mnt_${i + 1}`,
      assetId: assets[(i * 3) % assets.length].id,
      maintenanceType: maintenanceTypes[i % maintenanceTypes.length],
      scheduledDate: i % 3 === 0 ? daysFromNow(3 + i) : daysFromNow(-(7 + i)),
      completedDate: completed,
      technician: employees[(i % 4) + 8].name,
      vendorId: i % 2 === 0 ? `ven_${(i % 5) + 1}` : undefined,
      cost: 1500 + i * 900,
      status,
      description: `Scheduled ${maintenanceTypes[i % maintenanceTypes.length]} maintenance task`,
      findings: status === 'completed' ? 'No critical issues found' : '',
      actionTaken: status === 'completed' ? 'Cleaned and tested hardware' : '',
      nextMaintenanceDate: daysFromNow(90 + i * 5),
      createdAt: daysFromNow(-(30 + i)),
      updatedAt: daysFromNow(-i),
    })
  }

  /* Spare parts ------------------------------------------------------ */
  const sparePartSeeds: { name: string; sku: string; category: string; unit: string; stock: number; min: number; cost: number }[] = [
    { name: 'DDR4 8GB RAM', sku: 'SP-RAM-8G', category: 'RAM', unit: 'pcs', stock: 24, min: 10, cost: 2600 },
    { name: '512GB NVMe SSD', sku: 'SP-SSD-512', category: 'SSD', unit: 'pcs', stock: 8, min: 10, cost: 6500 },
    { name: '1TB HDD', sku: 'SP-HDD-1T', category: 'HDD', unit: 'pcs', stock: 12, min: 5, cost: 5200 },
    { name: 'USB Keyboard', sku: 'SP-KBD-01', category: 'Keyboard', unit: 'pcs', stock: 35, min: 15, cost: 750 },
    { name: 'Optical Mouse', sku: 'SP-MSE-01', category: 'Mouse', unit: 'pcs', stock: 6, min: 15, cost: 550 },
    { name: 'Laptop Power Adapter', sku: 'SP-ADP-01', category: 'Power Adapter', unit: 'pcs', stock: 10, min: 6, cost: 1800 },
    { name: 'SMPS 500W Power Supply', sku: 'SP-PSU-500', category: 'Power Supply', unit: 'pcs', stock: 4, min: 5, cost: 3200 },
    { name: 'Cat6 Network Cable (Box)', sku: 'SP-NET-C6', category: 'Network Cable', unit: 'box', stock: 15, min: 4, cost: 5500 },
    { name: 'RJ45 Connector (Pack)', sku: 'SP-RJ45-100', category: 'RJ45 Connector', unit: 'pack', stock: 3, min: 5, cost: 400 },
    { name: 'HP 85A Toner Cartridge', sku: 'SP-TNR-85A', category: 'Printer Toner', unit: 'pcs', stock: 9, min: 4, cost: 4200 },
  ]
  const spare_parts: SparePart[] = sparePartSeeds.map((part, index) => ({
    id: `sp_${index + 1}`,
    name: part.name,
    sku: part.sku,
    category: part.category,
    unit: part.unit,
    currentStock: part.stock,
    minimumStock: part.min,
    unitCost: part.cost,
    location: 'IT Store Room',
    notes: '',
    createdAt: daysFromNow(-200),
    updatedAt: daysFromNow(-index),
  }))

  const spare_transactions: SpareTransaction[] = [
    { id: 'spt_1', sparePartId: 'sp_1', type: 'in', quantity: 30, note: 'Purchase from vendor', actor: 'usr_officer', createdAt: daysFromNow(-60), updatedAt: daysFromNow(-60) },
    { id: 'spt_2', sparePartId: 'sp_1', type: 'out', quantity: 6, ticketId: 'tkt_003', note: 'RAM upgrade', actor: 'usr_officer', createdAt: daysFromNow(-40), updatedAt: daysFromNow(-40) },
    { id: 'spt_3', sparePartId: 'sp_2', type: 'in', quantity: 10, note: 'Purchase', actor: 'usr_officer', createdAt: daysFromNow(-35), updatedAt: daysFromNow(-35) },
    { id: 'spt_4', sparePartId: 'sp_2', type: 'out', quantity: 2, ticketId: 'tkt_005', note: 'SSD replacement', actor: 'usr_officer2', createdAt: daysFromNow(-20), updatedAt: daysFromNow(-20) },
    { id: 'spt_5', sparePartId: 'sp_4', type: 'in', quantity: 40, note: 'Bulk purchase', actor: 'usr_manager', createdAt: daysFromNow(-50), updatedAt: daysFromNow(-50) },
    { id: 'spt_6', sparePartId: 'sp_4', type: 'out', quantity: 5, ticketId: 'tkt_008', note: 'Keyboard replacements', actor: 'usr_officer', createdAt: daysFromNow(-12), updatedAt: daysFromNow(-12) },
    { id: 'spt_7', sparePartId: 'sp_6', type: 'adjustment', quantity: -1, note: 'Stock count correction', actor: 'usr_manager', createdAt: daysFromNow(-8), updatedAt: daysFromNow(-8) },
  ]

  /* Vendors ---------------------------------------------------------- */
  const vendors: Vendor[] = [
    { id: 'ven_1', name: 'TechSource Ltd.', contactPerson: 'Mahbub Alam', phone: '+8801711000001', email: 'sales@techsource.com', address: 'Dhaka, Bangladesh', serviceType: 'Hardware Supply', contractType: 'amc', contractStart: daysFromNow(-300), contractEnd: daysFromNow(60), notes: 'Primary hardware vendor', createdAt: daysFromNow(-300), updatedAt: daysFromNow(-10) },
    { id: 'ven_2', name: 'SoftMart Solutions', contactPerson: 'Nabila Karim', phone: '+8801711000002', email: 'info@softmart.com', address: 'Gulshan, Dhaka', serviceType: 'Software Supply', contractType: 'service_agreement', contractStart: daysFromNow(-250), contractEnd: daysFromNow(120), notes: 'Microsoft & Adobe licensing', createdAt: daysFromNow(-250), updatedAt: daysFromNow(-12) },
    { id: 'ven_3', name: 'SecureNet Systems', contactPerson: 'Tanvir Ahmed', phone: '+8801711000003', email: 'support@securenet.com', address: 'Banani, Dhaka', serviceType: 'Network Services', contractType: 'amc', contractStart: daysFromNow(-200), contractEnd: daysFromNow(20), notes: 'Network & security AMC', createdAt: daysFromNow(-200), updatedAt: daysFromNow(-14) },
    { id: 'ven_4', name: 'ServerWorks BD', contactPerson: 'Rezaul Haque', phone: '+8801711000004', email: 'care@serverworks.com', address: 'Mohakhali, Dhaka', serviceType: 'Server & Storage', contractType: 'warranty', contractStart: daysFromNow(-180), contractEnd: daysFromNow(180), notes: 'Server warranty support', createdAt: daysFromNow(-180), updatedAt: daysFromNow(-16) },
    { id: 'ven_5', name: 'VisionEye CCTV', contactPerson: 'Shirin Sultana', phone: '+8801711000005', email: 'service@visioneye.com', address: 'Uttara, Dhaka', serviceType: 'CCTV & Security', contractType: 'amc', contractStart: daysFromNow(-150), contractEnd: daysFromNow(210), notes: 'CCTV installation & maintenance', createdAt: daysFromNow(-150), updatedAt: daysFromNow(-18) },
  ]

  const vendor_services: VendorService[] = [
    { id: 'vs_1', vendorId: 'ven_1', assetId: 'ast_6', serviceDate: daysFromNow(-25), description: 'On-site server hardware inspection', cost: 5000, status: 'completed', createdAt: daysFromNow(-25), updatedAt: daysFromNow(-25) },
    { id: 'vs_2', vendorId: 'ven_3', ticketId: 'tkt_004', serviceDate: daysFromNow(-10), description: 'Firewall rule review', cost: 8000, status: 'completed', createdAt: daysFromNow(-10), updatedAt: daysFromNow(-10) },
    { id: 'vs_3', vendorId: 'ven_5', assetId: 'ast_11', serviceDate: daysFromNow(-4), description: 'CCTV camera replacement', cost: 12000, status: 'in_progress', createdAt: daysFromNow(-4), updatedAt: daysFromNow(-4) },
  ]

  /* Documents -------------------------------------------------------- */
  const documents: ItDocument[] = [
    { id: 'doc_1', name: 'Server Invoice - Dell R750.pdf', category: 'asset_invoice', relatedType: 'assets', relatedId: 'srv_1', url: '', size: 248000, uploadedBy: 'usr_manager', confidential: true, createdAt: daysFromNow(-240) },
    { id: 'doc_2', name: 'Firewall Warranty.pdf', category: 'warranty', relatedType: 'assets', relatedId: 'ast_3', url: '', size: 180000, uploadedBy: 'usr_officer', confidential: false, createdAt: daysFromNow(-180) },
    { id: 'doc_3', name: 'Network Topology.png', category: 'network_doc', relatedType: 'network_devices', url: '', size: 520000, uploadedBy: 'usr_officer', confidential: false, createdAt: daysFromNow(-120) },
    { id: 'doc_4', name: 'Microsoft 365 License.pdf', category: 'license', relatedType: 'software', relatedId: 'sw_2', url: '', size: 320000, uploadedBy: 'usr_manager', confidential: true, createdAt: daysFromNow(-100) },
    { id: 'doc_5', name: 'CCTV AMC Agreement.pdf', category: 'amc', relatedType: 'vendors', relatedId: 'ven_5', url: '', size: 410000, uploadedBy: 'usr_manager', confidential: true, createdAt: daysFromNow(-90) },
    { id: 'doc_6', name: 'Server Config Backup.zip', category: 'config_backup', relatedType: 'servers', relatedId: 'srv_1', url: '', size: 1200000, uploadedBy: 'usr_officer', confidential: true, createdAt: daysFromNow(-30) },
    { id: 'doc_7', name: 'Printer Service Report.pdf', category: 'service_report', relatedType: 'assets', relatedId: 'ast_4', url: '', size: 150000, uploadedBy: 'usr_officer2', confidential: false, createdAt: daysFromNow(-15) },
    { id: 'doc_8', name: 'AD Documentation.pdf', category: 'server_doc', relatedType: 'servers', relatedId: 'srv_1', url: '', size: 260000, uploadedBy: 'usr_officer', confidential: true, createdAt: daysFromNow(-8) },
  ]

  /* Tickets ---------------------------------------------------------- */
  const ticketSeeds: {
    title: string; categoryIndex: number; subIndex: number; priority: Ticket['priority']; status: Ticket['status']; requester: number; assignee?: string; age: number;
  }[] = [
    { title: 'Laptop not booting after update', categoryIndex: 0, subIndex: 1, priority: 'high', status: 'in_progress', requester: 4, assignee: 'usr_officer', age: 1 },
    { title: 'Cannot connect to factory Wi-Fi', categoryIndex: 2, subIndex: 2, priority: 'medium', status: 'assigned', requester: 7, assignee: 'usr_officer2', age: 0 },
    { title: 'RAM upgrade required for design desktop', categoryIndex: 0, subIndex: 0, priority: 'low', status: 'resolved', requester: 9, assignee: 'usr_officer', age: 5 },
    { title: 'Firewall blocking ERP integration', categoryIndex: 9, subIndex: 4, priority: 'critical', status: 'pending_vendor', requester: 2, assignee: 'usr_officer2', age: 3 },
    { title: 'SSD failure on accounts PC', categoryIndex: 0, subIndex: 0, priority: 'high', status: 'in_progress', requester: 12, assignee: 'usr_officer', age: 2 },
    { title: 'Outlook not receiving email', categoryIndex: 3, subIndex: 3, priority: 'medium', status: 'pending_user', requester: 15, assignee: 'usr_officer', age: 1 },
    { title: 'Printer toner replacement - Accounts', categoryIndex: 6, subIndex: 1, priority: 'low', status: 'closed', requester: 17, assignee: 'usr_officer2', age: 9 },
    { title: 'Keyboard not working - Store room', categoryIndex: 0, subIndex: 6, priority: 'low', status: 'assigned', requester: 20, assignee: 'usr_officer', age: 0 },
    { title: 'CCTV camera offline at gate 2', categoryIndex: 7, subIndex: 0, priority: 'high', status: 'in_progress', requester: 3, assignee: 'usr_officer2', age: 2 },
    { title: 'Create email account for new employee', categoryIndex: 3, subIndex: 0, priority: 'medium', status: 'resolved', requester: 22, assignee: 'usr_officer', age: 4 },
    { title: 'Server disk space critical on FS01', categoryIndex: 5, subIndex: 1, priority: 'critical', status: 'assigned', requester: 5, assignee: 'usr_officer2', age: 0 },
    { title: 'Biometric device not syncing attendance', categoryIndex: 8, subIndex: 2, priority: 'medium', status: 'new', requester: 25, age: 0 },
    { title: 'Monitor flickering - QA lab', categoryIndex: 0, subIndex: 2, priority: 'low', status: 'new', requester: 27, age: 0 },
    { title: 'VPN access request for remote work', categoryIndex: 2, subIndex: 6, priority: 'medium', status: 'resolved', requester: 11, assignee: 'usr_officer', age: 7 },
    { title: 'ERP application throwing errors', categoryIndex: 9, subIndex: 1, priority: 'high', status: 'reopened', requester: 8, assignee: 'usr_officer2', age: 6 },
    { title: 'Password reset for plant manager', categoryIndex: 4, subIndex: 1, priority: 'low', status: 'closed', requester: 14, assignee: 'usr_officer', age: 10 },
    { title: 'UPS battery backup failing', categoryIndex: 0, subIndex: 5, priority: 'critical', status: 'cancelled', requester: 6, assignee: 'usr_officer2', age: 8 },
    { title: 'Antivirus not updating on production PCs', categoryIndex: 1, subIndex: 2, priority: 'medium', status: 'in_progress', requester: 19, assignee: 'usr_officer', age: 2 },
    { title: 'Network printer not reachable', categoryIndex: 6, subIndex: 3, priority: 'medium', status: 'assigned', requester: 23, assignee: 'usr_officer2', age: 1 },
    { title: 'Anonymous - general IT assistance', categoryIndex: 10, subIndex: 0, priority: 'low', status: 'pending_user', requester: 29, assignee: 'usr_officer', age: 3 },
  ]

  const tickets: Ticket[] = ticketSeeds.map((seed, index) => {
    const category = ticket_categories[seed.categoryIndex]
    const subId = `sub_${seed.categoryIndex + 1}_${seed.subIndex + 1}`
    const requester = employees[seed.requester % employees.length]
    const assigneeUser = seed.assignee ? users.find((u) => u.id === seed.assignee) : undefined
    const created = daysFromNow(-seed.age)
    const due = daysFromNow(-seed.age + ((slaByPriority[seed.priority] ?? 24) / 24))
    const closed = seed.status === 'closed' || seed.status === 'resolved' ? daysFromNow(-Math.max(0, seed.age - 1)) : undefined
    return {
      id: `tkt_${String(index + 1).padStart(3, '0')}`,
      code: `TK-2024-${String(1000 + index)}`,
      title: seed.title,
      description: `${seed.title}. Reported by ${requester.name} from ${departments.find((d) => d.id === requester.departmentId)?.name ?? ''}. Additional details captured at report time.`,
      requesterId: requester.id,
      requesterName: requester.name,
      employeeId: requester.employeeId,
      departmentId: requester.departmentId,
      locationId: requester.locationId,
      categoryId: category.id,
      subcategoryId: subId,
      priority: seed.priority,
      status: seed.status,
      assignedTo: assigneeUser?.id,
      assignedToName: assigneeUser?.name,
      dueDate: due,
      slaHours: slaByPriority[seed.priority],
      resolvedAt: seed.status === 'resolved' || seed.status === 'closed' ? closed : undefined,
      closedAt: seed.status === 'closed' ? closed : undefined,
      resolution: seed.status === 'resolved' || seed.status === 'closed' ? 'Issue diagnosed and resolved. User confirmed the fix is working.' : undefined,
      rating: seed.status === 'closed' ? 4 + (index % 2) : undefined,
      ratingComment: seed.status === 'closed' ? 'Quick response, thank you.' : undefined,
      firstResponseAt: seed.assignee ? daysFromNow(-seed.age) : undefined,
      reopenCount: seed.status === 'reopened' ? 1 : 0,
      createdAt: created,
      updatedAt: closed ?? created,
    }
  })

  const ticket_comments: TicketComment[] = [
    { id: 'tc_1', ticketId: 'tkt_001', authorId: 'usr_employee', authorName: employees[4].name, body: 'Laptop is completely dead, no display at all.', internal: false, createdAt: daysFromNow(-1), updatedAt: daysFromNow(-1) },
    { id: 'tc_2', ticketId: 'tkt_001', authorId: 'usr_officer', authorName: users[2].name, body: 'Inspected the device. Looks like a failed boot drive. Scheduling replacement.', internal: false, createdAt: daysFromNow(-0.7), updatedAt: daysFromNow(-0.7) },
    { id: 'tc_3', ticketId: 'tkt_001', authorId: 'usr_officer', authorName: users[2].name, body: 'Internal note: spare SSD available in store.', internal: true, createdAt: daysFromNow(-0.6), updatedAt: daysFromNow(-0.6) },
    { id: 'tc_4', ticketId: 'tkt_004', authorId: 'usr_manager', authorName: users[1].name, body: 'Contacted SecureNet vendor, waiting for their engineer.', internal: false, createdAt: daysFromNow(-2), updatedAt: daysFromNow(-2) },
  ]

  const ticket_worklogs: TicketWorkLog[] = [
    { id: 'tw_1', ticketId: 'tkt_001', officerId: 'usr_officer', officerName: users[2].name, minutes: 45, note: 'Diagnosed faulty SSD and prepared replacement.', createdAt: daysFromNow(-0.6), updatedAt: daysFromNow(-0.6) },
    { id: 'tw_2', ticketId: 'tkt_005', officerId: 'usr_officer', officerName: users[2].name, minutes: 90, note: 'Replaced SSD and restored user profile.', createdAt: daysFromNow(-1.2), updatedAt: daysFromNow(-1.2) },
    { id: 'tw_3', ticketId: 'tkt_009', officerId: 'usr_officer2', officerName: users[3].name, minutes: 60, note: 'Checked camera power and PoE injector.', createdAt: daysFromNow(-1.5), updatedAt: daysFromNow(-1.5) },
  ]

  const ticket_history: TicketHistory[] = [
    { id: 'th_1', ticketId: 'tkt_001', actor: 'System', field: 'status', oldValue: '', newValue: 'new', createdAt: daysFromNow(-1) },
    { id: 'th_2', ticketId: 'tkt_001', actor: users[2].name, field: 'assignedTo', oldValue: '', newValue: users[2].name, createdAt: daysFromNow(-0.9) },
    { id: 'th_3', ticketId: 'tkt_001', actor: users[2].name, field: 'status', oldValue: 'assigned', newValue: 'in_progress', createdAt: daysFromNow(-0.8) },
    { id: 'th_4', ticketId: 'tkt_015', actor: users[3].name, field: 'status', oldValue: 'resolved', newValue: 'reopened', createdAt: daysFromNow(-1) },
  ]

  /* Notifications ---------------------------------------------------- */
  const notifications: AppNotification[] = [
    { id: 'ntf_1', title: 'Critical ticket assigned', description: 'TK-2024-1010 “Server disk space critical” is critical and needs attention.', timestamp: hoursAgo(1), read: false, tone: 'destructive', type: 'ticket', link: '/app/tickets/tkt_011', createdAt: hoursAgo(1) },
    { id: 'ntf_2', title: 'SLA breach risk', description: '2 tickets are close to breaching SLA.', timestamp: hoursAgo(4), read: false, tone: 'warning', type: 'sla', link: '/app/tickets', createdAt: hoursAgo(4) },
    { id: 'ntf_3', title: 'Backup failed', description: 'File Server Sync backup failed — destination out of space.', timestamp: hoursAgo(8), read: false, tone: 'destructive', type: 'backup', link: '/app/backups', createdAt: hoursAgo(8) },
    { id: 'ntf_4', title: 'License expiring soon', description: 'Adobe Acrobat Pro expires in 15 days.', timestamp: hoursAgo(20), read: false, tone: 'warning', type: 'license', link: '/app/software', createdAt: hoursAgo(20) },
    { id: 'ntf_5', title: 'Low spare stock', description: '512GB NVMe SSD is below minimum stock.', timestamp: hoursAgo(26), read: true, tone: 'info', type: 'stock', link: '/app/spare-parts', createdAt: hoursAgo(26) },
    { id: 'ntf_6', title: 'Warranty expiring', description: 'A network device warranty expires in 20 days.', timestamp: hoursAgo(40), read: true, tone: 'warning', type: 'warranty', link: '/app/assets', createdAt: hoursAgo(40) },
    { id: 'ntf_7', title: 'Maintenance due', description: 'Preventive maintenance is scheduled for 3 assets.', timestamp: hoursAgo(50), read: true, tone: 'info', type: 'maintenance', link: '/app/maintenance', createdAt: hoursAgo(50) },
  ]

  /* Activity --------------------------------------------------------- */
  const activity: ActivityLogEntry[] = [
    { id: 'act_1', action: 'ticket.created', entityType: 'tickets', entityId: 'tkt_012', actor: employees[25].name, detail: 'Created ticket “Biometric device not syncing attendance”', timestamp: hoursAgo(0.5), createdAt: hoursAgo(0.5) },
    { id: 'act_2', action: 'ticket.assigned', entityType: 'tickets', entityId: 'tkt_011', actor: users[1].name, detail: 'Assigned ticket to ' + users[3].name, timestamp: hoursAgo(1), createdAt: hoursAgo(1) },
    { id: 'act_3', action: 'asset.assigned', entityType: 'assets', entityId: 'ast_4', actor: users[2].name, detail: 'Assigned asset to an employee', timestamp: hoursAgo(3), createdAt: hoursAgo(3) },
    { id: 'act_4', action: 'spare.out', entityType: 'spare_parts', entityId: 'sp_2', actor: users[2].name, detail: 'Issued 2 x 512GB NVMe SSD against ticket', timestamp: hoursAgo(5), createdAt: hoursAgo(5) },
    { id: 'act_5', action: 'backup.failed', entityType: 'backups', entityId: 'bkp_4', actor: 'System', detail: 'Backup job “File Server Sync” failed', timestamp: hoursAgo(8), createdAt: hoursAgo(8) },
    { id: 'act_6', action: 'login', entityType: 'users', entityId: 'usr_manager', actor: users[1].name, detail: 'Signed in to the ITSM portal', timestamp: hoursAgo(9), createdAt: hoursAgo(9) },
    { id: 'act_7', action: 'maintenance.completed', entityType: 'maintenance', entityId: 'mnt_3', actor: employees[10].name, detail: 'Completed preventive maintenance', timestamp: hoursAgo(12), createdAt: hoursAgo(12) },
    { id: 'act_8', action: 'user.saved', entityType: 'users', entityId: 'usr_officer2', actor: users[0].name, detail: 'Updated user role to IT Officer', timestamp: hoursAgo(20), createdAt: hoursAgo(20) },
  ]

  return {
    users,
    departments,
    locations,
    employees,
    ticket_categories,
    ticket_subcategories,
    tickets,
    ticket_comments,
    ticket_worklogs,
    ticket_attachments: [],
    ticket_history,
    sla_rules,
    assets,
    asset_assignments,
    asset_transfers,
    asset_history,
    network_devices,
    ip_addresses,
    servers,
    backups,
    software,
    software_assignments: [],
    maintenance,
    spare_parts,
    spare_transactions,
    vendors,
    vendor_services,
    documents,
    notifications,
    activity,
  }
}
