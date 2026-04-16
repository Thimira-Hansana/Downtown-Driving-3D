import { MathUtils, Object3D, PerspectiveCamera, Vector3 } from 'three';
import {
  SIMULATOR_CONFIG,
  type CameraMode,
} from '../config/simulator.config';

interface CameraRigState {
  lookAt: Vector3;
  position: Vector3;
}

interface UpdateCameraOptions {
  camera: PerspectiveCamera;
  cameraMode: CameraMode;
  delta: number;
  speed: number;
  vehicleRoot: Object3D;
  rigState: CameraRigState;
}

const desiredPosition = new Vector3();
const desiredLookAt = new Vector3();

export function createCameraRigState() {
  return {
    lookAt: new Vector3(0, 1, 0),
    position: new Vector3(0, 4, -6),
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

  vehicleRoot.localToWorld(desiredPosition);
  vehicleRoot.localToWorld(desiredLookAt);

  const lerpAlpha = 1 - Math.exp(-preset.followDamping * delta);
  rigState.position.lerp(desiredPosition, lerpAlpha);
  rigState.lookAt.lerp(desiredLookAt, lerpAlpha);

  camera.position.copy(rigState.position);
  camera.lookAt(rigState.lookAt);
  camera.fov = MathUtils.damp(camera.fov, preset.baseFov + speedRatio * 6, 7, delta);
  camera.updateProjectionMatrix();
}
