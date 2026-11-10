import { Component } from 'react'
import ErrorPage from './ErrorPage'

// Catches any crash while a page is drawing and shows the 500 page
// instead of a blank white screen.
// resetKey: when it changes (the route), the boundary tries again.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    // Send this to your logging service later.
    console.error('Page crashed:', error, info.componentStack)
  }

  componentDidUpdate(prev) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) return <ErrorPage type="server" />
    return this.props.children
  }
}