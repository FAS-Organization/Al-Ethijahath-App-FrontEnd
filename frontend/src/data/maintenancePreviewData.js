export const MAINTENANCE_PREVIEW_DATA = {
  is_demo: true,
  now: '2026-11-05T12:00:00+03:00',
  company_name: 'Demo Trading Co.',
  sites: [
    { id: 1, name: 'Main warehouse', address: 'Demo address, Riyadh', region: 'Riyadh' },
    { id: 2, name: 'North warehouse', address: 'Demo address, North Riyadh', region: 'Riyadh' },
  ],
  equipment: [
    { id: 'EQ-001', name: 'Toyota forklift — 8FG25', asset: 'EQ-001', serial: 'DEMO-TYT-001', site_id: 1, is_retired: false },
    { id: 'EQ-002', name: 'Perkins generator — 1104A', asset: 'EQ-002', serial: 'DEMO-PER-002', site_id: 2, is_retired: false },
    { id: 'EQ-003', name: 'Electric shutter', asset: 'EQ-003', serial: 'DEMO-SHT-003', site_id: 2, is_retired: false },
    { id: 'EQ-004', name: 'Hyster forklift — H3.0FT', asset: 'EQ-004', serial: 'DEMO-HYS-004', site_id: 1, is_retired: false },
  ],
  contracts: [
    { id: 'c26', contract_number: 'AMC-DEMO-2026-001', status: 'active', start_date: '2026-01-01', end_date: '2026-12-31', interval_months: 3, pdf_url: null },
    { id: 'c25', contract_number: 'AMC-DEMO-2025-001', status: 'expired', start_date: '2025-01-01', end_date: '2025-12-31', interval_months: 3, pdf_url: null },
  ],
  coverages: [
    { id: 'cv1', contract_id: 'c26', equipment_id: 'EQ-001', start_date: '2026-01-01', end_date: '2026-12-31', interval_months_override: null, is_active: true, last_completed_service_date: '2026-08-20', next_service_due_date: '2026-11-20' },
    { id: 'cv2', contract_id: 'c26', equipment_id: 'EQ-002', start_date: '2026-01-01', end_date: '2026-12-31', interval_months_override: 1, is_active: true, last_completed_service_date: '2026-11-03', next_service_due_date: '2026-12-03' },
    { id: 'cv3', contract_id: 'c26', equipment_id: 'EQ-004', start_date: '2026-01-01', end_date: '2026-12-31', interval_months_override: null, is_active: true, last_completed_service_date: '2026-08-01', next_service_due_date: '2026-11-01' },
    { id: 'cv4', contract_id: 'c25', equipment_id: 'EQ-001', start_date: '2025-01-01', end_date: '2025-12-31', interval_months_override: null, is_active: true, last_completed_service_date: null, next_service_due_date: null },
    { id: 'cv5', contract_id: 'c25', equipment_id: 'EQ-002', start_date: '2025-01-01', end_date: '2025-12-31', interval_months_override: null, is_active: true, last_completed_service_date: null, next_service_due_date: null },
    { id: 'cv6', contract_id: 'c25', equipment_id: 'EQ-004', start_date: '2025-01-01', end_date: '2025-12-31', interval_months_override: null, is_active: true, last_completed_service_date: null, next_service_due_date: null },
  ],
  related_services: [
    { equipment_id: 'EQ-004', reference: '1048A', status: 'awaiting_parts' },
  ],
  appointments: [
    { id: 'ap1', reference: '1045A', equipment_id: 'EQ-003', site_id: 2, purpose: 'inspection', scheduled_start: '2026-11-09T10:00:00+03:00', scheduled_end: '2026-11-09T11:00:00+03:00', status: 'confirmed', technician: 'Ahmed — demo technician', is_amc: false, amc_due_date: null, has_completion_card: false },
    { id: 'ap2', reference: '1042B', equipment_id: 'EQ-002', site_id: 2, purpose: 'repair', scheduled_start: '2026-11-07T09:00:00+03:00', scheduled_end: '2026-11-07T12:00:00+03:00', status: 'confirmed', technician: 'Faisal — demo technician', is_amc: false, amc_due_date: null, has_completion_card: false },
    { id: 'ap3', reference: '1051A', equipment_id: 'EQ-001', site_id: 1, purpose: 'maintenance', scheduled_start: '2026-11-20T09:00:00+03:00', scheduled_end: '2026-11-20T11:00:00+03:00', status: 'planned', technician: null, is_amc: true, amc_due_date: '2026-11-20', has_completion_card: false },
    { id: 'ap4', reference: '1036A', equipment_id: 'EQ-002', site_id: 2, purpose: 'maintenance', scheduled_start: '2026-11-03T09:00:00+03:00', scheduled_end: '2026-11-03T11:00:00+03:00', status: 'completed', technician: 'Faisal — demo technician', is_amc: true, amc_due_date: '2026-11-03', has_completion_card: true },
    { id: 'ap5', reference: '1029A', equipment_id: 'EQ-003', site_id: 2, purpose: 'repair', scheduled_start: '2026-10-28T14:00:00+03:00', scheduled_end: '2026-10-28T16:00:00+03:00', status: 'completed', technician: 'Ahmed — demo technician', is_amc: false, amc_due_date: null, has_completion_card: true },
    { id: 'ap6', reference: '1025A', equipment_id: 'EQ-001', site_id: 2, purpose: 'inspection', scheduled_start: '2026-10-26T10:00:00+03:00', scheduled_end: '2026-10-26T11:00:00+03:00', status: 'cancelled', technician: null, is_amc: false, amc_due_date: null, has_completion_card: false },
  ],
  reschedule_requests: [
    { id: 'rr-1045', appointment_id: 'ap1', reference: '1045A', equipment_id: 'EQ-003', original_start: '2026-11-09T10:00:00+03:00', requested_date: '2026-11-10', reason: 'Warehouse access is unavailable on the original date.', submitted_at: '2026-11-05T09:00:00+03:00', status: 'pending', responded_at: null, notes: null, alternative_date: null, alternative_note: null, customer_response: null },
    { id: 'rr-1036', appointment_id: 'ap4', reference: '1036A', equipment_id: 'EQ-002', original_date: '2026-11-02', requested_date: '2026-11-03', reason: null, submitted_at: '2026-10-30T10:00:00+03:00', status: 'accepted', responded_at: '2026-10-31T10:00:00+03:00', notes: 'Confirmed visit 3 Nov, 09:00–11:00 (since completed).', alternative_date: null, alternative_note: null, customer_response: null },
    { id: 'rr-1029', appointment_id: 'ap5', reference: '1029A', equipment_id: 'EQ-003', original_date: '2026-10-28', requested_date: '2026-10-29', reason: null, submitted_at: '2026-10-24T10:00:00+03:00', status: 'rejected', responded_at: '2026-10-25T10:00:00+03:00', notes: 'The requested date was unavailable. The original visit took place.', alternative_date: null, alternative_note: null, customer_response: null },
    { id: 'rr-1025', appointment_id: 'ap6', reference: '1025A', equipment_id: 'EQ-001', original_date: '2026-10-26', requested_date: '2026-10-27', reason: null, submitted_at: '2026-10-24T10:00:00+03:00', status: 'withdrawn', responded_at: '2026-10-25T10:00:00+03:00', notes: 'The service was separately cancelled.', alternative_date: null, alternative_note: null, customer_response: null },
  ],
  monthly_summaries: [
    { id: 'ms1', month_start: '2026-10-01', contract_number: 'AMC-DEMO-2026-001', completed_count: 1, equipment: [{ id: 'EQ-002', name: 'Perkins generator', asset: 'EQ-002' }], site_name: 'North warehouse', summary: 'Completed 3 Oct 2026: routine maintenance, filter inspection and operational checks.', services: [{ reference: '1031A' }], pdf_url: null },
  ],
}

export const ALTERNATIVE_PREVIEW = {
  id: 'rr-1045',
  alternative_date: '2026-11-11',
  alternative_note: 'Our team proposed 11 Nov because 10 Nov is unavailable.',
}