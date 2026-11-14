import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  BroomIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  FanIcon,
  FlashlightIcon,
  GearSixIcon,
  HammerIcon,
  LadderSimpleIcon,
  LightningIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PackageIcon,
  PlugIcon,
  PlusIcon,
  ShieldCheckIcon,
  ToolboxIcon,
  TruckIcon,
  WrenchIcon,
  XIcon,
} from '@phosphor-icons/react'

import DateRangeFilter from '../components/DateRangeFilter'
import { inDateRange } from '../utils/dateRange'
import { RENTAL_ITEMS, RENTAL_ORDERS_PREVIEW } from '../data/rentalsPreviewData'
import './ServicesPage.css'
import './ExtraServicesPage.css'

// Only Rentals is open for now. Remove `locked` to open another service later.
const SERVICES = [
  { id: 'rentals', title: 'Rentals', text: 'Tools & equipments', icon: PackageIcon },
  { id: 'transport', title: 'Transport', text: 'Move equipment', icon: TruckIcon, locked: true },
  { id: 'parts', title: 'Spare parts', text: 'Genuine parts', icon: WrenchIcon, locked: true },
  { id: 'cleaning', title: 'Site cleaning', text: 'After service work', icon: BroomIcon, locked: true },
  { id: 'warranty', title: 'Extended warranty', text: 'Longer cover', icon: ShieldCheckIcon, locked: true },
]

const ICONS = {
  hammer: HammerIcon,
  gear: GearSixIcon,
  lightning: LightningIcon,
  plug: PlugIcon,
  ladder: LadderSimpleIcon,
  light: FlashlightIcon,
  fan: FanIcon,
  toolbox: ToolboxIcon,
}

// The backend moves an order from 'processing' to 'confirmed' or 'rejected'.
const STATUS = {
  processing: { label: 'Pending', note: 'Our team is checking that these items are available. We will confirm shortly.' },
  confirmed: { label: 'Confirmed', note: 'Confirmed. These items are ready for you. Our team will contact you about delivery.' },
  rejected: { label: 'Declined', note: '' },
}

const STATUS_FILTERS = [
  { value: 'processing', label: STATUS.processing.label },
  { value: 'confirmed', label: STATUS.confirmed.label },
  { value: 'rejected', label: STATUS.rejected.label },
  { value: 'all', label: 'All' },
]

function formatDate(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not recorded'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed)
}

function todayValue() {
  const now = new Date()
  const pad = number => String(number).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function ItemRow({ item, quantity, onChange }) {
  const Icon = ICONS[item.icon] || PackageIcon

  return (
    <li className={`xs-item${quantity ? ' xs-item--on' : ''}`}>
      <span className="xs-item-icon"><Icon size={24} aria-hidden="true" /></span>

      <div className="xs-item-text">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <span className="xs-item-meta">
          <b>{item.category}</b> · {item.available} in stock
        </span>
      </div>

      {quantity ? (
        <div className="xs-step" role="group" aria-label={`Quantity of ${item.name}`}>
          <button type="button" aria-label="Decrease quantity" onClick={() => onChange(item.id, quantity - 1)}>
            <MinusIcon size={15} aria-hidden="true" />
          </button>
          <strong aria-live="polite">{quantity}</strong>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= item.available}
            onClick={() => onChange(item.id, quantity + 1)}
          >
            <PlusIcon size={15} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button className="xs-add" type="button" onClick={() => onChange(item.id, 1)}>
          <PlusIcon size={15} aria-hidden="true" /> Add
        </button>
      )}
    </li>
  )
}

function ConfirmDialog({ order, onClose, onHistory }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="sv-dialog"
      aria-labelledby="xs-done-title"
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
    >
      <div className="sv-dialog-header">
        <div>
          <h2 id="xs-done-title">Rental order placed</h2>
        </div>
        <button className="sv-close" type="button" aria-label="Close" onClick={() => dialogRef.current?.close()}>
          <XIcon size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="sv-dialog-done" role="status">
        <CheckCircleIcon size={44} weight="fill" aria-hidden="true" />
        <h3>Order {order.id} received</h3>
        <p>
          Your order is <strong>on process</strong>. Our team will check that these items are
        available and confirm it. You can follow the status in Orders.
        </p>
        <button
          className="sv-primary"
          type="button"
          onClick={() => {
            onHistory()
            dialogRef.current?.close()
          }}
        >
            View orders
        </button>
      </div>
    </dialog>
  )
}

function useSegmentGlide(options, selected) {
  const trackRef = useRef(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    const active = track.querySelector('[aria-pressed="true"]')
    if (!active) return

    function positionIndicator() {
      track.style.setProperty('--xs-selection-x', `${active.offsetLeft}px`)
      track.style.setProperty('--xs-selection-y', `${active.offsetTop}px`)
      track.style.setProperty('--xs-selection-width', `${active.offsetWidth}px`)
      track.style.setProperty('--xs-selection-height', `${active.offsetHeight}px`)
    }

    positionIndicator()

    const observer = new ResizeObserver(positionIndicator)
    observer.observe(track)
    track.querySelectorAll('button').forEach(button => observer.observe(button))
    return () => observer.disconnect()
  }, [options, selected])

  return trackRef
}

function CategorySegments({ categories, category, onChange }) {
  const trackRef = useSegmentGlide(categories, category)

  return (
    <div className="xs-category-scroll">
      <div
        ref={trackRef}
        className="xs-category-segments"
        role="group"
        aria-label="Category"
      >
        {categories.map(name => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            onClick={event => {
              trackRef.current.dataset.glide = String(event.detail > 0)
              onChange(name)
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

function OrderStatusSegments({ statusFilter, counts, onChange }) {
  const trackRef = useSegmentGlide(STATUS_FILTERS, statusFilter)

  return (
    <div
      ref={trackRef}
      className="xs-chips"
      role="group"
      aria-label="Order status"
      data-selected-status={statusFilter}
    >
      {STATUS_FILTERS.map(item => (
        <button
          key={item.value}
          type="button"
          data-status={item.value}
          aria-pressed={statusFilter === item.value}
          onClick={event => {
            trackRef.current.dataset.glide = String(event.detail > 0)
            onChange(item.value)
          }}
        >
          {item.label} <span>{counts[item.value]}</span>
        </button>
      ))}
    </div>
  )
}

export default function ExtraServicesPage({ items = RENTAL_ITEMS, initialOrders = RENTAL_ORDERS_PREVIEW }) {
  const { theme = 'light' } = useOutletContext() ?? {}
  const [service, setService] = useState('rentals')
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const servicesRef = useRef(null)
  const stackOriginRef = useRef(null)
  const upcomingTriggerRef = useRef(null)
  const closingRef = useRef(false)
  const panelTopRef = useRef(0)
  const lastLockedService = SERVICES.findLast(item => item.locked)

  async function toggleUpcoming(event) {
    if (closingRef.current) return

    if (!upcomingOpen) {
      stackOriginRef.current = event.currentTarget.getBoundingClientRect()
      setUpcomingOpen(true)
      return
    }

    closingRef.current = true

    const cards = Array.from(servicesRef.current.querySelectorAll('.xs-locked-card'))
    const currentRects = cards.map(card => card.getBoundingClientRect())

    cards.forEach(card => card.getAnimations().forEach(animation => animation.cancel()))

    const rests = cards.map(card => card.getBoundingClientRect())
    const origin = rests[0]

    const animations = cards.map((card, index) => {
      const current = currentRects[index]
      const rest = rests[index]
      const x = origin.left - rest.left + Math.min(index, 2) * 5
      const y = origin.top - rest.top

      return card.animate(
        [
          {
            transform: `translate(${current.left - rest.left}px, ${current.top - rest.top}px)`,
            opacity: 1,
          },
          { offset: 0.72, opacity: 1 },
          { transform: `translate(${x}px, ${y}px)`, opacity: 0.25 },
        ],
        {
          duration: 540,
          delay: (cards.length - 1 - index) * 32,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'both',
        },
      )
    })

    await Promise.allSettled(animations.map(animation => animation.finished))

    const panel = servicesRef.current?.nextElementSibling
    if (!panel) return

    panelTopRef.current = panel.getBoundingClientRect().top
    setUpcomingOpen(false)
  }

  useLayoutEffect(() => {
    if (!upcomingOpen) {
      if (closingRef.current) {
        closingRef.current = false

        const panel = servicesRef.current.nextElementSibling
        const distance = panelTopRef.current - panel.getBoundingClientRect().top

        if (distance) {
          panel.animate(
            [{ transform: `translateY(${distance}px)` }, { transform: 'translateY(0)' }],
            { duration: 240, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
          )
        }

        const trigger = upcomingTriggerRef.current
        trigger?.animate(
          [{ opacity: 0.25 }, { opacity: 1 }],
          { duration: 160, easing: 'ease-out' },
        )
        trigger?.focus({ preventScroll: true })
      }
      return
    }

    const origin = stackOriginRef.current
    if (!origin) return
    stackOriginRef.current = null

    const cards = Array.from(servicesRef.current.querySelectorAll('.xs-locked-card'))
    const offsets = Array.from(cards, (card, index) => {
      const target = card.getBoundingClientRect()

      return {
        card,
        x: origin.left - target.left + Math.min(index, 2) * 5,
        y: origin.top - target.top,
      }
    })

    const animations = offsets.map(({ card, x, y }, index) =>
      card.animate(
        [
          { transform: `translate(${x}px, ${y}px)` },
          { transform: 'translate(0px, 0px)' },
        ],
        {
          duration: 900,
          delay: index * 120,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'backwards',
        },
      ),
    )

    return () => animations.forEach(animation => animation.cancel())
  }, [upcomingOpen])
  const [view, setView] = useState('rent')
  const [cart, setCart] = useState({})
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [orders, setOrders] = useState(initialOrders)
  const [placed, setPlaced] = useState(null)
  const [statusFilter, setStatusFilter] = useState('processing')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function openOrders() {
    setStatusFilter('processing')
    setView('history')
  }

  function setQuantity(id, quantity) {
    setCart(current => {
      const next = { ...current }
      if (quantity <= 0) delete next[id]
      else next[id] = quantity
      return next
    })
  }

  const categories = useMemo(
    () => ['All', ...new Set(items.map(item => item.category))],
    [items],
  )
  const selected = items.filter(item => cart[item.id] > 0)
  const totalQuantity = selected.reduce((sum, item) => sum + cart[item.id], 0)

  const shown = items.filter(
    item =>
      (category === 'All' || item.category === category) &&
      `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase())
  )

  function confirmOrder() {
    if (!selected.length) return

    // Backend later: POST the order. The server creates it as 'processing'.
    const order = {
      id: `RNT-${1000 + orders.length + 1}`,
      ordered_on: todayValue(),
      status: 'processing',
      items: selected.map(item => ({ id: item.id, name: item.name, quantity: cart[item.id] })),
    }

    setOrders(current => [order, ...current])
    setCart({})
    setPlaced(order)
  }

  const dated = orders.filter(order => inDateRange(order.ordered_on, dateFrom, dateTo))
  const counts = {
    all: dated.length,
    processing: dated.filter(order => order.status === 'processing').length,
    confirmed: dated.filter(order => order.status === 'confirmed').length,
    rejected: dated.filter(order => order.status === 'rejected').length,
  }
  const visibleOrders = dated
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .sort((a, b) => b.ordered_on.localeCompare(a.ordered_on) || b.id.localeCompare(a.id))

  return (
    <div className="sv-page" data-theme={theme}>
      <div className="sv-main">
        <main className="sv-content" id="extras-content" tabIndex={-1}>
          <div className="sv-heading">
            <div>
              <h1>Extra services.</h1>
              <p>Choose a service. Rentals are open now, the others are coming soon.</p>
            </div>
          </div>

          <div className="xs-service-picker" ref={servicesRef}>
            <div className="xs-services" role="tablist" aria-label="Extra services">
              {SERVICES.filter(item => upcomingOpen || !item.locked).map(({ id, title, text, icon: Icon, locked }) => {
                const card = (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    className="xs-service"
                    aria-selected={service === id}
                    aria-disabled={locked || undefined}
                    disabled={locked}
                    onClick={() => setService(id)}
                  >
                    <span className="xs-service-icon"><Icon size={22} aria-hidden="true" /></span>
                    <span className="xs-service-text">
                      <strong>{title}</strong>
                      <small>{locked ? 'Coming soon' : text}</small>
                    </span>
                    {locked && <LockSimpleIcon className="xs-service-lock" size={16} aria-hidden="true" />}
                  </button>
                )

                if (!locked) return card

                return (
                  <div className="xs-locked-card" key={id}>
                    {card}
                    {id === lastLockedService?.id && (
                      <button
                        type="button"
                        className="xs-upcoming-arrow xs-upcoming-close"
                        aria-label="Collapse upcoming services"
                        onClick={toggleUpcoming}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {!upcomingOpen && (
              <button
                ref={upcomingTriggerRef}
                type="button"
                className="xs-upcoming-trigger"
                aria-expanded={false}
                onClick={toggleUpcoming}
              >
                Upcoming Services
                <span className="xs-upcoming-arrow" aria-hidden="true" />
              </button>
            )}
          </div>

          {service === 'rentals' && (
            <section className="xs-panel" aria-label="Rentals">
              <header className="xs-panel-head">
                <div>
                  <h2>Rentals</h2>
                  <p>Rent power tools and site equipment. Our team confirms every order.</p>
                </div>

                <div className="xs-switch" role="group" aria-label="Rentals view">
                  <button type="button" aria-pressed={view === 'rent'} onClick={() => setView('rent')}>
                    <PackageIcon size={17} aria-hidden="true" /> Rent items
                  </button>
                  <button type="button" aria-pressed={view === 'history'} onClick={openOrders}>
                    <ClipboardTextIcon size={17} aria-hidden="true" /> Orders
                    <span>{orders.length}</span>
                  </button>
                </div>
              </header>

              {view === 'rent' ? (
                <div className="xs-rent">
                  <div className="xs-catalog">
                    <label className="xs-search">
                      <span className="sv-sr">Search items</span>
                      <MagnifyingGlassIcon size={19} aria-hidden="true" />
                      <input
                        type="search"
                        placeholder="Search tools and equipment"
                        value={query}
                        onChange={event => setQuery(event.target.value)}
                      />
                    </label>

                    <CategorySegments
                      categories={categories}
                      category={category}
                      onChange={setCategory}
                    />

                    {shown.length ? (
                      <ul className="xs-items">
                        {shown.map(item => (
                          <ItemRow key={item.id} item={item} quantity={cart[item.id] || 0} onChange={setQuantity} />
                        ))}
                      </ul>
                    ) : (
                      <p className="xs-empty">No items match your search.</p>
                    )}
                  </div>

                  <aside className="xs-ticket" aria-label="Your rental">
                    <h3>Your rental</h3>

                    {selected.length ? (
                      <ul className="xs-ticket-lines">
                        {selected.map(item => (
                          <li key={item.id}>
                            <span>{item.name}</span>
                            <b>× {cart[item.id]}</b>
                            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setQuantity(item.id, 0)}>
                              <XIcon size={14} aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="xs-ticket-empty">Nothing selected yet. Add items from the list.</p>
                    )}

                    <div className="xs-ticket-total">
                      <span>Total items</span>
                      <strong>{totalQuantity}</strong>
                    </div>

                    <button className="sv-primary" type="button" disabled={!totalQuantity} onClick={confirmOrder}>
                      <CheckCircleIcon size={18} aria-hidden="true" /> Confirm rental
                    </button>
                    {totalQuantity > 0 && (
                      <button className="xs-clear" type="button" onClick={() => setCart({})}>
                        Clear all
                      </button>
                    )}
                  </aside>
                </div>
              ) : (
                <div className="xs-history">
                  <div className="xs-history-bar">
                    <OrderStatusSegments
                      statusFilter={statusFilter}
                      counts={counts}
                      onChange={setStatusFilter}
                    />

                    <details className="sv-date-filters">
                      <summary>Filter by date{(dateFrom || dateTo) && ' · Active'}</summary>
                      <div className="sv-date-filters-body">
                        <DateRangeFilter
                          label="Order date"
                          from={dateFrom}
                          to={dateTo}
                          onChange={(from, to) => {
                            setDateFrom(from)
                            setDateTo(to)
                          }}
                        />
                      </div>
                    </details>
                  </div>

                  {visibleOrders.length ? (
                    <ol className="xs-timeline">
                      {visibleOrders.map(order => (
                        <li key={order.id} data-status={order.status}>
                          <span className="xs-dot" aria-hidden="true" />
                          <div className="xs-order">
                            <div className="xs-order-head">
                              <h3>{order.id}</h3>
                              <span className="xs-pill" data-status={order.status}>
                                {STATUS[order.status].label}
                              </span>
                              <span className="xs-order-date">
                                <CalendarBlankIcon size={14} aria-hidden="true" />
                                {formatDate(order.ordered_on)}
                              </span>
                            </div>

                            <ul className="xs-order-items">
                              {order.items.map(item => (
                                <li key={item.id}>
                                  {item.name} <b>× {item.quantity}</b>
                                </li>
                              ))}
                            </ul>

                            <p className="xs-order-note">
                              {order.status === 'rejected'
                                ? order.reason || 'Please contact our team.'
                                : STATUS[order.status].note}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="xs-empty">No orders match these filters.</p>
                  )}
                </div>
              )}
            </section>
          )}

          <footer className="sv-footer">
            <span>Al Ethijahath</span>
            <a href="mailto:info@alethijahath.com">Contact support</a>
          </footer>
        </main>

        {placed && (
          <ConfirmDialog order={placed} onClose={() => setPlaced(null)} onHistory={openOrders} />
        )}
      </div>
    </div>
  )
}