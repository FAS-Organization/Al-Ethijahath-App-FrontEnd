import '@fontsource/great-vibes/400.css'

import { companyInitial } from '../utils/companyInitial'

import './CompanyAvatar.css'

// Default profile picture: the first letter of the company name, in a
// script style, on the same red and white gradient for every company.
export default function CompanyAvatar({ name, size = 'md' }) {
  return (
    <span
      className={`ca ca--${size}`}
      role="img"
      aria-label={name ? `${name} avatar` : 'Company avatar'}
    >
      <span className="ca-letter" aria-hidden="true">
        {companyInitial(name)}
      </span>
    </span>
  )
}