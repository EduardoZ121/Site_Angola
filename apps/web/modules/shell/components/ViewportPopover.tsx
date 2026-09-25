'use client';

import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type Box = { top: number; left: number; width: number; maxHeight: number };

/**
 * Header popovers render on document.body.
 * The top bar uses backdrop-filter, which traps position:fixed and clips panels on phones.
 * On narrow screens CSS pins the sheet to the viewport; these numbers are only a fallback.
 */
export function ViewportPopover({
  open,
  anchorRef,
  id,
  role = 'dialog',
  label,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  id?: string;
  role?: 'dialog' | 'menu';
  label?: string;
  children: ReactNode;
}) {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    if (!open) return;
    function place() {
      const anchor = anchorRef.current;
      const viewport = window.visualViewport;
      const vw = viewport?.width ?? window.innerWidth;
      const vh = viewport?.height ?? window.innerHeight;
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const offsetTop = viewport?.offsetTop ?? 0;
      const margin = 12;
      const width = Math.min(352, Math.max(220, vw - margin * 2));
      let left = margin;
      let top = offsetTop + 72;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        left = rect.right - width;
        top = rect.bottom + 8;
      }
      if (left < offsetLeft + margin) left = offsetLeft + margin;
      if (left + width > offsetLeft + vw - margin) {
        left = Math.max(offsetLeft + margin, offsetLeft + vw - margin - width);
      }
      const maxTop = offsetTop + vh - margin - 160;
      if (top > maxTop) top = Math.max(offsetTop + margin, maxTop);
      const maxHeight = Math.max(160, offsetTop + vh - top - margin);
      setBox({ top, left, width, maxHeight });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [open, anchorRef]);

  if (!open || !box || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id={id}
      role={role}
      aria-label={label}
      data-kuteka-popover=""
      className="kuteka-account-panel kuteka-account-panel--menu"
      style={{
        position: 'fixed',
        top: box.top,
        left: box.left,
        width: box.width,
        maxHeight: box.maxHeight,
        right: 'auto',
        marginTop: 0,
        zIndex: 90,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function isInsidePopover(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-kuteka-popover]'));
}
