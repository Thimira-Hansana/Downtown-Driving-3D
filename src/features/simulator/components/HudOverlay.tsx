import { useSimulatorStore } from '../state/simulator.store';

interface DialGaugeProps {
  accent: string;
  label: string;
  max: number;
  suffix: string;
  value: number;
}

function DialGauge({ accent, label, max, suffix, value }: DialGaugeProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const rotation = -130 + (clamped / max) * 260;

  return (
    <div className="dial-gauge panel">
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

function InputMeter({
  active,
  label,
  value,
}: {
  active?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="input-meter">
      <div className="input-meter__header">
        <span>{label}</span>
        <strong>{Math.round(value * 100)}%</strong>
      </div>
      <div className="input-meter__track">
        <div
          className={`input-meter__fill${active ? ' is-active' : ''}`}
          style={{ width: `${Math.max(0, Math.min(value, 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function HudOverlay() {
  const speedKph = useSimulatorStore((state) => state.speedKph);
  const rpm = useSimulatorStore((state) => state.rpm);
  const gear = useSimulatorStore((state) => state.gear);
  const debugBlocked = useSimulatorStore((state) => state.debugBlocked);
  const debugInput = useSimulatorStore((state) => state.debugInput);
  const cameraMode = useSimulatorStore((state) => state.cameraMode);
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
        <div className="hud__mini-cluster">
          <div className="hud__micro-gauges">
            <DialGauge accent="#3fd0ff" label="Speed" max={220} suffix="km/h" value={speedKph} />
            <DialGauge accent="#ff5d5d" label="RPM" max={7000} suffix="rpm" value={rpm} />
          </div>

          <div className="dashboard-core panel">
            <div className="dashboard-core__topline">
              <p className="eyebrow">Drive Module</p>
              <span>{debugBlocked ? 'Blocked' : 'Free drive'}</span>
            </div>

            <div className="dashboard-core__main">
              <div className="dashboard-core__gear-block">
                <span>Gear</span>
                <div className="dashboard-core__gear">{gear}</div>
              </div>

              <div className="dashboard-core__state">
                <span>{debugBlocked ? 'road blocked' : 'road grip stable'}</span>
                <strong>{cameraMode}</strong>
              </div>
            </div>

            <div className="dashboard-core__meters">
              <InputMeter
                active={debugInput.throttle !== 0}
                label="Throttle"
                value={Math.abs(debugInput.throttle)}
              />
              <InputMeter
                active={debugInput.brake}
                label="Brake"
                value={debugInput.brake ? 1 : 0}
              />
              <InputMeter
                active={debugInput.steer !== 0}
                label="Steer"
                value={Math.abs(debugInput.steer)}
              />
            </div>
          </div>
        </div>

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
  );
}
