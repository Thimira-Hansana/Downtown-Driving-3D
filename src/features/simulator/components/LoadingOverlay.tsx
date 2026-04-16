import { useProgress } from '@react-three/drei';
import { useSimulatorStore } from '../state/simulator.store';

export function LoadingOverlay() {
  const { active, item, loaded, progress, total } = useProgress();
  const isReady = useSimulatorStore((state) => state.isReady);

  if (!active && isReady) {
    return null;
  }

  return (
    <div className="loading-screen">
      <div className="loading-screen__panel">
        <p className="eyebrow">Boot Sequence</p>
        <h2>Streaming the city and vehicle assets</h2>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="loading-screen__meta">
          {active ? `${Math.round(progress)}% loaded` : 'Finalizing simulator'}
        </p>
        <p className="loading-screen__detail">
          {item || `Loaded ${loaded} of ${total || 2} assets`}
        </p>
      </div>
    </div>
  );
}
