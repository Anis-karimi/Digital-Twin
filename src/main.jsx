import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App.jsx'
import { ThemeProvider } from './Context/ThemeContext.jsx'

// Prevent mobile Chrome keyboard dismiss viewport scroll displacement
if (typeof window !== 'undefined') {
  window.addEventListener('focusout', (e) => {
    if (
      e.target &&
      (e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT')
    ) {
      setTimeout(() => {
        window.scrollTo(0, 0);
        if (document.scrollingElement) {
          document.scrollingElement.scrollTop = 0;
          document.scrollingElement.scrollLeft = 0;
        }
      }, 80);
    }
  });

  // Prevent unwanted rubber-band / pull-to-refresh on outer document root
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.target === document.documentElement || e.target === document.body) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>,
)
