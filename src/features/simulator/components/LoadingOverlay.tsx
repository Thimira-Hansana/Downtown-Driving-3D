import { useProgress } from '@react-three/drei';
import { useSimulatorStore } from '../state/simulator.store';

const SEGMENT_COUNT = 10;

export function LoadingOverlay() {
  const { active, item, loaded, progress, total } = useProgress();
  const isReady = useSimulatorStore((state) => state.isReady);
  const clampedProgress = Math.max(0, Math.min(progress, 100));
  const activeSegments = Math.max(
    1,
    Math.min(SEGMENT_COUNT, Math.round((clampedProgress / 100) * SEGMENT_COUNT)),
  );

  if (!active && isReady) {
    return null;
  }

  return (
    <div className="loading-screen">
      <div className="loading-screen__frame" aria-hidden="true">
        <div className="loading-screen__frame-edge loading-screen__frame-edge--top">
          <div className="loading-screen__frame-pill">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="loading-screen__frame-edge loading-screen__frame-edge--bottom">
          <div className="loading-screen__frame-pill">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="loading-screen__grid" aria-hidden="true" />

      <div className="loading-screen__content">
        <div
          className="loading-screen__bar-shell"
          style={{ ['--loading-progress' as string]: `${clampedProgress}%` }}
        >
          <div className="loading-screen__bar-track">
            {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
              <span
                key={index}
                className={`loading-screen__bar-segment${index < activeSegments ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="loading-screen__wordmark">LOADING......</div>

        <div className="loading-screen__readout">
          <span>{active ? 'Streaming city systems' : 'Finalizing simulator'}</span>
          <strong>{Math.round(clampedProgress)}%</strong>
        </div>
      </div>
    </div>
  );
}
