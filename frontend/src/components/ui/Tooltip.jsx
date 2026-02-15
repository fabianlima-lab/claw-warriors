'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Tooltip — Contextual help for ClawWarriors terminology.
 *
 * Usage:
 *   <Tooltip term="soulForge">Soul Forge</Tooltip>
 *   <Tooltip term="deepMemory" side="top">Deep Memory</Tooltip>
 *
 * The `term` key maps to Glossary.{term}Tip in i18n.
 * Renders an underline-dotted trigger; hover (desktop) or tap (mobile) shows popup.
 */
export default function Tooltip({ children, tip, side = 'bottom', className = '' }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(side);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Auto-flip if tooltip would overflow viewport
  useEffect(() => {
    if (open && tooltipRef.current && triggerRef.current) {
      const tipRect = tooltipRef.current.getBoundingClientRect();
      const trigRect = triggerRef.current.getBoundingClientRect();

      if (side === 'bottom' && tipRect.bottom > window.innerHeight - 8) {
        setPosition('top');
      } else if (side === 'top' && trigRect.top - tipRect.height < 8) {
        setPosition('bottom');
      } else {
        setPosition(side);
      }
    }
  }, [open, side]);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleEnter() {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function handleLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  function handleToggle(e) {
    e.stopPropagation();
    setOpen((prev) => !prev);
  }

  const positionClasses =
    position === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center gap-1 cursor-help ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleToggle}
    >
      {children}
      <svg
        className="w-3.5 h-3.5 text-txt-dim shrink-0 opacity-60"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 1.2A5.8 5.8 0 1013.8 8 5.8 5.8 0 008 2.2zM8 11a.75.75 0 110 1.5.75.75 0 010-1.5zm0-6.5a2.25 2.25 0 012.25 2.25c0 .87-.52 1.37-1.02 1.85l-.18.17c-.38.37-.55.6-.55 1.03a.5.5 0 01-1 0c0-.82.41-1.27.87-1.72l.2-.19c.46-.44.68-.7.68-1.14a1.25 1.25 0 00-2.5 0 .5.5 0 01-1 0A2.25 2.25 0 018 4.5z" />
      </svg>

      {open && (
        <span
          ref={tooltipRef}
          className={`absolute z-50 w-56 px-3 py-2.5 text-xs leading-relaxed text-txt-body bg-elevated border border-border rounded-[var(--radius-btn)] shadow-lg pointer-events-auto animate-[fadeSlideUp_0.15s_ease-out] ${positionClasses}`}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
