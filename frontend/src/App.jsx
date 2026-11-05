import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentPage from './pages/EquipmentPage'
import QuotationsPage from './pages/QuotationsPage'
import AmcSchedulePage from './pages/AmcSchedulePage'

// Fictional preview records using the EquipmentPage data structure.
// Replace this data with the customer-scoped API response later.
const EQUIPMENT_PREVIEW_DATA = {
  is_demo: true,
  company_name: 'Demo Customer Company',

  equipment: [
    {
      id: 1,
      equipment_type: 'Forklift',
      brand: 'Toyota',
      model_name: '8FG25',
      serial_number: 'DEMO-TYT-001',
      customer_asset_number: 'EQ-001',
      fuel_type: 'LPG',
      capacity: '2.5 tonnes',
      manufacture_year: 2022,
      is_retired: false,

      current_site: {
        id: 1,
        name: 'Riyadh warehouse',
        address: 'Demo warehouse address, Riyadh',
        region: {
          id: 1,
          name: 'Riyadh',
        },
      },

      current_amc_coverages: [
        {
          id: 1,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          next_service_due_date: '2026-11-20',
          contract: {
            contract_number: 'DEMO-AMC-001',
          },
        },
      ],

      service_records: [
        {
          id: 101,
          status: 'awaiting_approval',
          reported_issue: 'Hydraulic oil leaking near the lifting assembly.',
          planned_work: 'Replace the damaged hose after quotation approval.',
          started_at: '2026-11-03T08:00:00+03:00',
          completed_at: null,
          estimated_completion: null,
          job: {
            id: 1042,
          },
        },
        {
          id: 102,
          status: 'completed',
          reported_issue: 'Routine maintenance under the AMC contract.',
          planned_work: 'Inspect hydraulic lines, brakes and lifting chains.',
          started_at: '2026-10-12T09:00:00+03:00',
          completed_at: '2026-10-12T12:30:00+03:00',
          estimated_completion: null,
          job: {
            id: 1008,
          },
        },
      ],
    },

    {
      id: 2,
      equipment_type: 'Generator',
      brand: 'Perkins',
      model_name: '1104A',
      serial_number: 'DEMO-PER-002',
      customer_asset_number: 'EQ-002',
      fuel_type: 'Diesel',
      capacity: null,
      manufacture_year: 2021,
      is_retired: false,

      current_site: {
        id: 1,
        name: 'Riyadh warehouse',
        address: 'Demo warehouse address, Riyadh',
        region: {
          id: 1,
          name: 'Riyadh',
        },
      },

      current_amc_coverages: [
        {
          id: 2,
          start_date: '2026-01-01',
          end_date: '2026-12-31',
          next_service_due_date: '2026-12-16',
          contract: {
            contract_number: 'DEMO-AMC-001',
          },
        },
      ],

      service_records: [
        {
          id: 103,
          status: 'completed',
          reported_issue: 'Scheduled generator maintenance.',
          planned_work: 'Inspect filters, battery connections and cooling system.',
          started_at: '2026-10-16T09:00:00+03:00',
          completed_at: '2026-10-16T11:45:00+03:00',
          estimated_completion: null,
          job: {
            id: 1015,
          },
        },
      ],
    },

    {
      id: 3,
      equipment_type: 'Electric shutter',
      brand: '',
      model_name: 'Industrial roller door',
      serial_number: '',
      customer_asset_number: 'EQ-003',
      fuel_type: '',
      capacity: '',
      manufacture_year: null,
      is_retired: false,

      current_site: {
        id: 2,
        name: 'Jeddah facility',
        address: 'Demo facility address, Jeddah',
        region: {
          id: 2,
          name: 'Jeddah',
        },
      },

      current_amc_coverages: [],

      service_records: [
        {
          id: 104,
          status: 'scheduled',
          reported_issue: 'Shutter occasionally stops while opening.',
          planned_work: 'Inspect the controller, motor and safety sensors.',
          started_at: null,
          completed_at: null,
          estimated_completion: null,
          job: {
            id: 1045,
          },
        },
      ],
    },

    {
      id: 4,
      equipment_type: 'Forklift',
      brand: 'Hyster',
      model_name: 'H3.0FT',
      serial_number: 'DEMO-HYS-004',
      customer_asset_number: 'EQ-004',
      fuel_type: 'Diesel',
      capacity: '3 tonnes',
      manufacture_year: 2023,
      is_retired: false,

      current_site: {
        id: 3,
        name: 'Dammam depot',
        address: 'Demo depot address, Dammam',
        region: {
          id: 3,
          name: 'Dammam',
        },
      },

      current_amc_coverages: [
        {
          id: 3,
          start_date: '2026-04-01',
          end_date: '2027-03-31',
          next_service_due_date: '2026-11-21',
          contract: {
            contract_number: 'DEMO-AMC-002',
          },
        },
      ],

      service_records: [
        {
          id: 105,
          status: 'completed',
          reported_issue: 'Routine preventive maintenance.',
          planned_work: 'Inspect tyres, brakes, mast rollers and fluid levels.',
          started_at: '2026-10-21T08:30:00+03:00',
          completed_at: '2026-10-21T11:00:00+03:00',
          estimated_completion: null,
          job: {
            id: 1026,
          },
        },
      ],
    },

    {
      id: 5,
      equipment_type: 'Generator',
      brand: 'Demo brand',
      model_name: 'Legacy unit',
      serial_number: 'DEMO-GEN-005',
      customer_asset_number: 'EQ-005',
      fuel_type: 'Diesel',
      capacity: null,
      manufacture_year: 2015,
      is_retired: true,

      current_site: {
        id: 3,
        name: 'Dammam depot',
        address: 'Demo depot address, Dammam',
        region: {
          id: 3,
          name: 'Dammam',
        },
      },

      current_amc_coverages: [],

      service_records: [
        {
          id: 106,
          status: 'cancelled',
          reported_issue: 'Generator does not start.',
          planned_work: 'Inspect the starting system.',
          started_at: null,
          completed_at: null,
          estimated_completion: null,
          job: {
            id: 998,
          },
        },
      ],
    },
  ],
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/equipment"
          element={<EquipmentPage data={EQUIPMENT_PREVIEW_DATA} />}
        />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/maintenance" element={<AmcSchedulePage />} />
      </Routes>
    </BrowserRouter>
  )
}