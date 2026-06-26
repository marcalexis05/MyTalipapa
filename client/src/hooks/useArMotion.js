import { useState, useEffect, useRef } from 'react';

// Shared physical step size calculation (using 30px roughly per step based on METERS_PER_PIXEL)
export const getStepSize = (currentY) => 30;

export function useArMotion(initialX = 1050, initialY = 1720) {
  const [motionActive, setMotionActive] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [heading, setHeading] = useState(0);
  const [hasOrientation, setHasOrientation] = useState(false);
  
  const [userX, setUserX] = useState(initialX);
  const [userY, setUserY] = useState(initialY);

  const headingRef = useRef(0);
  const headingBufferRef = useRef([]);
  const userYRef = useRef(initialY);

  // Keep refs in sync for handlers
  useEffect(() => { headingRef.current = heading; }, [heading]);
  useEffect(() => { userYRef.current = userY; }, [userY]);

  // Step Detection
  useEffect(() => {
    if (!motionActive) return;

    let smoothedMag = 0;
    let wasRising = false;
    let lastStepTime = 0;
    const STEP_THRESHOLD = 2.5;  
    const STEP_COOLDOWN = 350;   

    const handleMotion = (e) => {
      const acc = e.acceleration?.x != null ? e.acceleration : e.accelerationIncludingGravity;
      if (!acc || acc.x == null) return;

      const vertMag = Math.abs(acc.z ?? 0);
      const ALPHA = 0.75;
      smoothedMag = ALPHA * smoothedMag + (1 - ALPHA) * vertMag;

      const currentlyRising = vertMag > prevSmoothed;
      const isPeak = wasRising && !currentlyRising && smoothedMag > STEP_THRESHOLD;
      wasRising = currentlyRising;

      const now = Date.now();
      if (isPeak && now - lastStepTime > STEP_COOLDOWN) {
        lastStepTime = now;
        const buf = headingBufferRef.current;
        const avgHeading = buf.length
          ? buf.reduce((a, b) => a + b, 0) / buf.length
          : headingRef.current;

        const rad = (avgHeading * Math.PI) / 180;
        const STEP_SIZE = getStepSize(userYRef.current);
        setUserX(x => Math.max(30, Math.min(2270, x + Math.round(Math.sin(rad) * STEP_SIZE))));
        setUserY(y => Math.max(30, Math.min(1790, y - Math.round(Math.cos(rad) * STEP_SIZE))));
        setStepCount(c => c + 1);
      }
    };

    const requestAndListen = async () => {
      if (typeof DeviceMotionEvent?.requestPermission === 'function') {
        try {
          const perm = await DeviceMotionEvent.requestPermission();
          if (perm !== 'granted') {
            setMotionActive(false);
            return;
          }
        } catch {
          setMotionActive(false);
          return;
        }
      }
      window.addEventListener('devicemotion', handleMotion);
    };

    requestAndListen();
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [motionActive]);

  const requestCompassPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === "function") {
      try {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r === "granted") setHasOrientation(true);
      } catch (err) { console.error(err); }
    }
  };

  const handleStepForward = () => {
    const rad = (heading * Math.PI) / 180;
    const step = getStepSize(userYRef.current);
    setUserX(x => Math.max(30, Math.min(2270, x + Math.round(Math.sin(rad) * step))));
    setUserY(y => Math.max(30, Math.min(1790, y - Math.round(Math.cos(rad) * step))));
  };

  const handleRotateLeft = () => setHeading(h => (h - 15 + 360) % 360);
  const handleRotateRight = () => setHeading(h => (h + 15) % 360);

  return {
    motionActive, setMotionActive,
    stepCount, setStepCount,
    heading, setHeading,
    hasOrientation, setHasOrientation,
    userX, setUserX,
    userY, setUserY,
    headingBufferRef,
    requestCompassPermission,
    handleStepForward,
    handleRotateLeft,
    handleRotateRight
  };
}
