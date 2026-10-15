// Import Sheet1 device list into Factory ITSM network_devices (bulk replace).
// Usage:
//   node scripts/import-network-devices.mjs            -> preview only
//   node scripts/import-network-devices.mjs --apply    -> replace on the backend

const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Jj6qghzP7U-KXkv4l5djIi9dOX_6FLEwWS-3eLkiez8/export?format=csv&gid=0'
const API_URL =
  'https://script.google.com/macros/s/AKfycbxj2bpfMaJWJHPEvwwu7oeaHzLFIFkrVxDIllHDqOvwl6Ae9hftHKBj4bcfQOYpegvk/exec'

const APPLY = process.argv.includes('--apply')

function clean(value) {
  return String(value ?? '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\uFFFD/g, '')
    .trim()
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function isBlank(value) {
  return value === '' || value === '*'
}

// Sheet1 columns (index):
// 0 Asset Item Name, 1 Asset Description, 2 Device Type, 3 Assets Code_FC,
// 4 Assets Code_Location, 5 Marking Location, 6 IP ADDRESS, 7 MAC ADDRESS or (Old IP),
// 8 Brand, 9 MODEL, 10 Username, 11 Password (PIN), 12 Device Serial (Optional), 13 Remarks
function mapDevice(row) {
  const get = (index) => clean(row[index])
  const val = (index) => {
    const s = get(index)
    return isBlank(s) ? '' : s
  }
  const name = val(5) || val(0) || val(1) || val(2)
  return {
    name,
    deviceType: val(2),
    brand: val(8),
    model: val(9),
    serialNumber: val(12),
    ipAddress: val(6),
    macAddress: val(7),
    notes: val(13),
    status: 'online',
  }
}

async function main() {
  const resp = await fetch(SHEET_URL)
  if (!resp.ok) throw new Error('Sheet fetch failed: ' + resp.status)
  const csv = await resp.text()
  const rows = parseCsv(csv)
  const header = rows[0].map(clean)
  const devices = rows
    .slice(1)
    .map(mapDevice)
    .filter((d) => d.name || d.deviceType)

  console.log('Columns:', header.join(' | '))
  console.log('Total devices:', devices.length)

  if (!APPLY) {
    console.log('\nPreview (first 15):')
    devices.slice(0, 15).forEach((d, i) => console.log(`${i + 1}. ${JSON.stringify(d)}`))
    console.log('\nRun with --apply to import.')
    return
  }

  const payload = JSON.stringify({ action: 'replaceNetworkDevices', devices })
  const apiResp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: payload,
  })
  const text = await apiResp.text()
  console.log('API response:', text)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
