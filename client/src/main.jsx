import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import CSS in the correct order
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/PageLayout.css'
import './styles/ModernInputs.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
