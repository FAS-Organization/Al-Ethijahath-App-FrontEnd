import { useState } from 'react'
import './SignupPage.css'

const fields = [
  ['fullName', 'Full name', 'text', 'name'],
  ['companyName', 'Company name', 'text', 'organization'],
  ['email', 'Email address', 'email', 'email'],
  ['phone', 'Phone number', 'tel', 'tel'],
  ['password', 'Password', 'password', 'new-password'],
  ['confirmPassword', 'Confirm password', 'password', 'new-password'],
]

// Supply onRegister after the Django endpoint and payload are confirmed.
// It must return a Promise and throw a user-safe Error when registration fails.
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
      if (!values[name]?.trim()) next[name] = `Enter your ${label.toLowerCase()}.`
    })
    if (values.email && !form.elements.email.validity.valid) next.email = 'Enter a valid email address.'
    if (values.phone && (!/^\+?[\d\s().-]{7,25}$/.test(values.phone.trim()) || values.phone.replace(/\D/g, '').length < 7 || values.phone.replace(/\D/g, '').length > 15)) next.phone = 'Enter a valid phone number, including your country code.'
    if (values.password && values.password.length < 8) next.password = 'Use at least 8 characters.'
    if (values.confirmPassword && values.password !== values.confirmPassword) next.confirmPassword = 'Passwords do not match. Enter the same password again.'
    setErrors(next)
    setStatus('')
    if (Object.keys(next).length) { form.elements[Object.keys(next)[0]].focus(); return }
    if (!onRegister) { setStatus('Registration is not available yet. Please contact Support for help.'); return }
    setBusy(true)
    try {
      const payload = { ...values }
      delete payload.confirmPassword
      await onRegister(payload)
      setStatus('Your registration was submitted. Follow the instructions provided by Al Ethijahath to continue.')
      form.reset()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to register. Please try again.')
    } finally { setBusy(false) }
  }
  return (
    <div className="signup-shell">
      <a className="skip-link" href="#signup">Skip to registration</a>
      <header className="portal-header">
        <a href="https://www.alethijahath.com/" aria-label="Al Ethijahath company website"><img src="/images/logo.webp" width="160" height="50" alt="Al Ethijahath" /></a>
        <nav aria-label="Help"><a href="https://www.alethijahath.com/#dispatch-form">Support</a></nav>
      </header>
      <main id="signup" className="registration-layout">
        <section className="welcome" aria-labelledby="welcome-heading">
          <h1 id="welcome-heading">Your partner<br />in progress.</h1>
          <p>A dedicated space for your company and Al Ethijahath.</p>
          <div className="welcome-note"><span>Client portal</span><p>Start with your company account.<br />Stay connected with our team.</p></div>
        </section>
        <section className="registration" aria-labelledby="form-heading">
          <h2 id="form-heading">Create your account</h2>
          <p className="form-intro">Enter your details to get started.</p>
          <form noValidate onSubmit={submit} aria-busy={busy}>
            <p className="required-note">All fields are required.</p>
            <div className="fields">
              {fields.map(([name, label, type, autoComplete]) => <div className="field" key={name}>
                <label htmlFor={name}>{label}</label>
                <div className="input-wrap">
                  <input id={name} name={name} type={type === 'password' && visible[name] ? 'text' : type} autoComplete={autoComplete} required disabled={busy} spellCheck={type === 'email' || type === 'password' ? false : undefined} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : name === 'password' ? 'password-hint' : name === 'phone' ? 'phone-hint' : undefined} onInput={() => { if (errors[name]) setErrors(old => ({ ...old, [name]: '' })); setStatus('') }} />
                  {type === 'password' && <button className="reveal" type="button" aria-label={`${visible[name] ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={Boolean(visible[name])} onClick={() => setVisible(old => ({ ...old, [name]: !old[name] }))}>{visible[name] ? 'Hide' : 'Show'}</button>}
                </div>
                {errors[name] ? <p className="field-error" id={`${name}-error`}>{errors[name]}</p> : name === 'password' ? <p className="hint" id="password-hint">Use at least 8 characters.</p> : name === 'phone' ? <p className="hint" id="phone-hint">Include your country code.</p> : null}
              </div>)}
            </div>
            <button className="submit-button" disabled={busy} type="submit">{busy ? 'Creating account…' : 'Create account'}</button>
            <div className="form-status" role="status" aria-live="polite">{status}</div>
          </form>
        </section>
      </main>
      <footer className="portal-footer"><span>© {new Date().getFullYear()} Al Ethijahath. All rights reserved.</span><span>Client portal</span></footer>
    </div>
  )
}
