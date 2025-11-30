import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.js'
import { CssBaseline, extendTheme, CssVarsProvider as JoyCssVarsProvider } from '@mui/joy'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './store.js'
import { BrowserRouter } from 'react-router'
import GeoLocation from './Location.js'


declare module '@mui/joy/styles' {
  interface PaletteBackgroundOverrides {
    menu: true;
  }
  interface PaletteTextOverrides {
    contrast: true;
  }
}

const theme = extendTheme({
  "colorSchemes": {
    "light": {
      "palette": {
        "background": {
          "menu": "var(--joy-palette-primary-400)"
        },
        "text": {
          "contrast": "var(--joy-palette-neutral-100)"
        }
      }
    },
    "dark": {
      "palette": {}
    }
  }
});
const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <JoyCssVarsProvider theme={theme}>
            <GeoLocation />
            <CssBaseline />
            <App />
          </JoyCssVarsProvider>
        </Provider>
      </BrowserRouter>
    </StrictMode>,
  )
}