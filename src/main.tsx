import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled so the app works offline and never calls out to a font CDN.
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/dm-mono/400.css'
import '@fontsource/dm-mono/500.css'
import './index.css'
import App from './App.tsx'

/** If anything throws while rendering, show a way back instead of a blank screen. */
class Recover extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="screen crash">
        <h1 className="title">Something broke.</h1>
        <p className="modal-text">IT has been notified. (They have not.) Your progress is saved.</p>
        <button className="btn btn-primary btn-big" onClick={() => location.reload()}>
          Reload
        </button>
      </main>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Recover>
      <App />
    </Recover>
  </StrictMode>,
)
