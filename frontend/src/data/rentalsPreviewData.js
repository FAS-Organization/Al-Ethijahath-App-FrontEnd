function isoDay(offset) {
  const date = new Date()
  const pad = number => String(number).padStart(2, '0')

  date.setDate(date.getDate() + offset)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Icon names must match the ICONS map in ExtraServicesPage.jsx.
export const RENTAL_ITEMS = [
  { id: 'drill', name: 'Rotary hammer drill', category: 'Power tools', icon: 'hammer', available: 8, description: 'Heavy-duty drill for concrete and masonry.' },
  { id: 'grinder', name: 'Angle grinder', category: 'Power tools', icon: 'gear', available: 10, description: 'Cutting and grinding for metal and stone.' },
  { id: 'generator', name: 'Portable generator 5 kVA', category: 'Power', icon: 'lightning', available: 3, description: 'Petrol generator for sites without power.' },
  { id: 'cable', name: 'Extension cable reel 50 m', category: 'Power', icon: 'plug', available: 12, description: 'Heavy-duty outdoor cable reel.' },
  { id: 'ladder', name: 'Aluminium ladder 6 m', category: 'Access', icon: 'ladder', available: 6, description: 'Extendable ladder for high work.' },
  { id: 'light', name: 'LED flood light stand', category: 'Lighting', icon: 'light', available: 9, description: 'Bright work light with tripod stand.' },
  { id: 'fan', name: 'Industrial cooling fan', category: 'Site comfort', icon: 'fan', available: 5, description: 'High-flow fan for hot workspaces.' },
  { id: 'toolkit', name: 'Mechanic tool kit', category: 'Hand tools', icon: 'toolbox', available: 7, description: 'Complete spanner and socket set.' },
]

// status: 'processing' | 'confirmed' | 'rejected'
export const RENTAL_ORDERS_PREVIEW = [
  {
    id: 'RNT-1003',
    ordered_on: isoDay(0),
    status: 'processing',
    items: [{ id: 'generator', name: 'Portable generator 5 kVA', quantity: 1 }, { id: 'cable', name: 'Extension cable reel 50 m', quantity: 2 }],
  },
  {
    id: 'RNT-1002',
    ordered_on: isoDay(-6),
    status: 'confirmed',
    items: [{ id: 'drill', name: 'Rotary hammer drill', quantity: 2 }, { id: 'ladder', name: 'Aluminium ladder 6 m', quantity: 1 }],
  },
  {
    id: 'RNT-1001',
    ordered_on: isoDay(-20),
    status: 'rejected',
    reason: 'These items were already booked for that period.',
    items: [{ id: 'fan', name: 'Industrial cooling fan', quantity: 4 }],
  },
]