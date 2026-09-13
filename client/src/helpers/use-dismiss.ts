import { useEffect, type RefObject } from 'react';

/**
 * Closes an open overlay when the pointer goes down anywhere outside it, or on Escape.
 *
 * Every dropdown, menu and popover in the app dismisses this way, so the behaviour lives here
 * rather than being re-implemented per component — a menu that stays open after you click past it
 * is the kind of thing that only gets noticed once it is already shipped.
 *
 * Pass more than one ref when the overlay is split across the DOM, as a portalled panel is: the
 * trigger and the panel are both "inside", even though neither contains the other.
 */
export function useDismiss(
  isOpen: boolean,
  onDismiss: () => void,
  refs: RefObject<HTMLElement | null>[]
): void {
  useEffect(() => {
    if (!isOpen) return;

    const isInside = (target: Node | null) =>
      refs.some((ref) => ref.current?.contains(target as Node));

    // mousedown rather than click: the menu should go away as the press starts, and a click
    // listener would also fire for a press that began inside and drifted out.
    const handlePointerDown = (event: MouseEvent) => {
      if (!isInside(event.target as Node)) onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // The refs array is rebuilt on every render by callers that inline it, so it is deliberately
    // not a dependency — its contents are read at event time, never at subscribe time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onDismiss]);
}
