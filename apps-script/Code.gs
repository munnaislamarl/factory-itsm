/**
 * Factory ITSM — Google Apps Script backend
 * ==========================================
 * Google Sheets is the database. This script exposes a single JSON REST
 * endpoint consumed by the React frontend.
 *
 * Quick start
 * -----------
 * 1. Create a Google Spreadsheet. Extensions > Apps Script. Paste this file.
 * 2. Run `setup()` once and authorise.
 * 3. (Optional) run `seedReferenceData()` to create demo users, departments,
 *    ticket categories, sub-categories and SLA rules.
 * 4. (Recommended) edit the key in `setApiKey()` then run it.
 * 5. Deploy > New deployment > Web app. Execute as: Me. Access: Anyone.
 * 6. Copy the /exec URL into the frontend `.env.local` as VITE_API_URL.
 *
 * Every request is POST with { action, ...payload } and replies
 * { success, message, data }.
 */

var COLLECTIONS = {
  users: ['ID','NAME','EMAIL','ROLE','EMPLOYEE_ID','DEPARTMENT_ID','DEPARTMENT','ACTIVE','PASSWORD_HASH','PASSWORD_SALT','CREATED_AT','LAST_LOGIN','DELETED_AT'],
  departments: ['ID','NAME','CODE','HEAD_EMPLOYEE_ID','BUILDING_ID','DESCRIPTION','ACTIVE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  locations: ['ID','BUILDING','FLOOR','ROOM','DEPARTMENT_ID','DESCRIPTION','ACTIVE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  employees: ['ID','EMPLOYEE_ID','NAME','DEPARTMENT_ID','DESIGNATION','EMAIL','PHONE','LOCATION_ID','STATUS','JOINED_AT','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ticket_categories: ['ID','NAME','ICON','ACTIVE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ticket_subcategories: ['ID','CATEGORY_ID','NAME','ACTIVE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  tickets: ['ID','CODE','TITLE','DESCRIPTION','REQUESTER_ID','REQUESTER_NAME','EMPLOYEE_ID','DEPARTMENT_ID','LOCATION_ID','CATEGORY_ID','SUBCATEGORY_ID','PRIORITY','STATUS','ASSIGNED_TO','ASSIGNED_TO_NAME','DUE_DATE','SLA_HOURS','RESOLVED_AT','CLOSED_AT','RESOLUTION','RATING','RATING_COMMENT','FIRST_RESPONSE_AT','REOPEN_COUNT','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ticket_comments: ['ID','TICKET_ID','AUTHOR_ID','AUTHOR_NAME','BODY','INTERNAL','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ticket_worklogs: ['ID','TICKET_ID','OFFICER_ID','OFFICER_NAME','MINUTES','NOTE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ticket_attachments: ['ID','TICKET_ID','NAME','URL','SIZE','UPLOADED_BY','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ticket_history: ['ID','TICKET_ID','ACTOR','FIELD','OLD_VALUE','NEW_VALUE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  sla_rules: ['ID','PRIORITY','RESPONSE_HOURS','RESOLVE_HOURS','ACTIVE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  assets: ['ID','ASSET_TAG','QR_CODE','TYPE_ID','NAME','BRAND','MODEL','SERIAL_NUMBER','PURCHASE_DATE','PURCHASE_COST','VENDOR_ID','WARRANTY_START','WARRANTY_END','LOCATION_ID','BUILDING','FLOOR','DEPARTMENT_ID','ASSIGNED_EMPLOYEE_ID','STATUS','CONDITION','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  asset_assignments: ['ID','ASSET_ID','EMPLOYEE_ID','EMPLOYEE_NAME','ASSIGNED_AT','RETURNED_AT','ASSIGNED_BY','NOTE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  asset_transfers: ['ID','ASSET_ID','FROM_EMPLOYEE_ID','TO_EMPLOYEE_ID','TRANSFERRED_AT','REASON','BY','CREATED_AT','UPDATED_AT','DELETED_AT'],
  asset_history: ['ID','ASSET_ID','ACTION','ACTOR','DETAIL','CREATED_AT','UPDATED_AT','DELETED_AT'],
  network_devices: ['ID','NAME','DEVICE_TYPE','BRAND','MODEL','IP_ADDRESS','MAC_ADDRESS','VLAN','ISP','LOCATION_ID','ASSET_ID','STATUS','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  ip_addresses: ['ID','ADDRESS','VLAN','DEVICE_ID','STATUS','DESCRIPTION','CREATED_AT','UPDATED_AT','DELETED_AT'],
  servers: ['ID','NAME','HOSTNAME','IP','SERVER_TYPE','VIRTUALIZATION','OS','CPU','RAM','STORAGE','LOCATION_ID','STATUS','OWNER_ID','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  backups: ['ID','NAME','SERVER_ID','BACKUP_TYPE','SCHEDULE','LAST_BACKUP','STATUS','NEXT_BACKUP','STORAGE_LOCATION','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  software: ['ID','NAME','VENDOR_ID','VERSION','LICENSE_TYPE','LICENSE_KEY','TOTAL_LICENSES','USED_LICENSES','PURCHASE_DATE','EXPIRY_DATE','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  software_assignments: ['ID','SOFTWARE_ID','EMPLOYEE_ID','ASSIGNED_AT','CREATED_AT','UPDATED_AT','DELETED_AT'],
  maintenance: ['ID','ASSET_ID','MAINTENANCE_TYPE','SCHEDULED_DATE','COMPLETED_DATE','TECHNICIAN','VENDOR_ID','COST','STATUS','DESCRIPTION','FINDINGS','ACTION_TAKEN','NEXT_MAINTENANCE_DATE','CREATED_AT','UPDATED_AT','DELETED_AT'],
  spare_parts: ['ID','NAME','SKU','CATEGORY','UNIT','CURRENT_STOCK','MINIMUM_STOCK','UNIT_COST','LOCATION','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  spare_transactions: ['ID','SPARE_PART_ID','TYPE','QUANTITY','TICKET_ID','NOTE','ACTOR','CREATED_AT','UPDATED_AT','DELETED_AT'],
  vendors: ['ID','NAME','CONTACT_PERSON','PHONE','EMAIL','ADDRESS','SERVICE_TYPE','CONTRACT_TYPE','CONTRACT_START','CONTRACT_END','NOTES','CREATED_AT','UPDATED_AT','DELETED_AT'],
  vendor_services: ['ID','VENDOR_ID','ASSET_ID','TICKET_ID','SERVICE_DATE','DESCRIPTION','COST','STATUS','CREATED_AT','UPDATED_AT','DELETED_AT'],
  documents: ['ID','NAME','CATEGORY','RELATED_TYPE','RELATED_ID','URL','SIZE','UPLOADED_BY','CONFIDENTIAL','CREATED_AT','UPDATED_AT','DELETED_AT'],
  notifications: ['ID','TITLE','DESCRIPTION','TIMESTAMP','READ','TONE','TYPE','LINK','CREATED_AT','UPDATED_AT','DELETED_AT'],
  activity: ['ID','ACTION','ENTITY_TYPE','ENTITY_ID','ACTOR','DETAIL','TIMESTAMP','OLD_VALUE','NEW_VALUE','CREATED_AT','UPDATED_AT','DELETED_AT']
};

var NUMERIC_HEADERS = {
  PURCHASE_COST:1,TOTAL_LICENSES:1,USED_LICENSES:1,COST:1,CURRENT_STOCK:1,MINIMUM_STOCK:1,
  UNIT_COST:1,QUANTITY:1,SIZE:1,RATING:1,REOPEN_COUNT:1,SLA_HOURS:1,MINUTES:1,
  RESPONSE_HOURS:1,RESOLVE_HOURS:1
};
var BOOLEAN_HEADERS = { ACTIVE:1, INTERNAL:1, CONFIDENTIAL:1, READ:1 };

/* ------------------------------------------------------------------ */
/* HTTP entry points                                                   */
/* ------------------------------------------------------------------ */

function doGet() {
  return respond({ success: true, message: 'Factory ITSM API is running.', data: { status: 'ok' } });
}

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action;
    var expectedKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (expectedKey && body.apiKey !== expectedKey) {
      return respond({ success: false, message: 'Invalid API key.', error: 'UNAUTHORIZED' });
    }
    var data = route(action, body);
    return respond({ success: true, data: data });
  } catch (err) {
    return respond({ success: false, message: err && err.message ? err.message : String(err), error: 'SERVER_ERROR' });
  }
}

function route(action, body) {
  switch (action) {
    case 'health': return { status: 'ok' };
    case 'list': return listCollection(body.collection, body.options || {});
    case 'get': return getRecord(body.collection, body.id);
    case 'create': return createRecord(body.collection, body.data, body.actor);
    case 'update': return updateRecord(body.collection, body.id, body.patch, body.actor);
    case 'delete': return deleteRecord(body.collection, body.id, body.actor);
    case 'ticketAction': return ticketAction(body.transition, body.payload, body.actor);
    case 'rateTicket': return rateTicket(body.ticketId, body.rating, body.comment, body.actor);
    case 'assetAction': return assetAction(body.op, body.payload, body.actor);
    case 'spareAction': return spareAction(body.payload, body.actor);
    case 'authenticate': return authenticate(body.identifier, body.password);
    case 'listActivity': return readObjects('activity').slice(0, 60);
    case 'getDashboard': return getDashboard(body.scope || {});
    case 'getReport': return getReport(body.report, body.filter || {});
    default: throw new Error('Unknown action: ' + action);
  }
}

function respond(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheetFor(collection) {
  if (!COLLECTIONS[collection]) throw new Error('Unknown collection: ' + collection);
  var sheet = ss().getSheetByName(collection);
  if (!sheet) {
    sheet = ss().insertSheet(collection);
    sheet.appendRow(COLLECTIONS[collection]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function toCamel(header) {
  return String(header).toLowerCase().replace(/_([a-z0-9])/g, function (m, c) { return c.toUpperCase(); });
}

function toSnake(key) {
  return String(key).replace(/([A-Z])/g, function (m) { return '_' + m; }).toUpperCase();
}

function cast(header, value) {
  if (value === '' || value === null || value === undefined) return '';
  if (BOOLEAN_HEADERS[header]) return value === true || value === 'true' || value === 'TRUE';
  if (NUMERIC_HEADERS[header]) {
    var n = Number(value);
    return isNaN(n) ? value : n;
  }
  return value;
}

function readObjects(collection) {
  var sheet = sheetFor(collection);
  var headers = COLLECTIONS[collection];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var obj = {};
    var empty = true;
    for (var j = 0; j < headers.length; j++) {
      var camel = toCamel(headers[j]);
      var val = cast(headers[j], values[i][j]);
      obj[camel] = val;
      if (val !== '' && val !== null) empty = false;
    }
    if (!empty) {
      obj.__row = i + 2;
      out.push(obj);
    }
  }
  return out;
}

function stripMeta(obj) {
  var clean = {};
  for (var key in obj) { if (key !== '__row') clean[key] = obj[key]; }
  return clean;
}

function activeObjects(collection) {
  return readObjects(collection).filter(function (o) { return !o.deletedAt; });
}

function rowForObject(collection, obj) {
  var headers = COLLECTIONS[collection];
  return headers.map(function (header) {
    var key = toCamel(header);
    var value = obj[key];
    if (value === undefined || value === null) return '';
    return value;
  });
}

function appendObject(collection, obj) {
  var sheet = sheetFor(collection);
  sheet.appendRow(rowForObject(collection, obj));
  return obj;
}

function findRow(collection, id) {
  var rows = readObjects(collection);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === String(id)) return rows[i];
  }
  return null;
}

function writeObject(collection, rowIndex, obj) {
  var sheet = sheetFor(collection);
  sheet.getRange(rowIndex, 1, 1, COLLECTIONS[collection].length).setValues([rowForObject(collection, obj)]);
  return obj;
}

function now() { return new Date().toISOString(); }

function makeId(prefix) {
  return prefix + '_' + new Date().getTime().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ------------------------------------------------------------------ */
/* Generic CRUD                                                        */
/* ------------------------------------------------------------------ */

function listCollection(collection, options) {
  var rows = activeObjects(collection);
  if (options.filters) {
    rows = rows.filter(function (row) {
      return Object.keys(options.filters).every(function (key) {
        var value = options.filters[key];
        if (value === undefined || value === null || value === '' || value === 'all') return true;
        return String(row[key] === undefined ? '' : row[key]) === String(value);
      });
    });
  }
  if (options.search) {
    var term = String(options.search).toLowerCase();
    rows = rows.filter(function (row) {
      return Object.keys(row).some(function (key) {
        return String(row[key]).toLowerCase().indexOf(term) !== -1;
      });
    });
  }
  if (options.sortBy) {
    var dir = options.sortDir === 'asc' ? 1 : -1;
    rows.sort(function (a, b) {
      var av = a[options.sortBy], bv = b[options.sortBy];
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }
  if (options.page && options.pageSize) {
    var start = (options.page - 1) * options.pageSize;
    rows = rows.slice(start, start + options.pageSize);
  }
  return rows.map(stripMeta);
}

function getRecord(collection, id) {
  var row = activeObjects(collection).filter(function (o) { return String(o.id) === String(id); })[0];
  if (!row) throw new Error(collection + ' record not found');
  return stripMeta(row);
}

function createRecord(collection, data, actor) {
  var record = data || {};
  if (!record.id) record.id = makeId(collection.slice(0, 3));
  record.createdAt = now();
  record.updatedAt = now();
  appendObject(collection, record);
  logActivity(collection + '.created', collection, record.id, actor, 'Created ' + collection + ' record');
  return record;
}

function updateRecord(collection, id, patch, actor) {
  var row = findRow(collection, id);
  if (!row) throw new Error(collection + ' record not found');
  var updated = stripMeta(row);
  for (var key in patch) { updated[key] = patch[key]; }
  updated.updatedAt = now();
  writeObject(collection, row.__row, updated);
  logActivity(collection + '.updated', collection, id, actor, 'Updated ' + collection + ' record');
  return updated;
}

function deleteRecord(collection, id, actor) {
  var row = findRow(collection, id);
  if (!row) throw new Error(collection + ' record not found');
  var updated = stripMeta(row);
  updated.deletedAt = now();
  updated.updatedAt = now();
  writeObject(collection, row.__row, updated);
  logActivity(collection + '.deleted', collection, id, actor, 'Deleted ' + collection + ' record');
  return { id: id };
}

function logActivity(action, entityType, entityId, actor, detail, oldValue, newValue) {
  appendObject('activity', {
    id: makeId('act'),
    action: action,
    entityType: entityType,
    entityId: entityId || '',
    actor: actor || 'system',
    detail: detail || '',
    timestamp: now(),
    oldValue: oldValue || '',
    newValue: newValue || '',
    createdAt: now(),
    updatedAt: now()
  });
}

function addTicketHistory(ticketId, actor, field, oldValue, newValue) {
  appendObject('ticket_history', {
    id: makeId('th'), ticketId: ticketId, actor: actor || 'system', field: field,
    oldValue: oldValue || '', newValue: newValue || '', createdAt: now(), updatedAt: now()
  });
}

/* ------------------------------------------------------------------ */
/* Authentication                                                      */
/* ------------------------------------------------------------------ */

function hashPassword(password, salt) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password, Utilities.Charset.UTF_8);
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function authenticate(identifier, password) {
  var key = String(identifier || '').trim().toLowerCase();
  var users = activeObjects('users');
  var user = users.filter(function (u) {
    return String(u.email).toLowerCase() === key || String(u.employeeId || '').toLowerCase() === key;
  })[0];
  if (!user) throw new Error('No account found for that email or employee ID.');
  var expected = hashPassword(password, user.passwordSalt || '');
  if (expected !== user.passwordHash) throw new Error('Incorrect password. Please try again.');
  var row = findRow('users', user.id);
  if (row) {
    var rec = stripMeta(row); rec.lastLogin = now();
    writeObject('users', row.__row, rec);
  }
  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    employeeId: user.employeeId, departmentId: user.departmentId, department: user.department
  };
}

function createUser(name, email, role, password, employeeId, department) {
  var salt = Utilities.getUuid();
  return createRecord('users', {
    id: makeId('usr'), name: name, email: email, role: role, employeeId: employeeId || '',
    department: department || '', departmentId: '', active: true,
    passwordSalt: salt, passwordHash: hashPassword(password, salt)
  }, 'system');
}

/* ------------------------------------------------------------------ */
/* Ticket workflow                                                     */
/* ------------------------------------------------------------------ */

function ticketAction(transition, payload, actor) {
  var row = findRow('tickets', payload.ticketId);
  if (!row) throw new Error('Ticket not found');
  var ticket = stripMeta(row);
  var before = String(ticket.status);

  function setStatus(status) {
    ticket.status = status;
    addTicketHistory(payload.ticketId, actor, 'status', before, status);
  }

  if (transition === 'assign') {
    ticket.assignedTo = payload.assignedTo || ticket.assignedTo;
    ticket.assignedToName = payload.assignedToName || ticket.assignedToName;
    ticket.firstResponseAt = ticket.firstResponseAt || now();
    setStatus('assigned');
  } else if (transition === 'start') {
    setStatus('in_progress');
  } else if (transition === 'pending_user') {
    setStatus('pending_user');
  } else if (transition === 'pending_vendor') {
    setStatus('pending_vendor');
  } else if (transition === 'resolve') {
    ticket.resolution = payload.resolution || ticket.resolution;
    ticket.resolvedAt = now();
    setStatus('resolved');
    if (payload.spareUsages) {
      for (var i = 0; i < payload.spareUsages.length; i++) {
        spareAction({
          sparePartId: payload.spareUsages[i].sparePartId, type: 'out',
          quantity: payload.spareUsages[i].quantity, ticketId: payload.ticketId,
          note: 'Consumed for ' + ticket.code
        }, actor);
      }
    }
  } else if (transition === 'close') {
    ticket.closedAt = now();
    setStatus('closed');
  } else if (transition === 'reopen') {
    ticket.reopenCount = Number(ticket.reopenCount || 0) + 1;
    ticket.resolvedAt = '';
    ticket.closedAt = '';
    setStatus('reopened');
  } else if (transition === 'cancel') {
    setStatus('cancelled');
  }

  if (payload.note) {
    appendObject('ticket_comments', {
      id: makeId('tc'), ticketId: payload.ticketId, authorId: actor, authorName: actor,
      body: payload.note, internal: false, createdAt: now(), updatedAt: now()
    });
  }
  if (payload.minutes) {
    appendObject('ticket_worklogs', {
      id: makeId('tw'), ticketId: payload.ticketId, officerId: actor, officerName: actor,
      minutes: Number(payload.minutes), note: payload.note || 'Work logged', createdAt: now(), updatedAt: now()
    });
  }

  ticket.updatedAt = now();
  writeObject('tickets', row.__row, ticket);
  logActivity('ticket.' + transition, 'tickets', payload.ticketId, actor, 'Ticket ' + ticket.code + ' -> ' + ticket.status);
  return ticket;
}

function rateTicket(ticketId, rating, comment, actor) {
  var row = findRow('tickets', ticketId);
  if (!row) throw new Error('Ticket not found');
  var ticket = stripMeta(row);
  ticket.rating = Number(rating);
  ticket.ratingComment = comment || '';
  ticket.status = 'closed';
  ticket.closedAt = now();
  ticket.updatedAt = now();
  writeObject('tickets', row.__row, ticket);
  logActivity('ticket.rated', 'tickets', ticketId, actor, 'Rated ' + rating + '/5');
  return ticket;
}

/* ------------------------------------------------------------------ */
/* Asset workflow                                                      */
/* ------------------------------------------------------------------ */

function assetAction(op, payload, actor) {
  var row = findRow('assets', payload.assetId);
  if (!row) throw new Error('Asset not found');
  var asset = stripMeta(row);

  function history(action, detail) {
    appendObject('asset_history', {
      id: makeId('ah'), assetId: payload.assetId, action: action, actor: actor,
      detail: detail, createdAt: now(), updatedAt: now()
    });
  }

  if (op === 'assign') {
    if (payload.employeeId && asset.assignedEmployeeId && asset.assignedEmployeeId !== payload.employeeId) {
      closeActiveAssignment(payload.assetId);
    }
    asset.assignedEmployeeId = payload.employeeId || '';
    asset.status = 'assigned';
    appendObject('asset_assignments', {
      id: makeId('asg'), assetId: payload.assetId, employeeId: payload.employeeId,
      employeeName: payload.employeeName || '', assignedAt: now(), returnedAt: '',
      assignedBy: actor, note: payload.note || '', createdAt: now(), updatedAt: now()
    });
    history('Assigned', 'Assigned to ' + (payload.employeeName || payload.employeeId));
  } else if (op === 'transfer') {
    appendObject('asset_transfers', {
      id: makeId('atf'), assetId: payload.assetId, fromEmployeeId: asset.assignedEmployeeId || '',
      toEmployeeId: payload.toEmployeeId, transferredAt: now(), reason: payload.reason || '',
      by: actor, createdAt: now(), updatedAt: now()
    });
    closeActiveAssignment(payload.assetId);
    asset.assignedEmployeeId = payload.toEmployeeId;
    asset.status = 'assigned';
    history('Transferred', 'Transferred to ' + payload.toEmployeeId);
  } else if (op === 'return') {
    closeActiveAssignment(payload.assetId);
    asset.assignedEmployeeId = '';
    asset.status = 'available';
    history('Returned', 'Asset returned to IT store');
  } else if (op === 'send_repair') {
    asset.status = 'in_repair';
    history('Repair', payload.note || 'Sent for repair');
  } else if (op === 'repair_done') {
    asset.status = asset.assignedEmployeeId ? 'assigned' : 'available';
    history('Repair Completed', payload.note || 'Repair completed');
  } else if (op === 'retire') {
    asset.status = 'retired'; asset.assignedEmployeeId = '';
    history('Retired', payload.note || 'Asset retired');
  } else if (op === 'dispose') {
    asset.status = 'disposed'; asset.assignedEmployeeId = '';
    history('Disposed', payload.note || 'Asset disposed');
  }

  asset.updatedAt = now();
  writeObject('assets', row.__row, asset);
  logActivity('asset.' + op, 'assets', payload.assetId, actor, 'Asset ' + asset.assetTag + ' ' + op);
  return asset;
}

function closeActiveAssignment(assetId) {
  var rows = readObjects('asset_assignments');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].assetId) === String(assetId) && !rows[i].returnedAt && !rows[i].deletedAt) {
      var rec = stripMeta(rows[i]);
      rec.returnedAt = now();
      rec.updatedAt = now();
      writeObject('asset_assignments', rows[i].__row, rec);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Spare parts                                                         */
/* ------------------------------------------------------------------ */

function spareAction(payload, actor) {
  var row = findRow('spare_parts', payload.sparePartId);
  if (!row) throw new Error('Spare part not found');
  var part = stripMeta(row);
  var current = Number(part.currentStock || 0);
  var qty = Number(payload.quantity);
  var next = current;
  if (payload.type === 'in') next = current + qty;
  else if (payload.type === 'out') next = current - qty;
  else next = current + qty;
  if (next < 0) throw new Error('Spare stock cannot go below zero');

  part.currentStock = next;
  part.updatedAt = now();
  writeObject('spare_parts', row.__row, part);

  var transaction = {
    id: makeId('spt'), sparePartId: payload.sparePartId, type: payload.type,
    quantity: payload.type === 'adjustment' ? qty : Math.abs(qty),
    ticketId: payload.ticketId || '', note: payload.note || '', actor: actor,
    createdAt: now(), updatedAt: now()
  };
  appendObject('spare_transactions', transaction);
  logActivity('spare.' + payload.type, 'spare_parts', payload.sparePartId, actor,
    (payload.type === 'in' ? 'Received ' : payload.type === 'out' ? 'Issued ' : 'Adjusted ') + Math.abs(qty) + ' ' + part.unit);
  return { part: part, transaction: transaction };
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function getDashboard(scope) {
  var tickets = activeObjects('tickets');
  if (!scope.canViewAll) {
    tickets = tickets.filter(function (t) {
      return t.requesterId === scope.userId || t.assignedTo === scope.userId;
    });
  }
  var assets = activeObjects('assets');
  var spares = activeObjects('spare_parts');
  var software = activeObjects('software');
  var maintenance = activeObjects('maintenance');
  var backups = activeObjects('backups');
  var openStatuses = ['new', 'assigned', 'in_progress', 'pending_user', 'pending_vendor', 'reopened'];

  var today = new Date().toDateString();
  var in30 = new Date().getTime() + 30 * 86400000;
  var in7 = new Date().getTime() + 7 * 86400000;

  function isOpen(t) { return openStatuses.indexOf(t.status) !== -1; }
  function dueToday(t) { return t.dueDate && new Date(t.dueDate).toDateString() === today; }
  function breached(t) { return t.dueDate && isOpen(t) && new Date(t.dueDate).getTime() < new Date().getTime(); }

  var stats = {
    openTickets: tickets.filter(isOpen).length,
    pendingTickets: tickets.filter(function (t) { return t.status === 'pending_user' || t.status === 'pending_vendor'; }).length,
    criticalTickets: tickets.filter(function (t) { return t.priority === 'critical' && isOpen(t); }).length,
    ticketsDueToday: tickets.filter(dueToday).length,
    slaBreaching: tickets.filter(breached).length,
    totalAssets: assets.length,
    activeAssets: assets.filter(function (a) { return ['retired', 'disposed', 'lost'].indexOf(a.status) === -1; }).length,
    assetsUnderRepair: assets.filter(function (a) { return a.status === 'in_repair' || a.status === 'under_maintenance'; }).length,
    warrantyExpiringSoon: assets.filter(function (a) { return a.warrantyEnd && new Date(a.warrantyEnd).getTime() < in30 && new Date(a.warrantyEnd).getTime() > new Date().getTime(); }).length,
    licensesExpiringSoon: software.filter(function (s) { return s.expiryDate && new Date(s.expiryDate).getTime() < in30 && new Date(s.expiryDate).getTime() > new Date().getTime(); }).length,
    maintenanceDue: maintenance.filter(function (m) { return m.scheduledDate && new Date(m.scheduledDate).getTime() < in7 && m.status === 'scheduled'; }).length,
    lowSpareStock: spares.filter(function (s) { return Number(s.currentStock || 0) <= Number(s.minimumStock || 0); }).length,
    backupFailures: backups.filter(function (b) { return b.status === 'failed'; }).length
  };

  var statusOptions = {
    new: 'New', assigned: 'Assigned', in_progress: 'In Progress', pending_user: 'Pending User',
    pending_vendor: 'Pending Vendor', resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened', cancelled: 'Cancelled'
  };
  var priorityOptions = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  var categoryMap = mapById(activeObjects('ticket_categories'));
  var departmentMap = mapById(activeObjects('departments'));

  function countBy(list, keyFn, labelFn) {
    var counts = {};
    list.forEach(function (item) {
      var key = keyFn(item);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).map(function (key) { return { name: labelFn ? labelFn(key) : key, value: counts[key] }; });
  }

  var monthly = [];
  for (var m = 5; m >= 0; m--) {
    var d = new Date(); d.setMonth(d.getMonth() - m);
    var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    monthly.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      opened: tickets.filter(function (t) { return String(t.createdAt).slice(0, 7) === key; }).length,
      closed: tickets.filter(function (t) { return String(t.resolvedAt || t.closedAt).slice(0, 7) === key; }).length
    });
  }

  var recentTickets = tickets.slice().sort(function (a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  }).slice(0, 6);

  return {
    stats: stats,
    ticketsByStatus: countBy(tickets, function (t) { return t.status; }, function (k) { return statusOptions[k] || k; }),
    ticketsByCategory: countBy(tickets, function (t) { return t.categoryId; }, function (k) { return categoryMap[k] || 'Other'; }),
    ticketsByDepartment: countBy(tickets, function (t) { return t.departmentId; }, function (k) { return departmentMap[k] || 'Unknown'; }),
    ticketsByPriority: countBy(tickets, function (t) { return t.priority; }, function (k) { return priorityOptions[k] || k; }),
    monthlyTrend: monthly,
    assetDistribution: countBy(assets, function (a) { return a.typeId; }),
    recentActivity: readObjects('activity').sort(function (a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); }).slice(0, 10).map(stripMeta),
    recentTickets: recentTickets.map(stripMeta)
  };
}

function mapById(list) {
  var map = {};
  list.forEach(function (item) { map[item.id] = item.name; });
  return map;
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

function getReport(report, filter) {
  var tickets = activeObjects('tickets');
  var assets = activeObjects('assets');
  var categoryMap = mapById(activeObjects('ticket_categories'));
  var departmentMap = mapById(activeObjects('departments'));
  var serverMap = mapById(activeObjects('servers'));

  function within(value) {
    if (!value) return true;
    var t = new Date(value).getTime();
    if (filter.from && t < new Date(filter.from).getTime()) return false;
    if (filter.to && t > new Date(filter.to).getTime() + 86400000) return false;
    return true;
  }

  if (report === 'open_tickets') {
    var open = ['new', 'assigned', 'in_progress', 'pending_user', 'pending_vendor', 'reopened'];
    return { title: 'Open Tickets Report', columns: [
      { key: 'code', header: 'Ticket' }, { key: 'title', header: 'Title' }, { key: 'priority', header: 'Priority' },
      { key: 'status', header: 'Status' }, { key: 'category', header: 'Category' }, { key: 'department', header: 'Department' },
      { key: 'assignee', header: 'Assigned To' }, { key: 'due', header: 'Due Date' }
    ], rows: tickets.filter(function (t) { return open.indexOf(t.status) !== -1 && within(t.createdAt); }).map(function (t) {
      return { code: t.code, title: t.title, priority: t.priority, status: t.status,
        category: categoryMap[t.categoryId] || '', department: departmentMap[t.departmentId] || '',
        assignee: t.assignedToName || 'Unassigned', due: t.dueDate || '' };
    }) };
  }

  if (report === 'licenses') {
    return { title: 'Software License Report', columns: [
      { key: 'name', header: 'Software' }, { key: 'version', header: 'Version' }, { key: 'type', header: 'License Type' },
      { key: 'total', header: 'Total' }, { key: 'used', header: 'Used' }, { key: 'available', header: 'Available' }, { key: 'expiry', header: 'Expiry' }
    ], rows: activeObjects('software').map(function (s) {
      return { name: s.name, version: s.version, type: s.licenseType, total: Number(s.totalLicenses || 0),
        used: Number(s.usedLicenses || 0), available: Number(s.totalLicenses || 0) - Number(s.usedLicenses || 0), expiry: s.expiryDate || '—' };
    }) };
  }

  if (report === 'spares') {
    return { title: 'Spare Stock Report', columns: [
      { key: 'name', header: 'Spare Part' }, { key: 'sku', header: 'SKU' }, { key: 'category', header: 'Category' },
      { key: 'stock', header: 'Stock' }, { key: 'minimum', header: 'Minimum' }, { key: 'status', header: 'Status' }, { key: 'value', header: 'Stock Value' }
    ], rows: activeObjects('spare_parts').map(function (s) {
      return { name: s.name, sku: s.sku, category: s.category, stock: Number(s.currentStock || 0),
        minimum: Number(s.minimumStock || 0), status: Number(s.currentStock || 0) <= Number(s.minimumStock || 0) ? 'Low' : 'OK',
        value: Number(s.currentStock || 0) * Number(s.unitCost || 0) };
    }) };
  }

  if (report === 'backups') {
    return { title: 'Server Backup Report', columns: [
      { key: 'name', header: 'Backup' }, { key: 'server', header: 'Server' }, { key: 'type', header: 'Type' },
      { key: 'schedule', header: 'Schedule' }, { key: 'last', header: 'Last Backup' }, { key: 'status', header: 'Status' }, { key: 'next', header: 'Next Backup' }
    ], rows: activeObjects('backups').map(function (b) {
      return { name: b.name, server: serverMap[b.serverId] || '', type: b.backupType, schedule: b.schedule,
        last: b.lastBackup || '—', status: b.status, next: b.nextBackup || '—' };
    }) };
  }

  if (report === 'assets' || report === 'warranty') {
    var list = assets.filter(function (a) { return report === 'warranty' ? (a.warrantyEnd && new Date(a.warrantyEnd).getTime() < new Date().getTime() + 60 * 86400000) : true; });
    return { title: report === 'warranty' ? 'Asset Warranty Report' : 'Asset Report', columns: [
      { key: 'tag', header: 'Asset Tag' }, { key: 'name', header: 'Asset' }, { key: 'type', header: 'Type' },
      { key: 'brand', header: 'Brand' }, { key: 'status', header: 'Status' }, { key: 'department', header: 'Department' },
      { key: 'assignee', header: 'Assigned To' }, { key: 'warrantyEnd', header: 'Warranty End' }
    ], rows: list.map(function (a) {
      return { tag: a.assetTag, name: a.name, type: a.typeId, brand: a.brand, status: a.status,
        department: departmentMap[a.departmentId] || '', assignee: a.assignedEmployeeId || '—', warrantyEnd: a.warrantyEnd || '—' };
    }) };
  }

  return { title: 'Ticket Report', columns: [
    { key: 'code', header: 'Ticket' }, { key: 'title', header: 'Title' }, { key: 'requester', header: 'Requester' },
    { key: 'department', header: 'Department' }, { key: 'category', header: 'Category' }, { key: 'priority', header: 'Priority' },
    { key: 'status', header: 'Status' }, { key: 'assignee', header: 'Assigned To' }, { key: 'created', header: 'Created' }
  ], rows: tickets.filter(function (t) { return within(t.createdAt); }).map(function (t) {
    return { code: t.code, title: t.title, requester: t.requesterName, department: departmentMap[t.departmentId] || '',
      category: categoryMap[t.categoryId] || '', priority: t.priority, status: t.status,
      assignee: t.assignedToName || 'Unassigned', created: t.createdAt };
  }) };
}

/* ------------------------------------------------------------------ */
/* Setup & seed                                                        */
/* ------------------------------------------------------------------ */

function setup() {
  Object.keys(COLLECTIONS).forEach(function (name) {
    var sheet = ss().getSheetByName(name);
    if (!sheet) {
      sheet = ss().insertSheet(name);
      sheet.appendRow(COLLECTIONS[name]);
      sheet.setFrozenRows(1);
    } else {
      sheet.getRange(1, 1, 1, COLLECTIONS[name].length).setValues([COLLECTIONS[name]]);
    }
  });
  if (activeObjects('users').length === 0) {
    createUser('System Administrator', 'admin@factory.com', 'super_admin', 'Admin@123');
  }
  SpreadsheetApp.getActive().toast('Factory ITSM setup complete.');
}

function setApiKey() {
  PropertiesService.getScriptProperties().setProperty('API_KEY', 'CHANGE-ME-TO-A-LONG-RANDOM-STRING');
}

function seedReferenceData() {
  var departments = [
    ['Information Technology', 'IT'], ['Production', 'PROD'], ['HR & Admin', 'HR'],
    ['Accounts & Finance', 'ACC'], ['Quality Assurance', 'QA'], ['Procurement & Store', 'PRC']
  ];
  if (activeObjects('departments').length === 0) {
    departments.forEach(function (d) {
      createRecord('departments', { id: makeId('dep'), name: d[0], code: d[1], active: true }, 'setup');
    });
  }

  if (activeObjects('ticket_categories').length === 0) {
    var categories = {
      Hardware: ['Desktop', 'Laptop', 'Monitor', 'Printer', 'Scanner', 'UPS', 'Keyboard/Mouse', 'Other'],
      Software: ['Windows', 'Microsoft Office', 'Antivirus', 'Application', 'Installation', 'Update', 'Error'],
      Network: ['Internet', 'LAN', 'Wi-Fi', 'Router', 'Switch', 'Firewall', 'VPN', 'IP Issue'],
      Email: ['New Account', 'Password Reset', 'Outlook', 'Email Delivery', 'Email Access'],
      'User Account': ['New User', 'Password Reset', 'Permission', 'Account Lock', 'Account Disable'],
      Server: ['Server Down', 'Storage', 'Performance', 'Backup', 'Access'],
      Printer: ['Printing Problem', 'Toner', 'Paper Jam', 'Network Printer', 'Hardware Problem'],
      CCTV: ['Camera Offline', 'NVR', 'Recording', 'Display', 'Storage'],
      'Biometric / Access Control': ['Device Offline', 'Fingerprint', 'Attendance Sync', 'Access Issue'],
      'ERP / Application': ['Login', 'Error', 'Performance', 'Access', 'Integration'],
      Other: ['General']
    };
    Object.keys(categories).forEach(function (name) {
      var cat = createRecord('ticket_categories', { id: makeId('cat'), name: name, icon: 'CircleHelp', active: true }, 'setup');
      categories[name].forEach(function (sub) {
        createRecord('ticket_subcategories', { id: makeId('sub'), categoryId: cat.id, name: sub, active: true }, 'setup');
      });
    });
  }

  if (activeObjects('sla_rules').length === 0) {
    [['critical', 1, 4], ['high', 2, 8], ['medium', 4, 24], ['low', 8, 72]].forEach(function (rule) {
      createRecord('sla_rules', { id: makeId('sla'), priority: rule[0], responseHours: rule[1], resolveHours: rule[2], active: true }, 'setup');
    });
  }

  var demoUsers = [
    ['IT Manager', 'manager@factory.com', 'it_manager', 'Manager@123'],
    ['IT Officer', 'officer@factory.com', 'it_officer', 'Officer@123'],
    ['Employee User', 'employee@factory.com', 'employee', 'Employee@123'],
    ['Management Viewer', 'viewer@factory.com', 'viewer', 'Viewer@123']
  ];
  demoUsers.forEach(function (u) {
    var exists = activeObjects('users').filter(function (x) { return String(x.email).toLowerCase() === u[1]; }).length > 0;
    if (!exists) createUser(u[0], u[1], u[2], u[3]);
  });

  SpreadsheetApp.getActive().toast('Reference data seeded.');
}
