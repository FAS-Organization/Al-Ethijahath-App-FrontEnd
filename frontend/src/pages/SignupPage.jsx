import { useLayoutEffect, useRef, useState } from 'react'
import {
  EyeIcon,
  EyeSlashIcon,
  HeadsetIcon,
} from '@phosphor-icons/react'
import './SignupPage.css'

const signupFields = [
  ['fullName', 'Full name', 'text', 'name'],
  ['companyName', 'Company name', 'text', 'organization'],
  ['email', 'Email address', 'email', 'email'],
  ['phone', 'Phone number', 'tel', 'tel'],
  ['password', 'Password', 'password', 'new-password'],
  ['confirmPassword', 'Confirm password', 'password', 'new-password'],
]

const loginFields = [
  ['email', 'Email address', 'email', 'username'],
  ['password', 'Password', 'password', 'current-password'],
]

export default function SignupPage({ onRegister, onLogin }) {
  const [mode, setMode] = useState('signup')
  const [visible, setVisible] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const headingRef = useRef(null)
  const switchingRef = useRef(false)
  const layoutRef = useRef(null)

  useLayoutEffect(() => {
    const layout = layoutRef.current

    if (!layout) return

    const sections = [
      layout.querySelector('.welcome'),
      layout.querySelector('.registration'),
    ].filter(Boolean)

    const layoutBounds = layout.getBoundingClientRect()
    const centerX = layoutBounds.left + layoutBounds.width / 2
    const centerY = layoutBounds.top + layoutBounds.height / 2

    // Read positions before starting either animation.
    const positions = sections.map(section => {
      const bounds = section.getBoundingClientRect()

      return {
        section,
        offsetX: centerX - (bounds.left + bounds.width / 2),
        offsetY: centerY - (bounds.top + bounds.height / 2),
      }
    })

    const animations = positions.map(
      ({ section, offsetX, offsetY }) =>
        section.animate(
          [
            {
              opacity: 0,
              transform: `
                translate(${offsetX}px, ${offsetY}px)
                scale(0.94)
              `,
            },
            {
              opacity: 0.45,
              transform: `
                translate(${offsetX}px, ${offsetY}px)
                scale(0.97)
              `,
              offset: 0.18,
            },
            {
              opacity: 1,
              transform: 'translate(0, 0) scale(1)',
            },
          ],
          {
            duration: 1800,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          }
        )
    )

    return () => {
      animations.forEach(animation => animation.cancel())
    }
  }, [])

  const isLogin = mode === 'login'
  const fields = isLogin ? loginFields : signupFields

  function switchMode() {
    if (busy) return

    switchingRef.current = true

    setMode(old => (old === 'signup' ? 'login' : 'signup'))
    setVisible({})
    setErrors({})
    setStatus('')
  }

  function focusHeading(element) {
    headingRef.current = element

    if (element && switchingRef.current) {
      element.focus({ preventScroll: true })
      switchingRef.current = false
    }
  }

  function clearFieldError(name) {
    setErrors(old => ({
      ...old,
      [name]: '',
    }))

    setStatus('')
  }

  function togglePassword(name) {
    setVisible(old => ({
      ...old,
      [name]: !old[name],
    }))
  }

  async function submit(event) {
    event.preventDefault()

    if (busy) return

    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const next = {}

    fields.forEach(([name, label]) => {
      const value = values[name] ?? ''
      const isPassword =
        name === 'password' || name === 'confirmPassword'

      if (isPassword ? !value : !value.trim()) {
        next[name] = `Enter your ${label.toLowerCase()}.`
      }
    })

    if (values.email && !form.elements.email.validity.valid) {
      next.email = 'Enter a valid email address.'
    }

    if (!isLogin) {
      if (values.phone) {
        const phone = values.phone.trim()
        const digits = phone.replace(/\D/g, '')

        if (
          !/^\+?[\d\s().-]{7,25}$/.test(phone) ||
          digits.length < 7 ||
          digits.length > 15
        ) {
          next.phone =
            'Enter a valid phone number, including your country code.'
        }
      }

      if (values.password && values.password.length < 8) {
        next.password = 'Use at least 8 characters.'
      }

      if (
        values.confirmPassword &&
        values.password !== values.confirmPassword
      ) {
        next.confirmPassword =
          'Passwords do not match. Enter the same password again.'
      }
    }

    setErrors(next)
    setStatus('')

    const firstError = Object.keys(next)[0]

    if (firstError) {
      form.elements[firstError].focus()
      return
    }

    const handler = isLogin ? onLogin : onRegister

    if (!handler) {
      setStatus(
        isLogin
          ? 'Login is not available yet. Please contact Support for help.'
          : 'Registration is not available yet. Please contact Support for help.'
      )
      return
    }

    const payload = {
      ...values,
      email: values.email.trim(),
    }

    delete payload.confirmPassword

    if (!isLogin) {
      payload.fullName = payload.fullName.trim()
      payload.companyName = payload.companyName.trim()
      payload.phone = payload.phone.trim()
    }

    setBusy(true)

    try {
      await handler(payload)

      form.reset()
      setVisible({})

      setStatus(
        isLogin
          ? 'You are logged in.'
          : 'Your registration was submitted. Follow the instructions provided by Al Ethijahath to continue.'
      )
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : isLogin
            ? 'Unable to log in. Please try again.'
            : 'Unable to register. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="signup-shell">
      <a className="skip-link" href="#signup">
        Skip to form
      </a>

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

        <nav aria-label="Help">
          <a
            className="support-link"
            href="https://www.alethijahath.com/#dispatch-form"
          >
            <HeadsetIcon
              size={20}
              weight="regular"
              aria-hidden="true"
            />

            <span>Support</span>
          </a>
        </nav>
      </header>

      <div className="signup-main">
        <main
          id="signup"
          className="registration-layout"
          ref={layoutRef}
        >
          <section
            className="welcome"
            aria-labelledby="welcome-heading"
          >
            <h1 id="welcome-heading">
              Your partner
              <br /> in progress.
            </h1>

            <p>
              A dedicated space for your company and Al Ethijahath.
            </p>

            <div className="welcome-note">
              <span>Client portal</span>

              <p>
                Start with your company account.
                <br />
                Stay connected with our team.
              </p>
            </div>
          </section>

          <section
            className={`registration auth-panel auth-panel--${mode}`}
            aria-labelledby="form-heading"
          >

            <div
              key={mode}
              className={`auth-content auth-content--${mode}`}
            >
              <h2
                id="form-heading"
                ref={focusHeading}
                tabIndex={-1}
              >
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>

              <p className="form-intro">
                {isLogin
                  ? 'Log in to your Al Ethijahath account.'
                  : 'Enter your details to get started.'}
              </p>

              <form
                noValidate
                onSubmit={submit}
                aria-busy={busy}
              >
                <p className="required-note">
                  All fields are required.
                </p>

                <div
                  className={`fields ${
                    isLogin ? 'fields--login' : ''
                  }`}
                >
                  {fields.map(
                    ([name, label, type, autoComplete]) => {
                      const isPassword = type === 'password'
                      const isVisible = Boolean(visible[name])
                      const error = errors[name]

                      let descriptionId

                      if (error) {
                        descriptionId = `${name}-error`
                      } else if (
                        !isLogin &&
                        name === 'password'
                      ) {
                        descriptionId = 'password-hint'
                      } else if (name === 'phone') {
                        descriptionId = 'phone-hint'
                      }

                      return (
                        <div className="field" key={name}>
                          <label htmlFor={name}>
                            {label}
                          </label>

                          <div className="input-wrap">
                            <input
                              id={name}
                              name={name}
                              type={
                                isPassword && isVisible
                                  ? 'text'
                                  : type
                              }
                              autoComplete={autoComplete}
                              required
                              disabled={busy}
                              spellCheck={
                                type === 'email' || isPassword
                                  ? false
                                  : undefined
                              }
                              aria-invalid={Boolean(error)}
                              aria-describedby={descriptionId}
                              onInput={() =>
                                clearFieldError(name)
                              }
                            />

                            {isPassword && (
                              <button
                                className="reveal"
                                type="button"
                                disabled={busy}
                                aria-label={`${
                                  isVisible ? 'Hide' : 'Show'
                                } ${label.toLowerCase()}`}
                                aria-controls={name}
                                title={`${
                                  isVisible ? 'Hide' : 'Show'
                                } password`}
                                onClick={() =>
                                  togglePassword(name)
                                }
                              >
                                {isVisible ? (
                                  <EyeSlashIcon
                                    size={21}
                                    weight="regular"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <EyeIcon
                                    size={21}
                                    weight="regular"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            )}
                          </div>

                          {error ? (
                            <p
                              className="field-error"
                              id={`${name}-error`}
                            >
                              {error}
                            </p>
                          ) : !isLogin &&
                            name === 'password' ? (
                            <p
                              className="hint"
                              id="password-hint"
                            >
                              Use at least 8 characters.
                            </p>
                          ) : name === 'phone' ? (
                            <p
                              className="hint"
                              id="phone-hint"
                            >
                              Include your country code.
                            </p>
                          ) : null}
                        </div>
                      )
                    }
                  )}
                </div>

                  <button
                    className="submit-button"
                    disabled={busy}
                    type="submit"
                  >
                    {busy
                      ? isLogin
                        ? 'Logging in…'
                        : 'Creating account…'
                      : isLogin
                        ? 'Log in'
                        : 'Create account'}
                  </button>

                  <p className="auth-switch-text">
                    {isLogin
                      ? 'Don’t have an account?'
                      : 'Already have an account?'}

                    {' '}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={switchMode}
                    >
                      {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                  </p>

                <div
                  className="form-status"
                  role="status"
                  aria-live="polite"
                >
                  {status}
                </div>
              </form>

            </div>
          </section>
        </main>
      </div>

      <footer className="portal-footer">
        <span>
          © {new Date().getFullYear()} Al Ethijahath. All rights
          reserved.
        </span>

        <span>Client portal</span>
      </footer>
    </div>
  )
}