import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import './index.css'
import App from './App.tsx'
import corporateTheme from './theme/corporateTheme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={corporateTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
