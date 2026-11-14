import { useLayoutEffect, useRef } from 'react'

export default function useServiceFilterGlide(selected, ready) {
  const tabsRef = useRef(null)

  useLayoutEffect(() => {
    const tabs = tabsRef.current
    if (!ready || !tabs) return

    const button = tabs.querySelector('.sv-tab[aria-pressed="true"]')
    if (!button) {
      delete tabs.dataset.glideReady
      return
    }

    function positionHighlight() {
      tabs.style.setProperty('--sv-tab-x', `${button.offsetLeft}px`)
      tabs.style.setProperty('--sv-tab-y', `${button.offsetTop}px`)
      tabs.style.setProperty('--sv-tab-width', `${button.offsetWidth}px`)
      tabs.style.setProperty('--sv-tab-height', `${button.offsetHeight}px`)
      tabs.dataset.glideReady = 'true'
    }

    positionHighlight()

    const observer = new ResizeObserver(positionHighlight)
    observer.observe(tabs)
    tabs.querySelectorAll('.sv-tab').forEach(tab => observer.observe(tab))
    return () => observer.disconnect()
  }, [selected, ready])

  return tabsRef
}