const DAY = 24 * 60 * 60 * 1000

export function createDemoQuotations() {
  const base = Date.now()

  const at = days => new Date(base + days * DAY).toISOString()

  const makeQuotation = ({
    sentDays,
    decidedDays = null,
    ...quotation
  }) => ({
    currency: 'SAR',
    region_name: 'Riyadh',
    company_name: 'Demo Customer Company',
    rejection_reason: '',
    previous_version: null,
    sent_at: at(sentDays),
    expires_at: at(sentDays + 7),
    decided_at: decidedDays === null ? null : at(decidedDays),
    terms:
      'This sample quotation covers only the work described above. ' +
      'Additional work requires a separate quotation. ' +
      'The service team will confirm the repair schedule after approval.',
    ...quotation,
  })

  const toyotaService = {
    id: 101,
    reference: '1042A',
    equipment_name: 'Toyota forklift',
    model_name: '8FG25',
    asset_number: 'EQ-001',
    site_name: 'Riyadh main warehouse',
  }

  return [
    makeQuotation({
      id: 'quote-1042-v2',
      number: 'QUO-DEMO-1042A',
      version: 2,
      previous_version: 'quote-1042-v1',
      status: 'sent',
      sentDays: -2,
      total: '1200.00',
      job_equipment: toyotaService,
      inspection_reference: 'IR-DEMO-1042A · Version 1',
      customer_summary:
        'Replace the leaking hydraulic hose, check the associated ' +
        'connections and carry out a hydraulic leak and operating test.',
      estimated_completion_text:
        'Approximately one working day after parts are ready and ' +
        'the repair visit is confirmed.',
    }),
    makeQuotation({
      id: 'quote-1042-v1',
      number: 'QUO-DEMO-1042A',
      version: 1,
      status: 'superseded',
      sentDays: -4,
      total: '1350.00',
      job_equipment: toyotaService,
      inspection_reference: 'IR-DEMO-1042A · Version 1',
      customer_summary:
        'Replace the leaking hydraulic hose and associated fittings, ' +
        'then carry out a hydraulic operating test.',
      estimated_completion_text:
        'Approximately two working days after parts are ready.',
    }),
    makeQuotation({
      id: 'quote-1048-v1',
      number: 'QUO-DEMO-1048A',
      version: 1,
      status: 'approved',
      sentDays: -3,
      decidedDays: -2,
      total: '2400.00',
      job_equipment: {
        id: 108,
        reference: '1048A',
        equipment_name: 'Hyster forklift',
        model_name: 'H3.0FT',
        asset_number: 'EQ-004',
        site_name: 'Riyadh north warehouse',
      },
      inspection_reference: 'IR-DEMO-1048A · Version 1',
      customer_summary:
        'Replace worn brake components, adjust the braking system ' +
        'and complete a controlled braking test.',
      estimated_completion_text:
        'Approximately two working days after parts are ready.',
    }),
    makeQuotation({
      id: 'quote-1036-v1',
      number: 'QUO-DEMO-1036A',
      version: 1,
      status: 'approved',
      sentDays: -15,
      decidedDays: -14,
      total: '2000.00',
      job_equipment: {
        id: 96,
        reference: '1036A',
        equipment_name: 'Perkins generator',
        model_name: '1104A',
        asset_number: 'EQ-002',
        site_name: 'Riyadh main warehouse',
      },
      inspection_reference: 'IR-DEMO-1036A · Version 1',
      customer_summary:
        'Service the cooling system, replace the identified worn ' +
        'components and test generator operation under load.',
      estimated_completion_text:
        'Approximately two working days after the service visit begins.',
    }),
    makeQuotation({
      id: 'quote-1050-v1',
      number: 'QUO-DEMO-1050A',
      version: 1,
      status: 'rejected',
      sentDays: -5,
      decidedDays: -4,
      total: '850.00',
      rejection_reason:
        'We are postponing this repair until the next maintenance window.',
      job_equipment: {
        id: 110,
        reference: '1050A',
        equipment_name: 'Electric shutter',
        model_name: 'Industrial roller door',
        asset_number: 'EQ-003',
        site_name: 'Riyadh north warehouse',
      },
      inspection_reference: 'IR-DEMO-1050A · Version 1',
      customer_summary:
        'Replace the faulty safety sensor, adjust its alignment ' +
        'and test the shutter safety response.',
      estimated_completion_text:
        'Approximately half a working day after the visit is confirmed.',
    }),
    makeQuotation({
      id: 'quote-1052-v1',
      number: 'QUO-DEMO-1052A',
      version: 1,
      status: 'expired',
      sentDays: -12,
      total: '1650.00',
      job_equipment: {
        id: 112,
        reference: '1052A',
        equipment_name: 'Toyota forklift',
        model_name: '8FG25',
        asset_number: 'EQ-001',
        site_name: 'Riyadh main warehouse',
      },
      inspection_reference: 'IR-DEMO-1052A · Version 1',
      customer_summary:
        'Replace the damaged mast roller and check mast movement ' +
        'and alignment.',
      estimated_completion_text:
        'Approximately one working day after parts are ready.',
    }),
  ]
}