import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DownloadSimpleIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CheckCircleIcon,
  FileTextIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MoonIcon,
  PaperclipIcon,
  ReceiptIcon,
  SunIcon,
  XIcon,
} from '@phosphor-icons/react'

import CustomerNavbar from '../components/CustomerNavbar'
import DateRangeFilter from '../components/DateRangeFilter'
import { inDateRange } from '../utils/dateRange'
import { createDocumentsPreviewData } from '../data/documentsPreviewData'
import './DocumentsPage.css'

const THEME_KEY = 'ethijahath-dashboard-theme'

const DOCUMENT_TYPES = [
  {
    value: 'all',
    label: 'All documents',
    icon: FolderOpenIcon,
  },
  {
    value: 'inspection',
    label: 'Inspections',
    icon: FileTextIcon,
  },
  {
    value: 'completion',
    label: 'Completion cards',
    icon: CheckCircleIcon,
  },
  {
    value: 'quotation',
    label: 'Quotations',
    icon: FileTextIcon,
  },
  {
    value: 'invoice',
    label: 'Invoices',
    icon: ReceiptIcon,
  },
  {
    value: 'contract',
    label: 'AMC contracts',
    icon: CalendarBlankIcon,
  },
  {
    value: 'attachment',
    label: 'Service files',
    icon: PaperclipIcon,
  },
]

const TYPE_MAP = Object.fromEntries(
  DOCUMENT_TYPES.map(type => [type.value, type]),
)

const STATUS_LABELS = {
  pending_approval: 'Awaiting signature',
  approved: 'Approved',
  sent: 'Awaiting approval',
  rejected: 'Rejected',
  expired: 'Expired',
  superseded: 'Previous version',
  issued: 'Issued',
  void: 'Void',
  active: 'Active',
  cancelled: 'Cancelled',
}

function initialTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function formatDate(value) {
  if (!value) return 'Not recorded'

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00+03:00`
      : value,
  )

  if (Number.isNaN(date.getTime())) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function dateValue(value) {
  const timestamp = value ? new Date(value).getTime() : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

function safeFileUrl(value) {
  if (!value) return null

  try {
    const url = new URL(value, window.location.origin)

    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function DocumentRow({ record, isDemo }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const busyRef = useRef(false)

  const type = TYPE_MAP[record.type] || TYPE_MAP.attachment
  const Icon = type.icon
  const fileUrl = safeFileUrl(record.file_url)
  const statusLabel = STATUS_LABELS[record.source_status]

  async function downloadFile() {
    if (!fileUrl || busyRef.current) return

    busyRef.current = true
    setDownloading(true)
    setDownloadError('')

    try {
      const response = await fetch(fileUrl, {
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw new Error('The file could not be downloaded. Please try again.')
      }

      const file = await response.blob()

      if (!file.size) {
        throw new Error('The downloaded file is empty. Please contact our team.')
      }

      if (
        record.type !== 'attachment' &&
        (await file.slice(0, 5).text()) !== '%PDF-'
      ) {
        throw new Error(
          'A valid PDF was not returned. Refresh the page and try again.',
        )
      }

      const url = URL.createObjectURL(file)
      const link = document.createElement('a')

      link.href = url
      link.download = record.filename || record.number || 'document'
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (error) {
      setDownloadError(
        error.name === 'TimeoutError'
          ? 'The download timed out. Please try again.'
          : error.message || 'The file could not be downloaded.',
      )
    } finally {
      busyRef.current = false
      setDownloading(false)
    }
  }

  return (
    <details className="dp-record">
      <summary>
        <span className={`dp-file-icon dp-file-icon--${record.type}`}>
          <Icon size={24} aria-hidden="true" />
        </span>

        <span className="dp-record-title">
          <strong>{record.number}</strong>
          <span>
            {record.title}
            {record.version != null ? ` · Version ${record.version}` : ''}
          </span>
          <small>
            {record.equipment || record.description}
          </small>
        </span>

        <span className="dp-record-date">
          <small>{record.date_label}</small>
          <span>{formatDate(record.date)}</span>
        </span>

        <span className="dp-record-labels">
          {record.previous_version ? (
            <span className="dp-badge">Previous version</span>
          ) : statusLabel ? (
            <span className={`dp-badge dp-badge--${record.source_status}`}>
              {statusLabel}
            </span>
          ) : null}

          <span className="dp-file-state">
            {fileUrl ? 'File available' : isDemo ? 'Record preview' : 'File unavailable'}
          </span>
        </span>

        <CaretDownIcon
          className="dp-chevron"
          size={18}
          aria-hidden="true"
        />
      </summary>

      <div className="dp-record-body">
        {record.previous_version && (
          <p className="dp-history-note">
            This is a previous version retained for reference.
            Use the current version when reviewing proposed work.
          </p>
        )}

        {record.source_status === 'void' && (
          <p className="dp-history-note">
            This invoice is void. Refer to Invoices &amp; payments for
            the current billing records.
          </p>
        )}

        <p className="dp-description">{record.description}</p>

        <dl className="dp-facts">
          <div>
            <dt>{record.date_label}</dt>
            <dd>{formatDate(record.date)}</dd>
          </div>
          <div>
            <dt>Related reference</dt>
            <dd>{record.reference || 'Not recorded'}</dd>
          </div>

          <div>
            <dt>Site</dt>
            <dd>
              {record.site_names.length
                ? record.site_names.join(' · ')
                : 'Not recorded'}
            </dd>
          </div>

          {record.asset_number && (
            <div>
              <dt>Asset number</dt>
              <dd>{record.asset_number}</dd>
            </div>
          )}

          {record.details.map((detail, index) => (
            <div key={`${detail.label}-${index}`}>
              <dt>{detail.label}</dt>
              <dd>{detail.value || 'Not recorded'}</dd>
            </div>
          ))}
        </dl>

        <div className="dp-record-actions">
          <div className="dp-button-group">
            {fileUrl ? (
              <a
                className="dp-button dp-button--secondary"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open file
                <ArrowUpRightIcon size={17} aria-hidden="true" />
              </a>
            ) : null}

            <button
              type="button"
              className="dp-button"
              disabled={!fileUrl || downloading}
              aria-busy={downloading}
              onClick={downloadFile}
            >
              <DownloadSimpleIcon size={17} aria-hidden="true" />
              {downloading
                ? 'Downloading…'
                : fileUrl
                  ? 'Download'
                  : 'File unavailable'}
            </button>
          </div>

          <Link className="dp-text-link" to={record.destination}>
            {record.destination_label}
            <ArrowUpRightIcon size={17} aria-hidden="true" />
          </Link>
        </div>

        {!fileUrl && (
          <p className="dp-file-help">
            {isDemo
              ? 'This preview contains record details only. No sample file is attached.'
              : 'This file is currently unavailable. Contact our team if you need a copy.'}
          </p>
        )}

        {downloadError && (
          <p className="dp-error" role="alert">
            {downloadError}
          </p>
        )}
      </div>
    </details>
  )
}

export default function DocumentsPage({
  data,
  loading = false,
  error = '',
  onRetry,
}) {
  const [previewData] = useState(createDocumentsPreviewData)
  const [theme, setTheme] = useState(initialTheme)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [site, setSite] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [includePrevious, setIncludePrevious] = useState(false)

  // Undefined uses the demo. Explicit null represents disconnected data.
  const archive = data === undefined ? previewData : data
  const ready = !loading && !error && Boolean(archive)

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // Theme switching remains available without browser storage.
    }
  }, [theme])

  // Display filtering is not an authorization boundary.
  // The backend must scope both records and file access to the customer.
  const documents = ready
    ? archive.documents.filter(record => record.visibility === 'customer')
    : []

  const currentDocuments = documents.filter(
    record => includePrevious || !record.previous_version,
  )

  const sites = [
    ...new Set(documents.flatMap(record => record.site_names)),
  ].sort((first, second) => first.localeCompare(second))

  const counts = currentDocuments.reduce(
    (result, record) => {
      result[record.type] = (result[record.type] || 0) + 1
      return result
    },
    {},
  )

  const normalizedQuery = query.trim().toLowerCase()
  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo)

  const visibleDocuments = currentDocuments
    .filter(record => {
      const searchable = [
        record.number,
        record.title,
        record.equipment,
        record.asset_number,
        record.reference,
        record.description,
        ...record.site_names,
      ].join(' ').toLowerCase()

      return (
        !invalidRange &&
        (category === 'all' || record.type === category) &&
        (site === 'all' || record.site_names.includes(site)) &&
        searchable.includes(normalizedQuery) &&
        inDateRange(record.date, dateFrom, dateTo)
      )
    })
    .sort((first, second) => {
      if (sort === 'reference') {
        return first.number.localeCompare(second.number, undefined, {
          numeric: true,
        }) || (second.version || 0) - (first.version || 0)
      }

      const firstDate = dateValue(first.date)
      const secondDate = dateValue(second.date)

      // Missing dates stay at the end in either date sort direction.
      if (!firstDate && !secondDate) return first.number.localeCompare(second.number)
      if (!firstDate) return 1
      if (!secondDate) return -1

      return sort === 'oldest'
        ? firstDate - secondDate
        : secondDate - firstDate
    })

  function clearFilters() {
    setQuery('')
    setCategory('all')
    setSite('all')
    setDateFrom('')
    setDateTo('')
    setIncludePrevious(false)
    setSort('newest')
  }

  return (
    <div className="dp-page" data-theme={theme}>
      <CustomerNavbar
        companyName={archive?.company_name}
        customerName={archive?.customer_name}
        unreadCount={archive?.unread_count ?? 0}
        theme={theme}
      />

      <main className="dp-main">
        <header className="dp-topbar">
          <div className="dp-breadcrumb">
            <span>Customer portal</span>
            <span aria-hidden="true">/</span>
            <strong>Reports &amp; documents</strong>
          </div>

          <div className="dp-topbar-actions">
            {archive?.region_name && (
              <span className="dp-region">
                <MapPinIcon size={17} aria-hidden="true" />
                {archive.region_name}
              </span>
            )}

            <button
              type="button"
              className="dp-icon-button"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              onClick={() =>
                setTheme(value => value === 'light' ? 'dark' : 'light')
              }
            >
              {theme === 'light'
                ? <MoonIcon size={20} aria-hidden="true" />
                : <SunIcon size={20} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div className="dp-content">
          <div className="dp-heading">
            <div>
              <h1>Reports &amp; documents</h1>
              <p>
                Find the records behind your equipment, service work
                and maintenance agreements.
              </p>
            </div>

            <a className="dp-text-link" href="mailto:info@alethijahath.com">
              Need a document?
              <ArrowUpRightIcon size={17} aria-hidden="true" />
            </a>
          </div>

          {archive?.is_demo && (
            <p className="dp-preview">
              <strong>Frontend preview.</strong> Records come from the existing
              demo pages. Files become available when published documents
              are connected.
            </p>
          )}

          {loading ? (
            <section className="dp-loading" aria-busy="true" aria-label="Loading documents">
              <p role="status">Loading your document archive…</p>
              {[0, 1, 2, 3].map(item => (
                <div className="dp-skeleton" key={item} aria-hidden="true" />
              ))}
            </section>
          ) : error ? (
            <section className="dp-empty" role="alert">
              <FolderOpenIcon size={36} aria-hidden="true" />
              <h2>Documents could not be loaded</h2>
              <p>Please try again or contact our team if the problem continues.</p>
              {onRetry && (
                <button type="button" className="dp-button" onClick={onRetry}>
                  Try again
                </button>
              )}
            </section>
          ) : !archive ? (
            <section className="dp-empty">
              <FolderOpenIcon size={36} aria-hidden="true" />
              <h2>Document data is not connected</h2>
              <p>Your published records will appear here when connected.</p>
            </section>
          ) : (
            <>
              <section className="dp-overview" aria-label="Document archive overview">
                <div className="dp-overview-copy">
                  <FolderOpenIcon size={32} aria-hidden="true" />
                  <div>
                    <h2>Your records, together</h2>
                    <p>
                      Browse a document, check its version and return
                      to the related service or account page.
                    </p>
                  </div>
                </div>

                <dl className="dp-overview-counts">
                  <div>
                    <dt>Records</dt>
                    <dd>{documents.length}</dd>
                  </div>
                  <div>
                    <dt>Sites</dt>
                    <dd>{sites.length}</dd>
                  </div>
                  <div>
                    <dt>Previous versions</dt>
                    <dd>
                      {documents.filter(record => record.previous_version).length}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="dp-library" aria-labelledby="dp-library-title">
                <div className="dp-library-heading">
                  <div>
                    <h2 id="dp-library-title">Document library</h2>
                    <p>Choose a category or search by reference, equipment or site.</p>
                  </div>

                  <button
                    type="button"
                    className="dp-clear"
                    onClick={clearFilters}
                  >
                    <XIcon size={16} aria-hidden="true" />
                    Reset filters
                  </button>
                </div>

                <div className="dp-categories" aria-label="Document categories">
                  {DOCUMENT_TYPES.map(type => {
                    const Icon = type.icon

                    return (
                      <button
                        type="button"
                        key={type.value}
                        className={`dp-category${category === type.value ? ' is-active' : ''}`}
                        aria-pressed={category === type.value}
                        onClick={() => setCategory(type.value)}
                      >
                        <Icon size={19} aria-hidden="true" />
                        <span>{type.label}</span>
                        <span className="dp-category-count">
                          {type.value === 'all'
                            ? currentDocuments.length
                            : counts[type.value] || 0}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="dp-filters">
                  <label className="dp-search">
                    <MagnifyingGlassIcon size={20} aria-hidden="true" />
                    <span className="dp-sr-only">Search documents</span>
                    <input
                      type="search"
                      name="document-search"
                      value={query}
                      placeholder="Search document, service or equipment"
                      onChange={event => setQuery(event.target.value)}
                    />
                  </label>

                  <label className="dp-select">
                    <span>Site</span>
                    <select
                      name="document-site"
                      value={site}
                      onChange={event => setSite(event.target.value)}
                    >
                      <option value="all">All sites</option>
                      {sites.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="dp-select">
                    <span>Sort</span>
                    <select
                      name="document-sort"
                      value={sort}
                      onChange={event => setSort(event.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="reference">Document reference</option>
                    </select>
                  </label>

                  <DateRangeFilter
                    from={dateFrom}
                    to={dateTo}
                    label="Record date"
                    onChange={(from, to) => {
                      setDateFrom(from)
                      setDateTo(to)
                    }}
                  />

                  <p className="dp-date-help">
                    Dates follow the label on each record: sent, issued,
                    inspected, service completed or contract starts.
                    Records without dates are excluded when a date range is selected.
                  </p>
                </div>

                {invalidRange && (
                  <p className="dp-range-error" role="alert">
                    Choose an end date on or after the start date.
                  </p>
                )}

                <div className="dp-results">
                  <p role="status" aria-live="polite">
                    <strong>{visibleDocuments.length}</strong>
                    {' '}matching {visibleDocuments.length === 1 ? 'record' : 'records'}
                  </p>

                  <label className="dp-version-toggle">
                    <input
                      type="checkbox"
                      name="include-previous-documents"
                      checked={includePrevious}
                      onChange={event => setIncludePrevious(event.target.checked)}
                    />
                    Include previous versions
                  </label>
                </div>

                {!documents.length ? (
                  <div className="dp-empty">
                    <FolderOpenIcon size={38} aria-hidden="true" />
                    <h3>No documents published yet</h3>
                    <p>
                      Customer documents will appear here when our team
                      makes them available.
                    </p>
                  </div>
                ) : !visibleDocuments.length ? (
                  <div className="dp-empty">
                    <MagnifyingGlassIcon size={38} aria-hidden="true" />
                    <h3>No matching documents</h3>
                    <p>Try another category, search term or date range.</p>
                    <button
                      type="button"
                      className="dp-button dp-button--secondary"
                      onClick={clearFilters}
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="dp-record-list">
                    {visibleDocuments.map(record => (
                      <DocumentRow
                        key={record.id}
                        record={record}
                        isDemo={archive.is_demo}
                      />
                    ))}
                  </div>
                )}

                <div className="dp-library-footer">
                  <FileTextIcon size={18} aria-hidden="true" />
                  <p>
                    Open a record to see its details and file options.
                    Approval and payment actions are available on their related pages.
                  </p>
                </div>
              </section>
            </>
          )}

          <footer className="dp-footer">
            <span>Al Ethijahath</span>
            <span>Dates and times use Saudi time.</span>
          </footer>
        </div>
      </main>
    </div>
  )
}