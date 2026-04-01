import React from "react";
import ReactDOM from "react-dom/client";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";
import App from "./App";
import "./i18n";
import "./styles/globals.css";
import { registerBuiltinViews } from "./layouts/registerViews";

registerBuiltinViews();

// Auto-initialize OverlayScrollbars on all scrollable elements
const osOptions = {
  scrollbars: {
    theme: 'os-theme-light' as const,
    autoHide: 'move' as const,
    autoHideDelay: 800,
  },
};

const managed = new WeakSet<Element>();

function isScrollable(el: Element): boolean {
  // Skip OverlayScrollbars' own elements to avoid infinite loop
  if (el.closest('[data-overlayscrollbars]') && el !== el.closest('[data-overlayscrollbars]')) return false;
  if (el.classList.contains('os-scrollbar') || el.closest('.os-scrollbar')) return false;
  const style = getComputedStyle(el);
  const overflowX = style.overflowX;
  const overflowY = style.overflowY;
  return (
    overflowX === 'auto' || overflowX === 'scroll' ||
    overflowY === 'auto' || overflowY === 'scroll'
  );
}

function initScrollbars(root: Element) {
  // Check the root itself
  if (root instanceof HTMLElement && isScrollable(root) && !managed.has(root)) {
    managed.add(root);
    OverlayScrollbars(root, osOptions);
  }
  // Check descendants
  root.querySelectorAll('*').forEach(el => {
    if (el instanceof HTMLElement && isScrollable(el) && !managed.has(el)) {
      managed.add(el);
      OverlayScrollbars(el, osOptions);
    }
  });
}

// Observe DOM changes to catch dynamically added scrollable elements
let scanQueued = false;
const observer = new MutationObserver((mutations) => {
  // Skip if mutations are only from OverlayScrollbars internals
  const hasRelevant = mutations.some(m =>
    Array.from(m.addedNodes).some(n =>
      n instanceof HTMLElement && !n.classList.contains('os-scrollbar') && !n.hasAttribute('data-overlayscrollbars-contents')
    )
  );
  if (!hasRelevant || scanQueued) return;
  scanQueued = true;
  requestAnimationFrame(() => {
    initScrollbars(document.body);
    scanQueued = false;
  });
});

// Initial pass + start observing
requestAnimationFrame(() => {
  initScrollbars(document.body);
  observer.observe(document.body, { childList: true, subtree: true });
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
