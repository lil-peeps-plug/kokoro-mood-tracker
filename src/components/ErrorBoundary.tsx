import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  /** Render prop — receives the reset callback so the fallback can offer a "try again" button. */
  fallback: (reset: () => void, error: Error | null) => ReactNode
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Top-level React error boundary. Catches render-time errors inside
 * the subtree so a single broken component doesn't crash the whole UI
 * to a white screen. Logs the error to the console for debugging,
 * shows the localized fallback, and lets the user retry.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The full error is in the console — keep it loud during dev,
    // silent-but-recorded in prod.
    // eslint-disable-next-line no-console
    console.error('Kokoro caught:', error, info)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return this.props.fallback(this.reset, this.state.error)
    }
    return this.props.children
  }
}
