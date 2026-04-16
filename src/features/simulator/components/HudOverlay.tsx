import { useSimulatorStore } from '../state/simulator.store';

export function HudOverlay() {
  const speedKph = useSimulatorStore((state) => state.speedKph);
  const rpm = useSimulatorStore((state) => state.rpm);
  const gear = useSimulatorStore((state) => state.gear);
  const cameraMode = useSimulatorStore((state) => state.cameraMode);
  const debugBlocked = useSimulatorStore((state) => state.debugBlocked);
  const debugInput = useSimulatorStore((state) => state.debugInput);
  const instructionsVisible = useSimulatorStore((state) => state.instructionsVisible);

  return (
    <div className="hud">
      <div className="hud__header panel">
        <div>
          <p className="eyebrow">Metropolis Drive</p>
          <h1>3D Car Simulator</h1>
        </div>
        <div className="status-pill">{cameraMode} camera</div>
      </div>

      <div className="hud__cluster">
        <div className="panel metric-card">
          <span className="metric-card__label">Speed</span>
          <strong>{speedKph}</strong>
          <span className="metric-card__unit">km/h</span>
        </div>

        <div className="panel metric-card">
          <span className="metric-card__label">Gear</span>
          <strong>{gear}</strong>
          <span className="metric-card__unit">drive state</span>
        </div>

        <div className="panel metric-card">
          <span className="metric-card__label">RPM</span>
          <strong>{rpm}</strong>
          <span className="metric-card__unit">engine</span>
        </div>
      </div>

      {instructionsVisible ? (
        <div className="hud__controls panel">
          <p className="eyebrow">Controls</p>
          <ul>
            <li>
              <span>Throttle / Reverse</span>
              <strong>W/S or Arrow Up/Down</strong>
            </li>
            <li>
              <span>Steer</span>
              <strong>A/D or Arrow Left/Right</strong>
            </li>
            <li>
              <span>Brake</span>
              <strong>Space</strong>
            </li>
            <li>
              <span>Boost</span>
              <strong>Shift</strong>
            </li>
            <li>
              <span>Horn</span>
              <strong>F</strong>
            </li>
            <li>
              <span>Cycle camera</span>
              <strong>C</strong>
            </li>
            <li>
              <span>Reset car</span>
              <strong>R</strong>
            </li>
            <li>
              <span>Hide controls</span>
              <strong>H</strong>
            </li>
          </ul>
          <div className="hud__debug">
            <span>Throttle {debugInput.throttle}</span>
            <span>Steer {debugInput.steer}</span>
            <span>{debugBlocked ? 'Blocked' : 'Free'}</span>
          </div>
        </div>
      ) : (
        <div className="hud__collapsed-hint panel">Press H to show controls</div>
      )}
    </div>
  );
}
