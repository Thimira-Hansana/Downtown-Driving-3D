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

      <div className="hud__lower">
        <div className="hud__dashboard">
          <DialGauge accent="#3fd0ff" label="Speed" max={220} suffix="km/h" value={speedKph} />

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
                <span>{debugBlocked ? 'traction blocked' : 'road grip stable'}</span>
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

          <DialGauge accent="#ff5d5d" label="RPM" max={7000} suffix="rpm" value={rpm} />
        </div>

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
                <span>Hide controls</span>
                <strong>H</strong>
              </li>
            </ul>
          </div>
        ) : (
          <div className="hud__collapsed-hint panel">Press H to show controls</div>
        )}
      </div>
    </div>
  );
}
