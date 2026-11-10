import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  EnvelopeSimpleIcon,
  GlobeIcon,
  HeadsetIcon,
  HouseLineIcon,
  LightningIcon,
  LinkedinLogoIcon,
  SignOutIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react'
import { ERROR_TYPES } from '../utils/errorTypes'
// The header and footer styles come from the signup page.
import '../pages/SignupPage.css'
import './ErrorPage.css'

/**
 * One page for every error, with the same header and footer as the signup page.
 *
 * type      key of ERROR_TYPES (default 'not_found')
 * onRetry   what "Try again" does (default: reload the page)
 * onSignOut shows the "Sign out" button when given
 */
export default function ErrorPage({ type = 'not_found', onRetry, onSignOut }) {
  const navigate = useNavigate()
  const headingRef = useRef(null)
  const info = ERROR_TYPES[type] || ERROR_TYPES.server

  useEffect(() => {
    document.title = `${info.title} | Al Ethijahath`
    headingRef.current?.focus()
  }, [info.title])

  function goBack() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  function retry() {
    if (onRetry) onRetry()
    else window.location.reload()
  }

  const buttons = {
    home: (
      <Link key="home" className="er-btn er-btn--solid" to="/">
        <HouseLineIcon size={19} aria-hidden="true" />
        Go to start
      </Link>
    ),
    back: (
      <button key="back" className="er-btn" type="button" onClick={goBack}>
        <ArrowLeftIcon size={19} aria-hidden="true" />
        Go back
      </button>
    ),
    retry: (
      <button
        key="retry"
        className="er-btn er-btn--solid"
        type="button"
        onClick={retry}
      >
        <ArrowClockwiseIcon size={19} aria-hidden="true" />
        Try again
      </button>
    ),
    signout: onSignOut ? (
      <button key="signout" className="er-btn" type="button" onClick={onSignOut}>
        <SignOutIcon size={19} aria-hidden="true" />
        Sign out
      </button>
    ) : null,
  }

  return (
    <div className="signup-shell">
      <header className="portal-header">
        <a
          href="https://www.alethijahath.com/"
          aria-label="Al Ethijahath company website"
        >
          <img
            src="/images/logo.webp"
            width="160"
            height="50"
            alt="Al Ethijahath"
          />
        </a>

        <nav className="header-actions" aria-label="Help">
          <a
            className="dispatch-link"
            href="https://www.alethijahath.com/#dispatch-form"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LightningIcon size={19} weight="fill" aria-hidden="true" />
            <span>Emergency Dispatch</span>
          </a>

          <a className="support-link" href="mailto:info@alethijahath.com">
            <HeadsetIcon size={20} weight="regular" aria-hidden="true" />
            <span>Support</span>
          </a>
        </nav>
      </header>

      <div className="signup-main er-body">
        <main
          className="er-content"
          role={type === 'offline' ? 'status' : undefined}
        >
          <img
            className="er-art"
            src={`/images/error-${type}.svg`}
            width="500"
            height="300"
            alt=""
          />
          <h1 ref={headingRef} tabIndex={-1}>
            {info.title}
          </h1>

          <p className="er-message">{info.message}</p>

          <div className="er-actions">
            {info.actions.map(name => buttons[name])}
          </div>
        </main>
      </div>

      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} Al Ethijahath. All rights reserved.
        </span>

        <nav className="footer-links" aria-label="Contact links">
          <a
            href="https://www.linkedin.com/company/al-ethijahath/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Al Ethijahath on LinkedIn"
            title="LinkedIn"
          >
            <LinkedinLogoIcon size={25} weight="regular" aria-hidden="true" />
          </a>

          <a
            href="mailto:info@alethijahath.com"
            aria-label="Email info@alethijahath.com"
            title="Email"
          >
            <EnvelopeSimpleIcon size={25} weight="regular" aria-hidden="true" />
          </a>

          <a
            href="https://www.alethijahath.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Al Ethijahath website"
            title="Website"
          >
            <GlobeIcon size={25} weight="regular" aria-hidden="true" />
          </a>

          <a
            href="https://wa.me/966509374109"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact Al Ethijahath on WhatsApp"
            title="WhatsApp"
          >
            <WhatsappLogoIcon size={25} weight="regular" aria-hidden="true" />
          </a>
        </nav>
      </footer>
    </div>
  )
}

// Used by the /error/:type preview route so you can see every page.
export function ErrorPreviewPage() {
  const { type } = useParams()
  return <ErrorPage type={ERROR_TYPES[type] ? type : 'not_found'} />
}