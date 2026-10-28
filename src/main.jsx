// @ts-check
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
// En premier : main.scss fixe l’ordre des couches CSS
import './styles/main.scss';
import Loader from './ui/modules/site/Loader';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

// Le nom du site est peint : Element Timing le dit (Chromium) ; ailleurs, on
// attend sa police et deux images. Jamais plus d’une seconde (onglet caché).
function siteNamePainted() {
  const painted = PerformanceObserver.supportedEntryTypes?.includes('element')
    ? new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        if (!list.getEntries().some((entry) => entry.identifier === 'site-name')) return;
        observer.disconnect();
        resolve();
      });
      observer.observe({ type: 'element', buffered: true });
    })
    : document.fonts.load('900 1em "Nunito Title"').catch(() => {}).then(nextFrame).then(nextFrame);
  return Promise.race([painted, new Promise((resolve) => setTimeout(resolve, 1000))]);
}

// La 3D (three, l’app : ~400 ko) ne se charge qu’une fois l’écran de
// chargement peint, nom compris : elle ne lui prend pas le réseau, et le LCP
// reste la première image
const App = lazy(() => siteNamePainted().then(() => import('./app/App.jsx')));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<Loader />}>
      <App />
    </Suspense>
  </StrictMode>
);
