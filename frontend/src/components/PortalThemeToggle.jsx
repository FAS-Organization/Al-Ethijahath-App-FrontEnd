import { MoonIcon, SunIcon } from '@phosphor-icons/react'

export default function PortalThemeToggle({ theme, onToggleTheme }) {
  return (
    <button
      type="button"
      className="ed-icon-button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      onClick={onToggleTheme}
    >
      {theme === 'light'
        ? <MoonIcon size={21} aria-hidden="true" />
        : <SunIcon size={21} aria-hidden="true" />}
    </button>
  )
}
