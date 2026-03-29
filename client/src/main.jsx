import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {GoogleOAuthProvider} from '@react-oauth/google'

const clientId="259624968087-tgkh2467e0hgpih7uq28tsrhearsi9q7.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App/>
    </GoogleOAuthProvider>
  </StrictMode>,
)
