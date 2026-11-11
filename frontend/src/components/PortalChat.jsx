import { useEffect, useRef, useState } from 'react'
import { ChatCircleDotsIcon, XIcon } from '@phosphor-icons/react'
import './PortalChat.css'

export default function PortalChat() {
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
        className="portal-chat__launcher"
        aria-haspopup="dialog"
        aria-controls="portal-chat-dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <ChatCircleDotsIcon size={22} aria-hidden="true" />
        <span>Ask AI</span>
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