import { useEffect, useMemo, useRef, useState } from 'react';
import { ASSET_PATHS } from '../../../shared/config/assets';
import { useSimulatorStore } from '../state/simulator.store';

const AUDIO_LEVELS = {
  brake: 0.4,
  city: 0.18,
  crash: 0.42,
  drift: 0.34,
  horn: 0.46,
  reverseBeep: 0.22,
} as const;

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
  const ambienceVolume = useSimulatorStore((state) => state.ambienceVolume);
  const debugBlocked = useSimulatorStore((state) => state.debugBlocked);
  const debugInput = useSimulatorStore((state) => state.debugInput);
  const effectsVolume = useSimulatorStore((state) => state.effectsVolume);
  const engineVolume = useSimulatorStore((state) => state.engineVolume);
  const gear = useSimulatorStore((state) => state.gear);
  const isReady = useSimulatorStore((state) => state.isReady);
  const masterVolume = useSimulatorStore((state) => state.masterVolume);
  const rpm = useSimulatorStore((state) => state.rpm);
  const speedKph = useSimulatorStore((state) => state.speedKph);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const brakeLockRef = useRef(false);
  const crashLockRef = useRef(false);
  const longTurnStartRef = useRef<number | null>(null);

  const audio = useMemo(
    () => ({
      acceleration: createLoopingAudio(ASSET_PATHS.audio.acceleration, 0),
      brake: createOneShotAudio(ASSET_PATHS.audio.brake, AUDIO_LEVELS.brake),
      city: createLoopingAudio(ASSET_PATHS.audio.city, AUDIO_LEVELS.city),
      crash: createOneShotAudio(ASSET_PATHS.audio.crash, AUDIO_LEVELS.crash),
      drift: createLoopingAudio(ASSET_PATHS.audio.drift, 0),
      horn: createOneShotAudio(ASSET_PATHS.audio.horn, AUDIO_LEVELS.horn),
      reverseBeep: createLoopingAudio(ASSET_PATHS.audio.reverseBeep, AUDIO_LEVELS.reverseBeep),
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

    if (gear === 'R') {
      audio.acceleration.volume = 0;

      if (!audio.acceleration.paused) {
        audio.acceleration.pause();
        audio.acceleration.currentTime = 0;
      }

      return;
    }

    const driveRatio = Math.min(speedKph / 140, 1);
    const throttlePressure = Math.abs(debugInput.throttle);
    const accelerationVolume =
      speedKph > 0 || throttlePressure > 0 ? 0.08 + driveRatio * 0.28 + throttlePressure * 0.12 : 0;

    audio.acceleration.volume = Math.min(accelerationVolume, 0.42) * masterVolume * engineVolume;
    audio.acceleration.playbackRate = Math.min(0.7 + rpm / 5200, 1.9);

    if ((speedKph > 0 || throttlePressure > 0) && audio.acceleration.paused) {
      void audio.acceleration.play().catch(() => {});
    }

    if (speedKph === 0 && throttlePressure === 0 && !audio.acceleration.paused) {
      audio.acceleration.pause();
      audio.acceleration.currentTime = 0;
    }
  }, [
    audio,
    debugInput.throttle,
    engineVolume,
    gear,
    isReady,
    isUnlocked,
    masterVolume,
    rpm,
    speedKph,
  ]);

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
    audio.city.volume = AUDIO_LEVELS.city * masterVolume * ambienceVolume;
  }, [ambienceVolume, audio, masterVolume]);

  useEffect(() => {
    if (!isUnlocked || !isReady) {
      return;
    }

    const shouldPlayReverseBeep = gear === 'R';
    audio.reverseBeep.volume =
      shouldPlayReverseBeep ? AUDIO_LEVELS.reverseBeep * masterVolume * effectsVolume : 0;

    if (shouldPlayReverseBeep && audio.reverseBeep.paused) {
      void audio.reverseBeep.play().catch(() => {});
    }

    if (!shouldPlayReverseBeep && !audio.reverseBeep.paused) {
      audio.reverseBeep.pause();
      audio.reverseBeep.currentTime = 0;
    }
  }, [audio, effectsVolume, gear, isReady, isUnlocked, masterVolume]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    const isHardBrake = debugInput.brake && speedKph > 18;

    if (isHardBrake && !brakeLockRef.current) {
      brakeLockRef.current = true;
      audio.brake.volume = AUDIO_LEVELS.brake * masterVolume * effectsVolume;
      audio.brake.currentTime = 0;
      void audio.brake.play().catch(() => {});
    }

    if (!debugInput.brake) {
      brakeLockRef.current = false;
    }
  }, [audio, debugInput.brake, effectsVolume, isUnlocked, masterVolume, speedKph]);

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
      ? Math.min((0.12 + driftRatio * (0.16 + steerAmount * 0.22)) * sustainedTurnRatio, AUDIO_LEVELS.drift) *
        masterVolume *
        effectsVolume
      : 0;
    audio.drift.playbackRate = shouldDrift ? 0.92 + driftRatio * 0.35 : 0.9;
  }, [audio, debugInput.steer, effectsVolume, isReady, isUnlocked, masterVolume, speedKph]);

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    if (debugBlocked && speedKph > 10 && !crashLockRef.current) {
      crashLockRef.current = true;
      audio.crash.volume = AUDIO_LEVELS.crash * masterVolume * effectsVolume;
      audio.crash.currentTime = 0;
      void audio.crash.play().catch(() => {});
    }

    if (!debugBlocked) {
      crashLockRef.current = false;
    }
  }, [audio, debugBlocked, effectsVolume, isUnlocked, masterVolume, speedKph]);

  useEffect(() => {
    audio.horn.volume = AUDIO_LEVELS.horn * masterVolume * effectsVolume;
  }, [audio, effectsVolume, masterVolume]);

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
