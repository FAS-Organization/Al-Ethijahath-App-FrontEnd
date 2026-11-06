// Shared locations for this fictional customer account.
// One account region, with multiple sites inside that region.

export const PREVIEW_REGION = {
  id: 1,
  name: 'Riyadh',
}

export const PREVIEW_SITES = {
  main: {
    id: 1,
    name: 'Riyadh main warehouse',
    address: 'Demo main warehouse address, Riyadh',
    region: PREVIEW_REGION,
  },

  north: {
    id: 2,
    name: 'Riyadh north warehouse',
    address: 'Demo north warehouse address, Riyadh',
    region: PREVIEW_REGION,
  },

  depot: {
    id: 3,
    name: 'Riyadh depot',
    address: 'Demo depot address, Riyadh',
    region: PREVIEW_REGION,
  },
}