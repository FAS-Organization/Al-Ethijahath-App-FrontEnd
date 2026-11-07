import { companyColor, companyInitial } from '../utils/companyInitial'

import './CompanyAvatar.css'

// Default profile picture: the first letter of the company name on a
// colour that always stays the same for that name.
export default function CompanyAvatar({ name, size = 'md' }) {
  return (
    <span
      className={`ca ca--${size}`}
      style={{ '--ca-bg': companyColor(name) }}
      role="img"
      aria-label={name ? `${name} avatar` : 'Company avatar'}
    >
      <span aria-hidden="true">{companyInitial(name)}</span>
    </span>
  )
}