import { describe, it, expect, vi, afterEach } from 'vitest';
import { isElementFocusable, getFocusableElements } from '../../hooks/useModalAccessibility';

type MockStyle = { display: string; visibility: string };

function createMockElement(opts: {
  disabled?: boolean;
  inert?: boolean;
  ariaHidden?: boolean;
  hidden?: boolean;
  display?: string;
  visibility?: string;
  parentElement?: HTMLElement | null;
}): HTMLElement {
  const el = {
    disabled: Boolean(opts.disabled),
    parentElement: opts.parentElement ?? null,
    closest: (selector: string) => {
      if (selector.includes('[inert]') && opts.inert) return el;
      if (selector.includes('[aria-hidden="true"]') && opts.ariaHidden) return el;
      if (selector.includes('[hidden]') && opts.hidden) return el;
      return null;
    },
    _style: {
      display: opts.display ?? 'block',
      visibility: opts.visibility ?? 'visible',
    } as MockStyle,
  };
  return el as unknown as HTMLElement;
}

describe('useModalAccessibility - isElementFocusable & getFocusableElements', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('excludes disabled, inert, aria-hidden, hidden, display:none, and visibility:hidden elements', () => {
    vi.stubGlobal('window', {
      getComputedStyle: (node: { _style?: MockStyle }) =>
        node._style ?? { display: 'block', visibility: 'visible' },
    });

    const visibleBtn = createMockElement({});
    const disabledBtn = createMockElement({ disabled: true });
    const inertBtn = createMockElement({ inert: true });
    const ariaHiddenBtn = createMockElement({ ariaHidden: true });
    const hiddenAttrBtn = createMockElement({ hidden: true });
    const displayNoneBtn = createMockElement({ display: 'none' });
    const visibilityHiddenBtn = createMockElement({ visibility: 'hidden' });
    const hiddenAncestor = createMockElement({ display: 'none' });
    const childOfHiddenAncestor = createMockElement({ parentElement: hiddenAncestor });

    expect(isElementFocusable(visibleBtn)).toBe(true);
    expect(isElementFocusable(disabledBtn)).toBe(false);
    expect(isElementFocusable(inertBtn)).toBe(false);
    expect(isElementFocusable(ariaHiddenBtn)).toBe(false);
    expect(isElementFocusable(hiddenAttrBtn)).toBe(false);
    expect(isElementFocusable(displayNoneBtn)).toBe(false);
    expect(isElementFocusable(visibilityHiddenBtn)).toBe(false);
    expect(isElementFocusable(childOfHiddenAncestor)).toBe(false);
  });

  it('preserves position:fixed elements even when offsetParent is null', () => {
    vi.stubGlobal('window', {
      getComputedStyle: (node: { _style?: MockStyle }) =>
        node._style ?? { display: 'block', visibility: 'visible' },
    });

    const fixedBtn = createMockElement({});
    // offsetParent is undefined/null in Node and null for position:fixed in browsers
    expect((fixedBtn as unknown as { offsetParent: null }).offsetParent).toBeUndefined();
    expect(isElementFocusable(fixedBtn)).toBe(true);
  });

  it('filters container querySelectorAll results via getFocusableElements', () => {
    vi.stubGlobal('window', {
      getComputedStyle: (node: { _style?: MockStyle }) =>
        node._style ?? { display: 'block', visibility: 'visible' },
    });

    const btn1 = createMockElement({});
    const btnInert = createMockElement({ inert: true });
    const btn2 = createMockElement({});

    const mockContainer = {
      querySelectorAll: () => [btn1, btnInert, btn2],
    } as unknown as HTMLElement;

    const result = getFocusableElements(mockContainer);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(btn1);
    expect(result[1]).toBe(btn2);
  });
});
