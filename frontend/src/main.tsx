import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Force dark theme by default for developer aesthetic (user can toggle)
if (!localStorage.getItem('theme')) {
  document.documentElement.classList.add('dark')
  localStorage.setItem('theme', 'dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
