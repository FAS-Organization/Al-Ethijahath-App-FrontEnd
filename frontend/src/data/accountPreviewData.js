// Fictional preview record for the My account page.
// Same shape the customer API will return later (see the contract at
// the top of AccountPage.jsx).
//
// Each customer account belongs to ONE region (every region has its own
// company logins). Sites are the warehouses, branches or sub-companies
// of the company inside that same region.

export const ACCOUNT_PREVIEW_DATA = {
  is_demo: true,

  account: {
    id: 1,
    customer_number: 'CUST-0042',
    status: 'active', // 'active' | 'pending_approval' | 'suspended'
    member_since: '2025-03-12',

    region: { id: 1, name: 'Riyadh', currency: 'SAR' },

    company: {
      name: 'Demo Customer Company',
      billing_address:
        'Demo billing address, Industrial Area 2, Riyadh 12345, Saudi Arabia',
      tax_number: '300000000000003',
    },

    contact: {
      full_name: 'Demo Customer',
      email: 'customer@example.com',
      phone: '+966 50 000 0000',
    },

    sites: [
      {
        id: 1,
        name: 'Main warehouse',
        kind: 'warehouse',
        address: 'Warehouse 14, Second Industrial City, Riyadh',
        contact_name: 'Khalid Al-Otaibi',
        contact_phone: '+966 50 111 0000',
        equipment_count: 3,
      },
      {
        id: 2,
        name: 'Olaya branch',
        kind: 'branch',
        address: 'King Fahd Road, Al Olaya, Riyadh',
        contact_name: '',
        contact_phone: '',
        equipment_count: 1,
      },
      {
        id: 3,
        name: 'Demo Contracting (sub-company)',
        kind: 'sub_company',
        address: 'Plot 8, Al Malaz Industrial Zone, Riyadh',
        contact_name: 'Sara Al-Qahtani',
        contact_phone: '+966 50 222 0000',
        equipment_count: 0,
      },
    ],

    summary: { equipment_count: 4, open_jobs: 3, open_invoices: 5 },

    preferences: {
      channels: { email: true, whatsapp: true, sms: false },
      topics: { quotations: true, visits: true, payments: true },
    },

    password_changed_at: null,
  },
}