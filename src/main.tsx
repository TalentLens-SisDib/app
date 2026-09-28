import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import UiPlayground from './pages/UiPlayground.tsx'
import { Toaster } from './components/ui/Toast.tsx'

const isPlayground = window.location.pathname.startsWith('/ui-playground')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPlayground ? <UiPlayground /> : <App />}
    <Toaster />
  </StrictMode>,
)
