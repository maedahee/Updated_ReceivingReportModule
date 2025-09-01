import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ReceivingReport from './NEWPAGES/NewReceivingReport.jsx'
import ValidationPage from './NEWPAGES/NewValidationPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ValidationPage/>
    {/*<ReceivingReport/>*/}
  </StrictMode>,
)
