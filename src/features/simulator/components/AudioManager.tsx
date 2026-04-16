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
  const isReady = useSimulatorStore((state) => state.isReady);
  const rpm = useSimulatorStore((state) => state.rpm);
  const speedKph = useSimulatorStore((state) => state.speedKph);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const crashLockRef = useRef(false);

  const audio = useMemo(
    () => ({
      acceleration: createLoopingAudio(ASSET_PATHS.audio.acceleration, 0),
      city: createLoopingAudio(ASSET_PATHS.audio.city, 0.18),
      crash: createOneShotAudio(ASSET_PATHS.audio.crash, 0.42),
      horn: createOneShotAudio(ASSET_PATHS.audio.horn, 0.46),
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
        audio.acceleration.volume = 0;
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
  }, [audio, isUnlocked]);

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
      audio.city.pause();
      audio.crash.pause();
      audio.horn.pause();
    };
  }, [audio]);

  return null;
}
