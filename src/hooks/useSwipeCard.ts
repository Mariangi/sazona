import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";

export type SwipeDirection = "left" | "right" | "up";

export interface UseSwipeCardOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onTap?: () => void;
  disabled?: boolean;
}

const SWIPE_DISTANCE_THRESHOLD = 100;
const REVEAL_DISTANCE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.5;
const TAP_MAX_MOVEMENT = 8;
const TAP_MAX_DURATION = 300;
const EXIT_DURATION_MS = 300;
const SNAPBACK_DURATION_MS = 250;
const AXIS_INTENT_THRESHOLD = 10;
const REVEAL_LIFT_MAX = 140;
const ROTATE_MAX_DEG = 20;

interface Point {
  x: number;
  y: number;
  t: number;
}

export function useSwipeCard({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap,
  disabled,
}: UseSwipeCardOptions) {
  const ref = useRef<HTMLDivElement | null>(null);
  const originRef = useRef<Point | null>(null);
  const samplesRef = useRef<Point[]>([]);
  const axisLockRef = useRef<"x" | "y" | null>(null);
  const exitingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const setTransform = useCallback(
    (dx: number, dy: number, rotate: number, transition = "none") => {
      const el = ref.current;
      if (!el) return;
      el.style.transition = transition;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
    },
    []
  );

  const reset = useCallback(() => {
    originRef.current = null;
    samplesRef.current = [];
    axisLockRef.current = null;
    pointerIdRef.current = null;
  }, []);

  const snapBack = useCallback(() => {
    setTransform(0, 0, 0, `transform ${SNAPBACK_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`);
    reset();
  }, [setTransform, reset]);

  const commit = useCallback(
    (direction: SwipeDirection, dyAtRelease = 0) => {
      if (direction === "up") {
        setTransform(0, 0, 0, `transform ${SNAPBACK_DURATION_MS}ms ease`);
        reset();
        onSwipeUp?.();
        return;
      }
      exitingRef.current = true;
      const width = ref.current?.offsetWidth ?? 400;
      const flyX = direction === "right" ? width * 1.2 : -width * 1.2;
      const flyRotate = direction === "right" ? 30 : -30;
      setTransform(flyX, dyAtRelease * 0.4, flyRotate, `transform ${EXIT_DURATION_MS}ms ease-out`);
      reset();
      setTimeout(() => {
        exitingRef.current = false;
        if (direction === "right") onSwipeRight?.();
        else onSwipeLeft?.();
      }, EXIT_DURATION_MS);
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, setTransform, reset]
  );

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (disabled || exitingRef.current) return;
      commit(direction);
    },
    [disabled, commit]
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled || exitingRef.current) return;
      const el = ref.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
      const point = { x: e.clientX, y: e.clientY, t: performance.now() };
      originRef.current = point;
      samplesRef.current = [point];
      axisLockRef.current = null;
    },
    [disabled]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!originRef.current || pointerIdRef.current !== e.pointerId) return;
      const point = { x: e.clientX, y: e.clientY, t: performance.now() };
      samplesRef.current.push(point);
      if (samplesRef.current.length > 5) samplesRef.current.shift();

      const dx = point.x - originRef.current.x;
      const dy = point.y - originRef.current.y;

      if (
        !axisLockRef.current &&
        Math.max(Math.abs(dx), Math.abs(dy)) > AXIS_INTENT_THRESHOLD
      ) {
        axisLockRef.current =
          Math.abs(dy) > Math.abs(dx) * 1.2 && dy < 0 ? "y" : "x";
      }

      if (axisLockRef.current === "y") {
        const clampedDy = Math.max(-REVEAL_LIFT_MAX, Math.min(0, dy));
        setTransform(0, clampedDy, 0);
      } else if (axisLockRef.current === "x") {
        const rotate = Math.max(-ROTATE_MAX_DEG, Math.min(ROTATE_MAX_DEG, dx * 0.08));
        setTransform(dx, dy * 0.4, rotate);
      }
    },
    [setTransform]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!originRef.current || pointerIdRef.current !== e.pointerId) return;
      const origin = originRef.current;
      const first = samplesRef.current[0] ?? origin;
      const last = samplesRef.current[samplesRef.current.length - 1] ?? origin;
      const dx = last.x - origin.x;
      const dy = last.y - origin.y;
      const dt = Math.max(1, last.t - first.t);
      const vx = (last.x - first.x) / dt;
      const vy = (last.y - first.y) / dt;
      const duration = last.t - origin.t;
      const movement = Math.max(Math.abs(dx), Math.abs(dy));
      const axis = axisLockRef.current;

      if (!axis && movement < TAP_MAX_MOVEMENT && duration < TAP_MAX_DURATION) {
        reset();
        onTap?.();
        return;
      }

      if (axis === "y") {
        if (-dy > REVEAL_DISTANCE_THRESHOLD || vy < -VELOCITY_THRESHOLD) {
          commit("up");
        } else {
          snapBack();
        }
        return;
      }

      if (Math.abs(dx) > SWIPE_DISTANCE_THRESHOLD || Math.abs(vx) > VELOCITY_THRESHOLD) {
        commit(dx > 0 ? "right" : "left", dy);
      } else {
        snapBack();
      }
    },
    [commit, snapBack, onTap, reset]
  );

  const onPointerCancel = useCallback(() => {
    if (!originRef.current) return;
    snapBack();
  }, [snapBack]);

  return {
    ref,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    triggerSwipe,
  };
}
