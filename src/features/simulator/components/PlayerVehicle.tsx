import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils, PerspectiveCamera, Quaternion, Raycaster, Vector3 } from 'three';
import { CarModel } from '../../../entities/car/CarModel';
import { SIMULATOR_CONFIG } from '../config/simulator.config';
import { useDrivingInput } from '../hooks/use-driving-input';
import { createCameraRigState, updateCameraRig } from '../lib/camera-rig';
import {
  findGroundSurface,
  findSpawnTransform,
  isPathBlocked,
  isRoadAtPosition,
  sampleTerrainUnderVehicle,
} from '../lib/terrain';
import {
  createChassisQuaternion,
  createDriveState,
  gearFromSpeed,
  rpmFromSpeed,
  stepDriveState,
} from '../lib/vehicle-physics';
import { useSimulatorStore } from '../state/simulator.store';

interface PlayerVehicleProps {
  terrainRef: React.RefObject<Group>;
}

export function PlayerVehicle({ terrainRef }: PlayerVehicleProps) {
  const vehicleRef = useRef<Group>(null);
  const modelRef = useRef<Group>(null);
  const telemetryTimerRef = useRef(0);
  const raycaster = useMemo(() => new Raycaster(), []);
  const motionRef = useRef(createDriveState(new Vector3(0, SIMULATOR_CONFIG.vehicle.rideHeight, 0)));
  const spawnReadyRef = useRef(false);
  const cameraRigStateRef = useRef(createCameraRigState());
  const targetQuaternionRef = useRef(new Quaternion());
  const resetVehicleRef = useRef(false);
  const previousPositionRef = useRef(new Vector3());

  const cameraMode = useSimulatorStore((state) => state.cameraMode);
  const cycleCamera = useSimulatorStore((state) => state.cycleCamera);
  const toggleInstructions = useSimulatorStore((state) => state.toggleInstructions);
  const setMovementBlocked = useSimulatorStore((state) => state.setMovementBlocked);
  const setTelemetry = useSimulatorStore((state) => state.setTelemetry);
  const setReady = useSimulatorStore((state) => state.setReady);
  const camera = useThree((state) => state.camera);

  const inputRef = useDrivingInput({
    onCycleCamera: cycleCamera,
    onReset: () => {
      resetVehicleRef.current = true;
    },
    onToggleInstructions: toggleInstructions,
  });

  useEffect(() => {
    return () => {
      setReady(false);
    };
  }, [setReady]);

  useFrame((state, rawDelta) => {
    const vehicle = vehicleRef.current;
    const terrain = terrainRef.current;
    const visual = modelRef.current;

    if (!vehicle) {
      return;
    }

    const delta = Math.min(rawDelta, 1 / 30);
    const motion = motionRef.current;
    const previousPosition = previousPositionRef.current;
    const previousSpeed = motion.speed;

    if ((!spawnReadyRef.current || resetVehicleRef.current) && terrain) {
      const spawn = findSpawnTransform(terrain, raycaster, SIMULATOR_CONFIG.vehicle);
      motion.position.copy(spawn.position);
      motion.position.y += SIMULATOR_CONFIG.vehicle.rideHeight;
      motion.heading = spawn.heading;
      motion.speed = 0;
      motion.steering = 0;
      vehicle.position.copy(motion.position);
      targetQuaternionRef.current.copy(
        createChassisQuaternion(
          motion.heading,
          {
            back: motion.position.y - SIMULATOR_CONFIG.vehicle.rideHeight,
            center: motion.position.y - SIMULATOR_CONFIG.vehicle.rideHeight,
            front: motion.position.y - SIMULATOR_CONFIG.vehicle.rideHeight,
            left: motion.position.y - SIMULATOR_CONFIG.vehicle.rideHeight,
            right: motion.position.y - SIMULATOR_CONFIG.vehicle.rideHeight,
          },
          SIMULATOR_CONFIG.vehicle,
        ),
      );
      vehicle.quaternion.copy(targetQuaternionRef.current);
      spawnReadyRef.current = true;
      resetVehicleRef.current = false;
      setReady(true);
    }

    previousPosition.copy(motion.position);
    const previousHeading = motion.heading;
    const previousSteering = motion.steering;

    stepDriveState(motion, inputRef.current, delta, SIMULATOR_CONFIG.vehicle);

    const previousGroundY = previousPosition.y - SIMULATOR_CONFIG.vehicle.rideHeight;
    const candidateSurface = findGroundSurface(
      terrain,
      raycaster,
      motion.position.x,
      motion.position.z,
      previousGroundY,
    );
    const candidateIsDrivable =
      Boolean(candidateSurface) &&
      isRoadAtPosition(terrain, raycaster, motion.position.x, motion.position.z, previousGroundY);
    const hitBarrier = isPathBlocked(
      terrain,
      raycaster,
      previousPosition,
      motion.position,
      SIMULATOR_CONFIG.vehicle.collisionRadius,
      SIMULATOR_CONFIG.vehicle.collisionProbeHeight,
    );

    setMovementBlocked(!candidateIsDrivable || hitBarrier);

    if (!candidateIsDrivable || hitBarrier) {
      motion.position.copy(previousPosition);
      motion.heading = previousHeading;
      motion.speed = 0;
      motion.steering = MathUtils.damp(previousSteering, 0, 10, delta);
    }

    const terrainProbe = sampleTerrainUnderVehicle(
      terrain,
      raycaster,
      motion.position,
      motion.heading,
      SIMULATOR_CONFIG.vehicle,
    );

    motion.position.y = MathUtils.damp(
      motion.position.y,
      terrainProbe.center + SIMULATOR_CONFIG.vehicle.rideHeight,
      11,
      delta,
    );

    vehicle.position.copy(motion.position);
    targetQuaternionRef.current.copy(
      createChassisQuaternion(motion.heading, terrainProbe, SIMULATOR_CONFIG.vehicle),
    );
    vehicle.quaternion.slerp(
      targetQuaternionRef.current,
      1 - Math.exp(-SIMULATOR_CONFIG.vehicle.orientationLerp * delta),
    );

    if (visual) {
      visual.rotation.z = MathUtils.damp(
        visual.rotation.z,
        -motion.steering * SIMULATOR_CONFIG.vehicle.bodyLean,
        8,
        delta,
      );
    }

    updateCameraRig({
      acceleration: (motion.speed - previousSpeed) / Math.max(delta, 1e-3),
      camera: camera as PerspectiveCamera,
      cameraMode: motion.speed < -0.4 ? 'reverse' : cameraMode,
      delta,
      rigState: cameraRigStateRef.current,
      speed: motion.speed,
      vehicleRoot: vehicle,
    });

    telemetryTimerRef.current += delta;

    if (telemetryTimerRef.current >= 0.08) {
      telemetryTimerRef.current = 0;
      setTelemetry({
        gear: gearFromSpeed(motion.speed),
        rpm: rpmFromSpeed(motion.speed, SIMULATOR_CONFIG.vehicle),
        speedKph: Math.round(Math.abs(motion.speed) * 3.6),
      });
    }
  });

  return (
    <group ref={vehicleRef}>
      <group ref={modelRef}>
        <CarModel bodyLean={0} />
      </group>
    </group>
  );
}
