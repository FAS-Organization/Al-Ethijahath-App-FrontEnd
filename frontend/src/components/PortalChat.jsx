import { useEffect, useRef, useState } from 'react'
import { RobotIcon, XIcon } from '@phosphor-icons/react'
import PortalChatRobot from './PortalChatRobot'
import './PortalChat.css'

const CHAT_GREETINGS = [
  "Hi, I'm EthiBot. How can I help?",
  "Hello! I'm EthiBot. What can I help you with today?",
  "Hey, I'm EthiBot. Need help with an invoice or service job?",
  "Hi there! I'm EthiBot. What would you like to check today?",
]

const DRAG_LINES = [
  'Can I land now?',
  'Easy, I get dizzy!',
  'My wings need a break.',
]

export default function PortalChat() {
  const launcherRef = useRef(null)
  const dragRef = useRef(null)
  const suppressClickRef = useRef(false)
  const [dragLine, setDragLine] = useState(DRAG_LINES.length - 1)
  const companionRef = useRef(null)
  const dialogRef = useRef(null)
  const backdropPressRef = useRef(false)
  const logRef = useRef(null)
  const apiKey = ' '
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => {
    const drag = dragRef.current
    clearTimeout(drag?.pauseTimer)
    drag?.flaps?.forEach(animation => animation.cancel())
  }, [])

  const expression = isSending ? 'thinking' : error ? 'concerned' : 'smile'

  const demoEnabled =
    import.meta.env.DEV &&
    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages, isSending])

  useEffect(() => {
    const topbar = document.querySelector('.portal-topbar')
    const dialog = dialogRef.current
    if (!topbar || !dialog) return

    function updateTopbarHeight() {
      const height = Math.ceil(topbar.getBoundingClientRect().height)
      dialog.style.setProperty('--chat-topbar-height', `${height}px`)
    }

    updateTopbarHeight()
    const observer = new ResizeObserver(updateTopbarHeight)
    observer.observe(topbar, { box: 'border-box' })
    return () => observer.disconnect()
  }, [])

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

  function startRobotDrag(event) {
    if (event.button !== 0 || dragRef.current) return

    const launcher = event.currentTarget
    const { clientX: x, clientY: y, pointerId } = event
    suppressClickRef.current = false
    dragRef.current = { pointerId, x, y, lastX: x, lastY: y, lastTime: event.timeStamp }
    launcher.setPointerCapture(pointerId)
  }

  function moveRobotDrag(event) {
    const drag = dragRef.current
    if (drag?.pointerId !== event.pointerId) return

    const launcher = event.currentTarget
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y

    if (!drag.bounds) {
      if (Math.hypot(dx, dy) < 7) return

      const rect = launcher.getBoundingClientRect()
      const offset = new DOMMatrixReadOnly(getComputedStyle(launcher).transform)
      drag.bounds = {
        left: rect.left - offset.m41,
        top: rect.top - offset.m42,
        width: rect.width,
        height: rect.height,
      }
      drag.offsetX = offset.m41
      drag.offsetY = offset.m42
      drag.arms = Array.from(launcher.querySelectorAll('[data-robot-wing]'))
      suppressClickRef.current = true
    }

    const stepX = event.clientX - drag.lastX
    const stepY = event.clientY - drag.lastY
    const distance = Math.hypot(stepX, stepY)
    if (!distance) return

    const elapsed = Math.max(8, event.timeStamp - drag.lastTime)
    const speed = distance / elapsed
    const lean = Math.min(1, 0.25 + speed * 1.5)
    launcher.style.setProperty('--robot-flight-x', String(stepX / distance * lean))
    launcher.style.setProperty('--robot-flight-y', String(stepY / distance * lean))

    const { left, top, width, height } = drag.bounds
    const x = Math.max(-left, Math.min(window.innerWidth - left - width, drag.offsetX + dx))
    const y = Math.max(-top, Math.min(window.innerHeight - top - height, drag.offsetY + dy))
    launcher.style.setProperty('--robot-drag-x', `${x}px`)
    launcher.style.setProperty('--robot-drag-y', `${y}px`)

    const center = left + x + width / 2
    const speechCenter = Math.max(82, Math.min(window.innerWidth - 82, center))
    launcher.style.setProperty('--robot-speech-x', `${speechCenter - center}px`)
    launcher.toggleAttribute('data-speech-below', top + y < 34)
    launcher.dataset.dragState = 'moving'

    if (!drag.flaps) {
      drag.flaps = drag.arms.map(arm => {
        const angle = arm.dataset.robotWing === 'left' ? 1 : -1
        return arm.animate(
          [
            { rotate: '0deg' },
            { rotate: `${angle * 32}deg` },
            { rotate: `${angle * -18}deg` },
            { rotate: '0deg' },
          ],
          { duration: 470, easing: 'ease-in-out', iterations: Infinity },
        )
      })
    }

    const rate = Math.min(2.8, 0.75 + speed * 1.2)
    drag.flaps.forEach(animation => animation.updatePlaybackRate(rate))
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    drag.lastTime = event.timeStamp

    clearTimeout(drag.pauseTimer)
    drag.pauseTimer = setTimeout(() => {
      drag.flaps.forEach(animation => animation.updatePlaybackRate(0.55))
      launcher.dataset.dragState = 'held'
      setDragLine(index => (index + 1) % DRAG_LINES.length)
    }, 180)
  }

  function endRobotDrag(event) {
    const drag = dragRef.current
    if (drag?.pointerId !== event.pointerId) return

    dragRef.current = null
    clearTimeout(drag.pauseTimer)
    drag.flaps?.forEach(animation => animation.cancel())

    const launcher = event.currentTarget
    launcher.removeAttribute('data-drag-state')
    launcher.removeAttribute('data-speech-below')
    launcher.style.removeProperty('--robot-drag-x')
    launcher.style.removeProperty('--robot-drag-y')
    launcher.style.removeProperty('--robot-speech-x')
    launcher.style.removeProperty('--robot-flight-x')
    launcher.style.removeProperty('--robot-flight-y')
  }

  function openChat() {
    const dialog = dialogRef.current
    const launcher = launcherRef.current
    const companion = companionRef.current
    const start = launcher?.querySelector('.portal-chat__robot-art')?.getBoundingClientRect()
    if (!dialog || dialog.open) return

    const previousGreeting = messages.findLast(message => message.role === 'greeting')?.text
    const choices = CHAT_GREETINGS.filter(text => text !== previousGreeting)
    const greeting = {
      role: 'greeting',
      text: choices[Math.floor(Math.random() * choices.length)],
    }

    setMessages(current => current.at(-1)?.role === 'greeting'
      ? [...current.slice(0, -1), greeting]
      : [...current, greeting],
    )

    resetChatGaze()
    dialog.showModal()

    if (start && companion) {
      const end = companion.getBoundingClientRect()
      companion.style.setProperty('--robot-open-x', `${start.left + start.width / 2 - (end.left + end.width / 2)}px`)
      companion.style.setProperty('--robot-open-y', `${start.top + start.height / 2 - (end.top + end.height / 2)}px`)
      companion.style.setProperty('--robot-open-scale', String(start.height / end.height))
    }

    launcher?.style.removeProperty('--robot-look-x')
    launcher?.style.removeProperty('--robot-look-y')
  }

  function closeChat() {
    const dialog = dialogRef.current
    if (!dialog?.open || dialog.hasAttribute('data-closing')) return

    const panel = dialog.querySelector('.portal-chat__panel')
    const style = panel ? getComputedStyle(panel) : null
    dialog.setAttribute('data-closing', '')

    function finishClose() {
      dialog.close()
      dialog.removeAttribute('data-closing')
    }

    if (!panel || !style || typeof panel.animate !== 'function') {
      finishClose()
      return
    }

    const animation = panel.animate(
      [
        { opacity: style.opacity, transform: style.transform },
        { opacity: 0, transform: 'translate(18px, 12px) scale(.94)' },
      ],
      { duration: 220, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' },
    )

    animation.finished.then(() => {
      finishClose()
      animation.cancel()
    }, finishClose)
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
      const history = conversation.filter(message => message.role !== 'greeting')
      const reply = await askGemini(key, history)

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
        onPointerDown={startRobotDrag}
        onPointerMove={moveRobotDrag}
        onPointerUp={endRobotDrag}
        onPointerCancel={endRobotDrag}
        onLostPointerCapture={endRobotDrag}
        onContextMenu={event => {
          if (dragRef.current) event.preventDefault()
        }}
        onClick={event => {
          if (event.detail > 0 && suppressClickRef.current) return
          openChat()
        }}
      >
        <span className="portal-chat__robot-scene">
          <PortalChatRobot />
          <span className="portal-chat__robot-dialogue" aria-hidden="true">
            <span>Hi, I'm EthiBot</span>
            <span>Need a hand?</span>
            <span>Track a service job</span>
            <span>Check your invoices</span>
          </span>
          <span className="portal-chat__robot-dialogue portal-chat__robot-dialogue--drag" aria-hidden="true">
            {DRAG_LINES[dragLine]}
          </span>
        </span>
      </button>

      <dialog
        ref={dialogRef}
        id="portal-chat-dialog"
        className="portal-chat__dialog"
        aria-labelledby="portal-chat-title"
        aria-describedby="portal-chat-description"
        onPointerDown={event => {
          backdropPressRef.current = event.target === event.currentTarget
        }}
        onClick={event => {
          if (backdropPressRef.current && event.target === event.currentTarget) closeChat()
          backdropPressRef.current = false
        }}
        onCancel={event => {
          event.preventDefault()
          closeChat()
        }}
      >
        <div ref={companionRef} className="portal-chat__companion" data-expression={expression} aria-hidden="true">
          <div className="portal-chat__companion-motion">
            <span className="portal-chat__companion-front">
              <PortalChatRobot />
            </span>
            <span className="portal-chat__companion-side">
              <PortalChatRobot profile />
            </span>
          </div>
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
              onClick={closeChat}
            >
              <XIcon size={20} aria-hidden="true" />
            </button>
          </header>

          <p id="portal-chat-description" className="portal-chat__description">
            {demoEnabled
              ? 'Ask about the fictional invoices and service jobs in this demo.'
              : 'The assistant is currently available in the local demo.'}
          </p>

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

          {demoEnabled && (
            <>
              <form className="portal-chat__form" onSubmit={handleSubmit}>
                <label>
                  Your question
                  <span className="portal-chat__input" data-value={question}>
                    <textarea
                      name="chat-question"
                      placeholder="How much do I owe?"
                      rows={1}
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
                  </span>
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