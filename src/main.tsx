import React from 'react';
import ReactDOM from 'react-dom/client';
import { OverlayScrollbars } from 'overlayscrollbars';
import 'overlayscrollbars/overlayscrollbars.css';
import App from './App';
import './i18n';
import './styles/globals.css';
import { registerBuiltinViews } from './layouts/registerViews';

// Expose stores for e2e test access in dev mode
if (import.meta.env.DEV) {
  import('./store/projectStore').then((m) => {
    (window as { __zustand_projectStore?: typeof m.useProjectStore }).__zustand_projectStore = m.useProjectStore;
  });
  import('./store/editorStore').then((m) => {
    (window as { __zustand_editorStore?: typeof m.useEditorStore }).__zustand_editorStore = m.useEditorStore;
  });
}

registerBuiltinViews();

// Opt-in OverlayScrollbars: only elements with [data-os-scrollbar] get wrapped.
// The global auto-detect approach (wrapping all overflow:auto/scroll) is
// incompatible with React because OverlayScrollbars restructures the DOM,
// which breaks React's internal DOM references during commit phases.
const osOptions = {
  scrollbars: {
    theme: 'os-theme-light' as const,
    autoHide: 'move' as const,
    autoHideDelay: 800,
  },
};

const managed = new WeakSet<Element>();

function initScrollbars(root: Element) {
  root.querySelectorAll('[data-os-scrollbar]').forEach((el) => {
    if (el instanceof HTMLElement && !managed.has(el)) {
      managed.add(el);
      OverlayScrollbars(el, osOptions);
    }
  });
}

// Observe DOM changes to catch dynamically added opt-in scrollable elements
let scanQueued = false;
const observer = new MutationObserver((mutations) => {
  const hasRelevant = mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (n) =>
        n instanceof HTMLElement &&
        !n.classList.contains('os-scrollbar') &&
        !n.hasAttribute('data-overlayscrollbars-contents'),
    ),
  );
  if (!hasRelevant || scanQueued) return;
  scanQueued = true;
  // Use setTimeout instead of rAF to let React fully finish its commit
  // phase before OverlayScrollbars restructures the DOM.
  setTimeout(() => {
    initScrollbars(document.body);
    scanQueued = false;
  }, 0);
});

// Initial pass + start observing
requestAnimationFrame(() => {
  initScrollbars(document.body);
  observer.observe(document.body, { childList: true, subtree: true });
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
