import { useMemo } from 'react';
import { Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { VEHICLE_OPTIONS, getVehicleOptionById } from '../../shared/config/assets';
import { SIMULATOR_CONFIG } from '../../features/simulator/config/simulator.config';
import { useSimulatorStore } from '../../features/simulator/state/simulator.store';
import { prepareVehicleModel } from './lib/vehicle-scene';

interface CarModelProps {
  bodyLean: number;
  paintColor?: string;
  vehicleId?: string;
}

const VEHICLE_YAW_OFFSETS: Record<string, number> = {
  '2013-jeep-grand-cherokee-srt8': Math.PI,
};

export function CarModel({ bodyLean, paintColor, vehicleId }: CarModelProps) {
  const selectedVehicleId = useSimulatorStore((state) => state.selectedVehicleId);
  const vehicleColor = useSimulatorStore((state) => state.vehicleColor);
  const resolvedVehicleId = vehicleId ?? selectedVehicleId;
  const resolvedPaintColor = paintColor ?? vehicleColor;
  const activeVehicle = getVehicleOptionById(resolvedVehicleId);
  const { scene } = useGLTF(activeVehicle?.assetPath ?? VEHICLE_OPTIONS[0].assetPath);
  const modelYawOffset = SIMULATOR_CONFIG.vehicle.modelYawOffset + (VEHICLE_YAW_OFFSETS[resolvedVehicleId] ?? 0);

  const model = useMemo(() => prepareVehicleModel(scene as Group, resolvedPaintColor), [resolvedPaintColor, scene]);

  return (
    <group rotation={[0, modelYawOffset, bodyLean]}>
      <primitive object={model} />
    </group>
  );
}

VEHICLE_OPTIONS.forEach((vehicle) => {
  useGLTF.preload(vehicle.assetPath);
});
