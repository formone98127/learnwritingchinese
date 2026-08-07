import { useCallback, useRef } from 'react';
import { unstable_createElement as createElement } from 'react-native-web';

import type { Point } from '@/lib/types';

type Props = {
  id: string;
  size: number;
  onGrant: (p: Point) => void;
  onMove: (p: Point) => void;
  onRelease: () => void;
};

/** Transparent DOM capture layer — survives RN-web re-mounts; uses capture-phase touch/pointer listeners. */
export function WebPadSurface({ id, size, onGrant, onMove, onRelease }: Props) {
  const cleanupRef = useRef<(() => void) | null>(null);
  const onGrantRef = useRef(onGrant);
  const onMoveRef = useRef(onMove);
  const onReleaseRef = useRef(onRelease);
  onGrantRef.current = onGrant;
  onMoveRef.current = onMove;
  onReleaseRef.current = onRelease;

  const bindRef = useCallback(
    (el: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!el) return;

      el.style.touchAction = 'none';

      let activePointer: number | null = null;
      let touching = false;

      const toLocal = (clientX: number, clientY: number): Point => {
        const rect = el.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      const onPointerDown = (ev: PointerEvent) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        activePointer = ev.pointerId;
        ev.preventDefault();
        ev.stopPropagation();
        try {
          el.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        onGrantRef.current(toLocal(ev.clientX, ev.clientY));
      };

      const onPointerMove = (ev: PointerEvent) => {
        if (activePointer !== ev.pointerId) return;
        ev.preventDefault();
        onMoveRef.current(toLocal(ev.clientX, ev.clientY));
      };

      const endPointer = (ev: PointerEvent) => {
        if (activePointer !== ev.pointerId) return;
        activePointer = null;
        onReleaseRef.current();
      };

      const onTouchStart = (ev: TouchEvent) => {
        if (touching) return;
        touching = true;
        ev.preventDefault();
        ev.stopPropagation();
        const t = ev.changedTouches[0];
        if (t) onGrantRef.current(toLocal(t.clientX, t.clientY));
      };

      const onTouchMove = (ev: TouchEvent) => {
        if (!touching) return;
        ev.preventDefault();
        const t = ev.changedTouches[0] ?? ev.touches[0];
        if (t) onMoveRef.current(toLocal(t.clientX, t.clientY));
      };

      const onTouchEnd = (ev: TouchEvent) => {
        if (!touching) return;
        touching = false;
        ev.preventDefault();
        onReleaseRef.current();
      };

      const useTouch = typeof window !== 'undefined' && 'ontouchstart' in window;

      const opts = { passive: false, capture: true } as const;

      if (useTouch) {
        el.addEventListener('touchstart', onTouchStart, opts);
        el.addEventListener('touchmove', onTouchMove, opts);
        el.addEventListener('touchend', onTouchEnd, opts);
        el.addEventListener('touchcancel', onTouchEnd, opts);
        cleanupRef.current = () => {
          el.removeEventListener('touchstart', onTouchStart, true);
          el.removeEventListener('touchmove', onTouchMove, true);
          el.removeEventListener('touchend', onTouchEnd, true);
          el.removeEventListener('touchcancel', onTouchEnd, true);
        };
      } else {
        el.addEventListener('pointerdown', onPointerDown, opts);
        el.addEventListener('pointermove', onPointerMove, opts);
        el.addEventListener('pointerup', endPointer, opts);
        el.addEventListener('pointercancel', endPointer, opts);
        cleanupRef.current = () => {
          el.removeEventListener('pointerdown', onPointerDown, true);
          el.removeEventListener('pointermove', onPointerMove, true);
          el.removeEventListener('pointerup', endPointer, true);
          el.removeEventListener('pointercancel', endPointer, true);
        };
      }
    },
    [id, size],
  );

  return createElement('div', {
    id,
    ref: bindRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: size,
      height: size,
      zIndex: 10,
      touchAction: 'none',
      cursor: 'crosshair',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      background: 'transparent',
    },
  });
}
