import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three';
import { type SIMULATOR_CONFIG } from '../config/simulator.config';
import { type TerrainProbe } from './terrain';

type VehicleConfig = typeof SIMULATOR_CONFIG.vehicle;

export interface DrivingInput {
  boost: boolean;
  brake: boolean;
  steer: number;
  throttle: number;
}

export interface DriveState {
  heading: number;
  position: Vector3;
  speed: number;
  steering: number;
}

type Gear = 'D' | 'N' | 'R';

export function createDriveState(spawn = new Vector3(0, 1, 0)): DriveState {
  return {
    heading: 0,
    position: spawn.clone(),
    speed: 0,
    steering: 0,
  };
}

export function stepDriveState(
  state: DriveState,
  input: DrivingInput,
  delta: number,
  config: VehicleConfig,
) {
  const boostMultiplier = input.boost ? config.boostMultiplier : 1;
  const targetSteer =
    input.steer *
    config.maxSteerAngle *
    MathUtils.lerp(1, 0.4, Math.min(Math.abs(state.speed) / config.maxForwardSpeed, 1));

  state.steering = MathUtils.damp(state.steering, targetSteer, config.steerResponse, delta);

  if (input.throttle > 0) {
    state.speed += input.throttle * config.acceleration * boostMultiplier * delta;
  } else if (input.throttle < 0) {
    state.speed += input.throttle * config.reverseAcceleration * delta;
  }

  if (input.brake) {
    state.speed = moveToward(state.speed, 0, config.brakeStrength * delta);
  }

  const resistance =
    (config.rollingResistance + config.aerodynamicDrag * state.speed * state.speed) * delta;
  state.speed = moveToward(state.speed, 0, resistance);
  state.speed = MathUtils.clamp(state.speed, -config.maxReverseSpeed, config.maxForwardSpeed);

  if (Math.abs(state.speed) < 0.05 && input.throttle === 0 && !input.brake) {
    state.speed = 0;
  }

  state.heading -= state.steering * state.speed * config.turnGrip * delta;

  const forward = new Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
  state.position.addScaledVector(forward, state.speed * delta);
}

export function createChassisQuaternion(
  heading: number,
  terrain: TerrainProbe,
  config: VehicleConfig,
) {
  const forward = new Vector3(Math.sin(heading), 0, Math.cos(heading));
  const right = new Vector3(forward.z, 0, -forward.x);

  const forwardTangent = new Vector3(
    forward.x,
    (terrain.front - terrain.back) / config.wheelBase,
    forward.z,
  ).normalize();

  const rightTangent = new Vector3(
    right.x,
    (terrain.right - terrain.left) / config.trackWidth,
    right.z,
  ).normalize();

  const up = new Vector3().crossVectors(forwardTangent, rightTangent).normalize();

  if (up.y < 0) {
    up.multiplyScalar(-1);
  }

  const correctedRight = new Vector3().crossVectors(up, forwardTangent).normalize();
  const correctedForward = new Vector3().crossVectors(correctedRight, up).normalize();
  const matrix = new Matrix4().makeBasis(correctedRight, up, correctedForward);

  return new Quaternion().setFromRotationMatrix(matrix);
}

export function gearFromSpeed(speed: number): Gear {
  if (speed > 0.4) {
    return 'D';
  }

  if (speed < -0.4) {
    return 'R';
  }

  return 'N';
}

export function rpmFromSpeed(speed: number, config: VehicleConfig) {
  const ratio = Math.min(Math.abs(speed) / config.maxForwardSpeed, 1);
  return Math.round(900 + ratio * 5900);
}

function moveToward(value: number, target: number, maxDelta: number) {
  if (Math.abs(target - value) <= maxDelta) {
    return target;
  }

  return value + Math.sign(target - value) * maxDelta;
}
