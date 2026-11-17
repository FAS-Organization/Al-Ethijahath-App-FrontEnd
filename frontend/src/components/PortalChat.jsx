import { useEffect, useRef, useState } from 'react'
import { RobotIcon, XIcon } from '@phosphor-icons/react'
import PortalChatRobot from './PortalChatRobot'
import './PortalChat.css'

export default function PortalChat() {
  const launcherRef = useRef(null)
  const companionRef = useRef(null)
  const dialogRef = useRef(null)
  const logRef = useRef(null)
  const apiKey = ''
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  const expression = isSending ? 'thinking' : error ? 'concerned' : 'smile'

  const demoEnabled =
    import.meta.env.DEV &&
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, isSending])

  useEffect(() => {
    let frame = 0
    let pointer

    function resetGaze() {
      const launcher = launcherRef.current
      launcher?.style.removeProperty('--robot-look-x')
      launcher?.style.removeProperty('--robot-look-y')
    }

    function trackPointer(event) {
      if (event.pointerType === 'touch' || dialogRef.current?.open) return

      pointer = { x: event.clientX, y: event.clientY }
      if (frame) return

      frame = requestAnimationFrame(() => {
        frame = 0
        const launcher = launcherRef.current
        if (!launcher || !pointer || dialogRef.current?.open) return

        const rect = launcher.getBoundingClientRect()
        const gapX = Math.max(rect.left - pointer.x, pointer.x - rect.right, 0)
        const gapY = Math.max(rect.top - pointer.y, pointer.y - rect.bottom, 0)

        if (Math.hypot(gapX, gapY) > 100) {
          resetGaze()
          return
        }

        const x = pointer.x - (rect.left + rect.width / 2)
        const y = pointer.y - (rect.top + rect.height * 0.38)
        const distance = Math.max(30, Math.hypot(x, y))
        launcher.style.setProperty('--robot-look-x', `${x / distance * 4}px`)
        launcher.style.setProperty('--robot-look-y', `${y / distance * 3}px`)
      })
    }

    function stopTracking() {
      pointer = null
      resetGaze()
    }

    function handlePointerOut(event) {
      if (!event.relatedTarget) stopTracking()
    }

    window.addEventListener('pointermove', trackPointer, { passive: true })
    window.addEventListener('pointerout', handlePointerOut)
    window.addEventListener('blur', stopTracking)
    return () => {
      window.removeEventListener('pointermove', trackPointer)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('blur', stopTracking)
      cancelAnimationFrame(frame)
    }
  }, [])

  function trackChatPointer(event) {
    const companion = companionRef.current
    if (!companion || event.pointerType === 'touch') return

    const panel = event.currentTarget.getBoundingClientRect()
    const robot = companion.getBoundingClientRect()
    const dx = event.clientX - (robot.left + robot.width * 0.76)
    const dy = event.clientY - (robot.top + robot.height * 0.36)
    const tilt = Math.max(-16, Math.min(16, dy * 9 / Math.max(180, dx)))
    const across = Math.max(0, Math.min(1, (event.clientX - panel.left) / panel.width))

    companion.toggleAttribute('data-tracking', true)
    companion.style.setProperty('--robot-head-tilt', `${tilt}deg`)
    companion.style.setProperty('--robot-look-x', `${across * 2}px`)
    companion.style.setProperty('--robot-look-y', `${tilt / 10}px`)
  }

  function resetChatGaze() {
    const companion = companionRef.current
    companion?.removeAttribute('data-tracking')
    companion?.style.removeProperty('--robot-head-tilt')
    companion?.style.removeProperty('--robot-look-x')
    companion?.style.removeProperty('--robot-look-y')
  }

  function openChat() {
    resetChatGaze()
    dialogRef.current?.showModal()
    launcherRef.current?.style.removeProperty('--robot-look-x')
    launcherRef.current?.style.removeProperty('--robot-look-y')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const key = apiKey.trim()
    const text = question.trim()

    if (!demoEnabled || isSending || !key || !text) return

    const conversation = [...messages, { role: 'user', text }]

    setMessages(conversation)
    setQuestion('')
    setError('')
    setIsSending(true)

    try {
      const { askGemini } = await import('../data/portalChatDemo')
      const reply = await askGemini(key, conversation)

      if (!reply) {
        setError('Gemini returned an empty reply. Try rephrasing your question.')
        return
      }

      setMessages(current => [...current, { role: 'model', text: reply }])
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
        ref={launcherRef}
        type="button"
        className="portal-chat__robot-launcher"
        aria-label="Ask AI"
        aria-haspopup="dialog"
        aria-controls="portal-chat-dialog"
        onClick={openChat}
      >
        <span className="portal-chat__robot-scene">
          <PortalChatRobot />
          <span className="portal-chat__robot-dialogue" aria-hidden="true">
            <span>Need a hand?</span>
            <span>Track a service job</span>
            <span>Check your invoices</span>
          </span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        id="portal-chat-dialog"
        className="portal-chat__dialog"
        aria-labelledby="portal-chat-title"
        aria-describedby="portal-chat-description"
      >
        <div ref={companionRef} className="portal-chat__companion" data-expression={expression} aria-hidden="true">
          <PortalChatRobot profile />
        </div>

        <div
          className="portal-chat__panel"
          onPointerMove={trackChatPointer}
          onPointerLeave={resetChatGaze}
        >
          <header className="portal-chat__header">
            <h2 id="portal-chat-title">
              <span className="portal-chat__title-icon" aria-hidden="true">
                <RobotIcon size={16} />
              </span>
              EthiBot
            </h2>

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
                      <p>
                        <span className="portal-chat__sr-only">{role === 'user' ? 'You: ' : 'EthiBot: '}</span>
                        {text}
                      </p>
                    </div>
                  ))}
                  {isSending && (
                    <div className="portal-chat__message portal-chat__typing" role="status">
                      <span className="portal-chat__sr-only">EthiBot is typing</span>
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                    </div>
                  )}
                </div>
              )}

              <form className="portal-chat__form" onSubmit={handleSubmit}>
                <label>
                  Your question
                  <textarea
                    name="chat-question"
                    placeholder="How much do I owe?"
                    rows={3}
                    maxLength={1000}
                    value={question}
                    disabled={isSending}
                    onChange={event => setQuestion(event.target.value)}
                    onKeyDown={event => {
                      if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }}
                  />
                </label>

                <button
                  type="submit"
                  className="portal-chat__send"
                  disabled={isSending || !apiKey.trim() || !question.trim()}
                >
                  {isSending ? 'Sending…' : 'Send'}
                </button>

                {error && <p role="alert">{error}</p>}
              </form>
            </>
          )}
        </div>
      </dialog>
    </div>
  )
}