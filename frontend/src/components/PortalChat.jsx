import { useRef } from 'react'
import { ChatCircleDotsIcon, XIcon } from '@phosphor-icons/react'
import './PortalChat.css'

export default function PortalChat() {
  const dialogRef = useRef(null)

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
          Chat setup is in progress. Once connected, you can ask about
          invoices, service jobs, and your account.
        </p>
      </dialog>
    </div>
  )
}