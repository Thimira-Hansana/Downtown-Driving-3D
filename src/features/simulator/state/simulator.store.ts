import { create } from 'zustand';
import { CAMERA_MODES, type CameraMode } from '../config/simulator.config';

type Gear = 'D' | 'N' | 'R';

interface SimulatorState {
  cameraMode: CameraMode;
  cycleCamera: () => void;
  debugBlocked: boolean;
  debugInput: {
    brake: boolean;
    steer: number;
    throttle: number;
  };
  instructionsVisible: boolean;
  isReady: boolean;
  rpm: number;
  setDebugInput: (payload: SimulatorState['debugInput']) => void;
  setMovementBlocked: (value: boolean) => void;
  setReady: (value: boolean) => void;
  setTelemetry: (payload: Partial<Pick<SimulatorState, 'rpm' | 'speedKph' | 'gear'>>) => void;
  speedKph: number;
  gear: Gear;
  toggleInstructions: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  cameraMode: 'chase',
  cycleCamera: () =>
    set((state) => {
      const currentIndex = CAMERA_MODES.indexOf(state.cameraMode);
      return {
        cameraMode: CAMERA_MODES[(currentIndex + 1) % CAMERA_MODES.length],
      };
    }),
  debugBlocked: false,
  debugInput: {
    brake: false,
    steer: 0,
    throttle: 0,
  },
  gear: 'N',
  instructionsVisible: false,
  isReady: false,
  rpm: 900,
  setDebugInput: (payload) => set({ debugInput: payload }),
  setMovementBlocked: (value) => set({ debugBlocked: value }),
  setReady: (value) => set({ isReady: value }),
  setTelemetry: (payload) => set(payload),
  speedKph: 0,
  toggleInstructions: () =>
    set((state) => ({
      instructionsVisible: !state.instructionsVisible,
    })),
}));
