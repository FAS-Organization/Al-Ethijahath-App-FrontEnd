import { useEffect, useId, useRef, useState } from 'react'
import { XIcon } from '@phosphor-icons/react'
import './PortalChat.css'

export default function PortalChat() {
  const robotId = useId()
  const dialogRef = useRef(null)
  const logRef = useRef(null)
  const [apiKey, setApiKey] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  const demoEnabled =
    import.meta.env.DEV &&
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages])

  async function handleSubmit(event) {
    event.preventDefault()

    const key = apiKey.trim()
    const text = question.trim()

    if (!demoEnabled || isSending || !key || !text) return

    const conversation = [...messages, { role: 'user', text }]

    setError('')
    setIsSending(true)

    try {
      const { askGemini } = await import('../data/portalChatDemo')
      const reply = await askGemini(key, conversation)

      if (!reply) {
        setError('Gemini returned an empty reply. Try rephrasing your question.')
        return
      }

      setMessages([...conversation, { role: 'model', text: reply }])
      setQuestion('')
    } catch (requestError) {
      setError(
        Number(requestError?.status) === 429
          ? 'Gemini is rate-limiting requests. Check your quota in Google AI Studio.'
          : 'Could not get a reply. Check your Gemini key and connection, then try again.',
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="portal-chat">
      <button
        type="button"
        className="portal-chat__robot-launcher"
        aria-label="Ask AI"
        aria-haspopup="dialog"
        aria-controls="portal-chat-dialog"
        onPointerMove={event => {
          if (event.pointerType !== 'mouse') return

          const button = event.currentTarget
          const rect = button.getBoundingClientRect()
          button.style.setProperty('--robot-look-x', `${(event.clientX - rect.left - rect.width / 2) / 13}px`)
          button.style.setProperty('--robot-look-y', `${(event.clientY - rect.top - rect.height / 2) / 18}px`)
        }}
        onPointerLeave={event => {
          event.currentTarget.style.removeProperty('--robot-look-x')
          event.currentTarget.style.removeProperty('--robot-look-y')
        }}
        onClick={() => dialogRef.current?.showModal()}
      >
        <svg viewBox="0 0 96 96" aria-hidden="true">
          <defs>
            <linearGradient id={`${robotId}-shell`} x2="0.85" y2="1">
              <stop stopColor="#fff7ed" />
              <stop offset=".55" stopColor="#f5d5c7" />
              <stop offset="1" stopColor="#b97b78" />
            </linearGradient>
            <linearGradient id={`${robotId}-red`} x2=".8" y2="1">
              <stop stopColor="#fa827e" />
              <stop offset=".5" stopColor="#bd3541" />
              <stop offset="1" stopColor="#791124" />
            </linearGradient>
            <linearGradient id={`${robotId}-visor`} x2="0" y2="1">
              <stop stopColor="#4c293c" />
              <stop offset="1" stopColor="#231723" />
            </linearGradient>
          </defs>

          <ellipse cx="47" cy="88" rx="27" ry="4" fill="#311824" opacity=".23" />

          <g className="portal-chat__robot-body" stroke="#7c3b45" strokeLinejoin="round">
            <path d="M32 75h12v8a4 4 0 0 1-4 4h-8a4 4 0 0 1 0-8ZM53 75h12v4a4 4 0 0 1 0 8h-8a4 4 0 0 1-4-4Z" fill={`url(#${robotId}-red)`} />
            <path d="M31 63q-10 1-11 12" fill="none" strokeWidth="7" strokeLinecap="round" />
            <rect x="30" y="55" width="36" height="26" rx="11" fill={`url(#${robotId}-shell)`} />
            <rect x="39" y="64" width="18" height="10" rx="5" fill={`url(#${robotId}-red)`} stroke="none" />
            <path d="m48 65 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#fff3dd" stroke="none" />

            <g className="portal-chat__robot-arm">
              <path d="M66 66q10-1 12-13" fill="none" strokeWidth="7" strokeLinecap="round" />
              <circle cx="79" cy="51" r="5" fill={`url(#${robotId}-shell)`} />
            </g>

            <path d="m49 19 3-9" fill="none" strokeWidth="3" strokeLinecap="round" />
            <circle cx="53" cy="8" r="4" fill={`url(#${robotId}-red)`} />
            <rect x="18" y="31" width="9" height="17" rx="4" fill={`url(#${robotId}-red)`} />
            <rect x="70" y="31" width="9" height="17" rx="4" fill={`url(#${robotId}-red)`} />
            <rect x="23" y="17" width="51" height="41" rx="15" fill={`url(#${robotId}-shell)`} />
            <rect x="29" y="23" width="39" height="29" rx="11" fill={`url(#${robotId}-visor)`} stroke="#9e6269" />
            <path d="M36 27h19" stroke="#fff7ed" strokeOpacity=".2" strokeLinecap="round" />

            <g className="portal-chat__robot-look" fill="#ffedd9" stroke="none">
              <ellipse className="portal-chat__robot-blink" cx="40" cy="35" rx="2.8" ry="3.5" />
              <ellipse className="portal-chat__robot-blink" cx="57" cy="35" rx="2.8" ry="3.5" />
            </g>

            <g fill="none" stroke="#ffedd9" strokeWidth="2" strokeLinecap="round">
              <path className="portal-chat__robot-small-smile" d="M45 43q3.5 3 7 0" />
              <path className="portal-chat__robot-grin" d="M43 41h11q-5.5 9-11 0Z" fill="#ffedd9" />
            </g>
          </g>
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        id="portal-chat-dialog"
        className="portal-chat__dialog"
        aria-labelledby="portal-chat-title"
        aria-describedby="portal-chat-description"
      >
        <header className="portal-chat__header">
          <h2 id="portal-chat-title">Al Ethijahath Assistant</h2>

          <button
            type="button"
            className="portal-chat__close"
            aria-label="Close chat"
            onClick={() => dialogRef.current?.close()}
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </header>

        <p id="portal-chat-description" className="portal-chat__description">
          {demoEnabled
            ? 'Ask about the fictional invoices and service jobs in this demo.'
            : 'The assistant is currently available in the local demo.'}
        </p>

        {demoEnabled && (
          <>
            {messages.length > 0 && (
              <div
                ref={logRef}
                className="portal-chat__messages"
                role="log"
                aria-label="Chat messages"
              >
                {messages.map(({ role, text }, index) => (
                  <div
                    key={index}
                    className={
                      role === 'user'
                        ? 'portal-chat__message portal-chat__message--user'
                        : 'portal-chat__message'
                    }
                  >
                    <strong>{role === 'user' ? 'You' : 'Assistant'}</strong>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            )}

            <form className="portal-chat__form" onSubmit={handleSubmit}>
              <label>
                Gemini test key
                <input
                  type="password"
                  name="gemini-test-key"
                  autoComplete="off"
                  value={apiKey}
                  disabled={isSending}
                  onChange={event => setApiKey(event.target.value)}
                />
              </label>

              <label>
                Your question
                <input
                  type="text"
                  name="chat-question"
                  placeholder="How much do I owe?"
                  maxLength={1000}
                  value={question}
                  disabled={isSending}
                  onChange={event => setQuestion(event.target.value)}
                />
              </label>

              <button
                type="submit"
                className="portal-chat__send"
                disabled={isSending || !apiKey.trim() || !question.trim()}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>

              {isSending && <p role="status">Waiting for Gemini…</p>}
              {error && <p role="alert">{error}</p>}
            </form>
          </>
        )}
      </dialog>
    </div>
  )
}