import { useSimulatorStore } from '../state/simulator.store';
import { MiniMap } from './MiniMap';

interface DialGaugeProps {
  accent: string;
  label: string;
  max: number;
  suffix: string;
  value: number;
  variant?: 'compact' | 'cluster';
}

function DialGauge({ accent, label, max, suffix, value, variant = 'compact' }: DialGaugeProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const rotation = -130 + (clamped / max) * 260;

  return (
    <div className={`dial-gauge${variant === 'cluster' ? ' dial-gauge--cluster' : ' panel'}`}>
      <div className="dial-gauge__face" style={{ ['--dial-accent' as string]: accent }}>
        <div className="dial-gauge__arc" />
        <div className="dial-gauge__ticks" />
        <div className="dial-gauge__needle-wrap" style={{ transform: `rotate(${rotation}deg)` }}>
          <div className="dial-gauge__needle" />
        </div>
        <div className="dial-gauge__hub" />
        <div className="dial-gauge__readout">
          <span>{label}</span>
          <strong>{Math.round(clamped)}</strong>
          <em>{suffix}</em>
        </div>
      </div>
    </div>
  );
}

export function HudOverlay() {
  const speedKph = useSimulatorStore((state) => state.speedKph);
  const rpm = useSimulatorStore((state) => state.rpm);
  const gear = useSimulatorStore((state) => state.gear);
  const debugBlocked = useSimulatorStore((state) => state.debugBlocked);
  const instructionsVisible = useSimulatorStore((state) => state.instructionsVisible);
  const toggleInstructions = useSimulatorStore((state) => state.toggleInstructions);

  return (
    <div className="hud">
      <div className="hud__header">
        <div>
          <p className="eyebrow">Metropolis Drive</p>
          <h1>3D Car Simulator</h1>
        </div>
      </div>

      <div className="hud__lower">
        <div className="hud__map-stack">
          <MiniMap />

          <div className="hud__mini-cluster">
            <div className="dashboard-cluster panel">
              <DialGauge
                accent="#3f89ff"
                label="Speed"
                max={220}
                suffix="km/h"
                value={speedKph}
                variant="cluster"
              />
              <div className="dashboard-cluster__center">
                <span className="dashboard-cluster__gear-label">Gear</span>
                <strong className="dashboard-cluster__gear-value">{gear}</strong>
              </div>
              <DialGauge
                accent="#5f8cff"
                label="RPM"
                max={8}
                suffix="x1000"
                value={rpm / 1000}
                variant="cluster"
              />
            </div>
          </div>
        </div>

        <div className="hud__controls-stack">
          <button
            type="button"
            className={`hud__controls-toggle panel${instructionsVisible ? ' is-active' : ''}`}
            onClick={toggleInstructions}
            aria-expanded={instructionsVisible}
            aria-label={instructionsVisible ? 'Hide controls' : 'Show controls'}
          >
            <span className="hud__controls-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="hud__controls-toggle-label">Controls</span>
          </button>

          {instructionsVisible ? (
            <div className="hud__controls panel">
              <div className="hud__controls-heading">
                <p className="eyebrow">Controls</p>
                <span>{debugBlocked ? 'Obstacle detected' : 'Free drive'}</span>
              </div>
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
                  <span>Toggle controls</span>
                  <strong>H or Button</strong>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
