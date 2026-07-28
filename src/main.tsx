import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { initSpeech, unlockSpeech } from './speech'

registerSW({ immediate: true })
initSpeech()

const unlock = () => {
  unlockSpeech()
  window.removeEventListener('touchstart', unlock)
  window.removeEventListener('pointerdown', unlock)
}
window.addEventListener('touchstart', unlock, { once: true, passive: true })
window.addEventListener('pointerdown', unlock, { once: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
