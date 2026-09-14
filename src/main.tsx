import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ClubAdmin from './ClubAdmin'
import CloudGate from './CloudGate'
import './styles.css'
import './cloud.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}

function BarakAppRoot() {
  const [adminOpen, setAdminOpen] = useState(false)

  function closeAdmin() {
    setAdminOpen(false)
    window.location.reload()
  }

  return <CloudGate>
    <App />
    {!adminOpen && <button className="ghost-btn club-admin-launcher" onClick={() => setAdminOpen(true)}>Equipos y porteros</button>}
    {adminOpen && <ClubAdmin onClose={closeAdmin} />}
  </CloudGate>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BarakAppRoot />
  </React.StrictMode>,
)
