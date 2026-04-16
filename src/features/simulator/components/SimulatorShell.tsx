import { Canvas } from '@react-three/fiber';
import { AudioManager } from './AudioManager';
import { HudOverlay } from './HudOverlay';
import { LoadingOverlay } from './LoadingOverlay';
import { SimulatorScene } from './SimulatorScene';

export function SimulatorShell() {
  return (
    <main className="simulator-shell">
      <div className="simulator-shell__backdrop" />
      <Canvas
        camera={{ far: 900, fov: 58, near: 0.1, position: [0, 3, -7] }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
      >
        <SimulatorScene />
      </Canvas>

      <AudioManager />
      <HudOverlay />
      <LoadingOverlay />
    </main>
  );
}
