import { PREVIEW_SITES as SITES } from './customerPreviewData'



export const SERVICES_PREVIEW_DATA = {
  is_demo: true,
  company_name: 'Demo Customer Company',

  // Options for the "Request a service" form: sites and current equipment.
  request_options: {
    sites: [SITES.main, SITES.north, SITES.depot],
    equipment: [
      { id: 1, site_id: 1, label: 'Toyota Forklift 8FG25', asset: 'EQ-001' },
      { id: 2, site_id: 1, label: 'Perkins Generator 1104A', asset: 'EQ-002' },
      { id: 3, site_id: 2, label: 'Electric shutter, industrial roller door', asset: 'EQ-003' },
      { id: 4, site_id: 3, label: 'Hyster Forklift H3.0FT', asset: 'EQ-004' },
    ],
  },

  jobs: [
    {
      id: 1042,
      job_type: 'service',
      status: 'in_progress',
      description:
        'Hydraulic oil leaking near the lifting assembly on the Toyota forklift. Mast also drifts down under load.',
      requested_date: '2026-11-02',
      site: SITES.main,
      site_address_snapshot: SITES.main.address,
      machines: [
        {
          id: 201,
          suffix: 'A',
          reference: '1042A',
          status: 'quotation',
          reported_issue: 'Hydraulic oil leaking near the lifting assembly.',
          planned_work:
            'Replace the damaged lift-cylinder hose and seal kit, then pressure-test the system.',
          started_at: '2026-11-03T08:00:00+03:00',
          completed_at: null,
          estimated_completion: '2026-11-12T17:00:00+03:00',
          technician_name: 'Faisal Al-Harbi',
          equipment: {
            id: 1,
            equipment_type: 'Forklift',
            brand: 'Toyota',
            model_name: '8FG25',
            serial_number: 'DEMO-TYT-001',
            customer_asset_number: 'EQ-001',
          },
          next_appointment: null,
          pending_actions: [
            {
              id: 'q-9001',
              type: 'quotation',
              label: 'Quotation ready for your approval',
              detail:
                'Replacement hose and seal kit. Work starts after you approve.',
            },
          ],
          documents: [
            {
              id: 'd-5001',
              document_type: 'inspection',
              document_number: 'INS-1042A',
              status: 'ready',
            },
          ],
          updates: [
            {
              id: 3,
              status: 'quotation',
              message:
                'Quotation prepared and sent to you for approval. Parts will be ordered as soon as you approve.',
              event_at: '2026-11-04T14:20:00+03:00',
            },
            {
              id: 2,
              status: 'inspection',
              message:
                'Inspection complete. Leak traced to a worn lift-cylinder hose. Mast drift is caused by the same seal.',
              event_at: '2026-11-03T11:40:00+03:00',
            },
            {
              id: 1,
              status: 'not_started',
              message: 'Service request received and assigned to a technician.',
              event_at: '2026-11-02T09:05:00+03:00',
            },
          ],
        },
        {
          id: 202,
          suffix: 'B',
          reference: '1042B',
          status: 'scheduled',
          reported_issue: 'Routine brake check requested together with job A.',
          planned_work: 'Inspect brake pads, brake fluid and parking brake.',
          started_at: null,
          completed_at: null,
          estimated_completion: '2026-11-08T17:00:00+03:00',
          technician_name: 'Faisal Al-Harbi',
          equipment: {
            id: 4,
            equipment_type: 'Forklift',
            brand: 'Hyster',
            model_name: 'H3.0FT',
            serial_number: 'DEMO-HYS-004',
            customer_asset_number: 'EQ-004',
          },
          next_appointment: {
            id: 301,
            purpose: 'maintenance',
            status: 'confirmed',
            scheduled_start: '2026-11-08T09:00:00+03:00',
            scheduled_end: '2026-11-08T12:00:00+03:00',
            can_reschedule: true,
            reschedule: null,
          },
          pending_actions: [],
          documents: [],
          updates: [
            {
              id: 5,
              status: 'scheduled',
              message: 'Visit confirmed for 8 November, 9:00 to 12:00.',
              event_at: '2026-11-04T10:15:00+03:00',
            },
          ],
        },
      ],
    },

    {
      id: 1045,
      job_type: 'service',
      status: 'open',
      description:
        'Electric roller shutter occasionally stops while opening. Safety sensor suspected.',
      requested_date: '2026-10-30',
      site: SITES.north,
      site_address_snapshot: SITES.north.address,
      machines: [
        {
          id: 203,
          suffix: 'A',
          reference: '1045A',
          status: 'scheduled',
          reported_issue: 'Shutter occasionally stops while opening.',
          planned_work:
            'Inspect the controller, motor and safety sensors. Replace the sensor if faulty.',
          started_at: null,
          completed_at: null,
          estimated_completion: null,
          technician_name: 'Omar Bakr',
          equipment: {
            id: 3,
            equipment_type: 'Electric shutter',
            brand: '',
            model_name: 'Industrial roller door',
            serial_number: '',
            customer_asset_number: 'EQ-003',
          },
          next_appointment: {
            id: 302,
            purpose: 'inspection',
            status: 'planned',
            scheduled_start: '2026-11-09T10:00:00+03:00',
            scheduled_end: '2026-11-09T12:00:00+03:00',
            can_reschedule: false,
            reschedule: {
              status: 'pending',
              proposed_date: '2026-11-11',
              alternative_date: null,
            },
          },
          pending_actions: [],
          documents: [],
          updates: [
            {
              id: 8,
              status: 'scheduled',
              message:
                'Inspection visit planned. Your reschedule request is with our team.',
              event_at: '2026-11-03T16:30:00+03:00',
            },
            {
              id: 7,
              status: 'not_started',
              message: 'Service request received.',
              event_at: '2026-10-30T13:00:00+03:00',
            },
          ],
        },
      ],
    },

    {
      id: 1038,
      job_type: 'service',
      status: 'in_progress',
      description: 'Generator fails to start after a long idle period.',
      requested_date: '2026-10-24',
      site: SITES.depot,
      site_address_snapshot: SITES.depot.address,
      machines: [
        {
          id: 204,
          suffix: 'A',
          reference: '1038A',
          status: 'awaiting_parts',
          reported_issue: 'Generator does not start.',
          planned_work: 'Replace the starter motor and fuel solenoid.',
          started_at: '2026-10-27T09:00:00+03:00',
          completed_at: null,
          estimated_completion: '2026-11-10T17:00:00+03:00',
          technician_name: 'Yousef Al-Qahtani',
          equipment: {
            id: 5,
            equipment_type: 'Generator',
            brand: 'Perkins',
            model_name: '1104A',
            serial_number: 'DEMO-PER-002',
            customer_asset_number: 'EQ-002',
          },
          next_appointment: {
            id: 303,
            purpose: 'repair',
            status: 'planned',
            scheduled_start: '2026-11-10T08:00:00+03:00',
            scheduled_end: '2026-11-10T14:00:00+03:00',
            can_reschedule: true,
            reschedule: null,
          },
          pending_actions: [],
          documents: [
            {
              id: 'd-5002',
              document_type: 'inspection',
              document_number: 'INS-1038A',
              status: 'ready',
            },
          ],
          updates: [
            {
              id: 14,
              status: 'awaiting_parts',
              message:
                'Starter motor ordered. Expected to arrive on 9 November. Repair visit is planned for 10 November.',
              event_at: '2026-11-02T12:10:00+03:00',
            },
            {
              id: 13,
              status: 'quotation_approved',
              message: 'Thank you, your quotation approval was received.',
              event_at: '2026-10-29T15:45:00+03:00',
            },
            {
              id: 12,
              status: 'inspection',
              message:
                'Inspection complete. Starter motor and fuel solenoid have failed.',
              event_at: '2026-10-27T13:20:00+03:00',
            },
          ],
        },
      ],
    },

    {
      id: 1031,
      job_type: 'amc',
      status: 'open',
      description: 'Scheduled AMC service for the Perkins generator.',
      requested_date: '2026-10-28',
      site: SITES.main,
      site_address_snapshot: SITES.main.address,
      machines: [
        {
          id: 205,
          suffix: 'A',
          reference: '1031A',
          status: 'awaiting_approval',
          reported_issue: 'Scheduled generator maintenance under AMC.',
          planned_work:
            'Inspect filters, battery connections and cooling system.',
          started_at: '2026-10-29T09:00:00+03:00',
          completed_at: null,
          estimated_completion: null,
          technician_name: 'Omar Bakr',
          equipment: {
            id: 2,
            equipment_type: 'Generator',
            brand: 'Perkins',
            model_name: '1104A',
            serial_number: 'DEMO-PER-002',
            customer_asset_number: 'EQ-002',
          },
          next_appointment: null,
          pending_actions: [
            {
              id: 'r-7001',
              type: 'inspection_report',
              label: 'Inspection report needs your signature',
              detail: 'Review the findings, then sign to confirm.',
            },
          ],
          documents: [
            {
              id: 'd-5003',
              document_type: 'inspection',
              document_number: 'INS-1031A',
              status: 'ready',
            },
          ],
          updates: [
            {
              id: 20,
              status: 'awaiting_approval',
              message:
                'Inspection report submitted. Please review and sign it so we can close this service.',
              event_at: '2026-10-29T16:00:00+03:00',
            },
          ],
        },
      ],
    },

    {
      id: 1026,
      job_type: 'amc',
      status: 'completed',
      description: 'Routine preventive maintenance under the AMC contract.',
      requested_date: '2026-10-19',
      site: SITES.depot,
      site_address_snapshot: SITES.depot.address,
      machines: [
        {
          id: 206,
          suffix: 'A',
          reference: '1026A',
          status: 'completed',
          reported_issue: 'Routine preventive maintenance.',
          planned_work: 'Inspect tyres, brakes, mast rollers and fluid levels.',
          started_at: '2026-10-21T08:30:00+03:00',
          completed_at: '2026-10-21T11:00:00+03:00',
          estimated_completion: null,
          technician_name: 'Yousef Al-Qahtani',
          equipment: {
            id: 4,
            equipment_type: 'Forklift',
            brand: 'Hyster',
            model_name: 'H3.0FT',
            serial_number: 'DEMO-HYS-004',
            customer_asset_number: 'EQ-004',
          },
          next_appointment: null,
          pending_actions: [],
          documents: [
            {
              id: 'd-5004',
              document_type: 'inspection',
              document_number: 'INS-1026A',
              status: 'ready',
            },
            {
              id: 'd-5005',
              document_type: 'completion',
              document_number: 'JCC-1026A',
              status: 'ready',
            },
          ],
          updates: [
            {
              id: 31,
              status: 'completed',
              message:
                'Service completed. All checks passed and the completion card is ready.',
              event_at: '2026-10-21T11:00:00+03:00',
            },
            {
              id: 30,
              status: 'in_progress',
              message: 'Technician arrived on site and started the service.',
              event_at: '2026-10-21T08:30:00+03:00',
            },
          ],
        },
      ],
    },

    {
      id: 1008,
      job_type: 'amc',
      status: 'closed',
      description: 'Routine maintenance under the AMC contract.',
      requested_date: '2026-10-09',
      site: SITES.main,
      site_address_snapshot: SITES.main.address,
      machines: [
        {
          id: 207,
          suffix: 'A',
          reference: '1008A',
          status: 'completed',
          reported_issue: 'Routine maintenance under the AMC contract.',
          planned_work:
            'Inspect hydraulic lines, brakes and lifting chains.',
          started_at: '2026-10-12T09:00:00+03:00',
          completed_at: '2026-10-12T12:30:00+03:00',
          estimated_completion: null,
          technician_name: 'Faisal Al-Harbi',
          equipment: {
            id: 1,
            equipment_type: 'Forklift',
            brand: 'Toyota',
            model_name: '8FG25',
            serial_number: 'DEMO-TYT-001',
            customer_asset_number: 'EQ-001',
          },
          next_appointment: null,
          pending_actions: [],
          documents: [
            {
              id: 'd-5006',
              document_type: 'completion',
              document_number: 'JCC-1008A',
              status: 'ready',
            },
          ],
          updates: [
            {
              id: 40,
              status: 'completed',
              message: 'Service completed and signed off.',
              event_at: '2026-10-12T12:30:00+03:00',
            },
          ],
        },
      ],
    },

    {
      id: 998,
      job_type: 'general',
      status: 'cancelled',
      description: 'Generator does not start.',
      requested_date: '2026-09-18',
      site: SITES.depot,
      site_address_snapshot: SITES.depot.address,
      machines: [
        {
          id: 208,
          suffix: 'A',
          reference: '998A',
          status: 'cancelled',
          reported_issue: 'Generator does not start.',
          planned_work: 'Inspect the starting system.',
          started_at: null,
          completed_at: null,
          estimated_completion: null,
          technician_name: '',
          equipment: {
            id: 6,
            equipment_type: 'Generator',
            brand: 'Demo brand',
            model_name: 'Legacy unit',
            serial_number: 'DEMO-GEN-005',
            customer_asset_number: 'EQ-005',
          },
          next_appointment: null,
          pending_actions: [],
          documents: [],
          updates: [
            {
              id: 50,
              status: 'cancelled',
              message:
                'Cancelled at your request because the unit has been retired.',
              event_at: '2026-09-19T10:00:00+03:00',
            },
          ],
        },
      ],
    },
  ],
}