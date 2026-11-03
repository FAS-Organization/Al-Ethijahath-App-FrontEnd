import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import './SignupPage.css'

const fields = [
  ['fullName', 'Full name', 'text', 'name'],
  ['companyName', 'Company name', 'text', 'organization'],
  ['email', 'Email address', 'email', 'email'],
  ['phone', 'Phone number', 'tel', 'tel'],
  ['password', 'Password', 'password', 'new-password'],
  ['confirmPassword', 'Confirm password', 'password', 'new-password'],
]

export default function SignupPage({ onRegister }) {
  const [visible, setVisible] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()

    if (busy) return

    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    const next = {}

    fields.forEach(([name, label]) => {
      if (!values[name]?.trim()) {
        next[name] = `Enter your ${label.toLowerCase()}.`
      }
    })

    if (values.email && !form.elements.email.validity.valid) {
      next.email = 'Enter a valid email address.'
    }

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

    setErrors(next)
    setStatus('')

    const firstError = Object.keys(next)[0]

    if (firstError) {
      form.elements[firstError].focus()
      return
    }

    if (!onRegister) {
      setStatus(
        'Registration is not available yet. Please contact Support for help.'
      )
      return
    }

    setBusy(true)

    try {
      const payload = { ...values }
      delete payload.confirmPassword

      await onRegister(payload)

      setStatus(
        'Your registration was submitted. Follow the instructions provided by Al Ethijahath to continue.'
      )

      form.reset()
      setVisible({})
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Unable to register. Please try again.'
      )
    } finally {
      setBusy(false)
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

  return (
    <div className="signup-shell">
      <a className="skip-link" href="#signup">
        Skip to registration
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
          <a href="https://www.alethijahath.com/#dispatch-form">
            Support
          </a>
        </nav>
      </header>

      <div className="signup-main">
        <main id="signup" className="registration-layout">
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
            className="registration"
            aria-labelledby="form-heading"
          >
            <h2 id="form-heading">Create your account</h2>

            <p className="form-intro">
              Enter your details to get started.
            </p>

            <form
              noValidate
              onSubmit={submit}
              aria-busy={busy}
            >
              <p className="required-note">
                All fields are required.
              </p>

              <div className="fields">
                {fields.map(([name, label, type, autoComplete]) => {
                  const isPassword = type === 'password'
                  const isVisible = Boolean(visible[name])
                  const error = errors[name]

                  let descriptionId

                  if (error) {
                    descriptionId = `${name}-error`
                  } else if (name === 'password') {
                    descriptionId = 'password-hint'
                  } else if (name === 'phone') {
                    descriptionId = 'phone-hint'
                  }

                  return (
                    <div className="field" key={name}>
                      <label htmlFor={name}>{label}</label>

                      <div className="input-wrap">
                        <input
                          id={name}
                          name={name}
                          type={
                            isPassword && isVisible ? 'text' : type
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
                          onInput={() => clearFieldError(name)}
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
                            onClick={() => togglePassword(name)}
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
                      ) : name === 'password' ? (
                        <p className="hint" id="password-hint">
                          Use at least 8 characters.
                        </p>
                      ) : name === 'phone' ? (
                        <p className="hint" id="phone-hint">
                          Include your country code.
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <button
                className="submit-button"
                disabled={busy}
                type="submit"
              >
                {busy ? 'Creating account…' : 'Create account'}
              </button>

              <div
                className="form-status"
                role="status"
                aria-live="polite"
              >
                {status}
              </div>
            </form>
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