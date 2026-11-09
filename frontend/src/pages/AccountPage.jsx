import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  BellRingingIcon,
  BuildingsIcon,
  CheckCircleIcon,
  ChatTextIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeHemisphereWestIcon,
  IdentificationCardIcon,
  LockKeyIcon,
  LockSimpleIcon,
  MapPinIcon,
  MoonIcon,
  PencilSimpleIcon,
  PhoneIcon,
  PlusIcon,
  ReceiptIcon,
  SignOutIcon,
  StorefrontIcon,
  SunIcon,
  TreeStructureIcon,
  TruckIcon,
  UserCircleIcon,
  UserIcon,
  WarehouseIcon,
  WarningCircleIcon,
  WhatsappLogoIcon,
  WrenchIcon,
  XIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import CompanyAvatar from '../components/CompanyAvatar'
import { ACCOUNT_PREVIEW_DATA } from '../data/accountPreviewData'
import './ServicesPage.css'
import './AccountPage.css'

// =========================================================
// FRONTEND DATA CONTRACT
//
// Every customer account belongs to ONE region (each region has its own
// company logins). Sites are the warehouses, branches or sub-companies
// of the company inside that same region.
//
// data = {
//   is_demo?: boolean,
//   account: {
//     id,
//     customer_number,             // e.g. 'CUST-0042'
//     status,                      // 'active' | 'pending_approval' | 'suspended'
//     member_since,                // date
//     region: { id, name, currency },          // read-only for the customer
//     company: { name, billing_address, tax_number },
//     contact: { full_name, email, phone },
//     sites: [{
//       id, name,
//       kind,                      // 'warehouse' | 'branch' | 'sub_company' | 'other'
//       address, contact_name, contact_phone,    // contact fields optional
//       equipment_count,
//     }],
//     summary: { equipment_count, open_jobs, open_invoices },
//     preferences: {
//       channels: { email, whatsapp, sms },          // booleans
//       topics:   { quotations, visits, payments },  // booleans
//     },
//     password_changed_at,         // date or null
//   }
// }
//
// Handlers (each returns a Promise; throw an Error to show its message):
//   onSaveCompany({ name? , billing_address? , tax_number? })   // one field at a time
//   onSaveContact({ full_name? , phone? })                      // one field at a time
//   onSaveSite({ name, kind, address, contact_name, contact_phone }, siteId | null)
//   onSavePreferences({ channels, topics })
//   onChangePassword({ current_password, new_password })
//   onSignOut()
// A handler may return the saved object; if it does not, the values
// that were sent are shown.
//
// Django mapping: User, CustomerCompany, CustomerSite. The region comes
// from the company's own region and is never edited here. The email is
// the login and is not editable here.
// =========================================================

const THEME_KEY = 'ethijahath-dashboard-theme'

const STATUSES = {
  active: { label: 'Active', tone: 'green' },
  pending_approval: { label: 'Pending approval', tone: 'accent' },
  suspended: { label: 'Suspended', tone: 'muted' },
}

const SITE_KINDS = {
  warehouse: { label: 'Warehouse', icon: WarehouseIcon },
  branch: { label: 'Branch office', icon: StorefrontIcon },
  sub_company: { label: 'Sub-company', icon: TreeStructureIcon },
  other: { label: 'Other site', icon: BuildingsIcon },
}

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'sites', label: 'Sites', icon: MapPinIcon },
  { id: 'notifications', label: 'Contact preferences', icon: BellRingingIcon },
  { id: 'security', label: 'Security', icon: LockKeyIcon },
]

const CHANNELS = [
  {
    key: 'email',
    label: 'Email',
    hint: 'Quotations, invoices and reminders by email.',
    icon: EnvelopeSimpleIcon,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    hint: 'Short messages for visits and payment reminders.',
    icon: WhatsappLogoIcon,
  },
  {
    key: 'sms',
    label: 'SMS',
    hint: 'Text messages to your phone number.',
    icon: ChatTextIcon,
  },
]

const TOPICS = [
  {
    key: 'quotations',
    label: 'Quotations and approvals',
    hint: 'When something is waiting for your decision.',
  },
  {
    key: 'visits',
    label: 'Visits and service updates',
    hint: 'Planned visits, reschedules and job progress.',
  },
  {
    key: 'payments',
    label: 'Invoices and payment reminders',
    hint: 'New invoices and overdue reminders.',
  },
]

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)

    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Theme persistence is optional.
  }

  return 'light'
}

function formatDate(value) {
  if (!value) return 'Not recorded'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

// ---------- validation (each returns '' when the value is fine) ----------

const phoneError =
  'Enter a valid phone number, for example +966 50 000 0000.'

function checkPhone(value) {
  const digits = value.replace(/\D/g, '')

  return !/^\+?[\d\s\-()]+$/.test(value.trim()) ||
    digits.length < 7 ||
    digits.length > 15
    ? phoneError
    : ''
}

const validators = {
  name: value =>
    value.trim().length < 2 ? 'Enter the company name.' : '',
  billing_address: value =>
    value.trim().length < 5 ? 'Enter the full billing address.' : '',
  tax_number: value =>
    value.trim() && !/^[A-Za-z0-9-]{5,20}$/.test(value.trim())
      ? 'Use 5 to 20 letters, numbers or dashes.'
      : '',
  full_name: value =>
    value.trim().length < 2 ? 'Enter the contact name.' : '',
  phone: checkPhone,
  site_name: value =>
    value.trim().length < 2 ? 'Enter a name for this site.' : '',
  address: value =>
    value.trim().length < 5 ? 'Enter the site address.' : '',
  optional_phone: value => (value.trim() ? checkPhone(value) : ''),
}

// ---------- small shared pieces ----------

function useSaving() {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')

  async function run(task) {
    if (busy) return false

    setBusy(true)
    setFailure('')

    try {
      await task()
      return true
    } catch (error) {
      setFailure(
        error instanceof Error && error.message
          ? error.message
          : 'Could not save. Please try again.'
      )
      return false
    } finally {
      setBusy(false)
    }
  }

  return { busy, failure, run, clear: () => setFailure('') }
}

function Field({ id, field, value, error, disabled, onChange }) {
  const messageId = `${id}-msg`

  const common = {
    id,
    name: field.name,
    value,
    disabled,
    'aria-invalid': Boolean(error),
    'aria-describedby': messageId,
    onChange: event => onChange(field.name, event.target.value),
  }

  return (
    <div className="ac-field">
      <label htmlFor={id}>
        {field.label}
        {field.optional && <span> (optional)</span>}
      </label>

      {field.multiline ? (
        <textarea rows={3} maxLength={300} {...common} />
      ) : (
        <input
          type={field.type || 'text'}
          maxLength={120}
          autoComplete="off"
          {...common}
        />
      )}

      <p
        id={messageId}
        className={error ? 'ac-error' : 'ac-hint'}
        role={error ? 'alert' : undefined}
      >
        {error || field.hint || ''}
      </p>
    </div>
  )
}

function Modal({
  title,
  intro,
  submitLabel,
  busy,
  failure,
  done,
  onSubmit,
  onClose,
  children,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  function close() {
    if (!busy) dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="sv-dialog ac-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={event => {
        if (busy) event.preventDefault()
      }}
      onClick={event => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="sv-dialog-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {intro && <p>{intro}</p>}
        </div>

        <button
          className="sv-close"
          type="button"
          aria-label="Close"
          disabled={busy}
          onClick={close}
        >
          <XIcon size={20} aria-hidden="true" />
        </button>
      </div>

      {done ? (
        <div className="sv-dialog-done" role="status">
          <CheckCircleIcon size={44} weight="fill" aria-hidden="true" />
          <h3>{done.title}</h3>
          <p>{done.text}</p>
          <button className="sv-primary" type="button" onClick={close}>
            Done
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} aria-busy={busy}>
          <div className="sv-dialog-scroll ac-dialog-scroll">
            {children}

            {failure && (
              <p className="ac-error ac-error--box" role="alert">
                {failure}
              </p>
            )}
          </div>

          <div className="sv-dialog-footer">
            <button
              className="sv-secondary"
              type="button"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>

            <button className="sv-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}

// ---------- click-to-edit row (profile) ----------

function EditableRow({
  label,
  value,
  hint,
  type = 'text',
  multiline = false,
  optional = false,
  readOnly = false,
  validate,
  onSave,
}) {
  const id = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const saving = useSaving()
  const inputRef = useRef(null)
  const editRef = useRef(null)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function start() {
    setDraft(value || '')
    setError('')
    saving.clear()
    setSaved(false)
    setEditing(true)
  }

  function stop() {
    setEditing(false)
    requestAnimationFrame(() => editRef.current?.focus())
  }

  async function submit(event) {
    event.preventDefault()

    const message = validate?.(draft) || ''

    if (message) {
      setError(message)
      inputRef.current?.focus()
      return
    }

    const ok = await saving.run(() => onSave(draft.trim()))

    if (ok) {
      setSaved(true)
      timer.current = setTimeout(() => setSaved(false), 3500)
      stop()
    }
  }

  const describedBy = `${id}-msg`

  return (
    <div className={`ac-row${editing ? ' is-editing' : ''}`}>
      <label className="ac-row-label" htmlFor={editing ? id : undefined}>
        {label}
        {optional && <span> (optional)</span>}
      </label>

      {editing ? (
        <form
          className="ac-row-form"
          noValidate
          aria-busy={saving.busy}
          onSubmit={submit}
          onKeyDown={event => {
            if (event.key === 'Escape' && !saving.busy) {
              event.stopPropagation()
              stop()
            }
          }}
        >
          {multiline ? (
            <textarea
              id={id}
              ref={inputRef}
              rows={3}
              maxLength={300}
              value={draft}
              disabled={saving.busy}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              onChange={event => {
                setDraft(event.target.value)
                setError('')
              }}
            />
          ) : (
            <input
              id={id}
              ref={inputRef}
              type={type}
              maxLength={120}
              autoComplete="off"
              value={draft}
              disabled={saving.busy}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              onChange={event => {
                setDraft(event.target.value)
                setError('')
              }}
            />
          )}

          <p
            id={describedBy}
            className={error || saving.failure ? 'ac-error' : 'ac-hint'}
            role={error || saving.failure ? 'alert' : undefined}
          >
            {error || saving.failure || hint || ''}
          </p>

          <div className="ac-row-actions">
            <button
              className="sv-primary ac-small"
              type="submit"
              disabled={saving.busy}
            >
              {saving.busy ? 'Saving…' : 'Save'}
            </button>

            <button
              className="sv-secondary ac-small"
              type="button"
              disabled={saving.busy}
              onClick={stop}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="ac-row-value">
            <span>{value || 'Not recorded'}</span>

            {hint && readOnly && <small>{hint}</small>}

            <span className="ac-saved" role="status" aria-live="polite">
              {saved && (
                <>
                  <CheckCircleIcon size={15} weight="fill" aria-hidden="true" />
                  Saved
                </>
              )}
            </span>
          </div>

          {readOnly ? (
            <span className="ac-locked">
              <LockSimpleIcon size={15} aria-hidden="true" />
              Locked
            </span>
          ) : (
            <button
              ref={editRef}
              className="ac-edit"
              type="button"
              aria-label={`Edit ${label.toLowerCase()}`}
              onClick={start}
            >
              <PencilSimpleIcon size={16} aria-hidden="true" />
              Edit
            </button>
          )}
        </>
      )}
    </div>
  )
}

function PanelHead({ title, intro, children }) {
  return (
    <header className="ac-panel-head">
      <div>
        <h2>{title}</h2>
        <p>{intro}</p>
      </div>

      {children}
    </header>
  )
}

function ProfilePanel({ account, onSaveCompany, onSaveContact }) {
  const { company, contact, region } = account

  return (
    <>
      <PanelHead
        title="Profile"
        intro="Click Edit next to anything you want to change. Each change is saved on its own."
      />

      <section className="ac-group" aria-labelledby="ac-company-title">
        <h3 id="ac-company-title">
          <BuildingsIcon size={18} aria-hidden="true" />
          Company
        </h3>

        <EditableRow
          label="Company name"
          value={company.name}
          validate={validators.name}
          onSave={value => onSaveCompany({ name: value })}
        />

        <EditableRow
          label="Billing address"
          value={company.billing_address}
          multiline
          hint="Printed on your invoices."
          validate={validators.billing_address}
          onSave={value => onSaveCompany({ billing_address: value })}
        />

        <EditableRow
          label="Tax / VAT number"
          value={company.tax_number}
          optional
          hint="Printed on your invoices when you add it."
          validate={validators.tax_number}
          onSave={value => onSaveCompany({ tax_number: value })}
        />

        <EditableRow
          label="Region"
          value={`${region.name} · ${region.currency}`}
          readOnly
          hint={`Your account belongs to ${region.name}, so invoices are in ${region.currency} and payments go to our ${region.name} account. Contact support to change it.`}
        />
      </section>

      <section className="ac-group" aria-labelledby="ac-contact-title">
        <h3 id="ac-contact-title">
          <UserIcon size={18} aria-hidden="true" />
          Contact person
        </h3>

        <EditableRow
          label="Name"
          value={contact.full_name}
          validate={validators.full_name}
          onSave={value => onSaveContact({ full_name: value })}
        />

        <EditableRow
          label="Email"
          value={contact.email}
          readOnly
          hint="This is the email you sign in with. Contact support to change it."
        />

        <EditableRow
          label="Phone"
          value={contact.phone}
          type="tel"
          hint="Used for WhatsApp and SMS messages."
          validate={validators.phone}
          onSave={value => onSaveContact({ phone: value })}
        />
      </section>
    </>
  )
}

// ---------- sites ----------

function SiteDialog({ site, onSave, onClose }) {
  const idBase = useId()
  const adding = !site
  const saving = useSaving()
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({
    name: site?.name || '',
    kind: site?.kind || 'warehouse',
    address: site?.address || '',
    contact_name: site?.contact_name || '',
    contact_phone: site?.contact_phone || '',
  })

  function change(name, value) {
    setValues(old => ({ ...old, [name]: value }))
    setErrors(old => ({ ...old, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault()

    const next = {}

    const checks = {
      name: validators.site_name(values.name),
      address: validators.address(values.address),
      contact_phone: validators.optional_phone(values.contact_phone),
    }

    Object.entries(checks).forEach(([key, message]) => {
      if (message) next[key] = message
    })

    setErrors(next)

    const first = ['name', 'address', 'contact_phone'].find(key => next[key])

    if (first) {
      document.getElementById(`${idBase}-${first}`)?.focus()
      return
    }

    const payload = {
      name: values.name.trim(),
      kind: values.kind,
      address: values.address.trim(),
      contact_name: values.contact_name.trim(),
      contact_phone: values.contact_phone.trim(),
    }

    const ok = await saving.run(() => onSave(payload, site?.id ?? null))

    if (ok) setDone(true)
  }

  return (
    <Modal
      title={adding ? 'Add a site' : 'Edit site'}
      intro={
        adding
          ? 'A site is one of your warehouses, branches or sub-companies.'
          : 'Update the details of this site.'
      }
      submitLabel={adding ? 'Add site' : 'Save site'}
      busy={saving.busy}
      failure={saving.failure}
      done={
        done
          ? {
              title: adding ? 'Site added' : 'Site updated',
              text: adding
                ? 'You can now request services for equipment at this site.'
                : 'Your changes are saved.',
            }
          : null
      }
      onSubmit={submit}
      onClose={onClose}
    >
      <Field
        id={`${idBase}-name`}
        field={{ name: 'name', label: 'Site name' }}
        value={values.name}
        error={errors.name}
        disabled={saving.busy}
        onChange={change}
      />

      <div className="ac-field">
        <label htmlFor={`${idBase}-kind`}>Type of site</label>

        <select
          id={`${idBase}-kind`}
          value={values.kind}
          disabled={saving.busy}
          aria-describedby={`${idBase}-kind-msg`}
          onChange={event => change('kind', event.target.value)}
        >
          {Object.entries(SITE_KINDS).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>

        <p id={`${idBase}-kind-msg`} className="ac-hint">
          Helps our technicians know where they are going.
        </p>
      </div>

      <Field
        id={`${idBase}-address`}
        field={{ name: 'address', label: 'Site address', multiline: true }}
        value={values.address}
        error={errors.address}
        disabled={saving.busy}
        onChange={change}
      />

      <Field
        id={`${idBase}-contact_name`}
        field={{
          name: 'contact_name',
          label: 'Person on site',
          optional: true,
          hint: 'Who our technician should ask for.',
        }}
        value={values.contact_name}
        disabled={saving.busy}
        onChange={change}
      />

      <Field
        id={`${idBase}-contact_phone`}
        field={{
          name: 'contact_phone',
          label: 'Phone on site',
          type: 'tel',
          optional: true,
        }}
        value={values.contact_phone}
        error={errors.contact_phone}
        disabled={saving.busy}
        onChange={change}
      />
    </Modal>
  )
}

function SitesPanel({ sites, region, onAdd, onEdit }) {
  return (
    <>
      <PanelHead
        title="Sites"
        intro={`Your warehouses, branches and sub-companies in ${region.name}. Choose one when you request a service.`}
      >
        <span className="ac-region-pill">
          <GlobeHemisphereWestIcon size={15} aria-hidden="true" />
          All in {region.name}
        </span>
      </PanelHead>

      <ul className="ac-sites">
        {sites.map(site => {
          const kind = SITE_KINDS[site.kind] || SITE_KINDS.other
          const KindIcon = kind.icon

          return (
            <li className="ac-site" key={site.id}>
              <div className="ac-site-top">
                <span className="ac-site-icon">
                  <KindIcon size={24} aria-hidden="true" />
                </span>

                <span className="ac-kind">{kind.label}</span>

                <button
                  className="ac-icon-button"
                  type="button"
                  aria-label={`Edit ${site.name}`}
                  onClick={() => onEdit(site)}
                >
                  <PencilSimpleIcon size={18} aria-hidden="true" />
                </button>
              </div>

              <h3>{site.name}</h3>
              <p className="ac-site-address">
                <MapPinIcon size={15} aria-hidden="true" />
                {site.address || 'No address recorded'}
              </p>

              <p className="ac-site-person">
                <PhoneIcon size={15} aria-hidden="true" />
                {site.contact_name || site.contact_phone
                  ? [site.contact_name, site.contact_phone]
                      .filter(Boolean)
                      .join(' · ')
                  : 'No person on site added'}
              </p>

              <p className="ac-site-count">
                <TruckIcon size={15} aria-hidden="true" />
                {site.equipment_count === 1
                  ? '1 machine'
                  : `${site.equipment_count} machines`}
              </p>
            </li>
          )
        })}

        <li className="ac-site-add">
          <button type="button" onClick={onAdd}>
            <span>
              <PlusIcon size={22} aria-hidden="true" />
            </span>
            <strong>Add a site</strong>
            <small>Another warehouse, branch or sub-company</small>
          </button>
        </li>
      </ul>
    </>
  )
}

// ---------- notification preferences ----------

function Switch({ id, icon: Icon, label, hint, checked, onChange }) {
  return (
    <label className="ac-switch" htmlFor={id}>
      {Icon && (
        <span className="ac-switch-icon">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}

      <span className="ac-switch-text">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>

      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
      />
      <span className="ac-switch-track" aria-hidden="true">
        <span />
      </span>
    </label>
  )
}

function PreferencesPanel({ preferences, onSave }) {
  const idBase = useId()
  const [draft, setDraft] = useState(preferences)
  const [saved, setSaved] = useState(false)
  const [problem, setProblem] = useState('')
  const saving = useSaving()
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const dirty = JSON.stringify(draft) !== JSON.stringify(preferences)

  function toggle(group, key, value) {
    setSaved(false)
    setProblem('')
    saving.clear()
    setDraft(old => ({ ...old, [group]: { ...old[group], [key]: value } }))
  }

  async function save() {
    if (!Object.values(draft.channels).some(Boolean)) {
      setProblem('Keep at least one way to reach you switched on.')
      return
    }

    const ok = await saving.run(() => onSave(draft))

    if (ok) {
      setSaved(true)
      timer.current = setTimeout(() => setSaved(false), 3500)
    }
  }

  return (
    <>
      <PanelHead
        title="Contact preferences"
        intro="Choose where we send reminders and what we tell you about."
      />

      <div className="ac-prefs">
        <fieldset className="ac-switches">
          <legend>Ways to reach you</legend>
          {CHANNELS.map(item => (
            <Switch
              key={item.key}
              id={`${idBase}-${item.key}`}
              icon={item.icon}
              label={item.label}
              hint={item.hint}
              checked={draft.channels[item.key]}
              onChange={value => toggle('channels', item.key, value)}
            />
          ))}
        </fieldset>

        <fieldset className="ac-switches">
          <legend>What to tell you about</legend>
          {TOPICS.map(item => (
            <Switch
              key={item.key}
              id={`${idBase}-${item.key}`}
              label={item.label}
              hint={item.hint}
              checked={draft.topics[item.key]}
              onChange={value => toggle('topics', item.key, value)}
            />
          ))}
        </fieldset>
      </div>

      <p className="ac-hint">
        Account and approval emails are always sent, whatever you choose.
      </p>

      {(problem || saving.failure) && (
        <p className="ac-error ac-error--box" role="alert">
          {problem || saving.failure}
        </p>
      )}

      <div className="ac-form-actions">
        <p className="ac-saved" role="status" aria-live="polite">
          {saved && (
            <>
              <CheckCircleIcon size={16} weight="fill" aria-hidden="true" />
              Preferences saved
            </>
          )}
        </p>

        <button
          className="sv-primary"
          type="button"
          disabled={!dirty || saving.busy}
          onClick={save}
        >
          {saving.busy ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </>
  )
}

// ---------- password and sign out ----------

function PasswordDialog({ onSave, onClose }) {
  const idBase = useId()
  const saving = useSaving()
  const [done, setDone] = useState(false)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  function change(name, value) {
    setValues(old => ({ ...old, [name]: value }))
    setErrors(old => ({ ...old, [name]: '' }))
  }

  async function submit(event) {
    event.preventDefault()

    const next = {}

    if (!values.current) next.current = 'Enter your current password.'

    if (values.next.length < 8) {
      next.next = 'Use at least 8 characters.'
    } else if (values.next === values.current) {
      next.next = 'Choose a password you have not used here.'
    }

    if (values.confirm !== values.next) {
      next.confirm = 'The two passwords do not match.'
    }

    setErrors(next)

    const first = ['current', 'next', 'confirm'].find(key => next[key])

    if (first) {
      document.getElementById(`${idBase}-${first}`)?.focus()
      return
    }

    const ok = await saving.run(() =>
      onSave({
        current_password: values.current,
        new_password: values.next,
      })
    )

    if (ok) setDone(true)
  }

  const fields = [
    { name: 'current', label: 'Current password', auto: 'current-password' },
    {
      name: 'next',
      label: 'New password',
      auto: 'new-password',
      hint: 'At least 8 characters.',
    },
    { name: 'confirm', label: 'Repeat new password', auto: 'new-password' },
  ]

  return (
    <Modal
      title="Change password"
      intro="Choose a new password for signing in."
      submitLabel="Change password"
      busy={saving.busy}
      failure={saving.failure}
      done={
        done
          ? {
              title: 'Password changed',
              text: 'Use your new password the next time you sign in.',
            }
          : null
      }
      onSubmit={submit}
      onClose={onClose}
    >
      {fields.map(field => {
        const id = `${idBase}-${field.name}`
        const error = errors[field.name]

        return (
          <div className="ac-field" key={field.name}>
            <label htmlFor={id}>{field.label}</label>

            <input
              id={id}
              type={show ? 'text' : 'password'}
              autoComplete={field.auto}
              value={values[field.name]}
              disabled={saving.busy}
              aria-invalid={Boolean(error)}
              aria-describedby={`${id}-msg`}
              onChange={event => change(field.name, event.target.value)}
            />

            <p
              id={`${id}-msg`}
              className={error ? 'ac-error' : 'ac-hint'}
              role={error ? 'alert' : undefined}
            >
              {error || field.hint || ''}
            </p>
          </div>
        )
      })}

      <button
        className="ac-reveal"
        type="button"
        aria-pressed={show}
        onClick={() => setShow(value => !value)}
      >
        {show ? (
          <EyeSlashIcon size={16} aria-hidden="true" />
        ) : (
          <EyeIcon size={16} aria-hidden="true" />
        )}
        {show ? 'Hide passwords' : 'Show passwords'}
      </button>
    </Modal>
  )
}

function SecurityPanel({ changedAt, onChangePassword, onSignOut }) {
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function signOut() {
    if (!onSignOut || signingOut) return

    setSigningOut(true)
    setError('')

    try {
      await onSignOut()
    } catch {
      setError('Could not sign you out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <>
      <PanelHead
        title="Security"
        intro="Keep your account safe and end your session when you are done."
      />

      <ul className="ac-actions">
        <li>
          <span className="ac-action-icon">
            <LockKeyIcon size={22} aria-hidden="true" />
          </span>

          <div>
            <strong>Password</strong>
            <span>
              {changedAt
                ? `Last changed ${formatDate(changedAt)}`
                : 'Change it any time.'}
            </span>
          </div>

          <button className="ac-edit" type="button" onClick={onChangePassword}>
            <PencilSimpleIcon size={16} aria-hidden="true" />
            Change
          </button>
        </li>

        <li>
          <span className="ac-action-icon">
            <SignOutIcon size={22} aria-hidden="true" />
          </span>

          <div>
            <strong>Sign out</strong>
            <span>End your session on this device.</span>
          </div>

          <button
            className="ac-edit"
            type="button"
            disabled={!onSignOut || signingOut}
            title={!onSignOut ? 'Sign out is not connected yet.' : undefined}
            onClick={signOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </li>
      </ul>

      {error && (
        <p className="ac-error ac-error--box" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

// ---------- page ----------

export default function AccountPage({
  data = ACCOUNT_PREVIEW_DATA,
  loading = false,
  error = '',
  onSaveCompany,
  onSaveContact,
  onSaveSite,
  onSavePreferences,
  onChangePassword,
  onSignOut,
}) {
  const idBase = useId()
  const [theme, setTheme] = useState(initialTheme)
  const [source, setSource] = useState(data)
  const [account, setAccount] = useState(data?.account ?? null)
  const [section, setSection] = useState('profile')
  const [siteDialog, setSiteDialog] = useState(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const tabRefs = useRef({})

  // A new data object from the API replaces what is shown.
  if (data !== source) {
    setSource(data)
    setAccount(data?.account ?? null)
  }

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // The page remains usable without storage.
    }
  }, [theme])

  const ready = !loading && !error && Boolean(account)
  const isDemo = Boolean(data?.is_demo)

  // Runs the real handler, or pretends to save in preview mode.
  async function persist(handler, payload, fallbackWait = 700) {
    if (handler) {
      const result = await handler(payload)

      return result && typeof result === 'object' ? result : payload
    }

    if (isDemo) {
      await wait(fallbackWait)
      return payload
    }

    throw new Error('Saving is not connected yet.')
  }

  async function saveCompany(values) {
    const saved = await persist(onSaveCompany, values)

    setAccount(old => ({ ...old, company: { ...old.company, ...saved } }))
  }

  async function saveContact(values) {
    const saved = await persist(onSaveContact, values)

    setAccount(old => ({ ...old, contact: { ...old.contact, ...saved } }))
  }

  async function savePreferences(values) {
    const saved = await persist(onSavePreferences, values)

    setAccount(old => ({ ...old, preferences: saved }))
  }

  async function savePassword(values) {
    await persist(onChangePassword, values, 900)

    setAccount(old => ({
      ...old,
      password_changed_at: new Date().toISOString(),
    }))
  }

  async function saveSite(values, siteId) {
    const saved = await persist(
      onSaveSite ? payload => onSaveSite(payload, siteId) : null,
      values
    )

    setAccount(old => {
      if (siteId) {
        return {
          ...old,
          sites: old.sites.map(site =>
            site.id === siteId ? { ...site, ...saved } : site
          ),
        }
      }

      return {
        ...old,
        sites: [
          ...old.sites,
          {
            equipment_count: 0,
            ...saved,
            id: saved.id ?? `new-${Date.now()}`,
          },
        ],
      }
    })
  }

  function moveTab(event, index) {
    const last = SECTIONS.length - 1
    const keys = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowRight: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }

    if (!(event.key in keys)) return

    event.preventDefault()

    const next = SECTIONS[keys[event.key]].id

    setSection(next)
    tabRefs.current[next]?.focus()
  }

  const company = account?.company
  const status = STATUSES[account?.status] || STATUSES.active

  const stats = account
    ? [
        { label: 'Sites', value: account.sites.length, icon: MapPinIcon },
        {
          label: 'Machines',
          value: account.summary.equipment_count,
          icon: TruckIcon,
          to: '/equipment',
        },
        {
          label: 'Open service jobs',
          value: account.summary.open_jobs,
          icon: WrenchIcon,
          to: '/services',
        },
        {
          label: 'Open invoices',
          value: account.summary.open_invoices,
          icon: ReceiptIcon,
          to: '/billing',
        },
      ]
    : []

  return (
    <div className="sv-page ac-page" data-theme={theme}>
      <CustomerNavbar
        companyName={company?.name || 'Customer portal'}
        customerName={account?.contact.full_name || 'Customer account'}
        unreadCount={2}
        theme={theme}
        onSignOut={onSignOut}
      />

      <div className="sv-main">
        <header className="sv-topbar">
          <span>
            Customer portal / <strong>My account</strong>
          </span>

          <button
            className="sv-theme-button"
            type="button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() =>
              setTheme(value => (value === 'light' ? 'dark' : 'light'))
            }
          >
            {theme === 'light' ? (
              <MoonIcon size={21} aria-hidden="true" />
            ) : (
              <SunIcon size={21} aria-hidden="true" />
            )}
          </button>
        </header>

        <main
          className="sv-content"
          id="account-content"
          tabIndex={-1}
          aria-busy={loading}
        >
          {loading && (
            <div className="sv-message" role="status">
              Loading your account…
            </div>
          )}

          {error && (
            <div className="sv-message" role="alert">
              Could not load your account. Please refresh and try again.
            </div>
          )}

          {!loading && !error && !account && (
            <div className="sv-message">
              <BuildingsIcon size={32} aria-hidden="true" />
              <h1>Account data is not connected yet</h1>
              <p>
                Your company details will appear here once the customer
                account API is connected.
              </p>
            </div>
          )}

          {ready && (
            <>
              {isDemo && (
                <p className="sv-demo-notice">
                  Preview mode · Fictional account. Changes are shown on
                  this page only and are not saved anywhere.
                </p>
              )}

              <section className="ac-profile" aria-label="Account overview">
                <div className="ac-cover" aria-hidden="true">
                  <span className="ac-cover-label">Customer account</span>

                  <span className="ac-cover-region">
                    <GlobeHemisphereWestIcon size={16} />
                    {account.region.name} · {account.region.currency}
                  </span>
                </div>

                <div className="ac-identity">
                  <div className="ac-avatar-ring">
                    <CompanyAvatar name={company.name} size="lg" />
                  </div>

                  <div className="ac-identity-text">
                    <h1>{company.name}</h1>
                    <p>
                      {account.contact.full_name} · {account.contact.email}
                    </p>

                    <div className="ac-badges">
                      <span className={`sv-badge sv-badge--${status.tone}`}>
                        {status.label}
                      </span>

                      <span className="ac-chip">
                        <IdentificationCardIcon size={14} aria-hidden="true" />
                        {account.customer_number}
                      </span>

                      <span className="ac-chip">
                        Customer since {formatDate(account.member_since)}
                      </span>
                    </div>
                  </div>
                </div>

                {account.status !== 'active' && (
                  <p className="ac-status-note" role="status">
                    <WarningCircleIcon size={20} aria-hidden="true" />
                    {account.status === 'pending_approval'
                      ? 'Your account is waiting for approval from our team. You can already update your details.'
                      : 'Your account is suspended. Please contact support.'}
                  </p>
                )}

                <ul className="ac-stats" aria-label="Account summary">
                  {stats.map(({ label, value, icon: Icon, to }) => {
                    const body = (
                      <>
                        <Icon size={20} aria-hidden="true" />
                        <span className="ac-stat-text">
                          <strong>{value}</strong>
                          <span>{label}</span>
                        </span>
                        <ArrowRightIcon
                          className="ac-stat-arrow"
                          size={16}
                          aria-hidden="true"
                        />
                      </>
                    )

                    return (
                      <li key={label}>
                        {to ? (
                          <Link className="ac-stat" to={to}>
                            {body}
                          </Link>
                        ) : (
                          <button
                            className="ac-stat"
                            type="button"
                            onClick={() => setSection('sites')}
                          >
                            {body}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>

              <div className="ac-layout">
                <div
                  className="ac-tabs"
                  role="tablist"
                  aria-label="Account sections"
                  aria-orientation="vertical"
                >
                  {SECTIONS.map(({ id, label, icon: Icon }, index) => (
                    <button
                      key={id}
                      ref={node => {
                        tabRefs.current[id] = node
                      }}
                      id={`${idBase}-tab-${id}`}
                      className="ac-tab"
                      type="button"
                      role="tab"
                      aria-selected={section === id}
                      aria-controls={`${idBase}-panel-${id}`}
                      tabIndex={section === id ? 0 : -1}
                      onClick={() => setSection(id)}
                      onKeyDown={event => moveTab(event, index)}
                    >
                      <Icon size={20} aria-hidden="true" />
                      <span>{label}</span>
                      {id === 'sites' && (
                        <span className="ac-tab-count">
                          {account.sites.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div
                  key={section}
                  className="ac-panel"
                  id={`${idBase}-panel-${section}`}
                  role="tabpanel"
                  aria-labelledby={`${idBase}-tab-${section}`}
                  tabIndex={0}
                >
                  {section === 'profile' && (
                    <ProfilePanel
                      account={account}
                      onSaveCompany={saveCompany}
                      onSaveContact={saveContact}
                    />
                  )}

                  {section === 'sites' && (
                    <SitesPanel
                      sites={account.sites}
                      region={account.region}
                      onAdd={() => setSiteDialog({ site: null })}
                      onEdit={site => setSiteDialog({ site })}
                    />
                  )}

                  {section === 'notifications' && (
                    <PreferencesPanel
                      preferences={account.preferences}
                      onSave={savePreferences}
                    />
                  )}

                  {section === 'security' && (
                    <SecurityPanel
                      changedAt={account.password_changed_at}
                      onChangePassword={() => setPasswordOpen(true)}
                      onSignOut={onSignOut}
                    />
                  )}
                </div>
              </div>

              <p className="ac-footnote">
                Need to change something you cannot edit here, such as your
                login email or region?{' '}
                <a href="mailto:info@alethijahath.com">Contact support</a>{' '}
                and we will help.
              </p>
            </>
          )}

          <footer className="sv-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>

        {siteDialog && ready && (
          <SiteDialog
            key={siteDialog.site?.id ?? 'new'}
            site={siteDialog.site}
            onSave={saveSite}
            onClose={() => setSiteDialog(null)}
          />
        )}

        {passwordOpen && ready && (
          <PasswordDialog
            onSave={savePassword}
            onClose={() => setPasswordOpen(false)}
          />
        )}
      </div>
    </div>
  )
}