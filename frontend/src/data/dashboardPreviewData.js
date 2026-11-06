// Fictional dashboard records.
// Monetary amounts are integer halalas: 100 halalas = SAR 1.
export const DASHBOARD_PREVIEW_DATA = {
  companyName: 'Demo company',

  equipment: [
    {
      id: 'EQ-001',
      name: 'Toyota forklift',
      model: '8FG25',
      site: 'Riyadh warehouse',
      coverage: 'AMC',
      status: 'In service',
      lastService: '2026-10-12',
    },
    {
      id: 'EQ-002',
      name: 'Perkins generator',
      model: '1104A',
      site: 'Riyadh warehouse',
      coverage: 'AMC',
      status: 'Operational',
      lastService: '2026-10-16',
    },
    {
      id: 'EQ-003',
      name: 'Electric shutter',
      model: 'Industrial roller door',
      site: 'Jeddah facility',
      coverage: 'Non-AMC',
      status: 'Inspection scheduled',
      lastService: null,
    },
    {
      id: 'EQ-004',
      name: 'Hyster forklift',
      model: 'H3.0FT',
      site: 'Dammam depot',
      coverage: 'AMC',
      status: 'Operational',
      lastService: '2026-10-21',
    },
  ],

  activeJobs: [
    {
      id: 'JOB-1042',
      equipment: 'Toyota forklift',
      site: 'Riyadh warehouse',
      status: 'Awaiting approval',
      damage: 'Hydraulic hose leak detected during inspection.',
      work: 'Inspection completed. Replacement quotation issued.',
      updatedAt: '2026-11-04T09:00:00+03:00',
    },
    {
      id: 'JOB-1045',
      equipment: 'Electric shutter',
      site: 'Jeddah facility',
      status: 'Inspection scheduled',
      damage: 'Intermittent opening reported by the customer.',
      work: 'Controller and safety-sensor inspection scheduled.',
      updatedAt: '2026-11-03T14:30:00+03:00',
    },
  ],

  appointments: [
    {
      id: 'APT-1045',
      equipment: 'Electric shutter',
      site: 'Jeddah facility',
      startsAt: '2026-11-10T09:00:00+03:00',
      status: 'Confirmed',
      reschedulePending: false,
    },
    {
      id: 'APT-1046',
      equipment: 'Perkins generator',
      site: 'Riyadh warehouse',
      startsAt: '2026-11-16T10:00:00+03:00',
      status: 'Reschedule requested',
      reschedulePending: true,
    },
  ],

  quotations: [
    {
      id: 'QUO-1042',
      job: 'JOB-1042',
      title: 'Hydraulic hose replacement',
      equipment: 'Toyota forklift',
      totalMinor: 420000,
    },
  ],

  invoices: [
    {
      id: 'INV-2084',
      description: 'Completed forklift maintenance',
      totalMinor: 420000,
      paidMinor: 200000,
      balanceMinor: 220000,
      dueDate: '2026-11-02',
      overdue: true,
    },
    {
      id: 'INV-2079',
      description: 'Generator service',
      totalMinor: 185000,
      paidMinor: 185000,
      balanceMinor: 0,
      dueDate: '2026-11-10',
      overdue: false,
    },
    {
      id: 'INV-2072',
      description: 'Annual maintenance contract',
      totalMinor: 680000,
      paidMinor: 340000,
      balanceMinor: 340000,
      dueDate: '2026-11-15',
      overdue: false,
    },
  ],

  // Completed service counts, not revenue or estimated progress.
  serviceActivity: [
    { month: 'Jun', completed: 4 },
    { month: 'Jul', completed: 7 },
    { month: 'Aug', completed: 5 },
    { month: 'Sep', completed: 9 },
    { month: 'Oct', completed: 7 },
    { month: 'Nov', completed: 3 },
  ],

  documents: [
    {
      id: 'DOC-1042',
      title: 'Forklift inspection report',
      job: 'JOB-1042',
      type: 'Inspection report',
      issuedOn: '2026-11-04',
      url: null,
    },
    {
      id: 'DOC-1038',
      title: 'Generator completion card',
      job: 'JOB-1038',
      type: 'Job completion card',
      issuedOn: '2026-10-16',
      url: null,
    },
  ],

  notifications: [
    {
      id: 'N-1',
      title: 'Quotation awaiting approval',
      message: 'Review QUO-1042 for your Toyota forklift.',
      read: false,
      tone: 'warning',
    },
    {
      id: 'N-2',
      title: 'Invoice payment reminder',
      message: 'INV-2084 has an overdue remaining balance.',
      read: false,
      tone: 'warning',
    },
    {
      id: 'N-3',
      title: 'Generator service completed',
      message: 'Your job completion card has been issued.',
      read: true,
      tone: 'success',
    },
  ],
}
