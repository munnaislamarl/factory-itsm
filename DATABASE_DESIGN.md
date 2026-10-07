# Database Design — Google Sheets

The database is a single Google Spreadsheet. **One tab per collection.** The
first row holds uppercase header names; the Apps Script backend converts headers
to/from the camelCase keys used by the frontend. Soft deletes are implemented
with a `DELETED_AT` column; numeric and boolean columns are cast on read.

> No foreign-key constraints exist in Sheets, so referential integrity is
> enforced by the application layer (and mirrored by the mock data source).

## Collections

### users
`ID · NAME · EMAIL · ROLE · EMPLOYEE_ID · DEPARTMENT_ID · DEPARTMENT · ACTIVE · PASSWORD_HASH · PASSWORD_SALT · CREATED_AT · LAST_LOGIN · DELETED_AT`

### departments
`ID · NAME · CODE · HEAD_EMPLOYEE_ID · BUILDING_ID · DESCRIPTION · ACTIVE · CREATED_AT · UPDATED_AT · DELETED_AT`

### locations
`ID · BUILDING · FLOOR · ROOM · DEPARTMENT_ID · DESCRIPTION · ACTIVE · CREATED_AT · UPDATED_AT · DELETED_AT`

### employees
`ID · EMPLOYEE_ID · NAME · DEPARTMENT_ID · DESIGNATION · EMAIL · PHONE · LOCATION_ID · STATUS · JOINED_AT · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### ticket_categories
`ID · NAME · ICON · ACTIVE · CREATED_AT · UPDATED_AT · DELETED_AT`

### ticket_subcategories
`ID · CATEGORY_ID · NAME · ACTIVE · CREATED_AT · UPDATED_AT · DELETED_AT`

### tickets
`ID · CODE · TITLE · DESCRIPTION · REQUESTER_ID · REQUESTER_NAME · EMPLOYEE_ID · DEPARTMENT_ID · LOCATION_ID · CATEGORY_ID · SUBCATEGORY_ID · PRIORITY · STATUS · ASSIGNED_TO · ASSIGNED_TO_NAME · DUE_DATE · SLA_HOURS · RESOLVED_AT · CLOSED_AT · RESOLUTION · RATING · RATING_COMMENT · FIRST_RESPONSE_AT · REOPEN_COUNT · CREATED_AT · UPDATED_AT · DELETED_AT`

### ticket_comments
`ID · TICKET_ID · AUTHOR_ID · AUTHOR_NAME · BODY · INTERNAL · CREATED_AT · UPDATED_AT · DELETED_AT`

### ticket_worklogs
`ID · TICKET_ID · OFFICER_ID · OFFICER_NAME · MINUTES · NOTE · CREATED_AT · UPDATED_AT · DELETED_AT`

### ticket_attachments
`ID · TICKET_ID · NAME · URL · SIZE · UPLOADED_BY · CREATED_AT · UPDATED_AT · DELETED_AT`

### ticket_history
`ID · TICKET_ID · ACTOR · FIELD · OLD_VALUE · NEW_VALUE · CREATED_AT · UPDATED_AT · DELETED_AT`

### sla_rules
`ID · PRIORITY · RESPONSE_HOURS · RESOLVE_HOURS · ACTIVE · CREATED_AT · UPDATED_AT · DELETED_AT`

### assets
`ID · ASSET_TAG · QR_CODE · TYPE_ID · NAME · BRAND · MODEL · SERIAL_NUMBER · PURCHASE_DATE · PURCHASE_COST · VENDOR_ID · WARRANTY_START · WARRANTY_END · LOCATION_ID · BUILDING · FLOOR · DEPARTMENT_ID · ASSIGNED_EMPLOYEE_ID · STATUS · CONDITION · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### asset_assignments
`ID · ASSET_ID · EMPLOYEE_ID · EMPLOYEE_NAME · ASSIGNED_AT · RETURNED_AT · ASSIGNED_BY · NOTE · CREATED_AT · UPDATED_AT · DELETED_AT`

### asset_transfers
`ID · ASSET_ID · FROM_EMPLOYEE_ID · TO_EMPLOYEE_ID · TRANSFERRED_AT · REASON · BY · CREATED_AT · UPDATED_AT · DELETED_AT`

### asset_history
`ID · ASSET_ID · ACTION · ACTOR · DETAIL · CREATED_AT · UPDATED_AT · DELETED_AT`

### network_devices
`ID · NAME · DEVICE_TYPE · BRAND · MODEL · IP_ADDRESS · MAC_ADDRESS · VLAN · ISP · LOCATION_ID · ASSET_ID · STATUS · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### ip_addresses
`ID · ADDRESS · VLAN · DEVICE_ID · STATUS · DESCRIPTION · CREATED_AT · UPDATED_AT · DELETED_AT`

### servers
`ID · NAME · HOSTNAME · IP · SERVER_TYPE · VIRTUALIZATION · OS · CPU · RAM · STORAGE · LOCATION_ID · STATUS · OWNER_ID · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### backups
`ID · NAME · SERVER_ID · BACKUP_TYPE · SCHEDULE · LAST_BACKUP · STATUS · NEXT_BACKUP · STORAGE_LOCATION · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### software
`ID · NAME · VENDOR_ID · VERSION · LICENSE_TYPE · LICENSE_KEY · TOTAL_LICENSES · USED_LICENSES · PURCHASE_DATE · EXPIRY_DATE · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### software_assignments
`ID · SOFTWARE_ID · EMPLOYEE_ID · ASSIGNED_AT · CREATED_AT · UPDATED_AT · DELETED_AT`

### maintenance
`ID · ASSET_ID · MAINTENANCE_TYPE · SCHEDULED_DATE · COMPLETED_DATE · TECHNICIAN · VENDOR_ID · COST · STATUS · DESCRIPTION · FINDINGS · ACTION_TAKEN · NEXT_MAINTENANCE_DATE · CREATED_AT · UPDATED_AT · DELETED_AT`

### spare_parts
`ID · NAME · SKU · CATEGORY · UNIT · CURRENT_STOCK · MINIMUM_STOCK · UNIT_COST · LOCATION · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### spare_transactions
`ID · SPARE_PART_ID · TYPE · QUANTITY · TICKET_ID · NOTE · ACTOR · CREATED_AT · UPDATED_AT · DELETED_AT`

### vendors
`ID · NAME · CONTACT_PERSON · PHONE · EMAIL · ADDRESS · SERVICE_TYPE · CONTRACT_TYPE · CONTRACT_START · CONTRACT_END · NOTES · CREATED_AT · UPDATED_AT · DELETED_AT`

### vendor_services
`ID · VENDOR_ID · ASSET_ID · TICKET_ID · SERVICE_DATE · DESCRIPTION · COST · STATUS · CREATED_AT · UPDATED_AT · DELETED_AT`

### documents
`ID · NAME · CATEGORY · RELATED_TYPE · RELATED_ID · URL · SIZE · UPLOADED_BY · CONFIDENTIAL · CREATED_AT · UPDATED_AT · DELETED_AT`

### notifications
`ID · TITLE · DESCRIPTION · TIMESTAMP · READ · TONE · TYPE · LINK · CREATED_AT · UPDATED_AT · DELETED_AT`

### activity
`ID · ACTION · ENTITY_TYPE · ENTITY_ID · ACTOR · DETAIL · TIMESTAMP · OLD_VALUE · NEW_VALUE · CREATED_AT · UPDATED_AT · DELETED_AT`

## Enumerations

- **Ticket status:** new, assigned, in_progress, pending_user, pending_vendor, resolved, closed, reopened, cancelled
- **Priority:** low, medium, high, critical
- **Asset status:** available, assigned, in_repair, under_maintenance, lost, damaged, retired, disposed
- **Maintenance type:** preventive, corrective, repair, service
- **Backup status:** successful, failed, warning, never_run
- **Spare transaction:** in, out, adjustment
- **Roles:** super_admin, it_manager, it_officer, employee, viewer
