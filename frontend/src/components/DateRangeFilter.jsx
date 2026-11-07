import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react'

import { shift } from '../utils/dateRange'

import './DateRangeFilter.css'

const PRESETS = [
  { label: 'Today', range: () => [shift(0), shift(0)] },
  { label: 'Last 7 days', range: () => [shift(-6), shift(0)] },
  { label: 'Last 30 days', range: () => [shift(-29), shift(0)] },
]

export default function DateRangeFilter({ from, to, onChange, label = 'Date' }) {
  const active = Boolean(from || to)

  return (
    <fieldset className="drf">
      <legend>
        <CalendarBlankIcon size={15} aria-hidden="true" />
        {label}
      </legend>

      <div className="drf-fields">
        <label>
          <span>From</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={event => onChange(event.target.value, to)}
          />
        </label>

        <label>
          <span>To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={event => onChange(from, event.target.value)}
          />
        </label>
      </div>

      <div className="drf-quick">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(...preset.range())}
          >
            {preset.label}
          </button>
        ))}

        {active && (
          <button
            className="drf-clear"
            type="button"
            onClick={() => onChange('', '')}
          >
            <XIcon size={13} aria-hidden="true" />
            Clear dates
          </button>
        )}
      </div>
    </fieldset>
  )
}