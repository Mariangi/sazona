import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { defineCustomElements } from '@ionic/pwa-elements/loader'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

defineCustomElements(window)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
