// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { EntitlementsProvider } from "@/context/EntitlementsContext";
// ...
<EntitlementsProvider>
  <App />
</EntitlementsProvider>

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
