import { useEffect, useRef } from 'react';
import { useSimulatorStore } from '../state/simulator.store';

interface DrivingInputSnapshot {
  boost: boolean;
  brake: boolean;
  steer: number;
  throttle: number;
}

interface UseDrivingInputOptions {
  onCycleCamera: () => void;
  onReset: () => void;
  onToggleInstructions: () => void;
}

const CONTROL_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'KeyA',
  'KeyC',
  'KeyD',
  'KeyH',
  'KeyR',
  'KeyS',
  'KeyW',
  'ShiftLeft',
  'ShiftRight',
  'Space',
]);

const FORWARD_KEYS = new Set(['arrowup', 'keyw', 'w']);
const REVERSE_KEYS = new Set(['arrowdown', 'keys', 's']);
const LEFT_KEYS = new Set(['arrowleft', 'keya', 'a']);
const RIGHT_KEYS = new Set(['arrowright', 'keyd', 'd']);
const BRAKE_KEYS = new Set(['space', ' ']);
const BOOST_KEYS = new Set(['shiftleft', 'shiftright', 'shift']);
const CAMERA_KEYS = new Set(['keyc', 'c']);
const RESET_KEYS = new Set(['keyr', 'r']);
const TOGGLE_KEYS = new Set(['keyh', 'h']);

export function useDrivingInput({
  onCycleCamera,
  onReset,
  onToggleInstructions,
}: UseDrivingInputOptions) {
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const snapshotRef = useRef<DrivingInputSnapshot>({
    boost: false,
    brake: false,
    steer: 0,
    throttle: 0,
  });
  const setDebugInput = useSimulatorStore((state) => state.setDebugInput);
  const pauseMenuVisible = useSimulatorStore((state) => state.pauseMenuVisible);
  const settingsVisible = useSimulatorStore((state) => state.settingsVisible);

  useEffect(() => {
    const normalizeKey = (event: KeyboardEvent) => `${event.code || event.key}`.toLowerCase();
    const inputBlocked = pauseMenuVisible || settingsVisible;

    const updateSnapshot = () => {
      if (inputBlocked) {
        snapshotRef.current = {
          boost: false,
          brake: false,
          steer: 0,
          throttle: 0,
        };
        setDebugInput({
          brake: false,
          steer: 0,
          throttle: 0,
        });
        return;
      }

      const keys = pressedKeysRef.current;
      const throttleForward = [...FORWARD_KEYS].some((key) => keys.has(key));
      const throttleBackward = [...REVERSE_KEYS].some((key) => keys.has(key));
      const steerLeft = [...LEFT_KEYS].some((key) => keys.has(key));
      const steerRight = [...RIGHT_KEYS].some((key) => keys.has(key));

      snapshotRef.current = {
        boost: [...BOOST_KEYS].some((key) => keys.has(key)),
        brake: [...BRAKE_KEYS].some((key) => keys.has(key)),
        steer: (steerRight ? 1 : 0) - (steerLeft ? 1 : 0),
        throttle: (throttleForward ? 1 : 0) - (throttleBackward ? 1 : 0),
      };
      setDebugInput({
        brake: snapshotRef.current.brake,
        steer: snapshotRef.current.steer,
        throttle: snapshotRef.current.throttle,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = normalizeKey(event);

      if (CONTROL_KEYS.has(event.code) || CONTROL_KEYS.has(event.key)) {
        event.preventDefault();
      }

      if (inputBlocked) {
        return;
      }

      const wasPressed = pressedKeysRef.current.has(normalizedKey);
      pressedKeysRef.current.add(normalizedKey);

      if (!wasPressed) {
        if (CAMERA_KEYS.has(normalizedKey)) {
          onCycleCamera();
        }

        if (RESET_KEYS.has(normalizedKey)) {
          onReset();
        }

        if (TOGGLE_KEYS.has(normalizedKey)) {
          onToggleInstructions();
        }
      }

      updateSnapshot();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(normalizeKey(event));
      updateSnapshot();
    };

    const handleBlur = () => {
      pressedKeysRef.current.clear();
      updateSnapshot();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onCycleCamera, onReset, onToggleInstructions, pauseMenuVisible, setDebugInput, settingsVisible]);

  useEffect(() => {
    if (!pauseMenuVisible && !settingsVisible) {
      return;
    }

    pressedKeysRef.current.clear();
    snapshotRef.current = {
      boost: false,
      brake: false,
      steer: 0,
      throttle: 0,
    };
    setDebugInput({
      brake: false,
      steer: 0,
      throttle: 0,
    });
  }, [pauseMenuVisible, setDebugInput, settingsVisible]);

  return snapshotRef;
}
