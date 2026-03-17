import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// ── Global Ripple Click Effect ─────────────────────────
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, a, [role="button"], .ripple-trigger');
  if (!target) return;

  // Add ripple-container class if not already
  if (!target.style.position || target.style.position === 'static') {
    target.style.position = 'relative';
  }
  target.style.overflow = 'hidden';

  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  // Dark ripple on light backgrounds
  const bg = window.getComputedStyle(target).backgroundColor;
  const isLight = bg.includes('255, 255') || bg.includes('251, 191') || bg === 'rgba(0, 0, 0, 0)';
  if (isLight) ripple.style.background = 'rgba(0,0,0,0.1)';
  else ripple.style.background = 'rgba(255,255,255,0.3)';

  ripple.style.cssText += `
    width:${size}px; height:${size}px;
    left:${x}px; top:${y}px;
    position:absolute; border-radius:50%;
    pointer-events:none;
    animation: clickRipple 0.55s linear forwards;
    transform: scale(0);
  `;
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
