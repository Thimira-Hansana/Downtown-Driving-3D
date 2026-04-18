import { MathUtils, Object3D, PerspectiveCamera, Vector3 } from 'three';
import {
  SIMULATOR_CONFIG,
  type ActiveCameraMode,
} from '../config/simulator.config';

interface CameraRigState {
  localAngle: number;
  localHeight: number;
  localRadius: number;
  lookAt: Vector3;
  localLookAt: Vector3;
  position: Vector3;
}

interface UpdateCameraOptions {
  camera: PerspectiveCamera;
  cameraMode: ActiveCameraMode;
  delta: number;
  speed: number;
  vehicleRoot: Object3D;
  rigState: CameraRigState;
}

const desiredPosition = new Vector3();
const desiredLookAt = new Vector3();
const desiredWorldPosition = new Vector3();
const desiredWorldLookAt = new Vector3();

export function createCameraRigState() {
  const initialPosition = SIMULATOR_CONFIG.camera.chase.localPositionOffset;
  const initialLookAt = SIMULATOR_CONFIG.camera.chase.localLookOffset;

  return {
    localAngle: Math.atan2(initialPosition[0], initialPosition[2]),
    localHeight: initialPosition[1],
    localRadius: Math.hypot(initialPosition[0], initialPosition[2]),
    localLookAt: new Vector3(initialLookAt[0], initialLookAt[1], initialLookAt[2]),
    lookAt: new Vector3(0, 1, 0),
    position: new Vector3(initialPosition[0], initialPosition[1], initialPosition[2]),
  };
}

export function updateCameraRig({
  camera,
  cameraMode,
  delta,
  speed,
  vehicleRoot,
  rigState,
}: UpdateCameraOptions) {
  const preset = SIMULATOR_CONFIG.camera[cameraMode];
  const speedRatio = Math.min(Math.abs(speed) / SIMULATOR_CONFIG.vehicle.maxForwardSpeed, 1);

  desiredPosition.set(
    preset.localPositionOffset[0],
    preset.localPositionOffset[1],
    preset.localPositionOffset[2],
  );
  desiredLookAt.set(
    preset.localLookOffset[0],
    preset.localLookOffset[1],
    preset.localLookOffset[2],
  );

  const targetAngle = Math.atan2(desiredPosition.x, desiredPosition.z);
  const targetRadius = Math.hypot(desiredPosition.x, desiredPosition.z);

  rigState.localAngle = dampAngle(
    rigState.localAngle,
    targetAngle,
    preset.followDamping,
    delta,
  );
  rigState.localRadius = MathUtils.damp(
    rigState.localRadius,
    targetRadius,
    preset.followDamping,
    delta,
  );
  rigState.localHeight = MathUtils.damp(
    rigState.localHeight,
    desiredPosition.y,
    preset.followDamping,
    delta,
  );
  rigState.localLookAt.lerp(desiredLookAt, 1 - Math.exp(-preset.followDamping * delta));

  desiredPosition.set(
    Math.sin(rigState.localAngle) * rigState.localRadius,
    rigState.localHeight,
    Math.cos(rigState.localAngle) * rigState.localRadius,
  );

  desiredWorldPosition.copy(desiredPosition);
  desiredWorldLookAt.copy(rigState.localLookAt);
  vehicleRoot.localToWorld(desiredWorldPosition);
  vehicleRoot.localToWorld(desiredWorldLookAt);

  rigState.position.copy(desiredWorldPosition);
  rigState.lookAt.copy(desiredWorldLookAt);

  camera.position.copy(rigState.position);
  camera.lookAt(rigState.lookAt);
  camera.fov = MathUtils.damp(camera.fov, preset.baseFov + speedRatio * 6, 7, delta);
  camera.updateProjectionMatrix();
}

function dampAngle(current: number, target: number, smoothing: number, delta: number) {
  const deltaAngle = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return MathUtils.damp(current, current + deltaAngle, smoothing, delta);
}
