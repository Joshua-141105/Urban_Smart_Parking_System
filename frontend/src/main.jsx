import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { WebSocketProvider } from './context/WebSocketContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
