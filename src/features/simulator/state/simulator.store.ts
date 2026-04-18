import { create } from 'zustand';
import { CAMERA_MODES, type CameraMode } from '../config/simulator.config';

type Gear = 'D' | 'N' | 'R';

interface MapBounds {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
}

interface PlayerPose {
  heading: number;
  x: number;
  z: number;
}

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
  mapBounds: MapBounds | null;
  playerPose: PlayerPose;
  rpm: number;
  setDebugInput: (payload: SimulatorState['debugInput']) => void;
  setMapBounds: (payload: MapBounds) => void;
  setMovementBlocked: (value: boolean) => void;
  setPlayerPose: (payload: PlayerPose) => void;
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
  mapBounds: null,
  playerPose: {
    heading: 0,
    x: 0,
    z: 0,
  },
  rpm: 900,
  setDebugInput: (payload) => set({ debugInput: payload }),
  setMapBounds: (payload) => set({ mapBounds: payload }),
  setMovementBlocked: (value) => set({ debugBlocked: value }),
  setPlayerPose: (payload) => set({ playerPose: payload }),
  setReady: (value) => set({ isReady: value }),
  setTelemetry: (payload) => set(payload),
  speedKph: 0,
  toggleInstructions: () =>
    set((state) => ({
      instructionsVisible: !state.instructionsVisible,
    })),
}));
