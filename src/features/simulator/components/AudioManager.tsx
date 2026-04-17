import { useEffect, useMemo, useRef, useState } from 'react';
import { ASSET_PATHS } from '../../../shared/config/assets';
import { useSimulatorStore } from '../state/simulator.store';

function createLoopingAudio(src: string, volume: number) {
  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

function createOneShotAudio(src: string, volume: number) {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = volume;
  return audio;
}

export function AudioManager() {
  const debugBlocked = useSimulatorStore((state) => state.debugBlocked);
  const debugInput = useSimulatorStore((state) => state.debugInput);
  const gear = useSimulatorStore((state) => state.gear);
  const isReady = useSimulatorStore((state) => state.isReady);
  const rpm = useSimulatorStore((state) => state.rpm);
  const speedKph = useSimulatorStore((state) => state.speedKph);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const brakeLockRef = useRef(false);
  const crashLockRef = useRef(false);
  const longTurnStartRef = useRef<number | null>(null);

  const audio = useMemo(
    () => ({
      acceleration: createLoopingAudio(ASSET_PATHS.audio.acceleration, 0),
      brake: createOneShotAudio(ASSET_PATHS.audio.brake, 0.4),
      city: createLoopingAudio(ASSET_PATHS.audio.city, 0.18),
      crash: createOneShotAudio(ASSET_PATHS.audio.crash, 0.42),
      drift: createLoopingAudio(ASSET_PATHS.audio.drift, 0),
      horn: createOneShotAudio(ASSET_PATHS.audio.horn, 0.46),
      reverseBeep: createLoopingAudio(ASSET_PATHS.audio.reverseBeep, 0.22),
    }),
    [],
  );

  useEffect(() => {
    const unlockAudio = async () => {
      if (isUnlocked) {
        return;
      }

      try {
        await audio.city.play();
        await audio.acceleration.play();
        await audio.drift.play();
        await audio.reverseBeep.play();
        audio.acceleration.volume = 0;
        audio.drift.volume = 0;
        audio.reverseBeep.volume = 0;
        setIsUnlocked(true);
      } catch {
        // Ignore autoplay denials until the next user gesture.
      }
    };

    const handleHorn = async (event: KeyboardEvent) => {
      const code = `${event.code || event.key}`.toLowerCase();

      if (code !== 'keyf' && code !== 'f') {
        return;
      }

      event.preventDefault();

      if (!isUnlocked) {
        await unlockAudio();
      }

      try {
        audio.horn.currentTime = 0;
        await audio.horn.play();
      } catch {
        // Ignore blocked playback.
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('keydown', handleHorn);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('keydown', handleHorn);
    };
  }, [audio, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked || !isReady) {
      return;
    }

    const driveRatio = Math.min(speedKph / 140, 1);
    const throttlePressure = Math.abs(debugInput.throttle);
    const accelerationVolume =
      speedKph > 0 || throttlePressure > 0 ? 0.08 + driveRatio * 0.28 + throttlePressure * 0.12 : 0;

    audio.acceleration.volume = Math.min(accelerationVolume, 0.42);
    audio.acceleration.playbackRate = Math.min(0.7 + rpm / 5200, 1.9);

    if ((speedKph > 0 || throttlePressure > 0) && audio.acceleration.paused) {
      void audio.acceleration.play().catch(() => {});
    }

    if (speedKph === 0 && throttlePressure === 0 && !audio.acceleration.paused) {
      audio.acceleration.pause();
      audio.acceleration.currentTime = 0;
    }
  }, [audio, debugInput.throttle, isReady, isUnlocked, rpm, speedKph]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    if (audio.city.paused) {
      void audio.city.play().catch(() => {});
    }

    if (audio.drift.paused) {
      void audio.drift.play().catch(() => {});
    }
  }, [audio, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked || !isReady) {
      return;
    }

    const shouldPlayReverseBeep = gear === 'R';
    audio.reverseBeep.volume = shouldPlayReverseBeep ? 0.22 : 0;

    if (shouldPlayReverseBeep && audio.reverseBeep.paused) {
      void audio.reverseBeep.play().catch(() => {});
    }

    if (!shouldPlayReverseBeep && !audio.reverseBeep.paused) {
      audio.reverseBeep.pause();
      audio.reverseBeep.currentTime = 0;
    }
  }, [audio, gear, isReady, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    const isHardBrake = debugInput.brake && speedKph > 18;

    if (isHardBrake && !brakeLockRef.current) {
      brakeLockRef.current = true;
      audio.brake.currentTime = 0;
      void audio.brake.play().catch(() => {});
    }

    if (!debugInput.brake) {
      brakeLockRef.current = false;
    }
  }, [audio, debugInput.brake, isUnlocked, speedKph]);

  useEffect(() => {
    if (!isUnlocked || !isReady) {
      return;
    }

    const steerAmount = Math.abs(debugInput.steer);
    const driftRatio = Math.min(speedKph / 140, 1);
    const isLongTurnCandidate = speedKph > 100 && steerAmount > 0.2;
    const now = performance.now();

    if (isLongTurnCandidate) {
      longTurnStartRef.current ??= now;
    } else {
      longTurnStartRef.current = null;
    }

    const turnDuration =
      longTurnStartRef.current == null ? 0 : Math.max(0, now - longTurnStartRef.current);
    const sustainedTurnRatio = Math.min(Math.max((turnDuration - 900) / 300, 0), 1);
    const shouldDrift = sustainedTurnRatio > 0;

    audio.drift.volume = shouldDrift
      ? Math.min((0.12 + driftRatio * (0.16 + steerAmount * 0.22)) * sustainedTurnRatio, 0.34)
      : 0;
    audio.drift.playbackRate = shouldDrift ? 0.92 + driftRatio * 0.35 : 0.9;
  }, [audio, debugInput.steer, isReady, isUnlocked, speedKph]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    if (debugBlocked && speedKph > 10 && !crashLockRef.current) {
      crashLockRef.current = true;
      audio.crash.currentTime = 0;
      void audio.crash.play().catch(() => {});
    }

    if (!debugBlocked) {
      crashLockRef.current = false;
    }
  }, [audio, debugBlocked, isUnlocked, speedKph]);

  useEffect(() => {
    return () => {
      audio.acceleration.pause();
      audio.brake.pause();
      audio.city.pause();
      audio.crash.pause();
      audio.drift.pause();
      audio.horn.pause();
      audio.reverseBeep.pause();
    };
  }, [audio]);

  return null;
}
