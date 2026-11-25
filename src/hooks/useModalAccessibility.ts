import { useEffect, useRef, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Checks whether an element is genuinely visible and focusable:
 * - Excludes disabled, [inert], [aria-hidden="true"], and [hidden] subtrees
 * - Excludes display:none and visibility:hidden on the element or ancestors
 * - Does NOT rely on offsetParent, so position:fixed elements are preserved
 */
export function isElementFocusable(el: HTMLElement): boolean {
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.closest('[inert], [aria-hidden="true"], [hidden]')) return false;

  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    let parent: HTMLElement | null = el.parentElement;
    while (parent) {
      const pStyle = window.getComputedStyle(parent);
      if (pStyle.display === 'none' || pStyle.visibility === 'hidden') return false;
      parent = parent.parentElement;
    }
  }

  return true;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    isElementFocusable
  );
}

interface UseModalAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  modalRef: RefObject<HTMLElement | null>;
}

/**
 * Provides WCAG 2.2 AA keyboard & focus management for modal dialogs:
 * - Moves focus into the modal on open
 * - Traps Tab / Shift+Tab within focusable elements inside the modal
 * - Closes on Escape key
 * - Locks body scroll while open
 * - Restores focus to the triggering element on close
 */
export function useModalAccessibility({
  isOpen,
  onClose,
  modalRef,
}: UseModalAccessibilityOptions): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const container = modalRef.current;
      if (!container) return;
      const focusables = getFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        container.focus();
      }
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const container = modalRef.current;
        if (!container) return;

        const focusables = getFocusableElements(container);

        if (focusables.length === 0) {
          e.preventDefault();
          container.focus();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !container.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !container.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;

      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (prev && prev.isConnected) {
        prev.focus();
      }
    };
  }, [isOpen, modalRef]);
}
